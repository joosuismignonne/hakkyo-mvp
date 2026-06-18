/**
 * First Steps — HAKKYO Montréal Starter Kit
 *
 * Tone: "a friend who arrived before you." Neutral options, never prescriptive.
 * i18n: every visible string through tri(). Three languages inline (ko/en/fr).
 */
import React, { useState, useEffect } from 'react'
import { useLang } from '../context/LangContext'

// ─── i18n types + helper ──────────────────────────────────────────────────────

type Tri = { ko: string; en: string; fr: string }
function tri(obj: Tri, lang: string): string {
  return lang === 'ko' ? obj.ko : lang === 'fr' ? obj.fr : obj.en
}

const PROGRESS_KEY = 'hakkyo_firststeps'

// ─── Tab data types ──────────────────────────────────────────────────────────

interface OptionData {
  name: string
  sub: Tri
  topPick?: boolean
  meta: Array<{ icon: string; label: Tri }>
  worksFor: Tri[]
  worthKnowing: Tri[]
  recommendNote?: Tri
}

interface CommunityNoteData {
  flag: string
  person: Tri
  text: Tri
  likes: number
}

interface TopicIntroData {
  what: Tri
  behavior: Tri
  when: Tri
}

interface TabContent {
  intro: TopicIntroData
  options: OptionData[]
  notes: CommunityNoteData[]
}

// ─── TAB 1: SIM card ─────────────────────────────────────────────────────────

const SIM_TAB: TabContent = {
  intro: {
    what: {
      ko: 'SIM 카드는 휴대폰을 캐나다 통신망에 연결해줘요. 없으면 통화, 문자, 데이터가 안 돼요.',
      en: "A SIM card connects your phone to a Canadian mobile network. Without one, your phone won't work for calls, texts, or data.",
      fr: "Une carte SIM connecte votre téléphone à un réseau mobile canadien. Sans elle, pas d'appels, de textos ni de données.",
    },
    behavior: {
      ko: '출국 전에 eSIM을 온라인으로 개통하거나, 도착 첫 주에 공항이나 매장에서 받는 분이 많아요.',
      en: 'Most people either activate an eSIM online before leaving, or pick one up at the airport or a phone store in their first week.',
      fr: "Beaucoup activent une eSIM en ligne avant de partir, ou en récupèrent une à l'aéroport ou en boutique la première semaine.",
    },
    when: {
      ko: '도착하자마자 숙소 연락처에 연락하거나 택시를 잡아야 한다면, 첫날부터 폰이 되는 게 편해요.',
      en: 'If you land and need to reach your housing contact or get a taxi, having a working phone from day one makes things smoother.',
      fr: "Si vous devez joindre votre logement ou prendre un taxi à l'arrivée, avoir un téléphone fonctionnel dès le départ aide.",
    },
  },
  options: [
    {
      name: 'Fizz',
      sub: { ko: '가성비 좋음, eSIM 지원', en: 'Budget-friendly, eSIM supported', fr: 'Économique, eSIM prise en charge' },
      topPick: true,
      meta: [
        { icon: 'coin', label: { ko: '월 $25–35', en: '$25–35/mo', fr: '25–35 $/mois' } },
        { icon: 'plane-departure', label: { ko: '도착 전 개통 가능', en: 'Can activate before arrival', fr: 'Activable avant arrivée' } },
        { icon: 'device-mobile', label: { ko: 'eSIM 가능', en: 'eSIM available', fr: 'eSIM disponible' } },
        { icon: 'bolt', label: { ko: '즉시 설정', en: 'Instant setup', fr: 'Configuration immédiate' } },
      ],
      worksFor: [
        { ko: '비행기 안에서 개통하기', en: 'Activating on the flight', fr: "Activer pendant le vol" },
        { ko: '대부분의 언락폰과 호환', en: 'Works with most unlocked phones', fr: 'Compatible avec la plupart des téléphones déverrouillés' },
        { ko: '유연한 월 단위 요금제', en: 'Flexible monthly plans', fr: 'Forfaits mensuels flexibles' },
      ],
      worthKnowing: [
        { ko: '도시 외곽에선 커버리지가 약할 수 있어요', en: 'Coverage can be weaker outside cities', fr: 'Couverture parfois plus faible hors des villes' },
        { ko: '고객 지원은 앱으로만 가능해요', en: 'Support is app-only', fr: "Le support se fait uniquement via l'application" },
      ],
      recommendNote: {
        ko: '출국 하루 전에 Fizz eSIM을 미리 개통해두는 분이 많아요. 착륙하면 이미 연결되어 있어요.',
        en: 'Many people activate the Fizz eSIM a day before their flight. By the time they land, the phone is already connected.',
        fr: "Beaucoup activent l'eSIM Fizz la veille du vol. À l'atterrissage, le téléphone est déjà connecté.",
      },
    },
    {
      name: 'Public Mobile',
      sub: { ko: '월 비용이 가장 저렴', en: 'Lowest monthly cost', fr: 'Coût mensuel le plus bas' },
      meta: [
        { icon: 'coin', label: { ko: '월 $15–25', en: '$15–25/mo', fr: '15–25 $/mois' } },
        { icon: 'building-store', label: { ko: '실물 SIM, 매장 수령', en: 'Physical SIM, in-store pickup', fr: 'SIM physique, retrait en magasin' } },
        { icon: 'clock', label: { ko: '약 30분 설정', en: 'Setup in about 30 min', fr: 'Configuration en ~30 min' } },
      ],
      worksFor: [
        { ko: '장기 체류 시 가장 저렴한 월 비용', en: 'Lowest monthly cost for longer stays', fr: 'Coût mensuel le plus bas pour les longs séjours' },
        { ko: '부가 옵션 없는 간단한 요금제', en: 'Simple plans without extras', fr: 'Forfaits simples sans extras' },
      ],
      worthKnowing: [
        { ko: 'eSIM이 없어서 도착 후 매장 방문이 필요해요', en: 'No eSIM — need to visit a store after arrival', fr: "Pas d'eSIM — visite en magasin nécessaire après l'arrivée" },
        { ko: '데이터 속도는 대형 통신사보다 느려요', en: 'Data speeds are lower than major carriers', fr: 'Vitesses de données inférieures aux grands opérateurs' },
      ],
    },
    {
      name: 'Bell / Rogers (Airport)',
      sub: { ko: '도착 즉시 이용 가능', en: 'Available immediately at arrivals', fr: 'Disponible dès les arrivées' },
      meta: [
        { icon: 'coin', label: { ko: '월 $50–80', en: '$50–80/mo', fr: '50–80 $/mois' } },
        { icon: 'plane-arrival', label: { ko: 'YUL 도착층에서 이용', en: 'Available at YUL arrivals', fr: 'Disponible aux arrivées YUL' } },
        { icon: 'antenna', label: { ko: '대형 통신사 커버리지', en: 'Major carrier coverage', fr: 'Couverture grand opérateur' } },
      ],
      worksFor: [
        { ko: '미리 아무것도 준비하지 못한 경우', en: "If you didn't set anything up beforehand", fr: "Si vous n'avez rien préparé d'avance" },
        { ko: '대형 통신사의 안정성이 중요한 경우', en: 'If major carrier reliability matters to you', fr: "Si la fiabilité d'un grand opérateur compte pour vous" },
      ],
      worthKnowing: [
        { ko: '예산형 통신사보다 월 비용이 높아요', en: 'Higher monthly cost than budget carriers', fr: 'Coût mensuel plus élevé que les opérateurs économiques' },
        { ko: '나중에 더 저렴한 요금제로 쉽게 바꿀 수 있어요', en: 'Easy to switch to a cheaper plan later', fr: 'Facile de passer à un forfait moins cher plus tard' },
      ],
    },
  ],
  notes: [
    {
      flag: '🇰🇷',
      person: { ko: '워킹홀리데이 · 2024년 8월', en: 'Working Holiday · Aug 2024', fr: 'Vacances-Travail · août 2024' },
      text: {
        ko: '탑승 전에 게이트에서 Fizz eSIM을 개통했어요. 착륙하니 자동으로 연결됐어요. 신경 쓸 게 없었어요.',
        en: "I activated the Fizz eSIM at the gate before boarding. It connected automatically when I landed. Didn't have to think about it.",
        fr: "J'ai activé l'eSIM Fizz à la porte avant d'embarquer. Elle s'est connectée automatiquement à l'atterrissage. Rien à gérer.",
      },
      likes: 31,
    },
    {
      flag: '🇰🇷',
      person: { ko: '유학생 · 2023년 9월', en: 'Student · Sept 2023', fr: 'Étudiant · sept. 2023' },
      text: {
        ko: '공항에서 Bell SIM을 받고 일주일 뒤에 Fizz로 바꿨어요. 단기적으론 비싸지만 마음이 편한 게 저한텐 가치가 있었어요.',
        en: 'I got a Bell SIM at the airport and switched to Fizz after a week. Costs more short-term but the peace of mind was worth it for me.',
        fr: "J'ai pris une SIM Bell à l'aéroport puis suis passé à Fizz après une semaine. Plus cher à court terme, mais la tranquillité en valait la peine.",
      },
      likes: 19,
    },
    {
      flag: '🇨🇦',
      person: { ko: '한국계 캐나다인 영주권자', en: 'Korean-Canadian PR', fr: 'Résident permanent coréen-canadien' },
      text: {
        ko: 'Public Mobile이 제일 싸지만 매장에 가야 해요. 누가 마중 나온다면 SIM은 하루쯤 미뤄도 괜찮아요.',
        en: 'Public Mobile is cheapest but needs a store visit. If someone is picking you up, the SIM can wait a day.',
        fr: "Public Mobile est le moins cher mais demande une visite en magasin. Si quelqu'un vient vous chercher, la SIM peut attendre un jour.",
      },
      likes: 14,
    },
  ],
}

// ─── TAB 2: Bank account ─────────────────────────────────────────────────────

