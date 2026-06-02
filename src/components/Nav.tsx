'use client'
import { Link, useLocation } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import type { Lang } from '../types'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'ko', label: 'KO' },
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
]

export default function Nav() {
  const { lang, setLang, t } = useLang()
  const loc = useLocation()

  const links = [
    { to: '/programs', label: t('PROGRAMS', 'PROGRAMS', 'PROGRAMS') },
    { to: '/schedule', label: t('BOARD', 'BOARD', 'BOARD') },
    { to: '/content',  label: t('NEWS', 'NEWS', 'NEWS') },
  ]

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        <Link to="/" className="flex items-center gap-2 font-bold text-base tracking-tight text-gray-900 shrink-0">
          <img src="/logo.png" alt="HAKKYO" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />
          HAKKYO
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ to, label }) => (
            <Link key={to} to={to}
              className={[
                'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                loc.pathname === to
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
              ].join(' ')}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <div className="flex items-center border border-gray-200 rounded overflow-hidden text-xs font-semibold">
            {LANGS.map(({ code, label }) => (
              <button key={code} onClick={() => setLang(code)}
                className={[
                  'px-2.5 py-1 transition-colors',
                  lang === code ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50',
                ].join(' ')}>
                {label}
              </button>
            ))}
          </div>

          {/* Mobile: abbreviated links */}
          <div className="md:hidden flex items-center gap-1">
            {links.map(({ to, label }) => (
              <Link key={to} to={to}
                className={[
                  'text-xs px-2 py-1 rounded',
                  loc.pathname === to ? 'font-semibold text-gray-900' : 'text-gray-500',
                ].join(' ')}>
                {label.split('·')[0].trim()}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
