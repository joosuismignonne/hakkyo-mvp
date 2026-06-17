import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DollarSign, MapPin, Pin, Users, Zap } from 'lucide-react'
import { getTracks, getSiteSettings, getLeSettings, type LeSettings } from '../lib/db'
import { trackEvent } from '../lib/analytics'
import { useLang } from '../context/LangContext'
import {
  buildClassSchedule,
  formatProgramDateRange,
  resolveApplicationDeadline,
  resolveVenue,
  parseIncludedSessionsList,
  resolveTrackTypeLabel,
  resolveProgramTypeChip,
  parseOutputTags,
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

function ProgramCard({ track, lang, t }: {
  track: TrackView
  lang: Lang
  t: (ko: string, en: string, fr: string) => string
}) {
  const navigate      = useNavigate()
  const isOpen        = track.status === 'open'
  const dotColor      = isOpen ? OPEN_COLOR : CLOSED_COLOR
  const name          = pickText(lang, track.name_ko, track.name_en, track.name_fr)
  const description   = pickText(lang, track.description_ko, track.description_en, track.description_fr)
  const price         = resolvePrice(track)
  const duration      = resolveDuration(track)
  const typeLabel     = resolveTrackTypeLabel(track)
  const typeChip      = resolveProgramTypeChip(track, typeLabel)
  const classSchedule = buildClassSchedule(track)
  const programDates  = formatProgramDateRange(track)
  const deadline      = resolveApplicationDeadline(track)
  const venue         = resolveVenue(track)
  const isPinned      = !!(track as TrackView & { is_pinned?: boolean }).is_pinned
  const outputTags    = parseOutputTags(track.output_tags).slice(0, 3)

  // Plain-text program info — no pill badges, just readable metadata
  const infoTokens: string[] = []
  if (programDates ?? track.start_date) infoTokens.push(programDates ?? fmtDate(track.start_date))
  if (duration)                         infoTokens.push(duration)
  infoTokens.push(price)
  if (deadline && isOpen)               infoTokens.push(`${t('마감', 'Deadline', 'Clôture')} ${deadline}`)

  const hasSecondary = classSchedule.length > 0 || (venue?.name && venue.name !== '—')

  return (
    <article
      onClick={() => {
        trackEvent({ eventName: 'program_card_clicked', targetType: 'card', targetId: track.id, targetLabel: track.name_en || track.name_ko })
        navigate(`/programs/${track.id}`)
      }}
      className={`rounded-2xl border mb-4 px-6 py-6 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] ${isPinned ? 'border-gray-300 hover:border-gray-400 bg-white' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
    >
      {/* 1 · Category + Status — single quiet line */}
      <div className="flex items-center gap-1.5 mb-4">
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor, display: 'inline-block', flexShrink: 0 }} />
        <span className="text-[10px] text-gray-400 tracking-wide">
          {t('프로그램', 'Program', 'Programme')}
          {' · '}
          {isOpen ? t('모집 중', 'Open', 'Ouvert') : t('마감', 'Closed', 'Fermé')}
        </span>
        {isPinned && <PinIndicator />}
      </div>

      {/* 2 · Language pill — light bordered, not filled */}
      {typeChip && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 border border-gray-200 rounded-md px-2.5 py-1 text-[11px] text-gray-700 font-medium whitespace-nowrap">
            <span>{typeChip.emoji}</span>
            <span>{typeChip.label}</span>
          </span>
        </div>
      )}

      {/* 3 · Title */}
      <h3 style={{ fontSize: "17px" }} className="font-semibold text-gray-900 leading-snug mb-2.5">{name}</h3>

      {/* 4 · Description — 2 lines max */}
      {description && (
        <p className="text-[14px] text-gray-500 leading-relaxed mb-3"
           style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {description}
        </p>
      )}

      {/* 5 · Output tags — max 3, subtle hairline style */}
      {outputTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {outputTags.map(tag => (
            <span key={tag} className="text-[10px] text-gray-400 border border-gray-100 rounded px-2 py-0.5 whitespace-nowrap">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 6 · Program info — plain text row, no pill badges */}
      {infoTokens.length > 0 && (
        <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
          {infoTokens.join(' · ')}
        </p>
      )}

      {/* 7 · Schedule + Location — compact secondary block */}
      {hasSecondary && (
        <div className="border-t border-gray-50 pt-3 mb-3 space-y-1">
          {classSchedule.map(row => (
            <div key={`${row.name}-${row.when}`} className="grid grid-cols-[1fr_auto] gap-x-3 items-baseline">
              <span className="text-[11px] text-gray-500 truncate">{row.name}</span>
              {row.when && <span className="text-[11px] text-gray-400 whitespace-nowrap">{row.when}</span>}
            </div>
          ))}
          {venue?.name && venue.name !== '—' && (
            <div className="flex items-center gap-1 text-[11px] text-gray-400 pt-0.5">
              <MapPin size={10} className="shrink-0 text-gray-300" />
              <span className="text-gray-500">{venue.name}</span>
              {venue.detail && <span className="text-gray-400">{venue.detail}</span>}
              {venue.mapsUrl && (
                <a
                  href={venue.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="ml-1 underline decoration-gray-200 underline-offset-2 hover:text-gray-600 transition-colors"
                >
                  Map →
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* 8 · Footer */}
      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between gap-3">
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
              onClick={e => {
                e.stopPropagation()
                trackEvent({ eventName: 'program_apply_clicked', targetType: 'button', targetId: track.id, targetLabel: track.name_en || track.name_ko })
                navigate(`/apply/${track.id}`)
              }}
              className="border border-gray-900 rounded-xl px-5 py-2.5 text-[12px] font-semibold text-gray-900 bg-white hover:bg-gray-900 hover:text-white transition-colors whitespace-nowrap"
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
      {/* ── Meta row ── */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#111', display: 'inline-block', flexShrink: 0 }} />
        <TypeTag>{t('커뮤니티', 'Community', 'Communauté')}</TypeTag>
      </div>

      {/* ── Primary type chip ── */}
      <div className="mb-3">
        <PrimaryTypeChip emoji="🌎" label="Language Exchange" />
      </div>

      {/* ── Title ── */}
      <h3 className="text-sm font-medium text-gray-900 leading-snug mb-2">{leTitle}</h3>

      {/* ── Description ── */}
      {leDesc && (
        <p className="text-[13px] text-gray-500 leading-relaxed mb-3"
           style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {leDesc}
        </p>
      )}

      {/* ── Experience chips ── */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {leExpChips.map(c => <ExperienceChip key={c}>{c}</ExperienceChip>)}
      </div>

      {/* ── Metadata chips (mirrors ProgramCard row: price + type) ── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3">
        <MetaChip icon={DollarSign}>{t('무료', 'Free', 'Gratuit')}</MetaChip>
        <MetaChip icon={Users}>{t('커뮤니티 이벤트', 'Community Event', 'Événement communautaire')}</MetaChip>
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

      {/* ── Status + CTA ── */}
      <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-900">
          {t('상시 모집', '● OPEN', '● OUVERT')}
        </span>
        <button
          onClick={e => { e.stopPropagation(); trackEvent({ eventName: 'program_apply_clicked', targetType: 'button', targetLabel: 'Language Exchange' }); onApply() }}
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
  const allProgramTracks = tracks
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
        <div>
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

      {applyingCommunity && <ApplyModal languageExchange onClose={() => setApplyingCommunity(false)} />}
    </>
  )
}
