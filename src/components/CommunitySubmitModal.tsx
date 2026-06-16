import { useState } from 'react'
import { trackEvent } from '../lib/analytics'
import { X } from 'lucide-react'
import { submitCommunityPost } from '../lib/db'
import { useLang } from '../context/LangContext'

const TAGS = [
  { value: 'housing',          label: { ko: '주거',        en: 'Housing',          fr: 'Logement'       } },
  { value: 'jobs',             label: { ko: '취업',        en: 'Jobs',             fr: 'Emploi'         } },
  { value: 'help',             label: { ko: '도움',        en: 'Help',             fr: 'Aide'           } },
  { value: 'language_exchange',label: { ko: '언어 교환',   en: 'Language Exchange',fr: 'Échange'        } },
  { value: 'life_montreal',    label: { ko: '몬트리올 생활',en: 'Life in Montréal', fr: 'Vie à Montréal' } },
  { value: 'questions',        label: { ko: '질문',        en: 'Questions',        fr: 'Questions'      } },
]

const SPAM_WORDS = ['spam', 'scam', 'casino', 'xxx', 'porn', 'buy now', 'click here', 'free money']

function checkSpam(text: string): boolean {
  const lower = text.toLowerCase()
  return SPAM_WORDS.some(w => lower.includes(w))
}

function getRateLimitKey() { return 'hakkyo_post_times' }

function canPost(): boolean {
  try {
    const raw = localStorage.getItem(getRateLimitKey())
    const times: number[] = raw ? JSON.parse(raw) : []
    const window = 10 * 60 * 1000
    const recent = times.filter(t => Date.now() - t < window)
    return recent.length < 3
  } catch { return true }
}

function recordPost() {
  try {
    const raw = localStorage.getItem(getRateLimitKey())
    const times: number[] = raw ? JSON.parse(raw) : []
    const window = 10 * 60 * 1000
    const recent = times.filter(t => Date.now() - t < window)
    recent.push(Date.now())
    localStorage.setItem(getRateLimitKey(), JSON.stringify(recent))
  } catch {}
}

interface Props { onClose: () => void }

