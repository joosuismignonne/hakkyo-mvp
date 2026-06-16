import { useState } from 'react'
import { trackEvent } from '../lib/analytics'
import { X } from 'lucide-react'
import { submitCommunityPost } from '../lib/db'
import { useLang } from '../context/LangContext'

// ─── Data ────────────────────────────────────────────────────────────────────

const TAGS = [
  { value: 'housing',           ko: '주거',      en: 'Housing',          fr: 'Logement'   },
  { value: 'jobs',              ko: '취업',      en: 'Jobs',             fr: 'Emploi'     },
  { value: 'events',            ko: '이벤트',    en: 'Events',           fr: 'Événements' },
  { value: 'language_exchange', ko: '언어교환',  en: 'Language Exchange',fr: 'Échange'    },
  { value: 'friends',           ko: '친구',      en: 'Friends',          fr: 'Amis'       },
  { value: 'general',           ko: '자유게시판', en: 'General',         fr: 'Général'    },
]

const SPAM_WORDS = ['spam', 'scam', 'casino', 'xxx', 'porn', 'buy now', 'click here', 'free money']
const AUTHOR_KEY = 'hakkyo_author_id'
const POSTS_KEY  = 'hakkyo_authored_posts'  // { [postId]: true }
const RATE_KEY   = 'hakkyo_post_times'

function getAuthorId(): string {
  try {
    let id = localStorage.getItem(AUTHOR_KEY)
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(AUTHOR_KEY, id) }
    return id
  } catch { return 'anon' }
}

function recordAuthored(postId: string) {
  try {
    const raw  = localStorage.getItem(POSTS_KEY)
    const map: Record<string, true> = raw ? JSON.parse(raw) : {}
    map[postId] = true
    localStorage.setItem(POSTS_KEY, JSON.stringify(map))
  } catch {}
}

function canPost(): boolean {
  try {
    const raw    = localStorage.getItem(RATE_KEY)
    const times: number[] = raw ? JSON.parse(raw) : []
    const recent = times.filter(t => Date.now() - t < 10 * 60 * 1000)
    return recent.length < 3
  } catch { return true }
}

function recordPost() {
  try {
    const raw    = localStorage.getItem(RATE_KEY)
    const times: number[] = raw ? JSON.parse(raw) : []
    const recent = times.filter(t => Date.now() - t < 10 * 60 * 1000)
    recent.push(Date.now())
    localStorage.setItem(RATE_KEY, JSON.stringify(recent))
  } catch {}
}

// ─── Field component — label-free, spacious ────────────────────────────────

function Field({
  value, onChange, placeholder, maxLength, rows, autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  maxLength?: number
  rows?: number
  autoFocus?: boolean
}) {
  const shared = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    placeholder,
    maxLength,
    autoFocus,
    className: [
      'w-full bg-transparent text-[14px] text-gray-900 placeholder-gray-300',
      'border-0 border-b border-gray-100 focus:border-gray-300 focus:outline-none',
      'transition-colors py-3 leading-relaxed resize-none',
    ].join(' '),
    style: { fontSize: 15 },
  }
  return rows
    ? <textarea {...shared} rows={rows} />
    : <input {...shared} type="text" />
}

// ─── Category pill picker ─────────────────────────────────────────────────

