import { useEffect, useRef, useState } from 'react'
import { useLang } from '../lib/lang'

// Replace with your Discord webhook URL
const DISCORD_WEBHOOK_URL = import.meta.env.VITE_DISCORD_WEBHOOK_URL || ''

const PAGE_THRESHOLD = 3  // show after this many page navigations without converting

const COPY = {
  ko: {
    bubble: '궁금한 점이 있으신가요?',
    title: 'JOO에게 메세지 남기기',
    body: '궁금한 점이 있으시면 메세지를 남겨주세요.\nJOO가 확인 후 답변드릴게요! 🐱',
    emailPlaceholder: '이메일 주소',
    msgPlaceholder: '메세지를 입력하세요…',
    send: '보내기',
    sending: '전송 중…',
    success: '메세지를 보냈어요! 곧 답변드릴게요 🐱',
    error: '전송에 실패했어요. 다시 시도해주세요.',
    emailRequired: '이메일을 입력해주세요.',
    msgRequired: '메세지를 입력해주세요.',
  },
  en: {
    bubble: 'Any questions?',
    title: 'Leave JOO a message',
    body: 'Have a question? Leave us a message and\nJOO will get back to you soon! 🐱',
    emailPlaceholder: 'Email address',
    msgPlaceholder: 'Type your message…',
    send: 'Send',
    sending: 'Sending…',
    success: 'Message sent! We\'ll reply soon 🐱',
    error: 'Failed to send. Please try again.',
    emailRequired: 'Please enter your email.',
    msgRequired: 'Please enter a message.',
  },
  fr: {
    bubble: 'Des questions ?',
    title: 'Envoyer un message à JOO',
    body: 'Une question ? Laissez un message et\nJOO vous répondra bientôt ! 🐱',
    emailPlaceholder: 'Adresse e-mail',
    msgPlaceholder: 'Votre message…',
    send: 'Envoyer',
    sending: 'Envoi…',
    success: 'Message envoyé ! On vous répond bientôt 🐱',
    error: 'Échec de l\'envoi. Veuillez réessayer.',
    emailRequired: 'Veuillez saisir votre e-mail.',
    msgRequired: 'Veuillez saisir un message.',
  },
} as const

const NAV_KEY = 'hakkyo_nav_count'
const DISMISSED_KEY = 'hakkyo_chat_dismissed'

function getNavCount() { return parseInt(sessionStorage.getItem(NAV_KEY) || '0') }
function incNavCount() { sessionStorage.setItem(NAV_KEY, String(getNavCount() + 1)) }
function isDismissed() { return sessionStorage.getItem(DISMISSED_KEY) === '1' }
function setDismissed() { sessionStorage.setItem(DISMISSED_KEY, '1') }

export default function ChatWidget() {
  const { lang } = useLang()
  const t = COPY[lang as keyof typeof COPY] ?? COPY.ko
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [fieldErr, setFieldErr] = useState('')
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    incNavCount()
    if (getNavCount() >= PAGE_THRESHOLD && !isDismissed()) {
      const timer = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  function dismiss() {
    setDismissed()
    setVisible(false)
    setOpen(false)
  }

  async function handleSend() {
    setFieldErr('')
    if (!email.trim()) { setFieldErr(t.emailRequired); emailRef.current?.focus(); return }
    if (!msg.trim()) { setFieldErr(t.msgRequired); return }
    setStatus('sending')
    try {
      const payload = {
        embeds: [{
          title: '💬 HAKKYO 문의',
          color: 0x6C63FF,
          fields: [
            { name: '이메일', value: email.trim(), inline: true },
            { name: '언어', value: lang.toUpperCase(), inline: true },
            { name: '메세지', value: msg.trim() },
          ],
          timestamp: new Date().toISOString(),
        }],
      }
      if (!DISCORD_WEBHOOK_URL) throw new Error('No webhook URL')
      const res = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Webhook failed')
      setStatus('success')
      setDismissed()
    } catch {
      setStatus('error')
    }
  }

  if (!visible) return null

  return (
    <div className="chat-widget-root">
      {!open && (
        <button className="chat-bubble-btn" onClick={() => setOpen(true)} aria-label={t.bubble}>
          <span className="chat-bubble-icon">🐱</span>
          <span className="chat-bubble-text">{t.bubble}</span>
        </button>
      )}

      {open && (
        <div className="chat-panel">
          <div className="chat-panel-header">
            <span className="chat-panel-title">{t.title}</span>
            <button className="chat-panel-close" onClick={dismiss} aria-label="Close">✕</button>
          </div>

          {status === 'success' ? (
            <div className="chat-panel-success">{t.success}</div>
          ) : (
            <div className="chat-panel-body">
              <p className="chat-panel-desc">{t.body}</p>
              <input
                ref={emailRef}
                className="chat-input"
                type="email"
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={status === 'sending'}
              />
              <textarea
                className="chat-input chat-textarea"
                placeholder={t.msgPlaceholder}
                value={msg}
                onChange={e => setMsg(e.target.value)}
                disabled={status === 'sending'}
                rows={4}
              />
              {fieldErr && <p className="chat-field-err">{fieldErr}</p>}
              {status === 'error' && <p className="chat-field-err">{t.error}</p>}
              <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={status === 'sending'}
              >
                {status === 'sending' ? t.sending : t.send}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
