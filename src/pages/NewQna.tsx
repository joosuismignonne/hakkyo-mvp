import { useState, useEffect } from 'react'
import { Arrow } from '../components/HakkyoStatus'
import { faqs as STATIC_FAQS } from '../data/hakkyo'
import { submitChatMessage } from '../lib/hakkyoApi'
import { trackEvent } from '../lib/analytics'
import { supabase } from '../lib/supabase'

function PageTitle({ no, title, sub }: { no: string; title: string; sub: string }) {
  return (
    <section className="page-title section-pad">
      <span>{no}</span><h1>{title}</h1><p>{sub}</p>
    </section>
  )
}

type ChatMsg = { role: 'bot' | 'user'; text: string }

const INITIAL: ChatMsg[] = [
  { role: 'bot', text: '안녕하세요 👋 HAKKYO입니다. 궁금한 점을 편하게 남겨주세요. 이름과 이메일을 함께 알려주시면 직접 연락드릴게요.' },
]

const PROMPTS = [
  '프로그램 신청이 궁금해요',
  '수업 레벨이 맞는지 모르겠어요',
  '수요일 액티비티 참여 방법이 궁금해요',
  '다른 질문이 있어요',
]

export default function NewQna() {
  const [faqs, setFaqs] = useState<[string, string][]>(STATIC_FAQS as [string, string][])
  const [active, setActive] = useState<number | null>(0)

  useEffect(() => {
    if (!supabase) return
    supabase.from('site_content').select('value_ko').eq('page', 'home').eq('key', 'faqs').single()
      .then(({ data }) => {
        if (data?.value_ko) {
          try { setFaqs(JSON.parse(data.value_ko)) } catch {}
        }
      })
  }, [])
  const [messages, setMessages] = useState<ChatMsg[]>(INITIAL)
  const [input, setInput] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'chat' | 'contact' | 'done'>('chat')
  const [sending, setSending] = useState(false)

  function addBot(text: string) {
    setMessages(prev => [...prev, { role: 'bot', text }])
  }

  function addUser(text: string) {
    setMessages(prev => [...prev, { role: 'user', text }])
  }

  function handlePrompt(text: string) {
    addUser(text)
    setTimeout(() => {
      addBot('감사해요! 조금 더 자세히 알려주시면 더 잘 도와드릴 수 있어요. 이름과 이메일을 알려주시겠어요?')
      setStep('contact')
    }, 600)
  }

  function handleSend() {
    if (!input.trim()) return
    addUser(input)
    setInput('')
    setTimeout(() => {
      addBot('네, 잘 받았어요! 이름과 이메일을 알려주시면 직접 연락드릴게요.')
      setStep('contact')
    }, 600)
  }

  async function handleContact(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email) return
    setSending(true)
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    try {
      await submitChatMessage({ name, email, message: lastUserMsg?.text || '문의' })
      trackEvent({ eventName: 'chat_message_submitted', targetType: 'form', targetLabel: 'qna' })
      addUser(`${name} / ${email}`)
      setTimeout(() => {
        addBot('감사해요! 빠른 시일 내에 이메일로 연락드릴게요. 그 전에 자주 묻는 질문도 아래서 확인해보세요.')
        setStep('done')
        setSending(false)
      }, 600)
    } catch {
      addBot('앗, 전송 중 오류가 생겼어요. 잠시 후 다시 시도해 주세요.')
      setSending(false)
    }
  }

  return (
    <>
      <PageTitle no="06 — Q&amp;A" title="궁금한 것을 물어보세요" sub="Frequently asked questions" />

      <section className="faq section-pad">
        {faqs.map((x, i) => (
          <article key={x[0]}>
            <button onClick={() => setActive(active === i ? null : i)}>
              <span>0{i + 1}</span>
              <h2>{x[0]}</h2>
              <b>{active === i ? '−' : '+'}</b>
            </button>
            {active === i && <p>{x[1]}</p>}
          </article>
        ))}
      </section>

      <section className="chatbot-section section-pad">
        <span style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700 }}>HAKKYO CHAT</span>
        <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', letterSpacing: '-.045em', margin: '16px 0' }}>
          직접 물어보세요.
        </h2>
        <p style={{ maxWidth: 540, lineHeight: 1.7, color: 'var(--muted)' }}>
          FAQ에 없는 질문이 있거나, 내 상황에 맞는 이야기를 나누고 싶다면 아래 채팅으로 남겨주세요.
        </p>

        <div className="chat-window">
          <div className="chat-messages" id="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.role}`}>{m.text}</div>
            ))}
            {step === 'chat' && messages.length === 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => handlePrompt(p)}
                    style={{ border: '1px solid var(--ink)', borderRadius: 999, background: '#fff', padding: '9px 14px', fontSize: 13, cursor: 'pointer' }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            {step === 'contact' && (
              <form onSubmit={handleContact} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 18, padding: '20px 18px', display: 'grid', gap: 14, marginTop: 8 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, fontWeight: 700 }}>
                  이름
                  <input required value={name} onChange={e => setName(e.target.value)} placeholder="이름을 알려주세요" style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px', fontSize: 14, outline: 'none' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, fontWeight: 700 }}>
                  이메일
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px', fontSize: 14, outline: 'none' }} />
                </label>
                <button className="cta" disabled={sending} style={{ justifySelf: 'start' }}>
                  {sending ? '보내는 중…' : '전송하기'} <Arrow />
                </button>
              </form>
            )}
          </div>
          {step === 'chat' && (
            <div className="chat-input-row">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
                placeholder="메시지를 입력하세요..."
              />
              <button onClick={handleSend}>보내기</button>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
