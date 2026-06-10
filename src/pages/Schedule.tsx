import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Pin, MessageSquare, Users, Zap, CalendarDays } from 'lucide-react'
import { getNotices, getPublishedCommunityPosts } from '../lib/db'
import { useLang } from '../context/LangContext'
import CardActions from '../components/CardActions'
import { LeftSidebar, PageShell, SharedRightSidebar } from '../components/PageLayout'
import type { Notice, CommunitySubmission } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = 'ko' | 'en' | 'fr'

type FilterKey = 'all' | 'notice' | 'event' | 'community'

type FeedItem =
  | { kind: 'notice';    data: Notice;              sortKey: string; pinned: boolean }
  | { kind: 'community'; data: CommunitySubmission; sortKey: string; pinned: boolean }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickText(lang: Lang, ko: string, en: string, fr: string): string {
  const order = lang === 'ko' ? [ko, en, fr] : lang === 'fr' ? [fr, ko, en] : [en, ko, fr]
  return order.find(s => s?.trim()) ?? ''
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }).format(
      new Date(iso.length === 10 ? iso + 'T00:00:00' : iso),
    )
  } catch { return iso }
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    const diff  = Date.now() - new Date(iso).getTime()
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

// ─── Label maps ───────────────────────────────────────────────────────────────

const NOTICE_TYPE_LABEL: Record<Notice['type'], string> = {
  notice: 'Notice',
  event:  'Event',
  hiring: 'Hiring',
}

const COMMUNITY_SUBTYPE_LABEL: Record<string, string> = {
  housing:            'Housing',
  jobs:               'Jobs',
  looking_for_people: 'Roommates',
  language_exchange:  'Language Exchange',
  general:            'General',
  other:              'General',
  // legacy values — keep display sensible
  events:             'Events',
  help_needed:        'Help',
}

// ─── Filter logic ─────────────────────────────────────────────────────────────

function itemMatchesFilter(item: FeedItem, filter: FilterKey): boolean {
  if (filter === 'all')       return true
  if (filter === 'community') return item.kind === 'community'
  if (item.kind !== 'notice') return false
  if (filter === 'notice')    return item.data.type === 'notice'
  if (filter === 'event')     return item.data.type === 'event'
  return false
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

function PostHeader({ time, label }: { time?: string | null; label: string }) {
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
      <span className="ml-auto text-[9px] font-bold tracking-[0.18em] uppercase text-gray-300">
        {label}
      </span>
    </div>
  )
}

function PinIndicator() {
  return (
    <span className="inline-flex items-center gap-1 text-gray-400">
      <Pin size={10} />
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        Pinned
      </span>
    </span>
  )
}

// ─── Notice card ──────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<img[^>]*>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function NoticeCard({ notice, lang }: { notice: Notice; lang: Lang }) {
  const t = (ko: string, en: string, fr: string) => pickText(lang, ko, en, fr)
  const title   = pickText(lang, notice.title_ko, notice.title_en, notice.title_fr)
  const preview = stripHtml(pickText(lang, notice.body_ko, notice.body_en, notice.body_fr)).slice(0, 160)
  const typeLabel = NOTICE_TYPE_LABEL[notice.type]
  const href = `/board/${notice.id}`

  return (
    <article className={[
      'rounded-2xl border mb-3 bg-white transition-all duration-200',
      'hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)]',
      notice.is_pinned ? 'border-gray-300 hover:border-gray-400' : 'border-gray-100 hover:border-gray-200',
    ].join(' ')}>
      <Link to={href} className="block px-5 pt-5 pb-0 cursor-pointer">
        <PostHeader time={notice.created_at || notice.date} label={typeLabel} />

        {/* Pin + date */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {notice.is_pinned && <PinIndicator />}
          <span className="text-[10px] text-gray-400">{fmtDate(notice.date)}</span>
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

        {/* Image */}
        {notice.image_url && (
          <div className="mt-3 overflow-hidden rounded-xl bg-gray-50" style={{ maxHeight: 440 }}>
            <img src={notice.image_url} alt="" loading="lazy"
                 className="w-full object-cover transition-transform duration-500 hover:scale-[1.015]"
                 style={{ maxHeight: 440 }} />
          </div>
        )}
      </Link>

      {/* CTA */}
      <div className="px-5 py-3.5 flex items-center justify-between border-t border-gray-50">
        <Link to={href} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
          {t('읽기', 'Read', 'Lire')} →
        </Link>
        <CardActions
          item={{
            id:    notice.id,
            type:  'board',
            title: notice.title_en || notice.title_ko,
            image: notice.image_url ?? null,
            url:   href,
            date:  notice.date ?? notice.created_at ?? null,
          }}
          url={href}
          size={13}
        />
      </div>
    </article>
  )
}

// ─── Community card ───────────────────────────────────────────────────────────

