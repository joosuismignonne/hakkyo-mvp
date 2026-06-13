import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Check, ArrowRight } from 'lucide-react'
import { getTrackById, submitProgramApplication } from '../lib/db'
import { trackEvent } from '../lib/analytics'
import type { ProgramTrack } from '../types'

// ─── Step config ──────────────────────────────────────────────────────────────

interface FieldConfig {
  key: string
  label?: string
  type: 'text' | 'email' | 'textarea' | 'radio'
  options?: string[]
  placeholder?: string
  required?: boolean
  autoAdvance?: boolean   // single-radio screens: advance automatically on pick
}

interface StepConfig {
  id: string
  heading: string
  subheading?: string
  fields: FieldConfig[]
}

const STEPS: StepConfig[] = [
  {
    id: 'name',
    heading: "Let's start with your name.",
    fields: [
      { key: 'name',           label: 'Full name',              type: 'text',  required: true, placeholder: 'Your full name' },
      { key: 'preferred_name', label: 'What should we call you?', type: 'text', placeholder: 'Nickname or given name (optional)' },
    ],
  },
  {
    id: 'contact',
    heading: 'How can we reach you?',
    fields: [
      { key: 'email', label: 'Email address',        type: 'email', required: true, placeholder: 'your@email.com' },
      { key: 'phone', label: 'Phone / KakaoTalk ID', type: 'text',  placeholder: '+1 514 … or KakaoTalk ID' },
    ],
  },
  {
    id: 'contact_pref',
    heading: "What's the best way to contact you?",
    fields: [
      {
        key: 'preferred_contact', type: 'radio', autoAdvance: true,
        options: ['Email', 'Phone / SMS', 'KakaoTalk', 'Instagram DM'],
      },
      { key: 'instagram', label: 'Instagram (optional)', type: 'text', placeholder: '@handle' },
    ],
  },
  {
    id: 'languages',
    heading: 'What languages do you speak?',
    subheading: 'Include languages you are currently learning too.',
    fields: [
      { key: 'languages_spoken', type: 'text', placeholder: 'e.g. English, French, Mandarin, Korean' },
    ],
  },
  {
    id: 'montreal_time',
    heading: 'How long have you been in Montréal?',
    fields: [
      {
        key: 'time_in_montreal', type: 'radio', autoAdvance: true,
        options: ['Less than 1 year', '1–3 years', '3–5 years', 'More than 5 years'],
      },
    ],
  },
  {
    id: 'stage',
    heading: 'What stage of life are you in right now?',
    fields: [
      {
        key: 'current_stage', type: 'radio',
        options: ['Student', 'Working', 'Looking for work', 'Freelancing / Self-employed', 'Other'],
      },
      { key: 'current_focus', label: 'What are you currently focused on?', type: 'textarea', placeholder: 'Studies, a new job, settling in, a side project…' },
    ],
  },
  {
    id: 'korean_level',
    heading: 'How would you describe your Korean right now?',
    fields: [
      {
        key: 'korean_level', type: 'radio', autoAdvance: true,
        options: [
          'Complete beginner — 안녕하세요 is my limit',
          'I know some basics',
          'I can have simple conversations',
          'I can express myself, but struggle',
          "I'm fairly comfortable in Korean",
        ],
      },
    ],
  },
  {
    id: 'korean_exp',
    heading: 'Any previous Korean experience?',
    subheading: 'Classes, self-study, time in Korea, K-dramas — it all counts.',
    fields: [
      { key: 'previous_korean_exp', type: 'textarea', placeholder: 'Tell us what you know and how you got there…' },
    ],
  },
  {
    id: 'why_korean',
    heading: 'Why Korean?',
    subheading: 'What draws you to learning Korean specifically?',
    fields: [
      { key: 'interest_in_korean', type: 'textarea', placeholder: 'Culture, people, work, music, a personal story…' },
    ],
  },
  {
    id: 'why_hakkyo',
    heading: 'Why HAKKYO?',
    subheading: 'What made you want to apply to this program?',
    fields: [
      { key: 'reason_for_joining', type: 'textarea', placeholder: 'What brought you here?' },
      { key: 'what_interested', label: 'What interested you most about HAKKYO?', type: 'textarea', placeholder: 'The approach, the community, something you heard…' },
    ],
  },
  {
    id: 'goals',
    heading: 'What do you want to achieve?',
    fields: [
      { key: 'first_korean_goal', label: 'The first thing you want to do in Korean:', type: 'text', placeholder: 'e.g. Order coffee, introduce myself, talk with family' },
      { key: 'six_month_goal',   label: 'Where do you want to be in 6 months?',       type: 'textarea', placeholder: 'Your honest vision…' },
    ],
  },
  {
    id: 'learning',
    heading: 'How do you learn best?',
    fields: [
      { key: 'biggest_challenge', label: "What's your biggest challenge in learning a language?", type: 'textarea', placeholder: 'Be honest — this helps us help you.' },
      {
        key: 'preferred_environment', label: 'Preferred learning environment', type: 'radio',
        options: ['Structured with clear goals', 'Conversational and organic', 'A mix of both', 'Self-paced with support'],
      },
    ],
  },
  {
    id: 'discovery',
    heading: 'How did you find HAKKYO?',
    fields: [
      {
        key: 'how_found_hakkyo', type: 'radio', autoAdvance: true,
        options: ['Instagram', 'A friend or community member', 'Language Exchange event', 'Google search', 'Other'],
      },
    ],
  },
  {
    id: 'open',
    heading: 'Last thoughts.',
    subheading: 'Two optional questions. Take as much or as little space as you need.',
    fields: [
      { key: 'definition_great_class', label: 'What makes a great language class to you?', type: 'textarea', placeholder: 'Your honest take…' },
      { key: 'questions_for_hakkyo',   label: 'Any questions for us?',                      type: 'textarea', placeholder: 'Anything you want to know before joining…' },
    ],
  },
]

