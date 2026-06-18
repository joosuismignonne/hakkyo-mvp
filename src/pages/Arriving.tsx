/**
 * First Steps — HAKKYO Montréal Starter Kit
 *
 * Visual: white background, subtle card borders, monochrome SVG icons.
 * i18n:   every string through t() or tri(). Zero hardcoded visible English.
 * Future: CHECKLIST milestone:true flags feed "My Montréal Journey". Keep them.
 */
import React, { useState, useEffect } from 'react'
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

// ─── SIM providers ────────────────────────────────────────────────────────────

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

type TransportIconKey = 'metro' | 'phone' | 'bus' | 'bike' | 'car'

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

// ─── Rating helpers ───────────────────────────────────────────────────────────

type RatingKey = 'top' | 'good' | 'ok'
const RATING_LABELS: Record<RatingKey, string> = { top: 'Top pick', good: 'Good', ok: 'Situational' }
function RatingBadge({ r }: { r: RatingKey }) {
  const cls = {
    top:  'text-[10px] font-bold px-2 py-0.5 rounded bg-gray-900 text-white',
    good: 'text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600',
    ok:   'text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-50 text-yellow-800',
  }[r]
  return <span className={cls}>{RATING_LABELS[r]}</span>
}

// ─── SIM panel ───────────────────────────────────────────────────────────────

