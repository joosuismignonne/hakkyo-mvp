/**
 * 바로 말하기 — 2-click emergency phrase tool.
 * Step 1: pick category  →  Step 2: pick situation  →  view EN/FR cards.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { Volume2, Copy, Check, ChevronLeft, Zap, Bookmark, BookmarkCheck, Search, X } from 'lucide-react'
import { useLang } from '../context/LangContext'
import {
  QUICK_PHRASES, EMERGENCY_PHRASES,
  type PhraseCategory, type Situation,
} from '../data/quickPhrases'

// ─── TTS ──────────────────────────────────────────────────────────────────────

const EN_VOICES_PREF = ['en-CA', 'en-US', 'en-GB', 'en-AU']
const FR_VOICES_PREF = ['fr-CA', 'fr-FR', 'fr-BE', 'fr']

function pickVoice(lang: 'en' | 'fr'): SpeechSynthesisVoice | null {
  const all = window.speechSynthesis?.getVoices() ?? []
  const prefs = lang === 'en' ? EN_VOICES_PREF : FR_VOICES_PREF
  for (const code of prefs) {
    const v = all.find(v => v.lang.startsWith(code))
    if (v) return v
  }
  return all.find(v => v.lang.startsWith(lang === 'en' ? 'en' : 'fr')) ?? null
}

function speak(text: string, lang: 'en' | 'fr', slow = false) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt      = new SpeechSynthesisUtterance(text)
  const voice    = pickVoice(lang)
  if (voice) utt.voice = voice
  utt.lang  = lang === 'en' ? 'en-CA' : 'fr-CA'
  utt.rate  = slow ? 0.65 : 0.88
  utt.pitch = 1
  window.speechSynthesis.speak(utt)
}

async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true } catch { return false }
}

// ─── localStorage saves ───────────────────────────────────────────────────────

const SAVED_KEY = 'hakkyo_saved_phrases'

function loadSaved(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]')) }
  catch { return new Set() }
}
function persistSaved(s: Set<string>) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify([...s])) } catch {}
}

// ─── Tone labels ──────────────────────────────────────────────────────────────

const TONE_LABELS = {
  natural: { ko: '자연스러운', en: 'Natural',    fr: 'Naturel'  },
  polite:  { ko: '정중한',    en: 'Polite',     fr: 'Poli'     },
  simple:  { ko: '짧고 간단', en: 'Very simple', fr: 'Simple'  },
}
const TONE_COLORS = {
  natural: { bg: '#F0FDF4', text: '#15803D', border: '#86EFAC' },
  polite:  { bg: '#EFF6FF', text: '#1D4ED8', border: '#93C5FD' },
  simple:  { bg: '#FFF7ED', text: '#C2410C', border: '#FDB97F' },
}

type Tone = 'natural' | 'polite' | 'simple'
const TONES: Tone[] = ['natural', 'polite', 'simple']

// ─── Single phrase row (EN or FR) ─────────────────────────────────────────────

function PhraseRow({
  text, lang, saved, tts, onToggleSave,
}: {
  text: string; lang: 'en' | 'fr'; saved: boolean; tts: boolean
  onToggleSave: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [playing, setPlaying] = useState(false)

  function handlePlay(slow: boolean) {
    speak(text, lang, slow)
    setPlaying(true)
    setTimeout(() => setPlaying(false), 2000)
  }

  async function handleCopy() {
    const ok = await copyText(text)
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1800) }
  }

  return (
    <div className="flex items-start gap-2 py-2">
      <p className="flex-1 text-[14px] leading-relaxed text-gray-800">{text}</p>
      <div className="flex gap-1 shrink-0 pt-0.5">
        {tts && (
          <>
            <button
              onClick={() => handlePlay(false)}
              title={lang === 'en' ? 'Play' : 'Écouter'}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
              style={playing
                ? { background: lang === 'en' ? '#EFF6FF' : '#FEF2F2', color: lang === 'en' ? '#1D4ED8' : '#DC2626' }
                : { color: '#9CA3AF' }}
            >
              <Volume2 size={13} />
            </button>
            <button
              onClick={() => handlePlay(true)}
              title="Slow"
              className="w-6 h-6 flex items-center justify-center rounded text-[9px] font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              0.6×
            </button>
          </>
        )}
        <button onClick={handleCopy} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
          {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
        </button>
        <button onClick={onToggleSave} className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
          style={saved ? { color: 'var(--y-h)', background: 'var(--y-l)' } : { color: '#D1D5DB' }}>
          {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
        </button>
      </div>
    </div>
  )
}

// ─── Phrase card (one tone) ───────────────────────────────────────────────────

function ToneCard({
  tone, en, fr, situationId, saved, onToggleSave, tts, lang,
}: {
  tone: Tone; en: string; fr: string; situationId: string
  saved: Set<string>; onToggleSave: (key: string) => void
  tts: boolean; lang: string
}) {
  const col   = TONE_COLORS[tone]
  const label = TONE_LABELS[tone]
  const toneLabel = lang === 'ko' ? label.ko : lang === 'fr' ? label.fr : label.en
  const enKey = `${situationId}_${tone}_en`
  const frKey = `${situationId}_${tone}_fr`

  return (
    <div className="border rounded-2xl overflow-hidden" style={{ borderColor: col.border }}>
      {/* Tone label */}
      <div className="px-4 py-2 flex items-center gap-2" style={{ background: col.bg }}>
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: col.text }}>
          {toneLabel}
        </span>
      </div>

      <div className="px-4 divide-y divide-gray-100 bg-white">
        {/* English */}
        <div>
          <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest block pt-2.5 pb-0.5">🇨🇦 EN</span>
          <PhraseRow
            text={en} lang="en" tts={tts}
            saved={saved.has(enKey)}
            onToggleSave={() => onToggleSave(enKey)}
          />
        </div>
        {/* French */}
        <div>
          <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest block pt-2.5 pb-0.5">🇫🇷 FR</span>
          <PhraseRow
            text={fr} lang="fr" tts={tts}
            saved={saved.has(frKey)}
            onToggleSave={() => onToggleSave(frKey)}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Situation detail view ────────────────────────────────────────────────────

