import { useState, useEffect } from 'react'
import { Arrow } from '../components/HakkyoStatus'
import { getNotices } from '../lib/db'
import type { Notice } from '../types'

// ─── Fallback hardcoded posts (shown when Supabase not connected) ──────────────
const FALLBACK_NOTICES: Notice[] = [
  {
    id: 'f1', date: '2026-08-05', type: 'notice', is_pinned: true,
    title_ko: '4기 언어 프로그램은 10월에 시작합니다', title_en: '', title_fr: '',
    body_ko: '<p>HAKKYO 4기 언어 프로그램(한국어·영어·불어)은 <strong>2026년 10월</strong>부터 시작할 예정이에요.</p><p>수강료와 세부 일정은 확정되는 즉시, 소식 신청자에게 이메일로 먼저 안내드릴게요. 지금 소식 신청을 해두시면 모집이 열리는 순간 가장 먼저 연락드려요.</p>', body_en: '', body_fr: '',
  },
  {
    id: 'f2', date: '2026-08-01', type: 'event',
    title_ko: '9월, Mini HAKKYO 시리즈를 시작합니다', title_en: '', title_fr: '',
    body_ko: '<p>HAKKYO의 새로운 시리즈 <strong>Mini HAKKYO</strong>가 9월 수요일마다 열려요.</p><ul><li><strong>Book Club</strong> — Language Exchange w/ Joy · 9월 9일 수 · 오후 7:00–8:30</li><li><strong>Running Club</strong> — Language Exchange w/ Joo · 9월 16일 수 · 오후 6:00–7:30</li><li><strong>Boardgame Club</strong> — Language Exchange w/ Jaehee · 9월 23일 수 · 오후 7:00–8:30</li></ul><p>수업을 듣지 않아도 참여할 수 있어요. 참가비 $10 · 장소는 신청자에게 별도 안내드려요.</p>', body_en: '', body_fr: '',
  },
  {
    id: 'f3', date: '2026-07-26', type: 'notice',
    title_ko: 'HAKKYO 3기를 함께해 주셔서 감사합니다', title_en: '', title_fr: '',
    body_ko: '<p>3기 수업이 마무리됐어요. 함께해 주신 모든 분들께 진심으로 감사드립니다.</p><p>처음엔 어색했던 표현이 조금씩 자연스러워지고, 서로 다른 배경의 사람들이 같은 언어로 웃을 수 있었던 시간이었어요. 그 순간들이 오래 기억에 남을 것 같아요.</p><p>4기는 2026년 10월 시작 예정이에요. 3기에 함께하셨던 분들, 그리고 새롭게 합류하실 분들 모두 기다리고 있을게요. 🤍</p>', body_en: '', body_fr: '',
  },
  {
    id: 'f4', date: '2026-05-10', type: 'notice',
    title_ko: 'HAKKYO 3기 모집을 시작합니다', title_en: '', title_fr: '',
    body_ko: '<p>안녕하세요, HAKKYO입니다.</p><p><strong>2026년 5월, HAKKYO 3기 언어 프로그램</strong> 모집을 시작해요.</p><ul><li>한국어 클래스 (Korean Class)</li><li>영어 클래스 (English Class)</li><li>불어 클래스 (French Class)</li><li>Active Output — 배운 언어를 실제로 말해보는 시간</li></ul><p>HAKKYO는 시험이나 점수가 아닌, <strong>오늘 써볼 수 있는 말</strong>을 배우는 곳이에요. 함께 이야기하다 보면 어느새 표현이 입 밖으로 나오는 경험을 드리고 싶어요.</p><p>몬트리올에 있는 분이라면 누구나 신청할 수 있어요. 언어 실력은 상관없어요. 말해보고 싶다는 마음이면 충분합니다.</p>', body_en: '', body_fr: '',
  },
]

const TYPE_LABEL: Record<string, string> = {
  notice: 'HAKKYO',
  event:  'EVENT',
  hiring: 'COMMUNITY',
}
const TYPE_COLOR: Record<string, string> = {
  notice: '#f0eee8',
  event:  '#fff8d6',
  hiring: '#e8f4e8',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function NewBoard() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    getNotices()
      .then(data => setNotices(data.length > 0 ? data : FALLBACK_NOTICES))
      .catch(() => setNotices(FALLBACK_NOTICES))
      .finally(() => setLoading(false))
  }, [])

  const sorted = [...notices].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  return (
    <>
      <section className="board-hero section-pad">
        <span className="board-eyebrow">05 — NOTICE BOARD</span>
        <h1 className="board-hero-title">HAKKYO 소식</h1>
        <p className="board-hero-sub">프로그램 모집, 액티비티 일정, 그리고 함께한 시간들의 기록이에요.</p>
      </section>

      <section className="board-list section-pad">
        {loading && (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            불러오는 중…
          </div>
        )}

        {!loading && sorted.map(n => {
          const body = n.body_ko || n.body_en || ''
          const title = n.title_ko || n.title_en || ''
          const isOpen = open === n.id
          const preview = body
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 80) + (body.length > 80 ? '…' : '')

          return (
            <article
              key={n.id}
              className={`board-card ${isOpen ? 'board-card--open' : ''} ${n.is_pinned ? 'board-card--featured' : ''}`}
            >
              <button
                className="board-card-head"
                onClick={() => setOpen(isOpen ? null : n.id)}
              >
                <div className="board-card-meta">
                  <span className="board-tag" style={{ background: TYPE_COLOR[n.type] ?? '#f0eee8' }}>
                    {TYPE_LABEL[n.type] ?? n.type}
                  </span>
                  {n.is_pinned && (
                    <span className="board-pin">📌 최신</span>
                  )}
                  <time className="board-date">{formatDate(n.date)}</time>
                </div>
                <h2 className="board-card-title">{title}</h2>
                {preview && <p className="board-card-preview">{preview}</p>}
                <span className={`board-toggle ${isOpen ? 'board-toggle--open' : ''}`}>
                  <Arrow />
                </span>
              </button>

              {isOpen && (
                <div className="board-card-body">
                  {n.image_url && (
                    <img
                      src={n.image_url}
                      alt=""
                      className="board-card-image"
                    />
                  )}
                  <div
                    className="board-card-content"
                    dangerouslySetInnerHTML={{ __html: body }}
                  />
                  <div className="board-card-links">
                    {n.location_name && (
                      <a
                        className="board-detail-link"
                        href={n.map_url ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        📍 {n.location_name}
                      </a>
                    )}
                    {n.external_url && (
                      <a
                        className="board-detail-link"
                        href={n.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        자세히 보기 <Arrow />
                      </a>
                    )}
                    {n.instagram_url && (
                      <a
                        className="board-detail-link"
                        href={n.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Instagram <Arrow />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </section>

      <section className="board-footer-cta section-pad">
        <div className="board-footer-inner">
          <div>
            <p className="board-footer-label">NEWSLETTER</p>
            <h2 className="board-footer-title">4기 소식을 가장 먼저<br />받아보고 싶으신가요?</h2>
            <p className="board-footer-sub">모집 일정과 시간표가 정해지면 이메일로 먼저 알려드려요.</p>
          </div>
          <a className="cta" href="/#notify">소식 신청하기 <Arrow /></a>
        </div>
      </section>
    </>
  )
}
