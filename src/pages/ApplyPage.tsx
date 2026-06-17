import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Check, ArrowRight, ChevronDown } from 'lucide-react'
import { getTrackById, submitProgramApplication } from '../lib/db'
import { trackEvent } from '../lib/analytics'
import type { ProgramTrack } from '../types'

// ── The application page is permanently trilingual.
//    The site language toggle does NOT affect this page.
//    Every text element always shows: French (primary) → English → Korean.

// ──────────────────────────────────────────────────────────────────────────────
// Program language detection
// ──────────────────────────────────────────────────────────────────────────────

export type ProgLang = 'korean' | 'french' | 'english'

export function detectProgLang(program: ProgramTrack | null): ProgLang {
  if (!program) return 'korean'
  const tags: string[] = Array.isArray(program.program_tags) ? program.program_tags : []
  if (tags.includes('french'))  return 'french'
  if (tags.includes('english')) return 'english'
  if (tags.includes('korean'))  return 'korean'
  // fallback: infer from name
  const name = [program.name_en, program.name_fr, program.name_ko].join(' ').toLowerCase()
  if (name.includes('french') || name.includes('français')) return 'french'
  if (name.includes('english') || name.includes('anglais')) return 'english'
  return 'korean'
}

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

interface T3 {
  fr: string
  en: string
  ko: string
}

interface SectionMeta {
  id: string
  label: T3
  firstStep: number
}

interface RadioOption extends T3 {}  // stored value in DB is always option.fr

interface FieldConfig {
  key: string
  label?: T3
  type: 'text' | 'email' | 'textarea' | 'radio'
  options?: RadioOption[]
  placeholder?: string
  required?: boolean
  autoAdvance?: boolean
}

interface StepConfig {
  id: string
  section: string
  heading: T3
  subheading?: T3
  fields: FieldConfig[]
}

// ──────────────────────────────────────────────────────────────────────────────
// Language-aware content builders
// ──────────────────────────────────────────────────────────────────────────────

const PROG_LANG_NAMES: Record<ProgLang, T3> = {
  korean:  { fr: 'coréen',   en: 'Korean',  ko: '한국어'    },
  french:  { fr: 'français', en: 'French',  ko: '프랑스어'  },
  english: { fr: 'anglais',  en: 'English', ko: '영어'      },
}

// French definite article before the language name
const PROG_LANG_ARTICLE: Record<ProgLang, string> = {
  korean:  'le',
  french:  'le',
  english: "l'",
}

// Greeting word used in beginner level option
const PROG_LANG_GREETING: Record<ProgLang, string> = {
  korean:  '안녕하세요',
  french:  'Bonjour',
  english: 'Hello',
}

function buildSections(pl: ProgLang): SectionMeta[] {
  const ln = PROG_LANG_NAMES[pl]
  return [
    { id: 'basic',    label: { fr: 'Informations personnelles',                en: 'Basic Information',            ko: '기본 정보'         }, firstStep: 0  },
    { id: 'montreal', label: { fr: 'Votre parcours à Montréal',               en: 'Your Montréal Journey',        ko: '몬트리올 여정'     }, firstStep: 4  },
    { id: 'language', label: { fr: `Votre parcours en ${ln.fr}`,              en: `Your ${ln.en} Journey`,        ko: `${ln.ko} 여정`     }, firstStep: 6  },
    { id: 'goals',    label: { fr: 'Vos objectifs',                            en: 'Your Goals',                   ko: '나의 목표'         }, firstStep: 9  },
    { id: 'learning', label: { fr: "Votre façon d'apprendre",                 en: 'Learning Style',               ko: '학습 스타일'       }, firstStep: 11 },
    { id: 'hakkyo',   label: { fr: 'À propos de HAKKYO',                      en: 'About HAKKYO',                 ko: 'HAKKYO에 대하여'  }, firstStep: 12 },
    { id: 'last',     label: { fr: 'Une dernière question',                    en: 'One Last Question',            ko: '마지막 질문'       }, firstStep: 14 },
  ]
}

function buildLevelOptions(pl: ProgLang): RadioOption[] {
  const g  = PROG_LANG_GREETING[pl]
  const ln = PROG_LANG_NAMES[pl]
  return [
    {
      fr: `Grand débutant — ${g} est ma limite`,
      en: `Complete beginner — ${g} is my limit`,
      ko: `완전 초보 — ${g}가 전부예요`,
    },
    {
      fr: 'Je connais quelques bases',
      en: `I know some ${ln.en} basics`,
      ko: `${ln.ko} 기초는 조금 알아요`,
    },
    {
      fr: 'Je peux tenir de simples conversations',
      en: 'I can have simple conversations',
      ko: '간단한 대화는 가능해요',
    },
    {
      fr: "Je peux m'exprimer, mais difficilement",
      en: 'I can express myself, but struggle',
      ko: '표현할 수 있지만 아직 어렵게 느껴져요',
    },
    {
      fr: `Je suis assez à l'aise en ${ln.fr}`,
      en: `I'm fairly comfortable in ${ln.en}`,
      ko: `${ln.ko}로 꽤 편하게 대화해요`,
    },
  ]
}

