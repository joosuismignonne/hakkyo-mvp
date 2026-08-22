import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Arrow } from '../components/HakkyoStatus'
import { supabase } from '../lib/supabase'
import { programs, activities } from '../data/hakkyo'
import { submitApplication, ApplicationPayload } from '../lib/hakkyoApi'
import { trackEvent } from '../lib/analytics'
import { notifyNewsletterSubscription, notifyActivityApplication, notifyProgramApplication } from '../lib/discord'
import { useLang } from '../lib/lang'

const APPLY_UI = {
  ko: { next: '다음', prev: '← 이전', back: '← 돌아가기', send: '신청서 보내기', sending: '보내는 중…', required: '* 표시된 질문은 필수예요.', done_title: '신청이 접수됐어요!', done_body: 'HAKKYO에서 곧 이메일로 연락드릴게요.', home: '← 홈으로', goBack: '← 돌아가기', error: '접수 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.' },
  en: { next: 'Next', prev: '← Back', back: '← Back', send: 'Submit', sending: 'Sending…', required: '* Required fields.', done_title: 'Application received!', done_body: "We'll be in touch by email soon.", home: '← Home', goBack: '← Go back', error: 'Something went wrong. Please try again.' },
  fr: { next: 'Suivant', prev: '← Retour', back: '← Retour', send: 'Envoyer', sending: 'Envoi…', required: '* Champs requis.', done_title: 'Candidature reçue !', done_body: 'Nous vous contacterons bientôt par courriel.', home: '← Accueil', goBack: '← Retour', error: 'Une erreur est survenue. Veuillez réessayer.' },
}

