import { useState, useRef, useEffect } from 'react'
import { trackEvent } from '../lib/analytics'
import { X, Image, Video, MapPin } from 'lucide-react'
// Video icon kept for the disabled button only — no video upload logic
import { submitCommunityPost } from '../lib/db'
import { uploadContentImage, isImageFile } from '../lib/contentStorage'
import { useLang } from '../context/LangContext'

// ─── Data ─────────────────────────────────────────────────────────────────────

const TAGS = [
  { value: 'housing',           ko: '주거',      en: 'Housing',          fr: 'Logement'   },
  { value: 'jobs',              ko: '취업',      en: 'Jobs',             fr: 'Emploi'     },
  { value: 'events',            ko: '이벤트',    en: 'Events',           fr: 'Événements' },
  { value: 'language_exchange', ko: '언어교환',  en: 'Language Exchange',fr: 'Échange'    },
  { value: 'friends',           ko: '친구',      en: 'Friends',          fr: 'Amis'       },
  { value: 'questions',         ko: '질문',      en: 'Questions',        fr: 'Questions'  },
  { value: 'general',           ko: '자유게시판', en: 'General',         fr: 'Général'    },
]

const EXAMPLES = [
  { emoji: '🏠', ko: '집 구하는 정보가 있어요',      en: 'I have housing tips to share',     fr: 'J\'ai des infos sur le logement' },
  { emoji: '📚', ko: '같이 공부할 사람을 찾고 있어요', en: 'Looking for a study buddy',         fr: 'Je cherche quelqu\'un pour étudier' },
  { emoji: '🎉', ko: '이벤트를 공유하고 싶어요',      en: 'I want to share an event',          fr: 'Je veux partager un événement' },
  { emoji: '❓', ko: '질문이 있어요',              en: 'I have a question',                fr: 'J\'ai une question' },
]

const SPAM_WORDS = ['spam', 'scam', 'casino', 'xxx', 'porn', 'buy now', 'click here', 'free money']
const AUTHOR_KEY   = 'hakkyo_author_id'
const POSTS_KEY    = 'hakkyo_authored_posts'
const RATE_KEY     = 'hakkyo_post_times'
const NICKNAME_KEY = 'hakkyo_last_nickname'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAuthorId(): string {
  try {
    let id = localStorage.getItem(AUTHOR_KEY)
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(AUTHOR_KEY, id) }
    return id
  } catch { return 'anon' }
}

function recordAuthored(postId: string) {
  try {
    const map: Record<string, true> = JSON.parse(localStorage.getItem(POSTS_KEY) ?? '{}')
    map[postId] = true
    localStorage.setItem(POSTS_KEY, JSON.stringify(map))
  } catch {}
}

function canPost(): boolean {
  try {
    const times: number[] = JSON.parse(localStorage.getItem(RATE_KEY) ?? '[]')
    return times.filter(t => Date.now() - t < 10 * 60 * 1000).length < 3
  } catch { return true }
}

function recordPost() {
  try {
    const times: number[] = JSON.parse(localStorage.getItem(RATE_KEY) ?? '[]')
    const recent = times.filter(t => Date.now() - t < 10 * 60 * 1000)
    recent.push(Date.now())
    localStorage.setItem(RATE_KEY, JSON.stringify(recent))
  } catch {}
}

function getSavedNickname(): string {
  try { return localStorage.getItem(NICKNAME_KEY) ?? '' } catch { return '' }
}

/** Derive a title from free-form content. */
function deriveTitle(content: string): string {
  const first = content.split('\n')[0].trim()
  if (first.length >= 5) return first.slice(0, 120)
  return content.trim().slice(0, 120)
}

// ─── Auto-grow textarea ───────────────────────────────────────────────────────

