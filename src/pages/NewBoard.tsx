import { useState } from 'react'
import { Arrow } from '../components/HakkyoStatus'

function PageTitle({ no, title, sub }: { no: string; title: string; sub: string }) {
  return (
    <section className="page-title section-pad">
      <span>{no}</span><h1>{title}</h1><p>{sub}</p>
    </section>
  )
}

interface Post {
  date: string
  tag: string
  title: string
  body: string[]
}

const posts: Post[] = [
  {
    date: "2026.08.05",
    tag: "PROGRAM",
    title: "4기 언어 프로그램은 10월에 시작합니다",
    body: [
      "HAKKYO 4기 언어 프로그램(한국어·영어·불어)은 2026년 10월부터 시작할 예정입니다.",
      "수강료와 세부 일정은 확정되는 즉시 소식 신청자에게 이메일로 먼저 안내드릴게요.",
      "지금 바로 소식 신청을 해두시면 모집이 시작되는 즉시 연락드립니다.",
    ]
  },
  {
    date: "2026.08.01",
    tag: "MINI HAKKYO",
    title: "9월, Mini HAKKYO 시리즈를 시작합니다",
    body: [
      "HAKKYO의 새로운 시리즈 Mini HAKKYO가 9월 수요일마다 열려요.",
      "· Book Club — Language Exchange w/ Joy · Sep 9 · 7–8:30PM",
      "· Running Club — Language Exchange w/ Joo · Sep 16 · 6–7:30PM",
      "· Boardgame Club — Language Exchange w/ Jaehee · Sep 23 · 7–8:30PM",
      "각 클럽은 Language Exchange와 함께 진행되는 Mini HAKKYO 시리즈예요. 수업을 듣지 않아도 참여할 수 있어요. 잘하려고 오지 않아도 돼요.",
      "참가비 $10 · 장소는 신청자에게 별도 안내",
    ]
  },
  {
    date: "2026.07.26",
    tag: "HAKKYO",
    title: "HAKKYO 3기를 함께해 주셔서 감사합니다",
    body: [
      "3기 수업이 마무리됐어요. 함께해 주신 모든 분들께 진심으로 감사드립니다.",
      "처음엔 어색했던 표현이 조금씩 자연스러워지고, 서로 다른 배경의 사람들이 같은 언어로 웃을 수 있었던 시간이었어요.",
      "4기는 2026년 10월 시작 예정입니다. 3기에 함께하셨던 분들, 그리고 새롭게 합류하실 분들 모두 기다리고 있을게요.",
    ]
  },
  {
    date: "2026.05.10",
    tag: "HAKKYO",
    title: "HAKKYO 3기 모집을 시작합니다",
    body: [
      "안녕하세요, HAKKYO입니다.",
      "2026년 5월, HAKKYO 3기 언어 프로그램 모집을 시작합니다.",
      "· 한국어 클래스 (Korean Class)",
      "· 영어 클래스 (English Class)",
      "· 불어 클래스 (French Class)",
      "· Active Output — 배운 언어를 실제로 말해보는 시간",
      "HAKKYO는 시험이나 점수가 아닌, 오늘 써볼 수 있는 말을 배우는 곳이에요. 함께 이야기하다 보면 어느새 표현이 입 밖으로 나오는 경험을 드리고 싶어요.",
      "몬트리올에 있는 분이라면 누구나 신청할 수 있어요. 언어 실력은 상관없어요. 말해보고 싶다는 마음이면 충분합니다.",
      "아래 신청서를 통해 지원해 주세요. 확인 후 이메일로 연락드릴게요.",
    ]
  },
]

export default function NewBoard() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <>
      <PageTitle no="05 — NOTICE" title="HAKKYO 소식" sub="News, schedules and announcements" />
      <section className="board section-pad">
        {posts.map((p, i) => (
          <article key={p.title} className={`board-post ${open === i ? 'open' : ''}`}>
            <button onClick={() => setOpen(open === i ? null : i)}>
              <span>{p.date}</span>
              <b>{p.tag}</b>
              <h2>{p.title}</h2>
              <Arrow />
            </button>
            {open === i && (
              <div className="board-post-body">
                {p.body.map((line, j) => (
                  <p key={j}>{line}</p>
                ))}
                {i === 3 && (
                  <a className="cta" href="/apply/news" style={{ marginTop: 16 }}>소식 신청하기 <Arrow /></a>
                )}
              </div>
            )}
          </article>
        ))}
      </section>
    </>
  )
}
