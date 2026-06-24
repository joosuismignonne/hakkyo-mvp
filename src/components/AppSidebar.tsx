/**
 * AppSidebar — collapsible left rail (desktop) + bottom tab bar (mobile).
 *
 * Design system:
 * - Active state: left border accent, no fill
 * - Nav: 13px, understated
 * - Language: 3 text buttons, no border box
 * - Times: 11px ambient, bottom-pinned
 */
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import { trackEvent } from '../lib/analytics'
import type { Lang } from '../types'

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconHome({ active }: { active?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  )
}

function IconArriving({ active }: { active?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.5H2"/>
      <path d="M2 10l4.5 1.5L9 5l2 2-2 5 4.5 1.5L17 7l2.5 1-3 7H22"/>
    </svg>
  )
}

function IconSettling({ active }: { active?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
      <circle cx="12" cy="10" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function IconConnecting({ active }: { active?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
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
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
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
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 5h10M7 2v3M12 14l4-9 4 9M13.5 11h5"/>
      <path d="M4 9c0 4 2.5 6.5 5 8"/>
      <path d="M9 9c0 4-2.5 6.5-5 8"/>
    </svg>
  )
}

function IconLiving({ active }: { active?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12"/>
      <path d="M12 12C12 12 7 10 7 6a5 5 0 0110 0c0 4-5 6-5 6z"/>
      <path d="M12 17c-2.5 0-5-1.5-5-4"/>
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

// ─── Navigation data ──────────────────────────────────────────────────────────

type JourneyItem = {
  to: string
  activePaths?: string[]
  icon: React.ComponentType<{ active?: boolean }>
  emoji: string
  ko: string
  en: string
  fr: string
}

const JOURNEY: JourneyItem[] = [
  { to: '/',          icon: IconHome,       emoji: '🏠', ko: '홈',           en: 'Home',            fr: 'Accueil'                },
  { to: '/arriving',  icon: IconArriving,   emoji: '✈️', ko: '첫 걸음',      en: 'First Steps',     fr: 'Premiers Pas'           },
  { to: '/settling',  icon: IconSettling,   emoji: '🏡', ko: '나만의 공간',   en: 'Finding My Place', fr: 'Trouver Mon Chez-Soi'  },
  { to: '/board',     activePaths: ['/board', '/community'],
                      icon: IconConnecting, emoji: '👋', ko: '주변 사람들',   en: 'People Around You', fr: 'Autour de Vous'       },
  { to: '/programs',  activePaths: ['/programs', '/sessions', '/radar', '/resume-map'],
                      icon: IconWorking,    emoji: '💼', ko: '새로운 기회',   en: 'New Opportunities', fr: 'Nouvelles Opportunités'},
  { to: '/phrases',   activePaths: ['/phrases'],
                      icon: IconLanguage,   emoji: '🗣', ko: '일상 표현',     en: 'Everyday Words',   fr: 'Expressions Quotidiennes'},
  { to: '/news',      activePaths: ['/news'],
                      icon: IconLiving,     emoji: '🌱', ko: '몬트리올 라이프', en: 'Life in Montréal', fr: 'La Vie à Montréal'   },
]

const JOURNEY_MOBILE = JOURNEY

const LANGS: { code: Lang; label: string }[] = [
  { code: 'ko', label: 'KO' },
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isJourneyActive(j: JourneyItem, pathname: string) {
  if (j.to === '/') return pathname === '/'
  const paths = j.activePaths ?? [j.to]
  return paths.some(p => pathname === p || pathname.startsWith(p + '/'))
}

// ─── Desktop sidebar ─────────────────────────────────────────────────────────

function DesktopSidebar() {
  const { lang, setLang } = useLang()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [times, setTimes] = useState({ mtl: '', seo: '' })

  async function handleSignOut() {
    trackEvent({ eventName: 'logout_clicked', targetType: 'button', targetLabel: 'Sign out' })
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

  const w = collapsed ? 64 : 208

  return (
    <aside
      className="hidden lg:flex flex-col shrink-0 sticky top-0 h-screen border-r border-gray-100 bg-white z-30 overflow-hidden"
      style={{ width: w, minWidth: w, transition: 'width 0.22s ease' }}
    >
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">

        {/* Logo */}
        <div
          className="flex items-center shrink-0 overflow-hidden"
          style={{ padding: collapsed ? '28px 0 20px' : '28px 20px 20px', justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <img src="/logo.png" alt="HAKKYO" className="h-6 w-6 shrink-0 object-contain" />
            {!collapsed && (
              <span className="font-semibold text-[14px] tracking-tight text-gray-900 group-hover:text-gray-500 transition-colors whitespace-nowrap">
                HAKKYO
              </span>
            )}
          </Link>
        </div>

        {/* Account */}
        <div className="px-2 pb-3 shrink-0">
          {user ? (
            collapsed ? (
              <Link to="/account" title={user.email ?? 'Account'}
                    className="flex items-center justify-center py-2 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                     style={{ background: 'var(--y)', color: '#111' }}>
                  {user.email?.[0]?.toUpperCase() ?? '?'}
                </div>
              </Link>
            ) : (
              <div>
                <Link to="/account"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                       style={{ background: 'var(--y)', color: '#111' }}>
                    {user.email?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-gray-900 leading-tight truncate">My Journey</p>
                    <p className="text-[11px] text-gray-400 leading-tight truncate">{user.email}</p>
                  </div>
                </Link>
                <button onClick={handleSignOut}
                        className="w-full text-left px-3 py-1.5 text-[11px] text-gray-400 hover:text-red-500 transition-colors rounded-xl">
                  Sign out
                </button>
              </div>
            )
          ) : (
            collapsed ? (
              <Link to="/login" title="Sign in"
                    className="flex items-center justify-center py-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
                <IconUser />
              </Link>
            ) : (
              <Link to="/login"
                    className="flex items-center justify-center w-full py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
                    style={{ background: 'var(--y)', color: '#111' }}>
                Into Montréal
              </Link>
            )
          )}
        </div>

        <div className="mx-3 mb-2 border-t border-gray-100 shrink-0" />

        {/* Nav */}
        <nav className="px-2 space-y-0.5 shrink-0">
          {JOURNEY.map(j => {
            const active = isJourneyActive(j, pathname)
            const Icon = j.icon
            const lbl = j.en
            return (
              <Link
                key={j.to}
                to={j.to}
                title={collapsed ? lbl : undefined}
                onClick={() => trackEvent({ eventName: 'sidebar_click', targetType: 'nav', targetLabel: lbl, targetId: j.to })}
                className={[
                  'flex items-center rounded-xl transition-all duration-150',
                  collapsed ? 'justify-center py-3.5' : 'gap-3 px-3 py-2.5',
                  active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50',
                ].join(' ')}
                style={active && !collapsed ? {
                  background: '#f9fafb',
                  borderLeft: '2px solid #111',
                  paddingLeft: 10,
                  marginLeft: -2,
                } : active && collapsed ? { color: '#111' } : {}}
              >
                <span className={active ? 'text-gray-900' : ''}><Icon active={active} /></span>
                {!collapsed && (
                  <span className={`text-[13px] ${active ? 'font-semibold' : 'font-medium'}`}>{lbl}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Language switcher — 3 text buttons */}
        {!collapsed && (
          <div className="px-5 pt-5 pb-2 flex items-center gap-3">
            {LANGS.map(({ code, label: lbl }) => (
              <button
                key={code}
                onClick={() => { setLang(code); trackEvent({ eventName: 'language_switch', targetLabel: code }) }}
                className={`text-[12px] font-semibold transition-colors ${
                  lang === code ? 'text-gray-900' : 'text-gray-300 hover:text-gray-600'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom: times + collapse */}
      <div className="shrink-0 border-t border-gray-100">
        <div className="py-2.5" style={{ paddingLeft: collapsed ? 0 : 20, paddingRight: collapsed ? 0 : 20 }}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-gray-300">MTL</span>
              <span className="text-[10px] text-gray-400 font-medium">{times.mtl}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-300">MTL {times.mtl}</span>
              <span className="text-[11px] text-gray-300">SEO {times.seo}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(v => !v)}
          title={collapsed ? 'Expand' : 'Collapse'}
          className="flex items-center justify-center gap-2 w-full py-2.5 border-t border-gray-100 text-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <IconChevron collapsed={collapsed} />
          {!collapsed && <span className="text-[11px] font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}

// ─── Mobile bottom tab bar ────────────────────────────────────────────────────

function MobileBottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex items-stretch overflow-x-auto">
      {JOURNEY_MOBILE.map(j => {
        const active = isJourneyActive(j, pathname)
        const Icon = j.icon
        return (
          <Link
            key={j.to}
            to={j.to}
            className="flex flex-col items-center justify-center py-2 gap-0.5 transition-colors shrink-0"
            style={{ color: active ? '#111' : '#d1d5db', minWidth: '56px', flex: '1 0 56px' }}
          >
            <Icon active={active} />
            <span style={{ fontSize: '9px', fontWeight: active ? 700 : 500 }}>{j.en}</span>
          </Link>
        )
      })}
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
