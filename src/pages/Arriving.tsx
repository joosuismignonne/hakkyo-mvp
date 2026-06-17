/**
 * First Steps — HAKKYO Montréal Starter Kit
 *
 * Goal: help someone move to Montréal without opening 20 other tabs.
 * Every visible string goes through t() or tri(). Zero hardcoded English.
 *
 * Future milestone hook: CHECKLIST items with milestone:true will feed
 * "My Montréal Journey" when that feature is built. Do not remove the flag.
 */
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'

// ─── i18n types + helper ──────────────────────────────────────────────────────

type Tri = { ko: string; en: string; fr: string }

function tri(f: Tri, lang: string): string {
  return lang === 'ko' ? f.ko : lang === 'fr' ? f.fr : f.en
}

// ─── Progress checklist ───────────────────────────────────────────────────────
// milestone:true = feeds "My Montréal Journey" feature (future). Do not remove.

const CHECKLIST: Array<{ id: string; milestone: boolean } & Tri> = [
  { id: 'flight',   ko: '항공권 예약',    en: 'Flight booked',            fr: 'Vol réservé',                      milestone: true  },
  { id: 'stay',     ko: '임시 숙소 마련', en: 'Temporary stay arranged',  fr: 'Logement temporaire arrangé',       milestone: false },
  { id: 'sim',      ko: 'SIM 카드 개통',  en: 'SIM card activated',       fr: 'Carte SIM activée',                milestone: false },
  { id: 'bank',     ko: '은행 계좌 개설', en: 'Bank account opened',      fr: 'Compte bancaire ouvert',           milestone: true  },
  { id: 'opus',     ko: 'OPUS 카드',      en: 'OPUS card',               fr: 'Carte OPUS',                       milestone: false },
  { id: 'grocery',  ko: '마트 찾기',      en: 'Found a grocery store',   fr: 'Trouvé une épicerie',              milestone: false },
  { id: 'exchange', ko: '언어 교환 참여', en: 'Language exchange joined', fr: 'Échange linguistique rejoint',     milestone: true  },
  { id: 'friend',   ko: '첫 현지 친구',   en: 'First local friend',      fr: 'Premier ami local',                milestone: true  },
]

const PROGRESS_KEY = 'hakkyo_firststeps'

// ─── Journey messages by completion % ────────────────────────────────────────

const JOURNEY_MESSAGES: Array<{ min: number; max: number } & Tri> = [
  {
    min: 0, max: 0,
    ko: '몬트리올은 아직 지도 위의 한 점일 뿐입니다.',
    en: 'Montréal is still just a dot on the map.',
    fr: "Montréal n'est encore qu'un point sur la carte.",
  },
  {
    min: 1, max: 24,
    ko: '첫 발걸음을 내디뎠습니다.',
    en: "You've taken your first step.",
    fr: 'Vous avez fait votre premier pas.',
  },
  {
    min: 25, max: 49,
    ko: '여정이 시작되었습니다.',
    en: 'The journey has begun.',
    fr: 'Le voyage a commencé.',
  },
  {
    min: 50, max: 74,
    ko: '절반쯤 왔습니다.',
    en: 'Halfway there.',
    fr: 'À mi-chemin.',
  },
  {
    min: 75, max: 99,
    ko: '거의 다 왔습니다.',
    en: 'Almost there.',
    fr: 'Vous y êtes presque.',
  },
  {
    min: 100, max: 100,
    ko: '이제 몬트리올은 목적지가 아닙니다. 당신의 이야기가 시작될 곳입니다.',
    en: "Montréal is no longer a destination. It's where your story begins.",
    fr: "Montréal n'est plus une destination. C'est là que votre histoire commence.",
  },
]

function getJourneyMessage(pct: number, lang: string): string {
  const row = JOURNEY_MESSAGES.find(m => pct >= m.min && pct <= m.max) ?? JOURNEY_MESSAGES[0]
  return tri(row, lang)
}

// ─── Milestone messages ───────────────────────────────────────────────────────

const MILESTONE_MESSAGES: Record<string, Tri> = {
  flight:   { ko: '진짜 가게 되었네요.',                          en: "It's really happening.",                       fr: 'Ça devient réel.'                                    },
  stay:     { ko: '첫 번째 집이 생겼습니다.',                     en: 'Your first home is waiting.',                   fr: 'Votre premier chez-vous vous attend.'                },
  sim:      { ko: '이제 현지 번호를 사용할 준비가 되었습니다.',     en: 'You have a local number now.',                  fr: 'Vous avez maintenant un numéro local.'               },
  bank:     { ko: '몬트리올에서의 금융 생활이 시작됩니다.',         en: 'Your financial life in Montréal begins.',       fr: 'Votre vie financière à Montréal commence.'          },
  opus:     { ko: '도시가 당신의 것이 됩니다.',                    en: 'The city is yours to explore.',                 fr: "La ville s'ouvre à vous."                           },
  grocery:  { ko: '여기서의 일상이 시작됩니다.',                   en: 'Daily life here starts with this.',             fr: 'La vie quotidienne commence ici.'                    },
  exchange: { ko: '언어는 도시로 들어가는 문입니다.',              en: 'Language is the door into the city.',           fr: "La langue est la porte d'entrée."                   },
  friend:   { ko: '도시는 결국 사람으로 기억됩니다.',              en: 'A city is remembered through its people.',      fr: 'Une ville se souvient à travers ses gens.'           },
}

// ─── Tool data — all text fields trilingual ───────────────────────────────────

interface SimProvider {
  name: string
  price: string
  esim: boolean
  contract: boolean
  bestFor: Tri
  pros: Tri[]
  hakkyoNote: Tri
  popular: boolean
  url: string
}