function buildLanguageSteps(pl: ProgLang): StepConfig[] {
  const ln  = PROG_LANG_NAMES[pl]
  const art = PROG_LANG_ARTICLE[pl]

  // Placeholder text for language-specific free-text fields
  const storyPlaceholder: Record<ProgLang, string> = {
    korean:  'Culture, personnes, travail, musique, une histoire personnelle…',
    french:  'La culture, la musique, les voyages, une connexion personnelle…',
    english: 'Voyages, travail, culture pop, une connexion personnelle…',
  }
  const expPlaceholder: Record<ProgLang, string> = {
    korean:  "Dites-nous ce que vous savez et comment vous l'avez appris…",
    french:  "Cours à l'école, séjour en France, autodidacte — dites-nous tout…",
    english: "Cours, télévision, voyages, autodidacte — dites-nous tout…",
  }
  const firstGoalPlaceholder: Record<ProgLang, string> = {
    korean:  'p. ex. Commander un café, me présenter, parler avec ma famille',
    french:  'p. ex. Commander au restaurant, regarder un film sans sous-titres, parler avec des Québécois',
    english: 'p. ex. Passer un entretien, regarder une série, parler avec des collègues',
  }

  return [
    // Step 6 — language level
    {
      id: 'language_level', section: 'language',
      heading: {
        fr: `Comment décririez-vous votre niveau de ${ln.fr} ?`,
        en: `How would you describe your ${ln.en} right now?`,
        ko: `현재 ${ln.ko} 실력을 어떻게 설명하시겠어요?`,
      },
      fields: [
        {
          key: 'korean_level',   // DB column — stores level for any language
          type: 'radio', autoAdvance: true,
          options: buildLevelOptions(pl),
        },
      ],
    },

    // Step 7 — previous experience
    {
      id: 'language_exp', section: 'language',
      heading: {
        fr: `Avez-vous une expérience préalable du ${ln.fr} ?`,
        en: `Any previous ${ln.en} experience?`,
        ko: `${ln.ko}를 배운 경험이 있으시나요?`,
      },
      subheading: {
        fr: 'Cours, autodidacte, voyages, séries — tout compte.',
        en: 'Classes, self-study, travel, TV shows — it all counts.',
        ko: '수업, 독학, 여행, TV 시리즈 — 모든 것이 다 괜찮아요.',
      },
      fields: [
        {
          key: 'previous_korean_exp',   // DB column — stores exp for any language
          type: 'textarea',
          placeholder: expPlaceholder[pl],
        },
      ],
    },

    // Step 8 — why this language
    {
      id: 'language_story', section: 'language',
      heading: {
        fr: `Pourquoi ${art} ${ln.fr} ?`,
        en: `Why ${ln.en}?`,
        ko: `왜 ${ln.ko}인가요?`,
      },
      subheading: {
        fr: "Qu'est-ce qui vous attire vers cette langue ?",
        en: 'What draws you to learning this language?',
        ko: '이 언어를 배우고 싶은 특별한 이유가 있으시나요?',
      },
      fields: [
        {
          key: 'interest_in_korean',   // DB column — stores motivation for any language
          type: 'textarea',
          placeholder: storyPlaceholder[pl],
        },
      ],
    },
  ]
}

