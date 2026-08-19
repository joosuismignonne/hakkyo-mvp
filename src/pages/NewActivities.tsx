import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Status, { Arrow } from '../components/HakkyoStatus'
import { activities } from '../data/hakkyo'
import { trackEvent } from '../lib/analytics'
import { supabase } from '../lib/supabase'

function PageTitle({ no, title, sub }: { no: string; title: string; sub: string }) {
  return (
    <section className="page-title section-pad">
      <span>{no}</span><h1>{title}</h1><p>{sub}</p>
    </section>
  )
}

const prep: Record<string, string[]> = {
  'book-club': ["읽고 싶은 책 한 권 (선택)","필기구","편하게 이야기할 마음"],
  'running-club': ["편한 러닝화","물","가볍게 달릴 마음"],
  'boardgame-club': ["준비물 없음","게임과 도구는 제공","함께 웃을 준비"],
}

interface ContentRow { value_ko: string; value_en: string; value_fr: string }

function useSiteContent(slug: string, key: string): ContentRow | null {
  const [row, setRow] = useState<ContentRow | null>(null)
  useEffect(() => {
    if (!supabase) return
    void supabase
      .from('site_content')
      .select('value_ko, value_en, value_fr')
      .eq('page', `activity_${slug}`)
      .eq('key', key)
      .single()
      .then(({ data }) => {
        if (data && (data.value_ko || data.value_en || data.value_fr)) {
          setRow(data as ContentRow)
        }
      })
  }, [slug, key])
  return row
}

function ActivityDetail({ slug }: { slug: string }) {
  const quote = useSiteContent(slug, 'leader_quote')
  const prepContent = useSiteContent(slug, 'prep_items')
  const [lang, setLang] = useState<'ko' | 'en' | 'fr'>('ko')

  const a = activities.find(x => x.slug === slug)
  if (!a) return (
    <>
      <PageTitle no="MINI HAKKYO" title="클럽을 찾을 수 없어요" sub="" />
      <section className="simple-cta section-pad">
        <a className="cta" href="/activities">돌아가기 <Arrow /></a>
      </section>
    </>
  )

  return (
    <>
      <PageTitle no={`MINI HAKKYO · ${a.code}`} title={a.ko} sub={`${a.en} · Language Exchange w/ ${(a as any).host}`} />
      <section className="activity-detail section-pad">
        <div className={`activity-poster poster-${a.slug}`} data-cursor="PLAY">
          <span>WED</span>
          <strong>{a.code.split(' ')[0]}</strong>
          <small>MINI HAKKYO · SERIE 1</small>
        </div>
        <div>
          <Status>MINI HAKKYO · KR–EN–FR</Status>
          <h2>{a.note}</h2>
          <p>잘해야 오는 게 아니에요. Language Exchange는 함께 하다 보면 자연스럽게 말이 나오는 구조예요. 언어 실력과 상관없이 누구나 참여할 수 있어요.</p>
          <dl>
            <div><dt>일정</dt><dd>2026년 {(a as any).date} ({(a as any).day})</dd></div>
            <div><dt>시간</dt><dd>{(a as any).time}</dd></div>
            <div><dt>진행</dt><dd>Language Exchange w/ {(a as any).host}</dd></div>
            <div><dt>장소</dt><dd>Montréal · 신청자에게 안내</dd></div>
            <div><dt>참가비</dt><dd>{(a as any).entry}</dd></div>
          </dl>
          <button className="cta" disabled style={{ opacity: 0.45, cursor: 'not-allowed' }}>9월 모집 예정 <Arrow /></button>
        </div>
      </section>
      {quote && (
        <section className="activity-quote section-pad">
          <div className="section-head">
            <span>WHY THIS CLUB · {(a as any).host?.toUpperCase()}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['ko','en','fr'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: '3px 8px',
                    border: '1px solid', borderColor: lang === l ? '#111' : '#ccc',
                    background: lang === l ? '#111' : 'transparent',
                    color: lang === l ? '#fff' : '#888', borderRadius: 4, cursor: 'pointer' }}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <blockquote className="leader-quote">
            <p>{quote[`value_${lang}`]}</p>
            <cite>— {(a as any).host}</cite>
          </blockquote>
        </section>
      )}
      <section className="activity-guide section-pad">
        <div>
          <span>BEFORE YOU JOIN</span>
          <h2>이것만 알고<br />오면 돼요.</h2>
          <p>자세한 장소와 안내는 신청 후 이메일로 드려요.</p>
        </div>
        <div className="prep-cards">
          {(prepContent
            ? (prepContent[`value_${lang}`] || prepContent.value_ko).split('|')
            : (prep[a.slug] || [])
          ).map((x: string, i: number) => (
            <article key={i} data-cursor="OK"><b>0{i + 1}</b><p>{x}</p></article>
          ))}
        </div>
      </section>
      <section className="activity-flow section-pad">
        <div className="section-head"><span>HOW IT GOES · LANGUAGE EXCHANGE</span><span>60–90 MIN</span></div>
        <div className="flow-line">
          {["모여서 가볍게 인사해요","오늘의 클럽 활동을 함께 해요","자연스럽게 이야기가 이어져요","다음 수요일을 기약해요"].map((x, i) => (
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
      <PageTitle no="02 — MINI HAKKYO" title="같이 하다 보면 말이 나와요" sub="Language Exchange · Book · Running · Boardgame" />
      <section className="activity-list section-pad">
        {activities.map((a, i) => (
          <a href={`/activities/${a.slug}`} key={a.code} className="activity-list-item" onClick={() => trackEvent({ eventName: 'activity_card_clicked', targetType: 'activity', targetLabel: a.slug })}>
            <span>{a.code}</span>
            <div className={`shape activity-shape s${i}`} aria-hidden="true"><i /></div>
            <div>
              <h2>{a.ko}</h2>
              <p>{a.en} · Language Exchange w/ {(a as any).host}</p>
              <small>2026년 {(a as any).date} · {(a as any).time}</small>
            </div>
            <b>9월 모집 예정</b>
          </a>
        ))}
      </section>
      <section className="community-cta section-pad">
        <div className="community-cta-inner">
          <div>
            <span style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700 }}>HAKKYO COMMUNITY</span>
            <h2>몬트리올에서<br />새로운 사람을 만나요.</h2>
            <p>같은 도시에서 새로운 시간을 보내는 사람들과 연결돼요.</p>
          </div>
          <a className="cta" href="/apply/community">커뮤니티 참여하기 <Arrow /></a>
        </div>
      </section>
    </>
  )
}