const SIM_PROVIDERS: SimProvider[] = [
  {
    name: 'Fizz', price: '$17–$50/mo', esim: true, contract: false, popular: true,
    url: 'https://fizz.ca',
    bestFor:    { ko: '학생과 예산이 제한된 새 이민자',               en: 'Students and newcomers on a budget',              fr: 'Étudiants et nouveaux arrivants avec un budget limité' },
    pros: [
      { ko: '약정 없음 — 언제든 해지 가능',   en: 'No contract — cancel anytime',        fr: 'Sans contrat — résiliation à tout moment'    },
      { ko: 'eSIM — 도착 전 개통 가능',       en: 'eSIM — activate before landing',      fr: "eSIM — activer avant l'atterrissage"         },
      { ko: '추천 할인 혜택',                  en: 'Referral discounts',                  fr: 'Réductions par parrainage'                   },
    ],
    hakkyoNote: {
      ko: '대부분의 새 이민자들이 Fizz를 선택합니다. 저렴하고 약정이 없으며, 비행기 안에서 eSIM을 바로 개통할 수 있습니다.',
      en: 'Most newcomers choose Fizz. Inexpensive, no contract, and you can activate the eSIM on the plane.',
      fr: "La plupart des nouveaux arrivants choisissent Fizz. Pas cher, sans contrat, et vous pouvez activer la eSIM dans l'avion.",
    },
  },
  {
    name: 'Public Mobile', price: '$15–$40/mo', esim: false, contract: false, popular: false,
    url: 'https://www.publicmobile.ca',
    bestFor:    { ko: '최대한 저렴한 월 비용',                         en: 'Lowest possible monthly cost',                    fr: 'Coût mensuel le plus bas possible'                    },
    pros: [
      { ko: '캐나다에서 가장 저렴한 요금제',   en: 'Cheapest plans in Canada',            fr: 'Plans les moins chers au Canada'             },
      { ko: '커뮤니티 리워드 프로그램',         en: 'Community rewards program',           fr: 'Programme de récompenses communautaires'     },
      { ko: '약정 없음',                        en: 'No contract',                         fr: 'Sans contrat'                                },
    ],
    hakkyoNote: {
      ko: '비용을 최대한 줄이고 싶고 eSIM이 필요 없다면 최선의 선택입니다. 실물 유심만 제공되니 미리 준비하세요.',
      en: 'Best if you want rock-bottom cost and do not need eSIM. Physical SIM only — plan ahead.',
      fr: "Idéal si vous voulez minimiser les coûts et n'avez pas besoin de eSIM. Uniquement en SIM physique — planifiez à l'avance.",
    },
  },
  {
    name: 'Bell', price: '$35–$80/mo', esim: true, contract: false, popular: false,
    url: 'https://www.bell.ca',
    bestFor:    { ko: '안정성과 넓은 커버리지',                        en: 'Reliability and wide coverage',                   fr: 'Fiabilité et large couverture'                       },
    pros: [
      { ko: '퀘벡에서 가장 강력한 네트워크',   en: 'Strongest network in Québec',         fr: 'Réseau le plus fort au Québec'               },
      { ko: 'eSIM 사용 가능',                   en: 'eSIM available',                      fr: 'eSIM disponible'                             },
      { ko: '빠른 데이터 속도',                 en: 'Good data speeds',                    fr: 'Bonnes vitesses de données'                  },
    ],
    hakkyoNote: {
      ko: '커버리지가 비용보다 중요하다면 Bell을 선택하세요. 특히 몬트리올 외곽을 자주 이동하는 경우 유용합니다.',
      en: 'Choose Bell if coverage matters more than price — especially if you travel outside Montréal.',
      fr: "Choisissez Bell si la couverture prime sur le prix — surtout si vous voyagez souvent hors de Montréal.",
    },
  },
  {
    name: 'Virgin Plus', price: '$30–$70/mo', esim: true, contract: false, popular: false,
    url: 'https://www.virginplus.ca',
    bestFor:    { ko: '조금 더 저렴한 Bell 수준의 품질',               en: 'Bell quality at slightly lower cost',             fr: 'Qualité Bell à un coût légèrement inférieur'         },
    pros: [
      { ko: 'Bell 네트워크 이용',               en: 'Runs on Bell network',                fr: 'Fonctionne sur le réseau Bell'               },
      { ko: 'eSIM 지원',                        en: 'eSIM support',                        fr: 'Support eSIM'                                },
      { ko: '유연한 요금제',                    en: 'Flexible plans',                      fr: 'Forfaits flexibles'                          },
    ],
    hakkyoNote: {
      ko: 'Bell과 동일한 네트워크를, 조금 더 저렴하게 이용할 수 있습니다. Fizz보다 고급스러운 서비스를 원한다면 좋은 중간 선택입니다.',
      en: 'Same coverage as Bell, slightly cheaper. Good middle option if Fizz feels too budget.',
      fr: 'Même couverture que Bell, légèrement moins cher. Bonne option intermédiaire si Fizz semble trop économique.',
    },
  },
  {
    name: 'Telus', price: '$35–$90/mo', esim: true, contract: false, popular: false,
    url: 'https://www.telus.com',
    bestFor:    { ko: '도시 외곽을 자주 여행하는 분',                  en: 'Frequent travel outside the city',                fr: 'Voyages fréquents hors de la ville'                  },
    pros: [
      { ko: '최고의 농촌 커버리지',             en: 'Best rural coverage',                 fr: 'Meilleure couverture rurale'                 },
      { ko: 'eSIM 사용 가능',                   en: 'eSIM available',                      fr: 'eSIM disponible'                             },
      { ko: '몬트리올 외곽에서 강력함',          en: 'Strong outside Montréal',             fr: 'Solide hors de Montréal'                     },
    ],
    hakkyoNote: {
      ko: '도시 외곽을 자주 다닌다면 필요하지만, 몬트리올 일상에서는 과한 선택입니다.',
      en: 'Only necessary if you travel outside the city often. Overkill for daily Montréal life.',
      fr: 'Utile uniquement si vous voyagez souvent hors de la ville. Excessif pour la vie quotidienne à Montréal.',
    },
  },
]

interface Bank {
  name: string
  badge: Tri
  badgeColor: string
  pros: Tri[]
  hakkyoNote: Tri
  url: string
  documents: Tri
}

