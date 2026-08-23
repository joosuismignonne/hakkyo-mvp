import { useState, useEffect } from 'react'
import { getNotices } from '../lib/db'
import type { Notice } from '../types'
import { useT, useLang } from '../lib/lang'
import type { Lang } from '../lib/lang'
import ChannelFeed from '../components/ChannelFeed'
import { Bell, Megaphone, Heart, ChatCircle, CheckCircle, ShareNetwork } from '@phosphor-icons/react'

const FALLBACK: Notice[] = [
  {
    id:'f1', date:'2026-08-05', type:'notice', is_pinned:true,
    title_ko:'4기 언어 프로그램은 10월에 시작합니다',
    title_en:'', title_fr:'',
    body_ko:'<p>HAKKYO 4기 언어 프로그램(한국어·영어·불어)은 <strong>2026년 10월</strong>부터 시작할 예정이에요.</p><p>수강료와 세부 일정은 확정되는 즉시, 소식 신청자에게 이메일로 먼저 안내드릴게요.</p>',
    body_en:'', body_fr:'',
  },
  {
    id:'f2', date:'2026-08-01', type:'event', is_pinned:false,
    title_ko:'9월, Mini HAKKYO 시리즈를 시작합니다',
    title_en:'', title_fr:'',
    body_ko:'<p>HAKKYO의 새로운 시리즈 <strong>Mini HAKKYO</strong>가 9월 수요일마다 열려요.</p><ul><li><strong>Book Club</strong> — w/ Joy · 9월 9일 · 오후 7:00–8:30</li><li><strong>Running Club</strong> — w/ Joo · 9월 16일 · 오후 6:00–7:30</li><li><strong>Boardgame Club</strong> — w/ Jaehee · 9월 23일 · 오후 7:00–8:30</li></ul><p>수업을 듣지 않아도 참여할 수 있어요. 참가비 $10.</p>',
    body_en:'', body_fr:'',
  },
  {
    id:'f3', date:'2026-07-26', type:'notice', is_pinned:false,
    title_ko:'HAKKYO 3기를 함께해 주셔서 감사합니다',
    title_en:'', title_fr:'',
    body_ko:'<p>3기 수업이 마무리됐어요. 함께해 주신 모든 분들께 진심으로 감사드립니다.</p><p>4기는 2026년 10월 시작 예정이에요.</p>',
    body_en:'', body_fr:'',
  },
]

const TYPE_TAG: Record<string, { label: string; cls: string }> = {
  notice:  { label: 'HAKKYO', cls: '' },
  event:   { label: 'EVENT',  cls: 'feed-tag-event' },
  hiring:  { label: 'COMMUNITY', cls: '' },
}

function fmtDate(d: string, lang: Lang) {
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  if (lang === 'en') return `${dt.toLocaleString('en', { month: 'short' })} ${dt.getDate()}`
  if (lang === 'fr') return `${dt.getDate()} ${dt.toLocaleString('fr', { month: 'short' })}`
  return `${dt.getMonth()+1}월 ${dt.getDate()}일`
}

function strip(html: string) {
  return html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()
}

