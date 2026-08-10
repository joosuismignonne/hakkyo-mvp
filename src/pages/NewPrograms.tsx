import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Status, { Arrow } from '../components/HakkyoStatus'
import { programs } from '../data/hakkyo'
import { trackEvent } from '../lib/analytics'

function PageTitle({ no, title, sub }: { no: string; title: string; sub: string }) {
  return (
    <section className="page-title section-pad">
      <span>{no}</span>
      <h1>{title}</h1>
      <p>{sub}</p>
    </section>
  )
}

function Curriculum() {
  return (
    <section className="curriculum section-pad">
      <div className="section-head">
        <span>HOW WE LEARN</span>
        <span>LEARN → ACTIVE OUTPUT</span>
      </div>
      <h2>알고 있는 것에서<br />한 조각만 더.</h2>
      <ol>
        {["오늘 필요한 표현을 이해해요","내 일상에 맞는 문장으로 바꿔요","상대와 대화를 이어보며 연습해요","Active Output에서 실제로 말해봐요"].map((x, i) => (
          <li key={x}><b>{String(i + 1).padStart(2, '0')}</b><span>{x}</span></li>
        ))}
      </ol>
    </section>
  )
}

function ProgramPass({ lang }: { lang: string }) {
  const scenes: Record<string, string[]> = {
    Korean: ["카페에서 주문하기","친구와 약속 잡기","오늘 하루 말하기"],
    English: ["처음 만난 사람과 인사하기","직장에서 도움 요청하기","내 생각 이어 말하기"],
    French: ["가게에서 질문하기","동네 이웃과 인사하기","몬트리올 일정 잡기"],
    "Full Course": ["영어로 내 근황 말하기","불어로 몬트리올 생활 말하기","두 언어로 질문을 이어가기"],
  }
  const [scene, setScene] = useState(0)
  const list = scenes[lang] || scenes.English
  return (
    <div className="program-ticket scene-pass" data-cursor="NEXT">
      <span>ONE CLASS PREVIEW · SCENE 0{scene + 1}</span>
      <strong>{list[scene]}</strong>
      <small>티켓을 누르면 수업에서 연습할 다음 생활 장면이 나와요.</small>
      <button type="button" aria-label="다음 수업 장면" onClick={() => setScene((scene + 1) % list.length)}>NEXT</button>
      <i>OCT / 04</i>
    </div>
  )
}

