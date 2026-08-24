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

const THEME_CACHE_KEY = 'hakkyo_theme'

function applyTheme(t: typeof DEFAULT_THEME) {
  const r = document.documentElement
  r.style.setProperty('--sidebar-bg', t.color_sidebar)
  r.style.setProperty('--sidebar-accent', t.color_accent)
  r.style.setProperty('--main-bg', t.color_main_bg)
}

function getCachedTheme(): typeof DEFAULT_THEME | null {
  try { return JSON.parse(localStorage.getItem(THEME_CACHE_KEY) || 'null') } catch { return null }
}

function setCachedTheme(t: typeof DEFAULT_THEME) {
  try { localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(t)) } catch {}
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
      title: channelMap[ch.slug] || ch.name,
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

// ── Sidebar chat trigger ───────────────────────────────────────────────────
import { createPortal } from 'react-dom'

function SidebarChatTrigger({ collapsed }: { collapsed: boolean }) {
  const { lang } = useLang()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ bottom: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  const WEBHOOK = (import.meta as any).env?.VITE_DISCORD_WEBHOOK as string | undefined

  function openPanel() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ bottom: window.innerHeight - r.bottom, left: r.right + 10 })
    }
    setOpen(true)
  }

  async function handleSend() {
    if (!email.trim() || !msg.trim()) return
    setStatus('sending')
    try {
      if (!WEBHOOK) throw new Error('no webhook')
      await fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [{ title: '💬 HAKKYO 문의', color: 0x6C63FF, fields: [{ name: '이메일', value: email }, { name: '메세지', value: msg }], timestamp: new Date().toISOString() }] }),
      })
      setStatus('success')
    } catch { setStatus('error') }
  }

  const label = lang === 'fr' ? 'Des questions ?' : lang === 'en' ? 'Any questions?' : '궁금한 점이 있으신가요?'

  return (
    <>
      <button ref={btnRef} onClick={openPanel}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: collapsed ? '8px' : '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sidebar-fg, #ccc)', fontSize: 13, fontWeight: 500, width: '100%', borderRadius: 8, transition: 'background .15s', justifyContent: collapsed ? 'center' : 'flex-start' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.07)') }
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        title={label}
      >
        <span style={{ fontSize: 16 }}>🐱</span>
        {!collapsed && <span>{label}</span>}
      </button>

      {open && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 8999 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'fixed', bottom: pos.bottom, left: pos.left, zIndex: 9000, width: 300, background: '#141418', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,.5)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>JOO에게 메세지 남기기</span>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>
            {status === 'success' ? (
              <div style={{ padding: 20, color: '#aaa', fontSize: 13, textAlign: 'center' }}>메세지를 보냈어요! 곧 답변드릴게요 🐱</div>
            ) : (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 12, color: '#888', margin: 0, lineHeight: 1.5 }}>궁금한 점이 있으시면 메세지를 남겨주세요. JOO가 확인 후 답변드릴게요!</p>
                <input className="chat-input" type="email" placeholder="이메일 주소" value={email} onChange={e => setEmail(e.target.value)} disabled={status === 'sending'} />
                <textarea className="chat-input chat-textarea" placeholder="메세지를 입력하세요…" value={msg} onChange={e => setMsg(e.target.value)} disabled={status === 'sending'} rows={3} />
                {status === 'error' && <p style={{ color: '#f87171', fontSize: 12, margin: 0 }}>전송에 실패했어요. 다시 시도해주세요.</p>}
                <button className="chat-send-btn" onClick={handleSend} disabled={status === 'sending'}>{status === 'sending' ? '전송 중…' : '보내기'}</button>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </>
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
  const [nickname, setNickname] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [editNickname, setEditNickname] = useState('')
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email)

  useEffect(() => {
    // Apply cached theme immediately to prevent flash
    applyTheme(getCachedTheme() ?? DEFAULT_THEME)
    if (!supabase) return

    supabase.from('site_content').select('key,value_ko').eq('page', 'theme').then(({ data }) => {
      if (!data?.length) return
      const get = (k: string) => data.find(r => r.key === k)?.value_ko
      const theme = {
        color_sidebar: get('color_sidebar') || DEFAULT_THEME.color_sidebar,
        color_accent:  get('color_accent')  || DEFAULT_THEME.color_accent,
        color_main_bg: get('color_main_bg') || DEFAULT_THEME.color_main_bg,
      }
      applyTheme(theme)
      setCachedTheme(theme)
    })

    // Load from new channels table
    getChannels().then(chs => {
      if (chs.length > 0) setChannels(chs)
    })
  }, [])

  useEffect(() => {
    if (!user || !supabase) return
    supabase.from('profiles').select('nickname,avatar_url').eq('id', user.id).single().then(({ data }) => {
      if (data?.nickname) setNickname(data.nickname)
      if (data?.avatar_url) setAvatarUrl(data.avatar_url)
    })
  }, [user])

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
                    onMouseEnter={e => showTip(e, channelMap[ch.slug] || ch.name)}
                    onMouseLeave={hideTip}>
                    <span className="sidebar-item-icon sidebar-ch-hash"><ChanIcon slug={ch.slug} /></span>
                    {!collapsed && <span>{channelMap[ch.slug] || ch.name}</span>}
                  </Link>
                  {isAdmin && !collapsed && (
                    <button className="sidebar-ch-delete" onClick={() => handleDeleteChannel(ch)} title="채널 삭제">✕</button>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Chat widget trigger */}
          <SidebarChatTrigger collapsed={collapsed} />

          {/* User profile footer */}
          <div className="sidebar-divider" />
          <div style={{ padding: collapsed ? '8px 4px 0' : '8px 12px 0', flexShrink: 0 }}>
            {user ? (
              collapsed ? (
                <button onClick={() => { setEditNickname(nickname); setEditAvatarUrl(avatarUrl); setProfileOpen(true) }} title={nickname || user.email || ''}
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '8px 8px 12px', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: avatarUrl ? 'transparent' : '#f5c542', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0e0e12', overflow: 'hidden' }}>
                    {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (nickname || user.email || '?')[0].toUpperCase()}
                  </div>
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px 12px', cursor: 'pointer' }}
                  onClick={() => { setEditNickname(nickname); setEditAvatarUrl(avatarUrl); setProfileOpen(true) }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: avatarUrl ? 'transparent' : '#f5c542', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#0e0e12', flexShrink: 0, overflow: 'hidden' }}>
                    {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (nickname || user.email || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sidebar-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {nickname || '닉네임 없음'}
                    </div>
                    <div style={{ fontSize: 11, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                      {user.email}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); signOut() }}
                    style={{ fontSize: 11, color: '#666', background: 'none', border: '1px solid #2a2a35', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    로그아웃
                  </button>
                </div>
              )
            ) : (
              <Link to="/login"
                style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 8, padding: '8px 4px 12px', fontSize: 13, fontWeight: 600, color: '#888', textDecoration: 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2a2a35', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#555' }}>?</div>
                {!collapsed && <span>로그인</span>}
              </Link>
            )}
          </div>

          {/* Profile edit modal */}
          <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={async e => {
              const file = e.target.files?.[0]
              if (!file || !user || !supabase) return
              const ext = file.name.split('.').pop() || 'jpg'
              const path = `avatars/${user.id}.${ext}`
              const { error: upErr } = await supabase.storage.from('media').upload(path, file, { upsert: true })
              if (!upErr) {
                const { data } = supabase.storage.from('media').getPublicUrl(path)
                setEditAvatarUrl(data.publicUrl + '?t=' + Date.now())
              } else {
                const reader = new FileReader()
                reader.onload = ev => setEditAvatarUrl(ev.target?.result as string)
                reader.readAsDataURL(file)
              }
              e.target.value = ''
            }} />
          {profileOpen && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setProfileOpen(false)}>
              <div style={{ background: '#18181f', borderRadius: 16, padding: '28px 24px', width: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
                onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 20 }}>프로필 수정</div>

                {/* Avatar upload */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <button onClick={() => avatarInputRef.current?.click()}
                    style={{ position: 'relative', width: 72, height: 72, borderRadius: '50%', background: editAvatarUrl ? 'transparent' : '#f5c542', border: 'none', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#0e0e12' }}>
                    {editAvatarUrl
                      ? <img src={editAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (editNickname || user?.email || '?')[0].toUpperCase()}
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                      <span style={{ fontSize: 18 }}>📷</span>
                    </div>
                  </button>
                </div>
                <div style={{ fontSize: 11, color: '#555', textAlign: 'center', marginBottom: 20 }}>사진 클릭해서 변경</div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#888', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>닉네임</label>
                  <input
                    type="text"
                    value={editNickname}
                    onChange={e => setEditNickname(e.target.value)}
                    maxLength={20}
                    placeholder="닉네임 입력"
                    style={{ width: '100%', padding: '10px 14px', background: '#0e0e12', border: '1.5px solid #2a2a35', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#f5c542'}
                    onBlur={e => e.target.style.borderColor = '#2a2a35'}
                  />
                </div>
                <div style={{ fontSize: 11, color: '#555', marginBottom: 20 }}>{user?.email}</div>
                <button
                  disabled={savingProfile || editNickname.trim().length < 2}
                  onClick={async () => {
                    if (!user || !supabase || editNickname.trim().length < 2) return
                    setSavingProfile(true)
                    await supabase.from('profiles').upsert({ id: user.id, nickname: editNickname.trim(), avatar_url: editAvatarUrl || null })
                    setNickname(editNickname.trim())
                    setAvatarUrl(editAvatarUrl)
                    setSavingProfile(false)
                    setProfileOpen(false)
                  }}
                  style={{ width: '100%', padding: '11px', background: savingProfile || editNickname.trim().length < 2 ? '#2a2a35' : '#f5c542', color: savingProfile || editNickname.trim().length < 2 ? '#555' : '#0e0e12', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: savingProfile || editNickname.trim().length < 2 ? 'not-allowed' : 'pointer', marginBottom: 10 }}>
                  {savingProfile ? '저장 중…' : '저장'}
                </button>
                <button onClick={() => setProfileOpen(false)}
                  style={{ width: '100%', padding: '10px', background: 'none', color: '#666', border: '1px solid #2a2a35', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                  취소
                </button>
              </div>
            </div>
          )}
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
