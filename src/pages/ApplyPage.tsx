import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Check, ArrowRight, ChevronDown } from 'lucide-react'
import { getTrackById, submitProgramApplication } from '../lib/db'
import { trackEvent } from '../lib/analytics'
import type { ProgramTrack } from '../types'

// ---- Section config ---------------------------------------------------------

interface SectionMeta {
  id: string
  label: string      // French (primary)
  label_en: string   // English
  label_ko: string   // Korean
  firstStep: number
}

const SECTIONS: SectionMeta[] = [
  { id: 'basic',    label: 'Informations personnelles',  label_en: 'Basic Information',     label_ko: '기본 정보',       firstStep: 0  },
  { id: 'montreal', label: 'Votre parcours à Montréal', label_en: 'Your Montréal Journey', label_ko: '몬트리올 여정', firstStep: 4  },
  { id: 'korean',   label: 'Votre parcours en coréen',       label_en: 'Your Korean Journey',   label_ko: '한국어 여정',    firstStep: 6  },
  { id: 'goals',    label: 'Vos objectifs',              label_en: 'Your Goals',            label_ko: '나의 목표',        firstStep: 9  },
  { id: 'learning', label: "Votre façon d'apprendre", label_en: 'Learning Style',       label_ko: '학습 스타일',  firstStep: 11 },
  { id: 'hakkyo',   label: 'À propos de HAKKYO',    label_en: 'About HAKKYO',          label_ko: 'HAKKYO에 대하여', firstStep: 12 },
  { id: 'last',     label: 'Une dernière question', label_en: 'One Last Question',     label_ko: '마지막 질문',  firstStep: 14 },
]

// ---- Step config ------------------------------------------------------------

interface RadioOption {
  fr: string
  en: string
}

interface FieldConfig {
  key: string
  label?: string
  label_en?: string
  type: 'text' | 'email' | 'textarea' | 'radio'
  options?: RadioOption[]
  placeholder?: string
  required?: boolean
  autoAdvance?: boolean
}

interface StepConfig {
  id: string
  section: string
  heading: string
  heading_en: string
  heading_ko: string
  subheading?: string
  subheading_en?: string
  subheading_ko?: string
  fields: FieldConfig[]
}