const BANKS: Bank[] = [
  {
    name: 'TD Bank', badgeColor: 'blue',
    url: 'https://www.td.com/ca/en',
    badge:      { ko: '학생에게 최적',              en: 'Best for students',              fr: 'Idéal pour les étudiants'                      },
    pros: [
      { ko: '월 수수료 없는 학생 계좌',   en: 'Student accounts with no monthly fee',   fr: 'Comptes étudiants sans frais mensuels'   },
      { ko: '광범위한 ATM 네트워크',      en: 'Large ATM network',                      fr: 'Vaste réseau de guichets automatiques'   },
      { ko: '대부분 지점에서 영어 서비스', en: 'English service at most branches',      fr: 'Service en anglais dans la plupart des succursales' },
    ],
    hakkyoNote: {
      ko: 'TD 학생 계좌를 개설하세요 — 월 수수료 $0, 최소 잔액 없음. 학생 비자와 여권만으로 가장 쉽게 개설할 수 있습니다.',
      en: 'Open a TD Student Account — $0 monthly fee, no minimum balance. Easiest to open with only your study permit.',
      fr: "Ouvrez un compte étudiant TD — 0 $ de frais mensuels, aucun solde minimum. Le plus facile à ouvrir avec seulement votre permis d'études.",
    },
    documents: { ko: '학생 비자 + 여권 + 주소 증명', en: 'Study permit + passport + address proof', fr: "Permis d'études + passeport + preuve d'adresse" },
  },
  {
    name: 'RBC', badgeColor: 'yellow',
    url: 'https://www.rbc.com/newcomers',
    badge:      { ko: '새 이민자 패키지 최고',      en: 'Best newcomer package',          fr: 'Meilleur programme nouveaux arrivants'          },
    pros: [
      { ko: '전담 새 이민자 프로그램',     en: 'Dedicated newcomer program',             fr: 'Programme dédié aux nouveaux arrivants'  },
      { ko: '신용 기록 없이 신용카드 발급', en: 'Credit card without credit history',   fr: 'Carte de crédit sans historique de crédit' },
      { ko: '다국어 지원',                 en: 'Multilingual support',                   fr: 'Support multilingue'                     },
    ],
    hakkyoNote: {
      ko: 'RBC 새 이민자 혜택 패키지는 1년간 수수료를 면제해 줍니다. 신용 기록 없이 신용카드를 발급받을 수 있는 가장 쉬운 방법입니다.',
      en: "RBC's Newcomer Advantage package waives fees for 1 year. Easiest path to a credit card as a newcomer.",
      fr: "Le programme Avantage Nouveaux Arrivants de RBC exonère les frais pendant 1 an. Le chemin le plus facile vers une carte de crédit sans historique.",
    },
    documents: { ko: '여권 + 학생/취업 비자', en: 'Passport + study or work permit', fr: "Passeport + permis d'études ou de travail" },
  },
  {
    name: 'Scotiabank', badgeColor: 'red',
    url: 'https://www.scotiabank.com',
    badge:      { ko: '첫 신용카드에 최적',         en: 'Best for first credit card',     fr: 'Idéal pour la première carte de crédit'        },
    pros: [
      { ko: '새 이민자용 StartRight® 신용카드', en: 'StartRight® credit card for newcomers', fr: 'Carte de crédit StartRight® pour nouveaux arrivants' },
      { ko: '신용 기록 불필요',              en: 'No credit history required',           fr: 'Aucun historique de crédit requis'       },
      { ko: '여행 리워드',                   en: 'Travel rewards',                       fr: 'Récompenses voyage'                      },
    ],
    hakkyoNote: {
      ko: '신용카드를 빨리 만드는 것이 최우선이라면 Scotiabank StartRight®가 캐나다에서 가장 쉬운 방법입니다.',
      en: 'If getting a credit card fast is your priority, Scotiabank StartRight® is the easiest path in Canada.',
      fr: "Si obtenir une carte de crédit rapidement est votre priorité, Scotiabank StartRight® est le chemin le plus facile au Canada.",
    },
    documents: { ko: '여권 + 비자 + 주소', en: 'Passport + permit + address', fr: 'Passeport + permis + adresse' },
  },
  {
    name: 'BMO', badgeColor: 'green',
    url: 'https://www.bmo.com/en-ca',
    badge:      { ko: '첫 해 무료',                 en: 'First year free',                fr: 'Première année gratuite'                       },
    pros: [
      { ko: 'NewStart® 프로그램 — 1년 무료', en: 'NewStart® program — 1 year free',    fr: 'Programme NewStart® — 1 an gratuit'      },
      { ko: '간단한 개설 절차',              en: 'Simple setup',                         fr: 'Ouverture simple'                        },
      { ko: '편리한 모바일 앱',              en: 'Good mobile app',                      fr: 'Bonne application mobile'                },
    ],
    hakkyoNote: {
      ko: 'BMO NewStart® 프로그램은 간단하고 어디서나 이용 가능합니다. 특별한 요구사항이 없다면 좋은 기본 선택입니다.',
      en: 'BMO NewStart® is straightforward and widely available. Good default if you have no specific requirements.',
      fr: "Le programme BMO NewStart® est simple et largement disponible. Bon choix par défaut si vous n'avez pas d'exigences spécifiques.",
    },
    documents: { ko: '여권 + 비자', en: 'Passport + permit', fr: 'Passeport + permis' },
  },
  {
    name: 'Desjardins', badgeColor: 'gray',
    url: 'https://www.desjardins.com',
    badge:      { ko: '퀘벡 생활에 최적',           en: 'Best for Québec life',           fr: 'Idéal pour la vie au Québec'                   },
    pros: [
      { ko: '퀘벡 협동조합 — 현지 뿌리',    en: 'Québec cooperative — local roots',     fr: 'Coopérative québécoise — racines locales' },
      { ko: '프랑스어 통합에 도움',          en: 'French integration',                   fr: 'Intégration francophone'                 },
      { ko: '나중에 경쟁력 있는 모기지 이율', en: 'Competitive mortgage rates later',   fr: 'Taux hypothécaires compétitifs plus tard' },
    ],
    hakkyoNote: {
      ko: '퀘벡에 장기적으로 정착하고 뿌리를 내리고 싶다면 고려해 볼 만한 선택입니다.',
      en: 'Worth considering if you plan to stay long-term and build roots in Québec society.',
      fr: 'À considérer si vous prévoyez rester longtemps et vous intégrer profondément dans la société québécoise.',
    },
    documents: { ko: '여권 + 비자 + 퀘벡 주소', en: 'Passport + permit + Québec address', fr: 'Passeport + permis + adresse au Québec' },
  },
]

interface TransportItem {
  name: Tri
  icon: string
  what: Tri
  where: Tri
  cost: Tri
  hakkyoNote: Tri
  url: string
}

