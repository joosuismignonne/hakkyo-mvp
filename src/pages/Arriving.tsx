/**
 * First Steps — HAKKYO Montréal Starter Kit
 *
 * Tone: "a friend who arrived before you." Neutral options, never prescriptive.
 * Each of 8 tabs is a complete decision page with 7 sections + sticky sidebar.
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

// ─── Data types ───────────────────────────────────────────────────────────────

interface HeroData {
  title: Tri
  sub: Tri
  when: Tri
  cost: Tri
  time: Tri
  canBeforeArrival: Tri
}

interface OptionData {
  name: string
  sub: Tri
  topPick?: boolean
  meta: Array<{ icon: string; label: Tri }>
  worksFor: Tri[]
  worthKnowing: Tri[]
  recommendNote?: Tri
}

interface CompareRow {
  name: string
  cols: Array<string | boolean>
}

interface CompareTable {
  headers: Tri[]
  rows: CompareRow[]
}

interface CommunityNote {
  flag: string
  person: Tri
  text: Tri
  likes: number
}

interface HelpLink {
  label: Tri
  url: string
  domain: string
}

interface FAQItem {
  q: Tri
  a: Tri
}

interface SidebarData {
  quickFacts: Array<{ label: Tri; value: Tri }>
  timeline: Tri
  nextStepId?: string
  nextStepLabel?: Tri
}

interface TabContent {
  id: string
  label: Tri
  hero: HeroData
  options: OptionData[]
  compareTable: CompareTable
  communityNotes: CommunityNote[]
  helpLinks: HelpLink[]
  faq: FAQItem[]
  sidebar: SidebarData
}

// ─── Reusable components ───────────────────────────────────────────────────────

function Hero({ data, lang }: { data: HeroData; lang: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-5 mb-8">
      <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-400 mb-2">
        {lang==='ko'?'이게 뭔가요?':lang==='fr'?"Qu'est-ce que c'est?":'What is this?'}
      </p>
      <h2 className="text-[20px] font-light text-gray-900 leading-snug mb-2">{tri(data.title, lang)}</h2>
      <p className="text-[13px] text-gray-500 leading-relaxed mb-4">{tri(data.sub, lang)}</p>
      <div className="flex flex-wrap gap-2">
        {[
          { icon: 'calendar', text: tri(data.when, lang) },
          { icon: 'currency-dollar', text: tri(data.cost, lang) },
          { icon: 'clock', text: tri(data.time, lang) },
          { icon: 'plane', text: tri(data.canBeforeArrival, lang) },
        ].map((c, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 px-2.5 py-1 bg-white border border-gray-200 rounded-full">
            <i className={`ti ti-${c.icon} text-[12px]`} aria-hidden="true" />{c.text}
          </span>
        ))}
      </div>
    </div>
  )
}

function OptionCard({ opt, lang }: { opt: OptionData; lang: string }) {
  return (
    <div className={`bg-white rounded-xl p-5 ${opt.topPick ? 'border-[1.5px] border-blue-200' : 'border border-gray-200'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[14px] font-medium text-gray-900">{opt.name}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">{tri(opt.sub, lang)}</p>
        </div>
        {opt.topPick && <span className="flex-shrink-0 text-[9px] font-bold tracking-wider uppercase px-2 py-1 rounded bg-blue-50 text-blue-700">
          {lang==='ko'?'추천':lang==='fr'?'Recommandé':'Top pick'}
        </span>}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {opt.meta.map((m, i) => (
          <span key={i} className="inline-flex items-center gap-1 text-[10px] text-gray-500 px-2 py-0.5 bg-gray-50 rounded-full border border-gray-100">
            <i className={`ti ti-${m.icon} text-[11px]`} aria-hidden="true" />{tri(m.label, lang)}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[9px] font-bold tracking-wider uppercase text-green-700 mb-2">
            {lang==='ko'?'이런 분께 적합':lang==='fr'?'Convient si':'Works well for'}
          </p>
          {opt.worksFor.map((w, i) => <p key={i} className="text-[11px] text-gray-600 leading-snug mb-1">{tri(w, lang)}</p>)}
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[9px] font-bold tracking-wider uppercase text-gray-400 mb-2">
            {lang==='ko'?'알아두면 좋은 점':lang==='fr'?'À savoir':'Worth knowing'}
          </p>
          {opt.worthKnowing.map((w, i) => <p key={i} className="text-[11px] text-gray-600 leading-snug mb-1">{tri(w, lang)}</p>)}
        </div>
      </div>
      {opt.recommendNote && (
        <div className="mt-3 border-l-2 border-blue-200 pl-3">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            <span className="font-medium text-gray-700">
              {lang==='ko'?'많은 분들의 경험: ':lang==='fr'?'Ce que font beaucoup : ':'A common pattern: '}
            </span>
            {tri(opt.recommendNote, lang)}
          </p>
        </div>
      )}
    </div>
  )
}

function CompareTableComp({ table, lang }: { table: CompareTable; lang: string }) {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-xl">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {table.headers.map((h, i) => (
              <th key={i} className="text-left text-[9px] font-bold tracking-[0.08em] uppercase text-gray-400 px-4 py-3 border-b border-gray-100 whitespace-nowrap bg-gray-50/50">
                {tri(h, lang)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-gray-50/50">
              <td className="px-4 py-3 text-[12px] font-medium text-gray-900 border-b border-gray-100 whitespace-nowrap">{row.name}</td>
              {row.cols.map((c, ci) => (
                <td key={ci} className="px-4 py-3 text-[12px] text-gray-500 border-b border-gray-100">
                  {typeof c === 'boolean'
                    ? c
                      ? <i className="ti ti-check text-green-600 text-[13px]" aria-label="yes" />
                      : <i className="ti ti-x text-gray-300 text-[13px]" aria-label="no" />
                    : c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CommunityNotes({ notes, lang }: { notes: CommunityNote[]; lang: string }) {
  return (
    <div className="flex flex-col gap-3">
      {notes.map((n, i) => (
        <div key={i} className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[14px]">{n.flag}</span>
            <span className="text-[10px] text-gray-400">{tri(n.person, lang)}</span>
          </div>
          <p className="text-[12px] text-gray-700 leading-relaxed italic mb-2">"{tri(n.text, lang)}"</p>
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <i className="ti ti-thumb-up text-[11px]" aria-hidden="true" />{n.likes}
          </div>
        </div>
      ))}
    </div>
  )
}

function HelpLinks({ links, lang }: { links: HelpLink[]; lang: string }) {
  return (
    <div className="flex flex-col gap-2">
      {links.map((l, i) => (
        <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-100 text-[12px] text-gray-600 hover:bg-gray-100 transition-colors no-underline">
          <i className="ti ti-external-link text-[14px] text-gray-400" aria-hidden="true" />
          <span className="flex-1">{tri(l.label, lang)}</span>
          <span className="text-[10px] text-gray-400">{l.domain}</span>
        </a>
      ))}
    </div>
  )
}

function FAQ({ items, lang }: { items: FAQItem[]; lang: string }) {
  const [open, setOpen] = React.useState<number | null>(0)
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-[12px] font-medium text-gray-800 bg-white hover:bg-gray-50 transition-colors"
          >
            {tri(item.q, lang)}
            <i className={`ti ti-chevron-down text-[14px] text-gray-400 flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {open === i && (
            <div className="px-4 pb-4 pt-1 text-[12px] text-gray-500 leading-relaxed bg-gray-50/50">
              {tri(item.a, lang)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function AskCommunity({ lang }: { lang: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-5 text-center">
      <p className="text-[13px] font-medium text-gray-800 mb-1">
        {lang==='ko'?'더 궁금한 것이 있으신가요?':lang==='fr'?'Une question spécifique?':'Have a specific question?'}
      </p>
      <p className="text-[12px] text-gray-400 leading-relaxed mb-4 max-w-[360px] mx-auto">
        {lang==='ko'
          ? '같은 과정을 먼저 경험한 분들이 HAKKYO 커뮤니티에서 기다리고 있어요.'
          : lang==='fr'
          ? "Des personnes qui ont vécu la même expérience vous attendent dans la communauté HAKKYO."
          : 'People who already went through this are in the HAKKYO community and happy to help.'}
      </p>
      <a href="/community" className="inline-block px-4 py-2 bg-gray-900 text-white text-[12px] font-medium rounded-lg hover:bg-gray-700 transition-colors no-underline">
        {lang==='ko'?'커뮤니티에 질문하기':lang==='fr'?'Poser une question':'Ask the community'}
      </a>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-400 whitespace-nowrap">{children}</span>
      <div className="flex-1 h-px bg-gray-100" />
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
      name: 'Fizz',
      sub: { ko: '저렴하고 앱으로 관리, eSIM 지원', en: 'Affordable, app-managed, eSIM-ready', fr: 'Abordable, géré par appli, eSIM' },
      topPick: true,
      meta: [
        { icon: 'currency-dollar', label: { ko: '$25–35/월', en: '$25–35/mo', fr: '25–35$/mois' } },
        { icon: 'device-mobile', label: { ko: 'eSIM 지원', en: 'eSIM available', fr: 'eSIM dispo' } },
        { icon: 'plane', label: { ko: '도착 전 개통 가능', en: 'Set up before arrival', fr: 'Avant arrivée' } },
      ],
      worksFor: [
        { ko: '대부분의 분들', en: 'Most people', fr: 'La plupart des gens' },
        { ko: '앱으로 직접 관리하고 싶은 분', en: 'Those who prefer managing things in an app', fr: "Ceux qui aiment tout gérer dans une appli" },
      ],
      worthKnowing: [
        { ko: '고객 지원은 앱/온라인 위주', en: 'Support is app/online based', fr: 'Support surtout par appli/en ligne' },
        { ko: '한국어 지원은 없음', en: 'No Korean-language support', fr: 'Pas de support en coréen' },
      ],
      recommendNote: {
        ko: '많은 분들이 비행기 타기 전에 Fizz eSIM을 개통해 두고, 도착하자마자 바로 데이터를 써요.',
        en: 'Many set up a Fizz eSIM before their flight so they have data the moment they land.',
        fr: "Beaucoup activent une eSIM Fizz avant le vol pour avoir des données dès l'atterrissage.",
      },
    },
    {
      name: 'Public Mobile',
      sub: { ko: '가장 저렴한 장기 옵션', en: 'Cheapest for longer stays', fr: 'Le moins cher pour longs séjours' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '$15–25/월', en: '$15–25/mo', fr: '15–25$/mois' } },
        { icon: 'device-mobile', label: { ko: '물리 SIM', en: 'Physical SIM', fr: 'SIM physique' } },
      ],
      worksFor: [
        { ko: '예산을 아끼는 장기 체류자', en: 'Budget-conscious long stays', fr: 'Longs séjours à petit budget' },
      ],
      worthKnowing: [
        { ko: 'eSIM 미지원, 도착 후 개통', en: 'No eSIM, set up after arrival', fr: "Pas d'eSIM, activation après arrivée" },
        { ko: '데이터 속도는 중간 수준', en: 'Moderate data speed', fr: 'Vitesse de données moyenne' },
      ],
    },
    {
      name: 'Bell / Rogers (airport)',
      sub: { ko: '준비 없이 도착해도 공항에서 바로', en: 'Right at the airport, no prep', fr: "Direct à l'aéroport, sans préparation" },
      meta: [
        { icon: 'currency-dollar', label: { ko: '$55–80/월', en: '$55–80/mo', fr: '55–80$/mois' } },
        { icon: 'bolt', label: { ko: '빠른 속도', en: 'Fast speeds', fr: 'Vitesse rapide' } },
      ],
      worksFor: [
        { ko: '미리 준비하지 못하고 도착한 분', en: 'No-prep arrivals', fr: 'Arrivées sans préparation' },
      ],
      worthKnowing: [
        { ko: '월 요금이 가장 비쌈', en: 'Most expensive monthly', fr: 'Le forfait le plus cher' },
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
      { name: 'Fizz', cols: ['$25–35', true, true, 'Good', 'Most people'] },
      { name: 'Public Mobile', cols: ['$15–25', false, false, 'Moderate', 'Budget long stays'] },
      { name: 'Virgin Plus', cols: ['$30–45', true, true, 'Good', 'Mid-range'] },
      { name: 'Bell airport', cols: ['$55–80', true, true, 'Excellent', 'No-prep arrivals'] },
    ],
  },
  communityNotes: [
    { flag: '🇰🇷', person: { ko: '학생 · 2023년 9월', en: 'Student Sept 2023', fr: 'Étudiant sept. 2023' }, text: { ko: '출국 전에 Fizz eSIM을 켜뒀더니 도착하자마자 바로 인터넷이 됐어요. 정말 편했어요.', en: 'I activated a Fizz eSIM before flying and had internet the second I landed. So convenient.', fr: "J'ai activé une eSIM Fizz avant de partir, j'avais internet dès l'atterrissage. Super pratique." }, likes: 31 },
    { flag: '🇰🇷', person: { ko: '워킹홀리데이 · 2024년 2월', en: 'Working Holiday Feb 2024', fr: 'PVT févr. 2024' }, text: { ko: 'Public Mobile로 한 달에 $20 정도만 써요. 데이터를 많이 안 쓰면 충분해요.', en: "I pay about $20/mo with Public Mobile. Plenty if you don't use much data.", fr: "Je paie environ 20$/mois chez Public Mobile. Suffisant si on consomme peu." }, likes: 19 },
    { flag: '🇨🇦', person: { ko: '한국계 캐나다인', en: 'Korean-Canadian', fr: 'Coréen-Canadien' }, text: { ko: '공항에서 급하게 Bell을 샀는데 비싸더라고요. 다음엔 미리 eSIM 준비하라고 말해주고 싶어요.', en: 'I grabbed a Bell SIM at the airport in a rush — pricey. Next time, prep an eSIM ahead.', fr: "J'ai pris une SIM Bell à l'aéroport en vitesse — cher. La prochaine fois, une eSIM à l'avance." }, likes: 14 },
  ],
  helpLinks: [
    { label: { ko: 'Fizz — 요금제 및 가격', en: 'Fizz — Plans and pricing', fr: 'Fizz — Forfaits et prix' }, url: 'https://fizz.ca', domain: 'fizz.ca' },
    { label: { ko: 'Public Mobile — 요금제', en: 'Public Mobile — Plans', fr: 'Public Mobile — Forfaits' }, url: 'https://www.publicmobile.ca', domain: 'publicmobile.ca' },
    { label: { ko: 'CRTC 무선 소비자 가이드', en: 'CRTC wireless consumer guide', fr: 'Guide CRTC du consommateur sans fil' }, url: 'https://crtc.gc.ca', domain: 'crtc.gc.ca' },
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
}

// ─── TAB 4: Housing ───────────────────────────────────────────────────────────

const HOUSING_TAB: TabContent = {
  id: 'housing',
  label: { ko: '주거', en: 'Housing', fr: 'Logement' },
  hero: {
    title: {
      ko: '도착 직후 머물 곳 찾기',
      en: 'Finding somewhere to stay when you first arrive',
      fr: 'Trouver où loger à votre arrivée',
    },
    sub: {
      ko: '대부분 영구 아파트를 찾는 동안 첫 2–4주는 임시 거처에 머물러요. 아파트 찾기는 현지에서 직접 보는 게 훨씬 효과적이라, 원격으로 찾는 건 더 어려워요.',
      en: 'Most people stay in temporary housing for the first 2–4 weeks while searching for a permanent apartment. Apartment hunting is much more effective in person — remote searches are harder.',
      fr: "La plupart logent en hébergement temporaire 2–4 semaines en cherchant un appartement permanent. La recherche est plus efficace sur place — à distance, c'est plus dur.",
    },
    when: { ko: '도착 전 예약 권장', en: 'Book before you arrive', fr: "Réserver avant d'arriver" },
    cost: { ko: '2주에 $400–1,400', en: '$400–1,400 for 2 weeks', fr: '400–1 400$ pour 2 semaines' },
    time: { ko: '2–4주 임시 거처, 아파트 구하는데 보통 2–4주 더', en: '2–4 weeks temp housing, then 2–4 weeks to find an apartment', fr: '2–4 semaines temporaire, puis 2–4 semaines pour trouver' },
    canBeforeArrival: { ko: '네, 도착 전 예약 가능', en: 'Yes, book before arriving', fr: "Oui, réserver avant d'arriver" },
  },
  options: [
    {
      name: 'Airbnb / Short-term rental',
      sub: { ko: '독립된 공간, 유연한 날짜', en: 'Private space, flexible dates', fr: 'Espace privé, dates flexibles' },
      topPick: true,
      meta: [
        { icon: 'currency-dollar', label: { ko: '2주에 ~$800–1,400', en: '~$800–1,400 for 2 weeks', fr: '~800–1 400$ / 2 sem.' } },
        { icon: 'plane', label: { ko: '도착 전 예약', en: 'Book before arrival', fr: 'Réserver avant' } },
        { icon: 'building-bank', label: { ko: '은행용 주소 사용 가능', en: 'Address usable for banking', fr: 'Adresse utilisable en banque' } },
      ],
      worksFor: [
        { ko: '독립된 공간을 원하는 분', en: 'Those wanting private space', fr: 'Ceux qui veulent un espace privé' },
        { ko: '은행 계좌에 주소를 쓰려는 분', en: 'Using address for bank account', fr: "Adresse pour le compte bancaire" },
        { ko: '연장 유연성이 필요한 분', en: 'Flexibility to extend', fr: 'Flexibilité de prolonger' },
      ],
      worthKnowing: [
        { ko: '호스텔보다 비쌈', en: 'More expensive than hostels', fr: 'Plus cher que les auberges' },
        { ko: '일부 집주인은 임대 신청에 에어비앤비 주소를 안 받음', en: "Some landlords don't accept Airbnb for lease applications", fr: "Certains proprios refusent l'adresse Airbnb pour un bail" },
      ],
      recommendNote: {
        ko: '많은 분들이 은행 계좌를 열 때 에어비앤비 주소를 써요. 예약 확인 이메일이 보통 주소 증빙으로 인정돼요.',
        en: 'Many people use their Airbnb address when opening a bank account. The confirmation email is usually accepted as proof of address.',
        fr: "Beaucoup utilisent leur adresse Airbnb pour ouvrir un compte. Le courriel de confirmation sert souvent de preuve d'adresse.",
      },
    },
    {
      name: 'Hostel / Student residence',
      sub: { ko: '저렴한 옵션', en: 'Budget option', fr: 'Option économique' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '~$35–60/박', en: '~$35–60/night', fr: '~35–60$/nuit' } },
      ],
      worksFor: [
        { ko: '예산을 아끼는 분', en: 'Budget-conscious', fr: 'Petit budget' },
        { ko: '다른 이민자를 만나고 싶은 분', en: 'Meet other newcomers', fr: "Rencontrer d'autres arrivants" },
        { ko: '1–2주', en: '1–2 weeks', fr: '1–2 semaines' },
      ],
      worthKnowing: [
        { ko: '공용 공간', en: 'Shared spaces', fr: 'Espaces partagés' },
        { ko: '공식 서류용 주소로 안 받힐 수 있음', en: 'Address may not be accepted for official documents', fr: "L'adresse peut ne pas être acceptée officiellement" },
      ],
    },
    {
      name: 'Facebook / Kijiji Sublet',
      sub: { ko: '가구 포함 방', en: 'Furnished rooms', fr: 'Chambres meublées' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '~$700–1,200/월', en: '~$700–1,200/mo', fr: '~700–1 200$/mois' } },
      ],
      worksFor: [
        { ko: '더 긴 탐색 (1–2개월)', en: 'Longer searches (1–2 months)', fr: 'Recherches plus longues (1–2 mois)' },
        { ko: '에어비앤비보다 저렴하게', en: 'Lower cost than Airbnb', fr: "Moins cher qu'Airbnb" },
      ],
      worthKnowing: [
        { ko: '원격으로 잡기 어려움', en: 'Harder to arrange remotely', fr: 'Difficile à distance' },
        { ko: '꼼꼼히 확인 — 일부는 사기', en: 'Vet carefully — some listings are scams', fr: 'Vérifiez bien — certaines annonces sont des arnaques' },
      ],
    },
    {
      name: 'School Residence / Homestay',
      sub: { ko: '학교를 통해', en: 'Through your school', fr: 'Via votre école' },
      meta: [
        { icon: 'currency-dollar', label: { ko: '경우에 따라 다름', en: 'Varies', fr: 'Variable' } },
      ],
      worksFor: [
        { ko: '주거 서비스가 있는 재학생', en: 'Enrolled students with housing services', fr: 'Étudiants avec services de logement' },
        { ko: '지원받는 정착을 원하는 분', en: 'Want a supported landing', fr: 'Veulent une arrivée encadrée' },
      ],
      worthKnowing: [
        { ko: '자리가 한정적 — 일찍 신청', en: 'Limited availability — apply early', fr: 'Places limitées — postulez tôt' },
      ],
    },
  ],
  compareTable: {
    headers: [
      { ko: '옵션', en: 'Option', fr: 'Option' },
      { ko: '2주 비용', en: '2-week cost', fr: 'Coût 2 sem.' },
      { ko: '주소 증빙', en: 'Address proof', fr: "Preuve d'adresse" },
      { ko: '미리 예약', en: 'Book ahead', fr: 'Réserver tôt' },
      { ko: '적합한 분', en: 'Best for', fr: 'Idéal pour' },
    ],
    rows: [
      { name: 'Airbnb', cols: ['~$800–1,400', true, true, 'Privacy, banking'] },
      { name: 'Hostel', cols: ['~$400–600', false, true, 'Budget newcomers'] },
      { name: 'Sublet (Facebook)', cols: ['~$600–900', true, false, 'Longer searches'] },
      { name: 'School housing', cols: ['Varies', true, true, 'Enrolled students'] },
    ],
  },
  communityNotes: [
    { flag: '🇰🇷', person: { ko: '학생 · 2023년 8월', en: 'Student Aug 2023', fr: 'Étudiant août 2023' }, text: { ko: '오기 전에 에어비앤비를 3주 예약했어요. 도착 3일째에 그 주소로 은행 계좌를 열었고 문제없었어요.', en: 'I booked an Airbnb for 3 weeks before coming. Used that address for my bank account on day 3. Worked fine.', fr: "J'ai réservé un Airbnb 3 semaines avant. J'ai utilisé l'adresse pour mon compte au 3e jour. Sans souci." }, likes: 26 },
    { flag: '🇰🇷', person: { ko: '워킹홀리데이 · 2023년 11월', en: 'Working Holiday Nov 2023', fr: 'PVT nov. 2023' }, text: { ko: '호스텔에 일주일 묵으면서 페이스북에서 서블렛을 찾았어요. 다른 여행자도 만나고 빨리 적응했어요.', en: 'I stayed at a hostel for a week and found a sublet on Facebook. Met other travellers and got oriented quickly.', fr: "J'ai logé une semaine en auberge et trouvé un sous-loc sur Facebook. Rencontré d'autres voyageurs, vite orienté." }, likes: 17 },
    { flag: '🇫🇷', person: { ko: '프랑스 학생', en: 'French Student', fr: 'Étudiant français' }, text: { ko: '학교에 홈스테이 프로그램이 있었어요. 더 비쌌지만 첫 달에 현지 호스트가 있는 게 정말 큰 도움이었어요.', en: 'My school had a homestay program. More expensive but having a local host the first month made a real difference.', fr: "Mon école avait un programme d'hébergement. Plus cher, mais avoir un hôte local le premier mois a tout changé." }, likes: 13 },
  ],
  helpLinks: [
    { label: { ko: 'Airbnb 몬트리올', en: 'Airbnb Montréal', fr: 'Airbnb Montréal' }, url: 'https://www.airbnb.ca/montreal', domain: 'airbnb.ca' },
    { label: { ko: 'Kijiji 몬트리올 임대', en: 'Kijiji Montréal rentals', fr: 'Kijiji locations Montréal' }, url: 'https://www.kijiji.ca', domain: 'kijiji.ca' },
    { label: { ko: 'Facebook Marketplace', en: 'Facebook Marketplace', fr: 'Facebook Marketplace' }, url: 'https://www.facebook.com/marketplace', domain: 'facebook.com' },
    { label: { ko: 'Concordia 교외 주거', en: 'Concordia off-campus housing', fr: 'Concordia logement hors campus' }, url: 'https://www.concordia.ca/students/housing.html', domain: 'concordia.ca' },
  ],
  faq: [
    { q: { ko: '영구 아파트 없이 은행 계좌 주소를 어떻게 증빙하나요?', en: 'How do I prove my address for a bank account without a permanent apartment?', fr: "Comment prouver mon adresse sans appartement permanent?" }, a: { ko: '에어비앤비 예약 확인 이메일이 대부분 은행에서 주소 증빙으로 인정돼요. 호스텔 확인서도 될 수 있으니 미리 전화하세요.', en: 'An Airbnb confirmation email is accepted as proof of address at most banks. A hostel confirmation may also work — call ahead to confirm.', fr: "Le courriel de confirmation Airbnb est accepté dans la plupart des banques. Une confirmation d'auberge peut aussi marcher — appelez avant." } },
    { q: { ko: '아파트를 찾기 가장 좋은 시기는 언제인가요?', en: 'When is the best time to look for apartments?', fr: 'Quand chercher un appartement?' }, a: { ko: '4–6월에 매물이 가장 많아요. 7월 1일은 몬트리올의 비공식 "이사의 날"로 대부분의 임대가 바뀌어요. 1월은 더 어려워요.', en: 'April–June has the most listings. July 1 is Montréal\'s unofficial "moving day" when most leases turn over. Searching in January is harder.', fr: "Avril–juin offre le plus d'annonces. Le 1er juillet est le « jour du déménagement » à Montréal. Janvier est plus difficile." } },
    { q: { ko: '페이스북에서 집을 찾아도 안전한가요?', en: 'Is it safe to find housing on Facebook?', fr: 'Est-ce sûr de chercher sur Facebook?' }, a: { ko: '"Logements/Appartements Montréal" 같은 그룹을 많이 써요. 돈을 보내기 전에 직접 보거나 영상통화로 확인하세요.', en: 'Facebook groups like "Logements/Appartements Montréal" are widely used. Arrange to see the place (or video call) before sending any money.', fr: "Des groupes comme « Logements/Appartements Montréal » sont très utilisés. Visitez (ou appel vidéo) avant d'envoyer de l'argent." } },
    { q: { ko: '첫 달과 마지막 달 월세로 얼마를 잡아야 하나요?', en: "How much should I budget for first and last month's rent?", fr: 'Combien prévoir pour le premier et dernier mois?' }, a: { ko: '퀘벡 집주인은 법적으로 마지막 달 월세를 요구할 수 없어요. 첫 달만 내는 게 일반적이에요.', en: "Québec landlords cannot legally ask for last month's rent. First month only is standard.", fr: "Au Québec, le proprio ne peut légalement exiger le dernier mois. Le premier mois seul est la norme." } },
  ],
  sidebar: {
    quickFacts: [
      { label: { ko: '에어비앤비 2주', en: 'Airbnb 2 weeks', fr: 'Airbnb 2 sem.' }, value: { ko: '~$800–1,400', en: '~$800–1,400', fr: '~800–1 400$' } },
      { label: { ko: '호스텔 2주', en: 'Hostel 2 weeks', fr: 'Auberge 2 sem.' }, value: { ko: '~$400–600', en: '~$400–600', fr: '~400–600$' } },
      { label: { ko: '이사의 날', en: 'Moving day', fr: 'Jour du déménagement' }, value: { ko: '7월 1일', en: 'July 1', fr: '1er juillet' } },
      { label: { ko: '임대 시작', en: 'Lease start', fr: 'Début du bail' }, value: { ko: '보통 7월 1일', en: 'Typically July 1', fr: 'Souvent 1er juillet' } },
    ],
    timeline: { ko: '도착 전 에어비앤비 2–3주 예약. 도착 후 2–4주 내에 장기 아파트 계약.', en: 'Book 2–3 weeks of Airbnb before arriving. Find a permanent apartment within 2–4 weeks of arrival.', fr: "Réservez 2–3 semaines sur Airbnb avant d'arriver. Trouvez un appartement permanent dans les 2–4 semaines." },
    nextStepId: 'insurance',
    nextStepLabel: { ko: '세입자 보험 가입하기', en: 'Get tenant insurance', fr: "Souscrire une assurance locataire" },
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
    { label: { ko: 'Service Canada 사무소 찾기', en: 'Service Canada office locator', fr: 'Localisateur de bureaux Service Canada' }, url: 'https://www.canada.ca/en/employment-social-development/corporate/portfolio/service-canada/office-locations.html', domain: 'canada.ca' },
    { label: { ko: '온라인으로 SIN 신청', en: 'Apply for SIN online', fr: 'Demander un NAS en ligne' }, url: 'https://www.canada.ca/en/employment-social-development/services/sin/apply.html', domain: 'canada.ca' },
    { label: { ko: 'SIN 정보 안내', en: 'SIN information guide', fr: "Guide d'information NAS" }, url: 'https://www.canada.ca/en/employment-social-development/services/sin.html', domain: 'canada.ca' },
  ],
  faq: [
    { q: { ko: '몬트리올에서 가장 가까운 Service Canada는 어디인가요?', en: 'Where is the nearest Service Canada office in Montréal?', fr: 'Où est le bureau Service Canada le plus proche?' }, a: { ko: '몬트리올에 여러 사무소가 있어요. 다운타운 근처(Guy-Concordia 지역)가 편리해요. 전체 목록과 운영 시간은 canada.ca/service-canada에서 확인하세요.', en: 'There are several offices in Montréal. The one near downtown (Guy-Concordia area) is convenient. Check canada.ca/service-canada for the full list and hours.', fr: "Plusieurs bureaux à Montréal. Celui près du centre-ville (secteur Guy-Concordia) est pratique. Liste et horaires sur canada.ca/service-canada." } },
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
      name: 'HAKKYO Language Exchange',
      sub: { ko: '한국어–프랑스어–영어 회화 교환', en: 'Korean–French–English conversation exchange', fr: 'Échange coréen–français–anglais' },
      topPick: true,
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
    { label: { ko: 'HAKKYO 프로그램', en: 'HAKKYO programs', fr: 'Programmes HAKKYO' }, url: 'https://hakkyo.ca', domain: 'hakkyo.ca' },
    { label: { ko: 'SANA 프랑스어 강좌', en: 'SANA French classes', fr: 'Cours de français SANA' }, url: 'https://www.quebec.ca/en/immigration/french-language', domain: 'immigration-quebec.gouv.qc.ca' },
    { label: { ko: 'Concordia CCE', en: 'Concordia CCE', fr: 'Concordia CCE' }, url: 'https://www.concordia.ca/cce.html', domain: 'concordia.ca' },
    { label: { ko: 'UQAM 평생교육', en: 'UQAM continuing ed', fr: 'UQAM formation continue' }, url: 'https://www.uqam.ca', domain: 'uqam.ca' },
  ],
  faq: [
    { q: { ko: '몬트리올에서 살려면 프랑스어를 해야 하나요?', en: 'Do I need to speak French to live in Montréal?', fr: 'Faut-il parler français pour vivre à Montréal?' }, a: { ko: '일상생활에는 꼭 필요하진 않아요 — 영어가 널리 쓰여요. 하지만 프랑스어는 더 많은 사회적·직업적 기회를 열어줘요. 많은 이민자가 기초라도 배우면 도움이 된다고 느껴요.', en: 'Not for daily life — English is widely spoken. But French opens up more social and professional opportunities. Many newcomers find it helpful to at least learn basics.', fr: "Pas pour le quotidien — l'anglais est courant. Mais le français ouvre plus de portes sociales et professionnelles. Beaucoup trouvent utile d'apprendre au moins les bases." } },
    { q: { ko: '프랑스어로 대화가 되기까지 얼마나 걸리나요?', en: 'How long does it take to become conversational in French?', fr: 'Combien de temps pour converser en français?' }, a: { ko: '꾸준히 연습하면 많은 분이 3–6개월에 기초 회화 수준에 도달해요. 매일 노출(TV, 팟캐스트, HAKKYO 교환)이 크게 가속화해요.', en: 'With regular practice, many people reach basic conversational French in 3–6 months. Daily exposure (TV, podcasts, HAKKYO exchange) accelerates this significantly.', fr: "Avec une pratique régulière, beaucoup atteignent un niveau de base en 3–6 mois. L'exposition quotidienne (TV, balados, échange HAKKYO) accélère beaucoup." } },
    { q: { ko: 'SANA 수업이 정말 무료인가요?', en: 'Are SANA classes really free?', fr: 'Les cours SANA sont-ils vraiment gratuits?' }, a: { ko: '네 — SANA는 자격이 되는 신규 이민자에게 퀘벡 정부가 전액 지원해요. 워킹홀리데이와 일부 학생 허가 소지자가 해당돼요. SANA 웹사이트에서 자격 조건을 확인하세요.', en: 'Yes — SANA is fully subsidized by the Québec government for eligible newcomers. Working Holiday and some student permit holders qualify. Check the eligibility criteria on the SANA website.', fr: "Oui — SANA est entièrement subventionné par le Québec pour les arrivants admissibles. Les titulaires de PVT et certains permis d'études sont admissibles. Vérifiez les critères sur le site SANA." } },
    { q: { ko: 'HAKKYO 교환과 일반 수업의 차이는 뭔가요?', en: "What's the difference between HAKKYO exchange and a regular class?", fr: "Quelle différence entre l'échange HAKKYO et un cours?" }, a: { ko: 'HAKKYO는 회화 파트너 교환이에요 — 비정형적이고 사회적이며 무료예요. 수업은 구조, 문법, 수료증을 줘요. 많은 분이 둘 다 해요.', en: 'HAKKYO is a conversation partner exchange — unstructured, social, and free. Classes give structure, grammar, and a certificate. Many people do both.', fr: "HAKKYO est un échange de partenaires de conversation — informel, social et gratuit. Les cours offrent structure, grammaire et certificat. Beaucoup font les deux." } },
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
    { label: { ko: 'YUL 공항 안내', en: 'YUL Airport guide', fr: 'Guide aéroport YUL' }, url: 'https://www.admtl.com/en/flights/arriving', domain: 'admtl.com' },
    { label: { ko: 'STM 747 버스 정보', en: 'STM 747 bus info', fr: 'Info bus STM 747' }, url: 'https://www.stm.info/en/info/networks/bus/express-shuttle/route-747-yul-aeroport-montreal-trudeau-downtown', domain: 'stm.info' },
    { label: { ko: '캐나다 세관 신고', en: 'Canada customs declaration', fr: 'Déclaration douanière Canada' }, url: 'https://www.cbsa-asfc.gc.ca/travel-voyage/dc-ed-eng.html', domain: 'cbsa-asfc.gc.ca' },
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
}

// ─── NEW TAB: Long-term housing ───────────────────────────────────────────────

const LONG_HOUSING_TAB: TabContent = {
  id: 'housing',
  label: { ko: '장기 주거', en: 'Long-term housing', fr: 'Logement à long terme' },
  hero: {
    title: { ko: '몬트리올에서 아파트 구하기', en: 'Finding an apartment in Montréal', fr: 'Trouver un appartement à Montréal' },
    sub: {
      ko: '퀘벡의 임대 규칙은 다른 주와 달라요. 보증금을 요구하면 위법이에요. 대부분의 임대는 첫 달 월세만 내요. 직접 보는 것이 원격으로 찾는 것보다 훨씬 효과적이에요.',
      en: "Québec rental rules differ from other provinces. Demanding a security deposit is illegal. Most leases require only first month's rent. Apartment hunting in person is far more effective than remote searching.",
      fr: "La location au Québec diffère des autres provinces. Exiger un dépôt de garantie est illégal. La plupart des baux demandent seulement le premier mois. Chercher sur place est bien plus efficace.",
    },
    when: { ko: '임시 숙소 도착 후 2–4주', en: '2–4 weeks after arriving in temp housing', fr: '2–4 semaines après le logement temporaire' },
    cost: { ko: '$700–1,800/월 (원베드 기준)', en: '$700–1,800/mo (1 bedroom)', fr: '700–1 800$/mois (1 chambre)' },
    time: { ko: '검색 2–4주, 계약 당일', en: '2–4 weeks searching, lease signing same day', fr: '2–4 semaines de recherche, bail signé le jour même' },
    canBeforeArrival: { ko: '원격 계약은 사기 위험 — 직접 보는 것을 권장', en: 'Remote signing is risky — strongly recommend viewing in person', fr: 'Signer à distance est risqué — fortement recommandé en personne' },
  },
  options: [
    {
      name: 'Facebook Groups',
      sub: { ko: '"Logements/Appartements Montréal" 등 현지 그룹', en: '"Logements/Appartements Montréal" and Korean community groups', fr: "Groupes « Logements/Appartements Montréal »" },
      topPick: true,
      meta: [
        { icon: 'currency-dollar', label: { ko: '무료 검색', en: 'Free to search', fr: 'Recherche gratuite' } },
        { icon: 'users', label: { ko: '한국 커뮤니티 그룹도 있음', en: 'Korean community groups available', fr: 'Groupes coréens disponibles' } },
      ],
      worksFor: [
        { ko: '서블렛, 임시 임대', en: 'Sublets and short-term rentals', fr: 'Sous-locations et locations courtes' },
        { ko: '룸메이트를 찾는 분', en: 'Looking for roommates', fr: 'Cherchant colocataires' },
        { ko: '이미 알고 있는 동네', en: 'Specific neighbourhoods you know', fr: 'Quartiers ciblés' },
      ],
      worthKnowing: [
        { ko: '방문 전 절대 돈을 보내지 마세요', en: 'Never send money before viewing', fr: "Ne jamais envoyer d'argent avant de visiter" },
        { ko: '가격이 너무 싸거나 집주인이 해외에 있으면 사기일 가능성이 높음', en: 'Too-cheap listings or overseas landlords are often scams', fr: 'Prix trop bas ou propriétaire à l\'étranger = souvent arnaque' },
      ],
      recommendNote: {
        ko: '많은 한국인 이민자가 Facebook의 한인 커뮤니티 그룹을 통해 아파트를 찾아요. 직접 보거나 영상통화 후 계약하세요.',
        en: 'Many Korean newcomers find apartments through Korean community groups on Facebook. Always view in person or video call before signing.',
        fr: "Beaucoup de Coréens trouvent via les groupes Facebook coréens. Toujours visiter ou appel vidéo avant de signer.",
      },
    },
    {
      name: 'Kijiji / Rentals.ca',
      sub: { ko: '아파트 매물 전문 플랫폼', en: 'Apartment listing platforms', fr: 'Plateformes de petites annonces' },
      meta: [
        { icon: 'world', label: { ko: 'kijiji.ca · rentals.ca', en: 'kijiji.ca · rentals.ca', fr: 'kijiji.ca · rentals.ca' } },
      ],
      worksFor: [
        { ko: '다양한 가격대', en: 'Wide price range', fr: 'Large gamme de prix' },
        { ko: '정규 임대 계약', en: 'Standard lease agreements', fr: 'Baux standards' },
      ],
      worthKnowing: [
        { ko: '직접 보기 전 예약 금지', en: 'Do not commit before viewing', fr: 'Ne pas s\'engager avant de visiter' },
      ],
    },
    {
      name: 'Centris / Zumper / PadMapper',
      sub: { ko: '공식 부동산 플랫폼', en: 'Professional listing platforms', fr: 'Plateformes immobilières professionnelles' },
      meta: [
        { icon: 'world', label: { ko: 'centris.ca · zumper.com', en: 'centris.ca · zumper.com', fr: 'centris.ca · zumper.com' } },
      ],
      worksFor: [
        { ko: '더 많은 정규 임대 계약', en: 'More formal lease agreements', fr: 'Plus de baux formels' },
        { ko: '지도 기반 검색', en: 'Map-based searching', fr: 'Recherche par carte' },
      ],
      worthKnowing: [
        { ko: '중개 수수료 있을 수 있음', en: 'May involve agent fees', fr: "Possibles frais d'agence" },
      ],
    },
  ],
  compareTable: {
    headers: [
      { ko: '플랫폼', en: 'Platform', fr: 'Plateforme' },
      { ko: '무료 검색', en: 'Free search', fr: 'Recherche gratuite' },
      { ko: '서블렛', en: 'Sublets', fr: 'Sous-locations' },
      { ko: '정규 계약', en: 'Formal lease', fr: 'Bail formel' },
      { ko: '한국어 커뮤니티', en: 'Korean community', fr: 'Communauté coréenne' },
    ],
    rows: [
      { name: 'Facebook Groups', cols: [true, true, false, true] },
      { name: 'Kijiji', cols: [true, true, true, false] },
      { name: 'Rentals.ca', cols: [true, false, true, false] },
      { name: 'Centris', cols: [true, false, true, false] },
    ],
  },
  communityNotes: [
    { flag: '🇰🇷', person: { ko: '워킹홀리데이 · 2024년 4월', en: 'Working Holiday Apr 2024', fr: 'PVT avr. 2024' }, text: { ko: 'Facebook 한인 커뮤니티 그룹에서 찾았어요. 한국어로 소통할 수 있어서 계약 내용도 잘 이해했어요.', en: 'Found mine through a Korean Facebook group. Being able to communicate in Korean helped me understand the lease terms.', fr: "Trouvé via un groupe Facebook coréen. Communiquer en coréen m'a aidé à comprendre le bail." }, likes: 31 },
    { flag: '🇰🇷', person: { ko: '학생 · 2023년 9월', en: 'Student Sept 2023', fr: 'Étudiant sept. 2023' }, text: { ko: '퀘벡에서는 보증금을 요구하면 불법이라는 걸 나중에 알았어요. 처음에는 몰라서 요구에 응할 뻔했어요.', en: "Learned later that security deposits are illegal in Québec. I almost paid one because I didn't know.", fr: "J'ai appris plus tard que le dépôt de garantie est illégal au Québec. J'ai failli en payer un par ignorance." }, likes: 27 },
    { flag: '🇰🇷', person: { ko: '영주권자 · 2024년 1월', en: 'PR Jan 2024', fr: 'RP janv. 2024' }, text: { ko: '7월 1일 전에 계약하면 선택지가 훨씬 많아요. 1월은 매물이 정말 적어요.', en: 'Signing before July 1 gives you way more options. January is very slim pickings.', fr: "Signer avant le 1er juillet donne bien plus de choix. Janvier, c'est vraiment peu d'offres." }, likes: 22 },
  ],
  helpLinks: [
    { label: { ko: 'Kijiji 몬트리올 임대', en: 'Kijiji Montréal rentals', fr: 'Kijiji locations Montréal' }, url: 'https://www.kijiji.ca', domain: 'kijiji.ca' },
    { label: { ko: 'Rentals.ca', en: 'Rentals.ca', fr: 'Rentals.ca' }, url: 'https://www.rentals.ca', domain: 'rentals.ca' },
    { label: { ko: 'Centris.ca', en: 'Centris.ca', fr: 'Centris.ca' }, url: 'https://www.centris.ca', domain: 'centris.ca' },
    { label: { ko: '퀘벡 임차인 권리 (TAL)', en: 'Québec tenant rights (TAL)', fr: 'Droits locataires Québec (TAL)' }, url: 'https://www.tal.gouv.qc.ca/en', domain: 'tal.gouv.qc.ca' },
  ],
  faq: [
    { q: { ko: '퀘벡에서 보증금을 내야 하나요?', en: 'Do I need to pay a security deposit in Québec?', fr: 'Dois-je payer un dépôt de garantie au Québec?' }, a: { ko: '아니요 — 퀘벡에서 집주인은 마지막 달 월세 또는 보증금을 요구할 수 없어요. 첫 달 월세만 내는 것이 정상이에요.', en: "No — in Québec, landlords cannot demand last month's rent or a security deposit. First month only is the norm.", fr: "Non — au Québec, le propriétaire ne peut pas exiger le dernier mois ni un dépôt. Le premier mois seulement est la norme." } },
    { q: { ko: '신용 조회가 없으면 아파트를 빌릴 수 있나요?', en: 'Can I rent without a Canadian credit history?', fr: 'Puis-je louer sans historique de crédit canadien?' }, a: { ko: '어려울 수 있지만 불가능하지 않아요. 추천서, 고용 증명서, 은행 잔액 증명서를 준비하세요. 일부 집주인은 신용 조회를 요구하지 않아요.', en: 'Harder but not impossible. Prepare reference letters, proof of employment or enrollment, and bank statements. Some landlords do not require a credit check.', fr: "Plus difficile mais pas impossible. Préparez des lettres de référence, preuve d'emploi/inscription, relevés bancaires. Certains propriétaires ne vérifient pas le crédit." } },
    { q: { ko: '아파트 사기를 어떻게 피하나요?', en: 'How do I avoid apartment scams?', fr: 'Comment éviter les arnaques immobilières?' }, a: { ko: '방문 전 돈을 보내지 마세요. 해외에 있는 집주인, 너무 싼 가격, 계약서 없는 요청, 영상통화 거부는 사기 신호예요.', en: "Never send money before viewing. Red flags: overseas landlord, price too low, no lease, refuses video call.", fr: "Ne jamais envoyer d'argent avant de visiter. Signaux d'alarme : propriétaire à l'étranger, prix trop bas, sans bail, refuse un appel vidéo." } },
    { q: { ko: '이사하기 가장 좋은 시기는 언제인가요?', en: 'When is the best time to move in Montréal?', fr: 'Quel est le meilleur moment pour déménager à Montréal?' }, a: { ko: '7월 1일은 몬트리올의 "이사의 날"로 대부분의 임대가 바뀌어요. 봄(4–6월)에 계약하면 선택지가 가장 많아요.', en: "July 1 is Montréal's unofficial \"moving day\" when most leases turn over. Spring (April–June) is when listings peak.", fr: "Le 1er juillet est le « jour du déménagement » à Montréal. Le printemps (avril–juin) offre le plus d'annonces." } },
  ],
  sidebar: {
    quickFacts: [
      { label: { ko: '1인실 월세', en: '1-bedroom avg', fr: 'Loyer 1 chambre' }, value: { ko: '$900–1,500/월', en: '$900–1,500/mo', fr: '900–1 500$/mois' } },
      { label: { ko: '보증금', en: 'Security deposit', fr: 'Dépôt de garantie' }, value: { ko: '불법 (퀘벡)', en: 'Illegal (Québec)', fr: 'Illégal (Québec)' } },
      { label: { ko: '이사의 날', en: 'Moving day', fr: 'Jour déménagement' }, value: { ko: '7월 1일', en: 'July 1', fr: '1er juillet' } },
      { label: { ko: '임대 기간', en: 'Lease term', fr: 'Durée du bail' }, value: { ko: '보통 1년', en: 'Usually 1 year', fr: 'Généralement 1 an' } },
    ],
    timeline: { ko: '임시 숙소 도착 후 2–4주 안에 장기 아파트를 구하는 것이 일반적이에요.', en: 'Most people find a long-term apartment within 2–4 weeks of arriving in temp housing.', fr: "La plupart trouvent un appartement 2–4 semaines après le logement temporaire." },
    nextStepId: 'insurance',
    nextStepLabel: { ko: '세입자 보험 가입하기', en: 'Get tenant insurance', fr: "Souscrire une assurance locataire" },
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
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS: TabContent[] = [
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

export default function Arriving() {
  const { lang } = useLang()
  const [checked, setChecked] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]')) }
    catch { return new Set() }
  })
  const [activeTabId, setActiveTabId] = useState<string>('flights')

  useEffect(() => {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify([...checked])) }
    catch {}
  }, [checked])

  const pct = Math.round((checked.size / TABS.length) * 100)
  const activeTab = TABS.find(t => t.id === activeTabId) ?? TABS[0]

  const sectionLabel = (ko: string, en: string, fr: string) =>
    lang === 'ko' ? ko : lang === 'fr' ? fr : en

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 min-w-0 px-6 lg:px-10 pt-12 md:pt-[72px] lg:pt-24 pb-24">
        <div className="max-w-[900px]">

          {/* Page header */}
          <div className="mb-8">
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-400 mb-3">
              {sectionLabel('나의 여정 · 01', 'My Journey · 01', 'Mon parcours · 01')}
            </p>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <h1 className="text-[32px] font-light tracking-tight text-gray-900 leading-none">
                {sectionLabel('첫 걸음', 'First Steps', 'Premiers Pas')}
              </h1>
              <div className="text-right shrink-0">
                <p className="text-2xl font-light text-gray-900 tabular-nums leading-none">{checked.size} / {TABS.length}</p>
                <p className="text-[11px] text-gray-400 mt-1">{sectionLabel('완료', 'done', 'fait')}</p>
              </div>
            </div>
            <p className="text-[13px] text-gray-400 mt-3 leading-relaxed max-w-[520px]">
              {sectionLabel(
                '몇 가지 준비하면 좋은 것들이 있어요. 첫날부터 다 해결할 필요는 없어요.',
                'A few things to sort out when you arrive. None of it needs to happen on day one.',
                "Quelques choses à régler à l'arrivée. Rien n'est urgent le premier jour.",
              )}
            </p>
          </div>

          {/* Checklist chips */}
          <div className="check-strip mb-6">
            {TABS.map(tab => {
              const done = checked.has(tab.id)
              return (
                <button key={tab.id} onClick={() => setChecked(prev => { const n = new Set(prev); n.has(tab.id) ? n.delete(tab.id) : n.add(tab.id); return n })}
                  className={`check-chip${done ? ' done' : ''}`}>
                  <span className={`w-3 h-3 rounded-sm border flex-shrink-0 flex items-center justify-center transition-colors ${done ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}>
                    {done && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><polyline points="2,5 4,7 8,3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </span>
                  {tri(tab.label, lang)}
                </button>
              )
            })}
          </div>

          {/* Tab navigation */}
          <div className="flex gap-1 flex-wrap mb-6">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTabId(tab.id)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors whitespace-nowrap ${
                  activeTabId === tab.id ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}>
                {tri(tab.label, lang)}
              </button>
            ))}
          </div>

          {/* Two-column layout: main content + sidebar */}
          <div className="flex gap-8 items-start">

            {/* Main content — all 7 sections */}
            <div className="flex-1 min-w-0">

              {/* 1. Hero */}
              <Hero data={activeTab.hero} lang={lang} />

              {/* 2. Options */}
              <div className="mb-10">
                <SectionTitle>{sectionLabel('추천 선택지', 'Recommended options', 'Options recommandées')}</SectionTitle>
                <div className="flex flex-col gap-4">
                  {activeTab.options.map((opt, i) => <OptionCard key={i} opt={opt} lang={lang} />)}
                </div>
              </div>

              {/* 3. Comparison table */}
              <div className="mb-10">
                <SectionTitle>{sectionLabel('비교 표', 'Side-by-side comparison', 'Comparaison')}</SectionTitle>
                <CompareTableComp table={activeTab.compareTable} lang={lang} />
              </div>

              {/* 4. Community */}
              <div className="mb-10">
                <SectionTitle>{sectionLabel('먼저 경험한 분들의 이야기', 'Community experiences', 'Témoignages')}</SectionTitle>
                <CommunityNotes notes={activeTab.communityNotes} lang={lang} />
              </div>

              {/* 5. Helpful links */}
              <div className="mb-10">
                <SectionTitle>{sectionLabel('도움이 되는 링크', 'Helpful links', 'Liens utiles')}</SectionTitle>
                <HelpLinks links={activeTab.helpLinks} lang={lang} />
              </div>

              {/* 6. FAQ */}
              <div className="mb-10">
                <SectionTitle>{sectionLabel('자주 묻는 질문', 'Frequently asked questions', 'Questions fréquentes')}</SectionTitle>
                <FAQ items={activeTab.faq} lang={lang} />
              </div>

              {/* 7. Ask community */}
              <div className="mb-4">
                <SectionTitle>{sectionLabel('커뮤니티에 질문하기', 'Ask the community', 'Demander à la communauté')}</SectionTitle>
                <AskCommunity lang={lang} />
              </div>

            </div>

            {/* Sticky sidebar */}
            <aside className="hidden lg:block w-72 shrink-0 sticky top-24">
              <div className="border border-gray-100 rounded-xl p-4 bg-white">
                <div className="mb-4">
                  <p className="text-[9px] font-bold tracking-[0.1em] uppercase text-gray-400 mb-1">{sectionLabel('현재 주제', 'Current topic', 'Sujet actuel')}</p>
                  <p className="text-[14px] font-medium text-gray-900">{tri(activeTab.label, lang)}</p>
                </div>
                <div className="border-t border-gray-100 pt-3 mb-4">
                  <p className="text-[9px] font-bold tracking-[0.1em] uppercase text-gray-400 mb-2">{sectionLabel('빠른 참고', 'Quick facts', 'Infos rapides')}</p>
                  {activeTab.sidebar.quickFacts.map((f, i) => (
                    <div key={i} className="flex justify-between items-baseline py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-[11px] text-gray-500">{tri(f.label, lang)}</span>
                      <span className="text-[11px] font-medium text-gray-900 ml-2 text-right">{tri(f.value, lang)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 pt-3 mb-4">
                  <p className="text-[9px] font-bold tracking-[0.1em] uppercase text-gray-400 mb-2">{sectionLabel('일반적인 시기', 'Estimated timeline', 'Calendrier habituel')}</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{tri(activeTab.sidebar.timeline, lang)}</p>
                </div>
                <div className="border-t border-gray-100 pt-3 mb-4">
                  <p className="text-[9px] font-bold tracking-[0.1em] uppercase text-gray-400 mb-2">{sectionLabel('전체 진행률', 'Overall progress', 'Progression')}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-900 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] font-medium text-gray-500 tabular-nums">{pct}%</span>
                  </div>
                </div>
                {activeTab.sidebar.nextStepId && activeTab.sidebar.nextStepLabel && (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-[9px] font-bold tracking-[0.1em] uppercase text-gray-400 mb-2">{sectionLabel('다음 단계', 'Next step', 'Prochaine étape')}</p>
                    <button
                      onClick={() => setActiveTabId(activeTab.sidebar.nextStepId!)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-gray-900 text-white rounded-lg text-[12px] font-medium hover:bg-gray-700 transition-colors"
                    >
                      <span>{tri(activeTab.sidebar.nextStepLabel, lang)}</span>
                      <i className="ti ti-arrow-right text-[14px]" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </aside>

          </div>
        </div>
      </main>
    </div>
  )
}
