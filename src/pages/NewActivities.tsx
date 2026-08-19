import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { activities } from '../data/hakkyo'
import { supabase } from '../lib/supabase'
import { trackEvent } from '../lib/analytics'
import { useT, useLang } from '../lib/lang'

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

const PREP: Record<string, { ko: string[]; en: string[]; fr: string[] }> = {
  'book-club': {
    ko: ['읽고 싶은 책 한 권 (선택)', '필기구', '편하게 이야기할 마음'],
    en: ['A book you want to read (optional)', 'Something to write with', 'An open mind'],
    fr: ['Un livre à lire (facultatif)', 'De quoi écrire', 'L\'envie d\'échanger'],
  },
  'running-club': {
    ko: ['편한 러닝화', '물', '가볍게 달릴 마음'],
    en: ['Comfortable running shoes', 'Water', 'A light spirit'],
    fr: ['Chaussures de course confortables', 'De l\'eau', 'L\'envie de courir'],
  },
  'boardgame-club': {
    ko: ['준비물 없음 — 게임과 도구 제공', '함께 웃을 준비'],
    en: ['Nothing to bring — games and materials provided', 'Ready to laugh'],
    fr: ['Rien à apporter — jeux et matériel fournis', 'Prêt à rire'],
  },
}

const POSTER_EMOJI: Record<string, string> = {
  'book-club':      '📚',
  'running-club':   '🏃',
  'boardgame-club': '🎲',
}

