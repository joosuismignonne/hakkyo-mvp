import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang, useT, pick } from '../lib/lang'
import type { Lang } from '../lib/lang'
import {
  getChannelPosts, createPost, deletePost, togglePin, isAdminEmail,
  type ChannelPost,
} from '../lib/posts'

// ── Relative time ──────────────────────────────────────────────────────────
function relTime(iso: string, lang: Lang): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return lang === 'ko' ? '방금' : lang === 'fr' ? "à l'instant" : 'just now'
  if (m < 60) return lang === 'ko' ? `${m}분 전` : lang === 'fr' ? `il y a ${m} min` : `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return lang === 'ko' ? `${h}시간 전` : lang === 'fr' ? `il y a ${h}h` : `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return lang === 'ko' ? `${d}일 전` : lang === 'fr' ? `il y a ${d}j` : `${d}d ago`
  const date = new Date(iso)
  return `${date.getMonth()+1}/${date.getDate()}`
}

// ── Share helper ───────────────────────────────────────────────────────────
function sharePost(channel: string, postId: string) {
  const url = `${window.location.origin}/community/${channel}?post=${postId}`
  if (navigator.share) {
    navigator.share({ url }).catch(() => {})
  } else {
    navigator.clipboard.writeText(url).then(() => {
      // brief toast
      const t = document.createElement('div')
      t.textContent = '링크 복사됨'
      t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#11110f;color:#fff;padding:8px 18px;border-radius:99px;font-size:13px;z-index:9999;pointer-events:none'
      document.body.appendChild(t)
      setTimeout(() => t.remove(), 2000)
    })
  }
}

// ── Avatar component ───────────────────────────────────────────────────────
function Avatar({ avatar, size = 36 }: { avatar: string; size?: number }) {
  const isEmoji = [...avatar].length <= 2 && /\p{Emoji}/u.test(avatar)
  return (
    <div className="post-avatar" style={{ width: size, height: size, fontSize: size * 0.5 }}>
      {isEmoji ? avatar : <span style={{ fontSize: size * 0.45, fontWeight: 700 }}>{avatar.slice(0,2).toUpperCase()}</span>}
    </div>
  )
}