function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(false)
    setLoading(true)
    try {
      await submitApplication({ kind: 'newsletter', selection: 'SESSION 04 NEWS', email })
      trackEvent({ eventName: 'newsletter_submitted', targetType: 'form', targetLabel: 'apply-page' })
      notifyNewsletterSubscription({ email })
      setDone(true)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ch-feed">
      <div className="ch-header">
        <span className="ch-header-icon">🔔</span>
        <h1 className="ch-header-title">소식 신청</h1>
        <span className="ch-header-desc">SESSION 04 · NEWS</span>
      </div>
      <div className="ch-scroll">
        <div className="ch-inner">

          {/* Hero card */}
          <div className="feed-card">
            <div className="feed-card-inner">
              <div className="feed-meta">
                <div className="feed-avatar" style={{ background:'#f5c542' }}>H</div>
                <span className="feed-author">HAKKYO</span>
                <span className="feed-tag feed-tag-program">PROGRAM</span>
                <span className="feed-time">2026 FALL</span>
              </div>
              <div className="feed-title">4기 소식 먼저 받기</div>
              <div className="feed-body">
                <p>4기 언어 프로그램 모집이 시작되면 이메일로 가장 먼저 알려드려요. 수강료와 세부 일정이 확정되는 즉시 소식 신청자에게만 먼저 공유해요.</p>
              </div>
            </div>
          </div>

          {/* Form card */}
          {done ? (
            <div className="feed-card">
              <div className="feed-card-inner">
                <div className="feed-meta">
                  <div className="feed-avatar" style={{ background:'#4caf50', fontSize:16 }}>✓</div>
                  <span className="feed-author">신청 완료</span>
                </div>
                <div className="feed-title">신청됐어요!</div>
                <div className="feed-body"><p>곧 이메일로 만나요. HAKKYO에서 소식이 생기면 가장 먼저 알려드릴게요.</p></div>
                <div className="feed-footer">
                  <button className="feed-action" onClick={() => window.location.href='/'}>← 홈으로</button>
                  <button className="feed-action" onClick={() => window.location.href='/programs'}>📚 프로그램 보기</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="feed-card">
              <div className="feed-card-inner">
                <div className="feed-meta">
                  <div className="feed-avatar" style={{ background:'#111', color:'#f5c542', fontSize:14 }}>🐱</div>
                  <span className="feed-author">MINI</span>
                  <span className="feed-tag">이메일로 소식 받기</span>
                </div>
                <div className="feed-title" style={{ marginBottom: 14 }}>이메일 주소를 알려주세요</div>
                <form onSubmit={submit} style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                  <input
                    type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    style={{
                      flex: 1, minWidth: 200,
                      border: '1px solid #e0e0d8', borderRadius: 10,
                      padding: '10px 14px', fontSize: 14, outline: 'none',
                      fontFamily: 'inherit',
                      transition: 'border-color .2s, box-shadow .2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#111'; e.target.style.boxShadow = '0 0 0 3px rgba(17,17,15,.08)' }}
                    onBlur={e => { e.target.style.borderColor = '#e0e0d8'; e.target.style.boxShadow = 'none' }}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      background: '#111', color: '#fff', border: 'none',
                      borderRadius: 10, padding: '10px 20px',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'inherit', opacity: loading ? .6 : 1,
                      display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'background .18s',
                    }}
                  >
                    {loading ? '신청 중…' : '소식 신청하기'} {!loading && <Arrow />}
                  </button>
                </form>
                {error && <p style={{ color:'#c0392b', fontSize:13, marginTop:10 }}>잠시 후 다시 시도해 주세요.</p>}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

interface Question {
  name: string
  label: string
  label_en?: string
  label_fr?: string
  hint: string
  type: string
  placeholder?: string
  required?: boolean
  options?: string[]
}

const DEFAULT_ACTIVITY_QUESTIONS: Question[] = [
  { name:'experience', label:'이 액티비티를 해본 경험이 있나요?',     label_en:'Have you done this activity before?',            label_fr:'Avez-vous déjà participé à cette activité ?',      hint:'Experience',                      type:'choice',   options:['처음이에요','한두 번 해봤어요','가끔 즐겨요','자주 하고 있어요'], required:true },
  { name:'joinReason', label:'이번 액티비티에 함께하고 싶은 이유는?', label_en:'Why do you want to join this activity?',         label_fr:'Pourquoi souhaitez-vous rejoindre cette activité ?', hint:'Why join?',                       type:'textarea', placeholder:'기대하는 점이나 만나고 싶은 사람들을 편하게 적어주세요', required:true },
  { name:'comfort',    label:'미리 알아두면 좋은 점이 있나요?',       label_en:'Anything we should know in advance? (optional)', label_fr:"Quelque chose à savoir à l'avance ? (facultatif)",  hint:'Anything we should know? · 선택', type:'textarea', placeholder:'속도, 알레르기, 이동 관련 사항 등' },
]

function useActivityQuestions(lang: string): Question[] {
  const [qs, setQs] = useState<Question[]>(DEFAULT_ACTIVITY_QUESTIONS)
  useEffect(() => {
    if (!supabase) return
    supabase.from('site_content').select('key,value_ko,value_en,value_fr').eq('page', 'activity_questions').then(({ data }) => {
      if (!data?.length) return
      type AqRow = { key: string; value_ko: string; value_en: string; value_fr: string }
      const pick = (row: AqRow | undefined) => row ? (lang === 'en' ? row.value_en : lang === 'fr' ? row.value_fr : row.value_ko) || row.value_ko || '' : ''
      const getKo = (k: string) => data.find((r: AqRow) => r.key === k)?.value_ko || ''
      const getL  = (k: string) => pick(data.find((r: AqRow) => r.key === k))
      const countStr = getKo('aq_count')
      const count = countStr ? parseInt(countStr) : DEFAULT_ACTIVITY_QUESTIONS.length
      const loaded: Question[] = Array.from({ length: count }, (_, i) => {
        const key = `aq${i + 1}`
        const def = DEFAULT_ACTIVITY_QUESTIONS[i]
        const label   = getL(`${key}_label`)   || (lang === 'en' ? def?.label_en : lang === 'fr' ? def?.label_fr : def?.label) || def?.label || ''
        const hint    = getKo(`${key}_hint`)   || def?.hint    || ''
        const type    = getKo(`${key}_type`)   || def?.type    || 'textarea'
        const reqStr  = getKo(`${key}_required`)
        const required = reqStr === 'false' ? false : (def?.required ?? true)
        const optStr  = getKo(`${key}_options`)
        const options = optStr ? optStr.split(',').map((s: string) => s.trim()).filter(Boolean) : def?.options
        return { name: key, label, hint, type, options, required }
      })
      if (loaded.length) setQs(loaded)
    })
  }, [lang])
  return qs
}

const DEFAULT_PROGRAM_QUESTIONS_APPLY: Question[] = [
  { name:'pq1', label:'현재 언어 실력은 어느 정도인가요?',         hint:'Language level',       type:'choice',   options:['처음 시작해요','기초 표현을 조금 알아요','간단한 대화가 가능해요','일상 대화가 가능해요','잘 모르겠어요'], required:true },
  { name:'pq2', label:'지금까지 이 언어를 어떻게 공부해 왔나요?',  hint:'Learning experience',  type:'textarea', required:true },
  { name:'pq3', label:'이 언어로 말할 때 가장 어려운 점은?',       hint:'Speaking barrier',     type:'choice',   options:['표현이 바로 떠오르지 않아요','발음이 걱정돼요','문법이 틀릴까 봐 망설여요','상대가 못 알아들을까 걱정돼요','말할 기회가 부족해요','그 외'], required:true },
  { name:'pq4', label:'이번 프로그램을 통해 이루고 싶은 것은?',    hint:'Your goal',            type:'textarea', required:true },
  { name:'pq5', label:'수업에서 어떤 활동을 가장 해보고 싶나요?',  hint:'Preferred class style', type:'choice',  options:['생활 표현 배우기','1:1 대화 연습','그룹 대화·게임','발음 교정','쓰기와 피드백','골고루 해보고 싶어요'], required:true },
]

const DEFAULT_SCHEDULING_QUESTIONS_APPLY: Question[] = [
  { name:'sq1', label:'참여 가능한 요일과 시간대를 알려주세요.',       hint:'Availability',   type:'textarea', required:true },
  { name:'sq2', label:'몬트리올에서 참여하기 편한 지역은 어디인가요?', hint:'Preferred area', type:'text',     required:true },
]

function useProgramQuestions(): { pqs: Question[]; sqs: Question[] } {
  const [pqs, setPqs] = useState<Question[]>(DEFAULT_PROGRAM_QUESTIONS_APPLY)
  const [sqs, setSqs] = useState<Question[]>(DEFAULT_SCHEDULING_QUESTIONS_APPLY)
  useEffect(() => {
    if (!supabase) return
    supabase.from('site_content').select('key,value_ko').eq('page', 'program_questions').then(({ data }) => {
      if (!data?.length) return
      const get = (k: string) => data.find(r => r.key === k)?.value_ko || ''
      const loadGroup = (prefix: string, count: number, defaults: Question[]): Question[] =>
        Array.from({ length: count }, (_, i) => {
          const key = `${prefix}${i + 1}`
          const def = defaults[i]
          const label   = get(`${key}_label`)   || def?.label   || ''
          const hint    = get(`${key}_hint`)    || def?.hint    || ''
          const type    = get(`${key}_type`)    || def?.type    || 'textarea'
          const required = get(`${key}_required`) === 'false' ? false : (def?.required ?? true)
          const optStr  = get(`${key}_options`)
          const options = optStr ? optStr.split(',').map((s: string) => s.trim()).filter(Boolean) : def?.options
          return { name: key, label, hint, type, options, required }
        })
      const pCount = parseInt(get('pq_count') || String(DEFAULT_PROGRAM_QUESTIONS_APPLY.length))
      const sCount = parseInt(get('sq_count') || String(DEFAULT_SCHEDULING_QUESTIONS_APPLY.length))
      setPqs(loadGroup('pq', pCount, DEFAULT_PROGRAM_QUESTIONS_APPLY))
      setSqs(loadGroup('sq', sCount, DEFAULT_SCHEDULING_QUESTIONS_APPLY))
    })
  }, [])
  return { pqs, sqs }
}

function ApplicationForm({ kind, selection, trackSlug, backHref }: { kind: 'program' | 'activity' | 'community'; selection: string; trackSlug?: string; backHref: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const { lang } = useLang()
  const ui = APPLY_UI[lang as keyof typeof APPLY_UI] ?? APPLY_UI.ko
  const dynamicActivityQuestions = useActivityQuestions(lang)
  const { pqs: dynamicProgramQuestions, sqs: dynamicSchedulingQuestions } = useProgramQuestions()

  const lq = <T extends string>(ko: T, en: string, fr: string): string =>
    lang === 'en' ? en : lang === 'fr' ? fr : ko
  const lp = (ko: string, en: string, fr: string): string =>
    lang === 'en' ? en : lang === 'fr' ? fr : ko

  const commonQuestions: Question[] = [
    { name:'name',           label: lq('이름을 알려주세요.','What\'s your name?','Quel est votre prénom ?'),                                                         hint:'Name',             type:'text',  placeholder: lp('이름을 적어주세요','Enter your name','Votre prénom'),        required:true },
    { name:'email',          label: lq('연락받을 이메일은 무엇인가요?','What email can we reach you at?','Quelle est votre adresse e-mail ?'),                         hint:'Email',            type:'email', placeholder:'email@example.com',                                              required:true },
    { name:'phone',          label: lq('전화번호를 알려주세요.','Phone number (optional)','Numéro de téléphone (facultatif)'),                                         hint:'Phone · 선택',     type:'tel',   placeholder:'514-000-0000' },
    { name:'instagram',      label: lq('인스타그램 계정이 있나요?','Instagram handle (optional)','Compte Instagram (facultatif)'),                                     hint:'Instagram · 선택', type:'text',  placeholder:'@username' },
    { name:'city',           label: lq('현재 어느 도시에 거주하고 있나요?','What city do you currently live in?','Dans quelle ville habitez-vous ?'),                    hint:'Current city',     type:'text',  placeholder:'Montréal',                                                       required:true },
    { name:'timeInMontreal', label: lq('몬트리올에 온 지 얼마나 되었나요?','How long have you been in Montréal?','Depuis combien de temps êtes-vous à Montréal ?'),     hint:'Time in Montréal', type:'choice',
      options: lang === 'en'
        ? ['Not yet arrived','Less than 3 months','3–6 months','6 months–1 year','1–3 years','3+ years']
        : lang === 'fr'
        ? ['Pas encore arrivé·e','Moins de 3 mois','3–6 mois','6 mois–1 an','1–3 ans','3 ans et plus']
        : ['아직 오기 전이에요','3개월 미만','3–6개월','6개월–1년','1–3년','3년 이상'],
      required:true },
    { name:'currentStage',   label: lq('현재 몬트리올에서 어떤 시간을 보내고 있나요?','What brings you to Montréal?','Qu\'est-ce qui vous amène à Montréal ?'),        hint:'Your current stage', type:'choice',
      options: lang === 'en'
        ? ['Student','Working Holiday','Working','Immigrating / Settling','Travelling / Short stay','Other']
        : lang === 'fr'
        ? ['Étudiant·e','Vacances-travail','Emploi','Immigration / Installation','Voyage / Court séjour','Autre']
        : ['유학 중','워킹홀리데이 중','직장 생활 중','이민·정착 중','여행·단기 체류 중','그 외'],
      required:true },
  ]
  const programQuestions: Question[] = dynamicProgramQuestions
  const activityQuestions = dynamicActivityQuestions
  const communityQuestions: Question[] = [
    { name:'joinReason', label: lq('HAKKYO 커뮤니티와 함께하고 싶은 이유는?','Why do you want to join the HAKKYO community?','Pourquoi souhaitez-vous rejoindre la communauté HAKKYO ?'),
      hint:'Why join?', type:'textarea',
      placeholder: lp('배우고 싶은 것, 만나고 싶은 사람, 함께 나누고 싶은 이야기를 적어주세요','What you want to learn, who you want to meet, what you want to share','Ce que vous souhaitez apprendre, rencontrer ou partager'),
      required:true },
    { name:'interests', label: lq('어떤 모임과 소식에 관심이 있나요?','What events and news are you interested in?','Quels événements et actualités vous intéressent ?'),
      hint:'Your interests', type:'choice',
      options: lang === 'en'
        ? ['Language Exchange & Classes','Wednesday Activities','Montréal Settlement Info','New Friends & Community','All of the above']
        : lang === 'fr'
        ? ['Échange linguistique et cours','Activités du mercredi','Infos installation à Montréal','Nouveaux amis et communauté','Tout cela']
        : ['언어 교환과 클래스','수요일 액티비티','몬트리올 정착 정보','새로운 친구와 커뮤니티','모두 궁금해요'],
      required:true },
    { name:'language', label: lq('편하게 이야기할 수 있는 언어를 알려주세요.','Which languages are you comfortable speaking?','Quelles langues parlez-vous à l\'aise ?'),
      hint:'Languages', type:'text', placeholder:'예: 한국어, English, Français', required:true },
  ]
  const schedulingQuestions: Question[] = dynamicSchedulingQuestions
  const closingQuestions: Question[] = [
    { name:'discovery', label: lq('HAKKYO를 어떻게 알게 되었나요?','How did you hear about HAKKYO?','Comment avez-vous connu HAKKYO ?'),
      hint:'How did you hear about us?', type:'choice',
      options:['Instagram','네이버 카페','한카','친구·지인 추천','Google 검색','HAKKYO 수업·행사','기타'],
      required:true },
    { name:'message', label: lq('마지막으로 HAKKYO에 전하고 싶은 말이 있나요?','Anything else you\'d like to tell us? (optional)','Autre chose à nous dire ? (facultatif)'),
      hint:'Final message · 선택', type:'textarea',
      placeholder: lp('궁금한 점이나 함께 나누고 싶은 이야기를 적어주세요','Any questions or things you\'d like to share','Des questions ou quelque chose à partager') },
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
      trackEvent({ eventName: 'application_submitted', targetType: kind, targetLabel: trackSlug ?? selection })
      const name  = (answers['name']  || answers['이름'] || '(미입력)') as string
      const email = (answers['email'] || answers['이메일'] || '(미입력)') as string
      if (kind === 'program') {
        notifyProgramApplication({ name, email, track: selection })
      } else if (kind === 'activity') {
        notifyActivityApplication({ name, email, activity: selection })
      }
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
    <div className="ch-feed">
      <div className="ch-header">
        <span className="ch-header-icon">✏️</span>
        <h1 className="ch-header-title">{selection} 신청</h1>
        <span className="ch-header-desc">
          {kind === 'program' ? 'SESSION 04 APPLICATION' : kind === 'community' ? 'COMMUNITY APPLICATION' : 'ACTIVITY APPLICATION'}
        </span>
      </div>
      <div className="ch-scroll">
        <div className="ch-inner">

          {state === 'done' ? (
            <div className="feed-card">
              <div className="feed-card-inner">
                <div className="feed-meta">
                  <div className="feed-avatar" style={{ background:'#4caf50', fontSize:16 }}>✓</div>
                  <span className="feed-author">{lang === 'fr' ? 'Envoyé' : lang === 'en' ? 'Submitted' : '신청 완료'}</span>
                </div>
                <div className="feed-title">{ui.done_title}</div>
                <div className="feed-body"><p>{ui.done_body}</p></div>
                <div className="feed-footer">
                  <button className="feed-action" onClick={() => window.location.href='/'}>{ui.home}</button>
                  <button className="feed-action" onClick={() => window.location.href=backHref}>{ui.goBack}</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="feed-card apply-wizard-card">
              <div className="feed-card-inner">

                {/* Progress */}
                <div className="apply-progress">
                  <div className="apply-progress-bar" style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
                  <span className="apply-progress-label">{step + 1} / {questions.length}</span>
                </div>

                {/* Question */}
                <div className="apply-question" key={q.name}>
                  <div className="apply-question-hint">{q.hint}{q.required ? ' *' : ''}</div>
                  <div className="apply-question-label">{q.label}</div>

                  {q.type === 'choice' ? (
                    <div className="apply-choice-grid">
                      {q.options?.map((option, i) => (
                        <button
                          key={option}
                          type="button"
                          className={`apply-choice-btn${value === option ? ' selected' : ''}`}
                          onClick={() => setValue(option)}
                        >
                          <span className="apply-choice-letter">{String.fromCharCode(65 + i)}</span>
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : q.type === 'textarea' ? (
                    <textarea
                      autoFocus value={value}
                      onChange={e => setValue(e.target.value)}
                      placeholder={q.placeholder}
                      className="apply-input"
                      rows={4}
                    />
                  ) : (
                    <input
                      autoFocus type={q.type} value={value}
                      onChange={e => setValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') next() }}
                      placeholder={q.placeholder}
                      className="apply-input"
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="apply-actions">
                  {step > 0
                    ? <button type="button" className="feed-action" onClick={() => setStep(step - 1)}>{ui.prev}</button>
                    : <a href={backHref} className="feed-action" style={{ textDecoration:'none' }}>{ui.back}</a>
                  }
                  <button
                    type="button"
                    disabled={!canNext || state === 'sending'}
                    className="apply-next-btn"
                    onClick={next}
                  >
                    {state === 'sending' ? ui.sending : step === questions.length - 1 ? ui.send : ui.next} <Arrow />
                  </button>
                </div>

                {state === 'error' && (
                  <p style={{ color:'#c0392b', fontSize:13, marginTop:8 }}>
                    {ui.error}
                  </p>
                )}
                <p className="apply-note">{ui.required}</p>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function NewApply() {
  const { type, slug } = useParams<{ type?: string; slug?: string }>()

  if (type === 'news') {
    return <NewsletterForm />
  }

  const program = type === 'programs' ? programs.find(p => p.en.toLowerCase().replace(/ /g, '-') === slug) : undefined
  const activity = type === 'activities' ? activities.find(a => a.slug === slug) : undefined
  const community = type === 'community'
  const item = program || activity || community

  if (!item) {
    return (
      <div className="ch-feed">
        <div className="ch-header">
          <span className="ch-header-icon">✏️</span>
          <h1 className="ch-header-title">신청</h1>
        </div>
        <div className="ch-scroll">
          <div className="ch-inner">
            <div className="feed-card">
              <div className="feed-card-inner">
                <div className="feed-title">신청 페이지를 찾을 수 없어요</div>
                <div className="feed-body"><p>프로그램이나 액티비티를 선택해 주세요.</p></div>
                <div className="feed-footer">
                  <button className="feed-action" onClick={() => window.location.href='/programs'}>📚 프로그램 보기</button>
                  <button className="feed-action" onClick={() => window.location.href='/activities'}>🐱 Mini HAKKYO 보기</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const selection = community ? 'HAKKYO 커뮤니티' : program?.lang || activity?.ko || ''
  const trackSlug = community ? 'community' : activity?.slug ?? program?.en.toLowerCase().replace(/ /g, '-') ?? slug
  const backHref = community ? '/' : program?.href || `/activities/${activity?.slug}`

  return (
    <ApplicationForm
      kind={community ? 'community' : program ? 'program' : 'activity'}
      selection={selection}
      trackSlug={trackSlug}
      backHref={backHref}
    />
  )
}
