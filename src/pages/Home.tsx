import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search, Pin, Calendar, Clock, DollarSign,
  Newspaper, MessageSquare, BookOpen, Zap, Users,
} from 'lucide-react'
import { getTracks, getNotices, getContents, getPublishedCommunityPosts, getFeaturedContent } from '../lib/db'
import { useLang } from '../context/LangContext'
import { normalizeContent, newsExcerpt, thumbnailUrl } from '../lib/newsContent'
import type { ProgramTrack, Notice, Content, CommunitySubmission } from '../types'
import ApplyModal from '../components/ApplyModal'
const CommunitySubmitModal = lazy(() => import('../components/CommunitySubmitModal'))
import { LeftSidebar, PageShell, SharedRightSidebar } from '../components/PageLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang       = 'ko' | 'en' | 'fr'
type FeedFilter = 'all' | 'program' | 'notice' | 'content' | 'community'

type FeedItem =
  | { kind: 'notice';    data: Notice;              sortKey: string; pinned: boolean }
  | { kind: 'program';   data: ProgramTrack;        sortKey: string; pinned: boolean }
  | { kind: 'content';   data: Content;             sortKey: string; pinned: boolean }
  | { kind: 'community'; data: CommunitySubmission; sortKey: string; pinned: boolean }

// ─── Language fallback ────────────────────────────────────────────────────────

function pickText(lang: Lang, ko: string, en: string, fr: string): string {
  const order = lang === 'ko' ? [ko, en, fr] : lang === 'fr' ? [fr, ko, en] : [en, ko, fr]
  return order.find(s => s?.trim()) ?? ''
}

const nTitle = (n: Notice, l: Lang)       => pickText(l, n.title_ko,       n.title_en,       n.title_fr)
const nBody  = (n: Notice, l: Lang)       => pickText(l, n.body_ko,        n.body_en,        n.body_fr)
const tName  = (s: ProgramTrack, l: Lang) => pickText(l, s.name_ko,        s.name_en,        s.name_fr)
const tDesc  = (s: ProgramTrack, l: Lang) => pickText(l, s.description_ko, s.description_en, s.description_fr)
const cTitle = (c: Content, l: Lang)      => pickText(l, c.title_ko,       c.title_en,       c.title_fr)
const cBody  = (c: Content, l: Lang)      => pickText(l, c.body_ko,        c.body_en,        c.body_fr)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try { return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(iso)) }
  catch { return iso }
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const mins  = Math.floor(diff / 60_000)
    const hours = Math.floor(diff / 3_600_000)
    const days  = Math.floor(diff / 86_400_000)
    const weeks = Math.floor(days / 7)
    if (mins  <  1)  return 'just now'
    if (mins  < 60)  return `${mins}m ago`
    if (hours < 24)  return `${hours}h ago`
    if (days  === 1) return 'Yesterday'
    if (days  <  7)  return `${days}d ago`
    if (days  < 30)  return `${weeks}w ago`
    return fmtDate(iso)
  } catch { return '' }
}

function tPrice(s: ProgramTrack): string {
  if (s.is_free) return 'Free'
  if (s.total_price && s.total_price > 0) return `$${s.total_price} ${s.currency}`
  if (s.class_count > 0 && s.price_per_class > 0) return `$${s.price_per_class * s.class_count} ${s.currency}`
  if (s.price_per_class > 0) return `$${s.price_per_class} ${s.currency}`
  return 'Free'
}

function tDuration(s: ProgramTrack): string | null {
  const dur = (s as ProgramTrack & { duration?: string }).duration
  if (dur) return dur
  if (s.duration_weeks) return `${s.duration_weeks} weeks`
  if (s.class_count > 1) return `${s.class_count} classes`
  return null
}

function hasTitle(item: FeedItem): boolean {
  if (item.kind === 'community') return !!item.data.title?.trim()
  if (item.kind === 'notice')    return !!(item.data.title_ko?.trim() || item.data.title_en?.trim() || item.data.title_fr?.trim())
  if (item.kind === 'program')   return !!(item.data.name_ko?.trim()  || item.data.name_en?.trim()  || item.data.name_fr?.trim())
  return !!(item.data.title_ko?.trim() || item.data.title_en?.trim() || item.data.title_fr?.trim())
}

