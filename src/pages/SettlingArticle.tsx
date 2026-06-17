import { useParams, Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'

type Tri = { ko: string; en: string; fr: string }
function tri(f: Tri, lang: string): string {
  return lang === 'ko' ? f.ko : lang === 'fr' ? f.fr : f.en
}

const ARTICLES: Record<string, { category: Tri; title: Tri; desc: Tri }> = {
  'moving-day': {
    category: { ko: '이사 문화', en: 'Moving Culture', fr: 'Culture du déménagement' },
    title:    { ko: '이사의 날', en: 'Moving Day', fr: 'Jour du déménagement' },
    desc:     { ko: '몬트리올에서는 왜 7월 1일에 많은 사람들이 동시에 이사를 할까요?', en: 'Why does Montréal have a city-wide moving season on July 1st?', fr: "Pourquoi tant de Montréalais déménagent-ils le 1er juillet ?" },
  },
  'quebec-lease': {
    category: { ko: '임대 계약', en: 'Leases', fr: 'Baux' },
    title:    { ko: '퀘벡 임대차 계약 이해하기', en: 'Understanding Québec Leases', fr: 'Comprendre les baux québécois' },
    desc:     { ko: 'Lease, 양도, 갱신, 전대차를 처음 보는 사람도 이해할 수 있게 정리합니다.', en: 'Lease, transfer, renewal, and sublet explained for first-timers.', fr: 'Bail, cession, renouvellement et sous-location expliqués simplement.' },
  },
  'housing-scams': {
    category: { ko: '안전', en: 'Safety', fr: 'Sécurité' },
    title:    { ko: '주거 사기 주의', en: 'Housing Scams', fr: 'Arnaques immobilières' },
    desc:     { ko: '페이스북 마켓플레이스에서 자주 보이는 사기 유형과 계약 전 확인해야 할 것들.', en: 'Common Facebook Marketplace scams and what to check before signing.', fr: 'Arnaques courantes et vérifications avant de signer.' },
  },
  'first-apartment-checklist': {
    category: { ko: '체크리스트', en: 'Checklist', fr: 'Liste de contrôle' },
    title:    { ko: '첫 아파트 체크리스트', en: 'First Apartment Checklist', fr: "Liste pour le premier appartement" },
    desc:     { ko: '계약서에 서명하기 전에 집 안에서 반드시 확인해야 할 기본 항목들.', en: 'Everything to inspect inside an apartment before signing the lease.', fr: "Tout ce qu'il faut vérifier avant de signer un bail." },
  },
  'lululemon-neighbourhood': {
    category: { ko: '도시 생활', en: 'City Life', fr: 'Vie urbaine' },
    title:    { ko: '왜 몬트리올에서는 집 근처 룰루레몬을 볼까?', en: 'Why do people look for a Lululemon near their apartment?', fr: 'Pourquoi chercher un Lululemon près de chez soi ?' },
    desc:     { ko: '어떤 브랜드가 있다는 것은 단순한 매장이 아니라, 동네의 분위기와 생활 반경을 보여주는 신호가 되기도 합니다.', en: 'A store can tell you more about a neighbourhood than a map.', fr: "Un magasin peut en dire plus sur un quartier qu'une carte." },
  },
  'moving-day-history': {
    category: { ko: '이사 문화', en: 'Moving Culture', fr: 'Culture du déménagement' },
    title:    { ko: '몬트리올 Moving Day는 어떻게 시작됐을까?', en: 'The history of Montréal Moving Day', fr: "L'histoire du jour du déménagement à Montréal" },
    desc:     { ko: '7월 1일, 캐나다 데이와 이사의 날이 겹치는 도시의 독특한 풍경.', en: "Every year on July 1st, the whole city moves at once. Here's why.", fr: 'Chaque année le 1er juillet, toute la ville déménage en même temps.' },
  },
  'renting-things-to-know': {
    category: { ko: '임대 생활', en: 'Renting', fr: 'Location' },
    title:    { ko: '몬트리올에서 임대하기 전에 아무도 알려주지 않는 것들', en: 'Things nobody tells you before renting in Montréal', fr: 'Ce que personne ne vous dit avant de louer à Montréal' },
    desc:     { ko: '난방, 세탁기, 습기, 벌레, 소음처럼 계약서만 보고는 알기 어려운 현실적인 기준들.', en: 'Heating, laundry, humidity, bugs, noise — the things you only discover after signing.', fr: 'Chauffage, lessive, humidité, bruit — ce que vous découvrez après avoir signé.' },
  },
  'neighbourhood-differences': {
    category: { ko: '동네 이야기', en: 'Neighbourhoods', fr: 'Quartiers' },
    title:    { ko: '왜 어떤 동네들은 완전히 다른 느낌일까요?', en: 'Why some neighbourhoods feel completely different', fr: 'Pourquoi certains quartiers semblent complètement différents' },
    desc:     { ko: '같은 도시 안에서도 언어, 교통, 건축, 상권에 따라 전혀 다른 생활 리듬이 만들어집니다.', en: 'Language, transit, architecture, and commerce create entirely different rhythms within the same city.', fr: 'La langue, les transports et le commerce créent des rythmes très différents au sein de la même ville.' },
  },
}

export default function SettlingArticle() {
  const { slug } = useParams<{ slug: string }>()
  const { lang, t } = useLang()

  const article = slug ? ARTICLES[slug] : undefined

  if (!article) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-[13px] text-gray-400 mb-4">{t('페이지를 찾을 수 없습니다.', 'Page not found.', 'Page introuvable.')}</p>
          <Link to="/settling" className="text-[13px] font-semibold text-gray-700 hover:text-gray-900">← {t('돌아가기', 'Back', 'Retour')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-white pb-24">
      <div className="max-w-[720px] mx-auto px-4 py-8">
        <Link to="/settling" className="inline-flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors mb-6">
          ← {t('나만의 공간 찾기', 'Finding Home', 'Trouver un Logement')}
        </Link>

        <div className="mb-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            {tri(article.category, lang)}
          </span>
        </div>
        <h1 className="text-[22px] font-bold text-gray-900 leading-snug mb-3">
          {tri(article.title, lang)}
        </h1>
        <p className="text-[14px] text-gray-500 leading-relaxed mb-8">
          {tri(article.desc, lang)}
        </p>

        <div className="border border-gray-200 rounded-2xl px-6 py-8 text-center bg-white">
          <p className="text-[13px] text-gray-400">
            {t('전체 가이드를 준비하고 있습니다.', 'Full guide coming soon.', 'Guide complet bientôt disponible.')}
          </p>
        </div>
      </div>
    </div>
  )
}
