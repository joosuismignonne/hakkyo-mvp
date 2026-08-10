import { useState } from 'react'
import Status, { Arrow } from '../components/HakkyoStatus'

function PageTitle({ no, title, sub }: { no: string; title: string; sub: string }) {
  return (
    <section className="page-title section-pad">
      <span>{no}</span><h1>{title}</h1><p>{sub}</p>
    </section>
  )
}

const checklistSteps = [
  { icon: '✈', label: "비자·영주권 준비", desc: "어떤 비자로 오나요? 워홀, 학생, Express Entry 등 상황에 따라 첫 단계가 달라져요." },
  { icon: '🏠', label: "집 구하기", desc: "Kijiji, Facebook Groups, 카카오 커뮤니티를 활용하세요. 단기 임대는 Airbnb도 좋은 출발점이에요." },
  { icon: '🏦', label: "은행 계좌 만들기", desc: "BMO, RBC, TD 중 어디든 가능해요. 신분증 + 주소 증명 서류를 챙겨가세요." },
  { icon: '📱', label: "핸드폰 개통", desc: "Fido, Koodo, Public Mobile이 저렴한 편이에요. 선불 요금제로 시작하는 것도 좋아요." },
  { icon: '🏥', label: "건강 보험 신청 (RAMQ)", desc: "퀘벡 주 건강보험은 이민 후 3개월 대기 기간이 있어요. 그 기간엔 개인 보험을 따로 드세요." },
  { icon: '📋', label: "SIN 번호 받기", desc: "일을 하거나 세금 신고를 하려면 필요해요. Service Canada 방문 또는 온라인으로 신청 가능해요." },
  { icon: '🚇', label: "교통카드 (OPUS 카드) 만들기", desc: "STM 지하철역에서 구매 가능해요. 매월 충전하는 월 패스가 가장 경제적이에요." },
  { icon: '👥', label: "커뮤니티 찾기", desc: "HAKKYO, 한카, 네이버 카페 '몬트리올 한인' 등을 통해 사람들과 연결되세요." },
  { icon: '🇨🇦', label: "세금 신고 (Tax Return)", desc: "매년 4월 말까지 신고해야 해요. 처음이라면 H&R Block이나 한인 세무사를 찾아보세요." },
]

const settlingTools = [
  {
    category: "은행·금융",
    icon: "💰",
    items: [
      { name: "BMO", desc: "한국어 서비스 가능. 캐나다 이민자 전용 패키지 있음.", url: "#" },
      { name: "RBC", desc: "캐나다 최대 은행. 온라인 개설 편리.", url: "#" },
      { name: "Wise", desc: "해외 송금 수수료가 저렴해요.", url: "#" },
    ]
  },
  {
    category: "핸드폰",
    icon: "📱",
    items: [
      { name: "Public Mobile", desc: "가장 저렴한 플랜 중 하나. 부스터 포인트로 추가 할인.", url: "#" },
      { name: "Fido", desc: "Rogers 망 사용. 커버리지 좋음.", url: "#" },
      { name: "Koodo", desc: "Telus 망. 선불·후불 모두 가능.", url: "#" },
    ]
  },
  {
    category: "집 구하기",
    icon: "🏠",
    items: [
      { name: "Kijiji", desc: "캐나다 최대 중고/부동산 플랫폼.", url: "#" },
      { name: "Facebook Marketplace", desc: "'몬트리올 방 구함' 그룹에서 한인 룸메이트도 찾을 수 있어요.", url: "#" },
      { name: "Airbnb", desc: "단기 숙소로 시작하며 동네를 탐색하기 좋아요.", url: "#" },
    ]
  },
  {
    category: "한인 커뮤니티",
    icon: "👥",
    items: [
      { name: "한카 (KCAM)", desc: "몬트리올 한인 공식 커뮤니티 센터.", url: "#" },
      { name: "네이버 카페 - 몬트리올 한인", desc: "정착 정보, 벼룩시장, 구인구직.", url: "#" },
      { name: "HAKKYO", desc: "언어 수업, 수요일 액티비티, 커뮤니티 연결.", url: "/" },
    ]
  },
  {
    category: "건강·의료",
    icon: "🏥",
    items: [
      { name: "RAMQ (퀘벡 건강보험)", desc: "이민 후 신청 필수. 3개월 대기 기간 주의.", url: "#" },
      { name: "Clínica", desc: "퀘벡 가정의 매칭 플랫폼 (영어·불어).", url: "#" },
      { name: "한인 병원 · 한의원", desc: "한국어 가능한 의사 · 한의사 정보.", url: "#" },
    ]
  },
  {
    category: "교통",
    icon: "🚇",
    items: [
      { name: "STM (몬트리올 대중교통)", desc: "지하철 + 버스 운영. OPUS 카드로 월 패스 충전.", url: "#" },
      { name: "Bixi (자전거 공유)", desc: "봄–가을 MTL 자전거 공유 서비스. 단건·연간 이용권.", url: "#" },
      { name: "Communauto", desc: "카셰어링 서비스. 장거리 이동 시 유용.", url: "#" },
    ]
  },
  {
    category: "교육·언어",
    icon: "📚",
    items: [
      { name: "HAKKYO 언어 프로그램", desc: "한국어·영어·불어 소그룹 클래스.", url: "/programs" },
      { name: "Concordia 어학원", desc: "불어·영어 집중 코스.", url: "#" },
      { name: "CÉGEP 불어 무료 수업", desc: "퀘벡 거주자는 불어 수업을 무료로 받을 수 있어요.", url: "#" },
    ]
  },
  {
    category: "행정·서류",
    icon: "📋",
    items: [
      { name: "Service Canada", desc: "SIN 발급, 취업 허가 관련.", url: "#" },
      { name: "IRCC (이민국)", desc: "비자·영주권 신청 공식 창구.", url: "#" },
      { name: "Revenue Québec", desc: "퀘벡 세금 신고.", url: "#" },
    ]
  },
  {
    category: "생활 편의",
    icon: "🛒",
    items: [
      { name: "Metro / IGA / Maxi", desc: "몬트리올 주요 슈퍼마켓 체인.", url: "#" },
      { name: "T&T Supermarket", desc: "아시아 식재료 대형 마트.", url: "#" },
      { name: "한국 마트 (Korea Town)", desc: "한국 식재료·라면·김치 구매 가능한 곳.", url: "#" },
    ]
  },
]