function ActivityDetail({ slug }: { slug: string }) {
  const a = activities.find(x => x.slug === slug)
  const m = useClubMeta(slug)
  const { lang } = useLang()
  const t = useT()
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
          <div className="feed-title">{lang === 'en' ? 'Club not found' : lang === 'fr' ? 'Club introuvable' : '클럽을 찾을 수 없어요'}</div>
          <div className="feed-footer"><button className="feed-action" onClick={() => window.location.href='/activities'}>← {lang === 'en' ? 'Back' : lang === 'fr' ? 'Retour' : '돌아가기'}</button></div>
        </div></div>
      </div></div>
    </div>
  )

  const aa = a as any
  const dday = getDday(a.dateIso)
  const ddLabel = dday === 0 ? t.home.today : dday === 1 ? t.home.tomorrow : `D-${dday}`

  // Pick localized fields
  const actTitle   = lang === 'en' ? a.en      : lang === 'fr' ? a.fr      : a.ko
  const actNote    = lang === 'en' ? (aa.noteEn || a.en)   : lang === 'fr' ? (aa.noteFr || a.fr) : aa.note
  const actDesc    = lang === 'en' ? (aa.descEn || '')   : lang === 'fr' ? (aa.descFr || '') : (aa.desc || '')
  const actDate    = lang === 'en' ? aa.dateEn  : lang === 'fr' ? aa.dateFr  : m.date
  const actDay     = lang === 'en' ? aa.dayEn   : lang === 'fr' ? aa.dayFr   : m.day
  const actTime    = lang === 'en' ? aa.timeEn  : lang === 'fr' ? aa.timeFr  : m.time

  const applyLabel = lang === 'en' ? 'Apply →' : lang === 'fr' ? 'S\'inscrire →' : '신청하기 →'
  const backLabel  = lang === 'en' ? '← List'  : lang === 'fr' ? '← Liste'      : '← 목록으로'
  const prepLabel  = lang === 'en' ? 'What to bring' : lang === 'fr' ? 'Ce qu\'il faut apporter' : '이것만 알고 오면 돼요'
  const schedLabel = lang === 'en' ? 'Date'   : lang === 'fr' ? 'Date'    : '일정'
  const timeLabel  = lang === 'en' ? 'Time'   : lang === 'fr' ? 'Heure'   : '시간'
  const hostLabel  = lang === 'en' ? 'Host'   : lang === 'fr' ? 'Animateur' : '진행'
  const locLabel   = lang === 'en' ? 'Location' : lang === 'fr' ? 'Lieu'  : '장소'
  const entryLabel = lang === 'en' ? 'Entry'  : lang === 'fr' ? 'Entrée'  : '참가비'
  const locVal     = lang === 'en' ? 'Montréal · Location sent upon registration'
                   : lang === 'fr' ? 'Montréal · Lieu communiqué après inscription'
                   : 'Montréal · 신청자에게 안내'
  const yearPrefix = lang === 'ko' ? '2026년 ' : '2026 '

  const prepItems  = (PREP[slug]?.[lang] ?? PREP[slug]?.ko ?? [])

  return (
    <div className="ch-feed">
      <div className="ch-header">
        <span className="ch-header-icon">{POSTER_EMOJI[slug] || '🐱'}</span>
        <h1 className="ch-header-title">{actTitle}</h1>
        <span className="ch-header-desc">Mini HAKKYO · {a.code}</span>
        <button className="activity-apply-btn activity-apply-btn-sm" onClick={() => {
          trackEvent({ eventName:'activity_apply_click', targetType:'button', targetLabel:slug })
          window.location.href = `/apply/activities/${slug}`
        }}>
          {applyLabel}
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
              <div className="feed-event-title">{a.ko} · {a.en}</div>
              <div className="feed-event-meta">
                {yearPrefix}{actDate} ({actDay}) · {actTime} · w/ {m.host} · {m.entry}
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
              <div className="feed-title">{actNote}</div>
              <div className="feed-body">
                <ul>
                  <li>{schedLabel}: {yearPrefix}{actDate} ({actDay})</li>
                  <li>{timeLabel}: {actTime}</li>
                  <li>{hostLabel}: Language Exchange w/ {m.host}</li>
                  <li>{locLabel}: {locVal}</li>
                  <li>{entryLabel}: {m.entry}</li>
                </ul>
                {actDesc && <p style={{ marginTop:10 }}>{actDesc}</p>}
              </div>
              <div className="feed-footer activity-apply-row">
                <button className="activity-apply-btn" onClick={() => {
                  trackEvent({ eventName:'activity_apply_click', targetType:'button', targetLabel:slug })
                  window.location.href = `/apply/activities/${slug}`
                }}>{applyLabel}</button>
                <button className="feed-action" onClick={() => window.location.href='/activities'}>{backLabel}</button>
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
          <div className="feed-divider">{prepLabel}</div>
          {prepItems.map((item, i) => (
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
  const { lang } = useLang()
  const t = useT()
  if (slug) return <ActivityDetail slug={slug} />

  const withDday = activities.map(a => ({ ...a, dday: getDday(a.dateIso) }))

  const endedLabel = lang === 'en' ? 'Ended' : lang === 'fr' ? 'Terminé' : '종료'
  const schedTitle = lang === 'en' ? 'September Schedule' : lang === 'fr' ? 'Programme de septembre' : '9월 일정'
  const miniLabel  = lang === 'en' ? 'What is Mini HAKKYO?' : lang === 'fr' ? 'C\'est quoi Mini HAKKYO ?' : 'Mini HAKKYO란?'
  const ctaTitle   = lang === 'en' ? 'Meet new people in Montréal' : lang === 'fr' ? 'Rencontrez de nouvelles personnes à Montréal' : '몬트리올에서 새로운 사람을 만나요'
  const ctaBody    = lang === 'en' ? 'Connect with people spending time in the same city.' : lang === 'fr' ? 'Rencontrez des personnes qui vivent le même moment dans la même ville.' : '같은 도시에서 새로운 시간을 보내는 사람들과 연결돼요.'
  const ctaBtn     = lang === 'en' ? '🤝 Join the Community' : lang === 'fr' ? '🤝 Rejoindre la communauté' : '🤝 커뮤니티 참여하기'

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
            <div className="feed-pin-bar">📌 {miniLabel}</div>
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

          <div className="feed-divider">{schedTitle}</div>

          {/* Activity cards */}
          {withDday.map(a => {
            const aa = a as any
            const ddLabel = a.dday === 0 ? t.home.today : a.dday === 1 ? t.home.tomorrow : a.dday < 0 ? endedLabel : `D-${a.dday}`
            const actName = lang === 'en' ? a.en : lang === 'fr' ? a.fr : a.ko
            const actNote = lang === 'en' ? (aa.noteEn || a.en) : lang === 'fr' ? (aa.noteFr || a.fr) : aa.note
            const actDate = lang === 'en' ? aa.dateEn : lang === 'fr' ? aa.dateFr : aa.date
            const actDay  = lang === 'en' ? aa.dayEn  : lang === 'fr' ? aa.dayFr  : aa.day
            const actTime = lang === 'en' ? aa.timeEn : lang === 'fr' ? aa.timeFr : aa.time
            const yearPfx = lang === 'ko' ? '2026년 ' : '2026 '
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
                  <div className="feed-event-title">{actName}</div>
                  <div className="feed-event-meta">
                    {yearPfx}{actDate} ({actDay}) · {actTime} · w/ {aa.host} · {aa.entry}
                  </div>
                  <div className="feed-event-meta" style={{ marginTop:3 }}>{actNote}</div>
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
              <div className="feed-title">{ctaTitle}</div>
              <div className="feed-body"><p>{ctaBody}</p></div>
              <div className="feed-footer">
                <button className="feed-action subscribed" onClick={() => window.location.href='/apply/community'}>
                  {ctaBtn}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
