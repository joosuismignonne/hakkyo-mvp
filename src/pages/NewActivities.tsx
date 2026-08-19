import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { activities } from '../data/hakkyo'
import { supabase } from '../lib/supabase'
import { trackEvent } from '../lib/analytics'
import { useT } from '../lib/lang'

function getDday(dateIso: string) {
  const today = new Date(); today.setHours(0,0,0,0)
  const target = new Date(dateIso); target.setHours(0,0,0,0)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

interface ClubMeta {
  title: string; note: string; host: string
  date: string; day: string; time: string; entry: string
}

interface MiniIntro { title: string; body1: string; body2: string }
const DEFAULT_MINI_INTRO: MiniIntro = {
  title: '같이 하다 보면 말이 나와요',
  body1: '수업 외에도 매주 수요일 저녁, 몬트리올에서 함께 모여요. 북클럽·러닝클럽·보드게임클럽 — 활동을 하면서 자연스럽게 언어 교환이 이루어져요.',
  body2: '수업 수강생이 아니어도 참여할 수 있어요. 참가비 $10.',
}

function useMiniIntro(): MiniIntro {
  const [intro, setIntro] = useState<MiniIntro>(DEFAULT_MINI_INTRO)
  useEffect(() => {
    if (!supabase) return
    supabase.from('site_content').select('key,value_ko').eq('page', 'mini_hakkyo').then(({ data }) => {
      if (!data?.length) return
      const get = (k: string) => data.find(r => r.key === k)?.value_ko || ''
      setIntro({
        title: get('intro_title') || DEFAULT_MINI_INTRO.title,
        body1: get('intro_body1') || DEFAULT_MINI_INTRO.body1,
        body2: get('intro_body2') || DEFAULT_MINI_INTRO.body2,
      })
    })
  }, [])
  return intro
}

function useClubMeta(slug: string): ClubMeta {
  const a = activities.find(x => x.slug === slug)!
  const base: ClubMeta = {
    title: a?.ko || '', note: a?.note || '',
    host: (a as any)?.host || '', date: (a as any)?.date || '',
    day: (a as any)?.day || '', time: (a as any)?.time || '',
    entry: (a as any)?.entry || '',
  }
  const [meta, setMeta] = useState<ClubMeta>(base)

  useEffect(() => {
    if (!supabase) return
    supabase.from('site_content').select('key,value_ko')
      .eq('page', `activity_${slug}`)
      .in('key', ['club_title','club_note','club_host','club_date','club_day','club_time','club_entry'])
      .then(({ data }) => {
        if (!data?.length) return
        const get = (k: string) => data.find(r => r.key === k)?.value_ko || ''
        setMeta({
          title: get('club_title') || base.title,
          note:  get('club_note')  || base.note,
          host:  get('club_host')  || base.host,
          date:  get('club_date')  || base.date,
          day:   get('club_day')   || base.day,
          time:  get('club_time')  || base.time,
          entry: get('club_entry') || base.entry,
        })
      })
  }, [slug])

  return meta
}

const PREP: Record<string, string[]> = {
  'book-club':      ['읽고 싶은 책 한 권 (선택)', '필기구', '편하게 이야기할 마음'],
  'running-club':   ['편한 러닝화', '물', '가볍게 달릴 마음'],
  'boardgame-club': ['준비물 없음 — 게임과 도구 제공', '함께 웃을 준비'],
}

const POSTER_EMOJI: Record<string, string> = {
  'book-club':      '📚',
  'running-club':   '🏃',
  'boardgame-club': '🎲',
}

function ActivityDetail({ slug }: { slug: string }) {
  const a = activities.find(x => x.slug === slug)
  const m = useClubMeta(slug)
  const [quoteKo, setQuoteKo] = useState('')

  useEffect(() => {
    if (!supabase || !a) return
    supabase.from('site_content').select('value_ko')
      .eq('page', `activity_${slug}`).eq('key', 'leader_quote').single()
      .then(({ data }) => { if (data?.value_ko) setQuoteKo(data.value_ko) })
  }, [slug, a])

  if (!a) return (
    <div className="ch-feed">
      <div className="ch-header"><span className="ch-header-icon">🐱</span><h1 className="ch-header-title">Mini HAKKYO</h1></div>
      <div className="ch-scroll"><div className="ch-inner">
        <div className="feed-card"><div className="feed-card-inner">
          <div className="feed-title">클럽을 찾을 수 없어요</div>
          <div className="feed-footer"><button className="feed-action" onClick={() => window.location.href='/activities'}>← 돌아가기</button></div>
        </div></div>
      </div></div>
    </div>
  )

  const dday = getDday(a.dateIso)
  const ddLabel = dday === 0 ? '오늘' : dday === 1 ? '내일' : `D-${dday}`

  return (
    <div className="ch-feed">
      <div className="ch-header">
        <span className="ch-header-icon">{POSTER_EMOJI[slug] || '🐱'}</span>
        <h1 className="ch-header-title">{m.title}</h1>
        <span className="ch-header-desc">Mini HAKKYO · {a.code}</span>
        <button className="activity-apply-btn activity-apply-btn-sm" onClick={() => {
          trackEvent({ eventName:'activity_apply_click', targetType:'button', targetLabel:slug })
          window.location.href = `/apply/activities/${slug}`
        }}>
          신청하기 →
        </button>
      </div>
      <div className="ch-scroll">
        <div className="ch-inner">

          {/* D-day event card */}
          <a href={`/activities/${slug}`} className="feed-event-card" style={{ textDecoration:'none' }}>
            <div className="feed-dday">
              {ddLabel}
              <div className="feed-dday-sub">MINI</div>
            </div>
            <div className="feed-event-body">
              <div className="feed-event-title">{m.title} · {a.en}</div>
              <div className="feed-event-meta">
                2026년 {m.date} ({m.day}) · {m.time} · w/ {m.host} · {m.entry}
              </div>
            </div>
          </a>

          {/* Detail card */}
          <div className="feed-card feed-card-pinned">
            <div className="feed-pin-bar">📌 {a.code} — Mini HAKKYO</div>
            <div className="feed-card-inner">
              <div className="feed-meta">
                <div className="feed-avatar" style={{ background:'#f5c542' }}>H</div>
                <span className="feed-author">HAKKYO · {m.host}</span>
                <span className="feed-tag feed-tag-mini">MINI</span>
              </div>
              <div className="feed-title">{m.note}</div>
              <div className="feed-body">
                <ul>
                  <li>일정: 2026년 {m.date} ({m.day})</li>
                  <li>시간: {m.time}</li>
                  <li>진행: Language Exchange w/ {m.host}</li>
                  <li>장소: Montréal · 신청자에게 안내</li>
                  <li>참가비: {m.entry}</li>
                </ul>
                <p style={{ marginTop:10 }}>잘해야 오는 게 아니에요. Language Exchange는 함께 하다 보면 자연스럽게 말이 나오는 구조예요.</p>
              </div>
              <div className="feed-footer activity-apply-row">
                <button className="activity-apply-btn" onClick={() => {
                  trackEvent({ eventName:'activity_apply_click', targetType:'button', targetLabel:slug })
                  window.location.href = `/apply/activities/${slug}`
                }}>신청하기 →</button>
                <button className="feed-action" onClick={() => window.location.href='/activities'}>← 목록으로</button>
              </div>
            </div>
          </div>

          {/* Leader quote */}
          {quoteKo && (
            <div className="feed-card">
              <div className="feed-card-inner">
                <div className="feed-meta">
                  <div className="feed-avatar" style={{ background:'#e8e8e0' }}>{m.host[0]}</div>
                  <span className="feed-author">{m.host}</span>
                  <span className="feed-tag">WHY THIS CLUB</span>
                </div>
                <div className="feed-body"><p>"{quoteKo}"</p></div>
              </div>
            </div>
          )}

          {/* Prep items */}
          <div className="feed-divider">이것만 알고 오면 돼요</div>
          {(PREP[slug] || []).map((item, i) => (
            <div key={i} className="feed-card">
              <div className="feed-card-inner" style={{ display:'flex', alignItems:'center', gap:14, paddingTop:12, paddingBottom:12 }}>
                <div style={{ width:28, height:28, background:'#f5c542', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:12, flexShrink:0 }}>
                  0{i+1}
                </div>
                <span style={{ fontSize:14, color:'#333' }}>{item}</span>
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  )
}

export default function NewActivities() {
  const { slug } = useParams<{ slug?: string }>()
  const intro = useMiniIntro()
  if (slug) return <ActivityDetail slug={slug} />

  const withDday = activities.map(a => ({ ...a, dday: getDday(a.dateIso) }))
  const t = useT()

  return (
    <div className="ch-feed">
      <div className="ch-header">
        <span className="ch-header-icon">🐱</span>
        <div className="ch-header-text">
          <h1 className="ch-header-title">{t.activities.title}</h1>
          <span className="ch-header-desc">{t.activities.desc}</span>
        </div>
      </div>
      <div className="ch-scroll">
        <div className="ch-inner">

          {/* What is Mini */}
          <div className="feed-card feed-card-pinned">
            <div className="feed-pin-bar">📌 Mini HAKKYO란?</div>
            <div className="feed-card-inner">
              <div className="feed-meta">
                <div className="feed-avatar" style={{ background:'#f5c542' }}>H</div>
                <span className="feed-author">HAKKYO</span>
                <span className="feed-tag feed-tag-mini">MINI</span>
              </div>
              <div className="feed-title">{intro.title}</div>
              <div className="feed-body">
                <p>{intro.body1}</p>
                {intro.body2 && <p>{intro.body2}</p>}
              </div>
            </div>
          </div>

          <div className="feed-divider">9월 일정</div>

          {/* Activity cards */}
          {withDday.map(a => {
            const ddLabel = a.dday === 0 ? '오늘' : a.dday === 1 ? '내일' : a.dday < 0 ? '종료' : `D-${a.dday}`
            return (
              <a key={a.code} href={`/activities/${a.slug}`}
                className="feed-event-card"
                style={{ textDecoration:'none' }}
                onClick={() => trackEvent({ eventName:'activity_card_clicked', targetType:'activity', targetLabel:a.slug })}>
                <div className="feed-dday" style={a.dday < 0 ? { background:'#e8e8e0', color:'#aaa' } : {}}>
                  {ddLabel}
                  <div className="feed-dday-sub">{POSTER_EMOJI[a.slug]}</div>
                </div>
                <div className="feed-event-body">
                  <div className="feed-event-title">{a.ko} · {a.en}</div>
                  <div className="feed-event-meta">
                    2026년 {(a as any).date} ({(a as any).day}) · {(a as any).time} · w/ {(a as any).host} · {(a as any).entry}
                  </div>
                  <div className="feed-event-meta" style={{ marginTop:3 }}>{a.note}</div>
                </div>
                <div className="feed-event-arrow">→</div>
              </a>
            )
          })}

          {/* Community CTA */}
          <div className="feed-card">
            <div className="feed-card-inner">
              <div className="feed-meta">
                <div className="feed-avatar" style={{ background:'#111', color:'#f5c542' }}>🐱</div>
                <span className="feed-author">HAKKYO</span>
              </div>
              <div className="feed-title">몬트리올에서 새로운 사람을 만나요</div>
              <div className="feed-body"><p>같은 도시에서 새로운 시간을 보내는 사람들과 연결돼요.</p></div>
              <div className="feed-footer">
                <button className="feed-action subscribed" onClick={() => window.location.href='/apply/community'}>
                  🤝 커뮤니티 참여하기
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
