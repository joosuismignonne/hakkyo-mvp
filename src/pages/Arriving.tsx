import React from 'react'
import { tri, type Tri, type JourneyStep } from '../types/journey'
import JourneyPage from '../components/JourneyPage'

const PROGRESS_KEY = 'hakkyo_arriving_settling_v1'

// TabContent is an alias kept for the data declarations below
type TabContent = JourneyStep

// ─── Housing platform search tiles (Arriving-only) ───────────────────────────

interface SearchPlatform {
  name: string
  tag: Tri
  url: string
  color: string   // tailwind bg class for accent bar
  icon: string    // tabler icon name
  priceHint: Tri
}

const SEARCH_PLATFORMS: SearchPlatform[] = [
  {
    name: 'Kijiji',
    tag: { ko: '캐나다 최대 무료 광고', en: "Canada's largest classifieds", fr: 'Plus grand site d\'annonces' },
    url: 'https://www.kijiji.ca/b-apartments-condos/ville-de-montreal/c37l80002a10',
    color: 'bg-[#3B6AF0]',
    icon: 'ti-layout-grid',
    priceHint: { ko: '$700–2,500/월', en: '$700–2,500/mo', fr: '700–2 500$/mois' },
  },
  {
    name: 'DuProprio',
    tag: { ko: '집주인 직거래 · 중개 수수료 없음', en: 'Owner-direct · no agent fee', fr: 'Sans intermédiaire · sans commission' },
    url: 'https://duproprio.com/en/to-rent/apartment/search?is_for_rent=1&cities[]=10',
    color: 'bg-[#E35B1A]',
    icon: 'ti-home',
    priceHint: { ko: '$900–2,000/월', en: '$900–2,000/mo', fr: '900–2 000$/mois' },
  },
  {
    name: 'FB Marketplace',
    tag: { ko: '현지인 직거래 · 저렴한 매물', en: 'Local listings · budget options', fr: 'Annonces locales · abordable' },
    url: 'https://www.facebook.com/marketplace/montreal/propertyrentals',
    color: 'bg-[#1877F2]',
    icon: 'ti-brand-facebook',
    priceHint: { ko: '$600–1,800/월', en: '$600–1,800/mo', fr: '600–1 800$/mois' },
  },
  {
    name: 'Centris',
    tag: { ko: '퀘벡 공인 중개사 공식 플랫폼', en: 'Official Québec broker platform', fr: 'Plateforme officielle des courtiers QC' },
    url: 'https://www.centris.ca/en/properties~for-rent~montreal',
    color: 'bg-[#BF0000]',
    icon: 'ti-building-skyscraper',
    priceHint: { ko: '$1,000–3,000/월', en: '$1,000–3,000/mo', fr: '1 000–3 000$/mois' },
  },
  {
    name: 'Rentals.ca',
    tag: { ko: '전국 임대 전문 플랫폼', en: 'Canada-wide rental platform', fr: 'Plateforme nationale de location' },
    url: 'https://rentals.ca/montreal',
    color: 'bg-[#00875A]',
    icon: 'ti-key',
    priceHint: { ko: '$800–2,200/월', en: '$800–2,200/mo', fr: '800–2 200$/mois' },
  },
  {
    name: 'Zumper',
    tag: { ko: '지도 기반 검색', en: 'Map-based search', fr: 'Recherche par carte' },
    url: 'https://www.zumper.com/apartments-for-rent/montreal-qc',
    color: 'bg-[#6B21A8]',
    icon: 'ti-map-search',
    priceHint: { ko: '$900–2,500/월', en: '$900–2,500/mo', fr: '900–2 500$/mois' },
  },
]

interface LiveListing {
  title: string
  link: string
  price: string | null
  image: string | null
  pubDate: string
  location: string | null
  source: string
}

function HousingListings({ lang }: { lang: string }) {
  const [live, setLive] = React.useState<LiveListing[]>([])
  const [liveState, setLiveState] = React.useState<'loading' | 'ok' | 'none'>('loading')
  const [updatedAt, setUpdatedAt] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch('/api/listings')
      .then(r => r.json())
      .then(d => {
        if (d.items?.length > 0) {
          setLive(d.items)
          setUpdatedAt(d.updatedAt ?? null)
          setLiveState('ok')
        } else {
          setLiveState('none')
        }
      })
      .catch(() => setLiveState('none'))
  }, [])

  const searchNow: Tri = { ko: '지금 검색 →', en: 'Search now →', fr: 'Rechercher →' }
  const liveLabel: Tri = { ko: '실시간 매물', en: 'Live listings', fr: 'Annonces en direct' }
  const updLabel: Tri = { ko: '업데이트', en: 'Updated', fr: 'Mis à jour' }
  const noPriceLabel: Tri = { ko: '가격 문의', en: 'Ask for price', fr: 'Prix sur demande' }

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString(
        lang === 'ko' ? 'ko-KR' : lang === 'fr' ? 'fr-CA' : 'en-CA',
        { month: 'short', day: 'numeric' }
      )
    } catch { return d }
  }

  return (
    <div className="space-y-6">
      {/* Live listings strip (shown only if API succeeded) */}
      {liveState === 'ok' && live.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
              <span className="text-[11px] text-gray-500">
                {tri(liveLabel, lang)}{updatedAt ? ` · ${tri(updLabel, lang)} ${formatDate(updatedAt)}` : ''}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {live.map((l, i) => (
              <a
                key={i}
                href={l.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block border border-gray-100 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all bg-white no-underline"
              >
                {l.image ? (
                  <div className="h-28 overflow-hidden bg-gray-50">
                    <img src={l.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  </div>
                ) : (
                  <div className="h-28 bg-gray-50 flex items-center justify-center">
                    <i className="ti ti-building text-[28px] text-gray-200" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-[13px] font-bold text-gray-900 mb-0.5">{l.price ?? tri(noPriceLabel, lang)}</p>
                  <p className="text-[11px] text-gray-500 leading-snug line-clamp-2">{l.title}</p>
                  {l.location && (
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      <i className="ti ti-map-pin text-[10px]" />{l.location}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Platform search tiles — always visible */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SEARCH_PLATFORMS.map(p => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 hover:shadow-md transition-all bg-white no-underline"
          >
            <div className={`h-1 w-full ${p.color}`} />
            <div className="p-3 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-1.5">
                <span className="text-[13px] font-semibold text-gray-900">{p.name}</span>
                <i className={`ti ${p.icon} text-[15px] text-gray-300 group-hover:text-gray-500 transition-colors mt-0.5`} />
              </div>
              <p className="text-[10px] text-gray-400 leading-snug flex-1">{tri(p.tag, lang)}</p>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[10px] font-medium text-gray-500">{tri(p.priceHint, lang)}</span>
                <span className="text-[10px] text-gray-400 group-hover:text-gray-700 transition-colors">{tri(searchNow, lang)}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

// ─── TAB 1: SIM card ──────────────────────────────────────────────────────────

const SIM_TAB: TabContent = {
  id: 'sim',
  label: { ko: 'SIM 카드', en: 'SIM card', fr: 'Carte SIM' },
  hero: {
    title: {
      ko: '도착하는 순간부터 연결된 상태로',
      en: 'Stay connected from the moment you land',
      fr: 'Restez connecté dès votre arrivée',
    },
    sub: {
      ko: '캐나다 SIM 카드는 휴대폰을 현지 통신망에 연결해 통화, 문자, 데이터를 쓸 수 있게 해줘요. 없으면 도착해서 숙소 호스트에게 연락하거나, 택시를 부르거나, 길을 찾기가 어려워요.',
      en: "A Canadian SIM card connects your phone to local networks for calls, texts, and data. Without one, you won't be able to reach your housing contact, call a taxi, or navigate when you arrive.",
      fr: "Une carte SIM canadienne connecte votre téléphone aux réseaux locaux pour les appels, textos et données. Sans elle, difficile de joindre votre hôte, d'appeler un taxi ou de vous orienter à l'arrivée.",
    },
    when: { ko: '도착 당일 또는 그 전날', en: 'Arrival day, or the day before', fr: "Le jour d'arrivée ou la veille" },
    cost: { ko: '$15–80/월', en: '$15–80/mo', fr: '15–80$/mois' },
    time: { ko: '5분 (eSIM) ~ 1시간 (매장)', en: '5 min (eSIM) to 1 hr (in-store)', fr: '5 min (eSIM) à 1h (boutique)' },
    canBeforeArrival: { ko: '네, eSIM 가능', en: 'Yes, via eSIM', fr: 'Oui, via eSIM' },
  },
  options: [
    {
      name: '한국에서 미리 — Airalo eSIM',
      sub: { ko: '출국 전 앱으로 캐나다 eSIM 구매 · 가장 편리한 방법', en: 'Buy a Canada eSIM from Korea before you fly — most convenient', fr: "Acheter une eSIM Canada depuis la Corée avant le vol — plus pratique" },
      topPick: true,
      meta: [
        { icon: 'currency-dollar', label: { ko: '$5–20 (7–30일 데이터 전용)', en: '$5–20 for 7–30 day data', fr: '5–20$ pour 7–30 jours data' } },
        { icon: 'plane', label: { ko: '출국 전 한국에서 구매·설치', en: 'Install in Korea before departure', fr: 'Installer en Corée avant le départ' } },
        { icon: 'device-mobile', label: { ko: '앱에서 QR 코드로 설치', en: 'Installed via QR code in the app', fr: 'Installé via QR code dans l\'appli' } },
      ],
      worksFor: [
        { ko: '첫 1–4주 데이터만 필요한 분', en: 'First 1–4 weeks, data only needed', fr: 'Premiers 1–4 semaines, données seulement' },
        { ko: '도착 즉시 인터넷을 원하는 분', en: 'Want internet the second you land', fr: "Internet dès l'atterrissage" },
        { ko: '캐나다 번호가 당장 필요없는 분', en: 'No Canadian number needed immediately', fr: 'Numéro canadien pas encore nécessaire' },
      ],
      worthKnowing: [
        { ko: '통화/문자는 안 됨 — 데이터 전용, 카카오톡은 사용 가능', en: 'Data only — no calls/texts, but KakaoTalk works', fr: 'Données seulement — pas d\'appels/SMS, mais KakaoTalk fonctionne' },
        { ko: '한국 통신사(SKT·KT·LG) 국제 로밍 eSIM도 있지만 일 요금 높음', en: 'Korean carrier (SKT/KT/LG) international eSIM exist but daily fee is high', fr: 'Les eSIM internationales coréennes (SKT/KT/LG) existent mais cher/jour' },
      ],
      recommendNote: {
        ko: 'Airalo 앱에서 "Canada" 검색 → 원하는 기간 선택 → 결제 → QR 코드로 설치. 10분이면 끝나요. 캐나다에 도착하자마자 자동으로 현지 망에 연결돼요.',
        en: 'Search "Canada" in the Airalo app → pick a plan → pay → install via QR. Takes 10 minutes. Connects automatically when you land.',
        fr: 'Cherchez « Canada » dans Airalo → choisissez un plan → payez → installez via QR. 10 minutes. Connexion automatique à l\'atterrissage.',
      },
    },
    {
      name: 'Fizz (캐나다 현지 월정액)',
      sub: { ko: '저렴하고 앱으로 관리, eSIM 지원 — 장기 체류에 추천', en: 'Affordable app-managed Canadian plan, eSIM — recommended for longer stays', fr: 'Forfait canadien géré par appli, eSIM — recommandé pour séjours longs' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '$25–35/월 (통화+문자+데이터)', en: '$25–35/mo (calls+texts+data)', fr: '25–35$/mois (appels+SMS+données)' } },
        { icon: 'device-mobile', label: { ko: 'eSIM 지원', en: 'eSIM available', fr: 'eSIM dispo' } },
        { icon: 'plane', label: { ko: '한국에서 미리 개통 가능', en: 'Can set up from Korea', fr: 'Activation possible depuis la Corée' } },
      ],
      worksFor: [
        { ko: '대부분의 분들 (1개월 이상 체류)', en: 'Most people (staying 1+ months)', fr: 'La plupart (séjour 1 mois+)' },
        { ko: '캐나다 번호가 필요한 분 (은행·취업)', en: 'Need a Canadian number (banking, jobs)', fr: 'Besoin d\'un numéro canadien (banque, emploi)' },
      ],
      worthKnowing: [
        { ko: '고객 지원은 앱/채팅 위주 — 한국어 없음', en: 'Support is app/chat — no Korean', fr: 'Support par appli/chat — pas de coréen' },
        { ko: '한국에서 eSIM 개통 시 캐나다 주소가 필요할 수 있음', en: 'May need a Canadian address to activate eSIM from Korea', fr: 'Peut nécessiter une adresse canadienne pour activer l\'eSIM depuis la Corée' },
      ],
      recommendNote: {
        ko: '많은 분들이 Airalo로 첫 2주를 버티고 정착 후 Fizz로 갈아타요. Fizz는 캐나다 번호가 생겨요.',
        en: 'Many use Airalo for the first 2 weeks, then switch to Fizz once settled. Fizz gives you a Canadian number.',
        fr: 'Beaucoup utilisent Airalo les 2 premières semaines, puis passent à Fizz. Fizz donne un numéro canadien.',
      },
    },
    {
      name: 'Costco Mobile 키오스크',
      sub: { ko: '몬트리올 Costco 매장 내 이동통신 카운터 — 직원이 직접 설명', en: 'In-store counter at Montréal Costco — staff walk you through setup', fr: "Comptoir en magasin au Costco Montréal — personnel vous guide" },
      meta: [
        { icon: 'currency-dollar', label: { ko: 'Fido/Koodo/Rogers 요금', en: 'Fido/Koodo/Rogers pricing', fr: 'Tarifs Fido/Koodo/Rogers' } },
        { icon: 'building-store', label: { ko: '직접 방문 (Costco 회원증 필요)', en: 'In-person (Costco membership)', fr: 'En magasin (carte Costco requise)' } },
      ],
      worksFor: [
        { ko: '직접 설명받고 싶은 분', en: 'Want in-person guidance', fr: 'Préfèrent être guidés en personne' },
        { ko: 'Costco 회원인 분', en: 'Costco members', fr: 'Membres Costco' },
        { ko: '여러 요금제를 비교하고 싶은 분', en: 'Want to compare plans side by side', fr: 'Veulent comparer les forfaits en personne' },
      ],
      worthKnowing: [
        { ko: 'Costco 회원증이 있어야 들어갈 수 있어요', en: 'Costco membership required to enter', fr: 'Carte Costco requise pour entrer' },
        { ko: '한국어 직원이 있을 수 있어요 — 방문 전 전화로 확인', en: 'Korean-speaking staff sometimes available — call ahead', fr: 'Personnel coréanophone parfois disponible — appelez avant' },
      ],
    },
    {
      name: 'Koodo / Fido / Virgin Plus',
      sub: { ko: '중간 가격대, 시내 매장에서 개통', en: 'Mid-range, set up at any city store', fr: 'Milieu de gamme, activation en boutique' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '$30–50/월', en: '$30–50/mo', fr: '30–50$/mois' } },
        { icon: 'device-mobile', label: { ko: 'eSIM + 물리 SIM', en: 'eSIM + physical SIM', fr: 'eSIM + SIM physique' } },
      ],
      worksFor: [
        { ko: '매장에서 직접 개통하고 싶은 분', en: 'Prefer in-store activation', fr: 'Préfèrent l\'activation en boutique' },
        { ko: '중간 가격대를 원하는 분', en: 'Mid-range budget', fr: 'Budget intermédiaire' },
      ],
      worthKnowing: [
        { ko: 'Koodo는 Telus 망, Fido는 Rogers 망 사용', en: 'Koodo uses Telus network, Fido uses Rogers', fr: 'Koodo sur réseau Telus, Fido sur Rogers' },
      ],
    },
    {
      name: 'Public Mobile',
      sub: { ko: '가장 저렴한 장기 옵션 — 온라인만 운영', en: 'Cheapest for longer stays — online only', fr: 'Le moins cher pour longs séjours — en ligne seulement' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '$15–25/월', en: '$15–25/mo', fr: '15–25$/mois' } },
        { icon: 'world', label: { ko: '온라인 전용', en: 'Online only', fr: 'En ligne seulement' } },
      ],
      worksFor: [
        { ko: '예산을 아끼는 장기 체류자', en: 'Budget-conscious long stays', fr: 'Longs séjours à petit budget' },
      ],
      worthKnowing: [
        { ko: 'eSIM 지원 없음 — SIM 카드를 우편 수령 또는 편의점 구매', en: 'No eSIM — get SIM card by mail or at a convenience store', fr: 'Pas d\'eSIM — SIM par courrier ou en dépanneur' },
      ],
    },
  ],
  compareTable: {
    headers: [
      { ko: '통신사', en: 'Provider', fr: 'Fournisseur' },
      { ko: '월 요금', en: 'Price/mo', fr: 'Prix/mois' },
      { ko: 'eSIM', en: 'eSIM', fr: 'eSIM' },
      { ko: '도착 전 개통', en: 'Before arrival', fr: 'Avant arrivée' },
      { ko: '데이터 속도', en: 'Data speed', fr: 'Vitesse' },
      { ko: '적합한 분', en: 'Best for', fr: 'Idéal pour' },
    ],
    rows: [
      { name: 'Airalo (eSIM)', cols: ['$5–20', true, true, 'Good', 'First 1–4 weeks'] },
      { name: 'Fizz', cols: ['$25–35', true, true, 'Good', 'Most people (1mo+)'] },
      { name: 'Koodo / Fido', cols: ['$30–50', true, 'Partial', 'Good', 'In-store setup'] },
      { name: 'Public Mobile', cols: ['$15–25', false, false, 'Moderate', 'Budget long stays'] },
      { name: 'Bell / Rogers', cols: ['$55–80', true, true, 'Excellent', 'Airport, no prep'] },
    ],
  },
  communityNotes: [
    { flag: '🇰🇷', person: { ko: '학생 · 2023년 9월', en: 'Student Sept 2023', fr: 'Étudiant sept. 2023' }, text: { ko: '출국 전에 Fizz eSIM을 켜뒀더니 도착하자마자 바로 인터넷이 됐어요. 정말 편했어요.', en: 'I activated a Fizz eSIM before flying and had internet the second I landed. So convenient.', fr: "J'ai activé une eSIM Fizz avant de partir, j'avais internet dès l'atterrissage. Super pratique." }, likes: 31 },
    { flag: '🇰🇷', person: { ko: '워킹홀리데이 · 2024년 2월', en: 'Working Holiday Feb 2024', fr: 'PVT févr. 2024' }, text: { ko: 'Public Mobile로 한 달에 $20 정도만 써요. 데이터를 많이 안 쓰면 충분해요.', en: "I pay about $20/mo with Public Mobile. Plenty if you don't use much data.", fr: "Je paie environ 20$/mois chez Public Mobile. Suffisant si on consomme peu." }, likes: 19 },
    { flag: '🇨🇦', person: { ko: '한국계 캐나다인', en: 'Korean-Canadian', fr: 'Coréen-Canadien' }, text: { ko: '공항에서 급하게 Bell을 샀는데 비싸더라고요. 다음엔 미리 eSIM 준비하라고 말해주고 싶어요.', en: 'I grabbed a Bell SIM at the airport in a rush — pricey. Next time, prep an eSIM ahead.', fr: "J'ai pris une SIM Bell à l'aéroport en vitesse — cher. La prochaine fois, une eSIM à l'avance." }, likes: 14 },
  ],
  helpLinks: [
    { label: { ko: 'Airalo — 한국에서 캐나다 eSIM 구매', en: 'Airalo — buy Canada eSIM from Korea', fr: 'Airalo — acheter eSIM Canada depuis la Corée' }, url: 'https://www.airalo.com/canada-esim', domain: 'airalo.com' },
    { label: { ko: 'Fizz — 요금제 및 가격', en: 'Fizz — Plans and pricing', fr: 'Fizz — Forfaits et prix' }, url: 'https://fizz.ca', domain: 'fizz.ca' },
    { label: { ko: 'Koodo Mobile — 요금제', en: 'Koodo Mobile — Plans', fr: 'Koodo Mobile — Forfaits' }, url: 'https://www.koodomobile.com', domain: 'koodomobile.com' },
    { label: { ko: 'Fido — 요금제', en: 'Fido — Plans', fr: 'Fido — Forfaits' }, url: 'https://www.fido.ca', domain: 'fido.ca' },
    { label: { ko: 'Virgin Plus — 요금제', en: 'Virgin Plus — Plans', fr: 'Virgin Plus — Forfaits' }, url: 'https://www.virginplus.ca', domain: 'virginplus.ca' },
    { label: { ko: 'Public Mobile — 요금제', en: 'Public Mobile — Plans', fr: 'Public Mobile — Forfaits' }, url: 'https://www.publicmobile.ca', domain: 'publicmobile.ca' },
  ],
  faq: [
    { q: { ko: '도착해서 한국 SIM을 그대로 써도 되나요?', en: 'Can I use my Korean SIM when I arrive?', fr: "Puis-je utiliser ma SIM coréenne à l'arrivée?" }, a: { ko: '한국 SIM은 로밍으로 작동하지만 데이터가 하루 $10–20 정도 들어요. 대부분 금방 캐나다 SIM으로 바꿔요.', en: 'A Korean SIM works on roaming but data costs $10–20/day. Most people switch quickly.', fr: 'Une SIM coréenne fonctionne en itinérance mais les données coûtent 10–20$/jour. La plupart changent vite.' } },
    { q: { ko: '제 휴대폰이 캐나다 SIM과 호환되나요?', en: 'Does my phone work with a Canadian SIM?', fr: 'Mon téléphone fonctionne-t-il avec une SIM canadienne?' }, a: { ko: '대부분의 한국 휴대폰은 언락 상태예요. 통신사를 통해 산 경우 잠겨 있을 수 있으니 출국 전 확인하세요.', en: 'Most Korean phones are unlocked. If bought through a carrier, it may be locked — check before leaving.', fr: "La plupart des téléphones coréens sont déverrouillés. Acheté via un opérateur, il peut être verrouillé — vérifiez avant de partir." } },
    { q: { ko: '통신사를 바꿔도 번호를 유지할 수 있나요?', en: 'Can I keep my number when I switch carriers?', fr: "Puis-je garder mon numéro en changeant d'opérateur?" }, a: { ko: '네, 캐나다 번호 이동성 덕분에 번호를 유지할 수 있어요. 몇 시간 정도 걸려요.', en: 'Yes, Canadian number portability lets you keep your number. Takes a few hours.', fr: 'Oui, la portabilité canadienne permet de garder votre numéro. Cela prend quelques heures.' } },
    { q: { ko: '프랑스어를 못하는데 도움이 필요하면요?', en: "What if I need help and don't speak French?", fr: 'Et si je ne parle pas français et ai besoin d\'aide?' }, a: { ko: '주요 통신사는 모두 영어 지원이 있어요. Fizz는 영어/프랑스어 둘 다 앱으로 처리해요.', en: 'All major carriers have English-language support. Fizz is app-based in both languages.', fr: "Tous les grands opérateurs offrent un support en anglais. Fizz se gère par appli dans les deux langues." } },
  ],
  sidebar: {
    quickFacts: [
      { label: { ko: '가격대', en: 'Cost range', fr: 'Fourchette' }, value: { ko: '$15–80/월', en: '$15–80/mo', fr: '15–80$/mois' } },
      { label: { ko: '추천 옵션', en: 'Best option', fr: 'Meilleure option' }, value: { ko: 'Fizz (eSIM)', en: 'Fizz (eSIM)', fr: 'Fizz (eSIM)' } },
      { label: { ko: '도착 전 가능', en: 'Before arrival', fr: 'Avant arrivée' }, value: { ko: '가능', en: 'Yes', fr: 'Oui' } },
      { label: { ko: '설정 시간', en: 'Setup time', fr: 'Temps' }, value: { ko: '5분–1시간', en: '5 min–1 hr', fr: '5 min–1h' } },
    ],
    timeline: { ko: '대부분 비행기 탑승 전날 또는 도착 당일에 해결해요.', en: 'Most people handle this the day before their flight or on arrival day.', fr: "La plupart règlent ça la veille du vol ou le jour d'arrivée." },
    nextStepId: 'bank',
    nextStepLabel: { ko: '은행 계좌 열기', en: 'Open a bank account', fr: 'Ouvrir un compte bancaire' },
  },
  completionCard: {
    headline: { ko: '도착 첫날부터 연결됩니다.', en: 'Connected from day one.', fr: 'Connecté·e dès le premier jour.' },
    body: { ko: '유심 하나로 지도도 보고, 연락도 되고, 몬트리올을 탐색할 준비가 됐어요.', en: 'One SIM card. Maps, messages, and Montréal — all ready to go.', fr: 'Une carte SIM. Cartes, messages, Montréal — tout est prêt.' },
  },
}

// ─── TAB 2: Bank ──────────────────────────────────────────────────────────────

const BANK_TAB: TabContent = {
  id: 'bank',
  label: { ko: '은행 계좌', en: 'Bank account', fr: 'Compte bancaire' },
  hero: {
    title: {
      ko: '첫 주에 은행 계좌 열기',
      en: 'Open a bank account in your first week',
      fr: 'Ouvrir un compte bancaire la première semaine',
    },
    sub: {
      ko: '캐나다 은행 계좌가 있으면 송금을 받고, 월세를 내고, 신용 기록을 쌓기 시작할 수 있어요. 임대 계약 시 집주인이 보통 무효 수표나 계좌 번호를 요구해요.',
      en: 'A Canadian bank account lets you receive transfers, pay rent, and start building a credit history. Most landlords ask for a void cheque or account number when you sign a lease.',
      fr: "Un compte bancaire canadien permet de recevoir des virements, payer le loyer et bâtir un historique de crédit. Les propriétaires demandent souvent un chèque annulé ou un numéro de compte au bail.",
    },
    when: { ko: '첫 번째 주, 아파트 계약 전에', en: 'First week, before signing a lease', fr: 'Première semaine, avant de signer un bail' },
    cost: { ko: '무료~$16/월 (1년차 신규 이민자 패키지 무료)', en: '$0–16/mo (newcomer packages waive yr 1)', fr: '0–16$/mois (forfaits nouveaux arrivants gratuits an 1)' },
    time: { ko: '약 1시간 (방문)', en: '~1 hour in person', fr: '~1 heure en personne' },
    canBeforeArrival: { ko: '아니요, 도착 후 방문 필요', en: 'No, requires an in-person visit after arrival', fr: "Non, visite en personne après l'arrivée" },
  },
  options: [
    {
      name: 'RBC',
      sub: { ko: '신규 이민자 패키지, 신용 기록 없이도 신용카드', en: 'Newcomer package, credit card without history', fr: 'Forfait nouveaux arrivants, carte de crédit sans historique' },
      topPick: true,
      meta: [
        { icon: 'currency-dollar', label: { ko: '1년차 무료', en: '$0 yr 1 newcomer pkg', fr: 'Gratuit an 1' } },
        { icon: 'building-bank', label: { ko: '방문 ~1시간', en: 'In-person ~1hr', fr: 'En personne ~1h' } },
        { icon: 'language', label: { ko: '일부 지점 한국어 직원', en: 'Korean-speaking staff at some branches', fr: 'Personnel coréanophone (certaines succursales)' } },
      ],
      worksFor: [
        { ko: '신용 기록이 없는 분', en: 'No credit history', fr: 'Sans historique de crédit' },
        { ko: '첫날부터 신용카드를 원하는 분', en: 'Want a credit card from day 1', fr: 'Carte de crédit dès le jour 1' },
        { ko: '장기 체류자', en: 'Longer stays', fr: 'Longs séjours' },
      ],
      worthKnowing: [
        { ko: '1년 후 수수료 발생', en: 'Fee after yr 1', fr: 'Frais après an 1' },
        { ko: '방문 필요', en: 'In-person required', fr: 'Visite requise' },
      ],
      recommendNote: {
        ko: 'RBC 신규 이민자 패키지는 첫 1년 월 수수료가 무료이고, 캐나다 신용 기록 없이도 신용카드를 발급해줘요. 이 둘을 함께 제공하는 은행은 많지 않아요.',
        en: "RBC's newcomer package waives the monthly fee for the first year and can issue a credit card without Canadian credit history — two things many other banks don't offer together.",
        fr: "Le forfait nouveaux arrivants de RBC offre la première année sans frais et une carte de crédit sans historique canadien — deux choses rares ensemble.",
      },
    },
    {
      name: 'TD Bank',
      sub: { ko: '지점이 많고 학생 친화적', en: 'Widely available, student-friendly', fr: 'Très accessible, adapté aux étudiants' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '$10–16/월 (정규 학생 무료)', en: '$10–16/mo ($0 full-time students)', fr: '10–16$/mois (gratuit étudiants temps plein)' } },
        { icon: 'building-bank', label: { ko: '방문 또는 온라인', en: 'In-person or online', fr: 'En personne ou en ligne' } },
      ],
      worksFor: [
        { ko: '학생', en: 'Students', fr: 'Étudiants' },
        { ko: 'TD 지점 근처에 사는 분', en: 'Near a TD branch', fr: "Près d'une succursale TD" },
      ],
      worthKnowing: [
        { ko: '기록 없이 자동 신용카드는 안 됨', en: 'No automatic CC without history', fr: 'Pas de carte auto sans historique' },
        { ko: '정규 학생은 수수료 면제', en: 'Fee waived for full-time students', fr: 'Frais annulés pour étudiants temps plein' },
      ],
    },
    {
      name: 'Desjardins',
      sub: { ko: '퀘벡 지역 협동조합', en: 'Local Québec cooperative', fr: 'Coopérative locale du Québec' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '~$10/월', en: '~$10/mo', fr: '~10$/mois' } },
        { icon: 'building-bank', label: { ko: '방문', en: 'In-person', fr: 'En personne' } },
        { icon: 'language', label: { ko: '프랑스어 서비스 강함', en: 'Strong French service', fr: 'Excellent service en français' } },
      ],
      worksFor: [
        { ko: '프랑스어 사용자', en: 'French speakers', fr: 'Francophones' },
        { ko: '퀘벡 장기 정착', en: 'Long-term Québec stay', fr: 'Séjour long au Québec' },
      ],
      worthKnowing: [
        { ko: '영어 서비스는 지점마다 차이', en: 'English service varies by branch', fr: 'Service anglais variable selon la succursale' },
      ],
    },
    {
      name: 'BMO',
      sub: { ko: '신규 이민자 패키지', en: 'Newcomer package', fr: 'Forfait nouveaux arrivants' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '1년차 무료', en: '$0 yr 1', fr: 'Gratuit an 1' } },
        { icon: 'building-bank', label: { ko: '방문 또는 온라인', en: 'In-person or online', fr: 'En personne ou en ligne' } },
      ],
      worksFor: [
        { ko: '국제 학생', en: 'International students', fr: 'Étudiants internationaux' },
        { ko: '첫해 수수료 없이', en: 'No-fee first year', fr: 'Première année sans frais' },
      ],
      worthKnowing: [
        { ko: '신용카드 접근성은 더 제한적', en: 'CC access more limited', fr: 'Accès carte de crédit plus limité' },
      ],
    },
  ],
  compareTable: {
    headers: [
      { ko: '은행', en: 'Bank', fr: 'Banque' },
      { ko: '1년차 수수료', en: 'Year 1 fee', fr: 'Frais an 1' },
      { ko: '이민자 패키지', en: 'Newcomer pkg', fr: 'Forfait nouv. arr.' },
      { ko: '기록 없이 신용카드', en: 'CC w/o history', fr: 'Carte sans histo.' },
      { ko: '프랑스어 서비스', en: 'French service', fr: 'Service français' },
      { ko: '온라인 뱅킹', en: 'Online banking', fr: 'Banque en ligne' },
    ],
    rows: [
      { name: 'RBC', cols: ['Free', '$0 yr 1', true, true, 'Good', 'Good'] },
      { name: 'TD', cols: ['~$10–16/mo', 'Students only', false, true, 'Good', 'Excellent'] },
      { name: 'Desjardins', cols: ['~$10/mo', 'No', false, true, 'Excellent', 'Good'] },
      { name: 'BMO', cols: ['Free yr 1', true, false, true, 'Good', 'Excellent'] },
    ],
  },
  communityNotes: [
    { flag: '🇰🇷', person: { ko: '학생 · 2024년 1월', en: 'Student Jan 2024', fr: 'Étudiant janv. 2024' }, text: { ko: '도착 3일째에 RBC에 갔어요. 직원분이 친절하셨고 전체 한 시간 정도 걸렸어요. 당일에 직불카드를 받았어요.', en: 'I went to RBC on my third day. The staff were patient and the whole thing took about an hour. Had a debit card the same day.', fr: "Je suis allé à RBC le 3e jour. Personnel patient, environ une heure. Carte de débit le jour même." }, likes: 28 },
    { flag: '🇰🇷', person: { ko: '워킹홀리데이 · 2023년 10월', en: 'Working Holiday Oct 2023', fr: 'PVT oct. 2023' }, text: { ko: '프랑스어 연습하려고 Desjardins를 골랐어요. 일부 지점은 신규 이민자에게 정말 친절해요.', en: 'I picked Desjardins because I wanted to practice French. Some branches are very helpful with newcomers.', fr: "J'ai choisi Desjardins pour pratiquer le français. Certaines succursales sont très accueillantes." }, likes: 16 },
    { flag: '🇫🇷', person: { ko: '프랑스 영주권자', en: 'French PR', fr: 'Résident permanent français' }, text: { ko: 'Desjardins가 가장 지역적인 느낌이었어요. 몬트리올의 일상적인 프랑스어 생활에 잘 맞았어요.', en: 'Desjardins felt the most local. For everyday French life in Montréal it worked really well.', fr: "Desjardins était le plus local. Pour la vie quotidienne en français à Montréal, parfait." }, likes: 11 },
  ],
  helpLinks: [
    { label: { ko: 'RBC 신규 이민자 뱅킹', en: 'RBC Newcomer Banking', fr: 'RBC Nouveaux arrivants' }, url: 'https://www.rbc.com/newcomers', domain: 'rbc.com' },
    { label: { ko: 'TD New to Canada', en: 'TD New to Canada', fr: 'TD Nouveaux au Canada' }, url: 'https://www.td.com/newcomers', domain: 'td.com' },
    { label: { ko: 'BMO NewStart 프로그램', en: 'BMO NewStart Program', fr: 'BMO Programme NewStart' }, url: 'https://www.bmo.com/newcomers', domain: 'bmo.com' },
    { label: { ko: 'Desjardins', en: 'Desjardins', fr: 'Desjardins' }, url: 'https://www.desjardins.com', domain: 'desjardins.com' },
  ],
  faq: [
    { q: { ko: '계좌를 열려면 어떤 서류가 필요한가요?', en: 'What documents do I need to open a bank account?', fr: 'Quels documents pour ouvrir un compte?' }, a: { ko: '여권과 학업/취업 허가증이요. 일부 은행은 임대 계약서나 에어비앤비 확인서를 주소 증빙으로 받아줘요.', en: 'Passport + study/work permit. Some banks also accept a lease or Airbnb confirmation as proof of address.', fr: "Passeport + permis d'études/travail. Certaines banques acceptent un bail ou une confirmation Airbnb comme preuve d'adresse." } },
    { q: { ko: '캐나다 주소 없이 계좌를 열 수 있나요?', en: 'Can I open an account without a Canadian address?', fr: 'Puis-je ouvrir un compte sans adresse canadienne?' }, a: { ko: '대부분 주소가 필요해요. 처음 몇 주는 보통 에어비앤비 확인서가 인정돼요.', en: 'Most banks require an address. Your Airbnb confirmation is usually accepted for the first few weeks.', fr: "La plupart exigent une adresse. La confirmation Airbnb est généralement acceptée les premières semaines." } },
    { q: { ko: '한국어 직원이 있는 은행은 어디인가요?', en: 'Which bank has Korean-speaking staff?', fr: 'Quelle banque a du personnel coréanophone?' }, a: { ko: 'RBC와 NDG/CDN 지역 일부 TD 지점에 한국어 직원이 있어요. 미리 전화로 확인하세요.', en: 'RBC and some TD branches in the NDG/CDN area have Korean-speaking staff. Call ahead to confirm.', fr: "RBC et certaines succursales TD du secteur NDG/CDN ont du personnel coréanophone. Appelez avant." } },
    { q: { ko: '계좌를 쓰기까지 얼마나 걸리나요?', en: 'How long until I can use my account?', fr: "Combien de temps avant d'utiliser mon compte?" }, a: { ko: '직불카드는 보통 당일 발급돼요. 온라인 뱅킹은 24시간 내에 활성화돼요.', en: 'Debit card usually issued same day. Online banking activated within 24 hours.', fr: 'Carte de débit généralement le jour même. Banque en ligne activée sous 24h.' } },
  ],
  sidebar: {
    quickFacts: [
      { label: { ko: '추천 옵션', en: 'Best option', fr: 'Meilleure option' }, value: { ko: 'RBC (이민자 패키지)', en: 'RBC (newcomer pkg)', fr: 'RBC (forfait)' } },
      { label: { ko: '1년차 수수료', en: 'Year 1 fee', fr: 'Frais an 1' }, value: { ko: '$0 (이민자)', en: '$0 (newcomer)', fr: '0$ (nouv. arr.)' } },
      { label: { ko: '주소 증빙', en: 'Address proof', fr: "Preuve d'adresse" }, value: { ko: '에어비앤비 가능', en: 'Airbnb OK', fr: 'Airbnb OK' } },
      { label: { ko: '소요 시간', en: 'Time', fr: 'Durée' }, value: { ko: '약 1시간', en: '~1 hour', fr: '~1 heure' } },
    ],
    timeline: { ko: '대부분 도착 2–3일 후에 방문해요. 임시 주소(에어비앤비)로도 개설 가능해요.', en: 'Most people visit within days 2–3 of arrival. An Airbnb address is usually accepted.', fr: "La plupart visitent 2–3 jours après l'arrivée. L'adresse Airbnb est généralement acceptée." },
    nextStepId: 'sin',
    nextStepLabel: { ko: 'SIN 번호 신청하기', en: 'Apply for SIN', fr: 'Demander un NAS' },
  },
  completionCard: {
    headline: { ko: '몬트리올에서 돈을 쓸 준비가 됐습니다.', en: 'Ready to spend money in Montréal.', fr: 'Prêt·e à dépenser à Montréal.' },
    body: { ko: '계좌가 생기면 카드도 생기고, 신용 기록도 쌓이기 시작해요. 캐나다 생활의 첫 번째 뿌리예요.', en: 'An account means a card, and a card means credit history. Your first root in Canada.', fr: "Un compte, c'est une carte. Une carte, c'est un historique de crédit. Votre première racine au Canada." },
  },
}

