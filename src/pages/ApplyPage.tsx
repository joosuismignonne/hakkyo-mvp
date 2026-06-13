import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Check, ArrowRight, ChevronDown } from 'lucide-react'
import { getTrackById, submitProgramApplication } from '../lib/db'
import { trackEvent } from '../lib/analytics'
import { useLang } from '../context/LangContext'
import type { ProgramTrack } from '../types'
import type { Lang } from '../types'

// ---- Pick helper ------------------------------------------------------------
// Always supply fr/en/ko in that order.
function pick(lang: Lang, fr: string, en: string, ko: string): string {
  if (lang === 'fr') return fr
  if (lang === 'ko') return ko
  return en
}

// ---- Section config ---------------------------------------------------------

interface SectionMeta {
  id: string
  label_fr: string
  label_en: string
  label_ko: string
  firstStep: number
}

const SECTIONS: SectionMeta[] = [
  { id: 'basic',    label_fr: 'Informations personnelles',   label_en: 'Basic Information',     label_ko: '기본 정보',          firstStep: 0  },
  { id: 'montreal', label_fr: 'Votre parcours à Montréal',  label_en: 'Your Montréal Journey', label_ko: '몬트리올 여정',      firstStep: 4  },
  { id: 'korean',   label_fr: 'Votre parcours en coréen',   label_en: 'Your Korean Journey',   label_ko: '한국어 여정',        firstStep: 6  },
  { id: 'goals',    label_fr: 'Vos objectifs',               label_en: 'Your Goals',            label_ko: '나의 목표',          firstStep: 9  },
  { id: 'learning', label_fr: "Votre façon d'apprendre",    label_en: 'Learning Style',        label_ko: '학습 스타일',        firstStep: 11 },
  { id: 'hakkyo',   label_fr: 'À propos de HAKKYO',         label_en: 'About HAKKYO',          label_ko: 'HAKKYO에 대하여',   firstStep: 12 },
  { id: 'last',     label_fr: 'Une dernière question',       label_en: 'One Last Question',     label_ko: '마지막 질문',        firstStep: 14 },
]

// ---- Step config ------------------------------------------------------------

interface RadioOption {
  fr: string   // stored in DB regardless of display language
  en: string
  ko: string
}

interface FieldConfig {
  key: string
  label_fr?: string
  label_en?: string
  label_ko?: string
  type: 'text' | 'email' | 'textarea' | 'radio'
  options?: RadioOption[]
  placeholder_fr?: string
  placeholder_en?: string
  placeholder_ko?: string
  required?: boolean
  autoAdvance?: boolean
}

interface StepConfig {
  id: string
  section: string
  heading_fr: string
  heading_en: string
  heading_ko: string
  subheading_fr?: string
  subheading_en?: string
  subheading_ko?: string
  fields: FieldConfig[]
}

