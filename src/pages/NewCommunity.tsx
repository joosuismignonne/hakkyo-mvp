import { useParams } from 'react-router-dom'
import { useT } from '../lib/lang'
import ChannelFeed from '../components/ChannelFeed'
import {
  ChatCircle, Globe, House, Briefcase, CalendarBlank, Cat, HandWaving, Bell, Hash, type Icon,
} from '@phosphor-icons/react'

interface ChannelConfig {
  Icon: Icon
  title: string
  desc: string
  tag: string
  placeholder: string
}

const CHANNELS: Record<string, ChannelConfig> = {
  chat: {
    Icon: ChatCircle, title: '자유게시판', desc: '자유롭게 이야기해요',
    tag: 'CHAT', placeholder: '하고 싶은 이야기를 써주세요',
  },
  exchange: {
    Icon: Globe, title: '언어교환', desc: '언어를 함께 배우고 교환해요',
    tag: 'EXCHANGE', placeholder: '언어 교환 파트너를 찾아보세요',
  },
  housing: {
    Icon: House, title: '주거', desc: '몬트리올 주거 정보와 경험을 나눠요',
    tag: 'HOUSING', placeholder: '주거 관련 질문이나 정보를 올려주세요',
  },
  jobs: {
    Icon: Briefcase, title: '취업·이민', desc: '일과 이민에 대한 이야기',
    tag: 'JOBS & IMMIGRATION', placeholder: '취업과 이민 관련 경험을 나눠주세요',
  },
  events: {
    Icon: CalendarBlank, title: '이벤트·모임', desc: '같이 뭔가 하고 싶은 분들',
    tag: 'EVENTS', placeholder: '모임이나 이벤트를 제안해 보세요',
  },
}

export default function NewCommunity() {
  const { channel } = useParams<{ channel?: string }>()
  const cfg = channel ? CHANNELS[channel] : undefined
  const t = useT()
  const channelMap = t.channels as Record<string, string>

  if (!cfg) {
    return (
      <div className="ch-feed">
        <div className="ch-header">
          <span className="ch-header-icon"><Hash size={20} weight="bold" /></span>
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

  const header = (
    <div className="ch-header">
      <span className="ch-header-icon"><cfg.Icon size={20} weight="bold" /></span>
      <div className="ch-header-text">
        <h1 className="ch-header-title">{channelMap[cfg.title] || cfg.title}</h1>
        <span className="ch-header-desc">{cfg.desc}</span>
      </div>
      <div className="ch-header-right">
        <button className="ch-header-action" onClick={() => window.location.href='/apply/community'}>
          {t.footer.apply}
        </button>
      </div>
    </div>
  )

  return (
    <ChannelFeed channel={channel!} header={header}>
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
              커뮤니티 신청하기
            </button>
            <button className="feed-action" onClick={() => window.location.href='/apply/news'}>
              <Bell size={13} weight="bold" style={{marginRight:4}} />{t.footer.subscribe}
            </button>
          </div>
        </div>
      </div>

      <div className="feed-divider">다른 채널</div>

      {Object.entries(CHANNELS)
        .filter(([k]) => k !== channel)
        .map(([k, c]) => (
          <a key={k} href={`/community/${k}`} className="feed-event-card">
            <div className="feed-dday" style={{ background:'#f5f5f0', display:'flex', alignItems:'center', justifyContent:'center' }}><c.Icon size={20} weight="bold" /></div>
            <div className="feed-event-body">
              <div className="feed-event-title">{c.title}</div>
              <div className="feed-event-meta">{c.desc}</div>
            </div>
            <div className="feed-event-arrow">→</div>
          </a>
        ))}
    </ChannelFeed>
  )
}