// ─── TAB 3: Transit ───────────────────────────────────────────────────────────

const TRANSIT_TAB: TabContent = {
  id: 'transit',
  label: { ko: '대중교통', en: 'Transit', fr: 'Transport' },
  hero: {
    title: { ko: '몬트리올에서 이동하기', en: 'Getting around Montréal', fr: 'Se déplacer à Montréal' },
    sub: {
      ko: '몬트리올의 대중교통(STM)은 지하철과 버스로 도시 대부분을 커버해요. 충전식 OPUS 카드를 둘 다에 쓸 수 있어요. 공항버스(747)는 신용카드를 직접 받아서 도착 당일에는 OPUS가 필요 없어요.',
      en: "Montréal's public transit (STM) covers most of the city with metro and buses. The rechargeable OPUS card is used for both. The airport bus (747) accepts credit cards directly — no OPUS needed on arrival day.",
      fr: "Le transport public de Montréal (STM) couvre la ville avec métro et bus. La carte OPUS rechargeable sert aux deux. Le bus 747 accepte la carte de crédit — pas besoin d'OPUS le jour d'arrivée.",
    },
    when: { ko: '도착 당일부터', en: 'From arrival day', fr: "Dès le jour d'arrivée" },
    cost: { ko: '$3.75/회 또는 $56–97/월', en: '$3.75/trip or $56–97/mo', fr: '3,75$/trajet ou 56–97$/mois' },
    time: { ko: 'OPUS 카드 구매: 5분', en: 'OPUS card: 5 min at any metro station', fr: 'Carte OPUS : 5 min dans toute station' },
    canBeforeArrival: { ko: '아니요, 현지에서 구매', en: 'No, purchase on arrival', fr: 'Non, acheter sur place' },
  },
  options: [
    {
      name: 'STM Monthly Pass + OPUS',
      sub: { ko: '지하철·버스 무제한', en: 'Unlimited metro and bus', fr: 'Métro et bus illimités' },
      topPick: true,
      meta: [
        { icon: 'currency-dollar', label: { ko: '$97/월 (학생 $56)', en: '$97/mo or $56/mo student', fr: '97$/mois ou 56$ étudiant' } },
        { icon: 'credit-card', label: { ko: 'OPUS 카드 1회 $6', en: 'OPUS card $6 one-time', fr: 'Carte OPUS 6$ unique' } },
      ],
      worksFor: [
        { ko: '매일 통근하는 분', en: 'Daily commuters', fr: 'Navetteurs quotidiens' },
        { ko: '학생 (50% 할인)', en: 'Students (50% off)', fr: 'Étudiants (50% de rabais)' },
        { ko: '지하철 노선 근처', en: 'Near a metro line', fr: "Près d'une ligne de métro" },
      ],
      worthKnowing: [
        { ko: '월 정기권은 매월 1일에 초기화 — 월 중반에 사면 손해', en: 'Monthly pass resets on the 1st — buy mid-month for best value', fr: "Le pass mensuel se réinitialise le 1er — acheter en milieu de mois est moins avantageux" },
        { ko: '학생 요금은 재학 증명 필요', en: 'Student rate requires enrollment verification', fr: "Le tarif étudiant exige une preuve d'inscription" },
      ],
      recommendNote: {
        ko: '학생 요금은 일반 요금의 거의 절반이에요. 대부분의 학교가 해당되니 첫 정기권을 사기 전에 확인해보세요.',
        en: 'The student rate is roughly half the regular price. Most schools qualify — worth checking before you buy your first monthly pass.',
        fr: "Le tarif étudiant est environ la moitié du prix normal. La plupart des écoles sont admissibles — vérifiez avant le premier pass.",
      },
    },
    {
      name: 'OPUS Pay-Per-Ride',
      sub: { ko: '월 약정 없음', en: 'No monthly commitment', fr: 'Sans engagement mensuel' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '$3.75/회', en: '$3.75/trip', fr: '3,75$/trajet' } },
        { icon: 'credit-card', label: { ko: '같은 OPUS 카드', en: 'Same OPUS card', fr: 'Même carte OPUS' } },
      ],
      worksFor: [
        { ko: '정하기 전 첫 주', en: 'First week before committing', fr: "Première semaine avant de s'engager" },
        { ko: '가끔 타는 분', en: 'Infrequent riders', fr: 'Usagers occasionnels' },
      ],
      worthKnowing: [
        { ko: '쌓이면 비쌈 — 약 26회부터 정기권이 더 저렴', en: 'Adds up — monthly pass cheaper after ~26 trips', fr: "Ça s'accumule — le pass est plus avantageux après ~26 trajets" },
      ],
    },
    {
      name: 'BIXI Bike Share',
      sub: { ko: '도크 자전거, 몬트리올 중심부', en: 'Dock-to-dock bikes, central Montréal', fr: 'Vélos en libre-service, centre de Montréal' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '$27/월 (시즌) 또는 $7/일', en: '$27/mo seasonal or $7/day', fr: '27$/mois (saison) ou 7$/jour' } },
        { icon: 'calendar', label: { ko: '앱 기반, 4월–11월', en: 'App-based, April–November', fr: 'Appli, avril–novembre' } },
      ],
      worksFor: [
        { ko: 'Plateau/Mile End/다운타운 짧은 이동', en: 'Short trips in Plateau/Mile End/downtown', fr: 'Courts trajets Plateau/Mile End/centre-ville' },
        { ko: '자전거를 좋아하는 분', en: 'Cycling fans', fr: 'Amateurs de vélo' },
      ],
      worthKnowing: [
        { ko: '겨울에는 운영 안 함', en: 'Not available in winter', fr: "Pas disponible l'hiver" },
        { ko: '헬멧 미제공', en: 'Helmets not provided', fr: 'Casques non fournis' },
      ],
    },
    {
      name: 'Airport Bus 747',
      sub: { ko: 'YUL ↔ 다운타운, 24시간', en: 'YUL to downtown, 24/7', fr: 'YUL au centre-ville, 24/7' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '$11 정액 (카드 가능)', en: '$11 flat (credit card accepted)', fr: '11$ forfait (carte acceptée)' } },
        { icon: 'clock', label: { ko: '20–30분 간격', en: 'Every 20–30 min', fr: 'Toutes les 20–30 min' } },
      ],
      worksFor: [
        { ko: '공항에서 이동, OPUS 불필요', en: 'Getting from airport, no OPUS needed', fr: "Depuis l'aéroport, sans OPUS" },
      ],
      worthKnowing: [
        { ko: '교통 상황에 따라 45–70분', en: '45–70 min depending on traffic', fr: 'Selon le trafic, 45–70 min' },
      ],
    },
  ],
  compareTable: {
    headers: [
      { ko: '옵션', en: 'Option', fr: 'Option' },
      { ko: '비용', en: 'Cost', fr: 'Coût' },
      { ko: 'OPUS 카드', en: 'OPUS card', fr: 'Carte OPUS' },
      { ko: '24시간', en: '24/7', fr: '24/7' },
      { ko: '적합한 분', en: 'Best for', fr: 'Idéal pour' },
    ],
    rows: [
      { name: 'STM Monthly', cols: ['$97 or $56/mo', true, true, 'Daily use'] },
      { name: 'Pay-per-ride', cols: ['$3.75/trip', true, true, 'First week'] },
      { name: 'BIXI', cols: ['$27/mo seasonal', false, false, 'Central short trips'] },
      { name: '747 bus', cols: ['$11 flat', false, true, 'Airport only'] },
    ],
  },
  communityNotes: [
    { flag: '🇰🇷', person: { ko: '학생 · 2023년 9월', en: 'Student Sept 2023', fr: 'Étudiant sept. 2023' }, text: { ko: '공항에서 747이 정말 편했어요. 카드로 결제하고 OPUS는 필요 없었어요. 다음 날 지하철역에서 OPUS를 받았어요.', en: 'The 747 was easy from the airport. Paid with my card, no OPUS needed. Got an OPUS the next day at a metro station.', fr: "Le 747 était facile depuis l'aéroport. Payé par carte, sans OPUS. J'ai pris une OPUS le lendemain au métro." }, likes: 24 },
    { flag: '🇰🇷', person: { ko: '워킹홀리데이 · 2024년 6월', en: 'Working Holiday June 2024', fr: 'PVT juin 2024' }, text: { ko: '여름에 BIXI 정말 좋아요. 5월부터 9월까지 지하철을 거의 안 탔어요.', en: 'BIXI in summer is great. I barely used the metro from May to September.', fr: "BIXI l'été, c'est génial. J'ai à peine pris le métro de mai à septembre." }, likes: 18 },
    { flag: '🇨🇦', person: { ko: '한국계 캐나다인', en: 'Korean-Canadian', fr: 'Coréen-Canadien' }, text: { ko: '하루에 한 번 이상 지하철을 탄다면 정기권을 사세요. 금방 본전을 뽑아요.', en: "Get the monthly pass if you're taking the metro more than once a day. The math works out pretty quickly.", fr: "Prenez le pass mensuel si vous prenez le métro plus d'une fois par jour. C'est vite rentable." }, likes: 15 },
  ],
  helpLinks: [
    { label: { ko: 'STM 대중교통', en: 'STM transit', fr: 'STM transport' }, url: 'https://www.stm.info', domain: 'stm.info' },
    { label: { ko: 'BIXI 자전거 공유', en: 'BIXI bike share', fr: 'BIXI vélopartage' }, url: 'https://bixi.com', domain: 'bixi.com' },
    { label: { ko: 'Chronobus 747 공항버스', en: 'Chronobus 747 airport bus', fr: 'Chronobus 747' }, url: 'https://www.stm.info/en/info/networks/bus/express-shuttle/route-747-yul-aeroport-montreal-trudeau-downtown', domain: 'stm.info' },
    { label: { ko: 'OPUS 카드', en: 'OPUS card', fr: 'Carte OPUS' }, url: 'https://www.stm.info/en/info/fares/opus-cards-and-other-fare-media', domain: 'stm.info' },
  ],
  faq: [
    { q: { ko: 'OPUS 카드는 어디서 사나요?', en: 'Where do I buy an OPUS card?', fr: 'Où acheter une carte OPUS?' }, a: { ko: '아무 지하철역 발권기, 일부 편의점에서요. 카드 자체는 $6이고, 거기에 횟수나 월 정기권을 충전해요.', en: 'Any metro station ticket machine, some convenience stores. The card costs $6 and you load trips or a monthly pass onto it.', fr: "Toute machine de station de métro, certains dépanneurs. La carte coûte 6$ et on y charge des trajets ou un pass." } },
    { q: { ko: '학생 할인이 있나요?', en: 'Is there a student discount?', fr: 'Y a-t-il un rabais étudiant?' }, a: { ko: '네, 자격이 되면 약 50% 할인이에요. 먼저 학교 학적과에서 인증받아야 해요.', en: 'Yes — about 50% off with eligible student status. You need to get it validated at your school\'s registrar first.', fr: "Oui — environ 50% avec un statut étudiant admissible. À faire valider d'abord au registraire de l'école." } },
    { q: { ko: '747 버스는 밤에도 운행하나요?', en: 'Does the 747 bus run at night?', fr: 'Le bus 747 circule-t-il la nuit?' }, a: { ko: '네, 747은 야간 포함 24시간 운행해요. 공항을 오가는 가장 확실한 방법이에요.', en: "Yes, the 747 runs 24/7 including overnight. It's the most reliable way to and from the airport.", fr: "Oui, le 747 circule 24/7, y compris la nuit. C'est le moyen le plus fiable pour l'aéroport." } },
    { q: { ko: '휴대폰으로 교통비를 낼 수 있나요?', en: 'Can I use my phone to pay for transit?', fr: 'Puis-je payer le transport avec mon téléphone?' }, a: { ko: 'OPUS는 이제 많은 휴대폰에서 모바일 결제를 지원해요. 호환 여부는 STM 웹사이트에서 확인하세요.', en: 'OPUS now supports mobile payment on many phones. Check the STM website for compatibility.', fr: 'OPUS prend désormais en charge le paiement mobile sur de nombreux téléphones. Vérifiez la compatibilité sur le site STM.' } },
  ],
  sidebar: {
    quickFacts: [
      { label: { ko: '공항→다운타운', en: 'Airport to downtown', fr: 'Aéroport → centre' }, value: { ko: '$11 (747)', en: '$11 (747)', fr: '11$ (747)' } },
      { label: { ko: '월 정기권', en: 'Monthly pass', fr: 'Pass mensuel' }, value: { ko: '$56 (학생) / $97', en: '$56 (student) / $97', fr: '56$ (étud.) / 97$' } },
      { label: { ko: 'OPUS 카드', en: 'OPUS card', fr: 'Carte OPUS' }, value: { ko: '$6 (1회)', en: '$6 one-time', fr: '6$ (unique)' } },
      { label: { ko: 'BIXI 월', en: 'BIXI monthly', fr: 'BIXI mensuel' }, value: { ko: '$27 (시즌)', en: '$27 (seasonal)', fr: '27$ (saison)' } },
    ],
    timeline: { ko: '공항에서 시내까지 747 버스, 그 다음 날 OPUS 카드 구매 추천.', en: 'Take the 747 bus from the airport. Pick up an OPUS card the next day.', fr: "Prenez le 747 depuis l'aéroport. Achetez une carte OPUS le lendemain." },
    nextStepId: 'housing',
    nextStepLabel: { ko: '장기 주거 찾기', en: 'Find long-term housing', fr: 'Trouver un logement à long terme' },
  },
  completionCard: {
    headline: { ko: 'OPUS 하나로 도시 전체를 이동합니다.', en: 'One OPUS card. The whole city.', fr: 'Une carte OPUS. Toute la ville.' },
    body: { ko: '지하철, 버스, 어디든 가세요. 몬트리올은 교통으로 연결되어 있어요.', en: 'Metro, bus, anywhere. Montréal is more connected than it looks.', fr: 'Métro, bus, partout. Montréal est plus connectée qu\'elle n\'y paraît.' },
  },
}

// ─── TAB 5: SIN ───────────────────────────────────────────────────────────────

const SIN_TAB: TabContent = {
  id: 'sin',
  label: { ko: 'SIN 번호', en: 'SIN', fr: 'NAS' },
  hero: {
    title: { ko: 'SIN 번호 발급받기', en: 'Getting your Social Insurance Number', fr: "Obtenir votre numéro d'assurance sociale" },
    sub: {
      ko: '사회보험번호(SIN)는 캐나다에서 고용, 세금, 정부 서비스에 쓰이는 9자리 번호예요. 일을 시작하기 전에 필요해요.',
      en: "A Social Insurance Number (SIN) is a 9-digit number used for employment, taxes, and government services in Canada. It's required before starting work.",
      fr: "Le numéro d'assurance sociale (NAS) est un numéro à 9 chiffres pour l'emploi, les impôts et les services publics. Requis avant de travailler.",
    },
    when: { ko: '취업 전, 보통 도착 첫 주에', en: 'Before starting work — most people do this in their first week', fr: 'Avant de travailler — la plupart le font la première semaine' },
    cost: { ko: '무료', en: 'Free', fr: 'Gratuit' },
    time: { ko: '당일 (방문) 또는 2–4주 (온라인)', en: 'Same day (in-person) or 2–4 weeks (online)', fr: 'Même jour (en personne) ou 2–4 semaines (en ligne)' },
    canBeforeArrival: { ko: '아니요, 캐나다 도착 후에만 신청 가능', en: 'No, only after arriving in Canada', fr: "Non, seulement après l'arrivée au Canada" },
  },
  options: [
    {
      name: 'In-person at Service Canada',
      sub: { ko: '당일 처리, 대기 없음', en: 'Same day, no waiting', fr: "Même jour, sans attente" },
      topPick: true,
      meta: [
        { icon: 'currency-dollar', label: { ko: '무료', en: 'Free', fr: 'Gratuit' } },
        { icon: 'walk', label: { ko: '예약 없이 방문 가능', en: 'Walk-in accepted', fr: 'Sans rendez-vous' } },
        { icon: 'id', label: { ko: '여권 + 허가증 필요', en: 'Passport + permit required', fr: 'Passeport + permis requis' } },
      ],
      worksFor: [
        { ko: 'SIN이 빨리 필요한 분', en: 'Anyone needing their SIN quickly', fr: 'Ceux qui ont vite besoin du NAS' },
        { ko: '직접 확인받고 싶은 분', en: 'Wants confirmation in person', fr: 'Confirmation en personne' },
      ],
      worthKnowing: [
        { ko: 'Service Canada 사무소 방문 필요 — 몬트리올에 여러 곳', en: 'Need to visit a Service Canada office — several in Montréal', fr: 'Visiter un bureau Service Canada — plusieurs à Montréal' },
      ],
      recommendNote: {
        ko: '대부분 45분 안에 끝나요. 대부분의 사무소는 예약이 필요 없어요. 여권과 학업/취업 허가증을 가져가세요.',
        en: 'Most people are in and out within 45 minutes. No appointment needed at most locations. Bring your passport and study/work permit.',
        fr: "La plupart en ressortent en 45 min. Sans rendez-vous dans la plupart des bureaux. Apportez passeport et permis d'études/travail.",
      },
    },
    {
      name: 'Online application',
      sub: { ko: '집에서 신청', en: 'Apply from home', fr: 'Demander de chez soi' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '무료', en: 'Free', fr: 'Gratuit' } },
        { icon: 'clock', label: { ko: '2–4주 처리', en: '2–4 weeks processing', fr: 'Traitement 2–4 semaines' } },
        { icon: 'world', label: { ko: 'canada.ca/sin', en: 'canada.ca/sin', fr: 'canada.ca/nas' } },
      ],
      worksFor: [
        { ko: '당장 일하지 않는 분', en: 'Not working right away', fr: 'Pas de travail immédiat' },
        { ko: '사무소 방문을 피하고 싶은 분', en: 'Prefer not to visit an office', fr: 'Préfèrent éviter le bureau' },
      ],
      worthKnowing: [
        { ko: '2–4주 대기, 번호를 바로 받지 못함', en: '2–4 weeks wait, no SIN number immediately', fr: 'Attente 2–4 semaines, pas de numéro immédiat' },
      ],
    },
  ],
  compareTable: {
    headers: [
      { ko: '방법', en: 'Method', fr: 'Méthode' },
      { ko: '처리 시간', en: 'Processing time', fr: 'Délai' },
      { ko: '방문?', en: 'In person?', fr: 'En personne?' },
      { ko: '비용', en: 'Cost', fr: 'Coût' },
      { ko: '필요 서류', en: 'Documents needed', fr: 'Documents requis' },
    ],
    rows: [
      { name: 'Service Canada walk-in', cols: ['Same day', true, 'Free', 'Passport + permit'] },
      { name: 'Online', cols: ['2–4 weeks', false, 'Free', 'Passport + permit'] },
    ],
  },
  communityNotes: [
    { flag: '🇰🇷', person: { ko: '워킹홀리데이 · 2024년 7월', en: 'Working Holiday July 2024', fr: 'PVT juil. 2024' }, text: { ko: '도착 이틀째에 Service Canada에 갔어요. 한 시간도 안 돼서 SIN을 손에 들고 나왔어요. 정말 쉬웠어요.', en: 'I went to Service Canada on my second day. Was out in under an hour with my SIN in hand. Very easy.', fr: "Service Canada le 2e jour. Sorti en moins d'une heure avec mon NAS. Très facile." }, likes: 35 },
    { flag: '🇰🇷', person: { ko: '학생 · 2023년 9월', en: 'Student Sept 2023', fr: 'Étudiant sept. 2023' }, text: { ko: '처음에 온라인으로 신청했는데 3주 걸려서 아르바이트 시작을 거의 놓칠 뻔했어요. 가능하면 방문이 빨라요.', en: 'I applied online at first. Took 3 weeks and I almost missed starting my part-time job. In-person is faster if you can.', fr: "J'ai demandé en ligne d'abord. 3 semaines, j'ai failli rater mon emploi à temps partiel. En personne, c'est plus rapide." }, likes: 22 },
    { flag: '🇨🇦', person: { ko: '한국계 캐나다인', en: 'Korean-Canadian', fr: 'Coréen-Canadien' }, text: { ko: '대부분의 사무소는 예약 없이 가도 돼요. 저는 한 번도 예약이 필요했던 적이 없어요.', en: "Walk-in is fine at most offices. I've never needed an appointment.", fr: "Sans rendez-vous dans la plupart des bureaux. Je n'ai jamais eu besoin d'en prendre un." }, likes: 12 },
  ],
  helpLinks: [
    { label: { ko: '📍 Service Canada — 다운타운 (Guy-Concordia)', en: '📍 Service Canada — Downtown (Guy-Concordia)', fr: '📍 Service Canada — Centre-ville (Guy-Concordia)' }, url: 'https://www.google.com/maps/search/Service+Canada+1000+De+La+Gauchetière+Montreal', domain: 'maps.google.com' },
    { label: { ko: '📍 Service Canada — 몬트리올 노스', en: '📍 Service Canada — Montréal North', fr: '📍 Service Canada — Montréal-Nord' }, url: 'https://www.google.com/maps/search/Service+Canada+5400+Boul+Henri-Bourassa+Montreal', domain: 'maps.google.com' },
    { label: { ko: '📍 Service Canada — 코트-데-네쥬 (CDN)', en: '📍 Service Canada — Côte-des-Neiges (CDN)', fr: '📍 Service Canada — Côte-des-Neiges' }, url: 'https://www.google.com/maps/search/Service+Canada+3500+Queen+Mary+Road+Montreal', domain: 'maps.google.com' },
    { label: { ko: 'Service Canada 사무소 전체 목록 + 운영시간', en: 'All Service Canada offices + hours', fr: 'Tous les bureaux Service Canada + heures' }, url: 'https://www.canada.ca/en/employment-social-development/corporate/portfolio/service-canada/office-locations.html', domain: 'canada.ca' },
    { label: { ko: '온라인으로 SIN 신청하기', en: 'Apply for SIN online', fr: 'Demander un NAS en ligne' }, url: 'https://www.canada.ca/en/employment-social-development/services/sin/apply.html', domain: 'canada.ca' },
  ],
  faq: [
    { q: { ko: '몬트리올 Service Canada 위치는 어디인가요?', en: 'Where are Service Canada offices in Montréal?', fr: 'Où sont les bureaux Service Canada à Montréal?' }, a: { ko: '주요 지점: ① 다운타운 — 1000 De La Gauchetière W (Guy-Concordia 근처) ② CDN — 3500 Queen Mary Rd ③ 몬트리올 노스 — 5400 Henri-Bourassa Blvd. 위 링크에서 Google 지도로 바로 확인할 수 있어요. 운영 시간은 월–금 8:30–16:00 (지점마다 상이).', en: 'Key locations: ① Downtown — 1000 De La Gauchetière W (near Guy-Concordia) ② CDN — 3500 Queen Mary Rd ③ Montréal North — 5400 Henri-Bourassa Blvd. Click the map links above to open in Google Maps. Hours: Mon–Fri 8:30–16:00 (varies by location).', fr: "Principaux bureaux : ① Centre-ville — 1000 De La Gauchetière O (près Guy-Concordia) ② CDN — 3500 Queen Mary ③ Mtl-Nord — 5400 Henri-Bourassa. Cliquez les liens ci-dessus pour Google Maps. Heures : lun–ven 8h30–16h (variable)." } },
    { q: { ko: 'SIN 없이 일하면 어떻게 되나요?', en: 'What happens if I work without a SIN?', fr: 'Que se passe-t-il si je travaille sans NAS?' }, a: { ko: '고용주는 첫 급여일 전에 SIN을 요구해야 해요. SIN을 기다리는 동안 일을 시작하고 며칠 안에 제출할 수 있어요.', en: 'Employers are required to ask for a SIN before your first payday. You can start work while waiting for your SIN and provide it within a few days.', fr: "L'employeur doit demander le NAS avant la première paie. Vous pouvez commencer en attendant et le fournir sous quelques jours." } },
    { q: { ko: 'SIN이 세금 번호와 같은 건가요?', en: 'Is a SIN the same as a tax ID?', fr: 'Le NAS est-il un identifiant fiscal?' }, a: { ko: '네, SIN은 고용, 세금 신고, 일부 정부 혜택에 쓰여요. 민감한 개인정보이니 비공개로 보관하세요.', en: 'Yes — your SIN is used for employment, tax returns, and some government benefits. Keep it private — it\'s sensitive personal information.', fr: "Oui — le NAS sert à l'emploi, aux déclarations et à certaines prestations. Gardez-le confidentiel — c'est une donnée sensible." } },
    { q: { ko: '영구 주소가 없어도 신청할 수 있나요?', en: 'Can I apply before I have a permanent address?', fr: "Puis-je demander sans adresse permanente?" }, a: { ko: '네. 임시 주소(에어비앤비, 호스텔)도 SIN 신청에 사용할 수 있어요.', en: 'Yes. A temporary address (Airbnb, hostel) is acceptable for the SIN application.', fr: "Oui. Une adresse temporaire (Airbnb, auberge) est acceptée pour la demande de NAS." } },
  ],
  sidebar: {
    quickFacts: [
      { label: { ko: '비용', en: 'Cost', fr: 'Coût' }, value: { ko: '무료', en: 'Free', fr: 'Gratuit' } },
      { label: { ko: '방문 시간', en: 'In-person time', fr: 'Temps en personne' }, value: { ko: '~45분', en: '~45 min', fr: '~45 min' } },
      { label: { ko: '온라인 시간', en: 'Online time', fr: 'Temps en ligne' }, value: { ko: '2–4주', en: '2–4 weeks', fr: '2–4 semaines' } },
      { label: { ko: '서류', en: 'Documents', fr: 'Documents' }, value: { ko: '여권 + 허가증', en: 'Passport + permit', fr: 'Passeport + permis' } },
    ],
    timeline: { ko: '대부분 도착 첫 주에 해결해요. 취업 전에 꼭 필요해요.', en: 'Most people do this in their first week. Required before starting any work.', fr: 'La plupart le font la première semaine. Nécessaire avant tout emploi.' },
    nextStepId: 'transit',
    nextStepLabel: { ko: '대중교통 / OPUS 카드', en: 'Transit / OPUS card', fr: 'Transport / Carte OPUS' },
  },
  completionCard: {
    headline: { ko: '캐나다에서 일하고 생활할 준비가 됐습니다.', en: 'You can work and live in Canada now.', fr: 'Vous pouvez travailler et vivre au Canada maintenant.' },
    body: { ko: 'SIN 번호는 번호 그 이상이에요. 캐나다 시스템 안에 존재하기 시작한 거예요.', en: 'A SIN is more than a number. It means you exist inside the Canadian system.', fr: 'Un NAS, c\'est plus qu\'un numéro. Ça veut dire que vous existez dans le système canadien.' },
  },
}

