import { useState, useEffect } from 'react'
import { programs, activities } from '../data/hakkyo'
import { getNotices } from '../lib/db'
import type { Notice } from '../types'

function getDday(dateIso: string) {
  const today = new Date(); today.setHours(0,0,0,0)
  const target = new Date(dateIso); target.setHours(0,0,0,0)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

function fmtDate(d: string) {
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return `${dt.getMonth()+1}월 ${dt.getDate()}일`
}

function strip(html: string) {
  return html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()
}

const TYPE_TAG: Record<string, { label: string; cls: string }> = {
  notice: { label: 'HAKKYO', cls: '' },
  event:  { label: 'EVENT',  cls: 'feed-tag-event' },
  hiring: { label: 'COMMUNITY', cls: '' },
}

const FALLBACK: Notice[] = [
  {
    id:'f1', date:'2026-08-05', type:'notice', is_pinned:true,
    title_ko:'4기 언어 프로그램은 10월에 시작합니다',
    title_en:'', title_fr:'',
    body_ko:'HAKKYO 4기 언어 프로그램(한국어·영어·불어)은 2026년 10월부터 시작해요. 소식 신청자에게 가장 먼저 알려드릴게요.',
    body_en:'', body_fr:'',
  },
  {
    id:'f2', date:'2026-08-01', type:'event', is_pinned:false,
    title_ko:'9월, Mini HAKKYO 시리즈를 시작합니다',
    title_en:'', title_fr:'',
    body_ko:'북클럽·러닝클럽·보드게임클럽 — 9월 매주 수요일 저녁에 만나요. 수업 수강생이 아니어도 참여할 수 있어요.',
    body_en:'', body_fr:'',
  },
  {
    id:'f3', date:'2026-07-26', type:'notice', is_pinned:false,
    title_ko:'HAKKYO 3기를 함께해 주셔서 감사합니다',
    title_en:'', title_fr:'',
    body_ko:'3기 수업이 마무리됐어요. 함께해 주신 모든 분들께 진심으로 감사드립니다.',
    body_en:'', body_fr:'',
  },
]

function NoticeCard({ n }: { n: Notice }) {
  const [open, setOpen] = useState(false)
  const [liked, setLiked] = useState(false)
  const tag = TYPE_TAG[n.type] ?? TYPE_TAG.notice
  const preview = strip(n.body_ko || '').slice(0, 120)
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
        {!open && preview && <div className="feed-body"><p>{preview}{preview.length >= 120 ? '…' : ''}</p></div>}
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

export default function NewHome() {
  const [notices, setNotices] = useState<Notice[]>(FALLBACK)

  useEffect(() => {
    getNotices()
      .then(data => { if (data.length) setNotices(data) })
      .catch(() => {})
  }, [])

  const pinned = notices.find(n => n.is_pinned)
  const rest = notices.filter(n => !n.is_pinned)

  const upcomingEvents = activities
    .map(a => ({ ...a, dday: getDday(a.dateIso) }))
    .filter(a => a.dday >= 0)
    .sort((a, b) => a.dday - b.dday)

  return (
    <div className="ch-feed">
      <div className="ch-header">
        <span className="ch-header-icon">🏠</span>
        <h1 className="ch-header-title">홈</h1>
        <span className="ch-header-desc">Montréal Learning Community · 2026</span>
      </div>

      <div className="ch-scroll">
        <div className="ch-inner">

          {/* Compose */}
          <div className="ch-compose" onClick={() => window.location.href='/apply/community'}>
            <div className="ch-compose-avatar">😺</div>
            <span className="ch-compose-ph">HAKKYO 커뮤니티에 참여하고 싶으신가요?</span>
            <button className="ch-compose-btn">커뮤니티 신청</button>
          </div>

          {/* Pinned notice */}
          {pinned && <NoticeCard n={pinned} />}

          {/* Next Mini HAKKYO events */}
          {upcomingEvents.length > 0 && (
            <>
              <div className="feed-divider">MINI HAKKYO · 다음 일정</div>
              {upcomingEvents.map(a => {
                const ddLabel = a.dday === 0 ? '오늘' : a.dday === 1 ? '내일' : `D-${a.dday}`
                return (
                  <a key={a.code} href={`/activities/${a.slug}`} className="feed-event-card">
                    <div className="feed-dday">
                      {ddLabel}
                      <div className="feed-dday-sub">MINI</div>
                    </div>
                    <div className="feed-event-body">
                      <div className="feed-event-title">{a.ko} · {a.en}</div>
                      <div className="feed-event-meta">
                        {(a as any).date} ({(a as any).day}) · {(a as any).time} · w/ {(a as any).host} · {(a as any).entry}
                      </div>
                    </div>
                    <div className="feed-event-arrow">→</div>
                  </a>
                )
              })}
            </>
          )}

          {/* Programs */}
          <div className="feed-divider">언어 프로그램 · SESSION 04</div>
          <div className="feed-programs-grid">
            {programs.slice(0, 4).map(p => (
              <a key={p.en} href={p.href} className="feed-prog-card">
                <div className="feed-prog-mark">{p.mark}</div>
                <div className="feed-prog-lang">{p.lang}</div>
                <div className="feed-prog-level">{p.level}</div>
                <div className="feed-prog-desc">{p.scene}</div>
              </a>
            ))}
          </div>

          {/* 4기 announcement card */}
          <div className="feed-card">
            <div className="feed-card-inner">
              <div className="feed-meta">
                <div className="feed-avatar" style={{ background:'#f5c542' }}>H</div>
                <span className="feed-author">HAKKYO</span>
                <span className="feed-tag feed-tag-program">PROGRAM</span>
                <span className="feed-time">2026 FALL</span>
              </div>
              <div className="feed-title">4기 모집은 10월 — 지금 소식 신청하면 가장 먼저 알려드려요</div>
              <div className="feed-body"><p>수강료와 세부 일정이 확정되는 즉시 소식 신청자에게 이메일로 먼저 안내드려요.</p></div>
              <div className="feed-footer">
                <button className="feed-action subscribed" onClick={() => window.location.href='/apply/news'}>
                  🔔 소식 신청하기
                </button>
                <button className="feed-action" onClick={() => window.location.href='/programs'}>
                  📚 프로그램 보기
                </button>
              </div>
            </div>
          </div>

          {/* Rest of notices */}
          {rest.length > 0 && <div className="feed-divider">최신 소식</div>}
          {rest.map(n => <NoticeCard key={n.id} n={n} />)}

        </div>
      </div>
    </div>
  )
}
