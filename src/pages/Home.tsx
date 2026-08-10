import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTracks, getPublishedCommunityPosts } from '../lib/db'
import { useLang } from '../context/LangContext'
import { formatPrice, formatSeats, formatDeadlineDelta } from '../lib/format'
import { resolveApplicationDeadline, dedupeTracks } from '../lib/programDisplay'
import type { ProgramTrack, CommunitySubmission } from '../types'
import CommunityComposer from '../components/CommunityComposer'

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = 'ko' | 'en' | 'fr'

function pickText(lang: Lang, ko: string, en: string, fr: string): string {
  const order = lang === 'ko' ? [ko, en, fr] : lang === 'fr' ? [fr, ko, en] : [en, ko, fr]
  return order.find(s => s?.trim()) ?? ''
}

const tName  = (s: ProgramTrack, l: Lang) => pickText(l, s.name_ko, s.name_en, s.name_fr)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtTime(tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date())
}

function todayFull(lang: Lang): string {
  const now = new Date()
  if (lang === 'ko') return now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  if (lang === 'fr') return now.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return now.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

// ─── Section 1: HERO ─────────────────────────────────────────────────────────

function Hero({ lang }: { lang: Lang }) {
  const [times, setTimes] = useState({ mtl: '', seo: '' })

  useEffect(() => {
    function refresh() {
      setTimes({ mtl: fmtTime('America/Toronto'), seo: fmtTime('Asia/Seoul') })
    }
    refresh()
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="py-5 md:py-6 flex items-center justify-between gap-4 border-b border-gray-100 animate-fade-up">
      <p className="t-eyebrow text-gray-400 truncate">
        {todayFull(lang)}
      </p>
      <p style={{ fontSize: '13px', fontVariantNumeric: 'tabular-nums' }} className="text-gray-500 shrink-0 whitespace-nowrap">
        <span className="text-gray-300">MTL</span> {times.mtl}
        <span className="text-gray-200 mx-2">·</span>
        <span className="text-gray-300">Seoul</span> {times.seo}
      </p>
    </section>
  )
}

// ─── Section 2: TODAY IN HAKKYO ───────────────────────────────────────────────

type HappeningItem = { label: string; title: string; href: string; time?: string }

function TodayInHakkyo({ tracks, lang }: {
  tracks: ProgramTrack[]
  lang: Lang
}) {
  const { t } = useLang()
  const items: HappeningItem[] = []
  const dedupedTracks = dedupeTracks(tracks)

  const openCount = dedupedTracks.filter(s => s.status === 'open').length
  if (openCount > 0) {
    items.push({
      label: t('프로그램', 'Programs', 'Programmes'),
      title: t(`${openCount}개 프로그램 신청 가능`, `${openCount} programs open`, `${openCount} programmes ouverts`),
      href: '/programs',
    })
  }

  const exchanges = dedupedTracks.filter(s => {
    const name = tName(s, 'en').toLowerCase()
    const isExchange = name.includes('exchange') || name.includes('교환') || name.includes('échange')
    if (!isExchange || !s.start_date) return false
    const diff = (new Date(s.start_date).getTime() - Date.now()) / 86_400_000
    return diff >= 0 && diff <= 14
  })
  exchanges.slice(0, 1).forEach(s => {
    items.push({
      label: t('언어 교환', 'Language Exchange', 'Échange'),
      title: tName(s, lang),
      href: `/programs/${s.id}`,
      time: s.start_date?.slice(0, 10),
    })
  })

  if (items.length === 0) return null

  return (
    <section className="editorial-section">
      <p className="t-eyebrow text-gray-400 mb-8">
        {t('지금 HAKKYO에서', 'Today in HAKKYO', "Aujourd'hui chez HAKKYO")}
      </p>

      {/* Feature strip */}
      <div className="rounded-3xl overflow-hidden border border-gray-100 bg-gray-50/60">
        {items.slice(0, 6).map((item, i) => (
          <Link
            key={i}
            to={item.href}
            className="flex items-center gap-5 px-6 py-5 border-b border-gray-100 last:border-0 hover:bg-white transition-colors group"
          >
            <span
              className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap"
              style={{ background: 'var(--y-l)', color: '#7c5c00' }}
            >
              {item.label}
            </span>
            <span style={{ fontSize: '13px' }} className="text-gray-700 group-hover:text-gray-900 transition-colors leading-snug flex-1 min-w-0 truncate font-medium">
              {item.title}
            </span>
            {item.time && (
              <span className="text-[12px] text-gray-300 shrink-0 font-mono">{item.time}</span>
            )}
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                 className="text-gray-200 group-hover:text-gray-500 shrink-0 transition-colors">
              <polyline points="6,3 11,8 6,13"/>
            </svg>
          </Link>
        ))}
      </div>
    </section>
  )
}

// ─── Section 3: START FROM WHERE YOU ARE ─────────────────────────────────────

function IcoArrive() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.5H2"/><path d="M2 10l4.5 1.5L9 5l2 2-2 5 4.5 1.5L17 7l2.5 1-3 7H22"/>
    </svg>
  )
}
function IcoPeople() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4"/><circle cx="17" cy="9" r="3"/>
      <path d="M2 20c0-3.314 3.134-6 7-6s7 2.686 7 6"/>
      <path d="M20 20c0-2.21-1.343-4-3-4"/>
    </svg>
  )
}