const STEPS: StepConfig[] = [

  // -- Informations personnelles ----------------------------------------------
  {
    id: 'name', section: 'basic',
    heading:    "Commençons par votre nom.",
    heading_en: "Let's start with your name.",
    heading_ko: "이름을 알려주세요.",
    fields: [
      { key: 'name',           label: 'Nom complet',                              label_en: 'Full name',              type: 'text',  required: true, placeholder: 'Votre nom complet' },
      { key: 'preferred_name', label: "Comment souhaitez-vous qu'on vous appelle ?", label_en: 'What should we call you?', type: 'text', placeholder: 'Surnom ou prénom (facultatif)' },
    ],
  },
  {
    id: 'contact', section: 'basic',
    heading:    'Comment pouvons-nous vous contacter ?',
    heading_en: 'How can we reach you?',
    heading_ko: '어떻게 연락드릴까요?',
    fields: [
      { key: 'email', label: 'Adresse courriel',       label_en: 'Email address',        type: 'email', required: true, placeholder: 'votre@courriel.com' },
      { key: 'phone', label: 'Téléphone / KakaoTalk', label_en: 'Phone / KakaoTalk ID', type: 'text', placeholder: '+1 514 … ou ID KakaoTalk' },
    ],
  },
  {
    id: 'contact_pref', section: 'basic',
    heading:    'Quel est le meilleur moyen de vous joindre ?',
    heading_en: "What's the best way to contact you?",
    heading_ko: '어떤 방법으로 연락하는 게 좋으세요?',
    fields: [
      {
        key: 'preferred_contact', type: 'radio', autoAdvance: true,
        options: [
          { fr: 'Courriel',           en: 'Email'        },
          { fr: 'Téléphone / SMS', en: 'Phone / SMS' },
          { fr: 'KakaoTalk',          en: 'KakaoTalk'    },
          { fr: 'Message Instagram',  en: 'Instagram DM' },
        ],
      },
      { key: 'instagram', label: 'Instagram (facultatif)', label_en: 'Instagram (optional)', type: 'text', placeholder: '@handle' },
    ],
  },
  {
    id: 'languages', section: 'basic',
    heading:      'Quelles langues parlez-vous ?',
    heading_en:   'What languages do you speak?',
    heading_ko:   '어떤 언어를 구사하시나요?',
    subheading:    "Incluez les langues que vous êtes en train d'apprendre.",
    subheading_en: "Include languages you're currently learning too.",
    subheading_ko: '현재 배우고 있는 언어도 포함해 주세요.',
    fields: [
      { key: 'languages_spoken', type: 'text', placeholder: 'p. ex. Anglais, Français, Mandarin, Coréen' },
    ],
  },

  // -- Votre parcours a Montreal ---------------------------------------------
  {
    id: 'montreal_time', section: 'montreal',
    heading:    'Depuis combien de temps vivez-vous à Montréal ?',
    heading_en: 'How long have you been living in Montréal?',
    heading_ko: '모니트리올에 오신 지 얼마나 되었나요?',
    fields: [
      {
        key: 'time_in_montreal', type: 'radio', autoAdvance: true,
        options: [
          { fr: 'Moins de 6 mois', en: 'Less than 6 months' },
          { fr: '6 mois à 1 an',   en: '6 months - 1 year'  },
          { fr: '1 à 3 ans',       en: '1 - 3 years'        },
          { fr: 'Plus de 3 ans',   en: 'More than 3 years'  },
        ],
      },
    ],
  },
  {
    id: 'stage', section: 'montreal',
    heading:    'Quelle est votre situation actuelle ?',
    heading_en: 'What stage of life are you in right now?',
    heading_ko: '현재 어떤 상황에 계신가요?',
    fields: [
      {
        key: 'current_stage', type: 'radio',
        options: [
          { fr: 'Étudiant(e)',               en: 'Student'                    },
          { fr: 'En emploi',                  en: 'Working'                    },
          { fr: "En recherche d'emploi",      en: 'Looking for work'           },
          { fr: 'Travailleur(se) autonome',   en: 'Freelancing / Self-employed' },
          { fr: 'Autre',                      en: 'Other'                      },
        ],
      },
      {
        key: 'current_focus',
        label:    'Sur quoi vous concentrez-vous en ce moment ?',
        label_en: 'What are you currently focused on?',
        type: 'textarea',
        placeholder: "Études, un nouveau travail, s'installer, un projet personnel…",
      },
    ],
  },

  // -- Votre parcours en coreen ---------------------------------------------
  {
    id: 'korean_level', section: 'korean',
    heading:    "Comment décririez-vous votre niveau de coréen ?",
    heading_en: 'How would you describe your Korean right now?',
    heading_ko: '현재 한국어 실력을 어떻게 설명하시겠어요?',
    fields: [
      {
        key: 'korean_level', type: 'radio', autoAdvance: true,
        options: [
          { fr: 'Grand débutant — 안녕하세요 est ma limite', en: 'Complete beginner'                 },
          { fr: 'Je connais quelques bases',                                              en: 'I know some basics'                },
          { fr: 'Je peux tenir de simples conversations',                                en: 'I can have simple conversations'   },
          { fr: "Je peux m'exprimer, mais difficilement",                               en: 'I can express myself, but struggle' },
          { fr: "Je suis assez à l'aise en coréen",                           en: "I'm fairly comfortable in Korean"  },
        ],
      },
    ],
  },
  {
    id: 'korean_exp', section: 'korean',
    heading:      "Avez-vous une expérience préalable du coréen ?",
    heading_en:   'Any previous Korean experience?',
    heading_ko:   '한국어를 배운 경험이 있으시나요?',
    subheading:    'Cours, autodidacte, séjour en Corée, dramas — tout compte.',
    subheading_en: 'Classes, self-study, time in Korea, K-dramas — it all counts.',
    subheading_ko: '수업, 독학, 한국 체류, K-드라마 — 모든 것이 다 괴찮아요.',
    fields: [
      { key: 'previous_korean_exp', type: 'textarea', placeholder: "Dites-nous ce que vous savez et comment vous l'avez appris…" },
    ],
  },
  {
    id: 'korean_story', section: 'korean',
    heading:      'Pourquoi le coréen ?',
    heading_en:   'Why Korean?',
    heading_ko:   '왔 한국어인가요?',
    subheading:    "Qu'est-ce qui vous attire vers cette langue ?",
    subheading_en: 'What draws you to learning Korean specifically?',
    subheading_ko: '한국어를 배우고 싶은 특별한 이유가 있으시나요?',
    fields: [
      { key: 'interest_in_korean', type: 'textarea', placeholder: 'Culture, personnes, travail, musique, une histoire personnelle…' },
    ],
  },

  // -- Vos objectifs ---------------------------------------------------------
  {
    id: 'goals', section: 'goals',
    heading:    "Qu'est-ce que vous souhaitez accomplir ?",
    heading_en: 'What do you want to achieve?',
    heading_ko: '어떤 것을 이루고 싶으세요?',
    fields: [
      {
        key: 'first_korean_goal',
        label:    'La première chose que vous souhaitez faire en coréen :',
        label_en: 'The first thing you want to do in Korean:',
        type: 'text',
        placeholder: 'p. ex. Commander un café, me présenter, parler avec ma famille',
      },
      {
        key: 'six_month_goal',
        label:    "Où souhaitez-vous en être dans 6 mois ?",
        label_en: 'Where do you want to be in 6 months?',
        type: 'textarea',
        placeholder: 'Votre vision honnête…',
      },
    ],
  },
  {
    id: 'why_join', section: 'goals',
    heading:      'Pourquoi souhaitez-vous rejoindre HAKKYO ?',
    heading_en:   'Why are you joining HAKKYO?',
    heading_ko:   'HAKKYO에 참여하고 싶은 이유가 무엇인가요?',
    subheading:    "Qu'est-ce qui vous a donné envie de faire cette demande ?",
    subheading_en: 'What made you want to apply to this program?',
    fields: [
      { key: 'reason_for_joining', type: 'textarea', placeholder: "Qu'est-ce qui vous a amené(e) ici ?" },
    ],
  },

  // -- Votre facon d'apprendre -----------------------------------------------
  {
    id: 'learning', section: 'learning',
    heading:    'Comment apprenez-vous le mieux ?',
    heading_en: 'How do you learn best?',
    heading_ko: '어떤 방식으로 배울 때 가장 잘 배우시나요?',
    fields: [
      {
        key: 'biggest_challenge',
        label:    "Quel est votre plus grand défi dans l'apprentissage d'une langue ?",
        label_en: "What's your biggest challenge in learning a language?",
        type: 'textarea',
        placeholder: 'Soyez honnête — cela nous aide à mieux vous aider.',
      },
      {
        key: 'preferred_environment',
        label:    "Environnement d'apprentissage préféré",
        label_en: 'Preferred learning environment',
        type: 'radio',
        options: [
          { fr: 'Structuré avec des objectifs clairs', en: 'Structured with clear goals'   },
          { fr: 'Conversationnel et naturel',               en: 'Conversational and organic'    },
          { fr: 'Un mélange des deux',                 en: 'A mix of both'                 },
          { fr: 'À mon rythme avec du soutien',        en: 'Self-paced with support'       },
        ],
      },
    ],
  },

  // -- A propos de HAKKYO ----------------------------------------------------
  {
    id: 'discovery', section: 'hakkyo',
    heading:    'Comment avez-vous découvert HAKKYO ?',
    heading_en: 'How did you find HAKKYO?',
    heading_ko: 'HAKKYO를 어떻게 알게 되셨나요?',
    fields: [
      {
        key: 'how_found_hakkyo', type: 'radio', autoAdvance: true,
        options: [
          { fr: 'Instagram',                                 en: 'Instagram'                    },
          { fr: 'Un(e) ami(e) ou membre de la communauté', en: 'A friend or community member' },
          { fr: "Événement d'échange de langues", en: 'Language Exchange event'    },
          { fr: 'Recherche Google',                          en: 'Google search'                },
          { fr: 'Autre',                                     en: 'Other'                        },
        ],
      },
    ],
  },
  {
    id: 'why_hakkyo', section: 'hakkyo',
    heading:      "Qu'est-ce qui vous a le plus intéressé dans HAKKYO ?",
    heading_en:   'What interested you most about HAKKYO?',
    heading_ko:   'HAKKYO에서 가장 끌렸던 점은 무엇인가요?',
    subheading:    "L'approche, la communauté, quelque chose que vous avez entendu — partagez ce qui vous a marqué.",
    subheading_en: 'The approach, the community, something you heard — share what stood out.',
    fields: [
      { key: 'what_interested', type: 'textarea', placeholder: "Dites-nous ce qui vous a attiré(e)…" },
    ],
  },

  // -- Une derniere question -------------------------------------------------
  {
    id: 'open', section: 'last',
    heading:      'Une dernière question.',
    heading_en:   'One last question.',
    heading_ko:   '마지막 질문입니다.',
    subheading:    "Facultatif. Prenez autant d'espace que vous le souhaitez.",
    subheading_en: 'Optional. Take as much or as little space as you need.',
    subheading_ko: '선택 사항입니다. 원하시는 만큼 자유롭게 작성해 주세요.',
    fields: [
      {
        key: 'definition_great_class',
        label:    "Pour vous, qu'est-ce qu'un excellent cours de langue ?",
        label_en: 'What makes a great language class to you?',
        type: 'textarea',
        placeholder: 'Votre avis honnête…',
      },
      {
        key: 'questions_for_hakkyo',
        label:    'Des questions pour nous ?',
        label_en: 'Any questions for us?',
        type: 'textarea',
        placeholder: 'Tout ce que vous souhaitez savoir avant de rejoindre…',
      },
    ],
  },
]

