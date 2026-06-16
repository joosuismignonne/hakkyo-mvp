/**
 * AppSidebar — global persistent left nav (desktop) + bottom tab bar (mobile).
 * Replaces the top Nav component.
 */
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import type { Lang } from '../types'

// ─── Icons (inline SVG, monochrome thin-stroke) ───────────────────────────────

function IconHome({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  )
}

function IconPrograms({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
    </svg>
  )
}

function IconCommunity({ active }: { active?: boolean }) {
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

function IconNews({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/>
      <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function IconHousing() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="10" width="18" height="11" rx="1"/>
      <path d="M3 10L12 3l9 7"/>
    </svg>
  )
}

function IconJobs() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    </svg>
  )
}

function IconEvents() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

function IconLanguage() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
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
  { tag: 'housing',          icon: IconHousing,  ko: '주거',     en: 'Housing',          fr: 'Logement'  },
  { tag: 'jobs',             icon: IconJobs,     ko: '취업',     en: 'Jobs',             fr: 'Emploi'    },
  { tag: 'events',           icon: IconEvents,   ko: '이벤트',   en: 'Events',           fr: 'Événements'},
  { tag: 'language_exchange',icon: IconLanguage, ko: '언어교환', en: 'Language Exchange', fr: 'Échange'   },
]

const LANGS: { code: Lang; label: string }[] = [
  { code: 'ko', label: 'KO' },
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
]

function openCompose(tag = 'general') {
  window.dispatchEvent(new CustomEvent('hakkyo:open-compose', { detail: { tag } }))
}

// ─── Collapsible footer utilities ────────────────────────────────────────────

function FooterUtilities({ t }: { t: (ko: string, en: string, fr: string) => string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="px-5 pb-3">
      {/* Toggle row */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1.5 text-[10px] text-gray-300 hover:text-gray-500 transition-colors w-full text-left mb-1"
        title={expanded ? 'Collapse' : 'More'}
      >
        <svg
          width="10" height="10" viewBox="0 0 12 12" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        >
          <polyline points="2,4 6,8 10,4"/>
        </svg>
        <span>{expanded ? t('닫기', 'Less', 'Moins') : t('더 보기', 'More', 'Plus')}</span>
      </button>

      {/* Expandable content */}
      {expanded && (
        <div className="space-y-1.5 pt-1" style={{ animation: 'modal-up 0.12s ease-out' }}>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('hakkyo:open-archive'))}
            className="flex items-center gap-2 text-[11px] text-gray-400 hover:text-gray-700 transition-colors w-full text-left"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 2h10v12l-5-3.5L3 14V2z"/>
            </svg>
            {t('아카이브', 'Archive', 'Archives')}
          </button>
          <a
            href="https://www.instagram.com/hakkyo.mtl"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
            </svg>
            @hakkyo.mtl
          </a>
          <a
            href="mailto:hello@hakkyo.ca"
            className="flex items-center gap-2 text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            hello@hakkyo.ca
          </a>
        </div>
      )}
    </div>
  )
}

// ─── Desktop sidebar ─────────────────────────────────────────────────────────

function DesktopSidebar() {
  const { lang, setLang, t } = useLang()
  const { pathname } = useLocation()

  const label = (n: typeof NAV[0]) =>
    lang === 'ko' ? n.ko : lang === 'fr' ? n.fr : n.en

  const catLabel = (c: typeof CATS[0]) =>
    lang === 'ko' ? c.ko : lang === 'fr' ? c.fr : c.en

  const isActive = (n: typeof NAV[0]) =>
    n.exact ? pathname === n.to : pathname === n.to || pathname.startsWith(n.to + '/')

  // Compact city times
  const [times, setTimes] = useState({ mtl: '', seo: '' })
  useEffect(() => {
    function refresh() {
      const fmt = (tz: string) =>
        new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false })
          .format(new Date()).replace(',', '')
      setTimes({ mtl: fmt('America/Toronto'), seo: fmt('Asia/Seoul') })
    }
    refresh()
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <aside className="hidden lg:flex flex-col w-56 xl:w-60 shrink-0 sticky top-0 h-screen border-r border-gray-100 bg-white overflow-y-auto z-30">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src="/logo.png" alt="HAKKYO" className="h-7 w-7 shrink-0 object-contain" />
          <span className="font-bold text-[15px] tracking-tight text-gray-900 group-hover:text-gray-600 transition-colors">
            HAKKYO
          </span>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="px-3 space-y-0.5">
        {NAV.map(n => {
          const active = isActive(n)
          const Icon = n.icon
          return (
            <Link
              key={n.to}
              to={n.to}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all',
                active
                  ? 'text-gray-900 font-semibold'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
              ].join(' ')}
              style={active ? { background: 'var(--y-l)', color: '#111' } : {}}
            >
              <span style={active ? { color: 'var(--y-h)' } : {}}>
                <Icon active={active} />
              </span>
              <span>{label(n)}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--y)' }} />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mx-5 my-4 border-t border-gray-100" />

      {/* Create button */}
      <div className="px-4">
        <button
          onClick={() => openCompose('general')}
          className="btn-yellow w-full flex items-center justify-center gap-2 text-[13px] rounded-xl py-2.5"
        >
          <IconPlus />
          Post
        </button>
      </div>

      <div className="mx-5 my-4 border-t border-gray-100" />

      {/* Category shortcuts */}
      <div className="px-3">
        <p className="text-[9px] font-semibold tracking-[0.22em] text-gray-300 uppercase px-3 mb-2">
          {t('빠른 게시', 'Quick Post', 'Publier vite')}
        </p>
        <div className="space-y-0.5">
          {CATS.map(c => {
            const Icon = c.icon
            return (
              <button
                key={c.tag}
                onClick={() => openCompose(c.tag)}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-[12px] text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all text-left"
              >
                <span className="text-gray-400"><Icon /></span>
                {catLabel(c)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* City times */}
      <div className="px-5 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-[10px] text-gray-300">
          <span>MTL {times.mtl}</span>
          <span className="text-gray-200">·</span>
          <span>SEO {times.seo}</span>
        </div>
      </div>

      {/* Footer utilities — collapsible */}
      <FooterUtilities t={t} />

      {/* Language switcher */}
      <div className="px-5 pb-5">
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden text-[11px] font-semibold">
          {LANGS.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={[
                'flex-1 py-1.5 transition-colors',
                lang === code ? 'bg-gray-900 text-white' : 'text-gray-400 hover:bg-gray-50',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
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
      {/* Create tab */}
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
