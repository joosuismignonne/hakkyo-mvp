/**
 * First Steps — HAKKYO Montréal Starter Kit
 *
 * Visual: white background, subtle card borders, monochrome SVG icons.
 * i18n:   every string through t() or tri(). Zero hardcoded visible English.
 * Future: CHECKLIST milestone:true flags feed "My Montréal Journey". Keep them.
 */
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'

// ─── i18n types + helper ──────────────────────────────────────────────────────

type Tri = { ko: string; en: string; fr: string }
function tri(f: Tri, lang: string): string {
  return lang === 'ko' ? f.ko : lang === 'fr' ? f.fr : f.en
}

// ─── Tab icons — monochrome SVG, 14×14 ───────────────────────────────────────

function IcoFlight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.5H2"/><path d="M2 10l4.5 1.5L9 5l2 2-2 5 4.5 1.5L17 7l2.5 1-3 7H22"/>
    </svg>
  )
}
function IcoSIM() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/><path d="M8 6h2v2H8zM14 6h2v2h-2zM8 10h8"/>
    </svg>
  )
}
function IcoBank() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22h18M3 10h18M5 6l7-3 7 3M4 10v11M8 10v11M16 10v11M20 10v11"/>
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
function IcoBed() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22v-8M3 14a4 4 0 014-4h10a4 4 0 014 4v8"/><path d="M3 8V5a1 1 0 011-1h16a1 1 0 011 1v9"/>
      <path d="M3 8h18"/>
    </svg>
  )
}
function IcoID() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><circle cx="7" cy="15" r="1.5"/><path d="M12 14h5M12 17h3"/>
    </svg>
  )
}
function IcoCar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3v-4l2-5h14l2 5v4h-2"/><path d="M5 17a2 2 0 004 0M15 17a2 2 0 004 0"/>
      <path d="M5 8h14"/>
    </svg>
  )
}
function IcoLang() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  )
}

// Transport-specific icons (slightly larger, in cards)
function IcoMetro() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="12" height="14" rx="2"/><path d="M6 8h12M6 12h12M9 18l-2 3M15 18l2 3"/>
    </svg>
  )
}
function IcoPhone() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>
    </svg>
  )
}
function IcoBus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11V17a2 2 0 002 2h14a2 2 0 002-2v-6M3 11V8a5 5 0 0118 0v3M3 11h18"/>
      <circle cx="7" cy="19" r="1"/><circle cx="17" cy="19" r="1"/>
    </svg>
  )
}
function IcoBike() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/><path d="M12 17l-3-6h6l2 3-5 3zM9 11l3-6M12 5h4"/>
    </svg>
  )
}
function IcoCarLg() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3v-4l2-5h14l2 5v4h-2"/><path d="M5 17a2 2 0 004 0M15 17a2 2 0 004 0"/><path d="M5 8h14"/>
    </svg>
  )
}

type TransportIconKey = 'metro' | 'phone' | 'bus' | 'bike' | 'car'
function TransportIcon({ k }: { k: TransportIconKey }) {
  if (k === 'metro') return <IcoMetro />
  if (k === 'phone') return <IcoPhone />
  if (k === 'bus')   return <IcoBus />
  if (k === 'bike')  return <IcoBike />
  return <IcoCarLg />
}

// ─── Progress checklist ───────────────────────────────────────────────────────
// milestone:true = feeds "My Montréal Journey" feature (future). Do not remove.

const CHECKLIST: Array<{ id: string; milestone: boolean } & Tri> = [
  { id: 'flight',   ko: '항공권 예약',              en: 'Flight booked',              fr: 'Vol réservé',                   milestone: true  },
  { id: 'stay',     ko: '숙소 마련',                en: 'Temporary stay arranged',    fr: 'Logement temporaire arrangé',    milestone: false },
  { id: 'sim',      ko: 'SIM 카드 개통',             en: 'SIM card activated',         fr: 'Carte SIM activée',             milestone: false },
  { id: 'bank',     ko: '은행 계좌 개설',             en: 'Bank account opened',        fr: 'Compte bancaire ouvert',        milestone: true  },
  { id: 'sin',      ko: 'SIN Number',                en: 'SIN Number',                 fr: 'Numéro d\'assurance sociale',   milestone: true  },
  { id: 'opus',     ko: 'OPUS 카드',                 en: 'OPUS card',                  fr: 'Carte OPUS',                    milestone: false },
  { id: 'licence',  ko: 'Québec Driver\'s Licence',  en: 'Québec Driver\'s Licence',   fr: 'Permis de conduire du Québec',  milestone: false },
  { id: 'grocery',  ko: '마트 찾기',                 en: 'Found a grocery store',      fr: 'Trouvé une épicerie',           milestone: false },
  { id: 'exchange', ko: '언어 교환 참여',             en: 'Language exchange joined',   fr: 'Échange linguistique rejoint',  milestone: true  },
  { id: 'friend',   ko: '첫 현지 친구',               en: 'First local friend',         fr: 'Premier ami local',             milestone: true  },
]

const PROGRESS_KEY = 'hakkyo_firststeps'

// ─── Journey messages by completion % ────────────────────────────────────────

const JOURNEY_MESSAGES: Array<{ min: number; max: number } & Tri> = [
  {
    min: 0, max: 0,
    ko: '아직 시작 전입니다. 하나씩 확인해 보세요.',
    en: 'Not started yet. Check things off as you go.',
    fr: 'Pas encore commencé. Cochez au fur et à mesure.',
  },
  {
    min: 1, max: 29,
    ko: '준비가 시작됐습니다.',
    en: 'Getting started.',
    fr: 'Vous démarrez.',
  },
  {
    min: 30, max: 59,
    ko: '몬트리올 생활이 조금씩 자리를 잡아가고 있습니다.',
    en: 'Settling into Montréal life, step by step.',
    fr: 'Vous vous installez à Montréal, pas à pas.',
  },
  {
    min: 60, max: 89,
    ko: '도시에 익숙해지는 중입니다.',
    en: 'Getting comfortable in the city.',
    fr: 'Vous vous familiarisez avec la ville.',
  },
  {
    min: 90, max: 99,
    ko: '거의 다 됐습니다.',
    en: 'Almost done.',
    fr: 'Presque terminé.',
  },
  {
    min: 100, max: 100,
    ko: '몬트리올에 도착하셨네요.',
    en: "You've arrived in Montréal.",
    fr: 'Vous êtes arrivé·e à Montréal.',
  },
]

function getJourneyMessage(pct: number, lang: string): string {
  const row = JOURNEY_MESSAGES.find(m => pct >= m.min && pct <= m.max) ?? JOURNEY_MESSAGES[0]
  return tri(row, lang)
}

// ─── Milestone messages (shown briefly on item check) ────────────────────────

const MILESTONE_MESSAGES: Record<string, Tri> = {
  flight:   { ko: '진짜 가게 되었네요.',                             en: "It's really happening.",                        fr: 'Ça devient réel.'                                    },
  stay:     { ko: '첫 번째 집이 생겼습니다.',                        en: 'Your first home is waiting.',                   fr: 'Votre premier chez-vous vous attend.'                },
  sim:      { ko: '이제 현지 번호를 사용할 준비가 되었습니다.',        en: 'You have a local number now.',                  fr: 'Vous avez maintenant un numéro local.'               },
  bank:     { ko: '몬트리올에서의 금융 생활이 시작됩니다.',            en: 'Your financial life in Montréal begins.',       fr: 'Votre vie financière à Montréal commence.'          },
  sin:      { ko: '이제 캐나다에서 일할 준비가 되었습니다.',           en: "You're set to work in Canada.",                 fr: 'Vous êtes prêt à travailler au Canada.'              },
  opus:     { ko: '도시가 당신의 것이 됩니다.',                       en: 'The city is yours to explore.',                 fr: "La ville s'ouvre à vous."                           },
  licence:  { ko: '몬트리올 밖으로도 자유롭게 나갈 수 있습니다.',     en: 'The city and beyond — you\'re free to move.',  fr: 'La ville et au-delà — vous êtes libre de circuler.' },
  grocery:  { ko: '여기서의 일상이 시작됩니다.',                      en: 'Daily life here starts with this.',             fr: 'La vie quotidienne commence ici.'                    },
  exchange: { ko: '언어는 도시로 들어가는 문입니다.',                 en: 'Language is the door into the city.',           fr: "La langue est la porte d'entrée."                   },
  friend:   { ko: '도시는 결국 사람으로 기억됩니다.',                 en: 'A city is remembered through its people.',      fr: 'Une ville se souvient à travers ses gens.'           },
}

// ─── Tool data ────────────────────────────────────────────────────────────────

interface SimProvider {
  name: string; price: string; esim: boolean; contract: boolean
  bestFor: Tri; pros: Tri[]; hakkyoNote: Tri; popular: boolean; url: string
}

const SIM_PROVIDERS: SimProvider[] = [
  {
    name: 'Fizz', price: '$17–$50/mo', esim: true, contract: false, popular: true, url: 'https://fizz.ca',
    bestFor: { ko: '학생과 예산이 제한된 새 이민자', en: 'Students and newcomers on a budget', fr: 'Étudiants et nouveaux arrivants avec un budget limité' },
    pros: [
      { ko: '약정 없음 — 언제든 해지 가능',  en: 'No contract — cancel anytime',       fr: 'Sans contrat — résiliation à tout moment'   },
      { ko: 'eSIM — 도착 전 개통 가능',      en: 'eSIM — activate before landing',     fr: "eSIM — activer avant l'atterrissage"        },
      { ko: '추천 할인 혜택',                en: 'Referral discounts',                 fr: 'Réductions par parrainage'                  },
    ],
    hakkyoNote: {
      ko: '대부분의 새 이민자들이 Fizz를 선택합니다. 저렴하고 약정이 없으며, 비행기 안에서 eSIM을 바로 개통할 수 있습니다.',
      en: 'Most newcomers choose Fizz. Inexpensive, no contract, and you can activate the eSIM on the plane.',
      fr: "La plupart choisissent Fizz. Pas cher, sans contrat, et vous pouvez activer la eSIM dans l'avion.",
    },
  },
  {
    name: 'Public Mobile', price: '$15–$40/mo', esim: false, contract: false, popular: false, url: 'https://www.publicmobile.ca',
    bestFor: { ko: '최대한 저렴한 월 비용', en: 'Lowest possible monthly cost', fr: 'Coût mensuel le plus bas possible' },
    pros: [
      { ko: '캐나다에서 가장 저렴한 요금제', en: 'Cheapest plans in Canada',        fr: 'Plans les moins chers au Canada'            },
      { ko: '커뮤니티 리워드 프로그램',       en: 'Community rewards program',       fr: 'Programme de récompenses communautaires'    },
      { ko: '약정 없음',                     en: 'No contract',                     fr: 'Sans contrat'                               },
    ],
    hakkyoNote: {
      ko: '비용을 최대한 줄이고 싶고 eSIM이 필요 없다면 최선의 선택입니다. 실물 유심만 제공되니 미리 준비하세요.',
      en: 'Best if you want rock-bottom cost and do not need eSIM. Physical SIM only — plan ahead.',
      fr: "Idéal si vous voulez minimiser les coûts et n'avez pas besoin de eSIM. Uniquement en SIM physique.",
    },
  },
  {
    name: 'Bell', price: '$35–$80/mo', esim: true, contract: false, popular: false, url: 'https://www.bell.ca',
    bestFor: { ko: '안정성과 넓은 커버리지', en: 'Reliability and wide coverage', fr: 'Fiabilité et large couverture' },
    pros: [
      { ko: '퀘벡에서 가장 강력한 네트워크', en: 'Strongest network in Québec',    fr: 'Réseau le plus fort au Québec'              },
      { ko: 'eSIM 사용 가능',                en: 'eSIM available',                  fr: 'eSIM disponible'                            },
      { ko: '빠른 데이터 속도',              en: 'Good data speeds',                fr: 'Bonnes vitesses de données'                 },
    ],
    hakkyoNote: {
      ko: '커버리지가 비용보다 중요하다면 Bell을 선택하세요. 특히 몬트리올 외곽을 자주 이동하는 경우 유용합니다.',
      en: 'Choose Bell if coverage matters more than price — especially if you travel outside Montréal.',
      fr: "Choisissez Bell si la couverture prime sur le prix — surtout si vous voyagez hors de Montréal.",
    },
  },
  {
    name: 'Virgin Plus', price: '$30–$70/mo', esim: true, contract: false, popular: false, url: 'https://www.virginplus.ca',
    bestFor: { ko: '조금 더 저렴한 Bell 수준의 품질', en: 'Bell quality at slightly lower cost', fr: 'Qualité Bell à un coût légèrement inférieur' },
    pros: [
      { ko: 'Bell 네트워크 이용',            en: 'Runs on Bell network',            fr: 'Fonctionne sur le réseau Bell'              },
      { ko: 'eSIM 지원',                     en: 'eSIM support',                    fr: 'Support eSIM'                               },
      { ko: '유연한 요금제',                 en: 'Flexible plans',                  fr: 'Forfaits flexibles'                         },
    ],
    hakkyoNote: {
      ko: 'Bell과 동일한 네트워크를, 조금 더 저렴하게 이용할 수 있습니다.',
      en: 'Same coverage as Bell, slightly cheaper. Good middle option if Fizz feels too budget.',
      fr: 'Même couverture que Bell, légèrement moins cher. Bonne option intermédiaire.',
    },
  },
  {
    name: 'Telus', price: '$35–$90/mo', esim: true, contract: false, popular: false, url: 'https://www.telus.com',
    bestFor: { ko: '도시 외곽을 자주 여행하는 분', en: 'Frequent travel outside the city', fr: 'Voyages fréquents hors de la ville' },
    pros: [
      { ko: '최고의 농촌 커버리지',           en: 'Best rural coverage',             fr: 'Meilleure couverture rurale'                },
      { ko: 'eSIM 사용 가능',                en: 'eSIM available',                  fr: 'eSIM disponible'                            },
      { ko: '몬트리올 외곽에서 강력함',       en: 'Strong outside Montréal',         fr: 'Solide hors de Montréal'                    },
    ],
    hakkyoNote: {
      ko: '도시 외곽을 자주 다닌다면 필요하지만, 몬트리올 일상에서는 과한 선택입니다.',
      en: 'Only necessary if you travel outside the city often. Overkill for daily Montréal life.',
      fr: 'Utile uniquement si vous voyagez souvent hors de la ville. Excessif pour la vie quotidienne.',
    },
  },
]

