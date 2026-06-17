import { useState, useEffect, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { getTracks, getContents, getPublishedCommunityPosts } from '../lib/db'
import { useLang } from '../context/LangContext'
import { normalizeContent } from '../lib/newsContent'
import type { ProgramTrack, Content, CommunitySubmission } from '../types'
import { trackEvent } from '../lib/analytics'
const CommunitySubmitModal = lazy(() => import('../components/CommunitySubmitModal'))

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = 'ko' | 'en' | 'fr'

function pickText(lang: Lang, ko: string, en: string, fr: string): string {
  const order = lang === 'ko' ? [ko, en, fr] : lang === 'fr' ? [fr, ko, en] : [en, ko, fr]
  return order.find(s => s?.trim()) ?? ''
}

const tName  = (s: ProgramTrack, l: Lang) => pickText(l, s.name_ko, s.name_en, s.name_fr)
const cTitle = (c: Content, l: Lang)      => pickText(l, c.title_ko, c.title_en, c.title_fr)

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

// ─── Daily phrase ─────────────────────────────────────────────────────────────

const DAILY_WORDS: Array<{ ko: string; en: string; fr: string; context: string }> = [
  { ko: '천천히 가도 괜찮아요.',         en: "It's okay to go slowly.",           fr: "C'est bien d'y aller doucement.", context: 'Settling in' },
  { ko: '오늘 어떠세요?',                en: 'How are you today?',                fr: "Comment allez-vous aujourd'hui ?", context: 'Daily greeting' },
  { ko: '몬트리올에 온 걸 환영해요.',     en: 'Welcome to Montréal.',              fr: 'Bienvenue à Montréal.',           context: 'First arrival' },
  { ko: '지하철 타는 법을 알아요?',       en: 'Do you know how to take the metro?', fr: 'Savez-vous prendre le métro ?', context: 'Transit' },
  { ko: '어디서 왔어요?',                en: 'Where are you from?',               fr: "D'où venez-vous ?",               context: 'Getting to know each other' },
  { ko: '이 근처에 좋은 카페가 있어요?',  en: 'Is there a good café nearby?',      fr: 'Y a-t-il un bon café par ici ?',  context: 'Neighbourhood life' },
  { ko: '같이 공부할 사람 있어요?',       en: 'Anyone want to study together?',    fr: "Quelqu'un veut étudier ensemble ?", context: 'Community' },
]

// ─── Section 1: HERO ─────────────────────────────────────────────────────────

function Hero({ lang }: { lang: Lang }) {
  const { t } = useLang()
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
    <section className="pt-8 pb-16 md:pt-12 md:pb-24 animate-fade-up">
      {/* Date eyebrow */}
      <p className="eyebrow mb-7 text-gray-400">
        {todayFull(lang)}
      </p>

      {/* Hero title */}
      <h1 className="h-hero text-gray-900 mb-6">
        {t('몬트리올,\n오늘.', 'Montréal,\ntoday.', "Montréal,\naujourd'hui.")}
      </h1>

      {/* Subtitle */}
      <p style={{ fontSize: '17px', lineHeight: '1.7' }} className="text-gray-500 max-w-[440px] mb-12">
        {t(
          '언어를 찾고, 사람을 만나고,\n이 도시에서 나만의 자리를 찾는 하루 가이드.',
          'A daily guide for finding language, people,\nand your place in the city.',
          "Un guide quotidien pour trouver\nvotre langue, vos gens, et votre place en ville.",
        )}
      </p>

      {/* Live clocks */}
      <div className="flex items-end gap-10">
        <div>
          <p className="eyebrow text-gray-300 mb-2">Montréal</p>
          <p style={{ fontSize: '32px', fontWeight: 300, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}
             className="text-gray-900 leading-none">
            {times.mtl}
          </p>
        </div>
        <div className="w-px h-10 bg-gray-100 mb-1" />
        <div>
          <p className="eyebrow text-gray-300 mb-2">Seoul</p>
          <p style={{ fontSize: '32px', fontWeight: 300, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}
             className="text-gray-900 leading-none">
            {times.seo}
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── Section 2: TODAY IN HAKKYO ───────────────────────────────────────────────

type HappeningItem = { label: string; title: string; href: string; time?: string }

function TodayInHakkyo({ tracks, contents, community, lang }: {
  tracks: ProgramTrack[]
  contents: Content[]
  community: CommunitySubmission[]
  lang: Lang
}) {
  const { t } = useLang()
  const items: HappeningItem[] = []

  const openCount = tracks.filter(s => s.status === 'open').length
  if (openCount > 0) {
    items.push({
      label: t('프로그램', 'Programs', 'Programmes'),
      title: t(`${openCount}개 프로그램 신청 가능`, `${openCount} programs open`, `${openCount} programmes ouverts`),
      href: '/programs',
    })
  }

  const exchanges = tracks.filter(s => {
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

  contents.slice(0, 2).forEach(c => {
    const title = cTitle(c, lang)
    if (title) items.push({
      label: t('가이드', 'Guide', 'Guide'),
      title,
      href: `/news/${c.id}`,
      time: c.published_at?.slice(0, 10),
    })
  })

  community.slice(0, 2).forEach(p => {
    if (p.title) items.push({
      label: t('커뮤니티', 'Community', 'Communauté'),
      title: p.title,
      href: '/board',
      time: p.created_at?.slice(0, 10),
    })
  })

  if (items.length === 0) return null

  return (
    <section className="editorial-section">
      <p className="eyebrow text-gray-400 mb-8">
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
            <span style={{ fontSize: '15px' }} className="text-gray-700 group-hover:text-gray-900 transition-colors leading-snug flex-1 min-w-0 truncate font-medium">
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
function IcoHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
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
    tag_ko: '첫 걸음', tag_en: 'First Steps', tag_fr: 'Premiers Pas',
    ko: '몬트리올로', en: 'Into Montréal', fr: 'Vers Montréal',
    desc_ko: '도착 전부터 첫 주까지 — 항공편, 유심, 은행, 교통까지',
    desc_en: 'From your flight to your first week — flights, SIM, banking, transit and more',
    desc_fr: "De votre vol à votre première semaine — vols, SIM, banque, transport",
  },
  {
    href: '/settling',
    icon: <IcoHome />,
    tag_ko: '나만의 공간', tag_en: 'Finding My Place', tag_fr: 'Mon espace',
    ko: '나만의 공간 찾기', en: 'Finding My Place', fr: 'Trouver ma place',
    desc_ko: '예산, 동네, 계약, 이사까지 단계별 가이드',
    desc_en: 'Budget, neighbourhood, lease, and moving in — step by step',
    desc_fr: 'Budget, quartier, bail, emménagement — étape par étape',
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
      <p className="eyebrow text-gray-400 mb-8">
        {t('여기서 시작하세요', 'Start from where you are', 'Commencez là où vous êtes')}
      </p>

      <div className="space-y-px">
        {PATHS.map(card => (
          <Link
            key={card.href}
            to={card.href}
            className="group flex items-center gap-6 md:gap-8 py-7 px-1 border-b border-gray-100 last:border-0 hover:pl-2 transition-all duration-200"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors group-hover:bg-gray-100"
              style={{ background: '#F4F4F4' }}
            >
              <span className="text-gray-500 group-hover:text-gray-800 transition-colors">{card.icon}</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="eyebrow text-gray-300 mb-1.5">
                {lang === 'ko' ? card.tag_ko : lang === 'fr' ? card.tag_fr : card.tag_en}
              </p>
              <h3 className="h-section text-gray-900 mb-1.5 group-hover:text-gray-600 transition-colors">
                {lang === 'ko' ? card.ko : lang === 'fr' ? card.fr : card.en}
              </h3>
              <p style={{ fontSize: '15px', lineHeight: '1.6' }} className="text-gray-400">
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

// ─── Section 4: TODAY'S EXPRESSION ───────────────────────────────────────────

function TodaysExpression() {
  const { t } = useLang()
  const word = DAILY_WORDS[new Date().getDay()]

  return (
    <section className="editorial-section">
      <p className="eyebrow text-gray-400 mb-8">
        {t('오늘의 표현', "Today's Expression", "Expression du jour")}
      </p>

      <div className="rounded-3xl border border-gray-100 bg-gray-50/50 px-8 py-9 md:px-10 md:py-11">
        <p className="eyebrow text-gray-300 mb-6">{word.context}</p>

        <div className="space-y-4">
          <p style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25 }}
             className="text-gray-900">
            {word.ko}
          </p>
          <p style={{ fontSize: '17px' }} className="text-gray-600 leading-relaxed">
            {word.en}
          </p>
          <p style={{ fontSize: '15px' }} className="text-gray-400 italic leading-relaxed">
            {word.fr}
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <Link to="/phrases" className="inline-flex items-center gap-2 text-[13px] font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            {t('더 많은 표현 보기', 'More everyday expressions', "Plus d'expressions")}
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="6,3 11,8 6,13"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Section 5: COMMUNITY PULSE ───────────────────────────────────────────────

function CommunityPulse({ posts, onCompose }: {
  posts: CommunitySubmission[]
  onCompose: () => void
}) {
  const { t } = useLang()
  const show = posts.slice(0, 3)

  return (
    <section className="editorial-section">
      <p className="eyebrow text-gray-400 mb-8">
        {t('커뮤니티', 'Community Pulse', 'Communauté')}
      </p>

      {show.length > 0 && (
        <div className="space-y-5 mb-8">
          {show.map((post, i) => (
            <div key={i} className="flex items-start gap-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                style={{ background: 'var(--y)', color: '#111' }}
              >
                {(post.author_name ?? '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p style={{ fontSize: '15px', lineHeight: '1.6' }} className="text-gray-700">
                  {post.title ?? post.description?.slice(0, 90)}
                </p>
                <p className="text-[12px] text-gray-300 mt-1.5">
                  {post.author_name ?? t('익명', 'Anonymous', 'Anonyme')}
                  {post.created_at && <span> · {post.created_at.slice(0, 10)}</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onCompose}
        className="w-full text-left border border-dashed border-gray-200 rounded-2xl px-6 py-4 text-[14px] text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-all hover:bg-gray-50/50"
      >
        {t(
          '몬트리올 생활에서 있었던 일을 나눠보세요.',
          'Share something from your life in Montréal.',
          'Partagez quelque chose de votre vie à Montréal.',
        )} <span className="text-gray-300 ml-1">+</span>
      </button>

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

  const upcoming = tracks
    .filter(s => {
      if (!s.start_date) return false
      const diff = (new Date(s.start_date).getTime() - Date.now()) / 86_400_000
      return diff >= -1 && diff <= 21
    })
    .slice(0, 4)

  if (upcoming.length === 0) return null

  return (
    <section className="editorial-section">
      <p className="eyebrow text-gray-400 mb-8">
        {t('이번 달 프로그램', 'Upcoming Programs', 'Programmes à venir')}
      </p>

      <div className="space-y-4">
        {upcoming.map(s => {
          const name    = tName(s, lang)
          const dateStr = s.start_date?.slice(0, 10) ?? ''
          const isOpen  = s.status === 'open'
          const d       = dateStr ? new Date(dateStr) : null
          return (
            <Link key={s.id} to={`/programs/${s.id}`}
                  className="group flex items-center gap-5 rounded-2xl border border-gray-100 px-6 py-5 hover:border-gray-200 hover:bg-gray-50/50 transition-all">
              {/* Date block */}
              <div className="w-12 h-12 border border-gray-100 rounded-2xl flex flex-col items-center justify-center shrink-0 group-hover:border-gray-200 transition-colors">
                <p className="text-[9px] font-bold text-gray-300 uppercase leading-none">
                  {d ? d.toLocaleDateString('en-CA', { month: 'short' }) : ''}
                </p>
                <p style={{ fontSize: '20px', fontWeight: 700 }} className="text-gray-800 leading-none mt-0.5">
                  {d ? d.getDate() : ''}
                </p>
              </div>

              <div className="flex-1 min-w-0">
                <p style={{ fontSize: '16px', fontWeight: 600 }}
                   className="text-gray-800 group-hover:text-gray-600 transition-colors leading-snug truncate mb-1">
                  {name}
                </p>
                <p className="text-[12px] font-semibold" style={{ color: isOpen ? 'var(--y-h)' : '#D1D5DB' }}>
                  {isOpen ? t('신청 가능', 'Open', 'Ouvert') : t('마감', 'Closed', 'Fermé')}
                </p>
              </div>

              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                   className="text-gray-200 group-hover:text-gray-400 shrink-0 transition-colors">
                <polyline points="6,3 11,8 6,13"/>
              </svg>
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
    </section>
  )
}

// ─── Home ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { lang: rawLang } = useLang()
  const lang = rawLang as Lang

  const [tracks,    setTracks]    = useState<ProgramTrack[]>([])
  const [contents,  setContents]  = useState<Content[]>([])
  const [community, setCommunity] = useState<CommunitySubmission[]>([])
  const [submitTag, setSubmitTag] = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([getTracks('program'), getContents()])
      .then(([tr, c]) => {
        setTracks(tr ?? [])
        setContents((c ?? []).map(normalizeContent))
      })
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

  useEffect(() => {
    function onCompose(e: Event) {
      const tag = (e as CustomEvent<{ tag: string }>).detail?.tag ?? 'general'
      setSubmitTag(tag)
    }
    window.addEventListener('hakkyo:open-compose', onCompose)
    return () => window.removeEventListener('hakkyo:open-compose', onCompose)
  }, [])

  function openCompose() {
    trackEvent({ eventName: 'post_create_clicked', targetType: 'home', targetLabel: 'general' })
    setSubmitTag('general')
  }

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
        <div className="w-full max-w-[880px]">

          {/* 1 · Hero */}
          <Hero lang={lang} />

          {/* 2 · Today in HAKKYO */}
          <TodayInHakkyo tracks={tracks} contents={contents} community={community} lang={lang} />

          {/* 3 · Start from where you are */}
          <StartFromHere lang={lang} />

          {/* 4 · Today's Expression */}
          <TodaysExpression />

          {/* 5 · Community Pulse */}
          <CommunityPulse posts={community} onCompose={openCompose} />

          {/* 6 · Programs */}
          <Programs tracks={tracks} lang={lang} />

          <div className="h-20" />
        </div>
      </div>

      <Suspense fallback={null}>
        {submitTag !== null && (
          <CommunitySubmitModal initialTag={submitTag} onClose={() => setSubmitTag(null)} />
        )}
      </Suspense>
    </>
  )
}
