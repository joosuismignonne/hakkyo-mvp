import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { programs } from '../data/hakkyo'
import { useLang, useT } from '../lib/lang'

function ProgramDetail({ slug }: { slug: string }) {
  const p = programs.find(x => x.href === `/programs/${slug}`)
  const { lang } = useLang()
  const t = useT()
  const pp = p as any

  if (!p) return (
    <div className="ch-feed">
      <div className="ch-header">
        <span className="ch-header-icon">📚</span>
        <h1 className="ch-header-title">{t.programs.title}</h1>
      </div>
      <div className="ch-scroll"><div className="ch-inner">
        <div className="feed-card"><div className="feed-card-inner">
          <div className="feed-title">{lang === 'en' ? 'Program not found' : lang === 'fr' ? 'Programme introuvable' : '프로그램을 찾을 수 없어요'}</div>
          <div className="feed-footer"><button className="feed-action" onClick={() => window.location.href='/programs'}>← {lang === 'en' ? 'Back' : lang === 'fr' ? 'Retour' : '돌아가기'}</button></div>
        </div></div>
      </div></div>
    </div>
  )

  const progName  = lang === 'en' ? p.en        : lang === 'fr' ? p.fr        : p.lang
  const progLevel = lang === 'en' ? pp.levelEn  : lang === 'fr' ? pp.levelFr  : pp.level
  const progScene = lang === 'en' ? pp.sceneEn  : lang === 'fr' ? pp.sceneFr  : pp.scene
  const progAct   = lang === 'en' ? pp.activeEn : lang === 'fr' ? pp.activeFr : pp.active
  const progCls   = lang === 'en' ? pp.classesEn: lang === 'fr' ? pp.classesFr: pp.classes
  const progPrice = lang === 'en' ? pp.priceEn  : lang === 'fr' ? pp.priceFr  : pp.price

  const subBtn    = lang === 'en' ? '🔔 Subscribe' : lang === 'fr' ? '🔔 S\'abonner' : '🔔 소식 받기'
  const subBtn4   = lang === 'en' ? '🔔 Get notified for Session 4' : lang === 'fr' ? '🔔 Notification Session 4' : '🔔 4기 소식 받기'
  const backBtn   = lang === 'en' ? '← All programs' : lang === 'fr' ? '← Tous les programmes' : '← 전체 보기'
  const pinLabel  = lang === 'en' ? `📌 ${progName} Program` : lang === 'fr' ? `📌 Programme ${progName}` : `📌 ${progName} 프로그램`
  const levelLbl  = lang === 'en' ? 'Level'    : lang === 'fr' ? 'Niveau'  : '레벨'
  const classLbl  = lang === 'en' ? 'Sessions' : lang === 'fr' ? 'Séances' : '수업 횟수'
  const priceLbl  = lang === 'en' ? 'Fee'      : lang === 'fr' ? 'Tarif'   : '참가비'
  const miniTitle = lang === 'en' ? 'You don\'t need to be fluent' : lang === 'fr' ? 'Pas besoin d\'être parfait' : '잘해야 오는 게 아니에요'
  const miniBody  = lang === 'en'
    ? 'HAKKYO is for people who want to try speaking, not people who already speak perfectly. It\'s okay to make mistakes — conversation flows when you talk together.'
    : lang === 'fr'
    ? 'HAKKYO est pour ceux qui veulent essayer de parler, pas pour ceux qui parlent déjà parfaitement. Les erreurs sont bienvenues — la conversation vient naturellement.'
    : 'HAKKYO는 완벽하게 말하는 사람보다, 말해보고 싶은 사람을 위한 곳이에요. 틀려도 괜찮아요. 함께 이야기하다 보면 어느새 표현이 나와요.'

  return (
    <div className="ch-feed">
      <div className="ch-header">
        <span className="ch-header-icon">📚</span>
        <h1 className="ch-header-title">{progName}</h1>
        <span className="ch-header-desc">{progLevel} · SESSION 04</span>
        <button className="ch-header-action" onClick={() => window.location.href='/apply/news'}>
          {subBtn}
        </button>
      </div>
      <div className="ch-scroll">
        <div className="ch-inner">
          <div className="feed-card feed-card-pinned">
            <div className="feed-pin-bar">{pinLabel}</div>
            <div className="feed-card-inner">
              <div className="feed-meta">
                <div className="feed-avatar" style={{ background:'#f5c542' }}>H</div>
                <span className="feed-author">HAKKYO</span>
                <span className="feed-tag feed-tag-program">PROGRAM</span>
                <span className="feed-time">2026 FALL</span>
              </div>
              <div className="feed-title">{p.lang} · {p.en}</div>
              <div className="feed-body">
                <p>{progScene}</p>
                <ul>
                  <li>{levelLbl}: {progLevel}</li>
                  <li>{classLbl}: {progCls}</li>
                  <li>Active Output: {progAct}</li>
                  <li>{priceLbl}: {progPrice}</li>
                </ul>
              </div>
              <div className="feed-footer">
                <button className="feed-action subscribed" onClick={() => window.location.href='/apply/news'}>{subBtn4}</button>
                <button className="feed-action" onClick={() => window.location.href='/programs'}>{backBtn}</button>
              </div>
            </div>
          </div>

          <div className="feed-card">
            <div className="feed-card-inner">
              <div className="feed-meta">
                <div className="feed-avatar" style={{ background:'#111', color:'#f5c542', fontSize:14 }}>🐱</div>
                <span className="feed-author">MINI</span>
                <span className="feed-tag">MINI'S NOTE</span>
              </div>
              <div className="feed-title">{miniTitle}</div>
              <div className="feed-body"><p>{miniBody}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NewPrograms() {
  const { slug } = useParams<{ slug?: string }>()
  const { lang } = useLang()
  const t = useT()
  if (slug) return <ProgramDetail slug={slug} />

  const subBtn    = lang === 'en' ? '🔔 Subscribe' : lang === 'fr' ? '🔔 S\'abonner' : '🔔 소식 받기'
  const pinLabel  = lang === 'en' ? '📌 Session 4 Info' : lang === 'fr' ? '📌 Info Session 4' : '📌 4기 안내'
  const ctaTitle  = lang === 'en' ? 'Session 4 Language Programs — Starting October 2026' : lang === 'fr' ? 'Programmes de langues Session 4 — Début octobre 2026' : '4기 언어 프로그램 — 2026년 10월 시작 예정'
  const ctaBody   = lang === 'en' ? 'Enrollment for Korean, English, and French programs is opening soon. Subscribers will be notified first with exact dates and fees.' : lang === 'fr' ? 'Les inscriptions aux programmes de coréen, anglais et français ouvrent bientôt. Les abonnés seront les premiers informés des dates et tarifs exacts.' : '한국어·영어·불어 프로그램 4기 모집이 곧 시작돼요. 정확한 일정과 참가비는 소식 신청자에게 가장 먼저 알려드릴게요.'
  const subBtn4   = lang === 'en' ? '🔔 Subscribe for updates' : lang === 'fr' ? '🔔 S\'abonner aux mises à jour' : '🔔 소식 신청하기'
  const listLabel = lang === 'en' ? 'Program List' : lang === 'fr' ? 'Liste des programmes' : '프로그램 목록'
  const faqLabel  = lang === 'en' ? 'FAQ' : lang === 'fr' ? 'Questions fréquentes' : '자주 묻는 질문'

  const faqs: [string, string][] = lang === 'en' ? [
    ['Can I join even if I\'m not fluent?', 'HAKKYO is for people who want to try speaking, not people who already speak perfectly. Check each program\'s level guide and choose the class that fits you.'],
    ['When will Session 4 dates and fees be announced?', 'We\'re preparing for an October 2026 start. Subscribers will be the first to know once the exact schedule and fees are confirmed.'],
    ['What language is the class taught in?', 'Each program focuses on the target language, but mentors naturally help in other languages when understanding is needed.'],
  ] : lang === 'fr' ? [
    ['Puis-je participer même si je ne suis pas à l\'aise ?', 'HAKKYO est pour ceux qui veulent essayer de parler. Consultez le guide de niveau de chaque programme et choisissez le cours qui vous convient.'],
    ['Quand les dates et tarifs de la Session 4 seront-ils annoncés ?', 'Nous préparons un début en octobre 2026. Les abonnés seront les premiers informés une fois le programme et les tarifs confirmés.'],
    ['Dans quelle langue se déroulent les cours ?', 'Chaque programme est centré sur la langue cible, mais les mentors aident naturellement dans d\'autres langues si nécessaire.'],
  ] : [
    ['언어를 잘하지 못해도 참여할 수 있나요?', 'HAKKYO는 완벽하게 말하는 사람보다, 말해보고 싶은 사람을 위한 곳이에요. 프로그램별 레벨 안내를 확인한 뒤 자신에게 맞는 수업을 선택할 수 있어요.'],
    ['4기 일정과 참가비는 언제 공개되나요?', '2026년 10월 시작을 준비하고 있어요. 정확한 일정과 참가비가 정해지면 소식 신청자에게 가장 먼저 알려드려요.'],
    ['수업은 어떤 언어로 진행되나요?', '한국어·영어·불어 프로그램별로 목표 언어를 중심으로 진행하되, 이해가 필요할 때는 멘토가 다른 언어로 자연스럽게 도와드려요.'],
  ]

  return (
    <div className="ch-feed">
      <div className="ch-header">
        <span className="ch-header-icon">📚</span>
        <h1 className="ch-header-title">{t.programs.title}</h1>
        <span className="ch-header-desc">SESSION 04 · 2026 FALL</span>
        <button className="ch-header-action" onClick={() => window.location.href='/apply/news'}>
          {subBtn}
        </button>
      </div>
      <div className="ch-scroll">
        <div className="ch-inner">

          <div className="feed-card feed-card-pinned">
            <div className="feed-pin-bar">{pinLabel}</div>
            <div className="feed-card-inner">
              <div className="feed-meta">
                <div className="feed-avatar" style={{ background:'#f5c542' }}>H</div>
                <span className="feed-author">HAKKYO</span>
                <span className="feed-tag feed-tag-program">PROGRAM</span>
                <span className="feed-time">2026 FALL</span>
              </div>
              <div className="feed-title">{ctaTitle}</div>
              <div className="feed-body"><p>{ctaBody}</p></div>
              <div className="feed-footer">
                <button className="feed-action subscribed" onClick={() => window.location.href='/apply/news'}>{subBtn4}</button>
              </div>
            </div>
          </div>

          <div className="feed-divider">{listLabel}</div>

          <div className="feed-programs-grid">
            {programs.map(p => {
              const pp = p as any
              const name  = lang === 'en' ? p.en       : lang === 'fr' ? p.fr       : p.lang
              const level = lang === 'en' ? pp.levelEn : lang === 'fr' ? pp.levelFr : pp.level
              const scene = lang === 'en' ? pp.sceneEn : lang === 'fr' ? pp.sceneFr : pp.scene
              return (
                <a key={p.en} href={p.href} className="feed-prog-card">
                  <div className="feed-prog-mark">{p.mark}</div>
                  <div className="feed-prog-lang">{name}</div>
                  <div className="feed-prog-level">{level}</div>
                  <div className="feed-prog-desc">{scene}</div>
                </a>
              )
            })}
          </div>

          <div className="feed-divider">{faqLabel}</div>
          {faqs.map(([q, a], i) => <FaqCard key={i} q={q} a={a} />)}

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