const TOTAL = STEPS.length
const DRAFT_KEY = (id: string) => `hakkyo_apply_${id}`
type Draft = Record<string, string>

// ---- Helpers ----------------------------------------------------------------

function shortLevelFr(raw: string): string {
  if (!raw) return ''
  const r = raw.toLowerCase()
  if (r.includes('débutant') || r.includes('limite'))  return 'Grand débutant'
  if (r.includes('quelques bases'))                          return 'Quelques bases'
  if (r.includes('simples'))                                 return 'Conversations simples'
  if (r.includes('difficilement'))                           return 'Intermédiaire'
  if (r.includes('à l'))                                return 'À l\'aise'
  // legacy English
  if (r.includes('beginner') || r.includes('limit'))        return 'Grand débutant'
  if (r.includes('basics'))                                  return 'Quelques bases'
  if (r.includes('simple'))                                  return 'Conversations simples'
  if (r.includes('struggle'))                                return 'Intermédiaire'
  if (r.includes('comfortable'))                             return 'À l\'aise'
  return raw
}

// ---- Profile Summary Panel -------------------------------------------------

function ProfileSummary({ draft, step }: { draft: Draft; step: number }) {
  const displayName = draft.preferred_name?.trim() || draft.name?.trim()
  const level       = draft.korean_level ? shortLevelFr(draft.korean_level) : null
  const time        = draft.time_in_montreal?.trim() || null
  const focus       = draft.current_focus?.trim() || null
  const stage       = draft.current_stage?.trim() || null
  const goal        = draft.first_korean_goal?.trim() || null
  const why         = draft.reason_for_joining?.trim() || null
  const hasContent  = !!(displayName || level || time || focus)

  return (
    <div className="pt-1">
      <div className="mb-6">
        <p className="text-[11px] font-semibold text-gray-700 leading-tight mb-0.5">Votre profil HAKKYO</p>
        <p className="text-[9px] text-gray-400 leading-tight mb-0.5">Your HAKKYO Profile</p>
        <p className="text-[9px] text-gray-300 leading-tight">나의 HAKKYO 프로필</p>
      </div>

      <div className="h-px bg-gray-100 mb-5" />

      {(!hasContent || step < 1) ? (
        <p className="text-[11px] text-gray-300 leading-relaxed">
          Vos réponses apparaîtront ici au fur et à mesure.
          <br />
          <span className="text-[10px]">Your answers will appear here as you go.</span>
        </p>
      ) : (
        <div className="space-y-4">
          {displayName && (
            <p className="text-[14px] font-medium text-gray-700 leading-tight">{displayName}</p>
          )}
          {(time || stage || focus) && (
            <SummaryBlock label="Montréal">
              {time  && <SummaryLine>{time}</SummaryLine>}
              {stage && <SummaryLine muted>{stage}</SummaryLine>}
              {focus && <SummaryLine muted>{focus}</SummaryLine>}
            </SummaryBlock>
          )}
          {level && (
            <SummaryBlock label="Coréen">
              <SummaryLine>{level}</SummaryLine>
            </SummaryBlock>
          )}
          {goal && (
            <SummaryBlock label="Objectif">
              <SummaryLine>{goal}</SummaryLine>
            </SummaryBlock>
          )}
          {why && (
            <SummaryBlock label="Motivation">
              <SummaryLine muted>{why.length > 80 ? why.slice(0, 80) + '…' : why}</SummaryLine>
            </SummaryBlock>
          )}
        </div>
      )}
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
    <p className={['text-[11px] leading-snug', muted ? 'text-gray-400' : 'text-gray-600'].join(' ')}>
      {children}
    </p>
  )
}

