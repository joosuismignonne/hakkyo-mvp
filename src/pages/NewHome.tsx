import { useState, useEffect } from 'react'
import Status, { Arrow } from '../components/HakkyoStatus'
import { programs, activities } from '../data/hakkyo'
import { submitApplication } from '../lib/hakkyoApi'
import { trackEvent } from '../lib/analytics'
import { getNotices } from '../lib/db'
import type { Notice } from '../types'

const TYPE_LABEL: Record<string, string> = { notice: 'HAKKYO', event: 'EVENT', hiring: 'COMMUNITY' }

const FALLBACK: Notice[] = [
  { id:'f1', date:'2026-08-05', type:'notice', is_pinned:true,  title_ko:'4기 언어 프로그램은 10월에 시작합니다', title_en:'', title_fr:'', body_ko:'', body_en:'', body_fr:'' },
  { id:'f2', date:'2026-08-01', type:'event',                   title_ko:'9월, Mini HAKKYO 시리즈를 시작합니다', title_en:'', title_fr:'', body_ko:'', body_en:'', body_fr:'' },
  { id:'f3', date:'2026-07-26', type:'notice',                  title_ko:'HAKKYO 3기를 함께해 주셔서 감사합니다', title_en:'', title_fr:'', body_ko:'', body_en:'', body_fr:'' },
]

