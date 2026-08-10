import { useState } from 'react'
import Status, { Arrow } from '../components/HakkyoStatus'
import { galleryItems } from '../data/hakkyo'

function PageTitle({ no, title, sub }: { no: string; title: string; sub: string }) {
  return (
    <section className="page-title section-pad">
      <span>{no}</span><h1>{title}</h1><p>{sub}</p>
    </section>
  )
}

export default function NewGallery() {
  const [channel, setChannel] = useState(0)
  const item = galleryItems[channel]
  const next = (step: number) => setChannel((channel + step + galleryItems.length) % galleryItems.length)

  return (
    <>
      <PageTitle no="04 — HAKKYO TV" title="학교의 장면들" sub="Classes, people and Wednesdays in Montréal" />
      <section className="gallery-page channel-gallery section-pad">
        <div className="gallery-console">
          <div>
            <Status>NOW PLAYING</Status>
            <h2>채널을 돌려<br />HAKKYO를 만나보세요.</h2>
          </div>
          <div className="channel-counter">
            CH {String(channel + 1).padStart(2, '0')} / {String(galleryItems.length).padStart(2, '0')}
          </div>
        </div>
        <div className="gallery-tv">
          <div className="gallery-screen">
            <article className={`gallery-feature tile-${(channel % 4) + 1}`}>
              <div className="gallery-image">
                <span>HAKKYO TV · MONTRÉAL</span>
                <i />
                <b>{item[0]}</b>
                <button className="screen-play" aria-label="현재 채널 재생" data-cursor="PLAY">▶</button>
              </div>
              <div className="feature-caption">
                <small>{item[2]}</small>
                <h3>{item[1]}</h3>
              </div>
            </article>
          </div>
          <aside>
            <strong>HAKKYO<br />TV</strong>
            <button className="tv-dial" onClick={() => next(-1)} aria-label="이전 채널" data-cursor="PREV">−</button>
            <button className="tv-dial" onClick={() => next(1)} aria-label="다음 채널" data-cursor="NEXT">+</button>
            <p>TURN<br />CHANNEL</p>
          </aside>
        </div>
        <div className="channel-selector" aria-label="채널 선택">
          {galleryItems.map((x, i) => (
            <button
              className={i === channel ? 'active' : ''}
              onClick={() => setChannel(i)}
              key={x[1]}
              data-cursor={`CH ${String(i + 1).padStart(2, '0')}`}
            >
              <span>{String(i + 1).padStart(2, '0')}</span>
              <b>{x[0]}</b>
              <small>{x[1]}</small>
            </button>
          ))}
        </div>
        <p className="gallery-note">사진과 영상이 준비되면 TV 화면 안에서 같은 방식으로 재생됩니다.</p>
      </section>
    </>
  )
}