function AutoTextarea({
  value, onChange, placeholder, minRows = 4, className = '', autoFocus, textareaRef,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  minRows?: number
  className?: string
  autoFocus?: boolean
  textareaRef?: React.RefObject<HTMLTextAreaElement>
}) {
  const internal = useRef<HTMLTextAreaElement>(null)
  const ref = textareaRef ?? internal

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, minRows * 24)}px`
  }, [value, minRows, ref])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={minRows}
      autoFocus={autoFocus}
      className={[
        'w-full bg-transparent resize-none border-0 outline-none leading-relaxed text-gray-900',
        'placeholder:text-gray-500 placeholder:opacity-100',
        className,
      ].join(' ')}
      style={{ fontSize: 15, overflow: 'hidden' }}
    />
  )
}

// ─── Media grid ───────────────────────────────────────────────────────────────

function MediaGrid({ previews, onRemove }: {
  previews: string[]
  onRemove: (i: number) => void
}) {
  if (!previews.length) return null
  return (
    <div className={['grid gap-1.5 mt-3', previews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'].join(' ')}>
      {previews.map((src, i) => (
        <div key={i} className="relative rounded-lg overflow-hidden bg-gray-50 aspect-video">
          <img src={src} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
          >
            <X size={10} color="white" strokeWidth={2.5} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Main composer ────────────────────────────────────────────────────────────
// Renders inline in the page flow (Home.tsx's CommunityPulse) — collapsed to a
// single prompt row by default, expands in place on click. No overlay/modal.

export default function CommunityComposer() {
  const { t } = useLang()
  const contentRef = useRef<HTMLTextAreaElement>(null)

  const [expanded,     setExpanded]     = useState(false)
  const [nickname,     setNickname]     = useState(getSavedNickname)
  const [password,     setPassword]     = useState('')
  const [contact,      setContact]      = useState('')
  const [tag,          setTag]          = useState('general')
  const [content,      setContent]      = useState('')     // unified text area (title auto-derived on submit)
  const [location,     setLocation]     = useState('')
  const [showLocation, setShowLocation] = useState(false)
  const [honeypot,     setHoneypot]     = useState('')
  const [mediaFiles,    setMediaFiles]    = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
  const [uploading,    setUploading]    = useState(false)
  const [uploadStep,   setUploadStep]   = useState('')   // human-readable progress label
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Clean up blob URLs on unmount
  useEffect(() => () => mediaPreviews.forEach(p => URL.revokeObjectURL(p)), [])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Media ────────────────────────────────────────────────────────────────────

  function addFiles(files: File[]) {
    const hasVideo = files.some(f => f.type.startsWith('video/'))
    if (hasVideo) {
      setError('영상 업로드는 준비 중입니다.')
      return
    }
    const valid = files.filter(f => isImageFile(f)).slice(0, 4 - mediaFiles.length)
    if (!valid.length) return
    const newPreviews = valid.map(f => URL.createObjectURL(f))
    setMediaFiles(prev => [...prev, ...valid].slice(0, 4))
    setMediaPreviews(prev => [...prev, ...newPreviews].slice(0, 4))
  }

  function removeMedia(i: number) {
    URL.revokeObjectURL(mediaPreviews[i])
    setMediaFiles(prev => prev.filter((_, idx) => idx !== i))
    setMediaPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  function collapse() {
    setExpanded(false)
    setError('')
  }

  // ── Submit ────────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (honeypot) return

    const nick  = nickname.trim()
    const pw    = password.trim()
    const body  = content.trim()
    const title = deriveTitle(body)

    // Validation
    if (!nick) {
      setError(t('이름을 입력해주세요.', 'Please enter your display name.', 'Veuillez saisir un pseudo.'))
      return
    }
    if (!pw) {
      setError(t('삭제/수정 비밀번호를 입력해주세요.', 'Please set a post password.', 'Veuillez définir un mot de passe.'))
      return
    }
    if (body.length < 10) {
      setError(t('내용을 조금 더 작성해주세요.', 'Please write a bit more.', 'Veuillez écrire un peu plus.'))
      return
    }
    if ([title, body].some(s => SPAM_WORDS.some(w => s.toLowerCase().includes(w)))) {
      setError(t('허용되지 않는 내용이 포함되어 있습니다.', 'Your post contains disallowed content.', 'Votre message contient du contenu interdit.'))
      return
    }
    if (!canPost()) {
      setError(t('잠시 후 다시 시도해주세요. (10분에 3개 제한)', 'Too many posts. Please wait a moment.', 'Maximum 3 publications par 10 minutes.'))
      return
    }

    setSubmitting(true)
    setError('')
    setUploadStep('')

    // Safety net: forcibly unlock UI after 30 s so user is never stuck
    const safetyTimer = setTimeout(() => {
      console.error('UPLOAD TIMEOUT — releasing UI after 30 s')
      setSubmitting(false)
      setUploading(false)
      setUploadStep('')
      setError('업로드 시간이 초과되었습니다. 파일 크기를 줄이거나 다시 시도해주세요. (Upload timed out after 30 s)')
    }, 30_000)

    try {
      let imageUrl: string | null = null

      if (mediaFiles.length > 0) {
        setUploading(true)
        const firstImage = mediaFiles[0]
        setUploadStep(`이미지 업로드 중… (${(firstImage.size / 1024 / 1024).toFixed(1)} MB)`)
        try {
          imageUrl = await uploadContentImage(firstImage, 'community')
        } catch (imgErr) {
          const msg = imgErr instanceof Error ? imgErr.message : JSON.stringify(imgErr)
          console.error('UPLOAD IMAGE ERROR:', msg, imgErr)
          setError(`이미지 업로드 실패: ${msg}`)
        }
        setUploading(false)
        setUploadStep('')
      }

      // ── DB insert ─────────────────────────────────────────────────────────
      setUploadStep('게시물 저장 중…')

      const postId = await submitCommunityPost({
        type:          tag,
        title:         title,
        description:   body,
        author_name:   nick,
        contact:       contact.trim() || null,
        location:      location.trim() || null,
        image_url:     imageUrl,
        post_password: pw,
      })

      recordPost()
      recordAuthored(postId)
      getAuthorId()
      try { localStorage.setItem(NICKNAME_KEY, nick) } catch {}
      trackEvent({ eventName: 'post_submit_success', targetType: 'inline_composer', targetLabel: tag, metadata: { tag } })

      window.dispatchEvent(new CustomEvent('hakkyo:community-post'))

      // Reset and collapse back to the prompt row
      setContent('')
      setContact('')
      setLocation('')
      setShowLocation(false)
      setMediaFiles([])
      setMediaPreviews(prev => { prev.forEach(p => URL.revokeObjectURL(p)); return [] })
      setTag('general')
      setExpanded(false)

    } catch (err) {
      const raw = JSON.stringify(err, null, 2)
      const msg = err instanceof Error ? err.message
        : (err && typeof err === 'object' && 'message' in err) ? String((err as { message: unknown }).message)
        : String(err)
      console.error('UPLOAD FINAL ERROR — full object:', raw)
      trackEvent({ eventName: 'post_submit_failed', targetType: 'inline_composer', targetLabel: tag, metadata: { error: msg } })
      setError(`게시 실패: ${msg}`)
    } finally {
      clearTimeout(safetyTimer)
      setSubmitting(false)
      setUploading(false)
      setUploadStep('')
    }
  }

  const busy = submitting || uploading
  const showExamples = content.trim().length === 0

  // ── Collapsed: single prompt row ──────────────────────────────────────────────
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-3 text-left border border-dashed border-gray-200 rounded-xl px-4 py-3 text-[14px] text-gray-400 hover:border-gray-300 hover:text-gray-600 hover:bg-gray-50/50 transition-all"
      >
        <span className="row-chip row-chip-sm shrink-0" style={{ background: 'var(--y)', color: '#111' }}>
          {nickname.trim() ? [...nickname.trim()][0].toUpperCase() : '+'}
        </span>
        {t(
          '몬트리올 생활에서 있었던 일을 나눠보세요.',
          'Share something from your life in Montréal.',
          'Partagez quelque chose de votre vie à Montréal.',
        )}
      </button>
    )
  }

  // ── Expanded: full composer ────────────────────────────────────────────────────
  return (
    <div className="border border-gray-100 rounded-xl bg-white">
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={e => setHoneypot(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        style={{ display: 'none' }}
      />

      {/* Hidden file inputs */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { addFiles(Array.from(e.target.files ?? [])); e.target.value = '' }}
      />

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-[13px] font-semibold text-gray-800 tracking-tight">
          {t('새 게시글', 'New Post', 'Nouveau message')}
        </span>
        <button
          type="button"
          onClick={collapse}
          disabled={busy}
          className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
          title={t('작성 취소', 'Cancel post', 'Annuler')}
        >
          <X size={16} />
        </button>
      </div>

      {/* Author row */}
      <div className="flex items-start gap-3 px-4 pb-3">
        <span className="row-chip row-chip-sm shrink-0 mt-0.5 text-[13px] font-bold" style={{ background: 'var(--y)', color: '#111' }}>
          {nickname.trim() ? [...nickname.trim()][0].toUpperCase() : '?'}
        </span>
        <div className="flex-1 pt-0.5">
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder={t('표시될 이름 *', 'Display name *', 'Pseudo *')}
            maxLength={50}
            autoFocus
            className="w-full text-[13px] font-semibold text-gray-900 placeholder:text-gray-500 placeholder:opacity-100 bg-transparent border-0 outline-none leading-tight"
          />
          <input
            type="text"
            value={contact}
            onChange={e => setContact(e.target.value)}
            placeholder={t('이메일 또는 인스타그램 (선택)', 'Email or Instagram (optional)', 'Email ou Instagram (optionnel)')}
            maxLength={100}
            className="w-full text-[12px] text-gray-600 placeholder:text-gray-500 placeholder:opacity-100 bg-transparent border-0 outline-none mt-1"
          />
        </div>
      </div>

      {/* Password field */}
      <div className="mx-4 mb-3 border border-gray-200 rounded-lg px-3 py-2">
        <label className="block text-[9px] font-semibold tracking-[0.12em] uppercase text-gray-700 mb-1">
          {t('삭제/수정 비밀번호 *', 'Post password *', 'Mot de passe *')}
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••"
          maxLength={100}
          className="w-full text-[13px] text-gray-900 placeholder:text-gray-500 placeholder:opacity-100 bg-transparent border-0 outline-none"
          autoComplete="new-password"
        />
      </div>

      {/* Main textarea */}
      <div className="px-4">
        <AutoTextarea
          textareaRef={contentRef}
          value={content}
          onChange={setContent}
          placeholder={t('몬트리올 생활에 필요한 이야기를 남겨주세요.', "Share something useful for life in Montréal.", 'Partagez quelque chose d\'utile pour Montréal.')}
          minRows={3}
          className="text-[14px] text-gray-800"
        />
      </div>

      {/* Example suggestions */}
      {showExamples && (
        <div className="px-4 mt-1 mb-2">
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setContent(t(ex.ko, ex.en, ex.fr)); contentRef.current?.focus() }}
                className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors px-2 py-1 rounded-full border border-gray-100"
              >
                <span>{ex.emoji}</span>
                <span>{t(ex.ko, ex.en, ex.fr)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Location input */}
      {showLocation && (
        <div className="mx-4 mt-2 mb-1 flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
          <MapPin size={13} className="text-gray-500 shrink-0" />
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder={t('위치 입력 (예: Mile End, Atwater)', 'Location (e.g. Mile End, Atwater)', 'Lieu (ex: Mile End, Atwater)')}
            maxLength={80}
            autoFocus
            className="flex-1 text-[13px] text-gray-700 placeholder:text-gray-500 placeholder:opacity-100 bg-transparent border-0 outline-none"
          />
          {location && (
            <button type="button" onClick={() => { setLocation(''); setShowLocation(false) }}
              className="text-gray-400 hover:text-gray-700">
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {/* Media preview */}
      <div className="px-4 pb-1">
        <MediaGrid previews={mediaPreviews} onRemove={removeMedia} />
      </div>

      {/* ── Media action row ── */}
      <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
          title={t('사진 추가', 'Add photo', 'Ajouter une photo')}
        >
          <Image size={14} />
          <span>Photo</span>
          {mediaFiles.length > 0 && (
            <span className="text-[10px] text-gray-500 font-medium">{mediaFiles.length}/4</span>
          )}
        </button>

        <span
          className="flex items-center gap-1.5 text-[12px] font-medium text-gray-400 cursor-not-allowed select-none"
          title="영상 업로드는 준비 중입니다."
        >
          <Video size={14} />
          <span>Video</span>
        </span>

        <button
          type="button"
          onClick={() => setShowLocation(v => !v)}
          className={[
            'flex items-center gap-1.5 text-[12px] font-medium transition-colors',
            showLocation || location ? 'text-gray-800' : 'text-gray-600 hover:text-gray-900',
          ].join(' ')}
          title={t('위치 추가', 'Add location', 'Ajouter un lieu')}
        >
          <MapPin size={14} />
          <span>Location</span>
        </button>
      </div>

      {/* ── Category chips ── */}
      <div className="px-4 py-2.5 border-t border-gray-100">
        <div className="flex gap-1.5 flex-wrap">
          {TAGS.map(tg => {
            const active = tag === tg.value
            return (
              <button
                key={tg.value}
                type="button"
                onClick={() => setTag(tg.value)}
                className="text-[10.5px] font-medium px-2.5 py-1 rounded-full border transition-all"
                style={active
                  ? { background: 'var(--y)', borderColor: 'var(--y)', color: '#111', fontWeight: 700 }
                  : { background: 'transparent', borderColor: '#D1D5DB', color: '#374151' }
                }
              >
                {t(tg.ko, tg.en, tg.fr)}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <p className="px-4 pt-2 text-[12px] text-red-500 leading-snug">{error}</p>
      )}

      {/* ── Post button + footer ── */}
      <div className="px-4 pt-2 pb-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={busy}
          className="btn-yellow w-full rounded-xl py-2.5 text-[14px] font-bold disabled:opacity-40 transition-opacity"
        >
          {uploading || submitting
            ? (uploadStep || (uploading ? 'Uploading…' : 'Posting…'))
            : t('게시하기', 'Post', 'Publier')}
        </button>
      </div>
    </div>
  )
}
