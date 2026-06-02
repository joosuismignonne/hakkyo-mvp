import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTracks, getNotices } from '../lib/db'
import { useLang } from '../context/LangContext'
import type { ProgramTrack, Notice } from '../types'
import ApplyModal from '../components/ApplyModal'

function StatusBadge({ status, enrolled, capacity }: {
  status: 'open' | 'closed'; enrolled: number; capacity: number
}) {
  const spotsLeft = capacity - enrolled
  if (status === 'closed') return <span className="badge-closed">Closed</span>
  if (spotsLeft <= 3)      return <span className="badge-limited">{spotsLeft} spots left</span>
  return <span className="badge-open">Open</span>
}

function formatIncludedSessions(value: unknown): string {
  if (value == null) return '-'
  if (Array.isArray(value)) {
    const items = value.map(v => String(v).trim()).filter(Boolean)
    return items.length > 0 ? items.join(' · ') : '-'
  }
  if (typeof value === 'string') {
    const raw = value.trim()
    if (!raw) return '-'
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const items = parsed.map(v => String(v).trim()).filter(Boolean)
        return items.length > 0 ? items.join(' · ') : '-'
      }
    } catch {
      // fall through to comma-separated handling
    }
    const parts = raw.split(',').map(v => v.trim()).filter(Boolean)
    return parts.length > 1 ? parts.join(' · ') : raw
  }
  return String(value)
}

const TARGET_AUDIENCE_LABELS: Record<string, [string, string, string]> = {
  montreal_local: [
    '몬트리올 거주자 및 외국인 대상',
    'For Montreal locals and international participants',
    'Pour les résidents de Montréal et les participants internationaux',
  ],
  korean_speaker: [
    '한국어 화자 대상',
    'For Korean speakers',
    'Pour les coréanophones',
  ],
  non_korean_speaker: [
    '비한국어 화자 대상',
    'For non-Korean speakers',
    'Pour les non-coréanophones',
  ],
  everyone: [
    '누구나 참여 가능',
    'Open to everyone',
    'Ouvert à tous',
  ],
}

function formatTargetAudience(
  value: string | null | undefined,
  t: (ko: string, en: string, fr: string) => string,
): string {
  if (!value?.trim()) return '-'
  const labels = TARGET_AUDIENCE_LABELS[value.trim().toLowerCase()]
  if (!labels) return value
  return t(labels[0], labels[1], labels[2])
}

const INTEREST_KEY = 'hakkyo-interest:'

type InterestData = { count: number; clicked: boolean }

function loadInterest(trackId: string): InterestData {
  try {
    const raw = localStorage.getItem(INTEREST_KEY + trackId)
    if (!raw) return { count: 0, clicked: false }
    const parsed = JSON.parse(raw) as InterestData
    return {
      count: typeof parsed.count === 'number' ? parsed.count : 0,
      clicked: !!parsed.clicked,
    }
  } catch {
    return { count: 0, clicked: false }
  }
}

function TrackInterest({
  trackId,
  t,
}: {
  trackId: string
  t: (ko: string, en: string, fr: string) => string
}) {
  const [data, setData] = useState<InterestData>(() => loadInterest(trackId))

  function handleClick() {
    if (data.clicked) return
    const next = { count: data.count + 1, clicked: true }
    localStorage.setItem(INTEREST_KEY + trackId, JSON.stringify(next))
    setData(next)
  }

  const label =
    data.count > 0
      ? t(
          `${data.count}명이 관심 있어요`,
          `${data.count} people are interested`,
          `${data.count} personnes sont intéressées`,
        )
      : t('관심 표시하기', 'Show interest', 'Montrer son intérêt')

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <button
        type="button"
        onClick={handleClick}
        disabled={data.clicked}
        aria-label={t('관심 표시', 'Show interest', 'Montrer son intérêt')}
        aria-pressed={data.clicked}
        className="text-base leading-none p-1.5 rounded-full hover:bg-gray-100 touch-manipulation shrink-0 disabled:cursor-default"
      >
        {data.clicked ? '❤️' : '♡'}
      </button>
      <span className="text-xs text-gray-400 truncate">{label}</span>
    </div>
  )
}

