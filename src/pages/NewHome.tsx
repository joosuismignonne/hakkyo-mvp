import { useState, useEffect } from 'react'
import { Arrow } from '../components/HakkyoStatus'
import { programs, activities } from '../data/hakkyo'
import { submitApplication } from '../lib/hakkyoApi'
import { trackEvent } from '../lib/analytics'
import { getNotices } from '../lib/db'
import type { Notice } from '../types'

// ─── Latest notice ticker (hero 바로 아래) ─────────────────────────────────────
const FALLBACK_NOTICE: Notice = {
  id: 'f1', date: '2026-08-05', type: 'notice', is_pinned: true,
  title_ko: '4기 언어 프로그램은 10월에 시작합니다 — 소식 신청하면 가장 먼저 알려드려요',
  title_en: '', title_fr: '', body_ko: '', body_en: '', body_fr: '',
}

function LatestNoticeBanner() {
  const [notice, setNotice] = useState<Notice>(FALLBACK_NOTICE)

  useEffect(() => {
    getNotices()
      .then(data => {
        if (!data.length) return
        const pinned = data.find(n => n.is_pinned)
        const latest = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        setNotice(pinned ?? latest)
      })
      .catch(() => {})
  }, [])

  return (
    <a href="/board" className="home-latest-banner">
      <span className="home-latest-tag">NEW</span>
      <span className="home-latest-title">{notice.title_ko || notice.title_en}</span>
      <span className="home-latest-arrow"><Arrow /></span>
    </a>
  )
}

// ─── Newsletter form ───────────────────────────────────────────────────────────
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
        <p className="home-section-label">SESSION 04 NEWS</p>
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

// ─── Founder note ─────────────────────────────────────────────────────────────
function FounderNote() {
  return (
    <div className="home-founder-note">
      <p>
        "몬트리올에 처음 왔을 때, 언어보다 사람이 더 필요했어요.<br />
        HAKKYO는 그때 있었으면 했던 곳을 만들어봤어요."
      </p>
      <span>— Joo, HAKKYO 운영자</span>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function NewHome() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="hero hero-calm section-pad">
        <div className="hero-top">
          <div className="eyebrow">HAKKYO · Montréal · 2026</div>
        </div>
        <div className="flower-confetti" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, i) => <i key={i} />)}
        </div>
        <div className="hero-stage">
          <div className="hero-copy">
            <h1>말이 잘 안 돼도,<br /><em>여기선 괜찮아요.</em></h1>
            <p>몬트리올에서 사람을 만나며 언어를 배우는 곳이에요</p>
          </div>
          <div className="mimi mimi-natural" aria-label="HAKKYO 포스터의 까만 고양이 마스코트">
            <img className="mimi-character" src="/mascot/mimi-poster-v3.png" alt="" />
            <span className="cat-name">HAKKYO CAT · MIMI</span>
          </div>
        </div>
        <div className="hero-bottom">
          <p>몬트리올에서 새로운 사람을 만나고 싶은데 어디서 시작해야 할지 모르겠다면 — 여기서 시작해도 돼요. 언어 실력은 상관없어요.</p>
          <div className="hero-actions">
            <a className="hero-button" href="/programs">함께할 시간 보기 <Arrow /></a>
          </div>
        </div>
      </section>

      {/* ── 최신 공지 배너 ── */}
      <LatestNoticeBanner />

      {/* ── 운영자 한 마디 ── */}
      <FounderNote />

      {/* ── 프로그램 ── */}
      <section className="home-programs section-pad">
        <div className="home-section-head">
          <div>
            <p className="home-section-label">LANGUAGE EXPERIENCES · SESSION 04</p>
            <h2>어떤 언어로<br />시작해볼까요?</h2>
          </div>
          <a href="/programs" className="home-see-all">모든 프로그램 보기 <Arrow /></a>
        </div>
        <p className="home-programs-sub">각 언어마다 작은 커뮤니티가 있어요. 잘해야 오는 게 아니라, 말해보고 싶은 마음이면 충분해요.</p>
        <div className="home-program-list">
          {programs.slice(0, 3).map((p, i) => (
            <a href={p.href} key={p.en} className="home-program-row">
              <span className="home-program-num">0{i + 1}</span>
              <b className="home-program-mark">{p.mark}</b>
              <div className="home-program-info">
                <strong>{p.lang}</strong>
                <span>{p.en} / {p.fr}</span>
              </div>
              <p className="home-program-audience">{p.audience}</p>
              <span className="home-program-link">보기 <Arrow /></span>
            </a>
          ))}
        </div>
      </section>

      {/* ── Mini HAKKYO ── */}
      <section className="home-mini section-pad">
        <div className="home-mini-head">
          <div>
            <p className="home-section-label">MINI HAKKYO · SEPTEMBER</p>
            <h2>수요일마다<br />잠깐 만나요.</h2>
            <p>수업을 듣지 않아도 괜찮아요. 북클럽・러닝클럽・보드게임클럽 — 9월 매주 수요일, 편한 분들과 자연스럽게 이야기해요.</p>
            <a className="cta" href="/activities" style={{ marginTop: 20 }}>일정 보기 <Arrow /></a>
          </div>
          <div className="home-mini-list">
            {activities.map(a => (
              <a href={`/activities/${a.slug}`} key={a.code} className="home-mini-row">
                <small>{(a as any).date}</small>
                <strong>{a.ko}</strong>
                <span>w/ {(a as any).host}</span>
                <Arrow />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── 정착 가이드 ── */}
      <section className="home-settling section-pad">
        <div className="home-settling-inner">
          <div>
            <p className="home-section-label">MONTRÉAL NOTE · 001</p>
            <h2>처음엔 다들<br />막막하더라고요.</h2>
            <p>렌트, 교통, 동네 — 몬트리올에서 살면서 막막했던 것들을 한 곳에 모았어요. 살다 보면 도움이 될 거예요.</p>
          </div>
          <a href="/settling" className="home-settling-link">정착 가이드 보기 <Arrow /></a>
        </div>
      </section>

      {/* ── 커뮤니티 CTA ── */}
      <section className="community-cta section-pad">
        <div className="community-cta-inner">
          <div>
            <p className="home-section-label" style={{ color: 'rgba(255,255,255,.6)' }}>HAKKYO COMMUNITY</p>
            <h2>혼자 공부하는 게<br />조금 지겨워졌다면.</h2>
            <p>매주 일요일 오후, 배운 언어를 실제로 써보는 시간이에요. 말해보고 싶은 마음이면 충분해요.</p>
          </div>
          <a className="cta" href="/apply/community">커뮤니티 참여하기 <Arrow /></a>
        </div>
      </section>

      {/* ── 뉴스레터 ── */}
      <NewsletterForm />
    </>
  )
}
