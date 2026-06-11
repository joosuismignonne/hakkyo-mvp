import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, DollarSign, MapPin, Pin, Users, Zap } from 'lucide-react'
import { getTracks, getSiteSettings, getLeSettings, type LeSettings } from '../lib/db'
import { useLang } from '../context/LangContext'
import {
  buildClassSchedule,
  formatProgramDateRange,
  resolveApplicationDeadline,
  resolveVenue,
  parseIncludedSessionsList,
  resolveTrackTypeLabel,
  resolveProgramTypeChip,
  type TrackView,
} from '../lib/programDisplay'
import ApplyModal from '../components/ApplyModal'
import CardActions from '../components/CardActions'
import { LeftSidebar, PageShell, SharedRightSidebar } from '../components/PageLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = 'ko' | 'en' | 'fr'

// ─── Language fallback ────────────────────────────────────────────────────────

function pickText(lang: Lang, ko: string, en: string, fr: string): string {
  const order = lang === 'ko' ? [ko, en, fr] : lang === 'fr' ? [fr, ko, en] : [en, ko, fr]
  return order.find(s => s?.trim()) ?? ''
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try { return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso)) }
  catch { return iso }
}

function resolvePrice(s: TrackView): string {
  if (s.is_free) return 'Free'
  if (s.total_price && s.total_price > 0) return `$${s.total_price} ${s.currency}`
  if (s.class_count > 0 && s.price_per_class > 0) return `$${s.price_per_class * s.class_count} ${s.currency}`
  if (s.price_per_class > 0) return `$${s.price_per_class} ${s.currency}`
  return 'Free'
}

function resolveDuration(s: TrackView): string | null {
  const dur = (s as TrackView & { duration?: string }).duration
  if (dur?.trim()) return dur.trim()
  if (s.duration_weeks) return `${s.duration_weeks} weeks`
  if (s.class_count > 1) return `${s.class_count} classes`
  return null
}

// ─── Program type resolution ──────────────────────────────────────────────────

// Derive up to 3 experience chips from structured track fields.
// Falls back to type-specific semantic defaults when fields are sparse.
function resolveExperienceChips(track: TrackView, typeLabel: string | null): string[] {
  const chips: string[] = []
  const type = (typeLabel ?? '').toLowerCase()

  // ── Structured chips ──────────────────────────────────────────────────────
  // Duration
  if (track.duration_weeks && track.duration_weeks > 0) {
    chips.push(`${track.duration_weeks} Weeks`)
  } else if (track.class_count > 1) {
    chips.push(`${track.class_count} Classes`)
  }

  // Group size
  if (track.capacity > 0 && track.capacity <= 10) {
    chips.push('Small Group')
  } else if (track.capacity > 10 && track.capacity <= 20) {
    chips.push('Group')
  }

  // Audience / level hint
  if (track.target_audience === 'korean_speaker') {
    chips.push('Korean Speakers')
  } else if (track.target_audience === 'montreal_local') {
    chips.push('All Speakers')
  }

  // ── Semantic fallbacks per type ───────────────────────────────────────────
  const need = 3 - chips.length
  if (need <= 0) return chips.slice(0, 3)

  const fallbacks: Record<string, string[]> = {
    korean:             ['Beginner Friendly', 'Conversation', 'Cultural'],
    french:             ['Conversation', 'Montréal Life', 'Beginner Friendly'],
    english:            ['Conversation', 'Beginner Friendly', 'Canadian Culture'],
    'active output':    ['Speaking', 'Real Scenarios', 'Practice'],
    'full course':      ['Complete Package', 'All Levels', 'Immersive'],
    'language exchange':['Meet People', 'Open Level', 'Weekly'],
  }

  const key = Object.keys(fallbacks).find(k => type.includes(k))
  if (key) {
    for (const c of fallbacks[key]) {
      if (chips.length >= 3) break
      if (!chips.includes(c)) chips.push(c)
    }
  }

  return chips.slice(0, 3)
}

// ─── Card atoms ───────────────────────────────────────────────────────────────

function TypeTag({ children, color = '#9CA3AF' }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color }}>
      {children}
    </span>
  )
}

function PinIndicator() {
  return (
    <span className="inline-flex items-center gap-1 text-gray-400">
      <Pin size={10} />
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Pinned</span>
    </span>
  )
}

function MetaChip({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2.5 py-1 text-[10px] text-gray-600 whitespace-nowrap">
      <Icon size={10} className="text-gray-400 shrink-0" />
      {children}
    </span>
  )
}

// Borderless text chip — lighter weight than MetaChip, no icon
function ExperienceChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center bg-gray-50 border border-gray-100 rounded-md px-2 py-0.5 text-[10px] text-gray-500 whitespace-nowrap">
      {children}
    </span>
  )
}

// Primary program-type chip — the most prominent label on the card
function PrimaryTypeChip({ emoji, label }: { emoji: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-gray-900 text-white rounded-lg px-2.5 py-1 text-[11px] font-semibold tracking-wide whitespace-nowrap">
      <span>{emoji}</span>
      <span>{label}</span>
    </span>
  )
}