const TRANSPORT_ITEMS: TransportItem[] = [
  {
    icon: '🚇', url: 'https://www.stm.info/en/fares-and-passes/opus-card',
    name:  { ko: 'OPUS 카드',       en: 'OPUS Card',       fr: 'Carte OPUS'       },
    what:  {
      ko: '몬트리올 모든 버스 및 지하철 노선에서 사용 가능한 충전식 교통 카드.',
      en: 'Rechargeable transit card for all Montréal buses and metro lines.',
      fr: 'Carte de transport rechargeable pour tous les bus et lignes de métro de Montréal.',
    },
    where: {
      ko: '모든 지하철역 발권기 또는 고객 서비스 창구에서 구매 가능.',
      en: 'Any metro station ticket machine or customer service counter.',
      fr: 'Toute machine à billets de station de métro ou comptoir de service à la clientèle.',
    },
    cost:  {
      ko: '카드 발급비 $6 + 월정액 패스 (~$100/월) 또는 1회권 ($3.75/회)',
      en: '$6 card fee + load monthly pass (~$100/mo) or pay-per-ride ($3.75/trip)',
      fr: "Frais de carte 6 $ + passe mensuel (~100 $/mois) ou tarif à l'unité (3,75 $/trajet)",
    },
    hakkyoNote: {
      ko: '공항 지하철역에서 바로 구매하세요 (YUL → Lionel-Groulx). 주 3회 이상 대중교통을 이용한다면 월정액 패스가 경제적입니다.',
      en: 'Get this at the airport metro station (YUL → Lionel-Groulx). Load a monthly pass if you use transit more than 3× per week.',
      fr: "Achetez-la à la station de métro de l'aéroport (YUL → Lionel-Groulx). Chargez un passe mensuel si vous utilisez les transports plus de 3× par semaine.",
    },
  },
  {
    icon: '📱', url: 'https://www.stm.info',
    name:  { ko: 'STM 앱',          en: 'STM App',          fr: 'Application STM'  },
    what:  {
      ko: '몬트리올 공식 대중교통 앱. 실시간 도착 정보, 경로 계획, 노선 지도 제공.',
      en: 'Official Montréal transit app. Real-time arrivals, trip planner, and line maps.',
      fr: 'Application officielle de transport montréalais. Arrivées en temps réel, planificateur de trajet et cartes de lignes.',
    },
    where: {
      ko: 'App Store 또는 Google Play에서 "STM Montréal" 검색.',
      en: 'App Store or Google Play — search "STM Montréal".',
      fr: 'App Store ou Google Play — cherchez "STM Montréal".',
    },
    cost:  { ko: '무료', en: 'Free', fr: 'Gratuit' },
    hakkyoNote: {
      ko: '도착 첫날 전에 다운로드하세요. 실시간 추적이 정확하고, 집을 나서기 전에 지연을 미리 확인할 수 있습니다.',
      en: 'Download before your first day. The real-time tracker is accurate and shows delays before you leave the apartment.',
      fr: "Téléchargez avant votre premier jour. Le suivi en temps réel est précis et affiche les retards avant que vous quittiez l'appartement.",
    },
  },
  {
    icon: '🚌', url: 'https://www.stm.info/en/info/networks/bus/bus-747',
    name:  { ko: '747 버스 — 공항 → 도심', en: '747 Express — Airport to Downtown', fr: '747 Express — Aéroport au Centre-ville' },
    what:  {
      ko: 'YUL 공항에서 몬트리올 도심(Berri-UQAM 지하철)까지 가는 직행 버스. 24시간 운행.',
      en: 'Direct bus from YUL airport to downtown Montréal (Berri-UQAM metro). Runs 24/7.',
      fr: "Bus direct de l'aéroport YUL au centre-ville de Montréal (métro Berri-UQAM). Fonctionne 24h/24.",
    },
    where: {
      ko: 'YUL 터미널 1 도착층 외부 버스 정류장.',
      en: 'Bus stop outside the arrivals level at YUL Terminal 1.',
      fr: "Arrêt de bus à l'extérieur du niveau des arrivées, Terminal 1 de YUL.",
    },
    cost:  {
      ko: '$11 — 현금, 신용카드, 또는 OPUS 카드 사용 가능',
      en: '$11 — accepts cash, credit card, or OPUS',
      fr: "11 $ — accepte l'argent comptant, la carte de crédit ou l'OPUS",
    },
    hakkyoNote: {
      ko: '도착하면 747번 버스를 타세요. 버스 문에서 바로 신용카드로 결제됩니다. 50~70분 만에 도심에 도착합니다.',
      en: 'Take the 747 when you land. It accepts credit card directly at the door. Gets you downtown in 50–70 minutes.',
      fr: "Prenez le 747 à votre arrivée. Il accepte la carte de crédit directement à la porte. Arrive en centre-ville en 50–70 minutes.",
    },
  },
  {
    icon: '🚲', url: 'https://bixi.com',
    name:  { ko: 'BIXI 자전거',     en: 'BIXI Bikes',       fr: 'Vélos BIXI'       },
    what:  {
      ko: '공공 자전거 공유 시스템. 몬트리올 전역 800개 이상 정류장, 9,000대 이상 자전거.',
      en: 'Public bike-share system. 9,000+ bikes at 800+ stations across Montréal.',
      fr: 'Vélopartage public. Plus de 9 000 vélos à plus de 800 stations à travers Montréal.',
    },
    where: {
      ko: '모든 BIXI 정류장. 앱 또는 정류장 단말기에서 잠금 해제.',
      en: 'Any BIXI station. App or station terminal to unlock.',
      fr: 'Toute station BIXI. Application ou terminal de station pour déverrouiller.',
    },
    cost:  {
      ko: '시즌 월정액 $27 · 1일권 $7 · 또는 30분 단위 $1.29',
      en: '$27/month seasonal pass · $7/day · or $1.29/30min single trip',
      fr: 'Passe saisonnier 27 $/mois · 7 $/jour · ou 1,29 $/30 min trajet simple',
    },
    hakkyoNote: {
      ko: 'Plateau나 Mile End에 거주한다면 따뜻한 계절에 BIXI로 단거리 지하철을 대체할 수 있습니다.',
      en: 'If you live near the Plateau or Mile End, BIXI replaces the metro for short trips in warm months.',
      fr: 'Si vous habitez sur le Plateau ou à Mile End, le BIXI remplace le métro pour les courts trajets en saison chaude.',
    },
  },
  {
    icon: '🚗', url: 'https://www.communauto.com',
    name:  { ko: 'Communauto',      en: 'Communauto',       fr: 'Communauto'       },
    what:  {
      ko: '몬트리올 자동차 공유 협동조합. 시간 또는 일 단위 대여, 차량 소유 불필요.',
      en: 'Montréal car-share co-op. Hourly or daily rentals, no ownership needed.',
      fr: "Coopérative d'autopartage montréalaise. Location à l'heure ou à la journée, sans possession de véhicule.",
    },
    where: {
      ko: '앱 기반. 도시 전역에 차량 주차 — 전화로 예약 및 잠금 해제 가능.',
      en: 'App-based. Cars parked across the city — reserve and unlock via phone.',
      fr: 'Basé sur application. Voitures garées partout en ville — réservez et déverrouillez par téléphone.',
    },
    cost:  {
      ko: '플랜에 따라 시간당 $15–$25. 보험 및 주유비 추가 없음.',
      en: '$15–$25/hour depending on plan. No insurance or gas fees added.',
      fr: "15–25 $/heure selon le forfait. Aucuns frais d'assurance ou d'essence ajoutés.",
    },
    hakkyoNote: {
      ko: '몬트리올에서 대부분의 새 이민자들에게 자동차는 필요 없습니다. Communauto는 꼭 필요한 순간을 위한 서비스입니다.',
      en: "Most newcomers do not need a car in Montréal. Communauto covers the moments you do.",
      fr: "La plupart des nouveaux arrivants n'ont pas besoin de voiture à Montréal. Communauto couvre les moments où vous en avez besoin.",
    },
  },
]

