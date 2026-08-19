import { useState, useEffect } from 'react'
import { programs, activities } from '../data/hakkyo'
import { getNotices } from '../lib/db'
import type { Notice } from '../types'
import { useLang, useT, pick } from '../lib/lang'
import { supabase } from '../lib/supabase'

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
    title_en:'Session 4 starts this October',
    title_fr:'La session 4 commence en octobre',
    body_ko:'HAKKYO 4기 언어 프로그램(한국어·영어·불어)은 2026년 10월부터 시작해요. 소식 신청자에게 가장 먼저 알려드릴게요.',
    body_en:'HAKKYO Session 4 (Korean · English · French) starts in October 2026. Subscribers will be notified first.',
    body_fr:'La session 4 de HAKKYO (coréen · anglais · français) débute en octobre 2026. Les abonnés seront informés en premier.',
  },
  {
    id:'f2', date:'2026-08-01', type:'event', is_pinned:false,
    title_ko:'9월, Mini HAKKYO 시리즈를 시작합니다',
    title_en:'Mini HAKKYO series launches in September',
    title_fr:'La série Mini HAKKYO lance en septembre',
    body_ko:'북클럽·러닝클럽·보드게임클럽 — 9월 매주 수요일 저녁에 만나요.',
    body_en:'Book Club · Running Club · Boardgame Club — every Wednesday evening in September.',
    body_fr:'Club de lecture · Club de course · Club de jeux — chaque mercredi soir en septembre.',
  },
  {
    id:'f3', date:'2026-07-26', type:'notice', is_pinned:false,
    title_ko:'HAKKYO 3기를 함께해 주셔서 감사합니다',
    title_en:'Thank you for Session 3',
    title_fr:'Merci pour la session 3',
    body_ko:'3기 수업이 마무리됐어요. 함께해 주신 모든 분들께 진심으로 감사드립니다.',
    body_en:'Session 3 has wrapped up. Heartfelt thanks to everyone who joined us.',
    body_fr:'La session 3 est terminée. Merci sincèrement à tous ceux qui y ont participé.',
  },
]

