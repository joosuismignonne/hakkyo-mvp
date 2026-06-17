/**
 * First Steps — HAKKYO Montréal Starter Kit
 * The first page a newcomer sees. Practical tools, not blog content.
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'

// ─── Progress checklist ───────────────────────────────────────────────────────

const CHECKLIST = [
  { id: 'flight',    en: 'Flight booked',            ko: '항공권 예약' },
  { id: 'stay',      en: 'Temporary stay arranged',  ko: '임시 숙소 마련' },
  { id: 'sim',       en: 'SIM card',                 ko: 'SIM 카드' },
  { id: 'bank',      en: 'Bank account opened',      ko: '은행 계좌 개설' },
  { id: 'opus',      en: 'OPUS card',               ko: 'OPUS 카드' },
  { id: 'grocery',   en: 'Found a grocery store',   ko: '마트 찾기' },
  { id: 'exchange',  en: 'Language exchange',        ko: '언어 교환' },
  { id: 'friend',    en: 'First local friend',       ko: '첫 현지 친구' },
]

const PROGRESS_KEY = 'hakkyo_firststeps'

// ─── Tool data ────────────────────────────────────────────────────────────────

const SIM_PROVIDERS = [
  { name: 'Fizz',          price: '$17–$50/mo',  esim: true,  tag: 'Community favourite',   url: 'https://fizz.ca',                note: 'Popular among students. Referral discounts available.' },
  { name: 'Public Mobile', price: '$15–$40/mo',  esim: false, tag: 'Best value',            url: 'https://www.publicmobile.ca',    note: 'Community rewards program. Lowest cost plans.' },
  { name: 'Bell',          price: '$35–$80/mo',  esim: true,  tag: 'Major carrier',         url: 'https://www.bell.ca',            note: 'Reliable coverage across Québec.' },
  { name: 'Virgin Plus',   price: '$30–$70/mo',  esim: true,  tag: 'Bell network',          url: 'https://www.virginplus.ca',      note: 'Runs on Bell network. Flexible plans.' },
  { name: 'Telus',         price: '$35–$90/mo',  esim: true,  tag: 'Strong coverage',       url: 'https://www.telus.com',          note: 'Best rural coverage. Good for travel.' },
]

const BANKS = [
  { name: 'RBC',         tag: 'Newcomer Program',          newcomer: true,  url: 'https://www.rbc.com/newcomers',    note: 'Dedicated newcomer program. Multilingual support.' },
  { name: 'TD Bank',     tag: 'Student-friendly',          newcomer: true,  url: 'https://www.td.com/ca/en',         note: 'Student accounts with no monthly fee.' },
  { name: 'BMO',         tag: 'First year free',           newcomer: true,  url: 'https://www.bmo.com/en-ca',        note: 'NewStart® program for newcomers.' },
  { name: 'Scotiabank',  tag: 'No credit history needed',  newcomer: true,  url: 'https://www.scotiabank.com',       note: 'StartRight® program. Credit card for newcomers.' },
  { name: 'Desjardins',  tag: 'Québec cooperative',        newcomer: false, url: 'https://www.desjardins.com',       note: 'Québec-first cooperative. French and English.' },
]

const TRANSPORT = [
  { name: 'OPUS Card',       desc: 'Rechargeable transit card for Montréal buses and metro.',  url: 'https://www.stm.info/en/fares-and-passes/opus-card', action: 'Get OPUS info' },
  { name: 'STM App',         desc: 'Official Montréal transit app. Plan routes, check times.', url: 'https://www.stm.info/en/info/networks/metro',          action: 'Visit STM' },
  { name: 'Airport → Downtown', desc: '747 express bus connects YUL to downtown for $11.',   url: 'https://www.stm.info/en/info/networks/bus/bus-747',    action: 'Route 747 info' },
  { name: 'Bixi Bikes',      desc: 'Public bike-share. Monthly pass ~$27. Seasonal.',         url: 'https://bixi.com',                                     action: 'Bixi website' },
]

const STAY_OPTIONS = [
  { name: 'Airbnb',               desc: 'Private rooms or full apartments. Good for first 1–4 weeks.',  url: 'https://www.airbnb.ca' },
  { name: 'Hostel',               desc: 'Affordable dorms. Meet other travellers and newcomers.',        url: 'https://www.hostelworld.com/findabed.php/travelto-Montreal' },
  { name: 'Facebook Marketplace', desc: 'Short-term sublets from locals. Often cheaper.',               url: 'https://www.facebook.com/marketplace' },
  { name: 'Craigslist Montréal',  desc: 'Sublets and temporary rooms. Verify listings carefully.',      url: 'https://montreal.craigslist.org/search/sub' },
]

const TOOL_TABS = [
  { id: 'flights',   label: 'Flights',      emoji: '✈️' },
  { id: 'sim',       label: 'SIM Cards',    emoji: '📱' },
  { id: 'banking',   label: 'Banking',      emoji: '🏦' },
  { id: 'transport', label: 'Transport',    emoji: '🚇' },
  { id: 'stay',      label: 'First Stay',   emoji: '🛏️' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function ExternalLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  )
}

function FlightsPanel() {
  const [from, setFrom] = useState('')
  const [depart, setDepart] = useState('')
  const [ret, setRet] = useState('')

  function search() {
    const base = 'https://www.google.com/travel/flights'
    const q = `Flights from ${from || 'Seoul'} to Montreal${depart ? ` on ${depart}` : ''}`
    window.open(`${base}?q=${encodeURIComponent(q)}`, '_blank')
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors bg-white'

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-gray-500 leading-relaxed">
        Search flights to Montréal (YUL). Opens Google Flights with your preferences.
      </p>
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
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Return (optional)</label>
          <input type="date" className={inputCls} value={ret} onChange={e => setRet(e.target.value)} />
        </div>
      </div>
      <button
        onClick={search}
        className="btn-yellow w-full rounded-xl py-3 text-[14px] font-bold"
      >
        Search Flights →
      </button>
      <p className="text-[11px] text-gray-400 text-center">Opens Google Flights in a new tab</p>
    </div>
  )
}

function SIMPanel() {
  return (
    <div className="space-y-3">
      <p className="text-[13px] text-gray-500">Most newcomers start with Fizz or Public Mobile for affordability.</p>
      {SIM_PROVIDERS.map(p => (
        <ExternalLink
          key={p.name}
          href={p.url}
          className="flex items-start gap-4 bg-white border border-gray-100 rounded-2xl px-4 py-4 hover:border-gray-200 transition-colors group"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[15px] font-bold text-gray-900">{p.name}</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{p.tag}</span>
              {p.esim && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">eSIM</span>}
            </div>
            <p className="text-[13px] text-gray-500 leading-snug">{p.note}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[13px] font-bold text-gray-800">{p.price}</p>
            <p className="text-[11px] text-gray-400 group-hover:text-gray-600 transition-colors mt-1">Visit →</p>
          </div>
        </ExternalLink>
      ))}
    </div>
  )
}

function BankingPanel() {
  return (
    <div className="space-y-3">
      <p className="text-[13px] text-gray-500">All major banks have newcomer programs. Open your account within the first two weeks.</p>
      {BANKS.map(b => (
        <ExternalLink
          key={b.name}
          href={b.url}
          className="flex items-start gap-4 bg-white border border-gray-100 rounded-2xl px-4 py-4 hover:border-gray-200 transition-colors group"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[15px] font-bold text-gray-900">{b.name}</span>
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={b.newcomer ? { background: 'var(--y-l)', color: '#92400E' } : { background: '#F3F4F6', color: '#6B7280' }}
              >
                {b.tag}
              </span>
            </div>
            <p className="text-[13px] text-gray-500 leading-snug">{b.note}</p>
          </div>
          <p className="text-[11px] text-gray-400 group-hover:text-gray-600 transition-colors shrink-0 mt-1">Visit →</p>
        </ExternalLink>
      ))}
    </div>
  )
}

function TransportPanel() {
  return (
    <div className="space-y-3">
      <p className="text-[13px] text-gray-500">Montréal has excellent public transit. Get your OPUS card first.</p>
      {TRANSPORT.map(t => (
        <div key={t.name} className="bg-white border border-gray-100 rounded-2xl px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-gray-900 mb-1">{t.name}</p>
              <p className="text-[13px] text-gray-500 leading-snug">{t.desc}</p>
            </div>
            <ExternalLink
              href={t.url}
              className="shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              {t.action} →
            </ExternalLink>
          </div>
        </div>
      ))}
    </div>
  )
}

function StayPanel() {
  return (
    <div className="space-y-3">
      <p className="text-[13px] text-gray-500">Plan for 2–4 weeks of temporary housing while you find a permanent place.</p>
      {STAY_OPTIONS.map(s => (
        <ExternalLink
          key={s.name}
          href={s.url}
          className="flex items-start justify-between gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-4 hover:border-gray-200 transition-colors group"
        >
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-gray-900 mb-1">{s.name}</p>
            <p className="text-[13px] text-gray-500 leading-snug">{s.desc}</p>
          </div>
          <p className="text-[11px] text-gray-400 group-hover:text-gray-600 transition-colors shrink-0 mt-1">Visit →</p>
        </ExternalLink>
      ))}
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
              : 'Everything you need before and after arriving in Montréal.'}
          </p>
        </div>

        {/* ── SECTION 1: Progress Tracker ── */}
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[16px] font-bold text-gray-900">
                {lang === 'ko' ? '나의 몬트리올 준비' : 'Your Montréal Progress'}
              </h2>
              <p className="text-[12px] text-gray-400 mt-0.5">
                {lang === 'ko' ? '체크할수록 준비가 됩니다.' : 'Check things off as you go.'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[22px] font-bold text-gray-900">{pct}%</span>
              <p className="text-[11px] text-gray-400">complete</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: 'var(--y)' }}
            />
          </div>

          {/* Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {CHECKLIST.map(item => {
              const done = checked.has(item.id)
              return (
                <button
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  className={[
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
                    done ? 'bg-gray-50' : 'hover:bg-gray-50',
                  ].join(' ')}
                >
                  <span
                    className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
                    style={done
                      ? { background: 'var(--y)', borderColor: 'var(--y)' }
                      : { borderColor: '#D1D5DB' }}
                  >
                    {done && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#111" strokeWidth="2.2" strokeLinecap="round">
                        <polyline points="2,6 5,9 10,3"/>
                      </svg>
                    )}
                  </span>
                  <span className={`text-[13px] font-medium ${done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
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
              🎉 {lang === 'ko' ? '준비 완료! 몬트리올에 오신 것을 환영합니다.' : 'All done! Welcome to Montréal.'}
            </div>
          )}
        </div>

        {/* ── SECTION 2: Essential Tools ── */}
        <div className="mb-6">
          <h2 className="text-[16px] font-bold text-gray-900 mb-1">Essential Tools</h2>
          <p className="text-[13px] text-gray-500 mb-4">
            {lang === 'ko' ? '몬트리올 정착에 꼭 필요한 것들.' : 'Practical resources to get settled fast.'}
          </p>

          {/* Tool tabs */}
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

          {/* Tool panel */}
          <div>
            {activeTab === 'flights'   && <FlightsPanel />}
            {activeTab === 'sim'       && <SIMPanel />}
            {activeTab === 'banking'   && <BankingPanel />}
            {activeTab === 'transport' && <TransportPanel />}
            {activeTab === 'stay'      && <StayPanel />}
          </div>
        </div>

        {/* ── SECTION 3: Community Advice ── */}
        <div className="mb-6">
          <h2 className="text-[16px] font-bold text-gray-900 mb-1">
            {lang === 'ko' ? '커뮤니티 경험' : 'Community Advice'}
          </h2>
          <p className="text-[13px] text-gray-500 mb-4">
            {lang === 'ko'
              ? '이미 몬트리올에 정착한 사람들의 실제 경험.'
              : 'Real tips from people who have already done it.'}
          </p>
          <div className="bg-white border border-gray-100 rounded-2xl px-5 py-5 text-center">
            <div className="text-3xl mb-3">💬</div>
            <p className="text-[14px] font-semibold text-gray-700 mb-1">
              {lang === 'ko' ? '커뮤니티 조언 준비 중' : 'Community tips coming soon'}
            </p>
            <p className="text-[13px] text-gray-400 mb-4">
              {lang === 'ko'
                ? '첫 걸음을 태그한 커뮤니티 게시물이 여기에 표시됩니다.'
                : 'Posts tagged with first-steps will appear here.'}
            </p>
            <Link
              to="/board"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              Browse community →
            </Link>
          </div>
        </div>

        {/* ── SECTION 4: Need Help CTA ── */}
        <div
          className="rounded-2xl px-6 py-6 text-center"
          style={{ background: 'var(--y-l)' }}
        >
          <div className="text-3xl mb-3">👋</div>
          <h2 className="text-[17px] font-bold text-gray-900 mb-1">
            {lang === 'ko' ? '어디서 시작해야 할지 모르겠나요?' : 'Not sure where to start?'}
          </h2>
          <p className="text-[13px] text-gray-600 mb-4 leading-relaxed">
            {lang === 'ko'
              ? '이미 몬트리올에 살고 있는 사람들에게 물어보세요.'
              : 'Ask people who have already made the move.'}
          </p>
          <Link
            to="/board"
            className="inline-flex items-center gap-2 btn-yellow rounded-xl px-6 py-2.5 text-[14px] font-bold"
          >
            Ask the community →
          </Link>
        </div>

      </div>
    </div>
  )
}
