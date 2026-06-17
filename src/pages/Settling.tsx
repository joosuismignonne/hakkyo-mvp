import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import {
  getNeighbourhoodComments,
  addNeighbourhoodComment,
  deleteNeighbourhoodComment,
  type NeighbourhoodComment,
} from '../lib/db'

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
  { id: 'budget',    ko: '예산 설정',              en: 'Set budget',                  fr: 'Définir le budget'             },
  { id: 'hood',      ko: '동네 선택',              en: 'Choose neighbourhood',         fr: 'Choisir le quartier'           },
  { id: 'visits',    ko: '아파트 방문 일정 잡기',   en: 'Schedule apartment visits',   fr: 'Planifier les visites'         },
  { id: 'lease',     ko: '임대차 계약 내용 확인',   en: 'Verify lease details',        fr: 'Vérifier les détails du bail'  },
  { id: 'hydro',     ko: 'Hydro-Québec 계좌 개설', en: 'Open Hydro-Québec account',   fr: 'Ouvrir un compte Hydro-Québec' },
  { id: 'internet',  ko: '인터넷 설치',             en: 'Set up internet',             fr: 'Installer internet'            },
  { id: 'insurance', ko: '세입자 보험 가입',        en: 'Get tenant insurance',        fr: 'Souscrire une assurance locataire' },
  { id: 'transit',   ko: '현지 교통 익히기',        en: 'Learn local transportation',  fr: 'Apprendre les transports locaux' },
]

// ─── Neighbourhood data ───────────────────────────────────────────────────────

