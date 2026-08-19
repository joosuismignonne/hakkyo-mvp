import ChannelFeed from '../components/ChannelFeed'
import { useT, useLang } from '../lib/lang'

const SAMPLE_REVIEWS = [
  { name:'Minji K.', avatar:'🇰🇷', tag:'KOREAN', date:'2026-08-01',
    quote_ko:'처음엔 주문도 못 했는데 이제 카페에서 한국어로 수다 떨어요. 같은 고민을 가진 사람들이랑 같이 배우니까 진짜 달라요.',
    quote_en:'I couldn\'t even order at first, but now I chat away in Korean at cafés. Learning with people who share the same struggles makes all the difference.',
    quote_fr:'Au début, je ne pouvais même pas commander. Maintenant je bavarde en coréen dans les cafés. Apprendre avec des gens qui partagent les mêmes défis, ça change tout.',
    label_ko:'한국어 3기 수강생', label_en:'Korean · Session 3', label_fr:'Coréen · Session 3' },
  { name:'Lucas B.', avatar:'🇨🇦', tag:'FRENCH', date:'2026-07-28',
    quote_ko:'Montréal에 살면서도 프랑스어가 두려웠는데, HAKKYO에서 처음으로 틀려도 괜찮다는 걸 느꼈어요.',
    quote_en:'Living in Montréal, I was still afraid of French. At HAKKYO I felt for the first time that it\'s okay to make mistakes.',
    quote_fr:'Je vivais à Montréal et j\'avais encore peur du français. Chez HAKKYO, j\'ai senti pour la première fois que les erreurs étaient permises.',
    label_ko:'불어 2기 수강생', label_en:'French · Session 2', label_fr:'Français · Session 2' },
  { name:'Yuna S.', avatar:'🇰🇷', tag:'ENGLISH', date:'2026-07-20',
    quote_ko:'영어 말할 때 머릿속에선 있는데 입이 안 열렸는데, 여기서 Active Output 하고 나서 바뀌었어요.',
    quote_en:'The words were in my head but my mouth wouldn\'t open. After practising Active Output here, everything changed.',
    quote_fr:'Les mots étaient dans ma tête mais ma bouche ne s\'ouvrait pas. Après avoir pratiqué l\'Active Output ici, tout a changé.',
    label_ko:'영어 3기 수강생', label_en:'English · Session 3', label_fr:'Anglais · Session 3' },
]

function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getMonth()+1}월 ${dt.getDate()}일`
}

export default function NewReviews() {
  const t = useT()
  const { lang } = useLang()
  const r = t.reviews

  const header = (
    <div className="ch-header">
      <span className="ch-header-icon">⭐</span>
      <div className="ch-header-text">
        <h1 className="ch-header-title">{r.title}</h1>
        <span className="ch-header-desc">{r.desc}</span>
      </div>
    </div>
  )

  return (
    <ChannelFeed channel="reviews" header={header}>
      {/* Compose stub for non-admins */}
      <div className="ch-compose" onClick={() => window.location.href='/apply/community'}>
        <div className="ch-compose-avatar">😺</div>
        <span className="ch-compose-ph">{r.compose}</span>
        <button className="ch-compose-btn">{r.joinBtn}</button>
      </div>

      {/* Sample reviews */}
      {SAMPLE_REVIEWS.map((rev, i) => {
        const quote = lang === 'en' ? rev.quote_en : lang === 'fr' ? rev.quote_fr : rev.quote_ko
        const label = lang === 'en' ? rev.label_en : lang === 'fr' ? rev.label_fr : rev.label_ko
        return (
          <div key={i} className="feed-card">
            <div className="feed-card-inner">
              <div className="feed-meta">
                <div className="feed-avatar" style={{ fontSize:18, background:'transparent' }}>{rev.avatar}</div>
                <div className="feed-meta-text">
                  <span className="feed-author">{rev.name}</span>
                  <span className="feed-time">{fmtDate(rev.date)}</span>
                </div>
                <span className="feed-tag">{rev.tag}</span>
              </div>
              <div className="review-quote">"{quote}"</div>
              <div className="feed-footer">
                <span style={{ fontSize:11, color:'#bbb', padding:'4px 10px' }}>{label}</span>
              </div>
            </div>
          </div>
        )
      })}

      {/* Coming soon card */}
      <div className="feed-card">
        <div className="feed-card-inner">
          <div className="feed-meta">
            <div className="feed-avatar feed-avatar-h">H</div>
            <div className="feed-meta-text">
              <span className="feed-author">HAKKYO</span>
              <span className="feed-time">2026 FALL</span>
            </div>
            <span className="feed-tag">{r.tag}</span>
          </div>
          <div className="feed-title">{r.comingSoonTitle}</div>
          <div className="feed-body"><p>{r.comingSoonBody}</p></div>
          <div className="feed-footer">
            <button className="feed-action feed-action-accent" onClick={() => window.location.href='/apply/community'}>
              {r.joinCta}
            </button>
            <button className="feed-action" onClick={() => window.location.href='/apply/news'}>
              {r.subscribeCta}
            </button>
          </div>
        </div>
      </div>
    </ChannelFeed>
  )
}
