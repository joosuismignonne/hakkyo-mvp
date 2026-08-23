import { useState, useEffect, useRef, useCallback } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { Node, mergeAttributes } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'

// Custom TipTap extension so <video> tags survive getHTML() round-trips
const VideoNode = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
    }
  },
  parseHTML() { return [{ tag: 'video[src]' }] },
  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, { controls: true })]
  },
})
import { useAuth } from '../context/AuthContext'
import { useLang, useT, pick } from '../lib/lang'
import type { Lang } from '../lib/lang'
import {
  getChannelPosts, createPost, deletePost, togglePin, isAdminEmail,
  getLikedPostIds, toggleLike, getComments, addComment,
  type ChannelPost, type PostComment,
} from '../lib/posts'
import { Heart, ChatCircle, CheckCircle, ShareNetwork, HandWaving, Lock as LockIcon } from '@phosphor-icons/react'
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
  post, isAdmin, onDelete, onPin, channel, userId, likedByMe, userNickname, userAvatar,
}: {
  post: ChannelPost
  isAdmin: boolean
  onDelete: (id: string) => void
  onPin: (id: string, pinned: boolean) => void
  channel: string
  userId?: string
  likedByMe: boolean
  userNickname: string
  userAvatar: string
}) {
  const [open, setOpen] = useState(false)
  const [liked, setLiked] = useState(likedByMe)
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0)
  const [likePending, setLikePending] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [shared, setShared] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState<PostComment[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentBody, setCommentBody] = useState('')
  const [commentSending, setCommentSending] = useState(false)
  const { lang } = useLang()
  const t = useT()

  const title = pick({ ko: post.title_ko, en: post.title_en, fr: post.title_fr }, lang)
  const body  = pick({ ko: post.body_ko,  en: post.body_en,  fr: post.body_fr  }, lang)
  const stripped = body.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()
  const hasMore = stripped.length > 200
  const hasBody = !!body
  const hasMedia = /<img|<video|<iframe|youtube/.test(body)

  function handleShare() {
    sharePost(channel, post.id)
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  async function handleLike() {
    if (!userId || likePending) return
    setLikePending(true)
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount(c => wasLiked ? Math.max(0, c - 1) : c + 1)
    try {
      const newCount = await toggleLike(post.id, userId, wasLiked)
      setLikeCount(newCount)
    } catch {
      setLiked(wasLiked)
      setLikeCount(c => wasLiked ? c + 1 : Math.max(0, c - 1))
    } finally {
      setLikePending(false)
    }
  }

  async function handleToggleComments() {
    const next = !commentsOpen
    setCommentsOpen(next)
    if (next && !commentsLoaded) {
      const data = await getComments(post.id)
      setComments(data)
      setCommentsLoaded(true)
    }
  }

  async function handleAddComment() {
    if (!commentBody.trim() || !userId) return
    setCommentSending(true)
    try {
      const comment = await addComment(post.id, userNickname, userAvatar, commentBody.trim())
      if (comment) {
        setComments(prev => [...prev, comment])
        setCommentBody('')
      }
    } catch { /* noop */ } finally {
      setCommentSending(false)
    }
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
          <div className={`feed-body${hasMedia ? ' post-rich-body' : ''}`}>
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
          <button
            className={`feed-action${liked ? ' liked' : ''}`}
            onClick={handleLike}
            disabled={!userId}
            title={!userId ? '로그인 후 좋아요를 누를 수 있어요' : undefined}
          >
            <Heart size={13} weight={liked ? 'fill' : 'regular'} color={liked ? '#e53e3e' : undefined} style={{marginRight:3}} />
            {likeCount > 0 ? likeCount : t.home.like}
          </button>
          <button className={`feed-action${commentsOpen ? ' active' : ''}`} onClick={handleToggleComments}>
            <ChatCircle size={13} weight="bold" style={{marginRight:3}} />
            {comments.length > 0 ? comments.length : (lang === 'ko' ? '댓글' : lang === 'fr' ? 'Commentaires' : 'Comments')}
          </button>
          {(hasMore || hasMedia) && (
            <button className="feed-action" onClick={() => setOpen(o => !o)}>
              {open ? t.home.collapse : t.home.readMore}
            </button>
          )}
          <button className={`feed-action${shared ? ' shared' : ''}`} onClick={handleShare}>
            {shared ? <CheckCircle size={13} weight="bold" style={{marginRight:3}} /> : <ShareNetwork size={13} weight="bold" style={{marginRight:3}} />} {lang === 'ko' ? '공유' : lang === 'fr' ? 'Partager' : 'Share'}
          </button>
        </div>

        {commentsOpen && (
          <div className="post-comments">
            {comments.length === 0 && (
              <div className="post-comments-empty">첫 댓글을 남겨보세요</div>
            )}
            {comments.map(c => (
              <div key={c.id} className="post-comment-item">
                <div className="post-comment-avatar">
                  <Avatar avatar={c.author_avatar || c.author_name[0]?.toUpperCase() || '?'} size={26} />
                </div>
                <div className="post-comment-content">
                  <div className="post-comment-header">
                    <span className="post-comment-author">{c.author_name}</span>
                    <span className="post-comment-time">{relTime(c.created_at, lang)}</span>
                  </div>
                  <div className="post-comment-body">{c.body}</div>
                </div>
              </div>
            ))}
            {userId && (
              <div className="post-comment-compose">
                <div className="post-comment-avatar">
                  <Avatar avatar={userAvatar || userNickname[0]?.toUpperCase() || '?'} size={26} />
                </div>
                <input
                  className="post-comment-input"
                  placeholder="댓글을 입력하세요…"
                  value={commentBody}
                  onChange={e => setCommentBody(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment() } }}
                />
                <button
                  className="post-comment-send"
                  onClick={handleAddComment}
                  disabled={!commentBody.trim() || commentSending}
                >
                  {commentSending ? '…' : '등록'}
                </button>
              </div>
            )}
          </div>
        )}
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
  const { user } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [activeLang, setActiveLang] = useState<Lang>('ko')
  const [authorName, setAuthorName] = useState(defaultAuthorName)
  const [titleKo, setTitleKo] = useState('')
  const [avatar, setAvatar] = useState(() => {
    try { return localStorage.getItem('admin-avatar') || '🐱' } catch { return '🐱' }
  })
  const [avatarUrl, setAvatarUrl] = useState('')
  const [pinned, setPinned] = useState(false)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user || !supabase) return
    supabase.from('profiles').select('nickname,avatar_url').eq('id', user.id).single().then(({ data }) => {
      if (data?.nickname) setAuthorName(data.nickname)
      if (data?.avatar_url) setAvatarUrl(data.avatar_url)
    })
  }, [user])

  // One editor per language, but only one visible at a time
  const sharedExtensions = [
    StarterKit,
    Image.configure({ inline: false }),
    Youtube.configure({ width: 640, height: 360 }),
    Link.configure({ openOnClick: false }),
    VideoNode,
  ]
  const editorKo = useEditor({
    extensions: [...sharedExtensions, Placeholder.configure({ placeholder: `# ${channel} 채널 — 한국어 내용을 입력하세요` })],
    content: '',
    editorProps: { attributes: { class: 'compose-rich-editor' } },
  })
  const editorEn = useEditor({
    extensions: [...sharedExtensions, Placeholder.configure({ placeholder: 'English content (optional)' })],
    content: '',
    editorProps: { attributes: { class: 'compose-rich-editor' } },
  })
  const editorFr = useEditor({
    extensions: [...sharedExtensions, Placeholder.configure({ placeholder: 'Contenu en français (facultatif)' })],
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
          editor.chain().focus().insertContent({ type: 'video', attrs: { src } }).run()
        } else {
          editor.chain().focus().setImage({ src }).run()
        }
      }
      reader.readAsDataURL(file)
      return
    }
    setUploading(true)
    setError('')
    const insertFile = (src: string) => {
      if (file.type.startsWith('video/')) {
        editor.chain().focus().insertContent({ type: 'video', attrs: { src } }).run()
      } else {
        editor.chain().focus().setImage({ src }).run()
      }
    }
    const isVideo = file.type.startsWith('video/')
    const fallbackToDataUrl = () => {
      if (isVideo) {
        // Video data URLs can be 50MB+ — too large for DB. Show error instead.
        setError('영상 업로드에 실패했어요. Supabase 스토리지(media 버킷)를 확인해 주세요.')
        setUploading(false)
        return
      }
      const reader = new FileReader()
      reader.onload = ev => { if (ev.target?.result) insertFile(ev.target.result as string) }
      reader.readAsDataURL(file)
    }
    try {
      const ext = file.name.split('.').pop() || 'bin'
      const path = `posts/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('media').upload(path, file, { upsert: false })
      if (upErr) {
        console.error('Storage upload error:', upErr.message)
        fallbackToDataUrl()
      } else {
        const { data } = supabase.storage.from('media').getPublicUrl(path)
        insertFile(data.publicUrl)
      }
    } catch (e) {
      console.error('Upload exception:', e)
      fallbackToDataUrl()
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
        author_avatar: avatarUrl || avatar,
        title_ko: titleKo, title_en: '', title_fr: '',
        body_ko: bodyKo, body_en: bodyEn, body_fr: bodyFr,
        is_pinned: pinned,
      })
      if (post) { onPosted(post); resetAll() }
    } catch (e: any) {
      setError(e.message || '오류가 발생했어요')
    } finally { setSending(false) }
  }

  const displayAvatar = avatarUrl || avatar
  const avatarBg = avatarUrl ? 'transparent' : '#f5c542'

  if (!expanded) {
    return (
      <div className="member-compose-collapsed" onClick={() => setExpanded(true)}>
        <div className="member-compose-avatar" style={{ background: avatarBg }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : <Avatar avatar={displayAvatar} size={32} />}
        </div>
        <div className="member-compose-ph">하고 싶은 이야기를 써주세요…</div>
      </div>
    )
  }

  return (
    <div className="member-compose-expanded">
      <div className="member-compose-header">
        <div className="member-compose-avatar" style={{ background: avatarBg }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : <Avatar avatar={displayAvatar} size={32} />}
        </div>
        <span className="member-compose-name">{authorName}</span>
        <button className="member-compose-close" onClick={resetAll}>✕</button>
      </div>

      {/* Title */}
      <input
        className="member-compose-title"
        placeholder="제목 (선택사항)"
        value={titleKo}
        onChange={e => setTitleKo(e.target.value)}
      />

      {/* Lang tabs */}
      <div className="member-compose-lang-tabs">
        {(['ko','en','fr'] as Lang[]).map(l => (
          <button key={l} className={`member-compose-lang-tab${activeLang === l ? ' active' : ''}`}
            onClick={() => setActiveLang(l)}>
            {l === 'ko' ? '한국어' : l === 'en' ? 'English' : 'Français'}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <ComposeToolbar editor={activeEditor} onFileUpload={handleFileUpload} uploading={uploading} />

      {/* Editors */}
      <div style={{ display: activeLang === 'ko' ? 'block' : 'none' }}>
        <EditorContent editor={editorKo} className="compose-editor-wrap" />
      </div>
      <div style={{ display: activeLang === 'en' ? 'block' : 'none' }}>
        <EditorContent editor={editorEn} className="compose-editor-wrap" />
      </div>
      <div style={{ display: activeLang === 'fr' ? 'block' : 'none' }}>
        <EditorContent editor={editorFr} className="compose-editor-wrap" />
      </div>

      {error && <div className="compose-error">{error}</div>}
      <div className="member-compose-footer">
        <button className={`member-compose-pin${pinned ? ' active' : ''}`}
          onClick={() => setPinned(p => !p)} title="공지로 고정">
          📌 공지 고정
        </button>
        <button className="member-compose-send" onClick={handleSend} disabled={sending}>
          {sending ? '전송 중…' : '올리기'}
        </button>
      </div>
      <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} />
    </div>
  )
}

// ── Member compose (logged-in, non-admin) ─────────────────────────────────
function MemberCompose({
  channel, userEmail, onPosted,
}: {
  channel: string
  userEmail: string
  onPosted: (post: ChannelPost) => void
}) {
  const { user } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [nickname, setNickname] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    if (!user || !supabase) return
    supabase.from('profiles').select('nickname,avatar_url').eq('id', user.id).single().then(({ data }) => {
      if (data?.nickname) setNickname(data.nickname)
      if (data?.avatar_url) setAvatarUrl(data.avatar_url)
    })
  }, [user])

  const displayName = nickname || userEmail.split('@')[0]
  const initial = displayName[0]?.toUpperCase() ?? '?'

  async function handleSend() {
    if (!body.trim()) { setError('내용을 입력해 주세요'); return }
    setSending(true); setError('')
    try {
      const post = await createPost({
        channel,
        author_name: displayName,
        author_avatar: avatarUrl || initial,
        title_ko: '', title_en: '', title_fr: '',
        body_ko: body.trim(), body_en: '', body_fr: '',
        is_pinned: false,
      })
      if (post) { onPosted(post); setBody(''); setExpanded(false) }
    } catch (e: any) {
      setError(e.message || '오류가 발생했어요')
    } finally { setSending(false) }
  }

  const avatarBg = avatarUrl ? 'transparent' : '#f5c542'

  if (!expanded) {
    return (
      <div className="member-compose-collapsed" onClick={() => setExpanded(true)}>
        <div className="member-compose-avatar" style={{ background: avatarBg }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : <span>{initial}</span>}
        </div>
        <div className="member-compose-ph">하고 싶은 이야기를 써주세요…</div>
      </div>
    )
  }

  return (
    <div className="member-compose-expanded">
      <div className="member-compose-header">
        <div className="member-compose-avatar" style={{ background: avatarBg }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : <span>{initial}</span>}
        </div>
        <span className="member-compose-name">{displayName}</span>
        <button className="member-compose-close" onClick={() => { setExpanded(false); setBody(''); setError('') }}>✕</button>
      </div>
      <textarea
        className="member-compose-textarea"
        placeholder={`${channel} 채널에 올릴 내용을 입력하세요…`}
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={4}
        autoFocus
      />
      {error && <div className="compose-error">{error}</div>}
      <div className="member-compose-footer">
        <button className="member-compose-send" onClick={handleSend} disabled={sending || !body.trim()}>
          {sending ? '전송 중…' : '올리기'}
        </button>
      </div>
    </div>
  )
}

// ── Non-admin compose stub ─────────────────────────────────────────────────
function NonAdminCompose({
  channel, isLoggedIn, userEmail, onPosted,
}: {
  channel: string
  isLoggedIn: boolean
  userEmail: string
  onPosted: (post: ChannelPost) => void
}) {
  const isAdminOnly = ADMIN_ONLY_CHANNELS.has(channel)
  if (isAdminOnly) {
    return (
      <div className="compose-locked">
        <span className="compose-locked-icon"><LockIcon size={18} weight="bold" /></span>
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
        <span className="compose-locked-icon"><HandWaving size={18} weight="bold" /></span>
        <div>
          <div className="compose-locked-title">커뮤니티에 가입하면 글을 올릴 수 있어요</div>
          <div className="compose-locked-sub">HAKKYO 커뮤니티 멤버가 되면 모든 채널에서 자유롭게 소통할 수 있어요</div>
        </div>
        <a href="/apply/community" className="compose-locked-btn"><HandWaving size={14} weight="bold" style={{marginRight:4}} />커뮤니티 신청</a>
      </div>
    )
  }
  return <MemberCompose channel={channel} userEmail={userEmail} onPosted={onPosted} />
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
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [userNickname, setUserNickname] = useState('')
  const [userAvatar, setUserAvatar] = useState('')
  const isAdmin = isAdminEmail(user?.email)
  const isLoggedIn = !!user
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getChannelPosts(channel)
      .then(async data => {
        setPosts(data)
        if (user && data.length > 0) {
          const liked = await getLikedPostIds(user.id, data.map(p => p.id))
          setLikedIds(liked)
        }
      })
      .finally(() => setLoading(false))
  }, [channel, user?.id])

  useEffect(() => {
    if (!user || !supabase) return
    supabase.from('profiles').select('nickname,avatar_url').eq('id', user.id).single().then(({ data }) => {
      if (data?.nickname) setUserNickname(data.nickname)
      if (data?.avatar_url) setUserAvatar(data.avatar_url)
    })
  }, [user])

  // Scroll to bottom when posts load or channel changes
  useEffect(() => {
    if (!loading && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [loading, channel])

  function handlePosted(post: ChannelPost) {
    setPosts(prev => [...prev, post])
    // Scroll to bottom after new post
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, 50)
  }
  function handleDelete(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id))
    deletePost(id).catch(console.error)
  }
  function handlePin(id: string, pinned: boolean) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, is_pinned: pinned } : p))
    togglePin(id, pinned).catch(console.error)
  }

  // Pinned first, then oldest-to-newest (chat style: scroll down for latest)
  const sorted = [...posts].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  const displayName = user?.email?.split('@')[0] ?? 'Admin'

  return (
    <div className="ch-feed">
      {header}
      <div className="ch-scroll" ref={scrollRef}>
        <div className="ch-inner">
          {!loading && sorted.map(post => (
            <PostCard
              key={post.id}
              post={post}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onPin={handlePin}
              channel={channel}
              userId={user?.id}
              likedByMe={likedIds.has(post.id)}
              userNickname={userNickname || user?.email?.split('@')[0] || ''}
              userAvatar={userAvatar}
            />
          ))}
          {/* children (empty state) only shown when no DB posts exist */}
          {!loading && sorted.length === 0 && children}
        </div>
      </div>

      {isAdmin
        ? <AdminCompose channel={channel} defaultAuthorName={displayName} onPosted={handlePosted} />
        : <NonAdminCompose channel={channel} isLoggedIn={isLoggedIn} userEmail={user?.email ?? ''} onPosted={handlePosted} />
      }
    </div>
  )
}