function HomeBoardSection() {
  const [notices, setNotices] = useState<Notice[]>(FALLBACK)

  useEffect(() => {
    getNotices()
      .then(data => { if (data.length > 0) setNotices(data) })
      .catch(() => {})
  }, [])

  const top3 = [...notices]
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
    .slice(0, 3)

  return (
    <section className="home-board section-pad">
      <div>
        <span className="section-label">NOTICE BOARD</span>
        <h2>놓치지 말아야 할<br />HAKKYO 공지</h2>
        <p className="board-intro">프로그램 모집, 액티비티 일정과 운영 소식을 가장 먼저 확인하세요.</p>
        <a className="text-link" href="/board">공지 게시판 바로가기 <Arrow /></a>
      </div>
      <div className="home-board-list">
        {top3.map(n => {
          const d = new Date(n.date)
          const label = `${String(d.getMonth() + 1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
          return (
            <a href="/board" key={n.id}>
              <small>{label}</small>
              <span className="notice-tag">{TYPE_LABEL[n.type] ?? n.type}</span>
              <strong>{n.title_ko || n.title_en}</strong>
              <Arrow />
            </a>
          )
        })}
      </div>
    </section>
  )
}

function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(false)
    try {
      await submitApplication({ kind: 'newsletter', selection: 'SESSION 04 NEWS', email })
      trackEvent({ eventName: 'newsletter_submitted', targetType: 'form', targetLabel: 'home' })
      setDone(true)
    } catch {
      setError(true)
    }
  }

  return (
    <section id="notify" className="newsletter section-pad">
      <div>
        <Status>SESSION 04 NEWS</Status>
        <h2>4기 소식을<br />가장 먼저 받아보세요.</h2>
        <p>모집 일정과 시간표가 정해지면 입력한 이메일로 먼저 알려드릴게요.</p>
      </div>
      {done ? (
        <strong className="newsletter-success">신청됐어요. 곧 이메일로 만나요.</strong>
      ) : (
        <form onSubmit={submit}>
          <label>
            <span>EMAIL</span>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
          </label>
          <button className="cta">소식 신청하기 <Arrow /></button>
          {error && <p>잠시 후 다시 시도해 주세요.</p>}
        </form>
      )}
    </section>
  )
}

export default function NewHome() {
  return (
    <>
      <section className="hero hero-calm section-pad">
        <div className="hero-top">
          <div className="eyebrow">FIRST LISTENER · LEARNING COMMUNITY · MONTRÉAL</div>
        </div>
        <div className="flower-confetti" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, i) => <i key={i} />)}
        </div>
        <div className="hero-stage">
          <div className="hero-copy">
            <h1>How do we help people<br /><em>build real relationships</em><br />through language?</h1>
            <p>사람을 만나며 언어를 배우는 Montréal Learning Community</p>
          </div>
          <div className="mimi mimi-natural" aria-label="HAKKYO 포스터의 까만 고양이 마스코트">
            <img className="mimi-character" src="/mascot/mimi-poster-v3.png" alt="" />
            <span className="cat-name">HAKKYO CAT · MIMI</span>
          </div>
        </div>
        <div className="hero-bottom">
          <p>사람은 낯선 도시에서 어떻게 배우고, 연결되고, 자기 삶을 만들어가는가. HAKKYO는 그 질문에서 시작한 Montréal Learning Community입니다.</p>
          <div className="hero-actions">
            <a className="hero-button" href="/programs">함께할 시간 보기 <Arrow /></a>
          </div>
        </div>
      </section>


      <section className="program-strip home-programs section-pad">
        <div className="section-head">
          <span>LANGUAGE EXPERIENCES · SESSION 04</span>
          <a href="/programs">모든 프로그램 보기 <Arrow /></a>
        </div>
        <div className="program-intro">
          <h2>사람을 만나며<br />어떤 언어를 써볼까요?</h2>
          <p>모두가 자신의 속도로 말하고, 서로의 이야기를 들으며, 언어를 삶 속에서 사용하도록 시간을 설계합니다.</p>
        </div>
        <div className="program-grid">
          {programs.slice(0, 3).map((p, i) => (
            <a href={p.href} className="program" key={p.en}>
              <div className="program-card-top">
                <span>0{i + 1}</span>
                <span>{p.en.toUpperCase()}</span>
              </div>
              <b>{p.mark}</b>
              <h3>{p.lang}</h3>
              <p className="program-name">{p.en} / {p.fr}</p>
              <p className="program-audience">{p.audience}</p>
              <span className="program-link">자세히 보기 <Arrow /></span>
            </a>
          ))}
        </div>
      </section>

      <section className="wed section-pad">
        <div className="wed-feature">
          <div className="new-badge">
            <small>NEW</small>
            <strong>09</strong>
            <span>SEPTEMBER</span>
          </div>
          <div>
            <Status>MINI HAKKYO · LANGUAGE EXCHANGE</Status>
            <h2>같이 하다 보면<br />말이 나옵니다.</h2>
            <p>북클럽, 러닝클럽, 보드게임클럽 — 각 클럽은 Language Exchange와 함께 진행되는 Mini HAKKYO 시리즈예요. 잘하려고 오는 곳이 아니에요.</p>
            <a className="cta wed-cta" href="/activities">Mini HAKKYO 보기 <Arrow /></a>
          </div>
        </div>
        <div className="wed-list">
          {activities.map(a => (
            <a href={`/activities/${a.slug}`} key={a.code}>
              <small>{a.code}</small>
              <strong>{a.ko}</strong>
              <span>{a.en}</span>
              <Arrow />
            </a>
          ))}
        </div>
      </section>

      <HomeBoardSection />

      <section className="city-note section-pad">
        <span>MONTRÉAL NOTE · 001</span>
        <h2>처음 도착한 날부터<br />조금 익숙해지는 날까지</h2>
        <a href="/settling">몬트리올 정착 가이드 보기 <Arrow /></a>
      </section>

      <section className="community-cta section-pad">
        <div className="community-cta-inner">
          <div>
            <span style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700 }}>HAKKYO COMMUNITY</span>
            <h2>HAKKYO 커뮤니티에<br />함께하세요.</h2>
            <p>매주 일요일 오후, 수업 안의 Active Output 시간을 함께 해요. 언어를 배우는 사람들과 같은 공간에서 실제로 말하고, 연결되는 시간입니다.</p>
          </div>
          <a className="cta" href="/apply/community">커뮤니티 참여하기 <Arrow /></a>
        </div>
      </section>

      <NewsletterForm />
    </>
  )
}