// ─── TAB 6: Licence ───────────────────────────────────────────────────────────

const LICENCE_TAB: TabContent = {
  id: 'licence',
  label: { ko: '운전면허', en: 'Driver licence', fr: 'Permis de conduire' },
  hero: {
    title: { ko: '한국 운전면허 교환하기', en: "Converting your Korean driver's licence", fr: 'Échanger votre permis coréen' },
    sub: {
      ko: '한국 운전면허가 있다면 추가 시험 없이 퀘벡 면허로 교환할 수 있는 경우가 많아요. 교환은 SAAQ 사무소에서 처리해요.',
      en: "If you have a Korean driver's licence, you may be able to exchange it for a Québec licence without additional tests. The exchange is handled at a SAAQ office.",
      fr: "Avec un permis coréen, vous pouvez souvent l'échanger contre un permis québécois sans examen. L'échange se fait à un bureau de la SAAQ.",
    },
    when: { ko: '첫 몇 달 이내, 서두를 필요는 없어요', en: 'Within your first few months — no rush', fr: 'Dans les premiers mois — rien ne presse' },
    cost: { ko: '~$30–100 (수수료 다양)', en: '~$30–100 (fees vary)', fr: '~30–100$ (frais variables)' },
    time: { ko: '~30분 (예약 후 방문)', en: '~30 min once you have an appointment', fr: '~30 min avec rendez-vous' },
    canBeforeArrival: { ko: '아니요, 캐나다 도착 후', en: 'No, done after arriving', fr: "Non, après l'arrivée" },
  },
  options: [
    {
      name: 'SAAQ licence exchange',
      sub: { ko: '한국 → 퀘벡 면허, 재시험 없음', en: 'Korean → Québec licence, no retesting', fr: 'Coréen → québécois, sans réexamen' },
      topPick: true,
      meta: [
        { icon: 'currency-dollar', label: { ko: '~$30–100', en: '~$30–100', fr: '~30–100$' } },
        { icon: 'calendar', label: { ko: '방문, 예약 권장', en: 'In-person, appointment recommended', fr: 'En personne, rendez-vous conseillé' } },
        { icon: 'file-text', label: { ko: '여권 + 한국 면허 + 공인 프랑스어 번역', en: 'Passport + Korean licence + certified French translation', fr: 'Passeport + permis coréen + traduction certifiée' } },
      ],
      worksFor: [
        { ko: '운전할 계획이고 유효한 한국 면허가 있는 분', en: 'Anyone with valid Korean licence who plans to drive', fr: 'Avec un permis coréen valide et envie de conduire' },
        { ko: '퀘벡 신분증을 원하는 분', en: 'Those wanting Québec ID', fr: "Ceux qui veulent une pièce d'identité québécoise" },
      ],
      worthKnowing: [
        { ko: '공인 프랑스어 번역이 보통 필요 (공증사무소 ~$40)', en: 'Certified French translation typically required (~$40 at a notary)', fr: 'Traduction française certifiée souvent requise (~40$ chez un notaire)' },
        { ko: 'SAAQ 사무소는 붐빌 수 있음 — 미리 예약', en: 'SAAQ offices can be busy — book in advance', fr: 'Les bureaux SAAQ sont souvent occupés — réservez à l\'avance' },
      ],
      recommendNote: {
        ko: '한국 운전면허는 직접 교환이 인정돼서 필기나 도로 주행 시험이 필요 없어요. 예약과 서류만 준비하면 돼요.',
        en: 'A Korean driver\'s licence is recognized for direct exchange — no written or road test required. Just an appointment and the documents.',
        fr: "Le permis coréen est reconnu pour un échange direct — sans examen théorique ni pratique. Juste un rendez-vous et les documents.",
      },
    },
    {
      name: 'International Driving Permit (IDP)',
      sub: { ko: '출국 전 한국에서 발급', en: 'Get in Korea before leaving', fr: 'À obtenir en Corée avant le départ' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '~₩8,500 (한국)', en: '~₩8,500 in Korea', fr: '~8 500₩ en Corée' } },
        { icon: 'calendar', label: { ko: '1년 유효', en: 'Valid for 1 year', fr: 'Valide 1 an' } },
      ],
      worksFor: [
        { ko: '도착 즉시 운전해야 하는 분', en: 'Needing to drive immediately on arrival', fr: "Besoin de conduire dès l'arrivée" },
        { ko: 'SAAQ 교환을 기다리는 동안', en: 'While waiting for SAAQ exchange', fr: "En attendant l'échange SAAQ" },
      ],
      worthKnowing: [
        { ko: '출국 전 한국에서 발급해야 함', en: 'Must be obtained in Korea before departure', fr: 'À obtenir en Corée avant de partir' },
        { ko: '영구적인 대체물은 아님', en: 'Not a permanent substitute', fr: 'Pas un substitut permanent' },
      ],
    },
  ],
  compareTable: {
    headers: [
      { ko: '옵션', en: 'Option', fr: 'Option' },
      { ko: '비용', en: 'Cost', fr: 'Coût' },
      { ko: '시험 필요', en: 'Tests required', fr: 'Examen requis' },
      { ko: '장소', en: 'Where', fr: 'Où' },
      { ko: '유효 기간', en: 'Valid for', fr: 'Validité' },
    ],
    rows: [
      { name: 'SAAQ exchange', cols: ['$30–100', false, 'SAAQ office, Montréal', 'Permanent'] },
      { name: 'IDP', cols: ['$11 approx.', false, 'Korean driving association', '1 year only'] },
    ],
  },
  communityNotes: [
    { flag: '🇰🇷', person: { ko: '워킹홀리데이 · 2024년 5월', en: 'Working Holiday May 2024', fr: 'PVT mai 2024' }, text: { ko: '두 번째 달에 SAAQ 교환을 했어요. 온라인 예약이 쉬웠고, 번역은 공증사무소에서 $40 정도 들었어요.', en: 'Did the SAAQ exchange in my second month. Appointment was easy to book online. The translation cost me about $40 at a notary.', fr: "Échange SAAQ au 2e mois. Rendez-vous facile en ligne. La traduction m'a coûté ~40$ chez un notaire." }, likes: 21 },
    { flag: '🇰🇷', person: { ko: '학생 · 2023년 12월', en: 'Student Dec 2023', fr: 'Étudiant déc. 2023' }, text: { ko: '출국 전에 한국에서 국제운전면허증을 받았어요. SAAQ 정리하는 동안 첫 몇 달에 도움이 됐어요.', en: 'Got an IDP in Korea before leaving. Helped for the first few months while I sorted out the SAAQ.', fr: "J'ai pris un permis international en Corée avant de partir. Utile les premiers mois le temps de régler la SAAQ." }, likes: 16 },
    { flag: '🇰🇷', person: { ko: '영주권 · 2024년 2월', en: 'PR Feb 2024', fr: 'RP févr. 2024' }, text: { ko: 'Sherbrooke의 SAAQ 사무소는 간단했어요. 서류만 다 있으면 20분 정도면 끝나요.', en: 'SAAQ office on Sherbrooke was straightforward. Whole thing took about 20 minutes once I had all documents.', fr: "Le bureau SAAQ sur Sherbrooke était simple. Environ 20 min une fois tous les documents prêts." }, likes: 11 },
  ],
  helpLinks: [
    { label: { ko: 'SAAQ — 면허 교환', en: 'SAAQ — Licence exchange', fr: 'SAAQ — Échange de permis' }, url: 'https://saaq.gouv.qc.ca/en/drivers-licences/exchange-licence', domain: 'saaq.gouv.qc.ca' },
    { label: { ko: 'SAAQ 예약하기', en: 'Book SAAQ appointment', fr: 'Prendre rendez-vous SAAQ' }, url: 'https://saaq.gouv.qc.ca', domain: 'saaq.gouv.qc.ca' },
    { label: { ko: '국제운전면허증 정보', en: 'International Driving Permit info', fr: 'Info permis international' }, url: 'https://saaq.gouv.qc.ca', domain: 'saaq.gouv.qc.ca' },
  ],
  faq: [
    { q: { ko: '운전 시험을 봐야 하나요?', en: 'Do I need to take a driving test?', fr: 'Dois-je passer un examen de conduite?' }, a: { ko: '아니요 — 한국 면허는 직접 교환이 인정돼요. 필기나 도로 주행 시험이 필요 없어요.', en: 'No — Korean licences are recognized for direct exchange. No written or road test required.', fr: "Non — les permis coréens sont reconnus pour un échange direct. Sans examen théorique ni pratique." } },
    { q: { ko: '공인 프랑스어 번역은 어디서 받나요?', en: 'Where do I get a certified French translation?', fr: 'Où obtenir une traduction française certifiée?' }, a: { ko: '공인 공증사무소나 번역 서비스에서요. 보통 $30–60 들어요. "traducteur certifié Montréal"로 검색해보세요.', en: 'A certified notary or translation service. Usually costs $30–60. Search "traducteur certifié Montréal" for local options.', fr: 'Un notaire certifié ou un service de traduction. Généralement 30–60$. Cherchez « traducteur certifié Montréal ».' } },
    { q: { ko: '교환 전에 한국 면허가 퀘벡에서 얼마나 유효한가요?', en: 'How long is my Korean licence valid in Québec before I need to exchange it?', fr: 'Combien de temps mon permis coréen est-il valide avant échange?' }, a: { ko: '도착 후 일정 기간 동안 한국 면허로 운전할 수 있어요. 정확한 기간은 허가 유형에 따라 달라요. 교환은 언제든 가능하고, 많은 분이 첫 1–3개월에 해요.', en: 'Your Korean licence is valid for driving in Québec for a limited period after arrival. The exact duration depends on your permit type. The exchange can be done at any time — many people do it in their first 1–3 months.', fr: "Votre permis coréen est valide un temps limité après l'arrivée. La durée dépend de votre permis. L'échange est possible à tout moment — beaucoup le font dans les 1–3 premiers mois." } },
    { q: { ko: 'SAAQ 예약을 온라인으로 할 수 있나요?', en: 'Can I book a SAAQ appointment online?', fr: 'Puis-je réserver un rendez-vous SAAQ en ligne?' }, a: { ko: '네 — saaq.gouv.qc.ca에서 온라인 예약을 해요. 인기 있는 지점은 몇 주 전에 마감돼요.', en: 'Yes — saaq.gouv.qc.ca has online booking. Appointments at popular locations fill up a few weeks out.', fr: 'Oui — saaq.gouv.qc.ca offre la réservation en ligne. Les bureaux populaires se remplissent des semaines à l\'avance.' } },
  ],
  sidebar: {
    quickFacts: [
      { label: { ko: '시험 필요', en: 'Test required', fr: 'Examen requis' }, value: { ko: '없음', en: 'No', fr: 'Non' } },
      { label: { ko: '번역 비용', en: 'Translation cost', fr: 'Coût traduction' }, value: { ko: '~$40', en: '~$40', fr: '~40$' } },
      { label: { ko: '예약', en: 'Appointment', fr: 'Rendez-vous' }, value: { ko: '온라인 예약', en: 'Book online', fr: 'En ligne' } },
      { label: { ko: 'SAAQ 수수료', en: 'SAAQ fee', fr: 'Frais SAAQ' }, value: { ko: '~$30–100', en: '~$30–100', fr: '~30–100$' } },
    ],
    timeline: { ko: '보통 첫 1–3개월 이내에 해요. 당장 운전하지 않는다면 서두를 필요 없어요.', en: "Most people do this within their first 1–3 months. No rush if you're not driving immediately.", fr: "La plupart le font dans les 1–3 premiers mois. Pas urgent si vous ne conduisez pas tout de suite." },
    nextStepId: 'language',
    nextStepLabel: { ko: '언어 프로그램 & 커뮤니티', en: 'Language & community', fr: 'Langue & communauté' },
  },
  completionCard: {
    headline: { ko: '퀘벡 도로가 열렸습니다.', en: 'The roads of Québec are open to you.', fr: 'Les routes du Québec vous sont ouvertes.' },
    body: { ko: '면허 하나로 몬트리올 밖으로도 나갈 수 있어요. 로렌시안, 이스턴 타운십스, 퀘벡시티.', en: 'One licence, and Montréal is just the beginning. The Laurentians, the Townships, Québec City.', fr: 'Un permis, et Montréal n\'est qu\'un début. Laurentides, Cantons, Québec.' },
  },
}

// ─── TAB 7: Language ──────────────────────────────────────────────────────────

const LANGUAGE_TAB: TabContent = {
  id: 'language',
  label: { ko: '언어 프로그램', en: 'Language', fr: 'Langues' },
  hero: {
    title: { ko: '몬트리올의 언어 프로그램', en: 'Language programs in Montréal', fr: 'Programmes de langues à Montréal' },
    sub: {
      ko: '몬트리올은 이중언어 도시로, 프랑스어와 영어 둘 다 널리 쓰여요. 언어 프로그램은 무료 정부 프랑스어 강좌부터 회화 교환, 사설 수업까지 다양해요. 시작 마감일은 없어요.',
      en: "Montréal is bilingual — French and English are both widely spoken. Language programs range from free government French courses to conversation exchanges and private classes. There's no deadline for starting.",
      fr: "Montréal est bilingue — le français et l'anglais sont tous deux courants. Les programmes vont des cours de français gratuits aux échanges de conversation et cours privés. Aucun délai pour commencer.",
    },
    when: { ko: '언제든 준비되면 시작하세요', en: 'Whenever you feel settled — no deadline', fr: 'Quand vous vous sentez prêt — pas de délai' },
    cost: { ko: '무료 ~ $500/과목', en: 'Free to $500/course', fr: 'Gratuit à 500$/cours' },
    time: { ko: '유연한 일정', en: 'Flexible schedule', fr: 'Horaire flexible' },
    canBeforeArrival: { ko: '온라인 프로그램은 가능', en: 'Some online options available', fr: 'Certaines options en ligne disponibles' },
  },
  options: [
    {
      name: 'HAKKYO 프로그램 (유료 수업)',
      sub: { ko: '한국어·영어·불어 정규 수업 — 레벨별 소규모 클래스', en: 'Korean, English & French classes — small group, levelled', fr: 'Cours coréen, anglais, français — petits groupes par niveau' },
      topPick: true,
      meta: [
        { icon: 'currency-dollar', label: { ko: '수업별 요금 상이', en: 'Fee varies by program', fr: 'Tarif variable selon programme' } },
        { icon: 'users', label: { ko: '소규모 그룹', en: 'Small group classes', fr: 'Petits groupes' } },
        { icon: 'building', label: { ko: '몬트리올 오프라인', en: 'In-person Montréal', fr: 'En présentiel Montréal' } },
      ],
      worksFor: [
        { ko: '한국어를 배우거나 가르치고 싶은 분', en: 'Learn or practice Korean in Montréal', fr: 'Apprendre ou pratiquer le coréen à Montréal' },
        { ko: '영어·불어를 체계적으로 배우고 싶은 분', en: 'Structured English or French learning', fr: 'Apprentissage structuré anglais ou français' },
        { ko: '커뮤니티 기반의 소규모 환경을 원하는 분', en: 'Community-based small class environment', fr: 'Environnement communautaire en petit groupe' },
      ],
      worthKnowing: [
        { ko: '프로그램 일정과 가격은 /programs 페이지에서 확인', en: 'Schedule and pricing on the /programs page', fr: 'Planning et tarifs sur la page /programs' },
      ],
      recommendNote: {
        ko: 'HAKKYO는 무료 언어 교환 외에도 한국어·영어·불어 유료 클래스를 운영해요. 수업 일정은 프로그램 페이지에서 확인하세요.',
        en: 'HAKKYO runs paid Korean, English and French classes alongside the free exchange. Check the programs page for current schedules.',
        fr: "HAKKYO propose des cours payants de coréen, anglais et français en plus de l'échange gratuit. Consultez la page programmes.",
      },
    },
    {
      name: 'HAKKYO Language Exchange',
      sub: { ko: '한국어–프랑스어–영어 회화 교환 (무료)', en: 'Korean–French–English conversation exchange (free)', fr: 'Échange coréen–français–anglais (gratuit)' },
      topPick: false,
      meta: [
        { icon: 'currency-dollar', label: { ko: '무료', en: 'Free', fr: 'Gratuit' } },
        { icon: 'users', label: { ko: '소규모 그룹, 상시 운영', en: 'Small groups, ongoing', fr: 'Petits groupes, en continu' } },
        { icon: 'check', label: { ko: '사전 조건 없음', en: 'No prerequisites', fr: 'Aucun prérequis' } },
      ],
      worksFor: [
        { ko: '현지 프랑스어/영어 사용자를 만나고 싶은 분', en: 'Anyone wanting to meet local French or English speakers', fr: 'Rencontrer des francophones ou anglophones locaux' },
        { ko: '사회적인 학습', en: 'Social learning', fr: 'Apprentissage social' },
        { ko: '모든 수준', en: 'All levels', fr: 'Tous niveaux' },
      ],
      worthKnowing: [
        { ko: '회화 중심 — 정식 수업은 아님', en: 'Focus is conversation — not formal instruction', fr: 'Axé conversation — pas un cours formel' },
        { ko: '다른 학습과 병행하면 가장 좋음', en: 'Best combined with other study', fr: "Idéal en complément d'autres cours" },
      ],
      recommendNote: {
        ko: 'HAKKYO 참가자들은 교환을 통해 정식 수업만 들을 때보다 실제 환경에서 말하는 게 더 빨리 편해졌다고 많이 말해요.',
        en: 'Many HAKKYO participants say the exchange helped them feel comfortable speaking in a real environment faster than formal classes alone.',
        fr: "Beaucoup de participants HAKKYO disent que l'échange les a aidés à parler en situation réelle plus vite que les cours seuls.",
      },
    },
    {
      name: 'SANA (Government French)',
      sub: { ko: '무료 전일제 또는 시간제 프랑스어', en: 'Free full or part-time French', fr: 'Français gratuit temps plein ou partiel' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '무료', en: 'Free', fr: 'Gratuit' } },
        { icon: 'clock', label: { ko: '주간 또는 야간', en: 'Daytime or evening', fr: 'Jour ou soir' } },
      ],
      worksFor: [
        { ko: '체계적인 프랑스어 학습', en: 'Structured French instruction', fr: 'Apprentissage structuré du français' },
        { ko: '워킹홀리데이·영주권자 (자격 확인)', en: 'Working Holiday and PR holders (check eligibility)', fr: 'PVT et RP (vérifier admissibilité)' },
        { ko: '직업용 프랑스어 목표', en: 'Targeting professional French', fr: 'Visant le français professionnel' },
      ],
      worthKnowing: [
        { ko: '대기 명단이 길 수 있음', en: 'Waitlists can be long', fr: "Listes d'attente parfois longues" },
        { ko: '전일제는 상당한 시간 필요', en: 'Full-time requires significant availability', fr: 'Le temps plein demande beaucoup de disponibilité' },
      ],
    },
    {
      name: 'Concordia CCE / UQAM',
      sub: { ko: '유료, 유연한 일정', en: 'Paid, flexible schedule', fr: 'Payant, horaire flexible' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '$150–500/과목', en: '$150–500/course', fr: '150–500$/cours' } },
        { icon: 'clock', label: { ko: '야간·주말', en: 'Evening and weekend', fr: 'Soir et week-end' } },
      ],
      worksFor: [
        { ko: '인증 수료증', en: 'Accredited certificates', fr: 'Certificats accrédités' },
        { ko: '주간에 일하는 야간 학습자', en: 'Evening learners who work daytime', fr: 'Apprenants du soir qui travaillent le jour' },
      ],
      worthKnowing: [
        { ko: '수준에 따라 비용 다름', en: 'Costs vary by level', fr: 'Coûts variables selon le niveau' },
      ],
    },
  ],
  compareTable: {
    headers: [
      { ko: '프로그램', en: 'Program', fr: 'Programme' },
      { ko: '비용', en: 'Cost', fr: 'Coût' },
      { ko: '형식', en: 'Format', fr: 'Format' },
      { ko: '수준', en: 'Level', fr: 'Niveau' },
      { ko: '수료증?', en: 'Certificate?', fr: 'Certificat?' },
    ],
    rows: [
      { name: 'HAKKYO Exchange', cols: ['Free', 'Small group conversation', 'All', false] },
      { name: 'SANA', cols: ['Free', 'Full-time or part-time', 'Beginner–Advanced', false] },
      { name: 'Concordia CCE', cols: ['$150–500', 'Evening, weekend', 'Beginner–Advanced', true] },
      { name: 'UQAM Continuing Ed', cols: ['$150–400', 'Evening, weekend', 'Various', true] },
    ],
  },
  communityNotes: [
    { flag: '🇰🇷', person: { ko: '학생 · 2023년 10월', en: 'Student Oct 2023', fr: 'Étudiant oct. 2023' }, text: { ko: '셋째 주에 HAKKYO 교환을 시작했어요. 생각보다 훨씬 부담이 없었고, 일상 프랑스어에 정말 도움이 됐어요.', en: 'Started HAKKYO exchange in my third week. Much less intimidating than I expected. Really helped with everyday French.', fr: "Commencé l'échange HAKKYO la 3e semaine. Bien moins intimidant que prévu. Très utile pour le français quotidien." }, likes: 27 },
    { flag: '🇰🇷', person: { ko: '워킹홀리데이 · 2024년 8월', en: 'Working Holiday Aug 2024', fr: 'PVT août 2024' }, text: { ko: 'SANA 대기가 저는 2개월이었어요. 그동안 HAKKYO를 썼는데 회화 연습에는 오히려 더 좋았어요.', en: 'SANA waitlist was 2 months for me. Used HAKKYO in the meantime and it was actually better for conversational practice.', fr: "La liste d'attente SANA était de 2 mois. J'ai utilisé HAKKYO entretemps, meilleur pour la conversation." }, likes: 20 },
    { flag: '🇫🇷', person: { ko: '프랑스 학생', en: 'French Student', fr: 'Étudiant français' }, text: { ko: 'HAKKYO는 정식 수업의 부담 없이 영어를 연습하기에 좋았어요.', en: 'HAKKYO was good for practicing English without the pressure of a formal class.', fr: "HAKKYO était bien pour pratiquer l'anglais sans la pression d'un cours formel." }, likes: 13 },
  ],
  helpLinks: [
    { label: { ko: 'HAKKYO 프로그램 (한국어·영어·불어 수업)', en: 'HAKKYO programs — Korean, English, French classes', fr: 'Programmes HAKKYO — cours coréen, anglais, français' }, url: '/programs', domain: 'hakkyo-mtl.vercel.app' },
    { label: { ko: 'SANA 프랑스어 강좌', en: 'SANA French classes', fr: 'Cours de français SANA' }, url: 'https://www.quebec.ca/en/immigration/french-language', domain: 'immigration-quebec.gouv.qc.ca' },
    { label: { ko: 'Concordia CCE', en: 'Concordia CCE', fr: 'Concordia CCE' }, url: 'https://www.concordia.ca/cce.html', domain: 'concordia.ca' },
    { label: { ko: 'UQAM 평생교육', en: 'UQAM continuing ed', fr: 'UQAM formation continue' }, url: 'https://www.uqam.ca', domain: 'uqam.ca' },
  ],
  faq: [
    { q: { ko: '몬트리올에서 살려면 프랑스어를 해야 하나요?', en: 'Do I need to speak French to live in Montréal?', fr: 'Faut-il parler français pour vivre à Montréal?' }, a: { ko: '일상생활에는 꼭 필요하진 않아요 — 영어가 널리 쓰여요. 하지만 프랑스어는 더 많은 사회적·직업적 기회를 열어줘요. 많은 이민자가 기초라도 배우면 도움이 된다고 느껴요.', en: 'Not for daily life — English is widely spoken. But French opens up more social and professional opportunities. Many newcomers find it helpful to at least learn basics.', fr: "Pas pour le quotidien — l'anglais est courant. Mais le français ouvre plus de portes sociales et professionnelles. Beaucoup trouvent utile d'apprendre au moins les bases." } },
    { q: { ko: '프랑스어로 대화가 되기까지 얼마나 걸리나요?', en: 'How long does it take to become conversational in French?', fr: 'Combien de temps pour converser en français?' }, a: { ko: '꾸준히 연습하면 많은 분이 3–6개월에 기초 회화 수준에 도달해요. 매일 노출(TV, 팟캐스트, HAKKYO 교환)이 크게 가속화해요.', en: 'With regular practice, many people reach basic conversational French in 3–6 months. Daily exposure (TV, podcasts, HAKKYO exchange) accelerates this significantly.', fr: "Avec une pratique régulière, beaucoup atteignent un niveau de base en 3–6 mois. L'exposition quotidienne (TV, balados, échange HAKKYO) accélère beaucoup." } },
    { q: { ko: 'SANA 수업이 정말 무료인가요?', en: 'Are SANA classes really free?', fr: 'Les cours SANA sont-ils vraiment gratuits?' }, a: { ko: '네 — SANA는 자격이 되는 신규 이민자에게 퀘벡 정부가 전액 지원해요. 워킹홀리데이와 일부 학생 허가 소지자가 해당돼요. SANA 웹사이트에서 자격 조건을 확인하세요.', en: 'Yes — SANA is fully subsidized by the Québec government for eligible newcomers. Working Holiday and some student permit holders qualify. Check the eligibility criteria on the SANA website.', fr: "Oui — SANA est entièrement subventionné par le Québec pour les arrivants admissibles. Les titulaires de PVT et certains permis d'études sont admissibles. Vérifiez les critères sur le site SANA." } },
    { q: { ko: 'HAKKYO 교환과 일반 수업의 차이는 뭔가요?', en: "What's the difference between HAKKYO exchange and a regular class?", fr: "Quelle différence entre l'échange HAKKYO et un cours?" }, a: { ko: 'HAKKYO는 회화 파트너 교환이에요 — 비정형적이고 사회적이며 무료예요. 수업은 구조와 문법 중심이에요. 많은 분이 둘 다 해요.', en: 'HAKKYO is a conversation partner exchange — unstructured, social, and free. Classes focus on structure and grammar. Many people do both.', fr: "HAKKYO est un échange de partenaires de conversation — informel, social et gratuit. Les cours misent sur la structure et la grammaire. Beaucoup font les deux." } },
  ],
  sidebar: {
    quickFacts: [
      { label: { ko: 'HAKKYO', en: 'HAKKYO', fr: 'HAKKYO' }, value: { ko: '무료', en: 'Free', fr: 'Gratuit' } },
      { label: { ko: 'SANA', en: 'SANA', fr: 'SANA' }, value: { ko: '무료 (자격)', en: 'Free (eligible)', fr: 'Gratuit (admissible)' } },
      { label: { ko: 'Concordia CCE', en: 'Concordia CCE', fr: 'Concordia CCE' }, value: { ko: '$150–500', en: '$150–500', fr: '150–500$' } },
      { label: { ko: '수료증 옵션', en: 'Certificate options', fr: 'Certificats' }, value: { ko: '있음', en: 'Yes', fr: 'Oui' } },
    ],
    timeline: { ko: '대부분 정착하고 나서 시작해요 — 어떤 분은 첫 주에, 어떤 분은 한두 달 후에.', en: 'Most people start once they feel settled — some in the first week, others after a month or two.', fr: "La plupart commencent une fois installés — certains dès la première semaine, d'autres après un mois ou deux." },
  },
  completionCard: {
    headline: { ko: '언어는 연습할수록 늘어납니다.', en: 'Language grows with practice.', fr: 'La langue grandit avec la pratique.' },
    body: { ko: '영어든 불어든, HAKKYO에서 실제로 말하는 연습을 시작할 수 있어요.', en: 'English or French — HAKKYO is where you start actually speaking.', fr: 'Anglais ou français — HAKKYO, c\'est là où vous commencez vraiment à parler.' },
  },
}

// ─── TAB 8: Flights ───────────────────────────────────────────────────────────