interface Hood {
  id: string; name: string; label: string
  summary: Tri; tags: string[]
  goodFor: Tri[]; note: Tri
  // SVG pin position (viewBox 0 0 400 300)
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

// ─── Simplified Montréal SVG map ──────────────────────────────────────────────
// ViewBox 0 0 400 300 — island outline is schematic, not a real GIS projection

function MontrealMap({
  selected, onSelect,
}: { selected: string; onSelect: (id: string) => void }) {
  return (
    <svg
      viewBox="0 0 400 300"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-label="Montréal neighbourhood map"
    >
      {/* Island silhouette — simplified ellipse-ish polygon */}
      <path
        d="M 80 195 C 70 170 75 130 90 105 C 110 75 145 58 185 52
           C 225 46 270 55 300 72 C 330 90 345 118 348 148
           C 352 178 340 208 320 228 C 300 248 270 258 240 262
           C 210 267 178 262 155 252 C 130 242 108 230 95 215 Z"
        fill="#F8F8F8"
        stroke="#E0E0E0"
        strokeWidth="1.5"
      />

      {/* River label */}
      <text x="188" y="278" textAnchor="middle" fontSize="8" fill="#BDBDBD" fontFamily="sans-serif" letterSpacing="1">
        ST. LAWRENCE RIVER
      </text>

      {/* Neighbourhood pins */}
      {HOODS.map(hood => {
        const isActive = selected === hood.id
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
            <circle cx={hood.x} cy={hood.y} r="14" fill="transparent" />

            {/* Pin circle */}
            <circle
              cx={hood.x}
              cy={hood.y}
              r={isActive ? 7 : 5}
              fill={isActive ? '#111111' : '#9CA3AF'}
              stroke={isActive ? '#111111' : '#ffffff'}
              strokeWidth={isActive ? 0 : 1.5}
              style={{ transition: 'all 0.15s ease' }}
            />

            {/* Yellow ring for selected */}
            {isActive && (
              <circle
                cx={hood.x}
                cy={hood.y}
                r="11"
                fill="none"
                stroke="var(--y)"
                strokeWidth="2"
              />
            )}

            {/* Label */}
            <text
              x={hood.x}
              y={hood.y - 14}
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

      {/* Scale hint */}
      <text x="320" y="288" textAnchor="end" fontSize="7" fill="#D1D5DB" fontFamily="sans-serif">
        Montréal Island
      </text>
    </svg>
  )
}

// ─── Neighbourhood comments ───────────────────────────────────────────────────

function CommentSection({
  hoodId, lang, t,
}: { hoodId: string; lang: string; t: (ko: string, en: string, fr: string) => string }) {
  const { user } = useAuth()
  const navigate = useNavigate()
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
    getNeighbourhoodComments(hoodId)
      .then(setComments)
      .finally(() => setLoading(false))
  }, [hoodId])

  async function handleSubmit() {
    if (!text.trim() || !user) return
    setSubmitting(true)
    setError('')
    try {
      const displayName = user.email?.split('@')[0] ?? '익명'
      const newComment = await addNeighbourhoodComment(hoodId, user.id, displayName, text.trim())
      setComments(prev => [newComment, ...prev])
      setText('')
      setShowForm(false)
    } catch {
      setError(t('저장에 실패했습니다.', 'Failed to save.', 'Échec de l\'enregistrement.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(commentId: string) {
    if (!user) return
    try {
      await deleteNeighbourhoodComment(commentId, user.id)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch {
      // silently ignore
    }
  }

  function handleCommentClick() {
    if (!user) {
      navigate('/login')
    } else {
      setShowForm(prev => !prev)
    }
  }

  const shown = comments.slice(0, 3)

  return (
    <div className="border-t border-gray-100 pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
          {t('거주자 코멘트', 'Resident Comments', 'Commentaires')}
        </p>
        <button
          onClick={handleCommentClick}
          className="text-[11px] font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          {t('코멘트 남기기 +', 'Leave a comment +', 'Laisser un commentaire +')}
        </button>
      </div>

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
      ) : shown.length === 0 ? (
        <p className="text-[12px] text-gray-400 leading-snug">
          {t(
            '아직 등록된 코멘트가 없습니다. 이 동네에 살아본 경험을 남겨주세요.',
            'No comments yet. Share your experience living here.',
            "Aucun commentaire pour l'instant. Partagez votre expérience ici.",
          )}
        </p>
      ) : (
        <div className="space-y-2">
          {shown.map(c => (
            <div key={c.id} className="flex gap-2.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                style={{ background: 'var(--y)', color: '#111' }}
              >
                {(c.display_name?.[0] ?? '?').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-gray-700">{c.display_name}</span>
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
          ))}
          {comments.length > 3 && (
            <p className="text-[11px] text-gray-400 pt-1">
              {t(`+${comments.length - 3}개 더`, `+${comments.length - 3} more`, `+${comments.length - 3} de plus`)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Neighbourhood detail panel ───────────────────────────────────────────────

function NeighbourhoodPanel({ hood, lang, t }: {
  hood: Hood
  lang: string
  t: (ko: string, en: string, fr: string) => string
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

      <CommentSection hoodId={hood.id} lang={lang} t={t} />
    </div>
  )
}

// ─── Map section (combined) ───────────────────────────────────────────────────

function NeighbourhoodMapSection({ lang, t }: {
  lang: string
  t: (ko: string, en: string, fr: string) => string
}) {
  const [selectedId, setSelectedId] = useState('plateau')
  const selected = HOODS.find(h => h.id === selectedId) ?? HOODS[0]

  return (
    <section>
      <SectionLabel>{t('몬트리올 동네 지도', 'Montréal Neighbourhood Map', 'Carte des quartiers de Montréal')}</SectionLabel>
      <p className="text-[13px] text-gray-500 mb-4">
        {t(
          '지도에서 동네를 선택하고, 실제로 살아본 사람들의 이야기를 확인해보세요.',
          'Click a neighbourhood on the map to see details and resident comments.',
          'Cliquez sur un quartier pour voir les détails et les commentaires des résidents.',
        )}
      </p>

      {/* Desktop: side by side | Mobile: stacked */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Map */}
        <div className="lg:w-[60%] border border-gray-200 rounded-2xl overflow-hidden bg-white p-2" style={{ minHeight: 240 }}>
          <MontrealMap selected={selectedId} onSelect={setSelectedId} />
        </div>

        {/* Detail panel */}
        <div className="lg:w-[40%] border border-gray-200 rounded-2xl px-4 py-4 bg-white overflow-y-auto" style={{ maxHeight: 480 }}>
          <NeighbourhoodPanel hood={selected} lang={lang} t={t} />
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Settling() {
  const { lang, t } = useLang()
  const { user } = useAuth()
  const navigate = useNavigate()

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

  function handleSharePost() {
    if (!user) { navigate('/login'); return }
    navigate('/board')
  }

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
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'var(--y)' }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
              {CHECKLIST_ITEMS.map(item => {
                const done = checked.has(item.id)
                return (
                  <button key={item.id} onClick={() => toggle(item.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${done ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                  >
                    <span className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                      style={done ? { background: 'var(--y)', borderColor: 'var(--y)' } : { borderColor: '#D1D5DB' }}>
                      {done && <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round"><polyline points="2,6 5,9 10,3"/></svg>}
                    </span>
                    <span className={`text-[13px] font-medium ${done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{tri(item, lang)}</span>
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
            {t('집을 구하기 전에 알아두면 좋은 몬트리올의 기본 구조.', 'What to understand about Montréal before you start looking.', "Ce qu'il faut savoir avant de commencer à chercher.")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {START_CARDS.map(card => (
              <div key={card.slug} className="border border-gray-200 rounded-2xl px-4 py-4 bg-white flex flex-col gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{tri(card.category, lang)}</span>
                <p className="text-[14px] font-bold text-gray-900 leading-snug">{tri(card.title, lang)}</p>
                <p className="text-[12px] text-gray-500 leading-snug flex-1">{tri(card.desc, lang)}</p>
                <Link to={`/settling/${card.slug}`} className={ctaCls}>{t('읽어보기 →', 'Read more →', 'Lire →')}</Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── NEIGHBOURHOOD MAP ── */}
        <NeighbourhoodMapSection lang={lang} t={t} />

        {/* ── HAKKYO CITY ── */}
        <section>
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
                  <Link to={`/settling/${story.slug}`} className={ctaCls}>{t('읽어보기 →', 'Read more →', 'Lire →')}</Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── COMMUNITY BOARD ── */}
        <section>
          <SectionLabel>{t('커뮤니티 주거 게시판', 'Community Housing Board', 'Tableau de logement communautaire')}</SectionLabel>
          <p className="text-[13px] text-gray-500 mb-4">
            {t('커뮤니티가 함께 만드는 주거, 룸메이트, 가구, 이사 도움 게시판.', 'Community-driven housing, roommate, furniture, and moving posts.', 'Annonces de logement, colocataires, meubles et aide au déménagement.')}
          </p>
          <div className="flex gap-2 flex-wrap mb-4">
            {[
              { ko: '주거', en: 'Housing', fr: 'Logement' },
              { ko: '룸메이트', en: 'Roommates', fr: 'Colocataires' },
              { ko: '가구', en: 'Furniture', fr: 'Meubles' },
              { ko: '이사 도움', en: 'Moving Help', fr: 'Aide au déménagement' },
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
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1"
                      style={{ background: CAT_BG[catKey] ?? '#F3F4F6', color: CAT_FG[catKey] ?? '#374151' }}>
                      {tri(post.category, lang)}
                    </span>
                    <p className="text-[13px] font-semibold text-gray-800 leading-snug">{tri(post.title, lang)}</p>
                  </div>
                  <p className="text-[11px] text-gray-400 shrink-0 mt-0.5">{tri(post.meta, lang)}</p>
                </div>
              )
            })}
          </div>
          <button
            onClick={handleSharePost}
            className="flex items-center justify-center gap-2 w-full border border-gray-200 rounded-2xl py-3 text-[13px] font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            {t('경험 공유하기 →', 'Share your experience →', 'Partager votre expérience →')}
          </button>
          {!user && (
            <p className="text-center text-[11px] text-gray-400 mt-2">
              {t('글을 작성하려면 ', 'You must ', 'Vous devez ')}
              <Link to="/login" className="underline hover:text-gray-600">{t('로그인', 'log in', 'vous connecter')}</Link>
              {t('이 필요합니다.', ' to post.', ' pour publier.')}
            </p>
          )}
        </section>

      </div>
    </div>
  )
}
