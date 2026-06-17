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
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
      {children}
    </p>
  )
}

// ─── Checklist ────────────────────────────────────────────────────────────────

const SETTLING_KEY = 'hakkyo_settling'

const CHECKLIST_ITEMS: Array<{ id: string } & Tri> = [
  { id: 'budget',    ko: '예산 설정',              en: 'Set budget',                  fr: 'Définir le budget'             },
  { id: 'hood',      ko: '동네 선택',              en: 'Choose neighbourhood',         fr: 'Choisir le quartier'           },
  { id: 'visits',    ko: '아파트 방문 일정 잡기',   en: 'Schedule apartment visits',   fr: 'Planifier les visites'         },
  { id: 'lease',     ko: '임대차 계약 내용 확인',   en: 'Verify lease details',        fr: 'Vérifier les détails du bail'  },
  { id: 'hydro',     ko: 'Hydro-Québec 계좌 개설', en: 'Open Hydro-Québec account',   fr: 'Ouvrir un compte Hydro-Québec' },
  { id: 'internet',  ko: '인터넷 설치',             en: 'Set up internet',             fr: 'Installer internet'            },
  { id: 'insurance', ko: '세입자 보험 가입',        en: 'Get tenant insurance',        fr: 'Souscrire une assurance locataire' },
  { id: 'transit',   ko: '현지 교통 익히기',        en: 'Learn local transportation',  fr: 'Apprendre les transports locaux' },
]

// ─── Start Here cards ─────────────────────────────────────────────────────────

const START_CARDS: Array<{ category: Tri; title: Tri; desc: Tri; slug: string }> = [
  {
    slug: 'moving-day',
    category: { ko: '이사 문화', en: 'Moving Culture', fr: 'Culture du déménagement' },
    title:    { ko: '이사의 날',  en: 'Moving Day',     fr: 'Jour du déménagement'   },
    desc:     {
      ko: '몬트리올에서는 왜 7월 1일에 많은 사람들이 동시에 이사를 할까요?',
      en: 'Why does Montréal have a city-wide moving season on July 1st?',
      fr: "Pourquoi Montréal a-t-il une saison de déménagement le 1er juillet ?",
    },
  },
  {
    slug: 'quebec-lease',
    category: { ko: '임대 계약', en: 'Leases', fr: 'Baux' },
    title:    { ko: '퀘벡 임대차 계약 이해하기', en: 'Understanding Québec Leases', fr: 'Comprendre les baux québécois' },
    desc:     {
      ko: 'Lease, 양도, 갱신, 전대차를 처음 보는 사람도 이해할 수 있게 정리합니다.',
      en: 'Lease, transfer, renewal, sublet — explained for first-timers.',
      fr: 'Bail, cession, renouvellement et sous-location expliqués simplement.',
    },
  },
  {
    slug: 'housing-scams',
    category: { ko: '안전', en: 'Safety', fr: 'Sécurité' },
    title:    { ko: '주거 사기 주의', en: 'Housing Scams', fr: 'Arnaques immobilières' },
    desc:     {
      ko: '페이스북 마켓플레이스에서 자주 보이는 사기 유형과 계약 전 확인해야 할 것들.',
      en: 'Common Facebook Marketplace scams and what to check before signing.',
      fr: 'Arnaques courantes et vérifications indispensables avant de signer.',
    },
  },
  {
    slug: 'first-apartment-checklist',
    category: { ko: '체크리스트', en: 'Checklist', fr: 'Liste de contrôle' },
    title:    { ko: '첫 아파트 체크리스트', en: 'First Apartment Checklist', fr: 'Liste pour le premier appartement' },
    desc:     {
      ko: '계약서에 서명하기 전에 집 안에서 반드시 확인해야 할 기본 항목들.',
      en: 'Everything to inspect inside an apartment before signing the lease.',
      fr: "Tout ce qu'il faut vérifier à l'intérieur avant de signer.",
    },
  },
]

// ─── Neighbourhoods ───────────────────────────────────────────────────────────