function SituationView({
  situation, catKo, saved, onToggleSave, onBack, lang,
}: {
  situation: Situation; catKo: string
  saved: Set<string>; onToggleSave: (key: string) => void
  onBack: () => void; lang: string
}) {
  const tts = typeof window !== 'undefined' && !!window.speechSynthesis

  return (
    <div>
      {/* Back + breadcrumb */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-900 mb-4 transition-colors">
        <ChevronLeft size={16} />
        <span>{catKo}</span>
      </button>

      {/* Korean situation label */}
      <div className="mb-5">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">한국어</p>
        <h2 className="text-[18px] font-bold text-gray-900 leading-snug">{situation.ko}</h2>
      </div>

      {/* Tone cards */}
      <div className="space-y-3">
        {TONES.map(tone => (
          <ToneCard
            key={tone}
            tone={tone}
            en={situation.en[tone]}
            fr={situation.fr[tone]}
            situationId={situation.id}
            saved={saved}
            onToggleSave={onToggleSave}
            tts={tts}
            lang={lang}
          />
        ))}
      </div>

      {!tts && (
        <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-4">
          {lang === 'ko'
            ? '이 기기에서는 음성 재생이 지원되지 않습니다.'
            : lang === 'fr'
            ? "La synthèse vocale n'est pas disponible sur cet appareil."
            : 'Speech is not supported on this device.'}
        </p>
      )}
    </div>
  )
}

// ─── Emergency overlay ────────────────────────────────────────────────────────

function EmergencyPanel({ onClose, saved, onToggleSave, lang }: {
  onClose: () => void
  saved: Set<string>
  onToggleSave: (key: string) => void
  lang: string
}) {
  const tts = typeof window !== 'undefined' && !!window.speechSynthesis

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col"
        style={{ animation: 'modal-up 0.18s ease-out', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-red-100 shrink-0"
          style={{ background: '#FEF2F2' }}>
          <div>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-red-500" />
              <h2 className="text-[15px] font-bold text-red-700">
                {lang === 'ko' ? '지금 바로 말해야 해요' : lang === 'fr' ? 'Je dois parler maintenant' : 'I need to speak now'}
              </h2>
            </div>
            <p className="text-[11px] text-red-400 mt-0.5">
              {lang === 'ko' ? '가장 유용한 긴급 표현들' : lang === 'fr' ? 'Phrases d\'urgence les plus utiles' : 'Most useful emergency phrases'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-red-400 hover:bg-red-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {EMERGENCY_PHRASES.map((p, i) => {
            const enKey = `emergency_${i}_en`
            const frKey = `emergency_${i}_fr`
            return (
              <div key={i} className="bg-gray-50 rounded-2xl px-4 py-3">
                <p className="text-[12px] text-gray-500 mb-2 font-medium">{p.ko}</p>
                <div className="space-y-1 divide-y divide-gray-200">
                  <div>
                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest block pt-1 pb-0.5">🇨🇦 EN</span>
                    <PhraseRow text={p.en} lang="en" tts={tts} saved={saved.has(enKey)} onToggleSave={() => onToggleSave(enKey)} />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest block pt-2 pb-0.5">🇫🇷 FR</span>
                    <PhraseRow text={p.fr} lang="fr" tts={tts} saved={saved.has(frKey)} onToggleSave={() => onToggleSave(frKey)} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Saved phrases panel ──────────────────────────────────────────────────────

function SavedPanel({ saved, onClose, onClear, lang }: {
  saved: Set<string>; onClose: () => void
  onClear: (key: string) => void; lang: string
}) {
  const tts = typeof window !== 'undefined' && !!window.speechSynthesis

  // Resolve saved keys to actual phrase text
  const resolved: { key: string; text: string; phraseLang: 'en' | 'fr' }[] = []

  // Emergency phrases
  EMERGENCY_PHRASES.forEach((p, i) => {
    const enKey = `emergency_${i}_en`
    const frKey = `emergency_${i}_fr`
    if (saved.has(enKey)) resolved.push({ key: enKey, text: p.en, phraseLang: 'en' })
    if (saved.has(frKey)) resolved.push({ key: frKey, text: p.fr, phraseLang: 'fr' })
  })

  // Category phrases
  QUICK_PHRASES.forEach(cat => {
    cat.situations.forEach(sit => {
      TONES.forEach(tone => {
        const enKey = `${sit.id}_${tone}_en`
        const frKey = `${sit.id}_${tone}_fr`
        if (saved.has(enKey)) resolved.push({ key: enKey, text: sit.en[tone], phraseLang: 'en' })
        if (saved.has(frKey)) resolved.push({ key: frKey, text: sit.fr[tone], phraseLang: 'fr' })
      })
    })
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col"
        style={{ animation: 'modal-up 0.18s ease-out', maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <h2 className="text-[15px] font-bold text-gray-900">
            {lang === 'ko' ? '저장된 표현' : lang === 'fr' ? 'Expressions sauvegardées' : 'Saved phrases'}
            <span className="ml-2 text-[12px] text-gray-400 font-normal">({resolved.length})</span>
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-50">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {resolved.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Bookmark size={28} className="mx-auto mb-3 opacity-40" />
              <p className="text-[14px]">{lang === 'ko' ? '저장된 표현이 없어요.' : lang === 'fr' ? 'Aucune expression sauvegardée.' : 'No saved phrases yet.'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {resolved.map(({ key, text, phraseLang }) => (
                <div key={key} className="flex items-start gap-2 bg-gray-50 rounded-xl px-3.5 py-3">
                  <span className="text-[10px] font-bold shrink-0 mt-0.5" style={{ color: phraseLang === 'en' ? '#60A5FA' : '#F87171' }}>
                    {phraseLang === 'en' ? '🇨🇦 EN' : '🇫🇷 FR'}
                  </span>
                  <p className="flex-1 text-[13px] text-gray-800 leading-relaxed">{text}</p>
                  <div className="flex gap-1 shrink-0">
                    {tts && (
                      <button onClick={() => speak(text, phraseLang)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                        <Volume2 size={12} />
                      </button>
                    )}
                    <button onClick={async () => { await copyText(text) }} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                      <Copy size={12} />
                    </button>
                    <button onClick={() => onClear(key)} className="w-7 h-7 flex items-center justify-center rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Step = 'categories' | 'situations' | 'detail'

export default function Phrases() {
  const { lang, t } = useLang()

  const [step, setStep]             = useState<Step>('categories')
  const [activeCategory, setActiveCategory] = useState<PhraseCategory | null>(null)
  const [activeSituation, setActiveSituation] = useState<Situation | null>(null)

  const [saved, setSaved]           = useState<Set<string>>(loadSaved)
  const [showEmergency, setShowEmergency] = useState(false)
  const [showSaved, setShowSaved]   = useState(false)

  const [search, setSearch]         = useState('')
  const [searchResults, setSearchResults] = useState<{ situation: Situation; cat: PhraseCategory }[]>([])

  // Voices load async in some browsers
  useEffect(() => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.onvoiceschanged = () => {}
  }, [])

  // Search
  useEffect(() => {
    const q = search.trim().toLowerCase()
    if (!q) { setSearchResults([]); return }
    const results: { situation: Situation; cat: PhraseCategory }[] = []
    for (const cat of QUICK_PHRASES) {
      for (const sit of cat.situations) {
        if (
          sit.ko.includes(search) ||
          sit.en.natural.toLowerCase().includes(q) ||
          sit.en.polite.toLowerCase().includes(q) ||
          sit.fr.natural.toLowerCase().includes(q) ||
          sit.fr.polite.toLowerCase().includes(q)
        ) {
          results.push({ situation: sit, cat })
        }
      }
    }
    setSearchResults(results)
  }, [search])

  function toggleSaved(key: string) {
    setSaved(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      persistSaved(next)
      return next
    })
  }

  function selectCategory(cat: PhraseCategory) {
    setActiveCategory(cat)
    setStep('situations')
    setSearch('')
  }

  function selectSituation(sit: Situation, cat?: PhraseCategory) {
    if (cat) setActiveCategory(cat)
    setActiveSituation(sit)
    setStep('detail')
    setSearch('')
  }

  function backToCategories() {
    setStep('categories')
    setActiveCategory(null)
    setActiveSituation(null)
  }

  function backToSituations() {
    setStep('situations')
    setActiveSituation(null)
  }

  const catLabel = (cat: PhraseCategory) =>
    lang === 'ko' ? cat.ko : lang === 'fr' ? cat.fr : cat.en

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-28">
      <div className="max-w-[680px] mx-auto px-4 py-7">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-5 gap-3">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900">{t('일상 표현', 'Everyday Words', 'Mots du quotidien')}</h1>
            <p className="text-[13px] text-gray-500 mt-0.5 leading-relaxed">
              {t(
                '카페, 집주인, 병원, 면접 — 실제 상황에서 바로 쓸 수 있는 표현',
                'Real words for real situations — cafés, landlords, doctors, job interviews.',
                'Des mots pour le quotidien — cafés, propriétaires, médecins, entretiens.',
              )}
            </p>
          </div>

          {/* Saved count chip */}
          {saved.size > 0 && (
            <button
              onClick={() => setShowSaved(true)}
              className="shrink-0 flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors"
              style={{ background: 'var(--y-l)', borderColor: 'var(--y)', color: '#92400E' }}
            >
              <BookmarkCheck size={12} />
              {saved.size}
            </button>
          )}
        </div>

        {/* ── Narrative Anchor ── */}
        <p className="text-[13px] text-gray-400 leading-relaxed mb-5 italic">
          {t(
            '가끔은 한 문장이 하루 전체를 바꾸기도 해요.',
            'Sometimes one sentence can change an entire day.',
            'Parfois, une seule phrase peut changer toute une journée.',
          )}
        </p>

        {/* ── Emergency button ── */}
        <button
          onClick={() => setShowEmergency(true)}
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl py-3.5 mb-5 font-bold text-[14px] transition-all active:scale-[0.98]"
          style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#DC2626' }}
        >
          <Zap size={16} />
          {t('지금 바로 말해야 해요', 'I need to speak RIGHT NOW', 'Je dois parler maintenant')}
        </button>

        {/* ── Search (secondary) ── */}
        <div className="relative mb-5">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-9 py-2.5 text-[14px] placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
            placeholder={t('표현 검색...', 'Search phrases...', 'Chercher des phrases...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── Search results ── */}
        {search && (
          <div>
            {searchResults.length === 0 ? (
              <p className="text-center text-[14px] text-gray-400 py-8">
                {t('검색 결과가 없어요.', 'No results found.', 'Aucun résultat.')}
              </p>
            ) : (
              <div className="space-y-2 mb-6">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  {searchResults.length}{t('개 결과', ' results', ' résultats')}
                </p>
                {searchResults.map(({ situation, cat }) => (
                  <button
                    key={situation.id}
                    onClick={() => selectSituation(situation, cat)}
                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-left hover:border-gray-300 transition-colors"
                  >
                    <p className="text-[11px] text-gray-400 mb-0.5">{cat.icon} {catLabel(cat)}</p>
                    <p className="text-[14px] font-semibold text-gray-900">{situation.ko}</p>
                    <p className="text-[12px] text-gray-500 mt-0.5 truncate">{situation.en.natural}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Main content (hidden when searching) ── */}
        {!search && (
          <>
            {/* STEP 1: Category grid */}
            {step === 'categories' && (
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  {t('상황 선택', 'Choose a situation', 'Choisissez une situation')}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {QUICK_PHRASES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => selectCategory(cat)}
                      className="bg-white border border-gray-100 rounded-2xl px-4 py-4 text-left hover:border-gray-300 hover:shadow-sm transition-all active:scale-[0.97]"
                    >
                      <span className="text-2xl block mb-2">{cat.icon}</span>
                      <span className="text-[13px] font-semibold text-gray-900 block">{catLabel(cat)}</span>
                      <span className="text-[11px] text-gray-400 block mt-0.5">
                        {cat.situations.length}{t('개 상황', ' situations', ' situations')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Situation list */}
            {step === 'situations' && activeCategory && (
              <div>
                <button onClick={backToCategories} className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-900 mb-4 transition-colors">
                  <ChevronLeft size={16} />
                  {t('상황 목록', 'Categories', 'Catégories')}
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{activeCategory.icon}</span>
                  <h2 className="text-[18px] font-bold text-gray-900">{catLabel(activeCategory)}</h2>
                </div>

                <div className="space-y-2">
                  {activeCategory.situations.map(sit => (
                    <button
                      key={sit.id}
                      onClick={() => selectSituation(sit)}
                      className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3.5 text-left hover:border-gray-300 hover:shadow-sm transition-all active:scale-[0.98] flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-gray-900 mb-0.5">{sit.ko}</p>
                        <p className="text-[12px] text-gray-400 truncate">{sit.en.natural}</p>
                      </div>
                      <ChevronLeft size={14} className="text-gray-300 rotate-180 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: Phrase detail */}
            {step === 'detail' && activeSituation && (
              <SituationView
                situation={activeSituation}
                catKo={activeCategory ? catLabel(activeCategory) : ''}
                saved={saved}
                onToggleSave={toggleSaved}
                onBack={backToSituations}
                lang={lang}
              />
            )}
          </>
        )}

        {/* Footer note */}
        {/* ── Community Voice ── */}
        <div className="mt-10 border-t border-gray-100 pt-6 space-y-3">
          {[
            { author: 'Jiyeon',  text: '카페에서 처음으로 프랑스어로 주문했어요. 엉망이었는데도 점원이 같이 웃어줬어요. 그때부터 덜 무서워졌어요.' },
            { author: 'Minjun',  text: '집주인한테 히터 고장났다고 프랑스어로 문자 보냈는데 그게 진짜 터닝포인트였어요. 말이 되면 사람이 달라지거든요.' },
          ].map((v, i) => (
            <div key={i} className="flex gap-2.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5" style={{ background: 'var(--y)', color: '#111' }}>
                {v.author[0]}
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 mb-0.5">{v.author}</p>
                <p className="text-[12px] text-gray-400 leading-[1.7]">{v.text}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-10">
          {t(
            '표현은 퀘벡 일상 상황을 기준으로 합니다.',
            'Phrases are based on everyday Québec situations.',
            'Les phrases sont basées sur des situations quotidiennes au Québec.',
          )}
        </p>
      </div>

      {/* ── Emergency overlay ── */}
      {showEmergency && (
        <EmergencyPanel
          onClose={() => setShowEmergency(false)}
          saved={saved}
          onToggleSave={toggleSaved}
          lang={lang}
        />
      )}

      {/* ── Saved phrases overlay ── */}
      {showSaved && (
        <SavedPanel
          saved={saved}
          onClose={() => setShowSaved(false)}
          onClear={key => toggleSaved(key)}
          lang={lang}
        />
      )}
    </div>
  )
}
