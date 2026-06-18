import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import { trackEvent } from '../lib/analytics'
import {
  getNeighbourhoodComments,
  getAllNeighbourhoodCommentCounts,
  addNeighbourhoodComment,
  deleteNeighbourhoodComment,
  type NeighbourhoodComment,
} from '../lib/db'

// ─── Tab icons ────────────────────────────────────────────────────────────────

function IcoBudget() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M12 6v2M12 16v2M9 9.5C9 8.1 10.3 7 12 7s3 1.1 3 2.5c0 2.5-3 3-3 4.5M12 15h.01"/>
    </svg>
  )
}
function IcoMap() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  )
}
function IcoLease() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )
}
function IcoDoor() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V3h13l5 5v13H3z"/><circle cx="14" cy="12" r="1"/>
    </svg>
  )
}
function IcoHydro() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  )
}
function IcoWifi() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><circle cx="12" cy="20" r="1"/>
    </svg>
  )
}
function IcoShield() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}
function IcoTransit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="12" height="14" rx="2"/><path d="M6 8h12M6 12h12M9 18l-2 3M15 18l2 3M9 4V2M15 4V2"/>
    </svg>
  )
}

// ─── i18n ─────────────────────────────────────────────────────────────────────

type Tri = { ko: string; en: string; fr: string }
function tri(f: Tri, lang: string): string {
  return lang === 'ko' ? f.ko : lang === 'fr' ? f.fr : f.en
}

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
  { id: 'budget',    ko: '예산 설정',              en: 'Set a budget',                fr: 'Définir le budget'                },
  { id: 'hood',      ko: '동네 선택',              en: 'Choose a neighbourhood',       fr: 'Choisir le quartier'              },
  { id: 'visits',    ko: '아파트 방문 일정 잡기',   en: 'Schedule apartment visits',    fr: 'Planifier les visites'            },
  { id: 'lease',     ko: '임대차 계약 내용 확인',   en: 'Verify the lease',             fr: 'Vérifier les détails du bail'     },
  { id: 'hydro',     ko: 'Hydro-Québec 계정 개설', en: 'Open Hydro-Québec account',    fr: 'Ouvrir un compte Hydro-Québec'    },
  { id: 'internet',  ko: '인터넷 설치',             en: 'Set up internet',              fr: 'Installer internet'               },
  { id: 'insurance', ko: '세입자 보험 가입',        en: 'Get tenant insurance',         fr: 'Souscrire une assurance locataire'},
  { id: 'transit',   ko: '현지 교통 익히기',        en: 'Learn local transit',          fr: 'Apprendre les transports locaux'  },
]

const SETTLING_TAB_MAP: Record<string, string> = {
  budget:    'budget',
  hood:      'hood',
  visits:    'visits',
  lease:     'lease',
  hydro:     'hydro',
  internet:  'internet',
  insurance: 'insurance',
  transit:   'transit',
}

const TOOL_TABS: Array<{ id: string; icon: React.ReactNode } & Tri> = [
  { id: 'budget',    icon: <IcoBudget />,  ko: '예산',        en: 'Budget',        fr: 'Budget'       },
  { id: 'hood',      icon: <IcoMap />,     ko: '동네',        en: 'Neighbourhood', fr: 'Quartier'     },
  { id: 'visits',    icon: <IcoDoor />,    ko: '아파트 방문', en: 'Visits',        fr: 'Visites'      },
  { id: 'lease',     icon: <IcoLease />,   ko: '임대 계약',   en: 'Lease',         fr: 'Bail'         },
  { id: 'hydro',     icon: <IcoHydro />,   ko: 'Hydro-Québec',en: 'Hydro-Québec',  fr: 'Hydro-Québec' },
  { id: 'internet',  icon: <IcoWifi />,    ko: '인터넷',      en: 'Internet',      fr: 'Internet'     },
  { id: 'insurance', icon: <IcoShield />,  ko: '보험',        en: 'Insurance',     fr: 'Assurance'    },
  { id: 'transit',   icon: <IcoTransit />, ko: '교통',        en: 'Transit',       fr: 'Transport'    },
]

// ─── Neighbourhood data ───────────────────────────────────────────────────────

interface Hood {
  id: string; name: string; label: string
  summary: Tri; tags: string[]
  goodFor: Tri[]; note: Tri
  x: number; y: number
}

