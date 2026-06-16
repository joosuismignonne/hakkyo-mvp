import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, X } from 'lucide-react'
import {
  getCommunityPostById,
  verifyCommunityPostPassword,
  editCommunityPost,
  deleteCommunityPostByPassword,
  getCommunityComments,
  submitCommunityComment,
  deleteCommunityComment,
} from '../lib/db'
import { useLang } from '../context/LangContext'
import { PageShell } from '../components/PageLayout'
import type { CommunitySubmission, CommunityComment } from '../types'

type Lang = 'ko' | 'en' | 'fr'

const SUBTYPE_LABEL: Record<string, string> = {
  housing:            'Housing',
  jobs:               'Jobs',
  looking_for_people: 'Roommates',
  language_exchange:  'Language Exchange',
  general:            'General',
  other:              'General',
  events:             'Events',
  help_needed:        'Help',
  friends:            'Friends',
  questions:          'Questions',
}

const AVATAR_COLORS = ['#F0C040', '#4ADE80', '#60A5FA', '#F472B6', '#A78BFA', '#FB923C']
function avatarBg(name: string): string {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function NicknameAvatar({ name, size = 10 }: { name: string; size?: number }) {
  const initial = name ? [...name][0].toUpperCase() : '익'
  const bg = avatarBg(name || '익')
  const px = size * 4
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-bold"
      style={{
        width: px, height: px, background: bg,
        color: bg === '#F0C040' ? '#111' : '#fff',
        fontSize: px * 0.38,
      }}
    >
      {initial}
    </div>
  )
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    const diff  = Date.now() - new Date(iso).getTime()
    const mins  = Math.floor(diff / 60_000)
    const hours = Math.floor(diff / 3_600_000)
    const days  = Math.floor(diff / 86_400_000)
    const weeks = Math.floor(days / 7)
    if (mins  <  1) return 'just now'
    if (mins  < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days === 1) return 'Yesterday'
    if (days  <  7) return `${days}d ago`
    if (days  < 30) return `${weeks}w ago`
    return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(iso))
  } catch { return '' }
}

// ─── Password modal ───────────────────────────────────────────────────────────

function PasswordModal({
  title, onConfirm, onCancel, error,
}: {
  title: string
  onConfirm: (pw: string) => void
  onCancel: () => void
  error: string
}) {
  const [pw, setPw] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-5"
        style={{ animation: 'modal-up 0.15s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] font-semibold text-gray-800">{title}</p>
          <button onClick={onCancel} className="text-gray-300 hover:text-gray-600"><X size={16} /></button>
        </div>
        <input
          ref={ref}
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onConfirm(pw) }}
          placeholder="••••••"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] outline-none focus:border-gray-400 mb-1"
          autoComplete="current-password"
        />
        {error && <p className="text-[11px] text-red-400 mb-2">{error}</p>}
        <button
          onClick={() => onConfirm(pw)}
          disabled={!pw.trim()}
          className="w-full btn-yellow rounded-xl py-2.5 text-[13px] font-semibold mt-3 disabled:opacity-40"
        >
          확인
        </button>
      </div>
    </div>
  )
}

// ─── Edit form ────────────────────────────────────────────────────────────────

const TAGS = [
  { value: 'housing', label: 'Housing' }, { value: 'jobs', label: 'Jobs' },
  { value: 'events', label: 'Events' },  { value: 'language_exchange', label: 'Language Exchange' },
  { value: 'friends', label: 'Friends' },{ value: 'questions', label: 'Questions' },
  { value: 'general', label: 'General' },
]