const PATHS = [
  {
    href: '/arriving',
    icon: <IcoArrive />,
    tag_ko: '도착 & 정착', tag_en: 'Arriving & Settling', tag_fr: 'Arrivée & Installation',
    ko: '몬트리올 도착부터 정착까지', en: 'Arriving & settling in Montréal', fr: 'Arriver et s\'installer à Montréal',
    desc_ko: '항공편·유심·은행부터 예산·동네·계약·이사까지, 전 과정 한 곳에서',
    desc_en: 'Flights, SIM, and banking through budget, lease, and moving day — all in one place',
    desc_fr: "Vols, carte SIM et banque jusqu'au budget, bail et déménagement — tout en un seul endroit",
  },
  {
    href: '/board',
    icon: <IcoPeople />,
    tag_ko: '주변 사람들', tag_en: 'People', tag_fr: 'Les gens',
    ko: '주변 사람들', en: 'People Around You', fr: 'Les gens autour de vous',
    desc_ko: '몬트리올에 사는 사람들과 연결되기',
    desc_en: 'Connect with people living in Montréal right now',
    desc_fr: 'Se connecter avec les gens qui vivent à Montréal',
  },
]

function StartFromHere({ lang }: { lang: Lang }) {
  const { t } = useLang()

  return (
    <section className="editorial-section">
      <p className="t-eyebrow text-gray-400 mb-8">
        {t('여기서 시작하세요', 'Start from where you are', 'Commencez là où vous êtes')}
      </p>

      <div className="space-y-px">
        {PATHS.map(card => (
          <Link
            key={card.href}
            to={card.href}
            className="group flex items-center gap-5 md:gap-7 py-4 px-1 border-b border-gray-100 last:border-0 hover:pl-2 transition-all duration-200"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors group-hover:bg-gray-100"
              style={{ background: '#F4F4F4' }}
            >
              <span className="text-gray-500 group-hover:text-gray-800 transition-colors">{card.icon}</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="t-eyebrow text-gray-300 mb-1.5">
                {lang === 'ko' ? card.tag_ko : lang === 'fr' ? card.tag_fr : card.tag_en}
              </p>
              <h3 className="t-section text-gray-900 mb-1.5 group-hover:text-gray-600 transition-colors">
                {lang === 'ko' ? card.ko : lang === 'fr' ? card.fr : card.en}
              </h3>
              <p style={{ fontSize: '13px', lineHeight: '1.55' }} className="text-gray-400">
                {lang === 'ko' ? card.desc_ko : lang === 'fr' ? card.desc_fr : card.desc_en}
              </p>
            </div>

            <svg
              width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round"
              className="text-gray-200 group-hover:text-gray-500 shrink-0 transition-colors"
            >
              <polyline points="6,3 11,8 6,13"/>
            </svg>
          </Link>
        ))}
      </div>
    </section>
  )
}

// ─── Section 5: COMMUNITY PULSE ───────────────────────────────────────────────