interface StayOption {
  name: Tri
  type: Tri
  priceRange: string
  goodFor: Tri
  pros: Tri[]
  cons: Tri[]
  hakkyoNote: Tri
  url: string
}

const STAY_OPTIONS: StayOption[] = [
  {
    url: 'https://www.airbnb.ca',
    name:       { ko: 'Airbnb — 개인실',          en: 'Airbnb — Private Room',          fr: 'Airbnb — Chambre Privée'              },
    type:       { ko: '임시 숙소',                 en: 'Temporary stay',                 fr: 'Séjour temporaire'                    },
    priceRange: '$40–$90/night · ~$1,000–$2,000/month',
    goodFor:    { ko: '아파트를 구하는 동안 2~4주 임시 거처', en: 'First 2–4 weeks while apartment hunting', fr: "2 à 4 premières semaines pendant la recherche d'appartement" },
    pros: [
      { ko: '개인 공간',           en: 'Private space',             fr: 'Espace privé'                   },
      { ko: '주방 이용 가능',       en: 'Kitchen access',            fr: 'Accès à la cuisine'             },
      { ko: '자유로운 체크인/아웃', en: 'Flexible check-in/out',     fr: 'Entrée/sortie flexible'         },
    ],
    cons: [
      { ko: '단기 임대보다 비쌈',              en: 'More expensive than sublets',     fr: 'Plus cher que les sous-locations' },
      { ko: '임대 계약 없음 = 은행 주소 증명 불가', en: 'No lease = no address proof for banking', fr: "Pas de bail = pas de preuve d'adresse pour la banque" },
    ],
    hakkyoNote: {
      ko: '비용을 아끼려면 개인실(아파트 전체가 아닌)을 예약하세요. 대부분의 새 이민자들은 2~3주를 머물며 영구적인 거처를 찾습니다.',
      en: 'Book a private room (not entire apartment) to save money. Most newcomers stay 2–3 weeks before finding permanent housing.',
      fr: "Réservez une chambre privée (pas un appartement entier) pour économiser. La plupart restent 2–3 semaines avant de trouver un logement permanent.",
    },
  },
  {
    url: 'https://www.hostelworld.com/findabed.php/travelto-Montreal',
    name:       { ko: '호스텔',                   en: 'Hostel',                         fr: 'Auberge de Jeunesse'                  },
    type:       { ko: '저예산 숙소',               en: 'Budget stay',                    fr: 'Hébergement économique'               },
    priceRange: '$25–$55/night · dorm or private room',
    goodFor:    { ko: '처음 며칠, 혼자 오는 새 이민자, 사람 만나기', en: 'Very first days, solo newcomers, meeting people', fr: 'Tout premiers jours, nouveaux arrivants solo, rencontres' },
    pros: [
      { ko: '가장 저렴한 옵션',       en: 'Cheapest option',             fr: 'Option la moins chère'         },
      { ko: '사교적인 분위기',         en: 'Social atmosphere',           fr: 'Ambiance sociale'              },
      { ko: '몬트리올 중심부 위치',    en: 'Central Montréal locations',  fr: 'Emplacements centraux'         },
    ],
    cons: [
      { ko: '공용 도미토리',            en: 'Shared dorm rooms',           fr: 'Dortoirs partagés'             },
      { ko: '개인 공간 부족',           en: 'Less privacy',                fr: "Moins d'intimité"              },
      { ko: '1~2주 이상 불편함',        en: 'Not practical beyond 1–2 weeks', fr: 'Peu pratique au-delà de 1–2 semaines' },
    ],
    hakkyoNote: {
      ko: '이웃 동네를 탐색하기 전에 다른 새 이민자들을 만나고 싶다면 첫 번째 주에 좋은 선택입니다.',
      en: 'Good for the very first week if you want to meet newcomers and explore before committing to a neighbourhood.',
      fr: "Idéal pour la toute première semaine si vous voulez rencontrer d'autres nouveaux arrivants avant de vous engager dans un quartier.",
    },
  },
  {
    url: 'https://www.facebook.com/marketplace',
    name:       { ko: 'Facebook — 단기 임대',      en: 'Facebook Marketplace — Short-Term Sublet', fr: 'Facebook Marketplace — Sous-location' },
    type:       { ko: '현지 단기 임대',            en: 'Local sublet',                   fr: 'Sous-location locale'                 },
    priceRange: '$600–$1,200/month furnished',
    goodFor:    { ko: '1~3개월 안정적인 거처',     en: '1–3 month stay with more stability', fr: 'Séjour de 1 à 3 mois avec plus de stabilité' },
    pros: [
      { ko: 'Airbnb보다 훨씬 저렴',    en: 'Much cheaper than Airbnb',    fr: "Beaucoup moins cher qu'Airbnb" },
      { ko: '실제 생활하는 느낌',       en: 'Feels like real living',       fr: 'Se sent comme une vraie vie'   },
      { ko: '주소 증명에 활용 가능',    en: 'Can use as address proof',     fr: "Peut servir de preuve d'adresse" },
    ],
    cons: [
      { ko: '매물 검증 필수',          en: 'Must verify listings carefully', fr: 'Vérifier les annonces soigneusement' },
      { ko: '플랫폼 보호 없음',        en: 'No platform protection',        fr: 'Aucune protection de la plateforme' },
      { ko: '경쟁이 치열함',           en: 'Competition is high',           fr: 'La concurrence est forte'     },
    ],
    hakkyoNote: {
      ko: '"sous-location" 또는 "단기 임대 몬트리올"로 검색하세요. 빠르게 연락하세요 — 좋은 매물은 몇 시간 안에 사라집니다.',
      en: 'Search "sous-location" or "short term sublet Montréal". Message quickly — good listings are gone within hours.',
      fr: 'Cherchez "sous-location" ou "short term sublet Montréal". Répondez vite — les bonnes annonces disparaissent en quelques heures.',
    },
  },
  {
    url: 'https://www.concordia.ca/students/housing.html',
    name:       { ko: '학생 기숙사',               en: 'Student Residence',              fr: 'Résidence Étudiante'                  },
    type:       { ko: '기관 주거',                 en: 'Institutional housing',          fr: 'Logement institutionnel'              },
    priceRange: '$600–$950/month · meals sometimes included',
    goodFor:    { ko: 'McGill, Concordia, UQAM, UdeM 재학생', en: 'Students at McGill, Concordia, UQAM, or UdeM', fr: 'Étudiants à McGill, Concordia, UQAM ou UdeM' },
    pros: [
      { ko: '관리되고 안전함',          en: 'Managed and safe',             fr: 'Géré et sécuritaire'           },
      { ko: '공과금 포함',              en: 'Utilities included',           fr: 'Services publics inclus'       },
      { ko: '해외에서 가장 쉬운 첫 단계', en: 'Easiest transition from abroad', fr: "Transition la plus facile depuis l'étranger" },
    ],
    cons: [
      { ko: '일찍 신청 필수 — 자리가 빨리 찬다', en: 'Apply early — spots fill up', fr: 'Postulez tôt — les places se remplissent' },
      { ko: '단기 체류 불가능할 수 있음', en: 'May not be available short-term', fr: 'Peut ne pas être disponible à court terme' },
      { ko: '규칙과 통금 있을 수 있음',  en: 'Rules and curfews possible',  fr: 'Règles et couvre-feux possibles' },
    ],
    hakkyoNote: {
      ko: '도착 전에 기숙사를 신청하세요 — 대학교 주거 지원 사무소에 직접 연락하세요. 자리가 빠르게 찬다는 것을 명심하세요.',
      en: "Apply for residence before you arrive — contact your university's housing office directly. Spots go fast.",
      fr: "Faites une demande de résidence avant d'arriver — contactez directement le bureau du logement de votre université. Les places partent vite.",
    },
  },
]

