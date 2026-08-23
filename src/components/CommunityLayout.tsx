import { useState, useEffect, useRef } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import SiteDetails from './SiteDetails'
import { programs, activities } from '../data/hakkyo'
import { useLang, useT, UI } from '../lib/lang'
import type { Lang } from '../lib/lang'
import {
  getChannels, createChannel, deleteChannel,
  type Channel, ADMIN_EMAILS,
} from '../lib/channels'
import {
  House, Books, Cat,
  Megaphone, Star, Chat, Globe, Buildings, Briefcase, CalendarBlank,
  MagnifyingGlass, Hash, Bell, Handshake, type Icon,
} from '@phosphor-icons/react'

const CHANNEL_ICON: Record<string, Icon> = {
  board:    Megaphone,
  reviews:  Star,
  chat:     Chat,
  exchange: Globe,
  housing:  Buildings,
  jobs:     Briefcase,
  events:   CalendarBlank,
}

function ChanIcon({ slug, size = 15 }: { slug: string; size?: number }) {
  const Ic = CHANNEL_ICON[slug] || Hash
  return <Ic size={size} weight="bold" />
}

// href mapping for special channels
function slugToHref(slug: string) {
  return slug === 'board' ? '/board' : `/community/${slug}`
}

const DEFAULT_CHANNELS: Channel[] = [
  { id: 'board',    slug: 'board',    icon: '📢', name: '공지',       description: '', sort_order: 0 },
  { id: 'reviews',  slug: 'reviews',  icon: '⭐', name: '리뷰',       description: '', sort_order: 1 },
  { id: 'chat',     slug: 'chat',     icon: '💬', name: '자유게시판', description: '', sort_order: 2 },
  { id: 'exchange', slug: 'exchange', icon: '🌐', name: '언어교환',   description: '', sort_order: 3 },
  { id: 'housing',  slug: 'housing',  icon: '🏠', name: '주거',       description: '', sort_order: 4 },
  { id: 'jobs',     slug: 'jobs',     icon: '💼', name: '취업·이민',  description: '', sort_order: 5 },
  { id: 'events',   slug: 'events',   icon: '📅', name: '이벤트·모임', description: '', sort_order: 6 },
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

type SearchIcon = Icon
interface SearchResult { Icon: SearchIcon; title: string; sub: string; href: string }

function buildSearchIndex(lang: Lang, channels: Channel[]): SearchResult[] {
  const t = UI[lang].searchItems
  const slugIcon: Record<string, Icon> = { board: Megaphone, reviews: Star, chat: Chat, exchange: Globe, housing: Buildings, jobs: Briefcase, events: CalendarBlank }
  const results: SearchResult[] = [
    { Icon: House,     title: t.home[0],           sub: t.home[1],           href: '/' },
    { Icon: Megaphone, title: t.board[0],          sub: t.board[1],          href: '/board' },
    { Icon: Books,     title: t.programs[0],       sub: t.programs[1],       href: '/programs' },
    { Icon: Cat,       title: t.mini[0],           sub: t.mini[1],           href: '/activities' },
    { Icon: Bell,      title: t.applyNews[0],      sub: t.applyNews[1],      href: '/apply/news' },
    { Icon: Handshake, title: t.applyCommunity[0], sub: t.applyCommunity[1], href: '/apply/community' },
  ]
  programs.forEach(p => results.push({
    Icon: Books, title: p.lang,
    sub: `${p.level} · SESSION 04`, href: p.href,
  }))
  activities.forEach(a => results.push({
    Icon: Cat, title: a.ko,
    sub: `Mini HAKKYO · ${(a as any).date || ''}`, href: `/activities/${a.slug}`,
  }))
  const channelMap = UI[lang].channels as Record<string, string>
  channels.filter(c => c.slug !== 'board').forEach(ch => {
    results.push({
      Icon: slugIcon[ch.slug] || Hash,
      title: channelMap[ch.name] || ch.name,
      sub: t.channelSub,
      href: slugToHref(ch.slug),
    })
  })
  return results
}

// ── Search overlay ─────────────────────────────────────────────────────────
function SearchOverlay({
  onClose, channels,
}: { onClose: () => void; channels: Channel[] }) {
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { lang } = useLang()
  const t = useT()
  const index = useRef<SearchResult[]>([])

  useEffect(() => { index.current = buildSearchIndex(lang, channels) }, [lang, channels])
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
          <span className="search-icon-label"><MagnifyingGlass size={15} weight="bold" /></span>
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
            <Link key={i} to={r.href} className="search-result-item" onClick={onClose}>
              <span className="search-result-icon"><r.Icon size={15} weight="bold" /></span>
              <div className="search-result-body">
                <div className="search-result-title">{r.title}</div>
                <div className="search-result-sub">{r.sub}</div>
              </div>
              <span className="search-result-arrow">→</span>
            </Link>
          ))}
        </div>
        {!q && <div className="search-hint">{t.search.hint}</div>}
      </div>
    </div>
  )
}

