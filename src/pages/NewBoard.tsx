import { useState, useEffect } from 'react'
import { getNotices } from '../lib/db'
import type { Notice } from '../types'

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
  {
    id:'f4', date:'2026-05-10', type:'notice', is_pinned:false,
    title_ko:'HAKKYO 3기 모집을 시작합니다',
    title_en:'', title_fr:'',
    body_ko:'<p><strong>2026년 5월, HAKKYO 3기 언어 프로그램</strong> 모집을 시작해요.</p><ul><li>한국어 클래스</li><li>영어 클래스</li><li>불어 클래스</li><li>Active Output</li></ul><p>몬트리올에 있는 분이라면 누구나 신청할 수 있어요.</p>',
    body_en:'', body_fr:'',
  },
]

const TYPE_TAG: Record<string, { label: string; cls: string }> = {
  notice: { label: 'HAKKYO', cls: '' },
  event:  { label: 'EVENT',  cls: 'feed-tag-event' },
  hiring: { label: 'COMMUNITY', cls: '' },
}

function fmtDate(d: string) {
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return `${dt.getMonth()+1}월 ${dt.getDate()}일`
}

function strip(html: string) {
  return html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()
}

function NoticeCard({ n }: { n: Notice }) {
  const [open, setOpen] = useState(false)
  const [liked, setLiked] = useState(false)
  const tag = TYPE_TAG[n.type] ?? TYPE_TAG.notice
  const preview = strip(n.body_ko || '').slice(0, 140)
  const hasBody = !!(n.body_ko || n.body_en)

  return (
    <div className={`feed-card${n.is_pinned ? ' feed-card-pinned' : ''}`}>
      {n.is_pinned && <div className="feed-pin-bar">📌 고정된 공지</div>}
      <div className="feed-card-inner">
        <div className="feed-meta">
          <div className="feed-avatar" style={{ background:'#f5c542' }}>H</div>
          <span className="feed-author">HAKKYO</span>
          <span className={`feed-tag ${tag.cls}`}>{tag.label}</span>
          <span className="feed-time">{fmtDate(n.date)}</span>
        </div>
        <div className="feed-title" onClick={() => hasBody && setOpen(o => !o)} style={{ cursor: hasBody ? 'pointer' : 'default' }}>
          {n.title_ko || n.title_en}
        </div>
        {!open && preview && (
          <div className="feed-body"><p>{preview}{preview.length >= 140 ? '…' : ''}</p></div>
        )}
        {open && n.body_ko && (
          <div className="feed-body" dangerouslySetInnerHTML={{ __html: n.body_ko }} />
        )}
        <div className="feed-footer">
          <button className={`feed-action${liked ? ' liked' : ''}`} onClick={() => setLiked(l => !l)}>
            {liked ? '❤️ 좋아요' : '🤍 좋아요'}
          </button>
          {hasBody && (
            <button className="feed-action" onClick={() => setOpen(o => !o)}>
              💬 {open ? '접기' : '더 보기'}
            </button>
          )}
          <button className="feed-action subscribed" onClick={() => window.location.href='/apply/news'}>
            🔔 소식 받기
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NewBoard() {
  const [notices, setNotices] = useState<Notice[]>(FALLBACK)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getNotices()
      .then(data => { if (data.length) setNotices(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const pinned = notices.filter(n => n.is_pinned)
  const rest = notices.filter(n => !n.is_pinned)

  return (
    <div className="ch-feed">
      <div className="ch-header">
        <span className="ch-header-icon">📢</span>
        <h1 className="ch-header-title">공지</h1>
        <span className="ch-header-desc">HAKKYO 공식 소식</span>
        <button className="ch-header-action" onClick={() => window.location.href='/apply/news'}>
          🔔 소식 받기
        </button>
      </div>

      <div className="ch-scroll">
        <div className="ch-inner">
          {loading && <p style={{ color:'#bbb', fontSize:13, padding:'8px 0' }}>불러오는 중…</p>}

          {pinned.map(n => <NoticeCard key={n.id} n={n} />)}

          {rest.length > 0 && pinned.length > 0 && (
            <div className="feed-divider">이전 소식</div>
          )}

          {rest.map(n => <NoticeCard key={n.id} n={n} />)}
        </div>
      </div>
    </div>
  )
}