interface Bank {
  name: string; badge: Tri; badgeColor: string
  pros: Tri[]; hakkyoNote: Tri; url: string; documents: Tri
}

const BANKS: Bank[] = [
  {
    name: 'TD Bank', badgeColor: 'blue', url: 'https://www.td.com/ca/en',
    badge:     { ko: '학생에게 최적',          en: 'Best for students',          fr: 'Idéal pour les étudiants'              },
    pros: [
      { ko: '월 수수료 없는 학생 계좌',    en: 'Student accounts with no monthly fee', fr: 'Comptes étudiants sans frais mensuels'  },
      { ko: '광범위한 ATM 네트워크',      en: 'Large ATM network',                    fr: 'Vaste réseau de guichets automatiques'  },
      { ko: '대부분 지점에서 영어 서비스', en: 'English service at most branches',     fr: 'Service en anglais dans la plupart des succursales' },
    ],
    hakkyoNote: {
      ko: 'TD 학생 계좌 — 월 수수료 $0, 최소 잔액 없음. 학생 비자와 여권만으로 가장 쉽게 개설할 수 있습니다.',
      en: 'TD Student Account — $0 monthly fee, no minimum balance. Easiest to open with only your study permit.',
      fr: "Compte étudiant TD — 0 $ de frais mensuels, aucun solde minimum. Le plus facile à ouvrir avec seulement votre permis d'études.",
    },
    documents: { ko: '학생 비자 + 여권 + 주소 증명', en: 'Study permit + passport + address proof', fr: "Permis d'études + passeport + preuve d'adresse" },
  },
  {
    name: 'RBC', badgeColor: 'yellow', url: 'https://www.rbc.com/newcomers',
    badge:     { ko: '새 이민자 패키지 최고',  en: 'Best newcomer package',      fr: 'Meilleur programme nouveaux arrivants' },
    pros: [
      { ko: '전담 새 이민자 프로그램',      en: 'Dedicated newcomer program',          fr: 'Programme dédié aux nouveaux arrivants' },
      { ko: '신용 기록 없이 신용카드 발급', en: 'Credit card without credit history',  fr: 'Carte de crédit sans historique de crédit' },
      { ko: '다국어 지원',                 en: 'Multilingual support',                fr: 'Support multilingue'                   },
    ],
    hakkyoNote: {
      ko: 'RBC 새 이민자 혜택 패키지는 1년간 수수료를 면제해 줍니다. 신용 기록 없이 신용카드를 발급받을 수 있는 가장 쉬운 방법입니다.',
      en: "RBC's Newcomer Advantage package waives fees for 1 year. Easiest path to a credit card as a newcomer.",
      fr: "Le programme Avantage Nouveaux Arrivants de RBC exonère les frais pendant 1 an.",
    },
    documents: { ko: '여권 + 학생/취업 비자', en: 'Passport + study or work permit', fr: "Passeport + permis d'études ou de travail" },
  },
  {
    name: 'Scotiabank', badgeColor: 'red', url: 'https://www.scotiabank.com',
    badge:     { ko: '첫 신용카드에 최적',     en: 'Best for first credit card', fr: 'Idéal pour la première carte de crédit' },
    pros: [
      { ko: '새 이민자용 StartRight® 신용카드', en: 'StartRight® credit card for newcomers', fr: 'Carte de crédit StartRight® pour nouveaux arrivants' },
      { ko: '신용 기록 불필요',               en: 'No credit history required',             fr: 'Aucun historique de crédit requis'    },
      { ko: '여행 리워드',                    en: 'Travel rewards',                         fr: 'Récompenses voyage'                   },
    ],
    hakkyoNote: {
      ko: '신용카드를 빨리 만드는 것이 최우선이라면 Scotiabank StartRight®가 캐나다에서 가장 쉬운 방법입니다.',
      en: 'If getting a credit card fast is your priority, Scotiabank StartRight® is the easiest path in Canada.',
      fr: "Scotiabank StartRight® est le chemin le plus facile vers une carte de crédit au Canada.",
    },
    documents: { ko: '여권 + 비자 + 주소', en: 'Passport + permit + address', fr: 'Passeport + permis + adresse' },
  },
  {
    name: 'BMO', badgeColor: 'green', url: 'https://www.bmo.com/en-ca',
    badge:     { ko: '첫 해 무료',             en: 'First year free',            fr: 'Première année gratuite'               },
    pros: [
      { ko: 'NewStart® 프로그램 — 1년 무료', en: 'NewStart® program — 1 year free', fr: 'Programme NewStart® — 1 an gratuit'  },
      { ko: '간단한 개설 절차',              en: 'Simple setup',                    fr: 'Ouverture simple'                    },
      { ko: '편리한 모바일 앱',              en: 'Good mobile app',                 fr: 'Bonne application mobile'            },
    ],
    hakkyoNote: {
      ko: 'BMO NewStart® 프로그램은 간단하고 어디서나 이용 가능합니다. 특별한 요구사항이 없다면 좋은 기본 선택입니다.',
      en: 'BMO NewStart® is straightforward and widely available. Good default if you have no specific requirements.',
      fr: "Le programme BMO NewStart® est simple et largement disponible.",
    },
    documents: { ko: '여권 + 비자', en: 'Passport + permit', fr: 'Passeport + permis' },
  },
  {
    name: 'Desjardins', badgeColor: 'gray', url: 'https://www.desjardins.com',
    badge:     { ko: '퀘벡 생활에 최적',       en: 'Best for Québec life',       fr: 'Idéal pour la vie au Québec'           },
    pros: [
      { ko: '퀘벡 협동조합 — 현지 뿌리',    en: 'Québec cooperative — local roots',  fr: 'Coopérative québécoise — racines locales' },
      { ko: '프랑스어 통합에 도움',          en: 'French integration',               fr: 'Intégration francophone'              },
      { ko: '나중에 경쟁력 있는 모기지 이율', en: 'Competitive mortgage rates later', fr: 'Taux hypothécaires compétitifs plus tard' },
    ],
    hakkyoNote: {
      ko: '퀘벡에 장기적으로 정착하고 싶다면 고려해 볼 만한 선택입니다.',
      en: 'Worth considering if you plan to stay long-term and build roots in Québec society.',
      fr: 'À considérer si vous prévoyez rester longtemps et vous intégrer dans la société québécoise.',
    },
    documents: { ko: '여권 + 비자 + 퀘벡 주소', en: 'Passport + permit + Québec address', fr: 'Passeport + permis + adresse au Québec' },
  },
]

interface TransportItem {
  name: Tri; iconKey: TransportIconKey
  what: Tri; where: Tri; cost: Tri; hakkyoNote: Tri; url: string
}