export default function Home() {
  const { lang, t } = useLang()
  const [tracks, setTracks] = useState<ProgramTrack[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [applying, setApplying] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      getTracks('program'),
      getNotices(),
    ])
      .then(([tracksData, n]) => {
        setTracks((tracksData ?? []).slice(0, 3))
        setNotices(n.slice(0, 3))
      })
      .catch(err => setError(err.message ?? 'Failed to load data.'))
      .finally(() => setLoading(false))
  }, [])

  const sessionTitle = (s: ProgramTrack) =>
    lang === 'ko' ? s.name_ko : lang === 'fr' ? s.name_fr : s.name_en
  const trackPrice = (s: ProgramTrack) => {
    if (s.is_free) return t('무료', 'Free', 'Gratuit')
    if (s.total_price != null) return `$${s.total_price} ${s.currency}`
    if (s.class_count > 0) return `$${s.price_per_class * s.class_count} ${s.currency}`
    return `$${s.price_per_class} ${s.currency}`
  }
  const trackDuration = (s: ProgramTrack & { duration?: string | null }) =>
    s.duration || (s.duration_weeks ? `${s.duration_weeks} ${t('주', 'weeks', 'semaines')}` : '-')
  const targetAudience = (s: ProgramTrack & { target_audience?: string | null }) =>
    formatTargetAudience(s.target_audience, t)
  const includedSessions = (s: ProgramTrack & { included_sessions?: unknown }) => {
    const formatted = formatIncludedSessions(s.included_sessions)
    if (formatted !== '-') return formatted
    return s.class_count > 0 ? String(s.class_count) : '-'
  }
  const noticeTitle = (n: Notice) =>
    lang === 'ko' ? n.title_ko : lang === 'fr' ? n.title_fr : n.title_en
  const noticeBody = (n: Notice) =>
    lang === 'ko' ? n.body_ko : lang === 'fr' ? n.body_fr : n.body_en

  if (loading) {
    return (
      <div className="section flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="section flex items-center justify-center h-48">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <div className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                HAKKYO
              </h1>
              <p className="text-gray-500 text-base">
                Montréal Language Community
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/sessions" className="btn-yellow px-5 py-2.5 text-base">
                {t('Explore Programs', 'Explore Programs', 'Explore Programs')} →
              </Link>
              <Link to="/schedule" className="btn-outline">
                {t('View Board', 'View Board', 'View Board')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">

        {/* ── PROGRAMS ──────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="section-title">{t('프로그램', 'Programs', 'Programmes')}</p>
            <Link to="/sessions" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              {t('전체 보기', 'View all', 'Tout voir')} →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tracks.map(s => (
              <div key={s.id} className="card flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">{sessionTitle(s)}</h3>
                  <StatusBadge status={s.status} enrolled={s.enrolled} capacity={s.capacity} />
                </div>

                <div className="text-sm text-gray-500 space-y-1">
                  <div>
                    <span className="hidden sm:inline text-gray-400 text-xs mr-1">{t('대상', 'Target', 'Cible')}:</span>
                    {targetAudience(s)}
                  </div>
                  <div>
                    <span className="hidden sm:inline text-gray-400 text-xs mr-1">{t('포함 클래스', 'Included classes', 'Cours inclus')}:</span>
                    {includedSessions(s)}
                  </div>
                  <div>
                    <span className="hidden sm:inline text-gray-400 text-xs mr-1">{t('기간', 'Duration', 'Durée')}:</span>
                    {trackDuration(s)}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                  <span className="font-semibold text-gray-900 text-sm shrink-0">{trackPrice(s)}</span>
                  <TrackInterest trackId={s.id} t={t} />
                </div>

                <button
                  disabled={s.status === 'closed'}
                  onClick={() => s.status === 'open' && setApplying(s.id)}
                  className={s.status === 'open'
                    ? 'btn-yellow w-full text-center'
                    : 'btn-outline w-full opacity-40 cursor-not-allowed'}
                >
                  {s.status === 'open'
                    ? t('신청하기', 'Apply Now', 'S\'inscrire')
                    : t('마감', 'Closed', 'Fermé')}
                </button>
              </div>
            ))}
            {tracks.length === 0 && (
              <p className="text-sm text-gray-400 col-span-full">
                No programs available yet.
              </p>
            )}
          </div>
        </section>

        {/* ── NOTICES ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="section-title">{t('보드', 'Board', 'Board')}</p>
            <Link to="/schedule" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              {t('전체 보기', 'View all', 'Tout voir')} →
            </Link>
          </div>

          <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
            {notices.map(n => (
              <div key={n.id} className="px-4 py-3.5 bg-white hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 mb-1">
                  <span className={[
                    'text-xs font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide',
                    n.type === 'event'    ? 'bg-yellow-light text-yellow-hover' :
                    n.type === 'schedule' ? 'bg-blue-50 text-blue-600' :
                    'bg-gray-100 text-gray-500',
                  ].join(' ')}>
                    {n.type === 'event'    ? t('이벤트', 'Events', 'Événements') :
                     n.type === 'schedule' ? t('채용', 'Hiring', 'Recrutement') :
                     t('공지', 'Notices', 'Avis')}
                  </span>
                  <span className="text-xs text-gray-400">{n.date}</span>
                </div>
                <p className="font-medium text-sm text-gray-900">{noticeTitle(n)}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{noticeBody(n)}</p>
              </div>
            ))}
            {notices.length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">
                {t('공지가 없습니다.', 'No notices yet.', 'Aucun avis.')}
              </p>
            )}
          </div>
        </section>
      </div>

      {applying && (
        <ApplyModal preselectedTrackId={applying} onClose={() => setApplying(null)} />
      )}
    </>
  )
}
