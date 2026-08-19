import { useState, useRef, useEffect } from 'react'
import { trackEvent } from '../lib/analytics'
import { X, Image, MapPin, Lock } from 'lucide-react'
import { submitCommunityPost } from '../lib/db'
import { uploadContentImage, isImageFile } from '../lib/contentStorage'
import { useLang } from '../context/LangContext'

// ─── Data ─────────────────────────────────────────────────────────────────────

const TAGS = [
  { value: 'housing',           ko: '🏠 주거',      en: '🏠 Housing',          fr: '🏠 Logement'   },
  { value: 'jobs',              ko: '💼 취업',      en: '💼 Jobs',             fr: '💼 Emploi'     },
  { value: 'events',            ko: '🎉 이벤트',    en: '🎉 Events',           fr: '🎉 Événements' },
  { value: 'language_exchange', ko: '💬 언어교환',  en: '💬 Exchange',         fr: '💬 Échange'    },
  { value: 'friends',           ko: '🤝 친구',      en: '🤝 Friends',          fr: '🤝 Amis'       },
  { value: 'questions',         ko: '❓ 질문',      en: '❓ Questions',        fr: '❓ Questions'  },
  { value: 'general',           ko: '✏️ 자유',      en: '✏️ General',         fr: '✏️ Général'    },
]

const EXAMPLES = [
  { emoji: '🏠', ko: '집 구하는 정보가 있어요',        en: 'I have housing tips to share',      fr: 'J\'ai des infos sur le logement' },
  { emoji: '📚', ko: '같이 공부할 사람을 찾고 있어요',  en: 'Looking for a study buddy',          fr: 'Je cherche quelqu\'un pour étudier' },
  { emoji: '🎉', ko: '이벤트를 공유하고 싶어요',       en: 'I want to share an event',           fr: 'Je veux partager un événement' },
  { emoji: '❓', ko: '질문이 있어요',                 en: 'I have a question',                 fr: 'J\'ai une question' },
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

function deriveTitle(content: string): string {
  const first = content.split('\n')[0].trim()
  if (first.length >= 5) return first.slice(0, 120)
  return content.trim().slice(0, 120)
}

// ─── Auto-grow textarea ───────────────────────────────────────────────────────

function AutoTextarea({
  value, onChange, placeholder, minRows = 3, className = '', autoFocus, textareaRef,
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
        'placeholder:text-gray-400',
        className,
      ].join(' ')}
      style={{ fontSize: 15, overflow: 'hidden' }}
    />
  )
}

// ─── Media grid ───────────────────────────────────────────────────────────────

