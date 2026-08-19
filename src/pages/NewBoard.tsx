import { useState } from 'react'
import { Arrow } from '../components/HakkyoStatus'

interface Post {
  date: string
  tag: string
  tagColor?: string
  title: string
  preview: string
  body: React.ReactNode
  cta?: { label: string; href: string }
  featured?: boolean
}

const posts: Post[] = [
  {
    date: "2026.08.05",
    tag: "PROGRAM",
    tagColor: "#e8f4e8",
    featured: true,
    title: "4기 언어 프로그램은 10월에 시작합니다",
    preview: "HAKKYO 4기 한국어·영어·불어 프로그램이 2026년 10월부터 시작해요.",
    body: (
      <div>
        <p>HAKKYO 4기 언어 프로그램(한국어·영어·불어)은 <strong>2026년 10월</strong>부터 시작할 예정이에요.</p>
        <p>수강료와 세부 일정은 확정되는 즉시, 소식 신청자에게 이메일로 먼저 안내드릴게요. 지금 소식 신청을 해두시면 모집이 열리는 순간 가장 먼저 연락드려요.</p>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>3기에 함께해 주셨던 분들도, 처음 합류하시는 분들도 모두 기다리고 있을게요.</p>
      </div>
    ),
    cta: { label: "소식 신청하기", href: "/#notify" },
  },
  {
    date: "2026.08.01",
    tag: "MINI HAKKYO",
    tagColor: "#fff8d6",
    title: "9월, Mini HAKKYO 시리즈를 시작합니다",
    preview: "9월 수요일마다 북클럽·러닝클럽·보드게임클럽이 열려요.",
    body: (
      <div>
        <p>HAKKYO의 새로운 시리즈 <strong>Mini HAKKYO</strong>가 9월 수요일마다 열려요. 잘하려고 오는 게 아니에요. 같이 하다 보면 말이 나오는 시간이에요.</p>
        <ul>
          <li><strong>Book Club</strong> — Language Exchange w/ Joy · 9월 9일 수 · 오후 7:00–8:30</li>
          <li><strong>Running Club</strong> — Language Exchange w/ Joo · 9월 16일 수 · 오후 6:00–7:30</li>
          <li><strong>Boardgame Club</strong> — Language Exchange w/ Jaehee · 9월 23일 수 · 오후 7:00–8:30</li>
        </ul>
        <p>수업을 듣지 않아도 참여할 수 있어요. 참가비 $10 · 장소는 신청자에게 개별 안내드려요.</p>
      </div>
    ),
    cta: { label: "액티비티 보기", href: "/activities" },
  },
  {
    date: "2026.07.26",
    tag: "HAKKYO",
    tagColor: "#f0eee8",
    title: "HAKKYO 3기를 함께해 주셔서 감사합니다",
    preview: "3기 수업이 끝났어요. 함께해 주신 모든 분들께 진심으로 감사드려요.",
    body: (
      <div>
        <p>3기 수업이 마무리됐어요. 함께해 주신 모든 분들께 진심으로 감사드립니다.</p>
        <p>처음엔 어색했던 표현이 조금씩 자연스러워지고, 서로 다른 배경의 사람들이 같은 언어로 웃을 수 있었던 시간이었어요. 그 순간들이 오래 기억에 남을 것 같아요.</p>
        <p>4기는 2026년 10월 시작 예정이에요. 3기에 함께하셨던 분들, 그리고 새롭게 합류하실 분들 모두 기다리고 있을게요. 🤍</p>
      </div>
    ),
  },
  {
    date: "2026.05.10",
    tag: "HAKKYO",
    tagColor: "#f0eee8",
    title: "HAKKYO 3기 모집을 시작합니다",
    preview: "2026년 5월, HAKKYO 3기 언어 프로그램 모집을 시작해요.",
    body: (
      <div>
        <p>안녕하세요, HAKKYO입니다.</p>
        <p><strong>2026년 5월, HAKKYO 3기 언어 프로그램</strong> 모집을 시작해요.</p>
        <ul>
          <li>한국어 클래스 (Korean Class)</li>
          <li>영어 클래스 (English Class)</li>
          <li>불어 클래스 (French Class)</li>
          <li>Active Output — 배운 언어를 실제로 말해보는 시간</li>
        </ul>
        <p>HAKKYO는 시험이나 점수가 아닌, <strong>오늘 써볼 수 있는 말</strong>을 배우는 곳이에요. 함께 이야기하다 보면 어느새 표현이 입 밖으로 나오는 경험을 드리고 싶어요.</p>
        <p>몬트리올에 있는 분이라면 누구나 신청할 수 있어요. 언어 실력은 상관없어요. 말해보고 싶다는 마음이면 충분합니다.</p>
      </div>
    ),
    cta: { label: "소식 신청하기", href: "/#notify" },
  },
]

const TAG_LABELS: Record<string, string> = {
  "PROGRAM": "프로그램",
  "MINI HAKKYO": "Mini HAKKYO",
  "HAKKYO": "HAKKYO",
}

export default function NewBoard() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <>
      <section className="board-hero section-pad">
        <div className="board-hero-inner">
          <span className="board-eyebrow">05 — NOTICE BOARD</span>
          <h1 className="board-hero-title">HAKKYO 소식</h1>
          <p className="board-hero-sub">프로그램 모집, 액티비티 일정, 그리고 함께한 시간들의 기록이에요.</p>
        </div>
      </section>

      <section className="board-list section-pad">
        {posts.map((p, i) => (
          <article
            key={p.title}
            className={`board-card ${open === i ? 'board-card--open' : ''} ${p.featured ? 'board-card--featured' : ''}`}
          >
            <button
              className="board-card-head"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <div className="board-card-meta">
                <span
                  className="board-tag"
                  style={{ background: p.tagColor ?? '#f0eee8' }}
                >
                  {TAG_LABELS[p.tag] ?? p.tag}
                </span>
                <time className="board-date">{p.date}</time>
              </div>
              <h2 className="board-card-title">{p.title}</h2>
              <p className="board-card-preview">{p.preview}</p>
              <span className={`board-toggle ${open === i ? 'board-toggle--open' : ''}`}>
                <Arrow />
              </span>
            </button>

            {open === i && (
              <div className="board-card-body">
                <div className="board-card-content">{p.body}</div>
                {p.cta && (
                  <a className="cta" href={p.cta.href} style={{ marginTop: 20 }}>
                    {p.cta.label} <Arrow />
                  </a>
                )}
              </div>
            )}
          </article>
        ))}
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
