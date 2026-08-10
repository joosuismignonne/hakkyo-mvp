import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Status, { Arrow } from '../components/HakkyoStatus'
import { programs, activities } from '../data/hakkyo'
import { submitApplication, ApplicationPayload } from '../lib/hakkyoApi'
import { trackEvent } from '../lib/analytics'

function PageTitle({ no, title, sub }: { no: string; title: string; sub: string }) {
  return (
    <section className="page-title section-pad">
      <span>{no}</span><h1>{title}</h1><p>{sub}</p>
    </section>
  )
}

function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(false)
    try {
      await submitApplication({ kind: 'newsletter', selection: 'SESSION 04 NEWS', email })
      trackEvent({ eventName: 'newsletter_submitted', targetType: 'form', targetLabel: 'apply-page' })
      setDone(true)
    } catch { setError(true) }
  }
  return (
    <section id="notify" className="newsletter section-pad">
      <div><Status>SESSION 04 NEWS</Status><h2>4기 소식을<br />가장 먼저 받아보세요.</h2></div>
      {done ? <strong className="newsletter-success">신청됐어요. 곧 이메일로 만나요.</strong> : (
        <form onSubmit={submit}>
          <label><span>EMAIL</span><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" /></label>
          <button className="cta">소식 신청하기 <Arrow /></button>
          {error && <p>잠시 후 다시 시도해 주세요.</p>}
        </form>
      )}
    </section>
  )
}

interface Question {
  name: string
  label: string
  hint: string
  type: string
  placeholder?: string
  required?: boolean
  options?: string[]
}