function CommunityPulse({ posts }: {
  posts: CommunitySubmission[]
}) {
  const { t } = useLang()
  const show = posts.slice(0, 3)

  return (
    <section className="editorial-section">
      <p className="t-eyebrow text-gray-400 mb-8">
        {t('커뮤니티', 'Community Pulse', 'Communauté')}
      </p>

      {show.length > 0 && (
        <div className="row-list mb-8">
          {show.map((post, i) => (
            <div key={i} className="row-item">
              <span className="row-chip row-chip-sm" style={{ background: 'var(--y)', color: '#111' }}>
                {(post.author_name ?? '?')[0].toUpperCase()}
              </span>
              <div className="row-body">
                <span className="row-title">{post.title ?? post.description?.slice(0, 90)}</span>
                <p className="row-sub">
                  {post.author_name ?? t('익명', 'Anonymous', 'Anonyme')}
                  {post.created_at && <span> · {post.created_at.slice(0, 10)}</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-5">
        <CommunityComposer />
      </div>

      <div className="mt-5">
        <Link to="/board" className="inline-flex items-center gap-2 text-[13px] font-semibold text-gray-500 hover:text-gray-900 transition-colors">
          {t('커뮤니티 전체 보기', 'See all community posts', 'Voir tous les posts')}
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="6,3 11,8 6,13"/>
          </svg>
        </Link>
      </div>
    </section>
  )
}

// ─── Section 6: PROGRAMS ─────────────────────────────────────────────────────

function Programs({ tracks, lang }: { tracks: ProgramTrack[]; lang: Lang }) {
  const { t } = useLang()

  // "Open now" first, sorted by nearest deadline — not "starts soon", which hid
  // every open program once their start_date had already passed.
  const openTracks = dedupeTracks(tracks)
    .filter(s => s.status === 'open')
    .sort((a, b) => {
      const pa = !!(a as ProgramTrack & { is_pinned?: boolean }).is_pinned
      const pb = !!(b as ProgramTrack & { is_pinned?: boolean }).is_pinned
      if (pa !== pb) return pa ? -1 : 1
      const da = resolveApplicationDeadline(a)
      const db = resolveApplicationDeadline(b)
      if (da && db) return new Date(da).getTime() - new Date(db).getTime()
      if (da) return -1
      if (db) return 1
      const sa = a.start_date ? new Date(a.start_date).getTime() : Infinity
      const sb = b.start_date ? new Date(b.start_date).getTime() : Infinity
      return sa - sb
    })
    .slice(0, 4)

  return (
    <section className="editorial-section">
      <p className="t-eyebrow text-gray-400 mb-8">
        {t('지금 신청 가능', 'Open Now', 'Ouvert maintenant')}
      </p>

      {openTracks.length === 0 ? (
        <p className="text-[13px] text-gray-400 mb-2">
          {t('지금 신청 가능한 프로그램이 없어요.', 'No programs open right now.', "Aucun programme ouvert pour l'instant.")}
          {' '}
          <Link to="/programs" className="text-gray-600 underline underline-offset-2 hover:text-gray-900 transition-colors">
            {t('전체 프로그램 보기', 'See all programs', 'Voir tous les programmes')}
          </Link>
        </p>
      ) : (
        <>
          <div className="row-list">
            {openTracks.map(s => {
              const name    = tName(s, lang)
              const dateStr = s.start_date?.slice(0, 10) ?? ''
              const d       = dateStr ? new Date(dateStr) : null
              const price   = formatPrice(s)
              const seats   = formatSeats(s.capacity, s.enrolled)
              const deadlineText = !seats ? formatDeadlineDelta(resolveApplicationDeadline(s)) : null
              return (
                <Link key={s.id} to={`/programs/${s.id}`} className="row-item interactive">
                  {/* Date block doubles as the row chip */}
                  <div className="row-chip flex-col !bg-transparent border border-gray-100">
                    <p className="text-[9px] font-bold text-gray-300 uppercase leading-none">
                      {d ? d.toLocaleDateString('en-CA', { month: 'short' }) : ''}
                    </p>
                    <p style={{ fontSize: '15px', fontWeight: 600 }} className="text-gray-800 leading-none mt-0.5">
                      {d ? d.getDate() : ''}
                    </p>
                  </div>

                  <div className="row-body">
                    <span className="row-title">{name}</span>
                    <p className="row-sub">{price}</p>
                  </div>

                  <div className="row-stats">
                    {seats ? (
                      <p className={`row-stat-label${seats.low ? ' status-negative' : ''}`}>{seats.text}</p>
                    ) : deadlineText ? (
                      <p className="row-stat-label">{deadlineText}</p>
                    ) : null}
                  </div>

                  <span className="badge-open">
                    {t('신청 가능', 'Open', 'Ouvert')}
                  </span>
                </Link>
              )
            })}
          </div>

          <div className="mt-6">
            <Link to="/programs" className="inline-flex items-center gap-2 text-[13px] font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              {t('모든 프로그램 보기', 'All programs', 'Tous les programmes')}
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="6,3 11,8 6,13"/>
              </svg>
            </Link>
          </div>
        </>
      )}
    </section>
  )
}

// ─── Home ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { lang: rawLang } = useLang()
  const lang = rawLang as Lang

  const [tracks,    setTracks]    = useState<ProgramTrack[]>([])
  const [community, setCommunity] = useState<CommunitySubmission[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    getTracks('program')
      .then(tr => setTracks(tr ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))

    getPublishedCommunityPosts()
      .then(cp => setCommunity(cp ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    function onNewPost() {
      getPublishedCommunityPosts().then(cp => setCommunity(cp ?? [])).catch(() => {})
    }
    window.addEventListener('hakkyo:community-post', onNewPost)
    return () => window.removeEventListener('hakkyo:community-post', onNewPost)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-4 h-4 border border-gray-200 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="w-full flex justify-center px-6">
        <div className="w-full max-w-[1040px]">

          {/* 1 · Hero */}
          <Hero lang={lang} />

          {/* 2 · Today in HAKKYO */}
          <TodayInHakkyo tracks={tracks} lang={lang} />

          {/* 3 · Open programs — what's actionable right now */}
          <Programs tracks={tracks} lang={lang} />

          {/* 4 · Community Pulse — latest activity */}
          <CommunityPulse posts={community} />

          {/* 5 · Start from where you are — onboarding nav */}
          <StartFromHere lang={lang} />

          <div className="h-20" />
        </div>
      </div>
    </>
  )
}
