/**
 * First Steps — HAKKYO Montréal Starter Kit
 *
 * Goal: help someone move to Montréal without opening 20 other tabs.
 * Every section is a decision helper, not a link directory.
 *
 * Future milestone hook: CHECKLIST items with milestone:true will feed
 * "My Montréal Journey" when that feature is built. Do not remove the flag.
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'

// ─── Progress checklist ───────────────────────────────────────────────────────
// milestone:true = feeds "My Montréal Journey" feature (future).
// Do not remove the field — it is the hook for that feature.

const CHECKLIST = [
  { id: 'flight',    en: 'Flight booked',            ko: '항공권 예약',     milestone: true  },
  { id: 'stay',      en: 'Temporary stay arranged',  ko: '임시 숙소 마련',  milestone: false },
  { id: 'sim',       en: 'SIM card activated',       ko: 'SIM 카드 개통',   milestone: false },
  { id: 'bank',      en: 'Bank account opened',      ko: '은행 계좌 개설',  milestone: true  },
  { id: 'opus',      en: 'OPUS card',               ko: 'OPUS 카드',       milestone: false },
  { id: 'grocery',   en: 'Found a grocery store',   ko: '마트 찾기',        milestone: false },
  { id: 'exchange',  en: 'Language exchange joined', ko: '언어 교환 참여',  milestone: true  },
  { id: 'friend',    en: 'First local friend',       ko: '첫 현지 친구',   milestone: true  },
]

const PROGRESS_KEY = 'hakkyo_firststeps'

// ─── Tool data ────────────────────────────────────────────────────────────────

const SIM_PROVIDERS = [
  {
    name: 'Fizz',
    price: '$17–$50/mo',
    esim: true,
    contract: false,
    bestFor: 'Students and newcomers on a budget',
    pros: ['No contract — cancel anytime', 'eSIM — activate before landing', 'Referral discounts'],
    hakkyoNote: 'Most newcomers choose Fizz. Inexpensive, no contract, and you can activate the eSIM on the plane.',
    popular: true,
    url: 'https://fizz.ca',
  },
  {
    name: 'Public Mobile',
    price: '$15–$40/mo',
    esim: false,
    contract: false,
    bestFor: 'Lowest possible monthly cost',
    pros: ['Cheapest plans in Canada', 'Community rewards program', 'No contract'],
    hakkyoNote: 'Best if you want rock-bottom cost and do not need eSIM. Physical SIM only — plan ahead.',
    popular: false,
    url: 'https://www.publicmobile.ca',
  },
  {
    name: 'Bell',
    price: '$35–$80/mo',
    esim: true,
    contract: false,
    bestFor: 'Reliability and wide coverage',
    pros: ['Strongest network in Québec', 'eSIM available', 'Good data speeds'],
    hakkyoNote: 'Choose Bell if coverage matters more than price — especially if you travel outside Montréal.',
    popular: false,
    url: 'https://www.bell.ca',
  },
  {
    name: 'Virgin Plus',
    price: '$30–$70/mo',
    esim: true,
    contract: false,
    bestFor: 'Bell quality at slightly lower cost',
    pros: ['Runs on Bell network', 'eSIM support', 'Flexible plans'],
    hakkyoNote: 'Same coverage as Bell, slightly cheaper. Good middle option if Fizz feels too budget.',
    popular: false,
    url: 'https://www.virginplus.ca',
  },
  {
    name: 'Telus',
    price: '$35–$90/mo',
    esim: true,
    contract: false,
    bestFor: 'Frequent travel outside the city',
    pros: ['Best rural coverage', 'eSIM available', 'Strong outside Montréal'],
    hakkyoNote: 'Only necessary if you travel outside the city often. Overkill for daily Montréal life.',
    popular: false,
    url: 'https://www.telus.com',
  },
]

const BANKS = [
  {
    name: 'TD Bank',
    badge: 'Best for students',
    badgeColor: 'blue',
    pros: ['Student accounts with no monthly fee', 'Large ATM network', 'English service at most branches'],
    hakkyoNote: 'Open a TD Student Account — $0 monthly fee, no minimum balance. Easiest to open with only your study permit.',
    url: 'https://www.td.com/ca/en',
    documents: 'Study permit + passport + address proof',
  },
  {
    name: 'RBC',
    badge: 'Best newcomer package',
    badgeColor: 'yellow',
    pros: ['Dedicated newcomer program', 'Credit card without credit history', 'Multilingual support'],
    hakkyoNote: "RBC's Newcomer Advantage package waives fees for 1 year. Easiest path to a credit card as a newcomer.",
    url: 'https://www.rbc.com/newcomers',
    documents: 'Passport + study or work permit',
  },
  {
    name: 'Scotiabank',
    badge: 'Best for first credit card',
    badgeColor: 'red',
    pros: ['StartRight® credit card for newcomers', 'No credit history required', 'Travel rewards'],
    hakkyoNote: 'If getting a credit card fast is your priority, Scotiabank StartRight® is the easiest path in Canada.',
    url: 'https://www.scotiabank.com',
    documents: 'Passport + permit + address',
  },
  {
    name: 'BMO',
    badge: 'First year free',
    badgeColor: 'green',
    pros: ['NewStart® program — 1 year free', 'Simple setup', 'Good mobile app'],
    hakkyoNote: 'BMO NewStart® is straightforward and widely available. Good default if you have no specific requirements.',
    url: 'https://www.bmo.com/en-ca',
    documents: 'Passport + permit',
  },
  {
    name: 'Desjardins',
    badge: 'Best for Québec life',
    badgeColor: 'gray',
    pros: ['Québec cooperative — local roots', 'French integration', 'Competitive mortgage rates later'],
    hakkyoNote: 'Worth considering if you plan to stay long-term and build roots in Québec society.',
    url: 'https://www.desjardins.com',
    documents: 'Passport + permit + Québec address',
  },
]

const TRANSPORT_ITEMS = [
  {
    name: 'OPUS Card',
    icon: '🚇',
    what: 'Rechargeable transit card for all Montréal buses and metro lines.',
    where: 'Any metro station ticket machine or customer service counter.',
    cost: '$6 card fee + load monthly pass (~$100/mo) or pay-per-ride ($3.75/trip)',
    whoNeeds: 'Everyone living in Montréal. Get this in your first week.',
    hakkyoNote: 'Get this at the airport metro station (YUL → Lionel-Groulx). Load a monthly pass if you use transit more than 3× per week.',
    url: 'https://www.stm.info/en/fares-and-passes/opus-card',
  },
  {
    name: 'STM App',
    icon: '📱',
    what: 'Official Montréal transit app. Real-time arrivals, trip planner, and line maps.',
    where: 'App Store or Google Play — search "STM Montréal".',
    cost: 'Free',
    whoNeeds: 'Anyone using Montréal buses or metro regularly.',
    hakkyoNote: 'Download before your first day. The real-time tracker is accurate and shows delays before you leave the apartment.',
    url: 'https://www.stm.info',
  },
  {
    name: '747 Express — Airport to Downtown',
    icon: '🚌',
    what: 'Direct bus from YUL airport to downtown Montréal (Berri-UQAM metro). Runs 24/7.',
    where: 'Bus stop outside the arrivals level at YUL Terminal 1.',
    cost: '$11 — accepts cash, credit card, or OPUS',
    whoNeeds: 'Everyone arriving at YUL. Much cheaper than taxi ($50+) or Uber ($35+).',
    hakkyoNote: 'Take the 747 when you land. It accepts credit card directly at the door. Gets you downtown in 50–70 minutes.',
    url: 'https://www.stm.info/en/info/networks/bus/bus-747',
  },
  {
    name: 'BIXI Bikes',
    icon: '🚲',
    what: 'Public bike-share system. 9,000+ bikes at 800+ stations across Montréal.',
    where: 'Any BIXI station. App or station terminal to unlock.',
    cost: '$27/month seasonal pass · $7/day · or $1.29/30min single trip',
    whoNeeds: 'Good for summer commuting or exploring neighbourhoods. Seasonal (April–November).',
    hakkyoNote: 'If you live near the Plateau or Mile End, BIXI replaces the metro for short trips in warm months.',
    url: 'https://bixi.com',
  },
  {
    name: 'Communauto',
    icon: '🚗',
    what: 'Montréal car-share co-op. Hourly or daily rentals, no ownership needed.',
    where: 'App-based. Cars parked across the city — reserve and unlock via phone.',
    cost: '$15–$25/hour depending on plan. No insurance or gas fees added.',
    whoNeeds: 'IKEA runs, grocery hauls, day trips outside the city. Not for daily commuting.',
    hakkyoNote: 'Most newcomers do not need a car in Montréal. Communauto covers the moments you do.',
    url: 'https://www.communauto.com',
  },
]

const STAY_OPTIONS = [
  {
    name: 'Airbnb — Private Room',
    type: 'Temporary stay',
    priceRange: '$40–$90/night · ~$1,000–$2,000/month',
    goodFor: 'First 2–4 weeks while apartment hunting',
    pros: ['Private space', 'Kitchen access', 'Flexible check-in/out'],
    cons: ['More expensive than sublets', 'No lease = no address proof for banking'],
    hakkyoNote: 'Book a private room (not entire apartment) to save money. Most newcomers stay 2–3 weeks before finding permanent housing.',
    url: 'https://www.airbnb.ca',
  },
  {
    name: 'Hostel',
    type: 'Budget stay',
    priceRange: '$25–$55/night · dorm or private room',
    goodFor: 'Very first days, solo newcomers, meeting people',
    pros: ['Cheapest option', 'Social atmosphere', 'Central Montréal locations'],
    cons: ['Shared dorm rooms', 'Less privacy', 'Not practical beyond 1–2 weeks'],
    hakkyoNote: 'Good for the very first week if you want to meet newcomers and explore before committing to a neighbourhood.',
    url: 'https://www.hostelworld.com/findabed.php/travelto-Montreal',
  },
  {
    name: 'Facebook Marketplace — Short-Term Sublet',
    type: 'Local sublet',
    priceRange: '$600–$1,200/month furnished',
    goodFor: '1–3 month stay with more stability',
    pros: ['Much cheaper than Airbnb', 'Feels like real living', 'Can use as address proof'],
    cons: ['Must verify listings carefully', 'No platform protection', 'Competition is high'],
    hakkyoNote: 'Search "sous-location" or "short term sublet Montréal". Message quickly — good listings are gone within hours.',
    url: 'https://www.facebook.com/marketplace',
  },
  {
    name: 'Student Residence',
    type: 'Institutional housing',
    priceRange: '$600–$950/month · meals sometimes included',
    goodFor: 'Students at McGill, Concordia, UQAM, or UdeM',
    pros: ['Managed and safe', 'Utilities included', 'Easiest transition from abroad'],
    cons: ['Apply early — spots fill up', 'May not be available short-term', 'Rules and curfews possible'],
    hakkyoNote: "Apply for residence before you arrive — contact your university's housing office directly. Spots go fast.",
    url: 'https://www.concordia.ca/students/housing.html',
  },
]

// ─── Community tips ───────────────────────────────────────────────────────────
// future: replace this static data with community_tips fetched from Supabase
// filtered by tag (e.g. WHERE tag = 'sim-cards' ORDER BY helpful_count DESC LIMIT 3)

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

// ─── Shared sub-components ────────────────────────────────────────────────────

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
  const tips = COMMUNITY_TIPS[section] ?? []
  return (
    <div className="border-t border-gray-100 pt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">Community Experience</p>
        <Link to="/board" className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
          Share yours →
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
        <p className="text-[12px] text-gray-400">No experiences shared yet. Be the first.</p>
      )}
    </div>
  )
}

// ─── Tool panels ──────────────────────────────────────────────────────────────

function FlightsPanel() {
  const [from, setFrom] = useState('')
  const [depart, setDepart] = useState('')

  function openSearch(site: 'google' | 'skyscanner' | 'kayak') {
    const city = from || 'Seoul'
    const urls: Record<string, string> = {
      google:     `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from ${city} to Montreal${depart ? ` on ${depart}` : ''}`)}`,
      skyscanner: `https://www.skyscanner.ca/transport/flights/${encodeURIComponent(city)}/mtl/${depart?.replace(/-/g, '') || ''}`,
      kayak:      `https://www.kayak.ca/flights/${encodeURIComponent(city)}-YUL/${depart || 'anytime'}`,
    }
    window.open(urls[site], '_blank')
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors bg-white'

  return (
    <div className="space-y-4">
      <HakkyoNote text="Compare on Google Flights first — it shows the cheapest date range across 2–3 weeks at once. Kayak and Skyscanner are useful for double-checking." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">From</label>
          <input className={inputCls} placeholder="Seoul, ICN" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">To</label>
          <input className={inputCls} value="Montréal, YUL" readOnly style={{ background: '#FAFAFA', color: '#6B7280' }} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Departure</label>
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
  return (
    <div className="space-y-3">
      <HakkyoNote text="Get a SIM before you leave — Fizz eSIM works the moment you land. You need data for navigation, banking apps, and finding your way from the airport." />
      {SIM_PROVIDERS.map(p => (
        <div key={p.name} className="bg-white border border-gray-100 rounded-2xl px-4 py-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[15px] font-bold text-gray-900">{p.name}</span>
              {p.popular && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--y)', color: '#111' }}>
                  Most popular
                </span>
              )}
            </div>
            <span className="text-[13px] font-bold text-gray-800 shrink-0">{p.price}</span>
          </div>
          <p className="text-[12px] text-gray-500 mb-2">Best for: {p.bestFor}</p>
          <div className="flex gap-2 flex-wrap mb-2">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.esim ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
              {p.esim ? 'eSIM ✓' : 'eSIM ✗'}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
              No contract
            </span>
          </div>
          <ul className="space-y-0.5 mb-3">
            {p.pros.map((pro, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px] text-gray-600">
                <span className="text-green-500 mt-0.5 shrink-0">✓</span>{pro}
              </li>
            ))}
          </ul>
          <div className="flex items-start gap-2 justify-between">
            <p className="text-[11px] text-amber-800 font-medium italic leading-snug flex-1">"{p.hakkyoNote}"</p>
            <ExtLink href={p.url} className="shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors">
              Visit →
            </ExtLink>
          </div>
        </div>
      ))}
      <CommunityExperience section="sim" />
    </div>
  )
}

function BankingPanel() {
  return (
    <div className="space-y-3">
      <HakkyoNote text="Open your account in the first two weeks. You need a Canadian bank account to receive e-transfers, pay rent, and start building credit history." />
      {BANKS.map(b => {
        const bs = badgeStyle(b.badgeColor)
        return (
          <div key={b.name} className="bg-white border border-gray-100 rounded-2xl px-4 py-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[15px] font-bold text-gray-900">{b.name}</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={bs}>
                  {b.badge}
                </span>
              </div>
              <ExtLink href={b.url} className="shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors">
                Visit →
              </ExtLink>
            </div>
            <ul className="space-y-0.5 mb-2">
              {b.pros.map((pro, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[12px] text-gray-600">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>{pro}
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-gray-400 mb-2">Documents: {b.documents}</p>
            <p className="text-[11px] text-amber-800 font-medium italic">"{b.hakkyoNote}"</p>
          </div>
        )
      })}
      <CommunityExperience section="banking" />
    </div>
  )
}

function TransportPanel() {
  return (
    <div className="space-y-3">
      <HakkyoNote text="You do not need a car in Montréal. Metro + bus covers most of the city. Get the OPUS card in your first week — it is the foundation of everything else." />
      {TRANSPORT_ITEMS.map(t => (
        <div key={t.name} className="bg-white border border-gray-100 rounded-2xl px-4 py-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{t.icon}</span>
              <span className="text-[15px] font-bold text-gray-900">{t.name}</span>
            </div>
            <ExtLink href={t.url} className="shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors">
              Info →
            </ExtLink>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">What</p>
              <p className="text-[12px] text-gray-700 leading-snug">{t.what}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Where to get</p>
              <p className="text-[12px] text-gray-700 leading-snug">{t.where}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Cost</p>
              <p className="text-[12px] text-gray-700 leading-snug">{t.cost}</p>
            </div>
          </div>
          <p className="text-[11px] text-amber-800 font-medium italic">"{t.hakkyoNote}"</p>
        </div>
      ))}
      <CommunityExperience section="transport" />
    </div>
  )
}

function StayPanel() {
  return (
    <div className="space-y-3">
      <HakkyoNote text="Book 2–3 weeks of temporary housing before you arrive. Use that time to visit neighbourhoods, talk to locals, and find your real apartment — not from abroad." />
      {STAY_OPTIONS.map(s => (
        <div key={s.name} className="bg-white border border-gray-100 rounded-2xl px-4 py-4">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[15px] font-bold text-gray-900">{s.name}</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{s.type}</span>
              </div>
              <p className="text-[12px] font-semibold text-gray-700">{s.priceRange}</p>
            </div>
            <ExtLink href={s.url} className="shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors">
              Visit →
            </ExtLink>
          </div>
          <p className="text-[12px] text-gray-500 mb-2">Good for: {s.goodFor}</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              {s.pros.map((pro, i) => (
                <div key={i} className="flex items-start gap-1 text-[11px] text-gray-600">
                  <span className="text-green-500 shrink-0">✓</span> {pro}
                </div>
              ))}
            </div>
            <div>
              {s.cons.map((con, i) => (
                <div key={i} className="flex items-start gap-1 text-[11px] text-gray-500">
                  <span className="text-gray-300 shrink-0">✗</span> {con}
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-amber-800 font-medium italic">"{s.hakkyoNote}"</p>
        </div>
      ))}
      <CommunityExperience section="stay" />
    </div>
  )
}

// ─── Tool tabs ────────────────────────────────────────────────────────────────

const TOOL_TABS = [
  { id: 'flights',   label: 'Flights',    emoji: '✈️' },
  { id: 'sim',       label: 'SIM Cards',  emoji: '📱' },
  { id: 'banking',   label: 'Banking',    emoji: '🏦' },
  { id: 'transport', label: 'Transport',  emoji: '🚇' },
  { id: 'stay',      label: 'First Stay', emoji: '🛏️' },
]

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Arriving() {
  const { lang } = useLang()
  const [checked, setChecked] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]')) }
    catch { return new Set() }
  })
  const [activeTab, setActiveTab] = useState('flights')

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

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-24">
      <div className="max-w-[720px] mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">✈️</span>
            <h1 className="text-[24px] font-bold text-gray-900">First Steps</h1>
          </div>
          <p className="text-[14px] text-gray-500 leading-relaxed">
            {lang === 'ko'
              ? '몬트리올 도착 전후로 필요한 모든 것을 한 곳에서.'
              : lang === 'fr'
              ? 'Tout ce dont vous avez besoin avant et après votre arrivée à Montréal.'
              : 'Everything you need to move to Montréal — without opening 20 other tabs.'}
          </p>
        </div>

        {/* ── Progress Tracker ── */}
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[16px] font-bold text-gray-900">
                {lang === 'ko' ? '나의 몬트리올 준비' : 'Your Montréal Progress'}
              </h2>
              <p className="text-[12px] text-gray-400 mt-0.5">
                {lang === 'ko'
                  ? '한 걸음씩, 몬트리올에 가까워지고 있습니다.'
                  : "One step at a time. You're getting closer."}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[22px] font-bold text-gray-900">{pct}%</span>
              <p className="text-[11px] text-gray-400">complete</p>
            </div>
          </div>

          <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: 'var(--y)' }}
            />
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
                    {lang === 'ko' ? item.ko : item.en}
                  </span>
                </button>
              )
            })}
          </div>

          {pct === 100 && (
            <div
              className="mt-4 text-center py-3 rounded-xl text-[13px] font-bold"
              style={{ background: 'var(--y-l)', color: '#92400E' }}
            >
              {lang === 'ko'
                ? '이제 몬트리올은 목적지가 아니라 당신의 도시입니다. 🎉'
                : "🎉 Montréal is no longer a destination. It's your city."}
            </div>
          )}
        </div>

        {/* ── Essential Tools ── */}
        <div className="mb-6">
          <h2 className="text-[16px] font-bold text-gray-900 mb-1">Essential Tools</h2>
          <p className="text-[13px] text-gray-500 mb-4">
            {lang === 'ko'
              ? '결정을 빠르게 내릴 수 있도록 필요한 정보를 정리했습니다.'
              : 'Everything you need to make decisions — not just a list of links.'}
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
                  {tab.label}
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
            {lang === 'ko' ? '아직 모르겠나요?' : 'Still not sure?'}
          </h2>
          <p className="text-[13px] text-gray-600 mb-4 leading-relaxed">
            {lang === 'ko'
              ? '이미 몬트리올에 살고 있는 사람들에게 직접 물어보세요.'
              : 'Ask people who have already made the move.'}
          </p>
          <Link to="/board" className="inline-flex items-center gap-2 btn-yellow rounded-xl px-6 py-2.5 text-[14px] font-bold">
            Ask the community →
          </Link>
        </div>

      </div>
    </div>
  )
}
