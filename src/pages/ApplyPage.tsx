import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Check, ArrowRight, ChevronDown } from 'lucide-react'
import { getTrackById, submitProgramApplication } from '../lib/db'
import { trackEvent } from '../lib/analytics'
import type { ProgramTrack } from '../types'

// ─── Section config ───────────────────────────────────────────────────────────

interface SectionMeta {
  id: string
  label: string
  firstStep: number
}

const SECTIONS: SectionMeta[] = [
  { id: 'basic',    label: 'Basic Information',       firstStep: 0  },
  { id: 'montreal', label: 'Your Montréal Journey',   firstStep: 4  },
  { id: 'korean',   label: 'Your Korean Journey',     firstStep: 6  },
  { id: 'goals',    label: 'Your Goals',              firstStep: 9  },
  { id: 'learning', label: 'Learning Style',          firstStep: 11 },
  { id: 'hakkyo',   label: 'About HAKKYO',            firstStep: 12 },
  { id: 'last',     label: 'One Last Question',       firstStep: 14 },
]

// ─── Step config ──────────────────────────────────────────────────────────────

interface FieldConfig {
  key: string
  label?: string
  type: 'text' | 'email' | 'textarea' | 'radio'
  options?: string[]
  placeholder?: string
  required?: boolean
  autoAdvance?: boolean
}

interface StepConfig {
  id: string
  section: string
  heading: string
  subheading?: string
  fields: FieldConfig[]
}

const STEPS: StepConfig[] = [
  // ── Basic Information ──
  {
    id: 'name', section: 'basic',
    heading: "Let's start with your name.",
    fields: [
      { key: 'name',           label: 'Full name',                 type: 'text',  required: true, placeholder: 'Your full name' },
      { key: 'preferred_name', label: 'What should we call you?',  type: 'text',  placeholder: 'Nickname or given name (optional)' },
    ],
  },
  {
    id: 'contact', section: 'basic',
    heading: 'How can we reach you?',
    fields: [
      { key: 'email', label: 'Email address',        type: 'email', required: true, placeholder: 'your@email.com' },
      { key: 'phone', label: 'Phone / KakaoTalk ID', type: 'text',  placeholder: '+1 514 … or KakaoTalk ID' },
    ],
  },
  {
    id: 'contact_pref', section: 'basic',
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
    id: 'languages', section: 'basic',
    heading: 'What languages do you speak?',
    subheading: 'Include languages you are currently learning too.',
    fields: [
      { key: 'languages_spoken', type: 'text', placeholder: 'e.g. English, French, Mandarin, Korean' },
    ],
  },

  // ── Your Montréal Journey ──
  {
    id: 'montreal_time', section: 'montreal',
    heading: 'How long have you been in Montréal?',
    fields: [
      {
        key: 'time_in_montreal', type: 'radio', autoAdvance: true,
        options: ['Less than 1 year', '1–3 years', '3–5 years', 'More than 5 years'],
      },
    ],
  },
  {
    id: 'stage', section: 'montreal',
    heading: 'What stage of life are you in right now?',
    fields: [
      {
        key: 'current_stage', type: 'radio',
        options: ['Student', 'Working', 'Looking for work', 'Freelancing / Self-employed', 'Other'],
      },
      { key: 'current_focus', label: 'What are you currently focused on?', type: 'textarea', placeholder: 'Studies, a new job, settling in, a side project…' },
    ],
  },

  // ── Your Korean Journey ──
  {
    id: 'korean_level', section: 'korean',
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
    id: 'korean_exp', section: 'korean',
    heading: 'Any previous Korean experience?',
    subheading: 'Classes, self-study, time in Korea, K-dramas — it all counts.',
    fields: [
      { key: 'previous_korean_exp', type: 'textarea', placeholder: 'Tell us what you know and how you got there…' },
    ],
  },
  {
    id: 'korean_story', section: 'korean',
    heading: 'Why Korean?',
    subheading: 'What draws you to learning Korean specifically?',
    fields: [
      { key: 'interest_in_korean', type: 'textarea', placeholder: 'Culture, people, work, music, a personal story…' },
    ],
  },

  // ── Your Goals ──
  {
    id: 'goals', section: 'goals',
    heading: 'What do you want to achieve?',
    fields: [
      { key: 'first_korean_goal', label: 'The first thing you want to do in Korean:', type: 'text',     placeholder: 'e.g. Order coffee, introduce myself, talk with family' },
      { key: 'six_month_goal',   label: 'Where do you want to be in 6 months?',      type: 'textarea', placeholder: 'Your honest vision…' },
    ],
  },
  {
    id: 'why_join', section: 'goals',
    heading: 'Why are you joining HAKKYO?',
    subheading: 'What made you want to apply to this program?',
    fields: [
      { key: 'reason_for_joining', type: 'textarea', placeholder: 'What brought you here?' },
    ],
  },

  // ── Learning Style ──
  {
    id: 'learning', section: 'learning',
    heading: 'How do you learn best?',
    fields: [
      { key: 'biggest_challenge',    label: "What's your biggest challenge in learning a language?", type: 'textarea', placeholder: 'Be honest — this helps us help you.' },
      {
        key: 'preferred_environment', label: 'Preferred learning environment', type: 'radio',
        options: ['Structured with clear goals', 'Conversational and organic', 'A mix of both', 'Self-paced with support'],
      },
    ],
  },

  // ── About HAKKYO ──
  {
    id: 'discovery', section: 'hakkyo',
    heading: 'How did you find HAKKYO?',
    fields: [
      {
        key: 'how_found_hakkyo', type: 'radio', autoAdvance: true,
        options: ['Instagram', 'A friend or community member', 'Language Exchange event', 'Google search', 'Other'],
      },
    ],
  },
  {
    id: 'why_hakkyo', section: 'hakkyo',
    heading: 'What interested you most about HAKKYO?',
    subheading: 'The approach, the community, something you heard — share what stood out.',
    fields: [
      { key: 'what_interested', type: 'textarea', placeholder: 'Tell us what drew you in…' },
    ],
  },

  // ── One Last Question ──
  {
    id: 'open', section: 'last',
    heading: 'One last question.',
    subheading: 'Optional. Take as much or as little space as you need.',
    fields: [
      { key: 'definition_great_class', label: 'What makes a great language class to you?', type: 'textarea', placeholder: 'Your honest take…' },
      { key: 'questions_for_hakkyo',   label: 'Any questions for us?',                      type: 'textarea', placeholder: 'Anything you want to know before joining…' },
    ],
  },
]