const BANK_TAB: TabContent = {
  intro: {
    what: {
      ko: '캐나다 은행 계좌가 있으면 송금을 받고, 월세를 내고, 시간이 지나면서 신용 기록을 쌓을 수 있어요.',
      en: 'A Canadian bank account lets you receive transfers, pay rent, and build a credit history over time.',
      fr: "Un compte bancaire canadien permet de recevoir des virements, payer le loyer et bâtir un historique de crédit avec le temps.",
    },
    behavior: {
      ko: '첫 주에 여권과 비자를 가지고 지점을 방문하는 분이 많아요. 일부 은행은 첫 해 수수료를 면제하는 새 이민자 패키지가 있어요.',
      en: 'Most people visit a branch in their first week with their passport and permit. Some banks have newcomer packages that waive fees for the first year.',
      fr: "La plupart visitent une succursale la première semaine avec passeport et permis. Certaines banques offrent des programmes nouveaux arrivants sans frais la première année.",
    },
    when: {
      ko: '집주인이 임대 계약 시 무효 수표나 계좌번호를 요구하는 경우가 많아서, 집을 구하기 전에 계좌가 있으면 도움이 돼요.',
      en: 'Landlords often ask for a void cheque or bank account number when signing a lease, so having an account before apartment hunting can be helpful.',
      fr: "Les propriétaires demandent souvent un chèque annulé ou un numéro de compte à la signature du bail, donc avoir un compte avant la recherche aide.",
    },
  },
  options: [
    {
      name: 'RBC',
      sub: { ko: '새 이민자 패키지, 신용 기록 없이 신용카드', en: 'Newcomer package, credit card without credit history', fr: 'Programme nouveaux arrivants, carte sans historique de crédit' },
      topPick: true,
      meta: [
        { icon: 'coin', label: { ko: '1년차 $0 (새 이민자 패키지)', en: '$0 yr 1 (newcomer pkg)', fr: '0 $ an 1 (forfait nouv. arrivants)' } },
        { icon: 'user', label: { ko: '대면, 약 1시간', en: 'In-person, ~1 hr', fr: 'En personne, ~1 h' } },
        { icon: 'language', label: { ko: '일부 지점 한국어 직원', en: 'Korean-speaking staff at some branches', fr: 'Personnel coréanophone dans certaines succursales' } },
      ],
      worksFor: [
        { ko: '캐나다 신용 기록이 없는 분', en: 'People without Canadian credit history', fr: 'Personnes sans historique de crédit canadien' },
        { ko: '처음부터 신용카드를 원하는 분', en: 'Those who want a credit card from day one', fr: 'Ceux qui veulent une carte de crédit dès le départ' },
        { ko: '장기 체류', en: 'Longer-term stays', fr: 'Séjours de longue durée' },
      ],
      worthKnowing: [
        { ko: '1년 이후엔 월 수수료가 붙어요', en: 'Monthly fee applies after year 1', fr: 'Des frais mensuels s\'appliquent après la 1re année' },
        { ko: '직접 방문이 필요해요', en: 'Requires in-person visit', fr: 'Nécessite une visite en personne' },
      ],
      recommendNote: {
        ko: 'RBC 새 이민자 패키지는 첫 해 월 수수료를 면제해주고, 캐나다 신용 기록 없이도 신용카드를 발급해줘요 — 다른 은행이 동시에 제공하지 않는 두 가지예요.',
        en: "RBC's newcomer package waives the monthly fee for the first year and can issue a credit card without a Canadian credit history — two things many other banks don't offer at the same time.",
        fr: "Le programme nouveaux arrivants de RBC exonère les frais la 1re année et peut émettre une carte de crédit sans historique canadien — deux choses rares chez les autres banques.",
      },
    },
    {
      name: 'TD Bank',
      sub: { ko: '폭넓게 이용 가능, 학생 친화적', en: 'Widely available, student-friendly', fr: 'Largement disponible, adapté aux étudiants' },
      meta: [
        { icon: 'coin', label: { ko: '월 약 $10–16', en: '~$10–16/mo', fr: '~10–16 $/mois' } },
        { icon: 'device-laptop', label: { ko: '대면 또는 온라인', en: 'In-person or online', fr: 'En personne ou en ligne' } },
        { icon: 'map-pin', label: { ko: '몬트리올 지점 다수', en: 'Many Montreal branches', fr: 'Nombreuses succursales à Montréal' } },
      ],
      worksFor: [
        { ko: '학생', en: 'Students', fr: 'Étudiants' },
        { ko: 'TD 지점 근처에 사는 분', en: 'Those near a TD branch', fr: "Ceux qui habitent près d'une succursale TD" },
        { ko: '한국 TD를 써본 분께 익숙한 인터페이스', en: 'Familiar interface for those who used TD Korea', fr: 'Interface familière pour ceux qui ont utilisé TD en Corée' },
      ],
      worthKnowing: [
        { ko: '신용 기록 없이 자동 신용카드 발급은 안 돼요', en: 'No automatic credit card without history', fr: 'Pas de carte automatique sans historique' },
        { ko: '풀타임 학생은 수수료가 면제돼요', en: 'Fee waived for full-time students', fr: 'Frais exonérés pour les étudiants à temps plein' },
      ],
    },
    {
      name: 'Desjardins',
      sub: { ko: '퀘벡 지역 협동조합 은행', en: 'Local Québec cooperative bank', fr: 'Banque coopérative locale québécoise' },
      meta: [
        { icon: 'coin', label: { ko: '월 약 $10', en: '~$10/mo', fr: '~10 $/mois' } },
        { icon: 'user', label: { ko: '대면', en: 'In-person', fr: 'En personne' } },
        { icon: 'language', label: { ko: '탄탄한 프랑스어 서비스', en: 'Strong French-language service', fr: 'Solide service en français' } },
      ],
      worksFor: [
        { ko: '프랑스어 사용자', en: 'French speakers', fr: 'Francophones' },
        { ko: '퀘벡에 장기 정착할 계획인 분', en: 'Those planning to stay long-term in Québec', fr: 'Ceux qui prévoient rester longtemps au Québec' },
        { ko: '지역 커뮤니티 뱅킹', en: 'Local community banking', fr: 'Banque communautaire locale' },
      ],
      worthKnowing: [
        { ko: '퀘벡 밖에서는 덜 편리해요', en: 'Less convenient for those outside Québec', fr: 'Moins pratique hors du Québec' },
        { ko: '영어 서비스는 지점마다 달라요', en: 'English service varies by branch', fr: "Le service en anglais varie selon la succursale" },
      ],
    },
    {
      name: 'BMO',
      sub: { ko: '새 이민자 패키지 제공', en: 'Newcomer package available', fr: 'Programme nouveaux arrivants disponible' },
      meta: [
        { icon: 'coin', label: { ko: '1년차 $0 (새 이민자 패키지)', en: '$0 yr 1 (newcomer pkg)', fr: '0 $ an 1 (forfait nouv. arrivants)' } },
        { icon: 'device-laptop', label: { ko: '대면 또는 온라인', en: 'In-person or online', fr: 'En personne ou en ligne' } },
        { icon: 'school', label: { ko: '유학생 중심', en: 'International student focus', fr: 'Axé sur les étudiants internationaux' } },
      ],
      worksFor: [
        { ko: '유학생', en: 'International students', fr: 'Étudiants internationaux' },
        { ko: '첫 해 무료를 원하는 분', en: 'Those who want a no-fee first year', fr: 'Ceux qui veulent une première année sans frais' },
      ],
      worthKnowing: [
        { ko: '신용 기록 없이는 신용카드 발급이 더 제한적이에요', en: 'Credit card access more limited without history', fr: "Accès à la carte plus limité sans historique" },
      ],
    },
  ],
  notes: [
    {
      flag: '🇰🇷',
      person: { ko: '유학생 · 2024년 1월', en: 'Student · Jan 2024', fr: 'Étudiant · janv. 2024' },
      text: {
        ko: '도착 3일째에 RBC에 갔어요. 직원분들이 친절했고 한 시간 정도 걸렸어요. 당일에 직불카드도 받았어요.',
        en: 'I went to RBC on my third day. The staff were patient and the whole process took about an hour. Had a debit card the same day.',
        fr: "Je suis allé à RBC le 3e jour. Le personnel était patient et tout a pris environ une heure. J'ai eu une carte de débit le jour même.",
      },
      likes: 28,
    },
    {
      flag: '🇰🇷',
      person: { ko: '워킹홀리데이 · 2023년 10월', en: 'Working Holiday · Oct 2023', fr: 'Vacances-Travail · oct. 2023' },
      text: {
        ko: '프랑스어를 연습하고 싶어서 Desjardins를 골랐어요. 일부 지점은 새 이민자에게 정말 친절해요.',
        en: 'I picked Desjardins because I wanted to practice French. Some branches are very helpful with newcomers.',
        fr: "J'ai choisi Desjardins pour pratiquer mon français. Certaines succursales sont très accueillantes avec les nouveaux arrivants.",
      },
      likes: 16,
    },
    {
      flag: '🇫🇷',
      person: { ko: '프랑스 출신 영주권자', en: 'French PR', fr: 'Résident permanent français' },
      text: {
        ko: 'Desjardins가 가장 현지스러웠어요. 몬트리올에서 일상 프랑스어 생활엔 잘 맞았어요.',
        en: 'Desjardins felt the most local. For everyday French life in Montreal it worked well.',
        fr: 'Desjardins faisait le plus local. Pour la vie quotidienne en français à Montréal, ça marchait bien.',
      },
      likes: 11,
    },
  ],
}

// ─── TAB 3: Transit ──────────────────────────────────────────────────────────