const HOODS: Hood[] = [
  {
    id: 'downtown', name: 'Downtown', label: 'DOWNTOWN',
    x: 195, y: 182,
    summary: { ko: '학교, 일, 교통이 가까운 가장 실용적인 선택지.', en: 'Transit, work, and school — the most practical option.', fr: "Transports, travail et universités — l'option la plus pratique." },
    tags: ['교통', '학생', '편리함'],
    goodFor: [
      { ko: '처음 몬트리올에 와서 이동이 중요한 사람', en: 'Newcomers for whom mobility is everything', fr: 'Nouveaux arrivants pour qui la mobilité est essentielle' },
      { ko: '학교나 직장이 중심가에 있는 사람', en: 'Students and workers based in the centre', fr: 'Étudiants et travailleurs au centre-ville' },
      { ko: '차 없이 생활하는 사람', en: 'People living without a car', fr: 'Personnes sans voiture' },
    ],
    note: { ko: '편리하지만 렌트가 높고, 조용한 주거 분위기를 기대하기는 어렵습니다.', en: 'Convenient but expensive, and not the quietest neighbourhood to live in.', fr: "Pratique mais cher, et peu propice à une vie résidentielle calme." },
  },
  {
    id: 'griffintown', name: 'Griffintown', label: 'GRIFFINTOWN',
    x: 168, y: 200,
    summary: { ko: '새 콘도와 운하 산책로가 많은 현대적인 주거 지역.', en: 'New condos, canal walks, and a modern residential feel.', fr: 'Nouveaux condos, promenades le long du canal et ambiance résidentielle moderne.' },
    tags: ['콘도', '운하', '신축'],
    goodFor: [
      { ko: '새 건물과 편의시설을 선호하는 사람', en: 'People who prefer new buildings and amenities', fr: 'Personnes préférant les nouveaux immeubles' },
      { ko: '다운타운과 가까운 곳을 찾는 사람', en: 'Those wanting to be close to downtown', fr: 'Ceux qui veulent rester proches du centre-ville' },
      { ko: '운하 주변 산책을 좋아하는 사람', en: 'Canal-side walkers and cyclists', fr: 'Amateurs de promenades et de vélo le long du canal' },
    ],
    note: { ko: '신축 콘도가 많지만 렌트가 높은 편이고, 동네의 로컬감은 약할 수 있습니다.', en: 'Many new condos but rents are high and neighbourhood character is still forming.', fr: "Beaucoup de nouveaux condos, loyers élevés, et identité de quartier encore en formation." },
  },
  {
    id: 'saint-henri', name: 'Saint-Henri', label: 'SAINT-HENRI',
    x: 140, y: 210,
    summary: { ko: '오래된 주거지와 새롭게 바뀌는 상권이 함께 있는 동네.', en: 'Historic housing mixed with a changing commercial scene.', fr: "Logements historiques mêlés à un quartier commercial en pleine transformation." },
    tags: ['운하', '카페', '변화'],
    goodFor: [
      { ko: '운하 근처 생활을 원하는 사람', en: 'People wanting to live near the canal', fr: 'Personnes souhaitant vivre près du canal' },
      { ko: '카페와 작은 식당을 좋아하는 사람', en: 'Café and small restaurant lovers', fr: 'Amateurs de cafés et de petits restaurants' },
      { ko: '다운타운 서쪽 생활권을 원하는 사람', en: 'Those wanting to be west of downtown', fr: "Personnes souhaitant s'installer à l'ouest du centre-ville" },
    ],
    note: { ko: '지역 안에서도 조용한 곳과 활기 있는 곳의 차이가 큽니다.', en: 'There is a big difference between quieter and more lively blocks within the neighbourhood.', fr: "Les rues calmes et animées du quartier contrastent beaucoup." },
  },
  {
    id: 'ndg', name: 'NDG', label: 'NDG',
    x: 128, y: 175,
    summary: { ko: '영어권 분위기와 주거지가 강한 서쪽 동네.', en: 'An anglophone-leaning, residential neighbourhood in the west.', fr: "Un quartier résidentiel à dominante anglophone à l'ouest." },
    tags: ['영어권', '주거', '조용함'],
    goodFor: [
      { ko: '영어 사용 환경을 선호하는 사람', en: 'People preferring an English-speaking environment', fr: "Personnes préférant un environnement anglophone" },
      { ko: '조용한 주거지를 찾는 사람', en: 'Those looking for a quiet residential area', fr: "Ceux qui cherchent une zone résidentielle calme" },
      { ko: '다운타운 서쪽 생활권이 필요한 사람', en: 'People whose routines pull them west of downtown', fr: "Personnes dont les activités se situent à l'ouest du centre-ville" },
    ],
    note: { ko: '차분한 주거지 느낌이 강하지만, 일부 지역은 대중교통 이동 시간이 길 수 있습니다.', en: 'Very residential and calm, but transit times can be long in some parts.', fr: "Très résidentiel et calme, mais les trajets en transport peuvent être longs dans certains secteurs." },
  },
  {
    id: 'cdn', name: 'Côte-des-Neiges', label: 'CÔTE-DES-NEIGES',
    x: 155, y: 148,
    summary: { ko: '다양한 문화와 학생, 이민자가 함께 사는 동네.', en: 'Multicultural, affordable, and close to two universities.', fr: 'Multiculturel, abordable et proche de deux universités.' },
    tags: ['다문화', '대학가', '생활비'],
    goodFor: [
      { ko: '합리적인 렌트를 찾는 사람', en: 'People looking for more affordable rent', fr: 'Personnes cherchant un loyer plus abordable' },
      { ko: '대학 근처에 살아야 하는 사람', en: 'Students needing to be near university', fr: "Étudiants devant être proches de l'université" },
      { ko: '다문화적인 생활권을 선호하는 사람', en: 'People who value multicultural environments', fr: 'Personnes qui apprécient les milieux multiculturels' },
    ],
    note: { ko: '지역이 넓어서 거리마다 분위기와 교통 접근성이 크게 다릅니다.', en: 'The area is large — the atmosphere and transit access vary greatly block by block.', fr: "La zone est vaste — l'ambiance et l'accès aux transports varient beaucoup d'une rue à l'autre." },
  },
  {
    id: 'plateau', name: 'Plateau Mont-Royal', label: 'PLATEAU MONT-ROYAL',
    x: 215, y: 148,
    summary: { ko: '예술, 카페, 그리고 몬트리올다운 산책로가 있는 동네.', en: 'Arts, cafés, and the most walkable streets in Montréal.', fr: 'Arts, cafés et les rues les plus animées de Montréal.' },
    tags: ['카페', '예술', '도보 생활'],
    goodFor: [
      { ko: '걸어 다니는 생활을 좋아하는 사람', en: 'People who love walkable neighbourhoods', fr: 'Personnes qui apprécient les quartiers piétons' },
      { ko: '카페와 작은 가게를 자주 가는 사람', en: 'Frequent café and independent shop visitors', fr: 'Habitués des cafés et boutiques indépendantes' },
      { ko: '조용함보다 활기 있는 분위기를 선호하는 사람', en: 'People who prefer energy over quiet', fr: "Personnes préférant l'animation au calme" },
    ],
    note: { ko: '렌트가 높은 편이고, 여름에는 활기 있지만 겨울에는 계단과 언덕이 불편할 수 있습니다.', en: 'Rents are high, and while summers are vibrant, stairs and hills can be tough in winter.', fr: "Loyers élevés, été animé, mais les escaliers et collines peuvent être contraignants en hiver." },
  },
  {
    id: 'mile-end', name: 'Mile End', label: 'MILE END',
    x: 205, y: 128,
    summary: { ko: '작은 카페, 베이글, 음악과 창작자들이 모여 있는 동네.', en: 'Independent cafés, bagels, music, and the city\'s creative scene.', fr: 'Cafés indépendants, bagels, musique et scène créative de la ville.' },
    tags: ['카페', '창작자', '베이글'],
    goodFor: [
      { ko: '독립 서점, 카페, 음악 문화를 좋아하는 사람', en: 'Lovers of indie bookshops, cafés, and music', fr: 'Amateurs de librairies indépendantes, cafés et musique' },
      { ko: '걷는 생활을 선호하는 사람', en: 'People who prefer walking everywhere', fr: 'Personnes préférant tout faire à pied' },
      { ko: '몬트리올다운 분위기를 느끼고 싶은 사람', en: 'Those wanting the most Montréal feel', fr: "Ceux qui veulent l'atmosphère la plus montréalaise" },
    ],
    note: { ko: '인기가 많은 만큼 렌트가 높고, 좋은 매물은 빨리 사라집니다.', en: 'Very popular — rents are high and good units go fast.', fr: "Très populaire — loyers élevés et les bons logements partent vite." },
  },
  {
    id: 'villeray', name: 'Villeray', label: 'VILLERAY',
    x: 220, y: 110,
    summary: { ko: '로컬 시장, 공원, 조용한 커뮤니티가 있는 동네.', en: 'Local markets, parks, and a quiet community feel.', fr: 'Marchés locaux, parcs et ambiance communautaire tranquille.' },
    tags: ['로컬', '공원', '커뮤니티'],
    goodFor: [
      { ko: '관광지보다 로컬 생활을 원하는 사람', en: 'People wanting local life over tourist zones', fr: 'Personnes souhaitant une vie locale plutôt que touristique' },
      { ko: '공원과 시장이 가까운 생활을 좋아하는 사람', en: 'Those who enjoy parks and markets nearby', fr: 'Ceux qui aiment avoir parcs et marchés à proximité' },
      { ko: '조용하지만 너무 외곽은 싫은 사람', en: 'People wanting quiet without being too far out', fr: "Personnes souhaitant le calme sans être trop excentrées" },
    ],
    note: { ko: '다운타운 접근은 가능하지만 중심부 생활과는 리듬이 다릅니다.', en: 'Downtown is reachable, but the pace here is different from central neighbourhoods.', fr: "Le centre-ville est accessible, mais le rythme de vie y est différent des quartiers centraux." },
  },
  {
    id: 'rosemont', name: 'Rosemont', label: 'ROSEMONT',
    x: 248, y: 128,
    summary: { ko: '조용한 주거지와 공원이 많은 생활형 동네.', en: 'A quiet residential neighbourhood with many parks.', fr: 'Quartier résidentiel tranquille avec de nombreux parcs.' },
    tags: ['주거', '공원', '가족'],
    goodFor: [
      { ko: '조용하고 안정적인 생활을 원하는 사람', en: 'People wanting a calm and stable environment', fr: 'Personnes souhaitant un environnement calme et stable' },
      { ko: '가족 단위 주거지를 찾는 사람', en: 'Families looking for a neighbourhood', fr: 'Familles cherchant un quartier adapté' },
      { ko: '공원과 생활 편의시설을 중요하게 보는 사람', en: 'Those who value parks and everyday amenities', fr: 'Ceux qui accordent de l\'importance aux parcs et commodités' },
    ],
    note: { ko: '중심부보다 여유롭지만, 위치에 따라 지하철 접근성이 제한될 수 있습니다.', en: 'More relaxed than central areas, but transit access can be limited depending on where exactly you are.', fr: "Plus détendu que les quartiers centraux, mais l'accès aux transports peut être limité selon l'emplacement." },
  },
  {
    id: 'verdun', name: 'Verdun', label: 'VERDUN',
    x: 158, y: 240,
    summary: { ko: '강변을 따라 걷고, 조용한 동네 삶을 즐기기 좋은 곳.', en: 'Riverside walks, families, and a quieter pace of life.', fr: 'Promenades le long du fleuve, familles et rythme de vie plus calme.' },
    tags: ['강변', '가족 친화', '조용함'],
    goodFor: [
      { ko: '조용한 주거지를 찾는 사람', en: 'People looking for a quiet residential area', fr: 'Personnes cherchant un quartier résidentiel tranquille' },
      { ko: '강변 산책과 자전거를 좋아하는 사람', en: 'Those who love riverside walks and cycling', fr: 'Amateurs de promenades et de vélo en bord de fleuve' },
      { ko: '다운타운과 너무 멀지 않은 동네를 원하는 사람', en: 'People wanting to be not too far from downtown', fr: 'Personnes voulant rester proches du centre-ville' },
    ],
    note: { ko: '중심가보다 차분하지만, 위치에 따라 지하철 접근성이 달라질 수 있습니다.', en: 'Calmer than the centre, but transit access varies depending on where you are in Verdun.', fr: "Plus calme que le centre, mais l'accès aux transports varie selon l'emplacement dans Verdun." },
  },
]

