import { useState, useEffect, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { getTracks, getContents, getPublishedCommunityPosts, getFeaturedContent } from '../lib/db'
import { useLang } from '../context/LangContext'
import { normalizeContent, newsExcerpt, thumbnailUrl } from '../lib/newsContent'
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

const tName  = (s: ProgramTrack, l: Lang) => pickText(l, s.name_ko,  s.name_en,  s.name_fr)
const cTitle = (c: Content, l: Lang)      => pickText(l, c.title_ko, c.title_en, c.title_fr)
const cBody  = (c: Content, l: Lang)      => pickText(l, c.body_ko,  c.body_en,  c.body_fr)

// ─── Daily date display ───────────────────────────────────────────────────────

function todayLabel(lang: Lang): string {
  const now = new Date()
  if (lang === 'ko') {
    return now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  }
  if (lang === 'fr') {
    return now.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }
  return now.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

// ─── Daily phrase (rotates by day of week) ───────────────────────────────────

const DAILY_WORDS: Array<{ ko: string; en: string; fr: string; context: string }> = [
  { ko: '천천히 가도 괜찮아요.',          en: "It's okay to go slowly.",         fr: "C'est bien d'y aller doucement.", context: 'Settling in' },
  { ko: '오늘 어떠세요?',                 en: "How are you today?",               fr: "Comment allez-vous aujourd'hui ?", context: 'Daily greeting' },
  { ko: '몬트리올에 온 걸 환영해요.',      en: 'Welcome to Montréal.',             fr: 'Bienvenue à Montréal.',           context: 'First arrival' },
  { ko: '지하철 타는 법을 알아요?',        en: 'Do you know how to take the metro?', fr: 'Savez-vous prendre le métro ?',  context: 'Transit' },
  { ko: '어디서 왔어요?',                  en: 'Where are you from?',              fr: "D'où venez-vous ?",               context: 'Getting to know each other' },
  { ko: '이 근처에 좋은 카페가 있어요?',   en: 'Is there a good café nearby?',     fr: 'Y a-t-il un bon café par ici ?',  context: 'Neighbourhood life' },
  { ko: '같이 공부할 사람 있어요?',        en: 'Anyone want to study together?',   fr: "Quelqu'un veut étudier ensemble ?", context: 'Community' },
]

function getDailyWord() {
  const day = new Date().getDay()
  return DAILY_WORDS[day]
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-gray-300 mb-4">
      {children}
    </p>
  )
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function Divider() {
  return <div className="border-t border-gray-100 my-8" />
}

// ─── Section 1: TODAY ────────────────────────────────────────────────────────

function TodayHeader({ lang, programCount, communityCount }: {
  lang: Lang
  programCount: number
  communityCount: number
}) {
  const { t } = useLang()

  return (
    <div className="mb-2">
      <p className="text-[11px] text-gray-400 font-medium mb-1">{todayLabel(lang)}</p>
      <h1 className="text-[22px] font-black text-gray-900 tracking-tight leading-tight mb-5">
        {t('몬트리올, 오늘', 'Montréal, Today', "Montréal, aujourd'hui")}
      </h1>
      <div className="grid grid-cols-2 gap-2">
        <div className="border border-gray-100 rounded-xl px-4 py-3 bg-white">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wide mb-1">
            {t('열린 프로그램', 'Programs Open', 'Programmes ouverts')}
          </p>
          <p className="text-[18px] font-black text-gray-900">{programCount}</p>
        </div>
        <div className="border border-gray-100 rounded-xl px-4 py-3 bg-white">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wide mb-1">
            {t('커뮤니티 글', 'Community Posts', 'Posts communauté')}
          </p>
          <p className="text-[18px] font-black text-gray-900">{communityCount}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Section 2: TODAY AT HAKKYO ───────────────────────────────────────────────

function TodayAtHakkyo({ contents, tracks, lang }: {
  contents: Content[]
  tracks: ProgramTrack[]
  lang: Lang
}) {
  const { t } = useLang()

  type UpdateItem = { label: string; title: string; href: string; time: string }
  const items: UpdateItem[] = []

  contents.slice(0, 3).forEach(c => {
    const title = cTitle(c, lang)
    if (title) items.push({
      label: t('새 가이드', 'New guide', 'Nouveau guide'),
      title,
      href: `/news/${c.id}`,
      time: c.published_at?.slice(0, 10) ?? '',
    })
  })

  tracks.slice(0, 2).forEach(s => {
    const name = tName(s, lang)
    if (name) items.push({
      label: t('프로그램', 'Program', 'Programme'),
      title: name,
      href: `/programs/${s.id}`,
      time: s.start_date?.slice(0, 10) ?? '',
    })
  })

  items.sort((a, b) => (b.time > a.time ? 1 : -1))

  if (items.length === 0) return null

  return (
    <div>
      <SectionLabel>{t('오늘의 HAKKYO', 'Today at HAKKYO', "Aujourd'hui chez HAKKYO")}</SectionLabel>
      <div className="space-y-0 divide-y divide-gray-50">
        {items.slice(0, 5).map((item, i) => (
          <Link key={i} to={item.href} className="flex items-start gap-3 py-3 group">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5"
              style={{ background: 'var(--y-l)', color: '#555' }}
            >
              {item.label}
            </span>
            <span className="text-[13px] text-gray-700 group-hover:text-gray-900 transition-colors leading-snug flex-1">
              {item.title}
            </span>
            {item.time && (
              <span className="text-[10px] text-gray-300 shrink-0 mt-0.5">{item.time}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Section 3: TODAY'S STORY ─────────────────────────────────────────────────

function TodaysStory({ featured, lang }: { featured: Content[]; lang: Lang }) {
  const { t } = useLang()
  const story = featured[0]
  if (!story) return null

  const title   = cTitle(story, lang)
  const excerpt = newsExcerpt(cBody(story, lang), 180)
  const thumb   = thumbnailUrl(story)
  const href    = `/news/${story.id}`

  return (
    <div>
      <SectionLabel>{t("오늘의 이야기", "Today's Story", "L'histoire du jour")}</SectionLabel>
      <Link to={href} className="block group">
        <article className="border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-colors">
          {thumb && (
            <div className="w-full h-36 overflow-hidden">
              <img
                src={thumb}
                alt=""
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
          )}
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
              {t('HAKKYO 시티', 'HAKKYO City', 'HAKKYO City')}
            </p>
            <h2 className="text-[15px] font-bold text-gray-900 leading-snug mb-2 group-hover:text-gray-600 transition-colors">
              {title}
            </h2>
            {excerpt && (
              <p className="text-[12px] text-gray-500 leading-[1.7]"
                 style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {excerpt}
              </p>
            )}
            <p className="text-[12px] text-gray-400 mt-3">{t('읽기', 'Read', 'Lire')} →</p>
          </div>
        </article>
      </Link>
    </div>
  )
}

// ─── Section 4: TODAY'S WORDS ─────────────────────────────────────────────────

function TodaysWords() {
  const { t } = useLang()
  const word = getDailyWord()

  return (
    <div>
      <SectionLabel>{t("오늘의 표현", "Today's Words", "Les mots du jour")}</SectionLabel>
      <div className="border border-gray-100 rounded-2xl px-5 py-4 bg-white">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wide mb-3">{word.context}</p>
        <div className="space-y-2">
          <p className="text-[15px] font-bold text-gray-900">{word.ko}</p>
          <p className="text-[13px] text-gray-500">{word.en}</p>
          <p className="text-[13px] text-gray-400 italic">{word.fr}</p>
        </div>
        <Link
          to="/everyday-words"
          className="inline-block mt-4 text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
        >
          {t('더 많은 표현 보기', 'More everyday words', "Plus d'expressions")} →
        </Link>
      </div>
    </div>
  )
}

// ─── Section 5: COMMUNITY CHECK-IN ───────────────────────────────────────────

function CommunityCheckin({ posts, onCompose }: {
  posts: CommunitySubmission[]
  onCompose: () => void
}) {
  const { t } = useLang()
  const post = posts[0]

  return (
    <div>
      <SectionLabel>{t('커뮤니티 체크인', 'Community Check-in', 'Coup de pouce communautaire')}</SectionLabel>
      {post ? (
        <div className="border border-gray-100 rounded-2xl px-5 py-4 bg-white mb-3">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{ background: 'var(--y)', color: '#111' }}
            >
              {(post.author_name ?? '?')[0].toUpperCase()}
            </div>
            <p className="text-[12px] font-semibold text-gray-700">
              {post.author_name ?? t('익명', 'Anonymous', 'Anonyme')}
            </p>
            <p className="text-[11px] text-gray-300 ml-auto">
              {post.created_at?.slice(0, 10) ?? ''}
            </p>
          </div>
          {post.title && (
            <p className="text-[14px] font-semibold text-gray-900 leading-snug mb-1">{post.title}</p>
          )}
          {post.description && (
            <p className="text-[12px] text-gray-500 leading-[1.7]"
               style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {post.description}
            </p>
          )}
        </div>
      ) : null}
      <button
        onClick={onCompose}
        className="w-full text-left border border-dashed border-gray-200 rounded-xl px-4 py-3 text-[12px] text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors"
      >
        {t('오늘 몬트리올 생활에서 있었던 일을 나눠보세요.', 'Share something from your life in Montréal today.', "Partagez quelque chose de votre vie à Montréal aujourd'hui.")} +
      </button>
    </div>
  )
}

// ─── Section 6: WHAT PEOPLE ARE ASKING ───────────────────────────────────────

function WhatPeopleAreAsking({ posts, onCompose }: {
  posts: CommunitySubmission[]
  onCompose: () => void
}) {
  const { t } = useLang()
  const questions = posts.filter(p => p.type === 'question' || p.type === 'help').slice(0, 4)
  const show = questions.length > 0 ? questions : posts.slice(1, 5)

  if (show.length === 0) return null

  return (
    <div>
      <SectionLabel>{t('요즘 사람들이 묻는 것', 'What People Are Asking', 'Ce que les gens demandent')}</SectionLabel>
      <div className="space-y-0 divide-y divide-gray-50">
        {show.map((post, i) => (
          <div key={i} className="py-3">
            <p className="text-[13px] text-gray-700 leading-snug mb-0.5">
              {post.title ?? post.description?.slice(0, 80)}
            </p>
            <p className="text-[11px] text-gray-300">
              {post.author_name ?? t('익명', 'Anonymous', 'Anonyme')}
            </p>
          </div>
        ))}
      </div>
      <button
        onClick={onCompose}
        className="mt-3 text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
      >
        {t('질문 남기기', 'Ask a question', 'Poser une question')} →
      </button>
    </div>
  )
}

// ─── Section 7: THIS WEEK ─────────────────────────────────────────────────────

function ThisWeek({ tracks, lang }: { tracks: ProgramTrack[]; lang: Lang }) {
  const { t } = useLang()

  const upcoming = tracks
    .filter(s => {
      if (!s.start_date) return false
      const start = new Date(s.start_date)
      const now   = new Date()
      const diff  = (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      return diff >= -1 && diff <= 14
    })
    .slice(0, 4)

  if (upcoming.length === 0) return null

  return (
    <div>
      <SectionLabel>{t('이번 주', 'This Week', 'Cette semaine')}</SectionLabel>
      <div className="space-y-2">
        {upcoming.map(s => {
          const name      = tName(s, lang)
          const dateStr   = s.start_date?.slice(0, 10) ?? ''
          const isOpen    = s.status === 'open'
          return (
            <Link key={s.id} to={`/programs/${s.id}`} className="flex items-start gap-3 group">
              <div className="shrink-0 mt-0.5">
                <div className="w-8 h-8 border border-gray-100 rounded-lg flex flex-col items-center justify-center">
                  <p className="text-[8px] font-bold text-gray-400 uppercase leading-none">
                    {dateStr ? new Date(dateStr).toLocaleDateString('en-CA', { month: 'short' }) : ''}
                  </p>
                  <p className="text-[13px] font-black text-gray-900 leading-none">
                    {dateStr ? new Date(dateStr).getDate() : ''}
                  </p>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-800 group-hover:text-gray-600 transition-colors leading-snug truncate">
                  {name}
                </p>
                <p className="text-[11px] text-gray-300 mt-0.5">
                  {isOpen
                    ? t('신청 가능', 'Open for registration', 'Inscriptions ouvertes')
                    : t('마감', 'Closed', 'Fermé')}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
      <Link
        to="/programs"
        className="inline-block mt-4 text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
      >
        {t('모든 프로그램', 'All programs', 'Tous les programmes')} →
      </Link>
    </div>
  )
}

// ─── Section 8: EXPLORE THE CITY ─────────────────────────────────────────────

const EXPLORE_CARDS: Array<{ ko: string; en: string; fr: string; desc_ko: string; desc_en: string; desc_fr: string; href: string }> = [
  {
    ko: '첫 번째 발걸음',    en: 'First Steps',          fr: 'Premiers pas',
    desc_ko: '도착 전 준비부터 첫 주까지',
    desc_en: 'From prep to your first week',
    desc_fr: 'De la préparation à votre première semaine',
    href: '/arriving',
  },
  {
    ko: '자리 잡기',          en: 'Finding My Place',   fr: 'Trouver ma place',
    desc_ko: '집 구하기, 동네 고르기',
    desc_en: 'Finding housing and a neighbourhood',
    desc_fr: 'Logement et quartier',
    href: '/settling',
  },
  {
    ko: '주변 사람들',        en: 'People Around You',    fr: 'Les gens autour de vous',
    desc_ko: '커뮤니티와 연결되기',
    desc_en: 'Connecting with the community',
    desc_fr: 'Se connecter à la communauté',
    href: '/people',
  },
  {
    ko: '새로운 기회',        en: 'New Opportunities',    fr: 'Nouvelles opportunités',
    desc_ko: '일, 공부, 성장',
    desc_en: 'Work, study, growth',
    desc_fr: 'Travail, études, croissance',
    href: '/opportunities',
  },
  {
    ko: '일상 언어',          en: 'Everyday Words',       fr: 'Mots du quotidien',
    desc_ko: '매일 쓰는 표현들',
    desc_en: 'Expressions for daily life',
    desc_fr: "Expressions pour la vie de tous les jours",
    href: '/everyday-words',
  },
  {
    ko: '몬트리올에서 살기', en: 'Life in Montréal',      fr: 'Vivre à Montréal',
    desc_ko: '문화, 계절, 일상',
    desc_en: 'Culture, seasons, daily life',
    desc_fr: 'Culture, saisons, vie quotidienne',
    href: '/life',
  },
]

function ExploreTheCity({ lang }: { lang: Lang }) {
  const { t } = useLang()

  return (
    <div>
      <SectionLabel>{t('도시 탐색', 'Explore the City', 'Explorer la ville')}</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        {EXPLORE_CARDS.map(card => (
          <Link
            key={card.href}
            to={card.href}
            className="border border-gray-100 rounded-xl px-4 py-3 bg-white hover:border-gray-300 transition-colors group"
          >
            <p className="text-[13px] font-bold text-gray-900 group-hover:text-gray-600 transition-colors leading-snug mb-1">
              {lang === 'ko' ? card.ko : lang === 'fr' ? card.fr : card.en}
            </p>
            <p className="text-[11px] text-gray-400 leading-snug">
              {lang === 'ko' ? card.desc_ko : lang === 'fr' ? card.desc_fr : card.desc_en}
            </p>
          </Link>
        ))}
      </div>
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
  const [featured,  setFeatured]  = useState<Content[]>([])
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

    getFeaturedContent()
      .then(fc => setFeatured((fc ?? []).map(normalizeContent)))
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

  const openTracks = tracks.filter(s => s.status === 'open')

  return (
    <>
      <PageShell left={<LeftSidebar lang={lang} />}>
        {/* Section 1: TODAY */}
        <TodayHeader lang={lang} programCount={openTracks.length} communityCount={community.length} />

        <Divider />

        {/* Section 2: TODAY AT HAKKYO */}
        <TodayAtHakkyo contents={contents} tracks={tracks} lang={lang} />

        <Divider />

        {/* Section 3: TODAY'S STORY */}
        <TodaysStory featured={featured.length > 0 ? featured : contents} lang={lang} />

        <Divider />

        {/* Section 4: TODAY'S WORDS */}
        <TodaysWords />

        <Divider />

        {/* Section 5: COMMUNITY CHECK-IN */}
        <CommunityCheckin posts={community} onCompose={openCompose} />

        <Divider />

        {/* Section 6: WHAT PEOPLE ARE ASKING */}
        <WhatPeopleAreAsking posts={community} onCompose={openCompose} />

        <Divider />

        {/* Section 7: THIS WEEK */}
        <ThisWeek tracks={tracks} lang={lang} />

        <Divider />

        {/* Section 8: EXPLORE THE CITY */}
        <ExploreTheCity lang={lang} />

        <div className="h-8" />
      </PageShell>

      <Suspense fallback={null}>
        {submitTag !== null && (
          <CommunitySubmitModal initialTag={submitTag} onClose={() => setSubmitTag(null)} />
        )}
      </Suspense>
    </>
  )
}
