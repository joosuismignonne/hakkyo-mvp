import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { getSettlingGuide, type SettlingGuide } from '../lib/db'

// ─── Local fallback content (shown when Supabase is unconfigured or offline) ──
// Also serves as the seeded article content for SQL migration reference.

interface LocalGuide {
  slug: string
  category: string
  title_ko: string
  summary_ko: string
  content_ko: string
}

const LOCAL_GUIDES: Record<string, LocalGuide> = {
  'moving-day': {
    slug: 'moving-day',
    category: '이사 문화',
    title_ko: '이사의 날',
    summary_ko: '몬트리올에서는 왜 7월 1일에 많은 사람들이 동시에 이사를 할까요?',
    content_ko: `몬트리올에서 집을 구하다 보면 "Moving Day"라는 말을 자주 듣게 됩니다. 단순히 이사를 많이 하는 날이 아니라, 도시 전체가 동시에 움직이는 것처럼 보이는 독특한 문화입니다.

퀘벡에서는 오래전부터 많은 임대 계약이 6월 30일에 끝나고 7월 1일에 새 계약이 시작되는 구조가 이어져 왔습니다. 그래서 매년 7월 1일이 되면 거리에는 이삿짐 트럭, 매트리스, 소파, 박스가 한꺼번에 나타납니다.

이 시기에는 집을 구하는 사람도 많고, 집을 내놓는 사람도 많습니다. 보통 3월부터 매물이 조금씩 나오기 시작하고, 5월과 6월에는 가장 많은 매물이 올라옵니다. 7월 입주를 생각한다면 너무 늦게 찾기보다 봄부터 동네와 예산을 정리해두는 것이 좋습니다.

처음 몬트리올에 온 사람에게 Moving Day는 조금 혼란스럽게 느껴질 수 있습니다. 하지만 이 구조를 이해하면 집을 구하는 타이밍을 잡기가 훨씬 쉬워집니다. 몬트리올에서 집을 구한다는 것은 단순히 방 하나를 찾는 일이 아니라, 이 도시가 움직이는 리듬을 이해하는 일이기도 합니다.

체크리스트:
- 7월 입주를 원한다면 3월부터 매물을 확인하기
- 5월과 6월에는 방문 예약을 빠르게 잡기
- Moving Day 근처에는 이삿짐 차량 예약이 어려울 수 있음
- 엘리베이터 예약이 필요한 건물인지 확인하기
- 기존 세입자의 lease transfer인지 새 계약인지 확인하기`,
  },

  'quebec-lease': {
    slug: 'quebec-lease',
    category: '임대 계약',
    title_ko: '퀘벡 임대차 계약 이해하기',
    summary_ko: 'Lease, 양도, 갱신, 전대차를 처음 보는 사람도 이해할 수 있게 정리합니다.',
    content_ko: `퀘벡에서 집을 구할 때 가장 먼저 이해해야 하는 단어는 lease입니다. Lease는 임대차 계약서입니다. 월세, 계약 기간, 포함 항목, 규칙이 이 문서 안에 들어갑니다.

계약서에 서명하기 전에는 월세에 무엇이 포함되어 있는지 확인해야 합니다. 난방, 전기, 온수, 인터넷, 가전제품, 세탁 시설이 포함되어 있는지에 따라 실제 생활비가 달라집니다.

몬트리올에서는 lease transfer라는 표현도 자주 보입니다. 이는 기존 세입자의 계약을 새 사람이 이어받는 방식입니다. 새로 계약을 시작하는 것과 다르게, 기존 계약 조건이 유지되는 경우가 많기 때문에 월세가 상대적으로 안정적일 수 있습니다. 하지만 계약 기간, 포함 항목, 집주인의 승인 여부를 반드시 확인해야 합니다.

Sublet은 전대차입니다. 기존 세입자가 일정 기간 동안 다른 사람에게 집을 빌려주는 방식입니다. 단기 체류에는 유용할 수 있지만, 책임 관계가 복잡할 수 있으므로 문서로 조건을 남기는 것이 중요합니다.

Lease renewal은 계약 갱신입니다. 계약 종료 전에 집주인이 갱신 조건이나 월세 인상 내용을 보낼 수 있습니다. 이때 세입자는 기한 안에 응답해야 하므로, 받은 문서를 그냥 지나치지 않는 것이 중요합니다.

체크리스트:
- 월세에 난방, 전기, 온수가 포함되어 있는지 확인하기
- 계약 기간 확인하기
- Lease transfer인지 새 계약인지 확인하기
- Sublet이라면 원 세입자와 집주인 관계 확인하기
- 월세 인상 조건 확인하기
- 서명 전 모든 약속은 문자나 이메일로 남기기`,
  },

  'housing-scams': {
    slug: 'housing-scams',
    category: '안전',
    title_ko: '주거 사기 주의',
    summary_ko: '페이스북 마켓플레이스에서 자주 보이는 사기 유형과 계약 전 확인해야 할 것들.',
    content_ko: `몬트리올에서 집을 구할 때 Facebook Marketplace, Kijiji, Craigslist, 커뮤니티 게시판을 많이 사용합니다. 하지만 집을 직접 보기도 전에 돈을 요구하거나, 지나치게 좋은 조건을 제시하는 글은 조심해야 합니다.

가장 흔한 사기 유형은 집을 보여주기 전에 보증금이나 예약금을 요구하는 경우입니다. "다른 사람이 바로 계약하려고 한다", "먼저 돈을 보내면 잡아두겠다"는 식의 압박을 주기도 합니다. 실제로 집을 보지 않았고, 계약서도 확인하지 않았다면 돈을 보내지 않는 것이 안전합니다.

사진이 너무 좋아 보이는데 월세가 주변 시세보다 훨씬 낮은 경우도 의심해야 합니다. 같은 사진이 다른 도시나 다른 주소로 올라와 있는 경우도 있습니다. 가능하다면 이미지 검색을 해보고, 주소와 건물 정보를 따로 확인하세요.

집주인 또는 세입자라고 말하는 사람이 직접 만나기를 피하고, 해외에 있어서 열쇠를 보낼 수 있다고 하는 경우도 전형적인 위험 신호입니다.

체크리스트:
- 집을 직접 보기 전 송금하지 않기
- 주변 시세보다 너무 저렴한 매물 의심하기
- 주소와 사진을 따로 검색해보기
- 계약서 없이 보증금 보내지 않기
- 집주인 또는 세입자의 신원 확인하기
- 대화 내용과 약속은 캡처해두기`,
  },

  'first-apartment-checklist': {
    slug: 'first-apartment-checklist',
    category: '체크리스트',
    title_ko: '첫 아파트 체크리스트',
    summary_ko: '계약서에 서명하기 전에 집 안에서 반드시 확인해야 할 기본 항목들.',
    content_ko: `첫 아파트를 볼 때는 분위기만 보고 결정하기 쉽습니다. 하지만 실제로 살기 시작하면 작은 조건들이 생활의 편리함을 크게 좌우합니다.

가장 먼저 확인해야 할 것은 난방입니다. 몬트리올의 겨울은 길고 춥기 때문에 난방 방식과 비용 포함 여부가 중요합니다. 전기 난방인지, 중앙 난방인지, 난방비가 월세에 포함되어 있는지 확인하세요.

세탁 시설도 중요합니다. 집 안에 세탁기가 있는지, 건물 공용 세탁실을 사용하는지, 근처 laundromat을 이용해야 하는지에 따라 생활 패턴이 달라집니다.

습기와 벌레도 확인해야 합니다. 특히 반지하나 오래된 건물은 창문 주변, 욕실, 부엌 아래쪽을 자세히 보는 것이 좋습니다. 곰팡이 냄새가 나거나 벽지가 들떠 있다면 이유를 확인해야 합니다.

소음도 중요합니다. 위층 소리, 거리 소음, 주변 바나 식당, 버스 정류장 위치는 생활 만족도에 큰 영향을 줍니다.

체크리스트:
- 난방 방식과 비용 포함 여부 확인
- 전기, 온수, 인터넷 포함 여부 확인
- 세탁 시설 확인
- 창문 단열 상태 확인
- 습기, 곰팡이, 벌레 흔적 확인
- 냉장고, 오븐, 수도 상태 확인
- 밤 시간대 주변 소음 확인
- 지하철, 버스, 마트까지 거리 확인`,
  },
}