function ApplicationForm({ kind, selection }: { kind: 'program' | 'activity' | 'community'; selection: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const commonQuestions = [
    { name:"name",            label:"이름을 알려주세요.",                         hint:"Name",             type:"text",     placeholder:"이름을 적어주세요",         required:true },
    { name:"email",           label:"연락받을 이메일은 무엇인가요?",              hint:"Email",            type:"email",    placeholder:"email@example.com",         required:true },
    { name:"phone",           label:"전화번호를 알려주세요.",                     hint:"Phone · 선택",     type:"tel",      placeholder:"514-000-0000" },
    { name:"instagram",       label:"인스타그램 계정이 있나요?",                  hint:"Instagram · 선택", type:"text",     placeholder:"@username" },
    { name:"city",            label:"현재 어느 도시에 거주하고 있나요?",          hint:"Current city",     type:"text",     placeholder:"예: Montréal",              required:true },
    { name:"timeInMontreal",  label:"몬트리올에 온 지 얼마나 되었나요?",          hint:"Time in Montréal", type:"choice",   options:["아직 오기 전이에요","3개월 미만","3–6개월","6개월–1년","1–3년","3년 이상"], required:true },
    { name:"currentStage",    label:"현재 몬트리올에서 어떤 시간을 보내고 있나요?", hint:"Your current stage", type:"choice", options:["유학 중","워킹홀리데이 중","직장 생활 중","이민·정착 중","여행·단기 체류 중","그 외"], required:true },
  ]
  const programQuestions = [
    { name:"languageLevel",      label:`현재 ${selection} 실력은 어느 정도인가요?`, hint:"Language level",     type:"choice",   options:["처음 시작해요","기초 표현을 조금 알아요","간단한 대화가 가능해요","일상 대화가 가능해요","잘 모르겠어요"], required:true },
    { name:"learningExperience", label:"지금까지 이 언어를 어떻게 공부해 왔나요?",   hint:"Learning experience", type:"textarea", placeholder:"학원, 독학, 앱, 현지 생활 등 편하게 적어주세요", required:true },
    { name:"speakingBarrier",    label:"이 언어로 말할 때 가장 어려운 점은 무엇인가요?", hint:"Speaking barrier", type:"choice",   options:["표현이 바로 떠오르지 않아요","발음이 걱정돼요","문법이 틀릴까 봐 망설여요","상대가 못 알아들을까 걱정돼요","말할 기회가 부족해요","그 외"], required:true },
    { name:"goal",               label:"이번 프로그램을 통해 가장 이루고 싶은 것은 무엇인가요?", hint:"Your goal", type:"textarea", placeholder:"구체적인 장면이나 목표가 있다면 함께 적어주세요", required:true },
    { name:"preferredClassStyle", label:"수업에서 어떤 활동을 가장 많이 해보고 싶나요?", hint:"Preferred class style", type:"choice", options:["생활 표현 배우기","1:1 대화 연습","그룹 대화·게임","발음 교정","쓰기와 피드백","골고루 해보고 싶어요"], required:true },
  ]
  const activityQuestions = [
    { name:"experience",  label:"이 액티비티를 해본 경험이 있나요?",                hint:"Experience",               type:"choice",   options:["처음이에요","한두 번 해봤어요","가끔 즐겨요","자주 하고 있어요"], required:true },
    { name:"joinReason",  label:"이번 액티비티에 함께하고 싶은 이유는 무엇인가요?", hint:"Why join?",                 type:"textarea", placeholder:"기대하는 점이나 만나고 싶은 사람들을 편하게 적어주세요", required:true },
    { name:"comfort",     label:"진행할 때 미리 알아두면 좋은 점이 있나요?",        hint:"Anything we should know? · 선택", type:"textarea", placeholder:"속도, 알레르기, 이동 관련 사항 등" },
  ]
  const communityQuestions = [
    { name:"joinReason",  label:"HAKKYO 커뮤니티와 함께하고 싶은 이유는 무엇인가요?", hint:"Why join?",       type:"textarea", placeholder:"배우고 싶은 것, 만나고 싶은 사람, 함께 나누고 싶은 이야기를 적어주세요", required:true },
    { name:"interests",   label:"어떤 모임과 소식에 관심이 있나요?",                  hint:"Your interests",  type:"choice",   options:["언어 교환과 클래스","수요일 액티비티","몬트리올 정착 정보","새로운 친구와 커뮤니티","모두 궁금해요"], required:true },
    { name:"language",    label:"편하게 이야기할 수 있는 언어를 알려주세요.",         hint:"Languages",       type:"text",     placeholder:"예: 한국어, English, Français", required:true },
  ]
  const schedulingQuestions = [
    { name:"availability",      label:"참여 가능한 요일과 시간대를 알려주세요.",       hint:"Availability",    type:"textarea", placeholder:"예: 평일 6시 이후 / 일요일 오전", required:true },
    { name:"preferredLocation", label:"몬트리올에서 참여하기 편한 지역은 어디인가요?", hint:"Preferred area",  type:"text",     placeholder:"예: Westmount, Downtown, NDG", required:true },
  ]
  const closingQuestions = [
    { name:"discovery", label:"HAKKYO를 어떻게 알게 되었나요?",              hint:"How did you hear about us?", type:"choice",   options:["Instagram","네이버 카페","한카","친구·지인 추천","Google 검색","HAKKYO 수업·행사","기타"], required:true },
    { name:"message",   label:"마지막으로 HAKKYO에 전하고 싶은 말이 있나요?", hint:"Final message · 선택",       type:"textarea", placeholder:"궁금한 점이나 함께 나누고 싶은 이야기를 적어주세요" },
  ]

  const questions: Question[] = [
    ...commonQuestions,
    ...(kind === 'program' ? programQuestions : kind === 'community' ? communityQuestions : activityQuestions),
    ...(kind === 'program' ? schedulingQuestions : []),
    ...closingQuestions,
  ]

  const q = questions[step]
  const value = answers[q.name] || ''
  const canNext = !q.required || value.trim().length > 0

  function setValue(v: string) { setAnswers(prev => ({ ...prev, [q.name]: v })) }

  async function submit() {
    setState('sending')
    try {
      const payload: ApplicationPayload = { kind, selection, ...answers }
      await submitApplication(payload)
      trackEvent({ eventName: 'application_submitted', targetType: kind, targetLabel: selection })
      setState('done')
    } catch {
      setState('error')
    }
  }

  function next() {
    if (!canNext) return
    if (step < questions.length - 1) setStep(step + 1)
    else submit()
  }

  return (
    <section className={`${kind === 'program' ? 'notify' : 'activity-signup'} application-section wizard-section section-pad`}>
      <div className="wizard-heading">
        <span>{kind === 'program' ? 'SESSION 04 APPLICATION' : kind === 'community' ? 'COMMUNITY APPLICATION' : 'ACTIVITY APPLICATION'}</span>
        <strong>{selection}</strong>
      </div>
      {state === 'done' ? (
        <div className="form-success" role="status">
          <b>신청이 접수됐어요!</b>
          <span>HAKKYO에서 곧 이메일로 연락드릴게요.</span>
        </div>
      ) : (
        <div className="application-wizard">
          <div className="wizard-progress" aria-label={`질문 ${step + 1} / ${questions.length}`}>
            <div style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
            <span>{String(step + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}</span>
          </div>
          <div className={`wizard-question ${q.required ? 'is-required' : ''}`} key={q.name}>
            <span>{q.hint}</span>
            <h2>{q.label}</h2>
            {q.type === 'choice' ? (
              <div className="choice-grid">
                {q.options?.map((option, i) => (
                  <button type="button" className={value === option ? 'selected' : ''} onClick={() => setValue(option)} key={option}>
                    <b>{String.fromCharCode(65 + i)}</b>{option}
                  </button>
                ))}
              </div>
            ) : q.type === 'textarea' ? (
              <textarea autoFocus value={value} onChange={e => setValue(e.target.value)} placeholder={q.placeholder} />
            ) : (
              <input autoFocus type={q.type} value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') next() }} placeholder={q.placeholder} />
            )}
          </div>
          <div className="wizard-actions">
            {step > 0 ? (
              <button type="button" className="wizard-back" onClick={() => setStep(step - 1)}>← 이전</button>
            ) : <span />}
            <button type="button" disabled={!canNext || state === 'sending'} className="cta" data-cursor={step === questions.length - 1 ? 'SEND' : 'NEXT'} onClick={next}>
              {state === 'sending' ? '보내는 중…' : step === questions.length - 1 ? '신청서 보내기' : '다음 질문'} <Arrow />
            </button>
          </div>
          {state === 'error' && <p className="form-error" role="alert">접수 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.</p>}
          <p className="wizard-note">* 표시된 질문은 답변해야 다음으로 넘어갈 수 있어요.</p>
        </div>
      )}
    </section>
  )
}

export default function NewApply() {
  const { type, slug } = useParams<{ type?: string; slug?: string }>()

  if (type === 'news') {
    return (
      <>
        <PageTitle no="SESSION 04 · NEWS" title="4기 소식 먼저 받기" sub="Be the first to hear from HAKKYO" />
        <NewsletterForm />
      </>
    )
  }

  const program = type === 'programs' ? programs.find(p => p.en.toLowerCase().replace(/ /g, '-') === slug) : undefined
  const activity = type === 'activities' ? activities.find(a => a.slug === slug) : undefined
  const community = type === 'community'
  const item = program || activity || community

  if (!item) {
    return (
      <>
        <PageTitle no="APPLICATION" title="신청 페이지를 찾을 수 없어요" sub="Please choose a program or activity" />
        <section className="simple-cta section-pad">
          <a className="cta" href="/programs">프로그램으로 돌아가기 <Arrow /></a>
        </section>
      </>
    )
  }

  const isProgram = Boolean(program)
  const selection = community ? 'HAKKYO 커뮤니티' : program?.lang || activity?.ko || ''
  const backHref = community ? '/' : program?.href || `/activities/${activity?.slug}`

  return (
    <>
      <PageTitle
        no={community ? 'COMMUNITY · APPLICATION' : isProgram ? 'SESSION 04 · APPLICATION' : `${activity?.code} · APPLICATION`}
        title={`${selection} 신청서`}
        sub={community ? 'Meet people, share the city, and grow together' : isProgram ? `${program?.en} · ${program?.fr}` : `${activity?.en} · ${activity?.fr}`}
      />
      <section className="application-intro section-pad">
        <a href={backHref} className="text-link" data-cursor="BACK">← 상세 페이지로 돌아가기</a>
        <div>
          <Status>{community ? 'HAKKYO COMMUNITY' : isProgram ? 'PROGRAM' : 'WEDNESDAY CLUB'}</Status>
          <p>현재 선택한 항목은 <strong>{selection}</strong>입니다. 아래 신청서를 작성하면 내용을 확인한 뒤 이메일로 다음 단계를 안내해 드릴게요.</p>
        </div>
      </section>
      <ApplicationForm kind={community ? 'community' : isProgram ? 'program' : 'activity'} selection={selection} />
    </>
  )
}