// ---- Radio button -----------------------------------------------------------

function RadioBtn({
  option, index, selected, onClick,
}: { option: RadioOption; index: number; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-150',
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
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] leading-snug">{option.fr}</span>
        {option.en !== option.fr && (
          <span className={['block text-[11px] mt-0.5 leading-snug', selected ? 'opacity-60' : 'text-gray-400'].join(' ')}>
            {option.en}
          </span>
        )}
      </span>
      {selected && <Check size={13} className="ml-auto shrink-0" />}
    </button>
  )
}

// ---- Trilingual heading components ------------------------------------------

function TrilingualHeading({ fr, en, ko }: { fr: string; en: string; ko: string }) {
  return (
    <div className="mb-2">
      <h2 className="text-[24px] md:text-[28px] font-light text-gray-900 leading-tight">{fr}</h2>
      <p className="text-[13px] text-gray-400 leading-snug mt-1">{en}</p>
      <p className="text-[11px] text-gray-300 leading-snug mt-0.5">{ko}</p>
    </div>
  )
}

function TrilingualSub({ fr, en, ko }: { fr: string; en: string; ko?: string }) {
  return (
    <div className="mb-8 space-y-0.5">
      <p className="text-[13px] text-gray-500 leading-relaxed">{fr}</p>
      <p className="text-[11px] text-gray-400 leading-relaxed">{en}</p>
      {ko && <p className="text-[10px] text-gray-300 leading-relaxed">{ko}</p>}
    </div>
  )
}