function EditForm({
  initial, onSave, onCancel, saving,
}: {
  initial: { title: string; description: string; type: string }
  onSave: (updates: { title: string; description: string; type: string }) => void
  onCancel: () => void
  saving: boolean
}) {
  const [title, setTitle]   = useState(initial.title)
  const [body, setBody]     = useState(initial.description)
  const [type, setType]     = useState(initial.type)

  return (
    <div className="border border-gray-200 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-semibold tracking-[0.14em] uppercase text-gray-400">Edit Post</p>
        <button onClick={onCancel} className="text-gray-300 hover:text-gray-600"><X size={14} /></button>
      </div>

      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-gray-900 outline-none focus:border-gray-300 mb-3"
      />
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={6}
        placeholder="Content"
        className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-[14px] text-gray-700 outline-none focus:border-gray-300 resize-none leading-relaxed mb-3"
      />
      <div className="flex gap-1.5 flex-wrap mb-4">
        {TAGS.map(tg => (
          <button
            key={tg.value}
            type="button"
            onClick={() => setType(tg.value)}
            className="text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all"
            style={type === tg.value
              ? { background: 'var(--y)', borderColor: 'var(--y)', color: '#111', fontWeight: 700 }
              : { background: 'transparent', borderColor: '#E5E7EB', color: '#9CA3AF' }}
          >
            {tg.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-[13px] text-gray-500 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button
          onClick={() => onSave({ title, description: body, type })}
          disabled={saving || !title.trim() || !body.trim()}
          className="flex-1 btn-yellow rounded-xl py-2.5 text-[13px] font-semibold disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ─── Comment row ──────────────────────────────────────────────────────────────

function CommentRow({ comment, onDeleteRequest }: {
  comment: CommunityComment
  onDeleteRequest: (id: string) => void
}) {
  return (
    <div className="py-4 border-b border-gray-50 last:border-0 group">
      <div className="flex items-start gap-2.5">
        <NicknameAvatar name={comment.nickname} size={8} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[12px] font-semibold text-gray-900">{comment.nickname}</span>
            {comment.created_at && (
              <span className="text-[10px] text-gray-400">{relativeTime(comment.created_at)}</span>
            )}
          </div>
          <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
        </div>
        <button
          onClick={() => onDeleteRequest(comment.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 shrink-0 mt-0.5"
          title="Delete comment"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CommunityDetail() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const { lang: rawLang, t } = useLang()
  const lang = rawLang as Lang

  const [post,    setPost]    = useState<CommunitySubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  // Edit/Delete
  const [modal,         setModal]         = useState<'none' | 'edit-pw' | 'delete-pw'>('none')
  const [modalError,    setModalError]    = useState('')
  const [verifiedPw,    setVerifiedPw]    = useState('')  // password stored after verify
  const [editing,       setEditing]       = useState(false)
  const [saving,        setSaving]        = useState(false)

  // Comments
  const [comments,         setComments]         = useState<CommunityComment[]>([])
  const [commentNick,      setCommentNick]       = useState('')
  const [commentPw,        setCommentPw]         = useState('')
  const [commentText,      setCommentText]       = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [commentError,     setCommentError]      = useState('')
  const [deleteCommentId,  setDeleteCommentId]   = useState<string | null>(null)

  useEffect(() => {
    if (!id) { setError('Post not found.'); setLoading(false); return }
    getCommunityPostById(id)
      .then(data => { if (!data) setError('Post not found.'); else setPost(data) })
      .catch(() => setError('Failed to load post.'))
      .finally(() => setLoading(false))
    getCommunityComments(id).then(setComments).catch(() => {})
  }, [id])

  function refreshComments() {
    if (id) getCommunityComments(id).then(setComments).catch(() => {})
  }

  // ── Password modal handlers ────────────────────────────────────────────────

  async function handleEditPwConfirm(pw: string) {
    if (!id || !pw.trim()) return
    setModalError('')
    const ok = await verifyCommunityPostPassword(id, pw)
    if (!ok) { setModalError('비밀번호가 맞지 않습니다.'); return }
    setVerifiedPw(pw)
    setModal('none')
    setEditing(true)
  }

  async function handleDeletePwConfirm(pw: string) {
    if (!id || !pw.trim()) return
    setModalError('')
    const result = await deleteCommunityPostByPassword(id, pw)
    if (!result.success) { setModalError('비밀번호가 맞지 않습니다.'); return }
    navigate('/', { replace: true })
  }

  // ── Save edit ──────────────────────────────────────────────────────────────

  async function handleSaveEdit(updates: { title: string; description: string; type: string }) {
    if (!id) return
    setSaving(true)
    try {
      const result = await editCommunityPost(id, verifiedPw, updates)
      if (!result.success) { setEditing(false); return }
      setPost(prev => prev ? { ...prev, ...updates } : prev)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  // ── Comment submit ─────────────────────────────────────────────────────────

  async function handleCommentSubmit() {
    if (!id) return
    if (!commentNick.trim()) { setCommentError('닉네임을 입력해주세요.'); return }
    if (!commentPw.trim())   { setCommentError('비밀번호를 입력해주세요.'); return }
    if (!commentText.trim()) { setCommentError('댓글 내용을 입력해주세요.'); return }
    setCommentSubmitting(true)
    setCommentError('')
    try {
      await submitCommunityComment(id, commentNick.trim(), commentPw.trim(), commentText.trim())
      setCommentText('')
      refreshComments()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setCommentError(`댓글 등록 실패: ${msg}`)
    } finally {
      setCommentSubmitting(false)
    }
  }

  // ── Comment delete ─────────────────────────────────────────────────────────

  async function handleCommentDeleteConfirm(pw: string) {
    if (!deleteCommentId) return
    setModalError('')
    const result = await deleteCommunityComment(deleteCommentId, pw)
    if (!result.success) { setModalError('비밀번호가 맞지 않습니다.'); return }
    setDeleteCommentId(null)
    setModal('none')
    refreshComments()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-4 h-4 border border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-red-400">{error || 'Post not found.'}</p>
        <button onClick={() => navigate('/')} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
          ← Back
        </button>
      </div>
    )
  }

  const catLabel = SUBTYPE_LABEL[post.type] ?? 'General'
  const author   = post.author_name?.trim() || t('익명', 'Anonymous', 'Anonyme')

  const mainContent = (
    <div>
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors mb-6"
      >
        <ChevronLeft size={12} />
        {t('뒤로', 'Back', 'Retour')}
      </button>

      {/* Category + time */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-gray-400">
          {t('커뮤니티', 'Community', 'Communauté')} · {catLabel}
        </span>
        {post.created_at && (
          <span className="text-[11px] text-gray-400">{relativeTime(post.created_at)}</span>
        )}
      </div>

      {/* Edit form (when active) */}
      {editing && (
        <EditForm
          initial={{ title: post.title, description: post.description, type: post.type }}
          onSave={handleSaveEdit}
          onCancel={() => setEditing(false)}
          saving={saving}
        />
      )}

      {/* Normal post view */}
      {!editing && (
        <>
          {/* Author */}
          <div className="flex items-center gap-2.5 mb-5">
            <NicknameAvatar name={author} size={10} />
            <div>
              <p className="text-[14px] font-semibold text-gray-900">{author}</p>
              {post.contact && (
                <p className="text-[11px] text-gray-400">{post.contact}</p>
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>

          {/* Body */}
          <p className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-wrap mb-6">
            {post.description}
          </p>

          {/* Video */}
          {post.video_url && (
            <div className="overflow-hidden rounded-xl bg-black mb-6" style={{ maxHeight: 480 }}>
              <video
                src={post.video_url}
                controls
                playsInline
                className="w-full"
                style={{ maxHeight: 480 }}
              />
            </div>
          )}

          {/* Image */}
          {post.image_url && (
            <div className="overflow-hidden rounded-xl mb-6 bg-gray-50" style={{ maxHeight: 480 }}>
              <img src={post.image_url} alt="" className="w-full object-cover" style={{ maxHeight: 480 }} />
            </div>
          )}

          {/* Meta */}
          {(post.location || post.link) && (
            <div className="border-t border-gray-100 pt-5 mb-5 space-y-3">
              {post.location && (
                <p className="text-[13px] text-gray-500">📍 {post.location}</p>
              )}
              {post.link && (
                <a
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-gray-500 hover:text-gray-900 underline break-all transition-colors"
                >
                  {post.link} ↗
                </a>
              )}
            </div>
          )}

          {/* Edit / Delete */}
          <div className="flex items-center gap-3 border-t border-gray-100 pt-5 mb-8">
            <button
              onClick={() => { setModalError(''); setModal('edit-pw') }}
              className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors"
            >
              {t('수정', 'Edit', 'Modifier')}
            </button>
            <span className="text-gray-200 text-xs">·</span>
            <button
              onClick={() => { setModalError(''); setModal('delete-pw') }}
              className="text-[12px] text-red-400 hover:text-red-600 transition-colors"
            >
              {t('삭제', 'Delete', 'Supprimer')}
            </button>
          </div>
        </>
      )}

      {/* ── Comments ──────────────────────────────────────────────────────── */}
      <div id="comments">
        <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-300 mb-4">
          {t('댓글', 'Comments', 'Commentaires')}
          {comments.length > 0 && <span className="ml-1.5 text-gray-200">{comments.length}</span>}
        </p>

        {/* Comment list */}
        {comments.length > 0 ? (
          <div className="mb-6">
            {comments.map(c => (
              <CommentRow
                key={c.id}
                comment={c}
                onDeleteRequest={commentId => {
                  setDeleteCommentId(commentId)
                  setModalError('')
                  setModal('none')
                  // show inline delete pw inline by setting deleteCommentId
                }}
              />
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-gray-300 mb-6">
            {t('아직 댓글이 없습니다. 첫 댓글을 남겨주세요.', 'No comments yet. Be the first!', 'Aucun commentaire. Soyez le premier !')}
          </p>
        )}

        {/* Delete comment password prompt */}
        {deleteCommentId && (
          <div className="border border-gray-100 rounded-2xl p-4 mb-4 bg-gray-50">
            <p className="text-[12px] text-gray-500 mb-2">{t('댓글 삭제 비밀번호를 입력하세요.', 'Enter comment password to delete.', 'Mot de passe pour supprimer.')}</p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="••••••"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-gray-400"
                onKeyDown={async e => {
                  if (e.key === 'Enter') {
                    await handleCommentDeleteConfirm((e.target as HTMLInputElement).value)
                    ;(e.target as HTMLInputElement).value = ''
                  }
                }}
              />
              <button
                onClick={() => setDeleteCommentId(null)}
                className="text-[12px] text-gray-400 hover:text-gray-700 px-3"
              >
                {t('취소', 'Cancel', 'Annuler')}
              </button>
            </div>
            {modalError && <p className="text-[11px] text-red-400 mt-1">{modalError}</p>}
          </div>
        )}

        {/* New comment form */}
        <div className="border border-gray-100 rounded-2xl p-4">
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-gray-300 mb-3">
            {t('댓글 작성', 'Write a comment', 'Écrire un commentaire')}
          </p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="text"
              value={commentNick}
              onChange={e => setCommentNick(e.target.value)}
              placeholder={t('닉네임 *', 'Nickname *', 'Pseudo *')}
              maxLength={50}
              className="border border-gray-100 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-gray-300"
            />
            <input
              type="password"
              value={commentPw}
              onChange={e => setCommentPw(e.target.value)}
              placeholder={t('삭제 비밀번호 *', 'Password *', 'Mot de passe *')}
              maxLength={100}
              className="border border-gray-100 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-gray-300"
              autoComplete="new-password"
            />
          </div>
          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder={t('댓글을 남겨주세요…', 'Leave a comment…', 'Laissez un commentaire…')}
            rows={3}
            className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-[13px] text-gray-700 outline-none focus:border-gray-300 resize-none leading-relaxed mb-2"
          />
          {commentError && (
            <p className="text-[11px] text-red-400 mb-2">{commentError}</p>
          )}
          <button
            onClick={handleCommentSubmit}
            disabled={commentSubmitting || !commentNick.trim() || !commentPw.trim() || !commentText.trim()}
            className="btn-yellow w-full rounded-xl py-2.5 text-[13px] font-semibold disabled:opacity-40"
          >
            {commentSubmitting
              ? t('게시 중…', 'Posting…', 'Publication…')
              : t('댓글 게시', 'Post comment', 'Publier')}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <PageShell>
        {mainContent}
      </PageShell>

      {/* Edit password modal */}
      {modal === 'edit-pw' && (
        <PasswordModal
          title={t('수정 비밀번호 확인', 'Enter post password to edit', 'Mot de passe pour modifier')}
          onConfirm={handleEditPwConfirm}
          onCancel={() => setModal('none')}
          error={modalError}
        />
      )}

      {/* Delete password modal */}
      {modal === 'delete-pw' && (
        <PasswordModal
          title={t('삭제 비밀번호 확인', 'Enter post password to delete', 'Mot de passe pour supprimer')}
          onConfirm={handleDeletePwConfirm}
          onCancel={() => setModal('none')}
          error={modalError}
        />
      )}
    </>
  )
}
