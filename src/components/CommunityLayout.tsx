import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SiteDetails from './SiteDetails'
import { programs, activities } from '../data/hakkyo'
import { useLang, useT, UI } from '../lib/lang'
import type { Lang } from '../lib/lang'

interface Channel { icon: string; name: string; href: string }

// Fix legacy Supabase hrefs (all were '/board')
const CHANNEL_HREF: Record<string, string> = {
  '공지':       '/board',
  '자유게시판': '/community/chat',
  '언어교환':   '/community/exchange',
  '주거':       '/community/housing',
  '취업·이민':  '/community/jobs',
  '이벤트·모임': '/community/events',
}

const DEFAULT_CHANNELS: Channel[] = [
  { icon: '📢', name: '공지',       href: '/board' },
  { icon: '💬', name: '자유게시판', href: '/community/chat' },
  { icon: '🌐', name: '언어교환',   href: '/community/exchange' },
  { icon: '🏠', name: '주거',       href: '/community/housing' },
  { icon: '💼', name: '취업·이민',  href: '/community/jobs' },
  { icon: '📅', name: '이벤트·모임', href: '/community/events' },
]

const DEFAULT_THEME = {
  color_sidebar: '#111116',
  color_accent: '#f5c542',
  color_main_bg: '#f7f7f5',
}

function applyTheme(t: typeof DEFAULT_THEME) {
  const r = document.documentElement
  r.style.setProperty('--sidebar-bg', t.color_sidebar)
  r.style.setProperty('--sidebar-accent', t.color_accent)
  r.style.setProperty('--main-bg', t.color_main_bg)
}

interface SearchResult { icon: string; title: string; sub: string; href: string }