const FLIGHTS_TAB: TabContent = {
  id: 'flights',
  label: { ko: '항공권', en: 'Flights', fr: 'Vols' },
  hero: {
    title: { ko: '몬트리올행 항공권 예약하기', en: 'Booking your flight to Montréal', fr: 'Réserver votre vol pour Montréal' },
    sub: {
      ko: '몬트리올의 주요 국제공항은 몬트리올-트뤼도(YUL)예요. 서울(ICN)에서 직항이 있어요. 가격은 얼마나 일찍 예약하느냐에 따라 크게 달라져요.',
      en: 'The main international airport serving Montréal is Montréal-Trudeau (YUL). Direct flights from Seoul (ICN) are available. Prices vary significantly depending on how far in advance you book.',
      fr: "Le principal aéroport international de Montréal est Montréal-Trudeau (YUL). Des vols directs depuis Séoul (ICN) existent. Les prix varient beaucoup selon l'avance de réservation.",
    },
    when: { ko: '출발 60–90일 전 예약 시 가격 좋음', en: 'Book 60–90 days before departure for best prices', fr: 'Réservez 60–90 jours avant pour les meilleurs prix' },
    cost: { ko: '$750–1,400 (ICN → YUL)', en: '$750–1,400 (ICN → YUL)', fr: '750–1 400$ (ICN → YUL)' },
    time: { ko: '직항 약 14시간, 경유 18–22시간', en: '~14 hr direct, 18–22 hr with connection', fr: '~14h direct, 18–22h avec escale' },
    canBeforeArrival: { ko: '네, 당연히 도착 전에', en: 'Yes — this is done before arriving', fr: "Oui — cela se fait avant d'arriver" },
  },
  options: [
    {
      name: 'Air Canada Direct ICN→YUL',
      sub: { ko: '직항, 약 14시간', en: 'Non-stop, ~14 hours', fr: 'Sans escale, ~14h' },
      topPick: true,
      meta: [
        { icon: 'currency-dollar', label: { ko: '$800–1,400', en: '$800–1,400', fr: '800–1 400$' } },
        { icon: 'plane', label: { ko: '직항, 경유 없음', en: 'Direct, no stopover', fr: 'Direct, sans escale' } },
      ],
      worksFor: [
        { ko: '단일 비행을 선호하는 분', en: 'Prefer single flight', fr: 'Préfèrent un seul vol' },
        { ko: '도착 일정이 빡빡한 분', en: 'Tight arrival schedule', fr: "Horaire d'arrivée serré" },
        { ko: '짐이 많은 분', en: 'Carrying significant luggage', fr: 'Beaucoup de bagages' },
      ],
      worthKnowing: [
        { ko: '경유 옵션보다 비쌈', en: 'Pricier than connecting options', fr: 'Plus cher que les vols avec escale' },
        { ko: '좋은 좌석은 일찍 예약', en: 'Book early for best availability', fr: 'Réservez tôt pour la disponibilité' },
      ],
      recommendNote: {
        ko: '직항이면 덜 피곤한 상태로 도착해서 긴 환승 없이 첫날을 시작할 수 있어요. 많은 분들에게는 절약되는 시간이 가격 차이만큼의 가치가 있어요.',
        en: 'A direct flight means you land fresh and can start your first day without a long layover. For many, the time saved is worth the price difference.',
        fr: "Un vol direct, c'est arriver reposé et commencer sa première journée sans longue escale. Pour beaucoup, le temps gagné vaut la différence de prix.",
      },
    },
    {
      name: 'Korean Air / Asiana',
      sub: { ko: '경유, 18–22시간', en: 'Via stopover, 18–22 hours', fr: 'Avec escale, 18–22h' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '$750–1,200', en: '$750–1,200', fr: '750–1 200$' } },
        { icon: 'plane', label: { ko: '1회 경유', en: '1 stopover', fr: '1 escale' } },
      ],
      worksFor: [
        { ko: '이동 시간에 유연한 분', en: 'Flexible on travel time', fr: 'Flexibles sur la durée' },
        { ko: '마일리지 적립 회원', en: 'Frequent flyer holders', fr: 'Membres grands voyageurs' },
        { ko: '예산을 아끼는 분', en: 'Budget-conscious', fr: 'Petit budget' },
      ],
      worthKnowing: [
        { ko: '이동 시간이 늘어남', en: 'Adds travel time', fr: 'Allonge le trajet' },
        { ko: '환승 시간이 빠듯할 수 있음', en: 'Connection timing can be tight', fr: 'Les correspondances peuvent être serrées' },
      ],
    },
    {
      name: 'Costco Travel (bundle)',
      sub: { ko: '항공 + 호텔 패키지', en: 'Flight + hotel package', fr: 'Forfait vol + hôtel' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '시즌에 따라 다름', en: 'Varies by season', fr: 'Selon la saison' } },
      ],
      worksFor: [
        { ko: '숙소와 항공을 함께 예약하는 분', en: 'Booking housing and flights together', fr: 'Réserver logement et vol ensemble' },
        { ko: 'Costco 회원', en: 'Costco members', fr: 'Membres Costco' },
      ],
      worthKnowing: [
        { ko: '일정 변경 유연성이 적음', en: 'Less flexibility to change plans', fr: 'Moins de flexibilité pour changer' },
      ],
    },
  ],
  compareTable: {
    headers: [
      { ko: '옵션', en: 'Option', fr: 'Option' },
      { ko: '가격대', en: 'Price range', fr: 'Fourchette' },
      { ko: '경유', en: 'Stopover', fr: 'Escale' },
      { ko: '소요 시간', en: 'Duration', fr: 'Durée' },
      { ko: '마일리지', en: 'Loyalty points', fr: 'Points fidélité' },
    ],
    rows: [
      { name: 'Air Canada Direct', cols: ['$800–1,400', false, '~14 hr', true] },
      { name: 'Korean Air', cols: ['$800–1,200', '1 stop', '18–20 hr', true] },
      { name: 'Asiana', cols: ['$750–1,100', '1 stop', '20–22 hr', true] },
      { name: 'Costco bundle', cols: ['Varies', 'Varies', 'Varies', false] },
    ],
  },
  communityNotes: [
    { flag: '🇰🇷', person: { ko: '학생 · 2024년 8월', en: 'Student Aug 2024', fr: 'Étudiant août 2024' }, text: { ko: '8주 전에 Air Canada 직항을 예약했어요. 약 $1,100이었어요. 아침에 도착해서 하루 종일 일을 처리할 수 있었어요.', en: 'Booked Air Canada direct 8 weeks before. Around $1,100. Landed in the morning and had the whole day to sort things out.', fr: "Réservé Air Canada direct 8 semaines avant. ~1 100$. Arrivé le matin, toute la journée pour m'organiser." }, likes: 29 },
    { flag: '🇰🇷', person: { ko: '워킹홀리데이 · 2024년 3월', en: 'Working Holiday Mar 2024', fr: 'PVT mars 2024' }, text: { ko: '밴쿠버 경유로 대한항공을 탔어요. 더 저렴했지만 총 20시간이었어요. 가격 차이만큼은 가치가 있었어요.', en: 'Took Korean Air with a connection in Vancouver. Cheaper but 20 hours total. Worth it for the price difference.', fr: "Korean Air avec escale à Vancouver. Moins cher mais 20h au total. Ça valait la différence de prix." }, likes: 17 },
    { flag: '🇰🇷', person: { ko: '영주권', en: 'PR', fr: 'RP' }, text: { ko: '저는 항상 60–90일 전에 예약해요. 그보다 늦으면 가격이 많이 올라가요.', en: 'I always book 60–90 days out. Anything less and the prices jump a lot.', fr: "Je réserve toujours 60–90 jours à l'avance. Moins que ça, les prix grimpent beaucoup." }, likes: 12 },
  ],
  helpLinks: [
    { label: { ko: 'Air Canada', en: 'Air Canada', fr: 'Air Canada' }, url: 'https://www.aircanada.com', domain: 'aircanada.com' },
    { label: { ko: 'Korean Air', en: 'Korean Air', fr: 'Korean Air' }, url: 'https://www.koreanair.com', domain: 'koreanair.com' },
    { label: { ko: 'Asiana Airlines', en: 'Asiana Airlines', fr: 'Asiana Airlines' }, url: 'https://flyasiana.com', domain: 'flyasiana.com' },
    { label: { ko: 'Google Flights', en: 'Google Flights', fr: 'Google Flights' }, url: 'https://www.google.com/flights', domain: 'google.com/flights' },
  ],
  faq: [
    { q: { ko: '직항이 추가 비용만큼의 가치가 있나요?', en: 'Is a direct flight worth the extra cost?', fr: 'Un vol direct vaut-il le coût supplémentaire?' }, a: { ko: '예산과 체력에 달려 있어요. 직항(~14시간)이면 덜 피곤하게 도착하고 첫날을 온전히 쓸 수 있어요. 경유는 $100–300 아끼지만 4–8시간이 늘어나요.', en: 'Depends on your budget and energy. A direct flight (~14 hr) means landing less tired and having a full first day. Connecting flights can save $100–300 but add 4–8 hours.', fr: "Selon le budget et l'énergie. Un vol direct (~14h), c'est arriver moins fatigué avec une journée complète. Avec escale, on économise 100–300$ mais on ajoute 4–8h." } },
    { q: { ko: '언제 예약하는 게 가장 좋나요?', en: "What's the best time to book?", fr: 'Quel est le meilleur moment pour réserver?' }, a: { ko: '보통 출발 60–90일 전이 가장 저렴해요. 출발 2주 이내 예약은 거의 항상 훨씬 비싸요.', en: 'Prices are typically lowest 60–90 days before departure. Booking within 2 weeks of departure almost always costs significantly more.', fr: "Les prix sont généralement les plus bas 60–90 jours avant. Réserver à moins de 2 semaines coûte presque toujours bien plus cher." } },
    { q: { ko: '한국 이민자들은 보통 어떤 항공사를 이용하나요?', en: 'What airline do most Korean newcomers use?', fr: 'Quelle compagnie utilisent la plupart des arrivants coréens?' }, a: { ko: 'Air Canada와 대한항공이 둘 다 흔해요. 대한항공은 한국어 서비스 경험이 좋아요. Air Canada는 ICN에서 직항 노선이 더 많아요.', en: 'Air Canada and Korean Air are both common. Korean Air has a strong Korean-language service experience. Air Canada has more direct routing from ICN.', fr: "Air Canada et Korean Air sont tous deux courants. Korean Air offre un excellent service en coréen. Air Canada a plus de vols directs depuis ICN." } },
    { q: { ko: '도착 시 수하물이 분실되면 어떻게 하나요?', en: 'What should I do if my luggage is lost on arrival?', fr: 'Que faire si mes bagages sont perdus à l\'arrivée?' }, a: { ko: '공항을 나가기 전에 항공사 수하물 데스크에 신고하세요. 탑승권과 수하물 태그를 보관하세요. 대부분의 가방은 24–72시간 내에 배달돼요.', en: "Report to the airline's baggage desk before leaving the airport. Keep your boarding pass and baggage tags. Most bags are delivered within 24–72 hours.", fr: "Signalez-le au comptoir bagages de la compagnie avant de quitter l'aéroport. Gardez carte d'embarquement et étiquettes. La plupart des bagages sont livrés sous 24–72h." } },
  ],
  sidebar: {
    quickFacts: [
      { label: { ko: '직항', en: 'Direct flight', fr: 'Vol direct' }, value: { ko: '$800–1,400', en: '$800–1,400', fr: '800–1 400$' } },
      { label: { ko: '경유', en: 'Via connection', fr: 'Avec escale' }, value: { ko: '$750–1,200', en: '$750–1,200', fr: '750–1 200$' } },
      { label: { ko: '미리 예약', en: 'Book ahead', fr: 'Réserver tôt' }, value: { ko: '60–90일', en: '60–90 days', fr: '60–90 jours' } },
      { label: { ko: '비행 시간', en: 'Flight time', fr: 'Durée du vol' }, value: { ko: '14–22시간', en: '14–22 hr', fr: '14–22h' } },
    ],
    timeline: { ko: '출발 60–90일 전 예약을 많이 해요. 8월과 12월은 성수기예요.', en: 'Most people book 60–90 days out. August and December are peak season — book earlier then.', fr: "La plupart réservent 60–90 jours à l'avance. Août et décembre sont en haute saison." },
    nextStepId: 'airport',
    nextStepLabel: { ko: '공항 도착 & 입국 심사', en: 'Airport arrival & customs', fr: "Arrivée & douanes" },
  },
  completionCard: {
    headline: { ko: '몬트리올행 티켓, 준비됐습니다.', en: 'Your ticket to Montréal is ready.', fr: 'Votre billet pour Montréal est prêt.' },
    body: { ko: '출발 60–90일 전 예매, 환승 시간 여유, 마일리지 확인까지. 이제 진짜 떠날 준비가 됐어요.', en: 'Book 60–90 days out, allow layover time, check your miles. You\'re actually doing this.', fr: 'Réservez 60–90 jours avant, prévoyez de la marge, vérifiez vos miles. Vous le faites vraiment.' },
  },
}

// ─── NEW TAB: Airport arrival ─────────────────────────────────────────────────

const AIRPORT_TAB: TabContent = {
  id: 'airport',
  label: { ko: '공항 도착', en: 'Airport arrival', fr: 'Arrivée aéroport' },
  hero: {
    title: { ko: '몬트리올 트뤼도(YUL) 도착 후', en: 'Arriving at Montréal-Trudeau (YUL)', fr: "Arriver à Montréal-Trudeau (YUL)" },
    sub: {
      ko: '비행기에서 내리면 입국 심사를 통과하고, 세관 신고를 하고, 수하물을 찾은 다음 시내로 이동해요. 첫 발걸음이지만, 잘 알고 가면 30–60분이면 통과할 수 있어요.',
      en: "Once off the plane you'll clear immigration, complete a customs declaration, collect luggage, and get to the city. Knowing what to expect makes this a 30–60 minute process.",
      fr: "À la sortie de l'avion, vous passez l'immigration, remplissez la déclaration douanière, récupérez vos bagages et rejoignez la ville. Bien préparé, c'est 30–60 minutes.",
    },
    when: { ko: '도착 당일', en: 'Arrival day', fr: "Jour d'arrivée" },
    cost: { ko: '입국 무료, 시내 이동 $11–50', en: 'Entry free; downtown $11–50', fr: 'Entrée gratuite; centre-ville 11–50$' },
    time: { ko: '입국 심사 + 세관 30–60분', en: 'Immigration + customs 30–60 min', fr: 'Immigration + douanes 30–60 min' },
    canBeforeArrival: { ko: 'ArriveCAN 앱 사전 준비 권장', en: 'Prepare ArriveCAN info in advance', fr: 'Préparez ArriveCAN à l\'avance' },
  },
  options: [
    {
      name: 'STM 747 Express Bus',
      sub: { ko: 'YUL → 다운타운, 24시간 운행', en: 'YUL to downtown, runs 24/7', fr: 'YUL au centre-ville, 24/7' },
      topPick: true,
      meta: [
        { icon: 'currency-dollar', label: { ko: '$11 정액 (신용카드 가능)', en: '$11 flat (credit card accepted)', fr: '11$ forfait (carte acceptée)' } },
        { icon: 'clock', label: { ko: '20–30분 간격', en: 'Every 20–30 min', fr: 'Toutes les 20–30 min' } },
        { icon: 'bus', label: { ko: 'OPUS 카드 없이 탑승 가능', en: 'No OPUS card needed', fr: 'Sans carte OPUS' } },
      ],
      worksFor: [
        { ko: '혼자 여행하는 분', en: 'Solo travellers', fr: 'Voyageurs seuls' },
        { ko: '짐이 적은 분', en: 'Light baggage', fr: 'Peu de bagages' },
        { ko: '예산을 아끼고 싶은 분', en: 'Budget-conscious', fr: 'Petit budget' },
      ],
      worthKnowing: [
        { ko: '교통 상황에 따라 45–70분 소요', en: '45–70 min total depending on traffic', fr: '45–70 min selon la circulation' },
        { ko: '종착지는 Berri-UQAM 지하철역', en: 'Terminus at Berri-UQAM metro', fr: 'Terminus à Berri-UQAM' },
      ],
      recommendNote: {
        ko: '신용카드로 바로 탈 수 있어요 — OPUS 카드가 필요 없어요. 도착 당일 공항에서 시내로 가는 가장 쉬운 방법이에요.',
        en: 'You can board with a credit card — no OPUS needed. This is the simplest way to get downtown on arrival day.',
        fr: "On peut monter avec une carte de crédit — sans OPUS. C'est le moyen le plus simple pour le centre-ville à l'arrivée.",
      },
    },
    {
      name: 'Taxi / Rideshare',
      sub: { ko: '공항 → 시내 정액 요금', en: 'Flat-rate airport to downtown', fr: 'Tarif forfaitaire aéroport → centre' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '~$50–55 정액 (팁 별도)', en: '~$50–55 flat (tip extra)', fr: '~50–55$ forfait (pourboire en plus)' } },
        { icon: 'clock', label: { ko: '30–45분', en: '30–45 min', fr: '30–45 min' } },
      ],
      worksFor: [
        { ko: '짐이 많은 분', en: 'Heavy luggage', fr: 'Beaucoup de bagages' },
        { ko: '그룹 여행', en: 'Group travel', fr: 'Voyage en groupe' },
        { ko: '도착 시간이 늦은 분', en: 'Late night arrival', fr: 'Arrivée tardive' },
      ],
      worthKnowing: [
        { ko: '일부 택시는 신용카드를 안 받음 — 현금 준비 권장', en: 'Some taxis do not accept cards — have cash ready', fr: 'Certains taxis refusent la carte — prévoyez du liquide' },
        { ko: 'Uber/Lyft는 YUL에서 운행 가능', en: 'Uber/Lyft operate at YUL', fr: 'Uber/Lyft disponibles à YUL' },
      ],
    },
  ],
  compareTable: {
    headers: [
      { ko: '방법', en: 'Option', fr: 'Option' },
      { ko: '비용', en: 'Cost', fr: 'Coût' },
      { ko: '소요 시간', en: 'Time', fr: 'Durée' },
      { ko: '24시간', en: '24/7', fr: '24/7' },
      { ko: '신용카드', en: 'Credit card', fr: 'Carte de crédit' },
    ],
    rows: [
      { name: '747 Express Bus', cols: ['$11', '45–70 min', true, true] },
      { name: 'Taxi', cols: ['~$50–55', '30–45 min', true, 'Sometimes'] },
      { name: 'Uber/Lyft', cols: ['~$45–60', '30–45 min', true, true] },
    ],
  },
  communityNotes: [
    { flag: '🇰🇷', person: { ko: '학생 · 2024년 9월', en: 'Student Sept 2024', fr: 'Étudiant sept. 2024' }, text: { ko: '747 버스가 생각보다 훨씬 쉬웠어요. 카드로 탔고 지하철역에서 바로 내렸어요. OPUS는 다음 날 샀어요.', en: 'The 747 bus was way easier than I expected. Paid by card and stepped off at a metro station. Got an OPUS the next day.', fr: "Le 747 était bien plus simple que prévu. Payé par carte et descendu à un métro. OPUS le lendemain." }, likes: 33 },
    { flag: '🇰🇷', person: { ko: '워킹홀리데이 · 2024년 5월', en: 'Working Holiday May 2024', fr: 'PVT mai 2024' }, text: { ko: '짐이 많아서 Uber를 탔어요. ~$50 나왔는데 셋이서 나눴어요. 나쁘지 않았어요.', en: 'Had a lot of luggage so took Uber. About $50 — split three ways. Not bad.', fr: "Beaucoup de bagages donc Uber. ~50$ — partagé à trois. Pas mal." }, likes: 19 },
    { flag: '🇰🇷', person: { ko: '영주권자 · 2023년 11월', en: 'PR Nov 2023', fr: 'RP nov. 2023' }, text: { ko: '세관 신고서를 미리 작성해두면 훨씬 빨라요. 줄에서 작성하려면 시간이 배로 걸려요.', en: 'Fill out your customs declaration on the plane — it goes much faster. Writing it in line takes twice as long.', fr: "Remplissez la déclaration douanière dans l'avion — ça va bien plus vite. Faire la queue pour l'écrire, c'est le double de temps." }, likes: 25 },
  ],
  helpLinks: [
    { label: { ko: 'YUL 공항 도착 안내', en: 'YUL Airport arrival guide', fr: 'Guide arrivée aéroport YUL' }, url: 'https://www.admtl.com/en/flights/arriving', domain: 'admtl.com' },
    { label: { ko: 'STM 747 버스 — 노선 및 시간표', en: 'STM 747 bus — route & schedule', fr: 'STM 747 — trajet et horaires' }, url: 'https://www.stm.info/en/info/networks/bus/express-shuttle/route-747-yul-aeroport-montreal-trudeau-downtown', domain: 'stm.info' },
    { label: { ko: 'Uber — 공항 픽업 예약', en: 'Uber — book a ride from YUL', fr: "Uber — réserver depuis YUL" }, url: 'https://www.uber.com/ca/en/ride/', domain: 'uber.com' },
    { label: { ko: 'Lyft — 공항 픽업 예약', en: 'Lyft — book a ride from YUL', fr: "Lyft — réserver depuis YUL" }, url: 'https://www.lyft.com', domain: 'lyft.com' },
    { label: { ko: '캐나다 세관 신고 가이드', en: 'Canada customs declaration guide', fr: 'Guide déclaration douanière Canada' }, url: 'https://www.cbsa-asfc.gc.ca/travel-voyage/dc-ed-eng.html', domain: 'cbsa-asfc.gc.ca' },
  ],
  faq: [
    { q: { ko: '공항에서 입국 심사까지 얼마나 걸리나요?', en: 'How long does immigration take at YUL?', fr: "Combien de temps pour l'immigration à YUL?" }, a: { ko: '성수기에는 30–60분, 비수기에는 더 빨라요. 한국 여권은 자동 입국 심사대(e-gates)를 쓸 수 있어서 빨라요.', en: 'During peak season 30–60 min; faster off-peak. Korean passport holders can use e-gates which speeds things up.', fr: "Haute saison 30–60 min; plus rapide hors saison. Les passeports coréens peuvent utiliser les e-gates." } },
    { q: { ko: '세관에서 신고해야 하는 것은 무엇인가요?', en: 'What do I need to declare at customs?', fr: "Que dois-je déclarer à la douane?" }, a: { ko: 'CAD $10,000 이상 현금, 음식, 식물, 동물 제품 등이요. 모르면 신고하는 게 안 하는 것보다 나아요.', en: 'Cash over CAD $10,000, food, plants, animal products. When in doubt, declare — the penalty for non-declaration is worse.', fr: "Liquide > 10 000$ CAD, aliments, plantes, produits animaux. Dans le doute, déclarez — la pénalité est pire." } },
    { q: { ko: 'WiFi가 없으면 공항에서 어떻게 하나요?', en: 'What if I have no data or WiFi at the airport?', fr: "Et si je n'ai pas de données à l'aéroport?" }, a: { ko: 'YUL에는 무료 WiFi가 있어요. 연결해서 숙소에 연락하거나 지도를 확인하세요.', en: 'YUL has free WiFi. Connect to it to reach your accommodation or check maps.', fr: "YUL a le WiFi gratuit. Connectez-vous pour joindre votre hébergement ou consulter les cartes." } },
  ],
  sidebar: {
    quickFacts: [
      { label: { ko: '747 버스 요금', en: '747 bus fare', fr: 'Tarif bus 747' }, value: { ko: '$11 (카드 가능)', en: '$11 (card OK)', fr: '11$ (carte OK)' } },
      { label: { ko: '택시 정액', en: 'Taxi flat rate', fr: 'Taxi forfait' }, value: { ko: '~$50–55', en: '~$50–55', fr: '~50–55$' } },
      { label: { ko: '공항 WiFi', en: 'Airport WiFi', fr: 'WiFi aéroport' }, value: { ko: '무료', en: 'Free', fr: 'Gratuit' } },
      { label: { ko: '입국 심사', en: 'Immigration', fr: 'Immigration' }, value: { ko: '30–60분', en: '30–60 min', fr: '30–60 min' } },
    ],
    timeline: { ko: '비행기에서 세관 신고서 미리 작성. 747 버스로 시내 이동. 다음 날 OPUS 카드 구매.', en: 'Fill customs form on plane. Take 747 to downtown. Get OPUS card next day.', fr: "Remplissez le formulaire dans l'avion. 747 vers le centre-ville. Carte OPUS le lendemain." },
    nextStepId: 'temp_stay',
    nextStepLabel: { ko: '임시 숙소 정착', en: 'Settle into temp housing', fr: "S'installer dans le logement temporaire" },
  },
  completionCard: {
    headline: { ko: '입국 심사, 통과했습니다.', en: 'Through customs. You made it.', fr: 'Passage à la douane réussi. Vous êtes là.' },
    body: { ko: '짐 찾고, 심사 통과하고, 밖으로 나오는 순간 — 몬트리올이 시작됩니다.', en: 'Bags. Customs. Exit doors. And then — Montréal begins.', fr: 'Bagages. Douane. Porties de sortie. Et puis — Montréal commence.' },
  },
}

// ─── NEW TAB: Temporary stay ──────────────────────────────────────────────────

const TEMP_STAY_TAB: TabContent = {
  id: 'temp_stay',
  label: { ko: '임시 숙소', en: 'Temp housing', fr: 'Logement temp.' },
  hero: {
    title: { ko: '도착 후 첫 2–4주 머물 곳', en: 'Where to stay for your first 2–4 weeks', fr: 'Où loger les 2–4 premières semaines' },
    sub: {
      ko: '대부분 영구 아파트를 찾는 동안 임시 거처에 머물러요. 이 주소는 은행 계좌 개설에도 쓸 수 있어요. 아파트 찾기는 현지에서 직접 보는 게 원격으로 찾는 것보다 훨씬 효과적이에요.',
      en: 'Most people stay in temporary housing while searching for a permanent apartment. This address can also be used for opening a bank account. Apartment hunting is much more effective in person.',
      fr: "La plupart logent en hébergement temporaire en cherchant un appartement. Cette adresse sert aussi pour le compte bancaire. La recherche est bien plus efficace sur place.",
    },
    when: { ko: '도착 전 예약 권장', en: 'Book before you arrive', fr: "Réservez avant d'arriver" },
    cost: { ko: '2주에 $400–1,400', en: '$400–1,400 for 2 weeks', fr: '400–1 400$ pour 2 semaines' },
    time: { ko: '2–4주', en: '2–4 weeks', fr: '2–4 semaines' },
    canBeforeArrival: { ko: '네, 도착 전 예약 가능', en: 'Yes, book before arriving', fr: "Oui, réservez avant d'arriver" },
  },
  options: [
    {
      name: 'Airbnb',
      sub: { ko: '독립된 공간, 유연한 날짜, 은행 주소로 사용 가능', en: 'Private space, flexible dates, usable as banking address', fr: 'Espace privé, dates flexibles, adresse bancaire' },
      topPick: true,
      meta: [
        { icon: 'currency-dollar', label: { ko: '2주에 ~$800–1,400', en: '~$800–1,400 for 2 weeks', fr: '~800–1 400$ / 2 sem.' } },
        { icon: 'building', label: { ko: '은행 주소 증빙으로 인정', en: 'Address accepted at banks', fr: 'Adresse acceptée en banque' } },
      ],
      worksFor: [
        { ko: '프라이버시가 필요한 분', en: 'Those wanting private space', fr: 'Ceux qui veulent l\'intimité' },
        { ko: '은행 계좌 주소가 필요한 분', en: 'Need address for banking', fr: 'Adresse pour le compte bancaire' },
        { ko: '일정 연장이 필요할 수 있는 분', en: 'May need to extend stay', fr: 'Pourraient prolonger le séjour' },
      ],
      worthKnowing: [
        { ko: '호스텔보다 비쌈', en: 'More expensive than hostels', fr: 'Plus cher que les auberges' },
        { ko: '예약 확인 이메일이 주소 증빙으로 인정됨', en: 'Booking confirmation accepted as proof of address', fr: "Courriel de confirmation accepté comme preuve d'adresse" },
      ],
      recommendNote: {
        ko: '에어비앤비 주소는 대부분의 은행에서 계좌 개설 시 주소 증빙으로 받아줘요.',
        en: 'Your Airbnb address is accepted by most banks when opening an account — no permanent address needed yet.',
        fr: "L'adresse Airbnb est acceptée par la plupart des banques pour ouvrir un compte.",
      },
    },
    {
      name: 'Hostel',
      sub: { ko: '저렴한 옵션', en: 'Budget option', fr: 'Option économique' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '~$35–60/박', en: '~$35–60/night', fr: '~35–60$/nuit' } },
      ],
      worksFor: [
        { ko: '예산을 아끼는 분', en: 'Budget-conscious', fr: 'Petit budget' },
        { ko: '다른 이민자를 만나고 싶은 분', en: 'Meeting other newcomers', fr: "Rencontrer d'autres arrivants" },
      ],
      worthKnowing: [
        { ko: '공용 공간, 개인 금고 필수', en: 'Shared spaces — use a locker', fr: 'Espaces partagés — utilisez un casier' },
        { ko: '일부 은행에서 주소 증빙 불가', en: 'Address may not be accepted for banking', fr: "L'adresse peut ne pas être acceptée en banque" },
      ],
    },
    {
      name: 'Facebook / Kijiji 단기 서블렛',
      sub: { ko: '가구 포함 단기 임대', en: 'Short-term furnished sublet', fr: 'Sous-location meublée court terme' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '~$700–1,200/월', en: '~$700–1,200/mo', fr: '~700–1 200$/mois' } },
      ],
      worksFor: [
        { ko: '1–2개월 더 머무는 분', en: 'Staying 1–2 months', fr: 'Séjour de 1–2 mois' },
        { ko: '에어비앤비보다 저렴하게', en: 'Lower cost than Airbnb', fr: "Moins cher qu'Airbnb" },
      ],
      worthKnowing: [
        { ko: '원격으로 잡기 어려움 — 사기 주의', en: 'Hard to arrange remotely — watch for scams', fr: 'Difficile à distance — attention aux arnaques' },
      ],
    },
  ],
  compareTable: {
    headers: [
      { ko: '옵션', en: 'Option', fr: 'Option' },
      { ko: '2주 비용', en: '2-week cost', fr: 'Coût 2 sem.' },
      { ko: '주소 증빙', en: 'Address proof', fr: "Preuve d'adresse" },
      { ko: '미리 예약', en: 'Book ahead', fr: 'Réserver tôt' },
    ],
    rows: [
      { name: 'Airbnb', cols: ['~$800–1,400', true, true] },
      { name: 'Hostel', cols: ['~$400–600', false, true] },
      { name: 'Sublet', cols: ['~$600–900', true, false] },
    ],
  },
  communityNotes: [
    { flag: '🇰🇷', person: { ko: '학생 · 2024년 8월', en: 'Student Aug 2024', fr: 'Étudiant août 2024' }, text: { ko: '오기 전에 에어비앤비를 3주 예약했어요. 도착 3일째에 그 주소로 은행 계좌 열었고 문제없었어요.', en: 'Booked 3 weeks of Airbnb before coming. Used that address for my bank account on day 3. No issues at all.', fr: "Réservé 3 semaines sur Airbnb. Utilisé l'adresse pour mon compte au 3e jour. Aucun problème." }, likes: 28 },
    { flag: '🇰🇷', person: { ko: '워킹홀리데이 · 2024년 3월', en: 'Working Holiday Mar 2024', fr: 'PVT mars 2024' }, text: { ko: '호스텔에 일주일 있으면서 Facebook에서 한 달짜리 서블렛 찾았어요. 더 빨리 이웃들을 알게 됐어요.', en: 'Stayed at a hostel for one week and found a 1-month sublet on Facebook. Got to know the neighbourhood faster.', fr: "Auberge une semaine puis sous-loc 1 mois sur Facebook. J'ai vite connu le quartier." }, likes: 17 },
  ],
  helpLinks: [
    { label: { ko: 'Airbnb 몬트리올', en: 'Airbnb Montréal', fr: 'Airbnb Montréal' }, url: 'https://www.airbnb.ca/montreal', domain: 'airbnb.ca' },
    { label: { ko: 'Kijiji 몬트리올 임대', en: 'Kijiji Montréal rentals', fr: 'Kijiji locations Montréal' }, url: 'https://www.kijiji.ca', domain: 'kijiji.ca' },
  ],
  faq: [
    { q: { ko: '영구 주소 없이 은행 계좌를 열 수 있나요?', en: 'Can I open a bank account without a permanent address?', fr: "Puis-je ouvrir un compte sans adresse permanente?" }, a: { ko: '네 — 에어비앤비 예약 확인서가 대부분 은행에서 주소 증빙으로 인정돼요. 호스텔 확인서도 될 수 있어요.', en: 'Yes — an Airbnb confirmation is accepted at most banks. A hostel confirmation may also work — call ahead to confirm.', fr: "Oui — une confirmation Airbnb est acceptée dans la plupart des banques. Vérifiez par téléphone pour l'auberge." } },
    { q: { ko: '임시 숙소 기간은 얼마나 잡아야 하나요?', en: 'How long should I book temporary housing?', fr: 'Combien de temps réserver le logement temporaire?' }, a: { ko: '2–3주가 기본이에요. 아파트 찾는 데 2–4주가 더 필요할 수 있으니 연장이 가능한 숙소를 고르세요.', en: '2–3 weeks is a common baseline. Apartment hunting can take another 2–4 weeks, so choose somewhere with extension flexibility.', fr: "2–3 semaines en général. La recherche peut prendre 2–4 semaines de plus — choisissez un logement extensible." } },
  ],
  sidebar: {
    quickFacts: [
      { label: { ko: 'Airbnb 2주', en: 'Airbnb 2 weeks', fr: 'Airbnb 2 sem.' }, value: { ko: '~$800–1,400', en: '~$800–1,400', fr: '~800–1 400$' } },
      { label: { ko: '호스텔 2주', en: 'Hostel 2 weeks', fr: 'Auberge 2 sem.' }, value: { ko: '~$400–600', en: '~$400–600', fr: '~400–600$' } },
      { label: { ko: '은행 주소 증빙', en: 'Bank address proof', fr: 'Preuve adresse banque' }, value: { ko: 'Airbnb 확인서', en: 'Airbnb confirm', fr: 'Confirm. Airbnb' } },
    ],
    timeline: { ko: '도착 전 2–3주 예약. 도착 후 2–4주 내에 장기 아파트를 찾아요.', en: 'Book 2–3 weeks before arriving. Find a permanent apartment within 2–4 weeks of arrival.', fr: "Réservez 2–3 semaines avant. Trouvez un appartement dans les 2–4 semaines." },
    nextStepId: 'sim',
    nextStepLabel: { ko: 'SIM 카드 / 전화 요금제', en: 'SIM card / phone plan', fr: 'Carte SIM / forfait' },
  },
  completionCard: {
    headline: { ko: '첫날 밤, 어디서 잘지 알고 있습니다.', en: 'You know where you\'re sleeping tonight.', fr: 'Vous savez où vous dormez ce soir.' },
    body: { ko: '짐 풀고, 잠깐 쉬고, 내일부터 본격적으로 시작해요. 서두를 필요 없어요.', en: 'Unpack a little. Rest. Tomorrow, the real adventure starts. No rush.', fr: 'Déballez un peu. Reposez-vous. Demain, la vraie aventure commence. Pas de presse.' },
  },
}

// ─── NEW TAB: Long-term housing ───────────────────────────────────────────────