// ─── Content rendering helpers ────────────────────────────────────────────────

// Splits "체크리스트:\n- item\n- item" out of body text
// Returns { body: string[], checklist: string[] }
function parseContent(raw: string): { paragraphs: string[]; checklist: string[] } {
  // Match both "체크리스트:" (with colon) and "체크리스트\n-" (without colon, DB format)
  const checklistMarkers = ['체크리스트:', 'Checklist:', 'Liste de contrôle:', '체크리스트\n', 'Checklist\n']
  let splitIndex = -1
  let markerLen = 0

  for (const marker of checklistMarkers) {
    const idx = raw.indexOf(marker)
    if (idx !== -1 && (splitIndex === -1 || idx < splitIndex)) {
      splitIndex = idx
      // For markers without trailing colon, only consume the word (not the newline)
      markerLen = marker.endsWith('\n') ? marker.length - 1 : marker.length
    }
  }

  if (splitIndex === -1) {
    const paragraphs = raw.split('\n\n').map(p => p.trim()).filter(Boolean)
    return { paragraphs, checklist: [] }
  }

  const bodyRaw = raw.slice(0, splitIndex).trim()
  const checkRaw = raw.slice(splitIndex + markerLen).trim()

  const paragraphs = bodyRaw.split('\n\n').map(p => p.trim()).filter(Boolean)
  const checklist = checkRaw
    .split('\n')
    .map(l => l.trim().replace(/^[-•]\s*/, ''))
    .filter(Boolean)

  return { paragraphs, checklist }
}

