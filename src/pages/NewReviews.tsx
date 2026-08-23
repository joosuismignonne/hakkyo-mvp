import ChannelFeed from '../components/ChannelFeed'
import { useT } from '../lib/lang'
import { Star, HandWaving } from '@phosphor-icons/react'

export default function NewReviews() {
  const t = useT()
  const r = t.reviews

  const header = (
    <div className="ch-header">
      <span className="ch-header-icon"><Star size={20} weight="fill" color="#f5c542" /></span>
      <div className="ch-header-text">
        <h1 className="ch-header-title">{r.title}</h1>
        <span className="ch-header-desc">{r.desc}</span>
      </div>
    </div>
  )

  return (
    <ChannelFeed channel="reviews" header={header}>
      {/* Empty state shown while no posts exist — replaced by real posts from DB */}
      <div className="channel-empty-state">
        <div className="channel-empty-icon"><Star size={40} weight="fill" color="#f5c542" /></div>
        <div className="channel-empty-title">첫 번째 후기를 기다리고 있어요</div>
        <div className="channel-empty-sub">수강생 인터뷰, 후기 사진, 솔직한 이야기를 여기에 올려주세요</div>
        <a href="/apply/community" className="channel-empty-cta"><HandWaving size={14} weight="bold" style={{marginRight:4}} />커뮤니티 신청하기</a>
      </div>
    </ChannelFeed>
  )
}