function itemMatches(item: FeedItem, q: string): boolean {
  const lq = q.toLowerCase()
  if (item.kind === 'community') {
    return [item.data.title, item.data.description, item.data.type].some(s => s?.toLowerCase().includes(lq))
  }
  const fields =
    item.kind === 'notice'  ? [item.data.title_ko, item.data.title_en, item.data.title_fr, item.data.body_ko, item.data.body_en, item.data.body_fr] :
    item.kind === 'program' ? [item.data.name_ko, item.data.name_en, item.data.name_fr, item.data.description_ko, item.data.description_en, item.data.description_fr] :
                              [item.data.title_ko, item.data.title_en, item.data.title_fr, item.data.body_ko, item.data.body_en, item.data.body_fr]
  return fields.some(s => s?.toLowerCase().includes(lq))
}

const NOTICE_COLOR: Record<string, string> = { event: '#111111', hiring: '#4B5563', notice: '#9CA3AF' }
const CAT_LABEL:    Record<string, string> = { archive: 'Archive', montreal: 'Montréal', language: 'Language', culture: 'Culture' }
const COMMUNITY_SUBTYPE_LABEL: Record<string, string> = {
  housing:            'Housing',
  jobs:               'Jobs',
  looking_for_people: 'Roommates',
  language_exchange:  'Language Exchange',
  general:            'General',
  other:              'General',
  events:             'Events',
  help_needed:        'Help',
}

// ─── Shared card atoms ────────────────────────────────────────────────────────

function HakkyoAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <line x1="4"  y1="3" x2="4"  y2="13" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="12" y1="3" x2="12" y2="13" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="4"  y1="8" x2="12" y2="8"  stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

function PostHeader({ time }: { time?: string | null }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <HakkyoAvatar />
      <div>
        <p className="text-[12px] font-semibold text-gray-900 leading-none mb-0.5">HAKKYO</p>
        {time && (
          <p className="text-[10px] text-gray-400 leading-none">
            {relativeTime(time)} · {fmtDate(time)}
          </p>
        )}
      </div>
    </div>
  )
}

function TypeTag({ children, color = '#9CA3AF' }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color }}>
      {children}
    </span>
  )
}

function PinIndicator() {
  return (
    <span className="inline-flex items-center gap-1" style={{ color: 'var(--y-h)' }}>
      <Pin size={10} />
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        Pinned
      </span>
    </span>
  )
}

// ─── Card action icons ────────────────────────────────────────────────────────

function IcoHeart({ filled }: { filled: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  )
}

function IcoChat() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  )
}

function IcoShare() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  )
}

function IcoBookmark({ filled }: { filled: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
    </svg>
  )
}

function CardActions({ compact = false }: { compact?: boolean }) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)

  const stop = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation() }

  return (
    <div className={`flex items-center gap-${compact ? '3' : '4'} pt-3 border-t border-gray-50 mt-3`}>
      <button
        onClick={e => { stop(e); setLiked(l => !l) }}
        className={`flex items-center gap-1.5 text-[11px] transition-colors ${liked ? 'text-red-400' : 'text-gray-300 hover:text-gray-500'}`}
      >
        <IcoHeart filled={liked} />
        <span>Like</span>
      </button>
      <button className="flex items-center gap-1.5 text-[11px] text-gray-300 hover:text-gray-500 transition-colors">
        <IcoChat />
        <span>Reply</span>
      </button>
      <button
        onClick={stop}
        className="flex items-center gap-1.5 text-[11px] text-gray-300 hover:text-gray-500 transition-colors"
      >
        <IcoShare />
        <span>Share</span>
      </button>
      <button
        onClick={e => { stop(e); setSaved(s => !s) }}
        className={`flex items-center gap-1.5 text-[11px] ml-auto transition-colors ${saved ? '' : 'text-gray-300 hover:text-gray-500'}`}
        style={saved ? { color: 'var(--y-h)' } : {}}
      >
        <IcoBookmark filled={saved} />
        <span>Save</span>
      </button>
    </div>
  )
}

// ─── Floating create button ───────────────────────────────────────────────────

function FloatingCreateButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      title="Create post"
      className="fixed bottom-24 right-5 lg:bottom-8 lg:right-8 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-xl font-black transition-all active:scale-95 hover:shadow-xl"
      style={{ background: 'var(--y)', color: '#111' }}
    >
      ✏
    </button>
  )
}

