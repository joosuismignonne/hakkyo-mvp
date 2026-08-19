import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang, useT, pick } from '../lib/lang'
import type { Lang } from '../lib/lang'
import {
  getChannelPosts, createPost, deletePost, togglePin, isAdminEmail,
  type ChannelPost,
} from '../lib/posts'

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtTime(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

// ── Single post card ───────────────────────────────────────────────────────
function PostCard({
  post, isAdmin, onDelete, onPin,
}: {
  post: ChannelPost
  isAdmin: boolean
  onDelete: (id: string) => void
  onPin: (id: string, pinned: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [liked, setLiked] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { lang } = useLang()
  const t = useT()

  const title = pick({ ko: post.title_ko, en: post.title_en, fr: post.title_fr }, lang)
  const body  = pick({ ko: post.body_ko,  en: post.body_en,  fr: post.body_fr  }, lang)
  const preview = body.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0, 140)
  const hasBody = !!body

  return (
    <div className={`feed-card${post.is_pinned ? ' feed-card-pinned' : ''}`}>
      {post.is_pinned && (
        <div className="feed-pin-bar">
          <span className="feed-pin-dot" />
          {t.home.pinned}
        </div>
      )}
      <div className="feed-card-inner">
        <div className="feed-meta">
          <div className="feed-avatar" style={{ fontSize:16, background:'transparent' }}>
            {post.author_avatar}
          </div>
          <div className="feed-meta-text">
            <span className="feed-author">{post.author_name}</span>
            <span className="feed-time">{fmtTime(post.created_at)}</span>
          </div>
          {isAdmin && (
            <div className="post-admin-menu">
              <button className="post-menu-btn" onClick={() => setMenuOpen(m => !m)}>⋯</button>
              {menuOpen && (
                <div className="post-menu-dropdown" onMouseLeave={() => setMenuOpen(false)}>
                  <button onClick={() => { onPin(post.id, !post.is_pinned); setMenuOpen(false) }}>
                    {post.is_pinned ? '📌 unpin' : '📌 pin'}
                  </button>
                  <button className="danger" onClick={() => { if (confirm('삭제할까요?')) { onDelete(post.id); setMenuOpen(false) } }}>
                    🗑 delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {title && (
          <div className="feed-title" onClick={() => hasBody && setOpen(o => !o)}
            style={{ cursor: hasBody ? 'pointer' : 'default' }}>
            {title}
          </div>
        )}
        {!open && preview && (
          <div className="feed-body"><p>{preview}{preview.length >= 140 ? '…' : ''}</p></div>
        )}
        {open && body && (
          <div className="feed-body" dangerouslySetInnerHTML={{ __html: body }} />
        )}

        <div className="feed-footer">
          <button className={`feed-action${liked ? ' liked' : ''}`} onClick={() => setLiked(l => !l)}>
            {liked ? '❤️' : '🤍'} {t.home.like}
          </button>
          {hasBody && (
            <button className="feed-action" onClick={() => setOpen(o => !o)}>
              💬 {open ? t.home.collapse : t.home.readMore}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Admin compose box ──────────────────────────────────────────────────────
const COMPOSE_AVATARS = ['🐱', '😸', '🎓', '📚', '🌍', 'H']

function AdminCompose({
  channel, authorName, onPosted,
}: {
  channel: string
  authorName: string
  onPosted: (post: ChannelPost) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [activeLang, setActiveLang] = useState<Lang>('ko')
  const [titleKo, setTitleKo] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [titleFr, setTitleFr] = useState('')
  const [bodyKo, setBodyKo] = useState('')
  const [bodyEn, setBodyEn] = useState('')
  const [bodyFr, setBodyFr] = useState('')
  const [avatar, setAvatar] = useState('🐱')
  const [pinned, setPinned] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const textRef = useRef<HTMLTextAreaElement>(null)

  const titleVal = activeLang === 'ko' ? titleKo : activeLang === 'en' ? titleEn : titleFr
  const bodyVal  = activeLang === 'ko' ? bodyKo  : activeLang === 'en' ? bodyEn  : bodyFr

  function setTitle(v: string) {
    if (activeLang === 'ko') setTitleKo(v)
    else if (activeLang === 'en') setTitleEn(v)
    else setTitleFr(v)
  }
  function setBody(v: string) {
    if (activeLang === 'ko') setBodyKo(v)
    else if (activeLang === 'en') setBodyEn(v)
    else setBodyFr(v)
  }

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 240) + 'px'
  }

  async function handleSend() {
    if (!bodyKo.trim() && !bodyEn.trim() && !bodyFr.trim()) {
      setError('내용을 입력해 주세요'); return
    }
    setSending(true); setError('')
    try {
      const post = await createPost({
        channel,
        author_name: authorName,
        author_avatar: avatar,
        title_ko: titleKo, title_en: titleEn, title_fr: titleFr,
        body_ko: bodyKo, body_en: bodyEn, body_fr: bodyFr,
        is_pinned: pinned,
      })
      if (post) {
        onPosted(post)
        setTitleKo(''); setTitleEn(''); setTitleFr('')
        setBodyKo('');  setBodyEn('');  setBodyFr('')
        setPinned(false); setExpanded(false)
        if (textRef.current) textRef.current.style.height = 'auto'
      }
    } catch (e: any) {
      setError(e.message || '오류가 발생했어요')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={`admin-compose${expanded ? ' expanded' : ''}`}>
      {expanded && (
        <>
          {/* Lang tabs */}
          <div className="compose-lang-tabs">
            {(['ko','en','fr'] as Lang[]).map(l => (
              <button key={l} className={`compose-lang-tab${activeLang === l ? ' active' : ''}`}
                onClick={() => setActiveLang(l)}>
                {l === 'ko' ? '한' : l === 'en' ? 'EN' : 'FR'}
              </button>
            ))}
            <span className="compose-lang-hint">
              {activeLang === 'ko' ? '한국어 버전 작성' : activeLang === 'en' ? 'English version' : 'Version française'}
            </span>
          </div>

          {/* Title */}
          <input
            className="compose-title-input"
            placeholder="제목 (선택)"
            value={titleVal}
            onChange={e => setTitle(e.target.value)}
          />
        </>
      )}

      <div className="compose-input-row">
        {/* Avatar picker */}
        <div className="compose-avatar-pick">
          <span>{avatar}</span>
          <div className="compose-avatar-menu">
            {COMPOSE_AVATARS.map(a => (
              <button key={a} onClick={() => setAvatar(a)} className={avatar === a ? 'sel' : ''}>{a}</button>
            ))}
          </div>
        </div>

        <div className="compose-body-area">
          <textarea
            ref={textRef}
            className="compose-textarea"
            placeholder={`# ${channel} 채널에 올릴 내용을 입력하세요…`}
            value={bodyVal}
            onChange={e => { setBody(e.target.value); autoGrow(e.target) }}
            onFocus={() => setExpanded(true)}
            rows={1}
          />
        </div>

        <div className="compose-actions">
          {expanded && (
            <>
              <button
                className={`compose-pin-btn${pinned ? ' active' : ''}`}
                onClick={() => setPinned(p => !p)}
                title="공지로 고정"
              >📌</button>
              <button className="compose-cancel-btn" onClick={() => setExpanded(false)}>✕</button>
            </>
          )}
          <button
            className="compose-send-btn"
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? '…' : '↑'}
          </button>
        </div>
      </div>

      {error && <div className="compose-error">{error}</div>}
      {expanded && (
        <div className="compose-hint">
          다른 언어 탭을 선택해서 EN/FR 버전도 작성할 수 있어요 · 📌 누르면 공지로 고정
        </div>
      )}
    </div>
  )
}

// ── Main ChannelFeed ───────────────────────────────────────────────────────
interface ChannelFeedProps {
  channel: string
  header: React.ReactNode
  children?: React.ReactNode  // static content shown before DB posts
}

export default function ChannelFeed({ channel, header, children }: ChannelFeedProps) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<ChannelPost[]>([])
  const [loading, setLoading] = useState(true)
  const isAdmin = isAdminEmail(user?.email)

  useEffect(() => {
    getChannelPosts(channel)
      .then(setPosts)
      .finally(() => setLoading(false))
  }, [channel])

  function handlePosted(post: ChannelPost) {
    setPosts(prev => [post, ...prev])
  }

  function handleDelete(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id))
    deletePost(id).catch(console.error)
  }

  function handlePin(id: string, pinned: boolean) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, is_pinned: pinned } : p))
    togglePin(id, pinned).catch(console.error)
  }

  // Sort: pinned first, then by date
  const sorted = [...posts].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="ch-feed">
      {header}
      <div className="ch-scroll">
        <div className="ch-inner">
          {/* DB posts */}
          {!loading && sorted.map(post => (
            <PostCard
              key={post.id}
              post={post}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onPin={handlePin}
            />
          ))}

          {/* Static/fallback content */}
          {children}
        </div>
      </div>

      {/* Admin compose bar — always visible at bottom for admins */}
      {isAdmin && (
        <AdminCompose
          channel={channel}
          authorName={user?.email?.split('@')[0] ?? 'Admin'}
          onPosted={handlePosted}
        />
      )}
    </div>
  )
}