const TRANSPORT_ITEMS: TransportItem[] = [
  {
    iconKey: 'metro', url: 'https://www.stm.info/en/fares-and-passes/opus-card',
    name:  { ko: 'OPUS 카드',      en: 'OPUS Card',      fr: 'Carte OPUS'  },
    what:  { ko: '몬트리올 모든 버스 및 지하철 노선에서 사용 가능한 충전식 교통 카드.', en: 'Rechargeable transit card for all Montréal buses and metro lines.', fr: 'Carte de transport rechargeable pour tous les bus et lignes de métro de Montréal.' },
    where: { ko: '모든 지하철역 발권기 또는 고객 서비스 창구.', en: 'Any metro station ticket machine or customer service counter.', fr: 'Toute machine à billets de station de métro ou comptoir de service.' },
    cost:  { ko: '카드 발급비 $6 + 월정액 패스 (~$100/월) 또는 1회권 ($3.75/회)', en: '$6 card fee + monthly pass (~$100/mo) or pay-per-ride ($3.75/trip)', fr: "Frais de carte 6 $ + passe mensuel (~100 $/mois) ou tarif à l'unité (3,75 $/trajet)" },
    hakkyoNote: { ko: '공항 지하철역에서 바로 구매하세요 (YUL → Lionel-Groulx). 주 3회 이상 대중교통을 이용한다면 월정액 패스가 경제적입니다.', en: 'Get this at the airport metro station (YUL → Lionel-Groulx). Load a monthly pass if you use transit more than 3× per week.', fr: "Achetez-la à la station de métro de l'aéroport (YUL → Lionel-Groulx). Chargez un passe mensuel si vous utilisez les transports plus de 3× par semaine." },
  },
  {
    iconKey: 'phone', url: 'https://www.stm.info',
    name:  { ko: 'STM 앱',         en: 'STM App',          fr: 'Application STM' },
    what:  { ko: '몬트리올 공식 대중교통 앱. 실시간 도착 정보, 경로 계획, 노선 지도.', en: 'Official Montréal transit app. Real-time arrivals, trip planner, and line maps.', fr: 'Application officielle de transport montréalais. Arrivées en temps réel, planificateur et cartes de lignes.' },
    where: { ko: 'App Store 또는 Google Play에서 "STM Montréal" 검색.', en: 'App Store or Google Play — search "STM Montréal".', fr: 'App Store ou Google Play — cherchez "STM Montréal".' },
    cost:  { ko: '무료', en: 'Free', fr: 'Gratuit' },
    hakkyoNote: { ko: '도착 첫날 전에 다운로드하세요. 실시간 추적이 정확하고, 집을 나서기 전에 지연을 미리 확인할 수 있습니다.', en: 'Download before your first day. The real-time tracker is accurate and shows delays before you leave the apartment.', fr: "Téléchargez avant votre premier jour. Le suivi en temps réel affiche les retards avant que vous quittiez l'appartement." },
  },
  {
    iconKey: 'bus', url: 'https://www.stm.info/en/info/networks/bus/bus-747',
    name:  { ko: '747 버스 — 공항 → 도심', en: '747 Express — Airport to Downtown', fr: '747 Express — Aéroport au Centre-ville' },
    what:  { ko: 'YUL 공항에서 몬트리올 도심(Berri-UQAM 지하철)까지 가는 직행 버스. 24시간 운행.', en: 'Direct bus from YUL airport to downtown Montréal (Berri-UQAM metro). Runs 24/7.', fr: "Bus direct de l'aéroport YUL au centre-ville de Montréal (métro Berri-UQAM). Fonctionne 24h/24." },
    where: { ko: 'YUL 터미널 1 도착층 외부 버스 정류장.', en: 'Bus stop outside the arrivals level at YUL Terminal 1.', fr: "Arrêt de bus à l'extérieur du niveau des arrivées, Terminal 1 de YUL." },
    cost:  { ko: '$11 — 현금, 신용카드, 또는 OPUS 카드 사용 가능', en: '$11 — accepts cash, credit card, or OPUS', fr: "11 $ — accepte l'argent comptant, la carte de crédit ou l'OPUS" },
    hakkyoNote: { ko: '도착하면 747번 버스를 타세요. 버스 문에서 바로 신용카드로 결제됩니다. 50~70분 만에 도심에 도착합니다.', en: 'Take the 747 when you land. It accepts credit card directly at the door. Gets you downtown in 50–70 minutes.', fr: "Prenez le 747 à votre arrivée. Il accepte la carte de crédit à la porte. Arrive en centre-ville en 50–70 minutes." },
  },
  {
    iconKey: 'bike', url: 'https://bixi.com',
    name:  { ko: 'BIXI 자전거', en: 'BIXI Bikes', fr: 'Vélos BIXI' },
    what:  { ko: '공공 자전거 공유 시스템. 몬트리올 전역 800개 이상 정류장.', en: 'Public bike-share. 9,000+ bikes at 800+ stations across Montréal.', fr: 'Vélopartage public. Plus de 9 000 vélos à plus de 800 stations.' },
    where: { ko: '모든 BIXI 정류장. 앱 또는 정류장 단말기에서 잠금 해제.', en: 'Any BIXI station. App or station terminal to unlock.', fr: 'Toute station BIXI. Application ou terminal pour déverrouiller.' },
    cost:  { ko: '시즌 월정액 $27 · 1일권 $7 · 30분 단위 $1.29', en: '$27/month seasonal · $7/day · $1.29/30min', fr: '27 $/mois saisonnier · 7 $/jour · 1,29 $/30 min' },
    hakkyoNote: { ko: 'Plateau나 Mile End에 거주한다면 따뜻한 계절에 BIXI로 단거리 이동이 가능합니다.', en: 'If you live near the Plateau or Mile End, BIXI replaces the metro for short trips in warm months.', fr: 'Si vous habitez sur le Plateau ou à Mile End, le BIXI remplace le métro pour les courts trajets.' },
  },
  {
    iconKey: 'car', url: 'https://www.communauto.com',
    name:  { ko: 'Communauto', en: 'Communauto', fr: 'Communauto' },
    what:  { ko: '몬트리올 자동차 공유 협동조합. 시간 또는 일 단위 대여.', en: 'Montréal car-share co-op. Hourly or daily rentals, no ownership needed.', fr: "Coopérative d'autopartage montréalaise. Location à l'heure ou à la journée." },
    where: { ko: '앱 기반. 도시 전역에 차량 주차 — 전화로 예약 및 잠금 해제.', en: 'App-based. Cars parked across the city — reserve and unlock via phone.', fr: 'Basé sur application. Voitures partout en ville — réservez par téléphone.' },
    cost:  { ko: '플랜에 따라 시간당 $15–$25. 보험 및 주유비 추가 없음.', en: '$15–$25/hour depending on plan. No insurance or gas fees added.', fr: "15–25 $/heure selon le forfait. Aucuns frais d'assurance ou d'essence." },
    hakkyoNote: { ko: '몬트리올에서 대부분의 새 이민자들에게 자동차는 필요 없습니다. Communauto는 꼭 필요한 순간을 위한 서비스입니다.', en: "Most newcomers do not need a car in Montréal. Communauto covers the moments you do.", fr: "La plupart des nouveaux arrivants n'ont pas besoin de voiture. Communauto couvre les moments où vous en avez besoin." },
  },
]

interface StayOption {
  name: Tri; type: Tri; priceRange: string
  goodFor: Tri; pros: Tri[]; cons: Tri[]; hakkyoNote: Tri; url: string
}

const STAY_OPTIONS: StayOption[] = [
  {
    url: 'https://www.airbnb.ca',
    name:       { ko: 'Airbnb — 개인실',         en: 'Airbnb — Private Room',          fr: 'Airbnb — Chambre Privée'    },
    type:       { ko: '임시 숙소',                en: 'Temporary stay',                 fr: 'Séjour temporaire'          },
    priceRange: '$40–$90/night · ~$1,000–$2,000/month',
    goodFor:    { ko: '아파트를 구하는 동안 2~4주 임시 거처', en: 'First 2–4 weeks while apartment hunting', fr: "2 à 4 premières semaines pendant la recherche d'appartement" },
    pros: [
      { ko: '개인 공간',           en: 'Private space',           fr: 'Espace privé'           },
      { ko: '주방 이용 가능',       en: 'Kitchen access',          fr: 'Accès à la cuisine'     },
      { ko: '자유로운 체크인/아웃', en: 'Flexible check-in/out',   fr: 'Entrée/sortie flexible'  },
    ],
    cons: [
      { ko: '단기 임대보다 비쌈',              en: 'More expensive than sublets',           fr: 'Plus cher que les sous-locations'        },
      { ko: '임대 계약 없음 = 은행 주소 증명 불가', en: 'No lease = no address proof for banking', fr: "Pas de bail = pas de preuve d'adresse" },
    ],
    hakkyoNote: { ko: '비용을 아끼려면 개인실을 예약하세요. 대부분은 2~3주를 머물며 영구적인 거처를 찾습니다.', en: 'Book a private room to save money. Most newcomers stay 2–3 weeks before finding permanent housing.', fr: "Réservez une chambre privée pour économiser. La plupart restent 2–3 semaines avant de trouver un logement permanent." },
  },
  {
    url: 'https://www.hostelworld.com/findabed.php/travelto-Montreal',
    name:       { ko: '호스텔',                  en: 'Hostel',                         fr: 'Auberge de Jeunesse'        },
    type:       { ko: '저예산 숙소',              en: 'Budget stay',                    fr: 'Hébergement économique'     },
    priceRange: '$25–$55/night · dorm or private room',
    goodFor:    { ko: '처음 며칠, 혼자 오는 새 이민자, 사람 만나기', en: 'Very first days, solo newcomers, meeting people', fr: 'Tout premiers jours, nouveaux arrivants solo, rencontres' },
    pros: [
      { ko: '가장 저렴한 옵션',     en: 'Cheapest option',            fr: 'Option la moins chère'  },
      { ko: '사교적인 분위기',      en: 'Social atmosphere',          fr: 'Ambiance sociale'       },
      { ko: '몬트리올 중심부 위치', en: 'Central Montréal locations', fr: 'Emplacements centraux'  },
    ],
    cons: [
      { ko: '공용 도미토리',         en: 'Shared dorm rooms',              fr: 'Dortoirs partagés'               },
      { ko: '개인 공간 부족',        en: 'Less privacy',                   fr: "Moins d'intimité"                },
      { ko: '1~2주 이상 불편함',     en: 'Not practical beyond 1–2 weeks', fr: 'Peu pratique au-delà de 1–2 semaines' },
    ],
    hakkyoNote: { ko: '이웃 동네를 탐색하기 전에 다른 새 이민자들을 만나고 싶다면 첫 번째 주에 좋은 선택입니다.', en: 'Good for the very first week if you want to meet newcomers before committing to a neighbourhood.', fr: "Idéal pour la toute première semaine si vous voulez rencontrer d'autres nouveaux arrivants." },
  },
  {
    url: 'https://www.facebook.com/marketplace',
    name:       { ko: 'Facebook — 단기 임대',     en: 'Facebook Marketplace — Sublet', fr: 'Facebook Marketplace — Sous-location' },
    type:       { ko: '현지 단기 임대',           en: 'Local sublet',                  fr: 'Sous-location locale'       },
    priceRange: '$600–$1,200/month furnished',
    goodFor:    { ko: '1~3개월 안정적인 거처', en: '1–3 month stay with more stability', fr: 'Séjour de 1 à 3 mois avec plus de stabilité' },
    pros: [
      { ko: 'Airbnb보다 훨씬 저렴', en: 'Much cheaper than Airbnb',   fr: "Beaucoup moins cher qu'Airbnb" },
      { ko: '실제 생활하는 느낌',   en: 'Feels like real living',      fr: 'Se sent comme une vraie vie'  },
      { ko: '주소 증명에 활용 가능', en: 'Can use as address proof',   fr: "Peut servir de preuve d'adresse" },
    ],
    cons: [
      { ko: '매물 검증 필수',  en: 'Must verify listings carefully', fr: 'Vérifier les annonces soigneusement' },
      { ko: '플랫폼 보호 없음', en: 'No platform protection',        fr: 'Aucune protection de la plateforme' },
      { ko: '경쟁이 치열함',   en: 'Competition is high',            fr: 'La concurrence est forte'           },
    ],
    hakkyoNote: { ko: '"sous-location" 또는 "단기 임대 몬트리올"로 검색하세요. 빠르게 연락하세요 — 좋은 매물은 몇 시간 안에 사라집니다.', en: 'Search "sous-location" or "short term sublet Montréal". Message quickly — good listings are gone within hours.', fr: 'Cherchez "sous-location". Répondez vite — les bonnes annonces disparaissent en quelques heures.' },
  },
  {
    url: 'https://www.concordia.ca/students/housing.html',
    name:       { ko: '학생 기숙사',              en: 'Student Residence',              fr: 'Résidence Étudiante'        },
    type:       { ko: '기관 주거',                en: 'Institutional housing',          fr: 'Logement institutionnel'    },
    priceRange: '$600–$950/month · meals sometimes included',
    goodFor:    { ko: 'McGill, Concordia, UQAM, UdeM 재학생', en: 'Students at McGill, Concordia, UQAM, or UdeM', fr: 'Étudiants à McGill, Concordia, UQAM ou UdeM' },
    pros: [
      { ko: '관리되고 안전함',           en: 'Managed and safe',              fr: 'Géré et sécuritaire'           },
      { ko: '공과금 포함',               en: 'Utilities included',            fr: 'Services publics inclus'       },
      { ko: '해외에서 가장 쉬운 첫 단계', en: 'Easiest transition from abroad', fr: "Transition la plus facile depuis l'étranger" },
    ],
    cons: [
      { ko: '일찍 신청 필수 — 자리가 빨리 찬다', en: 'Apply early — spots fill up',       fr: 'Postulez tôt — les places se remplissent' },
      { ko: '단기 체류 불가능할 수 있음',         en: 'May not be available short-term', fr: 'Peut ne pas être disponible à court terme' },
      { ko: '규칙과 통금 있을 수 있음',           en: 'Rules and curfews possible',      fr: 'Règles et couvre-feux possibles'           },
    ],
    hakkyoNote: { ko: '도착 전에 기숙사를 신청하세요 — 대학교 주거 지원 사무소에 직접 연락하세요. 자리가 빠르게 찬다는 것을 명심하세요.', en: "Apply for residence before you arrive — contact your university's housing office directly. Spots go fast.", fr: "Faites une demande de résidence avant d'arriver. Les places partent vite." },
  },
]

