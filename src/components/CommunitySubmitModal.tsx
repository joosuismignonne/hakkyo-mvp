import { useState, useRef, useEffect } from 'react'
import { trackEvent } from '../lib/analytics'
import { X, Image, Video, MapPin } from 'lucide-react'
import { submitCommunityPost } from '../lib/db'
import { uploadContentImage, isImageFile } from '../lib/contentStorage'
import { useLang } from '../context/LangContext'

// ─── Constants ────────────────────────────────────────────────────────────────

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
  { emoji: '☕', ko: '좋은 카페를 발견했어요',   en: 'Found a great café',      fr: 'J\'ai trouvé un super café'  },
  { emoji: '🎉', ko: '이벤트를 열고 싶어요',    en: 'I want to host an event',  fr: 'Je veux organiser un événement' },
  { emoji: '❓', ko: '질문이 있어요',           en: 'I have a question',        fr: 'J\'ai une question'         },
]

const SPAM_WORDS = ['spam', 'scam', 'casino', 'xxx', 'porn', 'buy now', 'click here', 'free money']
const AUTHOR_KEY   = 'hakkyo_author_id'
const POSTS_KEY    = 'hakkyo_authored_posts'
const RATE_KEY     = 'hakkyo_post_times'
const NICKNAME_KEY = 'hakkyo_last_nickname'

// ─── Auth / rate-limit helpers ────────────────────────────────────────────────

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

// ─── Auto-grow textarea ───────────────────────────────────────────────────────