const LONG_HOUSING_TAB: TabContent = {
  id: 'housing',
  label: { ko: '장기 주거', en: 'Long-term housing', fr: 'Logement à long terme' },
  hero: {
    title: { ko: '몬트리올에서 아파트 구하기', en: 'Finding an apartment in Montréal', fr: 'Trouver un appartement à Montréal' },
    sub: {
      ko: '퀘벡의 임대 규칙은 다른 주와 달라요. 보증금을 요구하면 위법이에요. 대부분의 임대는 첫 달 월세만 내요. Facebook 한인 그룹 + Kijiji + DuProprio를 병행하는 것이 가장 효과적이에요.',
      en: "Québec rental rules differ from other provinces. Security deposits are illegal. Most leases require only first month's rent. Combining Korean Facebook groups + Kijiji + DuProprio is the most effective approach.",
      fr: "La location au Québec diffère des autres provinces. Le dépôt de garantie est illégal. Combiner groupes Facebook coréens + Kijiji + DuProprio est l'approche la plus efficace.",
    },
    when: { ko: '임시 숙소 도착 후 2–4주', en: '2–4 weeks after arriving in temp housing', fr: '2–4 semaines après le logement temporaire' },
    cost: { ko: '$700–1,800/월 (원베드 기준)', en: '$700–1,800/mo (1 bedroom)', fr: '700–1 800$/mois (1 chambre)' },
    time: { ko: '검색 2–4주, 계약 당일', en: '2–4 weeks searching, lease signing same day', fr: '2–4 semaines de recherche, bail signé le jour même' },
    canBeforeArrival: { ko: '원격 계약은 사기 위험 — 직접 보는 것을 강력 권장', en: 'Remote signing is risky — strongly recommend viewing in person', fr: 'Signer à distance est risqué — fortement recommandé en personne' },
  },
  options: [
    {
      name: '한인 Facebook 커뮤니티 그룹',
      sub: { ko: '한국어로 소통 가능한 몬트리올 한인 그룹들', en: 'Korean-language Montréal community groups', fr: 'Groupes communautaires coréens à Montréal' },
      topPick: true,
      meta: [
        { icon: 'currency-dollar', label: { ko: '무료 검색', en: 'Free to search', fr: 'Gratuit' } },
        { icon: 'users', label: { ko: '한국어 소통', en: 'Korean communication', fr: 'Communication en coréen' } },
        { icon: 'clock', label: { ko: '실시간 매물 공유', en: 'Real-time listing posts', fr: 'Annonces en temps réel' } },
      ],
      worksFor: [
        { ko: '한국어로 계약 조건을 확인하고 싶은 분', en: 'Want to discuss lease terms in Korean', fr: 'Veulent discuter des conditions en coréen' },
        { ko: '서블렛, 룸메이트, 단기 임대', en: 'Sublets, roommates, short-term rentals', fr: 'Sous-locations, colocs, courts séjours' },
        { ko: '먼저 정착한 한국인의 경험담을 참고하고 싶은 분', en: 'Want advice from Koreans already settled here', fr: 'Conseils de Coréens déjà installés' },
      ],
      worthKnowing: [
        { ko: '방문 전 절대 돈을 보내지 마세요 — 그룹 내에서도 사기가 있어요', en: 'Never send money before viewing — scams exist even in community groups', fr: "Ne jamais envoyer d'argent avant de visiter — arnaques possibles même en groupes" },
        { ko: '계약서는 항상 표준 퀘벡 임대 양식(Bail standard)으로 받으세요', en: 'Always use the official Québec standard lease (Bail standard)', fr: 'Toujours utiliser le bail standard du Québec' },
      ],
      recommendNote: {
        ko: '몬트리올 한인 커뮤니티 그룹들: "몬트리올 한인 커뮤니티", "캐나다 워킹홀리데이 몬트리올", "몬트리올 유학생 커뮤니티" 등을 Facebook에서 검색하세요.',
        en: 'Search Facebook for: "몬트리올 한인 커뮤니티", "캐나다 워킹홀리데이 몬트리올", "몬트리올 유학생 커뮤니티"',
        fr: 'Cherchez sur Facebook : "몬트리올 한인 커뮤니티", "캐나다 워킹홀리데이 몬트리올"',
      },
    },
    {
      name: 'Facebook Marketplace + Groupes locaux',
      sub: { ko: '현지 프랑스어 그룹 + Marketplace — 저렴한 매물이 많음', en: 'Local French groups + Marketplace — often cheaper listings', fr: 'Groupes locaux français + Marketplace — souvent moins cher' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '무료, 저렴한 매물 많음', en: 'Free, many affordable listings', fr: 'Gratuit, nombreuses offres abordables' } },
        { icon: 'users', label: { ko: '현지인 직거래', en: 'Direct from locals', fr: 'Direct des locaux' } },
      ],
      worksFor: [
        { ko: '가격이 저렴한 매물을 찾는 분', en: 'Looking for budget-friendly options', fr: 'Cherchant des logements abordables' },
        { ko: '중개인 없이 집주인과 직접 거래하고 싶은 분', en: 'Prefer dealing directly with landlords', fr: 'Préfèrent traiter directement avec le propriétaire' },
      ],
      worthKnowing: [
        { ko: '"Logement/Appartement à Montréal", "Appartements à louer Montréal" 등 그룹 검색', en: 'Search groups: "Logement/Appartement à Montréal", "Appartements à louer Montréal"', fr: 'Groupes : "Logement/Appartement à Montréal", "Appartements à louer Montréal"' },
        { ko: 'Marketplace에서도 Montréal → 부동산 카테고리로 필터링 가능', en: 'Filter by Montréal → Property Rentals in Marketplace', fr: 'Filtrer par Montréal → Location immobilière sur Marketplace' },
      ],
    },
    {
      name: 'Kijiji',
      sub: { ko: '캐나다 최대 무료 중고/임대 플랫폼', en: "Canada's largest free classifieds platform", fr: 'La plus grande plateforme de petites annonces au Canada' },
      meta: [
        { icon: 'world', label: { ko: 'kijiji.ca', en: 'kijiji.ca', fr: 'kijiji.ca' } },
        { icon: 'currency-dollar', label: { ko: '무료 검색', en: 'Free to search', fr: 'Recherche gratuite' } },
        { icon: 'map-pin', label: { ko: '지역/가격/방 수 필터', en: 'Filter by area, price, bedrooms', fr: 'Filtre quartier, prix, chambres' } },
      ],
      worksFor: [
        { ko: '다양한 가격대 — $700부터 고급까지', en: 'Wide price range — $700 to luxury', fr: 'Large gamme — 700$ jusqu\'au luxe' },
        { ko: '서블렛, 룸메이트, 정규 임대 모두 있음', en: 'Sublets, roommates, and standard leases', fr: 'Sous-locations, coloc, baux standards' },
        { ko: '지도 뷰로 동네 확인', en: 'Map view to check neighbourhoods', fr: 'Vue carte pour vérifier les quartiers' },
      ],
      worthKnowing: [
        { ko: '직접 보기 전 절대 돈을 보내지 마세요', en: 'Never send money before viewing', fr: "N'envoyez jamais d'argent avant de visiter" },
        { ko: '검색 시 "Ville de Montréal"로 필터하면 몬트리올 섬 전체 검색', en: 'Filter by "Ville de Montréal" for all of Montréal island', fr: 'Filtrez par "Ville de Montréal" pour toute l\'île' },
      ],
    },
    {
      name: 'DuProprio',
      sub: { ko: '집주인 직거래 전문 플랫폼 — 중개 수수료 없음', en: 'Owner-direct platform — no agent fees', fr: 'Plateforme sans intermédiaire — sans frais d\'agence' },
      meta: [
        { icon: 'world', label: { ko: 'duproprio.com', en: 'duproprio.com', fr: 'duproprio.com' } },
        { icon: 'currency-dollar', label: { ko: '중개 수수료 없음', en: 'No agent commission', fr: 'Pas de commission' } },
      ],
      worksFor: [
        { ko: '집주인과 직접 소통하고 싶은 분', en: 'Want direct communication with owner', fr: 'Communication directe avec propriétaire' },
        { ko: '매입보다 임대도 일부 있음', en: 'Some rental listings alongside sales', fr: 'Quelques locations parmi les ventes' },
      ],
      worthKnowing: [
        { ko: '매입 매물이 더 많지만 임대 섹션도 있음', en: 'Mostly for-sale but has a rental section', fr: 'Surtout à vendre mais section location disponible' },
        { ko: '퀘벡에서 가장 큰 집주인 직거래 플랫폼', en: "Québec's largest owner-direct platform", fr: 'La plus grande plateforme propriétaire-direct au Québec' },
      ],
    },
    {
      name: 'Centris.ca',
      sub: { ko: '퀘벡 공인 부동산 중개인 공식 플랫폼 (MLS)', en: 'Official platform for Québec licensed brokers (MLS)', fr: 'Plateforme officielle des courtiers agréés du Québec (MLS)' },
      meta: [
        { icon: 'world', label: { ko: 'centris.ca', en: 'centris.ca', fr: 'centris.ca' } },
        { icon: 'building', label: { ko: '공인 중개사 매물', en: 'Licensed broker listings', fr: 'Annonces de courtiers agréés' } },
      ],
      worksFor: [
        { ko: '정식 부동산 중개인을 통해 안전하게 거래하고 싶은 분', en: 'Want to transact safely through a licensed broker', fr: 'Veulent transiger via un courtier agréé' },
        { ko: '콘도 구매를 검토하는 분', en: 'Considering purchasing a condo', fr: 'Envisagent l\'achat d\'un condo' },
      ],
      worthKnowing: [
        { ko: '구매 시 통상 판매자가 중개 수수료를 부담', en: 'For purchases, seller typically pays broker commission', fr: 'À l\'achat, c\'est généralement le vendeur qui paie la commission' },
        { ko: '한국어 서비스 가능한 퀘벡 공인 부동산 중개인도 있음', en: 'Some Québec licensed brokers offer Korean-language service', fr: 'Certains courtiers offrent le service en coréen' },
      ],
    },
    {
      name: 'Zumper / PadMapper / Rentals.ca',
      sub: { ko: '지도 기반 임대 검색 플랫폼', en: 'Map-based rental search platforms', fr: 'Plateformes de recherche par carte' },
      meta: [
        { icon: 'world', label: { ko: 'zumper.com · padmapper.com · rentals.ca', en: 'zumper.com · padmapper.com · rentals.ca', fr: 'zumper.com · padmapper.com · rentals.ca' } },
        { icon: 'map', label: { ko: '지도로 동네 확인', en: 'Neighbourhood map view', fr: 'Vue carte par quartier' } },
      ],
      worksFor: [
        { ko: '지도에서 동네를 직접 보면서 검색하고 싶은 분', en: 'Want to search visually on a map', fr: 'Veulent rechercher visuellement sur une carte' },
        { ko: '여러 플랫폼 매물을 한 번에 비교하고 싶은 분', en: 'Want to compare listings from multiple sources', fr: 'Veulent comparer des annonces de plusieurs sources' },
      ],
      worthKnowing: [
        { ko: 'PadMapper는 Kijiji·Zumper 매물을 지도에 합쳐서 보여줌', en: 'PadMapper aggregates Kijiji + Zumper listings on one map', fr: 'PadMapper agrège les annonces Kijiji + Zumper sur une carte' },
      ],
    },
    {
      name: '한국어 가능 퀘벡 공인 부동산 중개인',
      sub: { ko: '퀘벡 공인 중개인 중 한국어 서비스 가능한 분들', en: 'Québec licensed brokers offering Korean-language service', fr: 'Courtiers agréés offrant le service en coréen' },
      meta: [
        { icon: 'certificate', label: { ko: '퀘벡 공인 (OACIQ)', en: 'Licensed by OACIQ', fr: 'Agréé par l\'OACIQ' } },
        { icon: 'users', label: { ko: '한국어 소통', en: 'Korean language service', fr: 'Service en coréen' } },
      ],
      worksFor: [
        { ko: '콘도/집 구매를 생각하는 분', en: 'Considering buying a condo or home', fr: 'Envisagent l\'achat d\'un bien' },
        { ko: '임대 계약을 도움받고 싶은 분', en: 'Want help navigating lease agreements', fr: 'Besoin d\'aide pour le bail' },
      ],
      worthKnowing: [
        { ko: 'OACIQ 공식 사이트에서 "Korean" 언어 필터로 검색 가능', en: 'Search OACIQ\'s broker directory with the "Korean" language filter', fr: 'Cherchez sur le répertoire OACIQ avec le filtre langue "coréen"' },
        { ko: 'RE/MAX, Royal LePage, Sutton 등 대형 에이전시에도 한국어 가능 에이전트 있음', en: 'RE/MAX, Royal LePage, Sutton agencies also have Korean-speaking agents', fr: 'RE/MAX, Royal LePage, Sutton ont aussi des agents coréophones' },
      ],
    },
  ],
  compareTable: {
    headers: [
      { ko: '플랫폼', en: 'Platform', fr: 'Plateforme' },
      { ko: '무료 검색', en: 'Free search', fr: 'Gratuit' },
      { ko: '서블렛/룸메', en: 'Sublet/Room', fr: 'Sous-loc/Coloc' },
      { ko: '정규 임대', en: 'Formal lease', fr: 'Bail formel' },
      { ko: '한국어 지원', en: 'Korean support', fr: 'Support coréen' },
    ],
    rows: [
      { name: '한인 Facebook 그룹', cols: [true, true, false, true] },
      { name: 'Facebook Marketplace', cols: [true, true, false, false] },
      { name: 'Kijiji', cols: [true, true, true, false] },
      { name: 'DuProprio', cols: [true, false, true, false] },
      { name: 'Centris', cols: [true, false, true, '일부'] },
      { name: 'Zumper/PadMapper', cols: [true, false, true, false] },
      { name: 'Rentals.ca', cols: [true, false, true, false] },
    ],
  },
  communityNotes: [
    { flag: '🇰🇷', person: { ko: '워킹홀리데이 · 2024년 4월', en: 'Working Holiday Apr 2024', fr: 'PVT avr. 2024' }, text: { ko: 'Facebook 한인 그룹에서 찾았어요. 한국어로 계약 내용도 확인할 수 있었고 먼저 온 분이 직접 조건 협상도 도와주셨어요.', en: 'Found mine through a Korean Facebook group. Got help negotiating terms from someone already settled here.', fr: "Trouvé via un groupe Facebook coréen. Un Coréen déjà installé m'a aidé à négocier." }, likes: 38 },
    { flag: '🇰🇷', person: { ko: '학생 · 2023년 9월', en: 'Student Sept 2023', fr: 'Étudiant sept. 2023' }, text: { ko: '퀘벡에서는 보증금을 요구하면 불법이에요. 처음엔 몰라서 낼 뻔했어요. 집주인이 요구하면 바로 거절하세요.', en: "Security deposits are illegal in Québec — I almost paid one. If a landlord asks, decline immediately.", fr: "Le dépôt est illégal au Québec — j'ai failli en payer un. Refusez immédiatement si demandé." }, likes: 31 },
    { flag: '🇰🇷', person: { ko: '영주권자 · 2024년 1월', en: 'PR Jan 2024', fr: 'RP janv. 2024' }, text: { ko: '7월 1일 전에 계약하면 선택지가 훨씬 많아요. 봄(4–6월)에 적극적으로 찾으세요.', en: 'Signing before July 1 gives way more options. Hunt actively in spring (April–June).', fr: "Avant le 1er juillet = bien plus de choix. Cherchez activement au printemps." }, likes: 27 },
    { flag: '🇰🇷', person: { ko: '유학생 · 2024년 8월', en: 'Student Aug 2024', fr: 'Étudiant août 2024' }, text: { ko: 'Kijiji에서 찾은 집주인이 직접 한국어로 소통해줬어요. 몬트리올에 한국 교민이 많아서 한국어 하는 집주인도 종종 있어요.', en: 'My Kijiji landlord actually spoke Korean. There are enough Korean expats here that it happens.', fr: "Mon proprio Kijiji parlait coréen — il y a assez d'expats coréens ici pour que ça arrive." }, likes: 19 },
    { flag: '🇰🇷', person: { ko: '워킹홀리데이 · 2025년 1월', en: 'Working Holiday Jan 2025', fr: 'PVT janv. 2025' }, text: { ko: 'DuProprio는 집주인 직거래라 중개 수수료가 없어요. Kijiji보다 덜 알려져 있는데 괜찮은 매물이 꽤 있어요.', en: "DuProprio is owner-direct so no agent fees. Less known than Kijiji but has solid listings.", fr: "DuProprio sans frais d'agence. Moins connu que Kijiji mais bonnes annonces." }, likes: 14 },
  ],
  helpLinks: [
    { label: { ko: '🏘️ Kijiji — 몬트리올 아파트 검색', en: '🏘️ Kijiji — Montréal apartments', fr: '🏘️ Kijiji — appartements Montréal' }, url: 'https://www.kijiji.ca/b-apartments-condos/ville-de-montreal/c37l80002a10', domain: 'kijiji.ca' },
    { label: { ko: '🏘️ DuProprio — 집주인 직거래 임대', en: '🏘️ DuProprio — owner-direct rentals', fr: '🏘️ DuProprio — locations sans intermédiaire' }, url: 'https://duproprio.com/en/to-rent/apartment/search?is_for_rent=1&cities[]=10', domain: 'duproprio.com' },
    { label: { ko: '🏘️ Centris — 퀘벡 공인 중개사 매물', en: '🏘️ Centris — licensed broker listings', fr: '🏘️ Centris — annonces de courtiers agréés' }, url: 'https://www.centris.ca/en/properties~for-rent~montreal', domain: 'centris.ca' },
    { label: { ko: '🏘️ Rentals.ca — 몬트리올', en: '🏘️ Rentals.ca — Montréal', fr: '🏘️ Rentals.ca — Montréal' }, url: 'https://rentals.ca/montreal', domain: 'rentals.ca' },
    { label: { ko: '🏘️ Zumper — 몬트리올 아파트', en: '🏘️ Zumper — Montréal apartments', fr: '🏘️ Zumper — appartements Montréal' }, url: 'https://www.zumper.com/apartments-for-rent/montreal-qc', domain: 'zumper.com' },
    { label: { ko: '🏘️ PadMapper — 지도로 검색', en: '🏘️ PadMapper — map-based search', fr: '🏘️ PadMapper — recherche par carte' }, url: 'https://www.padmapper.com/apartments/montreal-qc', domain: 'padmapper.com' },
    { label: { ko: '📘 FB Marketplace — 몬트리올 임대', en: '📘 FB Marketplace — Montréal rentals', fr: '📘 FB Marketplace — locations Montréal' }, url: 'https://www.facebook.com/marketplace/montreal/propertyrentals', domain: 'facebook.com' },
    { label: { ko: '📘 FB 그룹 — Logement Montréal', en: '📘 FB Group — Logement Montréal', fr: '📘 Groupe FB — Logement Montréal' }, url: 'https://www.facebook.com/groups/logementmontreal', domain: 'facebook.com/groups' },
    { label: { ko: '📘 FB 그룹 — 몬트리올 한인 커뮤니티', en: '📘 FB Group — Korean Montreal Community', fr: '📘 Groupe FB — Communauté coréenne Montréal' }, url: 'https://www.facebook.com/groups/montrealkoreancommunity', domain: 'facebook.com/groups' },
    { label: { ko: '🏛️ OACIQ — 퀘벡 공인 중개인 찾기', en: '🏛️ OACIQ — Find a licensed broker', fr: '🏛️ OACIQ — Trouver un courtier agréé' }, url: 'https://www.oaciq.com/en/pages/find-a-broker', domain: 'oaciq.com' },
    { label: { ko: '⚖️ TAL — 퀘벡 임차인 권리', en: '⚖️ TAL — Québec tenant rights', fr: '⚖️ TAL — Droits des locataires' }, url: 'https://www.tal.gouv.qc.ca/en', domain: 'tal.gouv.qc.ca' },
    { label: { ko: '📄 표준 임대 양식 다운로드 (Bail standard)', en: '📄 Download official Québec lease form', fr: '📄 Télécharger le bail standard du Québec' }, url: 'https://www.tal.gouv.qc.ca/en/forms', domain: 'tal.gouv.qc.ca' },
  ],
  faq: [
    { q: { ko: '퀘벡에서 보증금을 내야 하나요?', en: 'Do I need to pay a security deposit in Québec?', fr: 'Dois-je payer un dépôt de garantie au Québec?' }, a: { ko: '아니요 — 퀘벡 민사법(Civil Code of Québec)에 따라 집주인은 마지막 달 월세나 보증금을 요구할 수 없어요. 첫 달 월세만 내는 것이 정상이에요. 만약 요구한다면 그 집은 거르세요.', en: "No — under the Civil Code of Québec, landlords cannot demand last month's rent or a security deposit. First month only. If asked, walk away.", fr: "Non — le Code civil du Québec interdit le dépôt et le dernier mois. Seulement le premier mois. Si demandé, passez votre chemin." } },
    { q: { ko: '캐나다 신용 이력 없이 아파트를 빌릴 수 있나요?', en: 'Can I rent without a Canadian credit history?', fr: 'Puis-je louer sans historique de crédit canadien?' }, a: { ko: '어렵지만 가능해요. 추천서, 고용/재학 증명서, 은행 잔액 증명서를 준비하세요. 한인 그룹이나 DuProprio 집주인은 신용 조회 없이 거래하는 경우도 있어요.', en: 'Harder but doable. Prepare reference letters, proof of employment or enrollment, and bank statements. Korean community landlords and DuProprio owners sometimes skip credit checks.', fr: "Plus difficile mais faisable. Lettres de référence, preuve d'emploi/inscription, relevés bancaires. Les propriétaires DuProprio sautent parfois la vérification de crédit." } },
    { q: { ko: '아파트 사기를 어떻게 피하나요?', en: 'How do I avoid apartment scams?', fr: 'Comment éviter les arnaques immobilières?' }, a: { ko: '방문 전 돈을 절대 보내지 마세요. 주의 신호: 집주인이 해외에 있다, 가격이 너무 싸다, 계약서 없이 돈부터 요구한다, 영상통화를 거부한다, Bail standard 양식 사용 거부. 직접 방문해서 본인 확인 후 계약하세요.', en: "Never send money before viewing. Red flags: landlord overseas, price suspiciously low, cash before lease, refuses video call, won't use Bail standard form. Always view in person.", fr: "N'envoyez jamais d'argent avant de visiter. Signaux d'alarme : proprio à l'étranger, prix trop bas, argent sans bail, refuse l'appel vidéo ou le bail standard." } },
    { q: { ko: '퀘벡 표준 임대 양식(Bail standard)이 뭔가요?', en: 'What is the Québec standard lease (Bail standard)?', fr: "Qu'est-ce que le bail standard du Québec?" }, a: { ko: '퀘벡 주정부가 정한 공식 임대 양식이에요. 집주인은 법적으로 이 양식을 사용해야 해요. TAL 사이트에서 무료로 다운로드 가능해요. 임의 계약서를 사용하자고 하면 주의하세요.', en: "The official Québec government lease form that landlords are legally required to use. Download free from TAL's website. Be wary of landlords who insist on using their own custom contract.", fr: "Le formulaire officiel de bail imposé par la loi au Québec. Téléchargeable gratuitement sur le site du TAL. Méfiez-vous des propriétaires qui refusent ce formulaire." } },
    { q: { ko: '이사하기 가장 좋은 시기는 언제인가요?', en: 'When is the best time to find an apartment in Montréal?', fr: 'Quel est le meilleur moment pour chercher un appartement?' }, a: { ko: '4–6월이 매물이 가장 많아요. 대부분의 임대가 7월 1일("이사의 날")에 시작하기 때문이에요. 12월–1월은 매물이 가장 적고 경쟁도 낮아요.', en: "April–June has the most listings — most leases start on July 1 (\"moving day\"). December–January has the fewest listings but also less competition.", fr: "Avril–juin offre le plus d'annonces — la plupart des baux commencent le 1er juillet. Décembre–janvier = peu d'offres mais moins de compétition." } },
    { q: { ko: '한국어 가능한 부동산 중개인을 어떻게 찾나요?', en: 'How do I find a Korean-speaking real estate broker?', fr: 'Comment trouver un courtier immobilier coréanophone?' }, a: { ko: 'OACIQ 공식 사이트(oaciq.com)에서 "Korean" 언어 필터로 검색하거나, RE/MAX·Royal LePage·Sutton 에이전시에 한국어 서비스 가능 여부를 문의하세요. 한인 커뮤니티 그룹에서 추천받는 것도 좋아요.', en: 'Search OACIQ\'s directory at oaciq.com with the "Korean" language filter, or ask RE/MAX/Royal LePage/Sutton agencies. Getting a referral from the Korean community group also works well.', fr: "Cherchez sur le répertoire de l'OACIQ (oaciq.com) avec le filtre « coréen », ou contactez RE/MAX/Royal LePage/Sutton. Un référencement du groupe communautaire coréen est aussi efficace." } },
  ],
  sidebar: {
    quickFacts: [
      { label: { ko: '1인실 월세', en: '1-bedroom avg', fr: 'Loyer 1 chambre' }, value: { ko: '$900–1,500/월', en: '$900–1,500/mo', fr: '900–1 500$/mois' } },
      { label: { ko: '보증금', en: 'Security deposit', fr: 'Dépôt de garantie' }, value: { ko: '불법 (퀘벡법)', en: 'Illegal (Québec)', fr: 'Illégal (Québec)' } },
      { label: { ko: '이사의 날', en: 'Moving day', fr: 'Jour déménagement' }, value: { ko: '7월 1일', en: 'July 1', fr: '1er juillet' } },
      { label: { ko: '임대 기간', en: 'Lease term', fr: 'Durée du bail' }, value: { ko: '보통 1년', en: 'Usually 1 year', fr: 'Généralement 1 an' } },
      { label: { ko: '매물 피크 시즌', en: 'Peak listing season', fr: 'Pic des annonces' }, value: { ko: '4–6월', en: 'April–June', fr: 'Avril–juin' } },
    ],
    timeline: { ko: '임시 숙소 도착 후 2–4주 안에 장기 아파트를 구하는 것이 일반적이에요. Facebook 한인 그룹 + Kijiji + DuProprio를 동시에 보는 것이 가장 빠르게 찾는 방법이에요.', en: 'Most people find a long-term apartment within 2–4 weeks of arriving in temp housing. Checking Korean Facebook groups + Kijiji + DuProprio simultaneously is the fastest approach.', fr: "La plupart trouvent en 2–4 semaines. Combiner groupes Facebook coréens + Kijiji + DuProprio est l'approche la plus rapide." },
    nextStepId: 'insurance',
    nextStepLabel: { ko: '세입자 보험 가입하기', en: 'Get tenant insurance', fr: "Souscrire une assurance locataire" },
  },
  completionCard: {
    headline: { ko: '나만의 공간, 찾았습니다.', en: 'You found your place.', fr: 'Vous avez trouvé votre logement.' },
    body: { ko: '계약서에 서명하는 순간, 몬트리올에 주소가 생깁니다. 진짜 시작이에요.', en: 'The moment you sign the lease, Montréal has your address. This is the real beginning.', fr: 'Quand vous signez le bail, Montréal a votre adresse. C\'est le vrai début.' },
  },
}

// ─── NEW TAB: Tenant insurance ────────────────────────────────────────────────