const HOODS: Array<{ label: string; name: string; desc: Tri; tags: Tri[]; color: string }> = [
  {
    label: 'PLATEAU MONT-ROYAL',
    name:  'Plateau Mont-Royal',
    color: '#F0F4FF',
    desc:  { ko: '예술, 카페, 그리고 몬트리올다운 산책로.', en: 'Arts, cafés, and the most walkable streets in Montréal.', fr: 'Arts, cafés et les rues les plus animées de Montréal.' },
    tags:  [
      { ko: '카페', en: 'Cafés', fr: 'Cafés' },
      { ko: '예술', en: 'Arts', fr: 'Arts' },
      { ko: '도보 생활', en: 'Walkable', fr: 'À pied' },
    ],
  },
  {
    label: 'VERDUN',
    name:  'Verdun',
    color: '#F0FBF4',
    desc:  { ko: '강변을 따라 걷고, 조용한 동네 삶을 즐기는 곳.', en: 'Riverside walks, families, and a quieter pace of life.', fr: 'Bords du fleuve, familles et un rythme de vie plus calme.' },
    tags:  [
      { ko: '강변', en: 'Riverside', fr: 'Bord du fleuve' },
      { ko: '가족 친화', en: 'Families', fr: 'Familles' },
      { ko: '조용함', en: 'Quiet', fr: 'Calme' },
    ],
  },
  {
    label: 'DOWNTOWN',
    name:  'Downtown',
    color: '#FFF8F0',
    desc:  { ko: '학교, 일, 교통이 가까운 가장 실용적인 선택지.', en: 'Transit, work, and school — the most practical option.', fr: 'Transports, travail et universités — l\'option la plus pratique.' },
    tags:  [
      { ko: '교통', en: 'Transit', fr: 'Transports' },
      { ko: '학생', en: 'Students', fr: 'Étudiants' },
      { ko: '편리함', en: 'Convenient', fr: 'Pratique' },
    ],
  },
  {
    label: 'CÔTE-DES-NEIGES',
    name:  'Côte-des-Neiges',
    color: '#FDF0FF',
    desc:  { ko: '다양한 문화와 학생, 이민자가 함께 사는 동네.', en: 'Multicultural, affordable, and close to two universities.', fr: 'Multiculturel, abordable et proche de deux universités.' },
    tags:  [
      { ko: '다문화', en: 'Multicultural', fr: 'Multiculturel' },
      { ko: '대학가', en: 'Universities', fr: 'Universités' },
      { ko: '생활비', en: 'Affordable', fr: 'Abordable' },
    ],
  },
  {
    label: 'VILLERAY',
    name:  'Villeray',
    color: '#FFFFF0',
    desc:  { ko: '로컬 시장, 공원, 조용한 커뮤니티가 있는 동네.', en: 'Local markets, parks, and a quiet community feel.', fr: 'Marchés locaux, parcs et ambiance communautaire.' },
    tags:  [
      { ko: '로컬', en: 'Local', fr: 'Local' },
      { ko: '공원', en: 'Parks', fr: 'Parcs' },
      { ko: '커뮤니티', en: 'Community', fr: 'Communauté' },
    ],
  },
]

// ─── HAKKYO CITY stories ──────────────────────────────────────────────────────

const STORIES: Array<{ num: string; category: Tri; title: Tri; desc: Tri; slug: string }> = [
  {
    num: '01',
    slug: 'lululemon-neighbourhood',
    category: { ko: '도시 생활', en: 'City Life', fr: 'Vie urbaine' },
    title:    { ko: '왜 몬트리올에서는 집 근처 룰루레몬을 볼까?', en: 'Why do people look for a Lululemon near their apartment?', fr: 'Pourquoi chercher un Lululemon près de chez soi ?' },
    desc:     { ko: '어떤 브랜드가 있다는 것은 단순한 매장이 아니라, 동네의 분위기와 생활 반경을 보여주는 신호가 되기도 합니다.', en: 'A store can tell you more about a neighbourhood than a map.', fr: "Un magasin peut en dire plus sur un quartier qu'une carte." },
  },
  {
    num: '02',
    slug: 'moving-day-history',
    category: { ko: '이사 문화', en: 'Moving Culture', fr: 'Culture du déménagement' },
    title:    { ko: '몬트리올 Moving Day는 어떻게 시작됐을까?', en: 'The history of Montréal Moving Day', fr: "L'histoire du jour du déménagement à Montréal" },
    desc:     { ko: '7월 1일, 캐나다 데이와 이사의 날이 겹치는 도시의 독특한 풍경.', en: "Every year on July 1st, the whole city moves at once. Here's why.", fr: 'Chaque année le 1er juillet, toute la ville déménage en même temps.' },
  },
  {
    num: '03',
    slug: 'renting-things-to-know',
    category: { ko: '임대 생활', en: 'Renting', fr: 'Location' },
    title:    { ko: '몬트리올에서 임대하기 전에 아무도 알려주지 않는 것들', en: 'Things nobody tells you before renting in Montréal', fr: 'Ce que personne ne vous dit avant de louer à Montréal' },
    desc:     { ko: '난방, 세탁기, 습기, 벌레, 소음처럼 계약서만 보고는 알기 어려운 현실적인 기준들.', en: 'Heating, laundry, humidity, bugs, noise — the things you only discover after signing.', fr: 'Chauffage, lessive, humidité, bruit — ce que vous découvrez après avoir signé.' },
  },
  {
    num: '04',
    slug: 'neighbourhood-differences',
    category: { ko: '동네 이야기', en: 'Neighbourhoods', fr: 'Quartiers' },
    title:    { ko: '왜 어떤 동네들은 완전히 다른 느낌일까요?', en: 'Why some neighbourhoods feel completely different', fr: 'Pourquoi certains quartiers semblent complètement différents' },
    desc:     { ko: '같은 도시 안에서도 언어, 교통, 건축, 상권에 따라 전혀 다른 생활 리듬이 만들어집니다.', en: 'Language, transit, architecture, and commerce create entirely different rhythms within the same city.', fr: 'La langue, les transports et le commerce créent des rythmes très différents au sein de la même ville.' },
  },
]