function NoticeCard({ n, lang }: { n: Notice; lang: Lang }) {
  const [open, setOpen] = useState(false)
  const [liked, setLiked] = useState(false)
  const [shared, setShared] = useState(false)
  const tag = TYPE_TAG[n.type] ?? TYPE_TAG.notice
  const body = lang === 'en' ? (n.body_en || n.body_ko) : lang === 'fr' ? (n.body_fr || n.body_ko) : n.body_ko
  const title = lang === 'en' ? (n.title_en || n.title_ko) : lang === 'fr' ? (n.title_fr || n.title_ko) : n.title_ko
  const preview = strip(body || '').slice(0, 200)
  const hasMore = strip(body || '').length > 200
  const hasBody = !!body
  const hasMedia = /<img|<iframe/.test(body || '')

  function handleShare() {
    const url = `${window.location.origin}/board?notice=${n.id}`
    if (navigator.share) {
      navigator.share({ url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => {
        const t = document.createElement('div')
        t.textContent = '링크 복사됨'
        t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#11110f;color:#fff;padding:8px 18px;border-radius:99px;font-size:13px;z-index:9999;pointer-events:none'
        document.body.appendChild(t)
        setTimeout(() => t.remove(), 2000)
      })
    }
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  return (
    <div className={`feed-card${n.is_pinned ? ' feed-card-pinned' : ''}`}>
      {n.is_pinned && (
        <div className="feed-pin-bar">
          <span className="feed-pin-dot" />
          공지
        </div>
      )}
      <div className="feed-card-inner">
        <div className="feed-meta">
          <div className="post-avatar" style={{ width:36, height:36, background:'#f5c542', fontWeight:800, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%', flexShrink:0 }}>H</div>
          <div className="feed-meta-text">
            <span className="feed-author">HAKKYO</span>
            <span className="feed-time">{fmtDate(n.date, lang)}</span>
          </div>
          <span className={`feed-tag ${tag.cls}`}>{tag.label}</span>
        </div>

        <div className="feed-title" onClick={() => hasBody && setOpen(o => !o)}
          style={{ cursor: hasBody ? 'pointer' : 'default' }}>
          {title}
        </div>

        {!open && (
          <div className="feed-body">
            {hasMedia
              ? <div dangerouslySetInnerHTML={{ __html: body || '' }} />
              : <p>{preview}{hasMore ? '…' : ''}</p>
            }
          </div>
        )}
        {open && body && (
          <div className="feed-body post-rich-body" dangerouslySetInnerHTML={{ __html: body }} />
        )}

        <div className="feed-footer">
          <button className={`feed-action${liked ? ' liked' : ''}`} onClick={() => setLiked(l => !l)}>
            <Heart size={13} weight={liked ? 'fill' : 'regular'} color={liked ? '#e53e3e' : undefined} style={{marginRight:3}} /> 좋아요
          </button>
          {(hasMore || hasMedia) && (
            <button className="feed-action" onClick={() => setOpen(o => !o)}>
              <ChatCircle size={13} weight="bold" style={{marginRight:3}} /> {open ? '접기' : '더 보기'}
            </button>
          )}
          <button className={`feed-action${shared ? ' shared' : ''}`} onClick={handleShare}>
            {shared ? <CheckCircle size={13} weight="bold" style={{marginRight:3}} /> : <ShareNetwork size={13} weight="bold" style={{marginRight:3}} />} 공유
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NewBoard() {
  const [notices, setNotices] = useState<Notice[]>(FALLBACK)
  const t = useT()
  const { lang } = useLang()

  useEffect(() => {
    getNotices()
      .then(data => { if (data.length) setNotices(data) })
      .catch(() => {})
  }, [])

  const pinned = notices.filter(n => n.is_pinned)
  const rest = notices.filter(n => !n.is_pinned)

  const header = (
    <div className="ch-header">
      <span className="ch-header-icon"><Megaphone size={20} weight="bold" /></span>
      <div className="ch-header-text">
        <h1 className="ch-header-title">{t.board.title}</h1>
        <span className="ch-header-desc">{t.board.desc}</span>
      </div>
      <div className="ch-header-right">
        <a href="/apply/news" className="ch-header-action">
          <Bell size={13} weight="bold" style={{marginRight:4}} />{t.footer.subscribe}
        </a>
      </div>
    </div>
  )

  return (
    <ChannelFeed channel="board" header={header}>
      {/* Legacy notices from Supabase notices table — shown below channel_posts */}
      {pinned.length > 0 && (
        <div className="feed-divider">이전 공지</div>
      )}
      {pinned.map(n => <NoticeCard key={n.id} n={n} lang={lang} />)}
      {rest.length > 0 && pinned.length > 0 && (
        <div className="feed-divider">과거 소식</div>
      )}
      {rest.map(n => <NoticeCard key={n.id} n={n} lang={lang} />)}
    </ChannelFeed>
  )
}
