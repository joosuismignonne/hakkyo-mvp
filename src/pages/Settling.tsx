import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'

// ─── i18n helper ─────────────────────────────────────────────────────────────

type Tri = { ko: string; en: string; fr: string }
function tri(f: Tri, lang: string): string {
  return lang === 'ko' ? f.ko : lang === 'fr' ? f.fr : f.en
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
      {children}
    </p>
  )
}

// ─── Section 2 — Start Here ───────────────────────────────────────────────────

const START_CARDS: Array<{ icon: string; title: Tri; desc: Tri }> = [
  {
    icon: '📦',
    title: { ko: '이사의 날', en: 'Moving Day', fr: 'Jour du déménagement' },
    desc:  {
      ko:  '왜 몬트리올에는 도시 전체가 동시에 이사를 할까요?',
      en:  'Why does Montréal have a city-wide moving season?',
      fr:  "Pourquoi Montréal a-t-il une saison de déménagement à l'échelle de la ville ?",
    },
  },
  {
    icon: '📄',
    title: { ko: '퀘벡 임대차 계약 이해하기', en: 'Understanding Québec Leases', fr: 'Comprendre les baux québécois' },
    desc:  {
      ko:  '임대차 계약, 양도, 갱신, 전대차를 쉽게 설명합니다.',
      en:  'Lease, transfer, renewal, sublet explained simply.',
      fr:  'Bail, cession, renouvellement et sous-location expliqués simplement.',
    },
  },
  {
    icon: '⚠️',
    title: { ko: '주거 사기 주의', en: 'Housing Scams', fr: 'Arnaques immobilières' },
    desc:  {
      ko:  '페이스북 마켓플레이스의 흔한 사기 유형과 예방법.',
      en:  'Common Facebook Marketplace scams and how to avoid them.',
      fr:  'Arnaques courantes sur Facebook Marketplace et comment les éviter.',
    },
  },
  {
    icon: '✅',
    title: { ko: '첫 아파트 체크리스트', en: 'First Apartment Checklist', fr: 'Liste pour le premier appartement' },
    desc:  {
      ko:  '임대 계약서에 서명하기 전에 확인해야 할 모든 것.',
      en:  'Everything to check before signing a lease.',
      fr:  'Tout ce qu\'il faut vérifier avant de signer un bail.',
    },
  },
]

// ─── Section 3 — Neighbourhoods ───────────────────────────────────────────────

interface Hood {
  name: string
  desc: Tri
  tags: Tri[]
  color: string
}

const HOODS: Hood[] = [
  {
    name: 'Plateau Mont-Royal',
    color: '#F0F4FF',
    desc: {
      ko: '예술, 카페, 그리고 몬트리올다운 산책로.',
      en: 'Arts, cafés, and the most walkable streets in Montréal.',
      fr: 'Arts, cafés et les rues les plus animées de Montréal.',
    },
    tags: [
      { ko: '카페', en: 'Cafés', fr: 'Cafés' },
      { ko: '예술', en: 'Arts', fr: 'Arts' },
      { ko: '도보 생활', en: 'Walkable', fr: 'À pied' },
    ],
  },
  {
    name: 'Verdun',
    color: '#F0FBF4',
    desc: {
      ko: '강변을 따라 걷고, 조용한 동네 삶을 즐기는 곳.',
      en: 'Riverside walks, families, and a quieter pace of life.',
      fr: 'Bords du fleuve, familles et un rythme de vie plus calme.',
    },
    tags: [
      { ko: '강변', en: 'Riverside', fr: 'Bord du fleuve' },
      { ko: '가족 친화', en: 'Families', fr: 'Familles' },
      { ko: '조용함', en: 'Quiet', fr: 'Calme' },
    ],
  },
  {
    name: 'Downtown',
    color: '#FFF8F0',
    desc: {
      ko: '지하철, 편의시설, 학교가 밀집된 몬트리올의 중심.',
      en: 'Transit, convenience, and the heart of student life.',
      fr: 'Transports, commodités et vie étudiante au cœur de la ville.',
    },
    tags: [
      { ko: '교통', en: 'Transit', fr: 'Transports' },
      { ko: '편의시설', en: 'Convenience', fr: 'Commodités' },
      { ko: '학생', en: 'Students', fr: 'Étudiants' },
    ],
  },
  {
    name: 'Côte-des-Neiges',
    color: '#FDF0FF',
    desc: {
      ko: '다문화 커뮤니티, 합리적인 임대료, 두 대학 인근.',
      en: 'Multicultural, affordable, and close to two universities.',
      fr: 'Multiculturel, abordable et proche de deux universités.',
    },
    tags: [
      { ko: '다문화', en: 'Multicultural', fr: 'Multiculturel' },
      { ko: '저렴한', en: 'Affordable', fr: 'Abordable' },
      { ko: '대학', en: 'Universities', fr: 'Universités' },
    ],
  },
  {
    name: 'Villeray',
    color: '#FFFFF0',
    desc: {
      ko: '로컬 분위기, 공원, 그리고 진짜 몬트리올 커뮤니티.',
      en: 'Local atmosphere, parks, and genuine community feel.',
      fr: "Atmosphère locale, parcs et véritable esprit de communauté.",
    },
    tags: [
      { ko: '로컬 분위기', en: 'Local', fr: 'Local' },
      { ko: '공원', en: 'Parks', fr: 'Parcs' },
      { ko: '커뮤니티', en: 'Community', fr: 'Communauté' },
    ],
  },
]