function SectionPill({ meta }: { meta: SectionMeta }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-gray-500">{meta.label}</p>
      <p className="text-[9px] tracking-[0.12em] uppercase text-gray-300 mt-0.5">{meta.label_en}</p>
    </div>
  )
}

// ---- Main page --------------------------------------------------------------

export default function ApplyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [program, setProgram]         = useState<ProgramTrack | null>(null)
  const [loadingProg, setLoadingProg] = useState(true)
  const [step, setStep]               = useState(-1)
  const [draft, setDraft]             = useState<Draft>({})
  const [submitting, setSubmitting]   = useState(false)
  const [done, setDone]               = useState(false)
  const [error, setError]             = useState('')
  const [visible, setVisible]         = useState(true)
  const [summaryOpen, setSummaryOpen] = useState(false)

  const firstInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!id) { setLoadingProg(false); return }
    getTrackById(id).then(p => setProgram(p)).catch(() => {}).finally(() => setLoadingProg(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    try { const raw = localStorage.getItem(DRAFT_KEY(id)); if (raw) setDraft(JSON.parse(raw)) } catch {}
  }, [id])

  useEffect(() => {
    if (!id || Object.keys(draft).length === 0) return
    try { localStorage.setItem(DRAFT_KEY(id), JSON.stringify(draft)) } catch {}
  }, [draft, id])

  const isWelcome = step === -1
  const isReview  = step === TOTAL
  const progress  = isWelcome ? 0 : isReview ? 1 : (step + 1) / TOTAL

  const set = (key: string, value: string) => setDraft(d => ({ ...d, [key]: value }))

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
      setError("Le nom et l'adresse courriel sont requis. / Name and email are required.")
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

  // -- Loading --
  if (loadingProg) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-4 h-4 border border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // -- Success --
  if (done) {
    const firstName = draft.preferred_name?.trim() || draft.name?.trim()?.split(' ')[0]
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center mb-7">
          <Check size={18} className="text-white" />
        </div>
        <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-300 mb-5">HAKKYO</p>
        <h1 className="text-2xl font-light text-gray-900 mb-1">Candidature reçue.</h1>
        <p className="text-[14px] text-gray-400 mb-0.5">Application received.</p>
        <p className="text-[11px] text-gray-300 mb-8">지원서가 접수되었습니다.</p>
        <p className="text-[13px] text-gray-500 leading-relaxed max-w-xs mb-2">
          {firstName ? `Merci, ${firstName}.` : 'Merci.'}{' '}
          Nous lisons chaque candidature personnellement et vous répondrons dans les prochains jours.
        </p>
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-xs mb-8">
          We read every application personally and will be in touch within a few days.
        </p>
        <Link to="/programs" className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors underline underline-offset-4">
          Retour aux programmes · Back to programs
        </Link>
      </div>
    )
  }

  // -- Welcome --
  if (isWelcome) {
    const programName = program ? (program.name_en || program.name_ko) : null
    return (
      <div
        className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.15s ease' }}
      >
        <div className="max-w-lg w-full">
          {programName && (
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-300 mb-6">{programName}</p>
          )}
          <div className="mb-8">
            <h1 className="text-[32px] md:text-[38px] font-light text-gray-900 leading-tight mb-1">Bienvenue à HAKKYO</h1>
            <p className="text-[16px] text-gray-400 leading-tight mb-0.5">Welcome to HAKKYO</p>
            <p className="text-[13px] text-gray-300 leading-tight">학교에 오신 것을 환영합니다.</p>
          </div>
          <div className="mb-8 space-y-4">
            <div>
              <p className="text-[14px] text-gray-600 leading-relaxed">
                HAKKYO est un espace pour apprendre une langue,<br />
                rencontrer des gens<br />
                et mieux comprendre Montréal.
              </p>
              <p className="text-[12px] text-gray-400 leading-relaxed mt-1.5">
                HAKKYO is a place to learn a language,<br />
                meet people,<br />
                and better understand Montréal.
              </p>
              <p className="text-[10px] text-gray-300 leading-relaxed mt-1">
                HAKKYO는 언어를 배우고, 사람을 만나고, 모니트리올을 이해하는 공간입니다.
              </p>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-[13px] text-gray-500">Cette candidature prend environ 5 à 10 minutes.</p>
              <p className="text-[11px] text-gray-400 mt-0.5">This application takes approximately 5–10 minutes.</p>
              <p className="text-[10px] text-gray-300 mt-0.5">이 신청서는 약 5~10분 정도 소요됩니다.</p>
            </div>
          </div>
          {Object.keys(draft).length > 0 && (
            <p className="text-[11px] text-gray-400 mb-5">↩ Brouillon enregistré · Saved draft</p>
          )}
          <button
            onClick={() => transition(() => setStep(0))}
            className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-xl px-6 py-3.5 text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Commencer · Begin
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    )
  }

  // -- Review screen --
  if (isReview) {
    const reviewSections = [
      {
        label: 'Informations personnelles', label_en: 'Basic Information',
        firstStep: 0,
        rows: [
          { q: 'Nom',         q_en: 'Name',         a: [draft.name, draft.preferred_name && `(${draft.preferred_name})`].filter(Boolean).join(' ') },
          { q: 'Courriel',    q_en: 'Email',        a: draft.email ?? '' },
          { q: 'Téléphone',   q_en: 'Phone',        a: draft.phone ?? '' },
          { q: 'Contact via', q_en: 'Contact via',  a: draft.preferred_contact ?? '' },
          { q: 'Instagram',   q_en: 'Instagram',    a: draft.instagram ?? '' },
          { q: 'Langues',     q_en: 'Languages',    a: draft.languages_spoken ?? '' },
        ].filter(r => r.a),
      },
      {
        label: 'Votre parcours à Montréal', label_en: 'Montréal Journey',
        firstStep: 4,
        rows: [
          { q: 'Temps à Montréal', q_en: 'Time here', a: draft.time_in_montreal ?? '' },
          { q: 'Situation',               q_en: 'Stage',      a: draft.current_stage ?? '' },
          { q: 'Concentration',           q_en: 'Focus',      a: draft.current_focus ?? '' },
        ].filter(r => r.a),
      },
      {
        label: 'Votre parcours en coréen', label_en: 'Korean Journey',
        firstStep: 6,
        rows: [
          { q: 'Niveau de coréen', q_en: 'Korean level', a: draft.korean_level ? shortLevelFr(draft.korean_level) : '' },
          { q: 'Expérience',       q_en: 'Experience',   a: draft.previous_korean_exp ?? '' },
          { q: 'Pourquoi le coréen ?', q_en: 'Why Korean?', a: draft.interest_in_korean ?? '' },
        ].filter(r => r.a),
      },
      {
        label: 'Vos objectifs', label_en: 'Your Goals',
        firstStep: 9,
        rows: [
          { q: 'Premier objectif',   q_en: 'First goal',   a: draft.first_korean_goal ?? '' },
          { q: 'Dans 6 mois',        q_en: 'In 6 months',  a: draft.six_month_goal ?? '' },
          { q: 'Pourquoi rejoindre', q_en: 'Why joining',  a: draft.reason_for_joining ?? '' },
        ].filter(r => r.a),
      },
      {
        label: "Votre façon d'apprendre", label_en: 'Learning Style',
        firstStep: 11,
        rows: [
          { q: 'Plus grand défi', q_en: 'Biggest challenge', a: draft.biggest_challenge ?? '' },
          { q: 'Environnement',        q_en: 'Environment',       a: draft.preferred_environment ?? '' },
        ].filter(r => r.a),
      },
      {
        label: 'À propos de HAKKYO', label_en: 'About HAKKYO',
        firstStep: 12,
        rows: [
          { q: 'Découvert via',       q_en: 'How found us',    a: draft.how_found_hakkyo ?? '' },
          { q: 'Ce qui vous intéresse', q_en: 'What interested', a: draft.what_interested ?? '' },
        ].filter(r => r.a),
      },
      {
        label: 'Une dernière question', label_en: 'One Last Question',
        firstStep: 14,
        rows: [
          { q: 'Un excellent cours',    q_en: 'A great class',     a: draft.definition_great_class ?? '' },
          { q: 'Questions pour nous',   q_en: 'Questions for us',  a: draft.questions_for_hakkyo ?? '' },
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
          <ChevronLeft size={13} /> Retour · Back
        </button>
        <div className="mb-8">
          <h2 className="text-2xl font-light text-gray-900 mb-0.5">Votre profil HAKKYO</h2>
          <p className="text-[13px] text-gray-400 mb-0.5">Your HAKKYO Profile</p>
          <p className="text-[11px] text-gray-300">나의 HAKKYO 프로필</p>
          <p className="text-[12px] text-gray-400 mt-4 leading-relaxed">
            Prenez un moment pour relire vos réponses.
            <span className="block text-gray-300">Take a moment to review before submitting.</span>
          </p>
        </div>
        <div className="space-y-3 mb-10">
          {reviewSections.map(sec => (
            sec.rows.length > 0 && (
              <div key={sec.label} className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/60">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-700">{sec.label}</p>
                    <p className="text-[9px] tracking-[0.1em] uppercase text-gray-300">{sec.label_en}</p>
                  </div>
                  <button
                    onClick={() => transition(() => setStep(sec.firstStep))}
                    className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    Modifier · Edit
                  </button>
                </div>
                <div className="px-4 py-3 space-y-2.5">
                  {sec.rows.map(row => (
                    <div key={row.q} className="grid grid-cols-[150px_1fr] gap-3 text-sm">
                      <span className="shrink-0">
                        <span className="block text-[11px] text-gray-500">{row.q}</span>
                        <span className="block text-[9px] text-gray-300">{row.q_en}</span>
                      </span>
                      <span className="text-[13px] text-gray-700 leading-snug whitespace-pre-wrap">{row.a}</span>
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
          {submitting ? 'Envoi en cours…' : 'Soumettre ma candidature · Submit application'}
        </button>
        <p className="text-[11px] text-gray-400 text-center mt-4 leading-relaxed">
          Nous lisons chaque candidature personnellement et vous répondrons dans les prochains jours.
          <br />
          <span className="text-gray-300">We review every application personally and follow up within a few days.</span>
        </p>
      </div>
    )
  }

  // -- Question step --
  const s          = STEPS[step]
  const stepNum    = step + 1
  const secMeta    = SECTIONS.find(sec => sec.id === s.section)
  const hasContent = Object.keys(draft).some(k => draft[k]?.trim())

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col" onKeyDown={handleKeyDown}>
      {/* Progress bar */}
      <div className="h-0.5 bg-gray-100 w-full">
        <div className="h-full bg-gray-900 transition-all duration-500" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Header nav */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0">
        <button onClick={back} className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
          <ChevronLeft size={13} /> Retour
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
            {secMeta && <SectionPill meta={secMeta} />}
            <TrilingualHeading fr={s.heading} en={s.heading_en} ko={s.heading_ko} />
            {s.subheading
              ? <TrilingualSub fr={s.subheading} en={s.subheading_en ?? ''} ko={s.subheading_ko} />
              : <div className="mb-8" />
            }

            <div className="space-y-6">
              {s.fields.map((field, fi) => {
                const value = draft[field.key] ?? ''

                if (field.type === 'radio') {
                  return (
                    <div key={field.key}>
                      {field.label && (
                        <div className="mb-3">
                          <p className="text-[12px] text-gray-600 font-medium">{field.label}</p>
                          {field.label_en && <p className="text-[10px] text-gray-400 mt-0.5">{field.label_en}</p>}
                        </div>
                      )}
                      <div className="space-y-2">
                        {(field.options ?? []).map((opt, oi) => (
                          <RadioBtn
                            key={opt.fr}
                            option={opt}
                            index={oi}
                            selected={value === opt.fr}
                            onClick={() => handleRadioSelect(field.key, opt.fr, !!field.autoAdvance)}
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
                        <div className="mb-2">
                          <p className="text-[12px] text-gray-600 font-medium">{field.label}</p>
                          {field.label_en && <p className="text-[10px] text-gray-400 mt-0.5">{field.label_en}</p>}
                        </div>
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

                return (
                  <div key={field.key}>
                    {field.label && (
                      <div className="mb-2">
                        <p className="text-[12px] text-gray-600 font-medium">{field.label}</p>
                        {field.label_en && <p className="text-[10px] text-gray-400 mt-0.5">{field.label_en}</p>}
                      </div>
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

            <div className="mt-10 flex items-center gap-4">
              <button
                onClick={advance}
                className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                {step === TOTAL - 1 ? 'Vérifier · Review' : 'Continuer · Continue'}
                <ArrowRight size={15} />
              </button>
              <span className="text-[11px] text-gray-300 hidden sm:inline">
                <kbd className="border border-gray-200 rounded px-1 py-0.5 text-[9px] font-mono">Enter</kbd>
              </span>
            </div>

            {!s.fields.some(f => f.required) && step > 1 && (
              <button onClick={advance} className="mt-3 text-[11px] text-gray-300 hover:text-gray-500 transition-colors text-left">
                Passer · Skip
              </button>
            )}

            {hasContent && step >= 1 && (
              <div className="lg:hidden mt-10 border-t border-gray-100 pt-4">
                <button onClick={() => setSummaryOpen(o => !o)} className="w-full flex items-center justify-between text-left">
                  <span className="text-[11px] font-semibold text-gray-500">Votre profil HAKKYO</span>
                  <ChevronDown size={14} className={['text-gray-300 transition-transform', summaryOpen ? 'rotate-180' : ''].join(' ')} />
                </button>
                {summaryOpen && <div className="mt-4"><ProfileSummary draft={draft} step={step} /></div>}
              </div>
            )}
          </div>
        </div>

        {/* Desktop summary sidebar */}
        <aside className="hidden lg:flex flex-col w-56 xl:w-60 border-l border-gray-50 px-5 py-10 shrink-0 overflow-y-auto">
          <ProfileSummary draft={draft} step={step} />
        </aside>

      </div>
    </div>
  )
}