const TRANSIT_TAB: TabContent = {
  intro: {
    what: {
      ko: '몬트리올 대중교통(STM)은 지하철과 버스로 도시 대부분을 커버해요. OPUS 카드는 둘 다 쓰는 충전식 교통 카드예요.',
      en: "Montréal's public transit (STM) covers most of the city with metro and buses. The OPUS card is the rechargeable transit card used for both.",
      fr: "Le transport public de Montréal (STM) couvre la majorité de la ville avec le métro et les bus. La carte OPUS est la carte rechargeable utilisée pour les deux.",
    },
    behavior: {
      ko: '도착 첫 며칠 안에 공항이나 지하철역에서 OPUS 카드를 받는 분이 많아요. 따뜻한 계절엔 자전거나 도보를 선호하는 분도 있어요.',
      en: 'Most people pick up an OPUS card at the airport or a metro station in their first few days. Some prefer cycling or walking in warmer months.',
      fr: "La plupart prennent une carte OPUS à l'aéroport ou en station de métro dans les premiers jours. Certains préfèrent le vélo ou la marche aux beaux jours.",
    },
    when: {
      ko: '차가 없다면 첫날부터 지하철이나 버스를 쓰게 돼요. 공항 버스(747)는 신용카드를 받으니 도착 당일엔 OPUS가 급하진 않아요.',
      en: "Unless you have a car, you'll use the metro or bus from day one. The airport bus (747) accepts credit cards, so an OPUS card isn't urgent on arrival day.",
      fr: "Sauf si vous avez une voiture, vous prendrez le métro ou le bus dès le premier jour. Le bus 747 accepte la carte de crédit, donc l'OPUS n'est pas urgent à l'arrivée.",
    },
  },
  options: [
    {
      name: 'STM Monthly Pass + OPUS Card',
      sub: { ko: '지하철·버스 무제한', en: 'Unlimited metro and bus', fr: 'Métro et bus illimités' },
      topPick: true,
      meta: [
        { icon: 'coin', label: { ko: '월 $97 (일반) / $56 (학생)', en: '$97/mo (regular) or $56/mo (student)', fr: '97 $/mois (régulier) ou 56 $/mois (étudiant)' } },
        { icon: 'credit-card', label: { ko: 'OPUS 카드 1회 $6', en: 'OPUS card $6 one-time', fr: 'Carte OPUS 6 $ une fois' } },
        { icon: 'map-pin', label: { ko: '지하철역에서 구매', en: 'Available at metro stations', fr: 'Disponible en station de métro' } },
      ],
      worksFor: [
        { ko: '매일 통근하는 분', en: 'Daily commuters', fr: 'Navetteurs quotidiens' },
        { ko: '학생 (자격 시 50% 할인)', en: 'Students (50% discount with eligible status)', fr: 'Étudiants (50 % de rabais selon le statut)' },
        { ko: '지하철 노선 근처에 사는 분', en: 'Those living near a metro line', fr: "Ceux qui habitent près d'une ligne de métro" },
      ],
      worthKnowing: [
        { ko: '월 패스는 매월 1일에 리셋돼요 — 월말에 사면 한 달을 다 못 써요', en: "Monthly pass resets on the 1st — buy toward the end of a month and you'll get less than a full month", fr: "La passe mensuelle se réinitialise le 1er — achetée en fin de mois, vous aurez moins d'un mois complet" },
        { ko: '학생 요금은 재학 증명이 필요해요', en: 'Student rate requires enrollment verification', fr: "Le tarif étudiant exige une preuve d'inscription" },
      ],
      recommendNote: {
        ko: '학생 요금은 일반 요금의 절반 정도예요. 학교나 프로그램이 자격이 되는지 확인해볼 만해요 — 의외로 되는 경우가 많아요.',
        en: 'The student rate is about half the regular price. Worth checking if your school or program qualifies — many do.',
        fr: "Le tarif étudiant est environ moitié prix. Vérifiez si votre école ou programme y a droit — beaucoup y ont droit.",
      },
    },
    {
      name: 'OPUS Pay-Per-Ride',
      sub: { ko: '필요할 때마다 충전, 월 약정 없음', en: 'Load trips as needed, no monthly commitment', fr: 'Recharge à la demande, sans engagement mensuel' },
      meta: [
        { icon: 'coin', label: { ko: '회당 약 $3.75', en: '~$3.75/trip', fr: '~3,75 $/trajet' } },
        { icon: 'calendar-off', label: { ko: '월 약정 없음', en: 'No monthly commitment', fr: 'Sans engagement mensuel' } },
        { icon: 'credit-card', label: { ko: '동일한 OPUS 카드', en: 'Same OPUS card', fr: 'Même carte OPUS' } },
      ],
      worksFor: [
        { ko: '가끔 이용하는 분', en: 'Infrequent riders', fr: 'Usagers occasionnels' },
        { ko: '월 패스 결정 전 첫 주', en: 'First week before committing to a monthly pass', fr: "Première semaine avant de choisir une passe mensuelle" },
        { ko: '간헐적인 이동', en: 'Occasional trips', fr: 'Trajets occasionnels' },
      ],
      worthKnowing: [
        { ko: '매일 쓰면 금방 쌓여요 — 약 26회부터는 월 패스가 더 저렴해요', en: 'Adds up quickly if used daily — monthly pass becomes cheaper after about 26 trips', fr: 'Ça monte vite au quotidien — la passe mensuelle devient moins chère après ~26 trajets' },
      ],
    },
    {
      name: 'BIXI (Bike Share)',
      sub: { ko: '몬트리올 중심부 도크형 자전거', en: 'Dock-to-dock bikes across central Montréal', fr: 'Vélos en libre-service au centre de Montréal' },
      meta: [
        { icon: 'coin', label: { ko: '월 약 $27 (시즌) / 일 약 $7', en: '~$27/mo (seasonal) or ~$7/day', fr: '~27 $/mois (saison) ou ~7 $/jour' } },
        { icon: 'calendar', label: { ko: '4월–11월', en: 'April–November', fr: 'Avril–novembre' } },
        { icon: 'device-mobile', label: { ko: '앱 기반', en: 'App-based', fr: 'Via application' } },
      ],
      worksFor: [
        { ko: 'Plateau, Mile End, 다운타운 단거리', en: 'Short trips in Plateau, Mile End, downtown', fr: 'Courts trajets au Plateau, Mile End, centre-ville' },
        { ko: '자전거 타기를 즐기는 분', en: 'Those who enjoy cycling', fr: 'Ceux qui aiment le vélo' },
        { ko: '지하철과 잘 어울리는 보완책', en: 'Nice complement to metro', fr: 'Beau complément au métro' },
      ],
      worthKnowing: [
        { ko: '계절제 — 겨울엔 운영 안 해요', en: 'Seasonal — not available in winter', fr: "Saisonnier — pas disponible l'hiver" },
        { ko: '헬멧은 제공되지 않아요', en: 'Helmets not provided', fr: 'Casques non fournis' },
      ],
    },
    {
      name: 'Airport Bus 747',
      sub: { ko: 'YUL ↔ 다운타운, 24시간 운행', en: 'YUL to downtown, runs 24/7', fr: 'YUL au centre-ville, 24h/24' },
      meta: [
        { icon: 'coin', label: { ko: '회당 $11', en: '$11 per ride', fr: '11 $ par trajet' } },
        { icon: 'credit-card', label: { ko: '신용카드 가능 (OPUS 불필요)', en: 'Accepts credit card (no OPUS needed)', fr: "Carte de crédit acceptée (OPUS non requis)" } },
        { icon: 'clock', label: { ko: '20–30분 간격', en: 'Every 20–30 min', fr: 'Toutes les 20–30 min' } },
      ],
      worksFor: [
        { ko: '도착 당일 공항에서 이동', en: 'Getting from the airport on arrival', fr: "Se déplacer depuis l'aéroport à l'arrivée" },
        { ko: '준비 없이 간단하게', en: 'Simple, no setup required', fr: 'Simple, aucune configuration' },
      ],
      worthKnowing: [
        { ko: '교통 상황에 따라 45–70분 걸려요', en: 'Takes 45–70 min depending on traffic', fr: 'Prend 45–70 min selon la circulation' },
        { ko: '다운타운 여러 정류장에 서요 — 도어투도어는 아니에요', en: 'Stops at several downtown points, not door-to-door', fr: "S'arrête à plusieurs points au centre-ville, pas porte-à-porte" },
      ],
    },
  ],
  notes: [
    {
      flag: '🇰🇷',
      person: { ko: '유학생 · 2023년 9월', en: 'Student · Sept 2023', fr: 'Étudiant · sept. 2023' },
      text: {
        ko: '공항에서 747 버스가 편했어요. 카드로 결제했고 OPUS도 필요 없었어요. 다음 날 지하철역에서 OPUS를 받았어요.',
        en: 'The 747 bus was easy from the airport. I paid with my card, no OPUS needed. Got an OPUS the next day at the metro station.',
        fr: "Le bus 747 était facile depuis l'aéroport. J'ai payé par carte, sans OPUS. J'ai pris une OPUS le lendemain en station.",
      },
      likes: 24,
    },
    {
      flag: '🇰🇷',
      person: { ko: '워킹홀리데이 · 2024년 6월', en: 'Working Holiday · June 2024', fr: 'Vacances-Travail · juin 2024' },
      text: {
        ko: '여름엔 BIXI가 정말 좋아요. 5월부터 9월까지 지하철을 거의 안 탔어요.',
        en: 'BIXI in summer is great. I barely used the metro from May to September.',
        fr: "Le BIXI l'été, c'est génial. J'ai à peine pris le métro de mai à septembre.",
      },
      likes: 18,
    },
    {
      flag: '🇨🇦',
      person: { ko: '한국계 캐나다인', en: 'Korean-Canadian', fr: 'Coréen-Canadien' },
      text: {
        ko: '지하철을 하루 한 번 이상 탄다면 월 패스를 사세요. 계산해보면 금방 이득이에요.',
        en: 'Get the monthly pass if you\'re taking the metro more than once a day. The math works out pretty quickly.',
        fr: "Prenez la passe mensuelle si vous faites le métro plus d'une fois par jour. Le calcul est vite rentable.",
      },
      likes: 15,
    },
  ],
}

// ─── TAB 4: Temporary housing ────────────────────────────────────────────────