const TOTAL = STEPS.length

// ─── Draft ────────────────────────────────────────────────────────────────────

const DRAFT_KEY = (id: string) => `hakkyo_apply_${id}`
type Draft = Record<string, string>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortLevel(raw: string): string {
  if (raw.includes('beginner') || raw.includes('limit')) return 'Complete beginner'
  if (raw.includes('basics'))                            return 'Some basics'
  if (raw.includes('simple'))                            return 'Simple conversations'
  if (raw.includes('struggle'))                          return 'Intermediate'
  if (raw.includes('comfortable'))                       return 'Fairly comfortable'
  return raw
}

function sectionForStep(stepIndex: number): string {
  let current = 'basic'
  for (const s of SECTIONS) {
    if (stepIndex >= s.firstStep) current = s.id
    else break
  }
  return current
}

// ─── Profile Summary Panel ────────────────────────────────────────────────────

function ProfileSummary({ draft, step }: { draft: Draft; step: number }) {
  const name      = draft.preferred_name?.trim() || draft.name?.trim()
  const languages = draft.languages_spoken?.trim()
  const time      = draft.time_in_montreal
  const focus     = draft.current_focus?.trim()
  const stage     = draft.current_stage
  const level     = draft.korean_level ? shortLevel(draft.korean_level) : null
  const goal      = draft.first_korean_goal?.trim()
  const why       = draft.reason_for_joining?.trim()

  const hasAnything = name || level || time || goal

  if (step < 1 || !hasAnything) {
    return (
      <div className="pt-2">
        <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-gray-300 mb-4">Your profile</p>
        <p className="text-[12px] text-gray-300 leading-relaxed">
          Your answers will appear here as you go.
        </p>
      </div>
    )
  }

  return (
    <div className="pt-2">
      <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-gray-300 mb-5">Your profile</p>

      {name && (
        <p className="text-[15px] font-medium text-gray-700 mb-4 leading-snug">{name}</p>
      )}

      <div className="space-y-4">
        {(time || stage || focus) && (
          <SummaryBlock label="Montréal">
            {time && <SummaryLine>{time}</SummaryLine>}
            {stage && <SummaryLine>{stage}</SummaryLine>}
            {focus && <SummaryLine muted>{focus}</SummaryLine>}
          </SummaryBlock>
        )}

        {languages && (
          <SummaryBlock label="Languages">
            <SummaryLine>{languages}</SummaryLine>
          </SummaryBlock>
        )}

        {level && (
          <SummaryBlock label="Korean">
            <SummaryLine>{level}</SummaryLine>
          </SummaryBlock>
        )}

        {goal && (
          <SummaryBlock label="First goal">
            <SummaryLine>{goal}</SummaryLine>
          </SummaryBlock>
        )}

        {why && (
          <SummaryBlock label="Why joining">
            <SummaryLine muted>{why.length > 90 ? why.slice(0, 90) + '…' : why}</SummaryLine>
          </SummaryBlock>
        )}
      </div>
    </div>
  )
}

function SummaryBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] font-bold tracking-[0.16em] uppercase text-gray-300 mb-1">{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function SummaryLine({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <p className={['text-[12px] leading-snug', muted ? 'text-gray-400' : 'text-gray-600'].join(' ')}>
      {children}
    </p>
  )
}

// ─── Radio option ─────────────────────────────────────────────────────────────

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

// ─── Section pill ─────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-gray-300 mb-5">
      {label}
    </p>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ApplyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [program, setProgram]         = useState<ProgramTrack | null>(null)
  const [loadingProg, setLoadingProg] = useState(true)

  // -1 = welcome, 0..N-1 = steps, N = review
  const [step, setStep]             = useState(-1)
  const [draft, setDraft]           = useState<Draft>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState('')
  const [visible, setVisible]       = useState(true)
  const [summaryOpen, setSummaryOpen] = useState(false)  // mobile

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

  const isWelcome = step === -1
  const isReview  = step === TOTAL
  const progress  = isWelcome ? 0 : isReview ? 1 : (step + 1) / TOTAL

  const set = (key: string, value: string) =>
    setDraft(d => ({ ...d, [key]: value }))

  const transition = useCallback((fn: () => void) => {
    setVisible(false)
    setTimeout(() => { fn(); setVisible(true) }, 140)
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
      const stepCfg = STEPS.find(s => s.fields.some(f => f.key === key))
      const otherText = stepCfg?.fields.filter(f => f.key !== key && f.type !== 'radio') ?? []
      const allFilled = otherText.every(f => draft[f.key]?.trim())
      if (otherText.length === 0 || allFilled) {
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
        program_id:             id ?? null,
        program_name:           program ? (program.name_en || program.name_ko) : null,
        name:                   draft.name?.trim() ?? '',
        preferred_name:         draft.preferred_name?.trim() || null,
        email:                  draft.email?.trim() ?? '',
        phone:                  draft.phone?.trim() || null,
        preferred_contact:      draft.preferred_contact || null,
        languages_spoken:       draft.languages_spoken?.trim() || null,
        instagram:              draft.instagram?.trim() || null,
        time_in_montreal:       draft.time_in_montreal || null,
        current_stage:          draft.current_stage || null,
        current_focus:          draft.current_focus?.trim() || null,
        previous_korean_exp:    draft.previous_korean_exp?.trim() || null,
        korean_level:           draft.korean_level || null,
        interest_in_korean:     draft.interest_in_korean?.trim() || null,
        reason_for_joining:     draft.reason_for_joining?.trim() || null,
        first_korean_goal:      draft.first_korean_goal?.trim() || null,
        six_month_goal:         draft.six_month_goal?.trim() || null,
        biggest_challenge:      draft.biggest_challenge?.trim() || null,
        preferred_environment:  draft.preferred_environment || null,
        how_found_hakkyo:       draft.how_found_hakkyo || null,
        what_interested:        draft.what_interested?.trim() || null,
        definition_great_class: draft.definition_great_class?.trim() || null,
        questions_for_hakkyo:   draft.questions_for_hakkyo?.trim() || null,
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
        <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center mb-6">
          <Check size={18} className="text-white" />
        </div>
        <h1 className="text-2xl font-light text-gray-900 mb-3">Application received.</h1>
        <p className="text-[14px] text-gray-400 leading-relaxed max-w-sm mb-8">
          Thank you, {draft.preferred_name?.trim() || draft.name?.trim()}. We read every application personally and will be in touch within a few days.
        </p>
        <Link to="/programs" className="text-sm text-gray-400 hover:text-gray-900 transition-colors underline underline-offset-4">
          Back to programs
        </Link>
      </div>
    )
  }

  // ── Welcome ──
  if (isWelcome) {
    const programName = program ? (program.name_en || program.name_ko) : 'this program'
    return (
      <div
        className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.15s ease' }}
      >
        <div className="max-w-lg w-full">
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-300 mb-6">
            Application
          </p>
          <h1 className="text-3xl font-light text-gray-900 leading-tight mb-3">
            {programName}
          </h1>
          <p className="text-[14px] text-gray-400 leading-relaxed mb-3 max-w-xs">
            A short set of questions so we can get to know you before you join.
          </p>
          <p className="text-[13px] text-gray-300 mb-10">About 5 minutes.</p>

          {Object.keys(draft).length > 0 && (
            <p className="text-[11px] text-gray-400 mb-6">↩ You have a saved draft.</p>
          )}

          <button
            onClick={() => transition(() => setStep(0))}
            className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Begin
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    )
  }

  // ── Review screen ──
  if (isReview) {
    const reviewSections = [
      {
        label: 'Basic Information',
        sectionId: 'basic',
        firstStep: 0,
        rows: [
          { q: 'Name',         a: [draft.name, draft.preferred_name && `(${draft.preferred_name})`].filter(Boolean).join(' ') },
          { q: 'Email',        a: draft.email ?? '' },
          { q: 'Phone',        a: draft.phone ?? '' },
          { q: 'Contact via',  a: draft.preferred_contact ?? '' },
          { q: 'Instagram',    a: draft.instagram ?? '' },
          { q: 'Languages',    a: draft.languages_spoken ?? '' },
        ].filter(r => r.a),
      },
      {
        label: 'Your Montréal Journey',
        sectionId: 'montreal',
        firstStep: 4,
        rows: [
          { q: 'Time in Montréal', a: draft.time_in_montreal ?? '' },
          { q: 'Stage',            a: draft.current_stage ?? '' },
          { q: 'Currently focused on', a: draft.current_focus ?? '' },
        ].filter(r => r.a),
      },
      {
        label: 'Your Korean Journey',
        sectionId: 'korean',
        firstStep: 6,
        rows: [
          { q: 'Korean level',   a: draft.korean_level ? shortLevel(draft.korean_level) : '' },
          { q: 'Experience',     a: draft.previous_korean_exp ?? '' },
          { q: 'Why Korean?',    a: draft.interest_in_korean ?? '' },
        ].filter(r => r.a),
      },
      {
        label: 'Your Goals',
        sectionId: 'goals',
        firstStep: 9,
        rows: [
          { q: 'First thing in Korean', a: draft.first_korean_goal ?? '' },
          { q: 'In 6 months',           a: draft.six_month_goal ?? '' },
          { q: 'Why joining',           a: draft.reason_for_joining ?? '' },
        ].filter(r => r.a),
      },
      {
        label: 'Learning Style',
        sectionId: 'learning',
        firstStep: 11,
        rows: [
          { q: 'Biggest challenge', a: draft.biggest_challenge ?? '' },
          { q: 'Environment',       a: draft.preferred_environment ?? '' },
        ].filter(r => r.a),
      },
      {
        label: 'About HAKKYO',
        sectionId: 'hakkyo',
        firstStep: 12,
        rows: [
          { q: 'How found us',       a: draft.how_found_hakkyo ?? '' },
          { q: 'What interested you', a: draft.what_interested ?? '' },
        ].filter(r => r.a),
      },
      {
        label: 'One Last Question',
        sectionId: 'last',
        firstStep: 14,
        rows: [
          { q: 'A great class',    a: draft.definition_great_class ?? '' },
          { q: 'Questions for us', a: draft.questions_for_hakkyo ?? '' },
        ].filter(r => r.a),
      },
    ]

    return (
      <div
        className="max-w-2xl mx-auto px-6 py-10"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.15s ease' }}
      >
        <div className="h-0.5 bg-gray-900 w-full mb-8 rounded-full" />

        <button onClick={back} className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors mb-8">
          <ChevronLeft size={13} /> Back
        </button>

        <h2 className="text-2xl font-light text-gray-900 mb-1">Review your application.</h2>
        <p className="text-[13px] text-gray-400 mb-8 leading-relaxed">
          Take a moment to read through. This is the profile we'll see when reviewing your application.
        </p>

        <div className="space-y-4 mb-10">
          {reviewSections.map(sec => (
            sec.rows.length > 0 && (
              <div key={sec.label} className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/60">
                  <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-400">{sec.label}</p>
                  <button
                    onClick={() => transition(() => setStep(sec.firstStep))}
                    className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    Edit
                  </button>
                </div>
                <div className="px-4 py-3 space-y-2.5">
                  {sec.rows.map(row => (
                    <div key={row.q} className="grid grid-cols-[140px_1fr] gap-3 text-sm">
                      <span className="text-gray-400 text-[12px] pt-0.5 shrink-0">{row.q}</span>
                      <span className="text-gray-700 leading-snug whitespace-pre-wrap">{row.a}</span>
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
          We read every application personally and follow up within a few days.
        </p>
      </div>
    )
  }

  // ── Question step ──
  const s       = STEPS[step]
  const stepNum = step + 1
  const secMeta = SECTIONS.find(sec => sec.id === s.section)
  const hasSummaryContent = Object.keys(draft).some(k => draft[k]?.trim())

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

      {/* Header nav */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0">
        <button
          onClick={back}
          className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={13} /> Back
        </button>
        <span className="text-[11px] text-gray-300 tracking-wide">{stepNum} / {TOTAL}</span>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Question column */}
        <div
          className="flex-1 flex flex-col justify-center px-6 pb-12 overflow-y-auto"
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.14s ease' }}
        >
          <div className="max-w-xl w-full mx-auto">

            {secMeta && <SectionLabel label={secMeta.label} />}

            <h2 className="text-2xl md:text-[28px] font-light text-gray-900 leading-tight mb-2">
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
                {step === TOTAL - 1 ? 'Review' : 'Continue'}
                <ArrowRight size={15} />
              </button>
              <span className="text-[11px] text-gray-300 hidden sm:inline">
                Press <kbd className="border border-gray-200 rounded px-1 py-0.5 text-[9px] font-mono">Enter</kbd>
              </span>
            </div>

            {!s.fields.some(f => f.required) && step > 1 && (
              <button
                onClick={advance}
                className="mt-3 text-[11px] text-gray-300 hover:text-gray-500 transition-colors text-left"
              >
                Skip this question
              </button>
            )}

            {/* Mobile: collapsible summary */}
            {hasSummaryContent && step >= 1 && (
              <div className="lg:hidden mt-10 border-t border-gray-100 pt-4">
                <button
                  onClick={() => setSummaryOpen(o => !o)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-gray-400">
                    Your profile so far
                  </span>
                  <ChevronDown
                    size={14}
                    className={['text-gray-300 transition-transform', summaryOpen ? 'rotate-180' : ''].join(' ')}
                  />
                </button>
                {summaryOpen && (
                  <div className="mt-4">
                    <ProfileSummary draft={draft} step={step} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop: summary panel */}
        <aside className="hidden lg:flex flex-col w-60 xl:w-64 border-l border-gray-50 px-6 py-10 shrink-0 overflow-y-auto">
          <ProfileSummary draft={draft} step={step} />
        </aside>

      </div>
    </div>
  )
}
