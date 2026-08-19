import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SiteDetails from './SiteDetails'

interface Channel { icon: string; name: string; href: string }

const DEFAULT_CHANNELS: Channel[] = [
  { icon: '📢', name: '공지', href: '/board' },
  { icon: '💬', name: '자유게시판', href: '/community/chat' },
  { icon: '🌐', name: '언어교환', href: '/community/exchange' },
  { icon: '🏠', name: '주거', href: '/community/housing' },
  { icon: '💼', name: '취업·이민', href: '/community/jobs' },
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

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [channels, setChannels] = useState<Channel[]>(DEFAULT_CHANNELS)
  const [open, setOpen] = useState(false)

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
        const href = get(`ch${i}_href`) || '/board'
        if (name) chs.push({ name, icon, href })
      }
      if (chs.length) setChannels(chs)
    })
  }, [])

  useEffect(() => { setOpen(false) }, [location.pathname])

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
      <div className="app-shell">
        {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

        <aside className={`app-sidebar${open ? ' open' : ''}`}>
          <div className="sidebar-logo">
            <a href="/" className="sidebar-logo-link">
              <div className="sidebar-logo-mark">H</div>
              <div>
                <div className="sidebar-wordmark">HAKKYO</div>
                <div className="sidebar-city">MONTRÉAL · 2026</div>
              </div>
            </a>
          </div>

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

          <nav className="sidebar-section">
            <div className="sidebar-section-label">커뮤니티</div>
            {channels.map((ch, i) => (
              <a key={i} href={ch.href}
                className={`sidebar-item${isActive(ch.href) ? ' active' : ''}`}>
                <span className="sidebar-item-icon">{ch.icon}</span>
                <span>{ch.name}</span>
              </a>
            ))}
          </nav>

          <div className="sidebar-footer">
            <a href="/apply/community" className="sidebar-footer-link">커뮤니티 신청</a>
            <a href="/admin" className="sidebar-footer-link">어드민</a>
          </div>
        </aside>

        <main className="app-main">
          <div className="mobile-topbar">
            <button className="mobile-menu-btn" onClick={() => setOpen(true)}>☰</button>
            <span className="mobile-logo">HAKKYO</span>
          </div>
          {children}
        </main>
      </div>
    </>
  )
}