const HOUSING_TAB: TabContent = {
  intro: {
    what: {
      ko: '장기 아파트를 찾는 동안 처음 몇 주는 임시 거처에서 지내는 분이 대부분이에요.',
      en: 'Most people stay in temporary housing for the first few weeks while searching for a longer-term apartment.',
      fr: "La plupart logent en hébergement temporaire les premières semaines, le temps de chercher un appartement à long terme.",
    },
    behavior: {
      ko: '도착 전에 Airbnb, 호스텔, 단기 서블렛을 미리 잡는 분도 있고, 친구 집이나 학교 홈스테이에 머무는 분도 있어요.',
      en: 'Some people arrange something before arriving — an Airbnb, a hostel, or a short-term sublet. Others stay with friends or in a homestay through their school.',
      fr: "Certains réservent avant d'arriver — Airbnb, auberge ou sous-location courte. D'autres logent chez des amis ou en famille d'accueil via leur école.",
    },
    when: {
      ko: '도착 전에 확정된 곳이 있으면 좋아요. 영구 아파트를 찾는 데 몬트리올 현지에서 보통 2–4주 걸리고, 원격으론 훨씬 어려워요.',
      en: "You'll want somewhere confirmed before you land. Finding a permanent apartment usually takes 2–4 weeks from Montréal — it's much harder to do remotely.",
      fr: "Mieux vaut avoir un endroit confirmé avant d'atterrir. Trouver un appartement permanent prend en général 2–4 semaines sur place — bien plus difficile à distance.",
    },
  },
  options: [
    {
      name: 'Airbnb / Short-term rental',
      sub: { ko: '개인 공간, 유연한 날짜', en: 'Private space, flexible dates', fr: 'Espace privé, dates flexibles' },
      topPick: true,
      meta: [
        { icon: 'coin', label: { ko: '2주 약 $800–1,400', en: '~$800–1,400 for 2 weeks', fr: '~800–1 400 $ pour 2 semaines' } },
        { icon: 'plane-departure', label: { ko: '도착 전 예약', en: 'Book before arrival', fr: 'Réserver avant arrivée' } },
        { icon: 'home', label: { ko: '은행 주소로 사용 가능', en: 'Address usable for banking', fr: 'Adresse utilisable pour la banque' } },
      ],
      worksFor: [
        { ko: '개인 공간을 원하는 분', en: 'Those who want private space', fr: 'Ceux qui veulent un espace privé' },
        { ko: '은행 계좌 개설 시 주소로 활용', en: 'Using the address for bank account setup', fr: "Utiliser l'adresse pour ouvrir un compte" },
        { ko: '아파트 검색이 길어질 때 연장 가능', en: 'Flexibility to extend if apartment search takes longer', fr: 'Souplesse pour prolonger si la recherche traîne' },
      ],
      worthKnowing: [
        { ko: '호스텔보다 비싸요', en: 'More expensive than hostels', fr: 'Plus cher que les auberges' },
        { ko: '일부 집주인은 Airbnb를 검증된 주소로 인정하지 않아요', en: "Some landlords don't count Airbnb as a verified address for lease applications", fr: "Certains propriétaires n'acceptent pas Airbnb comme adresse vérifiée pour un bail" },
      ],
      recommendNote: {
        ko: 'Airbnb 주소로 은행 계좌를 여는 분이 많아요. 예약 확인 이메일이 주소 증명으로 보통 인정돼요.',
        en: 'Many people use their Airbnb address when opening a bank account. The confirmation email is usually accepted as proof of address.',
        fr: "Beaucoup utilisent leur adresse Airbnb pour ouvrir un compte. Le courriel de confirmation est en général accepté comme preuve d'adresse.",
      },
    },
    {
      name: 'Hostel / Student Residence',
      sub: { ko: '저예산 옵션, 사교적 분위기', en: 'Budget option, social atmosphere', fr: 'Option économique, ambiance conviviale' },
      meta: [
        { icon: 'coin', label: { ko: '하루 약 $35–60', en: '~$35–60/night', fr: '~35–60 $/nuit' } },
        { icon: 'plane-departure', label: { ko: '도착 전 예약', en: 'Book before arrival', fr: 'Réserver avant arrivée' } },
        { icon: 'calendar', label: { ko: '주·월 단위 요금도 있음', en: 'Some offer weekly/monthly rates', fr: 'Tarifs hebdo/mensuels parfois offerts' } },
      ],
      worksFor: [
        { ko: '예산을 아끼는 분', en: 'Budget-conscious arrivals', fr: 'Nouveaux arrivants soucieux du budget' },
        { ko: '다른 새 이민자를 만나고 싶은 분', en: 'Those who want to meet other newcomers', fr: "Ceux qui veulent rencontrer d'autres nouveaux arrivants" },
        { ko: '1–2주 단기 체류', en: 'Short stays of 1–2 weeks', fr: 'Séjours courts de 1–2 semaines' },
      ],
      worthKnowing: [
        { ko: '공용 공간 — 프라이버시가 적어요', en: 'Shared spaces — less privacy', fr: "Espaces partagés — moins d'intimité" },
        { ko: '주소가 공식 서류에 인정 안 될 수 있어요', en: 'Address may not be accepted for official documents', fr: "L'adresse peut ne pas être acceptée pour les documents officiels" },
      ],
    },
    {
      name: 'Facebook / Kijiji Short-term Sublet',
      sub: { ko: '현지 호스트의 가구 포함 방', en: 'Furnished rooms from local hosts', fr: 'Chambres meublées chez des hôtes locaux' },
      meta: [
        { icon: 'coin', label: { ko: '월 약 $700–1,200', en: '~$700–1,200/mo', fr: '~700–1 200 $/mois' } },
        { icon: 'map-pin', label: { ko: '몬트리올 현지에서 찾기 좋음', en: 'Best found from Montréal', fr: 'Plus facile à trouver sur place' } },
        { icon: 'calendar', label: { ko: '유연한 조건', en: 'Flexible terms', fr: 'Conditions flexibles' } },
      ],
      worksFor: [
        { ko: '오래 검색하는 경우 (1–2개월)', en: 'Longer searches (1–2 months)', fr: 'Recherches plus longues (1–2 mois)' },
        { ko: '검증을 도와줄 현지 지인이 있는 분', en: 'Those with a local contact to help vet', fr: "Ceux qui ont un contact local pour vérifier" },
        { ko: 'Airbnb보다 저렴', en: 'Lower cost than Airbnb', fr: "Moins cher qu'Airbnb" },
      ],
      worthKnowing: [
        { ko: '추천인 없이 원격으로 잡기는 어려워요', en: 'Harder to arrange remotely without a reference', fr: 'Plus difficile à distance sans référence' },
        { ko: '꼼꼼히 확인하세요 — 사기 매물도 있어요', en: 'Vet carefully — some listings are scams', fr: 'Vérifiez bien — certaines annonces sont frauduleuses' },
      ],
    },
    {
      name: 'School Residence / Homestay',
      sub: { ko: '학교나 프로그램을 통해', en: 'Through your school or program', fr: 'Via votre école ou programme' },
      meta: [
        { icon: 'school', label: { ko: '학교마다 다름', en: 'Varies by school', fr: "Variable selon l'école" } },
        { icon: 'plane-departure', label: { ko: '보통 도착 전 준비', en: 'Usually arranged before arrival', fr: "Habituellement avant l'arrivée" } },
        { icon: 'heart-handshake', label: { ko: '체계적인 지원', en: 'Structured support', fr: 'Soutien encadré' } },
      ],
      worksFor: [
        { ko: '주거 서비스가 있는 학교 재학생', en: 'Those enrolled in a school with housing services', fr: "Inscrits dans une école offrant des services de logement" },
        { ko: '안정적인 착지를 원하는 첫 방문자', en: 'First-time arrivals who want a supported landing', fr: 'Primo-arrivants qui veulent un atterrissage encadré' },
      ],
      worthKnowing: [
        { ko: '자리가 제한적이에요 — 일찍 신청하세요', en: 'Usually limited availability — apply early', fr: 'Places souvent limitées — postulez tôt' },
        { ko: '중심부에 있지 않은 경우도 많아요', en: 'Not always in central locations', fr: 'Pas toujours en zone centrale' },
      ],
    },
  ],
  notes: [
    {
      flag: '🇰🇷',
      person: { ko: '유학생 · 2023년 8월', en: 'Student · Aug 2023', fr: 'Étudiant · août 2023' },
      text: {
        ko: '오기 전에 Airbnb를 3주 예약했어요. 3일째에 그 주소로 은행 계좌를 열었는데 문제없었어요.',
        en: 'I booked an Airbnb for 3 weeks before coming. Used that address for my bank account on day 3. It worked fine.',
        fr: "J'ai réservé un Airbnb 3 semaines avant de venir. J'ai utilisé l'adresse pour mon compte le 3e jour. Aucun souci.",
      },
      likes: 26,
    },
    {
      flag: '🇰🇷',
      person: { ko: '워킹홀리데이 · 2023년 11월', en: 'Working Holiday · Nov 2023', fr: 'Vacances-Travail · nov. 2023' },
      text: {
        ko: '호스텔에서 일주일 지내고 Facebook에서 서블렛을 찾았어요. 호스텔도 괜찮았어요 — 여행자들도 만나고 적응에 도움이 됐어요.',
        en: 'I stayed at a hostel for a week and found a sublet on Facebook. The hostel was fine — met other travellers and it helped me get oriented.',
        fr: "J'ai logé en auberge une semaine puis trouvé une sous-location sur Facebook. L'auberge était bien — j'ai rencontré des voyageurs et ça m'a aidé à me repérer.",
      },
      likes: 17,
    },
    {
      flag: '🇫🇷',
      person: { ko: '프랑스 출신 유학생', en: 'French Student', fr: 'Étudiant français' },
      text: {
        ko: '학교에 홈스테이 프로그램이 있었어요. 비용은 더 들었지만 첫 달에 현지 호스트가 있다는 게 큰 차이를 만들었어요.',
        en: 'My school had a homestay program. It cost more but having a local host the first month made a big difference.',
        fr: "Mon école avait un programme de famille d'accueil. Plus cher, mais avoir un hôte local le premier mois a fait une grande différence.",
      },
      likes: 13,
    },
  ],
}

// ─── TAB 5: SIN number ───────────────────────────────────────────────────────