// ─── Section 4 — City Stories ─────────────────────────────────────────────────

const STORIES: Array<{ tag: Tri; title: Tri; teaser: Tri }> = [
  {
    tag:    { ko: '동네 이야기', en: 'Neighbourhood', fr: 'Quartier' },
    title:  {
      ko: '왜 사람들은 아파트 근처 Lululemon을 찾을까요?',
      en: 'Why do people look for a Lululemon near their apartment?',
      fr: 'Pourquoi les gens cherchent-ils un Lululemon près de leur appartement ?',
    },
    teaser: {
      ko: '몬트리올에서 동네를 고를 때 Lululemon이 어떤 역할을 하는지 알고 계셨나요?',
      en: 'A store can tell you more about a neighbourhood than a map.',
      fr: 'Un magasin peut en dire plus sur un quartier qu\'une carte.',
    },
  },
  {
    tag:    { ko: '몬트리올 역사', en: 'History', fr: 'Histoire' },
    title:  {
      ko: '몬트리올 이사의 날의 역사',
      en: 'The history of Montréal Moving Day',
      fr: "L'histoire du jour du déménagement à Montréal",
    },
    teaser: {
      ko: '7월 1일, 몬트리올 전체가 동시에 이사를 합니다. 왜 그럴까요?',
      en: 'Every year on July 1st, the whole city moves at once. Here is why.',
      fr: 'Chaque année le 1er juillet, toute la ville déménage en même temps. Voici pourquoi.',
    },
  },
  {
    tag:    { ko: '실용 가이드', en: 'Guide', fr: 'Guide' },
    title:  {
      ko: '몬트리올에서 임대하기 전에 아무도 알려주지 않는 것들',
      en: 'Things nobody tells you before renting in Montréal',
      fr: 'Ce que personne ne vous dit avant de louer à Montréal',
    },
    teaser: {
      ko: '계약서에 서명하기 전에 알았더라면 좋았을 것들.',
      en: 'The things you wish someone had told you before you signed.',
      fr: 'Les choses que vous auriez aimé savoir avant de signer.',
    },
  },
  {
    tag:    { ko: '동네 이야기', en: 'Neighbourhood', fr: 'Quartier' },
    title:  {
      ko: '왜 어떤 동네들은 완전히 다른 느낌일까요?',
      en: 'Why some neighbourhoods feel completely different',
      fr: 'Pourquoi certains quartiers semblent complètement différents',
    },
    teaser: {
      ko: '같은 도시 안에서도 완전히 다른 세계가 존재합니다.',
      en: 'A 15-minute walk can feel like crossing into a different city.',
      fr: 'Une marche de 15 minutes peut sembler traverser une autre ville.',
    },
  },
]

// ─── Section 5 — Checklist ────────────────────────────────────────────────────

