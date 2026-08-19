import { useState, useEffect } from 'react'
import { Arrow } from '../components/HakkyoStatus'
import { programs, activities } from '../data/hakkyo'
import { submitApplication } from '../lib/hakkyoApi'
import { trackEvent } from '../lib/analytics'
import { getNotices } from '../lib/db'
import type { Notice } from '../types'

// ─── Latest notice ticker ──────────────────────────────────────────────────────
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
        const latest = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
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

// ─── D-day helpers ────────────────────────────────────────────────────────────
function getDday(dateIso: string) {
  const today = new Date(); today.setHours(0,0,0,0)
  const target = new Date(dateIso); target.setHours(0,0,0,0)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

// 히어로 안에 들어가는 다음 일정 블록
function HeroNextEvent() {
  const upcoming = activities
    .map(a => ({ ...a, dday: getDday(a.dateIso) }))
    .filter(a => a.dday >= 0)
    .sort((a, b) => a.dday - b.dday)

  const next = upcoming[0]
  if (!next) return null

  const ddayLabel = next.dday === 0 ? '오늘' : next.dday === 1 ? '내일' : `D-${next.dday}`

  return (
    <a href={`/activities/${next.slug}`} className="hero-next-block">
      <div className="hero-next-dday">{ddayLabel}</div>
      <div className="hero-next-body">
        <strong>{next.ko}</strong>
        <span>{next.date} ({next.day}) · {next.time} · w/ {next.host}</span>
      </div>
      <span className="hero-next-arrow">→</span>
    </a>
  )
}

// ─── Notice feed cards ────────────────────────────────────────────────────────
const FALLBACK_FEED: Notice[] = [
  {
    id: 'f1', date: '2026-08-05', type: 'notice', is_pinned: true,
    title_ko: '4기 언어 프로그램은 10월에 시작합니다',
    title_en: '', title_fr: '',
    body_ko: 'HAKKYO 4기 언어 프로그램(한국어·영어·불어)은 2026년 10월부터 시작할 예정이에요.',
    body_en: '', body_fr: '',
  },
  {
    id: 'f2', date: '2026-08-01', type: 'event',
    title_ko: '9월, Mini HAKKYO 시리즈를 시작합니다',
    title_en: '', title_fr: '',
    body_ko: '북클럽, 러닝클럽, 보드게임클럽 — 9월 매주 수요일 저녁에 만나요.',
    body_en: '', body_fr: '',
  },
  {
    id: 'f3', date: '2026-07-26', type: 'notice',
    title_ko: 'HAKKYO 3기를 함께해 주셔서 감사합니다',
    title_en: '', title_fr: '',
    body_ko: '3기 수업이 마무리됐어요. 함께해 주신 모든 분들께 진심으로 감사드립니다.',
    body_en: '', body_fr: '',
  },
]

const TYPE_COLOR: Record<string, string> = {
  notice: '#f0eee8',
  event: '#fff8d6',
  hiring: '#e8f4e8',
}
const TYPE_LABEL: Record<string, string> = {
  notice: 'HAKKYO',
  event: 'EVENT',
  hiring: 'COMMUNITY',
}

function formatDate(d: string) {
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return `${dt.getMonth() + 1}월 ${dt.getDate()}일`
}

function strip(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function NoticeFeed() {
  const [notices, setNotices] = useState<Notice[]>(FALLBACK_FEED)
  useEffect(() => {
    getNotices()
      .then(data => { if (data.length) setNotices(data.slice(0, 3)) })
      .catch(() => {})
  }, [])

  return (
    <section className="home-feed section-pad">
      <div className="home-feed-head">
        <h2>최신 소식</h2>
        <a href="/board" className="home-feed-more">전체 보기 →</a>
      </div>
      <div className="home-feed-grid">
        {notices.slice(0, 3).map(n => {
          const preview = strip(n.body_ko || n.body_en || '').slice(0, 90)
          return (
            <a href="/board" key={n.id} className="home-feed-card">
              <div className="home-feed-card-top">
                <span className="home-feed-tag" style={{ background: TYPE_COLOR[n.type] ?? '#f0eee8' }}>
                  {TYPE_LABEL[n.type] ?? n.type}
                </span>
                {n.is_pinned && <span className="home-feed-pin">📌</span>}
                <time className="home-feed-date">{formatDate(n.date)}</time>
              </div>
              <strong className="home-feed-title">{n.title_ko || n.title_en}</strong>
              {preview && <p className="home-feed-preview">{preview}…</p>}
            </a>
          )
        })}
      </div>
    </section>
  )
}

// ─── Newsletter ───────────────────────────────────────────────────────────────
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
        <h2>4기 소식을<br />가장 먼저 받아보세요.</h2>
        <p>모집 일정이 정해지면 이메일로 먼저 알려드려요.</p>
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
            <p className="hero-where">Montréal Learning Community · 2026</p>

            {/* 다음 일정 인라인 */}
            <HeroNextEvent />

            {/* 진입 링크 */}
            <div className="hero-entry-links">
              <a href="/programs">언어 프로그램 →</a>
              <a href="/activities">Mini HAKKYO →</a>
              <a href="/apply/community">커뮤니티 신청 →</a>
            </div>
          </div>
          <div className="mimi mimi-natural" aria-label="HAKKYO 마스코트 미니">
            <img className="mimi-character" src="/mascot/mimi-poster-v3.png" alt="" />
            <span className="cat-name">HAKKYO CAT · MINI</span>
          </div>
        </div>
      </section>

      {/* ── 공지 배너 ── */}
      <LatestNoticeBanner />

      {/* ── 최신 소식 피드 ── */}
      <NoticeFeed />

      {/* ── 프로그램 진입 ── */}
      <section className="home-programs-slim section-pad">
        <h2 className="home-slim-title">언어 프로그램</h2>
        <div className="home-slim-list">
          {programs.slice(0, 3).map(p => (
            <a href={p.href} key={p.en} className="home-slim-row">
              <b>{p.mark}</b>
              <strong>{p.lang}</strong>
              <span>{p.level}</span>
              <em>→</em>
            </a>
          ))}
        </div>
      </section>

      {/* ── 뉴스레터 ── */}
      <NewsletterForm />
    </>
  )
}
