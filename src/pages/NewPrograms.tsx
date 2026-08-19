import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { programs } from '../data/hakkyo'

const PROGRAM_DETAIL: Record<string, { scene: string; active: string; classes: string }> = {
  korean:      { scene: '카페에서 주문하고, 친구와 약속을 잡고, 내 하루를 한국어로 말해봐요.', active: '배운 표현을 바로 말해보는 별도 실전 시간', classes: '총 8회' },
  english:     { scene: '머릿속에 있던 영어를 꺼내 실제 대화로 연결하는 연습을 해요.', active: '매주 말하기 중심 Active Output 포함', classes: '총 8회' },
  french:      { scene: '가게, 직장, 이웃과의 짧은 대화부터 몬트리올 생활 불어를 시작해요.', active: '매주 말하기 중심 Active Output 포함', classes: '총 8회' },
  'full-course': { scene: '두 언어를 따로 외우는 대신, 한 주 안에서 배우고 말하고 다시 연결해요.', active: 'English · French · Active Output 모두 포함', classes: '총 12회' },
}

function ProgramDetail({ slug }: { slug: string }) {
  const p = programs.find(x => x.href === `/programs/${slug}`)
  const detail = PROGRAM_DETAIL[slug]

  if (!p) return (
    <div className="ch-feed">
      <div className="ch-header">
        <span className="ch-header-icon">📚</span>
        <h1 className="ch-header-title">프로그램</h1>
      </div>
      <div className="ch-scroll">
        <div className="ch-inner">
          <div className="feed-card"><div className="feed-card-inner"><div className="feed-title">프로그램을 찾을 수 없어요</div><div className="feed-footer"><button className="feed-action" onClick={() => window.location.href='/programs'}>← 돌아가기</button></div></div></div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="ch-feed">
      <div className="ch-header">
        <span className="ch-header-icon">📚</span>
        <h1 className="ch-header-title">{p.lang}</h1>
        <span className="ch-header-desc">{p.level} · SESSION 04</span>
        <button className="ch-header-action" onClick={() => window.location.href='/apply/news'}>
          🔔 소식 받기
        </button>
      </div>
      <div className="ch-scroll">
        <div className="ch-inner">
          {/* main card */}
          <div className="feed-card feed-card-pinned">
            <div className="feed-pin-bar">📌 {p.lang} 프로그램</div>
            <div className="feed-card-inner">
              <div className="feed-meta">
                <div className="feed-avatar" style={{ background:'#f5c542' }}>H</div>
                <span className="feed-author">HAKKYO</span>
                <span className="feed-tag feed-tag-program">PROGRAM</span>
                <span className="feed-time">2026 FALL</span>
              </div>
              <div className="feed-title">{p.lang} · {p.en}</div>
              <div className="feed-body">
                <p>{detail?.scene || p.audience}</p>
                <ul>
                  <li>레벨: {p.level}</li>
                  <li>수업 횟수: {detail?.classes || '총 8회'}</li>
                  <li>Active Output: {detail?.active}</li>
                  <li>참가비: {p.price || '추후 공개'}</li>
                </ul>
              </div>
              <div className="feed-footer">
                <button className="feed-action subscribed" onClick={() => window.location.href='/apply/news'}>
                  🔔 4기 소식 받기
                </button>
                <button className="feed-action" onClick={() => window.location.href='/programs'}>
                  ← 전체 보기
                </button>
              </div>
            </div>
          </div>

          {/* MINI's note */}
          <div className="feed-card">
            <div className="feed-card-inner">
              <div className="feed-meta">
                <div className="feed-avatar" style={{ background:'#111', color:'#f5c542', fontSize:14 }}>🐱</div>
                <span className="feed-author">MINI</span>
                <span className="feed-tag">MINI'S NOTE</span>
              </div>
              <div className="feed-title">잘해야 오는 게 아니에요</div>
              <div className="feed-body">
                <p>HAKKYO는 완벽하게 말하는 사람보다, 말해보고 싶은 사람을 위한 곳이에요. 틀려도 괜찮아요. 함께 이야기하다 보면 어느새 표현이 나와요.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NewPrograms() {
  const { slug } = useParams<{ slug?: string }>()
  if (slug) return <ProgramDetail slug={slug} />

  return (
    <div className="ch-feed">
      <div className="ch-header">
        <span className="ch-header-icon">📚</span>
        <h1 className="ch-header-title">프로그램</h1>
        <span className="ch-header-desc">SESSION 04 · 2026 FALL</span>
        <button className="ch-header-action" onClick={() => window.location.href='/apply/news'}>
          🔔 소식 받기
        </button>
      </div>
      <div className="ch-scroll">
        <div className="ch-inner">

          {/* 4기 announcement */}
          <div className="feed-card feed-card-pinned">
            <div className="feed-pin-bar">📌 4기 안내</div>
            <div className="feed-card-inner">
              <div className="feed-meta">
                <div className="feed-avatar" style={{ background:'#f5c542' }}>H</div>
                <span className="feed-author">HAKKYO</span>
                <span className="feed-tag feed-tag-program">PROGRAM</span>
                <span className="feed-time">2026 FALL</span>
              </div>
              <div className="feed-title">4기 언어 프로그램 — 2026년 10월 시작 예정</div>
              <div className="feed-body">
                <p>한국어·영어·불어 프로그램 4기 모집이 곧 시작돼요. 정확한 일정과 참가비는 소식 신청자에게 가장 먼저 알려드릴게요.</p>
              </div>
              <div className="feed-footer">
                <button className="feed-action subscribed" onClick={() => window.location.href='/apply/news'}>
                  🔔 소식 신청하기
                </button>
              </div>
            </div>
          </div>

          <div className="feed-divider">프로그램 목록</div>

          {/* Program cards */}
          <div className="feed-programs-grid">
            {programs.map(p => (
              <a key={p.en} href={p.href} className="feed-prog-card">
                <div className="feed-prog-mark">{p.mark}</div>
                <div className="feed-prog-lang">{p.lang}</div>
                <div className="feed-prog-level">{p.level}</div>
                <div className="feed-prog-desc">{p.scene}</div>
              </a>
            ))}
          </div>

          {/* FAQ cards */}
          <div className="feed-divider">자주 묻는 질문</div>

          {[
            ['언어를 잘하지 못해도 참여할 수 있나요?', 'HAKKYO는 완벽하게 말하는 사람보다, 말해보고 싶은 사람을 위한 곳이에요. 프로그램별 레벨 안내를 확인한 뒤 자신에게 맞는 수업을 선택할 수 있어요.'],
            ['4기 일정과 참가비는 언제 공개되나요?', '2026년 10월 시작을 준비하고 있어요. 정확한 일정과 참가비가 정해지면 소식 신청자에게 가장 먼저 알려드려요.'],
            ['수업은 어떤 언어로 진행되나요?', '한국어·영어·불어 프로그램별로 목표 언어를 중심으로 진행하되, 이해가 필요할 때는 멘토가 다른 언어로 자연스럽게 도와드려요.'],
          ].map(([q, a], i) => (
            <FaqCard key={i} q={q} a={a} />
          ))}

        </div>
      </div>
    </div>
  )
}

function FaqCard({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="feed-card" onClick={() => setOpen(o => !o)}>
      <div className="feed-card-inner">
        <div className="feed-meta">
          <div className="feed-avatar" style={{ background:'#e8e8e0', fontSize:14 }}>Q</div>
          <span className="feed-author" style={{ fontWeight:600 }}>{q}</span>
          <span style={{ marginLeft:'auto', color:'#bbb', fontSize:16 }}>{open ? '▲' : '▼'}</span>
        </div>
        {open && <div className="feed-body"><p>{a}</p></div>}
      </div>
    </div>
  )
}
