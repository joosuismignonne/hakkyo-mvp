import { useState, useEffect, useRef, useCallback } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useAuth } from '../context/AuthContext'
import { useLang, useT, pick } from '../lib/lang'
import type { Lang } from '../lib/lang'
import {
  getChannelPosts, createPost, deletePost, togglePin, isAdminEmail,
  type ChannelPost,
} from '../lib/posts'
import { supabase } from '../lib/supabase'

// Channels where only admins can write (non-admins see a locked state)
export const ADMIN_ONLY_CHANNELS = new Set(['board', 'exchange'])

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

// ── Share ──────────────────────────────────────────────────────────────────
function sharePost(channel: string, postId: string) {
  const url = `${window.location.origin}/community/${channel}?post=${postId}`
  if (navigator.share) {
    navigator.share({ url }).catch(() => {})
  } else {
    navigator.clipboard.writeText(url).then(() => {
      const t = document.createElement('div')
      t.textContent = '링크 복사됨'
      t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#11110f;color:#fff;padding:8px 18px;border-radius:99px;font-size:13px;z-index:9999;pointer-events:none'
      document.body.appendChild(t)
      setTimeout(() => t.remove(), 2000)
    })
  }
}

// ── Avatar ─────────────────────────────────────────────────────────────────
function Avatar({ avatar, size = 36 }: { avatar: string; size?: number }) {
  const isImage = avatar.startsWith('data:') || avatar.startsWith('http')
  const isEmoji = !isImage && [...avatar].length <= 2 && /\p{Emoji}/u.test(avatar)
  return (
    <div className="post-avatar" style={{ width: size, height: size, fontSize: size * 0.5, overflow: 'hidden', padding: 0 }}>
      {isImage
        ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
        : isEmoji
          ? avatar
          : <span style={{ fontSize: size * 0.45, fontWeight: 700 }}>{avatar.slice(0,2).toUpperCase()}</span>
      }
    </div>
  )
}

// ── PostCard ───────────────────────────────────────────────────────────────
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
  const stripped = body.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()
  const hasMore = stripped.length > 200
  const hasBody = !!body
  const hasMedia = /<img|<iframe|youtube/.test(body)

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

        {!open && (
          <div className="feed-body">
            {hasMedia
              ? <div dangerouslySetInnerHTML={{ __html: body }} />
              : <p>{stripped.slice(0, 200)}{hasMore ? '…' : ''}</p>
            }
          </div>
        )}
        {open && body && (
          <div className="feed-body post-rich-body" dangerouslySetInnerHTML={{ __html: body }} />
        )}

        <div className="feed-footer">
          <button className={`feed-action${liked ? ' liked' : ''}`} onClick={() => setLiked(l => !l)}>
            {liked ? '❤️' : '🤍'} {t.home.like}
          </button>
          {(hasMore || hasMedia) && (
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

// ── Rich compose toolbar ───────────────────────────────────────────────────
function ComposeToolbar({ editor, onFileUpload, uploading }: {
  editor: ReturnType<typeof useEditor>
  onFileUpload: (file: File) => Promise<void>
  uploading: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  if (!editor) return null
  const btn = (label: string, title: string, active: boolean, onClick: () => void) => (
    <button type="button" title={title}
      className={`compose-toolbar-btn${active ? ' active' : ''}`}
      onClick={onClick}>{label}</button>
  )
  return (
    <div className="compose-toolbar">
      {btn('B', 'Bold', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run())}
      {btn('I', 'Italic', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run())}
      {btn('•', 'Bullet list', editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run())}
      {btn('"', 'Blockquote', editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run())}
      <span className="compose-toolbar-sep" />
      <button type="button" title="파일 업로드 (이미지·영상)"
        className={`compose-toolbar-btn${uploading ? ' active' : ''}`}
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}>
        {uploading ? '⏳' : '📎'}
      </button>
      <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }}
        onChange={async e => {
          const file = e.target.files?.[0]
          if (file) { await onFileUpload(file); e.target.value = '' }
        }} />
      {btn('🖼', 'Image URL', false, () => {
        const url = window.prompt('이미지 URL을 입력하세요')
        if (url?.trim()) editor.chain().focus().setImage({ src: url.trim() }).run()
      })}
      {btn('▶', 'YouTube URL', false, () => {
        const url = window.prompt('YouTube URL을 입력하세요')
        if (url?.trim()) editor.chain().focus().setYoutubeVideo({ src: url.trim(), width: 640, height: 360 }).run()
      })}
      {btn('🔗', 'Link', editor.isActive('link'), () => {
        const url = window.prompt('링크 URL을 입력하세요')
        if (url?.trim()) editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
      })}
    </div>
  )
}