function SimPanel({ lang }: { lang: string }) {
  const ratingOf = (name: string): RatingKey => {
    if (name === 'Fizz') return 'top'
    if (name === 'Public Mobile' || name === 'Virgin Plus') return 'good'
    return 'ok'
  }
  const t = (ko: string, en: string, fr: string) => lang === 'ko' ? ko : lang === 'fr' ? fr : en
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="comp-table">
          <thead><tr>
            <th>Provider</th><th>{t('월 요금', 'Price / mo', 'Prix / mois')}</th>
            <th>{t('추천 대상', 'Best for', 'Idéal pour')}</th>
            <th>{t('한국에서 구매?', 'Buy from Korea?', 'Achat en Corée?')}</th>
            <th>eSIM</th><th>{t('평가', 'Rating', 'Note')}</th>
          </tr></thead>
          <tbody>
            {SIM_PROVIDERS.map(p => (
              <tr key={p.name}>
                <td className="name-cell">
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-500 transition-colors">{p.name} ↗</a>
                </td>
                <td className="tabular-nums">{p.price}</td>
                <td className="text-[12px]">{tri(p.bestFor, lang)}</td>
                <td>{p.esim ? <span className="text-green-700 font-semibold text-[12px]">eSIM ✓</span> : <span className="text-gray-400 text-[12px]">{t('도착 후', 'Must arrive', 'À l\'arrivée')}</span>}</td>
                <td>{p.esim ? <span className="text-green-700 text-[12px]">✓</span> : <span className="text-gray-300 text-[12px]">✗</span>}</td>
                <td><RatingBadge r={ratingOf(p.name)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-[11px] font-bold text-gray-500 mb-1">{t('HAKKYO 추천', 'HAKKYO recommends', 'HAKKYO recommande')}</p>
        <p className="text-[12px] text-gray-600 leading-relaxed">{tri(SIM_PROVIDERS[0].hakkyoNote, lang)}</p>
      </div>
    </div>
  )
}

// ─── Bank panel ──────────────────────────────────────────────────────────────

function BankPanel({ lang }: { lang: string }) {
  const ratingOf = (name: string): RatingKey => {
    if (name === 'TD Bank' || name === 'RBC') return 'top'
    if (name === 'Scotiabank' || name === 'BMO') return 'good'
    return 'ok'
  }
  const t = (ko: string, en: string, fr: string) => lang === 'ko' ? ko : lang === 'fr' ? fr : en
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="comp-table">
          <thead><tr>
            <th>{t('은행', 'Bank', 'Banque')}</th>
            <th>{t('최적 대상', 'Best for', 'Idéal pour')}</th>
            <th>{t('1년 수수료', 'Fee yr 1', 'Frais an 1')}</th>
            <th>{t('새 이민자 패키지', 'Newcomer pkg', 'Programme nouveaux')}</th>
            <th>{t('신용 기록 없이 신용카드', 'Credit card w/o history', 'Carte sans historique')}</th>
            <th>{t('평가', 'Rating', 'Note')}</th>
          </tr></thead>
          <tbody>
            {BANKS.map(b => {
              const r = ratingOf(b.name)
              const freeYr1 = b.name === 'RBC' || b.name === 'BMO'
              const hasPkg  = b.name === 'RBC' || b.name === 'Scotiabank'
              const hasCCno = b.name === 'RBC' || b.name === 'Scotiabank'
              return (
                <tr key={b.name}>
                  <td className="name-cell">
                    <a href={b.url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-500 transition-colors">{b.name} ↗</a>
                  </td>
                  <td className="text-[12px]">{tri(b.badge, lang)}</td>
                  <td className="text-[12px]">{freeYr1 ? <span className="text-green-700 font-semibold">{t('무료', 'Free', 'Gratuit')}</span> : <span className="text-gray-500">~$16/mo</span>}</td>
                  <td className="text-[12px]">{hasPkg ? <span className="text-green-700">✓</span> : <span className="text-gray-300">—</span>}</td>
                  <td className="text-[12px]">{hasCCno ? <span className="text-green-700">✓</span> : <span className="text-gray-300">—</span>}</td>
                  <td><RatingBadge r={r} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-[11px] font-bold text-gray-500 mb-1">{t('HAKKYO 추천', 'HAKKYO recommends', 'HAKKYO recommande')}</p>
        <p className="text-[12px] text-gray-600 leading-relaxed">{tri(BANKS[0].hakkyoNote, lang)}</p>
      </div>
    </div>
  )
}

// ─── Transport panel ─────────────────────────────────────────────────────────

function TransportPanel({ lang }: { lang: string }) {
  const t = (ko: string, en: string, fr: string) => lang === 'ko' ? ko : lang === 'fr' ? fr : en
  return (
    <div className="overflow-x-auto">
      <table className="comp-table">
        <thead><tr>
          <th>{t('교통 수단', 'Option', 'Option')}</th>
          <th>{t('비용', 'Cost', 'Coût')}</th>
          <th>{t('구매 장소', 'Where to get', 'Où obtenir')}</th>
          <th>{t('추천 상황', 'Best for', 'Idéal pour')}</th>
        </tr></thead>
        <tbody>
          {TRANSPORT_ITEMS.map(item => (
            <tr key={item.url}>
              <td className="name-cell">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-500 transition-colors">{tri(item.name, lang)} ↗</a>
              </td>
              <td className="text-[12px] tabular-nums">{tri(item.cost, lang)}</td>
              <td className="text-[12px]">{tri(item.where, lang)}</td>
              <td className="text-[12px] text-gray-500 max-w-[200px]">{tri(item.hakkyoNote, lang)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Housing panel ───────────────────────────────────────────────────────────

function HousingPanel({ lang }: { lang: string }) {
  const t = (ko: string, en: string, fr: string) => lang === 'ko' ? ko : lang === 'fr' ? fr : en
  const ratingOf = (url: string): RatingKey => {
    if (url.includes('airbnb')) return 'top'
    if (url.includes('facebook')) return 'good'
    return 'ok'
  }
  return (
    <div className="overflow-x-auto">
      <table className="comp-table">
        <thead><tr>
          <th>{t('옵션', 'Option', 'Option')}</th>
          <th>{t('비용', 'Cost', 'Coût')}</th>
          <th>{t('추천 기간', 'Good for', 'Idéal pour')}</th>
          <th>{t('주소 증명', 'Address proof', 'Preuve adresse')}</th>
          <th>{t('평가', 'Rating', 'Note')}</th>
        </tr></thead>
        <tbody>
          {STAY_OPTIONS.map(s => (
            <tr key={s.url}>
              <td className="name-cell">
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-500 transition-colors">{tri(s.name, lang)} ↗</a>
                <div className="text-[11px] text-gray-400 font-normal mt-0.5">{tri(s.type, lang)}</div>
              </td>
              <td className="text-[12px] tabular-nums">{s.priceRange}</td>
              <td className="text-[12px]">{tri(s.goodFor, lang)}</td>
              <td className="text-[12px]">{s.url.includes('facebook') ? <span className="text-green-700">✓</span> : <span className="text-gray-300">✗</span>}</td>
              <td><RatingBadge r={ratingOf(s.url)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── SIN panel ───────────────────────────────────────────────────────────────

function SINPanel({ lang }: { lang: string }) {
  const t = (ko: string, en: string, fr: string) => lang === 'ko' ? ko : lang === 'fr' ? fr : en
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="comp-table">
          <thead><tr>
            <th>{t('방법', 'Method', 'Méthode')}</th>
            <th>{t('처리 기간', 'Processing', 'Délai')}</th>
            <th>{t('장소', 'Where', 'Lieu')}</th>
            <th>{t('비고', 'Note', 'Note')}</th>
            <th></th>
          </tr></thead>
          <tbody>
            <tr>
              <td className="name-cell">{t('Service Canada 직접 방문', 'Visit Service Canada', 'Visiter Service Canada')}</td>
              <td className="text-green-700 font-semibold text-[12px]">{t('당일', 'Same day', 'Même jour')}</td>
              <td className="text-[12px]">Service Canada office</td>
              <td className="text-[12px]">{t('가장 빠름. 여권 + 비자 지참.', 'Fastest. Bring passport + permit.', 'Le plus rapide. Passeport + permis.')}</td>
              <td><RatingBadge r="top" /></td>
            </tr>
            <tr>
              <td className="name-cell">{t('온라인 신청', 'Apply online', 'Demande en ligne')}</td>
              <td className="text-[12px] tabular-nums">2–4 {t('주', 'weeks', 'semaines')}</td>
              <td className="text-[12px]">canada.ca/sin</td>
              <td className="text-[12px]">{t('가장 쉽지만 느립니다', 'Easiest but slow', 'Le plus simple mais lent')}</td>
              <td><RatingBadge r="good" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-[12px] text-gray-600 leading-relaxed">
          {t(
            '도착 후 최대한 빨리 Service Canada 사무소를 방문하세요. 여권 + 비자만 있으면 당일 발급됩니다.',
            'Visit a Service Canada office as soon as you arrive. Bring passport + permit — issued same day.',
            "Visitez un bureau Service Canada dès votre arrivée. Passeport + permis suffisent — émis le jour même.",
          )}
        </p>
      </div>
    </div>
  )
}

// ─── Driver's Licence panel ──────────────────────────────────────────────────

function LicencePanel({ lang }: { lang: string }) {
  const t = (ko: string, en: string, fr: string) => lang === 'ko' ? ko : lang === 'fr' ? fr : en
  return (
    <div className="overflow-x-auto">
      <table className="comp-table">
        <thead><tr><th>{t('항목', 'Item', 'Élément')}</th><th>{t('내용', 'Details', 'Détails')}</th></tr></thead>
        <tbody>
          <tr>
            <td className="name-cell">{t('교환 가능?', 'Exchangeable?', 'Échangeable?')}</td>
            <td className="text-[12px]">{t('한국 면허 → 퀘벡 면허 (시험 없음)', 'Korean licence → Québec licence (no tests)', 'Permis coréen → Québec (sans examens)')}</td>
          </tr>
          <tr>
            <td className="name-cell">{t('필요 서류', 'Documents', 'Documents')}</td>
            <td className="text-[12px]">{t('여권 + 한국 면허증 + 공증 번역본', 'Passport + Korean licence + certified translation', 'Passeport + permis coréen + traduction certifiée')}</td>
          </tr>
          <tr>
            <td className="name-cell">{t('신청 장소', 'Where', 'Lieu')}</td>
            <td className="text-[12px]">{t('SAAQ 사무소 (예약 필수)', 'SAAQ office (appointment required)', 'Bureau SAAQ (rendez-vous obligatoire)')}</td>
          </tr>
          <tr>
            <td className="name-cell">{t('신청 기한', 'Deadline', 'Délai')}</td>
            <td className="text-[12px] text-amber-700 font-medium">{t('도착 후 3개월 이내', 'Within 3 months of arrival', "Dans les 3 mois suivant l'arrivée")}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// ─── Language panel ──────────────────────────────────────────────────────────

function LanguagePanel({ lang }: { lang: string }) {
  const t = (ko: string, en: string, fr: string) => lang === 'ko' ? ko : lang === 'fr' ? fr : en
  const programs = [
    { name: 'HAKKYO', type: t('언어 교환', 'Language exchange', 'Échange linguistique'), langs: 'Korean · French · English', cost: t('무료', 'Free', 'Gratuit'), format: t('소규모 그룹', 'Small group', 'Petit groupe'), url: '/programs', rating: 'top' as RatingKey },
    { name: 'SANA (OQLF)', type: t('공식 프랑스어 과정', 'Official French', 'Français officiel'), langs: 'French', cost: t('무료', 'Free', 'Gratuit'), format: t('풀타임 · 파트타임', 'Full / part-time', 'Temps plein/partiel'), url: 'https://www.immigration-quebec.gouv.qc.ca/fr/langue-francaise/apprendre-mieux/cours-francais.html', rating: 'top' as RatingKey },
    { name: 'Concordia CCE', type: t('성인 교육', 'Continuing ed.', 'Formation continue'), langs: 'French · English', cost: '$150–500', format: t('강의실 · 온라인', 'Class / online', 'Classe / en ligne'), url: 'https://www.concordia.ca/cce.html', rating: 'good' as RatingKey },
  ]
  return (
    <div className="overflow-x-auto">
      <table className="comp-table">
        <thead><tr>
          <th>{t('프로그램', 'Program', 'Programme')}</th>
          <th>{t('종류', 'Type', 'Type')}</th>
          <th>{t('언어', 'Language', 'Langue')}</th>
          <th>{t('비용', 'Cost', 'Coût')}</th>
          <th>{t('형식', 'Format', 'Format')}</th>
          <th>{t('평가', 'Rating', 'Note')}</th>
        </tr></thead>
        <tbody>
          {programs.map(p => (
            <tr key={p.name}>
              <td className="name-cell">
                {p.url.startsWith('/')
                  ? <Link to={p.url} className="hover:text-gray-500 transition-colors">{p.name} ↗</Link>
                  : <a href={p.url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-500 transition-colors">{p.name} ↗</a>}
              </td>
              <td className="text-[12px]">{p.type}</td>
              <td className="text-[12px]">{p.langs}</td>
              <td className="text-[12px] font-medium">{p.cost}</td>
              <td className="text-[12px]">{p.format}</td>
              <td><RatingBadge r={p.rating} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Flights panel ────────────────────────────────────────────────────────────

function FlightsPanel({ lang }: { lang: string }) {
  const t = (ko: string, en: string, fr: string) => lang === 'ko' ? ko : lang === 'fr' ? fr : en
  const options = [
    { name: 'Air Canada (ICN→YUL direct)', price: '$800–1,400', stopover: t('없음', 'None', 'Aucune'), duration: '~14h', note: t('직항 — 가장 편리함', 'Direct — most convenient', 'Direct — le plus pratique'), rating: 'top' as RatingKey },
    { name: 'Korean Air / Asiana', price: '$750–1,200', stopover: t('경유 1회', '1 stop', '1 escale'), duration: '18–22h', note: t('가격 대비 우수', 'Good value', 'Bon rapport qualité-prix'), rating: 'good' as RatingKey },
    { name: 'Costco Travel', price: t('번들 할인', 'Bundle discount', 'Réduction forfait'), stopover: t('다양', 'Varies', 'Variable'), duration: '—', note: t('항공 + 호텔 번들', 'Flight + hotel bundle', 'Vol + hôtel'), rating: 'ok' as RatingKey },
  ]
  return (
    <div className="overflow-x-auto">
      <table className="comp-table">
        <thead><tr>
          <th>{t('항공편', 'Option', 'Option')}</th>
          <th>{t('가격 (ICN→YUL)', 'Price (ICN→YUL)', 'Prix (ICN→YUL)')}</th>
          <th>{t('경유', 'Stopover', 'Escale')}</th>
          <th>{t('소요 시간', 'Duration', 'Durée')}</th>
          <th>{t('비고', 'Note', 'Note')}</th>
          <th>{t('평가', 'Rating', 'Note')}</th>
        </tr></thead>
        <tbody>
          {options.map(o => (
            <tr key={o.name}>
              <td className="name-cell">{o.name}</td>
              <td className="text-[12px] tabular-nums">{o.price}</td>
              <td className="text-[12px]">{o.stopover}</td>
              <td className="text-[12px] tabular-nums">{o.duration}</td>
              <td className="text-[12px]">{o.note}</td>
              <td><RatingBadge r={o.rating} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

type TabId = 'sim' | 'bank' | 'transport' | 'housing' | 'sin' | 'licence' | 'language' | 'flights'

const TABS: Array<{
  id: TabId
  label: Tri
  question: Tri
  Panel: React.FC<{ lang: string }>
}> = [
  { id: 'sim',       Panel: SimPanel,       label: { ko: 'SIM 카드',     en: 'SIM Card',    fr: 'Carte SIM'  }, question: { ko: '어느 통신사가 나에게 맞나요?',             en: 'Which provider is right for me?',          fr: 'Quel fournisseur me convient?'            } },
  { id: 'bank',      Panel: BankPanel,      label: { ko: '은행',         en: 'Bank',        fr: 'Banque'     }, question: { ko: '어느 은행에서 계좌를 개설할까요?',          en: 'Which bank should I open?',                fr: 'Quelle banque ouvrir?'                    } },
  { id: 'transport', Panel: TransportPanel, label: { ko: '교통',         en: 'Transport',   fr: 'Transport'  }, question: { ko: '어떻게 이동하나요?',                      en: 'How do I get around?',                     fr: 'Comment me déplacer?'                    } },
  { id: 'housing',   Panel: HousingPanel,   label: { ko: '임시 거처',     en: 'Housing',     fr: 'Logement'   }, question: { ko: '처음 몇 주는 어디서 지내나요?',           en: 'Where do I stay first?',                   fr: 'Où loger en premier?'                    } },
  { id: 'sin',       Panel: SINPanel,       label: { ko: 'SIN',          en: 'SIN',         fr: 'NAS'        }, question: { ko: 'SIN 번호를 어떻게 받나요?',               en: 'How do I get my SIN?',                     fr: 'Comment obtenir mon NAS?'                } },
  { id: 'licence',   Panel: LicencePanel,   label: { ko: '운전 면허',     en: "Driver's",    fr: 'Permis'     }, question: { ko: '한국 면허를 어떻게 교환하나요?',           en: 'How do I convert my licence?',             fr: 'Comment convertir mon permis?'           } },
  { id: 'language',  Panel: LanguagePanel,  label: { ko: '언어 프로그램', en: 'Language',    fr: 'Langue'     }, question: { ko: '어떤 언어 프로그램이 있나요?',             en: 'Which language program fits me?',          fr: 'Quel programme linguistique me convient?' } },
  { id: 'flights',   Panel: FlightsPanel,   label: { ko: '항공편',       en: 'Flights',     fr: 'Vols'       }, question: { ko: '어떻게 항공편을 예약하나요?',             en: 'How do I book my flight?',                 fr: 'Comment réserver mon vol?'               } },
]

// ─── Context panel ────────────────────────────────────────────────────────────

function ContextPanel({ tabId, lang, pct }: { tabId: TabId; lang: string; pct: number }) {
  const t = (ko: string, en: string, fr: string) => lang === 'ko' ? ko : lang === 'fr' ? fr : en

  const budgets: Record<TabId, React.ReactNode> = {
    sim: (<>
      <div className="ctx-row"><span>Fizz (basic)</span><span className="ctx-val">$25/mo</span></div>
      <div className="ctx-row"><span>Fizz (50 GB)</span><span className="ctx-val">$35/mo</span></div>
      <div className="ctx-row"><span>Public Mobile</span><span className="ctx-val">$15/mo</span></div>
      <div className="ctx-row"><span>Bell / Telus</span><span className="ctx-val">$55+/mo</span></div>
    </>),
    bank: (<>
      <div className="ctx-row"><span>{t('입출금 계좌', 'Chequing', 'Compte chèques')}</span><span className="ctx-val">{t('무료~$16/mo', '$0–16/mo', '0–16$/mois')}</span></div>
      <div className="ctx-row"><span>{t('신용카드 (1년)', 'Credit card yr1', 'Carte crédit an1')}</span><span className="ctx-val">{t('무료 (RBC/BMO)', 'Free (RBC/BMO)', 'Gratuit (RBC/BMO)')}</span></div>
    </>),
    transport: (<>
      <div className="ctx-row"><span>{t('STM 월정액', 'STM monthly', 'Mensuel STM')}</span><span className="ctx-val">$97/mo</span></div>
      <div className="ctx-row"><span>{t('학생 할인', 'Student rate', 'Tarif étudiant')}</span><span className="ctx-val">$56/mo</span></div>
      <div className="ctx-row"><span>BIXI (seasonal)</span><span className="ctx-val">$27/mo</span></div>
      <div className="ctx-row"><span>{t('공항 → 시내 (747)', 'Airport bus (747)', 'Aéroport (747)')}</span><span className="ctx-val">$11</span></div>
    </>),
    housing: (<>
      <div className="ctx-row"><span>Airbnb (2 {t('주', 'weeks', 'sem.')})</span><span className="ctx-val">~$800</span></div>
      <div className="ctx-row"><span>{t('호스텔 (2주)', 'Hostel (2 weeks)', 'Auberge (2 sem.)')}</span><span className="ctx-val">~$400</span></div>
      <div className="ctx-row"><span>{t('단기 임대 (1개월)', 'Sublet (1 month)', 'Sous-location (1 mois)')}</span><span className="ctx-val">~$900</span></div>
    </>),
    sin: (<>
      <div className="ctx-row"><span>{t('직접 방문', 'In-person', 'En personne')}</span><span className="ctx-val">{t('당일', 'Same day', 'Même jour')}</span></div>
      <div className="ctx-row"><span>{t('온라인', 'Online', 'En ligne')}</span><span className="ctx-val">2–4 {t('주', 'weeks', 'semaines')}</span></div>
    </>),
    licence: (<>
      <div className="ctx-row"><span>{t('신청 기한', 'Deadline', 'Délai')}</span><span className="ctx-val">{t('3개월', '3 months', '3 mois')}</span></div>
    </>),
    language: (<>
      <div className="ctx-row"><span>HAKKYO</span><span className="ctx-val">{t('무료', 'Free', 'Gratuit')}</span></div>
      <div className="ctx-row"><span>SANA</span><span className="ctx-val">{t('무료', 'Free', 'Gratuit')}</span></div>
      <div className="ctx-row"><span>Concordia CCE</span><span className="ctx-val">$150–500</span></div>
    </>),
    flights: (<>
      <div className="ctx-row"><span>{t('직항 (ICN→YUL)', 'Direct (ICN→YUL)', 'Direct (ICN→YUL)')}</span><span className="ctx-val">$800–1,400</span></div>
      <div className="ctx-row"><span>{t('경유', 'Via stopover', 'Via escale')}</span><span className="ctx-val">$750–1,200</span></div>
    </>),
  }

  const tips: Record<TabId, string> = {
    sim:       t('비행기 안에서 Fizz eSIM을 개통하세요. 착륙 즉시 연결됩니다.', 'Activate Fizz eSIM on the plane. Connected the moment you land.', "Activez l'eSIM Fizz dans l'avion. Connecté dès l'atterrissage."),
    bank:      t('주소 증명으로 Airbnb 확인서도 대부분 인정됩니다.', 'Airbnb confirmation is accepted as address proof at most banks.', "La confirmation Airbnb est acceptée comme preuve d'adresse."),
    transport: t('747번 버스를 타세요 — $11, 신용카드 결제 가능, 24시간 운행.', 'Take the 747 bus — $11, accepts credit card, runs 24/7.', "Prenez le 747 — 11$, carte de crédit acceptée, 24h/24."),
    housing:   t('Airbnb 주소는 은행 계좌 개설 시 주소 증명이 안 될 수 있습니다.', 'Airbnb addresses may not be accepted for banking — use sublet if possible.', "L'adresse Airbnb peut ne pas être acceptée pour la banque."),
    sin:       t('Service Canada 방문은 예약 없이도 가능합니다.', 'Service Canada walk-ins are accepted — no appointment needed.', 'Service Canada accepte les visites sans rendez-vous.'),
    licence:   t('SAAQ는 예약 필수입니다. 미리 온라인으로 예약하세요.', 'SAAQ requires an appointment — book online in advance.', 'SAAQ exige un rendez-vous — réservez en ligne à l\'avance.'),
    language:  t('HAKKYO 언어 교환부터 시작하세요. 무료이고, 원어민을 만날 수 있습니다.', 'Start with HAKKYO exchange — free, meet native speakers.', 'Commencez par l\'échange HAKKYO — gratuit, rencontrez des locuteurs natifs.'),
    flights:   t('출발 60~90일 전 예약 시 가격이 가장 낮습니다.', 'Book 60–90 days before departure for the best prices.', 'Réservez 60–90 jours avant le départ pour les meilleurs prix.'),
  }

  return (
    <aside className="hidden xl:block w-72 shrink-0 sticky top-0 h-screen overflow-y-auto border-l border-gray-100 px-5 py-8 bg-white">
      <div className="mb-6">
        <span className="ctx-label">{t('이 섹션', 'This section', 'Cette section')}</span>
        <p className="text-[13px] font-medium text-gray-900">
          {tri(TABS.find(tb => tb.id === tabId)!.label, lang)}
        </p>
      </div>
      <div className="border-t border-gray-100 pt-4 ctx-section">
        <span className="ctx-label">{t('참고 비용', 'Reference costs', 'Coûts de référence')}</span>
        {budgets[tabId]}
      </div>
      <div className="border-t border-gray-100 pt-4 ctx-section">
        <span className="ctx-label">{t('팁', 'Tip', 'Conseil')}</span>
        <div className="ctx-note">{tips[tabId]}</div>
      </div>
      <div className="border-t border-gray-100 pt-4">
        <span className="ctx-label">{t('전체 진행률', 'Overall progress', 'Progression')}</span>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gray-900 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[12px] font-medium text-gray-500 tabular-nums">{pct}%</span>
        </div>
      </div>
    </aside>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Arriving() {
  const { lang, t } = useLang()
  const [checked, setChecked] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]')) }
    catch { return new Set() }
  })
  const [activeTab, setActiveTab] = useState<TabId>('sim')

  useEffect(() => {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify([...checked])) }
    catch {}
  }, [checked])

  function toggle(id: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const pct = Math.round((checked.size / CHECKLIST.length) * 100)
  const activeTabDef = TABS.find(tb => tb.id === activeTab)!

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 min-w-0 px-6 lg:px-8 pt-12 md:pt-[72px] lg:pt-24 pb-24">
        <div className="max-w-[720px]">

          {/* Page header */}
          <div className="mb-10">
            <p className="t-eyebrow mb-3">{t('나의 여정 · 01', 'My Journey · 01', 'Mon parcours · 01')}</p>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <h1 className="t-page">{t('첫 걸음', 'First Steps', 'Premiers Pas')}</h1>
              <div className="text-right shrink-0 mb-1">
                <p className="text-2xl font-light text-gray-900 tabular-nums leading-none">{checked.size} / {CHECKLIST.length}</p>
                <p className="text-[11px] text-gray-400 mt-1">{t('완료', 'done', 'fait')}</p>
              </div>
            </div>
            <p className="text-[14px] text-gray-400 mt-3 leading-relaxed max-w-[520px]">
              {t(
                '몬트리올 도착 전후로 필요한 모든 것을 한 곳에서.',
                'Everything you need to move to Montréal — without opening 20 other tabs.',
                "Tout ce qu'il vous faut pour vous installer à Montréal.",
              )}
            </p>
          </div>

          {/* Checklist strip */}
          <div className="mb-10">
            <p className="t-section mb-4">{t('체크리스트', 'Checklist', 'Liste de vérification')}</p>
            <div className="check-strip">
              {CHECKLIST.map(item => {
                const done = checked.has(item.id)
                return (
                  <button key={item.id} onClick={() => toggle(item.id)} className={`check-chip${done ? ' done' : ''}`}>
                    <span className={`w-3 h-3 rounded-sm border flex-shrink-0 flex items-center justify-center transition-colors ${done ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}>
                      {done && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><polyline points="2,5 4,7 8,3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </span>
                    <span className="label">{tri(item, lang)}</span>
                  </button>
                )
              })}
            </div>
            {pct > 0 && <p className="text-[12px] text-gray-400 mt-3">{getJourneyMessage(pct, lang)}</p>}
          </div>

          {/* Decision tools */}
          <div>
            <p className="t-section mb-4">{t('결정 도구', 'Decision tools', 'Outils de décision')}</p>
            <div className="flex gap-1 overflow-x-auto pb-1 mb-0 scrollbar-hide flex-wrap md:flex-nowrap">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tri(tab.label, lang)}
                </button>
              ))}
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden mt-2">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                <p className="text-[13px] font-medium text-gray-700">{tri(activeTabDef.question, lang)}</p>
              </div>
              <div className="px-5 py-5">
                <activeTabDef.Panel lang={lang} />
              </div>
            </div>
          </div>

        </div>
      </main>
      <ContextPanel tabId={activeTab} lang={lang} pct={pct} />
    </div>
  )
}