function buildSteps(pl: ProgLang): StepConfig[] {
  const ln = PROG_LANG_NAMES[pl]

  const firstGoalPlaceholder: Record<ProgLang, string> = {
    korean:  'p. ex. Commander un café, me présenter, parler avec ma famille',
    french:  'p. ex. Commander au restaurant, regarder un film, parler avec des Québécois',
    english: 'p. ex. Passer un entretien, regarder une série, parler avec des collègues',
  }

  return [
    // ── Informations personnelles ───────────────────────────────────────────
    {
      id: 'name', section: 'basic',
      heading: {
        fr: "Commençons par votre nom.",
        en: "Let's start with your name.",
        ko: "이름을 알려주세요.",
      },
      fields: [
        {
          key: 'name', type: 'text', required: true,
          label: { fr: 'Nom complet', en: 'Full name', ko: '성명' },
          placeholder: 'Votre nom complet',
        },
        {
          key: 'preferred_name', type: 'text',
          label: {
            fr: "Comment souhaitez-vous qu'on vous appelle ?",
            en: 'What should we call you?',
            ko: '어떻게 불러드릴까요?',
          },
          placeholder: 'Surnom ou prénom (facultatif)',
        },
      ],
    },

    {
      id: 'contact', section: 'basic',
      heading: {
        fr: 'Comment pouvons-nous vous contacter ?',
        en: 'How can we reach you?',
        ko: '어떻게 연락드릴까요?',
      },
      fields: [
        {
          key: 'email', type: 'email', required: true,
          label: { fr: 'Adresse courriel', en: 'Email address', ko: '이메일 주소' },
          placeholder: 'votre@courriel.com',
        },
        {
          key: 'phone', type: 'text',
          label: { fr: 'Téléphone / KakaoTalk', en: 'Phone / KakaoTalk ID', ko: '전화번호 / KakaoTalk' },
          placeholder: '+1 514 … ou ID KakaoTalk',
        },
      ],
    },

    {
      id: 'contact_pref', section: 'basic',
      heading: {
        fr: 'Quel est le meilleur moyen de vous joindre ?',
        en: "What's the best way to contact you?",
        ko: '어떤 방법으로 연락하는 게 좋으세요?',
      },
      fields: [
        {
          key: 'preferred_contact', type: 'radio', autoAdvance: true,
          options: [
            { fr: 'Courriel',          en: 'Email',          ko: '이메일'        },
            { fr: 'Téléphone / SMS',   en: 'Phone / SMS',    ko: '전화 / SMS'    },
            { fr: 'KakaoTalk',         en: 'KakaoTalk',      ko: 'KakaoTalk'     },
            { fr: 'Message Instagram', en: 'Instagram DM',   ko: '인스타그램 DM' },
          ],
        },
        {
          key: 'instagram', type: 'text',
          label: { fr: 'Instagram (facultatif)', en: 'Instagram (optional)', ko: '인스타그램 (선택)' },
          placeholder: '@handle',
        },
      ],
    },

    {
      id: 'languages', section: 'basic',
      heading: {
        fr: 'Quelles langues parlez-vous ?',
        en: 'What languages do you speak?',
        ko: '어떤 언어를 구사하시나요?',
      },
      subheading: {
        fr: "Incluez les langues que vous êtes en train d'apprendre.",
        en: "Include languages you're currently learning too.",
        ko: '현재 배우고 있는 언어도 포함해 주세요.',
      },
      fields: [
        {
          key: 'languages_spoken', type: 'text',
          placeholder: 'p. ex. Anglais, Français, Mandarin, Coréen',
        },
      ],
    },

    // ── Votre parcours à Montréal ────────────────────────────────────────────
    {
      id: 'montreal_time', section: 'montreal',
      heading: {
        fr: 'Depuis combien de temps vivez-vous à Montréal ?',
        en: 'How long have you been living in Montréal?',
        ko: '몬트리올에 오신 지 얼마나 되었나요?',
      },
      fields: [
        {
          key: 'time_in_montreal', type: 'radio', autoAdvance: true,
          options: [
            { fr: 'Moins de 6 mois', en: 'Less than 6 months', ko: '6개월 미만'  },
            { fr: '6 mois à 1 an',   en: '6 months – 1 year',  ko: '6개월 ~ 1년' },
            { fr: '1 à 3 ans',       en: '1 – 3 years',        ko: '1 ~ 3년'     },
            { fr: 'Plus de 3 ans',   en: 'More than 3 years',  ko: '3년 이상'    },
          ],
        },
      ],
    },

    {
      id: 'stage', section: 'montreal',
      heading: {
        fr: 'Quelle est votre situation actuelle ?',
        en: 'What stage of life are you in right now?',
        ko: '현재 어떤 상황에 계신가요?',
      },
      fields: [
        {
          key: 'current_stage', type: 'radio',
          options: [
            { fr: 'Étudiant(e)',              en: 'Student',                     ko: '학생'              },
            { fr: 'En emploi',                en: 'Working',                     ko: '직장인'            },
            { fr: "En recherche d'emploi",    en: 'Looking for work',            ko: '구직 중'           },
            { fr: 'Travailleur(se) autonome', en: 'Freelancing / Self-employed', ko: '프리랜서 / 자영업' },
            { fr: 'Autre',                    en: 'Other',                       ko: '기타'              },
          ],
        },
        {
          key: 'current_focus', type: 'textarea',
          label: {
            fr: 'Sur quoi vous concentrez-vous en ce moment ?',
            en: 'What are you currently focused on?',
            ko: '요즘 주로 무엇에 집중하고 계신가요?',
          },
          placeholder: "Études, un nouveau travail, s'installer, un projet personnel…",
        },
      ],
    },

    // ── Language journey (dynamic — steps 6–8) ───────────────────────────────
    ...buildLanguageSteps(pl),

    // ── Vos objectifs ────────────────────────────────────────────────────────
    {
      id: 'goals', section: 'goals',
      heading: {
        fr: "Qu'est-ce que vous souhaitez accomplir ?",
        en: 'What do you want to achieve?',
        ko: '어떤 것을 이루고 싶으세요?',
      },
      fields: [
        {
          key: 'first_korean_goal', type: 'text',  // DB column — stores first goal for any language
          label: {
            fr: `La première chose que vous souhaitez faire en ${ln.fr} :`,
            en: `The first thing you want to do in ${ln.en}:`,
            ko: `${ln.ko}로 처음 해보고 싶은 것:`,
          },
          placeholder: firstGoalPlaceholder[pl],
        },
        {
          key: 'six_month_goal', type: 'textarea',
          label: {
            fr: "Où souhaitez-vous en être dans 6 mois ?",
            en: 'Where do you want to be in 6 months?',
            ko: '6개월 후 어떤 상태이고 싶으세요?',
          },
          placeholder: 'Votre vision honnête…',
        },
      ],
    },

    {
      id: 'why_join', section: 'goals',
      heading: {
        fr: 'Pourquoi souhaitez-vous rejoindre HAKKYO ?',
        en: 'Why are you joining HAKKYO?',
        ko: 'HAKKYO에 참여하고 싶은 이유가 무엇인가요?',
      },
      subheading: {
        fr: "Qu'est-ce qui vous a donné envie de faire cette demande ?",
        en: 'What made you want to apply to this program?',
        ko: '이 프로그램에 지원하고 싶었던 이유가 무엇인가요?',
      },
      fields: [
        {
          key: 'reason_for_joining', type: 'textarea',
          placeholder: "Qu'est-ce qui vous a amené(e) ici ?",
        },
      ],
    },

    // ── Votre façon d'apprendre ──────────────────────────────────────────────
    {
      id: 'learning', section: 'learning',
      heading: {
        fr: 'Comment apprenez-vous le mieux ?',
        en: 'How do you learn best?',
        ko: '어떤 방식으로 배울 때 가장 잘 배우시나요?',
      },
      fields: [
        {
          key: 'biggest_challenge', type: 'textarea',
          label: {
            fr: "Quel est votre plus grand défi dans l'apprentissage d'une langue ?",
            en: "What's your biggest challenge in learning a language?",
            ko: '언어 학습에서 가장 큰 어려움은 무엇인가요?',
          },
          placeholder: 'Soyez honnête — cela nous aide à mieux vous aider.',
        },
        {
          key: 'preferred_environment', type: 'radio',
          label: {
            fr: "Environnement d'apprentissage préféré",
            en: 'Preferred learning environment',
            ko: '선호하는 학습 환경',
          },
          options: [
            { fr: 'Structuré avec des objectifs clairs', en: 'Structured with clear goals',  ko: '명확한 목표가 있는 구조적 학습' },
            { fr: 'Conversationnel et naturel',          en: 'Conversational and organic',    ko: '대화 위주의 자연스러운 학습'   },
            { fr: 'Un mélange des deux',                 en: 'A mix of both',                 ko: '두 가지의 혼합'                },
            { fr: 'À mon rythme avec du soutien',        en: 'Self-paced with support',       ko: '내 속도대로, 지원을 받으며'    },
          ],
        },
      ],
    },

    // ── À propos de HAKKYO ───────────────────────────────────────────────────
    {
      id: 'discovery', section: 'hakkyo',
      heading: {
        fr: 'Comment avez-vous découvert HAKKYO ?',
        en: 'How did you find HAKKYO?',
        ko: 'HAKKYO를 어떻게 알게 되셨나요?',
      },
      fields: [
        {
          key: 'how_found_hakkyo', type: 'radio', autoAdvance: true,
          options: [
            { fr: 'Instagram',                                en: 'Instagram',                   ko: '인스타그램'             },
            { fr: "Un(e) ami(e) ou membre de la communauté", en: 'A friend or community member', ko: '친구 또는 커뮤니티 멤버' },
            { fr: "Événement d'échange de langues",          en: 'Language Exchange event',      ko: '언어 교환 이벤트'       },
            { fr: 'Recherche Google',                         en: 'Google search',                ko: '구글 검색'              },
            { fr: 'Autre',                                    en: 'Other',                        ko: '기타'                   },
          ],
        },
      ],
    },

    {
      id: 'why_hakkyo', section: 'hakkyo',
      heading: {
        fr: "Qu'est-ce qui vous a le plus intéressé dans HAKKYO ?",
        en: 'What interested you most about HAKKYO?',
        ko: 'HAKKYO에서 가장 끌렸던 점은 무엇인가요?',
      },
      subheading: {
        fr: "L'approche, la communauté, quelque chose que vous avez entendu — partagez ce qui vous a marqué.",
        en: 'The approach, the community, something you heard — share what stood out.',
        ko: '접근 방식, 커뮤니티, 들은 이야기 — 기억에 남은 것을 공유해 주세요.',
      },
      fields: [
        {
          key: 'what_interested', type: 'textarea',
          placeholder: "Dites-nous ce qui vous a attiré(e)…",
        },
      ],
    },

    // ── Une dernière question ─────────────────────────────────────────────────
    {
      id: 'open', section: 'last',
      heading: {
        fr: 'Une dernière question.',
        en: 'One last question.',
        ko: '마지막 질문입니다.',
      },
      subheading: {
        fr: "Facultatif. Prenez autant d'espace que vous le souhaitez.",
        en: 'Optional. Take as much or as little space as you need.',
        ko: '선택 사항입니다. 원하시는 만큼 자유롭게 작성해 주세요.',
      },
      fields: [
        {
          key: 'definition_great_class', type: 'textarea',
          label: {
            fr: "Pour vous, qu'est-ce qu'un excellent cours de langue ?",
            en: 'What makes a great language class to you?',
            ko: '당신에게 훌륭한 언어 수업이란 무엇인가요?',
          },
          placeholder: 'Votre avis honnête…',
        },
        {
          key: 'questions_for_hakkyo', type: 'textarea',
          label: {
            fr: 'Des questions pour nous ?',
            en: 'Any questions for us?',
            ko: '궁금한 점이 있으신가요?',
          },
          placeholder: 'Tout ce que vous souhaitez savoir avant de rejoindre…',
        },
      ],
    },
  ]
}

