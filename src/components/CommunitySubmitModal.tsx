import { useState, useRef, useEffect } from 'react'
import { trackEvent } from '../lib/analytics'
import { X, Image, Video, MapPin } from 'lucide-react'
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
  { emoji: '🏠', ko: '룸메이트를 구하고 있어요', en: 'Looking for a roommate', fr: 'Je cherche un colocataire' },
  { emoji: '☕', ko: '좋은 카페를 발견했어요',   en: 'Found a great café',     fr: 'J\'ai trouvé un super café' },
  { emoji: '🎉', ko: '이벤트를 열고 싶어요',    en: 'I want to host an event', fr: 'Je veux organiser un événement' },
  { emoji: '❓', ko: '질문이 있어요',           en: 'I have a question',       fr: 'J\'ai une question' },
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
        'w-full bg-transparent resize-none border-0 outline-none leading-relaxed',
        'placeholder-gray-300 text-gray-900',
        className,
      ].join(' ')}
      style={{ fontSize: 15, overflow: 'hidden' }}
    />
  )
}

// ─── Media grid ───────────────────────────────────────────────────────────────

function MediaGrid({ previews, types, onRemove }: {
  previews: string[]
  types: string[]
  onRemove: (i: number) => void
}) {
  if (!previews.length) return null
  return (
    <div className={['grid gap-1.5 mt-3', previews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'].join(' ')}>
      {previews.map((src, i) => {
        const isVideo = types[i]?.startsWith('video/')
        return (
          <div key={i} className="relative rounded-xl overflow-hidden bg-gray-50 aspect-video">
            {isVideo
              ? <video src={src} className="w-full h-full object-cover" muted playsInline />
              : <img src={src} alt="" className="w-full h-full object-cover" />
            }
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
            >
              <X size={10} color="white" strokeWidth={2.5} />
            </button>
            {isVideo && (
              <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded">
                VIDEO
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface Props { onClose: () => void; initialTag?: string }

export default function CommunitySubmitModal({ onClose, initialTag }: Props) {
  const { t } = useLang()
  const contentRef = useRef<HTMLTextAreaElement>(null)

  const [nickname,     setNickname]     = useState(getSavedNickname)
  const [contact,      setContact]      = useState('')
  const [tag,          setTag]          = useState(initialTag ?? 'general')
  const [content,      setContent]      = useState('')     // unified text area (title auto-derived on submit)
  const [location,     setLocation]     = useState('')
  const [showLocation, setShowLocation] = useState(false)
  const [honeypot,     setHoneypot]     = useState('')
  const [mediaFiles,   setMediaFiles]   = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
  const [mediaTypes,   setMediaTypes]   = useState<string[]>([])
  const [uploading,    setUploading]    = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState('')
  const fileRef  = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  // Clean up blob URLs on unmount
  useEffect(() => () => mediaPreviews.forEach(p => URL.revokeObjectURL(p)), [])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Media ────────────────────────────────────────────────────────────────────

  function addFiles(files: File[]) {
    const valid = files.filter(f => isImageFile(f) || f.type.startsWith('video/')).slice(0, 4 - mediaFiles.length)
    if (!valid.length) return
    const newPreviews = valid.map(f => URL.createObjectURL(f))
    const newTypes    = valid.map(f => f.type)
    setMediaFiles(prev => [...prev, ...valid].slice(0, 4))
    setMediaPreviews(prev => [...prev, ...newPreviews].slice(0, 4))
    setMediaTypes(prev => [...prev, ...newTypes].slice(0, 4))
  }

  function removeMedia(i: number) {
    URL.revokeObjectURL(mediaPreviews[i])
    setMediaFiles(prev => prev.filter((_, idx) => idx !== i))
    setMediaPreviews(prev => prev.filter((_, idx) => idx !== i))
    setMediaTypes(prev => prev.filter((_, idx) => idx !== i))
  }

  // ── Submit ────────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (honeypot) return

    const nick = nickname.trim()
    const body = content.trim()
    const title = deriveTitle(body)

    // Validation
    if (!nick) {
      setError(t('이름을 입력해주세요.', 'Please enter your display name.', 'Veuillez saisir un pseudo.'))
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

    try {
      // Upload first image (non-fatal)
      let imageUrl: string | null = null
      const imageFiles = mediaFiles.filter(f => isImageFile(f))
      if (imageFiles.length > 0) {
        setUploading(true)
        try {
          imageUrl = await uploadContentImage(imageFiles[0], 'community')
        } catch (uploadErr) {
          console.warn('[CommunitySubmitModal] image upload failed (proceeding without):', uploadErr)
        }
        setUploading(false)
      }

      const postId = await submitCommunityPost({
        type:        tag,
        title:       title,
        description: body,
        nickname:    nick,
        contact:     contact.trim() || null,
        source:      'public_submission',
        tags:        [tag],
        location:    location.trim() || null,
        image_url:   imageUrl,
      })

      recordPost()
      recordAuthored(postId)
      getAuthorId()
      try { localStorage.setItem(NICKNAME_KEY, nick) } catch {}
      trackEvent('community_submit_click', { tag })

      // Refresh feed then close
      window.dispatchEvent(new CustomEvent('hakkyo:community-post'))
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message
        : (err && typeof err === 'object' && 'message' in err) ? String((err as { message: unknown }).message)
        : String(err)
      console.error('[CommunitySubmitModal] submit error:', JSON.stringify(err, null, 2))
      setError(
        t(
          `게시물을 올리지 못했어요. 잠시 후 다시 시도해주세요.`,
          `Could not post. Please try again.`,
          `Impossible de publier. Veuillez réessayer.`,
        ) + (msg ? ` (${msg})` : ''),
      )
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  const busy = submitting || uploading
  const showExamples = content.trim().length === 0

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-stretch sm:items-center sm:justify-center"
      style={{ background: 'rgba(0,0,0,0.42)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
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
      <input
        ref={videoRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={e => { addFiles(Array.from(e.target.files ?? [])); e.target.value = '' }}
      />

      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl flex flex-col mt-auto sm:mt-0 rounded-t-2xl"
        style={{ animation: 'modal-up 0.18s ease-out', maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <X size={18} />
          </button>

          <span className="text-[13px] font-semibold text-gray-500 tracking-tight">
            {t('새 게시물', 'New Post', 'Nouveau message')}
          </span>

          {/* Compact "∗" CTA top-right */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="text-[15px] font-black w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: 'var(--y)', color: '#111' }}
            title="Post"
          >
            {busy ? '…' : '∗'}
          </button>
        </div>

        {/* ── Guideline ── */}
        <p className="px-5 pb-2 text-[11px] text-gray-300 leading-relaxed shrink-0">
          {t(
            '몬트리올 생활에 필요한 이야기라면 무엇이든 남겨주세요. 광고·스팸·혐오 표현은 삭제될 수 있습니다.',
            'Share anything useful for life in Montréal. Ads, spam, or hate speech may be removed.',
            'Partagez tout ce qui est utile à Montréal. Les publicités, spams ou discours haineux peuvent être supprimés.',
          )}
        </p>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-5 pb-3 min-h-0">

          {/* Author row */}
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'var(--y)' }}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <line x1="4"  y1="3" x2="4"  y2="13" stroke="#111" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="3" x2="12" y2="13" stroke="#111" strokeWidth="2" strokeLinecap="round"/>
                <line x1="4"  y1="8" x2="12" y2="8"  stroke="#111" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex-1 pt-0.5">
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder={t('표시될 이름', 'Display name', 'Votre pseudo')}
                maxLength={50}
                autoFocus={!!getSavedNickname()}
                className="w-full text-[14px] font-semibold text-gray-900 placeholder-gray-300 bg-transparent border-0 outline-none leading-tight"
              />
              <input
                type="text"
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder={t('이메일 또는 인스타그램 (선택)', 'Email or Instagram (optional)', 'Email ou Instagram (optionnel)')}
                maxLength={100}
                className="w-full text-[11px] text-gray-300 placeholder-gray-200 bg-transparent border-0 outline-none mt-0.5"
                style={{ fontSize: 12 }}
              />
            </div>
          </div>

          {/* Main content textarea — unified (title auto-derived on submit) */}
          <AutoTextarea
            textareaRef={contentRef}
            value={content}
            onChange={setContent}
            placeholder={t('오늘은 어떤 일이 있었나요?', "What's happening in Montréal?", 'Que se passe-t-il à Montréal?')}
            minRows={5}
            autoFocus={!getSavedNickname()}
            className="text-[15px] text-gray-800"
          />

          {/* Example suggestions — tap to fill */}
          {showExamples && (
            <div className="mt-2 space-y-1">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setContent(t(ex.ko, ex.en, ex.fr)); contentRef.current?.focus() }}
                  className="flex items-center gap-2 text-[12px] text-gray-200 hover:text-gray-400 transition-colors w-full text-left py-0.5"
                >
                  <span>{ex.emoji}</span>
                  <span>{t(ex.ko, ex.en, ex.fr)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Location input (when open) */}
          {showLocation && (
            <div className="mt-3 flex items-center gap-2 border-b border-gray-100 pb-2">
              <MapPin size={13} className="text-gray-300 shrink-0" />
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder={t('위치 입력 (예: Mile End, Atwater)', 'Location (e.g. Mile End, Atwater)', 'Lieu (ex: Mile End, Atwater)')}
                maxLength={80}
                autoFocus
                className="flex-1 text-[13px] text-gray-700 placeholder-gray-300 bg-transparent border-0 outline-none"
              />
              {location && (
                <button type="button" onClick={() => { setLocation(''); setShowLocation(false) }}
                  className="text-gray-300 hover:text-gray-500">
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          {/* Media preview */}
          <MediaGrid previews={mediaPreviews} types={mediaTypes} onRemove={removeMedia} />
        </div>

        {/* ── Media action row ── */}
        <div className="px-5 py-2.5 border-t border-gray-50 flex items-center gap-5 shrink-0">
          {/* Photo — always clickable (up to 4 total) */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-700 transition-colors"
            title={t('사진 추가', 'Add photo', 'Ajouter une photo')}
          >
            <Image size={16} />
            <span>Photo</span>
            {mediaFiles.filter(f => isImageFile(f)).length > 0 && (
              <span className="text-[10px] text-gray-300 font-medium">
                {mediaFiles.filter(f => isImageFile(f)).length}
              </span>
            )}
          </button>

          {/* Video — enabled */}
          <button
            type="button"
            onClick={() => videoRef.current?.click()}
            disabled={mediaFiles.length >= 4}
            className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title={t('동영상 추가', 'Add video', 'Ajouter une vidéo')}
          >
            <Video size={16} />
            <span>Video</span>
            {mediaFiles.filter(f => f.type.startsWith('video/')).length > 0 && (
              <span className="text-[10px] text-gray-300 font-medium">
                {mediaFiles.filter(f => f.type.startsWith('video/')).length}
              </span>
            )}
          </button>

          {/* Location */}
          <button
            type="button"
            onClick={() => setShowLocation(v => !v)}
            className={[
              'flex items-center gap-1.5 text-[12px] transition-colors',
              showLocation || location ? 'text-gray-700 font-medium' : 'text-gray-400 hover:text-gray-700',
            ].join(' ')}
            title={t('위치 추가', 'Add location', 'Ajouter un lieu')}
          >
            <MapPin size={16} />
            <span>Location</span>
            {location && <span className="text-[10px] text-gray-500 font-medium truncate max-w-[60px]">{location}</span>}
          </button>

          {/* Media count */}
          {mediaFiles.length > 0 && (
            <span className="ml-auto text-[10px] text-gray-300">{mediaFiles.length}/4</span>
          )}
        </div>

        {/* ── Category pills ── */}
        <div className="px-5 py-3 border-t border-gray-50 shrink-0">
          <div className="flex gap-1.5 flex-wrap">
            {TAGS.map(tg => {
              const active = tag === tg.value
              return (
                <button
                  key={tg.value}
                  type="button"
                  onClick={() => setTag(tg.value)}
                  className="text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all"
                  style={active
                    ? { background: 'var(--y)', borderColor: 'var(--y)', color: '#111', fontWeight: 700 }
                    : { background: 'transparent', borderColor: '#E5E7EB', color: '#9CA3AF' }
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
          <p className="px-5 pb-1 text-[12px] text-red-500 shrink-0 leading-snug">{error}</p>
        )}

        {/* ── Submit ── */}
        <div className="px-5 pt-2 pb-6 shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="btn-yellow w-full rounded-2xl py-3.5 text-[15px] font-bold disabled:opacity-40 transition-opacity"
          >
            {uploading ? t('사진 올리는 중…', 'Uploading…', 'Téléversement…')
              : submitting ? t('게시 중…', 'Posting…', 'Publication…')
              : 'Post'}
          </button>
          <p className="text-center text-[11px] text-gray-300 mt-2.5">
            {t(
              '작성한 글은 나중에 수정하거나 삭제할 수 있습니다.',
              'You can edit or delete your post later.',
              'Vous pouvez modifier ou supprimer votre message plus tard.',
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