// Pill chip for program metadata
function MetaChip({ icon: Icon, children }: {
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2.5 py-1 text-[10px] text-gray-600 whitespace-nowrap">
      <Icon size={10} className="text-gray-400 shrink-0" />
      {children}
    </span>
  )
}

// Inline post image — inside the card flow
function PostImage({ src, href }: { src: string; href: string }) {
  return (
    <Link to={href} className="block mt-3 mb-0.5">
      <div className="overflow-hidden rounded-xl bg-gray-50" style={{ maxHeight: 520 }}>
        <img
          src={src}
          alt=""
          loading="lazy"
          className="w-full object-cover transition-transform duration-500 hover:scale-[1.015]"
          style={{ maxHeight: 520 }}
        />
      </div>
    </Link>
  )
}

// ─── Community card ───────────────────────────────────────────────────────────

function CommunityCard({ post, t }: {
  post: CommunitySubmission
  t: (ko: string, en: string, fr: string) => string
}) {
  const catLabel = COMMUNITY_SUBTYPE_LABEL[post.type] ?? 'General'
  const author   = post.nickname?.trim() || t('익명', 'Anonymous', 'Anonyme')

  return (
    <article className="rounded-2xl border border-gray-100 bg-white mb-3 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(0,0,0,0.07)] hover:border-gray-200">
      <Link to={`/community/${post.id}`} className="block cursor-pointer">
        {/* Image — first-class, full bleed when present */}
        {post.image_url && (
          <div className="overflow-hidden bg-gray-50" style={{ maxHeight: 440 }}>
            <img
              src={post.image_url}
              alt=""
              loading="lazy"
              className="w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
              style={{ maxHeight: 440 }}
            />
          </div>
        )}

        <div className="px-5 py-4">
          {/* Author + time */}
          <div className="flex items-center gap-2 mb-2.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--y)' }}
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <line x1="4"  y1="3" x2="4"  y2="13" stroke="#111" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="3" x2="12" y2="13" stroke="#111" strokeWidth="2" strokeLinecap="round"/>
                <line x1="4"  y1="8" x2="12" y2="8"  stroke="#111" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-[12px] font-semibold text-gray-900">{author}</span>
            {post.created_at && (
              <span className="text-[11px] text-gray-300">{relativeTime(post.created_at)}</span>
            )}
            {/* Category pill */}
            <span
              className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--y-l)', color: '#856C00' }}
            >
              {catLabel}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-[14px] font-semibold text-gray-900 leading-snug mb-1.5">{post.title}</h3>

          {/* Body preview */}
          <p
            className="text-[13px] text-gray-500 leading-relaxed"
            style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {post.description}
          </p>

          {/* Read more */}
          <p className="text-[11px] font-medium mt-2.5" style={{ color: 'var(--y-h)' }}>
            {t('더 보기', 'Read more', 'Lire plus')} →
          </p>
        </div>
      </Link>

      <div className="px-5 pb-4">
        <CardActions />
      </div>
    </article>
  )
}

// ─── Pinned grid ─────────────────────────────────────────────────────────────