function CategoryPills({
  value, onChange, t,
}: {
  value: string
  onChange: (v: string) => void
  t: (ko: string, en: string, fr: string) => string
}) {
  return (
    <div className="flex flex-wrap gap-2 py-3 border-b border-gray-100">
      {TAGS.map(tag => {
        const active = value === tag.value
        return (
          <button
            key={tag.value}
            type="button"
            onClick={() => onChange(tag.value)}
            className="text-[12px] font-medium px-3 py-1.5 rounded-full border transition-all"
            style={active
              ? { background: 'var(--y)', borderColor: 'var(--y)', color: '#111' }
              : { background: 'transparent', borderColor: '#E5E7EB', color: '#6B7280' }
            }
          >
            {t(tag.ko, tag.en, tag.fr)}
          </button>
        )
      })}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────

interface Props { onClose: () => void; initialTag?: string }

export default function CommunitySubmitModal({ onClose, initialTag }: Props) {
  const { t } = useLang()

  const [nickname,    setNickname]    = useState('')
  const [contact,     setContact]     = useState('')
  const [tag,         setTag]         = useState(initialTag ?? 'general')
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [honeypot,    setHoneypot]    = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [done,        setDone]        = useState(false)
  const [error,       setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (honeypot) return

    const nick = nickname.trim()
    const ttl  = title.trim()
    const desc = description.trim()

    if (!nick)          { setError(t('닉네임을 입력하세요.', 'Please enter a nickname.', 'Veuillez saisir un pseudonyme.')); return }
    if (ttl.length < 5) { setError(t('제목을 5자 이상 입력하세요.', 'Title must be at least 5 characters.', 'Le titre doit comporter au moins 5 caractères.')); return }
    if (desc.length < 20){ setError(t('내용을 20자 이상 입력하세요.', 'Body must be at least 20 characters.', 'Le contenu doit comporter au moins 20 caractères.')); return }
    if ([ttl, desc].some(s => SPAM_WORDS.some(w => s.toLowerCase().includes(w)))) {
      setError(t('허용되지 않는 내용이 포함되어 있습니다.', 'Your post contains disallowed content.', 'Votre message contient du contenu interdit.'))
      return
    }
    if (!canPost()) { setError(t('잠시 후 다시 시도해 주세요. (10분에 3개 제한)', 'Please wait — max 3 posts per 10 minutes.', 'Veuillez patienter — max 3 publications par 10 minutes.')); return }

    setSubmitting(true)
    setError('')
    try {
      const authorId = getAuthorId()
      const postId   = crypto.randomUUID()
      await submitCommunityPost({
        type:        tag,
        title:       ttl,
        description: desc,
        nickname:    nick,
        contact:     contact.trim() || null,
        source:      'public_submission',
        tags:        [tag],
      })
      recordPost()
      recordAuthored(postId)
      trackEvent('community_submit_click', { tag })
      window.dispatchEvent(new CustomEvent('hakkyo:community-post'))
      setDone(true)
      // Persist nickname for next time
      try { localStorage.setItem('hakkyo_last_nickname', nick) } catch {}
      void authorId // used for future edit/delete gating
    } catch {
      setError(t('제출 중 오류가 발생했습니다. 다시 시도해 주세요.', 'Something went wrong. Please try again.', 'Une erreur est survenue. Veuillez réessayer.'))
    } finally {
      setSubmitting(false)
    }
  }

  // Pre-fill nickname from last session
  useState(() => {
    try {
      const saved = localStorage.getItem('hakkyo_last_nickname')
      if (saved) setNickname(saved)
    } catch {}
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: 'modal-up 0.16s ease-out', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {done ? (
          /* ── Success ── */
          <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
              style={{ background: 'var(--y)' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="#111" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              {t('게시되었습니다', 'Post published', 'Publié')}
            </h3>
            <p className="text-[13px] text-gray-400 leading-relaxed mb-8">
              {t('피드에 바로 게시되었습니다.', 'Your post is now live in the feed.', 'Votre message est en ligne.')}
            </p>
            <button onClick={onClose} className="btn-yellow px-10 rounded-xl">
              {t('확인', 'Done', 'Fermer')}
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <h2 className="text-[15px] font-semibold text-gray-900">
                {t('게시물 작성', 'Create Post', 'Créer un message')}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-300 hover:text-gray-600 transition-colors p-1 -mr-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Guideline — short, light */}
            <p className="px-6 pb-4 text-[12px] text-gray-400 leading-relaxed">
              {t(
                '몬트리올 생활에 필요한 이야기라면 무엇이든 남겨주세요. 광고, 스팸, 혐오 표현은 삭제될 수 있습니다.',
                'Share anything useful for life in Montréal. Ads, spam, or hate speech may be removed.',
                'Partagez tout ce qui est utile pour la vie à Montréal. Les publicités, spams ou discours haineux peuvent être supprimés.',
              )}
            </p>

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

            <div className="px-6 space-y-0">
              {/* Nickname */}
              <Field
                value={nickname}
                onChange={setNickname}
                placeholder={t('표시될 이름', 'Display name', 'Votre pseudo')}
                maxLength={50}
                autoFocus
              />

              {/* Contact */}
              <Field
                value={contact}
                onChange={setContact}
                placeholder={t('이메일 또는 인스타그램 (선택)', 'Email or Instagram (optional)', 'E-mail ou Instagram (optionnel)')}
                maxLength={100}
              />

              {/* Category pills */}
              <CategoryPills value={tag} onChange={setTag} t={t} />

              {/* Title */}
              <Field
                value={title}
                onChange={setTitle}
                placeholder={t('무엇에 대한 글인가요?', 'What is this post about?', 'De quoi parle ce message?')}
                maxLength={120}
              />

              {/* Body */}
              <div className="relative">
                <Field
                  value={description}
                  onChange={setDescription}
                  placeholder={t('자유롭게 작성해주세요.', 'Write freely.', 'Écrivez librement.')}
                  maxLength={2000}
                  rows={5}
                />
                <span className="absolute bottom-3 right-0 text-[10px] text-gray-200 select-none">
                  {description.length}/2000
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="mx-6 mt-3 text-[12px] text-red-500">{error}</p>
            )}

            {/* Footer */}
            <div className="px-6 pt-5 pb-6 space-y-3">
              <button
                type="submit"
                disabled={submitting}
                className="btn-yellow w-full rounded-xl py-3 text-[14px] disabled:opacity-40"
              >
                {submitting
                  ? t('게시 중…', 'Publishing…', 'Publication…')
                  : t('게시하기', 'Publish', 'Publier')}
              </button>
              <p className="text-center text-[11px] text-gray-300">
                {t(
                  '작성한 글은 나중에 수정하거나 삭제할 수 있습니다.',
                  'You can edit or delete your post later.',
                  'Vous pouvez modifier ou supprimer votre message plus tard.',
                )}
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
