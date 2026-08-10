import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Pin, Zap } from 'lucide-react'
import { getTracks, getSiteSettings, getLeSettings, getUpcomingActivities, type LeSettings, type CommunityActivity } from '../lib/db'
import { trackEvent } from '../lib/analytics'
import { useLang } from '../context/LangContext'
import {
  formatProgramDateRange,
  resolveApplicationDeadline,
  resolveTrackTypeLabel,
  resolveProgramTypeChip,
  dedupeTracks,
  type TrackView,
} from '../lib/programDisplay'
import { formatPrice, formatDuration, formatSeats, formatDeadlineDelta } from '../lib/format'
import ApplyModal from '../components/ApplyModal'
import { LeftSidebar, PageShell, SharedRightSidebar } from '../components/PageLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = 'ko' | 'en' | 'fr'

// ─── Language fallback ────────────────────────────────────────────────────────

function pickText(lang: Lang, ko: string, en: string, fr: string): string {
  const order = lang === 'ko' ? [ko, en, fr] : lang === 'fr' ? [fr, ko, en] : [en, ko, fr]
  return order.find(s => s?.trim()) ?? ''
}

// ─── Program row ──────────────────────────────────────────────────────────────
// Dense, scannable row (Toss-style: chip + title/meta + right-aligned stats).
// Description/tags/schedule/venue live on ProgramDetail.tsx — confirmed present
// there, so nothing becomes unreachable by trimming them from this row.

function ProgramCard({ track, lang, t }: {
  track: TrackView
  lang: Lang
  t: (ko: string, en: string, fr: string) => string
}) {
  const navigate    = useNavigate()
  const isOpen      = track.status === 'open'
  const name        = pickText(lang, track.name_ko, track.name_en, track.name_fr)
  const price       = formatPrice(track)
  const duration    = formatDuration(track)
  const typeLabel   = resolveTrackTypeLabel(track)
  const typeChip    = resolveProgramTypeChip(track, typeLabel)
  const programDates = formatProgramDateRange(track)
  const deadline    = resolveApplicationDeadline(track)
  const isPinned    = !!(track as TrackView & { is_pinned?: boolean }).is_pinned
  const seats       = isOpen ? formatSeats(track.capacity, track.enrolled) : null
  const deadlineText = isOpen && !seats ? formatDeadlineDelta(deadline) : null

  const subLine = [typeChip?.label, programDates ?? duration].filter(Boolean).join(' · ')

  return (
    <div
      className="row-item interactive"
      onClick={() => {
        trackEvent({ eventName: 'program_card_clicked', targetType: 'card', targetId: track.id, targetLabel: track.name_en || track.name_ko })
        navigate(`/programs/${track.id}`)
      }}
    >
      <span className="row-chip">{typeChip?.emoji ?? '📚'}</span>

      <div className="row-body">
        <div className="flex items-center gap-1.5">
          {isPinned && <Pin size={10} className="text-gray-400 shrink-0" />}
          <span className="row-title">{name}</span>
        </div>
        {subLine && <p className="row-sub">{subLine}</p>}
      </div>

      <div className="row-stats">
        <p className="row-stat">{price}</p>
        {seats ? (
          <p className={`row-stat-label${seats.low ? ' status-negative' : ''}`}>{seats.text}</p>
        ) : deadlineText ? (
          <p className="row-stat-label">{deadlineText}</p>
        ) : null}
      </div>

      <span className={isOpen ? 'badge-open' : 'badge-closed'}>
        {isOpen ? t('모집 중', 'Open', 'Ouvert') : t('마감', 'Closed', 'Fermé')}
      </span>

      {isOpen && (
        <button
          onClick={e => {
            e.stopPropagation()
            trackEvent({ eventName: 'program_apply_clicked', targetType: 'button', targetId: track.id, targetLabel: track.name_en || track.name_ko })
            navigate(`/apply/${track.id}`)
          }}
          className="shrink-0 border border-gray-900 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-gray-900 bg-white hover:bg-gray-900 hover:text-white transition-colors whitespace-nowrap"
        >
          {t('신청', 'Apply', "S'inscrire")}
        </button>
      )}
    </div>
  )
}

// ─── Language Exchange card ───────────────────────────────────────────────────