// ─── Community board ──────────────────────────────────────────────────────────

const BOARD_POSTS: Array<{ category: Tri; title: Tri; meta: Tri }> = [
  {
    category: { ko: '주거',     en: 'Housing',      fr: 'Logement'     },
    title:    { ko: 'Mile End 1BR 찾고 있어요 — 9월부터', en: 'Looking for 1BR in Mile End — September move-in', fr: 'Cherche 1 chambre à Mile End — dès septembre' },
    meta:     { ko: '2일 전', en: '2 days ago', fr: 'il y a 2 jours' },
  },
  {
    category: { ko: '룸메이트', en: 'Roommates',    fr: 'Colocataires'  },
    title:    { ko: 'Plateau에서 함께 살 룸메이트 찾습니다', en: 'Looking for roommate in Plateau — 2BR available', fr: 'Cherche colocataire sur le Plateau — 2 ch. disponible' },
    meta:     { ko: '3일 전', en: '3 days ago', fr: 'il y a 3 jours' },
  },
  {
    category: { ko: '가구',     en: 'Furniture',    fr: 'Meubles'       },
    title:    { ko: '책상, 의자, 조명 나눔합니다', en: 'Giving away desk, chair, and lamp', fr: 'Je donne bureau, chaise et lampe' },
    meta:     { ko: '5일 전', en: '5 days ago', fr: 'il y a 5 jours' },
  },
  {
    category: { ko: '이사 도움', en: 'Moving Help', fr: 'Aide au déménagement' },
    title:    { ko: '7월 초 이사 도와주실 분 찾습니다', en: 'Need moving help — early July', fr: "Besoin d'aide pour déménager — début juillet" },
    meta:     { ko: '1주 전', en: '1 week ago', fr: 'il y a 1 semaine' },
  },
]