// ──────────────────────────────────────────────────────────────────────────────
// Section atmospheres
// Each section gets a distinct background that communicates emotional context.
// Gradients only — no images, no illustrations. The environment, not decoration.
// ──────────────────────────────────────────────────────────────────────────────

const SECTION_BG: Record<string, string> = {
  // S01 — A blank page. Arrival. White silence.
  basic: '#ffffff',

  // S02 — A quiet Montréal morning. Pale sky above, warm stone below.
  montreal: 'linear-gradient(180deg, #cddde8 0%, #d8e4e8 28%, #e4e8e2 56%, #ece8de 82%, #f0ece4 100%)',

  // S03 — A path into the distance. Warm dust, open air, movement.
  language: 'linear-gradient(168deg, #f0ede8 0%, #e6e0d8 46%, #dbd4ca 100%)',

  // S04 — A horizon. Cool sky, warm earth. A future not yet reached.
  goals: 'linear-gradient(180deg, #bfcedb 0%, #cbd6e2 20%, #d3dce6 42%, #dfe3e6 62%, #e8e6de 82%, #eceadf 100%)',

  // S05 — A warm interior. Amber light. A desk by a window.
  learning: 'linear-gradient(154deg, #f4e8d2 0%, #eedfca 50%, #e8d6bc 100%)',

  // S06 — A shared table. The warmest moment. Conversation.
  hakkyo: 'linear-gradient(148deg, #f0dece 0%, #e8d0be 46%, #e0c6b0 100%)',

  // S07 — Late afternoon. Long shadows. A pause before leaving.
  last: 'linear-gradient(180deg, #ece6dc 0%, #e4ddd0 30%, #ddd5c8 64%, #d8cfc0 100%)',
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const DRAFT_KEY = (id: string) => `hakkyo_apply_${id}`
type Draft = Record<string, string>

export function shortLevel(raw: string): string {
  if (!raw) return ''
  const r = raw.toLowerCase()
  if (r.includes('débutant') || r.includes('limite') || r.includes('limit')) return 'Débutant'
  if (r.includes('quelques bases') || r.includes('some') && r.includes('basics'))  return 'Quelques bases'
  if (r.includes('simples') || r.includes('simple conv'))                          return 'Conversations simples'
  if (r.includes('difficilement') || r.includes('struggle'))                        return 'Intermédiaire'
  if (r.includes('aise') || r.includes('comfortable'))                              return "À l'aise"
  return raw
}

// ──────────────────────────────────────────────────────────────────────────────
// Trilingual display components
// ──────────────────────────────────────────────────────────────────────────────

function Heading3({ t }: { t: T3 }) {
  return (
    <div className="mb-3">
      <h2 className="text-[26px] md:text-[30px] font-light text-gray-900 leading-tight">{t.fr}</h2>
      <p className="text-[14px] text-gray-500 leading-snug mt-2">{t.en}</p>
      <p className="text-[13px] text-gray-500 leading-snug mt-1">{t.ko}</p>
    </div>
  )
}

function Sub3({ t }: { t: T3 }) {
  return (
    <div className="mb-8">
      <p className="text-[13px] text-gray-600 leading-relaxed">{t.fr}</p>
      <p className="text-[12px] text-gray-500 leading-relaxed mt-1.5">{t.en}</p>
      <p className="text-[11px] text-gray-500 leading-relaxed mt-1">{t.ko}</p>
    </div>
  )
}

function Label3({ t }: { t: T3 }) {
  return (
    <div className="mb-2">
      <p className="text-[12px] text-gray-700 font-medium leading-snug">{t.fr}</p>
      <p className="text-[11px] text-gray-500 leading-snug mt-1">{t.en}</p>
      <p className="text-[10px] text-gray-500 leading-snug mt-0.5">{t.ko}</p>
    </div>
  )
}

function SectionPill3({ label }: { label: T3 }) {
  return (
    <div className="mb-6">
      <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-gray-700">{label.fr}</p>
      <p className="text-[9px] tracking-[0.12em] uppercase text-gray-500 mt-1">{label.en} · {label.ko}</p>
    </div>
  )
}

function RadioBtn({
  option, index, selected, onClick,
}: { option: RadioOption; index: number; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-all duration-150',
        selected ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400 bg-white',
      ].join(' ')}
    >
      <span className={[
        'shrink-0 w-5 h-5 mt-0.5 rounded flex items-center justify-center text-[9px] font-bold border',
        selected ? 'border-white text-white' : 'border-gray-300 text-gray-400',
      ].join(' ')}>
        {String.fromCharCode(65 + index)}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14px] leading-snug">{option.fr}</span>
        <span className={['block text-[12px] mt-1 leading-snug', selected ? 'opacity-60' : 'text-gray-500'].join(' ')}>{option.en} · {option.ko}</span>
      </span>
      {selected && <Check size={13} className="ml-auto shrink-0 mt-1" />}
    </button>
  )
}

