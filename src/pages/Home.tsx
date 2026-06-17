import { useState, useEffect, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { getTracks, getContents, getPublishedCommunityPosts } from '../lib/db'
import { useLang } from '../context/LangContext'
import { normalizeContent } from '../lib/newsContent'
import type { ProgramTrack, Content, CommunitySubmission } from '../types'
import { trackEvent } from '../lib/analytics'
const CommunitySubmitModal = lazy(() => import('../components/CommunitySubmitModal'))
import { LeftSidebar, PageShell } from '../components/PageLayout'

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

// ─── Layout helpers ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-gray-300 mb-4">
      {children}
    </p>
  )
}

function Divider() {
  return <div className="border-t border-gray-100 my-9" />
}

// ─── Section 1: MONTRÉAL TODAY ────────────────────────────────────────────────

function MontrealToday({ lang }: { lang: Lang }) {
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
    <div className="mb-2">
      <p className="text-[11px] text-gray-400 font-medium mb-1 tracking-wide">
        {todayFull(lang)}
      </p>
      <h1 className="text-[26px] font-black text-gray-900 tracking-tight leading-tight mb-4">
        {t('몬트리올, 오늘', 'Montréal, Today', "Montréal, aujourd'hui")}
      </h1>
      <div className="flex items-center gap-4 text-[12px] text-gray-400">
        <span>
          <span className="font-semibold text-gray-600">MTL</span>
          {' '}
          <span className="font-mono">{times.mtl}</span>
        </span>
        <span className="text-gray-200">|</span>
        <span>
          <span className="font-semibold text-gray-600">SEO</span>
          {' '}
          <span className="font-mono">{times.seo}</span>
        </span>
      </div>
    </div>
  )
}

// ─── Section 2: WHAT'S HAPPENING ─────────────────────────────────────────────

type HappeningItem = { label: string; title: string; href: string; time?: string }

function WhatsHappening({ tracks, contents, community, lang }: {
  tracks: ProgramTrack[]
  contents: Content[]
  community: CommunitySubmission[]
  lang: Lang
}) {
  const { t } = useLang()
  const items: HappeningItem[] = []

  // Open programs
  const openCount = tracks.filter(s => s.status === 'open').length
  if (openCount > 0) {
    items.push({
      label: t('프로그램', 'Programs', 'Programmes'),
      title: t(`${openCount}개 프로그램 신청 가능`, `${openCount} programs open for registration`, `${openCount} programmes ouverts`),
      href: '/programs',
    })
  }

  // Upcoming language exchange (within 14 days)
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

  // New guides
  contents.slice(0, 2).forEach(c => {
    const title = cTitle(c, lang)
    if (title) items.push({
      label: t('가이드', 'Guide', 'Guide'),
      title,
      href: `/news/${c.id}`,
      time: c.published_at?.slice(0, 10),
    })
  })

  // New community posts
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
    <div>
      <SectionLabel>{t('지금 무슨 일이 있나요', "What's Happening", 'Ce qui se passe')}</SectionLabel>
      <div className="divide-y divide-gray-50">
        {items.slice(0, 7).map((item, i) => (
          <Link key={i} to={item.href} className="flex items-center gap-3 py-3 group">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
              style={{ background: 'var(--y-l)', color: '#7c5c00' }}
            >
              {item.label}
            </span>
            <span className="text-[13px] text-gray-700 group-hover:text-gray-900 transition-colors leading-snug flex-1 min-w-0 truncate">
              {item.title}
            </span>
            {item.time && (
              <span className="text-[10px] text-gray-300 shrink-0">{item.time}</span>
            )}
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-gray-200 group-hover:text-gray-400 shrink-0 transition-colors">
              <polyline points="6,3 11,8 6,13"/>
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Section 3: QUICK PATHS ───────────────────────────────────────────────────

function IcoArrive() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.5H2"/><path d="M2 10l4.5 1.5L9 5l2 2-2 5 4.5 1.5L17 7l2.5 1-3 7H22"/>
    </svg>
  )
}
function IcoHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  )
}
function IcoPeople() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4"/><circle cx="17" cy="9" r="3"/>
      <path d="M2 20c0-3.314 3.134-6 7-6s7 2.686 7 6"/>
      <path d="M20 20c0-2.21-1.343-4-3-4"/>
    </svg>
  )
}

