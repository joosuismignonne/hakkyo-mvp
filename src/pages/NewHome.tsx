import { useState, useEffect } from 'react'
import { programs, activities } from '../data/hakkyo'
import { getNotices } from '../lib/db'
import type { Notice } from '../types'
import { useLang, useT, pick } from '../lib/lang'
import { HeaderSearch } from '../components/CommunityLayout'

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

export default function NewHome() {
  const [notices, setNotices] = useState<Notice[]>(FALLBACK)
  const t = useT()

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
        <div className="ch-header-right">
          <HeaderSearch />
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

          <div className="feed-divider">{t.home.reviewSection}</div>
          {[
            { name:'Minji K.', avatar:'🇰🇷', tag:'KOREAN', quote:'처음엔 주문도 못 했는데 이제 카페에서 한국어로 수다 떨어요.', label:'한국어 3기' },
            { name:'Lucas B.', avatar:'🇨🇦', tag:'FRENCH', quote:'Montréal에 살면서도 프랑스어가 두려웠는데, 여기서 처음으로 틀려도 괜찮다는 걸 느꼈어요.', label:'불어 2기' },
            { name:'Yuna S.',  avatar:'🇰🇷', tag:'ENGLISH', quote:'영어 말할 때 머릿속에선 있는데 입이 안 열렸는데, 여기서 바뀌었어요.', label:'영어 3기' },
          ].map((r, i) => (
            <div key={i} className="feed-card review-card">
              <div className="feed-card-inner">
                <div className="feed-meta">
                  <div className="feed-avatar review-avatar">{r.avatar}</div>
                  <div className="feed-meta-text">
                    <span className="feed-author">{r.name}</span>
                    <span className="feed-time">{r.label}</span>
                  </div>
                  <span className="feed-tag">{r.tag}</span>
                </div>
                <div className="review-quote">"{r.quote}"</div>
              </div>
            </div>
          ))}

          {rest.length > 0 && <div className="feed-divider">{t.home.noticeSection}</div>}
          {rest.map(n => <NoticeCard key={n.id} n={n} />)}

        </div>
      </div>
    </div>
  )
}