const SETTLING_KEY = 'hakkyo_settling'

const CHECKLIST_ITEMS: Array<{ id: string } & Tri> = [
  { id: 'budget',     ko: '예산 설정',           en: 'Set budget',                 fr: 'Définir le budget'            },
  { id: 'hood',       ko: '동네 선택',           en: 'Choose neighbourhood',        fr: 'Choisir le quartier'          },
  { id: 'visits',     ko: '아파트 방문 일정 잡기', en: 'Schedule apartment visits',  fr: 'Planifier les visites'        },
  { id: 'lease',      ko: '임대차 계약 내용 확인', en: 'Verify lease details',       fr: 'Vérifier les détails du bail' },
  { id: 'hydro',      ko: 'Hydro-Québec 계좌 개설', en: 'Open Hydro-Québec account', fr: 'Ouvrir un compte Hydro-Québec' },
  { id: 'internet',   ko: '인터넷 설치',          en: 'Set up internet',            fr: 'Installer internet'           },
  { id: 'insurance',  ko: '세입자 보험 가입',     en: 'Get tenant insurance',       fr: 'Souscrire une assurance locataire' },
  { id: 'transit',    ko: '현지 교통 익히기',     en: 'Learn local transportation', fr: 'Apprendre les transports locaux' },
]

// ─── Section 6 — Community Board placeholders ─────────────────────────────────

interface BoardPost {
  category: Tri; title: Tri; meta: Tri
}