// Pick the best language field with ko fallback
function pickField(
  ko: string | null | undefined,
  en: string | null | undefined,
  fr: string | null | undefined,
  lang: string,
): string {
  if (lang === 'en') return en?.trim() || ko?.trim() || ''
  if (lang === 'fr') return fr?.trim() || ko?.trim() || ''
  return ko?.trim() || ''
}

// ─── Article page ─────────────────────────────────────────────────────────────

export default function SettlingArticle() {
  const { slug } = useParams<{ slug: string }>()
  const { lang, t } = useLang()

  const [guide, setGuide] = useState<SettlingGuide | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return }

    setLoading(true)
    setNotFound(false)
    setGuide(null)

    getSettlingGuide(slug).then(data => {
      if (data) {
        setGuide(data)
      } else {
        // Fall back to local content when Supabase is unconfigured or row missing
        const local = LOCAL_GUIDES[slug]
        if (local) {
          setGuide({
            id: local.slug,
            slug: local.slug,
            category: local.category,
            title_ko: local.title_ko,
            title_en: null,
            title_fr: null,
            summary_ko: local.summary_ko,
            summary_en: null,
            summary_fr: null,
            content_ko: local.content_ko,
            content_en: null,
            content_fr: null,
            status: 'published',
            created_at: '',
          })
        } else {
          setNotFound(true)
        }
      }
    }).finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center">
        <div className="w-4 h-4 border border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !guide) {
    return (
      <div className="w-full min-h-screen bg-white pb-24">
        <div className="max-w-[720px] mx-auto px-4 py-8">
          <Link to="/settling" className="inline-flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors mb-8">
            ← {t('나만의 공간 찾기', 'Finding My Place', 'Trouver mon logement')}
          </Link>
          <p className="text-[14px] text-gray-400">
            {t('아직 등록되지 않은 가이드입니다.', 'This guide has not been published yet.', "Ce guide n'a pas encore été publié.")}
          </p>
        </div>
      </div>
    )
  }

  const title   = pickField(guide.title_ko,   guide.title_en,   guide.title_fr,   lang)
  const summary = pickField(guide.summary_ko,  guide.summary_en, guide.summary_fr, lang)
  const content = pickField(guide.content_ko,  guide.content_en, guide.content_fr, lang)

  const { paragraphs, checklist } = parseContent(content)

  return (
    <div className="w-full min-h-screen bg-white pb-24">
      <div className="max-w-[720px] mx-auto px-4 py-8">

        {/* Back link */}
        <Link
          to="/settling"
          className="inline-flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors mb-8"
        >
          ← {t('나만의 공간 찾기로 돌아가기', 'Back to Finding My Place', 'Retour à Trouver mon logement')}
        </Link>

        {/* Meta */}
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
          {guide.category}
        </p>

        {/* Title */}
        <h1 className="text-[24px] font-bold text-gray-900 leading-snug mb-3">
          {title}
        </h1>

        {/* Summary */}
        {summary && (
          <p className="text-[15px] text-gray-500 leading-relaxed mb-6 pb-6 border-b border-gray-100">
            {summary}
          </p>
        )}

        {/* Body */}
        <div className="space-y-4 mb-8">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-[14px] text-gray-700 leading-relaxed">
              {p}
            </p>
          ))}
        </div>

        {/* Checklist block */}
        {checklist.length > 0 && (
          <div className="border border-gray-200 rounded-2xl px-5 py-5 mb-8">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              {t('체크리스트', 'Checklist', 'Liste de contrôle')}
            </p>
            <ul className="space-y-2">
              {checklist.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span
                    className="w-4 h-4 rounded border-2 shrink-0 mt-0.5"
                    style={{ borderColor: '#D1D5DB' }}
                  />
                  <span className="text-[13px] text-gray-700 leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Bottom back link */}
        <Link
          to="/settling"
          className="inline-flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← {t('나만의 공간 찾기로 돌아가기', 'Back to Finding My Place', 'Retour à Trouver mon logement')}
        </Link>

      </div>
    </div>
  )
}
