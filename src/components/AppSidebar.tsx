/**
 * AppSidebar — collapsible left rail (desktop) + bottom tab bar (mobile).
 *
 * Expanded  → w-56  — logo + journey nav + auth + utilities
 * Collapsed → w-[68px] — icon-only rail
 */
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import type { Lang } from '../types'

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconHome({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  )
}

function IconArriving({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.5H2"/>
      <path d="M2 10l4.5 1.5L9 5l2 2-2 5 4.5 1.5L17 7l2.5 1-3 7H22"/>
    </svg>
  )
}

function IconSettling({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
      <circle cx="12" cy="10" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function IconConnecting({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9"  cy="7"  r="4"/>
      <circle cx="17" cy="9"  r="3"/>
      <path d="M2 20c0-3.314 3.134-6 7-6s7 2.686 7 6"/>
      <path d="M20 20c0-2.21-1.343-4-3-4"/>
    </svg>
  )
}

function IconWorking({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="16"/>
      <line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
  )
}

function IconLanguage({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 5h10M7 2v3M12 14l4-9 4 9M13.5 11h5"/>
      <path d="M4 9c0 4 2.5 6.5 5 8"/>
      <path d="M9 9c0 4-2.5 6.5-5 8"/>
    </svg>
  )
}

function IconLiving({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12"/>
      <path d="M12 12C12 12 7 10 7 6a5 5 0 0110 0c0 4-5 6-5 6z"/>
      <path d="M12 17c-2.5 0-5-1.5-5-4"/>
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5"  y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function IconChevron({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
         style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.22s ease' }}>
      <polyline points="6,3 11,8 6,13"/>
    </svg>
  )
}

function IconUser() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

// ─── Journey nav data ─────────────────────────────────────────────────────────

type JourneyItem = {
  to: string
  // Additional paths that should light up this nav item as active
  activePaths?: string[]
  icon: React.ComponentType<{ active?: boolean }>
  emoji: string
  ko: string
  en: string
  fr: string
}

const JOURNEY: JourneyItem[] = [
  {
    to: '/arriving',
    icon: IconArriving,
    emoji: '✈️',
    ko: '첫 걸음',
    en: 'First Steps',
    fr: 'Premiers Pas',
  },
  {
    to: '/settling',
    icon: IconSettling,
    emoji: '🏡',
    ko: '나만의 공간 찾기',
    en: 'Finding Your Place',
    fr: 'Trouver Son Chez-Soi',
  },
  {
    to: '/board',
    activePaths: ['/board', '/community'],
    icon: IconConnecting,
    emoji: '👋',
    ko: '주변 사람들',
    en: 'People Around You',
    fr: 'Autour de Vous',
  },
  {
    to: '/radar',
    activePaths: ['/radar', '/resume-map'],
    icon: IconWorking,
    emoji: '💼',
    ko: '새로운 기회',
    en: 'New Opportunities',
    fr: 'Nouvelles Opportunités',
  },
  {
    to: '/phrases',
    activePaths: ['/phrases', '/programs', '/sessions'],
    icon: IconLanguage,
    emoji: '🗣',
    ko: '일상 표현',
    en: 'Everyday Words',
    fr: 'Expressions du Quotidien',
  },
  {
    to: '/news',
    activePaths: ['/news'],
    icon: IconLiving,
    emoji: '🌱',
    ko: '몬트리올 라이프',
    en: 'Life in Montréal',
    fr: 'La Vie à Montréal',
  },
]

// Mobile shows 5 stages (drop Settling — least-frequent action)
const JOURNEY_MOBILE = JOURNEY.filter(j => j.to !== '/settling')

const LANGS: { code: Lang; label: string }[] = [
  { code: 'ko', label: 'KO' },
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
]

function openCompose(tag = 'general') {
  window.dispatchEvent(new CustomEvent('hakkyo:open-compose', { detail: { tag } }))
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function journeyLabel(j: JourneyItem, lang: string) {
  return lang === 'ko' ? j.ko : lang === 'fr' ? j.fr : j.en
}

function isJourneyActive(j: JourneyItem, pathname: string) {
  const paths = j.activePaths ?? [j.to]
  return paths.some(p => pathname === p || pathname.startsWith(p + '/'))
}

// ─── Desktop sidebar ─────────────────────────────────────────────────────────

function DesktopSidebar() {
  const { lang, setLang, t } = useLang()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [times, setTimes] = useState({ mtl: '', seo: '' })

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  useEffect(() => {
    function refresh() {
      const fmt = (tz: string) =>
        new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false })
          .format(new Date())
      setTimes({ mtl: fmt('America/Toronto'), seo: fmt('Asia/Seoul') })
    }
    refresh()
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <aside
      className="hidden lg:flex flex-col shrink-0 sticky top-0 h-screen border-r border-gray-100 bg-white z-30 overflow-hidden"
      style={{
        width: collapsed ? 68 : 224,
        transition: 'width 0.22s ease',
        minWidth: collapsed ? 68 : 224,
      }}
    >
      {/* ── Scrollable top region ── */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">

        {/* Logo */}
        <div
          className="flex items-center pt-6 pb-4 shrink-0 overflow-hidden"
          style={{ paddingLeft: collapsed ? 14 : 20, paddingRight: collapsed ? 14 : 20 }}
        >
          <Link to="/arriving" className="flex items-center gap-2.5 group shrink-0">
            <img src="/logo.png" alt="HAKKYO" className="h-7 w-7 shrink-0 object-contain" />
            {!collapsed && (
              <span className="font-bold text-[15px] tracking-tight text-gray-900 group-hover:text-gray-600 transition-colors whitespace-nowrap">
                HAKKYO
              </span>
            )}
          </Link>
        </div>

        {/* ── Account area — directly below logo ── */}
        <div className="px-2 pb-3 shrink-0">
          {user ? (
            collapsed ? (
              <Link
                to="/account"
                title={user.email ?? 'My Journey'}
                className="flex items-center justify-center py-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={{ background: 'var(--y)', color: '#111' }}
                >
                  {user.email?.[0]?.toUpperCase() ?? '?'}
                </div>
              </Link>
            ) : (
              <div className="space-y-1">
                <Link
                  to="/account"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                    style={{ background: 'var(--y)', color: '#111' }}
                  >
                    {user.email?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-gray-900 leading-tight">{t('나의 여정', 'My Journey', 'Mon Parcours')}</p>
                    <p className="text-[11px] text-gray-400 leading-tight truncate">{user.email}</p>
                  </div>
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-gray-400 shrink-0">
                    <polyline points="6,3 11,8 6,13"/>
                  </svg>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  {t('로그아웃', 'Sign out', 'Se déconnecter')}
                </button>
              </div>
            )
          ) : (
            collapsed ? (
              <Link
                to="/login"
                title="Montréal In"
                className="flex items-center justify-center py-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <IconUser />
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center justify-center w-full py-2.5 rounded-xl text-[13px] font-bold transition-colors"
                style={{ background: 'var(--y)', color: '#111' }}
              >
                {t('몬트리올 시작하기', 'Montréal In', 'Commencer')}
              </Link>
            )
          )}
        </div>

        <div className="mx-3 mb-2 border-t border-gray-100 shrink-0" />

        <nav className="px-2 space-y-0.5 shrink-0">
          {JOURNEY.map(j => {
            const active = isJourneyActive(j, pathname)
            const Icon = j.icon
            const lbl = journeyLabel(j, lang)
            return (
              <Link
                key={j.to}
                to={j.to}
                title={collapsed ? lbl : undefined}
                className={[
                  'flex items-center rounded-xl transition-all',
                  collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-2.5',
                  active
                    ? 'text-gray-900 font-semibold'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
                ].join(' ')}
                style={active ? { background: 'var(--y-l)', color: '#111' } : {}}
              >
                <span style={active ? { color: 'var(--y-h)' } : {}}><Icon active={active} /></span>
                {!collapsed && (
                  <>
                    <span className="text-[13px] font-medium">{lbl}</span>
                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--y)' }} />
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="mx-3 my-3 border-t border-gray-100 shrink-0" />

        {/* Post / Radar signal button */}
        <div className="px-2 shrink-0">
          {collapsed ? (
            <button
              onClick={() => openCompose('general')}
              title="Post"
              className="w-full flex items-center justify-center rounded-xl py-2.5 transition-all"
              style={{ background: 'var(--y)' }}
            >
              <IconPlus />
            </button>
          ) : (
            <button
              onClick={() => openCompose('general')}
              className="btn-yellow w-full flex items-center justify-center gap-2 text-[13px] rounded-xl py-2.5"
            >
              <IconPlus />
              {t('공유하기', 'Share Something', 'Partager')}
            </button>
          )}
        </div>

        {/* Footer links — expanded only */}
        {!collapsed && (
          <>
            <div className="mx-5 mt-4 mb-0 border-t border-gray-100" />
            <div className="px-3 pt-3 space-y-0.5">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('hakkyo:open-archive'))}
                className="flex items-center gap-3 w-full px-2 py-2 rounded-xl text-[13px] text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all text-left"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 2h10v12l-5-3.5L3 14V2z"/>
                </svg>
                {t('아카이브', 'Archive', 'Archives')}
              </button>
              <a
                href="https://www.instagram.com/hakkyo.mtl"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-2 py-2 rounded-xl text-[13px] text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                </svg>
                @hakkyo.mtl
              </a>
              <a
                href="mailto:hello@hakkyo.ca"
                className="flex items-center gap-3 px-2 py-2 rounded-xl text-[13px] text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                hello@hakkyo.ca
              </a>
            </div>

            <div className="mx-5 my-3 border-t border-gray-100" />

            {/* Language switcher */}
            <div className="px-4 pb-4">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden text-[12px] font-semibold">
                {LANGS.map(({ code, label: lbl }) => (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    className={[
                      'flex-1 py-2 transition-colors',
                      lang === code ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Pinned bottom — times + collapse ── */}
      <div className="shrink-0 border-t border-gray-100">

        {/* City times */}
        <div
          className="py-2.5 border-t border-gray-100"
          style={{ paddingLeft: collapsed ? 0 : 20, paddingRight: collapsed ? 0 : 20 }}
        >
          {collapsed ? (
            <div className="flex flex-col items-center gap-0.5 text-[9px] text-gray-400 leading-tight">
              <span>MTL</span>
              <span className="font-medium text-gray-500">{times.mtl}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span>MTL {times.mtl}</span>
              <span className="text-gray-300">·</span>
              <span>SEO {times.seo}</span>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(v => !v)}
          title={collapsed ? t('펼치기', 'Expand', 'Agrandir') : t('접기', 'Collapse', 'Réduire')}
          className="flex items-center justify-center gap-2 w-full py-3 border-t border-gray-100 text-[12px] text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <IconChevron collapsed={collapsed} />
          {!collapsed && <span>{t('접기', 'Collapse', 'Réduire')}</span>}
        </button>
      </div>
    </aside>
  )
}

// ─── Mobile bottom tab bar ────────────────────────────────────────────────────

function MobileBottomNav() {
  const { lang, t } = useLang()
  const { pathname } = useLocation()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex items-stretch">
      {JOURNEY_MOBILE.map(j => {
        const active = isJourneyActive(j, pathname)
        const Icon = j.icon
        const lbl = journeyLabel(j, lang)
        return (
          <Link
            key={j.to}
            to={j.to}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
            style={active ? { color: 'var(--y-h)' } : { color: '#9CA3AF' }}
          >
            <Icon active={active} />
            <span className="text-[9px] font-medium">{lbl}</span>
          </Link>
        )
      })}
      <button
        onClick={() => openCompose('general')}
        className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5"
        style={{ color: 'var(--y-h)' }}
      >
        <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--y)' }}>
          <IconPlus />
        </span>
        <span className="text-[9px] font-medium text-gray-400">{t('공유', 'Share', 'Partager')}</span>
      </button>
    </nav>
  )
}

// ─── Export ──────────────────────────────────────────────────────────────────

export default function AppSidebar() {
  return (
    <>
      <DesktopSidebar />
      <MobileBottomNav />
    </>
  )
}
