import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
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

interface SearchResult { icon: string; title: string; sub: string; href: string }

function buildSearchIndex(lang: Lang, channels: Channel[]): SearchResult[] {
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
    icon: p.mark || '📚', title: p.lang,
    sub: `${p.level} · SESSION 04`, href: p.href,
  }))
  activities.forEach(a => results.push({
    icon: '🐱', title: a.ko,
    sub: `Mini HAKKYO · ${(a as any).date || ''}`, href: `/activities/${a.slug}`,
  }))
  const channelMap = UI[lang].channels as Record<string, string>
  channels.filter(c => c.slug !== 'board').forEach(ch => {
    results.push({
      icon: ch.icon,
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

// ── Main layout ────────────────────────────────────────────────────────────
export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { user } = useAuth()
  const [channels, setChannels] = useState<Channel[]>(DEFAULT_CHANNELS)
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === '1' } catch { return false }
  })
  const [searchOpen, setSearchOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const { lang, setLang } = useLang()
  const t = useT()

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

  const navItems = [
    { icon: '🏠', name: t.nav.home,     href: '/' },
    { icon: '📚', name: t.nav.programs, href: '/programs' },
    { icon: '🐱', name: t.nav.mini,     href: '/activities' },
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

  return (
    <>
      <SiteDetails />
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
            <a href="/" className="sidebar-logo-link">
              <div className="sidebar-logo-mark">H</div>
              {!collapsed && (
                <div>
                  <div className="sidebar-wordmark">HAKKYO</div>
                  <div className="sidebar-city">MONTRÉAL · 2026</div>
                </div>
              )}
            </a>
            <button className="sidebar-collapse-btn" onClick={toggleCollapsed} title={collapsed ? '사이드바 열기' : '사이드바 닫기'}>
              {collapsed ? '›' : '‹'}
            </button>
          </div>

          {/* Search button */}
          {!collapsed && (
            <div className="sidebar-search-btn" onClick={() => setSearchOpen(true)}>
              <span style={{ fontSize: 13 }}>🔍</span>
              <span style={{ flex: 1 }}>{t.search.label}</span>
              <span className="sidebar-search-kbd">{t.search.kbd}</span>
            </div>
          )}
          {collapsed && (
            <button className="sidebar-icon-btn" onClick={() => setSearchOpen(true)} title={t.search.label}>🔍</button>
          )}

          {/* Main nav */}
          <nav className="sidebar-section">
            {!collapsed && <div className="sidebar-section-label">{t.section.main}</div>}
            {navItems.map(item => (
              <a key={item.href} href={item.href}
                className={`sidebar-item${isActive(item.href) ? ' active' : ''}${collapsed ? ' icon-only' : ''}`}
                data-tooltip={item.name}>
                <span className="sidebar-item-icon">{item.icon}</span>
                {!collapsed && <span>{item.name}</span>}
              </a>
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
                  <a href={href} className={`sidebar-item sidebar-ch-item${isActive(href) ? ' active' : ''}${collapsed ? ' icon-only' : ''}`}
                    data-tooltip={channelMap[ch.name] || ch.name}>
                    <span className="sidebar-item-icon sidebar-ch-hash">{ch.icon || '#'}</span>
                    {!collapsed && <span>{channelMap[ch.name] || ch.name}</span>}
                  </a>
                  {isAdmin && !collapsed && (
                    <button className="sidebar-ch-delete" onClick={() => handleDeleteChannel(ch)} title="채널 삭제">✕</button>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Footer intentionally empty — apply CTA lives in each channel page */}
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
              <button className="mobile-search-btn" onClick={() => setSearchOpen(true)}>🔍</button>
            </div>
          </div>

          {/* Desktop global topbar */}
          <div className="global-topbar">
            <button className="global-search-btn" onClick={() => setSearchOpen(true)}>
              <span>🔍</span>
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
