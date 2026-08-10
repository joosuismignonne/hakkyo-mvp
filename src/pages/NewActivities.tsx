import { useParams } from 'react-router-dom'
import Status, { Arrow } from '../components/HakkyoStatus'
import { activities } from '../data/hakkyo'
import { trackEvent } from '../lib/analytics'

function PageTitle({ no, title, sub }: { no: string; title: string; sub: string }) {
  return (
    <section className="page-title section-pad">
      <span>{no}</span><h1>{title}</h1><p>{sub}</p>
    </section>
  )
}

const prep: Record<string, string[]> = {
  running: ["편한 러닝화","물","가볍게 달릴 마음"],
  cycling: ["개인 자전거 또는 BIXI","헬멧 권장","물"],
  flower: ["준비물 없음","꽃과 도구는 제공 예정","완성한 꽃은 가져가요"],
  baking: ["준비물 없음","앞치마 제공 예정","함께 만든 디저트는 나눠요"],
}

function ActivityDetail({ slug }: { slug: string }) {
  const a = activities.find(x => x.slug === slug)
  if (!a) return (
    <>
      <PageTitle no="ACTIVITIES" title="액티비티를 찾을 수 없어요" sub="" />
      <section className="simple-cta section-pad">
        <a className="cta" href="/activities">액티비티로 돌아가기 <Arrow /></a>
      </section>
    </>
  )

  return (
    <>
      <PageTitle no={`NEW IN SEPTEMBER · ${a.code}`} title={a.ko} sub={`${a.en} · ${a.fr}`} />
      <section className="activity-detail section-pad">
        <div className={`activity-poster poster-${a.slug}`} data-cursor="PLAY">
          <span>WED</span>
          <strong>{a.code.split(' ')[0]}</strong>
          <small>HAKKYO ACTIVITY CLUB</small>
        </div>
        <div>
          <Status>SEPTEMBER · WEDNESDAY</Status>
          <h2>{a.note}</h2>
          <p>수업을 듣지 않아도 괜찮아요. 새로운 사람들과 부담 없이 함께 해보고 싶은 누구나 참여할 수 있어요. 잘하는 것보다 함께 해보는 시간이 더 중요합니다.</p>
          <dl>
            <div><dt>일정</dt><dd>2026년 9월 수요일 · 추후 공개</dd></div>
            <div><dt>소요 시간</dt><dd>약 60–90분 예정</dd></div>
            <div><dt>장소</dt><dd>Montréal · 액티비티별 안내</dd></div>
            <div><dt>참가비</dt><dd>추후 공개</dd></div>
          </dl>
          <button className="cta" disabled style={{ opacity: 0.45, cursor: 'not-allowed' }}>9월 모집 예정 <Arrow /></button>
        </div>
      </section>
      <section className="activity-guide section-pad">
        <div>
          <span>BEFORE YOU JOIN</span>
          <h2>이것만 알고<br />오면 돼요.</h2>
          <p>정확한 만남 장소와 세부 준비물은 신청자에게 다시 안내해 드릴게요.</p>
        </div>
        <div className="prep-cards">
          {(prep[a.slug] || []).map((x, i) => (
            <article key={x} data-cursor="OK"><b>0{i + 1}</b><p>{x}</p></article>
          ))}
        </div>
      </section>
      <section className="activity-flow section-pad">
        <div className="section-head"><span>WEDNESDAY FLOW</span><span>60–90 MIN</span></div>
        <div className="flow-line">
          {["모여서 가볍게 인사해요","오늘의 활동을 함께 시작해요","천천히 이야기하며 즐겨요","다음 수요일을 기약해요"].map((x, i) => (
            <article key={x}><b>{String(i + 1).padStart(2, '0')}</b><p>{x}</p></article>
          ))}
        </div>
      </section>
    </>
  )
}

export default function NewActivities() {
  const { slug } = useParams<{ slug?: string }>()

  if (slug) return <ActivityDetail slug={slug} />

  return (
    <>
      <PageTitle no="02 — WEDNESDAY CLUB" title="수요일에는 같이 해요" sub="Activities from September 2026" />
      <section className="activity-list section-pad">
        {activities.map((a, i) => (
          <a href={`/activities/${a.slug}`} key={a.code} className="activity-list-item" onClick={() => trackEvent({ eventName: 'activity_card_clicked', targetType: 'activity', targetLabel: a.slug })}>
            <span>{a.code}</span>
            <div className={`shape activity-shape s${i}`} aria-hidden="true"><i /></div>
            <div>
              <h2>{a.ko}</h2>
              <p>{a.en} · {a.fr}</p>
              <small>{a.note}</small>
            </div>
            <b>9월 모집 예정</b>
          </a>
        ))}
      </section>
      <section className="community-cta section-pad">
        <div className="community-cta-inner">
          <div>
            <span style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700 }}>HAKKYO COMMUNITY</span>
            <h2>수요일 액티비티와는<br />별개로, 매주 일요일.</h2>
            <p>HAKKYO 커뮤니티는 수요일 액티비티와 다른 시간이에요. 매주 일요일 오후, 수업 시간 안 Active Output 자리에서 함께할 수 있어요.</p>
          </div>
          <a className="cta" href="/apply/community">커뮤니티 참여하기 <Arrow /></a>
        </div>
      </section>
    </>
  )
}
