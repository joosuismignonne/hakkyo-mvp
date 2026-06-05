import { useState } from 'react'
import { X } from 'lucide-react'
import { submitCommunityPost } from '../lib/db'
import { useLang } from '../context/LangContext'

const SUBTYPES: { value: string; label: string }[] = [
  { value: 'housing',            label: 'Housing' },
  { value: 'jobs',               label: 'Jobs' },
  { value: 'looking_for_people', label: 'Roommates' },
  { value: 'language_exchange',  label: 'Language Exchange' },
  { value: 'other',              label: 'General' },
]

interface Props {
  onClose: () => void
}

export default function CommunitySubmitModal({ onClose }: Props) {
  const { t } = useLang()

  const [name,        setName]        = useState('')
  const [contact,     setContact]     = useState('')
  const [subtype,     setSubtype]     = useState('housing')
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl,    setImageUrl]    = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [done,        setDone]        = useState(false)
  const [error,       setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !contact.trim() || !title.trim() || !description.trim()) return
    setSubmitting(true)
    setError('')
    try {
      // Combine name + contact into the single DB 'contact' column
      const contactValue = name.trim()
        ? `${name.trim()} · ${contact.trim()}`
        : contact.trim()
      await submitCommunityPost({
        type:        subtype,            // DB column is 'type' — stores the subtype value
        title:       title.trim(),
        description: description.trim(),
        contact:     contactValue,
        image_url:   imageUrl.trim() || null,
      })
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
              {t('HAKKYO에 제출하기', 'Submit to HAKKYO', 'Soumettre à HAKKYO')}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {done ? (
          /* Success state */
          <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
            <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {t('제출 완료', 'Submitted', 'Envoyé')}
            </h3>
            <p className="text-[13px] text-gray-500 leading-relaxed mb-1">
              {t(
                '제출해 주셔서 감사합니다.',
                'Thank you for your submission.',
                'Merci pour votre envoi.',
              )}
            </p>
            <p className="text-[12px] text-gray-400 leading-relaxed mb-8">
              {t(
                '관리자 검토 후 피드에 게시됩니다.',
                'It will appear in the feed after admin review.',
                'Il apparaîtra dans le fil après révision par un administrateur.',
              )}
            </p>
            <button onClick={onClose} className="btn-black px-8">
              {t('확인', 'Done', 'Fermer')}
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            <p className="text-[12px] text-gray-400 leading-relaxed">
              {t(
                '커뮤니티 게시물은 관리자 검토 후 피드에 게시됩니다.',
                'Community posts are reviewed by our team before appearing in the feed.',
                'Les publications sont vérifiées par notre équipe avant d\'apparaître dans le fil.',
              )}
            </p>

            {/* Name */}
            <div>
              <label className="label">
                {t('이름', 'Name', 'Nom')} <span className="text-gray-400">*</span>
              </label>
              <input
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('홍길동', 'Your name', 'Votre nom')}
                required
              />
            </div>

            {/* Contact */}
            <div>
              <label className="label">
                {t('연락처', 'Contact', 'Contact')} <span className="text-gray-400">*</span>
              </label>
              <input
                className="input"
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder={t('이메일 또는 전화번호', 'Email or phone', 'E-mail ou téléphone')}
                required
              />
            </div>

            {/* Category — always Community */}
            <div>
              <label className="label">
                {t('카테고리', 'Category', 'Catégorie')}
              </label>
              <div className="input bg-gray-50 text-gray-400 cursor-not-allowed select-none">
                {t('커뮤니티', 'Community', 'Communauté')}
              </div>
            </div>

            {/* Subtype */}
            <div>
              <label className="label">
                {t('유형', 'Subtype', 'Sous-type')} <span className="text-gray-400">*</span>
              </label>
              <select
                className="input"
                value={subtype}
                onChange={e => setSubtype(e.target.value)}
              >
                {SUBTYPES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
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
                placeholder={t('간단한 제목을 입력하세요', 'A short title', 'Un titre court')}
                maxLength={120}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="label">
                {t('내용', 'Description', 'Description')} <span className="text-gray-400">*</span>
              </label>
              <textarea
                className="input resize-none"
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t(
                  '자세한 내용을 입력하세요',
                  'Tell us more about your post',
                  'Décrivez votre publication',
                )}
                maxLength={800}
                required
              />
              <p className="text-[10px] text-gray-300 mt-1 text-right">{description.length}/800</p>
            </div>

            {/* Image URL (optional) */}
            <div>
              <label className="label">
                {t('이미지 URL', 'Image URL', 'URL de l\'image')}{' '}
                <span className="text-gray-300 normal-case tracking-normal font-normal">
                  {t('(선택)', '(optional)', '(optionnel)')}
                </span>
              </label>
              <input
                className="input"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://…"
                type="url"
              />
            </div>

            {error && (
              <p className="text-red-600 text-xs">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !name.trim() || !contact.trim() || !title.trim() || !description.trim()}
              className="btn-black w-full py-3 disabled:opacity-40"
            >
              {submitting
                ? t('제출 중…', 'Submitting…', 'Envoi en cours…')
                : t('제출하기', 'Submit', 'Envoyer')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
