import React, { useState, useEffect } from 'react'
import { Bell, Books, Star, House, Cat, ChatCircle, HandWaving, Heart } from '@phosphor-icons/react'
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
            <Heart size={13} weight={liked ? 'fill' : 'regular'} color={liked ? '#e53e3e' : undefined} style={{marginRight:3}} /> {t.home.like}
          </button>
          {hasBody && (
            <button className="feed-action" onClick={() => setOpen(o => !o)}>
              <ChatCircle size={13} weight="bold" style={{marginRight:4}} />{open ? t.home.collapse : t.home.readMore}
            </button>
          )}
          <button className="feed-action feed-action-accent" onClick={() => window.location.href='/apply/news'}>
            <Bell size={13} weight="bold" style={{marginRight:4}} />{t.home.subscribeBtn}
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

function dday(dateIso: string) {
  const t = new Date(); t.setHours(0,0,0,0)
  const d = new Date(dateIso); d.setHours(0,0,0,0)
  return Math.ceil((d.getTime() - t.getTime()) / 86400000)
}

function HakkyoCalendar({ events, lang: l }: { events: CalEvent[]; lang: string }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

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

  // All upcoming events from today (across all months)
  const allUpcoming = events
    .map(e => ({ ...e, dd: dday(e.date) }))
    .filter(e => e.dd >= 0)
    .sort((a, b) => a.dd - b.dd)
    .slice(0, 6)

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
      {/* Top bar */}
      <div className="hk-cal-header">
        <div className="hk-cal-title">HAKKYO 캘린더</div>
        <div style={{ display:'flex', gap:4 }}>
          <button className="hk-cal-nav" onClick={prev}>‹</button>
          <button className="hk-cal-nav" onClick={next}>›</button>
        </div>
      </div>

      {/* Two-column body */}
      <div className="hk-cal-body">

        {/* Left: grid */}
        <div className="hk-cal-grid-col">
          <div className="hk-cal-month">{viewYear}년 {monthName}</div>
          <div className="hk-cal-grid">
            {weekdays.map(d => <div key={d} className="hk-cal-weekday">{d}</div>)}
            {cells.map((day, i) => {
              if (!day) return <div key={`e${i}`} className="hk-cal-cell empty" />
              const evs = eventsByDay[day] ?? []
              const isToday = day === today.getDate() && viewYear === today.getFullYear() && viewMonth === today.getMonth()
              return (
                <div key={day} className={`hk-cal-cell${isToday ? ' today' : ''}${evs.length ? ' has-event' : ''}`}>
                  <span className="hk-cal-day">{day}</span>
                  {evs.slice(0, 2).map((e, j) => (
                    <a key={j} href={e.href} title={e.label} className="hk-cal-event-bar"
                      style={{ background: e.color + '22', borderLeft: `2.5px solid ${e.color}`, color: e.color === '#f5c542' ? '#8a6000' : e.color }}>
                      {e.label.split('·')[0].trim()}
                    </a>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: D-day list (always today-based, not month-view-based) */}
        {allUpcoming.length > 0 && (
          <div className="hk-cal-sidebar">
            <div className="hk-cal-sidebar-title">
              {l === 'en' ? 'Upcoming' : l === 'fr' ? 'À venir' : '다가오는 일정'}
            </div>
            <div className="hk-cal-upcoming">
              {allUpcoming.map((e, i) => {
                const ddLabel = e.dd === 0
                  ? (l === 'en' ? 'TODAY' : l === 'fr' ? "AUJ." : '오늘')
                  : e.dd === 1
                  ? (l === 'en' ? 'TMRW' : l === 'fr' ? 'DEMAIN' : '내일')
                  : `D-${e.dd}`
                const accentColor = e.color === '#f5c542' ? '#8a6000' : e.color
                const d = new Date(e.date)
                const dateStr = l === 'en'
                  ? `${MONTH_NAMES_EN[d.getMonth()]} ${d.getDate()}`
                  : l === 'fr'
                  ? `${d.getDate()} ${MONTH_NAMES_FR[d.getMonth()]}`
                  : `${d.getMonth()+1}월 ${d.getDate()}일`
                return (
                  <a key={i} href={e.href} className="hk-cal-upcoming-row">
                    <span className="hk-cal-upcoming-dday"
                      style={{ color: accentColor, background: e.color + '20', borderColor: e.color + '40' }}>
                      {ddLabel}
                    </span>
                    <div className="hk-cal-upcoming-info">
                      <span className="hk-cal-upcoming-label">{e.label.split('·')[0].trim()}</span>
                      <span className="hk-cal-upcoming-date">{dateStr}</span>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )}
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
            // Use DB value as source of truth (even empty array means "admin cleared all")
            if (Array.isArray(parsed)) setEvents(parsed)
          } catch {}
        }
      })
  }, [])
  return events
}

import type { HomeBlockConfig } from './Admin'
import { HOME_BLOCKS_DEFAULT } from './Admin'

const DEFAULT_LAYOUT: HomeBlockConfig[] = HOME_BLOCKS_DEFAULT.map(b => ({
  id: b.id, visible: true, size: 'full' as const, title: b.defaultTitle,
}))

function useHomeLayout(): HomeBlockConfig[] {
  const [layout, setLayout] = useState<HomeBlockConfig[]>(DEFAULT_LAYOUT)
  useEffect(() => {
    if (!supabase) return
    supabase.from('site_content').select('value_ko').eq('page','home_layout').eq('key','block_order').single()
      .then(({ data }) => {
        if (data?.value_ko) {
          try {
            const saved = JSON.parse(data.value_ko) as HomeBlockConfig[]
            const ids = saved.map(b => b.id)
            const rest = DEFAULT_LAYOUT.filter(b => !ids.includes(b.id))
            const merged = saved.map(b => ({
              ...{ size: 'full' as const, title: HOME_BLOCKS_DEFAULT.find(d => d.id === b.id)?.defaultTitle ?? '' },
              ...b,
            }))
            setLayout([...merged, ...rest])
          } catch {}
        }
      })
  }, [])
  return layout
}

export default function NewHome() {
  const [notices, setNotices] = useState<Notice[]>(FALLBACK)
  const { lang } = useLang()
  const t = useT()
  const calEvents = useCalEvents()
  const layout = useHomeLayout()

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

  function blockContent(b: HomeBlockConfig) {
    const title = b.title || undefined
    switch (b.id) {
      case 'calendar_notices':
        return (
          <div className="home-split-row">
            <HakkyoCalendar events={calEvents} lang={lang} />
            <div className="home-split-notices">
              {pinned && <NoticeCard n={pinned} />}
              {rest.slice(0, 2).map(n => <NoticeCard key={n.id} n={n} />)}
            </div>
          </div>
        )
      case 'mini_hakkyo':
        if (!upcomingEvents.length) return null
        return (
          <div>
            {title && <div className="feed-divider">{title}</div>}
            {upcomingEvents.map(a => {
              const dd = (a as any).dday as number
              const ddLabel = dd === 0 ? t.home.today : dd === 1 ? t.home.tomorrow : `D-${dd}`
              const aDate = lang === 'en' ? (a as any).dateEn : lang === 'fr' ? (a as any).dateFr : (a as any).date
              const aTime = lang === 'en' ? (a as any).timeEn : (a as any).time
              const aTitle = lang === 'fr' ? (a as any).fr : lang === 'en' ? (a as any).en : (a as any).ko
              return (
                <a key={a.code} href={`/activities/${a.slug}`} className="feed-event-card">
                  <div className="feed-dday">{ddLabel}<div className="feed-dday-sub">MINI</div></div>
                  <div className="feed-event-body">
                    <div className="feed-event-title">{aTitle}</div>
                    <div className="feed-event-meta">{aDate} ({t.home.wednesday}) · {aTime} · w/ {(a as any).host} · {(a as any).entry}</div>
                  </div>
                  <div className="feed-event-arrow">→</div>
                </a>
              )
            })}
          </div>
        )
      case 'programs':
        return (
          <div>
            {title && <div className="feed-divider">{title}</div>}
            <div className="feed-programs-grid">
              {programs.slice(0, 4).map(p => {
                const pName = lang === 'fr' ? (p as any).fr : lang === 'en' ? p.en : p.lang
                const pLevel = lang === 'en'
                  ? (p as any).level?.replace('입문–초급','Beginner').replace('초급–중급','Intermediate').replace('레벨 상담 후 안내','Level TBD')
                  : lang === 'fr'
                  ? (p as any).level?.replace('입문–초급','Débutant').replace('초급–중급','Intermédiaire').replace('레벨 상담 후 안내','Niveau à confirmer')
                  : (p as any).level
                const pScene = lang === 'en'
                  ? (p as any).scene
                    ?.replace('카페에서 주문하고, 친구와 약속을 잡고, 내 하루를 한국어로 말해봐요.','Order at a café, make plans with friends, and talk about your day in Korean.')
                    .replace('머릿속에 있던 영어를 꺼내 실제 대화로 연결하는 연습을 해요.','Practice turning your English vocabulary into real, flowing conversations.')
                    .replace('가게, 직장, 이웃과의 짧은 대화부터 몬트리올 생활 불어를 시작해요.','Start with everyday French for shops, work, and neighbours in Montréal.')
                    .replace('두 언어를 따로 외우는 대신, 한 주 안에서 배우고 말하고 다시 연결해요.','Instead of studying two languages separately, learn, speak, and connect them all in one week.')
                  : lang === 'fr'
                  ? (p as any).scene
                    ?.replace('카페에서 주문하고, 친구와 약속을 잡고, 내 하루를 한국어로 말해봐요.','Commandez un café, planifiez avec des amis et parlez de votre journée en coréen.')
                    .replace('머릿속에 있던 영어를 꺼내 실제 대화로 연결하는 연습을 해요.','Transformez votre vocabulaire en anglais en vraies conversations fluides.')
                    .replace('가게, 직장, 이웃과의 짧은 대화부터 몬트리올 생활 불어를 시작해요.','Commencez par le français du quotidien pour les commerces, le travail et les voisins à Montréal.')
                    .replace('두 언어를 따로 외우는 대신, 한 주 안에서 배우고 말하고 다시 연결해요.','Plutôt que d\'étudier deux langues séparément, apprenez, parlez et connectez-les en une semaine.')
                  : (p as any).scene
                return (
                  <a key={p.en} href={p.href} className="feed-prog-card">
                    <div className="feed-prog-mark">{p.mark}</div>
                    <div className="feed-prog-lang">{pName}</div>
                    <div className="feed-prog-level">{pLevel}</div>
                    <div className="feed-prog-desc">{pScene}</div>
                  </a>
                )
              })}
            </div>
          </div>
        )
      case 'cta':
        return (
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
              <div className="feed-title">{t.home.ctaTitle}</div>
              <div className="feed-footer">
                <button className="feed-action feed-action-accent" onClick={() => window.location.href='/apply/news'}>
                  <Bell size={13} weight="bold" style={{marginRight:4}} />{t.home.subscribeBtn}
                </button>
                <button className="feed-action" onClick={() => window.location.href='/programs'}>
                  <Books size={13} weight="bold" style={{marginRight:4}} />{t.nav.programs}
                </button>
              </div>
            </div>
          </div>
        )
      case 'reviews':
        return (
          <a href="/community/reviews" className="feed-event-card" style={{ textDecoration:'none' }}>
            <div className="feed-dday" style={{ background:'#f5f5f0', display:'flex', alignItems:'center', justifyContent:'center' }}><Star size={22} weight="fill" color="#f5c542" /></div>
            <div className="feed-event-body">
              <div className="feed-event-title">{t.home.reviewSection}</div>
              <div className="feed-event-meta">
                {lang === 'fr' ? 'Avis honnêtes des étudiants HAKKYO →' : lang === 'en' ? 'Honest reviews from HAKKYO students →' : 'HAKKYO 수강생 솔직 후기 보러가기 →'}
              </div>
            </div>
          </a>
        )
      default:
        return null
    }
  }

  // Group visible blocks: consecutive 'half' blocks pair up side-by-side
  function renderBlocks() {
    const visible = layout.filter(b => b.visible)
    const result: React.ReactNode[] = []
    let i = 0
    while (i < visible.length) {
      const b = visible[i]
      const content = blockContent(b)
      if (!content) { i++; continue }
      if (b.size === 'half' && i + 1 < visible.length && visible[i + 1].size === 'half') {
        const b2 = visible[i + 1]
        const content2 = blockContent(b2)
        result.push(
          <div key={`pair-${b.id}-${b2.id}`} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, alignItems:'start' }}>
            <div>{content}</div>
            <div>{content2 ?? null}</div>
          </div>
        )
        i += 2
      } else {
        result.push(<div key={b.id}>{content}</div>)
        i++
      }
    }
    return result
  }

  return (
    <div className="ch-feed">
      <div className="ch-header">
        <span className="ch-header-icon"><House size={20} weight="bold" /></span>
        <div className="ch-header-text">
          <h1 className="ch-header-title">{t.home.title}</h1>
          <span className="ch-header-desc">{t.home.desc}</span>
        </div>
      </div>

      <div className="ch-scroll">
        <div className="ch-inner">
          <div className="ch-compose" onClick={() => window.location.href='/apply/community'}>
            <div className="ch-compose-avatar"><Cat size={18} weight="bold" /></div>
            <span className="ch-compose-ph">{t.home.compose}</span>
            <button className="ch-compose-btn">{t.home.applyBtn}</button>
          </div>

          {renderBlocks()}

          {rest.length > 2 && <div className="feed-divider">{t.home.noticeSection}</div>}
          {rest.slice(2).map(n => <NoticeCard key={n.id} n={n} />)}
        </div>
      </div>
    </div>
  )
}