// ─── Montréal SVG map ─────────────────────────────────────────────────────────

function MontrealMap({
  selected,
  onSelect,
  commentCounts,
}: {
  selected: string
  onSelect: (id: string) => void
  commentCounts: Record<string, number>
}) {
  return (
    <svg
      viewBox="0 0 400 300"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-label="Montréal neighbourhood map"
    >
      {/* Island silhouette */}
      <path
        d="M 80 195 C 70 170 75 130 90 105 C 110 75 145 58 185 52
           C 225 46 270 55 300 72 C 330 90 345 118 348 148
           C 352 178 340 208 320 228 C 300 248 270 258 240 262
           C 210 267 178 262 155 252 C 130 242 108 230 95 215 Z"
        fill="#F8F8F8"
        stroke="#E0E0E0"
        strokeWidth="1.5"
      />

      <text x="188" y="278" textAnchor="middle" fontSize="8" fill="#BDBDBD" fontFamily="sans-serif" letterSpacing="1">
        ST. LAWRENCE RIVER
      </text>

      {HOODS.map(hood => {
        const isActive = selected === hood.id
        const count = commentCounts[hood.id] ?? 0

        return (
          <g
            key={hood.id}
            onClick={() => onSelect(hood.id)}
            style={{ cursor: 'pointer' }}
            role="button"
            aria-label={hood.name}
            aria-pressed={isActive}
          >
            {/* Hit area */}
            <circle cx={hood.x} cy={hood.y} r="16" fill="transparent" />

            {/* Pin */}
            <circle
              cx={hood.x}
              cy={hood.y}
              r={isActive ? 7 : 5}
              fill={isActive ? '#111111' : '#9CA3AF'}
              stroke={isActive ? '#111111' : '#ffffff'}
              strokeWidth={isActive ? 0 : 1.5}
              style={{ transition: 'all 0.15s ease' }}
            />

            {/* Yellow ring when selected */}
            {isActive && (
              <circle cx={hood.x} cy={hood.y} r="11" fill="none" stroke="var(--y)" strokeWidth="2" />
            )}

            {/* Comment count badge */}
            {count > 0 && (
              <g>
                <circle cx={hood.x + 9} cy={hood.y - 9} r="6.5" fill="#111111" />
                <text
                  x={hood.x + 9}
                  y={hood.y - 6}
                  textAnchor="middle"
                  fontSize="6"
                  fontWeight="700"
                  fill="#ffffff"
                  fontFamily="sans-serif"
                  style={{ userSelect: 'none' }}
                >
                  {count > 9 ? '9+' : count}
                </text>
              </g>
            )}

            {/* Label */}
            <text
              x={hood.x}
              y={hood.y - 16}
              textAnchor="middle"
              fontSize={isActive ? '7.5' : '6.5'}
              fontWeight={isActive ? '700' : '500'}
              fill={isActive ? '#111111' : '#6B7280'}
              fontFamily="sans-serif"
              letterSpacing="0.3"
              style={{ userSelect: 'none', transition: 'all 0.15s ease' }}
            >
              {hood.label.split(' ').map((word, wi) => (
                <tspan key={wi} x={hood.x} dy={wi === 0 ? 0 : 8}>{word}</tspan>
              ))}
            </text>
          </g>
        )
      })}

      <text x="320" y="288" textAnchor="end" fontSize="7" fill="#D1D5DB" fontFamily="sans-serif">
        Montréal Island
      </text>
    </svg>
  )
}

// ─── Anonymous display name helpers ──────────────────────────────────────────

// Short label used in "NDG 주민 1" style names
const HOOD_SHORT: Record<string, string> = {
  downtown:       'Downtown',
  griffintown:    'Griffintown',
  'saint-henri':  'Saint-Henri',
  ndg:            'NDG',
  cdn:            'CDN',
  plateau:        'Plateau',
  'mile-end':     'Mile End',
  villeray:       'Villeray',
  rosemont:       'Rosemont',
  verdun:         'Verdun',
}

function anonName(hoodId: string, index: number): string {
  const label = HOOD_SHORT[hoodId] ?? hoodId
  return `${label} 주민 ${index + 1}`
}

// ─── Neighbourhood comments ───────────────────────────────────────────────────

