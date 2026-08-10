import { useState } from 'react'
import Status, { Arrow } from '../components/HakkyoStatus'
import { programs, activities } from '../data/hakkyo'
import { submitApplication } from '../lib/hakkyoApi'
import { trackEvent } from '../lib/analytics'

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
            <h1>같이 듣고,<br /><em>같이 말해요!</em></h1>
            <p>Every new language begins with a First Listener<br />사람을 만나며 언어를 배우는 Montréal Learning Community</p>
          </div>
          <div className="mimi mimi-natural" aria-label="HAKKYO 포스터의 까만 고양이 마스코트">
            <img className="mimi-character" src="/mascot/mimi-poster-v3.png" alt="" />
            <span className="cat-name">HAKKYO CAT · MIMI</span>
          </div>
        </div>
        <div className="hero-bottom">
          <p>HAKKYO는 사람들이 서로 만나며 자연스럽게 언어를 사용하는 시간을 설계하는 Learning Community입니다. 우리는 사람이 언어를 배우기 전에 먼저 말할 용기를 얻는다고 믿습니다.</p>
          <div className="hero-actions">
            <a className="hero-button" href="/programs">함께할 시간 보기 <Arrow /></a>
          </div>
        </div>
      </section>

      <section id="first-listener" className="announcement first-listener-intro section-pad">
        <div>
          <div className="upcoming-lockup">
            <Status>OUR FIRST PRINCIPLE</Status>
            <span>FIRST LISTENER</span>
          </div>
          <h2>새로운 언어는<br />첫 번째 청취자에서<br />시작됩니다.</h2>
        </div>
        <div className="announcement-copy">
          <p className="lead">First Listener는 언어를 가장 잘하는 사람이 아니라, 가장 먼저 들어주는 사람입니다.</p>
          <p>그들은 틀린 문장을 먼저 찾지 않습니다. 말하고자 하는 마음을 먼저 이해합니다. 설명하기보다 질문하고, 평가하기보다 기다리며, 정답을 알려주기보다 대화를 이어 갑니다.</p>
          <a className="cta" href="/apply/community/join">나의 첫 대화 시작하기 <Arrow /></a>
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
            <Status>SHARED EXPERIENCES</Status>
            <h2>함께한 경험이<br />우리의 언어가 됩니다.</h2>
            <p>함께 걷고, 만들고, 먹고, 이야기하는 시간. 무엇을 가르칠지보다 어떤 경험을 함께할지 먼저 고민한 HAKKYO 액티비티입니다.</p>
            <a className="cta wed-cta" href="/activities">함께할 경험 보기 <Arrow /></a>
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

      <section className="home-board section-pad">
        <div>
          <span className="section-label">NOTICE BOARD</span>
          <h2>놓치지 말아야 할<br />HAKKYO 공지</h2>
          <p className="board-intro">프로그램 모집, 액티비티 일정과 운영 소식을 가장 먼저 확인하세요.</p>
          <a className="text-link" href="/board">공지 게시판 바로가기 <Arrow /></a>
        </div>
        <div className="home-board-list">
          {[
            ["08.05", "PROGRAM", "4기 언어 프로그램은 10월에 시작합니다"],
            ["08.01", "ACTIVITY", "9월, 수요일 액티비티를 시작합니다"],
            ["07.26", "HAKKYO", "HAKKYO 3기를 함께해 주셔서 감사합니다"],
          ].map((n, i) => (
            <a href="/board" key={n[2]}>
              <small>{n[0]}</small>
              <span className="notice-tag">{i === 0 ? 'PROGRAM' : i === 1 ? 'ACTIVITY' : 'HAKKYO'}</span>
              <strong>{n[2]}</strong>
              <Arrow />
            </a>
          ))}
        </div>
      </section>

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
            <p>언어 수업, 수요일 액티비티, 몬트리올 정착 정보까지 — 같은 도시에서 새로운 시간을 보내는 사람들과 연결돼요.</p>
          </div>
          <a className="cta" href="/apply/community">커뮤니티 참여하기 <Arrow /></a>
        </div>
      </section>

      <NewsletterForm />
    </>
  )
}