const neighbourhoods = [
  { dot: "dot-0", name: "Plateau–Mont-Royal", en: "Plateau", color: "#ffd91a", vibe: "예술적·보헤미안", rent: "$$", french: "★★★★", walk: "★★★★★", korean: "★★", desc: "카페와 갤러리, 독립 서점이 많아요. 불어권 문화 중심지. 젊은 예술가와 학생이 많이 살아요." },
  { dot: "dot-1", name: "Mile End", en: "Mile End", color: "#ffe2ef", vibe: "힙스터·크리에이티브", rent: "$$$", french: "★★★", walk: "★★★★", korean: "★★", desc: "창작자·음악가의 동네. 베이글 맛집, 유대인 문화, 독립 카페가 공존해요." },
  { dot: "dot-2", name: "Downtown (Centre-ville)", en: "Downtown", color: "#dff4ff", vibe: "도시·편리", rent: "$$$", french: "★★★", walk: "★★★★★", korean: "★★★", desc: "지하철 접근성 최고. 맥길 대학 근처. 한국 마트, 아시아 식당도 가까워요." },
  { dot: "dot-3", name: "NDG (Notre-Dame-de-Grâce)", en: "NDG", color: "#e8f8c9", vibe: "조용·가족", rent: "$$", french: "★★★", walk: "★★★", korean: "★★", desc: "조용하고 녹지가 많아요. 가족 단위 거주자가 많고 렌트비가 상대적으로 저렴해요." },
  { dot: "dot-4", name: "Westmount", en: "Westmount", color: "#fff7c7", vibe: "고급·조용", rent: "$$$$", french: "★★", walk: "★★★", korean: "★", desc: "부유한 영어권 지역. 고급 주택이 많고 조용해요. 통근이 불편할 수 있어요." },
  { dot: "dot-5", name: "Côte-des-Neiges (CDN)", en: "CDN", color: "#ffe2ef", vibe: "다문화·활기", rent: "$$", french: "★★★", walk: "★★★★", korean: "★★★★", desc: "몬트리올에서 한인이 가장 많은 동네. 한국 마트·식당·교회가 밀집해 있어요." },
  { dot: "dot-6", name: "Rosemont", en: "Rosemont", color: "#dff4ff", vibe: "조용·주거", rent: "$$", french: "★★★★", walk: "★★★", korean: "★", desc: "퀘베쿠아 가족이 많이 사는 조용한 주거지역. 불어 환경에 집중하고 싶다면 추천." },
  { dot: "dot-7", name: "Laval", en: "Laval", color: "#e8f8c9", vibe: "교외·넓은 집", rent: "$", french: "★★★★", walk: "★★", korean: "★★", desc: "몬트리올 섬 북쪽 교외. 차가 있다면 넓은 집을 저렴하게 구할 수 있어요." },
  { dot: "dot-8", name: "Longueuil", en: "Longueuil", color: "#ffd91a", vibe: "교외·조용", rent: "$", french: "★★★★★", walk: "★★", korean: "★", desc: "강 건너 남쪽 교외. 불어권 분위기가 강하고 렌트비가 저렴해요." },
  { dot: "dot-9", name: "Mile-Ex", en: "Mile-Ex", color: "#fff7c7", vibe: "신흥·예술", rent: "$$", french: "★★★", walk: "★★★★", korean: "★", desc: "최근 급부상한 신흥 지역. IT 스타트업, 스튜디오가 많고 젊은 층이 유입 중이에요." },
]