function CommentSection({
  hoodId, lang, t, onCountChange,
}: {
  hoodId: string
  lang: string
  t: (ko: string, en: string, fr: string) => string
  onCountChange: (delta: number) => void
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  // Comments stored oldest-first so index maps to 주민 1, 2, 3…
  const [comments, setComments] = useState<NeighbourhoodComment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    setLoading(true)
    setShowForm(false)
    setText('')
    setError('')
    // Fetch ascending so oldest = index 0 = 주민 1
    getNeighbourhoodComments(hoodId)
      .then(data => setComments([...data].reverse()))
      .finally(() => setLoading(false))
  }, [hoodId])

  async function handleSubmit() {
    if (!text.trim() || !user) return
    setSubmitting(true)
    setError('')
    try {
      // Never save email — display_name null, ownership tracked via user_id only
      const newComment = await addNeighbourhoodComment(hoodId, user.id, null, text.trim())
      trackEvent({ eventName: 'neighbourhood_comment_submitted', targetType: 'comment', targetId: hoodId })
      // Append to end (newest = highest index)
      setComments(prev => [...prev, newComment])
      setText('')
      setShowForm(false)
      onCountChange(+1)
    } catch (err) {
      console.error('[CommentSection] submit failed:', err)
      setError(t(
        '코멘트를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.',
        'Could not save your comment. Please try again later.',
        "Impossible d'enregistrer le commentaire. Veuillez réessayer.",
      ))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(commentId: string) {
    if (!user) return
    try {
      await deleteNeighbourhoodComment(commentId, user.id)
      setComments(prev => prev.filter(c => c.id !== commentId))
      onCountChange(-1)
    } catch {
      // silently ignore
    }
  }

  function handleCommentClick() {
    if (!user) {
      navigate('/login')
    } else {
      setShowForm(prev => {
        if (!prev) trackEvent({ eventName: 'neighbourhood_comment_opened', targetType: 'comment', targetId: hoodId })
        return !prev
      })
    }
  }

  // Show newest first in the list (reverse for display, but keep index from original order)
  const displayList = [...comments].reverse()

  return (
    <div className="border-t border-gray-100 pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
          {t('거주자 코멘트', 'Resident Comments', 'Commentaires')}
          {comments.length > 0 && (
            <span className="ml-1.5 text-gray-500 normal-case font-medium">· {comments.length}</span>
          )}
        </p>
        <button
          onClick={handleCommentClick}
          className="text-[11px] font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          {t('코멘트 남기기 +', 'Leave a comment +', 'Laisser un commentaire +')}
        </button>
      </div>

      {!user && (
        <p className="text-[11px] text-gray-400 mb-3">
          <Link to="/login" className="underline hover:text-gray-600">
            {t('로그인', 'Log in', 'Connexion')}
          </Link>
          {t('하면 코멘트를 남길 수 있습니다.', ' to leave a comment.', ' pour laisser un commentaire.')}
        </p>
      )}

      {showForm && user && (
        <div className="mb-3">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={t(
              '이 동네에 살아본 경험을 남겨주세요.',
              'Share your experience living here.',
              'Partagez votre expérience dans ce quartier.',
            )}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[12px] text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:border-gray-300 transition-colors"
          />
          {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || submitting}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold disabled:opacity-40 transition-opacity"
              style={{ background: '#111', color: '#fff' }}
            >
              {submitting ? '...' : t('저장', 'Save', 'Enregistrer')}
            </button>
            <button
              onClick={() => { setShowForm(false); setText(''); setError('') }}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              {t('취소', 'Cancel', 'Annuler')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayList.length === 0 ? (
        <p className="text-[12px] text-gray-400 leading-snug">
          {t(
            '아직 등록된 코멘트가 없습니다. 이 동네에 살아본 경험을 남겨주세요.',
            'No comments yet. Share your experience living here.',
            "Aucun commentaire pour l'instant. Partagez votre expérience ici.",
          )}
        </p>
      ) : (
        <div className="space-y-2">
          {displayList.slice(0, 10).map(c => {
            // Find the original ascending index for this comment
            const origIdx = comments.findIndex(x => x.id === c.id)
            const name = anonName(hoodId, origIdx)
            const initial = (HOOD_SHORT[hoodId] ?? hoodId)[0].toUpperCase()

            return (
              <div key={c.id} className="flex gap-2.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                  style={{ background: 'var(--y)', color: '#111' }}
                >
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-gray-700">{name}</span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(c.created_at).toLocaleDateString(
                        lang === 'ko' ? 'ko-KR' : lang === 'fr' ? 'fr-CA' : 'en-CA',
                        { month: 'short', day: 'numeric' },
                      )}
                    </span>
                    {user && user.id === c.user_id && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-[10px] text-gray-300 hover:text-red-400 transition-colors ml-auto"
                      >
                        {t('삭제', 'Delete', 'Supprimer')}
                      </button>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-600 leading-snug mt-0.5">{c.content}</p>
                </div>
              </div>
            )
          })}
          {comments.length > 10 && (
            <p className="text-[11px] text-gray-400 pt-1">
              {t(`+${comments.length - 10}개 더`, `+${comments.length - 10} more`, `+${comments.length - 10} de plus`)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Neighbourhood detail panel ───────────────────────────────────────────────

function NeighbourhoodPanel({ hood, lang, t, commentCount, onCountChange }: {
  hood: Hood
  lang: string
  t: (ko: string, en: string, fr: string) => string
  commentCount: number
  onCountChange: (delta: number) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{hood.label}</p>
        <h3 className="text-[18px] font-bold text-gray-900">{hood.name}</h3>
        <p className="text-[13px] text-gray-500 leading-snug mt-1">{tri(hood.summary, lang)}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {hood.tags.map(tag => (
          <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{tag}</span>
        ))}
      </div>

      <div className="border border-gray-100 rounded-xl px-3 py-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
          {t('이런 사람에게 좋아요', 'Good for', 'Idéal pour')}
        </p>
        <ul className="space-y-1">
          {hood.goodFor.map((item, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[12px] text-gray-700">
              <span className="text-gray-300 shrink-0 mt-0.5">–</span>
              {tri(item, lang)}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ background: 'var(--y-l)' }}>
        <span className="text-[11px] font-bold shrink-0 mt-0.5" style={{ color: 'var(--y-h)' }}>!</span>
        <p className="text-[11px] text-amber-900 font-medium leading-snug">{tri(hood.note, lang)}</p>
      </div>

      <div className="text-[11px] font-semibold text-gray-500">
        {t('거주자 코멘트', 'Resident Comments', 'Commentaires')}
        {commentCount > 0
          ? <span className="text-gray-700 ml-1">· {commentCount}</span>
          : null}
      </div>

      <CommentSection hoodId={hood.id} lang={lang} t={t} onCountChange={onCountChange} />
    </div>
  )
}

// ─── Map section with zoom/pan ────────────────────────────────────────────────

function NeighbourhoodMapSection({ lang, t }: {
  lang: string
  t: (ko: string, en: string, fr: string) => string
}) {
  const [selectedId, setSelectedId] = useState('plateau')
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})

  // Zoom/pan state
  const [mapScale, setMapScale] = useState(1)
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null)
  const hasDraggedRef = useRef(false)

  const selected = HOODS.find(h => h.id === selectedId) ?? HOODS[0]

  useEffect(() => {
    getAllNeighbourhoodCommentCounts().then(setCommentCounts)
  }, [])

  const handleCountChange = useCallback((hoodId: string, delta: number) => {
    setCommentCounts(prev => ({
      ...prev,
      [hoodId]: Math.max(0, (prev[hoodId] ?? 0) + delta),
    }))
  }, [])

  // Zoom controls
  const zoomIn  = () => setMapScale(s => Math.min(2.2, parseFloat((s + 0.2).toFixed(1))))
  const zoomOut = () => setMapScale(s => {
    const next = Math.max(0.8, parseFloat((s - 0.2).toFixed(1)))
    if (next <= 1) setMapOffset({ x: 0, y: 0 })
    return next
  })
  const resetZoom = () => { setMapScale(1); setMapOffset({ x: 0, y: 0 }) }

  // Drag/pan handlers
  function onMouseDown(e: React.MouseEvent) {
    if (mapScale <= 1) return
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: mapOffset.x, oy: mapOffset.y }
    setIsDragging(true)
    hasDraggedRef.current = false
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDraggedRef.current = true
    const limit = 120 * mapScale
    setMapOffset({
      x: Math.max(-limit, Math.min(limit, dragRef.current.ox + dx)),
      y: Math.max(-limit, Math.min(limit, dragRef.current.oy + dy)),
    })
  }

  function onMouseUp() {
    setIsDragging(false)
    dragRef.current = null
  }

  // Touch pan
  const touchRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null)

  function onTouchStart(e: React.TouchEvent) {
    if (mapScale <= 1 || e.touches.length !== 1) return
    const t0 = e.touches[0]
    touchRef.current = { startX: t0.clientX, startY: t0.clientY, ox: mapOffset.x, oy: mapOffset.y }
    hasDraggedRef.current = false
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!touchRef.current || e.touches.length !== 1) return
    const t0 = e.touches[0]
    const dx = t0.clientX - touchRef.current.startX
    const dy = t0.clientY - touchRef.current.startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDraggedRef.current = true
    const limit = 120 * mapScale
    setMapOffset({
      x: Math.max(-limit, Math.min(limit, touchRef.current.ox + dx)),
      y: Math.max(-limit, Math.min(limit, touchRef.current.oy + dy)),
    })
  }

  function onTouchEnd() {
    touchRef.current = null
  }

  function handleSelectHood(id: string) {
    if (hasDraggedRef.current) return
    setSelectedId(id)
    const hood = HOODS.find(h => h.id === id)
    trackEvent({ eventName: 'neighbourhood_selected', targetType: 'map', targetId: id, targetLabel: hood?.name ?? id })
  }

  const cursor = mapScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'

  return (
    <section>
      <SectionLabel>{t('몬트리올 동네 지도', 'Montréal Neighbourhood Map', 'Carte des quartiers de Montréal')}</SectionLabel>
      <p className="text-[13px] text-gray-500 mb-4">
        {t(
          '지도를 탐색하며 실제 거주자들의 이야기를 확인해보세요.',
          'Click a neighbourhood on the map to see details and resident comments.',
          'Cliquez sur un quartier pour voir les détails et les commentaires des résidents.',
        )}
      </p>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Map card */}
        <div className="lg:w-[60%] border border-gray-200 rounded-2xl overflow-hidden bg-white relative" style={{ minHeight: 240 }}>
          {/* Zoom controls */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
            <button
              onClick={zoomIn}
              disabled={mapScale >= 2.2}
              className="w-7 h-7 flex items-center justify-center text-[13px] font-semibold border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors shadow-sm"
              aria-label="Zoom in"
            >+</button>
            <button
              onClick={zoomOut}
              disabled={mapScale <= 0.8}
              className="w-7 h-7 flex items-center justify-center text-[13px] font-semibold border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors shadow-sm"
              aria-label="Zoom out"
            >–</button>
            {(mapScale !== 1 || mapOffset.x !== 0 || mapOffset.y !== 0) && (
              <button
                onClick={resetZoom}
                className="w-7 h-7 flex items-center justify-center text-[9px] font-bold border border-gray-200 rounded-lg bg-white text-gray-500 hover:bg-gray-50 transition-colors shadow-sm leading-none"
                aria-label="Reset zoom"
              >↺</button>
            )}
          </div>

          {/* Pannable map layer */}
          <div
            className="w-full h-full p-2 select-none"
            style={{ cursor, minHeight: 240 }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div
              style={{
                transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${mapScale})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.15s ease',
                width: '100%',
                height: '100%',
              }}
            >
              <MontrealMap
                selected={selectedId}
                onSelect={handleSelectHood}
                commentCounts={commentCounts}
              />
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div className="lg:w-[40%] border border-gray-200 rounded-2xl px-4 py-4 bg-white overflow-y-auto" style={{ maxHeight: 520 }}>
          <NeighbourhoodPanel
            hood={selected}
            lang={lang}
            t={t}
            commentCount={commentCounts[selected.id] ?? 0}
            onCountChange={delta => handleCountChange(selected.id, delta)}
          />
        </div>
      </div>
    </section>
  )
}

// ─── Start Here cards ─────────────────────────────────────────────────────────

const START_CARDS: Array<{ category: Tri; title: Tri; desc: Tri; slug: string }> = [
  {
    slug: 'moving-day',
    category: { ko: '이사 문화', en: 'Moving Culture', fr: 'Culture du déménagement' },
    title:    { ko: '이사의 날',  en: 'Moving Day',     fr: 'Jour du déménagement'   },
    desc:     { ko: '몬트리올에서는 왜 7월 1일에 많은 사람들이 동시에 이사를 할까요?', en: 'Why does Montréal have a city-wide moving season on July 1st?', fr: "Pourquoi Montréal a-t-il une saison de déménagement le 1er juillet ?" },
  },
  {
    slug: 'quebec-lease',
    category: { ko: '임대 계약', en: 'Leases', fr: 'Baux' },
    title:    { ko: '퀘벡 임대차 계약 이해하기', en: 'Understanding Québec Leases', fr: 'Comprendre les baux québécois' },
    desc:     { ko: 'Lease, 양도, 갱신, 전대차를 처음 보는 사람도 이해할 수 있게 정리합니다.', en: 'Lease, transfer, renewal, sublet — explained for first-timers.', fr: 'Bail, cession, renouvellement et sous-location expliqués simplement.' },
  },
  {
    slug: 'housing-scams',
    category: { ko: '안전', en: 'Safety', fr: 'Sécurité' },
    title:    { ko: '주거 사기 주의', en: 'Housing Scams', fr: 'Arnaques immobilières' },
    desc:     { ko: '페이스북 마켓플레이스에서 자주 보이는 사기 유형과 계약 전 확인해야 할 것들.', en: 'Common Facebook Marketplace scams and what to check before signing.', fr: 'Arnaques courantes et vérifications avant de signer.' },
  },
  {
    slug: 'first-apartment-checklist',
    category: { ko: '체크리스트', en: 'Checklist', fr: 'Liste de contrôle' },
    title:    { ko: '첫 아파트 체크리스트', en: 'First Apartment Checklist', fr: 'Liste pour le premier appartement' },
    desc:     { ko: '계약서에 서명하기 전에 집 안에서 반드시 확인해야 할 기본 항목들.', en: 'Everything to inspect inside an apartment before signing the lease.', fr: "Tout ce qu'il faut vérifier avant de signer un bail." },
  },
]

// ─── HAKKYO CITY stories ──────────────────────────────────────────────────────

const STORIES: Array<{ num: string; category: Tri; title: Tri; desc: Tri; slug: string }> = [
  { num: '01', slug: 'lululemon-neighbourhood',
    category: { ko: '도시 생활', en: 'City Life', fr: 'Vie urbaine' },
    title:    { ko: '왜 몬트리올에서는 집 근처 룰루레몬을 볼까?', en: 'Why do people look for a Lululemon near their apartment?', fr: 'Pourquoi chercher un Lululemon près de chez soi ?' },
    desc:     { ko: '어떤 브랜드가 있다는 것은 단순한 매장이 아니라, 동네의 분위기와 생활 반경을 보여주는 신호가 되기도 합니다.', en: 'A store can tell you more about a neighbourhood than a map.', fr: "Un magasin peut en dire plus sur un quartier qu'une carte." },
  },
  { num: '02', slug: 'moving-day-history',
    category: { ko: '이사 문화', en: 'Moving Culture', fr: 'Culture du déménagement' },
    title:    { ko: '몬트리올 Moving Day는 어떻게 시작됐을까?', en: 'The history of Montréal Moving Day', fr: "L'histoire du jour du déménagement à Montréal" },
    desc:     { ko: '7월 1일, 캐나다 데이와 이사의 날이 겹치는 도시의 독특한 풍경.', en: "Every year on July 1st, the whole city moves at once. Here's why.", fr: 'Chaque année le 1er juillet, toute la ville déménage en même temps.' },
  },
  { num: '03', slug: 'renting-things-to-know',
    category: { ko: '임대 생활', en: 'Renting', fr: 'Location' },
    title:    { ko: '몬트리올에서 임대하기 전에 아무도 알려주지 않는 것들', en: 'Things nobody tells you before renting in Montréal', fr: 'Ce que personne ne vous dit avant de louer à Montréal' },
    desc:     { ko: '난방, 세탁기, 습기, 벌레, 소음처럼 계약서만 보고는 알기 어려운 현실적인 기준들.', en: 'Heating, laundry, humidity, bugs, noise — the things you only discover after signing.', fr: 'Chauffage, lessive, humidité, bruit — ce que vous découvrez après avoir signé.' },
  },
  { num: '04', slug: 'neighbourhood-differences',
    category: { ko: '동네 이야기', en: 'Neighbourhoods', fr: 'Quartiers' },
    title:    { ko: '왜 어떤 동네들은 완전히 다른 느낌일까요?', en: 'Why some neighbourhoods feel completely different', fr: 'Pourquoi certains quartiers semblent complètement différents' },
    desc:     { ko: '같은 도시 안에서도 언어, 교통, 건축, 상권에 따라 전혀 다른 생활 리듬이 만들어집니다.', en: 'Language, transit, architecture, and commerce create entirely different rhythms within the same city.', fr: 'La langue, les transports et le commerce créent des rythmes très différents.' },
  },
]

// ─── Community board ──────────────────────────────────────────────────────────

const BOARD_POSTS: Array<{ category: Tri; title: Tri; meta: Tri }> = [
  { category: { ko: '주거',     en: 'Housing',      fr: 'Logement'     },
    title:    { ko: 'Mile End 1BR 찾고 있어요 — 9월부터', en: 'Looking for 1BR in Mile End — September move-in', fr: 'Cherche 1 chambre à Mile End — dès septembre' },
    meta:     { ko: '2일 전', en: '2 days ago', fr: 'il y a 2 jours' } },
  { category: { ko: '룸메이트', en: 'Roommates',    fr: 'Colocataires'  },
    title:    { ko: 'Plateau에서 함께 살 룸메이트 찾습니다', en: 'Looking for roommate in Plateau — 2BR available', fr: 'Cherche colocataire sur le Plateau — 2 ch. disponible' },
    meta:     { ko: '3일 전', en: '3 days ago', fr: 'il y a 3 jours' } },
  { category: { ko: '가구',     en: 'Furniture',    fr: 'Meubles'       },
    title:    { ko: '책상, 의자, 조명 나눔합니다', en: 'Giving away desk, chair, and lamp', fr: 'Je donne bureau, chaise et lampe' },
    meta:     { ko: '5일 전', en: '5 days ago', fr: 'il y a 5 jours' } },
  { category: { ko: '이사 도움', en: 'Moving Help', fr: 'Aide au déménagement' },
    title:    { ko: '7월 초 이사 도와주실 분 찾습니다', en: 'Need moving help — early July', fr: "Besoin d'aide pour déménager — début juillet" },
    meta:     { ko: '1주 전', en: '1 week ago', fr: 'il y a 1 semaine' } },
]

const CAT_BG: Record<string, string> = {
  Housing:'#EFF6FF','주거':'#EFF6FF',Logement:'#EFF6FF',
  Roommates:'#F0FDF4','룸메이트':'#F0FDF4',Colocataires:'#F0FDF4',
  Furniture:'#FFF7ED','가구':'#FFF7ED',Meubles:'#FFF7ED',
  'Moving Help':'#FDF4FF','이사 도움':'#FDF4FF','Aide au déménagement':'#FDF4FF',
}
const CAT_FG: Record<string, string> = {
  Housing:'#1D4ED8','주거':'#1D4ED8',Logement:'#1D4ED8',
  Roommates:'#15803D','룸메이트':'#15803D',Colocataires:'#15803D',
  Furniture:'#C2410C','가구':'#C2410C',Meubles:'#C2410C',
  'Moving Help':'#7E22CE','이사 도움':'#7E22CE','Aide au déménagement':'#7E22CE',
}

// ─── Essential Tools panels ───────────────────────────────────────────────────

function ToolPanel({ id, lang, t }: { id: string; lang: string; t: (ko: string, en: string, fr: string) => string }) {
  if (id === 'budget') return (
    <div className="space-y-3">
      <p className="text-[13px] text-gray-700 leading-relaxed">
        {t(
          '몬트리올의 월세는 동네와 크기에 따라 크게 다릅니다. 예산을 먼저 정하면 동네 선택이 훨씬 쉬워집니다.',
          'Rent in Montréal varies significantly by neighbourhood and apartment size. Setting a budget first makes the neighbourhood search much easier.',
          'Le loyer à Montréal varie selon le quartier et la taille. Définir un budget d\'abord simplifie le choix du quartier.',
        )}
      </p>
      <div className="space-y-1.5">
        {[
          { label: { ko: '스튜디오 / 1½', en: 'Studio / 1½', fr: 'Studio / 1½' }, price: '$700–$1,100 / mo' },
          { label: { ko: '1 침실 / 3½',   en: '1 Bedroom / 3½', fr: '1 chambre / 3½' }, price: '$1,000–$1,500 / mo' },
          { label: { ko: '2 침실 / 4½',   en: '2 Bedrooms / 4½', fr: '2 chambres / 4½' }, price: '$1,300–$2,000 / mo' },
        ].map(row => (
          <div key={row.price} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50">
            <span className="text-[12px] text-gray-700">{tri(row.label, lang)}</span>
            <span className="text-[12px] font-semibold text-gray-900">{row.price}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-400 leading-snug">
        {t(
          '* 인기 동네(Plateau, Mile End)는 위 범위보다 높을 수 있습니다. 난방·전기 포함 여부를 꼭 확인하세요.',
          '* Popular areas (Plateau, Mile End) may exceed these ranges. Always check if heat and electricity are included.',
          '* Les quartiers populaires (Plateau, Mile End) peuvent dépasser ces fourchettes. Vérifiez si le chauffage est inclus.',
        )}
      </p>
    </div>
  )

  if (id === 'hood') return (
    <div className="space-y-3">
      <p className="text-[13px] text-gray-700 leading-relaxed">
        {t(
          '몬트리올은 동네마다 분위기, 언어, 렌트 수준이 완전히 다릅니다. 아래 지도에서 각 동네의 특성을 확인해보세요.',
          'Every neighbourhood in Montréal has a different atmosphere, language, and price point. Explore the map below to compare.',
          'Chaque quartier a une atmosphère, une langue et un niveau de prix différents. Explorez la carte ci-dessous.',
        )}
      </p>
      <div className="space-y-1.5">
        {[
          { name: 'Plateau Mont-Royal', note: { ko: '카페·도보 생활, 렌트 높음', en: 'Walkable, cafés, higher rents', fr: 'Piéton, cafés, loyers élevés' } },
          { name: 'Villeray / Rosemont', note: { ko: '로컬 생활, 가성비 좋음', en: 'Local feel, good value', fr: 'Ambiance locale, bon rapport qualité-prix' } },
          { name: 'NDG / CDN', note: { ko: '다양한 커뮤니티, 조용한 주거', en: 'Diverse, residential, quieter', fr: 'Divers, résidentiel, plus calme' } },
          { name: 'Downtown / Griffintown', note: { ko: '교통 편리, 렌트 가장 높음', en: 'Best transit, highest rents', fr: 'Meilleurs transports, loyers les plus élevés' } },
        ].map(row => (
          <div key={row.name} className="flex items-start justify-between px-3 py-2 rounded-lg bg-gray-50 gap-3">
            <span className="text-[12px] font-semibold text-gray-900 shrink-0">{row.name}</span>
            <span className="text-[12px] text-gray-500 text-right">{tri(row.note, lang)}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-400">{t('아래 지도에서 실거주자 코멘트를 확인할 수 있습니다.', 'Scroll down to see resident comments on the map below.', 'Faites défiler pour voir les commentaires des résidents sur la carte.')}</p>
    </div>
  )

  if (id === 'visits') return (
    <div className="space-y-3">
      <p className="text-[13px] text-gray-700 leading-relaxed">
        {t(
          '아파트를 방문할 때 직접 확인해야 할 것들이 있습니다. 계약 전에 꼼꼼히 살펴보세요.',
          'There are things you must check in person before signing. Don\'t skip the walkthrough.',
          'Il y a des éléments à vérifier en personne avant de signer. Ne sautez pas la visite.',
        )}
      </p>
      <ul className="space-y-1.5">
        {(lang === 'ko' ? [
          '수도꼭지·샤워기 수압 및 온수 확인', '창문 밀봉 상태 (외풍, 결로)', '지하 및 벽면 곰팡이 흔적', '세탁기·건조기 공간 또는 공동 세탁실 위치', '난방 방식 (전기 온수 라디에이터 vs. 바닥 난방)', '주차 공간·자전거 보관', '쓰레기·재활용 규정 확인',
        ] : lang === 'fr' ? [
          'Pression de l\'eau et eau chaude', 'Joints de fenêtres (courants d\'air, condensation)', 'Traces de moisissures dans les murs ou sous-sol', 'Espace pour laveuse-sécheuse ou emplacement de la buanderie commune', 'Type de chauffage (radiateurs électriques à eau chaude vs plancher chauffant)', 'Stationnement et rangement pour vélo', 'Règles concernant les ordures et le recyclage',
        ] : [
          'Water pressure and hot water', 'Window seals (drafts, condensation)', 'Mould traces in walls or basement', 'In-unit laundry or location of shared laundry', 'Heating type (electric hot water baseboard vs radiant floor)', 'Parking and bike storage', 'Garbage and recycling rules',
        ]).map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700 px-3 py-1.5 rounded-lg bg-gray-50">
            <span className="text-gray-300 shrink-0 mt-0.5">–</span>{item}
          </li>
        ))}
      </ul>
    </div>
  )

  if (id === 'lease') return (
    <div className="space-y-3">
      <p className="text-[13px] text-gray-700 leading-relaxed">
        {t(
          '퀘벡의 임대차 계약은 표준 양식(Formulaire de bail)을 사용합니다. 주요 조항을 꼭 확인하세요.',
          'Québec leases use a standard form (Formulaire de bail). Make sure you understand the key clauses.',
          'Les baux au Québec utilisent un formulaire standard. Assurez-vous de comprendre les clauses essentielles.',
        )}
      </p>
      <div className="space-y-1.5">
        {[
          { term: { ko: '임대 기간', en: 'Lease term', fr: 'Durée du bail' }, note: { ko: '보통 1년 (7/1–6/30)', en: 'Usually 1 year (July 1–June 30)', fr: 'Généralement 1 an (1er juillet–30 juin)' } },
          { term: { ko: '렌트 인상', en: 'Rent increase', fr: 'Hausse de loyer' }, note: { ko: '갱신 전 3개월 전 통보 필요', en: '3 months notice required before renewal', fr: '3 mois de préavis avant le renouvellement' } },
          { term: { ko: '전대차', en: 'Sublet', fr: 'Sous-location' }, note: { ko: '집주인 동의 필요, 거부할 수 없음', en: 'Landlord consent required, cannot be refused', fr: "Consentement du propriétaire requis, ne peut être refusé" } },
          { term: { ko: '퇴거 통보', en: 'Moving out', fr: 'Départ' }, note: { ko: '갱신 거부 시 3개월 전 통보', en: '3 months notice to decline renewal', fr: '3 mois pour refuser le renouvellement' } },
        ].map(row => (
          <div key={row.term.en} className="px-3 py-2 rounded-lg bg-gray-50">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{tri(row.term, lang)}</span>
            <p className="text-[12px] text-gray-700 mt-0.5">{tri(row.note, lang)}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-400">{t('분쟁 발생 시 TAL (Tribunal administratif du logement)에 연락하세요.', 'For disputes, contact the TAL (Tribunal administratif du logement).', 'En cas de litige, contactez le TAL (Tribunal administratif du logement).')}</p>
    </div>
  )

  if (id === 'hydro') return (
    <div className="space-y-3">
      <p className="text-[13px] text-gray-700 leading-relaxed">
        {t(
          '전기와 난방은 Hydro-Québec을 통해 공급됩니다. 입주 전에 계정을 개설해야 합니다.',
          'Electricity and heating come through Hydro-Québec. You must open an account before moving in.',
          "L'électricité et le chauffage passent par Hydro-Québec. Vous devez ouvrir un compte avant d'emménager.",
        )}
      </p>
      <div className="space-y-1.5">
        {[
          { ko: '입주 최소 2–3일 전에 계정 개설', en: 'Open account 2–3 days before move-in', fr: 'Ouvrir un compte 2–3 jours avant l\'emménagement' },
          { ko: '필요 서류: 주소, 이사 날짜, 신분증', en: 'Needed: address, move-in date, ID', fr: 'Nécessaire : adresse, date d\'emménagement, pièce d\'identité' },
          { ko: '온라인(hydroquebec.com) 또는 전화로 개설 가능', en: 'Can be done online at hydroquebec.com or by phone', fr: 'Possible en ligne (hydroquebec.com) ou par téléphone' },
          { ko: '겨울 난방비는 월 $80–$150 예상', en: 'Winter heating bills typically $80–$150/month', fr: 'Chauffage en hiver : environ 80–150 $/mois' },
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700 px-3 py-1.5 rounded-lg bg-gray-50 list-none">
            <span className="text-gray-300 shrink-0 mt-0.5">–</span>{tri(item, lang)}
          </li>
        ))}
      </div>
    </div>
  )

  if (id === 'internet') return (
    <div className="space-y-3">
      <p className="text-[13px] text-gray-700 leading-relaxed">
        {t(
          '몬트리올의 주요 인터넷 공급업체와 일반적인 요금입니다. 계약 전 건물 내 공급 가능 여부를 확인하세요.',
          'Main internet providers in Montréal and typical pricing. Check availability in your building before committing.',
          'Principaux fournisseurs Internet à Montréal. Vérifiez la disponibilité dans votre immeuble avant de vous engager.',
        )}
      </p>
      <div className="space-y-1.5">
        {[
          { name: 'Vidéotron', note: { ko: '케이블, 광범위 커버리지', en: 'Cable, wide coverage', fr: 'Câble, large couverture' }, price: '$55–$85/mo' },
          { name: 'Bell', note: { ko: '파이버, 빠른 속도', en: 'Fibre, fast speeds', fr: 'Fibre, vitesses rapides' }, price: '$65–$95/mo' },
          { name: 'Fizz / Distributel', note: { ko: '저렴한 대안, 계약 없음', en: 'Budget options, no contract', fr: 'Options économiques, sans contrat' }, price: '$35–$60/mo' },
        ].map(row => (
          <div key={row.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 gap-3">
            <div>
              <span className="text-[12px] font-semibold text-gray-900">{row.name}</span>
              <span className="text-[11px] text-gray-500 ml-2">{tri(row.note, lang)}</span>
            </div>
            <span className="text-[12px] font-semibold text-gray-900 shrink-0">{row.price}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-400">{t('대부분 설치 예약은 2주 전에 잡는 것이 좋습니다.', 'Book installation at least 2 weeks in advance.', 'Réservez l\'installation au moins 2 semaines à l\'avance.')}</p>
    </div>
  )

  if (id === 'insurance') return (
    <div className="space-y-3">
      <p className="text-[13px] text-gray-700 leading-relaxed">
        {t(
          '퀘벡에서 세입자 보험은 법적 의무는 아니지만, 많은 집주인이 요구합니다. 연간 $150–$300 수준입니다.',
          'Tenant insurance is not legally required in Québec, but many landlords ask for it. Annual cost is typically $150–$300.',
          "L'assurance locataire n'est pas légalement obligatoire au Québec, mais beaucoup de propriétaires l'exigent. Coût : environ 150–300 $/an.",
        )}
      </p>
      <div className="space-y-1.5">
        {(lang === 'ko' ? [
          '개인 소지품 도난·화재 보상', '제3자 피해 배상 (예: 누수로 아래층 피해)', '임시 거주 비용 (화재 등 거주 불가 시)', '자전거 도난 포함 여부 확인',
        ] : lang === 'fr' ? [
          'Couverture vol et incendie pour les biens personnels', 'Responsabilité civile (ex. dégâts des eaux chez le voisin)', 'Frais de séjour temporaire (si le logement est inhabitable)', "Vérifier l'inclusion du vol de vélo",
        ] : [
          'Personal belongings theft and fire coverage', 'Third-party liability (e.g. water leak damaging downstairs unit)', 'Temporary housing costs if unit becomes uninhabitable', 'Check if bicycle theft is included',
        ]).map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700 px-3 py-1.5 rounded-lg bg-gray-50 list-none">
            <span className="text-gray-300 shrink-0 mt-0.5">–</span>{item}
          </li>
        ))}
      </div>
      <p className="text-[11px] text-gray-400">{t('주요 보험사: Intact, Desjardins, Sonnet, Square One', 'Main providers: Intact, Desjardins, Sonnet, Square One', 'Principaux assureurs : Intact, Desjardins, Sonnet, Square One')}</p>
    </div>
  )

  if (id === 'transit') return (
    <div className="space-y-3">
      <p className="text-[13px] text-gray-700 leading-relaxed">
        {t(
          '새 집에서 출퇴근 경로를 미리 테스트해보세요. STM 지하철과 버스 노선을 파악하는 것이 중요합니다.',
          'Test your commute route from the new address before you move in. Knowing STM metro and bus lines is essential.',
          "Testez votre trajet depuis la nouvelle adresse avant d'emménager. Connaître les lignes STM est essentiel.",
        )}
      </p>
      <div className="space-y-1.5">
        {[
          { label: { ko: 'STM 월정기권', en: 'STM monthly pass', fr: 'Passe mensuelle STM' }, note: { ko: '성인 $100 / 학생 $56', en: 'Adult $100 / Student $56', fr: 'Adulte 100 $ / Étudiant 56 $' } },
          { label: { ko: 'OPUS 카드', en: 'OPUS card', fr: 'Carte OPUS' }, note: { ko: '첫 카드 발급 $6, 지하철 개찰구에서 충전', en: 'First card $6, recharge at metro turnstiles', fr: 'Première carte 6 $, rechargeable aux tourniquets' } },
          { label: { ko: 'Bixi (자전거 공유)', en: 'Bixi (bike share)', fr: 'Bixi (vélo-partage)' }, note: { ko: '연간 $115, 5월–11월 운영', en: 'Annual $115, May–November', fr: 'Annuel 115 $, mai–novembre' } },
          { label: { ko: 'STM 앱', en: 'STM app', fr: 'Application STM' }, note: { ko: '실시간 경로·지연 확인', en: 'Real-time routes and delays', fr: 'Itinéraires et retards en temps réel' } },
        ].map(row => (
          <div key={row.label.en} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 gap-3">
            <span className="text-[12px] font-semibold text-gray-900 shrink-0">{tri(row.label, lang)}</span>
            <span className="text-[12px] text-gray-500 text-right">{tri(row.note, lang)}</span>
          </div>
        ))}
      </div>
    </div>
  )

  return null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Settling() {
  const { lang, t } = useLang()
  const [checked, setChecked] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(SETTLING_KEY) ?? '[]')) }
    catch { return new Set() }
  })
  const [activeTab, setActiveTab] = useState('budget')
  const toolsRef = useRef<HTMLDivElement>(null)

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
      <div className="max-w-[960px] mx-auto px-6 pt-12 md:pt-[72px] lg:pt-24 space-y-0">

        {/* ── HEADER ── */}
        <section className="mb-14">
          <h1 className="t-page text-gray-900 mb-4">
            {t('나만의 공간 찾기', 'Finding My Place', 'Trouver mon logement')}
          </h1>
          <p style={{ fontSize: '14px', lineHeight: '1.65' }} className="text-gray-500 max-w-[500px]">
            {t(
              '예산 설정부터 계약, 입주 후 생활까지. 몬트리올에서 집을 구하는 과정을 단계별로 안내합니다.',
              'From setting a budget to signing a lease and settling in. A step-by-step guide to finding a home in Montréal.',
              'Du budget à la signature du bail et à l\'installation. Un guide étape par étape pour trouver un logement à Montréal.',
            )}
          </p>
        </section>

        {/* ── Narrative Anchor ── */}
        <p style={{ fontSize: '15px', lineHeight: '1.8' }} className="text-gray-400 italic mb-14">
          {t(
            '동네를 고른다는 건 생활 방식을 고른다는 것과 같아요.',
            'Choosing a neighbourhood is often choosing a way of life.',
            "Choisir un quartier, c'est souvent choisir un mode de vie.",
          )}
        </p>

        {/* ── CHECKLIST ── */}
        <section className="mb-16">
          <div className="border border-gray-200 rounded-2xl px-5 py-5 bg-white">
            {pct < 100 ? (
              <>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 style={{ fontSize: "17px" }} className="font-bold text-gray-900">
                      {t('나의 몬트리올 정착 준비', 'My Settling Checklist', 'Ma liste d\'installation')}
                    </h2>
                    <p className="text-[12px] text-gray-400 mt-0.5">
                      {t(
                        '집을 구하기 전부터 이사 후 생활 준비까지.',
                        'From apartment hunting to moving in.',
                        "De la recherche de logement à l'installation.",
                      )}
                    </p>
                  </div>
                  <span className="text-[12px] text-gray-400 shrink-0">
                    {checked.size} / {CHECKLIST_ITEMS.length} {t('완료', 'done', 'fait')}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-0.5">
                  {CHECKLIST_ITEMS.map(item => {
                    const isDone = checked.has(item.id)
                    const tabTarget = SETTLING_TAB_MAP[item.id]
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          toggle(item.id)
                          if (tabTarget) {
                            setActiveTab(tabTarget)
                            setTimeout(() => {
                              toolsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }, 50)
                          }
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors hover:bg-gray-50 group"
                      >
                        <span className="shrink-0 w-4 flex items-center justify-center">
                          {isDone ? (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--y-h)' }}>
                              <polyline points="1.5,6 4.5,9 10.5,3"/>
                            </svg>
                          ) : (
                            <span className="w-3 h-3 rounded-sm border border-gray-300 inline-block" />
                          )}
                        </span>
                        <span className={`text-[13px] flex-1 ${isDone ? 'text-gray-400' : 'text-gray-700'}`}>
                          {tri(item, lang)}
                        </span>
                        {tabTarget && !isDone && (
                          <span className="text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">→</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              /* ── 100% completion state ── */
              <div>
                <p className="text-[14px] font-semibold text-gray-900 mb-3">
                  {t('집이 생겼습니다.', "You've found your place.", 'Vous avez trouvé votre logement.')}
                </p>
                <p className="text-[13px] text-gray-500 leading-[1.85] mb-4">
                  {t(
                    '예산도 잡고,\n동네도 골랐고,\n계약서에 서명까지 마쳤습니다.\n\n몬트리올이 이제 진짜 당신의 도시가 되어가고 있습니다.',
                    "You set a budget,\npicked a neighbourhood,\nand signed the lease.\n\nMontréal is becoming your city.",
                    "Budget défini,\nquartier choisi,\nbail signé.\n\nMontréal devient vraiment votre ville.",
                  ).split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
                </p>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-[13px] font-semibold text-gray-800 mb-1">{t('학교 친구들아, 모여라!', 'Ready to meet people?', 'Prêt·e à rencontrer des gens ?')}</p>
                  <p className="text-[12px] text-gray-400 mb-4">{t('한국어 · 영어 · 프랑스어 · 언어 교환', 'Korean · English · French · Language Exchange', 'Coréen · Anglais · Français · Échange linguistique')}</p>
                  <Link to="/programs" className="inline-flex items-center text-[13px] font-semibold text-gray-900 hover:opacity-70 transition-opacity">
                    {t('프로그램 보기 →', 'Browse Programs →', 'Voir les programmes →')}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── ESSENTIAL TOOLS ── */}
        <section ref={toolsRef} className="mb-16">
          <SectionLabel>{t('필수 도구', 'Essential Tools', 'Outils essentiels')}</SectionLabel>
          <p className="text-[13px] text-gray-500 mb-4">
            {t('정착 과정에서 필요한 정보를 단계별로 정리했습니다.', 'Everything you need, organised by step.', 'Toutes les informations dont vous avez besoin, étape par étape.')}
          </p>
          <div className="flex gap-1 overflow-x-auto pb-1 mb-4">
            {TOOL_TABS.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-colors shrink-0 ${
                    isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-gray-400'}>{tab.icon}</span>
                  {tri(tab, lang)}
                </button>
              )
            })}
          </div>
          <div className="border border-gray-200 rounded-2xl px-5 py-5 bg-white">
            <ToolPanel id={activeTab} lang={lang} t={t} />
          </div>
        </section>

        {/* ── NEIGHBOURHOOD MAP ── */}
        <div className="mb-16">
          <NeighbourhoodMapSection lang={lang} t={t} />
        </div>

        {/* ── HAKKYO CITY ── */}
        <section className="mb-16">
          <SectionLabel>HAKKYO CITY</SectionLabel>
          <p className="text-[13px] text-gray-500 mb-4">
            {t('집을 구하는 일을 통해 몬트리올이 어떻게 작동하는지 읽어봅니다.', 'Stories that help explain how Montréal works.', 'Des histoires qui aident à comprendre Montréal.')}
          </p>
          <div className="space-y-2">
            {STORIES.map(story => (
              <div key={story.slug} className="border border-gray-200 rounded-2xl px-4 py-4 bg-white flex items-start gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 tabular-nums" style={{ background: 'var(--y)', color: '#111' }}>
                  {story.num}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{tri(story.category, lang)}</p>
                  <p className="text-[14px] font-bold text-gray-900 leading-snug mb-1">{tri(story.title, lang)}</p>
                  <p className="text-[12px] text-gray-500 leading-snug mb-2">{tri(story.desc, lang)}</p>
                  <Link to={`/settling/${story.slug}`} className={ctaCls} onClick={() => trackEvent({ eventName: 'settling_guide_clicked', targetType: 'story', targetId: story.slug, targetLabel: story.slug })}>{t('읽어보기 →', 'Read more →', 'Lire →')}</Link>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