function ProgramDetail({ slug }: { slug: string }) {
  const p = programs.find(x => x.en.toLowerCase().replace(/ /g, '-') === slug)
  if (!p) return <NotFound />

  return (
    <>
      <PageTitle no={`PROGRAM 0${programs.indexOf(p) + 1}`} title={p.lang} sub={`${p.en} · ${p.fr}`} />
      <section className="detail section-pad">
        <div className="program-poster" data-cursor="HELLO">
          <span>{p.en.toUpperCase()}</span>
          <strong>{p.mark}</strong>
          <small>SAY IT YOUR WAY · SESSION 04</small>
        </div>
        <div className="detail-copy">
          <Status>SESSION 04 · OCTOBER</Status>
          <h2>
            {p.en === 'Full Course'
              ? <>영어와 불어를 배우고,<br />Active Output으로 말해요.</>
              : <>시험을 위한 말보다,<br />오늘 써볼 수 있는 말.</>}
          </h2>
          <p>{p.scene}</p>
          <dl>
            <div><dt>구성</dt><dd>{p.focus}</dd></div>
            <div><dt>레벨</dt><dd>{p.level}</dd></div>
            <div><dt>수업 횟수</dt><dd><strong>{p.classes}</strong></dd></div>
            <div><dt>수강료</dt><dd><strong>{p.total}</strong></dd></div>
            <div><dt>시작</dt><dd>2026년 10월</dd></div>
            <div><dt>시간·장소</dt><dd>확정되는 즉시 신청자에게 이메일로 먼저 안내</dd></div>
          </dl>
          <div className="active-output-note">
            <span>ACTIVE OUTPUT</span>
            <strong>배운 언어를 내 말로 꺼내는 시간</strong>
            <p>{p.active}. 모든 HAKKYO 언어 클래스에는 배운 표현을 실제 대화로 사용해보는 Active Output 시간이 있습니다.</p>
          </div>
          <button className="cta" disabled style={{ opacity: 0.45, cursor: 'not-allowed' }}>10월 시작 예정 <Arrow /></button>
        </div>
      </section>
      <section className="fit section-pad">
        <div>
          <span>IS THIS FOR ME?</span>
          <h2>이런 마음으로<br />오면 좋아요.</h2>
        </div>
        <div className="fit-grid">
          {["공부는 했지만 실제로 말할 기회가 적었어요","틀릴까 봐 아는 표현도 쉽게 꺼내지 못해요","교재보다 내 생활에 필요한 문장을 배우고 싶어요"].map((x, i) => (
            <article key={x}><b>0{i + 1}</b><p>{x}</p></article>
          ))}
        </div>
      </section>
      <Curriculum />
      <section className="class-day section-pad">
        <div>
          <Status>ONE CLASS, FOUR MOMENTS</Status>
          <h2>한 번의 수업은<br />이렇게 흘러가요.</h2>
        </div>
        <ol>
          {["가볍게 안부를 나누며 입 열기","지난 표현을 실제 대화로 다시 사용하기","오늘의 장면과 표현을 함께 연습하기","Active Output에서 내 이야기로 바꿔 말하기"].map((x, i) => (
            <li key={x}><b>{String(i + 1).padStart(2, '0')}</b><span>{x}</span></li>
          ))}
        </ol>
      </section>
      <section className="friendly-note section-pad">
        <div className="mini-mimi" data-cursor="MEOW">●</div>
        <div>
          <span>MIMI'S NOTE</span>
          <h2>잘해야 오는 수업이 아니에요.</h2>
          <p>막히면 다른 언어를 섞어도 괜찮고, 잠시 듣고 있어도 괜찮아요. 멘토가 각자의 속도에 맞춰 대화에 들어올 수 있도록 도와드립니다.</p>
        </div>
      </section>
    </>
  )
}

function NotFound() {
  return (
    <>
      <PageTitle no="APPLICATION" title="페이지를 찾을 수 없어요" sub="Please choose a program or activity" />
      <section className="simple-cta section-pad">
        <a className="cta" href="/programs">프로그램으로 돌아가기 <Arrow /></a>
      </section>
    </>
  )
}

export default function NewPrograms() {
  const { slug } = useParams<{ slug?: string }>()

  if (slug) return <ProgramDetail slug={slug} />

  return (
    <>
      <PageTitle no="01 — PROGRAMS" title="언어를 배우는 새로운 이유" sub="Korean · English · French · Active Output" />
      <section className="program-summary section-pad">
        <div>
          <Status>SESSION 04</Status>
          <h2>모든 클래스는<br />말하는 시간까지.</h2>
        </div>
        <p>한국어·영어·불어 수업 모두 Active Output 시간을 포함합니다. 배운 표현을 이해하는 데서 끝내지 않고, 내 상황과 내 문장으로 바꾸어 실제로 말해봅니다.</p>
      </section>
      <section className="program-list section-pad">
        {programs.map((x, i) => (
          <a href={x.href} className={x.en === 'Full Course' ? 'program-full-card' : ''} key={x.en} onClick={() => trackEvent({ eventName: 'program_card_clicked', targetType: 'program', targetLabel: x.en })}>
            <span>0{i + 1}</span>
            <b>{x.mark}</b>
            <h2>{x.lang}</h2>
            <p>{x.en} / {x.fr}</p>
            <small>{x.focus}</small>
            <strong className="program-price">10월 시작 예정</strong>
            <Status>COMING SOON</Status>
          </a>
        ))}
      </section>
      <section className="community-cta section-pad">
        <div className="community-cta-inner">
          <div>
            <span style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700 }}>HAKKYO COMMUNITY</span>
            <h2>수업 전에<br />커뮤니티부터.</h2>
            <p>프로그램 시작 전에도 HAKKYO 커뮤니티에서 같은 도시에 사는 사람들과 먼저 연결될 수 있어요.</p>
          </div>
          <a className="cta" href="/apply/community">커뮤니티 참여하기 <Arrow /></a>
        </div>
      </section>
    </>
  )
}