export default function NewSettling() {
  const [checkDone, setCheckDone] = useState<Set<number>>(new Set())
  const [toolCat, setToolCat] = useState(0)
  const [area, setArea] = useState(0)
  const nb = neighbourhoods[area]

  function toggleCheck(i: number) {
    setCheckDone(prev => {
      const s = new Set(prev)
      s.has(i) ? s.delete(i) : s.add(i)
      return s
    })
  }

  const pct = Math.round((checkDone.size / checklistSteps.length) * 100)

  return (
    <>
      <PageTitle no="07 — 정착 가이드" title="몬트리올 정착 안내" sub="Your guide to settling in Montréal" />

      {/* Settling Checklist */}
      <section className="settling-checklist section-pad">
        <div className="section-head">
          <span>SETTLING CHECKLIST</span>
          <span>{checkDone.size} / {checklistSteps.length} 완료</span>
        </div>
        <div className="checklist-progress">
          <div style={{ width: `${pct}%` }} />
        </div>
        <div className="checklist-steps">
          {checklistSteps.map((s, i) => (
            <label key={s.label} className={`checklist-item ${checkDone.has(i) ? 'done' : ''}`}>
              <input type="checkbox" checked={checkDone.has(i)} onChange={() => toggleCheck(i)} />
              <span className="check-icon">{s.icon}</span>
              <div>
                <strong>{String(i + 1).padStart(2, '0')}. {s.label}</strong>
                <p>{s.desc}</p>
              </div>
            </label>
          ))}
        </div>
        {pct === 100 && (
          <p className="checklist-complete">모든 단계를 완료했어요! 몬트리올에서의 생활을 응원합니다.</p>
        )}
      </section>

      {/* Settling Tools */}
      <section className="settling-tools section-pad">
        <div className="section-head">
          <Status>SETTLING TOOLS</Status>
          <h2>정착에 필요한<br />도구와 링크 모음</h2>
        </div>
        <div className="tools-tabs">
          {settlingTools.map((t, i) => (
            <button key={t.category} className={i === toolCat ? 'active' : ''} onClick={() => setToolCat(i)}>
              <span>{t.icon}</span> {t.category}
            </button>
          ))}
        </div>
        <div className="tools-panel">
          {settlingTools[toolCat].items.map(item => (
            <a href={item.url} key={item.name} className="tool-card" target="_blank" rel="noopener noreferrer" data-cursor="OPEN">
              <strong>{item.name}</strong>
              <p>{item.desc}</p>
              <Arrow />
            </a>
          ))}
        </div>
      </section>

      {/* Neighbourhood Comparison */}
      <section className="neighbourhood-guide section-pad">
        <div className="section-head"><Status>NEIGHBOURHOOD GUIDE</Status></div>
        <h2 className="neighbourhood-title">어느 동네에서<br />살까요?</h2>
        <p className="neighbourhood-intro">지역을 선택하면 동네 분위기, 렌트 비용, 불어 환경, 한인 커뮤니티 현황을 확인할 수 있어요.</p>

        <div className="area-layout">
          <div className="mini-map">
            {neighbourhoods.map((n, i) => (
              <button
                key={n.en}
                className={`map-dot ${n.dot} ${i === area ? 'active' : ''}`}
                onClick={() => setArea(i)}
              >
                {n.en}
              </button>
            ))}
          </div>
          <article style={{ background: nb.color }}>
            <small>{nb.vibe}</small>
            <h3>{nb.name}</h3>
            <p>{nb.desc}</p>
            <dl>
              <div><dt>렌트 비용</dt><dd>{nb.rent}</dd></div>
              <div><dt>불어 환경</dt><dd>{nb.french}</dd></div>
              <div><dt>도보 생활</dt><dd>{nb.walk}</dd></div>
              <div><dt>한인 커뮤니티</dt><dd>{nb.korean}</dd></div>
            </dl>
          </article>
        </div>

        <div className="neighbourhood-table">
          <table>
            <thead>
              <tr>
                <th>동네</th>
                <th>렌트</th>
                <th>불어</th>
                <th>도보</th>
                <th>한인</th>
              </tr>
            </thead>
            <tbody>
              {neighbourhoods.map((n, i) => (
                <tr key={n.en} className={i === area ? 'active' : ''} onClick={() => setArea(i)} style={{ cursor: 'pointer' }}>
                  <td><strong>{n.name}</strong></td>
                  <td>{n.rent}</td>
                  <td>{n.french}</td>
                  <td>{n.walk}</td>
                  <td>{n.korean}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="community-cta section-pad">
        <div className="community-cta-inner">
          <div>
            <span style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700 }}>HAKKYO COMMUNITY</span>
            <h2>혼자 정착하지<br />않아도 돼요.</h2>
            <p>HAKKYO 커뮤니티에 참여하면 같은 시기에 몬트리올에 온 사람들과 연결돼요. 매주 일요일 오후, 수업 시간 안에서 함께 이야기하는 시간이 있어요.</p>
          </div>
          <a className="cta" href="/apply/community">커뮤니티 참여하기 <Arrow /></a>
        </div>
      </section>
    </>
  )
}