const STEPS: StepConfig[] = [

  // -- Informations personnelles -----------------------------------------------
  {
    id: 'name', section: 'basic',
    heading_fr: "Commençons par votre nom.",
    heading_en: "Let's start with your name.",
    heading_ko: "이름을 알려주세요.",
    fields: [
      {
        key: 'name',
        label_fr: 'Nom complet', label_en: 'Full name', label_ko: '성명',
        type: 'text', required: true,
        placeholder_fr: 'Votre nom complet',
        placeholder_en: 'Your full name',
        placeholder_ko: '성함을 입력해 주세요',
      },
      {
        key: 'preferred_name',
        label_fr: "Comment souhaitez-vous qu'on vous appelle ?",
        label_en: 'What should we call you?',
        label_ko: '어떻게 불러드릴까요?',
        type: 'text',
        placeholder_fr: 'Surnom ou prénom (facultatif)',
        placeholder_en: 'Nickname or first name (optional)',
        placeholder_ko: '별명 또는 이름 (선택)',
      },
    ],
  },
  {
    id: 'contact', section: 'basic',
    heading_fr: 'Comment pouvons-nous vous contacter ?',
    heading_en: 'How can we reach you?',
    heading_ko: '어떻게 연락드릴까요?',
    fields: [
      {
        key: 'email',
        label_fr: 'Adresse courriel', label_en: 'Email address', label_ko: '이메일 주소',
        type: 'email', required: true,
        placeholder_fr: 'votre@courriel.com',
        placeholder_en: 'your@email.com',
        placeholder_ko: 'your@email.com',
      },
      {
        key: 'phone',
        label_fr: 'Téléphone / KakaoTalk', label_en: 'Phone / KakaoTalk ID', label_ko: '전화번호 / KakaoTalk',
        type: 'text',
        placeholder_fr: '+1 514 … ou ID KakaoTalk',
        placeholder_en: '+1 514 … or KakaoTalk ID',
        placeholder_ko: '+1 514 … 또는 KakaoTalk ID',
      },
    ],
  },
  {
    id: 'contact_pref', section: 'basic',
    heading_fr: 'Quel est le meilleur moyen de vous joindre ?',
    heading_en: "What's the best way to contact you?",
    heading_ko: '어떤 방법으로 연락하는 게 좋으세요?',
    fields: [
      {
        key: 'preferred_contact', type: 'radio', autoAdvance: true,
        options: [
          { fr: 'Courriel',           en: 'Email',           ko: '이메일'          },
          { fr: 'Téléphone / SMS',    en: 'Phone / SMS',     ko: '전화 / SMS'      },
          { fr: 'KakaoTalk',          en: 'KakaoTalk',       ko: 'KakaoTalk'       },
          { fr: 'Message Instagram',  en: 'Instagram DM',    ko: '인스타그램 DM'   },
        ],
      },
      {
        key: 'instagram',
        label_fr: 'Instagram (facultatif)', label_en: 'Instagram (optional)', label_ko: '인스타그램 (선택)',
        type: 'text',
        placeholder_fr: '@handle', placeholder_en: '@handle', placeholder_ko: '@handle',
      },
    ],
  },
  {
    id: 'languages', section: 'basic',
    heading_fr: 'Quelles langues parlez-vous ?',
    heading_en: 'What languages do you speak?',
    heading_ko: '어떤 언어를 구사하시나요?',
    subheading_fr: "Incluez les langues que vous êtes en train d'apprendre.",
    subheading_en: "Include languages you're currently learning too.",
    subheading_ko: '현재 배우고 있는 언어도 포함해 주세요.',
    fields: [
      {
        key: 'languages_spoken', type: 'text',
        placeholder_fr: 'p. ex. Anglais, Français, Mandarin, Coréen',
        placeholder_en: 'e.g. English, French, Mandarin, Korean',
        placeholder_ko: '예) 영어, 프랑스어, 중국어, 한국어',
      },
    ],
  },

  // -- Votre parcours à Montréal -----------------------------------------------
  {
    id: 'montreal_time', section: 'montreal',
    heading_fr: 'Depuis combien de temps vivez-vous à Montréal ?',
    heading_en: 'How long have you been living in Montréal?',
    heading_ko: '모니트리올에 오신 지 얼마나 되었나요?',
    fields: [
      {
        key: 'time_in_montreal', type: 'radio', autoAdvance: true,
        options: [
          { fr: 'Moins de 6 mois', en: 'Less than 6 months', ko: '6개월 미만'    },
          { fr: '6 mois à 1 an',   en: '6 months – 1 year',  ko: '6개월 ~ 1년'   },
          { fr: '1 à 3 ans',       en: '1 – 3 years',        ko: '1 ~ 3년'       },
          { fr: 'Plus de 3 ans',   en: 'More than 3 years',  ko: '3년 이상'      },
        ],
      },
    ],
  },
  {
    id: 'stage', section: 'montreal',
    heading_fr: 'Quelle est votre situation actuelle ?',
    heading_en: 'What stage of life are you in right now?',
    heading_ko: '현재 어떤 상황에 계신가요?',
    fields: [
      {
        key: 'current_stage', type: 'radio',
        options: [
          { fr: 'Étudiant(e)',              en: 'Student',                    ko: '학생'              },
          { fr: 'En emploi',                en: 'Working',                    ko: '직장인'            },
          { fr: "En recherche d'emploi",    en: 'Looking for work',           ko: '구직 중'           },
          { fr: 'Travailleur(se) autonome', en: 'Freelancing / Self-employed', ko: '프리랜서 / 자영업' },
          { fr: 'Autre',                    en: 'Other',                      ko: '기타'              },
        ],
      },
      {
        key: 'current_focus',
        label_fr: 'Sur quoi vous concentrez-vous en ce moment ?',
        label_en: 'What are you currently focused on?',
        label_ko: '요즘 주로 무엇에 집중하고 계신가요?',
        type: 'textarea',
        placeholder_fr: "Études, un nouveau travail, s'installer, un projet personnel…",
        placeholder_en: 'Studies, a new job, settling in, a personal project…',
        placeholder_ko: '학업, 새 직장, 정착, 개인 프로젝트 등…',
      },
    ],
  },

  // -- Votre parcours en coréen -----------------------------------------------
  {
    id: 'korean_level', section: 'korean',
    heading_fr: "Comment décririez-vous votre niveau de coréen ?",
    heading_en: 'How would you describe your Korean right now?',
    heading_ko: '현재 한국어 실력을 어떻게 설명하시겠어요?',
    fields: [
      {
        key: 'korean_level', type: 'radio', autoAdvance: true,
        options: [
          { fr: 'Grand débutant — 안녕하세요 est ma limite',  en: 'Complete beginner — 안녕하세요 is my limit',    ko: '완전 초보 — 안녕하세요가 전부예요'       },
          { fr: 'Je connais quelques bases',                  en: 'I know some basics',                           ko: '기초는 조금 알아요'                       },
          { fr: 'Je peux tenir de simples conversations',     en: 'I can have simple conversations',              ko: '간단한 대화는 가능해요'                   },
          { fr: "Je peux m'exprimer, mais difficilement",    en: 'I can express myself, but struggle',           ko: '표현할 수 있지만 아직 어렵게 느껴져요'    },
          { fr: "Je suis assez à l'aise en coréen",          en: "I'm fairly comfortable in Korean",             ko: '한국어로 꽤 편하게 대화해요'              },
        ],
      },
    ],
  },
  {
    id: 'korean_exp', section: 'korean',
    heading_fr: "Avez-vous une expérience préalable du coréen ?",
    heading_en: 'Any previous Korean experience?',
    heading_ko: '한국어를 배운 경험이 있으시나요?',
    subheading_fr: 'Cours, autodidacte, séjour en Corée, dramas — tout compte.',
    subheading_en: 'Classes, self-study, time in Korea, K-dramas — it all counts.',
    subheading_ko: '수업, 독학, 한국 체류, K-드라마 — 모든 것이 다 괜찮아요.',
    fields: [
      {
        key: 'previous_korean_exp', type: 'textarea',
        placeholder_fr: "Dites-nous ce que vous savez et comment vous l'avez appris…",
        placeholder_en: 'Tell us what you know and how you learned it…',
        placeholder_ko: '알고 있는 것과 어떻게 배웠는지 알려주세요…',
      },
    ],
  },
  {
    id: 'korean_story', section: 'korean',
    heading_fr: 'Pourquoi le coréen ?',
    heading_en: 'Why Korean?',
    heading_ko: '왜 한국어인가요?',
    subheading_fr: "Qu'est-ce qui vous attire vers cette langue ?",
    subheading_en: 'What draws you to learning Korean specifically?',
    subheading_ko: '한국어를 배우고 싶은 특별한 이유가 있으시나요?',
    fields: [
      {
        key: 'interest_in_korean', type: 'textarea',
        placeholder_fr: 'Culture, personnes, travail, musique, une histoire personnelle…',
        placeholder_en: 'Culture, people, work, music, a personal story…',
        placeholder_ko: '문화, 사람들, 직업, 음악, 개인적인 이야기…',
      },
    ],
  },

  // -- Vos objectifs ----------------------------------------------------------
  {
    id: 'goals', section: 'goals',
    heading_fr: "Qu'est-ce que vous souhaitez accomplir ?",
    heading_en: 'What do you want to achieve?',
    heading_ko: '어떤 것을 이루고 싶으세요?',
    fields: [
      {
        key: 'first_korean_goal',
        label_fr: 'La première chose que vous souhaitez faire en coréen :',
        label_en: 'The first thing you want to do in Korean:',
        label_ko: '한국어로 처음 해보고 싶은 것:',
        type: 'text',
        placeholder_fr: 'p. ex. Commander un café, me présenter, parler avec ma famille',
        placeholder_en: 'e.g. Order a coffee, introduce myself, talk with my family',
        placeholder_ko: '예) 커피 주문하기, 자기소개하기, 가족과 대화하기',
      },
      {
        key: 'six_month_goal',
        label_fr: "Où souhaitez-vous en être dans 6 mois ?",
        label_en: 'Where do you want to be in 6 months?',
        label_ko: '6개월 후 어떤 상태이고 싶으세요?',
        type: 'textarea',
        placeholder_fr: 'Votre vision honnête…',
        placeholder_en: 'Your honest vision…',
        placeholder_ko: '솔직한 목표를 적어주세요…',
      },
    ],
  },
  {
    id: 'why_join', section: 'goals',
    heading_fr: 'Pourquoi souhaitez-vous rejoindre HAKKYO ?',
    heading_en: 'Why are you joining HAKKYO?',
    heading_ko: 'HAKKYO에 참여하고 싶은 이유가 무엇인가요?',
    subheading_fr: "Qu'est-ce qui vous a donné envie de faire cette demande ?",
    subheading_en: 'What made you want to apply to this program?',
    subheading_ko: '이 프로그램에 지원하고 싶었던 이유가 무엇인가요?',
    fields: [
      {
        key: 'reason_for_joining', type: 'textarea',
        placeholder_fr: "Qu'est-ce qui vous a amené(e) ici ?",
        placeholder_en: "What brought you here?",
        placeholder_ko: '어떤 계기로 여기 오게 되셨나요?',
      },
    ],
  },

  // -- Votre façon d'apprendre ------------------------------------------------
  {
    id: 'learning', section: 'learning',
    heading_fr: 'Comment apprenez-vous le mieux ?',
    heading_en: 'How do you learn best?',
    heading_ko: '어떤 방식으로 배울 때 가장 잘 배우시나요?',
    fields: [
      {
        key: 'biggest_challenge',
        label_fr: "Quel est votre plus grand défi dans l'apprentissage d'une langue ?",
        label_en: "What's your biggest challenge in learning a language?",
        label_ko: '언어 학습에서 가장 큰 어려움은 무엇인가요?',
        type: 'textarea',
        placeholder_fr: 'Soyez honnête — cela nous aide à mieux vous aider.',
        placeholder_en: 'Be honest — it helps us help you better.',
        placeholder_ko: '솔직하게 적어주세요 — 더 잘 도와드릴 수 있어요.',
      },
      {
        key: 'preferred_environment',
        label_fr: "Environnement d'apprentissage préféré",
        label_en: 'Preferred learning environment',
        label_ko: '선호하는 학습 환경',
        type: 'radio',
        options: [
          { fr: 'Structuré avec des objectifs clairs', en: 'Structured with clear goals',    ko: '명확한 목표가 있는 구조적 학습'    },
          { fr: 'Conversationnel et naturel',          en: 'Conversational and organic',      ko: '대화 위주의 자연스러운 학습'      },
          { fr: 'Un mélange des deux',                 en: 'A mix of both',                   ko: '두 가지의 혼합'                    },
          { fr: 'À mon rythme avec du soutien',        en: 'Self-paced with support',         ko: '내 속도대로, 지원을 받으며'        },
        ],
      },
    ],
  },

  // -- À propos de HAKKYO -----------------------------------------------------
  {
    id: 'discovery', section: 'hakkyo',
    heading_fr: 'Comment avez-vous découvert HAKKYO ?',
    heading_en: 'How did you find HAKKYO?',
    heading_ko: 'HAKKYO를 어떻게 알게 되셨나요?',
    fields: [
      {
        key: 'how_found_hakkyo', type: 'radio', autoAdvance: true,
        options: [
          { fr: 'Instagram',                                en: 'Instagram',                   ko: '인스타그램'            },
          { fr: "Un(e) ami(e) ou membre de la communauté", en: 'A friend or community member', ko: '친구 또는 커뮤니티 멤버' },
          { fr: "Événement d'échange de langues",          en: 'Language Exchange event',      ko: '언어 교환 이벤트'      },
          { fr: 'Recherche Google',                         en: 'Google search',                ko: '구글 검색'             },
          { fr: 'Autre',                                    en: 'Other',                        ko: '기타'                  },
        ],
      },
    ],
  },
  {
    id: 'why_hakkyo', section: 'hakkyo',
    heading_fr: "Qu'est-ce qui vous a le plus intéressé dans HAKKYO ?",
    heading_en: 'What interested you most about HAKKYO?',
    heading_ko: 'HAKKYO에서 가장 끌렸던 점은 무엇인가요?',
    subheading_fr: "L'approche, la communauté, quelque chose que vous avez entendu — partagez ce qui vous a marqué.",
    subheading_en: 'The approach, the community, something you heard — share what stood out.',
    subheading_ko: '접근 방식, 커뮤니티, 들은 이야기 — 기억에 남은 것을 공유해 주세요.',
    fields: [
      {
        key: 'what_interested', type: 'textarea',
        placeholder_fr: "Dites-nous ce qui vous a attiré(e)…",
        placeholder_en: "Tell us what caught your attention…",
        placeholder_ko: '어떤 점이 끌렸는지 알려주세요…',
      },
    ],
  },

  // -- Une dernière question --------------------------------------------------
  {
    id: 'open', section: 'last',
    heading_fr: 'Une dernière question.',
    heading_en: 'One last question.',
    heading_ko: '마지막 질문입니다.',
    subheading_fr: "Facultatif. Prenez autant d'espace que vous le souhaitez.",
    subheading_en: 'Optional. Take as much or as little space as you need.',
    subheading_ko: '선택 사항입니다. 원하시는 만큼 자유롭게 작성해 주세요.',
    fields: [
      {
        key: 'definition_great_class',
        label_fr: "Pour vous, qu'est-ce qu'un excellent cours de langue ?",
        label_en: 'What makes a great language class to you?',
        label_ko: '당신에게 훌륭한 언어 수업이란 무엇인가요?',
        type: 'textarea',
        placeholder_fr: 'Votre avis honnête…',
        placeholder_en: 'Your honest take…',
        placeholder_ko: '솔직한 생각을 적어주세요…',
      },
      {
        key: 'questions_for_hakkyo',
        label_fr: 'Des questions pour nous ?',
        label_en: 'Any questions for us?',
        label_ko: '궁금한 점이 있으신가요?',
        type: 'textarea',
        placeholder_fr: 'Tout ce que vous souhaitez savoir avant de rejoindre…',
        placeholder_en: 'Anything you want to know before joining…',
        placeholder_ko: '참여하기 전에 알고 싶은 것이 있으시면…',
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
  if (r.includes('débutant') || r.includes('limite') || r.includes('limit'))  return 'Grand débutant'
  if (r.includes('quelques bases') || r.includes('basics'))                   return 'Quelques bases'
  if (r.includes('simples') || (r.includes('simple') && r.includes('conv'))) return 'Conversations simples'
  if (r.includes('difficilement') || r.includes('struggle'))                  return 'Intermédiaire'
  if (r.includes('aise') || r.includes('comfortable'))                        return "À l'aise"
  return raw
}

// ---- Profile Summary Panel -------------------------------------------------
// The summary panel always shows all three language labels in its header
// (this is the persistent brand element, not a question screen).

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
// Displays only the selected language label. Stores the French value in DB.

function RadioBtn({
  option, index, selected, lang, onClick,
}: { option: RadioOption; index: number; selected: boolean; lang: Lang; onClick: () => void }) {
  const label = pick(lang, option.fr, option.en, option.ko)
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
      <span className="flex-1 min-w-0 text-[13px] leading-snug">{label}</span>
      {selected && <Check size={13} className="ml-auto shrink-0" />}
    </button>
  )
}

// ---- Heading / subheading (language-aware) ----------------------------------

function StepHeading({ step, lang }: { step: StepConfig; lang: Lang }) {
  const h = pick(lang, step.heading_fr, step.heading_en, step.heading_ko)
  return (
    <h2 className="text-[24px] md:text-[28px] font-light text-gray-900 leading-tight mb-2">{h}</h2>
  )
}

function StepSubheading({ step, lang }: { step: StepConfig; lang: Lang }) {
  if (!step.subheading_fr) return <div className="mb-8" />
  const sub = pick(
    lang,
    step.subheading_fr,
    step.subheading_en ?? step.subheading_fr,
    step.subheading_ko ?? step.subheading_fr,
  )
  return (
    <p className="text-[13px] text-gray-500 leading-relaxed mb-8">{sub}</p>
  )
}

function SectionPill({ meta, lang }: { meta: SectionMeta; lang: Lang }) {
  const label = pick(lang, meta.label_fr, meta.label_en, meta.label_ko)
  return (
    <div className="mb-5">
      <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-gray-500">{label}</p>
    </div>
  )
}

// ---- Main page --------------------------------------------------------------

export default function ApplyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { lang } = useLang()

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

  function handleRadioSelect(key: string, frValue: string, autoAdvance: boolean) {
    set(key, frValue) // always store French value
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
      const msg = pick(
        lang,
        "Le nom et l'adresse courriel sont requis.",
        'Name and email are required.',
        '이름과 이메일은 필수 항목입니다.',
      )
      setError(msg)
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
    const thankYou = pick(lang, 'Merci.', 'Thank you.', '감사합니다.')
    const received = pick(lang, 'Candidature reçue.', 'Application received.', '지원서가 접수되었습니다.')
    const body = pick(
      lang,
      `Nous lisons chaque candidature personnellement et vous répondrons dans les prochains jours.`,
      `We read every application personally and will be in touch within a few days.`,
      `모든 지원서를 직접 검토하며, 며칠 내로 연락드리겠습니다.`,
    )
    const backLink = pick(lang, 'Retour aux programmes', 'Back to programs', '프로그램으로 돌아가기')
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center mb-7">
          <Check size={18} className="text-white" />
        </div>
        <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-300 mb-5">HAKKYO</p>
        <h1 className="text-2xl font-light text-gray-900 mb-6">{received}</h1>
        <p className="text-[13px] text-gray-500 leading-relaxed max-w-xs mb-8">
          {firstName ? `${thankYou.replace('.', ',')} ${firstName}. ` : `${thankYou} `}
          {body}
        </p>
        <Link to="/programs" className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors underline underline-offset-4">
          {backLink}
        </Link>
      </div>
    )
  }

  // -- Welcome --
  if (isWelcome) {
    const programName = program ? (program.name_en || program.name_ko) : null

    const title   = pick(lang, 'Bienvenue à HAKKYO', 'Welcome to HAKKYO', 'HAKKYO에 오신 것을 환영합니다')
    const desc    = pick(
      lang,
      "HAKKYO est un espace pour apprendre une langue,\nrencontrer des gens\net mieux comprendre Montréal.",
      "HAKKYO is a place to learn a language,\nmeet people,\nand better understand Montréal.",
      "HAKKYO는 언어를 배우고,\n사람을 만나고,\n몬트리올을 이해하는 공간입니다.",
    )
    const duration = pick(
      lang,
      'Cette candidature prend environ 5 à 10 minutes.',
      'This application takes approximately 5–10 minutes.',
      '이 신청서는 약 5~10분 정도 소요됩니다.',
    )
    const hasDraft = Object.keys(draft).length > 0
    const draftNote = pick(lang, '↩ Brouillon enregistré', '↩ Saved draft', '↩ 저장된 임시 지원서')
    const cta = pick(lang, 'Commencer', 'Begin', '시작하기')

    return (
      <div
        className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.15s ease' }}
      >
        <div className="max-w-lg w-full">
          {programName && (
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-300 mb-6">{programName}</p>
          )}
          <h1 className="text-[32px] md:text-[38px] font-light text-gray-900 leading-tight mb-6">{title}</h1>
          <p className="text-[14px] text-gray-600 leading-relaxed whitespace-pre-line mb-4">{desc}</p>
          <p className="text-[13px] text-gray-400 mb-6">{duration}</p>
          {hasDraft && (
            <p className="text-[11px] text-gray-400 mb-5">{draftNote}</p>
          )}
          <button
            onClick={() => transition(() => setStep(0))}
            className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-xl px-6 py-3.5 text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            {cta}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    )
  }

  // -- Review screen --
  if (isReview) {
    const reviewTitle   = pick(lang, 'Votre profil HAKKYO', 'Your HAKKYO Profile', '나의 HAKKYO 프로필')
    const reviewIntro   = pick(lang, 'Prenez un moment pour relire vos réponses.', 'Take a moment to review before submitting.', '제출 전에 답변을 한 번 더 확인해 주세요.')
    const editLabel     = pick(lang, 'Modifier', 'Edit', '수정')
    const submitLabel   = pick(lang, 'Soumettre ma candidature', 'Submit application', '지원서 제출')
    const submittingLabel = pick(lang, 'Envoi en cours…', 'Submitting…', '제출 중…')
    const footerNote    = pick(
      lang,
      'Nous lisons chaque candidature personnellement et vous répondrons dans les prochains jours.',
      'We review every application personally and follow up within a few days.',
      '모든 지원서를 직접 검토하며, 며칠 내로 연락드리겠습니다.',
    )
    const backLabel = pick(lang, 'Retour', 'Back', '뒤로')

    const reviewSections = [
      {
        label: pick(lang, 'Informations personnelles',   'Basic Information',     '기본 정보'),
        firstStep: 0,
        rows: [
          { q: pick(lang, 'Nom',         'Name',         '이름'),        a: [draft.name, draft.preferred_name && `(${draft.preferred_name})`].filter(Boolean).join(' ') },
          { q: pick(lang, 'Courriel',    'Email',        '이메일'),      a: draft.email ?? '' },
          { q: pick(lang, 'Téléphone',   'Phone',        '전화번호'),    a: draft.phone ?? '' },
          { q: pick(lang, 'Contact via', 'Contact via',  '연락 방법'),   a: draft.preferred_contact ?? '' },
          { q: pick(lang, 'Instagram',   'Instagram',    '인스타그램'),  a: draft.instagram ?? '' },
          { q: pick(lang, 'Langues',     'Languages',    '구사 언어'),   a: draft.languages_spoken ?? '' },
        ].filter(r => r.a),
      },
      {
        label: pick(lang, 'Votre parcours à Montréal', 'Montréal Journey', '몬트리올 여정'),
        firstStep: 4,
        rows: [
          { q: pick(lang, 'Temps à Montréal', 'Time here',    '체류 기간'), a: draft.time_in_montreal ?? '' },
          { q: pick(lang, 'Situation',         'Stage',        '현재 상황'), a: draft.current_stage ?? '' },
          { q: pick(lang, 'Concentration',     'Current focus','집중 중인 것'), a: draft.current_focus ?? '' },
        ].filter(r => r.a),
      },
      {
        label: pick(lang, 'Votre parcours en coréen', 'Korean Journey', '한국어 여정'),
        firstStep: 6,
        rows: [
          { q: pick(lang, 'Niveau de coréen', 'Korean level', '한국어 실력'), a: draft.korean_level ? shortLevelFr(draft.korean_level) : '' },
          { q: pick(lang, 'Expérience',       'Experience',   '학습 경험'),  a: draft.previous_korean_exp ?? '' },
          { q: pick(lang, 'Pourquoi le coréen ?', 'Why Korean?', '왜 한국어?'), a: draft.interest_in_korean ?? '' },
        ].filter(r => r.a),
      },
      {
        label: pick(lang, 'Vos objectifs', 'Your Goals', '나의 목표'),
        firstStep: 9,
        rows: [
          { q: pick(lang, 'Premier objectif',   'First goal',   '첫 번째 목표'), a: draft.first_korean_goal ?? '' },
          { q: pick(lang, 'Dans 6 mois',        'In 6 months',  '6개월 후'),     a: draft.six_month_goal ?? '' },
          { q: pick(lang, 'Pourquoi rejoindre', 'Why joining',  '참여 이유'),    a: draft.reason_for_joining ?? '' },
        ].filter(r => r.a),
      },
      {
        label: pick(lang, "Votre façon d'apprendre", 'Learning Style', '학습 스타일'),
        firstStep: 11,
        rows: [
          { q: pick(lang, 'Plus grand défi', 'Biggest challenge', '가장 큰 어려움'), a: draft.biggest_challenge ?? '' },
          { q: pick(lang, 'Environnement',   'Environment',       '선호 환경'),     a: draft.preferred_environment ?? '' },
        ].filter(r => r.a),
      },
      {
        label: pick(lang, 'À propos de HAKKYO', 'About HAKKYO', 'HAKKYO에 대하여'),
        firstStep: 12,
        rows: [
          { q: pick(lang, 'Découvert via',          'How found us',    '알게 된 경로'),    a: draft.how_found_hakkyo ?? '' },
          { q: pick(lang, "Ce qui vous intéresse",  'What interested', '관심을 가진 이유'), a: draft.what_interested ?? '' },
        ].filter(r => r.a),
      },
      {
        label: pick(lang, 'Une dernière question', 'One Last Question', '마지막 질문'),
        firstStep: 14,
        rows: [
          { q: pick(lang, 'Un excellent cours',  'A great class',    '훌륭한 수업이란'), a: draft.definition_great_class ?? '' },
          { q: pick(lang, 'Questions pour nous', 'Questions for us', '궁금한 점'),       a: draft.questions_for_hakkyo ?? '' },
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
          <ChevronLeft size={13} /> {backLabel}
        </button>
        <div className="mb-8">
          <h2 className="text-2xl font-light text-gray-900 mb-4">{reviewTitle}</h2>
          <p className="text-[12px] text-gray-400 leading-relaxed">{reviewIntro}</p>
        </div>
        <div className="space-y-3 mb-10">
          {reviewSections.map(sec => (
            sec.rows.length > 0 && (
              <div key={sec.label} className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/60">
                  <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-700">{sec.label}</p>
                  <button
                    onClick={() => transition(() => setStep(sec.firstStep))}
                    className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {editLabel}
                  </button>
                </div>
                <div className="px-4 py-3 space-y-2.5">
                  {sec.rows.map(row => (
                    <div key={row.q} className="grid grid-cols-[150px_1fr] gap-3 text-sm">
                      <span className="text-[11px] text-gray-500 shrink-0">{row.q}</span>
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
          {submitting ? submittingLabel : submitLabel}
        </button>
        <p className="text-[11px] text-gray-400 text-center mt-4 leading-relaxed">{footerNote}</p>
      </div>
    )
  }

  // -- Question step --
  const s       = STEPS[step]
  const stepNum = step + 1
  const secMeta = SECTIONS.find(sec => sec.id === s.section)
  const hasContent = Object.keys(draft).some(k => draft[k]?.trim())

  const continueLabel = pick(lang, 'Continuer', 'Continue', '계속')
  const reviewLabel   = pick(lang, 'Vérifier',  'Review',   '검토하기')
  const skipLabel     = pick(lang, 'Passer',     'Skip',     '건너뛰기')
  const profileLabel  = pick(lang, 'Votre profil HAKKYO', 'Your HAKKYO Profile', '나의 HAKKYO 프로필')

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col" onKeyDown={handleKeyDown}>
      {/* Progress bar */}
      <div className="h-0.5 bg-gray-100 w-full">
        <div className="h-full bg-gray-900 transition-all duration-500" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Header nav */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0">
        <button onClick={back} className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
          <ChevronLeft size={13} /> {pick(lang, 'Retour', 'Back', '뒤로')}
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
            {secMeta && <SectionPill meta={secMeta} lang={lang} />}
            <StepHeading step={s} lang={lang} />
            <StepSubheading step={s} lang={lang} />

            <div className="space-y-6">
              {s.fields.map((field, fi) => {
                const value       = draft[field.key] ?? ''
                const fieldLabel  = field.label_fr
                  ? pick(lang, field.label_fr, field.label_en ?? field.label_fr, field.label_ko ?? field.label_fr)
                  : undefined
                const placeholder = pick(
                  lang,
                  field.placeholder_fr ?? '',
                  field.placeholder_en ?? field.placeholder_fr ?? '',
                  field.placeholder_ko ?? field.placeholder_fr ?? '',
                )

                if (field.type === 'radio') {
                  return (
                    <div key={field.key}>
                      {fieldLabel && (
                        <p className="text-[12px] text-gray-600 font-medium mb-3">{fieldLabel}</p>
                      )}
                      <div className="space-y-2">
                        {(field.options ?? []).map((opt, oi) => (
                          <RadioBtn
                            key={opt.fr}
                            option={opt}
                            index={oi}
                            selected={value === opt.fr}
                            lang={lang}
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
                      {fieldLabel && (
                        <p className="text-[12px] text-gray-600 font-medium mb-2">{fieldLabel}</p>
                      )}
                      <textarea
                        ref={fi === 0 ? (el => { if (el) firstInputRef.current = el }) : undefined}
                        rows={4}
                        className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-gray-900 outline-none py-2 text-[15px] text-gray-900 leading-relaxed resize-none placeholder:text-gray-300 transition-colors"
                        placeholder={placeholder}
                        value={value}
                        onChange={e => set(field.key, e.target.value)}
                      />
                    </div>
                  )
                }

                return (
                  <div key={field.key}>
                    {fieldLabel && (
                      <p className="text-[12px] text-gray-600 font-medium mb-2">{fieldLabel}</p>
                    )}
                    <input
                      ref={fi === 0 ? (el => { if (el) firstInputRef.current = el }) : undefined}
                      type={field.type}
                      className="w-full bg-transparent border-0 border-b border-gray-200 focus:border-gray-900 outline-none py-2 text-[15px] text-gray-900 placeholder:text-gray-300 transition-colors"
                      placeholder={placeholder}
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
                {step === TOTAL - 1 ? reviewLabel : continueLabel}
                <ArrowRight size={15} />
              </button>
              <span className="text-[11px] text-gray-300 hidden sm:inline">
                <kbd className="border border-gray-200 rounded px-1 py-0.5 text-[9px] font-mono">Enter</kbd>
              </span>
            </div>

            {!s.fields.some(f => f.required) && step > 1 && (
              <button onClick={advance} className="mt-3 text-[11px] text-gray-300 hover:text-gray-500 transition-colors text-left">
                {skipLabel}
              </button>
            )}

            {hasContent && step >= 1 && (
              <div className="lg:hidden mt-10 border-t border-gray-100 pt-4">
                <button onClick={() => setSummaryOpen(o => !o)} className="w-full flex items-center justify-between text-left">
                  <span className="text-[11px] font-semibold text-gray-500">{profileLabel}</span>
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
