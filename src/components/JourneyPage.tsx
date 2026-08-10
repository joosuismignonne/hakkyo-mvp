/**
 * JourneyPage — shared layout for /arriving, /settling, and future journey pages.
 *
 * Provides: page header, check-strip chips, tab pills, two-column layout
 * (main content + sticky sidebar). All sections (Hero, Options, Compare,
 * Community, HelpLinks, FAQ, Ask) are rendered here.
 *
 * Pass `extraContent` for tab-specific sections (e.g. housing listings on /arriving).
 */
import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { tri, type JourneyStep, type HeroData, type OptionData, type CompareTable, type CommunityNote, type HelpLink, type FAQItem } from '../types/journey'

// ─── Props ────────────────────────────────────────────────────────────────────

interface JourneyPhase {
  id: string
  label: { ko: string; en: string; fr: string }
  stepIds: string[]
}

interface JourneyPageProps {
  steps: JourneyStep[]
  progressKey: string
  eyebrow: { ko: string; en: string; fr: string }
  title: { ko: string; en: string; fr: string }
  subtitle: { ko: string; en: string; fr: string }
  extraContent?: (tabId: string, lang: string) => React.ReactNode
  /** Optional grouping (e.g. "Before arrival" / "Settling in") for pages with many steps.
   *  When given, a phase switcher filters which steps show as check-strip/tab pills.
   *  Overall progress (checked/steps.length) still counts across ALL phases. */
  phases?: JourneyPhase[]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Hero({ data, lang }: { data: HeroData; lang: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-5 mb-8">
      <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-400 mb-2">
        {lang==='ko'?'이게 뭔가요?':lang==='fr'?"Qu'est-ce que c'est?":'What is this?'}
      </p>
      <h2 className="text-[20px] font-light text-gray-900 leading-snug mb-2">{tri(data.title, lang)}</h2>
      <p className="text-[13px] text-gray-500 leading-relaxed mb-4">{tri(data.sub, lang)}</p>
      <div className="flex flex-wrap gap-2">
        {[
          { icon: 'calendar', text: tri(data.when, lang) },
          { icon: 'currency-dollar', text: tri(data.cost, lang) },
          { icon: 'clock', text: tri(data.time, lang) },
          { icon: 'plane', text: tri(data.canBeforeArrival, lang) },
        ].map((c, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 px-2.5 py-1 bg-white border border-gray-200 rounded-full">
            <i className={`ti ti-${c.icon} text-[12px]`} aria-hidden="true" />{c.text}
          </span>
        ))}
      </div>
    </div>
  )
}

function OptionCard({ opt, lang }: { opt: OptionData; lang: string }) {
  return (
    <div className={`bg-white rounded-xl p-5 ${opt.topPick ? 'border-[1.5px] border-blue-200' : 'border border-gray-200'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[14px] font-medium text-gray-900">{opt.name}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">{tri(opt.sub, lang)}</p>
        </div>
        {opt.topPick && (
          <span className="flex-shrink-0 text-[9px] font-bold tracking-wider uppercase px-2 py-1 rounded bg-blue-50 text-blue-700">
            {lang==='ko'?'추천':lang==='fr'?'Recommandé':'Top pick'}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {opt.meta.map((m, i) => (
          <span key={i} className="inline-flex items-center gap-1 text-[10px] text-gray-500 px-2 py-0.5 bg-gray-50 rounded-full border border-gray-100">
            <i className={`ti ti-${m.icon} text-[11px]`} aria-hidden="true" />{tri(m.label, lang)}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[9px] font-bold tracking-wider uppercase text-green-700 mb-2">
            {lang==='ko'?'이런 분께 적합':lang==='fr'?'Convient si':'Works well for'}
          </p>
          {opt.worksFor.map((w, i) => <p key={i} className="text-[11px] text-gray-600 leading-snug mb-1">{tri(w, lang)}</p>)}
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[9px] font-bold tracking-wider uppercase text-gray-400 mb-2">
            {lang==='ko'?'알아두면 좋은 점':lang==='fr'?'À savoir':'Worth knowing'}
          </p>
          {opt.worthKnowing.map((w, i) => <p key={i} className="text-[11px] text-gray-600 leading-snug mb-1">{tri(w, lang)}</p>)}
        </div>
      </div>
      {opt.recommendNote && (
        <div className="mt-3 border-l-2 border-blue-200 pl-3">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            <span className="font-medium text-gray-700">
              {lang==='ko'?'많은 분들의 경험: ':lang==='fr'?'Ce que font beaucoup : ':'A common pattern: '}
            </span>
            {tri(opt.recommendNote, lang)}
          </p>
        </div>
      )}
    </div>
  )
}

function CompareTableComp({ table, lang }: { table: CompareTable; lang: string }) {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-xl">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {table.headers.map((h, i) => (
              <th key={i} className="text-left text-[9px] font-bold tracking-[0.08em] uppercase text-gray-400 px-4 py-3 border-b border-gray-100 whitespace-nowrap bg-gray-50/50">
                {tri(h, lang)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-gray-50/50">
              <td className="px-4 py-3 text-[12px] font-medium text-gray-900 border-b border-gray-100 whitespace-nowrap">{row.name}</td>
              {row.cols.map((c, ci) => (
                <td key={ci} className="px-4 py-3 text-[12px] text-gray-500 border-b border-gray-100">
                  {typeof c === 'boolean'
                    ? c
                      ? <i className="ti ti-check text-green-600 text-[13px]" aria-label="yes" />
                      : <i className="ti ti-x text-gray-300 text-[13px]" aria-label="no" />
                    : c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CommunityNotes({ notes, lang }: { notes: CommunityNote[]; lang: string }) {
  return (
    <div className="flex flex-col gap-3">
      {notes.map((n, i) => (
        <div key={i} className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[14px]">{n.flag}</span>
            <span className="text-[10px] text-gray-400">{tri(n.person, lang)}</span>
          </div>
          <p className="text-[12px] text-gray-700 leading-relaxed italic mb-2">"{tri(n.text, lang)}"</p>
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <i className="ti ti-thumb-up text-[11px]" aria-hidden="true" />{n.likes}
          </div>
        </div>
      ))}
    </div>
  )
}

function HelpLinks({ links, lang }: { links: HelpLink[]; lang: string }) {
  return (
    <div className="flex flex-col gap-2">
      {links.map((l, i) => {
        const cls = "flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-100 text-[12px] text-gray-600 hover:bg-gray-100 transition-colors no-underline"
        const icon = l.url.startsWith('/') ? 'ti-arrow-right' : 'ti-external-link'
        const inner = (
          <>
            <i className={`ti ${icon} text-[14px] text-gray-400`} aria-hidden="true" />
            <span className="flex-1">{tri(l.label, lang)}</span>
            <span className="text-[10px] text-gray-400">{l.domain}</span>
          </>
        )
        return l.url.startsWith('/') ? (
          <Link key={i} to={l.url} className={cls}>{inner}</Link>
        ) : (
          <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
        )
      })}
    </div>
  )
}

function FAQ({ items, lang }: { items: FAQItem[]; lang: string }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-[12px] font-medium text-gray-800 bg-white hover:bg-gray-50 transition-colors"
          >
            {tri(item.q, lang)}
            <i className={`ti ti-chevron-down text-[14px] text-gray-400 flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {open === i && (
            <div className="px-4 pb-4 pt-1 text-[12px] text-gray-500 leading-relaxed bg-gray-50/50">
              {tri(item.a, lang)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function AskCommunity({ lang }: { lang: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-5 text-center">
      <p className="text-[13px] font-medium text-gray-800 mb-1">
        {lang==='ko'?'더 궁금한 것이 있으신가요?':lang==='fr'?'Une question spécifique?':'Have a specific question?'}
      </p>
      <p className="text-[12px] text-gray-400 leading-relaxed mb-4 max-w-[360px] mx-auto">
        {lang==='ko'
          ? '같은 과정을 먼저 경험한 분들이 HAKKYO 커뮤니티에서 기다리고 있어요.'
          : lang==='fr'
          ? "Des personnes qui ont vécu la même expérience vous attendent dans la communauté HAKKYO."
          : 'People who already went through this are in the HAKKYO community and happy to help.'}
      </p>
      <a href="/board" className="inline-block px-4 py-2 bg-gray-900 text-white text-[12px] font-medium rounded-lg hover:bg-gray-700 transition-colors no-underline">
        {lang==='ko'?'커뮤니티에 질문하기':lang==='fr'?'Poser une question':'Ask the community'}
      </a>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-400 whitespace-nowrap">{children}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function JourneyPage({ steps, progressKey, eyebrow, title, subtitle, extraContent, phases }: JourneyPageProps) {
  const { lang } = useLang()
  const [checked, setChecked] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(progressKey) ?? '[]')) }
    catch { return new Set() }
  })
  const [activeTabId, setActiveTabId] = useState<string>(steps[0]?.id ?? '')
  const [activePhaseId, setActivePhaseId] = useState<string>(() =>
    phases?.find(p => p.stepIds.includes(steps[0]?.id ?? ''))?.id ?? phases?.[0]?.id ?? ''
  )
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try { localStorage.setItem(progressKey, JSON.stringify([...checked])) }
    catch {}
  }, [checked, progressKey])

  const pct = Math.round((checked.size / steps.length) * 100)
  const activeStep = steps.find(s => s.id === activeTabId) ?? steps[0]
  const visibleSteps = phases
    ? steps.filter(s => phases.find(p => p.id === activePhaseId)?.stepIds.includes(s.id))
    : steps

  const sl = (ko: string, en: string, fr: string) =>
    lang === 'ko' ? ko : lang === 'fr' ? fr : en

  /** Updates the active step and, if phased, keeps the phase switcher in sync — no scroll. */
  function setStep(id: string) {
    setActiveTabId(id)
    const phase = phases?.find(p => p.stepIds.includes(id))
    if (phase) setActivePhaseId(phase.id)
  }

  function goToTab(id: string) {
    setStep(id)
    setTimeout(() => contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 min-w-0 px-6 lg:px-10 pt-12 md:pt-[72px] lg:pt-24 pb-24">
        <div className="max-w-[900px]">

          {/* Page header */}
          <div className="mb-8">
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-400 mb-3">
              {tri(eyebrow, lang)}
            </p>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <h1 className="text-[32px] font-light tracking-tight text-gray-900 leading-none">
                {tri(title, lang)}
              </h1>
              <div className="text-right shrink-0">
                <p className="text-2xl font-light text-gray-900 tabular-nums leading-none">{checked.size} / {steps.length}</p>
                <p className="text-[11px] text-gray-400 mt-1">{sl('완료', 'done', 'fait')}</p>
              </div>
            </div>
            <p className="text-[13px] text-gray-400 mt-3 leading-relaxed max-w-[520px]">
              {tri(subtitle, lang)}
            </p>
          </div>

          {/* Phase switcher (only for pages with grouped steps) */}
          {phases && phases.length > 1 && (
            <div className="tab-nav mb-4">
              {phases.map(p => (
                <button
                  key={p.id}
                  onClick={() => { const first = p.stepIds[0]; if (first) goToTab(first) }}
                  className={`tab-item${activePhaseId === p.id ? ' active' : ''}`}
                >
                  {tri(p.label, lang)}
                </button>
              ))}
            </div>
          )}

          {/* Check-strip chips */}
          <div className="check-strip mb-6">
            {visibleSteps.map(step => {
              const done = checked.has(step.id)
              return (
                <button key={step.id} onClick={() => {
                  setChecked(prev => { const n = new Set(prev); n.has(step.id) ? n.delete(step.id) : n.add(step.id); return n })
                  goToTab(step.id)
                }}
                  className={`check-chip${done ? ' done' : ''}`}>
                  <span className={`w-3 h-3 rounded-sm border flex-shrink-0 flex items-center justify-center transition-colors ${done ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}>
                    {done && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><polyline points="2,5 4,7 8,3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </span>
                  {tri(step.label, lang)}
                </button>
              )
            })}
          </div>

          {/* Tab pills */}
          <div className="flex gap-1 flex-wrap mb-6">
            {visibleSteps.map(step => (
              <button key={step.id} onClick={() => goToTab(step.id)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors whitespace-nowrap ${
                  activeTabId === step.id ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}>
                {tri(step.label, lang)}
              </button>
            ))}
          </div>

          {/* Two-column layout: main + sidebar */}
          <div ref={contentRef} className="flex gap-8 items-start">

            {/* Main content */}
            <div className="flex-1 min-w-0">

              <Hero data={activeStep.hero} lang={lang} />

              {activeStep.options.length > 0 && (
                <div className="mb-10">
                  <SectionTitle>{sl('추천 선택지', 'Recommended options', 'Options recommandées')}</SectionTitle>
                  <div className="flex flex-col gap-4">
                    {activeStep.options.map((opt, i) => <OptionCard key={i} opt={opt} lang={lang} />)}
                  </div>
                </div>
              )}

              {activeStep.compareTable.rows.length > 0 && (
                <div className="mb-10">
                  <SectionTitle>{sl('비교 표', 'Side-by-side comparison', 'Comparaison')}</SectionTitle>
                  <CompareTableComp table={activeStep.compareTable} lang={lang} />
                </div>
              )}

              {activeStep.communityNotes.length > 0 && (
                <div className="mb-10">
                  <SectionTitle>{sl('먼저 경험한 분들의 이야기', 'Community experiences', 'Témoignages')}</SectionTitle>
                  <CommunityNotes notes={activeStep.communityNotes} lang={lang} />
                </div>
              )}

              {extraContent && extraContent(activeStep.id, lang)}

              {activeStep.helpLinks.length > 0 && (
                <div className="mb-10">
                  <SectionTitle>{sl('도움이 되는 링크', 'Helpful links', 'Liens utiles')}</SectionTitle>
                  <HelpLinks links={activeStep.helpLinks} lang={lang} />
                </div>
              )}

              {activeStep.faq.length > 0 && (
                <div className="mb-10">
                  <SectionTitle>{sl('자주 묻는 질문', 'Frequently asked questions', 'Questions fréquentes')}</SectionTitle>
                  <FAQ items={activeStep.faq} lang={lang} />
                </div>
              )}

              <div className="mb-4">
                <SectionTitle>{sl('커뮤니티에 질문하기', 'Ask the community', 'Demander à la communauté')}</SectionTitle>
                <AskCommunity lang={lang} />
              </div>

            </div>

            {/* Sticky sidebar */}
            <aside className="hidden lg:block w-72 shrink-0 sticky top-24">
              <div className="border border-gray-100 rounded-xl p-4 bg-white">
                <div className="mb-4">
                  <p className="text-[9px] font-bold tracking-[0.1em] uppercase text-gray-400 mb-1">{sl('현재 주제', 'Current topic', 'Sujet actuel')}</p>
                  <p className="text-[14px] font-medium text-gray-900">{tri(activeStep.label, lang)}</p>
                </div>

                {activeStep.sidebar.quickFacts.length > 0 && (
                  <div className="border-t border-gray-100 pt-3 mb-4">
                    <p className="text-[9px] font-bold tracking-[0.1em] uppercase text-gray-400 mb-2">{sl('빠른 참고', 'Quick facts', 'Infos rapides')}</p>
                    {activeStep.sidebar.quickFacts.map((f, i) => (
                      <div key={i} className="flex justify-between items-baseline py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-[11px] text-gray-500">{tri(f.label, lang)}</span>
                        <span className="text-[11px] font-medium text-gray-900 ml-2 text-right">{tri(f.value, lang)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-gray-100 pt-3 mb-4">
                  <p className="text-[9px] font-bold tracking-[0.1em] uppercase text-gray-400 mb-2">{sl('일반적인 시기', 'Estimated timeline', 'Calendrier habituel')}</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{tri(activeStep.sidebar.timeline, lang)}</p>
                </div>

                <div className="border-t border-gray-100 pt-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-bold tracking-[0.1em] uppercase text-gray-400">{sl('전체 진행률', 'Overall progress', 'Progression')}</p>
                    <button
                      onClick={() => setChecked(new Set())}
                      className={`text-[9px] transition-colors ${checked.size > 0 ? 'text-gray-400 hover:text-gray-600' : 'text-gray-200 cursor-default'}`}
                      disabled={checked.size === 0}
                    >
                      {sl('초기화', 'Reset', 'Réinitialiser')}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-900 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] font-medium text-gray-500 tabular-nums">{pct}%</span>
                  </div>
                </div>

                {/* Completion card */}
                <div className="border-t border-gray-100 pt-3 mb-3">
                  <div className="rounded-xl bg-gray-900 text-white px-3 py-3">
                    <p className="text-[12px] font-semibold leading-snug mb-1">{tri(activeStep.completionCard.headline, lang)}</p>
                    <p className="text-[11px] text-gray-400 leading-relaxed mb-3">{tri(activeStep.completionCard.body, lang)}</p>
                    <button
                      onClick={() => {
                        setChecked(prev => { const n = new Set(prev); n.add(activeStep.id); return n })
                        if (activeStep.sidebar.nextStepId) {
                          setTimeout(() => setStep(activeStep.sidebar.nextStepId!), 300)
                        }
                      }}
                      className={`text-[11px] font-semibold transition-colors ${checked.has(activeStep.id) ? 'text-green-400' : 'text-white hover:text-gray-300'}`}
                    >
                      {checked.has(activeStep.id)
                        ? sl('✓ 완료됨', '✓ Done', '✓ Fait')
                        : sl('완료로 표시하기 →', 'Mark as done →', 'Marquer comme fait →')
                      }
                    </button>
                  </div>
                </div>

                {activeStep.sidebar.nextStepId && activeStep.sidebar.nextStepLabel && (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-[9px] font-bold tracking-[0.1em] uppercase text-gray-400 mb-2">{sl('다음 단계', 'Next step', 'Prochaine étape')}</p>
                    <button
                      onClick={() => goToTab(activeStep.sidebar.nextStepId!)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-gray-900 text-white rounded-lg text-[12px] font-medium hover:bg-gray-700 transition-colors"
                    >
                      <span>{tri(activeStep.sidebar.nextStepLabel, lang)}</span>
                      <i className="ti ti-arrow-right text-[14px]" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </aside>

          </div>
        </div>
      </main>
    </div>
  )
}