// ─── SIN Number data ──────────────────────────────────────────────────────────

const SIN_DATA = {
  what: {
    ko: '캐나다에서 일하고 정부 서비스를 이용하기 위해 필요한 9자리 고유 번호입니다.',
    en: 'A 9-digit number required to work in Canada and access federal government services.',
    fr: 'Un numéro à 9 chiffres requis pour travailler au Canada et accéder aux services gouvernementaux fédéraux.',
  },
  why: {
    ko: '고용주는 고용 전에 SIN을 요구합니다. 세금 신고, EI, CPP 등 모든 정부 혜택에도 필요합니다.',
    en: 'Employers require it before hiring you. Also needed for tax filing, EI, CPP, and all federal benefits.',
    fr: "Les employeurs l'exigent avant l'embauche. Également nécessaire pour les déclarations d'impôts et les prestations fédérales.",
  },
  where: {
    ko: '온라인 신청 (IRCC 포털) 또는 Service Canada 센터 직접 방문.',
    en: 'Apply online via the IRCC portal, or visit a Service Canada Centre in person.',
    fr: 'Faites une demande en ligne via le portail IRCC, ou visitez un Centre Service Canada.',
  },
  prepare: [
    { ko: '여권', en: 'Passport', fr: 'Passeport' },
    { ko: '유효한 취업 또는 학생 비자', en: 'Valid work or study permit', fr: "Permis de travail ou d'études valide" },
    { ko: '온라인 신청 시: IRCC 계정 필요', en: 'For online: IRCC portal account', fr: 'Pour en ligne : compte du portail IRCC' },
  ] as Tri[],
  hakkyoNote: {
    ko: 'SIN은 도착 후 최대한 빨리 신청하세요. 고용주는 고용 전에 이 번호를 요구합니다. 온라인 신청이 가장 빠릅니다.',
    en: 'Apply for your SIN as soon as possible after arriving. Employers need it before you start work. Online is fastest.',
    fr: "Faites une demande de NAS dès que possible après votre arrivée. Les employeurs en ont besoin avant que vous commenciez à travailler. La demande en ligne est la plus rapide.",
  },
  url: 'https://www.canada.ca/en/employment-social-development/services/sin.html',
}

// ─── Québec Driver's Licence data ─────────────────────────────────────────────

const LICENCE_DATA = {
  what: {
    ko: '퀘벡에서 운전하거나 일상에서 신분증으로 사용하기 위한 주 운전 면허증입니다.',
    en: "A provincial licence for driving, renting a car, or using as ID in daily Québec life.",
    fr: 'Un permis provincial pour conduire, louer une voiture ou l\'utiliser comme pièce d\'identité au Québec.',
  },
  why: {
    ko: '퀘벡에서 운전하거나 차를 빌리려면 필요합니다. 은행, 임대 계약 등에서 신분 확인에도 사용됩니다.',
    en: 'Required if you plan to drive or rent a car in Québec. Also accepted as ID for banking and lease agreements.',
    fr: "Requis si vous prévoyez de conduire ou de louer une voiture au Québec. Également accepté comme pièce d'identité.",
  },
  where: {
    ko: 'SAAQ (퀘벡 자동차 보험 공사) — 예약 방문 필요.',
    en: 'SAAQ (Société de l\'assurance automobile du Québec) — appointment required.',
    fr: 'SAAQ (Société de l\'assurance automobile du Québec) — rendez-vous requis.',
  },
  prepare: [
    { ko: '현재 보유 중인 외국 운전 면허증', en: 'Your current foreign driving licence', fr: 'Votre permis de conduire étranger actuel' },
    { ko: '여권 또는 퀘벡 주소 증명',        en: 'Passport or proof of Québec address', fr: "Passeport ou preuve d'adresse au Québec" },
    { ko: '일부 국가는 면허 교환 가능 — 해당 국가 확인 필요', en: 'Some licences can be exchanged — check your country', fr: 'Certains permis peuvent être échangés — vérifiez votre pays' },
  ] as Tri[],
  hakkyoNote: {
    ko: '퀘벡에서 운전할 계획이 없더라도 현지 면허증은 유용한 신분증이 됩니다. 국가에 따라 면허 교환이 가능할 수 있으니 SAAQ에서 확인하세요.',
    en: "Even if you don't plan to drive, a Québec licence is useful as local ID. Some countries have licence exchange agreements with Québec — check with SAAQ.",
    fr: "Même si vous ne prévoyez pas de conduire, un permis du Québec est utile comme pièce d'identité locale. Certains pays ont des accords d'échange de permis.",
  },
  url: 'https://saaq.gouv.qc.ca/en/drivers-licences/obtain-drivers-licence',
}

// ─── Community tips (static; future: pull from Supabase by tag) ──────────────

interface CommunityTip { author: string; text: string }
const COMMUNITY_TIPS: Record<string, CommunityTip[]> = {
  flights: [
    { author: 'Sora',    text: '항공권 예약 버튼을 누르고 10분 동안 화면만 바라봤어요. 정말 가는 건가 싶더라고요.' },
    { author: 'Min',     text: '경유 시간이 길어도 괜찮았어요. 도착한 순간 모든 게 시작됐으니까요.' },
  ],
  sim: [
    { author: 'Jiyeon',  text: '비행기 타기 전에 Fizz eSIM 미리 설치했어요. 747 버스 탈 때 이미 데이터 연결돼 있었고요.' },
    { author: 'Taeyang', text: '처음엔 Public Mobile로 시작했다가 한 달 뒤에 Fizz로 갔어요. 가격 차이가 별로 없어서 그냥 Fizz로 시작할 걸 싶었어요.' },
  ],
  banking: [
    { author: 'Haein',   text: 'TD 학생 계좌 스터디 퍼밋이랑 여권만 들고 갔는데 20분 만에 됐어요. 신용 기록 없어도 괜찮았어요.' },
    { author: 'Joon',    text: 'TD 체킹 계좌 만들고 Scotiabank StartRight 카드도 같이 만들었어요. 한국 크레딧 기록이 없어서 캐나다 크레딧부터 쌓아야 했거든요.' },
  ],
  transport: [
    { author: 'Mirae',   text: '공항에서 747 버스 타고 다운타운까지 왔어요. 50분 걸리는데 카드 대면 바로 됐어요.' },
    { author: 'Sungmin', text: '플라토에 살면 BIXI 정말 유용해요. 지하철보다 짧은 거리에선 훨씬 빨라요.' },
  ],
  stay: [
    { author: 'Yeonsu',  text: '처음 3주 Airbnb 잡고 그 사이에 Kijiji로 아파트 찾았어요. 생각보다 빨리 구해졌어요.' },
    { author: 'Clara',   text: 'Facebook Marketplace에서 Mile End 퍼니쉬드 서블렛 봤어요. 프랑스어로 메시지 보냈는데 기본적인 수준이어도 반응이 더 좋았어요.' },
  ],
  sin: [
    { author: 'Jiho',    text: 'Service Canada에 직접 갔어요. 줄이 좀 길었지만 서류만 다 들고 가면 그 자리에서 바로 받아요.' },
    { author: 'Eunji',   text: '온라인으로 신청하면 우편으로 오는데 2주 정도 걸렸어요. 급하지 않으면 온라인이 편해요.' },
  ],
  licence: [
    { author: 'Minjae',  text: 'SAAQ 가기 전에 예약 꼭 하세요. 안 하면 몇 시간 기다릴 수 있어요.' },
    { author: 'Soyeon',  text: '한국 면허증 공증 번역이 필요해요. 미리 준비해 가면 한 번에 끝나요.' },
  ],
  language: [
    { author: 'Jiyeon',  text: '2주 차에 언어 교환 나갔어요. 프랑스어 진짜 못 했는데 아무도 신경 안 썼어요. 그냥 말하면 되더라고요.' },
    { author: 'Minjun',  text: '카페에서 프랑스어로 주문해봤어요. 엉망이었는데도 점원이 같이 웃어줬어요. 그때부터 덜 무서웠어요.' },
  ],
}

// ─── Badge colour helper ──────────────────────────────────────────────────────

function badgeStyle(color: string) {
  const map: Record<string, { bg: string; color: string }> = {
    blue:   { bg: '#EFF6FF', color: '#1D4ED8' },
    yellow: { bg: 'var(--y-l)', color: '#92400E' },
    red:    { bg: '#FEF2F2', color: '#B91C1C' },
    green:  { bg: '#F0FDF4', color: '#15803D' },
    gray:   { bg: '#F3F4F6', color: '#374151' },
  }
  return map[color] ?? map.gray
}

// ─── Shared micro-components ──────────────────────────────────────────────────

function ExtLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
}

function HakkyoNote({ text }: { text: string }) {
  return (
    <div className="flex gap-2.5 rounded-xl px-3 py-2.5" style={{ background: 'var(--y-l)' }}>
      <span className="text-[12px] shrink-0 mt-0.5 font-bold" style={{ color: 'var(--y-h)' }}>—</span>
      <p className="text-[12px] text-amber-900 leading-snug font-medium">{text}</p>
    </div>
  )
}

function PrepareList({ items, lang }: { items: Tri[]; lang: string }) {
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-[12px] text-gray-600">
          <span className="shrink-0 mt-1 w-1 h-1 rounded-full bg-gray-400 inline-block" />
          {tri(item, lang)}
        </li>
      ))}
    </ul>
  )
}

