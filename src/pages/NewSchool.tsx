import Status, { Arrow } from '../components/HakkyoStatus'
import { studentStories } from '../data/hakkyo'

function PageTitle({ no, title, sub }: { no: string; title: string; sub: string }) {
  return (
    <section className="page-title section-pad">
      <span>{no}</span><h1>{title}</h1><p>{sub}</p>
    </section>
  )
}

function StudentStories() {
  return (
    <section id="stories" className="student-video-stories section-pad">
      <div className="section-head">
        <span>STUDENT STORIES · VIDEO</span>
        <span>PRESS PLAY</span>
      </div>
      <div className="student-video-grid">
        {studentStories.map((x, i) => (
          <article key={x[0]} data-cursor="PLAY">
            <div className={`student-video-frame student-video-${i}`}>
              <span className="video-channel">CH 0{i + 1}</span>
              <button aria-label={`${x[2]} 학생 이야기 영상 재생`}><i style={{ fontStyle: 'normal', marginLeft: 3 }}>▶</i></button>
              <small>VIDEO INTERVIEW</small>
            </div>
            <div className="student-video-copy">
              <span>{x[0]} PROGRAM</span>
              <p>"{x[1]}"</p>
              <b>{x[2]}</b>
            </div>
          </article>
        ))}
      </div>
      <p className="video-ready-note">영상 파일이 준비되면 각 화면에 바로 연결할 수 있도록 구성했어요.</p>
    </section>
  )
}

export default function NewSchool() {
  return (
    <>
      <PageTitle no="03 — ABOUT HAKKYO" title="사람과 사람이 배우는 시간" sub="A learning community shaped by listeners" />
      <section className="story section-pad">
        <blockquote>
          "언어를 잘하게 된 다음에<br />사람을 만나는 게 아니라,<br /><em>사람을 만나며 언어를 배웁니다.</em>"
        </blockquote>
        <div>
          <p>HAKKYO는 몬트리올에서 사람들이 서로 만나며 자연스럽게 언어를 사용하는 시간을 설계하는 Learning Community입니다.</p>
          <p>관계는 배움의 결과가 아니라 출발점입니다. 새로운 언어로 처음 말을 걸고, 실수하고, 다시 말할 수 있도록 모두의 말할 시간과 안전한 청취를 지킵니다.</p>
        </div>
      </section>
      <section className="people section-pad">
        <div className="section-head">
          <span>FIRST LISTENERS</span>
          <span>MEET THE TEAM</span>
        </div>
        <div className="people-grid">
          {[["주", "KOREAN"], ["JOY", "ENGLISH"], ["JAEHEE", "FRENCH"]].map((x, i) => (
            <article key={x[0]}>
              <div className={`portrait p${i}`}><span>{x[0].slice(0, 1)}</span></div>
              <small>{x[1]} · FIRST LISTENER</small>
              <h3>{x[0]}</h3>
              <p>설명보다 먼저 듣고, 평가보다 먼저 기다리며, 각자의 말할 공간을 만듭니다.</p>
            </article>
          ))}
        </div>
      </section>
      <StudentStories />
      <section id="gallery" className="school-tv section-pad">
        <div className="tv-copy">
          <Status>HAKKYO TV · CH 04</Status>
          <h2>학교의 장면들을<br />TV 채널처럼 담았어요.</h2>
          <p>서로의 이야기를 기다리던 교실, 함께 걷고 만들고 웃었던 수요일의 기록입니다.</p>
          <a className="cta" href="/gallery" style={{ marginTop: 24 }}>HAKKYO TV 보기 <Arrow /></a>
        </div>
        <div className="tv-set" data-cursor="PLAY">
          <div className="tv-screen">
            <div className="tv-signal">
              <span>NOW PLAYING</span>
              <strong>HAKKYO TV</strong>
              <small>MONTRÉAL · 2026</small>
            </div>
          </div>
          <div className="tv-controls">
            <i /><b>CH</b>
            <i /><b>VOL</b>
          </div>
          <div className="tv-legs"><i /><i /></div>
        </div>
      </section>
    </>
  )
}