function AutoTextarea({
  value, onChange, placeholder, minRows = 4, className = '', autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  minRows?: number
  className?: string
  autoFocus?: boolean
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

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

// ─── Media preview ────────────────────────────────────────────────────────────

function MediaGrid({
  previews, onRemove,
}: {
  previews: string[]
  onRemove: (i: number) => void
}) {
  if (!previews.length) return null
  return (
    <div className={[
      'grid gap-1.5 mt-4 mb-1',
      previews.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
    ].join(' ')}>
      {previews.map((src, i) => (
        <div key={i} className="relative rounded-xl overflow-hidden bg-gray-50 aspect-video">
          <img src={src} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <X size={11} color="white" />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface Props { onClose: () => void; initialTag?: string }

export default function CommunitySubmitModal({ onClose, initialTag }: Props) {
  const { t } = useLang()

  const [nickname,    setNickname]    = useState(getSavedNickname)
  const [contact,     setContact]     = useState('')
  const [tag,         setTag]         = useState(initialTag ?? 'general')
  const [title,       setTitle]       = useState('')
  const [body,        setBody]        = useState('')
  const [honeypot,    setHoneypot]    = useState('')
  const [mediaFiles,  setMediaFiles]  = useState<File[]>([])
  const [previews,    setPreviews]    = useState<string[]>([])
  const [uploading,   setUploading]   = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [done,        setDone]        = useState(false)
  const [error,       setError]       = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Clean up blob URLs on unmount
  useEffect(() => () => previews.forEach(p => URL.revokeObjectURL(p)), [])

  function handleFiles(files: File[]) {
    const images = files.filter(isImageFile).slice(0, 4 - mediaFiles.length)
    if (!images.length) return
    const newPreviews = images.map(f => URL.createObjectURL(f))
    setMediaFiles(prev => [...prev, ...images].slice(0, 4))
    setPreviews(prev => [...prev, ...newPreviews].slice(0, 4))
  }

  function removeMedia(i: number) {
    URL.revokeObjectURL(previews[i])
    setMediaFiles(prev => prev.filter((_, idx) => idx !== i))
    setPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit() {
    if (honeypot) return

    const nick = nickname.trim()
    const ttl  = title.trim() || body.split('\n')[0].trim().slice(0, 120)
    const desc = body.trim()

    if (!nick)         { setError(t('닉네임을 입력하세요.', 'Please enter a display name.', 'Veuillez saisir un pseudo.')); return }
    if (ttl.length < 5){ setError(t('제목을 5자 이상 입력하세요.', 'Title must be at least 5 characters.', 'Le titre doit comporter au moins 5 caractères.')); return }
    if (desc.length < 10){ setError(t('내용을 더 입력해 주세요.', 'Please write a bit more.', 'Veuillez écrire un peu plus.')); return }
    if ([ttl, desc].some(s => SPAM_WORDS.some(w => s.toLowerCase().includes(w)))) {
      setError(t('허용되지 않는 내용이 포함되어 있습니다.', 'Your post contains disallowed content.', 'Votre message contient du contenu interdit.'))
      return
    }
    if (!canPost()) {
      setError(t('잠시 후 다시 시도해 주세요. (10분에 3개 제한)', 'Please wait — max 3 posts per 10 minutes.', 'Maximum 3 publications par 10 minutes.'))
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // Upload image if any (non-fatal)
      let imageUrl: string | null = null
      if (mediaFiles.length > 0) {
        setUploading(true)
        try {
          imageUrl = await uploadContentImage(mediaFiles[0], 'community')
        } catch {
          // proceed without image
        }
        setUploading(false)
      }

      const postId = await submitCommunityPost({
        type:        tag,
        title:       ttl,
        description: desc,
        nickname:    nick,
        contact:     contact.trim() || null,
        source:      'public_submission',
        tags:        [tag],
        image_url:   imageUrl,
      })

      recordPost()
      recordAuthored(postId)
      getAuthorId() // ensure author ID is seeded
      try { localStorage.setItem(NICKNAME_KEY, nick) } catch {}
      trackEvent('community_submit_click', { tag })
      window.dispatchEvent(new CustomEvent('hakkyo:community-post'))
      setDone(true)
    } catch {
      setError(t('제출 중 오류가 발생했습니다. 다시 시도해 주세요.', 'Something went wrong. Please try again.', 'Une erreur est survenue. Veuillez réessayer.'))
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  function fillExample(ex: typeof EXAMPLES[0]) {
    setBody(t(ex.ko, ex.en, ex.fr))
  }

  const showExamples = body.trim().length === 0

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-stretch sm:items-center sm:justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Hidden honeypot */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={e => setHoneypot(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        style={{ display: 'none' }}
      />

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { handleFiles(Array.from(e.target.files ?? [])); e.target.value = '' }}
      />

      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl flex flex-col mt-auto sm:mt-0 rounded-t-2xl"
        style={{
          animation: 'modal-up 0.18s ease-out',
          maxHeight: '92vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {done ? (
          /* ── Success ── */
          <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
              style={{ background: 'var(--y)' }}
            >
              <svg width="24" height="24" fill="none" stroke="#111" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-[16px] font-semibold text-gray-900 mb-2">
              {t('게시되었습니다 🎉', 'Post published 🎉', 'Publié 🎉')}
            </h3>
            <p className="text-[13px] text-gray-400 leading-relaxed mb-8 max-w-xs">
              {t(
                '피드에 바로 게시되었습니다. 나중에 수정하거나 삭제할 수 있습니다.',
                'Your post is live. You can edit or delete it later.',
                'Votre message est en ligne. Vous pouvez le modifier ou le supprimer plus tard.',
              )}
            </p>
            <button
              onClick={onClose}
              className="btn-yellow px-10 rounded-xl text-[14px] font-bold"
            >
              {t('확인', 'Done', 'Fermer')}
            </button>
          </div>
        ) : (
          /* ── Composer ── */
          <>
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X size={18} />
              </button>
              <h2 className="text-[14px] font-semibold text-gray-800">
                {t('게시물 작성', 'Create Post', 'Créer un message')}
              </h2>
              {/* Quick post shortcut on desktop */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || uploading}
                className="text-[12px] font-bold px-4 py-1.5 rounded-full transition-all disabled:opacity-30"
                style={{ background: 'var(--y)', color: '#111' }}
              >
                {uploading ? '↑' : submitting ? '…' : t('게시', 'Post', 'Publier')}
              </button>
            </div>

            {/* Guideline */}
            <p className="px-5 pb-3 text-[11px] text-gray-300 leading-relaxed shrink-0">
              {t(
                '몬트리올 생활에 필요한 이야기라면 무엇이든 남겨주세요. 광고·스팸·혐오 표현은 삭제될 수 있습니다.',
                'Share anything useful for life in Montréal. Ads, spam, or hate speech may be removed.',
                'Partagez tout ce qui est utile à Montréal. Les publicités, spams ou discours haineux peuvent être supprimés.',
              )}
            </p>

            {/* Scrollable composer body */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {/* Author row */}
              <div className="flex items-start gap-3 mb-4">
                {/* HAKKYO avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'var(--y)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <line x1="4"  y1="3" x2="4"  y2="13" stroke="#111" strokeWidth="1.8" strokeLinecap="round"/>
                    <line x1="12" y1="3" x2="12" y2="13" stroke="#111" strokeWidth="1.8" strokeLinecap="round"/>
                    <line x1="4"  y1="8" x2="12" y2="8"  stroke="#111" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    placeholder={t('표시될 이름', 'Your display name', 'Votre pseudo')}
                    maxLength={50}
                    className="w-full text-[13px] font-semibold text-gray-900 placeholder-gray-300 bg-transparent border-0 outline-none mb-0.5"
                    style={{ fontSize: 14 }}
                  />
                  <input
                    type="text"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    placeholder={t('이메일 또는 인스타그램 (선택)', 'Email or Instagram (optional)', 'Email ou Instagram (optionnel)')}
                    maxLength={100}
                    className="w-full text-[11px] text-gray-400 placeholder-gray-200 bg-transparent border-0 outline-none"
                    style={{ fontSize: 12 }}
                  />
                </div>
              </div>

              {/* Title */}
              <AutoTextarea
                value={title}
                onChange={setTitle}
                placeholder={t('무엇에 대한 글인가요?', 'What is this post about?', 'De quoi parle ce message?')}
                minRows={1}
                autoFocus
                className="text-[17px] font-medium text-gray-900 mb-1"
              />

              {/* Body */}
              <AutoTextarea
                value={body}
                onChange={setBody}
                placeholder={t('오늘은 어떤 일이 있었나요?', 'What\'s happening in Montréal?', 'Que se passe-t-il à Montréal?')}
                minRows={4}
                className="text-[15px] text-gray-700 mt-1"
              />

              {/* Example suggestions */}
              {showExamples && (
                <div className="mt-3 space-y-1.5">
                  {EXAMPLES.map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => fillExample(ex)}
                      className="flex items-center gap-2 text-[12px] text-gray-300 hover:text-gray-500 transition-colors w-full text-left"
                    >
                      <span>{ex.emoji}</span>
                      <span>{t(ex.ko, ex.en, ex.fr)}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Media preview */}
              <MediaGrid previews={previews} onRemove={removeMedia} />
            </div>

            {/* Media toolbar */}
            <div className="px-5 py-3 border-t border-gray-50 flex items-center gap-4 shrink-0">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={mediaFiles.length >= 4}
                className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-30"
                title={t('사진 추가', 'Add photo', 'Ajouter une photo')}
              >
                <Image size={16} />
                <span className="hidden sm:inline">{t('사진', 'Photo', 'Photo')}</span>
              </button>
              <button
                type="button"
                disabled
                className="flex items-center gap-1.5 text-[12px] text-gray-200 cursor-not-allowed"
                title={t('동영상 (준비 중)', 'Video (coming soon)', 'Vidéo (bientôt)')}
              >
                <Video size={16} />
                <span className="hidden sm:inline">{t('동영상', 'Video', 'Vidéo')}</span>
              </button>
              <button
                type="button"
                disabled
                className="flex items-center gap-1.5 text-[12px] text-gray-200 cursor-not-allowed"
                title={t('위치 (준비 중)', 'Location (coming soon)', 'Lieu (bientôt)')}
              >
                <MapPin size={16} />
                <span className="hidden sm:inline">{t('위치', 'Location', 'Lieu')}</span>
              </button>
              {mediaFiles.length > 0 && (
                <span className="ml-auto text-[10px] text-gray-300">{mediaFiles.length}/4</span>
              )}
            </div>

            {/* Category pills */}
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

            {/* Error */}
            {error && (
              <p className="px-5 text-[12px] text-red-500 shrink-0">{error}</p>
            )}

            {/* Submit */}
            <div className="px-5 pt-3 pb-6 shrink-0">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || uploading}
                className="btn-yellow w-full rounded-2xl py-3.5 text-[15px] font-bold disabled:opacity-40 transition-opacity"
              >
                {uploading
                  ? t('사진 업로드 중…', 'Uploading…', 'Téléversement…')
                  : submitting
                  ? t('게시 중…', 'Publishing…', 'Publication…')
                  : t('게시하기', 'Publish', 'Publier')}
              </button>
              <p className="text-center text-[11px] text-gray-300 mt-2.5">
                {t(
                  '작성한 글은 나중에 수정하거나 삭제할 수 있습니다.',
                  'You can edit or delete your post later.',
                  'Vous pouvez modifier ou supprimer votre message plus tard.',
                )}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