const SIN_TAB: TabContent = {
  intro: {
    what: {
      ko: 'SIN(사회보험번호)은 캐나다에서 취업, 세금, 일부 정부 서비스에 쓰는 9자리 번호예요.',
      en: 'A Social Insurance Number (SIN) is a 9-digit number used for employment, taxes, and some government services in Canada.',
      fr: "Le numéro d'assurance sociale (NAS) est un numéro à 9 chiffres utilisé pour l'emploi, les impôts et certains services gouvernementaux au Canada.",
    },
    behavior: {
      ko: '도착 후 첫 몇 주 안에 SIN을 받는 분이 많아요 — 곧 일이나 학교를 시작하면 더 일찍 받기도 해요.',
      en: "Most people get their SIN within the first few weeks of arriving — often earlier if they're starting work or school soon.",
      fr: "La plupart obtiennent leur NAS dans les premières semaines — souvent plus tôt s'ils commencent bientôt à travailler ou étudier.",
    },
    when: {
      ko: '첫 출근 전에 SIN이 필요해요. 학생은 파트타임 일을 하지 않는 한 덜 급해요.',
      en: "You'll need a SIN before your first day of work. For students, it's less time-sensitive unless you have a part-time job.",
      fr: "Vous aurez besoin d'un NAS avant votre premier jour de travail. Pour les étudiants, c'est moins urgent sauf emploi à temps partiel.",
    },
  },
  options: [
    {
      name: 'In-person at Service Canada',
      sub: { ko: '당일 발급, 대기 없음', en: 'Issued same day, no waiting', fr: 'Émis le jour même, sans attente' },
      topPick: true,
      meta: [
        { icon: 'coin', label: { ko: '무료', en: 'Free', fr: 'Gratuit' } },
        { icon: 'bolt', label: { ko: '당일 처리', en: 'Same-day processing', fr: 'Traitement le jour même' } },
        { icon: 'id', label: { ko: '여권 + 학생/취업 비자', en: 'Passport + study/work permit required', fr: "Passeport + permis d'études/travail requis" } },
        { icon: 'calendar-off', label: { ko: '예약 불필요', en: 'No appointment needed', fr: 'Sans rendez-vous' } },
      ],
      worksFor: [
        { ko: 'SIN이 빨리 필요한 누구나', en: 'Anyone who needs their SIN quickly', fr: 'Quiconque a besoin de son NAS rapidement' },
        { ko: '직접 확인받고 싶은 분', en: 'Those who want it confirmed in person', fr: 'Ceux qui veulent une confirmation en personne' },
      ],
      worthKnowing: [
        { ko: 'Service Canada 사무소 방문이 필요해요 — 몬트리올에 여러 곳 있어요', en: "You'll need to visit a Service Canada office — there are several in Montréal", fr: 'Il faut visiter un bureau Service Canada — il y en a plusieurs à Montréal' },
        { ko: '여권과 비자를 챙기세요', en: 'Bring your passport and permit', fr: 'Apportez votre passeport et votre permis' },
      ],
      recommendNote: {
        ko: '직접 가는 절차는 간단해요 — 보통 45분 안에 끝나요. 대부분의 사무소는 예약이 필요 없어요.',
        en: 'The in-person process is straightforward — most people are in and out within 45 minutes. No appointment needed at most locations.',
        fr: "La démarche en personne est simple — la plupart en ont pour 45 minutes. Sans rendez-vous dans la plupart des bureaux.",
      },
    },
    {
      name: 'Online Application',
      sub: { ko: '집에서 신청, 우편으로 수령', en: 'Apply from home, delivered by mail', fr: 'Demande à domicile, livraison par la poste' },
      meta: [
        { icon: 'coin', label: { ko: '무료', en: 'Free', fr: 'Gratuit' } },
        { icon: 'clock', label: { ko: '2–4주 처리', en: '2–4 weeks processing', fr: 'Traitement 2–4 semaines' } },
        { icon: 'device-laptop', label: { ko: 'canada.ca에서 신청', en: 'Applied at canada.ca', fr: 'Demande sur canada.ca' } },
      ],
      worksFor: [
        { ko: '당장 일하지 않는 분', en: "Those who aren't working right away", fr: 'Ceux qui ne travaillent pas tout de suite' },
        { ko: '사무소 방문을 피하고 싶은 분', en: 'Those who prefer not to visit an office', fr: 'Ceux qui préfèrent éviter le déplacement' },
      ],
      worthKnowing: [
        { ko: '처리에 2–4주 걸려요', en: 'Processing takes 2–4 weeks', fr: 'Le traitement prend 2–4 semaines' },
        { ko: 'SIN 번호를 바로 받지는 못해요', en: "You won't have a SIN number immediately", fr: "Vous n'aurez pas de NAS immédiatement" },
      ],
    },
  ],
  notes: [
    {
      flag: '🇰🇷',
      person: { ko: '워킹홀리데이 · 2024년 7월', en: 'Working Holiday · July 2024', fr: 'Vacances-Travail · juil. 2024' },
      text: {
        ko: '도착 둘째 날에 Service Canada에 갔어요. 한 시간도 안 돼서 SIN 번호를 손에 들고 나왔어요. 정말 쉬웠어요.',
        en: 'I went to Service Canada on my second day. I was out in under an hour with my SIN number in hand. Very easy.',
        fr: "Je suis allé à Service Canada le 2e jour. J'en suis ressorti en moins d'une heure avec mon NAS en main. Très facile.",
      },
      likes: 35,
    },
    {
      flag: '🇰🇷',
      person: { ko: '유학생 · 2023년 9월', en: 'Student · Sept 2023', fr: 'Étudiant · sept. 2023' },
      text: {
        ko: '처음엔 온라인으로 신청했어요. 3주 걸려서 파트타임 시작을 놓칠 뻔했어요. 가능하면 직접 가는 게 빨라요.',
        en: 'I applied online at first. It took 3 weeks and I almost missed starting my part-time job. Going in person is faster if you can.',
        fr: "J'ai d'abord fait la demande en ligne. Ça a pris 3 semaines et j'ai failli rater le début de mon emploi. En personne, c'est plus rapide si vous le pouvez.",
      },
      likes: 22,
    },
    {
      flag: '🇨🇦',
      person: { ko: '한국계 캐나다인', en: 'Korean-Canadian', fr: 'Coréen-Canadien' },
      text: {
        ko: '대부분의 사무소는 예약 없이 가도 괜찮아요. 저는 예약이 필요했던 적이 없어요.',
        en: "Walk-in is fine at most offices. I've never needed an appointment.",
        fr: "Sans rendez-vous, ça va dans la plupart des bureaux. Je n'en ai jamais eu besoin.",
      },
      likes: 12,
    },
  ],
}

// ─── TAB 6: Driver's licence ─────────────────────────────────────────────────

const LICENCE_TAB: TabContent = {
  intro: {
    what: {
      ko: '한국 운전면허가 있다면 추가 시험 없이 퀘벡 면허로 교환할 수 있는 경우가 있어요.',
      en: 'If you have a Korean driver\'s licence, you may be able to exchange it for a Québec licence without taking additional tests.',
      fr: "Si vous avez un permis de conduire coréen, vous pourriez l'échanger contre un permis québécois sans examens supplémentaires.",
    },
    behavior: {
      ko: '운전하는 한국 새 이민자 중 첫 몇 달 안에 이걸 하는 분이 많아요. 교환은 서류 몇 가지를 가지고 SAAQ 사무소를 방문하면 돼요.',
      en: 'Many Korean newcomers who drive choose to do this in their first few months. The exchange process requires a visit to a SAAQ office with a few documents.',
      fr: "Beaucoup de nouveaux arrivants coréens qui conduisent le font dans les premiers mois. L'échange se fait en visitant un bureau SAAQ avec quelques documents.",
    },
    when: {
      ko: '한국 면허는 도착 후 일정 기간 퀘벡에서 유효해요 — 정확한 기간은 이민 신분에 따라 달라요. 교환은 언제든 가능하지만 첫 몇 달 안에 하는 분이 많아요.',
      en: 'Your Korean licence is valid in Québec for a period after arrival — the exact duration depends on your immigration status. The exchange can be done at any point, but many people do it within their first few months.',
      fr: "Votre permis coréen est valide au Québec pendant une période après l'arrivée — la durée exacte dépend de votre statut. L'échange peut se faire à tout moment, mais beaucoup le font dans les premiers mois.",
    },
  },
  options: [
    {
      name: 'Licence Exchange at SAAQ',
      sub: { ko: '한국 면허 → 퀘벡 면허, 재시험 없음', en: 'Korean licence → Québec licence, no retesting', fr: 'Permis coréen → québécois, sans réexamen' },
      topPick: true,
      meta: [
        { icon: 'coin', label: { ko: '약 $30–100', en: '~$30–100 fee', fr: '~30–100 $ de frais' } },
        { icon: 'user', label: { ko: 'SAAQ 대면', en: 'In-person at SAAQ', fr: 'En personne à la SAAQ' } },
        { icon: 'calendar', label: { ko: '예약 권장', en: 'Appointment recommended', fr: 'Rendez-vous recommandé' } },
        { icon: 'file-text', label: { ko: '여권 + 한국 면허 + 공증 번역', en: 'Passport + Korean licence + certified translation', fr: 'Passeport + permis coréen + traduction certifiée' } },
      ],
      worksFor: [
        { ko: '운전할 계획이 있고 유효한 한국 면허가 있는 분', en: 'Anyone with a valid Korean licence who plans to drive', fr: 'Quiconque a un permis coréen valide et prévoit conduire' },
        { ko: '퀘벡 신분증을 원하는 분', en: 'Those who want a Québec ID card', fr: "Ceux qui veulent une pièce d'identité québécoise" },
      ],
      worthKnowing: [
        { ko: '한국 면허의 공증 프랑스어 번역본이 보통 필요해요', en: 'A certified French translation of your Korean licence is typically required', fr: 'Une traduction française certifiée du permis coréen est en général requise' },
        { ko: 'SAAQ 사무소는 붐빌 수 있어요 — 미리 예약하면 시간이 절약돼요', en: 'SAAQ offices can be busy — booking in advance saves time', fr: 'Les bureaux SAAQ peuvent être achalandés — réserver à l\'avance fait gagner du temps' },
      ],
      recommendNote: {
        ko: '한국 운전면허는 교환 대상으로 인정돼요 — 필기나 도로 시험이 없어요. 예약과 서류만 있으면 돼요.',
        en: 'A Korean driver\'s licence is recognized for exchange — no written or road tests required. Just an appointment and the documents.',
        fr: "Le permis coréen est reconnu pour l'échange — sans examen théorique ni pratique. Juste un rendez-vous et les documents.",
      },
    },
    {
      name: 'International Driving Permit (IDP)',
      sub: { ko: '출국 전 한국에서 발급', en: 'Get this in Korea before you leave', fr: 'À obtenir en Corée avant le départ' },
      meta: [
        { icon: 'coin', label: { ko: '한국에서 약 ₩8,500', en: '~₩8,500 in Korea', fr: '~8 500 ₩ en Corée' } },
        { icon: 'calendar', label: { ko: '1년 유효', en: 'Valid for 1 year', fr: 'Valide 1 an' } },
        { icon: 'id', label: { ko: '한국 면허의 보조 서류', en: 'Supplement to your Korean licence', fr: 'Complément à votre permis coréen' } },
      ],
      worksFor: [
        { ko: '도착하자마자 운전이 필요한 분', en: 'Those who need to drive immediately on arrival', fr: "Ceux qui doivent conduire dès l'arrivée" },
        { ko: 'SAAQ 교환을 기다리는 동안의 보조 수단', en: 'As a supplement while waiting for the SAAQ exchange', fr: "Comme complément en attendant l'échange SAAQ" },
      ],
      worthKnowing: [
        { ko: 'IDP만으로는 장기적으로 퀘벡 면허를 대체하지 못해요', en: 'An IDP alone is not a substitute for a Québec licence long-term', fr: "Un PCI seul ne remplace pas un permis québécois à long terme" },
        { ko: '출국 전 한국에서 발급받아야 해요', en: 'Needs to be obtained in Korea before departure', fr: 'À obtenir en Corée avant le départ' },
      ],
    },
  ],
  notes: [
    {
      flag: '🇰🇷',
      person: { ko: '워킹홀리데이 · 2024년 5월', en: 'Working Holiday · May 2024', fr: 'Vacances-Travail · mai 2024' },
      text: {
        ko: '둘째 달에 SAAQ 교환을 했어요. 온라인 예약이 쉬웠어요. 번역은 공증사무소에서 $40 정도 들었어요.',
        en: 'I did the SAAQ exchange in my second month. The appointment was easy to book online. The translation cost me about $40 at a notary.',
        fr: "J'ai fait l'échange SAAQ le 2e mois. Le rendez-vous était facile à prendre en ligne. La traduction m'a coûté ~40 $ chez un notaire.",
      },
      likes: 21,
    },
    {
      flag: '🇰🇷',
      person: { ko: '유학생 · 2023년 12월', en: 'Student · Dec 2023', fr: 'Étudiant · déc. 2023' },
      text: {
        ko: '출국 전에 한국에서 IDP를 받았어요. SAAQ 교환을 정리하는 동안 첫 몇 달간 도움이 됐어요.',
        en: 'I got an IDP in Korea before leaving. It helped for the first few months while I waited to sort out the SAAQ exchange.',
        fr: "J'ai pris un PCI en Corée avant de partir. Ça m'a aidé les premiers mois en attendant de régler l'échange SAAQ.",
      },
      likes: 16,
    },
    {
      flag: '🇰🇷',
      person: { ko: '영주권자 · 2024년 2월', en: 'PR · Feb 2024', fr: 'Résident permanent · févr. 2024' },
      text: {
        ko: 'Sherbrooke에 있는 SAAQ 사무소는 간단했어요. 서류만 다 갖추니 전체가 20분 정도 걸렸어요.',
        en: 'The SAAQ office on Sherbrooke was straightforward. The whole thing took about 20 minutes once I had all my documents.',
        fr: "Le bureau SAAQ sur Sherbrooke était simple. Tout a pris environ 20 minutes une fois tous mes documents en main.",
      },
      likes: 11,
    },
  ],
}