// Btn3 removed — buttons now use plain FR text with a caption below

// ──────────────────────────────────────────────────────────────────────────────
// Profile summary panel
// ──────────────────────────────────────────────────────────────────────────────

function ProfileSummary({ draft, step, pl }: { draft: Draft; step: number; pl: ProgLang }) {
  const ln          = PROG_LANG_NAMES[pl]
  const displayName = draft.preferred_name?.trim() || draft.name?.trim()
  const level       = draft.korean_level ? shortLevel(draft.korean_level) : null
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
        <div className="space-y-0.5">
          <p className="text-[11px] text-gray-300 leading-relaxed">Vos réponses apparaîtront ici au fur et à mesure.</p>
          <p className="text-[10px] text-gray-300 leading-relaxed">Your answers will appear here as you go.</p>
          <p className="text-[9px] text-gray-300 leading-relaxed">답변이 여기에 나타납니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayName && <p className="text-[14px] font-medium text-gray-700 leading-tight">{displayName}</p>}
          {(time || stage || focus) && (
            <SummaryBlock label="Montréal">
              {time  && <SummaryLine>{time}</SummaryLine>}
              {stage && <SummaryLine muted>{stage}</SummaryLine>}
              {focus && <SummaryLine muted>{focus}</SummaryLine>}
            </SummaryBlock>
          )}
          {level && (
            <SummaryBlock label={ln.fr.charAt(0).toUpperCase() + ln.fr.slice(1)}>
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

// ──────────────────────────────────────────────────────────────────────────────
// Main page component
// ──────────────────────────────────────────────────────────────────────────────

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

  // Compute program language and steps after program loads
  const progLang = useMemo(() => detectProgLang(program), [program])
  const STEPS    = useMemo(() => buildSteps(progLang), [progLang])
  const SECTIONS = useMemo(() => buildSections(progLang), [progLang])
  const TOTAL    = STEPS.length

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
    set(key, frValue)
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
      setError("Le nom et l'adresse courriel sont requis.\nName and email are required.\n이름과 이메일은 필수 항목입니다.")
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await submitProgramApplication({
        program_id:             id ?? null,
        program_name:           program ? `${progLang}:${program.name_en || program.name_fr || program.name_ko}` : null,
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
      trackEvent({ eventName: 'program_apply_clicked', targetType: 'form', targetId: id ?? undefined })
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
    const firstName = draft.preferred_name?.trim() || draft.name?.trim()?.split(' ')[0]
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 text-center" style={{ background: 'linear-gradient(180deg, #f0ece6 0%, #ebe6de 100%)' }}>
        <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center mb-7">
          <Check size={18} className="text-white" />
        </div>
        <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-300 mb-5">HAKKYO</p>
        <h1 className="text-2xl font-light text-gray-900 mb-0.5">Candidature reçue.</h1>
        <p className="text-[14px] text-gray-400 mb-0.5">Application received.</p>
        <p className="text-[12px] text-gray-300 mb-8">지원서가 접수되었습니다.</p>
        <p className="text-[13px] text-gray-500 leading-relaxed max-w-xs mb-1">
          {firstName ? `Merci, ${firstName}.` : 'Merci.'}{' '}
          Nous lisons chaque candidature personnellement et vous répondrons dans les prochains jours.
        </p>
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-xs mb-0.5">
          We read every application personally and will be in touch within a few days.
        </p>
        <p className="text-[10px] text-gray-300 leading-relaxed max-w-xs mb-8">
          모든 지원서를 직접 검토하며, 며칠 내로 연락드리겠습니다.
        </p>
        <Link to="/programs" className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors underline underline-offset-4">
          Retour aux programmes · Back to programs · 프로그램으로 돌아가기
        </Link>
      </div>
    )
  }

  // ── Welcome ──
  if (isWelcome) {
    const ln          = PROG_LANG_NAMES[progLang]
    const programName = program ? (program.name_fr || program.name_en || program.name_ko) : null
    const hasDraft    = Object.keys(draft).length > 0
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
            <h1 className="text-[32px] md:text-[38px] font-light text-gray-900 leading-tight">Bienvenue à HAKKYO</h1>
            <p className="text-[16px] text-gray-400 leading-tight mt-1">Welcome to HAKKYO</p>
            <p className="text-[13px] text-gray-300 leading-tight mt-0.5">HAKKYO에 오신 것을 환영합니다.</p>
          </div>
          <div className="mb-8 space-y-5">
            <div>
              <p className="text-[14px] text-gray-600 leading-relaxed">
                HAKKYO est un espace pour apprendre {PROG_LANG_ARTICLE[progLang]} {ln.fr},<br />
                rencontrer des gens<br />
                et mieux comprendre Montréal.
              </p>
              <p className="text-[12px] text-gray-400 leading-relaxed mt-2">
                HAKKYO is a place to learn {ln.en},<br />
                meet people,<br />
                and better understand Montréal.
              </p>
              <p className="text-[10px] text-gray-300 leading-relaxed mt-1.5">
                HAKKYO는 {ln.ko}를 배우고, 사람을 만나고,<br />
                몬트리올을 이해하는 공간입니다.
              </p>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-[13px] text-gray-500">Cette candidature prend environ 5 à 10 minutes.</p>
              <p className="text-[11px] text-gray-400 mt-0.5">This application takes approximately 5–10 minutes.</p>
              <p className="text-[10px] text-gray-300 mt-0.5">이 신청서는 약 5~10분 정도 소요됩니다.</p>
            </div>
          </div>
          {hasDraft && (
            <p className="text-[11px] text-gray-400 mb-5">↩ Brouillon enregistré · Saved draft · 저장된 임시 지원서</p>
          )}
          <div>
            <button
              onClick={() => transition(() => setStep(0))}
              className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-xl px-6 py-3.5 text-[15px] font-light hover:bg-gray-700 transition-colors"
            >
              Commencer
              <ArrowRight size={15} className="shrink-0" />
            </button>
            <p className="text-[12px] text-gray-400 mt-2">Begin · 시작하기</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Review ──
  if (isReview) {
    const ln = PROG_LANG_NAMES[progLang]
    const reviewSections = [
      {
        label: { fr: 'Informations personnelles', en: 'Basic Information', ko: '기본 정보' },
        firstStep: 0,
        rows: [
          { q: { fr: 'Nom', en: 'Name', ko: '이름' },               a: [draft.name, draft.preferred_name && `(${draft.preferred_name})`].filter(Boolean).join(' ') },
          { q: { fr: 'Courriel', en: 'Email', ko: '이메일' },        a: draft.email ?? '' },
          { q: { fr: 'Téléphone', en: 'Phone', ko: '전화번호' },     a: draft.phone ?? '' },
          { q: { fr: 'Contact via', en: 'Contact via', ko: '연락 방법' }, a: draft.preferred_contact ?? '' },
          { q: { fr: 'Instagram', en: 'Instagram', ko: '인스타그램' }, a: draft.instagram ?? '' },
          { q: { fr: 'Langues', en: 'Languages', ko: '구사 언어' },  a: draft.languages_spoken ?? '' },
        ].filter(r => r.a),
      },
      {
        label: { fr: 'Votre parcours à Montréal', en: 'Montréal Journey', ko: '몬트리올 여정' },
        firstStep: 4,
        rows: [
          { q: { fr: 'Temps à Montréal', en: 'Time here', ko: '체류 기간' }, a: draft.time_in_montreal ?? '' },
          { q: { fr: 'Situation', en: 'Stage', ko: '현재 상황' },            a: draft.current_stage ?? '' },
          { q: { fr: 'Concentration', en: 'Focus', ko: '집중 중인 것' },     a: draft.current_focus ?? '' },
        ].filter(r => r.a),
      },
      {
        label: { fr: `Votre parcours en ${ln.fr}`, en: `${ln.en} Journey`, ko: `${ln.ko} 여정` },
        firstStep: 6,
        rows: [
          { q: { fr: `Niveau de ${ln.fr}`, en: `${ln.en} level`, ko: `${ln.ko} 실력` }, a: draft.korean_level ? shortLevel(draft.korean_level) : '' },
          { q: { fr: 'Expérience',          en: 'Experience',     ko: '학습 경험' },      a: draft.previous_korean_exp ?? '' },
          { q: { fr: `Pourquoi ${ln.fr} ?`, en: `Why ${ln.en}?`,  ko: `왜 ${ln.ko}?` },  a: draft.interest_in_korean ?? '' },
        ].filter(r => r.a),
      },
      {
        label: { fr: 'Vos objectifs', en: 'Your Goals', ko: '나의 목표' },
        firstStep: 9,
        rows: [
          { q: { fr: 'Premier objectif', en: 'First goal', ko: '첫 번째 목표' },    a: draft.first_korean_goal ?? '' },
          { q: { fr: 'Dans 6 mois',       en: 'In 6 months', ko: '6개월 후' },       a: draft.six_month_goal ?? '' },
          { q: { fr: 'Pourquoi rejoindre', en: 'Why joining', ko: '참여 이유' },     a: draft.reason_for_joining ?? '' },
        ].filter(r => r.a),
      },
      {
        label: { fr: "Votre façon d'apprendre", en: 'Learning Style', ko: '학습 스타일' },
        firstStep: 11,
        rows: [
          { q: { fr: 'Plus grand défi', en: 'Biggest challenge', ko: '가장 큰 어려움' }, a: draft.biggest_challenge ?? '' },
          { q: { fr: 'Environnement',    en: 'Environment',       ko: '선호 환경' },       a: draft.preferred_environment ?? '' },
        ].filter(r => r.a),
      },
      {
        label: { fr: 'À propos de HAKKYO', en: 'About HAKKYO', ko: 'HAKKYO에 대하여' },
        firstStep: 12,
        rows: [
          { q: { fr: 'Découvert via', en: 'How found us', ko: '알게 된 경로' },               a: draft.how_found_hakkyo ?? '' },
          { q: { fr: 'Ce qui vous intéresse', en: 'What interested', ko: '관심을 가진 이유' }, a: draft.what_interested ?? '' },
        ].filter(r => r.a),
      },
      {
        label: { fr: 'Une dernière question', en: 'One Last Question', ko: '마지막 질문' },
        firstStep: 14,
        rows: [
          { q: { fr: 'Un excellent cours', en: 'A great class', ko: '훌륭한 수업이란' }, a: draft.definition_great_class ?? '' },
          { q: { fr: 'Questions pour nous', en: 'Questions for us', ko: '궁금한 점' },   a: draft.questions_for_hakkyo ?? '' },
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
          <ChevronLeft size={13} /> Retour · Back · 뒤로
        </button>
        <div className="mb-8">
          <h2 className="text-2xl font-light text-gray-900">Votre profil HAKKYO</h2>
          <p className="text-[14px] text-gray-400 mt-0.5">Your HAKKYO Profile</p>
          <p className="text-[12px] text-gray-300 mt-0.5">나의 HAKKYO 프로필</p>
          <div className="mt-4 space-y-0.5">
            <p className="text-[12px] text-gray-400">Prenez un moment pour relire vos réponses.</p>
            <p className="text-[11px] text-gray-300">Take a moment to review before submitting.</p>
            <p className="text-[10px] text-gray-300">제출 전에 답변을 한 번 더 확인해 주세요.</p>
          </div>
        </div>
        <div className="space-y-3 mb-10">
          {reviewSections.map(sec => sec.rows.length > 0 && (
            <div key={sec.label.fr} className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/60">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-700">{sec.label.fr}</p>
                  <p className="text-[9px] tracking-[0.10em] uppercase text-gray-400">{sec.label.en}</p>
                  <p className="text-[8px] tracking-[0.08em] uppercase text-gray-300">{sec.label.ko}</p>
                </div>
                <button
                  onClick={() => transition(() => setStep(sec.firstStep))}
                  className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors shrink-0 ml-4"
                >
                  Modifier · Edit · 수정
                </button>
              </div>
              <div className="px-4 py-3 space-y-3">
                {sec.rows.map(row => (
                  <div key={row.q.fr} className="grid grid-cols-[160px_1fr] gap-3">
                    <span className="shrink-0">
                      <span className="block text-[11px] text-gray-600">{row.q.fr}</span>
                      <span className="block text-[9px] text-gray-400">{row.q.en}</span>
                      <span className="block text-[8px] text-gray-300">{row.q.ko}</span>
                    </span>
                    <span className="text-[13px] text-gray-700 leading-snug whitespace-pre-wrap">{row.a}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {error && <p className="text-sm text-red-500 mb-4 whitespace-pre-line">{error}</p>}
        <div>
          <button
            onClick={submit}
            disabled={submitting}
            className="w-full bg-gray-900 text-white rounded-xl py-4 text-[15px] font-light hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Envoi en cours…' : 'Soumettre ma candidature'}
          </button>
          {!submitting && (
            <p className="text-[12px] text-gray-400 text-center mt-2">Submit application · 지원서 제출</p>
          )}
        </div>
        <div className="text-center mt-4 space-y-0.5">
          <p className="text-[11px] text-gray-400">Nous lisons chaque candidature personnellement et vous répondrons dans les prochains jours.</p>
          <p className="text-[10px] text-gray-300">We review every application personally and follow up within a few days.</p>
          <p className="text-[9px] text-gray-300">모든 지원서를 직접 검토하며, 며칠 내로 연락드리겠습니다.</p>
        </div>
      </div>
    )
  }

  // ── Question step ──
  const s       = STEPS[step]
  const stepNum = step + 1
  const secMeta = SECTIONS.find(sec => sec.id === s.section)
  const hasContent = Object.keys(draft).some(k => draft[k]?.trim())

  const sectionBg = SECTION_BG[s.section] ?? '#ffffff'

  return (
    <div
      className="min-h-[calc(100vh-64px)] flex flex-col"
      style={{ background: sectionBg, transition: 'background 0.7s ease' }}
      onKeyDown={handleKeyDown}
    >
      {/* Progress bar */}
      <div className="h-0.5 bg-black/10 w-full">
        <div className="h-full bg-gray-900 transition-all duration-500" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0">
        <button onClick={back} className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
          <ChevronLeft size={13} /> Retour · Back · 뒤로
        </button>
        <span className="text-[11px] text-gray-300 tracking-wide">{stepNum} / {TOTAL}</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Question column */}
        <div
          className="flex-1 flex flex-col justify-center px-6 pb-12 overflow-y-auto"
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.14s ease' }}
        >
          <div className="max-w-xl w-full mx-auto">
            {secMeta && <SectionPill3 label={secMeta.label} />}
            <Heading3 t={s.heading} />
            {s.subheading ? <Sub3 t={s.subheading} /> : <div className="mb-8" />}

            <div className="space-y-6">
              {s.fields.map((field, fi) => {
                const value = draft[field.key] ?? ''

                if (field.type === 'radio') {
                  return (
                    <div key={field.key}>
                      {field.label && <Label3 t={field.label} />}
                      <div className="space-y-2 mt-3">
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
                      {field.label && <Label3 t={field.label} />}
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
                    {field.label && <Label3 t={field.label} />}
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

            <div className="mt-10">
              <div className="flex items-center gap-4">
                <button
                  onClick={advance}
                  className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-xl px-6 py-3.5 text-[15px] font-light hover:bg-gray-700 transition-colors"
                >
                  {step === TOTAL - 1 ? 'Vérifier' : 'Continuer'}
                  <ArrowRight size={15} className="shrink-0" />
                </button>
                <span className="text-[11px] text-gray-300 hidden sm:inline">
                  <kbd className="border border-gray-200 rounded px-1 py-0.5 text-[9px] font-mono">Enter</kbd>
                </span>
              </div>
              <p className="text-[12px] text-gray-400 mt-2">
                {step === TOTAL - 1 ? 'Review · 검토하기' : 'Continue · 계속'}
              </p>
            </div>

            {!s.fields.some(f => f.required) && step > 1 && (
              <button onClick={advance} className="mt-3 text-[11px] text-gray-400 hover:text-gray-600 transition-colors text-left">
                Passer <span className="text-gray-300">· Skip · 건너뛰기</span>
              </button>
            )}

            {hasContent && step >= 1 && (
              <div className="lg:hidden mt-10 border-t border-gray-100 pt-4">
                <button onClick={() => setSummaryOpen(o => !o)} className="w-full flex items-center justify-between text-left">
                  <div>
                    <span className="block text-[11px] font-semibold text-gray-500">Votre profil HAKKYO</span>
                    <span className="block text-[9px] text-gray-300">Your HAKKYO Profile · 나의 HAKKYO 프로필</span>
                  </div>
                  <ChevronDown size={14} className={['text-gray-300 transition-transform', summaryOpen ? 'rotate-180' : ''].join(' ')} />
                </button>
                {summaryOpen && <div className="mt-4"><ProfileSummary draft={draft} step={step} pl={progLang} /></div>}
              </div>
            )}
          </div>
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-56 xl:w-60 border-l border-black/5 bg-white/70 backdrop-blur-sm px-5 py-10 shrink-0 overflow-y-auto">
          <ProfileSummary draft={draft} step={step} pl={progLang} />
        </aside>
      </div>
    </div>
  )
}