// ── Single post card ───────────────────────────────────────────────────────
function PostCard({
  post, isAdmin, onDelete, onPin, channel,
}: {
  post: ChannelPost
  isAdmin: boolean
  onDelete: (id: string) => void
  onPin: (id: string, pinned: boolean) => void
  channel: string
}) {
  const [open, setOpen] = useState(false)
  const [liked, setLiked] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [shared, setShared] = useState(false)
  const { lang } = useLang()
  const t = useT()

  const title = pick({ ko: post.title_ko, en: post.title_en, fr: post.title_fr }, lang)
  const body  = pick({ ko: post.body_ko,  en: post.body_en,  fr: post.body_fr  }, lang)
  const preview = body.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0, 180)
  const hasMore = body.replace(/<[^>]+>/g,'').length > 180
  const hasBody = !!body

  function handleShare() {
    sharePost(channel, post.id)
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  return (
    <div className={`feed-card${post.is_pinned ? ' feed-card-pinned' : ''}`}>
      {post.is_pinned && (
        <div className="feed-pin-bar">
          <span className="feed-pin-dot" />
          {t.home.pinned}
        </div>
      )}
      <div className="feed-card-inner">
        {/* Author row */}
        <div className="feed-meta">
          <Avatar avatar={post.author_avatar} size={36} />
          <div className="feed-meta-text">
            <span className="feed-author">{post.author_name}</span>
            <span className="feed-time">{relTime(post.created_at, lang)}</span>
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
          <div className="feed-body">
            <p>{preview}{hasMore ? '…' : ''}</p>
          </div>
        )}
        {open && body && (
          <div className="feed-body" dangerouslySetInnerHTML={{ __html: body }} />
        )}

        <div className="feed-footer">
          <button className={`feed-action${liked ? ' liked' : ''}`} onClick={() => setLiked(l => !l)}>
            {liked ? '❤️' : '🤍'} {t.home.like}
          </button>
          {hasMore && (
            <button className="feed-action" onClick={() => setOpen(o => !o)}>
              💬 {open ? t.home.collapse : t.home.readMore}
            </button>
          )}
          <button className={`feed-action${shared ? ' shared' : ''}`} onClick={handleShare}>
            {shared ? '✅' : '🔗'} {lang === 'ko' ? '공유' : lang === 'fr' ? 'Partager' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Admin compose box ──────────────────────────────────────────────────────
const COMPOSE_AVATARS = ['🐱', '😸', '🎓', '📚', '🌍', '🇰🇷', '🇨🇦', 'H']

function AdminCompose({
  channel, defaultAuthorName, defaultAvatar, onPosted,
}: {
  channel: string
  defaultAuthorName: string
  defaultAvatar: string
  onPosted: (post: ChannelPost) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [activeLang, setActiveLang] = useState<Lang>('ko')
  const [authorName, setAuthorName] = useState(defaultAuthorName)
  const [titleKo, setTitleKo] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [titleFr, setTitleFr] = useState('')
  const [bodyKo, setBodyKo] = useState('')
  const [bodyEn, setBodyEn] = useState('')
  const [bodyFr, setBodyFr] = useState('')
  const [avatar, setAvatar] = useState(defaultAvatar)
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
        author_name: authorName || defaultAuthorName,
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
    } finally { setSending(false) }
  }

  return (
    <div className={`admin-compose${expanded ? ' expanded' : ''}`}>
      {expanded && (
        <>
          {/* Profile row */}
          <div className="compose-profile-row">
            <div className="compose-avatar-pick">
              <Avatar avatar={avatar} size={32} />
              <div className="compose-avatar-menu">
                {COMPOSE_AVATARS.map(a => (
                  <button key={a} onClick={() => setAvatar(a)} className={avatar === a ? 'sel' : ''}>{a}</button>
                ))}
              </div>
            </div>
            <input
              className="compose-name-input"
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
              placeholder="닉네임"
            />
          </div>

          {/* Lang tabs */}
          <div className="compose-lang-tabs">
            {(['ko','en','fr'] as Lang[]).map(l => (
              <button key={l} className={`compose-lang-tab${activeLang === l ? ' active' : ''}`}
                onClick={() => setActiveLang(l)}>
                {l === 'ko' ? '한' : l === 'en' ? 'EN' : 'FR'}
              </button>
            ))}
            <span className="compose-lang-hint">
              {activeLang === 'ko' ? '한국어' : activeLang === 'en' ? 'English' : 'Français'}
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
        {!expanded && <Avatar avatar={avatar} size={32} />}

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
              <button className={`compose-pin-btn${pinned ? ' active' : ''}`}
                onClick={() => setPinned(p => !p)} title="공지로 고정">📌</button>
              <button className="compose-cancel-btn" onClick={() => setExpanded(false)}>✕</button>
            </>
          )}
          <button className="compose-send-btn" onClick={handleSend} disabled={sending}>
            {sending ? '…' : '↑'}
          </button>
        </div>
      </div>

      {error && <div className="compose-error">{error}</div>}
      {expanded && (
        <div className="compose-hint">
          EN/FR 탭으로 다국어 버전 작성 가능 · 📌 누르면 공지 고정
        </div>
      )}
    </div>
  )
}

// ── Main ChannelFeed ───────────────────────────────────────────────────────
interface ChannelFeedProps {
  channel: string
  header: React.ReactNode
  children?: React.ReactNode
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

  function handlePosted(post: ChannelPost) { setPosts(prev => [post, ...prev]) }
  function handleDelete(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id))
    deletePost(id).catch(console.error)
  }
  function handlePin(id: string, pinned: boolean) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, is_pinned: pinned } : p))
    togglePin(id, pinned).catch(console.error)
  }

  const sorted = [...posts].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const displayName = user?.email?.split('@')[0] ?? 'Admin'

  return (
    <div className="ch-feed">
      {header}
      <div className="ch-scroll">
        <div className="ch-inner">
          {!loading && sorted.map(post => (
            <PostCard
              key={post.id}
              post={post}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onPin={handlePin}
              channel={channel}
            />
          ))}
          {children}
        </div>
      </div>

      {isAdmin && (
        <AdminCompose
          channel={channel}
          defaultAuthorName={displayName}
          defaultAvatar="🐱"
          onPosted={handlePosted}
        />
      )}
    </div>
  )
}