function NoticeCard({ n }: { n: Notice }) {
  const [open, setOpen] = useState(false)
  const [liked, setLiked] = useState(false)
  const { lang } = useLang()
  const t = useT()
  const tag = TYPE_TAG[n.type] ?? TYPE_TAG.notice
  const title = pick({ ko: n.title_ko, en: n.title_en, fr: n.title_fr }, lang)
  const body  = pick({ ko: n.body_ko,  en: n.body_en,  fr: n.body_fr  }, lang)
  const preview = strip(body).slice(0, 140)
  const hasBody = !!body

  return (
    <div className={`feed-card${n.is_pinned ? ' feed-card-pinned' : ''}`}>
      {n.is_pinned && (
        <div className="feed-pin-bar">
          <span className="feed-pin-dot" />
          {t.home.pinned}
        </div>
      )}
      <div className="feed-card-inner">
        <div className="feed-meta">
          <div className="feed-avatar feed-avatar-h">H</div>
          <div className="feed-meta-text">
            <span className="feed-author">HAKKYO</span>
            <span className="feed-time">{fmtDate(n.date)}</span>
          </div>
          <span className={`feed-tag ${tag.cls}`}>{tag.label}</span>
        </div>
        <div
          className="feed-title"
          onClick={() => hasBody && setOpen(o => !o)}
          style={{ cursor: hasBody ? 'pointer' : 'default' }}
        >
          {title}
        </div>
        {!open && preview && (
          <div className="feed-body"><p>{preview}{preview.length >= 140 ? '…' : ''}</p></div>
        )}
        {open && body && (
          <div className="feed-body" dangerouslySetInnerHTML={{ __html: body }} />
        )}
        <div className="feed-footer">
          <button className={`feed-action${liked ? ' liked' : ''}`} onClick={() => setLiked(l => !l)}>
            {liked ? '❤️' : '🤍'} {t.home.like}
          </button>
          {hasBody && (
            <button className="feed-action" onClick={() => setOpen(o => !o)}>
              💬 {open ? t.home.collapse : t.home.readMore}
            </button>
          )}
          <button className="feed-action feed-action-accent" onClick={() => window.location.href='/apply/news'}>
            🔔 {t.home.subscribeBtn}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Calendar ───────────────────────────────────────────────────────────────
const WEEKDAYS_KO = ['일','월','화','수','목','금','토']
const WEEKDAYS_EN = ['Su','Mo','Tu','We','Th','Fr','Sa']
const WEEKDAYS_FR = ['Di','Lu','Ma','Me','Je','Ve','Sa']

interface CalEvent { date: string; label: string; href: string; color: string }

function HakkyoCalendar({ events, lang: l }: { events: CalEvent[]; lang: string }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth()) // 0-indexed

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)]

  const eventsByDay: Record<number, CalEvent[]> = {}
  events.forEach(e => {
    const d = new Date(e.date)
    if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
      const day = d.getDate();
      (eventsByDay[day] ??= []).push(e)
    }
  })

  const MONTH_NAMES_KO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
  const MONTH_NAMES_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const MONTH_NAMES_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Août','Sep','Oct','Nov','Déc']
  const monthName = l === 'en' ? MONTH_NAMES_EN[viewMonth] : l === 'fr' ? MONTH_NAMES_FR[viewMonth] : MONTH_NAMES_KO[viewMonth]
  const weekdays = l === 'en' ? WEEKDAYS_EN : l === 'fr' ? WEEKDAYS_FR : WEEKDAYS_KO

  function prev() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function next() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  return (
    <div className="hk-calendar">
      <div className="hk-cal-header">
        <button className="hk-cal-nav" onClick={prev}>‹</button>
        <span className="hk-cal-month">{viewYear}년 {monthName}</span>
        <button className="hk-cal-nav" onClick={next}>›</button>
      </div>
      <div className="hk-cal-grid">
        {weekdays.map(d => <div key={d} className="hk-cal-weekday">{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} className="hk-cal-cell empty" />
          const evs = eventsByDay[day] ?? []
          const isToday = day === today.getDate() && viewYear === today.getFullYear() && viewMonth === today.getMonth()
          return (
            <div key={day} className={`hk-cal-cell${isToday ? ' today' : ''}${evs.length ? ' has-event' : ''}`}>
              <span className="hk-cal-day">{day}</span>
              {evs.length > 0 && (
                <div className="hk-cal-dots">
                  {evs.slice(0, 3).map((e, j) => (
                    <a key={j} href={e.href} title={e.label}
                      className="hk-cal-dot" style={{ background: e.color }} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {/* Legend */}
      <div className="hk-cal-legend">
        <span className="hk-cal-legend-item"><span className="hk-cal-dot" style={{ background:'#f5c542' }} />Mini HAKKYO</span>
        <span className="hk-cal-legend-item"><span className="hk-cal-dot" style={{ background:'#5b8af5' }} />프로그램 시작</span>
      </div>
    </div>
  )
}

const DEFAULT_CAL_EVENTS: CalEvent[] = [
  ...activities.map(a => ({
    date: a.dateIso,
    label: (a as any).ko + ' · ' + (a as any).host,
    href: `/activities/${a.slug}`,
    color: '#f5c542',
  })),
  { date: '2026-10-01', label: '4기 프로그램 시작', href: '/programs', color: '#5b8af5' },
]

function useCalEvents(): CalEvent[] {
  const [events, setEvents] = useState<CalEvent[]>(DEFAULT_CAL_EVENTS)
  useEffect(() => {
    if (!supabase) return
    supabase.from('site_content').select('value_ko').eq('page', 'home').eq('key', 'cal_events').single()
      .then(({ data }) => {
        if (data?.value_ko) {
          try {
            const parsed = JSON.parse(data.value_ko) as CalEvent[]
            if (Array.isArray(parsed) && parsed.length > 0) setEvents(parsed)
          } catch {}
        }
      })
  }, [])
  return events
}

export default function NewHome() {
  const [notices, setNotices] = useState<Notice[]>(FALLBACK)
  const { lang } = useLang()
  const t = useT()
  const calEvents = useCalEvents()

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
        <div className="ch-header-text">
          <h1 className="ch-header-title">{t.home.title}</h1>
          <span className="ch-header-desc">{t.home.desc}</span>
        </div>
      </div>

      <div className="ch-scroll">
        <div className="ch-inner">

          {/* Compose */}
          <div className="ch-compose" onClick={() => window.location.href='/apply/community'}>
            <div className="ch-compose-avatar">😺</div>
            <span className="ch-compose-ph">{t.home.compose}</span>
            <button className="ch-compose-btn">{t.home.applyBtn}</button>
          </div>

          {/* Calendar — top of feed */}
          <div className="feed-divider">📅 {lang === 'en' ? 'Schedule' : lang === 'fr' ? 'Calendrier' : '일정 캘린더'}</div>
          <HakkyoCalendar events={calEvents} lang={lang} />

          {pinned && <NoticeCard n={pinned} />}

          {upcomingEvents.length > 0 && (
            <>
              <div className="feed-divider">{t.home.miniSection}</div>
              {upcomingEvents.map(a => {
                const dday = (a as any).dday as number
                const ddLabel = dday === 0 ? t.home.today : dday === 1 ? t.home.tomorrow : `D-${dday}`
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

          <div className="feed-divider">{t.home.programSection}</div>
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

          <div className="feed-card feed-cta-card">
            <div className="feed-card-inner">
              <div className="feed-meta">
                <div className="feed-avatar feed-avatar-h">H</div>
                <div className="feed-meta-text">
                  <span className="feed-author">HAKKYO</span>
                  <span className="feed-time">2026 FALL</span>
                </div>
                <span className="feed-tag feed-tag-program">PROGRAM</span>
              </div>
              <div className="feed-title">
                {t.home.programSection.includes('SESSION') ? '4기 모집은 10월 — 지금 소식 신청하면 가장 먼저 알려드려요' : 'Session 4 in October — subscribe now to be notified first'}
              </div>
              <div className="feed-footer">
                <button className="feed-action feed-action-accent" onClick={() => window.location.href='/apply/news'}>
                  🔔 {t.home.subscribeBtn}
                </button>
                <button className="feed-action" onClick={() => window.location.href='/programs'}>
                  📚 {t.nav.programs}
                </button>
              </div>
            </div>
          </div>

          {/* Reviews channel teaser */}
          <a href="/community/reviews" className="feed-event-card" style={{ textDecoration:'none' }}>
            <div className="feed-dday" style={{ background:'#f5f5f0', fontSize:22 }}>⭐</div>
            <div className="feed-event-body">
              <div className="feed-event-title">{t.home.reviewSection}</div>
              <div className="feed-event-meta">
                {lang === 'fr' ? 'Avis honnêtes des étudiants HAKKYO →' : lang === 'en' ? 'Honest reviews from HAKKYO students →' : 'HAKKYO 수강생 솔직 후기 보러가기 →'}
              </div>
            </div>
          </a>

          {rest.length > 0 && <div className="feed-divider">{t.home.noticeSection}</div>}
          {rest.map(n => <NoticeCard key={n.id} n={n} />)}

        </div>
      </div>
    </div>
  )
}