function CommunityCard({ post, lang }: { post: CommunitySubmission; lang: Lang }) {
  const t = (ko: string, en: string, fr: string) => pickText(lang, ko, en, fr)
  const subtype = COMMUNITY_SUBTYPE_LABEL[post.type] ?? 'General'
  const href = `/community/${post.id}`

  return (
    <article className="rounded-2xl border border-gray-100 bg-white mb-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)] hover:border-gray-200">
      <Link to={href} className="block px-5 pt-5 pb-0 cursor-pointer">
        <PostHeader time={post.created_at} label={`Community · ${subtype}`} />

        {/* Title */}
        <h3 className="text-sm font-medium text-gray-900 leading-snug mb-2">{post.title}</h3>

        {/* Description */}
        <p className="text-[13px] text-gray-500 leading-relaxed"
           style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {post.description}
        </p>

        {/* Image */}
        {post.image_url && (
          <div className="mt-3 overflow-hidden rounded-xl bg-gray-50" style={{ maxHeight: 440 }}>
            <img src={post.image_url} alt="" loading="lazy"
                 className="w-full object-cover"
                 style={{ maxHeight: 440 }} />
          </div>
        )}

        {/* Submitted by */}
        <p className="text-[11px] text-gray-300 mt-3">
          {t('제출자', 'Submitted by', 'Soumis par')} {post.contact}
        </p>
      </Link>

      {/* CTA */}
      <div className="px-5 py-3.5 flex items-center justify-between border-t border-gray-50">
        <Link to={href} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
          {t('전체 보기', 'View', 'Voir')} →
        </Link>
        <CardActions
          item={{
            id:    post.id,
            type:  'board',
            title: post.title,
            image: post.image_url ?? null,
            url:   href,
            date:  post.created_at ?? null,
          }}
          url={href}
          size={13}
        />
      </div>
    </article>
  )
}

// ─── Filter chips ─────────────────────────────────────────────────────────────

const FILTER_CONFIG: Array<{ key: FilterKey; icon: React.ElementType; ko: string; en: string; fr: string }> = [
  { key: 'all',       icon: Zap,           ko: '전체',    en: 'All',       fr: 'Tout'        },
  { key: 'notice',    icon: MessageSquare, ko: '공지',    en: 'Notice',    fr: 'Avis'        },
  { key: 'event',     icon: CalendarDays,  ko: '이벤트',  en: 'Events',    fr: 'Événements'  },
  { key: 'community', icon: Users,         ko: '커뮤니티', en: 'Community', fr: 'Communauté'  },
]

function FilterChips({ active, onChange, counts, lang }: {
  active: FilterKey
  onChange: (f: FilterKey) => void
  counts: Record<FilterKey, number>
  lang: Lang
}) {
  return (
    <div className="flex items-center gap-2 mb-5 flex-wrap">
      {FILTER_CONFIG.map(({ key, icon: Icon, ko, en, fr }) => {
        const label = lang === 'ko' ? ko : lang === 'fr' ? fr : en
        const n = key === 'all' ? 0 : counts[key]
        const on = active === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={[
              'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.06em] transition-colors',
              on
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700',
            ].join(' ')}
          >
            <Icon size={11} className="shrink-0" />
            {label}
            {n > 0 && <span className="text-[9px] text-gray-400">{n}</span>}
          </button>
        )
      })}
    </div>
  )
}

// ─── Board page ───────────────────────────────────────────────────────────────

export default function Schedule() {
  const { lang: rawLang, t } = useLang()
  const lang = rawLang as Lang

  const [notices,   setNotices]   = useState<Notice[]>([])
  const [community, setCommunity] = useState<CommunitySubmission[]>([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState<FilterKey>('all')

  useEffect(() => {
    Promise.all([getNotices(), getPublishedCommunityPosts()])
      .then(([n, cp]) => {
        setNotices(n ?? [])
        setCommunity(cp ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const allItems = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [
      ...notices.map(n  => ({ kind: 'notice'    as const, data: n,  sortKey: n.created_at  ?? n.date ?? '', pinned: !!n.is_pinned })),
      ...community.map(p => ({ kind: 'community' as const, data: p,  sortKey: p.created_at  ?? '',            pinned: false         })),
    ]
    return items.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.sortKey > a.sortKey ? 1 : b.sortKey < a.sortKey ? -1 : 0
    })
  }, [notices, community])

  const counts = useMemo<Record<FilterKey, number>>(() => ({
    all:       allItems.length,
    notice:    allItems.filter(i => i.kind === 'notice'    && i.data.type === 'notice').length,
    event:     allItems.filter(i => i.kind === 'notice'    && i.data.type === 'event').length,
    community: allItems.filter(i => i.kind === 'community').length,
  }), [allItems])

  const feed = useMemo(
    () => allItems.filter(i => itemMatchesFilter(i, filter)),
    [allItems, filter],
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-4 h-4 border border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const mainContent = (
    <>
      {/* Filter chips */}
      <FilterChips active={filter} onChange={setFilter} counts={counts} lang={lang} />

      {/* Feed */}
      {feed.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-sm text-gray-300 tracking-wide">
            {t('내용이 없습니다.', 'Nothing here yet.', "Rien pour l'instant.")}
          </p>
        </div>
      ) : (
        <div>
          {feed.map(item =>
            item.kind === 'notice'
              ? <NoticeCard    key={`n-${item.data.id}`}  notice={item.data} lang={lang} />
              : <CommunityCard key={`c-${item.data.id}`}  post={item.data}   lang={lang} />,
          )}
        </div>
      )}
    </>
  )

  return (
    <PageShell
      left={<LeftSidebar lang={lang} />}
      right={<SharedRightSidebar lang={lang} />}
    >
      {mainContent}
    </PageShell>
  )
}
