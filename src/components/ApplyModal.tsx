import { useState, useEffect, useRef, useMemo } from 'react'
import { getTracks, getQuestions, submitApplication, submitLeApplication } from '../lib/db'
import { useLang } from '../context/LangContext'
import type { ProgramTrack, FormQuestion } from '../types'

interface Props {
  onClose: () => void
  preselectedTrackId?: string        // skip to form immediately
  defaultType?: 'program' | 'community'
  languageExchange?: boolean         // open directly as Language Exchange application
}

type Step = 'type' | 'track' | 'form'

// Hardcoded questions shown only in Language Exchange mode
const LE_QUESTIONS = [
  { id: 'le_city',   ko: '현재 거주 도시',               en: 'Current city',                     fr: 'Ville actuelle',                              type: 'text',     required: true,  options: '' },
  { id: 'le_level',  ko: '언어 레벨',                    en: 'Language level',                   fr: 'Niveau de langue',                            type: 'select',   required: false, options: 'Beginner,Intermediate,Advanced,Native' },
  { id: 'le_source', ko: 'HAKKYO를 어떻게 알게 되셨나요?', en: 'How did you hear about HAKKYO?',   fr: 'Comment avez-vous entendu parler de HAKKYO?', type: 'text',     required: false, options: '' },
  { id: 'le_goal',   ko: '목표 / 메시지',                 en: 'Goal / message',                   fr: 'Objectif / message',                          type: 'textarea', required: false, options: '' },
] as const