const CAT_BG: Record<string, string> = {
  Housing: '#EFF6FF', '주거': '#EFF6FF', Logement: '#EFF6FF',
  Roommates: '#F0FDF4', '룸메이트': '#F0FDF4', Colocataires: '#F0FDF4',
  Furniture: '#FFF7ED', '가구': '#FFF7ED', Meubles: '#FFF7ED',
  'Moving Help': '#FDF4FF', '이사 도움': '#FDF4FF', 'Aide au déménagement': '#FDF4FF',
}
const CAT_FG: Record<string, string> = {
  Housing: '#1D4ED8', '주거': '#1D4ED8', Logement: '#1D4ED8',
  Roommates: '#15803D', '룸메이트': '#15803D', Colocataires: '#15803D',
  Furniture: '#C2410C', '가구': '#C2410C', Meubles: '#C2410C',
  'Moving Help': '#7E22CE', '이사 도움': '#7E22CE', 'Aide au déménagement': '#7E22CE',
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

  const ctaCls = 'inline-flex items-center text-[12px] font-semibold text-gray-500 hover:text-gray-800 transition-colors'

  return (
    <div className="w-full min-h-screen bg-white pb-24">
      <div className="max-w-[720px] mx-auto px-4 py-8 space-y-10">

        {/* ── HERO ── */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/>
            </svg>
            <h1 className="text-[24px] font-bold text-gray-900">
              {t('나만의 공간 찾기', 'Finding Home', 'Trouver un Logement')}
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

        {/* ── CHECKLIST ── */}
        <section>
          <div className="border border-gray-200 rounded-2xl px-5 py-5 bg-white">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">
                  {t('몬트리올 정착 체크리스트', 'Settlement Checklist', 'Liste de règlement')}
                </h2>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  {t(
                    '집을 구하기 전부터 이사 후 생활 준비까지, 하나씩 확인해보세요.',
                    'From apartment hunting to settling in — check each one off.',
                    "De la recherche de logement à l'installation — cochez au fur et à mesure.",
                  )}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[20px] font-bold text-gray-900">{pct}%</span>
                <p className="text-[11px] text-gray-400">{t('완료', 'done', 'fait')}</p>
              </div>
            </div>

            <div className="h-1 bg-gray-100 rounded-full mt-3 mb-4 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: 'var(--y)' }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
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
          </div>
        </section>

        {/* ── START HERE ── */}
        <section>
          <SectionLabel>{t('처음 몬트리올에 왔다면', 'Start Here', 'Commencer ici')}</SectionLabel>
          <p className="text-[13px] text-gray-500 mb-4">
            {t(
              '집을 구하기 전에 알아두면 좋은 몬트리올의 기본 구조.',
              'What to understand about Montréal before you start looking.',
              'Ce qu\'il faut savoir sur Montréal avant de commencer à chercher.',
            )}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {START_CARDS.map(card => (
              <div key={card.slug} className="border border-gray-200 rounded-2xl px-4 py-4 bg-white flex flex-col gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  {tri(card.category, lang)}
                </span>
                <p className="text-[14px] font-bold text-gray-900 leading-snug">{tri(card.title, lang)}</p>
                <p className="text-[12px] text-gray-500 leading-snug flex-1">{tri(card.desc, lang)}</p>
                <Link to={`/settling/${card.slug}`} className={ctaCls}>
                  {t('읽어보기 →', 'Read more →', 'Lire →')}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── NEIGHBOURHOOD GUIDE ── */}
        <section>
          <SectionLabel>{t('몬트리올 동네 가이드', 'Neighbourhood Guide', 'Guide des quartiers')}</SectionLabel>
          <p className="text-[13px] text-gray-500 mb-4">
            {t(
              '몬트리올의 동네는 서로 다른 도시처럼 느껴집니다.',
              'Every neighbourhood feels like a different city.',
              'Chaque quartier ressemble à une ville différente.',
            )}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {HOODS.map(hood => (
              <div key={hood.name} className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
                <div
                  className="h-16 w-full flex items-center justify-center"
                  style={{ background: hood.color }}
                >
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {hood.label}
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

        {/* ── HAKKYO CITY STORIES ── */}
        <section>
          <SectionLabel>HAKKYO CITY</SectionLabel>
          <p className="text-[13px] text-gray-500 mb-4">
            {t(
              '집을 구하는 일을 통해 몬트리올이 어떻게 작동하는지 읽어봅니다.',
              'Stories that help explain how Montréal works.',
              'Des histoires qui aident à comprendre comment fonctionne Montréal.',
            )}
          </p>
          <div className="space-y-2">
            {STORIES.map(story => (
              <div key={story.slug} className="border border-gray-200 rounded-2xl px-4 py-4 bg-white flex items-start gap-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 tabular-nums"
                  style={{ background: 'var(--y)', color: '#111' }}
                >
                  {story.num}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                    {tri(story.category, lang)}
                  </p>
                  <p className="text-[14px] font-bold text-gray-900 leading-snug mb-1">
                    {tri(story.title, lang)}
                  </p>
                  <p className="text-[12px] text-gray-500 leading-snug mb-2">
                    {tri(story.desc, lang)}
                  </p>
                  <Link to={`/settling/${story.slug}`} className={ctaCls}>
                    {t('읽어보기 →', 'Read more →', 'Lire →')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── COMMUNITY BOARD ── */}
        <section>
          <SectionLabel>{t('커뮤니티 주거 게시판', 'Community Housing Board', 'Tableau de logement communautaire')}</SectionLabel>
          <p className="text-[13px] text-gray-500 mb-4">
            {t(
              '커뮤니티가 함께 만드는 주거, 룸메이트, 가구, 이사 도움 게시판.',
              'Community-driven housing, roommate, furniture, and moving posts.',
              'Annonces de logement, colocataires, meubles et aide au déménagement.',
            )}
          </p>

          <div className="flex gap-2 flex-wrap mb-4">
            {[
              { ko: '주거',     en: 'Housing',      fr: 'Logement'            },
              { ko: '룸메이트', en: 'Roommates',    fr: 'Colocataires'        },
              { ko: '가구',     en: 'Furniture',    fr: 'Meubles'             },
              { ko: '이사 도움', en: 'Moving Help', fr: 'Aide au déménagement'},
            ].map((cat, i) => (
              <span key={i} className="text-[11px] font-semibold px-3 py-1 rounded-full border border-gray-200 text-gray-500 bg-white">
                {tri(cat, lang)}
              </span>
            ))}
          </div>

          <div className="space-y-2 mb-3">
            {BOARD_POSTS.map((post, i) => {
              const catKey = post.category.en
              return (
                <div key={i} className="border border-gray-200 rounded-2xl px-4 py-3 bg-white flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span
                      className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1"
                      style={{ background: CAT_BG[catKey] ?? '#F3F4F6', color: CAT_FG[catKey] ?? '#374151' }}
                    >
                      {tri(post.category, lang)}
                    </span>
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
            {t('경험 공유하기 →', 'Share your experience →', 'Partager votre expérience →')}
          </Link>
        </section>

      </div>
    </div>
  )
}
