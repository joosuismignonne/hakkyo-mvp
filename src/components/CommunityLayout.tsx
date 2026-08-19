import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SiteDetails from './SiteDetails'
import { programs, activities } from '../data/hakkyo'

interface Channel { icon: string; name: string; href: string }

// Name → href 매핑: Supabase 구형 데이터의 /board 를 덮어씀
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
  color_main_bg: '#fafaf7',
}

function applyTheme(t: typeof DEFAULT_THEME) {
  const r = document.documentElement
  r.style.setProperty('--sidebar-bg', t.color_sidebar)
  r.style.setProperty('--sidebar-accent', t.color_accent)
  r.style.setProperty('--main-bg', t.color_main_bg)
}

interface SearchResult { icon: string; title: string; sub: string; href: string }

function buildSearchIndex(): SearchResult[] {
  const results: SearchResult[] = [
    { icon: '🏠', title: '홈',        sub: 'HAKKYO 메인',               href: '/' },
    { icon: '📢', title: '공지',      sub: 'HAKKYO 공식 소식',           href: '/board' },
    { icon: '📚', title: '프로그램',  sub: 'SESSION 04 언어 프로그램',   href: '/programs' },
    { icon: '🐱', title: 'Mini HAKKYO', sub: '매주 수요일 클럽',        href: '/activities' },
    { icon: '🔔', title: '소식 신청', sub: '4기 소식 먼저 받기',        href: '/apply/news' },
    { icon: '🤝', title: '커뮤니티 신청', sub: 'HAKKYO 커뮤니티 합류', href: '/apply/community' },
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
  DEFAULT_CHANNELS.slice(1).forEach(ch => results.push({
    icon: ch.icon,
    title: ch.name,
    sub: '커뮤니티 채널',
    href: ch.href,
  }))
  return results
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const index = useRef(buildSearchIndex())

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
            placeholder="검색 — 프로그램, 채널, 클럽…"
          />
          <button className="search-close-btn" onClick={onClose}>Esc</button>
        </div>
        <div className="search-results">
          {results.length === 0 && (
            <div className="search-empty">"{q}"에 대한 결과가 없어요</div>
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
        {!q && (
          <div className="search-hint">자주 찾는 페이지 · ↵ 로 이동</div>
        )}
      </div>
    </div>
  )
}

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [channels, setChannels] = useState<Channel[]>(DEFAULT_CHANNELS)
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

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
        // 이름으로 올바른 href 매핑 (Supabase 구형 데이터 /board 자동 수정)
        const href = CHANNEL_HREF[name] || rawHref
        chs.push({ name, icon, href })
      }
      if (chs.length) setChannels(chs)
    })
  }, [])

  useEffect(() => { setOpen(false) }, [location.pathname])

  // cmd+k / ctrl+k 단축키로 검색
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

  const navItems = [
    { icon: '🏠', name: '홈', href: '/' },
    { icon: '📚', name: '프로그램', href: '/programs' },
    { icon: '🐱', name: 'Mini HAKKYO', href: '/activities' },
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
            <span style={{ fontSize:13 }}>🔍</span>
            <span style={{ flex:1 }}>검색</span>
            <span className="sidebar-search-kbd">⌘K</span>
          </div>

          {/* Main nav */}
          <nav className="sidebar-section">
            <div className="sidebar-section-label">메인</div>
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
            <div className="sidebar-section-label">커뮤니티</div>
            {channels.map((ch, i) => (
              <a key={i} href={ch.href}
                className={`sidebar-item${isActive(ch.href) ? ' active' : ''}`}>
                <span className="sidebar-item-icon" style={{ fontSize:12 }}>#</span>
                <span>{ch.name}</span>
              </a>
            ))}
          </nav>

          {/* Footer */}
          <div className="sidebar-footer">
            <a href="/apply/community" className="sidebar-footer-cta">
              ✋ 커뮤니티 신청
            </a>
            <div className="sidebar-footer-links">
              <a href="/apply/news" className="sidebar-footer-link">🔔 소식 받기</a>
              <a href="/admin" className="sidebar-footer-link">어드민</a>
            </div>
          </div>
        </aside>

        <main className="app-main">
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
