/**
 * AppSidebar — collapsible left rail (desktop) + bottom tab bar (mobile).
 *
 * Expanded  → w-56 / w-60  — logo + labels + nav + post + utilities
 * Collapsed → w-[68px]     — icon-only rail; main content re-centres automatically
 */
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import type { Lang } from '../types'

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconHome({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  )
}

function IconPrograms({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
    </svg>
  )
}

function IconCommunity({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9"  cy="7"  r="4"/>
      <circle cx="17" cy="9"  r="3"/>
      <path d="M2 20c0-3.314 3.134-6 7-6s7 2.686 7 6"/>
      <path d="M20 20c0-2.21-1.343-4-3-4"/>
    </svg>
  )
}

function IconNews({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/>
      <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>
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

function IconHousing() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="10" width="18" height="11" rx="1"/>
      <path d="M3 10L12 3l9 7"/>
    </svg>
  )
}

function IconJobs() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    </svg>
  )
}

function IconEvents() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8"  y1="2" x2="8"  y2="6"/>
      <line x1="3"  y1="10" x2="21" y2="10"/>
    </svg>
  )
}

function IconLanguage() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
    </svg>
  )
}

// Chevron pointing right (expand) or left (collapse)
function IconChevron({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
         style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.22s ease' }}>
      <polyline points="6,3 11,8 6,13"/>
    </svg>
  )
}

// ─── Data ────────────────────────────────────────────────────────────────────

const NAV = [
  { to: '/',         icon: IconHome,      ko: 'For You', en: 'For You',   fr: 'Pour vous',  exact: true  },
  { to: '/programs', icon: IconPrograms,  ko: '프로그램', en: 'Programs',  fr: 'Programmes', exact: false },
  { to: '/board',    icon: IconCommunity, ko: '커뮤니티', en: 'Community', fr: 'Communauté', exact: false },
  { to: '/news',     icon: IconNews,      ko: '뉴스',    en: 'News',      fr: 'Actualités', exact: false },
]

const CATS = [
  { tag: 'housing',           icon: IconHousing,  ko: '주거',     en: 'Housing',          fr: 'Logement'   },
  { tag: 'jobs',              icon: IconJobs,     ko: '취업',     en: 'Jobs',             fr: 'Emploi'     },
  { tag: 'events',            icon: IconEvents,   ko: '이벤트',   en: 'Events',           fr: 'Événements' },
  { tag: 'language_exchange', icon: IconLanguage, ko: '언어교환', en: 'Language Exchange', fr: 'Échange'    },
]

const LANGS: { code: Lang; label: string }[] = [
  { code: 'ko', label: 'KO' },
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
]

function openCompose(tag = 'general') {
  window.dispatchEvent(new CustomEvent('hakkyo:open-compose', { detail: { tag } }))
}

// ─── Desktop sidebar ─────────────────────────────────────────────────────────