export default function ApplyModal({ onClose, preselectedTrackId, defaultType, languageExchange }: Props) {
  const { lang, t } = useLang()

  // ── Data ────────────────────────────────────────────────────────────────────
  const [allTracks,  setAllTracks]  = useState<ProgramTrack[]>([])
  const [questions,  setQuestions]  = useState<FormQuestion[]>([])
  const [tracksLoading, setTracksLoading] = useState(true)

  // ── Flow state ───────────────────────────────────────────────────────────────
  const [step, setStep]           = useState<Step>(() => (preselectedTrackId || languageExchange) ? 'form' : 'type')
  const [chosenType, setChosenType] = useState<'program' | 'community' | null>(defaultType ?? null)
  const [selectedTrack, setSelectedTrack] = useState<ProgramTrack | null>(null)

  // ── Form state ───────────────────────────────────────────────────────────────
  const [form, setForm]       = useState({ name: '', email: '', phone: '', instagram: '' })
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')
  const formRef               = useRef<HTMLFormElement>(null)

  // ── Load tracks + questions on mount ────────────────────────────────────────
  useEffect(() => {
    getTracks().then(tracks => {
      setAllTracks(tracks)
      if (preselectedTrackId) {
        const found = tracks.find(t => t.id === preselectedTrackId) ?? null
        setSelectedTrack(found)
        setChosenType(found?.category ?? 'program')
      }
    }).finally(() => setTracksLoading(false))

    // Load ALL questions; visibility is filtered client-side by track tags
    getQuestions().then(setQuestions).catch(console.error)
  }, [preselectedTrackId])

  // ── Visible questions — filtered by selected track's tags ────────────────────
  // A question is shown if:
  //   • question_tags is empty (global), OR
  //   • question_tags overlaps with selectedTrack.program_tags, OR
  //   • legacy session_id matches the track id
  const visibleQuestions = useMemo<FormQuestion[]>(() => {
    if (!questions.length) return []
    const programTags: string[] = selectedTrack?.program_tags ?? []
    const trackId = selectedTrack?.id
    const result = questions.filter(q => {
      // Legacy scope: keep questions scoped to this specific track UUID
      if (q.session_id) return q.session_id === trackId
      const qTags: string[] = q.question_tags ?? []
      if (qTags.length === 0) return true                         // global
      if (programTags.length === 0) return false                  // track untagged → only globals
      return qTags.some(t => programTags.includes(t))             // tag overlap
    })

    return result
  }, [questions, selectedTrack])

  // ── Escape to close ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', fn); document.body.style.overflow = '' }
  }, [onClose])

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const trackName = (tr: ProgramTrack) =>
    lang === 'ko' ? tr.name_ko : lang === 'fr' ? tr.name_fr : tr.name_en
  const trackDesc = (tr: ProgramTrack) =>
    lang === 'ko' ? tr.description_ko : lang === 'fr' ? tr.description_fr : tr.description_en
  const qLabel    = (q: FormQuestion) =>
    lang === 'ko' ? q.question_ko : lang === 'fr' ? q.question_fr : q.question_en

  const effPrice = (tr: ProgramTrack) =>
    tr.is_free ? t('무료', 'Free', 'Gratuit') :
    tr.total_price != null
      ? `$${tr.total_price} ${tr.currency}`
      : tr.class_count > 0
        ? `$${tr.price_per_class * tr.class_count} ${tr.currency}`
        : `$${tr.price_per_class}/${t('회', 'class', 'cours')} · ${tr.currency}`

  const tracksForType = allTracks.filter(tr => tr.category === (chosenType ?? 'program'))
  const sessionLabels = (tr: ProgramTrack) =>
    (tr.track_sessions ?? [])
      .map(ts => {
        const s = ts.session
        if (!s) return ''
        return lang === 'ko' ? s.title_ko : s.title_en
      })
      .filter(Boolean)
      .join(' · ')

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      setError(t('이름과 이메일은 필수입니다.', 'Name and email are required.', 'Le nom et l\'email sont requis.'))
      return
    }

    if (languageExchange) {
      if (!answers['le_city']?.trim()) {
        setError(t('현재 거주 도시를 입력해주세요.', 'Please enter your current city.', 'Veuillez entrer votre ville actuelle.'))
        return
      }
      setSubmitting(true); setError('')
      try {
        await submitLeApplication({
          name:           form.name,
          email:          form.email,
          phone:          form.phone,
          instagram:      form.instagram,
          city:           answers['le_city']?.trim()   ?? '',
          languageLevel:  answers['le_level']?.trim()  ?? '',
          referralSource: answers['le_source']?.trim() ?? '',
          message:        answers['le_goal']?.trim()   ?? '',
        })
        setDone(true)
      } catch (err: unknown) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
      } finally {
        setSubmitting(false)
      }
      return
    }

    const missing = visibleQuestions.filter(q => q.required && !answers[q.id]?.trim())
    if (missing.length > 0) {
      setError(t('필수 항목을 모두 입력해주세요.', 'Please fill in all required fields.', 'Veuillez remplir tous les champs obligatoires.'))
      return
    }
    setSubmitting(true); setError('')
    try {
      const selectedLabel = selectedTrack
        ? (lang === 'ko' ? selectedTrack.name_ko : lang === 'fr' ? selectedTrack.name_fr : selectedTrack.name_en)
        : null
      const totalPrice = selectedTrack
        ? (selectedTrack.total_price != null
          ? selectedTrack.total_price
          : (selectedTrack.class_count > 0 ? selectedTrack.price_per_class * selectedTrack.class_count : null))
        : null
      await submitApplication({
        trackId: selectedTrack?.id,
        totalPrice,
        selectedLabel,
        name: form.name, email: form.email, phone: form.phone, instagram: form.instagram,
        answers,
        questions: visibleQuestions,   // snapshot only the questions actually shown
      })
      setDone(true)
    } catch (err: unknown) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-[520px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl
                      flex flex-col max-h-[94vh] sm:max-h-[88vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full sm:hidden" />

          <div className="mt-1 sm:mt-0">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
              {languageExchange
                ? t('커뮤니티 신청', 'Community Application', 'Candidature communauté')
                : step === 'type'  ? t('등록', 'Registration', 'Inscription')
                : step === 'track' ? t('프로그램 선택', 'Choose a program', 'Choisir un programme')
                : selectedTrack    ? trackName(selectedTrack)
                : t('등록', 'Registration', 'Inscription')}
            </p>
            <h2 className="font-bold text-gray-900 text-base">
              {languageExchange
                ? 'Language Exchange'
                : step === 'type'  ? 'HAKKYO'
                : step === 'track' ? (chosenType === 'program'
                    ? t('프로그램', 'Programs', 'Programmes')
                    : t('커뮤니티', 'Community', 'Communauté'))
                : selectedTrack    ? effPrice(selectedTrack)
                : ''}
            </h2>
          </div>

          <div className="flex items-center gap-2 ml-3">
            {step !== 'type' && !preselectedTrackId && !languageExchange && (
              <button onClick={() => setStep(step === 'form' && !preselectedTrackId ? 'track' : 'type')}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                ← {t('뒤로', 'Back', 'Retour')}
              </button>
            )}
            <button onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── DONE ── */}
          {done && (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
              <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-2">
                {t('신청 완료', 'Application Sent', 'Inscription envoyée')}
              </h3>
              <p className="text-gray-500 text-sm mb-1">
                {t('담당자가 확인 후 연락드리겠습니다.',
                   'We’ll contact you after review.',
                   'Nous vous contacterons après vérification.')}
              </p>
              <p className="text-gray-400 text-xs mb-8">
                {t('신청 내용을 확인한 후 연락드릴게요.', 'Our team will review and confirm your spot.',
                   'Notre équipe vous confirmera votre place.')}
              </p>
              <button onClick={onClose} className="btn-yellow px-8">
                {t('확인', 'Done', 'Fermer')}
              </button>
            </div>
          )}

          {/* ── STEP: TYPE ── */}
          {!done && step === 'type' && (
            <div className="px-5 py-6 space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                {t('무엇을 원하시나요?', 'What would you like to do?', 'Que souhaitez-vous faire?')}
              </p>

              <button
                onClick={() => { setChosenType('program'); setStep('track') }}
                className="w-full text-left border border-gray-200 hover:border-gray-400 rounded-xl px-5 py-4
                           transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {t('프로그램 신청', 'Apply for a Program', 'S\'inscrire à un programme')}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {t('영어 · 불어 · 액티브 아웃풋 (유료)', 'English · French · Active Output (paid)',
                         'Anglais · Français · Active Output (payant)')}
                    </p>
                  </div>
                  <span className="text-gray-300 group-hover:text-gray-600 transition-colors">→</span>
                </div>
              </button>

              <button
                onClick={() => { setChosenType('community'); setStep('track') }}
                className="w-full text-left border border-gray-200 hover:border-gray-400 rounded-xl px-5 py-4
                           transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {t('커뮤니티 참가', 'Join Community', 'Rejoindre la communauté')}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {t('언어 교환 — 무료 참여', 'Language Exchange — Free', 'Échange linguistique — Gratuit')}
                    </p>
                  </div>
                  <span className="text-gray-300 group-hover:text-gray-600 transition-colors">→</span>
                </div>
              </button>
            </div>
          )}

          {/* ── STEP: TRACK ── */}
          {!done && step === 'track' && (
            <div className="px-5 py-5 space-y-3">
              {tracksLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"/>
                </div>
              ) : (
                tracksForType.map(tr => {
                  const labels = sessionLabels(tr)
                  return (
                    <button
                      key={tr.id}
                      onClick={() => { setSelectedTrack(tr); setStep('form') }}
                      disabled={tr.status === 'closed'}
                      className={[
                        'w-full text-left rounded-xl px-5 py-4 transition-colors border group',
                        tr.recommended
                          ? 'border-gray-900 bg-gray-50 hover:bg-gray-100'
                          : 'border-gray-200 hover:border-gray-400',
                        tr.status === 'closed' ? 'opacity-40 cursor-not-allowed' : '',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">{trackName(tr)}</span>
                            {tr.recommended && (
                              <span className="badge-open text-[10px] px-1.5 py-0.5">
                                ★ {t('추천', 'Recommended', 'Recommandé')}
                              </span>
                            )}
                            {tr.status === 'closed' && (
                              <span className="badge-closed text-[10px]">
                                {t('마감', 'Closed', 'Complet')}
                              </span>
                            )}
                          </div>
                          {labels && (
                            <p className="text-xs text-gray-500 mt-1">{labels}</p>
                          )}
                          {tr.duration_weeks && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {tr.duration_weeks} {t('주', 'weeks', 'semaines')}
                              {tr.class_count > 0 && ` · ${tr.class_count} ${t('회', 'classes', 'cours')}`}
                              {tr.day_of_week && ` · ${tr.day_of_week}`}
                            </p>
                          )}
                          {!tr.duration_weeks && tr.day_of_week && tr.day_of_week !== 'TBD' && (
                            <p className="text-xs text-gray-400 mt-0.5">{tr.day_of_week} · {tr.time}</p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-semibold text-gray-900 text-sm">{effPrice(tr)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {tr.capacity - tr.enrolled} {t('자리', 'spots', 'places')}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}

          {/* ── STEP: FORM ── */}
          {!done && step === 'form' && (
            <form ref={formRef} onSubmit={handleSubmit} className="flex-1">

              {/* Track / LE summary strip */}
              {languageExchange ? (
                <div className="mx-5 mt-4 mb-2 bg-gray-50 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
                  <span className="font-medium text-gray-900">Language Exchange</span>
                  <span className="font-semibold text-gray-900">{t('무료', 'Free', 'Gratuit')}</span>
                </div>
              ) : selectedTrack ? (
                <div className="mx-5 mt-4 mb-2 bg-gray-50 rounded-xl px-4 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{trackName(selectedTrack)}</span>
                    <span className="font-semibold text-gray-900">{effPrice(selectedTrack)}</span>
                  </div>
                  {selectedTrack.day_of_week && selectedTrack.day_of_week !== 'TBD' && (
                    <p className="text-gray-500 text-xs mt-0.5">
                      {selectedTrack.day_of_week} · {selectedTrack.time} · {selectedTrack.location}
                    </p>
                  )}
                </div>
              ) : null}

              <div className="px-5 pb-4 pt-3 space-y-5">
                {/* Contact info */}
                <div>
                  <p className="form-section-label">
                    {t('연락처 정보', 'Contact Info', 'Coordonnées')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {([
                      ['name',      t('이름','Name','Nom'),              'text',  true ],
                      ['email',     t('이메일','Email','Email'),          'email', true ],
                      ['phone',     t('전화번호','Phone','Téléphone'),     'tel',   false],
                      ['instagram', 'Instagram',                         'text',  false],
                    ] as [keyof typeof form, string, string, boolean][]).map(([key, label, type, req]) => (
                      <div key={key} className={key === 'email' ? 'sm:col-span-2' : ''}>
                        <label className="label">
                          {label}{req && <span className="text-red-400 ml-0.5">*</span>}
                        </label>
                        <input type={type} required={req} value={form[key]}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                          placeholder={key === 'instagram' ? '@username' : ''}
                          className="input"
                          autoComplete={key === 'name' ? 'name' : key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'off'}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Questions: LE hardcoded or DB dynamic */}
                {languageExchange ? (
                  <div>
                    <p className="form-section-label">
                      {t('추가 정보', 'Additional Info', 'Informations supplémentaires')}
                    </p>
                    <div className="space-y-4">
                      {LE_QUESTIONS.map(q => {
                        const label = lang === 'ko' ? q.ko : lang === 'fr' ? q.fr : q.en
                        return (
                          <div key={q.id}>
                            <label className="label">
                              {label}{q.required && <span className="text-red-400 ml-0.5">*</span>}
                            </label>
                            {q.type === 'textarea' ? (
                              <textarea rows={3} required={q.required}
                                value={answers[q.id] || ''}
                                onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                                className="input resize-none"
                                placeholder={t('자유롭게 작성해주세요.', 'Your answer here…', 'Votre réponse ici…')}
                              />
                            ) : q.type === 'select' ? (
                              <select required={q.required} value={answers[q.id] || ''}
                                onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                                className="input">
                                <option value="">{t('선택하세요', 'Select…', 'Sélectionner…')}</option>
                                {q.options.split(',').map(o => o.trim()).filter(Boolean).map(o => (
                                  <option key={o} value={o}>{o}</option>
                                ))}
                              </select>
                            ) : (
                              <input type="text" required={q.required}
                                value={answers[q.id] || ''}
                                onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                                className="input"
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    {visibleQuestions.length > 0 && (
                      <div>
                        <p className="form-section-label">
                          {t('추가 정보', 'Additional Info', 'Informations supplémentaires')}
                        </p>
                        <div className="space-y-4">
                          {visibleQuestions.map(q => (
                            <div key={q.id}>
                              <label className="label">
                                {qLabel(q)}{q.required && <span className="text-red-400 ml-0.5">*</span>}
                              </label>
                              {q.type === 'textarea' ? (
                                <textarea rows={3} required={q.required}
                                  value={answers[q.id] || ''}
                                  onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                                  className="input resize-none"
                                  placeholder={t('자유롭게 작성해주세요.','Your answer here…','Votre réponse ici…')}
                                />
                              ) : q.type === 'select' ? (
                                <select required={q.required} value={answers[q.id] || ''}
                                  onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                                  className="input">
                                  <option value="">{t('선택하세요','Select…','Sélectionner…')}</option>
                                  {q.options?.split(',').map(o => o.trim()).filter(Boolean).map(o => (
                                    <option key={o} value={o}>{o}</option>
                                  ))}
                                </select>
                              ) : (
                                <input type="text" required={q.required}
                                  value={answers[q.id] || ''}
                                  onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                                  className="input"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sticky footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 space-y-3">
                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                    <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p className="text-red-600 text-xs">{error}</p>
                  </div>
                )}
                <button type="submit" disabled={submitting}
                  className="btn-yellow w-full py-3 text-base font-bold disabled:opacity-50">
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      {t('제출 중…','Submitting…','Envoi…')}
                    </span>
                  ) : t('신청 제출','Submit Application','Envoyer')}
                </button>
                <p className="text-[11px] text-gray-400 text-center">
                  {t('* 필수 항목','* Required fields','* Champs obligatoires')}
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