function MediaGrid({ previews, onRemove }: { previews: string[]; onRemove: (i: number) => void }) {
  if (!previews.length) return null
  return (
    <div className={['grid gap-1.5 mt-3', previews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'].join(' ')}>
      {previews.map((src, i) => (
        <div key={i} className="relative rounded-xl overflow-hidden bg-gray-50 aspect-video">
          <img src={src} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/75 flex items-center justify-center transition-colors"
          >
            <X size={10} color="white" strokeWidth={2.5} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Avatar chip ──────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const letter = name.trim() ? [...name.trim()][0].toUpperCase() : '?'
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[14px] font-bold"
      style={{ background: 'var(--y, #f5c542)', color: '#111' }}>
      {letter}
    </div>
  )
}

// ─── Main composer ────────────────────────────────────────────────────────────

export default function CommunityComposer() {
  const { t } = useLang()
  const contentRef = useRef<HTMLTextAreaElement>(null)

  const [expanded,     setExpanded]     = useState(false)
  const [nickname,     setNickname]     = useState(getSavedNickname)
  const [password,     setPassword]     = useState('')
  const [contact,      setContact]      = useState('')
  const [tag,          setTag]          = useState('general')
  const [content,      setContent]      = useState('')
  const [location,     setLocation]     = useState('')
  const [showLocation, setShowLocation] = useState(false)
  const [honeypot,     setHoneypot]     = useState('')
  const [mediaFiles,    setMediaFiles]    = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
  const [uploading,    setUploading]    = useState(false)
  const [uploadStep,   setUploadStep]   = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => () => mediaPreviews.forEach(p => URL.revokeObjectURL(p)), [])  // eslint-disable-line react-hooks/exhaustive-deps

  function addFiles(files: File[]) {
    const hasVideo = files.some(f => f.type.startsWith('video/'))
    if (hasVideo) { setError('영상 업로드는 준비 중입니다.'); return }
    const valid = files.filter(f => isImageFile(f)).slice(0, 4 - mediaFiles.length)
    if (!valid.length) return
    setMediaFiles(prev => [...prev, ...valid].slice(0, 4))
    setMediaPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))].slice(0, 4))
  }

  function removeMedia(i: number) {
    URL.revokeObjectURL(mediaPreviews[i])
    setMediaFiles(prev => prev.filter((_, idx) => idx !== i))
    setMediaPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  function collapse() { setExpanded(false); setError('') }

  async function handleSubmit() {
    if (honeypot) return
    const nick  = nickname.trim()
    const pw    = password.trim()
    const body  = content.trim()
    const title = deriveTitle(body)

    if (!nick) { setError(t('이름을 입력해주세요.', 'Please enter your display name.', 'Veuillez saisir un pseudo.')); return }
    if (!pw)   { setError(t('삭제/수정 비밀번호를 입력해주세요.', 'Please set a post password.', 'Veuillez définir un mot de passe.')); return }
    if (body.length < 10) { setError(t('내용을 조금 더 작성해주세요.', 'Please write a bit more.', 'Veuillez écrire un peu plus.')); return }
    if ([title, body].some(s => SPAM_WORDS.some(w => s.toLowerCase().includes(w)))) {
      setError(t('허용되지 않는 내용이 포함되어 있습니다.', 'Your post contains disallowed content.', 'Votre message contient du contenu interdit.'))
      return
    }
    if (!canPost()) { setError(t('잠시 후 다시 시도해주세요. (10분에 3개 제한)', 'Too many posts. Please wait a moment.', 'Maximum 3 publications par 10 minutes.')); return }

    setSubmitting(true); setError(''); setUploadStep('')
    const safetyTimer = setTimeout(() => {
      setSubmitting(false); setUploading(false); setUploadStep('')
      setError('업로드 시간이 초과되었습니다. 파일 크기를 줄이거나 다시 시도해주세요.')
    }, 30_000)

    try {
      let imageUrl: string | null = null
      if (mediaFiles.length > 0) {
        setUploading(true)
        setUploadStep(`이미지 업로드 중… (${(mediaFiles[0].size / 1024 / 1024).toFixed(1)} MB)`)
        try { imageUrl = await uploadContentImage(mediaFiles[0], 'community') }
        catch (imgErr) {
          const msg = imgErr instanceof Error ? imgErr.message : JSON.stringify(imgErr)
          setError(`이미지 업로드 실패: ${msg}`)
        }
        setUploading(false); setUploadStep('')
      }

      setUploadStep('게시물 저장 중…')
      const postId = await submitCommunityPost({
        type: tag, title, description: body,
        author_name: nick,
        contact: contact.trim() || null,
        location: location.trim() || null,
        image_url: imageUrl,
        post_password: pw,
      })

      recordPost(); recordAuthored(postId); getAuthorId()
      try { localStorage.setItem(NICKNAME_KEY, nick) } catch {}
      trackEvent({ eventName: 'post_submit_success', targetType: 'inline_composer', targetLabel: tag, metadata: { tag } })
      window.dispatchEvent(new CustomEvent('hakkyo:community-post'))

      setContent(''); setContact(''); setLocation(''); setShowLocation(false)
      setMediaFiles([]); setMediaPreviews(prev => { prev.forEach(p => URL.revokeObjectURL(p)); return [] })
      setTag('general'); setExpanded(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message
        : (err && typeof err === 'object' && 'message' in err) ? String((err as { message: unknown }).message)
        : String(err)
      trackEvent({ eventName: 'post_submit_failed', targetType: 'inline_composer', targetLabel: tag, metadata: { error: msg } })
      setError(`게시 실패: ${msg}`)
    } finally {
      clearTimeout(safetyTimer); setSubmitting(false); setUploading(false); setUploadStep('')
    }
  }

  const busy = submitting || uploading
  const showExamples = content.trim().length === 0

  // ── Collapsed ────────────────────────────────────────────────────────────────
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-2xl transition-all"
        style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.07)' }}
      >
        <Avatar name={nickname} />
        <span className="text-[14px]" style={{ color: '#9ca3af' }}>
          {t('몬트리올 생활에서 있었던 일을 나눠보세요.', 'Share something from your life in Montréal.', 'Partagez quelque chose de votre vie à Montréal.')}
        </span>
      </button>
    )
  }

  // ── Expanded ──────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
      {/* Honeypot */}
      <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)}
        tabIndex={-1} aria-hidden="true" style={{ display: 'none' }} />
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => { addFiles(Array.from(e.target.files ?? [])); e.target.value = '' }} />

      {/* ── Author + close ── */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <Avatar name={nickname} />
        <div className="flex-1 min-w-0 pt-0.5">
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder={t('표시될 이름 *', 'Display name *', 'Pseudo *')}
            maxLength={50}
            autoFocus
            className="w-full text-[14px] font-semibold text-gray-900 placeholder:text-gray-400 bg-transparent border-0 outline-none leading-tight"
          />
          <input
            type="text"
            value={contact}
            onChange={e => setContact(e.target.value)}
            placeholder={t('이메일 또는 인스타그램 (선택)', 'Email or Instagram (optional)', 'Email ou Instagram (optionnel)')}
            maxLength={100}
            className="w-full text-[12px] text-gray-500 placeholder:text-gray-400 bg-transparent border-0 outline-none mt-0.5"
          />
        </div>
        <button
          type="button"
          onClick={collapse}
          disabled={busy}
          className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40 mt-0.5 shrink-0"
        >
          <X size={15} />
        </button>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', margin: '0 16px' }} />

      {/* ── Main textarea ── */}
      <div className="px-4 pt-3 pb-1">
        <AutoTextarea
          textareaRef={contentRef}
          value={content}
          onChange={setContent}
          placeholder={t(
            '몬트리올 생활에 필요한 이야기를 남겨주세요.',
            "Share something useful for life in Montréal.",
            "Partagez quelque chose d'utile pour Montréal.",
          )}
          minRows={4}
          className="text-[15px] text-gray-800"
        />
      </div>

      {/* ── Example chips ── */}
      {showExamples && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setContent(t(ex.ko, ex.en, ex.fr)); contentRef.current?.focus() }}
              className="inline-flex items-center gap-1 text-[11.5px] text-gray-500 hover:text-gray-800 transition-colors px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(0,0,0,0.04)', border: 'none' }}
            >
              <span>{ex.emoji}</span>
              <span>{t(ex.ko, ex.en, ex.fr)}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Location input ── */}
      {showLocation && (
        <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: 'rgba(0,0,0,0.04)' }}>
          <MapPin size={13} className="text-gray-500 shrink-0" />
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder={t('위치 입력 (예: Mile End, Atwater)', 'Location (e.g. Mile End, Atwater)', 'Lieu (ex: Mile End, Atwater)')}
            maxLength={80}
            autoFocus
            className="flex-1 text-[13px] text-gray-700 placeholder:text-gray-400 bg-transparent border-0 outline-none"
          />
          {location && (
            <button type="button" onClick={() => { setLocation(''); setShowLocation(false) }}
              className="text-gray-400 hover:text-gray-700">
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {/* ── Media preview ── */}
      {mediaPreviews.length > 0 && (
        <div className="px-4 pb-3">
          <MediaGrid previews={mediaPreviews} onRemove={removeMedia} />
        </div>
      )}

      {/* ── Category chips ── */}
      <div className="px-4 pb-3 flex gap-1.5 flex-wrap">
        {TAGS.map(tg => {
          const active = tag === tg.value
          return (
            <button
              key={tg.value}
              type="button"
              onClick={() => setTag(tg.value)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full transition-all"
              style={active
                ? { background: 'var(--y, #f5c542)', color: '#111', fontWeight: 700 }
                : { background: 'rgba(0,0,0,0.04)', color: '#6b7280' }
              }
            >
              {t(tg.ko, tg.en, tg.fr)}
            </button>
          )
        })}
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
        className="px-4 py-3 flex items-center gap-2">
        {/* Photo */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          title={t('사진 추가', 'Add photo', 'Ajouter une photo')}
        >
          <Image size={16} />
        </button>
        {mediaFiles.length > 0 && (
          <span className="text-[10px] text-gray-400 font-medium -ml-1">{mediaFiles.length}/4</span>
        )}

        {/* Location */}
        <button
          type="button"
          onClick={() => setShowLocation(v => !v)}
          className={[
            'w-8 h-8 flex items-center justify-center rounded-full transition-colors',
            showLocation || location ? 'text-gray-900 bg-gray-100' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
          ].join(' ')}
          title={t('위치 추가', 'Add location', 'Ajouter un lieu')}
        >
          <MapPin size={16} />
        </button>

        {/* Password */}
        <div className="flex items-center gap-1.5 flex-1 mx-1 rounded-xl px-3 py-1.5 min-w-0"
          style={{ background: 'rgba(0,0,0,0.04)' }}>
          <Lock size={12} className="text-gray-400 shrink-0" />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t('비밀번호 *', 'Password *', 'Mot de passe *')}
            maxLength={100}
            className="flex-1 text-[13px] text-gray-700 placeholder:text-gray-400 bg-transparent border-0 outline-none min-w-0"
            autoComplete="new-password"
          />
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={busy}
          className="shrink-0 px-4 py-1.5 rounded-xl text-[13px] font-bold disabled:opacity-40 transition-all"
          style={{ background: 'var(--y, #f5c542)', color: '#111' }}
        >
          {busy ? (uploadStep || '…') : t('게시', 'Post', 'Publier')}
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <p className="px-4 pb-3 text-[12px] text-red-500 leading-snug">{error}</p>
      )}
    </div>
  )
}