const INSURANCE_TAB: TabContent = {
  id: 'insurance',
  label: { ko: '세입자 보험', en: 'Tenant insurance', fr: 'Assurance locataire' },
  hero: {
    title: { ko: '세입자 보험: 집을 구하면 바로 가입해요', en: 'Tenant insurance: get it when you sign your lease', fr: "Assurance locataire : souscrivez dès la signature du bail" },
    sub: {
      ko: '퀘벡에서 세입자 보험은 법적 의무는 아니에요. 하지만 많은 집주인이 입주 전 보험 증명서를 요구해요. 화재, 수해 피해, 민사 배상, 도난 시 세간 보호를 해줘요.',
      en: "Tenant insurance is not legally required in Québec, but many landlords require proof before handing over keys. It covers personal belongings, civil liability, and temporary living expenses after fire or water damage.",
      fr: "L'assurance locataire n'est pas obligatoire au Québec, mais beaucoup de propriétaires exigent une preuve avant les clés. Elle couvre vos biens, la responsabilité civile et les frais temporaires après sinistre.",
    },
    when: { ko: '계약 서명 직후 또는 입주 전', en: 'Right after signing your lease or before move-in', fr: 'Juste après la signature du bail ou avant l\'emménagement' },
    cost: { ko: '$15–30/월 (커버리지에 따라)', en: '$15–30/mo depending on coverage', fr: '15–30$/mois selon la couverture' },
    time: { ko: '온라인 15–30분', en: '15–30 min online', fr: '15–30 min en ligne' },
    canBeforeArrival: { ko: '입주 주소가 있으면 가능', en: 'Yes, once you have your apartment address', fr: 'Oui, une fois l\'adresse de l\'appartement connue' },
  },
  options: [
    {
      name: 'Sonnet / Square One',
      sub: { ko: '100% 온라인, 빠른 가입', en: '100% online, fast to set up', fr: '100% en ligne, rapide' },
      topPick: true,
      meta: [
        { icon: 'currency-dollar', label: { ko: '~$15–25/월', en: '~$15–25/mo', fr: '~15–25$/mois' } },
        { icon: 'clock', label: { ko: '15분 이내 보험 증명서', en: 'Proof of insurance in 15 min', fr: "Preuve d'assurance en 15 min" } },
        { icon: 'world', label: { ko: '영어 온라인 서비스', en: 'English online service', fr: 'Service en ligne anglais' } },
      ],
      worksFor: [
        { ko: '집주인이 빨리 증명서를 요구할 때', en: 'Landlord needs proof quickly', fr: 'Le propriétaire veut la preuve vite' },
        { ko: '온라인 처리를 선호하는 분', en: 'Prefer to handle everything online', fr: 'Préfèrent tout faire en ligne' },
      ],
      worthKnowing: [
        { ko: '커버리지를 꼼꼼히 읽어보세요 — 저렴한 플랜은 수해 피해나 자전거 도난이 제외될 수 있어요', en: 'Read coverage carefully — cheap plans may exclude water damage or bicycle theft', fr: 'Lisez bien la couverture — les plans bon marché peuvent exclure dégâts d\'eau ou vol de vélo' },
      ],
      recommendNote: {
        ko: '집주인이 입주 전날 증명서를 요구하면 Sonnet이나 Square One으로 당일 처리가 가능해요.',
        en: "If a landlord asks for proof the day before move-in, Sonnet or Square One can issue it same day.",
        fr: "Si le propriétaire demande la preuve la veille, Sonnet ou Square One peuvent l'émettre le jour même.",
      },
    },
    {
      name: 'Desjardins / Intact',
      sub: { ko: '대형 보험사, 프랑스어 서비스 강함', en: 'Major insurers, strong French service', fr: 'Grands assureurs, excellent service français' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '~$20–35/월', en: '~$20–35/mo', fr: '~20–35$/mois' } },
        { icon: 'phone', label: { ko: '전화 또는 지점 방문', en: 'Phone or in-person', fr: 'Téléphone ou en personne' } },
      ],
      worksFor: [
        { ko: '은행과 보험을 합산하고 싶은 분 (번들 할인)', en: 'Want to bundle with banking (bundle discount)', fr: 'Voulant combiner avec la banque (rabais)' },
        { ko: '프랑스어로 설명받고 싶은 분', en: 'Want explanation in French', fr: 'Veulent des explications en français' },
      ],
      worthKnowing: [
        { ko: 'Desjardins는 은행 계좌 있으면 할인 가능', en: 'Desjardins may offer discount if you have their bank account', fr: 'Desjardins peut offrir un rabais si vous avez leur compte' },
      ],
    },
    {
      name: 'TD / RBC / BMO Insurance',
      sub: { ko: '기존 은행에서 보험 추가', en: 'Add insurance through your existing bank', fr: 'Assurance via votre banque existante' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '~$20–40/월', en: '~$20–40/mo', fr: '~20–40$/mois' } },
      ],
      worksFor: [
        { ko: '이미 TD/RBC/BMO 계좌가 있는 분', en: 'Already banking with TD/RBC/BMO', fr: 'Déjà avec TD/RBC/BMO' },
        { ko: '합산 청구를 선호하는 분', en: 'Prefer consolidated billing', fr: 'Préfèrent la facturation groupée' },
      ],
      worthKnowing: [
        { ko: '같은 은행 계좌 번들로 할인되는 경우 있음', en: 'May receive a bundle discount with your bank account', fr: 'Peut bénéficier d\'un rabais combiné avec le compte' },
      ],
    },
  ],
  compareTable: {
    headers: [
      { ko: '보험사', en: 'Provider', fr: 'Assureur' },
      { ko: '월 비용', en: 'Monthly cost', fr: 'Coût mensuel' },
      { ko: '온라인 가입', en: 'Online signup', fr: 'Inscription en ligne' },
      { ko: '수해 포함', en: 'Water damage', fr: 'Dégâts d\'eau' },
      { ko: '배상 책임', en: 'Liability', fr: 'Responsabilité' },
    ],
    rows: [
      { name: 'Sonnet', cols: ['~$15–25/mo', true, 'Optional', true] },
      { name: 'Square One', cols: ['~$15–25/mo', true, 'Optional', true] },
      { name: 'Desjardins', cols: ['~$20–35/mo', 'Partial', true, true] },
      { name: 'Intact', cols: ['~$20–35/mo', 'Partial', true, true] },
      { name: 'TD/RBC/BMO', cols: ['~$20–40/mo', 'Partial', true, true] },
    ],
  },
  communityNotes: [
    { flag: '🇰🇷', person: { ko: '학생 · 2024년 9월', en: 'Student Sept 2024', fr: 'Étudiant sept. 2024' }, text: { ko: '집주인이 계약서에 서명하기 전에 보험 증명서를 요구했어요. Sonnet으로 20분 만에 처리했어요.', en: 'My landlord required proof of insurance before signing the lease. Sorted it through Sonnet in 20 minutes.', fr: "Mon propriétaire exigeait la preuve avant la signature. Réglé avec Sonnet en 20 minutes." }, likes: 24 },
    { flag: '🇰🇷', person: { ko: '워킹홀리데이 · 2024년 6월', en: 'Working Holiday June 2024', fr: 'PVT juin 2024' }, text: { ko: '가장 저렴한 플랜을 골랐다가 수해 피해가 포함 안 됐다는 걸 나중에 알았어요. 잘 확인해보세요.', en: "I chose the cheapest plan and later found out water damage wasn't covered. Read carefully.", fr: "J'ai pris le plan le moins cher et appris plus tard que les dégâts d'eau n'étaient pas couverts. Lisez bien." }, likes: 19 },
    { flag: '🇰🇷', person: { ko: '영주권자 · 2024년 3월', en: 'PR Mar 2024', fr: 'RP mars 2024' }, text: { ko: 'TD 계좌랑 번들로 할인받았어요. 한 곳에서 관리하는 게 편해요.', en: "Got a bundle discount with my TD account. Managing it all in one place is convenient.", fr: "Rabais groupé avec mon compte TD. Tout gérer au même endroit, c'est pratique." }, likes: 12 },
  ],
  helpLinks: [
    { label: { ko: 'Sonnet 보험', en: 'Sonnet Insurance', fr: 'Assurance Sonnet' }, url: 'https://www.sonnet.ca', domain: 'sonnet.ca' },
    { label: { ko: 'Square One 보험', en: 'Square One Insurance', fr: 'Assurance Square One' }, url: 'https://www.squareoneinsurance.ca', domain: 'squareoneinsurance.ca' },
    { label: { ko: 'Desjardins 보험', en: 'Desjardins Insurance', fr: 'Assurance Desjardins' }, url: 'https://www.desjardins.com', domain: 'desjardins.com' },
    { label: { ko: 'Beneva 보험', en: 'Beneva Insurance', fr: 'Assurance Beneva' }, url: 'https://www.beneva.ca', domain: 'beneva.ca' },
  ],
  faq: [
    { q: { ko: '세입자 보험은 퀘벡에서 법적 의무인가요?', en: 'Is tenant insurance legally required in Québec?', fr: "L'assurance locataire est-elle obligatoire au Québec?" }, a: { ko: '법적으로는 의무가 아니에요. 하지만 많은 집주인이 임대 계약 조건으로 요구해요. 집주인의 건물 보험은 세입자 물건에는 적용 안 돼요.', en: "Not legally mandatory. But many landlords require it as a condition of the lease. The landlord's building insurance does not cover your belongings.", fr: "Pas légalement obligatoire. Mais beaucoup de propriétaires l'exigent dans le bail. L'assurance du propriétaire ne couvre pas vos biens." } },
    { q: { ko: '보험에 가입하려면 어떤 정보가 필요한가요?', en: 'What information do I need to get insured?', fr: "Quelles informations pour s'assurer?" }, a: { ko: '주소, 입주 날짜, 아파트 유형, 세간 가치 추정액, 배상 책임 한도, 이전 청구 이력이 필요해요.', en: 'Address, move-in date, apartment type, estimated value of belongings, liability coverage amount, and any prior claims.', fr: "Adresse, date d'emménagement, type d'appartement, valeur estimée des biens, montant de responsabilité, sinistres antérieurs." } },
    { q: { ko: '자전거 도난도 보험으로 보장되나요?', en: 'Does tenant insurance cover bicycle theft?', fr: "L'assurance couvre-t-elle le vol de vélo?" }, a: { ko: '플랜에 따라 달라요. 가입 전 자전거 도난 포함 여부와 실내/실외 보관 조건을 꼭 확인하세요.', en: 'Depends on the plan. Always confirm bicycle theft coverage and whether the bike needs to be stored indoors.', fr: "Ça dépend du plan. Vérifiez toujours si le vol de vélo est couvert et les conditions de stockage." } },
    { q: { ko: '한국어로 보험 설명을 받을 수 있나요?', en: 'Can I get help with insurance in Korean?', fr: "Puis-je obtenir de l'aide en coréen pour l'assurance?" }, a: { ko: '일부 보험 브로커는 한국어 서비스를 제공해요. HAKKYO 커뮤니티에서 한국어 가능 브로커를 추천받을 수 있어요. (한국어 지원 브로커 정보: 추후 업데이트 예정)', en: 'Some insurance brokers offer Korean-language service. The HAKKYO community may be able to refer you to a Korean-speaking broker. (Korean support broker info: to be added)', fr: "Certains courtiers offrent le service en coréen. La communauté HAKKYO peut vous référer un courtier coréanophone. (Info à ajouter)" } },
  ],
  sidebar: {
    quickFacts: [
      { label: { ko: '월 비용', en: 'Monthly cost', fr: 'Coût mensuel' }, value: { ko: '$15–30', en: '$15–30', fr: '15–30$' } },
      { label: { ko: '법적 의무', en: 'Legally required', fr: 'Légalement obligatoire' }, value: { ko: '아니요 (집주인 요구 가능)', en: 'No (landlord may require)', fr: 'Non (propriétaire peut exiger)' } },
      { label: { ko: '주요 보험사', en: 'Top providers', fr: 'Principaux assureurs' }, value: { ko: 'Sonnet, Desjardins, Intact', en: 'Sonnet, Desjardins, Intact', fr: 'Sonnet, Desjardins, Intact' } },
      { label: { ko: '가입 시간', en: 'Time to sign up', fr: 'Temps pour souscrire' }, value: { ko: '15–30분', en: '15–30 min', fr: '15–30 min' } },
    ],
    timeline: { ko: '계약 서명 직후 또는 입주 직전에 가입하세요. 온라인 가입 시 당일 증명서 발급 가능해요.', en: "Get insured right after signing your lease or before move-in. Online providers issue proof the same day.", fr: "Souscrivez juste après la signature ou avant l'emménagement. Les assureurs en ligne émettent la preuve le jour même." },
    nextStepId: 'hydro',
    nextStepLabel: { ko: 'Hydro-Québec & 인터넷 설치', en: 'Hydro-Québec & internet setup', fr: 'Hydro-Québec & internet' },
  },
  completionCard: {
    headline: { ko: '아프거나 다쳐도 걱정하지 않아도 됩니다.', en: 'If something happens, you\'re covered.', fr: "Si quelque chose arrive, vous êtes couvert·e." },
    body: { ko: '세입자 보험, 가입했으면 됐어요. 월 $15–25로 마음이 편해집니다.', en: 'Tenant insurance done. $15–25/month for peace of mind. Worth it.', fr: 'Assurance locataire faite. 15–25$/mois pour dormir tranquille. Ça vaut le coup.' },
  },
}

// ─── NEW TAB: Hydro-Québec & Internet ────────────────────────────────────────

const HYDRO_TAB: TabContent = {
  id: 'hydro',
  label: { ko: 'Hydro & 인터넷', en: 'Hydro & internet', fr: 'Hydro & internet' },
  hero: {
    title: { ko: 'Hydro-Québec & 인터넷 설치하기', en: 'Setting up Hydro-Québec & internet', fr: 'Ouvrir Hydro-Québec & internet' },
    sub: {
      ko: 'Hydro-Québec는 퀘벡의 전기 공급사예요. 아파트를 계약했다면 입주 전에 본인 명의로 계정을 개설해야 해요. 일부 임대 계약에는 Hydro가 포함돼 있으니 먼저 확인하세요.',
      en: "Hydro-Québec is the provincial electricity provider. If you rent an apartment that isn't all-inclusive, you'll need to open an account in your name before or on move-in day. Check your lease first.",
      fr: "Hydro-Québec est le fournisseur d'électricité provincial. Si votre loyer n'est pas tout inclus, ouvrez un compte à votre nom avant ou le jour de l'emménagement. Vérifiez d'abord votre bail.",
    },
    when: { ko: '입주 날짜에 맞춰', en: 'Around your move-in date', fr: "Autour de la date d'emménagement" },
    cost: { ko: 'Hydro: $30–80/월 (사용량에 따라) | 인터넷: $40–80/월', en: 'Hydro: $30–80/mo (usage-based) | Internet: $40–80/mo', fr: 'Hydro : 30–80$/mois (selon usage) | Internet : 40–80$/mois' },
    time: { ko: 'Hydro 계정 개설: 15분 (온라인)', en: 'Hydro account: 15 min online', fr: 'Compte Hydro : 15 min en ligne' },
    canBeforeArrival: { ko: '입주 주소가 있으면 가능', en: 'Yes, once you have your apartment address', fr: "Oui, avec l'adresse de l'appartement" },
  },
  options: [
    {
      name: 'Hydro-Québec account',
      sub: { ko: '온라인 또는 전화로 개설', en: 'Open online or by phone', fr: 'Ouvrir en ligne ou par téléphone' },
      topPick: true,
      meta: [
        { icon: 'world', label: { ko: 'hydroquebec.com', en: 'hydroquebec.com', fr: 'hydroquebec.com' } },
        { icon: 'clock', label: { ko: '15분 온라인', en: '15 min online', fr: '15 min en ligne' } },
        { icon: 'id', label: { ko: '이름, 주소, 입주 날짜 필요', en: 'Name, address, move-in date needed', fr: "Nom, adresse, date d'emménagement" } },
      ],
      worksFor: [
        { ko: '임대 계약에 Hydro가 포함되지 않은 분', en: 'Lease does not include Hydro', fr: 'Bail sans Hydro inclus' },
      ],
      worthKnowing: [
        { ko: '임대 계약에 Hydro가 포함되면 개설 불필요 — 계약서를 먼저 확인하세요', en: 'If your lease includes Hydro, you do not need to open an account — check first', fr: 'Si le bail inclut Hydro, pas besoin d\'ouvrir un compte — vérifiez d\'abord' },
        { ko: '퀘벡의 겨울 난방은 전기를 많이 써요 — 12–2월에 청구서가 높아요', en: 'Québec winters use a lot of electricity for heating — bills spike Dec–Feb', fr: 'Les hivers québécois consomment beaucoup en chauffage — factures élevées déc.–févr.' },
      ],
      recommendNote: {
        ko: '계약서에 "Hydro-Québec 포함" 문구가 없으면 본인 명의로 개설해야 해요. 입주 당일에 개설하면 돼요.',
        en: 'If your lease does not say "Hydro included," you need an account in your name. You can open it on move-in day.',
        fr: 'Si le bail ne dit pas « Hydro inclus », ouvrez un compte. Vous pouvez le faire le jour de l\'emménagement.',
      },
    },
    {
      name: 'Videotron (Internet)',
      sub: { ko: '퀘벡 지역 통신사, 강한 프랑스어 서비스', en: 'Québec-based provider, strong French service', fr: 'Fournisseur québécois, service français fort' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '$55–80/월', en: '$55–80/mo', fr: '55–80$/mois' } },
        { icon: 'wifi', label: { ko: '광케이블, 안정적', en: 'Cable fibre, reliable', fr: 'Câble fibre, fiable' } },
      ],
      worksFor: [
        { ko: '안정적인 고속 인터넷', en: 'Stable high-speed internet', fr: 'Internet rapide et stable' },
        { ko: '몬트리올 시내 대부분 지역 서비스', en: 'Available in most Montréal areas', fr: 'Disponible dans la plupart des quartiers' },
      ],
      worthKnowing: [
        { ko: '장기 계약 시 초기 프로모션 가격 있음', en: 'Promotional pricing available with contracts', fr: 'Prix promo avec contrat disponible' },
      ],
    },
    {
      name: 'Fizz / TekSavvy (Internet)',
      sub: { ko: '저렴한 인터넷 옵션', en: 'Budget internet options', fr: "Options internet économiques" },
      meta: [
        { icon: 'currency-dollar', label: { ko: '$40–60/월', en: '$40–60/mo', fr: '40–60$/mois' } },
        { icon: 'wifi', label: { ko: '같은 망, 더 저렴', en: 'Same network, lower price', fr: 'Même réseau, prix plus bas' } },
      ],
      worksFor: [
        { ko: '예산을 아끼고 싶은 분', en: 'Budget-conscious', fr: 'Petit budget' },
        { ko: '계약 없이 더 저렴하게', en: 'Lower price without long-term contract', fr: 'Moins cher sans engagement' },
      ],
      worthKnowing: [
        { ko: 'Fizz는 Videotron 망 사용, 신뢰도 비슷', en: 'Fizz uses Videotron network, similar reliability', fr: 'Fizz utilise le réseau Videotron, fiabilité similaire' },
      ],
    },
  ],
  compareTable: {
    headers: [
      { ko: '서비스', en: 'Service', fr: 'Service' },
      { ko: '월 비용', en: 'Monthly cost', fr: 'Coût mensuel' },
      { ko: '계약 필요', en: 'Contract', fr: 'Contrat' },
      { ko: '서비스 언어', en: 'Language', fr: 'Langue' },
    ],
    rows: [
      { name: 'Hydro-Québec', cols: ['$30–80 (usage)', 'No', 'FR/EN'] },
      { name: 'Videotron (internet)', cols: ['$55–80/mo', 'Optional', 'FR/EN'] },
      { name: 'Bell (internet)', cols: ['$60–90/mo', 'Optional', 'FR/EN'] },
      { name: 'Fizz (internet)', cols: ['$40–60/mo', 'No', 'FR/EN'] },
      { name: 'TekSavvy (internet)', cols: ['$40–60/mo', 'No', 'FR/EN'] },
    ],
  },
  communityNotes: [
    { flag: '🇰🇷', person: { ko: '워킹홀리데이 · 2024년 8월', en: 'Working Holiday Aug 2024', fr: 'PVT août 2024' }, text: { ko: '이사 당일 Hydro 계정을 온라인으로 열었어요. 15분이면 됐어요. Fizz 인터넷은 기사 와서 설치하는 데 3일 걸렸어요.', en: 'Opened my Hydro account online on move-in day. Took 15 minutes. Fizz internet took 3 days for a technician visit.', fr: "Compte Hydro en ligne le jour de l'emménagement. 15 minutes. Internet Fizz : 3 jours pour le technicien." }, likes: 21 },
    { flag: '🇰🇷', person: { ko: '학생 · 2024년 1월', en: 'Student Jan 2024', fr: 'Étudiant janv. 2024' }, text: { ko: '1월에 Hydro 청구서가 $90 나왔어요. 퀘벡 겨울 난방이 비싸요. 에너지 절약에 신경 쓰세요.', en: 'My January Hydro bill was $90. Quebec winters are heating-heavy. Worth being mindful of energy use.', fr: "Ma facture Hydro de janvier était 90$. Les hivers québécois chauffent beaucoup. Faites attention à l'énergie." }, likes: 18 },
  ],
  helpLinks: [
    { label: { ko: 'Hydro-Québec 계정 개설', en: 'Open Hydro-Québec account', fr: 'Ouvrir compte Hydro-Québec' }, url: 'https://www.hydroquebec.com/residential/customer-space/new-customer.html', domain: 'hydroquebec.com' },
    { label: { ko: 'Videotron 인터넷', en: 'Videotron internet', fr: 'Internet Videotron' }, url: 'https://www.videotron.com', domain: 'videotron.com' },
    { label: { ko: 'Fizz 인터넷', en: 'Fizz internet', fr: 'Internet Fizz' }, url: 'https://fizz.ca', domain: 'fizz.ca' },
    { label: { ko: 'TekSavvy 인터넷', en: 'TekSavvy internet', fr: 'Internet TekSavvy' }, url: 'https://www.teksavvy.com', domain: 'teksavvy.com' },
  ],
  faq: [
    { q: { ko: '임대 계약에 Hydro가 포함됐는지 어떻게 알 수 있나요?', en: 'How do I know if my lease includes Hydro?', fr: 'Comment savoir si mon bail inclut Hydro?' }, a: { ko: '임대 계약서에 "Hydro inclus" 또는 "all-inclusive" 문구를 찾아보세요. 없으면 집주인에게 직접 확인하세요.', en: 'Look for "Hydro inclus" or "all-inclusive" in your lease. If not mentioned, ask your landlord directly.', fr: 'Cherchez « Hydro inclus » ou « tout inclus » dans le bail. Sinon, demandez directement au propriétaire.' } },
    { q: { ko: '인터넷 설치까지 얼마나 걸리나요?', en: 'How long does internet setup take?', fr: "Combien de temps pour l'installation internet?" }, a: { ko: '기사 방문이 필요한 경우 2–5일 걸려요. 이사 날짜에 맞춰 미리 신청하세요. Fizz나 TekSavvy는 기존 케이블 배선이 있으면 더 빠를 수 있어요.', en: 'If a technician is needed, allow 2–5 days. Book before your move-in date. Fizz and TekSavvy can be faster if existing wiring is in place.', fr: "Si un technicien est nécessaire, prévoyez 2–5 jours. Commandez avant votre emménagement. Fizz et TekSavvy peuvent être plus rapides." } },
    { q: { ko: 'Hydro 계정 개설에 어떤 정보가 필요한가요?', en: 'What do I need to open a Hydro-Québec account?', fr: 'Que faut-il pour ouvrir un compte Hydro-Québec?' }, a: { ko: '이름, 새 주소, 입주 날짜, 연락처(전화번호, 이메일)가 필요해요. hydroquebec.com에서 온라인으로 개설할 수 있어요.', en: 'Your name, new address, move-in date, and contact info (phone, email). Open it online at hydroquebec.com.', fr: "Votre nom, nouvelle adresse, date d'emménagement, coordonnées. Ouvrez le compte en ligne sur hydroquebec.com." } },
  ],
  sidebar: {
    quickFacts: [
      { label: { ko: 'Hydro 월 평균', en: 'Hydro avg/mo', fr: 'Hydro moy/mois' }, value: { ko: '$40–80', en: '$40–80', fr: '40–80$' } },
      { label: { ko: '인터넷', en: 'Internet', fr: 'Internet' }, value: { ko: '$40–80/월', en: '$40–80/mo', fr: '40–80$/mois' } },
      { label: { ko: 'Hydro 개설', en: 'Hydro setup', fr: 'Hydro ouverture' }, value: { ko: '온라인 15분', en: '15 min online', fr: '15 min en ligne' } },
      { label: { ko: '인터넷 설치', en: 'Internet install', fr: 'Installation internet' }, value: { ko: '2–5일', en: '2–5 days', fr: '2–5 jours' } },
    ],
    timeline: { ko: '이사 당일 Hydro 계정을 개설하고, 입주 날짜에 맞춰 인터넷 설치를 미리 예약하세요.', en: "Open your Hydro account on move-in day and pre-book internet installation to match your move-in date.", fr: "Ouvrez le compte Hydro le jour de l'emménagement et pré-réservez l'internet pour cette date." },
    nextStepId: 'licence',
    nextStepLabel: { ko: '퀘벡 운전면허 교환', en: 'Québec driver licence exchange', fr: 'Échange permis de conduire Québec' },
  },
  completionCard: {
    headline: { ko: '몬트리올의 긴 겨울, 따뜻하게 날 수 있습니다.', en: 'You\'re ready for the long Montréal winter.', fr: 'Vous êtes prêt·e pour le long hiver montréalais.' },
    body: { ko: 'Hydro 계좌 열고, 인터넷 연결하고 — 집이 진짜 집이 됐어요.', en: 'Hydro account open, internet connected — your apartment is now actually a home.', fr: 'Compte Hydro ouvert, internet branché — votre appartement est maintenant vraiment chez vous.' },
  },
}

// ─── Settling-in steps (merged from former /settling page) ───────────────────

// ─── Step 1: Budget ───────────────────────────────────────────────────────────

const BUDGET_STEP: JourneyStep = {
  id: 'budget',
  label: { ko: '예산', en: 'Budget', fr: 'Budget' },
  hero: {
    title: {
      ko: '몬트리올 주거 예산 잡기',
      en: 'Setting a Montréal housing budget',
      fr: 'Établir un budget logement à Montréal',
    },
    sub: {
      ko: '몬트리올 임대료는 캐나다 주요 도시 중 가장 낮은 편이에요. 하지만 동네, 방 크기, 임대 유형에 따라 격차가 크기 때문에 먼저 현실적인 예산을 잡는 게 첫걸음이에요.',
      en: "Montréal has some of the lowest rents of any major Canadian city — but the range is wide depending on neighbourhood, size, and type. Setting a realistic budget is your first move.",
      fr: "Montréal a l'un des loyers les plus bas parmi les grandes villes canadiennes — mais l'écart est grand selon le quartier, la taille et le type. Établir un budget réaliste est votre premier pas.",
    },
    when: { ko: '집 찾기 전 가장 먼저', en: 'Before you start looking', fr: 'Avant de commencer à chercher' },
    cost: { ko: '비용 없음 (계획만)', en: 'No cost (planning only)', fr: 'Aucun coût (planification seulement)' },
    time: { ko: '30분–1시간', en: '30 min–1 hour', fr: '30 min–1 heure' },
    canBeforeArrival: { ko: '네, 한국에서 가능', en: 'Yes, from home country', fr: 'Oui, depuis votre pays' },
  },
  options: [
    {
      name: '콜로카시옹 (Colocation)',
      sub: {
        ko: '방 하나를 빌려 다른 사람과 거실·주방 공유',
        en: 'Rent one bedroom, share common areas with housemates',
        fr: 'Louer une chambre, partager espaces communs avec colocataires',
      },
      topPick: true,
      meta: [
        { icon: 'currency-dollar', label: { ko: '$600–950/월', en: '$600–950/mo', fr: '600–950$/mois' } },
        { icon: 'users', label: { ko: '2–4명과 공유', en: 'Share with 2–4 people', fr: 'Partager avec 2–4 personnes' } },
        { icon: 'bolt', label: { ko: '수도·전기 보통 포함', en: 'Utilities often included', fr: 'Services souvent inclus' } },
      ],
      worksFor: [
        { ko: '예산이 빡빡한 분', en: 'Tight budget', fr: 'Budget serré' },
        { ko: '도착 직후 빠른 정착을 원하는 분', en: 'Fast move-in needed', fr: 'Emménagement rapide souhaité' },
        { ko: '현지인과 친해지고 싶은 분', en: 'Wanting to meet locals', fr: 'Souhaitant rencontrer des locaux' },
      ],
      worthKnowing: [
        { ko: '방마다 소음·생활 방식이 크게 달라요', en: 'Noise and lifestyle vary a lot by unit', fr: "Bruit et style de vie varient beaucoup d'une unité à l'autre" },
        { ko: 'Facebook / Kijiji에 매물 많음', en: 'Many listings on Facebook / Kijiji', fr: "Beaucoup d'annonces sur Facebook / Kijiji" },
      ],
      recommendNote: {
        ko: '처음 3–6개월은 콜로카시옹으로 시작하고, 생활 패턴을 파악한 뒤 단독 아파트로 이사하는 분이 많아요.',
        en: 'Many people start in a colocation for 3–6 months to get oriented, then move to a solo apartment.',
        fr: "Beaucoup commencent en colocation 3–6 mois pour s'orienter, puis passent à un appartement solo.",
      },
    },
    {
      name: '스튜디오 / 1½ 베드',
      sub: { ko: '오픈형 원룸 또는 소형 분리형 침실', en: 'Open-plan studio or small separated bedroom', fr: 'Studio open-plan ou petite chambre séparée' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '$950–1,400/월', en: '$950–1,400/mo', fr: '950–1 400$/mois' } },
        { icon: 'home', label: { ko: '완전한 프라이버시', en: 'Full privacy', fr: 'Pleine intimité' } },
        { icon: 'bolt', label: { ko: 'Hydro 별도 (보통 $40–80/월)', en: 'Hydro extra (~$40–80/mo)', fr: 'Hydro en sus (~40–80$/mois)' } },
      ],
      worksFor: [
        { ko: '혼자 살고 싶은 분', en: 'Prefer living alone', fr: 'Préférez vivre seul·e' },
        { ko: '재정적으로 안정된 분', en: 'Financially stable', fr: 'Financièrement stable' },
      ],
      worthKnowing: [
        { ko: '1½ (un et demi) = 몬트리올식 원룸+소침실', en: '1½ (un et demi) = Montréal term for studio+small bedroom', fr: '1½ = terme montréalais pour studio + petite chambre' },
        { ko: '7월 1일 이사 시즌에 공급이 확 줄어요', en: 'Supply drops sharply around July 1 moving day', fr: "L'offre chute fortement autour du 1er juillet" },
      ],
    },
    {
      name: '3½ / 4½ 베드 (일반 아파트)',
      sub: { ko: '1–2 침실 + 거실 + 주방의 퀘벡식 표기', en: 'Québec notation: 1–2 bedrooms + living room + kitchen', fr: 'Notation québécoise : 1–2 chambres + salon + cuisine' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '$1,300–2,000+/월', en: '$1,300–2,000+/mo', fr: '1 300–2 000+$/mois' } },
        { icon: 'users', label: { ko: '커플·룸메이트 적합', en: 'Good for couples or roommates', fr: 'Idéal pour couples ou colocs' } },
      ],
      worksFor: [
        { ko: '커플 또는 2인 이상 거주 예정인 분', en: 'Couple or multiple residents', fr: 'Couple ou plusieurs résidents' },
        { ko: '충분한 공간이 필요한 분', en: 'Need ample space', fr: "Besoin d'espace" },
      ],
      worthKnowing: [
        { ko: '3½ = 침실 1개 + 거실 + 주방 + 욕실', en: '3½ = 1 bedroom + living room + kitchen + bathroom', fr: '3½ = 1 chambre + salon + cuisine + salle de bain' },
        { ko: '렌트 나눠 내면 콜로카시옹보다 저렴할 수 있음', en: 'Split rent can be cheaper than colocation', fr: 'Loyer partagé peut coûter moins que la colocation' },
      ],
    },
  ],
  compareTable: {
    headers: [
      { ko: '유형', en: 'Type', fr: 'Type' },
      { ko: '평균 월세', en: 'Avg rent/mo', fr: 'Loyer moy/mois' },
      { ko: '수도·전기 포함', en: 'Utilities incl.', fr: 'Services inclus' },
      { ko: '가구 포함', en: 'Furnished', fr: 'Meublé' },
      { ko: '프라이버시', en: 'Privacy', fr: 'Intimité' },
    ],
    rows: [
      { name: 'Colocation (방)', cols: ['$600–950', true, '종종 포함 / often', '낮음 / Low'] },
      { name: 'Studio / 1½', cols: ['$950–1,400', false, '드물게 / Rare', '높음 / High'] },
      { name: '3½ (1BR)', cols: ['$1,300–1,700', false, '드물게 / Rare', '높음 / High'] },
      { name: '4½ (2BR)', cols: ['$1,600–2,000', false, '드물게 / Rare', '높음 / High'] },
    ],
  },
  communityNotes: [
    {
      flag: '🇰🇷',
      person: { ko: '소프트웨어 엔지니어 · 3년 거주', en: 'Software engineer · 3 yrs in MTL', fr: 'Ingénieur logiciel · 3 ans à MTL' },
      text: {
        ko: '처음에 5½을 혼자 구하려다 월세 감당이 힘들었어요. 3개월 콜로카시옹 후 3½로 이사했는데 훨씬 나았어요.',
        en: 'I tried to get a 5½ solo at first but the rent was tough. After 3 months in colocation I moved to a 3½ — much better.',
        fr: "J'ai d'abord voulu un 5½ seul mais c'était difficile financièrement. Après 3 mois en coloc, j'ai pris un 3½ — bien mieux.",
      },
      likes: 31,
    },
  ],
  helpLinks: [
    { label: { ko: 'Kijiji 몬트리올 임대 검색', en: 'Kijiji Montréal rentals', fr: 'Kijiji locations Montréal' }, url: 'https://www.kijiji.ca/b-apartments-condos/ville-de-montreal/c37l80002a10', domain: 'kijiji.ca' },
    { label: { ko: 'Rentals.ca 몬트리올', en: 'Rentals.ca Montréal', fr: 'Rentals.ca Montréal' }, url: 'https://rentals.ca/montreal', domain: 'rentals.ca' },
  ],
  faq: [
    {
      q: { ko: '퀘벡 임대료 표기 (3½, 4½)는 뭔가요?', en: 'What does 3½ or 4½ mean?', fr: "Que signifie 3½ ou 4½ ?" },
      a: { ko: '퀘벡에서는 방 개수를 독특하게 세요. 기본 단위 1이 주방이나 거실을 뜻하고, 침실 1개당 1을 더해요. 3½ = 침실 1 + 거실 + 주방 + 욕실(½). 4½ = 침실 2 포함 방 4개 + 욕실.', en: 'Québec counts rooms uniquely. The base number includes a kitchen/living room; each bedroom adds 1. 3½ = 1 bedroom + living room + kitchen + bathroom (the ½). 4½ = 2 bedrooms + 4 rooms total + bathroom.', fr: 'Le Québec compte les pièces de façon unique. La base inclut cuisine/salon ; chaque chambre ajoute 1. 3½ = 1 chambre + salon + cuisine + salle de bain (le ½). 4½ = 2 chambres + 4 pièces + salle de bain.' },
    },
    {
      q: { ko: '월세의 몇 %를 주거비로 써야 할까요?', en: 'What share of income should go to rent?', fr: 'Quelle part du revenu consacrer au loyer ?' },
      a: { ko: '일반적으로 세후 소득의 30% 이하를 권장해요. 유학생이라면 생활비 전체 예산에서 역산하는 게 현실적이에요.', en: 'The common guideline is under 30% of after-tax income. For students, working backwards from your total monthly budget is more practical.', fr: 'La règle habituelle est moins de 30% du revenu après impôts. Pour les étudiants, travailler à rebours à partir de votre budget mensuel total est plus pratique.' },
    },
  ],
  sidebar: {
    quickFacts: [
      { label: { ko: '평균 스튜디오 월세', en: 'Avg studio rent', fr: 'Loyer studio moy.' }, value: { ko: '$1,050/월', en: '$1,050/mo', fr: '1 050$/mois' } },
      { label: { ko: '평균 1BR 월세', en: 'Avg 1BR rent', fr: 'Loyer 1BR moy.' }, value: { ko: '$1,450/월', en: '$1,450/mo', fr: '1 450$/mois' } },
      { label: { ko: '이사 시즌', en: 'Moving season', fr: 'Saison déménagement' }, value: { ko: '6–7월', en: 'June–July', fr: 'Juin–Juillet' } },
    ],
    timeline: { ko: '정착 전 온라인에서 미리 조사하고, 도착 후 1–2주 내 예산 확정하기를 권장해요.', en: 'Research online before arrival; confirm your budget within 1–2 weeks of landing.', fr: "Cherchez en ligne avant l'arrivée ; confirmez votre budget dans les 1–2 semaines suivant votre arrivée." },
    nextStepId: 'neighbourhood',
    nextStepLabel: { ko: '동네 선택', en: 'Choose a neighbourhood', fr: 'Choisir un quartier' },
  },
  completionCard: {
    headline: { ko: '예산이 잡혔군요!', en: 'Budget set!', fr: 'Budget établi !' },
    body: { ko: '현실적인 예산을 가지고 동네를 골라볼 차례예요.', en: "Now it's time to pick a neighbourhood that fits.", fr: "Il est temps de choisir un quartier qui correspond." },
  },
}

// ─── Step 2: Neighbourhood ────────────────────────────────────────────────────