// ── Admin compose ──────────────────────────────────────────────────────────

function AdminCompose({
  channel, defaultAuthorName, onPosted,
}: {
  channel: string
  defaultAuthorName: string
  onPosted: (post: ChannelPost) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [activeLang, setActiveLang] = useState<Lang>('ko')
  const [authorName, setAuthorName] = useState(defaultAuthorName)
  const [titleKo, setTitleKo] = useState('')
  const [avatar, setAvatar] = useState(() => {
    try { return localStorage.getItem('admin-avatar') || '🐱' } catch { return '🐱' }
  })
  const [pinned, setPinned] = useState(false)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // One editor per language, but only one visible at a time
  const editorKo = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
      Youtube.configure({ width: 640, height: 360 }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: `# ${channel} 채널 — 한국어 내용을 입력하세요` }),
    ],
    content: '',
    editorProps: { attributes: { class: 'compose-rich-editor' } },
  })
  const editorEn = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
      Youtube.configure({ width: 640, height: 360 }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'English content (optional)' }),
    ],
    content: '',
    editorProps: { attributes: { class: 'compose-rich-editor' } },
  })
  const editorFr = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
      Youtube.configure({ width: 640, height: 360 }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Contenu en français (facultatif)' }),
    ],
    content: '',
    editorProps: { attributes: { class: 'compose-rich-editor' } },
  })

  const activeEditor = activeLang === 'ko' ? editorKo : activeLang === 'en' ? editorEn : editorFr

  const handleFileUpload = useCallback(async (file: File) => {
    const editor = activeLang === 'ko' ? editorKo : activeLang === 'en' ? editorEn : editorFr
    if (!editor) return
    if (!supabase) {
      const reader = new FileReader()
      reader.onload = ev => {
        const src = ev.target?.result as string
        if (file.type.startsWith('video/')) {
          editor.chain().focus().insertContent(`<p><video src="${src}" controls style="max-width:100%"></video></p>`).run()
        } else {
          editor.chain().focus().setImage({ src }).run()
        }
      }
      reader.readAsDataURL(file)
      return
    }
    setUploading(true)
    setError('')
    try {
      const ext = file.name.split('.').pop() || 'bin'
      const path = `posts/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('media').upload(path, file, { upsert: false })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('media').getPublicUrl(path)
      const url = data.publicUrl
      if (file.type.startsWith('video/')) {
        editor.chain().focus().insertContent(`<p><video src="${url}" controls style="max-width:100%"></video></p>`).run()
      } else {
        editor.chain().focus().setImage({ src: url }).run()
      }
    } catch (e: unknown) {
      setError('파일 업로드 실패: ' + (e instanceof Error ? e.message : '알 수 없는 오류'))
    } finally {
      setUploading(false)
    }
  }, [activeLang, editorKo, editorEn, editorFr])

  function getHtml(editor: ReturnType<typeof useEditor>) {
    if (!editor) return ''
    const html = editor.getHTML()
    return html === '<p></p>' ? '' : html
  }

  function resetAll() {
    editorKo?.commands.setContent('')
    editorEn?.commands.setContent('')
    editorFr?.commands.setContent('')
    setTitleKo('')
    setPinned(false)
    setExpanded(false)
    setActiveLang('ko')
  }

  async function handleSend() {
    const bodyKo = getHtml(editorKo)
    const bodyEn = getHtml(editorEn)
    const bodyFr = getHtml(editorFr)
    if (!bodyKo && !bodyEn && !bodyFr) {
      setError('내용을 입력해 주세요'); return
    }
    setSending(true); setError('')
    try {
      const post = await createPost({
        channel,
        author_name: authorName || defaultAuthorName,
        author_avatar: avatar,
        title_ko: titleKo, title_en: '', title_fr: '',
        body_ko: bodyKo, body_en: bodyEn, body_fr: bodyFr,
        is_pinned: pinned,
      })
      if (post) { onPosted(post); resetAll() }
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
              <button className="compose-avatar-upload-btn" onClick={() => avatarInputRef.current?.click()} title="프로필 사진 변경">
                <Avatar avatar={avatar} size={34} />
                <span className="compose-avatar-upload-label">📷</span>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = ev => {
                    const dataUrl = ev.target?.result as string
                    setAvatar(dataUrl)
                    try { localStorage.setItem('admin-avatar', dataUrl) } catch {}
                  }
                  reader.readAsDataURL(file)
                }}
              />
            </div>
            <input
              className="compose-name-input"
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
              placeholder="닉네임"
            />
          </div>

          {/* Title */}
          <input
            className="compose-title-input"
            placeholder="제목 (선택사항)"
            value={titleKo}
            onChange={e => setTitleKo(e.target.value)}
          />

          {/* Lang tabs + toolbar */}
          <div className="compose-lang-tabs">
            {(['ko','en','fr'] as Lang[]).map(l => (
              <button key={l} className={`compose-lang-tab${activeLang === l ? ' active' : ''}`}
                onClick={() => setActiveLang(l)}>
                {l === 'ko' ? '한' : l === 'en' ? 'EN' : 'FR'}
              </button>
            ))}
          </div>
          <ComposeToolbar editor={activeEditor} onFileUpload={handleFileUpload} uploading={uploading} />

          {/* Editors (hidden when not active lang) */}
          <div style={{ display: activeLang === 'ko' ? 'block' : 'none' }}>
            <EditorContent editor={editorKo} className="compose-editor-wrap" />
          </div>
          <div style={{ display: activeLang === 'en' ? 'block' : 'none' }}>
            <EditorContent editor={editorEn} className="compose-editor-wrap" />
          </div>
          <div style={{ display: activeLang === 'fr' ? 'block' : 'none' }}>
            <EditorContent editor={editorFr} className="compose-editor-wrap" />
          </div>
        </>
      )}

      {/* Bottom bar — always visible */}
      <div className="compose-input-row">
        {!expanded && <Avatar avatar={avatar} size={30} />}
        {!expanded && (
          <button className="compose-textarea compose-placeholder-btn"
            onClick={() => setExpanded(true)}
            style={{ flex: 1, textAlign: 'left', color: '#aaa', background: '#f9f9f7', border: '1px solid #e0e0d8', borderRadius: 10, padding: '9px 12px', fontSize: 14, cursor: 'text' }}>
            {channel} 채널에 올릴 내용을 입력하세요…
          </button>
        )}
        <div className="compose-actions">
          {expanded && (
            <>
              <button className={`compose-pin-btn${pinned ? ' active' : ''}`}
                onClick={() => setPinned(p => !p)} title="공지로 고정">📌</button>
              <button className="compose-cancel-btn" onClick={resetAll}>✕</button>
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
          📎 파일 첨부 (이미지·영상) · 🖼 이미지 URL · ▶ YouTube URL · EN/FR 버전 추가 가능 · 📌 공지 고정
        </div>
      )}
    </div>
  )
}

// ── Non-admin compose stub ─────────────────────────────────────────────────
function NonAdminCompose({ channel, isLoggedIn }: { channel: string; isLoggedIn: boolean }) {
  const isAdminOnly = ADMIN_ONLY_CHANNELS.has(channel)
  if (isAdminOnly) {
    return (
      <div className="compose-locked">
        <span className="compose-locked-icon">🔒</span>
        <div>
          <div className="compose-locked-title">관리자 전용 채널</div>
          <div className="compose-locked-sub">이 채널은 관리자만 글을 올릴 수 있어요</div>
        </div>
      </div>
    )
  }
  if (!isLoggedIn) {
    return (
      <div className="compose-locked compose-locked-join">
        <span className="compose-locked-icon">✍️</span>
        <div>
          <div className="compose-locked-title">커뮤니티에 가입하면 글을 올릴 수 있어요</div>
          <div className="compose-locked-sub">HAKKYO 커뮤니티 멤버가 되면 모든 채널에서 자유롭게 소통할 수 있어요</div>
        </div>
        <a href="/apply/community" className="compose-locked-btn">✋ 커뮤니티 신청</a>
      </div>
    )
  }
  // Logged in but not admin — coming soon
  return (
    <div className="compose-locked compose-locked-soon">
      <span className="compose-locked-icon">⏳</span>
      <div>
        <div className="compose-locked-title">멤버 글쓰기 기능 준비 중</div>
        <div className="compose-locked-sub">곧 모든 멤버가 채널에 직접 글을 올릴 수 있어요</div>
      </div>
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
  const isLoggedIn = !!user

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
          {/* children (empty state) only shown when no DB posts exist */}
          {!loading && sorted.length === 0 && children}
        </div>
      </div>

      {isAdmin
        ? <AdminCompose channel={channel} defaultAuthorName={displayName} onPosted={handlePosted} />
        : <NonAdminCompose channel={channel} isLoggedIn={isLoggedIn} />
      }
    </div>
  )
}