// ─── TAB 7: Language programs ────────────────────────────────────────────────

const LANGUAGE_TAB: TabContent = {
  intro: {
    what: {
      ko: '몬트리올은 프랑스어와 영어가 모두 널리 쓰이는 이중언어 도시예요. 언어 프로그램은 무료 정부 과정부터 교환 모임, 사설 수업까지 다양해요.',
      en: 'Montréal is a bilingual city — both French and English are widely spoken. Language programs range from free government courses to exchange meetups and private classes.',
      fr: "Montréal est une ville bilingue — le français et l'anglais y sont tous deux courants. Les programmes vont des cours gouvernementaux gratuits aux rencontres d'échange et cours privés.",
    },
    behavior: {
      ko: '첫 달에 언어 교환이나 회화 모임에 참여하는 분이 많아요. 프랑스어 향상이 우선이라면 SANA(무료 정부 프랑스어 과정)에 등록하는 분도 있어요.',
      en: 'Many newcomers join a language exchange or conversation group in their first month. Some enroll in SANA (free government French classes) if improving French is a priority.',
      fr: "Beaucoup rejoignent un échange linguistique ou un groupe de conversation le premier mois. Certains s'inscrivent à SANA (cours de français gratuits) si améliorer leur français est prioritaire.",
    },
    when: {
      ko: '언어 프로그램엔 마감이 없어요. 대부분 자리가 잡히면 시작해요 — 첫 주에 시작하는 분도, 한두 달 기다리는 분도 있어요.',
      en: "There's no deadline for language programs. Most people start whenever they feel settled — some begin in their first week, others wait a month or two.",
      fr: "Il n'y a pas de date limite. La plupart commencent une fois installés — certains la première semaine, d'autres après un mois ou deux.",
    },
  },
  options: [
    {
      name: 'HAKKYO Language Exchange',
      sub: { ko: '한국어-프랑스어-영어 회화 교환', en: 'Korean-French-English conversation exchange', fr: 'Échange de conversation coréen-français-anglais' },
      topPick: true,
      meta: [
        { icon: 'coin', label: { ko: '무료', en: 'Free', fr: 'Gratuit' } },
        { icon: 'users', label: { ko: '소규모 그룹 세션', en: 'Small group sessions', fr: 'Sessions en petit groupe' } },
        { icon: 'calendar', label: { ko: '상시 등록', en: 'Ongoing enrollment', fr: 'Inscription continue' } },
        { icon: 'check', label: { ko: '사전 요건 없음', en: 'No prerequisites', fr: 'Aucun prérequis' } },
      ],
      worksFor: [
        { ko: '현지 프랑스어·영어 사용자를 만나고 싶은 누구나', en: 'Anyone who wants to meet local French or English speakers', fr: 'Quiconque veut rencontrer des francophones ou anglophones locaux' },
        { ko: '사교적인 학습 환경을 원하는 분', en: 'Those who want a social learning environment', fr: 'Ceux qui veulent un cadre d\'apprentissage convivial' },
        { ko: '모든 레벨', en: 'All levels', fr: 'Tous niveaux' },
      ],
      worthKnowing: [
        { ko: '정규 수업이 아니라 회화 교환 중심이에요', en: 'Focus is on conversation exchange, not formal instruction', fr: "L'accent est mis sur l'échange, pas sur un enseignement formel" },
        { ko: '다른 학습의 보완책으로 가장 좋아요', en: 'Best as a complement to other study', fr: 'Idéal en complément d\'autres études' },
      ],
      recommendNote: {
        ko: 'HAKKYO 참가자들은 교환 덕분에 실제 환경에서 말하는 게 수업만 듣는 것보다 빨리 편해졌다고 자주 얘기해요.',
        en: 'Many HAKKYO participants say the exchange helped them feel comfortable speaking in a real environment faster than classes alone.',
        fr: "Beaucoup de participants HAKKYO disent que l'échange les a aidés à parler à l'aise en situation réelle plus vite que les cours seuls.",
      },
    },
    {
      name: 'SANA (Government French Classes)',
      sub: { ko: '무료 풀타임·파트타임 프랑스어 수업', en: 'Free full-time or part-time French instruction', fr: 'Cours de français gratuits à temps plein ou partiel' },
      meta: [
        { icon: 'coin', label: { ko: '무료', en: 'Free', fr: 'Gratuit' } },
        { icon: 'clock', label: { ko: '주간 또는 야간 선택', en: 'Daytime or evening options', fr: 'Options de jour ou de soir' } },
        { icon: 'device-laptop', label: { ko: 'immigration-quebec.gouv.qc.ca에서 등록', en: 'Enroll through immigration-quebec.gouv.qc.ca', fr: 'Inscription via immigration-quebec.gouv.qc.ca' } },
        { icon: 'chart-bar', label: { ko: '중급–고급 제공', en: 'Intermediate–advanced available', fr: 'Niveaux intermédiaire–avancé offerts' } },
      ],
      worksFor: [
        { ko: '체계적인 프랑스어 수업을 원하는 분', en: 'Those who want structured French instruction', fr: 'Ceux qui veulent un enseignement structuré' },
        { ko: '워킹홀리데이·영주권자 (자격 확인)', en: 'Working Holiday and PR holders (check eligibility)', fr: 'Titulaires PVT et RP (vérifier l\'admissibilité)' },
        { ko: '직무용 프랑스어가 목표인 분', en: 'Those targeting professional French', fr: 'Ceux qui visent un français professionnel' },
      ],
      worthKnowing: [
        { ko: '인기 시간대엔 대기가 길 수 있어요', en: 'Waitlists can be long at popular times', fr: 'Les listes d\'attente peuvent être longues aux périodes prisées' },
        { ko: '풀타임 과정은 시간 여유가 많이 필요해요', en: 'Full-time program requires significant availability', fr: 'Le programme à temps plein demande beaucoup de disponibilité' },
      ],
    },
    {
      name: 'Concordia CCE / UQAM Continuing Ed',
      sub: { ko: '유료 과정, 유연한 일정', en: 'Paid courses, flexible schedule', fr: 'Cours payants, horaire flexible' },
      meta: [
        { icon: 'coin', label: { ko: '과정당 $150–500', en: '$150–500/course', fr: '150–500 $/cours' } },
        { icon: 'clock', label: { ko: '저녁·주말 선택', en: 'Evening and weekend options', fr: 'Options de soir et de fin de semaine' } },
        { icon: 'certificate', label: { ko: '수료증 옵션 제공', en: 'Certificate options available', fr: 'Options de certificat offertes' } },
      ],
      worksFor: [
        { ko: '공인 언어 수료증을 원하는 분', en: 'Those who want accredited language certificates', fr: 'Ceux qui veulent des certificats reconnus' },
        { ko: '낮에 일하는 저녁 학습자', en: 'Evening learners who work daytime', fr: 'Apprenants du soir qui travaillent le jour' },
      ],
      worthKnowing: [
        { ko: '비용은 과정과 레벨에 따라 달라요', en: 'Costs vary by course and level', fr: 'Les coûts varient selon le cours et le niveau' },
      ],
    },
  ],
  notes: [
    {
      flag: '🇰🇷',
      person: { ko: '유학생 · 2023년 10월', en: 'Student · Oct 2023', fr: 'Étudiant · oct. 2023' },
      text: {
        ko: '셋째 주에 HAKKYO 교환을 시작했어요. 생각보다 훨씬 부담이 없었어요. 일상 프랑스어에 정말 도움이 됐어요.',
        en: 'I started HAKKYO exchange in my third week. It was much less intimidating than I expected. Really helped with everyday French.',
        fr: "J'ai commencé l'échange HAKKYO la 3e semaine. C'était bien moins intimidant que prévu. Ça a vraiment aidé pour le français du quotidien.",
      },
      likes: 27,
    },
    {
      flag: '🇰🇷',
      person: { ko: '워킹홀리데이 · 2024년 8월', en: 'Working Holiday · Aug 2024', fr: 'Vacances-Travail · août 2024' },
      text: {
        ko: 'SANA 대기가 저는 두 달이었어요. 그동안 HAKKYO를 썼는데 회화 연습엔 오히려 더 좋았어요.',
        en: 'SANA waitlist was 2 months for me. I used HAKKYO in the meantime and it was actually better for conversational practice.',
        fr: "La liste d'attente SANA était de 2 mois pour moi. J'ai utilisé HAKKYO entre-temps et c'était même mieux pour la pratique de conversation.",
      },
      likes: 20,
    },
    {
      flag: '🇫🇷',
      person: { ko: '프랑스 출신 유학생', en: 'French Student', fr: 'Étudiant français' },
      text: {
        ko: 'HAKKYO는 정규 수업의 부담 없이 영어를 연습하기에 좋았어요.',
        en: 'HAKKYO was good for practicing English without the pressure of a formal class.',
        fr: "HAKKYO était bien pour pratiquer l'anglais sans la pression d'un cours formel.",
      },
      likes: 13,
    },
  ],
}