const NEIGHBOURHOOD_STEP: JourneyStep = {
  id: 'neighbourhood',
  label: { ko: '동네', en: 'Neighbourhood', fr: 'Quartier' },
  hero: {
    title: { ko: '내가 살 동네 고르기', en: 'Choosing where to live', fr: 'Choisir où vivre' },
    sub: {
      ko: '몬트리올은 동네마다 분위기가 크게 달라요. 임대료, 통근 시간, 생활 편의성을 함께 비교해서 나에게 맞는 곳을 찾아요.',
      en: "Montréal neighbourhoods have wildly different vibes. Compare rent, commute, and convenience to find what fits you.",
      fr: "Les quartiers de Montréal ont des ambiances très différentes. Comparez loyer, trajet et commodités pour trouver ce qui vous convient.",
    },
    when: { ko: '예산 확정 후', en: 'After setting your budget', fr: 'Après avoir établi votre budget' },
    cost: { ko: '비용 없음', en: 'No cost', fr: 'Aucun coût' },
    time: { ko: '2–5일 (리서치)', en: '2–5 days research', fr: '2–5 jours de recherche' },
    canBeforeArrival: { ko: '네, 미리 조사 가능', en: 'Yes, research from home', fr: 'Oui, faites des recherches avant' },
  },
  options: [
    {
      name: 'Plateau-Mont-Royal',
      sub: { ko: '아티스트 동네 · 카페 밀집 · 몬트리올의 심장', en: 'Artistic neighbourhood · dense café culture · heart of Montréal', fr: "Quartier artistique · cafés denses · cœur de Montréal" },
      topPick: true,
      meta: [
        { icon: 'currency-dollar', label: { ko: '3½: $1,300–1,800', en: '3½: $1,300–1,800', fr: '3½ : 1 300–1 800$' } },
        { icon: 'walk', label: { ko: '매우 도보 친화적', en: 'Very walkable', fr: 'Très accessible à pied' } },
        { icon: 'school', label: { ko: 'McGill·Concordia·UQAM 접근성 우수', en: 'Good access to McGill/Concordia/UQAM', fr: 'Bon accès McGill/Concordia/UQAM' } },
      ],
      worksFor: [
        { ko: '바이브 중시하는 분', en: 'Value neighbourhood atmosphere', fr: "Valorisez l'ambiance du quartier" },
        { ko: '카페·레스토랑 자주 이용하는 분', en: 'Frequent café/restaurant goers', fr: 'Habitués des cafés/restaurants' },
      ],
      worthKnowing: [
        { ko: '인기 있어서 경쟁이 치열해요', en: 'Competitive — listings go fast', fr: 'Compétitif — les annonces partent vite' },
        { ko: '여름 테라스 소음이 있어요', en: 'Summer terrace noise', fr: 'Bruit des terrasses en été' },
      ],
    },
    {
      name: 'Rosemont–La Petite-Patrie',
      sub: { ko: '가족 친화적 · 조용함 · 로컬 마켓 풍부', en: 'Family-friendly · quieter · strong local market scene', fr: 'Familial · plus calme · marchés locaux' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '3½: $1,200–1,600', en: '3½: $1,200–1,600', fr: '3½ : 1 200–1 600$' } },
        { icon: 'bike', label: { ko: '자전거 인프라 훌륭함', en: 'Excellent cycling infrastructure', fr: 'Infrastructure cyclable excellente' } },
      ],
      worksFor: [
        { ko: '조용한 생활을 원하는 분', en: 'Prefer quieter living', fr: 'Préférez le calme' },
        { ko: '자전거 통근 계획인 분', en: 'Planning to cycle commute', fr: 'Prévoyez de faire du vélo' },
      ],
      worthKnowing: [
        { ko: 'Jean-Talon Market 근처는 특히 인기', en: 'Jean-Talon Market area especially popular', fr: "Zone du marché Jean-Talon très prisée" },
      ],
    },
    {
      name: 'Verdun / LaSalle',
      sub: { ko: '강변 위치 · 저렴한 임대료 · 지하철 연결 양호', en: 'Riverside · lower rents · decent metro access', fr: 'Bord du fleuve · loyers bas · bon accès métro' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '3½: $1,000–1,400', en: '3½: $1,000–1,400', fr: '3½ : 1 000–1 400$' } },
        { icon: 'train', label: { ko: '지하철 녹색 라인', en: 'Green line metro', fr: 'Métro ligne verte' } },
      ],
      worksFor: [
        { ko: '예산을 최대한 아끼고 싶은 분', en: 'Maximizing budget savings', fr: 'Optimiser votre budget' },
        { ko: '강변 산책을 좋아하는 분', en: 'Love riverside walks', fr: 'Aimez les promenades riveraines' },
      ],
      worthKnowing: [
        { ko: '다운타운까지 지하철 15–25분', en: '15–25 min metro to downtown', fr: '15–25 min de métro vers le centre-ville' },
      ],
    },
  ],
  compareTable: {
    headers: [
      { ko: '동네', en: 'Neighbourhood', fr: 'Quartier' },
      { ko: '3½ 평균 월세', en: 'Avg 3½ rent', fr: 'Loyer 3½ moy.' },
      { ko: '다운타운까지', en: 'To downtown', fr: 'Vers centre-ville' },
      { ko: '도보 편의성', en: 'Walkability', fr: 'Marchabilité' },
      { ko: '한인 커뮤니티', en: 'Korean community', fr: 'Communauté coréenne' },
    ],
    rows: [
      { name: 'Plateau-Mont-Royal', cols: ['$1,500', '10–15 min', '⭐⭐⭐⭐⭐', '보통 / Medium'] },
      { name: 'Rosemont–La Petite-Patrie', cols: ['$1,400', '15–20 min', '⭐⭐⭐⭐', '적음 / Low'] },
      { name: 'Mile-End', cols: ['$1,550', '10–15 min', '⭐⭐⭐⭐⭐', '적음 / Low'] },
      { name: 'Côte-des-Neiges', cols: ['$1,200', '15–25 min', '⭐⭐⭐', '많음 / High'] },
      { name: 'Verdun / LaSalle', cols: ['$1,200', '20–30 min', '⭐⭐⭐', '적음 / Low'] },
      { name: 'NDG (Notre-Dame-de-Grâce)', cols: ['$1,350', '20–30 min', '⭐⭐⭐', '적음 / Low'] },
    ],
  },
  communityNotes: [
    {
      flag: '🇰🇷',
      person: { ko: '간호사 · CDN 거주 2년', en: 'Nurse · 2 yrs in Côte-des-Neiges', fr: 'Infirmière · 2 ans à CDN' },
      text: {
        ko: 'CDN은 한국 마트, 한식당이 있어서 처음 정착하기 정말 편했어요. 다운타운 거리가 있지만 버스가 자주 와요.',
        en: "CDN has Korean grocery and restaurants — really easy for early settling. A bit far from downtown but buses are frequent.",
        fr: "CDN a une épicerie et des restaurants coréens — super pratique pour s'installer. Un peu loin du centre mais les bus sont fréquents.",
      },
      likes: 44,
    },
    {
      flag: '🇰🇷',
      person: { ko: 'UdeM 대학원생 · 플라토 거주', en: 'UdeM grad student · living in Plateau', fr: "Étudiant UdeM · habite le Plateau" },
      text: {
        ko: '플라토는 비싸지만 대중교통, 카페, 모든 게 가까워서 차 없이도 충분해요. 자전거 한 대면 모든 게 해결돼요.',
        en: "Plateau is pricier but everything is close — transit, cafés, all of it. You don't need a car at all. One bike covers everything.",
        fr: "Le Plateau est plus cher mais tout est proche — transports, cafés, tout. Pas besoin de voiture. Un vélo suffit.",
      },
      likes: 38,
    },
  ],
  helpLinks: [
    { label: { ko: 'Montréal Neighbourhood Guide (Zumper)', en: 'Montréal neighbourhood guide', fr: 'Guide des quartiers de Montréal' }, url: 'https://www.zumper.com/blog/montreal-neighborhood-guide/', domain: 'zumper.com' },
    { label: { ko: 'STM 지하철 노선도', en: 'STM metro map', fr: 'Plan du métro STM' }, url: 'https://www.stm.info/en/info/networks/metro', domain: 'stm.info' },
  ],
  faq: [
    {
      q: { ko: 'Côte-des-Neiges에 한인 마트가 있나요?', en: 'Is there a Korean grocery in Montréal?', fr: 'Y a-t-il une épicerie coréenne à Montréal ?' },
      a: { ko: '네. Côte-des-Neiges에 한국 식료품점과 한식당이 모여 있어요. H-Mart, Kim Bo Land 등이 있고 주말이면 커뮤니티를 자주 만날 수 있어요.', en: "Yes. Côte-des-Neiges has Korean groceries and restaurants. H-Mart, Kim Bo Land and others are clustered there — you'll find community on weekends.", fr: "Oui. Côte-des-Neiges a des épiceries et restaurants coréens. H-Mart, Kim Bo Land et d'autres sont regroupés là — vous trouverez de la communauté les week-ends." },
    },
  ],
  sidebar: {
    quickFacts: [
      { label: { ko: '가장 저렴한 동네', en: 'Most affordable', fr: 'Plus abordable' }, value: { ko: 'Verdun / LaSalle', en: 'Verdun / LaSalle', fr: 'Verdun / LaSalle' } },
      { label: { ko: '한인 커뮤니티', en: 'Korean community', fr: 'Communauté coréenne' }, value: { ko: 'Côte-des-Neiges', en: 'Côte-des-Neiges', fr: 'Côte-des-Neiges' } },
      { label: { ko: '학생 인기 동네', en: 'Student favourite', fr: 'Favori étudiants' }, value: { ko: 'Plateau / Mile-End', en: 'Plateau / Mile-End', fr: 'Plateau / Mile-End' } },
    ],
    timeline: { ko: '도착 전 온라인 리서치 → 도착 후 1–2주 안에 직접 걸어보기를 추천해요.', en: 'Online research before arrival → walk the neighbourhoods in person within 1–2 weeks of landing.', fr: "Recherche en ligne avant l'arrivée → visitez les quartiers en personne dans les 1–2 semaines." },
    nextStepId: 'visits',
    nextStepLabel: { ko: '아파트 방문', en: 'Apartment visits', fr: "Visites d'appartement" },
  },
  completionCard: {
    headline: { ko: '동네가 결정됐어요!', en: "Neighbourhood chosen!", fr: 'Quartier choisi !' },
    body: { ko: '이제 본격적으로 매물을 보러 다닐 준비가 됐어요.', en: "Now you're ready to start viewing apartments.", fr: "Vous êtes prêt·e à commencer les visites." },
  },
}

// ─── Step 3: Apartment Visits ─────────────────────────────────────────────────

const VISITS_STEP: JourneyStep = {
  id: 'visits',
  label: { ko: '아파트 방문', en: 'Apartment visits', fr: "Visites d'appartement" },
  hero: {
    title: { ko: '내 방 찾기: 방문 체크리스트', en: 'Finding your place: the visit checklist', fr: 'Trouver votre logement : liste de vérification' },
    sub: {
      ko: '몬트리올 아파트는 현지에서 직접 봐야 해요. 사진과 실제가 다를 수 있고, 건물 상태와 집주인 성향을 파악하는 게 중요해요.',
      en: "Montréal apartments need to be seen in person. Photos don't always match reality, and assessing the building condition and landlord manner matters.",
      fr: "Les appartements à Montréal doivent être vus en personne. Les photos ne correspondent pas toujours à la réalité, et il est important d'évaluer l'état de l'immeuble.",
    },
    when: { ko: '동네 결정 후 즉시', en: 'Right after choosing a neighbourhood', fr: 'Juste après avoir choisi un quartier' },
    cost: { ko: '비용 없음 (방문만)', en: 'No cost (just visits)', fr: 'Aucun coût (visites seulement)' },
    time: { ko: '매물당 30–60분', en: '30–60 min per unit', fr: '30–60 min par logement' },
    canBeforeArrival: { ko: '아니요, 직접 방문 필요', en: 'No — in-person required', fr: 'Non — visite en personne requise' },
  },
  options: [
    {
      name: '플랫폼별 매물 연락',
      sub: { ko: 'Kijiji, DuProprio, FB Marketplace, Rentals.ca', en: 'Kijiji, DuProprio, FB Marketplace, Rentals.ca', fr: 'Kijiji, DuProprio, FB Marketplace, Rentals.ca' },
      topPick: true,
      meta: [
        { icon: 'device-laptop', label: { ko: '온라인 검색', en: 'Online search', fr: 'Recherche en ligne' } },
        { icon: 'message', label: { ko: '문자/이메일로 방문 예약', en: 'Book visit by text/email', fr: 'Réserver par texto/courriel' } },
      ],
      worksFor: [
        { ko: '본인이 직접 찾고 싶은 분', en: 'Prefer to search independently', fr: 'Préférez chercher seul·e' },
        { ko: '중개 수수료를 피하고 싶은 분', en: 'Want to avoid agent fees', fr: "Souhaitez éviter les frais d'agent" },
      ],
      worthKnowing: [
        { ko: '인기 매물은 당일 마감되기도 해요', en: 'Popular units close same day', fr: "Les bons logements partent le jour même" },
        { ko: '방문 전 건물 주소 구글맵으로 미리 확인', en: 'Google the address before visiting', fr: "Cherchez l'adresse sur Google avant la visite" },
      ],
      recommendNote: {
        ko: '방문 시 사진 충분히 찍기, 집주인 연락처 받아두기, 수도·전기·인터넷 상태 꼭 확인하세요.',
        en: 'During visits: take plenty of photos, get landlord contact info, always check water/electricity/internet.',
        fr: "Lors des visites : prenez beaucoup de photos, obtenez les coordonnées du propriétaire, vérifiez toujours eau/électricité/internet.",
      },
    },
    {
      name: '부동산 에이전트 활용',
      sub: { ko: '퀘벡에서 임대 중개는 보통 무료 (집주인이 수수료 부담)', en: 'Rental agents in Québec are usually free for tenants — landlord pays', fr: 'Les agents de location au Québec sont souvent gratuits pour les locataires — le propriétaire paie' },
      meta: [
        { icon: 'user-check', label: { ko: '세입자에게 무료', en: 'Free for tenant', fr: 'Gratuit pour locataire' } },
        { icon: 'building', label: { ko: '물량 더 많이 접근 가능', en: 'Access more listings', fr: "Accès à plus d'annonces" } },
      ],
      worksFor: [
        { ko: '언어 장벽이 있는 분', en: 'Language barrier concerns', fr: 'Barrière de langue' },
        { ko: '시간이 부족한 분', en: 'Limited time to search', fr: 'Peu de temps pour chercher' },
      ],
      worthKnowing: [
        { ko: '모든 에이전트가 세입자 친화적이지 않을 수 있어요', en: 'Not all agents are tenant-oriented', fr: 'Tous les agents ne sont pas orientés locataires' },
      ],
    },
  ],
  compareTable: {
    headers: [
      { ko: '확인 항목', en: 'Check item', fr: 'Élément à vérifier' },
      { ko: '왜 중요한가', en: 'Why it matters', fr: "Pourquoi c'est important" },
    ],
    rows: [
      { name: '수압 / 온수', cols: ['임대 후 고장 발견 시 수리 책임 분쟁 / Avoid post-move disputes'] },
      { name: '창문 단열 / Window seals', cols: ['몬트리올 겨울 난방비 직결 / Linked to winter heating costs'] },
      { name: '곰팡이 흔적 / Mold signs', cols: ['퇴거 후에도 건강 문제 지속 가능 / Health risk after move-out'] },
      { name: '소음 수준 / Noise level', cols: ['낮에 방문해도 밤 소음 다를 수 있음 / Daytime visit ≠ nighttime noise'] },
      { name: '인터넷 제공자 / ISP coverage', cols: ['건물에 따라 Bell/Vidéotron 제한 / Not all ISPs reach every building'] },
      { name: '세탁기/건조기 위치', cols: ['공용 세탁실 vs 유닛 내 / In-unit vs shared laundry'] },
    ],
  },
  communityNotes: [
    {
      flag: '🇰🇷',
      person: { ko: '회계사 · 첫 아파트 경험', en: 'Accountant · first MTL apartment', fr: 'Comptable · premier appartement à MTL' },
      text: {
        ko: '방문할 때 꼭 욕실 수압 확인하고, 창문 사이 외풍 체크하세요. 겨울에 난방비 폭탄 맞을 수 있어요.',
        en: "Always check shower pressure and window drafts during visits. Winter heating bills can be brutal if the seals are bad.",
        fr: "Vérifiez toujours la pression de la douche et les courants d'air des fenêtres. Les factures de chauffage en hiver peuvent être brutales si les joints sont mauvais.",
      },
      likes: 29,
    },
  ],
  helpLinks: [
    { label: { ko: 'DuProprio 임대 검색', en: 'DuProprio rental search', fr: 'Recherche location DuProprio' }, url: 'https://duproprio.com/en/to-rent', domain: 'duproprio.com' },
    { label: { ko: 'Kijiji 아파트 검색', en: 'Kijiji apartment search', fr: 'Annonces appartements Kijiji' }, url: 'https://www.kijiji.ca/b-apartments-condos/ville-de-montreal/c37l80002a10', domain: 'kijiji.ca' },
    { label: { ko: 'Centris 임대 리스팅', en: 'Centris rental listings', fr: 'Annonces Centris' }, url: 'https://www.centris.ca/en/properties~for-rent~montreal', domain: 'centris.ca' },
  ],
  faq: [
    {
      q: { ko: '방문할 때 무엇을 가져가야 하나요?', en: 'What should I bring to a visit?', fr: "Qu'est-ce que je dois apporter à une visite ?" },
      a: { ko: '신분증, 수입 증명서 (유학생이라면 입학 허가서), 은행 잔액 증명 준비하면 집주인이 좋아해요. 사진도 많이 찍어오세요.', en: "Bring ID, proof of income (or admission letter if student), and a bank statement. Landlords appreciate being prepared. Take lots of photos.", fr: "Apportez une pièce d'identité, preuve de revenus (lettre d'admission si étudiant·e) et un relevé bancaire. Les propriétaires apprécient la préparation. Prenez beaucoup de photos." },
    },
  ],
  sidebar: {
    quickFacts: [
      { label: { ko: '평균 방문 횟수', en: 'Avg visits before signing', fr: 'Visites avant signature' }, value: { ko: '3–8회', en: '3–8 visits', fr: '3–8 visites' } },
      { label: { ko: '이사 시즌 경쟁', en: 'July 1 competition', fr: 'Compétition 1 juillet' }, value: { ko: '매우 치열', en: 'Very high', fr: 'Très élevée' } },
    ],
    timeline: { ko: '보통 입주 2–4주 전부터 적극적으로 방문하기 시작하면 적당해요.', en: 'Start actively visiting 2–4 weeks before your target move-in date.', fr: "Commencez activement à visiter 2–4 semaines avant votre date d'emménagement cible." },
    nextStepId: 'lease',
    nextStepLabel: { ko: '임대 계약', en: 'Lease', fr: 'Bail' },
  },
  completionCard: {
    headline: { ko: '마음에 드는 곳을 찾았나요?', en: 'Found the one?', fr: 'Trouvé le bon logement ?' },
    body: { ko: '이제 계약서 검토할 준비가 됐어요.', en: "Time to review the lease.", fr: "Il est temps de lire le bail." },
  },
}

// ─── Step 4: Lease ────────────────────────────────────────────────────────────

const LEASE_STEP: JourneyStep = {
  id: 'lease',
  label: { ko: '임대 계약', en: 'Lease', fr: 'Bail' },
  hero: {
    title: { ko: '퀘벡 임대 계약서 이해하기', en: 'Understanding the Québec lease', fr: 'Comprendre le bail québécois' },
    sub: {
      ko: '퀘벡은 세입자 보호가 강한 곳이에요. 표준 임대 계약서(Bail de la Régie du logement)를 사용해야 하고, 집주인도 함부로 퇴거 통보를 할 수 없어요.',
      en: "Québec has strong tenant protections. The standard lease (Bail de la Régie du logement) is mandatory, and landlords have limited eviction rights.",
      fr: "Le Québec a une forte protection des locataires. Le bail standard (bail de la Régie du logement) est obligatoire, et les propriétaires ont des droits d'expulsion limités.",
    },
    when: { ko: '아파트 결정 직후', en: 'Right after choosing an apartment', fr: 'Juste après avoir choisi un appartement' },
    cost: { ko: '보통 첫 달 · 보증금은 퀘벡에서 불법!', en: 'Usually first month; security deposits are illegal in Québec', fr: "Habituellement premier mois ; les dépôts de garantie sont illégaux au Québec" },
    time: { ko: '서명까지 1–3일', en: '1–3 days to signing', fr: '1–3 jours avant signature' },
    canBeforeArrival: { ko: '아니요, 현지에서 진행', en: 'No — done in person locally', fr: 'Non — en personne sur place' },
  },
  options: [
    {
      name: '표준 1년 계약 (Standard 12-month)',
      sub: { ko: '퀘벡 표준 · 7월 1일 만료 관행 · 가장 일반적', en: 'Québec standard · typical July 1 expiry · most common', fr: "Standard québécois · expiration habituelle le 1er juillet · plus courant" },
      topPick: true,
      meta: [
        { icon: 'calendar', label: { ko: '보통 7/1 – 6/30', en: 'Usually July 1 – June 30', fr: 'Habituellement 1 juillet – 30 juin' } },
        { icon: 'shield-check', label: { ko: '퀘벡 세입자법 보호', en: 'Protected by Québec tenancy law', fr: 'Protégé par la loi locative du Québec' } },
      ],
      worksFor: [
        { ko: '안정적인 주거를 원하는 분', en: 'Want stable housing', fr: 'Souhaitez un logement stable' },
        { ko: '장기 체류 계획인 분', en: 'Planning to stay long-term', fr: 'Prévoyez un séjour à long terme' },
      ],
      worthKnowing: [
        { ko: '계약 갱신 거부는 4개월 전 서면 통보 필요', en: 'Non-renewal requires 4-month written notice', fr: 'Non-renouvellement nécessite un préavis écrit de 4 mois' },
        { ko: '중도 해지 시 대체 세입자 찾아야 함', en: 'Early termination: must find a replacement tenant', fr: 'Résiliation anticipée : vous devez trouver un remplaçant' },
      ],
    },
    {
      name: '월세 계약 (Month-to-month)',
      sub: { ko: '유연하지만 집주인이 더 쉽게 계약 변경 가능', en: 'Flexible but landlord can change terms more easily', fr: "Flexible mais le propriétaire peut modifier les conditions plus facilement" },
      meta: [
        { icon: 'refresh', label: { ko: '매달 갱신', en: 'Renews monthly', fr: 'Renouvellement mensuel' } },
        { icon: 'alert-triangle', label: { ko: '안정성 낮음', en: 'Less security', fr: 'Moins de sécurité' } },
      ],
      worksFor: [
        { ko: '단기 체류 예정인 분', en: 'Short-term stay planned', fr: 'Séjour à court terme prévu' },
        { ko: '유연성이 필요한 분', en: 'Need flexibility', fr: 'Besoin de flexibilité' },
      ],
      worthKnowing: [
        { ko: '집주인이 1개월 전 통보로 임대료 인상 가능', en: 'Landlord can raise rent with 1 month notice', fr: 'Le propriétaire peut augmenter le loyer avec 1 mois de préavis' },
      ],
    },
  ],
  compareTable: {
    headers: [
      { ko: '항목', en: 'Item', fr: 'Élément' },
      { ko: '퀘벡 법 내용', en: 'Québec law says', fr: 'Loi québécoise' },
    ],
    rows: [
      { name: '보증금 / Security deposit', cols: ['불법 (집주인이 요구할 수 없음) / Illegal — landlords cannot demand it'] },
      { name: '임대료 인상', cols: ['매년 TAL 가이드라인 % 이내 / Annual increase capped by TAL guidelines'] },
      { name: '수리 책임', cols: ['집주인이 주요 수리 책임 / Landlord responsible for major repairs'] },
      { name: '퇴거 통보', cols: ['세입자에게 이유 없이 퇴거 불가 / Cannot evict without cause'] },
      { name: '반려동물', cols: ['계약서 금지 조항 있어도 퀘벡에서는 일부 허용 / Clauses banning pets may be unenforceable'] },
    ],
  },
  communityNotes: [
    {
      flag: '🇰🇷',
      person: { ko: '법학과 대학원생', en: 'Law grad student', fr: 'Étudiant en droit' },
      text: {
        ko: '보증금 달라고 하면 거절하세요. 퀘벡에서는 불법이에요. 많은 분들이 모르고 내는데, 퇴거 시 돌려받기 어렵습니다.',
        en: "If a landlord asks for a security deposit, you can say no — it's illegal in Québec. Many newcomers pay it unknowingly and struggle to get it back.",
        fr: "Si un propriétaire demande un dépôt de garantie, vous pouvez refuser — c'est illégal au Québec. Beaucoup de nouveaux arrivants le paient sans le savoir et ont du mal à le récupérer.",
      },
      likes: 67,
    },
  ],
  helpLinks: [
    { label: { ko: 'Tribunal administratif du logement (TAL)', en: 'Tribunal administratif du logement (TAL)', fr: 'Tribunal administratif du logement (TAL)' }, url: 'https://www.tal.gouv.qc.ca/en', domain: 'tal.gouv.qc.ca' },
    { label: { ko: '퀘벡 표준 임대 계약서', en: 'Standard Québec lease form', fr: 'Bail standard du Québec' }, url: 'https://www.tal.gouv.qc.ca/en/forms-and-publications/lease', domain: 'tal.gouv.qc.ca' },
  ],
  faq: [
    {
      q: { ko: '집주인이 보증금을 요구하면 어떻게 하나요?', en: "What if a landlord demands a security deposit?", fr: "Que faire si un propriétaire demande un dépôt ?" },
      a: { ko: '퀘벡에서 보증금(dépôt de sécurité)은 불법이에요. 거절할 권리가 있어요. 집주인이 계속 요구하면 TAL에 신고할 수 있어요.', en: "Security deposits are illegal in Québec. You have the right to refuse. If a landlord keeps demanding one, you can report to the TAL.", fr: "Les dépôts de garantie sont illégaux au Québec. Vous avez le droit de refuser. Si un propriétaire insiste, vous pouvez signaler au TAL." },
    },
    {
      q: { ko: '계약 중간에 이사를 가고 싶으면 어떻게 하나요?', en: 'Can I leave before the lease ends?', fr: 'Puis-je partir avant la fin du bail ?' },
      a: { ko: '대체 세입자(cession de bail)를 찾아 계약을 양도할 수 있어요. 집주인이 거절하려면 합당한 사유가 필요해요.', en: "You can assign the lease (cession de bail) by finding a replacement tenant. The landlord can only refuse for valid reasons.", fr: "Vous pouvez céder le bail en trouvant un remplaçant. Le propriétaire ne peut refuser que pour des raisons valables." },
    },
  ],
  sidebar: {
    quickFacts: [
      { label: { ko: '보증금', en: 'Security deposit', fr: 'Dépôt de garantie' }, value: { ko: '불법', en: 'Illegal', fr: 'Illégal' } },
      { label: { ko: '표준 계약 기간', en: 'Standard term', fr: 'Durée standard' }, value: { ko: '12개월', en: '12 months', fr: '12 mois' } },
      { label: { ko: '이사 갱신 시즌', en: 'Renewal season', fr: 'Saison renouvellement' }, value: { ko: '3–4월', en: 'March–April', fr: 'Mars–Avril' } },
    ],
    timeline: { ko: '계약서 서명 → 입주 전 체크리스트 작성 (방 상태 사진 기록) → 열쇠 받기.', en: 'Sign lease → document unit condition with photos → collect keys.', fr: "Signer le bail → documenter l'état du logement avec photos → récupérer les clés." },
    nextStepId: 'settle_insurance',
    nextStepLabel: { ko: '세입자 보험', en: 'Tenant insurance', fr: 'Assurance locataire' },
  },
  completionCard: {
    headline: { ko: '계약서에 서명했어요!', en: 'Lease signed!', fr: 'Bail signé !' },
    body: { ko: '이제 보험 가입하고 유틸리티 연결할 차례예요.', en: "Now get insured and connect utilities.", fr: "Maintenant, assurez-vous et connectez les services." },
  },
}

// ─── Step 5: Tenant Insurance ─────────────────────────────────────────────────

const INSURANCE_STEP: JourneyStep = {
  id: 'settle_insurance',
  label: { ko: '세입자 보험', en: 'Tenant insurance', fr: 'Assurance locataire' },
  hero: {
    title: { ko: '세입자 보험: 왜, 어디서 가입하나요?', en: 'Tenant insurance: why and where', fr: "Assurance locataire : pourquoi et où" },
    sub: {
      ko: '세입자 보험은 화재, 도난, 수해로 인한 개인 물건 피해와 제3자 배상 책임을 커버해요. 퀘벡에서 법적 의무는 아니지만 많은 집주인이 계약 조건으로 요구해요.',
      en: "Tenant insurance covers your belongings against fire, theft, and water damage, plus liability if someone is injured in your unit. Not legally required in Québec but many landlords require it.",
      fr: "L'assurance locataire couvre vos biens contre l'incendie, le vol et les dégâts d'eau, plus la responsabilité civile. Non obligatoire légalement au Québec mais souvent exigée par les propriétaires.",
    },
    when: { ko: '입주 직전 또는 입주일', en: 'Just before or on move-in day', fr: "Juste avant ou le jour d'emménagement" },
    cost: { ko: '$15–40/월', en: '$15–40/mo', fr: '15–40$/mois' },
    time: { ko: '온라인 15–30분', en: '15–30 min online', fr: '15–30 min en ligne' },
    canBeforeArrival: { ko: '아니요, 주소 필요', en: 'No — need Montréal address first', fr: 'Non — adresse montréalaise requise' },
  },
  options: [
    {
      name: 'Intact Insurance',
      sub: { ko: '캐나다 최대 손보사 · 온라인 가입 가능', en: "Canada's largest insurer · online signup", fr: 'Plus grand assureur canadien · inscription en ligne' },
      topPick: true,
      meta: [
        { icon: 'currency-dollar', label: { ko: '$20–35/월', en: '$20–35/mo', fr: '20–35$/mois' } },
        { icon: 'globe', label: { ko: '영어·불어 온라인 가입', en: 'English/French online', fr: 'Anglais/Français en ligne' } },
      ],
      worksFor: [
        { ko: '빠르게 온라인으로 가입하고 싶은 분', en: 'Want fast online signup', fr: 'Inscription rapide en ligne' },
      ],
      worthKnowing: [
        { ko: '첫 달 무료 이벤트 종종 있음', en: 'Sometimes offers first-month free', fr: 'Parfois premier mois gratuit' },
      ],
    },
    {
      name: 'Sonnet Insurance',
      sub: { ko: '전액 온라인 · 간단한 비교 견적', en: 'Fully online · simple quote comparison', fr: '100% en ligne · comparaison de devis simple' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '$18–30/월', en: '$18–30/mo', fr: '18–30$/mois' } },
        { icon: 'device-laptop', label: { ko: '5분 가입 완료', en: '5-min signup', fr: 'Inscription en 5 min' } },
      ],
      worksFor: [
        { ko: '디지털 가입을 선호하는 분', en: 'Prefer digital-only', fr: 'Préférez le tout numérique' },
      ],
      worthKnowing: [
        { ko: '영어 지원 · 불어 제한적', en: 'English support · limited French', fr: 'Support anglais · français limité' },
      ],
    },
    {
      name: 'Desjardins / TD / RBC (은행 연계)',
      sub: { ko: '은행 계좌와 함께 묶음 할인 가능', en: 'Bundle discount with your bank account', fr: 'Réduction groupée avec votre compte bancaire' },
      meta: [
        { icon: 'building-bank', label: { ko: '은행 방문 or 온라인', en: 'In-branch or online', fr: 'En succursale ou en ligne' } },
        { icon: 'discount', label: { ko: '묶음 할인 5–10%', en: '5–10% bundle discount', fr: '5–10% de réduction groupée' } },
      ],
      worksFor: [
        { ko: '이미 캐나다 은행 계좌가 있는 분', en: 'Already have a Canadian bank account', fr: 'Déjà un compte bancaire canadien' },
      ],
      worthKnowing: [
        { ko: 'Desjardins는 불어가 기본, 영어 가능', en: 'Desjardins is French-first, English available', fr: 'Desjardins est en français principalement, anglais disponible' },
      ],
    },
  ],
  compareTable: {
    headers: [
      { ko: '보험사', en: 'Insurer', fr: 'Assureur' },
      { ko: '월 보험료', en: 'Monthly premium', fr: 'Prime mensuelle' },
      { ko: '온라인 가입', en: 'Online signup', fr: 'Inscription en ligne' },
      { ko: '한국어 지원', en: 'Korean support', fr: 'Support coréen' },
    ],
    rows: [
      { name: 'Intact', cols: ['$20–35', true, false] },
      { name: 'Sonnet', cols: ['$18–30', true, false] },
      { name: 'Desjardins', cols: ['$20–35', true, false] },
      { name: 'TD Insurance', cols: ['$22–40', true, false] },
    ],
  },
  communityNotes: [
    {
      flag: '🇰🇷',
      person: { ko: '디자이너 · 몬트리올 2년', en: 'Designer · 2 yrs in MTL', fr: 'Graphiste · 2 ans à MTL' },
      text: {
        ko: '처음엔 그냥 집주인이 요구하니까 가입했는데, 나중에 욕실 수도관 터졌을 때 보험이 없었으면 제 물건 다 날릴 뻔했어요. 꼭 들어요.',
        en: "I signed up just because the landlord required it, but when the bathroom pipe burst my belongings would have been ruined without it. Get it.",
        fr: "Je me suis inscrit·e juste parce que le propriétaire l'exigeait, mais quand le tuyau de la salle de bain a éclaté, mes affaires auraient été perdues sans ça. Prenez-la.",
      },
      likes: 52,
    },
  ],
  helpLinks: [
    { label: { ko: 'Sonnet 온라인 견적', en: 'Sonnet online quote', fr: 'Devis en ligne Sonnet' }, url: 'https://www.sonnet.ca/insurance/tenant-insurance', domain: 'sonnet.ca' },
    { label: { ko: 'Intact 세입자 보험', en: 'Intact tenant insurance', fr: "Assurance locataire Intact" }, url: 'https://www.intact.ca/en/personal-insurance/tenant-insurance.html', domain: 'intact.ca' },
  ],
  faq: [
    {
      q: { ko: '집주인이 세입자 보험 가입을 강요할 수 있나요?', en: 'Can a landlord require tenant insurance?', fr: "Un propriétaire peut-il exiger l'assurance locataire ?" },
      a: { ko: '네. 퀘벡에서 법적으로 의무는 아니지만 임대 계약서 조건으로 명시하면 집주인이 요구할 수 있어요. 실질적으로 대부분의 집주인이 요구합니다.', en: "Yes. While not legally mandatory in Québec, landlords can require it as a lease condition — and most do in practice.", fr: "Oui. Bien que non obligatoire légalement au Québec, les propriétaires peuvent l'exiger comme condition du bail — et la plupart le font en pratique." },
    },
  ],
  sidebar: {
    quickFacts: [
      { label: { ko: '평균 보험료', en: 'Avg premium', fr: 'Prime moyenne' }, value: { ko: '$25/월', en: '$25/mo', fr: '25$/mois' } },
      { label: { ko: '가입 소요 시간', en: 'Time to sign up', fr: "Temps d'inscription" }, value: { ko: '15–30분', en: '15–30 min', fr: '15–30 min' } },
    ],
    timeline: { ko: '입주일 당일 또는 이틀 전까지 가입 완료하기를 추천해요.', en: 'Aim to be covered by move-in day — sign up 1–2 days before.', fr: "Visez une couverture pour le jour d'emménagement — inscrivez-vous 1–2 jours avant." },
    nextStepId: 'settle_hydro',
    nextStepLabel: { ko: 'Hydro-Québec 개설', en: 'Open Hydro-Québec account', fr: 'Ouvrir compte Hydro-Québec' },
  },
  completionCard: {
    headline: { ko: '보험 가입 완료!', en: 'Insured!', fr: 'Assuré·e !' },
    body: { ko: '이제 전기·가스 계정을 열 시간이에요.', en: "Now open your electricity account.", fr: "Maintenant, ouvrez votre compte d'électricité." },
  },
}