function DesktopSidebar() {
  const { lang, setLang, t } = useLang()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [times, setTimes] = useState({ mtl: '', seo: '' })

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

  const label    = (n: typeof NAV[0])  => lang === 'ko' ? n.ko : lang === 'fr' ? n.fr : n.en
  const catLabel = (c: typeof CATS[0]) => lang === 'ko' ? c.ko : lang === 'fr' ? c.fr : c.en
  const isActive = (n: typeof NAV[0])  =>
    n.exact ? pathname === n.to : pathname === n.to || pathname.startsWith(n.to + '/')

  return (
    <aside
      className="hidden lg:flex flex-col shrink-0 sticky top-0 h-screen border-r border-gray-100 bg-white overflow-y-auto z-30"
      style={{
        width: collapsed ? 68 : 224,
        transition: 'width 0.22s ease',
        minWidth: collapsed ? 68 : 224,
      }}
    >
      {/* ── Logo ── */}
      <div
        className="flex items-center pt-6 pb-4 overflow-hidden"
        style={{ paddingLeft: collapsed ? 14 : 20, paddingRight: collapsed ? 14 : 20 }}
      >
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <img src="/logo.png" alt="HAKKYO" className="h-7 w-7 shrink-0 object-contain" />
          {!collapsed && (
            <span className="font-bold text-[15px] tracking-tight text-gray-900 group-hover:text-gray-600 transition-colors whitespace-nowrap">
              HAKKYO
            </span>
          )}
        </Link>
      </div>

      {/* ── Main nav ── */}
      <nav className="px-2 space-y-0.5">
        {NAV.map(n => {
          const active = isActive(n)
          const Icon = n.icon
          return (
            <Link
              key={n.to}
              to={n.to}
              title={collapsed ? label(n) : undefined}
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
                  <span className="text-[13px] font-medium">{label(n)}</span>
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--y)' }} />
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mx-3 my-4 border-t border-gray-100" />

      {/* ── Post button ── */}
      <div className="px-2">
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
            Post
          </button>
        )}
      </div>

      {/* ── Utilities (hidden when collapsed) ── */}
      {!collapsed && (
        <>
          <div className="mx-5 mt-4 mb-0 border-t border-gray-100" />

          {/* Quick boards */}
          <div className="px-3 pt-3">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-gray-400 uppercase px-2 mb-1.5">
              {t('빠른 게시', 'Quick Post', 'Publier vite')}
            </p>
            <div className="space-y-0.5">
              {CATS.map(c => {
                const Icon = c.icon
                return (
                  <button
                    key={c.tag}
                    onClick={() => openCompose(c.tag)}
                    className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl text-[13px] text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all text-left"
                  >
                    <span className="text-gray-500"><Icon /></span>
                    {catLabel(c)}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mx-5 my-3 border-t border-gray-100" />

          {/* Footer links */}
          <div className="px-3 space-y-0.5">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('hakkyo:open-archive'))}
              className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl text-[13px] text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all text-left"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2h10v12l-5-3.5L3 14V2z"/>
              </svg>
              {t('아카이브', 'Archive', 'Archives')}
            </button>
            <a
              href="https://www.instagram.com/hakkyo.mtl"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-2 py-2.5 rounded-xl text-[13px] text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
              @hakkyo.mtl
            </a>
            <a
              href="mailto:hello@hakkyo.ca"
              className="flex items-center gap-3 px-2 py-2.5 rounded-xl text-[13px] text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              hello@hakkyo.ca
            </a>
          </div>

          <div className="mx-5 my-3 border-t border-gray-100" />

          {/* Language switcher */}
          <div className="px-4 pb-2">
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* ── City times ── */}
      <div
        className="py-3 border-t border-gray-100"
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

      {/* ── Collapse / expand toggle ── */}
      <button
        onClick={() => setCollapsed(v => !v)}
        title={collapsed ? t('펼치기', 'Expand', 'Agrandir') : t('접기', 'Collapse', 'Réduire')}
        className="flex items-center justify-center gap-2 py-3 border-t border-gray-100 text-[12px] text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
      >
        <IconChevron collapsed={collapsed} />
        {!collapsed && <span>{t('접기', 'Collapse', 'Réduire')}</span>}
      </button>

    </aside>
  )
}

// ─── Mobile bottom tab bar ────────────────────────────────────────────────────

function MobileBottomNav() {
  const { lang, t } = useLang()
  const { pathname } = useLocation()

  const label = (n: typeof NAV[0]) =>
    lang === 'ko' ? n.ko : lang === 'fr' ? n.fr : n.en

  const isActive = (n: typeof NAV[0]) =>
    n.exact ? pathname === n.to : pathname === n.to || pathname.startsWith(n.to + '/')

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex items-stretch">
      {NAV.map(n => {
        const active = isActive(n)
        const Icon = n.icon
        return (
          <Link
            key={n.to}
            to={n.to}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
            style={active ? { color: 'var(--y-h)' } : { color: '#9CA3AF' }}
          >
            <Icon active={active} />
            <span className="text-[9px] font-medium">{label(n)}</span>
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
        <span className="text-[9px] font-medium text-gray-400">{t('작성', 'Post', 'Publier')}</span>
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