const BOARD_POSTS: BoardPost[] = [
  {
    category: { ko: '주거', en: 'Housing', fr: 'Logement' },
    title:    { ko: 'Mile End 1BR 찾고 있어요 — 9월부터', en: 'Looking for 1BR in Mile End — September move-in', fr: 'Cherche 1 chambre à Mile End — dès septembre' },
    meta:     { ko: '2일 전', en: '2 days ago', fr: 'il y a 2 jours' },
  },
  {
    category: { ko: '룸메이트', en: 'Roommates', fr: 'Colocataires' },
    title:    { ko: 'Plateau에서 함께 살 룸메이트 찾습니다', en: 'Looking for roommate in Plateau — 2BR available', fr: 'Cherche colocataire sur le Plateau — 2 ch. disponible' },
    meta:     { ko: '3일 전', en: '3 days ago', fr: 'il y a 3 jours' },
  },
  {
    category: { ko: '가구', en: 'Furniture', fr: 'Meubles' },
    title:    { ko: 'IKEA 책상/의자 무료 나눔 — 7월 1일 이전에 가져가세요', en: 'Free IKEA desk + chair — must take before July 1', fr: 'Bureau + chaise IKEA gratuits — à prendre avant le 1er juillet' },
    meta:     { ko: '5일 전', en: '5 days ago', fr: 'il y a 5 jours' },
  },
  {
    category: { ko: '이사 도움', en: 'Moving Help', fr: 'Aide au déménagement' },
    title:    { ko: '이사 도와주실 분 찾습니다 — 교통비 + 식사 제공', en: 'Need moving help — covering transport + meals', fr: "Besoin d'aide pour déménager — transport + repas offerts" },
    meta:     { ko: '1주 전', en: '1 week ago', fr: 'il y a 1 semaine' },
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  Housing: '#EFF6FF', Logement: '#EFF6FF', '주거': '#EFF6FF',
  Roommates: '#F0FDF4', Colocataires: '#F0FDF4', '룸메이트': '#F0FDF4',
  Furniture: '#FFF7ED', Meubles: '#FFF7ED', '가구': '#FFF7ED',
  'Moving Help': '#FDF4FF', 'Aide au déménagement': '#FDF4FF', '이사 도움': '#FDF4FF',
}
const CATEGORY_TEXT: Record<string, string> = {
  Housing: '#1D4ED8', Logement: '#1D4ED8', '주거': '#1D4ED8',
  Roommates: '#15803D', Colocataires: '#15803D', '룸메이트': '#15803D',
  Furniture: '#C2410C', Meubles: '#C2410C', '가구': '#C2410C',
  'Moving Help': '#7E22CE', 'Aide au déménagement': '#7E22CE', '이사 도움': '#7E22CE',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Settling() {
  const { lang, t } = useLang()

  const [checked, setChecked] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(SETTLING_KEY) ?? '[]')) }
    catch { return new Set() }
  })

  useEffect(() => {
    try { localStorage.setItem(SETTLING_KEY, JSON.stringify([...checked])) }
    catch {}
  }, [checked])

  function toggle(id: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const pct = Math.round((checked.size / CHECKLIST_ITEMS.length) * 100)

  return (
    <div className="w-full min-h-screen bg-white pb-24">
      <div className="max-w-[720px] mx-auto px-4 py-8 space-y-12">

        {/* ── SECTION 1: HERO ── */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/>
            </svg>
            <h1 className="text-[24px] font-bold text-gray-900">
              {t('집 구하기', 'Finding Home', 'Trouver un Logement')}
            </h1>
          </div>
          <p className="text-[14px] text-gray-500 leading-relaxed mb-5">
            {t(
              '집을 구하는 것부터 몬트리올을 나의 동네로 만드는 과정까지.',
              'Apartment hunting, neighbourhood guides, leases, roommates, and everyday life in Montréal.',
              'Trouver un logement, comprendre les quartiers, les baux et la vie quotidienne à Montréal.',
            )}
          </p>
          <div className="border border-gray-200 rounded-2xl px-5 py-4 bg-white">
            <p className="text-[14px] text-gray-700 leading-relaxed">
              {t(
                '새로운 도시로 이사하는 것은 단순히 아파트를 구하는 것 이상입니다.\n도시가 어떻게 작동하는지 배우는 과정입니다.',
                'Moving to a new city is more than finding an apartment.\nIt is learning how a city works.',
                "S'installer dans une nouvelle ville, c'est plus que trouver un appartement.\nC'est apprendre comment une ville fonctionne.",
              )}
            </p>
          </div>
        </section>

        {/* ── SECTION 2: START HERE ── */}
        <section>
          <SectionLabel>{t('처음 몬트리올에 왔다면', 'Start Here', 'Commencer ici')}</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {START_CARDS.map((card, i) => (
              <div key={i} className="border border-gray-200 rounded-2xl px-4 py-4 bg-white flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[18px]">{card.icon}</span>
                    <span className="text-[14px] font-bold text-gray-900">{tri(card.title, lang)}</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 shrink-0 mt-0.5">
                    {t('준비 중', 'Coming Soon', 'Bientôt')}
                  </span>
                </div>
                <p className="text-[12px] text-gray-500 leading-snug">{tri(card.desc, lang)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 3: NEIGHBOURHOOD GUIDE ── */}
        <section>
          <SectionLabel>{t('몬트리올 동네 가이드', 'Neighbourhood Guide', 'Guide des quartiers')}</SectionLabel>
          <p className="text-[13px] text-gray-500 mb-4">
            {t(
              '몬트리올의 모든 동네는 서로 다른 도시처럼 느껴집니다.',
              'Every neighbourhood feels like a different city.',
              'Chaque quartier ressemble à une ville différente.',
            )}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {HOODS.map(hood => (
              <div
                key={hood.name}
                className="border border-gray-200 rounded-2xl overflow-hidden bg-white"
              >
                {/* placeholder image area */}
                <div
                  className="h-[72px] w-full flex items-center justify-center"
                  style={{ background: hood.color }}
                >
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                    {hood.name}
                  </span>
                </div>
                <div className="px-4 py-3">
                  <p className="text-[13px] font-bold text-gray-900 mb-1">{hood.name}</p>
                  <p className="text-[12px] text-gray-500 leading-snug mb-2">{tri(hood.desc, lang)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {hood.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {tri(tag, lang)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 4: HAKKYO CITY STORIES ── */}
        <section>
          <SectionLabel>HAKKYO CITY</SectionLabel>
          <p className="text-[13px] text-gray-500 mb-4">
            {t(
              '몬트리올이 어떻게 작동하는지 이해하는 데 도움이 되는 이야기들.',
              'Stories that help explain how Montréal works.',
              'Des histoires qui aident à comprendre comment fonctionne Montréal.',
            )}
          </p>
          <div className="grid grid-cols-1 gap-3">
            {STORIES.map((story, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-2xl px-4 py-4 bg-white flex items-start gap-4"
              >
                {/* number badge */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 mt-0.5"
                  style={{ background: 'var(--y)', color: '#111' }}
                >
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                      {tri(story.tag, lang)}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                      {t('준비 중', 'Coming Soon', 'Bientôt')}
                    </span>
                  </div>
                  <p className="text-[14px] font-bold text-gray-900 leading-snug mb-1">
                    {tri(story.title, lang)}
                  </p>
                  <p className="text-[12px] text-gray-500 leading-snug">
                    {tri(story.teaser, lang)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 5: CHECKLIST ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>{t('몬트리올 정착 체크리스트', 'Settlement Checklist', 'Liste de règlement')}</SectionLabel>
            <div className="text-right">
              <span className="text-[18px] font-bold text-gray-900">{pct}%</span>
              <p className="text-[10px] text-gray-400">{t('완료', 'done', 'fait')}</p>
            </div>
          </div>

          <div className="h-1 bg-gray-100 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: 'var(--y)' }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {CHECKLIST_ITEMS.map(item => {
              const done = checked.has(item.id)
              return (
                <button
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${done ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                >
                  <span
                    className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                    style={done ? { background: 'var(--y)', borderColor: 'var(--y)' } : { borderColor: '#D1D5DB' }}
                  >
                    {done && (
                      <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="2,6 5,9 10,3"/>
                      </svg>
                    )}
                  </span>
                  <span className={`text-[13px] font-medium ${done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {tri(item, lang)}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── SECTION 6: COMMUNITY BOARD ── */}
        <section>
          <div className="flex items-center justify-between mb-1">
            <SectionLabel>{t('커뮤니티 주거 게시판', 'Community Housing Board', 'Tableau de logement communautaire')}</SectionLabel>
          </div>
          <p className="text-[13px] text-gray-500 mb-4">
            {t(
              '커뮤니티가 만드는 주거, 룸메이트, 가구, 이사 도움 게시판.',
              'Community-driven housing, roommate, furniture, and moving posts.',
              'Annonces de logement, colocataires, meubles et aide au déménagement.',
            )}
          </p>

          {/* category chips */}
          <div className="flex gap-2 flex-wrap mb-4">
            {(['Housing', 'Roommates', 'Furniture', 'Moving Help'] as const).map(cat => {
              const labelMap: Record<string, Tri> = {
                Housing:      { ko: '주거',     en: 'Housing',      fr: 'Logement'           },
                Roommates:    { ko: '룸메이트', en: 'Roommates',    fr: 'Colocataires'       },
                Furniture:    { ko: '가구',     en: 'Furniture',    fr: 'Meubles'            },
                'Moving Help':{ ko: '이사 도움', en: 'Moving Help', fr: 'Aide au déménagement'},
              }
              return (
                <span
                  key={cat}
                  className="text-[11px] font-semibold px-3 py-1 rounded-full border border-gray-200 text-gray-500 bg-white"
                >
                  {tri(labelMap[cat], lang)}
                </span>
              )
            })}
          </div>

          <div className="space-y-2 mb-4">
            {BOARD_POSTS.map((post, i) => {
              const catKey = post.category.en
              return (
                <div key={i} className="border border-gray-200 rounded-2xl px-4 py-3 bg-white flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: CATEGORY_COLORS[catKey] ?? '#F3F4F6',
                          color: CATEGORY_TEXT[catKey] ?? '#374151',
                        }}
                      >
                        {tri(post.category, lang)}
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-gray-800 leading-snug">{tri(post.title, lang)}</p>
                  </div>
                  <p className="text-[11px] text-gray-400 shrink-0 mt-0.5">{tri(post.meta, lang)}</p>
                </div>
              )
            })}
          </div>

          <Link
            to="/board"
            className="flex items-center justify-center gap-2 w-full border border-gray-200 rounded-2xl py-3 text-[13px] font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            + {t('게시물 공유하기', 'Share a Post', 'Partager une annonce')}
          </Link>
        </section>

      </div>
    </div>
  )
}
