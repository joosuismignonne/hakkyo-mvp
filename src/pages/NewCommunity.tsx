import { useParams } from 'react-router-dom'

interface ChannelConfig {
  icon: string
  title: string
  desc: string
  tag: string
  placeholder: string
  comingSoon: boolean
}

const CHANNELS: Record<string, ChannelConfig> = {
  chat: {
    icon: '💬', title: '자유게시판', desc: '자유롭게 이야기해요',
    tag: 'CHAT', placeholder: '하고 싶은 이야기를 써주세요',
    comingSoon: true,
  },
  exchange: {
    icon: '🌐', title: '언어교환', desc: '언어를 함께 배우고 교환해요',
    tag: 'EXCHANGE', placeholder: '언어 교환 파트너를 찾아보세요',
    comingSoon: true,
  },
  housing: {
    icon: '🏠', title: '주거', desc: '몬트리올 주거 정보와 경험을 나눠요',
    tag: 'HOUSING', placeholder: '주거 관련 질문이나 정보를 올려주세요',
    comingSoon: true,
  },
  jobs: {
    icon: '💼', title: '취업·이민', desc: '일과 이민에 대한 이야기',
    tag: 'JOBS & IMMIGRATION', placeholder: '취업과 이민 관련 경험을 나눠주세요',
    comingSoon: true,
  },
  events: {
    icon: '📅', title: '이벤트·모임', desc: '같이 뭔가 하고 싶은 분들',
    tag: 'EVENTS', placeholder: '모임이나 이벤트를 제안해 보세요',
    comingSoon: true,
  },
}

export default function NewCommunity() {
  const { channel } = useParams<{ channel?: string }>()
  const cfg = channel ? CHANNELS[channel] : undefined

  if (!cfg) {
    return (
      <div className="ch-feed">
        <div className="ch-header">
          <span className="ch-header-icon">💬</span>
          <h1 className="ch-header-title">커뮤니티</h1>
        </div>
        <div className="ch-scroll">
          <div className="ch-inner">
            <div className="feed-card">
              <div className="feed-card-inner">
                <div className="feed-title">채널을 찾을 수 없어요</div>
                <div className="feed-footer">
                  <button className="feed-action" onClick={() => window.location.href='/'}>← 홈으로</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ch-feed">
      <div className="ch-header">
        <span className="ch-header-icon">{cfg.icon}</span>
        <h1 className="ch-header-title">{cfg.title}</h1>
        <span className="ch-header-desc">{cfg.desc}</span>
        <button className="ch-header-action" onClick={() => window.location.href='/apply/community'}>
          ✋ 커뮤니티 신청
        </button>
      </div>
      <div className="ch-scroll">
        <div className="ch-inner">

          {/* Compose stub */}
          <div className="ch-compose" onClick={() => window.location.href='/apply/community'}>
            <div className="ch-compose-avatar">😺</div>
            <span className="ch-compose-ph">{cfg.placeholder}</span>
            <button className="ch-compose-btn">커뮤니티 가입 후 이용</button>
          </div>

          {/* Coming soon card */}
          <div className="feed-card">
            <div className="feed-card-inner">
              <div className="feed-meta">
                <div className="feed-avatar" style={{ background:'#f5c542' }}>H</div>
                <span className="feed-author">HAKKYO</span>
                <span className={`feed-tag`}>{cfg.tag}</span>
                <span className="feed-time">2026 FALL</span>
              </div>
              <div className="feed-title">{cfg.title} 채널이 곧 열려요</div>
              <div className="feed-body">
                <p>HAKKYO 커뮤니티 멤버들이 모이면 이 채널에서 자유롭게 이야기를 나눌 수 있어요. 지금 커뮤니티에 신청하면 채널이 열릴 때 가장 먼저 알려드려요.</p>
              </div>
              <div className="feed-footer">
                <button className="feed-action subscribed" onClick={() => window.location.href='/apply/community'}>
                  ✋ 커뮤니티 신청하기
                </button>
                <button className="feed-action" onClick={() => window.location.href='/apply/news'}>
                  🔔 소식 받기
                </button>
              </div>
            </div>
          </div>

          <div className="feed-divider">다른 채널</div>

          {Object.entries(CHANNELS)
            .filter(([k]) => k !== channel)
            .map(([k, c]) => (
              <a key={k} href={`/community/${k}`} className="feed-event-card">
                <div className="feed-dday" style={{ fontSize: 20, background:'#f5f5f0' }}>{c.icon}</div>
                <div className="feed-event-body">
                  <div className="feed-event-title">{c.title}</div>
                  <div className="feed-event-meta">{c.desc}</div>
                </div>
                <div className="feed-event-arrow">→</div>
              </a>
            ))}

        </div>
      </div>
    </div>
  )
}
