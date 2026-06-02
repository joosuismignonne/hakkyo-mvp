import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTracks, getNotices } from '../lib/db'
import { useLang } from '../context/LangContext'
import type { ProgramTrack, Notice } from '../types'
import ApplyModal from '../components/ApplyModal'

// Minimal program type — same derivation as Sessions page
function resolveTrackType(s: ProgramTrack): string | null {
  const name = (s.name_en ?? '').toLowerCase()
  if (name.includes('active output')) return 'Active Output'
  if (s.class_count > 1) return 'Course'
  if (s.class_count === 1) return 'Single Class'
  return null
}

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
  const [applyingLE, setApplyingLE] = useState(false)
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
        <div className="max-w-5xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-gray-400 uppercase mb-7">
              Montréal · Language · Community
            </p>
            <h1 className="text-5xl md:text-6xl font-light tracking-tight text-gray-900 leading-[1.04] mb-8">
              HAKKYO
            </h1>
            <p className="text-base text-gray-500 leading-relaxed mb-10 max-w-sm">
              {t(
                '학교로 돌아가자. The feeling of school, again.',
                '학교로 돌아가자. The feeling of school, again.',
                '학교로 돌아가자. The feeling of school, again.',
              )}
            </p>
            <div className="flex items-center gap-7">
              <Link
                to="/sessions"
                className="text-sm font-medium text-gray-900 underline decoration-gray-300 underline-offset-4 hover:decoration-yellow transition-colors"
              >
                {t('프로그램 보기', 'Explore Programs', 'Voir les programmes')} →
              </Link>
              <Link
                to="/schedule"
                className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                {t('Board', 'Board', 'Tableau')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-14 md:py-20 space-y-20">

        {/* ── PROGRAMS ──────────────────────────────────────────── */}
        <section>
          <div className="flex items-baseline justify-between mb-9">
            <p className="section-title">{t('PROGRAMS', 'Programs', 'Programmes')}</p>
            <Link to="/sessions" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              {t('전체 보기', 'View all', 'Tout voir')} →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {tracks.map(s => {
              const audience  = targetAudience(s)
              const included  = includedSessions(s)
              const duration  = trackDuration(s)
              const trackType = resolveTrackType(s)
              const isOpen    = s.status === 'open'

              // Compact meta: only non-empty values, no "-" placeholders
              const metaParts = [
                included !== '-' ? included : null,
                duration  !== '-' ? duration  : null,
              ].filter(Boolean)

              return (
                <div key={s.id} className="card flex flex-col gap-0 p-0 overflow-hidden">
                  {/* Card body */}
                  <div className="flex flex-col gap-4 p-6 flex-1">
                    {/* Status + type row */}
                    <div className="flex items-center gap-2">
                      <StatusBadge status={s.status} enrolled={s.enrolled} capacity={s.capacity} />
                      {trackType && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                          {trackType}
                        </span>
                      )}
                    </div>

                    {/* Title + audience */}
                    <div className="flex-1 space-y-1.5">
                      <h3 className="text-lg font-medium text-gray-900 leading-snug">
                        {sessionTitle(s)}
                      </h3>
                      {audience !== '-' && (
                        <p className="text-sm text-gray-400 leading-snug">{audience}</p>
                      )}
                    </div>

                    {/* Meta */}
                    {metaParts.length > 0 && (
                      <p className="text-xs text-gray-400">
                        {metaParts.join(' · ')}
                      </p>
                    )}
                  </div>

                  {/* Card footer */}
                  <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between gap-3 bg-gray-50/50">
                    <span className="font-semibold text-gray-900 text-sm">{trackPrice(s)}</span>
                    <button
                      disabled={!isOpen}
                      onClick={() => isOpen && setApplying(s.id)}
                      className={isOpen
                        ? 'btn-yellow px-5'
                        : 'btn-outline px-5 opacity-40 cursor-not-allowed'}
                    >
                      {isOpen
                        ? t('신청하기', 'Apply', 'S\'inscrire')
                        : t('마감', 'Closed', 'Fermé')}
                    </button>
                  </div>
                </div>
              )
            })}
            {tracks.length === 0 && (
              <p className="text-sm text-gray-400 col-span-full py-6">
                {t('등록된 프로그램이 없습니다.', 'No programs available yet.', 'Aucun programme disponible.')}
              </p>
            )}
          </div>
        </section>

        {/* ── LANGUAGE EXCHANGE CTA ─────────────────────────────── */}
        <section className="border-t border-gray-100 pt-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
            <div className="max-w-sm space-y-3">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-gray-400 uppercase">
                Community
              </p>
              <h2 className="text-2xl font-light text-gray-900 tracking-tight">
                Language Exchange
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {t(
                  '수업 등록 없이 HAKKYO 커뮤니티에서 대화로 참여하세요.',
                  'Join the HAKKYO community through conversation. No class registration required.',
                  'Rejoignez la communauté par la conversation. Sans inscription obligatoire.',
                )}
              </p>
            </div>
            <button
              onClick={() => setApplyingLE(true)}
              className="btn-outline shrink-0 w-full sm:w-auto"
            >
              {t('Apply for Language Exchange', 'Apply for Language Exchange', 'S\'inscrire — Échange linguistique')}
            </button>
          </div>
        </section>

        {/* ── BOARD ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-baseline justify-between mb-9">
            <p className="section-title">{t('Board', 'Board', 'Board')}</p>
            <Link to="/schedule" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              {t('전체 보기', 'View all', 'Tout voir')} →
            </Link>
          </div>

          <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
            {notices.map(n => (
              <div key={n.id} className="px-5 py-4 bg-white hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 mb-1.5">
                  <span className={[
                    'text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide',
                    n.type === 'event'    ? 'bg-yellow-light text-yellow-hover' :
                    n.type === 'schedule' ? 'bg-blue-50 text-blue-600' :
                    'bg-gray-100 text-gray-500',
                  ].join(' ')}>
                    {n.type === 'event'    ? t('Event', 'Event', 'Événement') :
                     n.type === 'schedule' ? t('Hiring', 'Hiring', 'Recrutement') :
                     t('Notice', 'Notice', 'Avis')}
                  </span>
                  <span className="text-xs text-gray-400">{n.date}</span>
                </div>
                <p className="font-medium text-sm text-gray-900">{noticeTitle(n)}</p>
                {noticeBody(n) && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{noticeBody(n)}</p>
                )}
              </div>
            ))}
            {notices.length === 0 && (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">
                {t('공지가 없습니다.', 'No notices yet.', 'Aucun avis.')}
              </p>
            )}
          </div>
        </section>

      </div>

      {applying && (
        <ApplyModal preselectedTrackId={applying} onClose={() => setApplying(null)} />
      )}
      {applyingLE && (
        <ApplyModal languageExchange onClose={() => setApplyingLE(false)} />
      )}
    </>
  )
}
