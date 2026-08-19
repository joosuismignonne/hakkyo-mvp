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

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function NewHome() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="hero hero-calm section-pad">
        <div className="flower-confetti" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, i) => <i key={i} />)}
        </div>
        <div className="hero-stage">
          <div className="hero-copy">
            <p className="hero-where">Montréal Learning Community</p>
            <h1>말이 잘 안 돼도,<br /><em>여기선 괜찮아요.</em></h1>
            <p className="hero-desc">몬트리올에서 사람을 만나며 언어를 배우는 곳이에요.<br />언어 실력은 상관없어요.</p>
            <div className="hero-cta-group">
              <a className="hero-cta-card" href="/apply">
                <span className="hero-cta-label">언어 프로그램</span>
                <strong>수업 신청하기</strong>
                <small>한국어 · 영어 · 불어</small>
              </a>
              <a className="hero-cta-card" href="/activities">
                <span className="hero-cta-label">Mini HAKKYO</span>
                <strong>9월 참여하기</strong>
                <small>북클럽 · 러닝 · 보드게임</small>
              </a>
              <a className="hero-cta-card" href="/apply/community">
                <span className="hero-cta-label">커뮤니티</span>
                <strong>함께하기</strong>
                <small>매주 일요일 오후</small>
              </a>
            </div>
          </div>
          <div className="mimi mimi-natural" aria-label="HAKKYO 포스터의 까만 고양이 마스코트">
            <img className="mimi-character" src="/mascot/mimi-poster-v3.png" alt="" />
            <span className="cat-name">HAKKYO CAT · MIMI</span>
          </div>
        </div>
      </section>

      {/* ── 최신 공지 배너 ── */}
      <LatestNoticeBanner />

      {/* ── 프로그램 ── */}
      <section className="home-programs section-pad">
        <h2 className="home-section-title">수업은 이렇게 나뉘어요</h2>
        <p className="home-programs-sub">각 언어마다 소수로 진행해요. 잘해야 오는 게 아니라, 말해보고 싶은 마음이면 충분해요.</p>
        <div className="home-program-cards">
          {programs.slice(0, 3).map(p => (
            <a href={p.href} key={p.en} className="home-program-card">
              <b className="home-program-mark">{p.mark}</b>
              <div>
                <strong>{p.lang}</strong>
                <span>{p.audience}</span>
              </div>
              <p>{p.scene}</p>
              <em>자세히 보기 →</em>
            </a>
          ))}
        </div>
      </section>

      {/* ── Mini HAKKYO ── */}
      <section className="home-mini section-pad">
        <div className="home-mini-head">
          <div>
            <p className="home-mini-eyebrow">9월 수요일 시리즈</p>
            <h2>수업 없이도<br />만날 수 있어요.</h2>
            <p>북클럽・러닝클럽・보드게임클럽 — 매주 수요일 저녁, 편하게 와서 이야기해요. 수강생 아니어도 괜찮아요.</p>
            <a className="home-mini-btn" href="/activities">일정 보기 →</a>
          </div>
          <div className="home-mini-list">
            {activities.map(a => (
              <a href={`/activities/${a.slug}`} key={a.code} className="home-mini-row">
                <span className="home-mini-date">{(a as any).date}</span>
                <div>
                  <strong>{a.ko}</strong>
                  <small>w/ {(a as any).host} · {(a as any).time}</small>
                </div>
                <Arrow />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── 운영자 한마디 ── */}
      <div className="home-note section-pad">
        <blockquote className="home-note-quote">
          "몬트리올에 처음 왔을 때, 언어보다 사람이 더 필요했어요.<br />
          HAKKYO는 그때 있었으면 했던 곳이에요."
        </blockquote>
        <cite className="home-note-cite">— Joo, HAKKYO 운영자</cite>
      </div>

      {/* ── 정착 가이드 ── */}
      <section className="home-settling section-pad">
        <div className="home-settling-inner">
          <div>
            <h2>처음엔 다들<br />막막하더라고요.</h2>
            <p>렌트, 교통, 동네 — 몬트리올에서 살면서 막막했던 것들을 한 곳에 모았어요.</p>
          </div>
          <a href="/settling" className="home-settling-link">정착 가이드 보기 →</a>
        </div>
      </section>

      {/* ── 뉴스레터 ── */}
      <NewsletterForm />
    </>
  )
}
