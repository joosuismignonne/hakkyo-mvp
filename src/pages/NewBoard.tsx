import { Arrow } from '../components/HakkyoStatus'

function PageTitle({ no, title, sub }: { no: string; title: string; sub: string }) {
  return (
    <section className="page-title section-pad">
      <span>{no}</span><h1>{title}</h1><p>{sub}</p>
    </section>
  )
}

const notices = [
  ["2026.08.05", "PROGRAM", "4기 언어 프로그램은 10월에 시작합니다"],
  ["2026.08.01", "ACTIVITY", "9월, 수요일 액티비티를 시작합니다"],
  ["2026.07.26", "HAKKYO", "HAKKYO 3기를 함께해 주셔서 감사합니다"],
]

export default function NewBoard() {
  return (
    <>
      <PageTitle no="05 — NOTICE" title="HAKKYO 소식" sub="News, schedules and announcements" />
      <section className="board section-pad">
        {notices.map(x => (
          <a href="#" key={x[2]}>
            <span>{x[0]}</span>
            <b>{x[1]}</b>
            <h2>{x[2]}</h2>
            <Arrow />
          </a>
        ))}
      </section>
    </>
  )
}
