/**
 * Shared layout primitives used by every major page.
 *
 * PageShell         — 3-column wrapper (left sidebar · main · right sidebar)
 * LeftSidebar       — HAKKYO identity, city widget, quick nav
 * CityPanel         — Montréal / Seoul live clock + weather
 * SharedRightSidebar — consistent right sidebar used on all major pages
 */
import { useState, useEffect, lazy, Suspense } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getTracks } from '../lib/db'
import type { ProgramTrack } from '../types'

const ApplyModal          = lazy(() => import('./ApplyModal'))
const CommunitySubmitModal = lazy(() => import('./CommunitySubmitModal'))

// ─── City panel ───────────────────────────────────────────────────────────────

const CITIES = [
  { key: 'montreal', label: 'Montréal', tz: 'America/Toronto', lat: 45.5017, lon: -73.5673 },
  { key: 'seoul',    label: 'Seoul',    tz: 'Asia/Seoul',       lat: 37.5665, lon: 126.9780 },
] as const

type WeatherData = { temp: number; condition: string }

function weatherCode(code: number): string {
  if (code === 0) return 'Clear'
  if (code <= 2)  return 'Partly cloudy'
  if (code <= 3)  return 'Cloudy'
  if (code <= 48) return 'Fog'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 82) return 'Showers'
  if (code <= 86) return 'Snow showers'
  return 'Storm'
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const r    = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`)
    const json = await r.json()
    const temp = json?.current?.temperature_2m
    const code = json?.current?.weather_code
    if (typeof temp !== 'number') return null
    return { temp: Math.round(temp), condition: typeof code === 'number' ? weatherCode(code) : '' }
  } catch { return null }
}

function getLocalTime(tz: string): string {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date())
  return `${p.find(x => x.type === 'hour')?.value ?? '00'}:${p.find(x => x.type === 'minute')?.value ?? '00'}`
}

function getLocalDate(tz: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())
}

export function CityPanel() {
  const [weather, setWeather] = useState<(WeatherData | null)[]>([null, null])
  const [, tick] = useState(0)

  useEffect(() => { const id = setInterval(() => tick(n => n + 1), 30_000); return () => clearInterval(id) }, [])
  useEffect(() => { Promise.all(CITIES.map(c => fetchWeather(c.lat, c.lon))).then(setWeather) }, [])

  return (
    <div className="space-y-5">
      {CITIES.map((city, i) => {
        const w = weather[i]
        return (
          <div key={city.key}>
            <p className="text-[10px] font-semibold tracking-[0.22em] text-gray-400 uppercase mb-1">{city.label}</p>
            <p className="text-[10px] text-gray-300 mb-0.5">{getLocalDate(city.tz)}</p>
            <p className="text-2xl font-light text-gray-900 tabular-nums leading-none tracking-tight mb-1">
              {getLocalTime(city.tz)}
            </p>
            {w && <p className="text-[10px] text-gray-400">{w.temp}°C · {w.condition}</p>}
          </div>
        )
      })}
    </div>
  )
}

// ─── Left sidebar ─────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { to: '/programs', ko: '프로그램', en: 'Programs',  fr: 'Programmes' },
  { to: '/board',    ko: '게시판',   en: 'Board',     fr: 'Forum'      },
  { to: '/news',     ko: '뉴스',     en: 'News',      fr: 'Actualités' },
]

export function LeftSidebar({ lang }: { lang: 'ko' | 'en' | 'fr' }) {
  const { pathname } = useLocation()

  const label = (link: typeof NAV_LINKS[0]) =>
    lang === 'ko' ? link.ko : lang === 'fr' ? link.fr : link.en

  return (
    <div className="space-y-7">
      {/* Identity */}
      <div>
        <p className="text-[9px] font-semibold tracking-[0.26em] text-gray-400 uppercase mb-4">
          Montréal · Language · Community
        </p>
        <Link to="/">
          <p className="text-xl font-light tracking-tight text-gray-900 mb-5 hover:text-gray-500 transition-colors">
            HAKKYO
          </p>
        </Link>
        <div className="space-y-0.5 text-xs text-gray-400 leading-relaxed">
          <p>Learn Korean.</p>
          <p>Meet people.</p>
          <p>Understand Montréal.</p>
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* City / time */}
      <CityPanel />

      <div className="border-t border-gray-100" />

      {/* Quick nav */}
      <nav className="space-y-0.5">
        {NAV_LINKS.map(link => {
          const active = pathname === link.to || pathname.startsWith(link.to + '/')
          return (
            <Link
              key={link.to}
              to={link.to}
              className={[
                'block text-xs py-1.5 transition-colors',
                active ? 'font-semibold text-gray-900' : 'text-gray-400 hover:text-gray-700',
              ].join(' ')}
            >
              {label(link)}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

// ─── Shared right sidebar ─────────────────────────────────────────────────────

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function pickText(lang: 'ko' | 'en' | 'fr', ko: string, en: string, fr: string): string {
  const order = lang === 'ko' ? [ko, en, fr] : lang === 'fr' ? [fr, ko, en] : [en, ko, fr]
  return order.find(s => s?.trim()) ?? ''
}

export function SharedRightSidebar({ lang }: { lang: 'ko' | 'en' | 'fr' }) {
  const t = (ko: string, en: string, fr: string) => pickText(lang, ko, en, fr)

  const [openTracks, setOpenTracks]   = useState<ProgramTrack[]>([])
  const [applying,   setApplying]     = useState<string | null>(null)
  const [applyingLE, setApplyingLE]   = useState(false)
  const [showSubmit, setShowSubmit]   = useState(false)

  useEffect(() => {
    getTracks('program')
      .then(tracks => setOpenTracks((tracks ?? []).filter(s => s.status === 'open' && (s.name_ko?.trim() || s.name_en?.trim()))))
      .catch(() => {})
  }, [])

  const name = (s: ProgramTrack) => pickText(lang, s.name_ko, s.name_en, s.name_fr)

  return (
    <>
      <div className="space-y-6">

        {/* 1 · Instagram */}
        <div>
          <p className="text-[9px] font-semibold tracking-[0.22em] text-gray-400 uppercase mb-2.5">
            Instagram
          </p>
          <a
            href="https://www.instagram.com/hakkyo.mtl"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[11px] text-gray-600 hover:text-gray-900 transition-colors"
          >
            <InstagramIcon />
            @hakkyo.mtl
          </a>
        </div>

        <div className="border-t border-gray-100" />

        {/* 2 · Open Programs */}
        {openTracks.length > 0 && (
          <>
            <div>
              <p className="text-[9px] font-semibold tracking-[0.22em] text-gray-400 uppercase mb-2.5">
                {t('모집 중인 프로그램', 'Open Programs', 'Programmes ouverts')} ({openTracks.length})
              </p>
              <div className="space-y-2">
                {openTracks.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setApplying(s.id)}
                    className="block text-left text-[11px] text-gray-600 hover:text-gray-900 transition-colors leading-snug w-full"
                  >
                    {name(s)}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-100" />
          </>
        )}

        {/* 3 · Join HAKKYO */}
        <div>
          <p className="text-[9px] font-semibold tracking-[0.22em] text-gray-400 uppercase mb-2.5">
            {t('HAKKYO 참가', 'Join HAKKYO', 'Rejoindre HAKKYO')}
          </p>
          <p className="text-[11px] text-gray-500 mb-0.5">
            {t('언어 교환', 'Language Exchange', 'Échange linguistique')}
          </p>
          <p className="text-[10px] text-gray-400 mb-3">
            {t('한국어 · 영어 · 불어', 'Korean · English · French', 'Coréen · Anglais · Français')}
          </p>
          <button
            onClick={() => setApplyingLE(true)}
            className="w-full border border-gray-900 rounded-lg px-3 py-2 text-[11px] font-semibold text-gray-900 bg-white hover:bg-gray-900 hover:text-white transition-colors text-center"
          >
            {t('HAKKYO 참가하기', 'Join HAKKYO', 'Rejoindre HAKKYO')}
          </button>
        </div>

        <div className="border-t border-gray-100" />

        {/* 4 · Community Submission */}
        <div>
          <p className="text-[9px] font-semibold tracking-[0.22em] text-gray-400 uppercase mb-2.5">
            {t('커뮤니티 제출', 'Community Submission', 'Soumission')}
          </p>
          <p className="text-[11px] text-gray-500 mb-2">
            {t('도움이 필요하신가요?', 'Need help?', 'Besoin d\'aide?')}
          </p>
          <div className="space-y-0.5 mb-3">
            <p className="text-[10px] text-gray-400">{t('주거', 'Housing', 'Logement')}</p>
            <p className="text-[10px] text-gray-400">{t('취업', 'Jobs', 'Emploi')}</p>
            <p className="text-[10px] text-gray-400">{t('룸메이트', 'Roommates', 'Colocataires')}</p>
            <p className="text-[10px] text-gray-400">{t('이벤트', 'Events', 'Événements')}</p>
          </div>
          <button
            onClick={() => setShowSubmit(true)}
            className="w-full border border-gray-900 rounded-lg px-3 py-2 text-[11px] font-semibold text-gray-900 bg-white hover:bg-gray-900 hover:text-white transition-colors text-center"
          >
            {t('HAKKYO에 제출하기', 'Submit to HAKKYO', 'Soumettre')}
          </button>
        </div>

      </div>

      {/* Modals */}
      <Suspense fallback={null}>
        {applying   && <ApplyModal preselectedTrackId={applying} onClose={() => setApplying(null)} />}
        {applyingLE && <ApplyModal languageExchange onClose={() => setApplyingLE(false)} />}
        {showSubmit && <CommunitySubmitModal onClose={() => setShowSubmit(false)} />}
      </Suspense>
    </>
  )
}

// ─── Page shell ───────────────────────────────────────────────────────────────

/**
 * Renders the 3-column shell used by Home, Programs, Board, News.
 *
 * left   — LeftSidebar (hidden below lg)
 * right  — arbitrary content (hidden below xl)
 * children — main column content
 */
export function PageShell({
  left,
  right,
  children,
}: {
  left: React.ReactNode
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <>
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="flex items-start gap-8 xl:gap-10">

          {/* Left sidebar */}
          <aside className="hidden lg:block w-48 xl:w-52 shrink-0 sticky top-20 self-start">
            {left}
          </aside>

          {/* Main column */}
          <main className="flex-1 min-w-0" style={{ maxWidth: 680 }}>
            {children}
          </main>

          {/* Right sidebar */}
          {right && (
            <aside className="hidden xl:block w-48 xl:w-52 shrink-0 sticky top-20 self-start">
              {right}
            </aside>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 mt-4">
        <div className="max-w-[1200px] mx-auto px-4 py-10">
          <p className="text-[10px] text-gray-300 tracking-[0.14em] uppercase">
            HAKKYO · Montréal · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </>
  )
}