// ─── Community tips (static, future: pull from Supabase by tag) ──────────────

interface CommunityTip { author: string; text: string }

const COMMUNITY_TIPS: Record<string, CommunityTip[]> = {
  flights: [
    { author: 'Sora',    text: 'Google Flights on Tuesday morning gave me the cheapest fares. I compared 3 weeks of dates at once.' },
    { author: 'Min',     text: 'Book direct Seoul → Montréal through Air Canada or Korean Air. Layover in Toronto adds stress on move-in day.' },
  ],
  sim: [
    { author: 'Jiyeon',  text: 'Fizz eSIM activated before I even landed. By the time I was on the 747 bus I already had data.' },
    { author: 'Taeyang', text: 'I started with Public Mobile ($15/mo) for the first month, then switched to Fizz once I knew I was staying.' },
  ],
  banking: [
    { author: 'Haein',   text: 'TD student account opened in 20 minutes with just my study permit and passport. No credit history needed.' },
    { author: 'Joon',    text: 'Get both TD (day-to-day) and the Scotiabank StartRight credit card. It builds your Canadian credit score from month one.' },
  ],
  transport: [
    { author: 'Mirae',   text: 'The 747 bus from the airport was easy. 50 minutes to downtown and my credit card worked right at the bus door.' },
    { author: 'Sungmin', text: 'BIXI is worth it May–October if you live on the Plateau. Faster than the metro for short trips.' },
  ],
  stay: [
    { author: 'Yeonsu',  text: 'Airbnb in the Plateau for 3 weeks, then found my apartment on Kijiji and moved before the month ended.' },
    { author: 'Clara',   text: 'Facebook Marketplace had good furnished sublets in Mile End. Message in French even if basic — it helps.' },
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
      <span className="text-[13px] shrink-0 mt-0.5">💡</span>
      <p className="text-[12px] text-amber-900 leading-snug font-medium">{text}</p>
    </div>
  )
}

function CommunityExperience({ section }: { section: string }) {
  const { lang, t } = useLang()
  const tips = COMMUNITY_TIPS[section] ?? []
  return (
    <div className="border-t border-gray-100 pt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">
          {t('커뮤니티 경험', 'Community Experience', 'Expérience Communautaire')}
        </p>
        <Link to="/board" className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
          {t('경험 공유하기 →', 'Share yours →', 'Partagez la vôtre →')}
        </Link>
      </div>
      {tips.length > 0 ? (
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                style={{ background: 'var(--y)', color: '#111' }}
              >
                {tip.author[0]}
              </div>
              <p className="text-[12px] text-gray-600 leading-snug">
                <span className="font-semibold text-gray-800">{tip.author} — </span>
                {tip.text}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12px] text-gray-400">
          {t('아직 공유된 경험이 없습니다. 첫 번째 주인공이 되어보세요.', 'No experiences shared yet. Be the first.', "Aucune expérience partagée pour l'instant. Soyez le premier.")}
        </p>
      )}
    </div>
  )
}

// ─── Tool panels ──────────────────────────────────────────────────────────────