// ─── Program card ─────────────────────────────────────────────────────────────

const OPEN_COLOR   = '#111111'
const CLOSED_COLOR = '#D1D5DB'

function ProgramCard({ track, lang, onApply, t }: {
  track: TrackView
  lang: Lang
  onApply: (id: string) => void
  t: (ko: string, en: string, fr: string) => string
}) {
  const navigate   = useNavigate()
  const isOpen     = track.status === 'open'
  const dotColor   = isOpen ? OPEN_COLOR : CLOSED_COLOR
  const name       = pickText(lang, track.name_ko, track.name_en, track.name_fr)
  const description = pickText(lang, track.description_ko, track.description_en, track.description_fr)
  const price      = resolvePrice(track)
  const duration   = resolveDuration(track)
  const typeLabel  = resolveTrackTypeLabel(track)
  const typeChip   = resolveProgramTypeChip(track, typeLabel)
  const expChips   = resolveExperienceChips(track, typeLabel)
  const classSchedule = buildClassSchedule(track)
  const programDates  = formatProgramDateRange(track)
  const deadline      = resolveApplicationDeadline(track)
  const venue         = resolveVenue(track)
  const isPinned      = !!(track as TrackView & { is_pinned?: boolean }).is_pinned

  return (
    <article
      onClick={() => navigate(`/programs/${track.id}`)}
      className={`rounded-2xl border mb-3 px-5 py-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)] ${isPinned ? 'border-gray-300 hover:border-gray-400 bg-white' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
    >
      {/* ── Meta row: source label only ── */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor, display: 'inline-block', flexShrink: 0 }} />
        <TypeTag>{t('프로그램', 'Program', 'Programme')}</TypeTag>
        {isPinned && <PinIndicator />}
      </div>

      {/* ── Primary type chip ── */}
      {typeChip && (
        <div className="mb-3">
          <PrimaryTypeChip emoji={typeChip.emoji} label={typeChip.label} />
        </div>
      )}

      {/* ── Title ── */}
      <h3 className="text-sm font-medium text-gray-900 leading-snug mb-2">{name}</h3>

      {/* ── Description ── */}
      {description && (
        <p className="text-[13px] text-gray-500 leading-relaxed mb-3"
           style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {description}
        </p>
      )}

      {/* ── Experience chips ── */}
      {expChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {expChips.map(c => <ExperienceChip key={c}>{c}</ExperienceChip>)}
        </div>
      )}

      {/* ── Metadata chips ── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3">
        {track.start_date && <MetaChip icon={Calendar}>{programDates ?? fmtDate(track.start_date)}</MetaChip>}
        {duration          && <MetaChip icon={Clock}>{duration}</MetaChip>}
        <MetaChip icon={DollarSign}>{price}</MetaChip>
        {deadline && isOpen && <MetaChip icon={Calendar}>{t('마감', 'Deadline', 'Clôture')} {deadline}</MetaChip>}
      </div>

      {/* ── Class schedule ── */}
      {classSchedule.length > 0 && (
        <div className="mb-3 space-y-0.5">
          {classSchedule.map(row => (
            <div key={`${row.name}-${row.when}`} className="grid grid-cols-[1fr_auto] gap-x-3 items-baseline">
              <span className="text-[11px] font-medium text-gray-700 truncate">{row.name}</span>
              {row.when && (
                <span className="text-[11px] text-gray-400 whitespace-nowrap">{row.when}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Venue ── */}
      {venue?.name && venue.name !== '—' && (
        <div className="mb-3">
          <MetaChip icon={MapPin}>
            <span className="text-gray-600 font-medium">{venue.name}</span>
            {venue.detail && <span className="text-gray-400 ml-1">{venue.detail}</span>}
            {venue.mapsUrl && (
              <a
                href={venue.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="ml-2 underline decoration-gray-200 underline-offset-2 hover:text-gray-700 transition-colors"
              >
                Map →
              </a>
            )}
          </MetaChip>
        </div>
      )}

      {/* ── Status + CTA ── */}
      <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between gap-3">
        {isOpen ? (
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-900">
            {t('모집 중', '● OPEN', '● OUVERT')}
          </span>
        ) : (
          <span className="text-[10px] tracking-wide uppercase text-gray-300">
            {t('마감', 'Closed', 'Fermé')}
          </span>
        )}
        <div className="flex items-center gap-2">
          <CardActions
            item={{
              id:    track.id,
              type:  'program',
              title: track.name_en || track.name_ko,
              image: null,
              url:   `/programs/${track.id}`,
              date:  track.start_date ?? track.created_at ?? null,
            }}
            url={`/programs/${track.id}`}
            size={13}
          />
          {isOpen ? (
            <button
              onClick={e => { e.stopPropagation(); onApply(track.id) }}
              className="border border-gray-900 rounded-lg px-4 py-2 text-[11px] font-semibold text-gray-900 bg-white hover:bg-gray-900 hover:text-white transition-colors whitespace-nowrap"
            >
              {t('신청하기', 'Apply Now', "S'inscrire")}
            </button>
          ) : (
            <span className="border border-gray-100 rounded-lg px-4 py-2 text-[11px] text-gray-300">
              {t('마감', 'Closed', 'Fermé')}
            </span>
          )}
        </div>
      </div>
    </article>
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
  const leExpChips = ['Meet People', 'Open Level', 'Weekly']

  return (
    <article
      onClick={onApply}
      className="rounded-2xl border border-gray-100 bg-white mb-3 px-5 py-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)] hover:border-gray-200"
    >
      {/* Meta */}
      <div className="flex items-center gap-2 mb-3">
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#111', display: 'inline-block', flexShrink: 0 }} />
        <TypeTag>{t('커뮤니티', 'Community', 'Communauté')}</TypeTag>
        <Users size={11} className="text-gray-400" />
      </div>

      {/* Primary type chip */}
      <div className="mb-3">
        <PrimaryTypeChip emoji="🌎" label="Language Exchange" />
      </div>

      <h3 className="text-sm font-medium text-gray-900 leading-snug mb-2">{leTitle}</h3>

      <p className="text-[13px] text-gray-500 leading-relaxed mb-3"
         style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {leDesc}
      </p>

      {/* Experience chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {leExpChips.map(c => <ExperienceChip key={c}>{c}</ExperienceChip>)}
      </div>

      {/* ── Schedule (same grid layout as ProgramCard) ── */}
      {leSettings.schedule && (
        <div className="mb-3 space-y-0.5">
          <div className="grid grid-cols-[1fr_auto] gap-x-3 items-baseline">
            <span className="text-[11px] font-medium text-gray-700 truncate">
              {t('언어 교환', 'Language Exchange', 'Échange linguistique')}
            </span>
            <span className="text-[11px] text-gray-400 whitespace-nowrap">
              {leSettings.schedule}
            </span>
          </div>
        </div>
      )}

      {/* ── Venue (same MetaChip style as ProgramCard) ── */}
      {leSettings.location_name && (
        <div className="mb-3">
          <MetaChip icon={MapPin}>
            <span className="text-gray-600 font-medium">{leSettings.location_name}</span>
            {leSettings.location_address && (
              <span className="text-gray-400 ml-1">{leSettings.location_address}</span>
            )}
            {leSettings.google_maps_url && (
              <a
                href={leSettings.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="ml-2 underline decoration-gray-200 underline-offset-2 hover:text-gray-700 transition-colors"
              >
                Map →
              </a>
            )}
          </MetaChip>
        </div>
      )}

      {/* Status + CTA */}
      <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-900">
          {t('상시 모집', '● OPEN', '● OUVERT')}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onApply() }}
          className="border border-gray-900 rounded-lg px-4 py-2 text-[11px] font-semibold text-gray-900 bg-white hover:bg-gray-900 hover:text-white transition-colors whitespace-nowrap"
        >
          {leButtonText}
        </button>
      </div>
    </article>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Sessions() {
  const { lang: rawLang, t } = useLang()
  const lang = rawLang as Lang

  const [tracks,           setTracks]           = useState<TrackView[]>([])
  const [applying,         setApplying]         = useState<string | null>(null)
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
  }, [])

  // Sorting: pinned first, then open, then closed; within each group by start_date asc
  const programTracks = tracks
    .filter(s => s.category !== 'community')
    .filter(s => filter === 'all' || s.status === filter)
    .sort((a, b) => {
      const ap = !!(a as TrackView & { is_pinned?: boolean }).is_pinned
      const bp = !!(b as TrackView & { is_pinned?: boolean }).is_pinned
      if (ap !== bp) return ap ? -1 : 1
      if (a.status !== b.status) return a.status === 'open' ? -1 : 1
      return (a.start_date ?? '').localeCompare(b.start_date ?? '')
    })

  const communityTrack = tracks.find(s => s.category === 'community')

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

  const mainContent = (
    <>
      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(['all', 'open', 'closed'] as const).map(f => {
          const on = filter === f
          const label = f === 'all' ? t('전체', 'All', 'Tout') : f === 'open' ? t('모집 중', 'Open', 'Ouvert') : t('마감', 'Closed', 'Fermé')
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
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
        <div>
          {programTracks.map(track => (
            <ProgramCard
              key={track.id}
              track={track}
              lang={lang}
              onApply={setApplying}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Language Exchange */}
      {(communityTrack || leDesc) && (
        <LanguageExchangeCard
          leTitle={leTitle || 'Language Exchange'}
          leDesc={leDesc}
          leButtonText={leButtonText || t('신청하기', 'Apply for Language Exchange', "S'inscrire")}
          leSettings={leSettings}
          onApply={() => setApplyingCommunity(true)}
          t={t}
        />
      )}

      <div className="border-t border-gray-100" />
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

      {applying          && <ApplyModal preselectedTrackId={applying} onClose={() => setApplying(null)} />}
      {applyingCommunity && <ApplyModal languageExchange onClose={() => setApplyingCommunity(false)} />}
    </>
  )
}
