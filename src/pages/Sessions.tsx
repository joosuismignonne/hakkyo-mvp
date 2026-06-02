import { useState, useEffect } from 'react'
import { getTracks } from '../lib/db'
import { useLang } from '../context/LangContext'
import {
  buildClassSchedule,
  formatProgramDateRange,
  resolveApplicationDeadline,
  resolveVenue,
  type TrackView,
} from '../lib/programDisplay'
import ApplyModal from '../components/ApplyModal'

function CapacityBar({ enrolled, capacity, t }: {
  enrolled: number; capacity: number
  t: (ko: string, en: string, fr: string) => string
}) {
  const pct = capacity ? Math.min((enrolled / capacity) * 100, 100) : 0
  const spotsLeft = capacity - enrolled
  const color = pct >= 90 ? '#f97316' : pct >= 70 ? '#F5C518' : '#111'
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1.5">
        <span className="font-medium" style={{ color }}>
          {capacity === 0
            ? t('무제한', 'Unlimited', 'Illimité')
            : (spotsLeft > 0
              ? t('신청 가능', 'Available to apply', 'Disponible')
              : t('마감', 'Full', 'Complet'))}
        </span>
      </div>
      {capacity > 0 && (
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: color }} />
        </div>
      )}
    </div>
  )
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
  if (!value?.trim()) return '—'
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

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
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
    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
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
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}

function SectionLabel({ children, mobileHidden }: { children: React.ReactNode; mobileHidden?: boolean }) {
  return (
    <p className={`text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-2${mobileHidden ? ' hidden sm:block' : ''}`}>
      {children}
    </p>
  )
}