function FlightsPanel() {
  const { lang, t } = useLang()
  const [from, setFrom] = useState('')
  const [depart, setDepart] = useState('')

  function openSearch(site: 'google' | 'skyscanner' | 'kayak') {
    const city = from || (lang === 'ko' ? '서울' : 'Seoul')
    const urls: Record<string, string> = {
      google:     `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from ${city} to Montreal${depart ? ` on ${depart}` : ''}`)}`,
      skyscanner: `https://www.skyscanner.ca/transport/flights/${encodeURIComponent(city)}/mtl/${depart?.replace(/-/g, '') || ''}`,
      kayak:      `https://www.kayak.ca/flights/${encodeURIComponent(city)}-YUL/${depart || 'anytime'}`,
    }
    window.open(urls[site], '_blank')
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors bg-white'

  const hakkyoNote = tri({
    ko: '구글 플라이트에서 먼저 비교하세요 — 한 번에 2~3주의 날짜 범위에서 가장 저렴한 날을 볼 수 있습니다. Kayak과 Skyscanner로 이중 확인하세요.',
    en: 'Compare on Google Flights first — it shows the cheapest date range across 2–3 weeks at once. Kayak and Skyscanner are useful for double-checking.',
    fr: "Comparez d'abord sur Google Flights — il affiche les tarifs les moins chers sur une plage de 2–3 semaines à la fois. Kayak et Skyscanner sont utiles pour une double vérification.",
  }, lang)

  return (
    <div className="space-y-4">
      <HakkyoNote text={hakkyoNote} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {t('출발지', 'From', 'Départ de')}
          </label>
          <input
            className={inputCls}
            placeholder={lang === 'ko' ? '서울, ICN' : lang === 'fr' ? 'Séoul, ICN' : 'Seoul, ICN'}
            value={from}
            onChange={e => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {t('도착지', 'To', 'Arrivée à')}
          </label>
          <input className={inputCls} value="Montréal, YUL" readOnly style={{ background: '#FAFAFA', color: '#6B7280' }} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {t('출발일', 'Departure', 'Date de départ')}
          </label>
          <input type="date" className={inputCls} value={depart} onChange={e => setDepart(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => openSearch('google')} className="btn-yellow rounded-xl py-2.5 text-[13px] font-bold">
          Google Flights
        </button>
        <button onClick={() => openSearch('skyscanner')} className="rounded-xl py-2.5 text-[13px] font-semibold border border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors">
          Skyscanner
        </button>
        <button onClick={() => openSearch('kayak')} className="rounded-xl py-2.5 text-[13px] font-semibold border border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors">
          Kayak
        </button>
      </div>
      <CommunityExperience section="flights" />
    </div>
  )
}

function SIMPanel() {
  const { lang, t } = useLang()
  return (
    <div className="space-y-3">
      <HakkyoNote text={t(
        '출발 전에 SIM을 준비하세요 — Fizz eSIM은 도착 즉시 작동합니다. 공항에서 길을 찾고, 앱을 사용하고, 은행 계좌를 개설하려면 데이터가 필요합니다.',
        'Get a SIM before you leave — Fizz eSIM works the moment you land. You need data for navigation, banking apps, and finding your way from the airport.',
        "Obtenez une SIM avant de partir — la eSIM Fizz fonctionne dès votre atterrissage. Vous avez besoin de données pour la navigation et les applications bancaires.",
      )} />
      {SIM_PROVIDERS.map(p => (
        <div key={p.name} className="bg-white border border-gray-100 rounded-2xl px-4 py-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[15px] font-bold text-gray-900">{p.name}</span>
              {p.popular && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--y)', color: '#111' }}>
                  {t('가장 인기 있음', 'Most popular', 'Le plus populaire')}
                </span>
              )}
            </div>
            <span className="text-[13px] font-bold text-gray-800 shrink-0">{p.price}</span>
          </div>
          <p className="text-[12px] text-gray-500 mb-2">{t('추천 대상:', 'Best for:', 'Idéal pour :')} {tri(p.bestFor, lang)}</p>
          <div className="flex gap-2 flex-wrap mb-2">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.esim ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
              {p.esim ? 'eSIM ✓' : 'eSIM ✗'}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
              {t('약정 없음', 'No contract', 'Sans contrat')}
            </span>
          </div>
          <ul className="space-y-0.5 mb-3">
            {p.pros.map((pro, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px] text-gray-600">
                <span className="text-green-500 mt-0.5 shrink-0">✓</span>{tri(pro, lang)}
              </li>
            ))}
          </ul>
          <div className="flex items-start gap-2 justify-between">
            <p className="text-[11px] text-amber-800 font-medium italic leading-snug flex-1">"{tri(p.hakkyoNote, lang)}"</p>
            <ExtLink href={p.url} className="shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors">
              {t('방문하기 →', 'Visit →', 'Visiter →')}
            </ExtLink>
          </div>
        </div>
      ))}
      <CommunityExperience section="sim" />
    </div>
  )
}