const QUICK_PATHS = [
  {
    href: '/arriving',
    icon: <IcoArrive />,
    ko: '몬트리올로', en: 'Into Montréal', fr: 'Vers Montréal',
    desc_ko: '도착 전부터 첫 주까지 필요한 모든 것',
    desc_en: 'Everything you need from before arrival to your first week',
    desc_fr: "Tout ce qu'il faut, de l'arrivée à la première semaine",
  },
  {
    href: '/settling',
    icon: <IcoHome />,
    ko: '나만의 공간 찾기', en: 'Finding My Place', fr: 'Trouver ma place',
    desc_ko: '예산부터 계약, 이사까지 단계별 가이드',
    desc_en: 'From budget to lease to moving in',
    desc_fr: 'Du budget au bail, jusqu\'à l\'emménagement',
  },
  {
    href: '/board',
    icon: <IcoPeople />,
    ko: '주변 사람들', en: 'People Around You', fr: 'Les gens autour de vous',
    desc_ko: '몬트리올에 사는 사람들과 연결되기',
    desc_en: 'Connect with people living in Montréal',
    desc_fr: 'Se connecter avec les gens qui vivent à Montréal',
  },
]

function QuickPaths({ lang }: { lang: Lang }) {
  const { t } = useLang()

  return (
    <div>
      <SectionLabel>{t('바로 가기', 'Quick Paths', 'Accès rapide')}</SectionLabel>
      <div className="space-y-2.5">
        {QUICK_PATHS.map(card => (
          <Link
            key={card.href}
            to={card.href}
            className="flex items-center gap-4 border border-gray-150 rounded-2xl px-5 py-4 bg-white hover:border-gray-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all group"
          >
            <span className="text-gray-400 group-hover:text-gray-700 transition-colors shrink-0">
              {card.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-gray-900 group-hover:text-gray-600 transition-colors leading-snug">
                {lang === 'ko' ? card.ko : lang === 'fr' ? card.fr : card.en}
              </p>
              <p className="text-[12px] text-gray-400 leading-snug mt-0.5 truncate">
                {lang === 'ko' ? card.desc_ko : lang === 'fr' ? card.desc_fr : card.desc_en}
              </p>
            </div>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors">
              <polyline points="6,3 11,8 6,13"/>
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Section 4: COMMUNITY PULSE ───────────────────────────────────────────────

function CommunityPulse({ posts, onCompose }: {
  posts: CommunitySubmission[]
  onCompose: () => void
}) {
  const { t } = useLang()
  const show = posts.slice(0, 4)

  return (
    <div>
      <SectionLabel>{t('커뮤니티 펄스', 'Community Pulse', 'Pouls de la communauté')}</SectionLabel>

      {show.length > 0 ? (
        <div className="divide-y divide-gray-50 mb-4">
          {show.map((post, i) => (
            <div key={i} className="flex items-start gap-3 py-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                style={{ background: 'var(--y)', color: '#111' }}
              >
                {(post.author_name ?? '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-gray-700 leading-snug truncate">
                  {post.title ?? post.description?.slice(0, 70)}
                </p>
                <p className="text-[11px] text-gray-300 mt-0.5">
                  {post.author_name ?? t('익명', 'Anonymous', 'Anonyme')}
                  {post.created_at && <span> · {post.created_at.slice(0, 10)}</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <button
        onClick={onCompose}
        className="w-full text-left border border-dashed border-gray-200 rounded-xl px-4 py-3 text-[12px] text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors"
      >
        {t(
          '몬트리올 생활에서 있었던 일을 나눠보세요.',
          'Share something from your life in Montréal.',
          'Partagez quelque chose de votre vie à Montréal.',
        )} +
      </button>

      <Link to="/board" className="inline-block mt-3 text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
        {t('커뮤니티 전체 보기', 'See all community posts', 'Voir tous les posts')} →
      </Link>
    </div>
  )
}

// ─── Section 5: EVERYDAY EXPRESSION ──────────────────────────────────────────

function EverydayExpression() {
  const { t } = useLang()
  const word = DAILY_WORDS[new Date().getDay()]

  return (
    <div>
      <SectionLabel>{t('오늘의 표현', "Today's Expression", "Expression du jour")}</SectionLabel>
      <div className="border border-gray-100 rounded-2xl px-5 py-5 bg-white">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wide mb-3">{word.context}</p>
        <div className="space-y-2.5">
          <p className="text-[17px] font-bold text-gray-900 leading-snug">{word.ko}</p>
          <p className="text-[14px] text-gray-500">{word.en}</p>
          <p className="text-[13px] text-gray-400 italic">{word.fr}</p>
        </div>
        <Link
          to="/phrases"
          className="inline-block mt-4 text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
        >
          {t('더 많은 표현 보기', 'More everyday expressions', "Plus d'expressions")} →
        </Link>
      </div>
    </div>
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
    .slice(0, 5)

  if (upcoming.length === 0) return null

  return (
    <div>
      <SectionLabel>{t('이번 주 프로그램', 'Programs This Week', 'Programmes cette semaine')}</SectionLabel>
      <div className="space-y-1">
        {upcoming.map(s => {
          const name    = tName(s, lang)
          const dateStr = s.start_date?.slice(0, 10) ?? ''
          const isOpen  = s.status === 'open'
          const d       = dateStr ? new Date(dateStr) : null
          return (
            <Link key={s.id} to={`/programs/${s.id}`} className="flex items-center gap-3 py-2.5 group">
              <div className="w-9 h-9 border border-gray-100 rounded-xl flex flex-col items-center justify-center shrink-0">
                <p className="text-[8px] font-bold text-gray-300 uppercase leading-none">
                  {d ? d.toLocaleDateString('en-CA', { month: 'short' }) : ''}
                </p>
                <p className="text-[14px] font-black text-gray-800 leading-none mt-0.5">
                  {d ? d.getDate() : ''}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-800 group-hover:text-gray-600 transition-colors leading-snug truncate">
                  {name}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: isOpen ? 'var(--y-h)' : '#D1D5DB' }}>
                  {isOpen ? t('신청 가능', 'Open', 'Ouvert') : t('마감', 'Closed', 'Fermé')}
                </p>
              </div>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-gray-200 group-hover:text-gray-400 shrink-0 transition-colors">
                <polyline points="6,3 11,8 6,13"/>
              </svg>
            </Link>
          )
        })}
      </div>
      <Link to="/programs" className="inline-block mt-3 text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
        {t('모든 프로그램 보기', 'All programs', 'Tous les programmes')} →
      </Link>
    </div>
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
        <div className="w-4 h-4 border border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <PageShell left={<LeftSidebar lang={lang} />}>

        {/* 1 · Montréal Today */}
        <MontrealToday lang={lang} />

        <Divider />

        {/* 2 · What's Happening */}
        <WhatsHappening tracks={tracks} contents={contents} community={community} lang={lang} />

        <Divider />

        {/* 3 · Quick Paths */}
        <QuickPaths lang={lang} />

        <Divider />

        {/* 4 · Community Pulse */}
        <CommunityPulse posts={community} onCompose={openCompose} />

        <Divider />

        {/* 5 · Everyday Expression */}
        <EverydayExpression />

        <Divider />

        {/* 6 · Programs */}
        <Programs tracks={tracks} lang={lang} />

        <div className="h-10" />
      </PageShell>

      <Suspense fallback={null}>
        {submitTag !== null && (
          <CommunitySubmitModal initialTag={submitTag} onClose={() => setSubmitTag(null)} />
        )}
      </Suspense>
    </>
  )
}