function buildSearchIndex(lang: Lang): SearchResult[] {
  const t = UI[lang].searchItems
  const results: SearchResult[] = [
    { icon: '🏠', title: t.home[0],          sub: t.home[1],          href: '/' },
    { icon: '📢', title: t.board[0],         sub: t.board[1],         href: '/board' },
    { icon: '📚', title: t.programs[0],      sub: t.programs[1],      href: '/programs' },
    { icon: '🐱', title: t.mini[0],          sub: t.mini[1],          href: '/activities' },
    { icon: '🔔', title: t.applyNews[0],     sub: t.applyNews[1],     href: '/apply/news' },
    { icon: '🤝', title: t.applyCommunity[0], sub: t.applyCommunity[1], href: '/apply/community' },
  ]
  programs.forEach(p => results.push({
    icon: p.mark || '📚',
    title: p.lang,
    sub: `${p.level} · SESSION 04`,
    href: p.href,
  }))
  activities.forEach(a => results.push({
    icon: '🐱',
    title: a.ko,
    sub: `Mini HAKKYO · ${(a as any).date || ''}`,
    href: `/activities/${a.slug}`,
  }))
  DEFAULT_CHANNELS.slice(1).forEach(ch => {
    const channelMap = UI[lang].channels as Record<string, string>
    results.push({
      icon: ch.icon,
      title: channelMap[ch.name] || ch.name,
      sub: t.channelSub,
      href: ch.href,
    })
  })
  return results
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { lang } = useLang()
  const t = useT()
  const index = useRef<SearchResult[]>([])

  useEffect(() => {
    index.current = buildSearchIndex(lang)
  }, [lang])

  useEffect(() => {
    inputRef.current?.focus()
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const results = q.length >= 1
    ? index.current.filter(r =>
        r.title.toLowerCase().includes(q.toLowerCase()) ||
        r.sub.toLowerCase().includes(q.toLowerCase())
      ).slice(0, 8)
    : index.current.slice(0, 6)

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <div className="search-input-row">
          <span className="search-icon-label">🔍</span>
          <input
            ref={inputRef}
            className="search-input"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={t.search.placeholder}
          />
          <button className="search-close-btn" onClick={onClose}>Esc</button>
        </div>
        <div className="search-results">
          {results.length === 0 && (
            <div className="search-empty">{t.search.empty(q)}</div>
          )}
          {results.map((r, i) => (
            <a key={i} href={r.href} className="search-result-item" onClick={onClose}>
              <span className="search-result-icon">{r.icon}</span>
              <div className="search-result-body">
                <div className="search-result-title">{r.title}</div>
                <div className="search-result-sub">{r.sub}</div>
              </div>
              <span className="search-result-arrow">→</span>
            </a>
          ))}
        </div>
        {!q && <div className="search-hint">{t.search.hint}</div>}
      </div>
    </div>
  )
}

const LANG_LABELS: { code: Lang; label: string }[] = [
  { code: 'ko', label: '한' },
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
]

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [channels, setChannels] = useState<Channel[]>(DEFAULT_CHANNELS)
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { lang, setLang } = useLang()
  const t = useT()

  useEffect(() => {
    applyTheme(DEFAULT_THEME)
    if (!supabase) return

    supabase.from('site_content').select('key,value_ko').eq('page', 'theme').then(({ data }) => {
      if (!data?.length) return
      const get = (k: string) => data.find(r => r.key === k)?.value_ko
      applyTheme({
        color_sidebar: get('color_sidebar') || DEFAULT_THEME.color_sidebar,
        color_accent:  get('color_accent')  || DEFAULT_THEME.color_accent,
        color_main_bg: get('color_main_bg') || DEFAULT_THEME.color_main_bg,
      })
    })

    supabase.from('site_content').select('key,value_ko').eq('page', 'community_channels').then(({ data }) => {
      if (!data?.length) return
      const get = (k: string) => data.find(r => r.key === k)?.value_ko || ''
      const chs: Channel[] = []
      for (let i = 1; i <= 8; i++) {
        const name = get(`ch${i}_name`)
        const icon = get(`ch${i}_icon`)
        const rawHref = get(`ch${i}_href`) || '/board'
        if (!name) break
        const href = CHANNEL_HREF[name] || rawHref
        chs.push({ name, icon, href })
      }
      if (chs.length) setChannels(chs)
    })
  }, [])

  useEffect(() => { setOpen(false) }, [location.pathname])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(s => !s)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const path = location.pathname
  const channelMap = t.channels as Record<string, string>

  const navItems = [
    { icon: '🏠', name: t.nav.home,     href: '/' },
    { icon: '📚', name: t.nav.programs, href: '/programs' },
    { icon: '🐱', name: t.nav.mini,     href: '/activities' },
  ]

  function isActive(href: string) {
    if (href === '/') return path === '/'
    return path === href || path.startsWith(href + '/')
  }

  return (
    <>
      <SiteDetails />
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}

      <div className="app-shell">
        {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

        <aside className={`app-sidebar${open ? ' open' : ''}`}>
          {/* Logo */}
          <div className="sidebar-logo">
            <a href="/" className="sidebar-logo-link">
              <div className="sidebar-logo-mark">H</div>
              <div>
                <div className="sidebar-wordmark">HAKKYO</div>
                <div className="sidebar-city">MONTRÉAL · 2026</div>
              </div>
            </a>
          </div>

          {/* Search button */}
          <div className="sidebar-search-btn" onClick={() => setSearchOpen(true)}>
            <span style={{ fontSize: 13 }}>🔍</span>
            <span style={{ flex: 1 }}>{t.search.label}</span>
            <span className="sidebar-search-kbd">{t.search.kbd}</span>
          </div>

          {/* Main nav */}
          <nav className="sidebar-section">
            <div className="sidebar-section-label">{t.section.main}</div>
            {navItems.map(item => (
              <a key={item.href} href={item.href}
                className={`sidebar-item${isActive(item.href) ? ' active' : ''}`}>
                <span className="sidebar-item-icon">{item.icon}</span>
                <span>{item.name}</span>
              </a>
            ))}
          </nav>

          <div className="sidebar-divider" />

          {/* Community channels */}
          <nav className="sidebar-section">
            <div className="sidebar-section-label">{t.section.community}</div>
            {channels.map((ch, i) => (
              <a key={i} href={ch.href}
                className={`sidebar-item${isActive(ch.href) ? ' active' : ''}`}>
                <span className="sidebar-item-icon sidebar-ch-hash">#</span>
                <span>{channelMap[ch.name] || ch.name}</span>
              </a>
            ))}
          </nav>

          {/* Language switcher */}
          <div className="sidebar-lang-switcher">
            {LANG_LABELS.map(l => (
              <button
                key={l.code}
                className={`lang-btn${lang === l.code ? ' active' : ''}`}
                onClick={() => setLang(l.code)}
              >{l.label}</button>
            ))}
          </div>

          {/* Footer */}
          <div className="sidebar-footer">
            <a href="/apply/community" className="sidebar-footer-cta">{t.footer.apply}</a>
            <div className="sidebar-footer-links">
              <a href="/apply/news" className="sidebar-footer-link">{t.footer.subscribe}</a>
            </div>
          </div>
        </aside>

        <main className="app-main">
          {/* Mobile topbar */}
          <div className="mobile-topbar">
            <button className="mobile-menu-btn" onClick={() => setOpen(true)}>☰</button>
            <span className="mobile-logo">HAKKYO</span>
            <button className="mobile-search-btn" onClick={() => setSearchOpen(true)}>🔍</button>
          </div>
          {children}
        </main>
      </div>
    </>
  )
}

// Export for pages to use in ch-header search slot
export function HeaderSearch() {
  const [searchOpen, setSearchOpen] = useState(false)
  const t = useT()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(s => !s)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
      <button className="header-search-btn" onClick={() => setSearchOpen(true)}>
        <span>🔍</span>
        <span className="header-search-label">{t.search.label}</span>
        <kbd className="header-search-kbd">{t.search.kbd}</kbd>
      </button>
    </>
  )
}