function BankingPanel() {
  const { lang, t } = useLang()
  return (
    <div className="space-y-3">
      <HakkyoNote text={t(
        '도착 후 2주 안에 계좌를 개설하세요. 이체를 받고, 임대료를 내고, 신용 기록을 쌓으려면 캐나다 은행 계좌가 필요합니다.',
        'Open your account in the first two weeks. You need a Canadian bank account to receive e-transfers, pay rent, and start building credit history.',
        "Ouvrez votre compte dans les deux premières semaines. Vous avez besoin d'un compte bancaire canadien pour recevoir des virements, payer le loyer et commencer à construire un historique de crédit.",
      )} />
      {BANKS.map(b => {
        const bs = badgeStyle(b.badgeColor)
        return (
          <div key={b.name} className="bg-white border border-gray-100 rounded-2xl px-4 py-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[15px] font-bold text-gray-900">{b.name}</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={bs}>
                  {tri(b.badge, lang)}
                </span>
              </div>
              <ExtLink href={b.url} className="shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors">
                {t('방문하기 →', 'Visit →', 'Visiter →')}
              </ExtLink>
            </div>
            <ul className="space-y-0.5 mb-2">
              {b.pros.map((pro, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[12px] text-gray-600">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>{tri(pro, lang)}
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-gray-400 mb-2">{t('필요 서류:', 'Documents:', 'Documents :')} {tri(b.documents, lang)}</p>
            <p className="text-[11px] text-amber-800 font-medium italic">"{tri(b.hakkyoNote, lang)}"</p>
          </div>
        )
      })}
      <CommunityExperience section="banking" />
    </div>
  )
}

function TransportPanel() {
  const { lang, t } = useLang()
  return (
    <div className="space-y-3">
      <HakkyoNote text={t(
        '몬트리올에서 자동차는 필요 없습니다. 지하철과 버스로 대부분의 도시를 이동할 수 있습니다. OPUS 카드를 첫 주에 구매하세요.',
        'You do not need a car in Montréal. Metro + bus covers most of the city. Get the OPUS card in your first week.',
        "Vous n'avez pas besoin de voiture à Montréal. Le métro + bus couvre la majeure partie de la ville. Obtenez la carte OPUS dans votre première semaine.",
      )} />
      {TRANSPORT_ITEMS.map(item => (
        <div key={item.url} className="bg-white border border-gray-100 rounded-2xl px-4 py-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{item.icon}</span>
              <span className="text-[15px] font-bold text-gray-900">{tri(item.name, lang)}</span>
            </div>
            <ExtLink href={item.url} className="shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors">
              {t('정보 →', 'Info →', 'Infos →')}
            </ExtLink>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{t('소개', 'What', 'Description')}</p>
              <p className="text-[12px] text-gray-700 leading-snug">{tri(item.what, lang)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{t('구매 방법', 'Where to get', 'Où obtenir')}</p>
              <p className="text-[12px] text-gray-700 leading-snug">{tri(item.where, lang)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{t('비용', 'Cost', 'Coût')}</p>
              <p className="text-[12px] text-gray-700 leading-snug">{tri(item.cost, lang)}</p>
            </div>
          </div>
          <p className="text-[11px] text-amber-800 font-medium italic">"{tri(item.hakkyoNote, lang)}"</p>
        </div>
      ))}
      <CommunityExperience section="transport" />
    </div>
  )
}

function StayPanel() {
  const { lang, t } = useLang()
  return (
    <div className="space-y-3">
      <HakkyoNote text={t(
        '도착 전에 2~3주의 임시 숙소를 예약하세요. 그 시간을 활용해 동네를 둘러보고 실제 아파트를 찾으세요 — 본국에서 계약하지 마세요.',
        'Book 2–3 weeks of temporary housing before you arrive. Use that time to visit neighbourhoods and find your real apartment — not from abroad.',
        "Réservez 2–3 semaines de logement temporaire avant d'arriver. Utilisez ce temps pour visiter des quartiers et trouver votre appartement — pas depuis l'étranger.",
      )} />
      {STAY_OPTIONS.map(s => (
        <div key={s.url} className="bg-white border border-gray-100 rounded-2xl px-4 py-4">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[15px] font-bold text-gray-900">{tri(s.name, lang)}</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{tri(s.type, lang)}</span>
              </div>
              <p className="text-[12px] font-semibold text-gray-700">{s.priceRange}</p>
            </div>
            <ExtLink href={s.url} className="shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors">
              {t('방문하기 →', 'Visit →', 'Visiter →')}
            </ExtLink>
          </div>
          <p className="text-[12px] text-gray-500 mb-2">{t('추천 상황:', 'Good for:', 'Idéal pour :')} {tri(s.goodFor, lang)}</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              {s.pros.map((pro, i) => (
                <div key={i} className="flex items-start gap-1 text-[11px] text-gray-600">
                  <span className="text-green-500 shrink-0">✓</span> {tri(pro, lang)}
                </div>
              ))}
            </div>
            <div>
              {s.cons.map((con, i) => (
                <div key={i} className="flex items-start gap-1 text-[11px] text-gray-500">
                  <span className="text-gray-300 shrink-0">✗</span> {tri(con, lang)}
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-amber-800 font-medium italic">"{tri(s.hakkyoNote, lang)}"</p>
        </div>
      ))}
      <CommunityExperience section="stay" />
    </div>
  )
}

// ─── Tool tabs config ─────────────────────────────────────────────────────────

const TOOL_TABS: Array<{ id: string; emoji: string } & Tri> = [
  { id: 'flights',   emoji: '✈️', ko: '항공편',    en: 'Flights',     fr: 'Vols'              },
  { id: 'sim',       emoji: '📱', ko: '유심 카드', en: 'SIM Cards',   fr: 'Cartes SIM'        },
  { id: 'banking',   emoji: '🏦', ko: '은행',      en: 'Banking',     fr: 'Banque'            },
  { id: 'transport', emoji: '🚇', ko: '교통',      en: 'Transport',   fr: 'Transport'         },
  { id: 'stay',      emoji: '🛏️', ko: '첫 숙소',  en: 'First Stay',  fr: 'Premier Logement'  },
]

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
    <div className="w-full min-h-screen bg-gray-50 pb-24">
      <div className="max-w-[720px] mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">✈️</span>
            <h1 className="text-[24px] font-bold text-gray-900">
              {t('첫 걸음', 'First Steps', 'Premiers Pas')}
            </h1>
          </div>
          <p className="text-[14px] text-gray-500 leading-relaxed">
            {t(
              '몬트리올 도착 전후로 필요한 모든 것을 한 곳에서.',
              'Everything you need to move to Montréal — without opening 20 other tabs.',
              "Tout ce qu'il vous faut pour vous installer à Montréal — sans ouvrir 20 onglets.",
            )}
          </p>
        </div>

        {/* ── Progress Tracker ── */}
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-gray-900">
              {t('나의 몬트리올 준비', 'Your Montréal Progress', 'Votre Progression')}
            </h2>
            <div className="text-right shrink-0">
              <span className="text-[22px] font-bold text-gray-900">{pct}%</span>
              <p className="text-[11px] text-gray-400">{t('완료', 'complete', 'complété')}</p>
            </div>
          </div>

          {/* Journey message — changes by % range */}
          <p className="text-[13px] text-gray-500 italic mb-3 leading-snug">
            {getJourneyMessage(pct, lang)}
          </p>

          <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
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
              transition: 'max-height 0.25s ease, opacity 0.35s ease, margin-bottom 0.25s ease',
              overflow: 'hidden',
            }}
          >
            {flash && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium" style={{ background: 'var(--y-l)', color: '#92400E' }}>
                <span>✨</span>
                <span>{flash.msg}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {CHECKLIST.map(item => {
              const isDone = checked.has(item.id)
              return (
                <button
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isDone ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                >
                  <span
                    className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
                    style={isDone ? { background: 'var(--y)', borderColor: 'var(--y)' } : { borderColor: '#D1D5DB' }}
                  >
                    {isDone && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#111" strokeWidth="2.2" strokeLinecap="round">
                        <polyline points="2,6 5,9 10,3"/>
                      </svg>
                    )}
                  </span>
                  <span className={`text-[13px] font-medium ${isDone ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {tri(item, lang)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Essential Tools ── */}
        <div className="mb-6">
          <h2 className="text-[16px] font-bold text-gray-900 mb-1">
            {t('필수 도구', 'Essential Tools', 'Outils Essentiels')}
          </h2>
          <p className="text-[13px] text-gray-500 mb-4">
            {t(
              '링크 목록이 아닌, 결정을 내리는 데 필요한 모든 정보.',
              'Everything you need to make decisions — not just a list of links.',
              "Tout ce qu'il faut pour décider — pas seulement une liste de liens.",
            )}
          </p>

          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 hide-scrollbar">
            {TOOL_TABS.map(tab => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-full border whitespace-nowrap transition-all shrink-0"
                  style={active
                    ? { background: '#111', borderColor: '#111', color: '#fff' }
                    : { background: '#fff', borderColor: '#E5E7EB', color: '#374151' }}
                >
                  <span>{tab.emoji}</span>
                  {tri(tab, lang)}
                </button>
              )
            })}
          </div>

          <div>
            {activeTab === 'flights'   && <FlightsPanel />}
            {activeTab === 'sim'       && <SIMPanel />}
            {activeTab === 'banking'   && <BankingPanel />}
            {activeTab === 'transport' && <TransportPanel />}
            {activeTab === 'stay'      && <StayPanel />}
          </div>
        </div>

        {/* ── Need Help CTA ── */}
        <div className="rounded-2xl px-6 py-6 text-center" style={{ background: 'var(--y-l)' }}>
          <div className="text-3xl mb-3">👋</div>
          <h2 className="text-[17px] font-bold text-gray-900 mb-1">
            {t('아직 모르겠나요?', 'Still not sure?', 'Pas encore sûr ?')}
          </h2>
          <p className="text-[13px] text-gray-600 mb-4 leading-relaxed">
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
