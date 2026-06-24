import { useState, useRef, useEffect, useCallback } from 'react'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

type Language = 'ko' | 'en' | 'fr'
type Scenario = 'intro' | 'cafe' | 'housing' | 'phone' | 'job' | 'free'
type Step = 'language' | 'scenario' | 'upload' | 'loading' | 'result'

interface Scores {
  pronunciation: number
  grammar: number
  fluency: number
  vocabulary: number
  naturalness: number
}

interface Feedback {
  overall_score: number
  scores: Scores
  strengths: string[]
  improvements: string[]
  practice_sentences: string[]
}

interface Submission {
  id: string
  language: string
  scenario: string
  transcript: string
  feedback: Feedback
  score: number
  created_at: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const LANGUAGES: { code: Language; flag: string; ko: string; en: string; fr: string }[] = [
  { code: 'en', flag: '🇨🇦', ko: '영어', en: 'English', fr: 'Anglais' },
  { code: 'fr', flag: '🇫🇷', ko: '프랑스어', en: 'French', fr: 'Français' },
  { code: 'ko', flag: '🇰🇷', ko: '한국어', en: 'Korean', fr: 'Coréen' },
]

const SCENARIOS: { code: Scenario; emoji: string; ko: string; en: string; fr: string; desc_ko: string; desc_en: string; desc_fr: string }[] = [
  { code: 'intro',   emoji: '👋', ko: '자기소개',    en: 'Self Introduction', fr: 'Se présenter',
    desc_ko: '이름, 출신, 취미 등 자신을 소개해보세요', desc_en: 'Introduce yourself — name, background, hobbies', desc_fr: 'Présentez-vous — nom, origine, loisirs' },
  { code: 'cafe',    emoji: '☕', ko: '카페 주문',    en: 'Café Ordering',     fr: 'Commander au café',
    desc_ko: '카페에서 음료나 음식을 주문해보세요',       desc_en: 'Order a drink or food at a café',             desc_fr: 'Commandez une boisson ou de la nourriture' },
  { code: 'housing', emoji: '🏠', ko: '주거 문의',    en: 'Housing',           fr: 'Logement',
    desc_ko: '집을 구하거나 집주인과 대화하는 상황',       desc_en: 'Talk to a landlord or about finding housing', desc_fr: 'Parler avec un propriétaire ou chercher un logement' },
  { code: 'phone',   emoji: '📞', ko: '전화 통화',    en: 'Phone Call',        fr: 'Appel téléphonique',
    desc_ko: '예약, 문의 등 전화 통화 상황을 연습하세요', desc_en: 'Practice a phone call — booking, inquiry',    desc_fr: 'Entraînez-vous à passer un appel — réservation, renseignement' },
  { code: 'job',     emoji: '💼', ko: '취업 면접',    en: 'Job Interview',     fr: 'Entretien d\'embauche',
    desc_ko: '간단한 취업 면접 질문에 답해보세요',         desc_en: 'Answer basic job interview questions',        desc_fr: 'Répondez à des questions d\'entretien basiques' },
  { code: 'free',    emoji: '🎙️', ko: '자유 스피킹', en: 'Free Speaking',     fr: 'Prise de parole libre',
    desc_ko: '원하는 주제로 자유롭게 말해보세요',           desc_en: 'Speak freely on any topic you like',         desc_fr: 'Parlez librement sur le sujet de votre choix' },
]

const SCORE_LABELS: Record<keyof Scores, { ko: string; en: string; fr: string }> = {
  pronunciation: { ko: '발음',   en: 'Pronunciation', fr: 'Prononciation' },
  grammar:       { ko: '문법',   en: 'Grammar',       fr: 'Grammaire'     },
  fluency:       { ko: '유창성', en: 'Fluency',        fr: 'Fluidité'      },
  vocabulary:    { ko: '어휘',   en: 'Vocabulary',    fr: 'Vocabulaire'   },
  naturalness:   { ko: '자연스러움', en: 'Naturalness', fr: 'Naturel'      },
}

const SCENARIO_LABELS: Record<Scenario, { ko: string; en: string; fr: string }> = {
  intro:   { ko: '자기소개',    en: 'Self Introduction', fr: 'Se présenter'          },
  cafe:    { ko: '카페 주문',   en: 'Café Ordering',     fr: 'Café'                  },
  housing: { ko: '주거 문의',   en: 'Housing',           fr: 'Logement'              },
  phone:   { ko: '전화 통화',   en: 'Phone Call',        fr: 'Appel téléphonique'    },
  job:     { ko: '취업 면접',   en: 'Job Interview',     fr: 'Entretien d\'embauche' },
  free:    { ko: '자유 스피킹', en: 'Free Speaking',     fr: 'Libre'                 },
}

const LANG_LABELS: Record<Language, { ko: string; en: string; fr: string }> = {
  ko: { ko: '한국어', en: 'Korean',  fr: 'Coréen'  },
  en: { ko: '영어',   en: 'English', fr: 'Anglais' },
  fr: { ko: '프랑스어', en: 'French', fr: 'Français' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tri<T extends { ko: string; en: string; fr: string }>(obj: T, lang: string): string {
  return (obj as Record<string, string>)[lang] ?? obj.en
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] text-gray-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value * 10}%`, background: value >= 8 ? '#22c55e' : value >= 5 ? 'var(--y-h, #f5c842)' : '#f97316' }}
        />
      </div>
      <span className="text-[12px] font-semibold text-gray-700 tabular-nums w-6 text-right">{value}</span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LanguageLab() {
  const { lang } = useLang()
  const { user } = useAuth()
  const t = (ko: string, en: string, fr: string) => lang === 'ko' ? ko : lang === 'fr' ? fr : en

  const [step, setStep] = useState<Step>('language')
  const [selectedLang, setSelectedLang] = useState<Language | null>(null)
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState<Submission[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const t2 = (obj: { ko: string; en: string; fr: string }) => tri(obj, lang)

  // Load history
  useEffect(() => {
    if (!user || !supabase) return
    setLoadingHistory(true)
    supabase
      .from('language_lab_submissions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setHistory((data ?? []) as Submission[])
        setLoadingHistory(false)
      })
  }, [user, saved])

  const reset = useCallback(() => {
    setStep('language')
    setSelectedLang(null)
    setSelectedScenario(null)
    setFile(null)
    setTranscript('')
    setFeedback(null)
    setError('')
    setSaved(false)
  }, [])

  const handleFile = (f: File) => {
    const allowed = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/webm']
    if (!allowed.includes(f.type) && !f.name.match(/\.(mp3|wav|m4a|webm)$/i)) {
      setError(t('mp3, wav, m4a 파일만 지원합니다.', 'Only mp3, wav, m4a files are supported.', 'Seuls les fichiers mp3, wav, m4a sont acceptés.'))
      return
    }
    if (f.size > 3 * 1024 * 1024) {
      setError(t('파일이 너무 큽니다. 3MB 이하(약 2분 이내) 녹음을 올려주세요.', 'File too large. Please upload under 3MB (~2 min recording).', 'Fichier trop volumineux. Maximum 3 Mo (~2 min).'))
      return
    }
    setError('')
    setFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async () => {
    if (!file || !selectedLang || !selectedScenario) return
    setStep('loading')
    setError('')
    try {
      const audio_base64 = await fileToBase64(file)
      const res = await fetch('/api/language-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_base64,
          mime_type: file.type || 'audio/mpeg',
          language: selectedLang,
          scenario: selectedScenario,
        }),
      })
      let data: { transcript?: string; feedback?: Feedback; error?: string } = {}
      try {
        data = await res.json()
      } catch {
        if (res.status === 413) throw new Error(t('파일이 너무 큽니다. 더 짧은 녹음을 사용해주세요.', 'File too large for processing. Please use a shorter recording.', 'Fichier trop volumineux. Utilisez un enregistrement plus court.'))
        throw new Error(`Server error ${res.status}`)
      }
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed')
      setTranscript(data.transcript ?? '')
      setFeedback(data.feedback ?? null)
      setStep('result')
    } catch (e) {
      setError(String(e))
      setStep('upload')
    }
  }

  const handleSave = async () => {
    if (!user || !supabase || !feedback || !transcript || !selectedLang || !selectedScenario) return
    setSaving(true)
    await supabase.from('language_lab_submissions').insert({
      user_id: user.id,
      language: selectedLang,
      scenario: selectedScenario,
      transcript,
      feedback,
      score: feedback.overall_score,
      audio_url: null,
    })
    setSaving(false)
    setSaved(true)
  }

  // ── Step: Language ──
  const StepLanguage = (
    <div>
      <p className="t-eyebrow mb-3">{t('나의 여정', 'My Journey', 'Mon parcours')} · Lab</p>
      <h1 className="t-page text-gray-900 mb-2">Language Lab <span className="text-[14px] font-normal text-gray-400 ml-2">Beta</span></h1>
      <p className="text-[14px] text-gray-400 mb-10">
        {t('음성을 업로드하면 AI가 발음, 문법, 유창성을 분석해드립니다.', 'Upload a recording and get AI feedback on your speaking.', 'Téléchargez un enregistrement et recevez des retours IA sur votre expression orale.')}
      </p>

      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-4">{t('1 / 3  —  언어 선택', '1 / 3  —  Select language', '1 / 3  —  Choisir la langue')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-[500px]">
        {LANGUAGES.map(l => (
          <button
            key={l.code}
            onClick={() => { setSelectedLang(l.code); setStep('scenario') }}
            className="flex flex-col items-center gap-2 border border-gray-200 rounded-2xl px-4 py-6 hover:border-gray-900 hover:bg-gray-50 transition-all text-left"
          >
            <span className="text-3xl">{l.flag}</span>
            <span className="text-[15px] font-semibold text-gray-900">{tri(l, lang)}</span>
          </button>
        ))}
      </div>
    </div>
  )

  // ── Step: Scenario ──
  const StepScenario = (
    <div>
      <button onClick={() => setStep('language')} className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-700 mb-6 transition-colors">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="10,3 5,8 10,13"/></svg>
        {t('언어 변경', 'Change language', 'Changer de langue')}
      </button>
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-4">{t('2 / 3  —  시나리오 선택', '2 / 3  —  Select scenario', '2 / 3  —  Choisir un scénario')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[600px]">
        {SCENARIOS.map(s => (
          <button
            key={s.code}
            onClick={() => { setSelectedScenario(s.code); setStep('upload') }}
            className="flex items-start gap-3 border border-gray-200 rounded-2xl px-4 py-4 hover:border-gray-900 hover:bg-gray-50 transition-all text-left"
          >
            <span className="text-2xl mt-0.5 shrink-0">{s.emoji}</span>
            <div>
              <p className="text-[14px] font-semibold text-gray-900 mb-0.5">{tri(s, lang)}</p>
              <p className="text-[12px] text-gray-400 leading-snug">{lang === 'ko' ? s.desc_ko : lang === 'fr' ? s.desc_fr : s.desc_en}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  // ── Step: Upload ──
  const scenario = SCENARIOS.find(s => s.code === selectedScenario)
  const StepUpload = (
    <div className="max-w-[520px]">
      <button onClick={() => setStep('scenario')} className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-700 mb-6 transition-colors">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="10,3 5,8 10,13"/></svg>
        {t('시나리오 변경', 'Change scenario', 'Changer de scénario')}
      </button>

      {scenario && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xl">{scenario.emoji}</span>
          <div>
            <p className="text-[12px] text-gray-400">{selectedLang ? t2(LANG_LABELS[selectedLang]) : ''}</p>
            <p className="text-[15px] font-semibold text-gray-900">{tri(scenario, lang)}</p>
          </div>
        </div>
      )}

      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-4">{t('3 / 3  —  오디오 업로드', '3 / 3  —  Upload audio', '3 / 3  —  Télécharger l\'audio')}</p>

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl px-8 py-12 flex flex-col items-center gap-3 cursor-pointer transition-all ${
          dragOver ? 'border-gray-900 bg-gray-50' : file ? 'border-gray-300 bg-gray-50' : 'border-gray-200 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4,audio/x-m4a"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        {file ? (
          <>
            <span className="text-3xl">🎵</span>
            <p className="text-[14px] font-semibold text-gray-900 text-center">{file.name}</p>
            <p className="text-[12px] text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            <button
              onClick={e => { e.stopPropagation(); setFile(null) }}
              className="text-[11px] text-gray-400 hover:text-gray-700 underline"
            >
              {t('다시 선택', 'Choose different file', 'Choisir un autre fichier')}
            </button>
          </>
        ) : (
          <>
            <span className="text-3xl">🎙️</span>
            <p className="text-[14px] font-semibold text-gray-700 text-center">
              {t('파일을 여기에 드래그하거나 클릭해서 선택', 'Drag & drop or click to upload', 'Glissez-déposez ou cliquez pour télécharger')}
            </p>
            <p className="text-[12px] text-gray-400">mp3 · wav · m4a · {t('최대 20MB', 'max 20MB', '20 Mo max')}</p>
          </>
        )}
      </div>

      {error && (
        <p className="mt-3 text-[12px] text-red-500 bg-red-50 rounded-xl px-4 py-2">{error}</p>
      )}

      {file && (
        <button
          onClick={handleSubmit}
          className="mt-5 w-full py-3 rounded-2xl bg-gray-900 text-white text-[14px] font-semibold hover:bg-gray-700 transition-colors"
        >
          {t('AI 분석 시작 →', 'Analyze with AI →', 'Analyser avec l\'IA →')}
        </button>
      )}

      <p className="mt-4 text-[11px] text-gray-400 text-center">
        {t('녹음은 서버에 저장되지 않습니다. 텍스트 분석 결과만 저장됩니다.', 'Audio is not stored. Only the text analysis is saved.', "L'audio n'est pas stocké. Seule l'analyse texte est sauvegardée.")}
      </p>
    </div>
  )

  // ── Step: Loading ──
  const StepLoading = (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="w-14 h-14 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
      <div className="text-center">
        <p className="text-[15px] font-semibold text-gray-900 mb-1">{t('분석 중...', 'Analyzing...', 'Analyse en cours...')}</p>
        <p className="text-[13px] text-gray-400">{t('Whisper로 음성을 텍스트로 변환하고 있어요', 'Transcribing speech with Whisper', 'Transcription de la parole avec Whisper')}</p>
      </div>
    </div>
  )

  // ── Step: Result ──
  const StepResult = feedback ? (
    <div className="max-w-[640px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-1">{t('분석 완료', 'Analysis complete', 'Analyse terminée')}</p>
          <h2 className="text-[22px] font-light text-gray-900">
            {selectedScenario ? t2(SCENARIO_LABELS[selectedScenario]) : ''} · {selectedLang ? t2(LANG_LABELS[selectedLang]) : ''}
          </h2>
        </div>
        <div className="text-right">
          <p className="text-4xl font-light text-gray-900 tabular-nums">{feedback.overall_score}</p>
          <p className="text-[11px] text-gray-400">/ 100</p>
        </div>
      </div>

      {/* Transcript */}
      <div className="border border-gray-100 rounded-2xl px-5 py-4 bg-white mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-2">{t('인식된 텍스트', 'Transcript', 'Transcription')}</p>
        <p className="text-[14px] text-gray-700 leading-relaxed">{transcript}</p>
      </div>

      {/* Scores */}
      <div className="border border-gray-100 rounded-2xl px-5 py-4 bg-white mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-3">{t('세부 점수', 'Detailed scores', 'Scores détaillés')}</p>
        <div className="flex flex-col gap-2.5">
          {(Object.keys(feedback.scores) as (keyof Scores)[]).map(key => (
            <ScoreBar key={key} label={t2(SCORE_LABELS[key])} value={feedback.scores[key]} />
          ))}
        </div>
      </div>

      {/* Strengths */}
      {feedback.strengths.length > 0 && (
        <div className="border border-gray-100 rounded-2xl px-5 py-4 bg-white mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-3">{t('잘한 점 ✓', 'Strengths ✓', 'Points forts ✓')}</p>
          <ul className="space-y-1.5">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700">
                <span className="text-green-500 mt-0.5 shrink-0">✓</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {feedback.improvements.length > 0 && (
        <div className="border border-gray-100 rounded-2xl px-5 py-4 bg-white mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-3">{t('개선할 점', 'Areas to improve', 'Points à améliorer')}</p>
          <ul className="space-y-1.5">
            {feedback.improvements.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700">
                <span className="text-yellow-500 mt-0.5 shrink-0">→</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Practice sentences */}
      {feedback.practice_sentences.length > 0 && (
        <div className="border border-gray-100 rounded-2xl px-5 py-4 bg-white mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-3">{t('연습 문장', 'Practice sentences', 'Phrases à pratiquer')}</p>
          <ol className="space-y-2">
            {feedback.practice_sentences.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] text-gray-700">
                <span className="shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 mt-0.5">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex gap-3">
        {user && supabase && !saved && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-2xl bg-gray-900 text-white text-[14px] font-semibold hover:bg-gray-700 transition-colors disabled:opacity-60"
          >
            {saving ? t('저장 중...', 'Saving...', 'Sauvegarde...') : t('결과 저장', 'Save results', 'Sauvegarder')}
          </button>
        )}
        {saved && (
          <div className="flex-1 py-3 rounded-2xl bg-green-50 text-green-700 text-[14px] font-semibold text-center">
            ✓ {t('저장됨', 'Saved', 'Sauvegardé')}
          </div>
        )}
        <button
          onClick={reset}
          className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 text-[14px] font-semibold hover:bg-gray-50 transition-colors"
        >
          {t('다시 연습하기', 'Practice again', 'Recommencer')}
        </button>
      </div>
    </div>
  ) : null

  // ── History section ──
  const HistorySection = user && supabase ? (
    <section className="mt-14 pt-10 border-t border-gray-100">
      <h2 className="text-[16px] font-semibold text-gray-900 mb-1">{t('나의 연습 기록', 'My Progress', 'Mes progrès')}</h2>
      <p className="text-[13px] text-gray-400 mb-5">{t('이전 분석 결과를 확인하세요', 'Review your previous sessions', 'Consultez vos sessions précédentes')}</p>
      {loadingHistory ? (
        <div className="flex gap-2 items-center text-[13px] text-gray-400">
          <div className="w-4 h-4 border border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          {t('불러오는 중...', 'Loading...', 'Chargement...')}
        </div>
      ) : history.length === 0 ? (
        <p className="text-[13px] text-gray-400">{t('아직 저장된 기록이 없어요.', 'No saved sessions yet.', 'Aucune session sauvegardée.')}</p>
      ) : (
        <div className="flex flex-col gap-3 max-w-[640px]">
          {history.map(h => {
            const sc = h.scenario as Scenario
            const lc = h.language as Language
            const scenarioObj = SCENARIOS.find(s => s.code === sc)
            return (
              <div key={h.id} className="border border-gray-100 rounded-2xl px-5 py-4 bg-white flex items-start gap-4">
                <span className="text-2xl shrink-0 mt-0.5">{scenarioObj?.emoji ?? '🎙️'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[13px] font-semibold text-gray-900">{SCENARIO_LABELS[sc] ? t2(SCENARIO_LABELS[sc]) : sc}</p>
                    <span className="text-[10px] text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{LANG_LABELS[lc] ? t2(LANG_LABELS[lc]) : lc}</span>
                  </div>
                  <p className="text-[12px] text-gray-500 truncate mb-2">{h.transcript}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-semibold text-gray-700">{h.score}<span className="text-[11px] text-gray-400 font-normal">/100</span></span>
                    <span className="text-[11px] text-gray-400">{formatDate(h.created_at)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  ) : null

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-[720px] mx-auto px-6 pt-12 md:pt-[72px] lg:pt-24">
        {step === 'language' && StepLanguage}
        {step === 'scenario' && StepScenario}
        {step === 'upload' && StepUpload}
        {step === 'loading' && StepLoading}
        {step === 'result' && StepResult}

        {(step === 'language' || step === 'result') && HistorySection}
      </div>
    </div>
  )
}