function PinnedGrid({ items, lang }: {
  items: FeedItem[]
  lang: Lang
}) {
  const pinned = items.filter(i => i.pinned).slice(0, 3)
  if (!pinned.length) return null

  function getTitle(item: FeedItem): string {
    if (item.kind === 'notice')  return nTitle(item.data, lang)
    if (item.kind === 'program') return tName(item.data, lang)
    if (item.kind === 'content') return cTitle(item.data, lang)
    return item.data.title
  }

  function getThumb(item: FeedItem): string | null {
    if (item.kind === 'content') return thumbnailUrl(item.data)
    if (item.kind === 'notice')  return item.data.image_url ?? null
    return null
  }

  function getExcerpt(item: FeedItem): string {
    const raw =
      item.kind === 'notice'  ? nBody(item.data, lang) :
      item.kind === 'program' ? tDesc(item.data, lang) :
      item.kind === 'content' ? cBody(item.data, lang) : ''
    return newsExcerpt(raw, 120)
  }

  function getCategory(item: FeedItem): string {
    if (item.kind === 'program') return 'Program'
    if (item.kind === 'notice')  return item.data.type === 'event' ? 'Event' : item.data.type === 'hiring' ? 'Hiring' : 'Notice'
    if (item.kind === 'content') return CAT_LABEL[item.data.category ?? ''] ?? 'Montréal'
    return 'Community'
  }

  function PinnedCard({ item }: { item: FeedItem }) {
    const title    = getTitle(item)
    const thumb    = getThumb(item)
    const excerpt  = getExcerpt(item)
    const category = getCategory(item)

    // ── Shared outer wrapper — identical dimensions for every card ──
    const card = (
      <div className="group cursor-pointer transition-all duration-200 hover:-translate-y-0.5">
        {/* 3:4 slot — same size always */}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl mb-2 transition-shadow duration-200 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">

          {thumb ? (
            /* Image card */
            <img
              src={thumb}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            /* Text-cover card — editorial, not placeholder */
            <div className="w-full h-full bg-white border border-gray-200 rounded-xl flex flex-col justify-between p-3.5 transition-colors group-hover:border-gray-300">
              <p className="text-[8px] font-bold tracking-[0.2em] uppercase text-gray-400">
                {category}
              </p>
              <div>
                <p className="text-[13px] font-semibold text-gray-900 leading-snug mb-2">
                  {title}
                </p>
                {excerpt && (
                  <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-3">
                    {excerpt}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Pin indicator — top-right, monochrome, consistent across both types */}
          <div className={[
            'absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center',
            thumb ? 'bg-black/30 backdrop-blur-sm' : 'bg-gray-100',
          ].join(' ')}>
            <Pin size={9} className={thumb ? 'text-white' : 'text-gray-500'} strokeWidth={2.5} />
          </div>
        </div>

        {/* Category + title below — shown for image cards only */}
        {thumb && (
          <>
            <p className="text-[9px] font-semibold tracking-[0.14em] uppercase text-gray-400 mb-1">
              {category}
            </p>
            <p className="text-[11px] font-medium text-gray-800 group-hover:text-gray-900 transition-colors leading-snug line-clamp-2">
              {title}
            </p>
          </>
        )}
        {/* Spacer so text-cover cards have the same bottom height as image cards */}
        {!thumb && <div className="h-[34px]" />}
      </div>
    )

    if (item.kind === 'program') {
      return <Link to={`/programs/${item.data.id}`} className="block">{card}</Link>
    }
    if (item.kind === 'content') {
      return <Link to={`/news/${item.data.id}`} className="block">{card}</Link>
    }
    if (item.kind === 'notice') {
      return <Link to={`/board/${item.data.id}`} className="block">{card}</Link>
    }
    return <Link to={`/community/${item.data.id}`} className="block">{card}</Link>
  }

  return (
    <>
      <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-300 mb-3">
        PINNED POSTS
      </p>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {pinned.map(item => (
          <PinnedCard key={`${item.kind}-${item.data.id}`} item={item} />
        ))}
      </div>
    </>
  )
}

// ─── Community Moments ────────────────────────────────────────────────────────

const MOMENT_BADGE: Record<string, string> = {
  archive:  'Archive',
  montreal: 'Community',
  language: 'Language Exchange',
  culture:  'Workshop',
}

function CommunityMoments({ items, lang }: { items: Content[]; lang: Lang }) {
  if (items.length === 0) return null

  return (
    <section className="mb-8">
      <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-300 mb-1">
        Community Moments
      </p>
      <p className="text-[11px] text-gray-400 mb-4">
        Recent moments from classes, exchanges, workshops, and community events.
      </p>

      {/* 3-col grid on md+; horizontal scroll on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:overflow-visible">
        {items.map(item => {
          const title = pickText(lang, item.title_ko, item.title_en, item.title_fr)
          const thumb = thumbnailUrl(item)
          const badge = MOMENT_BADGE[item.category ?? ''] ?? 'Community'
          const date  = item.published_at ?? item.created_at

          return (
            <Link
              key={item.id}
              to={`/news/${item.id}`}
              className="shrink-0 w-52 md:w-auto rounded-xl border border-gray-100 bg-white overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)] hover:border-gray-200"
            >
              {/* Cover image */}
              <div className="aspect-[4/3] bg-gray-50 overflow-hidden">
                {thumb
                  ? <img src={thumb} alt="" loading="lazy" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl opacity-20">🌎</span>
                    </div>
                }
              </div>

              {/* Card body */}
              <div className="p-3">
                <span className="inline-block text-[9px] font-bold tracking-[0.14em] uppercase text-gray-300 mb-1.5">
                  {badge}
                </span>
                <p className="text-[12px] font-medium text-gray-900 leading-snug line-clamp-2 mb-1">
                  {title}
                </p>
                {date && (
                  <p className="text-[10px] text-gray-400">{fmtDate(date)}</p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

// ─── Open Now strip ───────────────────────────────────────────────────────────

function OpenNowStrip({ tracks, lang, onApply, t }: {
  tracks: ProgramTrack[]
  lang: Lang
  onApply: (id: string) => void
  t: (ko: string, en: string, fr: string) => string
}) {
  const open = tracks.filter(s => s.status === 'open' && (s.name_ko?.trim() || s.name_en?.trim()))
  if (!open.length) return null

  return (
    <div className="overflow-x-auto mb-4">
      <div className="flex items-center gap-2 min-w-max">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] uppercase shrink-0 text-gray-900">
          <Zap size={11} />
          {t('모집 중', 'Open now', 'Ouvert')}
        </span>
        {open.map(s => (
          <button
            key={s.id}
            onClick={() => onApply(s.id)}
            className="flex items-center gap-1.5 text-[12px] text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 rounded-full px-3.5 py-1.5 transition-colors whitespace-nowrap"
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-gray-900" />
            {tName(s, lang)}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Feed search ──────────────────────────────────────────────────────────────

function FeedSearch({ value, onChange, suggestions, t }: {
  value: string
  onChange: (v: string) => void
  suggestions: string[]
  t: (ko: string, en: string, fr: string) => string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)

  const visible = focused && !value && suggestions.length > 0

  return (
    <div className="relative mb-5">
      <div className="flex items-center gap-3 border-2 border-gray-900 rounded-xl px-5 py-4 bg-white transition-all">
        <Search size={17} className="text-gray-500 shrink-0" />
        <input
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={t(
            '프로그램, 이벤트, 주거, 취업…',
            'Search programs, events, housing, jobs…',
            'Programmes, événements, logement, emploi…',
          )}
          className="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none font-medium"
        />
        {value && (
          <button
            onClick={() => { onChange(''); ref.current?.focus() }}
            className="text-gray-300 hover:text-gray-500 transition-colors text-base leading-none shrink-0"
          >
            ×
          </button>
        )}
      </div>

      {visible && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] z-20 overflow-hidden">
          <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-gray-300 px-4 pt-3 pb-1.5">
            {t('추천 검색어', 'Suggestions', 'Suggestions')}
          </p>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onMouseDown={() => onChange(s)}
              className="w-full text-left px-4 py-2.5 text-[12px] text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Filter chips ─────────────────────────────────────────────────────────────

const FILTER_ICONS: Record<FeedFilter, React.ElementType> = {
  all:       Zap,
  program:   BookOpen,
  notice:    MessageSquare,
  content:   Newspaper,
  community: Users,
}

function FilterChips({ active, onChange, counts, t }: {
  active: FeedFilter
  onChange: (f: FeedFilter) => void
  counts: Record<FeedFilter, number>
  t: (ko: string, en: string, fr: string) => string
}) {
  const chips: { key: FeedFilter; label: string }[] = [
    { key: 'all',       label: t('전체',    'All',       'Tout')         },
    { key: 'program',   label: t('프로그램', 'Programs',  'Programmes')   },
    { key: 'notice',    label: t('게시판',  'Board',     'Forum')        },
    { key: 'content',   label: t('뉴스',    'News',      'Actualités')   },
    { key: 'community', label: t('커뮤니티', 'Community', 'Communauté')  },
  ]

  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      {chips.map(chip => {
        const n = chip.key === 'all' ? 0 : counts[chip.key]
        const on = active === chip.key
        const Icon = FILTER_ICONS[chip.key]
        return (
          <button
            key={chip.key}
            onClick={() => onChange(chip.key)}
            className={[
              'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.06em] transition-all',
              on ? '' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700',
            ].join(' ')}
            style={on ? { background: 'var(--y)', color: '#111' } : {}}
          >
            <Icon size={11} className="shrink-0" />
            {chip.label}
            {n > 0 && (
              <span className={`text-[9px] ${on ? 'text-gray-400' : 'text-gray-400'}`}>{n}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Notice card ──────────────────────────────────────────────────────────────

function NoticeCard({ notice, lang, t }: {
  notice: Notice; lang: Lang
  t: (ko: string, en: string, fr: string) => string
}) {
  const title   = nTitle(notice, lang)
  const preview = newsExcerpt(nBody(notice, lang), 300)
  const color   = NOTICE_COLOR[notice.type] ?? NOTICE_COLOR.notice
  const typeLabel =
    notice.type === 'event'  ? t('이벤트', 'Event',   'Événement')  :
    notice.type === 'hiring' ? t('채용',   'Hiring',  'Recrutement') :
                               t('공지',   'Notice',  'Avis')

  const boardHref = `/board/${notice.id}`

  return (
    <article className={`rounded-2xl border mb-3 px-5 py-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)] ${notice.is_pinned ? 'border-gray-300 hover:border-gray-400 bg-white' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
      <Link to={boardHref} className="block cursor-pointer">
        <PostHeader time={notice.created_at || notice.date} />

        {/* Type + pin */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <TypeTag color={color}>{typeLabel}</TypeTag>
          {notice.is_pinned && <PinIndicator />}
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium text-gray-900 leading-snug mb-2 hover:text-gray-500 transition-colors">
          {title}
        </h3>

        {/* Preview */}
        {preview && (
          <p className="text-[13px] text-gray-500 leading-relaxed"
             style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {preview}
          </p>
        )}

        {/* Inline image */}
        {notice.image_url && <PostImage src={notice.image_url} href={boardHref} />}
      </Link>

      {/* CTA */}
      <div className="mt-3.5">
        <Link to={boardHref} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
          {t('보기', 'Read', 'Lire')} →
        </Link>
      </div>

      <CardActions compact />
    </article>
  )
}

// ─── Program card ─────────────────────────────────────────────────────────────

function ProgramCard({ track, lang, onApply, t }: {
  track: ProgramTrack; lang: Lang
  onApply: (id: string) => void
  t: (ko: string, en: string, fr: string) => string
}) {
  const name     = tName(track, lang)
  const preview  = newsExcerpt(tDesc(track, lang), 300)
  const price    = tPrice(track)
  const duration = tDuration(track)
  const isOpen   = track.status === 'open'
  const dotColor = isOpen ? '#111111' : '#D1D5DB'
  const isPinned = !!track.is_pinned

  return (
    <article className={`rounded-2xl border mb-3 px-5 py-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)] ${isPinned ? 'border-gray-300 hover:border-gray-400 bg-white' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
      <Link to={`/programs/${track.id}`} className="block cursor-pointer">
        <PostHeader time={track.created_at} />

        {/* Type + status + pin */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <TypeTag>{t('프로그램', 'Program', 'Programme')}</TypeTag>
          {isPinned && <PinIndicator />}
          {isOpen
            ? <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-gray-900">
                {t('모집 중', '● OPEN', '● OUVERT')}
              </span>
            : <span className="text-[10px] text-gray-300 uppercase tracking-wide">
                {t('마감', 'Closed', 'Fermé')}
              </span>
          }
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium text-gray-900 leading-snug mb-2">{name}</h3>

        {/* Preview */}
        {preview && (
          <p className="text-[13px] text-gray-500 leading-relaxed mb-3"
             style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {preview}
          </p>
        )}

        {/* Metadata chips */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {track.start_date && <MetaChip icon={Calendar}>{fmtDate(track.start_date)}</MetaChip>}
          {duration          && <MetaChip icon={Clock}>{duration}</MetaChip>}
          <MetaChip icon={DollarSign}>{price}</MetaChip>
        </div>
      </Link>

      {/* CTA */}
      <div className="mt-4">
        {isOpen
          ? <button onClick={() => onApply(track.id)} className="text-xs text-gray-900 hover:text-gray-500 transition-colors font-medium">
              {t('신청', 'Apply', "S'inscrire")} →
            </button>
          : <span className="text-[11px] text-gray-300 tracking-wide uppercase">{t('마감', 'Closed', 'Fermé')}</span>
        }
      </div>

      <CardActions compact />
    </article>
  )
}

// ─── Content card ─────────────────────────────────────────────────────────────

function ContentCard({ content, lang, t }: {
  content: Content; lang: Lang
  t: (ko: string, en: string, fr: string) => string
}) {
  const title    = cTitle(content, lang)
  const preview  = newsExcerpt(cBody(content, lang), 300)
  const thumb    = thumbnailUrl(content)
  const label    = CAT_LABEL[content.category ?? ''] ?? 'Montréal'
  const dateStr  = content.published_at?.slice(0, 10) ?? ''
  const href     = `/news/${content.id}`
  const isPinned = !!content.is_pinned

  return (
    <article className={`rounded-2xl border mb-3 px-5 py-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)] ${isPinned ? 'border-gray-300 hover:border-gray-400 bg-white' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
      <PostHeader time={content.published_at ?? content.created_at} />

      {/* Type + pin */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <TypeTag>{label}</TypeTag>
        {isPinned && <PinIndicator />}
      </div>

      {/* Title */}
      <Link to={href}>
        <h3 className="text-sm font-medium text-gray-900 leading-snug mb-2 hover:text-gray-500 transition-colors">
          {title}
        </h3>
      </Link>

      {/* Preview */}
      {preview && (
        <p className="text-[13px] text-gray-500 leading-relaxed"
           style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {preview}
        </p>
      )}

      {/* Inline image */}
      {thumb && <PostImage src={thumb} href={href} />}

      {/* CTA */}
      <div className="mt-3.5">
        <Link to={href} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
          {t('읽기', 'Read', 'Lire')} →
        </Link>
      </div>

      <CardActions compact />
    </article>
  )
}

// ─── Post composer ────────────────────────────────────────────────────────────

function PostComposer({
  onOpen,
  t,
}: {
  onOpen: () => void
  t: (ko: string, en: string, fr: string) => string
}) {
  return (
    <button
      onClick={onOpen}
      className="w-full text-left mb-6 group"
    >
      <div className="flex items-center gap-3 border border-gray-200 rounded-2xl px-4 py-3.5 bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-150">
        {/* Avatar placeholder */}
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </div>
        {/* Prompt text */}
        <span className="flex-1 text-[13px] text-gray-400 select-none">
          {t('오늘은 어떤 일이 있었나요?', "What's happening in Montréal?", 'Que se passe-t-il à Montréal?')}
        </span>
        {/* Post pill */}
        <span
          className="text-[12px] font-black px-3.5 py-1.5 rounded-full shrink-0"
          style={{ background: 'var(--y)', color: '#111' }}
        >
          Post
        </span>
      </div>
    </button>
  )
}

// ─── Home ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { lang: rawLang, t } = useLang()
  const lang = rawLang as Lang

  const [tracks,    setTracks]    = useState<ProgramTrack[]>([])
  const [notices,   setNotices]   = useState<Notice[]>([])
  const [contents,  setContents]  = useState<Content[]>([])
  const [community, setCommunity] = useState<CommunitySubmission[]>([])
  const [featured,  setFeatured]  = useState<Content[]>([])
  const [applying,    setApplying]    = useState<string | null>(null)
  const [submitTag,   setSubmitTag]   = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState<FeedFilter>('all')

  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get('q')?.trim() ?? '')
  useEffect(() => { setQuery(searchParams.get('q')?.trim() ?? '') }, [searchParams])

  useEffect(() => {
    // Core feed — must succeed for anything to show
    Promise.all([getTracks('program'), getNotices(), getContents()])
      .then(([tr, n, c]) => {
        setTracks(tr ?? [])
        setNotices(n ?? [])
        setContents((c ?? []).map(normalizeContent))
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    // Community posts — optional; failure must not affect the main feed
    getPublishedCommunityPosts()
      .then(cp => setCommunity(cp ?? []))
      .catch(() => {})

    // Featured content for Community Moments — optional
    getFeaturedContent()
      .then(fc => setFeatured((fc ?? []).map(normalizeContent)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    function onNewPost() {
      getPublishedCommunityPosts()
        .then(cp => setCommunity(cp ?? []))
        .catch(() => {})
    }
    window.addEventListener('hakkyo:community-post', onNewPost)
    return () => window.removeEventListener('hakkyo:community-post', onNewPost)
  }, [])

  useEffect(() => {
    function onCompose(e: Event) {
      const tag = (e as CustomEvent<{ tag: string }>).detail?.tag ?? 'general'
      setSubmitTag(tag)
    }
    window.addEventListener('hakkyo:open-compose', onCompose)
    return () => window.removeEventListener('hakkyo:open-compose', onCompose)
  }, [])

  const allItems = useMemo<FeedItem[]>(() => {
    const raw: FeedItem[] = [
      ...notices.map(n   => ({ kind: 'notice'    as const, data: n,  sortKey: n.created_at   ?? n.date         ?? '', pinned: !!n.is_pinned })),
      ...tracks.map(s    => ({ kind: 'program'   as const, data: s,  sortKey: s.created_at   ?? s.start_date   ?? '', pinned: !!s.is_pinned })),
      ...contents.map(c  => ({ kind: 'content'   as const, data: c,  sortKey: c.published_at ?? c.created_at   ?? '', pinned: !!c.is_pinned })),
      ...community.map(p => ({ kind: 'community' as const, data: p,  sortKey: p.created_at   ?? '',                  pinned: false          })),
    ]
    return raw.filter(hasTitle).sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.sortKey > a.sortKey ? 1 : b.sortKey < a.sortKey ? -1 : 0
    })
  }, [notices, tracks, contents, community])

  const counts = useMemo<Record<FeedFilter, number>>(() => ({
    all:       allItems.length,
    program:   allItems.filter(i => i.kind === 'program').length,
    notice:    allItems.filter(i => i.kind === 'notice').length,
    content:   allItems.filter(i => i.kind === 'content').length,
    community: allItems.filter(i => i.kind === 'community').length,
  }), [allItems])

  const suggestions = useMemo(() => {
    return allItems
      .filter(i => i.pinned || i.kind === 'content' || i.kind === 'notice')
      .slice(0, 5)
      .map(i => {
        if (i.kind === 'notice')  return nTitle(i.data, lang)
        if (i.kind === 'program') return tName(i.data, lang)
        if (i.kind === 'content') return cTitle(i.data, lang)
        return i.data.title
      })
      .filter(Boolean)
  }, [allItems, lang])

  const feed = useMemo(() => {
    let items = filter === 'all' ? allItems : allItems.filter(i => i.kind === filter)
    if (query.trim()) items = items.filter(i => itemMatches(i, query))
    return items
  }, [allItems, filter, query])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-4 h-4 border border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const mainContent = (
    <>
      {/* 1 · Search — prominent, first thing in feed */}
      <FeedSearch value={query} onChange={setQuery} suggestions={suggestions} t={t} />

      {/* 2 · Post composer */}
      <PostComposer onOpen={() => setSubmitTag('general')} t={t} />

      {/* Mobile hero */}
      <div className="lg:hidden mb-4">
        <p className="text-[11px] text-gray-300 leading-relaxed">
          Korean · English · French · Montréal
        </p>
      </div>

      {/* 3 · Open Now */}
      <OpenNowStrip tracks={tracks} lang={lang} onApply={setApplying} t={t} />

      {/* 4 · Community Moments */}
      <CommunityMoments items={featured} lang={lang} />

      {/* 4 · Filter chips */}
      <FilterChips
        active={filter}
        onChange={f => { setFilter(f); setQuery('') }}
        counts={counts}
        t={t}
      />

      {/* 4 · Pinned grid */}
      <PinnedGrid items={allItems} lang={lang} />

      {/* 5 · Feed */}
      <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-300 mb-4">
        RECENT POSTS
      </p>

      {feed.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-sm text-gray-300 tracking-wide">
            {query.trim()
              ? t('검색 결과가 없습니다.', 'No results found.', 'Aucun résultat.')
              : t('곧 업데이트됩니다.', 'Coming soon.', 'Bientôt disponible.')}
          </p>
        </div>
      ) : (
        <div>
          {feed.map(item => {
            if (item.kind === 'notice')    return <NoticeCard    key={`n-${item.data.id}`}  notice={item.data}  lang={lang} t={t} />
            if (item.kind === 'program')   return <ProgramCard   key={`p-${item.data.id}`}  track={item.data}   lang={lang} onApply={setApplying} t={t} />
            if (item.kind === 'community') return <CommunityCard key={`cp-${item.data.id}`} post={item.data}    t={t} />
            return                                <ContentCard   key={`c-${item.data.id}`}  content={item.data} lang={lang} t={t} />
          })}
        </div>
      )}
    </>
  )

  return (
    <>
      <PageShell
        left={<LeftSidebar lang={lang} />}
        right={<SharedRightSidebar lang={lang} />}
      >
        {mainContent}
      </PageShell>
      <FloatingCreateButton onOpen={() => setSubmitTag('general')} />
      {applying && <ApplyModal preselectedTrackId={applying} onClose={() => setApplying(null)} />}
      <Suspense fallback={null}>
        {submitTag !== null && (
          <CommunitySubmitModal initialTag={submitTag} onClose={() => setSubmitTag(null)} />
        )}
      </Suspense>
    </>
  )
}