function CommunityExperience({ section }: { section: string }) {
  const { t } = useLang()
  const tips = COMMUNITY_TIPS[section] ?? []
  if (tips.length === 0) return null
  return (
    <div className="border-t border-gray-100 pt-4 space-y-2.5">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
        {t('커뮤니티 경험', 'Community Experience', 'Expérience communautaire')}
      </p>
      {tips.map((tip, i) => (
        <div key={i} className="flex gap-2.5">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
            style={{ background: 'var(--y)', color: '#111' }}
          >
            {tip.author[0]}
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-700 mb-0.5">{tip.author}</p>
            <p className="text-[12px] text-gray-500 leading-[1.7]">{tip.text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function CommunityCTA({ to = '/board' }: { to?: string }) {
  const { t } = useLang()
  return (
    <div className="border-t border-gray-100 pt-4">
      <p className="text-[13px] font-semibold text-gray-800 mb-1">
        {t('비슷한 고민을 했던 사람들에게 물어보세요.', 'Ask people who went through the same thing.', 'Demandez à ceux qui sont passés par là.')}
      </p>
      <p className="text-[12px] text-gray-400 mb-3">
        {t('이미 몬트리올에 살고 있는 사람들에게 직접 물어볼 수 있습니다.', 'You can ask people who already live in Montréal.', 'Vous pouvez demander à des personnes qui vivent déjà à Montréal.')}
      </p>
      <Link
        to={to}
        className="inline-flex items-center px-4 py-2 rounded-lg text-[12px] font-semibold border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
      >
        {t('커뮤니티에 물어보기 →', 'Ask the community →', 'Demander à la communauté →')}
      </Link>
    </div>
  )
}

// ─── Action link helpers ──────────────────────────────────────────────────────

function ActionLinks({ label, items }: {
  label: string
  items: { name: string; href: string; primary?: boolean }[]
}) {
  const cls = (primary?: boolean) =>
    `inline-flex items-center px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
      primary ? '' : 'border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
    }`
  const style = (primary?: boolean) => primary ? { background: 'var(--y)', color: '#111' } : undefined

  return (
    <div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map(item =>
          item.href.startsWith('/') ? (
            <Link key={item.name} to={item.href} className={cls(item.primary)} style={style(item.primary)}>
              {item.name}
            </Link>
          ) : (
            <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer" className={cls(item.primary)} style={style(item.primary)}>
              {item.name}
            </a>
          )
        )}
      </div>
    </div>
  )
}

function ExpandToggle({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const { t } = useLang()
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-400 hover:text-gray-700 transition-colors"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
           style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
        <polyline points="6 9 12 15 18 9" />
      </svg>
      {expanded ? t('접기', 'Collapse', 'Réduire') : t('더 보기', 'More info', 'En savoir plus')}
    </button>
  )
}

// ─── Shared panel sub-components ─────────────────────────────────────────────

function PanelLabel({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-300 mb-2 mt-1">
      {children}
    </p>
  )
}

function WarnNote({ text }: { text: string }) {
  return (
    <div className="flex gap-2.5 rounded-xl px-3 py-2.5 bg-red-50">
      <span className="text-[12px] shrink-0 mt-0.5 font-bold text-red-400">!</span>
      <p className="text-[12px] text-red-700 leading-snug">{text}</p>
    </div>
  )
}

function OptionRow({ name, desc, href, primary }: { name: string; desc: string; href: string; primary?: boolean }) {
  const inner = (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-colors ${
      primary
        ? 'border-amber-200 bg-amber-50 hover:border-amber-300'
        : 'border-gray-100 bg-white hover:border-gray-200'
    }`}>
      <div className="min-w-0">
        <p className={`text-[13px] font-semibold leading-tight ${primary ? 'text-amber-900' : 'text-gray-800'}`}>{name}</p>
        <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{desc}</p>
      </div>
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" className="text-gray-300 shrink-0">
        <polyline points="6,3 11,8 6,13"/>
      </svg>
    </div>
  )
  return href.startsWith('/')
    ? <Link to={href}>{inner}</Link>
    : <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a>
}

// ─── Tool panels ──────────────────────────────────────────────────────────────

function FlightsPanel() {
  const { lang, t } = useLang()
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="space-y-4">
      <p className="t-body">
        {t(
          '항공권 예약은 몬트리올 이주의 첫 번째 결정입니다. 가격, 도착 시간, 경유 여부를 함께 비교하세요.',
          'Your flight is the first real commitment. Compare prices, arrival times, and layover options.',
          "Réserver votre vol est le premier engagement. Comparez prix, horaires et escales.",
        )}
      </p>
      <div className="flex gap-2 flex-wrap">
        <a href="https://www.google.com/travel/flights" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{height:40,padding:'0 16px',fontSize:14}}>Google Flights ↗</a>
        <a href="https://www.skyscanner.ca" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{height:40,padding:'0 16px',fontSize:14}}>Skyscanner ↗</a>
        <a href="https://www.kayak.ca" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{height:40,padding:'0 16px',fontSize:14}}>Kayak ↗</a>
      </div>
      <ExpandToggle expanded={expanded} onToggle={() => setExpanded(e => !e)} />
      {expanded && (
        <div className="space-y-4 pt-2">
          <div>
            <PanelLabel>{t('언제 예약할까요', 'When to book', 'Quand réserver')}</PanelLabel>
            <PrepareList lang={lang} items={[
              { ko: '출발 6–8주 전 예약이 가격 안정 구간입니다', en: '6–8 weeks before departure is the sweet spot for stable prices', fr: "Réserver 6–8 semaines à l'avance offre les prix les plus stables" },
              { ko: '화·수요일 검색 시 가격이 낮은 경향이 있습니다', en: 'Searching on Tuesday or Wednesday often shows lower prices', fr: 'Chercher le mardi ou mercredi affiche souvent des prix plus bas' },
              { ko: '성수기(6–8월, 12월)는 2–3개월 전 예약 권장', en: 'Peak season (Jun–Aug, Dec): book 2–3 months in advance', fr: "Haute saison (juin–août, déc.) : réservez 2–3 mois à l'avance" },
            ]} />
          </div>
          <div>
            <PanelLabel>{t('직항 vs 경유', 'Direct vs layover', 'Direct ou escale')}</PanelLabel>
            <PrepareList lang={lang} items={[
              { ko: '인천(ICN) → 몬트리올(YUL) 직항: 약 14시간, 대한항공·에어캐나다 운항', en: 'ICN → YUL direct: ~14h, Korean Air or Air Canada', fr: 'ICN → YUL direct : ~14h, Korean Air ou Air Canada' },
              { ko: '토론토·밴쿠버 경유: 2–5시간 추가, 하지만 더 저렴한 경우 많음', en: 'Via Toronto or Vancouver: 2–5 extra hours, often cheaper', fr: 'Via Toronto ou Vancouver : 2–5 heures de plus, souvent moins cher' },
              { ko: '경유 시 수하물 재수속 여부 반드시 확인', en: 'For layovers, confirm whether you need to recheck your luggage', fr: 'Pour les escales, vérifiez si vous devez récupérer vos bagages' },
            ]} />
          </div>
          <div>
            <PanelLabel>{t('도착 시간 팁', 'Arrival time tips', "Conseils d'arrivée")}</PanelLabel>
            <PrepareList lang={lang} items={[
              { ko: '오전 도착 추천 — 당일 은행 방문·SIM 개통 가능', en: 'Morning arrival recommended — you can visit a bank and set up SIM the same day', fr: 'Arriver le matin est recommandé — vous pouvez aller à la banque le jour même' },
              { ko: '심야 도착 시 택시/Uber 또는 747 버스 이용. 지하철은 자정 이후 운행 없음', en: 'Late night arrival: use taxi/Uber or the 747 bus. Metro does not run after midnight', fr: 'Arrivée tardive : taxi/Uber ou bus 747. Le métro ne fonctionne pas après minuit' },
            ]} />
          </div>
          <WarnNote text={t(
            '흔한 실수: 심야 도착 항공편 선택 후 당일 처리할 일이 없어서 하루 낭비. 첫날은 낮에 도착해서 바로 움직이는 게 좋습니다.',
            'Common mistake: choosing a late-night flight and losing your first day. Arrive during the day so you can start moving immediately.',
            'Erreur fréquente : choisir un vol de nuit et perdre votre première journée. Arrivez en journée pour commencer directement.',
          )} />
          <div>
            <PanelLabel>{t('항공권 검색', 'Search Flights', 'Rechercher des vols')}</PanelLabel>
            <div className="space-y-2">
              <OptionRow primary name="Google Flights" desc={t('가격 추이 그래프 제공, 날짜 유연하게 비교 가능', 'Price trend graphs, flexible date comparison', 'Graphiques de tendances, comparaison de dates flexible')} href="https://www.google.com/travel/flights" />
              <OptionRow name="Skyscanner" desc={t('월별 최저가 탐색에 유용', 'Useful for finding cheapest month to fly', 'Utile pour trouver le mois le moins cher')} href="https://www.skyscanner.ca" />
              <OptionRow name="Kayak" desc={t('가격 예측 기능 포함', 'Includes price prediction feature', 'Inclut une fonctionnalité de prédiction de prix')} href="https://www.kayak.ca" />
            </div>
          </div>
          <CommunityExperience section="flights" />
          <CommunityCTA />
        </div>
      )}
    </div>
  )
}

function SIMPanel() {
  const { lang, t } = useLang()
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="space-y-4">
      <p className="t-body">
        {t(
          '도착 당일 SIM을 개통하세요. eSIM이면 공항에서 바로 가능합니다.',
          'Set up your SIM on arrival day. eSIM means you can do it before you even leave the airport.',
          "Activez votre SIM dès l'arrivée. L'eSIM se configure avant même de quitter l'aéroport.",
        )}
      </p>
      <div className="flex gap-2 flex-wrap">
        <a href="https://fizz.ca" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{height:40,padding:'0 16px',fontSize:14}}>Fizz ↗</a>
        <a href="https://www.publicmobile.ca" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{height:40,padding:'0 16px',fontSize:14}}>Public Mobile ↗</a>
        <a href="https://www.freedommobile.ca" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{height:40,padding:'0 16px',fontSize:14}}>Freedom ↗</a>
      </div>
      <ExpandToggle expanded={expanded} onToggle={() => setExpanded(e => !e)} />
      {expanded && (
        <div className="space-y-4 pt-2">
          <div>
            <PanelLabel>{t('eSIM vs 실물 SIM', 'eSIM vs physical SIM', 'eSIM ou SIM physique')}</PanelLabel>
            <PrepareList lang={lang} items={[
              { ko: 'eSIM: 공항 도착 전 설정 가능, 기기 호환 여부 사전 확인 필요', en: 'eSIM: Set up before landing, check device compatibility in advance', fr: "eSIM : Configurez avant d'atterrir, vérifiez la compatibilité de l'appareil" },
              { ko: '실물 SIM: 편의점·통신사 매장에서 구매, 즉시 사용', en: 'Physical SIM: Available at convenience stores or carrier shops, instant use', fr: 'SIM physique : Disponible en dépanneur ou boutique opérateur, utilisation immédiate' },
              { ko: 'Fizz, Public Mobile, Koodo는 eSIM 지원', en: 'Fizz, Public Mobile, Koodo support eSIM', fr: "Fizz, Public Mobile, Koodo supportent l'eSIM" },
            ]} />
          </div>
          <div>
            <PanelLabel>{t('가입 전 확인 사항', 'Before you sign up', 'Avant de vous inscrire')}</PanelLabel>
            <PrepareList lang={lang} items={[
              { ko: '데이터 무제한 여부 확인 (실제 무제한인지, 속도 제한인지)', en: "Check if 'unlimited' data is truly unlimited or speed-throttled after a cap", fr: "Vérifiez si les données 'illimitées' sont vraiment illimitées ou bridées" },
              { ko: '장기 계약 vs 월 단위 요금제 — 처음엔 유연한 월정액 추천', en: 'Long-term contract vs. monthly plan — flexible monthly recommended at first', fr: 'Contrat long terme vs mensuel — optez pour le mensuel au début' },
              { ko: '국제전화 포함 여부 확인', en: 'Check if international calling is included', fr: 'Vérifiez si les appels internationaux sont inclus' },
            ]} />
          </div>
          <WarnNote text={t(
            '흔한 실수: 공항 내 통신사에서 비싼 요금제 가입. 공항을 벗어난 뒤 온라인 또는 시내 매장에서 가입하면 더 저렴합니다.',
            'Common mistake: signing up with a carrier kiosk at the airport. Getting online or visiting a store in the city is almost always cheaper.',
            "Erreur fréquente : s'inscrire au kiosque de l'aéroport. Passer par internet ou une boutique en ville est presque toujours moins cher.",
          )} />
          <div>
            <PanelLabel>{t('통신사 비교', 'Compare Carriers', 'Comparer les opérateurs')}</PanelLabel>
            <div className="space-y-2">
              <OptionRow primary name="Fizz" desc={t('eSIM 지원, 월 $30–45, 유연한 요금제. 첫 달 가장 추천', 'eSIM supported, $30–45/mo, flexible plans. Best for first month', 'eSIM disponible, 30–45 $/mois, forfaits flexibles. Meilleur choix initial')} href="https://fizz.ca" />
              <OptionRow name="Public Mobile" desc={t('가장 저렴, 6개월 이상 사용 시 할인 누적', 'Cheapest, discounts accumulate after 6+ months', 'Le moins cher, réductions cumulées après 6 mois+')} href="https://www.publicmobile.ca" />
              <OptionRow name="Freedom Mobile" desc={t('학생 할인, 무제한 요금제 제공', 'Student discounts, unlimited plans available', 'Réductions étudiants, forfaits illimités disponibles')} href="https://www.freedommobile.ca" />
              <OptionRow name="Koodo" desc={t('대형 통신사(Telus) 품질, 중간 가격대', 'Major carrier (Telus) quality, mid-range pricing', 'Qualité grande marque (Telus), prix intermédiaires')} href="https://www.koodomobile.com" />
              <OptionRow name="Bell / Rogers / Telus" desc={t('가장 안정적이나 가격 높음, 계약 조건 확인 필수', 'Most reliable but expensive, check contract terms', 'Plus fiables mais plus chers, vérifiez les conditions')} href="https://www.bell.ca" />
            </div>
          </div>
          <CommunityExperience section="sim" />
          <CommunityCTA />
        </div>
      )}
    </div>
  )
}

function BankingPanel() {
  const { lang, t } = useLang()
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="space-y-4">
      <p className="t-body">
        {t(
          '도착 후 첫 주 안에 은행 계좌를 여세요. 이민자 전용 패키지가 있는 은행부터 시작하세요.',
          'Open a bank account in your first week. Start with banks that have newcomer packages — no Canadian credit history needed.',
          "Ouvrez un compte bancaire dans votre première semaine. Commencez par les banques avec forfaits nouvel arrivant.",
        )}
      </p>
      <div className="flex gap-2 flex-wrap">
        <a href="https://www.td.com/ca/en/personal-banking/solutions/new-to-canada" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{height:40,padding:'0 16px',fontSize:14}}>TD StartRight ↗</a>
        <a href="https://www.scotiabank.com/ca/en/personal/bank-accounts/chequing-accounts/startright.html" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{height:40,padding:'0 16px',fontSize:14}}>Scotiabank ↗</a>
        <a href="https://www.desjardins.com" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{height:40,padding:'0 16px',fontSize:14}}>Desjardins ↗</a>
      </div>
      <ExpandToggle expanded={expanded} onToggle={() => setExpanded(e => !e)} />
      {expanded && (
        <div className="space-y-4 pt-2">
          <div>
            <PanelLabel>{t('필요 서류', 'What to bring', 'Documents requis')}</PanelLabel>
            <PrepareList lang={lang} items={[
              { ko: '여권 (필수)', en: 'Passport (required)', fr: 'Passeport (obligatoire)' },
              { ko: '비자 또는 이민 서류 (영주권, 학생비자, 워홀 등)', en: 'Visa or immigration document (PR, study permit, work permit, etc.)', fr: "Visa ou document d'immigration (RP, permis d'études, permis de travail, etc.)" },
              { ko: '캐나다 주소 (임시 주소도 가능)', en: 'Canadian address (temporary address is fine)', fr: 'Adresse canadienne (une adresse temporaire est acceptée)' },
              { ko: 'SIN 없어도 개설 가능 — 나중에 제출 가능', en: 'SIN not required to open — you can provide it later', fr: 'NAS non requis pour ouvrir — vous pouvez le fournir plus tard' },
            ]} />
          </div>
          <div>
            <PanelLabel>{t('직불카드 vs 신용카드', 'Debit vs credit card', 'Débit vs carte de crédit')}</PanelLabel>
            <PrepareList lang={lang} items={[
              { ko: '캐나다 직불카드는 Interac 시스템 — 한국 카드와 다름', en: 'Canadian debit uses Interac — different from Korean systems', fr: 'Le débit canadien utilise Interac — différent des systèmes coréens' },
              { ko: '신용카드는 신용 기록 없이 처음엔 발급 어려움 — 보안 신용카드(Secured Card) 고려', en: 'Credit cards are hard to get without credit history — consider a secured credit card', fr: "Les cartes de crédit sans historique sont difficiles à obtenir — envisagez une carte sécurisée" },
              { ko: 'TD, Scotia 이민자 패키지는 신용 기록 없이 신용카드 발급 가능', en: 'TD and Scotia newcomer packages offer credit cards without Canadian credit history', fr: 'Les forfaits TD et Scotia offrent des cartes de crédit sans historique canadien' },
            ]} />
          </div>
          <WarnNote text={t(
            '흔한 실수: 은행 계좌 없이 현금만 들고 다니기. 캐나다는 e-Transfer 및 Interac 결제가 일상이라 계좌 없으면 불편합니다.',
            'Common mistake: relying on cash only. Canada runs on e-Transfer and Interac — a bank account is essential from day one.',
            'Erreur fréquente : se fier uniquement aux espèces. Le Canada fonctionne avec e-Transfer et Interac — un compte est essentiel dès le premier jour.',
          )} />
          <div>
            <PanelLabel>{t('은행 비교', 'Compare Banks', 'Comparer les banques')}</PanelLabel>
            <div className="space-y-2">
              <OptionRow primary name="TD StartRight" desc={t('신규 이민자 전용, 신용 기록 없어도 개설 가능', 'Designed for newcomers, no Canadian credit history needed', 'Pour les nouveaux arrivants, sans historique de crédit canadien')} href="https://www.td.com/ca/en/personal-banking/solutions/new-to-canada" />
              <OptionRow name="Scotiabank StartRight" desc={t('이민자 패키지, 수수료 1년 면제 포함', 'Newcomer package includes 1 year of free banking', 'Forfait nouvel arrivant avec 1 an de frais bancaires gratuits')} href="https://www.scotiabank.com/ca/en/personal/bank-accounts/chequing-accounts/startright.html" />
              <OptionRow name="Desjardins" desc={t('퀘벡 기반 신협, 프랑스어 서비스 강점, 지역 밀착형', 'Québec credit union, strong French service, community-focused', 'Coopérative québécoise, excellent service en français, ancrage local')} href="https://www.desjardins.com" />
              <OptionRow name="RBC" desc={t('캐나다 최대 은행, 지점 많음, 수수료 있음', "Canada's largest bank, many branches, fees apply", 'La plus grande banque du Canada, nombreuses succursales, frais applicables')} href="https://www.rbcroyalbank.com" />
            </div>
          </div>
          <CommunityExperience section="banking" />
          <CommunityCTA />
        </div>
      )}
    </div>
  )
}

function TransportPanel() {
  const { lang, t } = useLang()
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="space-y-4">
      <p className="t-body">
        {t(
          '몬트리올 지하철(STM)과 버스로 대부분의 일상이 해결됩니다. OPUS 카드를 먼저 챙기세요.',
          "Montreal's STM metro and bus network covers most of daily life. Get your OPUS card first.",
          "Le réseau STM (métro et bus) couvre la majorité du quotidien à Montréal. Procurez-vous d'abord une carte OPUS.",
        )}
      </p>
      <div className="flex gap-2 flex-wrap">
        <a href="https://www.stm.info" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{height:40,padding:'0 16px',fontSize:14}}>STM ↗</a>
        <a href="https://bixi.com" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{height:40,padding:'0 16px',fontSize:14}}>BIXI ↗</a>
        <a href="https://www.communauto.com" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{height:40,padding:'0 16px',fontSize:14}}>Communauto ↗</a>
      </div>
      <ExpandToggle expanded={expanded} onToggle={() => setExpanded(e => !e)} />
      {expanded && (
        <div className="space-y-4 pt-2">
          <div>
            <PanelLabel>{t('OPUS 카드 사용법', 'Using the OPUS card', "Utiliser la carte OPUS")}</PanelLabel>
            <PrepareList lang={lang} items={[
              { ko: 'OPUS 카드: 지하철역 자판기에서 $6에 구매, 충전식', en: 'OPUS card: Buy at metro station machines for $6, then load trips or passes', fr: 'Carte OPUS : achetez aux machines des stations de métro pour 6 $, puis rechargez' },
              { ko: '월정기권(All-in-One): 약 $100/월, 무제한 탑승', en: 'Monthly pass (All-in-One): ~$100/month, unlimited rides', fr: 'Passe mensuelle (Tout-en-un) : ~100 $/mois, trajets illimités' },
              { ko: '학생 할인: 유효한 학생증 소지 시 약 30% 할인', en: 'Student discount: ~30% off with valid student ID', fr: 'Réduction étudiant : ~30 % de rabais avec une carte étudiante valide' },
            ]} />
          </div>
          <div>
            <PanelLabel>{t('공항에서 시내로', 'Airport to city', "De l'aéroport à la ville")}</PanelLabel>
            <PrepareList lang={lang} items={[
              { ko: '747 버스: 공항 ↔ 다운타운 24시간 운행, 약 $11 (OPUS 사용 가능)', en: '747 bus: Airport ↔ downtown, runs 24/7, ~$11 (OPUS accepted)', fr: 'Bus 747 : aéroport ↔ centre-ville, 24h/24, ~11 $ (OPUS accepté)' },
              { ko: 'Uber/Taxi: 약 $40–55, 야간에는 이 방법이 편리함', en: 'Uber/Taxi: ~$40–55, best option late at night', fr: 'Uber/Taxi : ~40–55 $, meilleure option en soirée' },
            ]} />
          </div>
          <div>
            <PanelLabel>{t('이동 수단 비교', 'Getting around', 'Se déplacer')}</PanelLabel>
            <div className="space-y-2">
              <OptionRow primary name="STM — Métro & Bus" desc={t('노선도, 시간표, OPUS 카드 정보', 'Route maps, schedules, OPUS card info', 'Plans de lignes, horaires, info carte OPUS')} href="https://www.stm.info" />
              <OptionRow name="747 Airport Bus" desc={t('공항 ↔ 다운타운 24시간, 약 $11', 'Airport ↔ downtown 24/7, ~$11', 'Aéroport ↔ centre-ville 24h/24, ~11 $')} href="https://www.stm.info/en/info/networks/bus/shuttle/more-about-747-YUL-Aeroport-P-E-Trudeau-Montreal-shuttle" />
              <OptionRow name="BIXI" desc={t('자전거 공유, 5월–11월, 연간 $15', 'Bike sharing, May–Nov, $15/year', 'Vélos en libre-service, mai–nov, 15 $/an')} href="https://bixi.com" />
              <OptionRow name="Communauto" desc={t('시간 단위 카셰어링, 이사·장보기·나들이', 'Hourly car-sharing, moving/groceries/day trips', "Autopartage à l'heure, déménagement/courses/sorties")} href="https://www.communauto.com" />
              <OptionRow name="Turo" desc={t('개인 간 차량 렌트, 렌터카보다 저렴', 'Peer-to-peer car rental, often cheaper than agencies', 'Location entre particuliers, souvent moins cher')} href="https://turo.com/ca/en" />
            </div>
          </div>
          <CommunityExperience section="transport" />
          <CommunityCTA />
        </div>
      )}
    </div>
  )
}

function StayPanel() {
  const { lang, t } = useLang()
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="space-y-4">
      <p className="t-body">
        {t(
          '처음 1–2주는 Airbnb나 단기 서블렛으로 시작하세요. 도시를 파악한 뒤 장기 숙소를 결정하는 게 훨씬 낫습니다.',
          'Start with Airbnb or a short sublet for the first 1–2 weeks. You will make better long-term housing decisions once you know the city.',
          "Commencez par un Airbnb ou une sous-location pour les 1–2 premières semaines. Vous prendrez de meilleures décisions une fois la ville mieux connue.",
        )}
      </p>
      <div className="flex gap-2 flex-wrap">
        <a href="https://www.airbnb.ca" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{height:40,padding:'0 16px',fontSize:14}}>Airbnb ↗</a>
        <a href="https://www.facebook.com/marketplace" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{height:40,padding:'0 16px',fontSize:14}}>FB Marketplace ↗</a>
        <a href="https://www.kijiji.ca" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{height:40,padding:'0 16px',fontSize:14}}>Kijiji ↗</a>
      </div>
      <ExpandToggle expanded={expanded} onToggle={() => setExpanded(e => !e)} />
      {expanded && (
        <div className="space-y-4 pt-2">
          <div>
            <PanelLabel>{t('어디서 머물까요', 'Where to stay first', 'Où séjourner au début')}</PanelLabel>
            <PrepareList lang={lang} items={[
              { ko: 'Airbnb: 즉시 예약, 가구 완비, 중심부에 많음', en: 'Airbnb: Instant booking, fully furnished, lots of options near the centre', fr: "Airbnb : réservation immédiate, entièrement meublé, nombreuses options près du centre" },
              { ko: 'Facebook Marketplace 서블렛: 가격 저렴, 프랑스어로 메시지 추천', en: 'Facebook Marketplace sublets: Lower prices, message in French for better response', fr: 'Sous-locations Facebook Marketplace : prix plus bas, écrivez en français' },
              { ko: 'Kijiji: 방 임대, 하우스메이트 포함 옵션 많음', en: 'Kijiji: Room rentals with housemate options', fr: 'Kijiji : locations de chambres avec options de colocataires' },
            ]} />
          </div>
          <div>
            <PanelLabel>{t('단기 vs 장기', 'Short-term vs long-term', 'Court terme vs long terme')}</PanelLabel>
            <PrepareList lang={lang} items={[
              { ko: '처음 2주: 단기 숙소로 동네 탐색 후 결정', en: 'First 2 weeks: Use short-term to explore neighbourhoods before committing', fr: 'Les 2 premières semaines : logement temporaire pour explorer les quartiers' },
              { ko: '장기 임대: 보증금 + 1달치 월세 필요, 신분증·레퍼런스 요구됨', en: 'Long-term rental: Requires deposit + 1 month rent, plus ID and references', fr: "Location longue durée : dépôt + 1 mois de loyer, pièce d'identité et références requises" },
              { ko: '퀘벡 임대차법: 7월 1일 이사 시즌, 계약 주의', en: 'Quebec lease law: July 1 is peak moving season — plan contracts carefully', fr: 'Bail au Québec : le 1er juillet est la saison des déménagements — planifiez soigneusement' },
            ]} />
          </div>
          <WarnNote text={t(
            '흔한 실수: 온라인 사진만 보고 장기 계약 체결. 직접 방문 전 최소 1주일은 단기 숙소에서 지내며 동네를 파악하세요.',
            'Common mistake: signing a long-term lease from photos alone. Stay short-term for at least a week and visit in person first.',
            'Erreur fréquente : signer un bail à long terme sur la base des photos seulement. Restez en location courte durée au moins une semaine et visitez en personne.',
          )} />
          <CommunityExperience section="stay" />
          <CommunityCTA />
        </div>
      )}
    </div>
  )
}

function SINPanel() {
  const { lang, t } = useLang()
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="space-y-4">
      <p className="t-body">
        {t(
          'SIN(사회보험번호)은 일을 하거나 세금 신고를 위해 반드시 필요합니다. 온라인으로 신청하면 2주 내 수령합니다.',
          'Your SIN (Social Insurance Number) is required to work and file taxes. Apply online and receive it by mail in about 2 weeks.',
          "Le NAS (numéro d'assurance sociale) est requis pour travailler et déclarer vos impôts. Faites la demande en ligne pour le recevoir par courrier en ~2 semaines.",
        )}
      </p>
      <div className="flex gap-2 flex-wrap">
        <a href="https://www.canada.ca/en/employment-social-development/services/sin/apply.html" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{height:40,padding:'0 16px',fontSize:14}}>Apply Online ↗</a>
        <a href="https://www.servicecanada.gc.ca/tbsc-fsco/sc-hme.jsp?lang=eng" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{height:40,padding:'0 16px',fontSize:14}}>Find Office ↗</a>
      </div>
      <ExpandToggle expanded={expanded} onToggle={() => setExpanded(e => !e)} />
      {expanded && (
        <div className="space-y-4 pt-2">
          <div>
            <PanelLabel>{t('신청 전 준비', 'Before you apply', 'Avant de faire la demande')}</PanelLabel>
            <PrepareList lang={lang} items={[
              { ko: '여권 + 비자/이민 서류 스캔 파일 준비', en: 'Have scans of your passport and immigration document ready', fr: "Préparez les scans de votre passeport et de votre document d'immigration" },
              { ko: '캐나다 주소 필요 (임시 주소 가능)', en: 'Canadian mailing address required (temporary is fine)', fr: 'Adresse postale canadienne requise (temporaire acceptée)' },
              { ko: '온라인 신청: 2주 내 우편 수령', en: 'Online application: received by mail in ~2 weeks', fr: 'Demande en ligne : reçu par courrier en ~2 semaines' },
              { ko: 'Service Canada 직접 방문: 당일 확인서 발급, 예약 권장', en: 'Service Canada office: same-day confirmation letter, appointment recommended', fr: 'Bureau Service Canada : lettre de confirmation le jour même, rendez-vous recommandé' },
            ]} />
          </div>
          <div>
            <PanelLabel>{t('SIN 사용 주의사항', 'Using your SIN safely', 'Utiliser votre NAS en sécurité')}</PanelLabel>
            <PrepareList lang={lang} items={[
              { ko: 'SIN은 고용주, 은행, 세금 신고에만 제공', en: 'Share SIN only with your employer, bank, and tax authorities', fr: 'Ne partagez votre NAS que avec votre employeur, banque et autorités fiscales' },
              { ko: '절대 이메일·채팅으로 공유하지 마세요', en: 'Never share it via email or chat', fr: 'Ne le partagez jamais par e-mail ou messagerie' },
            ]} />
          </div>
          <CommunityExperience section="sin" />
          <CommunityCTA />
        </div>
      )}
    </div>
  )
}

function DriverLicencePanel() {
  const { lang, t } = useLang()
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="space-y-4">
      <p className="t-body">
        {t(
          '퀘벡 면허 전환은 도착 후 90일 내에 시작하세요. 한국 면허 소지자는 필기·실기 시험 없이 전환 가능합니다.',
          'Start your Québec licence transfer within 90 days of arrival. Korean licence holders can convert without written or road tests.',
          "Commencez le transfert de votre permis québécois dans les 90 jours suivant votre arrivée. Les titulaires d'un permis coréen peuvent le convertir sans examen.",
        )}
      </p>
      <div className="flex gap-2 flex-wrap">
        <a href="https://saaq.gouv.qc.ca/en/drivers-licences/obtain-drivers-licence" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{height:40,padding:'0 16px',fontSize:14}}>SAAQ ↗</a>
      </div>
      <ExpandToggle expanded={expanded} onToggle={() => setExpanded(e => !e)} />
      {expanded && (
        <div className="space-y-4 pt-2">
          <div>
            <PanelLabel>{t('필요 서류', 'What to bring', 'Documents à apporter')}</PanelLabel>
            <PrepareList lang={lang} items={[
              { ko: '한국 운전면허증 원본 + 공증 번역본', en: "Korean driver's licence (original) + certified translation", fr: 'Permis de conduire coréen (original) + traduction certifiée' },
              { ko: '여권', en: 'Passport', fr: 'Passeport' },
              { ko: '퀘벡 거주 증빙 (임시 주소 가능)', en: 'Proof of Québec address (temporary is fine)', fr: "Preuve d'adresse québécoise (temporaire acceptée)" },
              { ko: '시력 검사 ($15 내외, SAAQ 방문 시 현장 가능)', en: 'Vision test (~$15, can be done on-site at SAAQ)', fr: 'Test de vision (~15 $, peut être effectué sur place à la SAAQ)' },
            ]} />
          </div>
          <div>
            <PanelLabel>{t('방문 절차', 'Visit process', 'Processus de visite')}</PanelLabel>
            <PrepareList lang={lang} items={[
              { ko: '온라인 예약 필수 (워크인은 2–3시간 대기)', en: 'Online booking strongly recommended (walk-in: 2–3 hour wait)', fr: "Réservation en ligne fortement recommandée (sans RDV : 2–3 heures d'attente)" },
              { ko: '수수료 약 $27–35 (현장 카드 결제 가능)', en: 'Fee ~$27–35 (card payment accepted on-site)', fr: 'Frais ~27–35 $ (paiement par carte accepté sur place)' },
            ]} />
          </div>
          <WarnNote text={t(
            '흔한 실수: 90일 기한을 놓쳐 필기·실기 시험을 다시 봐야 하는 경우. 달력에 꼭 표시해두세요.',
            'Common mistake: missing the 90-day window and having to take written and road tests from scratch. Put a reminder in your calendar.',
            'Erreur fréquente : rater la fenêtre de 90 jours et devoir repasser les examens. Mettez un rappel dans votre calendrier.',
          )} />
          <CommunityExperience section="licence" />
          <CommunityCTA />
        </div>
      )}
    </div>
  )
}

function LanguagePanel() {
  const { lang, t } = useLang()
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="space-y-4">
      <p className="t-body">
        {t(
          '몬트리올에서는 프랑스어가 일상입니다. HAKKYO 언어 교환으로 실생활 표현부터 시작하세요.',
          'French is part of daily life in Montréal. Start with HAKKYO language exchange for real-world phrases.',
          "Le français fait partie du quotidien à Montréal. Commencez par l'échange linguistique HAKKYO pour les expressions de la vie réelle.",
        )}
      </p>
      <div className="flex gap-2 flex-wrap">
        <a href="/programs?type=language-exchange" className="btn-primary" style={{height:40,padding:'0 16px',fontSize:14}}>{t('HAKKYO 언어 교환', 'HAKKYO Exchange', 'Échange HAKKYO')}</a>
        <a href="/programs?language=french" className="btn-secondary" style={{height:40,padding:'0 16px',fontSize:14}}>{t('프랑스어 수업', 'French Classes', 'Cours de français')}</a>
        <a href="/programs?language=english" className="btn-secondary" style={{height:40,padding:'0 16px',fontSize:14}}>{t('영어 수업', 'English Classes', "Cours d'anglais")}</a>
      </div>
      <ExpandToggle expanded={expanded} onToggle={() => setExpanded(e => !e)} />
      {expanded && (
        <div className="space-y-4 pt-2">
          <div>
            <PanelLabel>{t('어떤 언어부터 시작할까요', 'Which language to start with', 'Par quelle langue commencer')}</PanelLabel>
            <PrepareList lang={lang} items={[
              { ko: '프랑스어: 퀘벡 취업·임대·행정에 필수, 기초부터 시작해도 충분', en: 'French: Essential for Québec jobs, rentals, and admin — even basics open doors', fr: "Français : essentiel pour l'emploi, la location et l'administration au Québec — même les bases aident" },
              { ko: '영어: 비즈니스·다운타운에서 주로 사용, 몬트리올은 이중언어 도시', en: 'English: Used in business and downtown — Montréal is bilingual', fr: 'Anglais : utilisé en affaires et au centre-ville — Montréal est bilingue' },
              { ko: '언어 교환: 실생활 표현 + 현지 친구 사귀기, 가장 빠른 방법', en: 'Language exchange: Real-world phrases + local friendships, fastest learning path', fr: 'Échange linguistique : expressions réelles + amitiés locales, la voie la plus rapide' },
            ]} />
          </div>
          <div>
            <PanelLabel>{t('프로그램 비교', 'Program comparison', 'Comparaison des programmes')}</PanelLabel>
            <div className="space-y-2">
              <OptionRow primary name={t('HAKKYO 언어 교환', 'HAKKYO Language Exchange', 'Échange linguistique HAKKYO')} desc={t('한국어·영어·프랑스어 교환, 소규모, 정기 모임', 'Korean / English / French exchange, small groups, regular meetups', 'Échange coréen/anglais/français, petits groupes, rencontres régulières')} href="/programs?type=language-exchange" />
              <OptionRow name={t('HAKKYO 프랑스어 수업', 'HAKKYO French Classes', 'Cours de français HAKKYO')} desc={t('초급부터 중급까지', 'Beginner to intermediate', 'Débutant à intermédiaire')} href="/programs?language=french" />
              <OptionRow name={t('HAKKYO 영어 수업', 'HAKKYO English Classes', "Cours d'anglais HAKKYO")} desc={t('일상 영어, 발음, 비즈니스 영어', 'Everyday English, pronunciation, business English', "Anglais quotidien, prononciation, anglais des affaires")} href="/programs?language=english" />
              <OptionRow name="Alliance Française Montréal" desc={t('레벨별 정규 프랑스어 수업', 'Structured French courses at all levels', 'Cours de français structurés à tous les niveaux')} href="https://www.alliance-francaise.ca/montreal" />
              <OptionRow name="McGill Continuing Education" desc={t('저렴한 저녁 수업, 다양한 언어', 'Affordable evening classes, multiple languages', 'Cours du soir abordables, plusieurs langues')} href="https://www.mcgill.ca/continuingstudies" />
            </div>
          </div>
          <CommunityExperience section="language" />
          <CommunityCTA />
        </div>
      )}
    </div>
  )
}

// ─── Tool tabs ────────────────────────────────────────────────────────────────

const TOOL_TABS: Array<{ id: string; icon: React.ReactNode } & Tri> = [
  { id: 'flights',   icon: <IcoFlight />,  ko: '항공편',         en: 'Flights',              fr: 'Vols'              },
  { id: 'sim',       icon: <IcoSIM />,     ko: '유심 카드',      en: 'SIM Cards',            fr: 'Cartes SIM'        },
  { id: 'banking',   icon: <IcoBank />,    ko: '은행',           en: 'Banking',              fr: 'Banque'            },
  { id: 'transport', icon: <IcoTransit />, ko: '교통',           en: 'Transport',            fr: 'Transport'         },
  { id: 'stay',      icon: <IcoBed />,     ko: '첫 숙소',        en: 'First Stay',           fr: 'Premier Logement'  },
  { id: 'sin',       icon: <IcoID />,      ko: 'SIN Number',     en: 'SIN Number',           fr: 'NAS'               },
  { id: 'licence',   icon: <IcoCar />,     ko: '운전 면허증',    en: "Driver's Licence",     fr: 'Permis de conduire'},
  { id: 'language',  icon: <IcoLang />,    ko: '언어',           en: 'Language',             fr: 'Langue'            },
]

// Maps each checklist item to the Essential Tools tab it should open
const CHECKLIST_TAB_MAP: Record<string, string> = {
  flight:   'flights',
  stay:     'stay',
  sim:      'sim',
  bank:     'banking',
  sin:      'sin',
  opus:     'transport',
  licence:  'licence',
  exchange: 'language',
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Arriving() {
  const { lang, t } = useLang()
  const [checked, setChecked] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]')) }
    catch { return new Set() }
  })
  const [activeTab, setActiveTab] = useState('flights')
  const [flash, setFlash] = useState<{ msg: string; visible: boolean } | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toolsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify([...checked])) }
    catch {}
  }, [checked])

  function showFlash(msg: string) {
    if (flashTimer.current) clearTimeout(flashTimer.current)
    setFlash({ msg, visible: true })
    flashTimer.current = setTimeout(() => {
      setFlash(f => f ? { ...f, visible: false } : null)
      flashTimer.current = setTimeout(() => setFlash(null), 350)
    }, 2500)
  }

  function toggle(id: string) {
    const willCheck = !checked.has(id)
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    if (willCheck) {
      const m = MILESTONE_MESSAGES[id]
      if (m) showFlash(tri(m, lang))
    }
  }

  const pct = Math.round((checked.size / CHECKLIST.length) * 100)

  return (
    <div className="w-full min-h-screen bg-white pb-24">
      <div className="max-w-[720px] mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="pt-6 pb-10 md:pt-8 md:pb-14">
          <p className="t-eyebrow text-gray-400 mb-5">{t('나의 여정', 'My Journey', 'Mon parcours')}</p>
          <h1 className="t-page text-gray-900 mb-5">
            {t('첫 걸음', 'First Steps', 'Premiers Pas')}
          </h1>
          <p style={{ fontSize: '17px', lineHeight: '1.7' }} className="text-gray-500 max-w-[500px]">
            {t(
              '몬트리올 도착 전후로 필요한 모든 것을 한 곳에서.',
              'Everything you need to move to Montréal — without opening 20 other tabs.',
              "Tout ce qu'il vous faut pour vous installer à Montréal.",
            )}
          </p>
        </div>

        {/* ── Narrative Anchor ── */}
        <p style={{ fontSize: '15px', lineHeight: '1.8' }} className="text-gray-400 italic mb-10">
          {t(
            '아직도 그 날을 기억하는 사람들이 있어요. 처음 항공권을 예약한 날.',
            'Many people still remember the day they booked their flight.',
            'Beaucoup se souviennent encore du jour où ils ont réservé leur vol.',
          )}
        </p>

        {/* ── Progress Tracker ── */}
        <div className="border border-gray-200 rounded-2xl px-5 py-5 mb-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 style={{ fontSize: "17px" }} className="font-bold text-gray-900">
              {t('나의 몬트리올 준비', 'Your Montréal Progress', 'Votre Progression')}
            </h2>
            {/* Human-readable count instead of large % */}
            <span className="text-[12px] text-gray-400 shrink-0">
              {checked.size} / {CHECKLIST.length} {t('완료', 'done', 'fait')}
            </span>
          </div>

          <p className="text-[12px] text-gray-400 mb-3 leading-snug">
            {getJourneyMessage(pct, lang)}
          </p>

          <div className="h-[2px] bg-gray-100 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: 'var(--y)' }}
            />
          </div>

          {/* Milestone flash */}
          <div
            style={{
              maxHeight: flash ? 44 : 0,
              opacity: flash?.visible ? 1 : 0,
              marginBottom: flash ? 12 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.25s ease, opacity 0.35s ease, margin-bottom 0.25s ease',
            }}
          >
            {flash && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium" style={{ background: 'var(--y-l)', color: '#92400E' }}>
                <span className="text-[12px] font-bold" style={{ color: 'var(--y-h)' }}>→</span>
                <span>{flash.msg}</span>
              </div>
            )}
          </div>

          {/* Two-column grid on sm+, single column on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-0.5">
            {CHECKLIST.map(item => {
              const isDone = checked.has(item.id)
              const tabTarget = CHECKLIST_TAB_MAP[item.id]
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
                  {/* subtle hint that item links to a guide */}
                  {tabTarget && !isDone && (
                    <span className="text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      →
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Completion note — editorial, shown only at 100% ── */}
        {pct === 100 && (
          <div className="border border-gray-200 rounded-2xl px-5 py-5 mb-6 bg-white">
            <p className="text-[14px] font-semibold text-gray-900 mb-3">
              {t('몬트리올에 도착하셨네요.', 'You\'ve arrived in Montréal.', 'Vous êtes arrivé·e à Montréal.')}
            </p>
            <p className="text-[13px] text-gray-500 leading-[1.85] mb-4">
              {t(
                '집을 구하고,\n사람을 만나고,\n언어를 배우며,\n\n이 도시를 조금씩 알아갈 차례입니다.',
                "Find a home,\nmeet people,\nlearn the language,\n\nand get to know this city, one step at a time.",
                "Trouvez un logement,\nrencontrez des gens,\napprenez la langue,\n\net découvrez cette ville, pas à pas.",
              ).split('\n').map((line, i) => (
                <span key={i}>{line}{i < 4 ? <br /> : null}</span>
              ))}
            </p>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-[13px] font-semibold text-gray-800 mb-1">
                {t('학교 친구들아, 모여라!', 'Meet people in Montréal', 'Rencontrez des gens à Montréal')}
              </p>
              <p className="text-[12px] text-gray-400 mb-4">
                {t(
                  '한국어 · 영어 · 프랑스어 · 언어 교환',
                  'Korean · English · French · Language exchange',
                  'Coréen · Anglais · Français · Échange linguistique',
                )}
              </p>
              <Link
                to="/programs"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-gray-900 hover:opacity-70 transition-opacity"
              >
                <span
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-[12px] font-bold mr-1"
                  style={{ background: 'var(--y)', color: '#111' }}
                >
                  →
                </span>
                {t('프로그램 보기', 'Browse Programs', 'Voir les programmes')}
              </Link>
            </div>
          </div>
        )}

        {/* ── Essential Tools ── */}
        <div className="border-t border-gray-100 mt-14 mb-14" />
        <div className="mb-8" ref={toolsRef}>
          <p className="t-eyebrow text-gray-400 mb-4">{t('필수 가이드', 'Essential Guides', 'Guides essentiels')}</p>
          <h2 className="t-section text-gray-900 mb-3">
            {t('필수 도구', 'Essential Tools', 'Outils Essentiels')}
          </h2>
          <p style={{ fontSize: '16px', lineHeight: '1.7' }} className="text-gray-500 mb-8 max-w-[480px]">
            {t(
              '링크 목록이 아닌, 결정을 내리는 데 필요한 모든 정보.',
              'Everything you need to make decisions — not just a list of links.',
              "Tout ce qu'il faut pour décider — pas seulement une liste de liens.",
            )}
          </p>

          {/* Tab navigation — segmented, horizontal scroll on mobile */}
          <div className="overflow-x-auto pb-1 -mx-1 px-1 mb-8">
            <div className="flex gap-2 min-w-max">
              {TOOL_TABS.map(tab => {
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2.5 rounded-2xl border transition-all whitespace-nowrap"
                    style={active
                      ? { background: '#111', borderColor: '#111', color: '#fff' }
                      : { background: '#fafafa', borderColor: '#E5E7EB', color: '#6B7280' }}
                  >
                    <span style={{ opacity: active ? 0.8 : 0.5 }}>{tab.icon}</span>
                    {tri(tab, lang)}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 px-6 py-7 md:px-8 md:py-9 bg-white">
            {activeTab === 'flights'   && <FlightsPanel />}
            {activeTab === 'sim'       && <SIMPanel />}
            {activeTab === 'banking'   && <BankingPanel />}
            {activeTab === 'transport' && <TransportPanel />}
            {activeTab === 'stay'      && <StayPanel />}
            {activeTab === 'sin'       && <SINPanel />}
            {activeTab === 'licence'   && <DriverLicencePanel />}
            {activeTab === 'language'  && <LanguagePanel />}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="border border-gray-200 rounded-2xl px-6 py-6 text-center">
          <p className="text-[16px] font-bold text-gray-900 mb-1">
            {t('비슷한 고민을 했던 사람들에게 물어보세요.', 'Ask people who went through the same thing.', 'Demandez à ceux qui sont passés par là.')}
          </p>
          <p className="text-[13px] text-gray-500 mb-4">
            {t(
              '이미 몬트리올에 살고 있는 사람들에게 직접 물어보세요.',
              'Ask people who have already made the move.',
              'Demandez à ceux qui ont déjà fait le déménagement.',
            )}
          </p>
          <Link to="/board" className="inline-flex items-center gap-2 btn-yellow rounded-xl px-6 py-2.5 text-[14px] font-bold">
            {t('커뮤니티에 물어보기 →', 'Ask the community →', 'Demander à la communauté →')}
          </Link>
        </div>

      </div>
    </div>
  )
}