// ─── TAB 8: Flights ──────────────────────────────────────────────────────────

const FLIGHTS_TAB: TabContent = {
  intro: {
    what: {
      ko: '몬트리올의 주요 국제공항은 몬트리올-트뤼도(YUL)예요. 서울(ICN)발 직항은 Air Canada와 대한항공이 운항해요.',
      en: 'The main international airport serving Montréal is Montréal-Trudeau (YUL). Direct flights from Seoul (ICN) are operated by Air Canada and Korean Air.',
      fr: "Le principal aéroport international de Montréal est Montréal-Trudeau (YUL). Les vols directs depuis Séoul (ICN) sont assurés par Air Canada et Korean Air.",
    },
    behavior: {
      ko: '출발 6–10주 전에 예약하는 분이 많아요. Costco Travel을 이용하거나 호텔과 묶어 할인받는 분도 있어요.',
      en: 'Most people book 6–10 weeks before their planned departure. Some travel with Costco Travel or bundle with hotel stays for a discount.',
      fr: "La plupart réservent 6–10 semaines avant le départ prévu. Certains passent par Costco Travel ou combinent avec un hôtel pour un rabais.",
    },
    when: {
      ko: '항공권 가격은 보통 출발 60–90일 전에 예약할 때 가장 낮아요. 출발이 가까워지거나 성수기(8월, 12월)엔 가격이 올라요.',
      en: 'Ticket prices tend to be lower when booked 60–90 days in advance. Prices rise closer to departure and during peak travel seasons (August, December).',
      fr: "Les prix sont généralement plus bas en réservant 60–90 jours à l'avance. Ils montent à l'approche du départ et en haute saison (août, décembre).",
    },
  },
  options: [
    {
      name: 'Air Canada Direct (ICN → YUL)',
      sub: { ko: '직항, 약 14시간', en: 'Non-stop, ~14 hours', fr: 'Sans escale, ~14 heures' },
      topPick: true,
      meta: [
        { icon: 'coin', label: { ko: '$800–1,400', en: '$800–1,400', fr: '800–1 400 $' } },
        { icon: 'plane', label: { ko: '직항, 경유 없음', en: 'Direct flight, no stopover', fr: 'Vol direct, sans escale' } },
        { icon: 'sofa', label: { ko: 'Air Canada 앱 + 라운지', en: 'Air Canada app + lounge access', fr: 'Appli Air Canada + accès salon' } },
      ],
      worksFor: [
        { ko: '한 번의 비행을 선호하는 분', en: 'Those who prefer a single flight', fr: 'Ceux qui préfèrent un seul vol' },
        { ko: '도착 일정이 빠듯한 분', en: 'Those with tight arrival schedules', fr: 'Ceux qui ont un horaire d\'arrivée serré' },
        { ko: '짐이 많은 경우', en: 'Carrying significant luggage', fr: 'Avec beaucoup de bagages' },
      ],
      worthKnowing: [
        { ko: '경유편보다 보통 비싸요', en: 'Generally pricier than connecting options', fr: 'En général plus cher que les vols avec correspondance' },
        { ko: '좋은 좌석은 일찍 예약하는 게 좋아요', en: 'Book early for the best availability', fr: 'Réservez tôt pour la meilleure disponibilité' },
      ],
      recommendNote: {
        ko: '직항이면 덜 지친 채로 도착해서 긴 경유 없이 첫날을 시작할 수 있어요. 많은 분들에게 절약되는 시간이 가격 차이만큼의 가치가 있어요.',
        en: 'A direct flight means you land fresh and can start your first day without a long layover. For many, the time saved is worth the price difference.',
        fr: "Un vol direct, c'est arriver en forme et commencer sa première journée sans longue escale. Pour beaucoup, le temps gagné vaut la différence de prix.",
      },
    },
    {
      name: 'Korean Air / Asiana (via connection)',
      sub: { ko: '경유, 18–22시간', en: 'Via stopover, 18–22 hours', fr: 'Avec escale, 18–22 heures' },
      meta: [
        { icon: 'coin', label: { ko: '$750–1,200', en: '$750–1,200', fr: '750–1 200 $' } },
        { icon: 'transfer', label: { ko: '경유 1회 (변동)', en: '1 stopover (varies)', fr: '1 escale (variable)' } },
        { icon: 'plane', label: { ko: '마일리지 적립', en: 'Frequent flyer miles', fr: 'Milles de fidélité' } },
      ],
      worksFor: [
        { ko: '이동 시간에 여유가 있는 분', en: 'Those flexible on travel time', fr: 'Ceux qui sont flexibles sur la durée' },
        { ko: '마일리지 프로그램 회원', en: 'Frequent flyer program holders', fr: 'Membres de programmes de fidélité' },
        { ko: '예산을 아끼는 여행자', en: 'Budget-conscious travelers', fr: 'Voyageurs soucieux du budget' },
      ],
      worthKnowing: [
        { ko: '경유로 이동 시간이 늘어요', en: 'Stopover adds travel time', fr: "L'escale allonge le temps de trajet" },
        { ko: '일부 노선은 환승 시간이 빠듯할 수 있어요', en: 'Connection timing can be tight on some routes', fr: 'Les correspondances peuvent être serrées sur certains trajets' },
      ],
    },
    {
      name: 'Costco Travel / Bundle Deals',
      sub: { ko: '항공 + 호텔 패키지 할인', en: 'Flight + hotel package discount', fr: 'Forfait vol + hôtel à rabais' },
      meta: [
        { icon: 'coin', label: { ko: '변동', en: 'Varies', fr: 'Variable' } },
        { icon: 'home', label: { ko: '임시 숙소와 묶음', en: 'Bundle with temporary housing', fr: 'Combiné avec hébergement temporaire' } },
        { icon: 'calendar', label: { ko: '계절별 가격', en: 'Seasonal pricing', fr: 'Tarifs saisonniers' } },
      ],
      worksFor: [
        { ko: '숙소와 항공을 함께 예약하고 싶은 분', en: 'Those who want to book housing and flights together', fr: 'Ceux qui veulent réserver logement et vol ensemble' },
        { ko: '이미 Costco 회원인 분', en: 'Those already Costco members', fr: 'Ceux qui sont déjà membres Costco' },
      ],
      worthKnowing: [
        { ko: '계획 변경의 유연성이 적어요', en: 'Less flexibility in changing plans', fr: 'Moins de souplesse pour modifier les plans' },
        { ko: '날짜를 미리 알면 가장 큰 가치를 얻어요', en: 'Best value if you know your dates in advance', fr: "Meilleure valeur si vous connaissez vos dates d'avance" },
      ],
    },
  ],
  notes: [
    {
      flag: '🇰🇷',
      person: { ko: '유학생 · 2024년 8월', en: 'Student · Aug 2024', fr: 'Étudiant · août 2024' },
      text: {
        ko: '8주 전에 Air Canada 직항을 예약했어요. $1,100 정도였어요. 아침에 도착해서 하루 종일 일을 처리할 수 있었어요.',
        en: 'I booked Air Canada direct, 8 weeks before. It was around $1,100. Landed in the morning and had the whole day to sort things out.',
        fr: "J'ai réservé Air Canada direct, 8 semaines avant. C'était environ 1 100 $. Arrivé le matin, j'ai eu toute la journée pour m'organiser.",
      },
      likes: 29,
    },
    {
      flag: '🇰🇷',
      person: { ko: '워킹홀리데이 · 2024년 3월', en: 'Working Holiday · Mar 2024', fr: 'Vacances-Travail · mars 2024' },
      text: {
        ko: '밴쿠버 경유로 대한항공을 탔어요. 더 싸지만 총 20시간이었어요. 가격 차이만큼은 괜찮았어요.',
        en: 'I took Korean Air with a connection in Vancouver. Cheaper but 20 hours total. Worth it for the price difference.',
        fr: "J'ai pris Korean Air avec une correspondance à Vancouver. Moins cher mais 20 heures au total. Ça valait la différence de prix.",
      },
      likes: 17,
    },
    {
      flag: '🇰🇷',
      person: { ko: '영주권자', en: 'PR', fr: 'Résident permanent' },
      text: {
        ko: '저는 항상 60–90일 전에 예약해요. 그보다 늦으면 가격이 확 뛰어요.',
        en: 'I always book 60–90 days out. Anything less and the prices jump a lot.',
        fr: "Je réserve toujours 60–90 jours à l'avance. En deçà, les prix grimpent beaucoup.",
      },
      likes: 12,
    },
  ],
}

// ─── Tab registry ────────────────────────────────────────────────────────────

type TabId = 'sim' | 'bank' | 'transit' | 'housing' | 'sin' | 'licence' | 'language' | 'flights'

const TAB_LABELS: Record<TabId, Tri> = {
  sim: { ko: 'SIM 카드', en: 'SIM card', fr: 'Carte SIM' },
  bank: { ko: '은행', en: 'Bank', fr: 'Banque' },
  transit: { ko: '교통', en: 'Transit', fr: 'Transport' },
  housing: { ko: '임시 거처', en: 'Housing', fr: 'Logement' },
  sin: { ko: 'SIN 번호', en: 'SIN number', fr: 'NAS' },
  licence: { ko: '운전 면허', en: "Driver's licence", fr: 'Permis' },
  language: { ko: '언어 프로그램', en: 'Language', fr: 'Langue' },
  flights: { ko: '항공편', en: 'Flights', fr: 'Vols' },
}

const TAB_DATA: Record<TabId, TabContent> = {
  sim: SIM_TAB,
  bank: BANK_TAB,
  transit: TRANSIT_TAB,
  housing: HOUSING_TAB,
  sin: SIN_TAB,
  licence: LICENCE_TAB,
  language: LANGUAGE_TAB,
  flights: FLIGHTS_TAB,
}