// ─── Step 6: Hydro-Québec ─────────────────────────────────────────────────────

const HYDRO_STEP: JourneyStep = {
  id: 'settle_hydro',
  label: { ko: 'Hydro-Québec', en: 'Hydro-Québec', fr: 'Hydro-Québec' },
  hero: {
    title: { ko: 'Hydro-Québec 계정 만들기', en: 'Opening a Hydro-Québec account', fr: 'Ouvrir un compte Hydro-Québec' },
    sub: {
      ko: 'Hydro-Québec는 퀘벡의 전력 공급 공기업이에요. 아파트를 독립적으로 임대한다면 본인 명의로 계정을 열어야 해요. 일부 임대에는 포함돼 있으니 계약서 확인이 먼저예요.',
      en: "Hydro-Québec is the provincial electricity utility. If you're renting independently, you need your own account. Some leases include it — check your lease first.",
      fr: "Hydro-Québec est la compagnie d'électricité provinciale. Si vous louez de façon indépendante, vous avez besoin de votre propre compte. Certains baux l'incluent — vérifiez votre bail.",
    },
    when: { ko: '입주 1–2주 전', en: '1–2 weeks before move-in', fr: "1–2 semaines avant l'emménagement" },
    cost: { ko: '$40–120/월 (겨울 높음)', en: '$40–120/mo (higher in winter)', fr: '40–120$/mois (plus élevé en hiver)' },
    time: { ko: '온라인 15분', en: '15 min online', fr: '15 min en ligne' },
    canBeforeArrival: { ko: '아니요, 퀘벡 주소 필요', en: 'No — need your Québec address', fr: 'Non — adresse québécoise requise' },
  },
  options: [
    {
      name: 'Hydro-Québec 웹사이트 온라인 개설',
      sub: { ko: '가장 빠르고 일반적인 방법', en: 'Fastest and most common method', fr: 'La méthode la plus rapide et courante' },
      topPick: true,
      meta: [
        { icon: 'globe', label: { ko: 'hydroquebec.com에서 신청', en: 'Apply at hydroquebec.com', fr: 'Faire une demande sur hydroquebec.com' } },
        { icon: 'clock', label: { ko: '15분 소요', en: '15 min', fr: '15 min' } },
        { icon: 'calendar', label: { ko: '개시일 지정 가능', en: 'Choose service start date', fr: 'Choisir la date de début du service' } },
      ],
      worksFor: [{ ko: '모두에게 적합', en: 'Anyone', fr: 'Tout le monde' }],
      worthKnowing: [
        { ko: '영어 인터페이스 지원', en: 'English interface available', fr: 'Interface anglaise disponible' },
        { ko: '입주 전날까지 신청 완료 권장', en: 'Apply at least 1 day before move-in', fr: "Faire la demande au moins 1 jour avant l'emménagement" },
      ],
    },
    {
      name: '전화 개설 (1 888 385-7252)',
      sub: { ko: '온라인이 어려울 때', en: 'If online signup is difficult', fr: "Si l'inscription en ligne est difficile" },
      meta: [
        { icon: 'phone', label: { ko: '월–금 8:30–20:00', en: 'Mon–Fri 8:30 am–8 pm', fr: 'Lun–Ven 8h30–20h' } },
        { icon: 'language', label: { ko: '영어·불어 가능', en: 'English & French available', fr: 'Anglais et français disponibles' } },
      ],
      worksFor: [{ ko: '온라인 사용이 불편한 분', en: 'Less comfortable online', fr: "Moins à l'aise en ligne" }],
      worthKnowing: [{ ko: '대기 시간이 길 수 있음', en: 'Wait times can be long', fr: "Les temps d'attente peuvent être longs" }],
    },
  ],
  compareTable: {
    headers: [
      { ko: '기간', en: 'Season', fr: 'Saison' },
      { ko: '평균 월 청구액', en: 'Avg monthly bill', fr: 'Facture mensuelle moy.' },
      { ko: '주요 사유', en: 'Main reason', fr: 'Raison principale' },
    ],
    rows: [
      { name: '여름 (6–8월)', cols: ['$40–60', '에어컨 / AC usage'] },
      { name: '가을 (9–11월)', cols: ['$60–80', '냉방→난방 전환 / Transition season'] },
      { name: '겨울 (12–3월)', cols: ['$90–140', '전기 난방 / Electric heating'] },
      { name: '봄 (4–5월)', cols: ['$50–70', '난방 감소 / Heating reduction'] },
    ],
  },
  communityNotes: [
    {
      flag: '🇰🇷',
      person: { ko: '마케터 · 첫 겨울 경험', en: 'Marketer · first Montréal winter', fr: 'Marketeur · premier hiver à MTL' },
      text: {
        ko: '첫 겨울 Hydro 청구서 보고 깜짝 놀랐어요. 1월에 $130 나왔거든요. 전기 난방이라 어쩔 수 없지만, 미리 알고 있으면 덜 충격이에요.',
        en: "My first winter Hydro bill was a shock — $130 in January. Electric heating does that. Knowing ahead helps.",
        fr: "Ma première facture d'hiver Hydro était un choc — 130$ en janvier. Le chauffage électrique fait ça. Être prévenu aide.",
      },
      likes: 41,
    },
  ],
  helpLinks: [
    { label: { ko: 'Hydro-Québec 온라인 계정 개설', en: 'Open Hydro-Québec account online', fr: 'Ouvrir un compte Hydro-Québec en ligne' }, url: 'https://www.hydroquebec.com/residential/moving/', domain: 'hydroquebec.com' },
    { label: { ko: 'Hydro-Québec 에너지 절약 팁', en: 'Hydro-Québec energy saving tips', fr: "Conseils d'économie d'énergie Hydro-Québec" }, url: 'https://www.hydroquebec.com/residential/energy-wise/', domain: 'hydroquebec.com' },
  ],
  faq: [
    {
      q: { ko: '임대료에 전기세 포함이면 계정 안 열어도 되나요?', en: 'What if electricity is included in rent?', fr: "Et si l'électricité est incluse dans le loyer ?" },
      a: { ko: '네. 계약서에 "chauffage et électricité inclus" 또는 "utilities included"라고 명시돼 있으면 별도로 Hydro 계정을 열 필요 없어요.', en: "Correct. If your lease says utilities/electricity are included, you don't need your own Hydro account.", fr: "Exact. Si votre bail indique que les services/l'électricité sont inclus, vous n'avez pas besoin d'un compte Hydro personnel." },
    },
  ],
  sidebar: {
    quickFacts: [
      { label: { ko: '퀘벡 전력 연료원', en: 'Power source', fr: "Source d'énergie" }, value: { ko: '99% 수력 발전', en: '99% hydroelectric', fr: '99% hydroélectrique' } },
      { label: { ko: '전기 요금', en: 'Rate', fr: 'Tarif' }, value: { ko: '캐나다 최저', en: "Canada's lowest", fr: 'Le plus bas au Canada' } },
      { label: { ko: '겨울 난방 방식', en: 'Winter heating', fr: 'Chauffage hiver' }, value: { ko: '주로 전기', en: 'Mostly electric', fr: 'Principalement électrique' } },
    ],
    timeline: { ko: '입주 1–2주 전에 개설 신청하고, 개시일을 입주일에 맞추세요.', en: 'Apply 1–2 weeks before move-in; set the service start date to your move-in day.', fr: "Faites la demande 1–2 semaines avant l'emménagement ; réglez la date de début au jour d'emménagement." },
    nextStepId: 'internet',
    nextStepLabel: { ko: '인터넷 설치', en: 'Set up internet', fr: 'Configurer internet' },
  },
  completionCard: {
    headline: { ko: '전기 연결 완료!', en: 'Electricity connected!', fr: 'Électricité connectée !' },
    body: { ko: '이제 인터넷 설치가 남았어요.', en: "One more utility to go: internet.", fr: "Un autre service à configurer : internet." },
  },
}

// ─── Step 7: Internet ─────────────────────────────────────────────────────────

const INTERNET_STEP: JourneyStep = {
  id: 'internet',
  label: { ko: '인터넷', en: 'Internet', fr: 'Internet' },
  hero: {
    title: { ko: '몬트리올 인터넷 연결하기', en: 'Getting internet in Montréal', fr: 'Avoir internet à Montréal' },
    sub: {
      ko: '캐나다 인터넷 요금은 비싼 편이에요. 하지만 퀘벡은 경쟁이 있어서 저가 MVNO(재판매 사업자)를 이용하면 비용을 많이 줄일 수 있어요.',
      en: "Canadian internet is pricey — but Québec has competition. Budget ISPs (resellers) can cut your bill significantly.",
      fr: "Internet au Canada est cher — mais le Québec est concurrentiel. Les fournisseurs économiques (revendeurs) peuvent réduire votre facture.",
    },
    when: { ko: '입주 1–2주 전', en: '1–2 weeks before move-in', fr: "1–2 semaines avant l'emménagement" },
    cost: { ko: '$35–100/월', en: '$35–100/mo', fr: '35–100$/mois' },
    time: { ko: '설치 예약 후 당일 or 1–3일', en: 'Same day or 1–3 days after booking', fr: "Le jour même ou 1–3 jours après la réservation" },
    canBeforeArrival: { ko: '아니요, 주소 필요', en: 'No — need Montréal address', fr: 'Non — adresse montréalaise requise' },
  },
  options: [
    {
      name: 'TekSavvy (저가 추천)',
      sub: { ko: 'Bell/Vidéotron 망 임차 · 훨씬 저렴', en: "Resells Bell/Vidéotron infrastructure at lower cost", fr: "Revend l'infrastructure Bell/Vidéotron à moindre coût" },
      topPick: true,
      meta: [
        { icon: 'currency-dollar', label: { ko: '$35–55/월', en: '$35–55/mo', fr: '35–55$/mois' } },
        { icon: 'globe', label: { ko: '온라인 신청', en: 'Online signup', fr: 'Inscription en ligne' } },
      ],
      worksFor: [
        { ko: '비용을 최소화하고 싶은 분', en: 'Want to minimize cost', fr: 'Souhaitez minimiser les coûts' },
      ],
      worthKnowing: [
        { ko: '설치 기사 방문 1–5일 대기 가능', en: 'Technician visit may take 1–5 days', fr: "La visite du technicien peut prendre 1–5 jours" },
        { ko: '일부 건물은 Vidéotron만 지원', en: 'Some buildings only support Vidéotron', fr: "Certains immeubles ne supportent que Vidéotron" },
      ],
      recommendNote: {
        ko: '많은 이민자들이 Bell 또는 Vidéotron으로 시작했다가 비용 절약을 위해 TekSavvy로 갈아타요.',
        en: 'Many newcomers start with Bell or Vidéotron then switch to TekSavvy to cut costs.',
        fr: "Beaucoup de nouveaux arrivants commencent avec Bell ou Vidéotron puis passent à TekSavvy pour réduire les coûts.",
      },
    },
    {
      name: 'Vidéotron',
      sub: { ko: '퀘벡 1위 사업자 · 케이블 인터넷', en: "Québec's leading cable ISP", fr: "Principal fournisseur câble au Québec" },
      meta: [
        { icon: 'currency-dollar', label: { ko: '$55–90/월', en: '$55–90/mo', fr: '55–90$/mois' } },
        { icon: 'wifi', label: { ko: '안정적인 속도', en: 'Reliable speeds', fr: 'Vitesses fiables' } },
      ],
      worksFor: [{ ko: '최고 안정성이 필요한 분', en: 'Need maximum reliability', fr: 'Besoin de fiabilité maximale' }],
      worthKnowing: [{ ko: '번들 (TV+인터넷) 할인 있음', en: 'Bundles (TV+internet) available', fr: 'Forfaits groupés disponibles' }],
    },
    {
      name: 'Bell Fibe',
      sub: { ko: '광섬유 기반 · 빠른 속도 · 프리미엄 가격', en: 'Fibre-based · fast · premium priced', fr: 'Fibre optique · rapide · prix premium' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '$70–100/월', en: '$70–100/mo', fr: '70–100$/mois' } },
        { icon: 'lightning-bolt', label: { ko: '최대 3 Gbps', en: 'Up to 3 Gbps', fr: "Jusqu'à 3 Gbps" } },
      ],
      worksFor: [{ ko: '초고속 인터넷이 필요한 분', en: 'Need ultra-fast internet', fr: "Besoin d'internet ultra-rapide" }],
      worthKnowing: [{ ko: '광섬유 커버리지는 지역마다 다름', en: 'Fibre coverage varies by area', fr: 'La couverture fibre varie selon la zone' }],
    },
  ],
  compareTable: {
    headers: [
      { ko: '사업자', en: 'ISP', fr: 'Fournisseur' },
      { ko: '월 요금', en: 'Monthly', fr: 'Mensuel' },
      { ko: '속도', en: 'Speed', fr: 'Vitesse' },
      { ko: '계약 조건', en: 'Contract', fr: 'Contrat' },
    ],
    rows: [
      { name: 'TekSavvy', cols: ['$35–55', '75–1000 Mbps', '무계약 / No contract'] },
      { name: 'Vidéotron', cols: ['$55–90', '100–1500 Mbps', '1–2년 / 1–2 yr'] },
      { name: 'Bell Fibe', cols: ['$70–100', '500–3000 Mbps', '2년 / 2 yr'] },
      { name: 'VMedia', cols: ['$35–60', '30–940 Mbps', '무계약 / No contract'] },
    ],
  },
  communityNotes: [
    {
      flag: '🇰🇷',
      person: { ko: '개발자 · 재택 근무', en: 'Developer · remote work', fr: 'Développeur · télétravail' },
      text: {
        ko: 'TekSavvy 1기가 $45로 쓰고 있어요. Bell이랑 속도 차이 못 느끼겠어요. 한 달에 $40 절약하면 1년에 $480이잖아요.',
        en: "TekSavvy 1Gig for $45. Can't tell the difference from Bell. Save $40/month = $480/year.",
        fr: "TekSavvy 1 Gbps pour 45$. Aucune différence avec Bell. 40$/mois économisés = 480$/an.",
      },
      likes: 58,
    },
  ],
  helpLinks: [
    { label: { ko: 'TekSavvy 플랜 비교', en: 'TekSavvy plans', fr: 'Forfaits TekSavvy' }, url: 'https://teksavvy.com/internet/home-internet', domain: 'teksavvy.com' },
    { label: { ko: 'Vidéotron 인터넷 플랜', en: 'Vidéotron internet plans', fr: 'Forfaits internet Vidéotron' }, url: 'https://www.videotron.com/en/internet', domain: 'videotron.com' },
  ],
  faq: [
    {
      q: { ko: '이사 전 인터넷 미리 신청해야 하나요?', en: 'Should I apply for internet before moving?', fr: "Dois-je demander internet avant de déménager ?" },
      a: { ko: '네. 대부분 임대에는 인터넷이 포함되지 않아요. 이사 2주 전에 신청해야 이사 당일 또는 그 바로 다음 날 설치가 가능해요.', en: "Yes. Most leases don't include internet. Apply 2 weeks before moving to get installation on or just after move-in day.", fr: "Oui. La plupart des baux n'incluent pas internet. Faites la demande 2 semaines avant pour une installation le jour ou lendemain de l'emménagement." },
    },
  ],
  sidebar: {
    quickFacts: [
      { label: { ko: '평균 월 요금', en: 'Avg monthly cost', fr: 'Coût mensuel moy.' }, value: { ko: '$50–70', en: '$50–70', fr: '50–70$' } },
      { label: { ko: '설치 대기 기간', en: 'Installation wait', fr: "Délai d'installation" }, value: { ko: '1–7일', en: '1–7 days', fr: '1–7 jours' } },
    ],
    timeline: { ko: '이사 1–2주 전에 신청하고, 이사 당일 또는 그 전날 설치 예약을 잡으세요.', en: "Apply 1–2 weeks before moving; schedule installation for move-in day or the day before.", fr: "Faites la demande 1–2 semaines avant ; planifiez l'installation pour le jour d'emménagement ou la veille." },
    nextStepId: 'movingin',
    nextStepLabel: { ko: '이사 준비', en: 'Moving in', fr: 'Emménagement' },
  },
  completionCard: {
    headline: { ko: '인터넷 연결 완료!', en: 'Internet connected!', fr: 'Internet connecté !' },
    body: { ko: '이제 이사 당일 준비만 남았어요.', en: "Just one more step: moving day.", fr: "Plus qu'une étape : le jour du déménagement." },
  },
}

// ─── Step 8: Moving In ────────────────────────────────────────────────────────

const MOVINGIN_STEP: JourneyStep = {
  id: 'movingin',
  label: { ko: '이사하기', en: 'Moving in', fr: 'Emménagement' },
  hero: {
    title: { ko: '몬트리올 이사 당일: 준비와 팁', en: "Moving day in Montréal: prep and tips", fr: "Jour de déménagement à Montréal : préparation et conseils" },
    sub: {
      ko: '몬트리올에서 7월 1일은 "이사의 날"이에요. 인구의 약 20%가 같은 날 이사를 해요. 이 날을 피하거나, 일찍 계획하세요. 다른 날 이사라도 주차, 엘리베이터 예약, 이웃 배려가 중요해요.',
      en: "July 1 is Montréal's unofficial moving day — roughly 20% of the city moves that day. Avoid it or plan very early. Any moving day: parking, elevator booking, and neighbour courtesy matter.",
      fr: "Le 1er juillet est le jour de déménagement non officiel de Montréal — environ 20% de la ville déménage ce jour-là. Évitez-le ou planifiez très tôt. N'importe quel jour : stationnement, ascenseur et courtoisie envers les voisins comptent.",
    },
    when: { ko: '입주일 당일 및 며칠 전', en: 'Move-in day and a few days before', fr: "Le jour d'emménagement et quelques jours avant" },
    cost: { ko: '이삿짐센터 $300–800 / 트럭 렌트 $80–200/일', en: 'Movers $300–800 · truck rental $80–200/day', fr: 'Déménageurs 300–800$ · camion 80–200$/jour' },
    time: { ko: '1일 (소형) ~ 2일 (대형)', en: '1 day (small) to 2 days (large)', fr: '1 jour (petit) à 2 jours (grand)' },
    canBeforeArrival: { ko: '아니요, 현지에서만', en: 'No — local only', fr: 'Non — sur place seulement' },
  },
  options: [
    {
      name: '이삿짐센터 고용',
      sub: { ko: '전문 인력이 이삿짐을 안전하게 이동', en: 'Professional movers handle everything safely', fr: "Des déménageurs professionnels s'occupent de tout" },
      topPick: true,
      meta: [
        { icon: 'currency-dollar', label: { ko: '$300–800', en: '$300–800', fr: '300–800$' } },
        { icon: 'shield', label: { ko: '보험 적용', en: 'Insurance covered', fr: 'Couvert par assurance' } },
      ],
      worksFor: [
        { ko: '짐이 많은 분', en: 'Lots of belongings', fr: "Beaucoup d'affaires" },
        { ko: '도움을 줄 사람이 없는 분', en: 'No one to help', fr: "Personne pour vous aider" },
      ],
      worthKnowing: [
        { ko: '7월 1일 전후 예약은 최소 4–8주 전에', en: 'Book 4–8 weeks ahead for June/July moves', fr: "Réservez 4–8 semaines à l'avance pour juin/juillet" },
        { ko: '견적 2–3군데 비교 권장', en: 'Get 2–3 quotes', fr: 'Comparez 2–3 devis' },
      ],
    },
    {
      name: '트럭 렌트 (U-Haul / Enterprise)',
      sub: { ko: '직접 운전 · 비용 절약 · 도울 사람 필요', en: 'Drive yourself · budget-friendly · need helpers', fr: "Conduire soi-même · économique · besoin d'aide" },
      meta: [
        { icon: 'currency-dollar', label: { ko: '$80–200/일', en: '$80–200/day', fr: '80–200$/jour' } },
        { icon: 'users', label: { ko: '도와줄 사람 2–4명 필요', en: 'Need 2–4 helpers', fr: "Besoin de 2–4 aides" } },
      ],
      worksFor: [
        { ko: '예산을 최대한 아끼고 싶은 분', en: 'Tight budget', fr: 'Budget serré' },
        { ko: '도와줄 친구나 가족이 있는 분', en: 'Have friends/family to help', fr: 'Avez des amis/famille pour aider' },
      ],
      worthKnowing: [
        { ko: '주차 퍼밋 사전 신청 필요 (일부 동네)', en: 'Parking permits required in some neighbourhoods', fr: 'Permis de stationnement requis dans certains quartiers' },
      ],
    },
    {
      name: '친구와 함께 이사',
      sub: { ko: '비용 최소 · 시간 최대 · 피자 한 판 준비', en: 'Minimum cost · maximum time · order pizza', fr: 'Coût minimal · temps maximal · commandez des pizzas' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '거의 무료', en: 'Near-free', fr: 'Quasi-gratuit' } },
        { icon: 'users', label: { ko: '4–6명 추천', en: '4–6 people recommended', fr: '4–6 personnes recommandées' } },
      ],
      worksFor: [
        { ko: '짐이 적은 분', en: 'Light belongings', fr: "Peu d'affaires" },
        { ko: '현지 친구 네트워크가 있는 분', en: 'Have a local network', fr: 'Avez un réseau local' },
      ],
      worthKnowing: [{ ko: '음식과 음료 준비는 필수 예의', en: 'Providing food and drinks is expected', fr: 'Fournir nourriture et boissons est attendu' }],
    },
  ],
  compareTable: {
    headers: [
      { ko: '이사 체크리스트', en: 'Moving checklist', fr: 'Liste de déménagement' },
      { ko: '시기', en: 'When', fr: 'Quand' },
    ],
    rows: [
      { name: '이삿짐센터 / 트럭 예약', cols: ['4–8주 전 / 4–8 weeks before'] },
      { name: 'Hydro-Québec 개시일 설정', cols: ['2주 전 / 2 weeks before'] },
      { name: '인터넷 설치 예약', cols: ['2주 전 / 2 weeks before'] },
      { name: '세입자 보험 가입', cols: ['입주 전날까지 / Before move-in'] },
      { name: '현 상태 사진 촬영 (방 곳곳)', cols: ['열쇠 받은 직후 / Right after getting keys'] },
      { name: '이전 주소 변경 (은행·우체국)', cols: ['입주일 또는 이후 / Move-in day or after'] },
      { name: '엘리베이터 예약 (있으면)', cols: ['최소 1주 전 / At least 1 week before'] },
    ],
  },
  communityNotes: [
    {
      flag: '🇰🇷',
      person: { ko: '간호사 · 3번 이사 경험', en: 'Nurse · moved 3 times in MTL', fr: 'Infirmière · 3 déménagements à MTL' },
      text: {
        ko: '이사 당일 방 곳곳 사진 찍는 것 잊지 마세요. 나중에 퇴거할 때 보증금 분쟁 생기면 증거가 돼요.',
        en: "Don't forget to photograph every room right when you get the keys. It's your evidence if there's a dispute when you move out.",
        fr: "N'oubliez pas de photographier chaque pièce dès que vous récupérez les clés. C'est votre preuve en cas de litige à la fin.",
      },
      likes: 73,
    },
    {
      flag: '🇰🇷',
      person: { ko: '유학생 · 7/1 이사 경험', en: 'Student · survived July 1 moving day', fr: "Étudiant·e · a survécu au 1er juillet" },
      text: {
        ko: '7월 1일에 이사해 봤어요. 진짜 카오스예요. 가능하면 6월 29–30일이나 7월 2–3일로 피하세요.',
        en: "I moved on July 1. Pure chaos. Avoid it if at all possible — June 29–30 or July 2–3 are fine.",
        fr: "J'ai déménagé le 1er juillet. Chaos total. Évitez si possible — le 29–30 juin ou 2–3 juillet, c'est bien.",
      },
      likes: 61,
    },
  ],
  helpLinks: [
    { label: { ko: 'U-Haul 트럭 예약 몬트리올', en: 'U-Haul truck rental Montréal', fr: 'Location camion U-Haul Montréal' }, url: 'https://www.uhaul.com/Locations/Montreal-QC/', domain: 'uhaul.com' },
    { label: { ko: '몬트리올 이사 주차 퍼밋', en: 'Montréal parking permit for moving', fr: 'Permis de stationnement déménagement' }, url: 'https://montreal.ca/en/articles/parking-for-moving', domain: 'montreal.ca' },
  ],
  faq: [
    {
      q: { ko: '7월 1일 꼭 피해야 하나요?', en: 'Do I have to avoid July 1?', fr: 'Dois-je vraiment éviter le 1er juillet ?' },
      a: { ko: '강력히 권장해요. 피할 수 없다면 이삿짐센터를 최소 6–8주 전에 예약하고, 트럭 렌트도 최대한 일찍 해요. 당일 주차 공간 찾기가 매우 어렵습니다.', en: "Strongly recommended to avoid it. If unavoidable, book movers 6–8 weeks ahead and rent a truck as early as possible. Parking on that day is very hard.", fr: "Fortement recommandé de l'éviter. Si inévitable, réservez des déménageurs 6–8 semaines à l'avance. Trouver du stationnement ce jour-là est très difficile." },
    },
    {
      q: { ko: '이사 전 현 상태 기록이 왜 중요한가요?', en: "Why document the unit's condition before moving in?", fr: "Pourquoi documenter l'état du logement avant d'emménager ?" },
      a: { ko: '퇴거 시 집주인이 기존 손상을 세입자 잘못으로 청구할 수 있어요. 입주 당일 사진을 찍어두면 분쟁 시 증거가 돼요.', en: "A landlord might charge you for pre-existing damage when you move out. Photos taken on move-in day are your evidence.", fr: "Un propriétaire pourrait vous facturer des dommages préexistants à la sortie. Les photos du jour d'emménagement constituent votre preuve." },
    },
  ],
  sidebar: {
    quickFacts: [
      { label: { ko: '몬트리올 이사의 날', en: 'Montréal moving day', fr: 'Jour de déménagement MTL' }, value: { ko: '7월 1일', en: 'July 1', fr: '1er juillet' } },
      { label: { ko: '이삿짐센터 평균 비용', en: 'Avg mover cost', fr: 'Coût déménageurs moy.' }, value: { ko: '$400–600', en: '$400–600', fr: '400–600$' } },
    ],
    timeline: { ko: '2–4주 전: 이삿짐센터 예약 → 1주 전: 짐 포장 → 당일: 현 상태 사진 촬영 후 이사 시작.', en: '2–4 weeks before: book movers → 1 week before: pack → move day: photograph the unit before unloading.', fr: "2–4 semaines avant : réserver des déménageurs → 1 semaine avant : emballer → jour J : photographier le logement." },
  },
  completionCard: {
    headline: { ko: '집이 생겼습니다! 🏠', en: 'You have a home! 🏠', fr: 'Vous avez un chez-vous ! 🏠' },
    body: { ko: '몬트리올에서의 새 출발을 축하해요. 이제 진짜 정착이 시작됩니다.', en: "Welcome to your new home in Montréal. The real settling-in begins now.", fr: "Bienvenue dans votre nouveau chez-vous à Montréal. La vraie installation commence maintenant." },
  },
}

// ─── Main page ────────────────────────────────────────────────────────────────

const ARRIVE_STEPS: TabContent[] = [
  FLIGHTS_TAB,
  AIRPORT_TAB,
  TEMP_STAY_TAB,
  SIM_TAB,
  BANK_TAB,
  SIN_TAB,
  TRANSIT_TAB,
  LONG_HOUSING_TAB,
  INSURANCE_TAB,
  HYDRO_TAB,
  LICENCE_TAB,
  LANGUAGE_TAB,
]

const SETTLE_STEPS: TabContent[] = [
  BUDGET_STEP,
  NEIGHBOURHOOD_STEP,
  VISITS_STEP,
  LEASE_STEP,
  INSURANCE_STEP,
  HYDRO_STEP,
  INTERNET_STEP,
  MOVINGIN_STEP,
]

const TABS: TabContent[] = [...ARRIVE_STEPS, ...SETTLE_STEPS]

// Two-phase grouping so the tab-pill/check-strip rows show ~12 items at a time
// instead of all 20 — overall progress still counts across every step.
const PHASES = [
  {
    id: 'arrive',
    label: { ko: '도착 전 준비', en: 'Before you arrive', fr: 'Avant votre arrivée' },
    stepIds: ARRIVE_STEPS.map(s => s.id),
  },
  {
    id: 'settle',
    label: { ko: '도착 후 정착', en: 'Settling in', fr: "Une fois arrivé·e" },
    stepIds: SETTLE_STEPS.map(s => s.id),
  },
]

function HousingExtra(tabId: string, lang: string) {
  if (tabId !== 'housing') return null
  const label = lang === 'ko' ? '플랫폼별 매물 검색' : lang === 'fr' ? 'Chercher par plateforme' : 'Search by platform'
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-400 whitespace-nowrap">{label}</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      <HousingListings lang={lang} />
    </div>
  )
}

export default function Arriving() {
  return (
    <JourneyPage
      steps={TABS}
      progressKey={PROGRESS_KEY}
      eyebrow={{ ko: '나의 여정', en: 'My Journey', fr: 'Mon parcours' }}
      title={{ ko: '도착 & 정착', en: 'Arriving & Settling In', fr: 'Arrivée & Installation' }}
      subtitle={{
        ko: '비행기 예약부터 첫 아파트 계약까지 — 몬트리올 정착의 전 과정을 한 곳에서 안내해 드려요.',
        en: 'From booking your flight to signing your first lease — the whole Montréal settling journey in one place.',
        fr: "De la réservation du vol à la signature du premier bail — tout le parcours d'installation à Montréal réuni ici.",
      }}
      extraContent={HousingExtra}
      phases={PHASES}
    />
  )
}