export default function CommunitySubmitModal({ onClose }: Props) {
  const { t } = useLang()

  const [nickname,    setNickname]    = useState('')
  const [contact,     setContact]     = useState('')
  const [tag,         setTag]         = useState('housing')
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [honeypot,    setHoneypot]    = useState('')   // must stay empty
  const [submitting,  setSubmitting]  = useState(false)
  const [done,        setDone]        = useState(false)
  const [error,       setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (honeypot) return   // bot detected

    const nick  = nickname.trim()
    const ttl   = title.trim()
    const desc  = description.trim()

    if (!nick)         { setError(t('닉네임을 입력하세요.', 'Please enter a nickname.', 'Veuillez saisir un pseudonyme.')); return }
    if (ttl.length < 5)  { setError(t('제목을 5자 이상 입력하세요.', 'Title must be at least 5 characters.', 'Le titre doit comporter au moins 5 caractères.')); return }
    if (desc.length < 20){ setError(t('내용을 20자 이상 입력하세요.', 'Body must be at least 20 characters.', 'Le contenu doit comporter au moins 20 caractères.')); return }
    if (checkSpam(ttl) || checkSpam(desc)) { setError(t('허용되지 않는 내용이 포함되어 있습니다.', 'Your post contains disallowed content.', 'Votre message contient du contenu interdit.')); return }
    if (!canPost())    { setError(t('10분 내 3개까지만 게시할 수 있습니다.', 'You can post at most 3 times per 10 minutes.', 'Maximum 3 publications par 10 minutes.')); return }

    setSubmitting(true)
    setError('')
    try {
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
      trackEvent('community_submit_click', { tag })
      window.dispatchEvent(new CustomEvent('hakkyo:community-post'))
      setDone(true)
    } catch {
      setError(t(
        '제출 중 오류가 발생했습니다. 다시 시도해 주세요.',
        'Something went wrong. Please try again.',
        'Une erreur est survenue. Veuillez réessayer.',
      ))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-xl"
        style={{ animation: 'modal-up 0.18s ease-out', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-[9px] font-semibold tracking-[0.22em] text-gray-400 uppercase mb-0.5">
              Community
            </p>
            <h2 className="text-sm font-semibold text-gray-900">
              {t('게시물 작성', 'Write a Post', 'Écrire un message')}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
            <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {t('게시 완료', 'Published', 'Publié')}
            </h3>
            <p className="text-[13px] text-gray-500 leading-relaxed mb-8">
              {t(
                '게시물이 커뮤니티 피드에 바로 게시되었습니다.',
                'Your post is now live in the community feed.',
                'Votre message est maintenant publié dans le fil communautaire.',
              )}
            </p>
            <button onClick={onClose} className="btn-black px-8">
              {t('확인', 'Done', 'Fermer')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            {/* Community guidelines */}
            <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                {t('커뮤니티 가이드라인', 'Community Guidelines', 'Règles communautaires')}
              </p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                {t(
                  '이 공간은 몬트리올에서 생활하는 한국어 커뮤니티를 위한 곳입니다. 서로 존중하고, 도움이 되는 내용을 공유해 주세요. 광고, 스팸, 혐오 표현, 개인정보 포함 게시물은 삭제될 수 있습니다.',
                  'This space is for the Korean community in Montréal. Be respectful and share helpful content. Ads, spam, hate speech, or personal information may be removed.',
                  'Cet espace est destiné à la communauté coréenne de Montréal. Soyez respectueux et partagez du contenu utile. Les publicités, spams, discours haineux ou informations personnelles peuvent être supprimés.',
                )}
              </p>
            </div>

            {/* Honeypot (hidden) */}
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={e => setHoneypot(e.target.value)}
              tabIndex={-1}
              aria-hidden="true"
              style={{ display: 'none' }}
            />

            {/* Nickname */}
            <div>
              <label className="label">
                {t('닉네임', 'Nickname', 'Pseudonyme')} <span className="text-gray-400">*</span>
              </label>
              <input
                className="input"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder={t('커뮤니티에서 표시될 이름', 'Name shown on your post', 'Nom affiché sur votre message')}
                maxLength={50}
                required
              />
            </div>

            {/* Contact (optional) */}
            <div>
              <label className="label">
                {t('연락처', 'Contact', 'Contact')}{' '}
                <span className="text-gray-300 normal-case tracking-normal font-normal">
                  {t('(선택 · 비공개)', '(optional · private)', '(optionnel · privé)')}
                </span>
              </label>
              <input
                className="input"
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder={t('이메일 또는 인스타그램', 'Email or Instagram', 'E-mail ou Instagram')}
                maxLength={100}
              />
            </div>

            {/* Tag */}
            <div>
              <label className="label">
                {t('태그', 'Tag', 'Étiquette')} <span className="text-gray-400">*</span>
              </label>
              <select className="input" value={tag} onChange={e => setTag(e.target.value)}>
                {TAGS.map(tg => (
                  <option key={tg.value} value={tg.value}>
                    {t(tg.label.ko, tg.label.en, tg.label.fr)}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="label">
                {t('제목', 'Title', 'Titre')} <span className="text-gray-400">*</span>
              </label>
              <input
                className="input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={t('간단한 제목 (5자 이상)', 'Short title (min 5 chars)', 'Titre court (min 5 caractères)')}
                maxLength={120}
                required
              />
            </div>

            {/* Body */}
            <div>
              <label className="label">
                {t('내용', 'Body', 'Contenu')} <span className="text-gray-400">*</span>
              </label>
              <textarea
                className="input resize-none"
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t(
                  '자세한 내용을 입력하세요 (20자 이상)',
                  'Tell us more (min 20 characters)',
                  'Décrivez votre message (min 20 caractères)',
                )}
                maxLength={2000}
                required
              />
              <p className="text-[10px] text-gray-300 mt-1 text-right">{description.length}/2000</p>
            </div>

            {error && (
              <p className="text-red-600 text-xs">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-black w-full py-3 disabled:opacity-40"
            >
              {submitting
                ? t('게시 중…', 'Publishing…', 'Publication en cours…')
                : t('게시하기', 'Publish', 'Publier')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