// ── Create channel modal ───────────────────────────────────────────────────
const CHANNEL_ICONS = ['💬','🌐','🏠','💼','📅','⭐','🎓','🎮','🍱','📸','🎵','🏃','💡','🌱','🤝','🔥']

function CreateChannelModal({
  onClose, onCreated,
}: { onClose: () => void; onCreated: (ch: Channel) => void }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [icon, setIcon] = useState('💬')
  const [desc, setDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function toSlug(v: string) {
    return v.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  async function handleCreate() {
    if (!name.trim()) { setError('채널 이름을 입력해 주세요'); return }
    const s = slug || toSlug(name) || 'channel-' + Date.now()
    setSaving(true); setError('')
    try {
      const ch = await createChannel({ slug: s, name: name.trim(), icon, description: desc.trim(), sort_order: 99 })
      if (ch) { onCreated(ch); onClose() }
    } catch (e: any) {
      setError(e.message || '오류가 발생했어요')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">채널 만들기</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Icon picker */}
          <div className="ch-create-icon-grid">
            {CHANNEL_ICONS.map(ic => (
              <button key={ic}
                className={`ch-create-icon-btn${icon === ic ? ' sel' : ''}`}
                onClick={() => setIcon(ic)}>{ic}</button>
            ))}
          </div>

          <label className="modal-label">채널 이름</label>
          <input
            className="modal-input"
            placeholder="예: 자유게시판, 취업 정보, 사진 공유…"
            value={name}
            onChange={e => { setName(e.target.value); setSlug(toSlug(e.target.value)) }}
          />

          <label className="modal-label">URL 슬러그 <span className="modal-label-sub">/community/…</span></label>
          <input
            className="modal-input"
            placeholder="예: chat, jobs, photos"
            value={slug}
            onChange={e => setSlug(toSlug(e.target.value))}
          />

          <label className="modal-label">채널 설명 <span className="modal-label-sub">(선택)</span></label>
          <input
            className="modal-input"
            placeholder="채널에 대해 간단히 설명해 주세요"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />

          {error && <div className="modal-error">{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="modal-cancel-btn" onClick={onClose}>취소</button>
          <button className="modal-create-btn" onClick={handleCreate} disabled={saving}>
            {saving ? '만드는 중…' : `${icon} 채널 만들기`}
          </button>
        </div>
      </div>
    </div>
  )
}

const LANG_LABELS: { code: Lang; label: string }[] = [
  { code: 'ko', label: '한' },
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
]

// ── Sidebar tooltip (fixed-position, not clipped by overflow) ──────────────
function SidebarTooltip({ text, anchorRef }: { text: string; anchorRef: HTMLElement | null }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  useEffect(() => {
    if (!anchorRef) { setPos(null); return }
    const rect = anchorRef.getBoundingClientRect()
    setPos({ top: rect.top + rect.height / 2, left: rect.right + 10 })
  }, [anchorRef])
  if (!pos || !text) return null
  return (
    <div style={{
      position: 'fixed', top: pos.top, left: pos.left,
      transform: 'translateY(-50%)',
      background: '#1e1e2e', color: '#e8e8f0',
      fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
      padding: '6px 12px', borderRadius: 9,
      border: '1px solid rgba(255,255,255,.1)',
      boxShadow: '0 4px 16px rgba(0,0,0,.35)',
      pointerEvents: 'none', zIndex: 99999,
      animation: 'tooltipIn .15s ease forwards',
    }}>
      <span style={{
        position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)',
        borderWidth: 5, borderStyle: 'solid',
        borderColor: 'transparent #1e1e2e transparent transparent',
        width: 0, height: 0,
      }} />
      {text}
    </div>
  )
}

// ── Main layout ────────────────────────────────────────────────────────────
export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [channels, setChannels] = useState<Channel[]>(DEFAULT_CHANNELS)
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === '1' } catch { return false }
  })
  const [searchOpen, setSearchOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const { lang, setLang } = useLang()
  const t = useT()
  const [tooltip, setTooltip] = useState<{ text: string; el: HTMLElement } | null>(null)

  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email)

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

    // Load from new channels table
    getChannels().then(chs => {
      if (chs.length > 0) setChannels(chs)
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

  const navItems: { Ic: Icon; name: string; href: string }[] = [
    { Ic: House,  name: t.nav.home,     href: '/' },
    { Ic: Books,  name: t.nav.programs, href: '/programs' },
    { Ic: Cat,    name: t.nav.mini,     href: '/activities' },
  ]

  function isActive(href: string) {
    if (href === '/') return path === '/'
    return path === href || path.startsWith(href + '/')
  }

  function handleChannelCreated(ch: Channel) {
    setChannels(prev => [...prev, ch].sort((a, b) => a.sort_order - b.sort_order))
  }

  function toggleCollapsed() {
    setCollapsed(c => {
      const next = !c
      try { localStorage.setItem('sidebar-collapsed', next ? '1' : '0') } catch {}
      return next
    })
  }

  async function handleDeleteChannel(ch: Channel) {
    if (!confirm(`"${ch.name}" 채널을 삭제할까요?`)) return
    setChannels(prev => prev.filter(c => c.id !== ch.id))
    await deleteChannel(ch.id)
  }

  const showTip = (e: React.MouseEvent<HTMLElement>, text: string) =>
    setTooltip({ text, el: e.currentTarget })
  const hideTip = () => setTooltip(null)

  return (
    <>
      <SiteDetails />
      {tooltip && <SidebarTooltip text={tooltip.text} anchorRef={tooltip.el} />}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} channels={channels} />}
      {createOpen && (
        <CreateChannelModal
          onClose={() => setCreateOpen(false)}
          onCreated={handleChannelCreated}
        />
      )}

      <div className={`app-shell${collapsed ? ' sidebar-collapsed' : ''}`}>
        {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

        <aside className={`app-sidebar${open ? ' open' : ''}${collapsed ? ' collapsed' : ''}`}>
          {/* Logo */}
          <div className="sidebar-logo">
            <Link to="/" className="sidebar-logo-link">
              <div className="sidebar-logo-mark">H</div>
              {!collapsed && (
                <div>
                  <div className="sidebar-wordmark">HAKKYO</div>
                  <div className="sidebar-city">MONTRÉAL · 2026</div>
                </div>
              )}
            </Link>
            <button className="sidebar-collapse-btn" onClick={toggleCollapsed} title={collapsed ? '사이드바 열기' : '사이드바 닫기'}>
              {collapsed ? '›' : '‹'}
            </button>
          </div>

          {/* Search button */}
          {!collapsed && (
            <div className="sidebar-search-btn" onClick={() => setSearchOpen(true)}>
              <MagnifyingGlass size={13} weight="bold" />
              <span style={{ flex: 1 }}>{t.search.label}</span>
              <span className="sidebar-search-kbd">{t.search.kbd}</span>
            </div>
          )}
          {collapsed && (
            <button className="sidebar-icon-btn" onClick={() => setSearchOpen(true)} title={t.search.label}><MagnifyingGlass size={15} weight="bold" /></button>
          )}

          {/* Main nav */}
          <nav className="sidebar-section">
            {!collapsed && <div className="sidebar-section-label">{t.section.main}</div>}
            {navItems.map(item => (
              <Link key={item.href} to={item.href}
                className={`sidebar-item${isActive(item.href) ? ' active' : ''}${collapsed ? ' icon-only' : ''}`}
                onMouseEnter={e => showTip(e, item.name)}
                onMouseLeave={hideTip}>
                <span className="sidebar-item-icon"><item.Ic size={16} weight="bold" /></span>
                {!collapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </nav>

          <div className="sidebar-divider" />

          {/* Community channels */}
          <nav className="sidebar-section sidebar-channels-section">
            {!collapsed && (
              <div className="sidebar-section-label" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span>{t.section.community}</span>
                {isAdmin && (
                  <button className="sidebar-add-ch-btn" onClick={() => setCreateOpen(true)} title="채널 추가">+</button>
                )}
              </div>
            )}
            {collapsed && isAdmin && (
              <button className="sidebar-icon-btn" onClick={() => setCreateOpen(true)} title="채널 추가">+</button>
            )}
            {channels.map((ch) => {
              const href = slugToHref(ch.slug)
              return (
                <div key={ch.id} className={`sidebar-ch-row${collapsed ? ' collapsed' : ''}`}>
                  <Link to={href} className={`sidebar-item sidebar-ch-item${isActive(href) ? ' active' : ''}${collapsed ? ' icon-only' : ''}`}
                    onMouseEnter={e => showTip(e, channelMap[ch.name] || ch.name)}
                    onMouseLeave={hideTip}>
                    <span className="sidebar-item-icon sidebar-ch-hash"><ChanIcon slug={ch.slug} /></span>
                    {!collapsed && <span>{channelMap[ch.name] || ch.name}</span>}
                  </Link>
                  {isAdmin && !collapsed && (
                    <button className="sidebar-ch-delete" onClick={() => handleDeleteChannel(ch)} title="채널 삭제">✕</button>
                  )}
                </div>
              )
            })}
          </nav>

          {/* User profile footer */}
          <div className="sidebar-divider" />
          <div style={{ padding: collapsed ? '8px 4px' : '8px 12px 16px', flexShrink: 0 }}>
            {user ? (
              collapsed ? (
                <button onClick={signOut} title={user.email ?? ''}
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f5c542', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0e0e12' }}>
                    {user.email?.[0]?.toUpperCase() ?? '?'}
                  </div>
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f5c542', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#0e0e12', flexShrink: 0 }}>
                    {user.email?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sidebar-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </div>
                    <button onClick={signOut}
                      style={{ fontSize: 11, color: '#888', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginTop: 2 }}>
                      로그아웃
                    </button>
                  </div>
                </div>
              )
            ) : (
              <Link to="/login"
                style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 8, padding: '8px 4px', fontSize: 13, fontWeight: 600, color: '#888', textDecoration: 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2a2a35', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#555' }}>?</div>
                {!collapsed && <span>로그인</span>}
              </Link>
            )}
          </div>
        </aside>

        <main className="app-main">
          {/* Mobile topbar */}
          <div className="mobile-topbar">
            <button className="mobile-menu-btn" onClick={() => setOpen(true)}>☰</button>
            <span className="mobile-logo">HAKKYO</span>
            <div className="mobile-topbar-right">
              {LANG_LABELS.map(l => (
                <button key={l.code} className={`lang-btn-mobile${lang === l.code ? ' active' : ''}`} onClick={() => setLang(l.code)}>{l.label}</button>
              ))}
              <button className="mobile-search-btn" onClick={() => setSearchOpen(true)}><MagnifyingGlass size={16} weight="bold" /></button>
            </div>
          </div>

          {/* Desktop global topbar */}
          <div className="global-topbar">
            <button className="global-search-btn" onClick={() => setSearchOpen(true)}>
              <MagnifyingGlass size={14} weight="bold" />
              <span className="global-search-label">{t.search.label}</span>
              <kbd className="global-search-kbd">{t.search.kbd}</kbd>
            </button>
            <div className="global-lang-switcher">
              {LANG_LABELS.map(l => (
                <button key={l.code} className={`glang-btn${lang === l.code ? ' active' : ''}`} onClick={() => setLang(l.code)}>{l.label}</button>
              ))}
            </div>
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
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} channels={DEFAULT_CHANNELS} />}
      <button className="header-search-btn" onClick={() => setSearchOpen(true)}>
        <span>🔍</span>
        <span className="header-search-label">{t.search.label}</span>
        <kbd className="header-search-kbd">{t.search.kbd}</kbd>
      </button>
    </>
  )
}