export default function Sessions() {
  const { lang, t } = useLang()
  const [tracks, setTracks] = useState<TrackView[]>([])
  const [applying, setApplying] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [filter,   setFilter]   = useState<'all' | 'open' | 'closed'>('all')

  useEffect(() => {
    getTracks()
      .then(data => setTracks((data ?? []) as TrackView[]))
      .catch(err => setError(err.message ?? 'Failed to load programs.'))
      .finally(() => setLoading(false))
  }, [])

  const title = (s: TrackView) =>
    lang === 'ko' ? s.name_ko : lang === 'fr' ? s.name_fr : s.name_en
  const desc = (s: TrackView) =>
    lang === 'ko' ? s.description_ko : lang === 'fr' ? s.description_fr : s.description_en
  const category = (s: TrackView) =>
    s.category === 'community'
      ? t('커뮤니티', 'Community', 'Communauté')
      : t('프로그램', 'Program', 'Programme')
  const price = (s: TrackView) => {
    if (s.is_free) return t('무료', 'Free', 'Gratuit')
    if (s.total_price != null) return `$${s.total_price} ${s.currency}`
    if (s.class_count > 0) return `$${s.price_per_class * s.class_count} ${s.currency}`
    return `$${s.price_per_class} ${s.currency}`
  }
  const duration = (s: TrackView) =>
    s.duration_weeks ? `${s.duration_weeks} ${t('주', 'weeks', 'semaines')}` : '—'

  const visible = tracks.filter(s => filter === 'all' || s.status === filter)

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
    <div className="section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('프로그램', 'Programs', 'Programmes')}</h1>
          <p className="text-gray-500 text-sm mt-0.5">Season 3 · 2025–2026</p>
        </div>
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden text-sm font-medium w-fit">
          {(['all', 'open', 'closed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={['px-3.5 py-2 transition-colors touch-manipulation',
                filter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50',
              ].join(' ')}>
              {f === 'all'  ? t('전체', 'All', 'Tout') :
               f === 'open' ? t('모집 중', 'Open', 'Ouvert') :
               t('마감', 'Closed', 'Fermé')}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {visible.map(s => {
          const isExpanded = expanded === s.id
          const isOpen     = s.status === 'open'
          const spotsLeft  = s.capacity - s.enrolled
          const classSchedule = buildClassSchedule(s)
          const programDates = formatProgramDateRange(s)
          const applyDeadline = resolveApplicationDeadline(s)
          const venue = resolveVenue(s)
          const classCount = classSchedule.length

          return (
            <div key={s.id} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                className="w-full text-left flex items-center justify-between gap-3
                           px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                onClick={() => setExpanded(isExpanded ? null : s.id)}
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className={isOpen ? 'badge-open' : 'badge-closed'}>
                    {isOpen ? t('모집 중', 'Open', 'Ouvert') : t('마감', 'Closed', 'Fermé')}
                  </span>
                  <span className="text-xs text-gray-400">{category(s)}</span>
                  <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                    {title(s)}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:flex flex-col items-end gap-0.5 text-sm text-gray-500">
                    {classCount > 0 && (
                      <span className="text-xs text-gray-400">
                        {classCount} {t('클래스', 'classes', 'cours')}
                      </span>
                    )}
                    <span className="font-semibold text-gray-900">{price(s)}</span>
                  </div>
                  <span className="sm:hidden font-semibold text-gray-900 text-sm">{price(s)}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 bg-white">
                  <div className="px-4 pt-5 pb-6 space-y-7">
                    {/* Overview */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-4 sm:gap-y-5">
                      <div>
                        <SectionLabel mobileHidden>{t('대상', 'Audience', 'Public')}</SectionLabel>
                        <p className="text-sm font-medium text-gray-900 leading-snug">
                          {formatTargetAudience(s.target_audience, t)}
                        </p>
                      </div>
                      <div>
                        <SectionLabel>{t('총 가격', 'Total price', 'Prix total')}</SectionLabel>
                        <p className="text-sm font-semibold text-gray-900">{price(s)}</p>
                      </div>
                      <div>
                        <SectionLabel mobileHidden>{t('기간', 'Duration', 'Durée')}</SectionLabel>
                        <p className="text-sm font-medium text-gray-900">{duration(s)}</p>
                      </div>
                      {programDates && (
                        <div>
                          <SectionLabel>{t('프로그램 기간', 'Program dates', 'Dates du programme')}</SectionLabel>
                          <p className="text-sm font-medium text-gray-900">{programDates}</p>
                        </div>
                      )}
                    </div>

                    {/* Application deadline */}
                    {applyDeadline && isOpen && (
                      <div className="rounded-lg border border-yellow/50 bg-yellow/5 px-4 py-3.5">
                        <SectionLabel>{t('신청 마감', 'Application deadline', 'Date limite d\'inscription')}</SectionLabel>
                        <p className="text-base font-semibold text-gray-900 tracking-tight">{applyDeadline}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {t(
                            '마감일까지 신청서를 제출해 주세요.',
                            'Submit your application before this date.',
                            'Soumettez votre candidature avant cette date.',
                          )}
                        </p>
                      </div>
                    )}

                    {/* Class schedule */}
                    {classSchedule.length > 0 && (
                      <div>
                        <SectionLabel mobileHidden>{t('클래스 일정', 'Class schedule', 'Horaire des cours')}</SectionLabel>
                        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100 overflow-hidden">
                          {classSchedule.map(row => (
                            <li
                              key={`${row.name}-${row.when}`}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-4 py-3 bg-gray-50/50"
                            >
                              <span className="text-sm font-semibold text-gray-900">{row.name}</span>
                              <span className="text-sm text-gray-600 tabular-nums">{row.when}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Location */}
                    {venue && (
                      <div>
                        <SectionLabel>{t('장소', 'Location', 'Lieu')}</SectionLabel>
                        <div className="space-y-1">
                          {venue.name && venue.name !== '—' && (
                            <p className="text-base font-semibold text-gray-900">{venue.name}</p>
                          )}
                          {venue.detail && (
                            <p className="text-sm text-gray-600">{venue.detail}</p>
                          )}
                          {venue.mapsUrl && (
                            <a
                              href={venue.mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm font-medium text-gray-900 underline decoration-gray-300 underline-offset-2 hover:decoration-yellow mt-2"
                            >
                              {t('Google Maps에서 보기', 'View on Google Maps', 'Voir sur Google Maps')} →
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-5">
                      {desc(s)}
                    </p>

                    <TrackInterest trackId={s.id} t={t} />
                    <CapacityBar enrolled={s.enrolled} capacity={s.capacity} t={t} />

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
                      <button
                        disabled={!isOpen}
                        onClick={() => isOpen && setApplying(s.id)}
                        className={['w-full sm:w-auto', isOpen ? 'btn-yellow px-8' : 'btn-outline opacity-40 cursor-not-allowed'].join(' ')}
                      >
                        {isOpen ? t('신청하기', 'Apply Now', 'S\'inscrire') : t('마감', 'Registration Closed', 'Inscriptions fermées')}
                      </button>
                      {isOpen && spotsLeft > 0 && s.start_date && (
                        <span className="text-xs text-gray-400">
                          {t('시작일', 'Starts', 'Début')}:{' '}
                          <span className="text-gray-600 font-medium">{s.start_date}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {visible.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">
            {t('프로그램이 없습니다.', 'No programs available yet.', 'Aucun programme disponible pour le moment.')}
          </div>
        )}
      </div>

      {applying && <ApplyModal preselectedTrackId={applying} onClose={() => setApplying(null)} />}
    </div>
  )
}