const DRAFT_KEY = (id: string) => `hakkyo_apply_${id}`

type Draft = Record<string, string>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortKoreanLevel(raw: string): string {
  if (raw.includes('beginner') || raw.includes('limit'))  return 'Complete beginner'
  if (raw.includes('basics'))                              return 'Some basics'
  if (raw.includes('simple'))                              return 'Simple conversations'
  if (raw.includes('struggle'))                            return 'Intermediate'
  if (raw.includes('comfortable'))                         return 'Fairly comfortable'
  return raw
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RadioOption({
  label, index, selected, onClick,
}: { label: string; index: number; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm transition-all duration-150',
        selected
          ? 'border-gray-900 bg-gray-900 text-white'
          : 'border-gray-200 text-gray-700 hover:border-gray-400 bg-white',
      ].join(' ')}
    >
      <span className={[
        'shrink-0 w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold border transition-colors',
        selected ? 'border-white text-white' : 'border-gray-300 text-gray-400',
      ].join(' ')}>
        {String.fromCharCode(65 + index)}
      </span>
      <span className="leading-snug">{label}</span>
      {selected && <Check size={14} className="ml-auto shrink-0" />}
    </button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ApplyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [program, setProgram]     = useState<ProgramTrack | null>(null)
  const [loadingProg, setLoadingProg] = useState(true)

  // -1 = welcome, 0..N-1 = question steps, N = review
  const [step, setStep]       = useState(-1)
  const [draft, setDraft]     = useState<Draft>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')
  const [visible, setVisible] = useState(true)   // for fade transition

  const firstInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  // Load program
  useEffect(() => {
    if (!id) { setLoadingProg(false); return }
    getTrackById(id)
      .then(p => setProgram(p))
      .catch(() => {})
      .finally(() => setLoadingProg(false))
  }, [id])

  // Load saved draft
  useEffect(() => {
    if (!id) return
    try {
      const raw = localStorage.getItem(DRAFT_KEY(id))
      if (raw) setDraft(JSON.parse(raw))
    } catch {}
  }, [id])

  // Persist draft
  useEffect(() => {
    if (!id || Object.keys(draft).length === 0) return
    try { localStorage.setItem(DRAFT_KEY(id), JSON.stringify(draft)) } catch {}
  }, [draft, id])

  const totalSteps = STEPS.length
  const isWelcome  = step === -1
  const isReview   = step === totalSteps
  const progress   = isWelcome ? 0 : isReview ? 1 : (step + 1) / totalSteps
  const currentStep = !isWelcome && !isReview ? STEPS[step] : null

  const set = (key: string, value: string) =>
    setDraft(d => ({ ...d, [key]: value }))

  // Fade-transition helper
  const transition = useCallback((fn: () => void) => {
    setVisible(false)
    setTimeout(() => { fn(); setVisible(true) }, 150)
  }, [])

  function advance() {
    transition(() => setStep(s => s + 1))
    if (firstInputRef.current) firstInputRef.current.blur()
  }

  function back() {
    transition(() => setStep(s => Math.max(-1, s - 1)))
  }

  function handleRadioSelect(key: string, value: string, autoAdvance: boolean) {
    set(key, value)
    if (autoAdvance) {
      // Only auto-advance if this is the only field (or all other fields are text)
      const step = STEPS.find(s => s.fields.some(f => f.key === key))
      const otherTextFields = step?.fields.filter(f => f.key !== key && f.type !== 'radio') ?? []
      const allOtherFilled = otherTextFields.every(f => draft[f.key]?.trim())
      if (otherTextFields.length === 0 || allOtherFilled) {
        setTimeout(() => transition(() => setStep(s => s + 1)), 280)
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault()
      advance()
    }
  }

  async function submit() {
    if (!draft.name?.trim() || !draft.email?.trim()) {
      setError('Name and email are required.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await submitProgramApplication({
        program_id:            id ?? null,
        program_name:          program ? (program.name_en || program.name_ko) : null,
        name:                  draft.name?.trim() ?? '',
        preferred_name:        draft.preferred_name?.trim() || null,
        email:                 draft.email?.trim() ?? '',
        phone:                 draft.phone?.trim() || null,
        preferred_contact:     draft.preferred_contact || null,
        languages_spoken:      draft.languages_spoken?.trim() || null,
        instagram:             draft.instagram?.trim() || null,
        time_in_montreal:      draft.time_in_montreal || null,
        current_stage:         draft.current_stage || null,
        current_focus:         draft.current_focus?.trim() || null,
        previous_korean_exp:   draft.previous_korean_exp?.trim() || null,
        korean_level:          draft.korean_level || null,
        interest_in_korean:    draft.interest_in_korean?.trim() || null,
        reason_for_joining:    draft.reason_for_joining?.trim() || null,
        first_korean_goal:     draft.first_korean_goal?.trim() || null,
        six_month_goal:        draft.six_month_goal?.trim() || null,
        biggest_challenge:     draft.biggest_challenge?.trim() || null,
        preferred_environment: draft.preferred_environment || null,
        how_found_hakkyo:      draft.how_found_hakkyo || null,
        what_interested:       draft.what_interested?.trim() || null,
        definition_great_class: draft.definition_great_class?.trim() || null,
        questions_for_hakkyo:  draft.questions_for_hakkyo?.trim() || null,
      })
      trackEvent('application_submitted', { type: 'program', program_id: id ?? '' })
      if (id) { try { localStorage.removeItem(DRAFT_KEY(id)) } catch {} }
      setDone(true)
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ──
  if (loadingProg) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-4 h-4 border border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── Success ──
  if (done) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center mb-6">
          <Check size={22} className="text-white" />
        </div>
        <h1 className="text-2xl font-light text-gray-900 mb-3">Application received.</h1>
        <p className="text-[14px] text-gray-400 leading-relaxed max-w-sm mb-8">
          Thank you, {draft.preferred_name || draft.name}. We'll review your application and be in touch within a few days.
        </p>
        <Link to="/programs" className="text-sm text-gray-500 hover:text-gray-900 transition-colors underline underline-offset-4">
          Back to programs
        </Link>
      </div>
    )
  }

  // ── Welcome screen ──
  if (isWelcome) {
    const programName = program ? (program.name_en || program.name_ko) : 'this program'
    return (
      <div
        className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.15s ease' }}
      >
        <div className="max-w-lg w-full">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-gray-300 mb-6">
            Application
          </p>
          <h1 className="text-3xl font-light text-gray-900 leading-tight mb-3">
            {programName}
          </h1>
          <p className="text-[14px] text-gray-400 leading-relaxed mb-10 max-w-sm">
            Answer a few questions so we can get to know you.
            Takes about 5 minutes.
          </p>

          {Object.keys(draft).length > 0 && (
            <p className="text-[11px] text-gray-400 mb-6">
              ↩ You have a saved draft.
            </p>
          )}

          <button
            onClick={() => transition(() => setStep(0))}
            className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Begin application
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    )
  }

  // ── Review screen ──
  if (isReview) {
    const sections: { label: string; rows: { q: string; a: string }[] }[] = [
      {
        label: 'About you',
        rows: [
          { q: 'Name',             a: [draft.name, draft.preferred_name && `(${draft.preferred_name})`].filter(Boolean).join(' ') },
          { q: 'Email',            a: draft.email },
          { q: 'Phone',            a: draft.phone ?? '' },
          { q: 'Contact via',      a: draft.preferred_contact ?? '' },
          { q: 'Instagram',        a: draft.instagram ?? '' },
          { q: 'Languages',        a: draft.languages_spoken ?? '' },
        ].filter(r => r.a),
      },
      {
        label: 'Your Montréal',
        rows: [
          { q: 'Time here',    a: draft.time_in_montreal ?? '' },
          { q: 'Stage',        a: draft.current_stage ?? '' },
          { q: 'Focus',        a: draft.current_focus ?? '' },
        ].filter(r => r.a),
      },
      {
        label: 'Korean journey',
        rows: [
          { q: 'Level',         a: draft.korean_level ? shortKoreanLevel(draft.korean_level) : '' },
          { q: 'Experience',    a: draft.previous_korean_exp ?? '' },
          { q: 'Why Korean?',   a: draft.interest_in_korean ?? '' },
        ].filter(r => r.a),
      },
      {
        label: 'Goals',
        rows: [
          { q: 'Why HAKKYO?',    a: draft.reason_for_joining ?? '' },
          { q: 'First goal',     a: draft.first_korean_goal ?? '' },
          { q: '6 months',       a: draft.six_month_goal ?? '' },
        ].filter(r => r.a),
      },
      {
        label: 'Learning style',
        rows: [
          { q: 'Biggest challenge', a: draft.biggest_challenge ?? '' },
          { q: 'Environment',       a: draft.preferred_environment ?? '' },
        ].filter(r => r.a),
      },
    ]

    return (
      <div
        className="max-w-2xl mx-auto px-6 py-10"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.15s ease' }}
      >
        {/* Progress full */}
        <div className="h-0.5 bg-gray-900 w-full mb-8 rounded-full" />

        <button onClick={back} className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors mb-8">
          <ChevronLeft size={13} /> Back
        </button>

        <h2 className="text-2xl font-light text-gray-900 mb-2">Review your application.</h2>
        <p className="text-[13px] text-gray-400 mb-8">Click any section to go back and edit.</p>

        <div className="space-y-6 mb-10">
          {sections.map((sec, si) => (
            sec.rows.length > 0 && (
              <div key={sec.label} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-400">{sec.label}</p>
                  <button
                    onClick={() => transition(() => setStep(
                      si === 0 ? 0 : si === 1 ? 4 : si === 2 ? 6 : si === 3 ? 9 : 11
                    ))}
                    className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-2">
                  {sec.rows.map(row => (
                    <div key={row.q} className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                      <span className="text-gray-400 shrink-0">{row.q}</span>
                      <span className="text-gray-700 leading-snug">{row.a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full bg-gray-900 text-white rounded-xl py-4 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>

        <p className="text-[11px] text-gray-400 text-center mt-4 leading-relaxed">
          We review every application personally and follow up within a few days.
        </p>
      </div>
    )
  }

  // ── Question step ──
  const s = STEPS[step]
  const stepNum = step + 1

  return (
    <div
      className="min-h-[calc(100vh-64px)] flex flex-col"
      onKeyDown={handleKeyDown}
    >
      {/* Progress bar */}
      <div className="h-0.5 bg-gray-100 w-full">
        <div
          className="h-full bg-gray-900 transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={back}
          className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={13} />
          {step === 0 ? 'Back' : 'Back'}
        </button>
        <span className="text-[11px] text-gray-300 tracking-wide">
          {stepNum} / {totalSteps}
        </span>
      </div>

      {/* Content */}
      <div
        className="flex-1 flex flex-col justify-center px-6 pb-16 max-w-2xl mx-auto w-full"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.15s ease' }}
      >
        {/* Heading */}
        <h2 className="text-2xl md:text-3xl font-light text-gray-900 leading-tight mb-2">
          {s.heading}
        </h2>
        {s.subheading && (
          <p className="text-[13px] text-gray-400 leading-relaxed mb-8">{s.subheading}</p>
        )}
        {!s.subheading && <div className="mb-8" />}

        {/* Fields */}
        <div className="space-y-6">
          {s.fields.map((field, fi) => {
            const value = draft[field.key] ?? ''

            if (field.type === 'radio') {
              return (
                <div key={field.key}>
                  {field.label && (
                    <p className="text-[12px] text-gray-500 mb-3 font-medium">{field.label}</p>
                  )}
                  <div className="space-y-2">
                    {(field.options ?? []).map((opt, oi) => (
                      <RadioOption
                        key={opt}
                        label={opt}
                        index={oi}
                        selected={value === opt}
                        onClick={() => handleRadioSelect(field.key, opt, !!field.autoAdvance)}
                      />
                    ))}
                  </div>
                </div>
              )
            }

            if (field.type === 'textarea') {
              return (
                <div key={field.key}>
                  {field.label && (
                    <p className="text-[12px] text-gray-500 mb-2 font-medium">{field.label}</p>
                  )}
                  <textarea
                    ref={fi === 0 ? (el => { if (el) firstInputRef.current = el }) : undefined}
                    rows={4}
                    className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-gray-900 outline-none py-2 text-[15px] text-gray-900 leading-relaxed resize-none placeholder:text-gray-300 transition-colors"
                    placeholder={field.placeholder}
                    value={value}
                    onChange={e => set(field.key, e.target.value)}
                  />
                </div>
              )
            }

            // text / email
            return (
              <div key={field.key}>
                {field.label && (
                  <p className="text-[12px] text-gray-500 mb-2 font-medium">{field.label}</p>
                )}
                <input
                  ref={fi === 0 ? (el => { if (el) firstInputRef.current = el }) : undefined}
                  type={field.type}
                  className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-gray-900 outline-none py-2 text-[15px] text-gray-900 placeholder:text-gray-300 transition-colors"
                  placeholder={field.placeholder}
                  value={value}
                  onChange={e => set(field.key, e.target.value)}
                  autoComplete={field.type === 'email' ? 'email' : 'off'}
                />
              </div>
            )
          })}
        </div>

        {/* Continue */}
        <div className="mt-10 flex items-center gap-4">
          <button
            onClick={advance}
            className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            {step === totalSteps - 1 ? 'Review' : 'Continue'}
            <ArrowRight size={15} />
          </button>
          <span className="text-[11px] text-gray-300 hidden sm:inline">
            Press <kbd className="border border-gray-200 rounded px-1 py-0.5 text-[9px] font-mono">Enter</kbd>
          </span>
        </div>

        {/* Optional skip */}
        {!s.fields.some(f => f.required) && step > 1 && (
          <button
            onClick={advance}
            className="mt-3 text-[11px] text-gray-300 hover:text-gray-500 transition-colors text-left"
          >
            Skip this question
          </button>
        )}
      </div>
    </div>
  )
}