function LanguageExchangeCard({
  leTitle, leDesc, leButtonText, leSettings, onApply, t,
}: {
  leTitle: string
  leDesc: string
  leButtonText: string
  leSettings: LeSettings
  onApply: () => void
  t: (ko: string, en: string, fr: string) => string
}) {
  // No detail page to fall back to (click opens the Apply modal directly),
  // so unlike ProgramCard the description stays visible — just clamped to one line.
  const subLine = [
    t('커뮤니티', 'Community', 'Communauté'),
    leSettings.schedule,
    leSettings.location_name,
  ].filter(Boolean).join(' · ')

  return (
    <div className="row-item interactive flex-wrap" onClick={onApply}>
      <span className="row-chip">🌎</span>

      <div className="row-body">
        <span className="row-title">{leTitle}</span>
        {subLine && <p className="row-sub">{subLine}</p>}
        {leDesc && (
          <p className="text-[11px] text-gray-400 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
            {leDesc}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 ml-[48px] sm:ml-0">
        <span className="row-stat">{t('무료', 'Free', 'Gratuit')}</span>
        <span className="badge-open">{t('상시', 'Open', 'Ouvert')}</span>
        <button
          onClick={e => { e.stopPropagation(); trackEvent({ eventName: 'program_apply_clicked', targetType: 'button', targetLabel: 'Language Exchange' }); onApply() }}
          className="shrink-0 border border-gray-900 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-gray-900 bg-white hover:bg-gray-900 hover:text-white transition-colors whitespace-nowrap"
        >
          {leButtonText}
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Sessions() {
  const { lang: rawLang, t } = useLang()
  const lang = rawLang as Lang
  const [searchParams] = useSearchParams()

  const [tracks,           setTracks]           = useState<TrackView[]>([])
  const [applyingCommunity, setApplyingCommunity] = useState(false)
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState('')
  const [filter,           setFilter]           = useState<'all' | 'open' | 'closed'>('all')

  const [leTitle,      setLeTitle]      = useState<string | null>(null)
  const [leDescKo,     setLeDescKo]     = useState<string | null>(null)
  const [leDescEn,     setLeDescEn]     = useState<string | null>(null)
  const [leDescFr,     setLeDescFr]     = useState<string | null>(null)
  const [leButtonText, setLeButtonText] = useState<string | null>(null)
  const [leSettings,   setLeSettings]   = useState<LeSettings>({})
  const [activities,   setActivities]   = useState<CommunityActivity[]>([])

  useEffect(() => {
    Promise.all([getTracks(), getSiteSettings(), getLeSettings()])
      .then(([data, settings, le]) => {
        setTracks((data ?? []) as TrackView[])
        setLeTitle(settings.language_exchange_title?.trim() || null)
        setLeDescKo(settings.language_exchange_description_ko?.trim() || null)
        setLeDescEn(settings.language_exchange_description_en?.trim() || null)
        setLeDescFr(settings.language_exchange_description_fr?.trim() || null)
        setLeButtonText(settings.language_exchange_button_text?.trim() || null)
        setLeSettings(le)
      })
      .catch(err => setError(err.message ?? 'Failed to load programs.'))
      .finally(() => setLoading(false))

    // Table may not exist yet until the admin runs the migration — getUpcomingActivities()
    // already swallows errors and returns [], so this never blocks or breaks the page.
    getUpcomingActivities().then(setActivities).catch(() => {})
  }, [])

  // URL query params from /programs?language=korean|english|french or ?type=language-exchange
  const qLang = searchParams.get('language')   // 'korean' | 'english' | 'french' | null
  const qType = searchParams.get('type')        // 'language-exchange' | null

  // Keyword maps: match against name_ko + name_en + name_fr (case-insensitive)
  const LANG_KEYWORDS: Record<string, string[]> = {
    korean:  ['korean', '한국어', 'coréen'],
    english: ['english', '영어', 'anglais'],
    french:  ['french', '불어', '프랑스어', 'français', 'francais'],
  }

  function matchesLangQuery(track: TrackView): boolean {
    if (!qLang || !(qLang in LANG_KEYWORDS)) return true
    const haystack = [track.name_ko, track.name_en, track.name_fr].join(' ').toLowerCase()
    return LANG_KEYWORDS[qLang].some(kw => haystack.includes(kw))
  }

  // Sorting: pinned first, then open, then closed; within each group by start_date asc
  const allProgramTracks = dedupeTracks(tracks)
    .filter(s => s.category !== 'community')
    .filter(s => filter === 'all' || s.status === filter)
    .sort((a, b) => {
      const ap = !!(a as TrackView & { is_pinned?: boolean }).is_pinned
      const bp = !!(b as TrackView & { is_pinned?: boolean }).is_pinned
      if (ap !== bp) return ap ? -1 : 1
      if (a.status !== b.status) return a.status === 'open' ? -1 : 1
      return (a.start_date ?? '').localeCompare(b.start_date ?? '')
    })

  // When a language query param is present, put matching tracks first
  const programTracks = qLang
    ? [
        ...allProgramTracks.filter(t => matchesLangQuery(t)),
        ...allProgramTracks.filter(t => !matchesLangQuery(t)),
      ]
    : allProgramTracks

  const communityTrack = tracks.find(s => s.category === 'community')

  // Scroll to and highlight language exchange section if ?type=language-exchange
  const showLanguageExchangeHighlight = qType === 'language-exchange'
  const leRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (showLanguageExchangeHighlight && !loading && leRef.current) {
      leRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [showLanguageExchangeHighlight, loading])

  const leDesc = (lang === 'ko' ? leDescKo : lang === 'fr' ? leDescFr : leDescEn)
    ?? t(
      'HAKKYO 커뮤니티에서 대화로 참여하세요.',
      'Join the HAKKYO community through conversation. No class registration required.',
      'Rejoignez la communauté HAKKYO par la conversation.',
    )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-4 h-4 border border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    )
  }

  // Label for active language query filter
  const LANG_LABELS: Record<string, string> = {
    korean:  t('한국어 프로그램', 'Korean Programs', 'Programmes coréens'),
    english: t('영어 프로그램', 'English Programs', 'Programmes anglais'),
    french:  t('프랑스어 프로그램', 'French Programs', 'Programmes français'),
  }

  const mainContent = (
    <>
      {/* Active language filter indicator */}
      {qLang && LANG_LABELS[qLang] && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="text-[12px] font-semibold text-gray-500">
            {t('필터:', 'Filtered by:', 'Filtré par :')}
          </span>
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'var(--y-l)', color: '#92400E' }}
          >
            {LANG_LABELS[qLang]}
          </span>
        </div>
      )}

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(['all', 'open', 'closed'] as const).map(f => {
          const on = filter === f
          const label = f === 'all' ? t('전체', 'All', 'Tout') : f === 'open' ? t('모집 중', 'Open', 'Ouvert') : t('마감', 'Closed', 'Fermé')
          return (
            <button
              key={f}
              onClick={() => { setFilter(f); trackEvent({ eventName: 'program_filter_clicked', targetLabel: f }) }}
              className={[
                'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.06em] transition-colors',
                on ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700',
              ].join(' ')}
            >
              {f === 'open' && <Zap size={11} className="shrink-0" />}
              {label}
            </button>
          )
        })}
      </div>

      {/* Program feed cards */}
      {programTracks.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-sm text-gray-300 tracking-wide">
            {t('프로그램이 없습니다.', 'No programs available.', 'Aucun programme disponible.')}
          </p>
        </div>
      ) : (
        <div className="row-list">
          {programTracks.map(track => (
            <ProgramCard
              key={track.id}
              track={track}
              lang={lang}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Language Exchange */}
      {(communityTrack || leDesc) && (
        <div
          ref={leRef}
          className="row-list mt-1"
          style={showLanguageExchangeHighlight ? { borderRadius: 16, outline: '2px solid var(--y)', outlineOffset: 2 } : undefined}
        >
          <LanguageExchangeCard
            leTitle={leTitle || 'Language Exchange'}
            leDesc={leDesc}
            leButtonText={leButtonText || t('신청하기', 'Apply for Language Exchange', "S'inscrire")}
            leSettings={leSettings}
            onApply={() => setApplyingCommunity(true)}
            t={t}
          />
        </div>
      )}

      {/* Weekly/recurring community activities — separate from the fixed Sunday Language Exchange */}
      {activities.length > 0 && (
        <>
          <p className="t-eyebrow text-gray-400 mb-4 mt-10">
            {t('이번 달 활동', 'This Month\'s Activities', 'Activités à venir')}
          </p>
          <div className="row-list">
            {activities.map(a => {
              const title = pickText(lang, a.title_ko, a.title_en ?? '', a.title_fr ?? '')
              const d = new Date(`${a.activity_date}T00:00:00`)
              const sub = [a.time_range, a.location_name].filter(Boolean).join(' · ')
              return (
                <div key={a.id} className="row-item">
                  <div className="row-chip flex-col !bg-transparent border border-gray-100">
                    <p className="text-[9px] font-bold text-gray-300 uppercase leading-none">
                      {d.toLocaleDateString('en-CA', { month: 'short' })}
                    </p>
                    <p style={{ fontSize: '15px', fontWeight: 600 }} className="text-gray-800 leading-none mt-0.5">
                      {d.getDate()}
                    </p>
                  </div>
                  <div className="row-body">
                    <span className="row-title">{a.emoji ? `${a.emoji} ` : ''}{title}</span>
                    {sub && <p className="row-sub">{sub}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </>
  )

  return (
    <>
      <PageShell
        left={<LeftSidebar lang={lang} />}
        right={<SharedRightSidebar lang={lang} />}
      >
        {mainContent}
      </PageShell>

      {applyingCommunity && <ApplyModal languageExchange onClose={() => setApplyingCommunity(false)} />}
    </>
  )
}