const TAB_QUESTIONS: Record<TabId, Tri> = {
  sim: { ko: '어떤 통신사를 선택할까요?', en: 'Which provider works for me?', fr: 'Quel fournisseur choisir?' },
  bank: { ko: '어느 은행에서 계좌를 열까요?', en: 'Which bank should I open?', fr: 'Quelle banque ouvrir?' },
  transit: { ko: '몬트리올에서 어떻게 이동하나요?', en: 'How do I get around Montréal?', fr: 'Comment me déplacer?' },
  housing: { ko: '처음 몇 주는 어디서 지내나요?', en: 'Where do I stay first?', fr: 'Où loger au début?' },
  sin: { ko: 'SIN 번호는 어떻게 받나요?', en: 'How do I get my SIN?', fr: 'Comment obtenir mon NAS?' },
  licence: { ko: '한국 면허를 퀘벡 면허로 바꿀 수 있나요?', en: 'Can I convert my Korean licence?', fr: 'Puis-je convertir mon permis?' },
  language: { ko: '언어 공부는 어떻게 시작하나요?', en: 'How do I start learning French?', fr: 'Comment apprendre le français?' },
  flights: { ko: '항공편은 언제 예약하는 게 좋나요?', en: 'When should I book my flight?', fr: 'Quand réserver mon vol?' },
}

// ─── Components ───────────────────────────────────────────────────────────────

function MetaChip({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 px-2 py-0.5 bg-gray-50 rounded-full border border-gray-100">
      <i className={`ti ti-${icon} text-[12px]`} aria-hidden="true" />
      {text}
    </span>
  )
}

function OptionCard({ opt, lang }: { opt: OptionData; lang: string }) {
  return (
    <div className={`rounded-xl border bg-white p-5 ${opt.topPick ? 'border-blue-200 border-[1.5px]' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[14px] font-medium text-gray-900">{opt.name}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">{tri(opt.sub, lang)}</p>
        </div>
        {opt.topPick && (
          <span className="flex-shrink-0 text-[10px] font-bold tracking-wide uppercase px-2 py-1 rounded bg-blue-50 text-blue-700">
            {lang === 'ko' ? '추천' : lang === 'fr' ? 'Choix' : 'Top pick'}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {opt.meta.map((m, i) => <MetaChip key={i} icon={m.icon} text={tri(m.label, lang)} />)}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-green-700 mb-2">
            {lang === 'ko' ? '이런 분께 적합' : lang === 'fr' ? 'Convient si' : 'Works well for'}
          </p>
          {opt.worksFor.map((w, i) => (
            <p key={i} className="text-[12px] text-gray-600 leading-snug mb-1">{tri(w, lang)}</p>
          ))}
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
            {lang === 'ko' ? '알아두면 좋은 점' : lang === 'fr' ? 'À savoir' : 'Worth knowing'}
          </p>
          {opt.worthKnowing.map((w, i) => (
            <p key={i} className="text-[12px] text-gray-600 leading-snug mb-1">{tri(w, lang)}</p>
          ))}
        </div>
      </div>
      {opt.recommendNote && (
        <div className="mt-3 border-l-2 border-blue-200 pl-3">
          <p className="text-[12px] text-gray-500 leading-relaxed">
            <span className="font-medium text-gray-700">{lang === 'ko' ? '많은 분들의 경험:' : lang === 'fr' ? 'Ce que font beaucoup :' : 'A common pattern:'}</span>{' '}
            {tri(opt.recommendNote, lang)}
          </p>
        </div>
      )}
    </div>
  )
}

function CommunityNotes({ notes, lang }: { notes: CommunityNoteData[]; lang: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 mt-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">
        {lang === 'ko' ? '먼저 경험한 분들의 이야기' : lang === 'fr' ? 'Témoignages' : 'People who went through this'}
      </p>
      <div className="flex flex-col gap-2">
        {notes.map((n, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-100 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[14px]">{n.flag}</span>
              <span className="text-[11px] text-gray-400">{tri(n.person, lang)}</span>
            </div>
            <p className="text-[12px] text-gray-700 leading-relaxed italic mb-1.5">"{tri(n.text, lang)}"</p>
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <i className="ti ti-thumb-up text-[12px]" aria-hidden="true" />
              {n.likes}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TopicIntro({ data, lang }: { data: TopicIntroData; lang: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 mb-5">
      <p className="text-[13px] text-gray-600 leading-relaxed mb-3">{tri(data.what, lang)}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg border border-gray-100 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
            {lang === 'ko' ? '보통 어떻게 하나요' : lang === 'fr' ? 'Ce que font la plupart' : 'What people usually do'}
          </p>
          <p className="text-[12px] text-gray-600 leading-relaxed">{tri(data.behavior, lang)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
            {lang === 'ko' ? '언제 필요한가요' : lang === 'fr' ? "Quand c'est utile" : 'When it matters'}
          </p>
          <p className="text-[12px] text-gray-600 leading-relaxed">{tri(data.when, lang)}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Arriving() {
  const { lang } = useLang()
  const [checked, setChecked] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]')) }
    catch { return new Set() }
  })
  const [activeTab, setActiveTab] = useState<TabId>('sim')

  useEffect(() => {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify([...checked])) }
    catch {}
  }, [checked])

  const pct = Math.round((checked.size / 8) * 100)
  const tabData = TAB_DATA[activeTab]
  const tabIds = Object.keys(TAB_LABELS) as TabId[]

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 min-w-0 px-6 lg:px-8 pt-12 md:pt-[72px] lg:pt-24 pb-24">
        <div className="max-w-[680px]">

          {/* Page header */}
          <div className="mb-10">
            <p className="t-eyebrow mb-3">
              {lang === 'ko' ? '나의 여정 · 01' : lang === 'fr' ? 'Mon parcours · 01' : 'My Journey · 01'}
            </p>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <h1 className="t-page">
                {lang === 'ko' ? '첫 걸음' : lang === 'fr' ? 'Premiers Pas' : 'First Steps'}
              </h1>
              <div className="text-right shrink-0 mb-1">
                <p className="text-2xl font-light text-gray-900 tabular-nums leading-none">{checked.size} / 8</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {lang === 'ko' ? '완료' : lang === 'fr' ? 'fait' : 'done'}
                </p>
              </div>
            </div>
            <p className="text-[14px] text-gray-400 mt-3 leading-relaxed max-w-[520px]">
              {lang === 'ko'
                ? '몇 가지 준비하면 좋은 것들이 있어요. 첫날부터 다 해결할 필요는 없어요.'
                : lang === 'fr'
                ? "Quelques choses à régler à l'arrivée. Rien n'est urgent le premier jour."
                : "A few things to sort out when you arrive. None of it needs to happen on day one."}
            </p>
          </div>

          {/* Checklist chips */}
          <div className="mb-8">
            <p className="t-section mb-3">
              {lang === 'ko' ? '체크리스트' : lang === 'fr' ? 'Liste' : 'Checklist'}
            </p>
            <div className="check-strip">
              {tabIds.map(id => {
                const done = checked.has(id)
                return (
                  <button
                    key={id}
                    onClick={() => setChecked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })}
                    className={`check-chip${done ? ' done' : ''}`}
                  >
                    <span className={`w-3 h-3 rounded-sm border flex-shrink-0 flex items-center justify-center transition-colors ${done ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}>
                      {done && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><polyline points="2,5 4,7 8,3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </span>
                    {tri(TAB_LABELS[id], lang)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 flex-wrap mb-1">
            {tabIds.map(id => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors whitespace-nowrap ${
                  activeTab === id ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tri(TAB_LABELS[id], lang)}
              </button>
            ))}
          </div>

          {/* Active tab content */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mt-2">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
              <p className="text-[13px] font-medium text-gray-700">{tri(TAB_QUESTIONS[activeTab], lang)}</p>
            </div>
            <div className="px-5 py-5">
              <TopicIntro data={tabData.intro} lang={lang} />
              <p className="t-section mb-3">
                {lang === 'ko' ? '선택지' : lang === 'fr' ? 'Options' : 'Your options'}
              </p>
              <div className="flex flex-col gap-3">
                {tabData.options.map((opt, i) => <OptionCard key={i} opt={opt} lang={lang} />)}
              </div>
              <CommunityNotes notes={tabData.notes} lang={lang} />
            </div>
          </div>

        </div>
      </main>

      {/* Right context panel */}
      <aside className="hidden xl:block w-72 shrink-0 sticky top-0 h-screen overflow-y-auto border-l border-gray-100 px-5 py-8 bg-white">
        <div className="ctx-section">
          <span className="ctx-label">
            {lang === 'ko' ? '전체 진행률' : lang === 'fr' ? 'Progression' : 'Overall progress'}
          </span>
          <div className="flex items-center gap-3 mt-1 mb-4">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gray-900 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[12px] font-medium text-gray-500 tabular-nums">{pct}%</span>
          </div>
        </div>
        {/* Quick timeline */}
        <div className="border-t border-gray-100 pt-4">
          <span className="ctx-label">
            {lang === 'ko' ? '일반적인 순서' : lang === 'fr' ? 'Ordre habituel' : 'Typical order'}
          </span>
          {[
            { day: lang === 'ko' ? '도착 당일' : lang === 'fr' ? "Jour d'arrivée" : 'Arrival day', item: lang === 'ko' ? 'SIM 카드' : lang === 'fr' ? 'Carte SIM' : 'SIM card' },
            { day: lang === 'ko' ? '2–3일째' : lang === 'fr' ? 'Jours 2–3' : 'Days 2–3', item: lang === 'ko' ? '은행 계좌' : lang === 'fr' ? 'Compte bancaire' : 'Bank account' },
            { day: lang === 'ko' ? '첫 주' : lang === 'fr' ? '1re semaine' : 'First week', item: lang === 'ko' ? 'SIN 번호' : lang === 'fr' ? 'Numéro NAS' : 'SIN number' },
            { day: lang === 'ko' ? '첫 달' : lang === 'fr' ? '1er mois' : 'First month', item: lang === 'ko' ? '면허 교환' : lang === 'fr' ? 'Échange permis' : 'Licence exchange' },
          ].map((row, i) => (
            <div key={i} className="ctx-row">
              <span>{row.day}</span>
              <span className="ctx-val">{row.item}</span>
            </div>
          ))}
          <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
            {lang === 'ko'
              ? '이건 많은 분들의 일반적인 순서예요. 본인 상황에 맞게 조정하세요.'
              : lang === 'fr'
              ? "C'est l'ordre habituel. Adaptez selon votre situation."
              : "This is a common order — adjust it to your own situation."}
          </p>
        </div>
      </aside>
    </div>
  )
}
