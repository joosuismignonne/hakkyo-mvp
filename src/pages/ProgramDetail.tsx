import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, Clock, DollarSign, MapPin, Users, ChevronLeft, CheckCircle2, HelpCircle } from 'lucide-react'
import { getTrackById } from '../lib/db'
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
import { LeftSidebar, PageShell, SharedRightSidebar } from '../components/PageLayout'
import type { ProgramTrack } from '../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Lang = 'ko' | 'en' | 'fr'

function pickText(lang: Lang, ko: string, en: string, fr: string): string {
  const order = lang === 'ko' ? [ko, en, fr] : lang === 'fr' ? [fr, ko, en] : [en, ko, fr]
  return order.find(s => s?.trim()) ?? ''
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso))
  } catch { return iso }
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

// ─── Shared atoms ─────────────────────────────────────────────────────────────

function MetaRow({ icon: Icon, label, value }: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <Icon size={14} className="text-gray-300 shrink-0 mt-0.5" />
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-20 shrink-0">{label}</span>
      <span className="text-[13px] text-gray-700">{value}</span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-300 mb-3 mt-8">
      {children}
    </p>
  )
}

function ApplyButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="border border-gray-900 rounded-lg px-5 py-2.5 text-[12px] font-semibold text-gray-900 bg-white hover:bg-gray-900 hover:text-white transition-colors"
    >
      {label}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProgramDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const { lang: rawLang, t } = useLang()
  const lang = rawLang as Lang

  const [track,    setTrack]    = useState<ProgramTrack | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    if (!id) { setError('Invalid program.'); setLoading(false); return }
    getTrackById(id)
      .then(data => {
        if (!data) setError('Program not found.')
        else setTrack(data)
      })
      .catch(e => setError(e?.message ?? 'Failed to load program.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-4 h-4 border border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !track) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-red-400">{error || 'Program not found.'}</p>
        <button onClick={() => navigate('/programs')} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
          ← Back to programs
        </button>
      </div>
    )
  }

  const tv       = track as TrackView
  const isOpen   = track.status === 'open'
  const name     = pickText(lang, track.name_ko, track.name_en, track.name_fr)
  const descFull = pickText(lang, track.description_ko, track.description_en, track.description_fr)
  const price    = resolvePrice(tv)
  const duration = resolveDuration(tv)
  const typeLabel  = resolveTrackTypeLabel(tv)
  const typeChip   = resolveProgramTypeChip(tv, typeLabel)
  const classSchedule = buildClassSchedule(tv)
  const programDates  = formatProgramDateRange(tv)
  const deadline      = resolveApplicationDeadline(tv)
  const venue         = resolveVenue(tv)
  const includedClasses = parseIncludedSessionsList(track.included_sessions)

  const applyLabel = t('신청하기', 'Apply Now', "S'inscrire")

  const weeklyStructure = Array.isArray(track.weekly_structure) ? track.weekly_structure : []
  const targetParticipants = Array.isArray(track.target_participants) ? track.target_participants.filter(Boolean) : []
  const learningOutcomes   = Array.isArray(track.learning_outcomes)  ? track.learning_outcomes.filter(Boolean)  : []
  const faqItems           = Array.isArray(track.faq_items)          ? track.faq_items.filter(f => f.question)  : []

  const mainContent = (
    <div>
      {/* Back link */}
      <button
        onClick={() => navigate('/programs')}
        className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors mb-6"
      >
        <ChevronLeft size={12} />
        {t('프로그램 목록', 'All Programs', 'Tous les programmes')}
      </button>

      {/* ── Header ── */}
      <div className="mb-6">
        {typeChip && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 bg-gray-900 text-white rounded-lg px-2.5 py-1 text-[11px] font-semibold tracking-wide">
              <span>{typeChip.emoji}</span>
              <span>{typeChip.label}</span>
            </span>
          </div>
        )}
        <p className="text-[10px] font-bold tracking-[0.14em] uppercase mb-2">
          {isOpen
            ? <span className="text-gray-900">{t('모집 중', '● OPEN', '● OUVERT')}</span>
            : <span className="text-gray-300">{t('마감', 'Closed', 'Fermé')}</span>
          }
        </p>
        <h1 className="text-2xl font-light tracking-tight text-gray-900 leading-tight mb-3">
          {name}
        </h1>
        {descFull && !track.overview?.trim() && (
          <p className="text-sm text-gray-500 leading-relaxed max-w-[560px]">
            {descFull.slice(0, 200)}{descFull.length > 200 ? '…' : ''}
          </p>
        )}
      </div>

      {/* ── Top CTA ── */}
      <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
        {isOpen
          ? <ApplyButton onClick={() => setApplying(true)} label={applyLabel} />
          : <span className="border border-gray-100 rounded-lg px-5 py-2.5 text-[12px] text-gray-300">{t('마감', 'Closed', 'Fermé')}</span>
        }
        {deadline && isOpen && (
          <p className="text-[11px] text-gray-400">
            {t('신청 마감', 'Deadline', 'Clôture')}: {deadline}
          </p>
        )}
      </div>

      {/* ── Overview ── */}
      {track.overview?.trim() && (
        <>
          <SectionTitle>{t('개요', 'Overview', 'Aperçu')}</SectionTitle>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap mb-8">
            {track.overview}
          </p>
        </>
      )}

      {/* ── Who It's For ── */}
      {(targetParticipants.length > 0 || track.target_audience) && (
        <>
          <SectionTitle>{t('대상', "Who It's For", 'Pour qui')}</SectionTitle>
          <ul className="space-y-2 mb-8">
            {targetParticipants.length > 0
              ? targetParticipants.map((p, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0 mt-2" />
                    {p}
                  </li>
                ))
              : (
                <li className="text-sm text-gray-600">
                  {track.target_audience === 'korean_speaker'
                    ? t('한국어 사용자를 위한 프로그램입니다.', 'Designed for Korean speakers learning a second language.', 'Pour les locuteurs coréens.')
                    : track.target_audience === 'montreal_local'
                    ? t('한국어를 배우고 싶은 분들을 위한 프로그램입니다.', 'Designed for Montréalers and non-Korean speakers learning Korean.', 'Pour les montréalais apprenant le coréen.')
                    : track.target_audience}
                </li>
              )
            }
          </ul>
        </>
      )}

      {/* ── What You'll Learn ── */}
      {learningOutcomes.length > 0 && (
        <>
          <SectionTitle>{t('학습 내용', "What You'll Learn", 'Ce que vous apprendrez')}</SectionTitle>
          <ul className="space-y-2 mb-8">
            {learningOutcomes.map((o, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                <CheckCircle2 size={14} className="text-gray-300 shrink-0 mt-0.5" />
                {o}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* ── Weekly Structure ── */}
      {weeklyStructure.length > 0 && (
        <>
          <SectionTitle>{t('주차별 구성', 'Weekly Structure', 'Structure hebdomadaire')}</SectionTitle>
          <div className="space-y-3 mb-8">
            {weeklyStructure.map((w, i) => (
              <div key={i} className="flex items-baseline gap-4 py-2.5 border-b border-gray-50 last:border-0">
                <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-300 w-14 shrink-0">
                  {t('주', 'Week', 'Sem.')} {w.week}
                </span>
                <div>
                  <span className="text-sm font-medium text-gray-900">{w.title}</span>
                  {w.description?.trim() && (
                    <p className="text-[13px] text-gray-400 mt-0.5">{w.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Instructor ── */}
      {track.instructor_name?.trim() && (
        <>
          <SectionTitle>{t('강사', 'Instructor', 'Instructeur')}</SectionTitle>
          <div className="flex items-start gap-4 mb-8">
            {track.instructor_image_url?.trim() && (
              <img
                src={track.instructor_image_url}
                alt={track.instructor_name}
                className="w-12 h-12 rounded-full object-cover shrink-0 bg-gray-100"
              />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">{track.instructor_name}</p>
              {track.instructor_bio?.trim() && (
                <p className="text-[13px] text-gray-500 leading-relaxed whitespace-pre-wrap">
                  {track.instructor_bio}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Program Details (schedule / pricing / location) ── */}
      <SectionTitle>{t('프로그램 정보', 'Program Details', 'Détails du programme')}</SectionTitle>
      <div className="bg-gray-50 rounded-xl px-4 py-1 mb-8">
        {programDates && (
          <MetaRow icon={Calendar} label={t('날짜', 'Dates', 'Dates')} value={programDates} />
        )}
        {duration && (
          <MetaRow icon={Clock} label={t('기간', 'Duration', 'Durée')} value={duration} />
        )}
        <MetaRow icon={DollarSign} label={t('수강료', 'Price', 'Prix')} value={price} />
        {track.capacity > 0 && (
          <MetaRow icon={Users} label={t('정원', 'Capacity', 'Places')} value={`${track.capacity} people`} />
        )}
        {venue?.name && venue.name !== '—' && (
          <MetaRow
            icon={MapPin}
            label={t('장소', 'Location', 'Lieu')}
            value={
              <span>
                {venue.name}
                {venue.detail && <span className="text-gray-400 ml-1">{venue.detail}</span>}
                {venue.mapsUrl && (
                  <a href={venue.mapsUrl} target="_blank" rel="noopener noreferrer"
                     className="ml-2 underline decoration-gray-300 underline-offset-2 hover:text-gray-900 transition-colors">
                    Map →
                  </a>
                )}
              </span>
            }
          />
        )}
        {classSchedule.length > 0 && (
          <MetaRow
            icon={Clock}
            label={t('수업 일정', 'Schedule', 'Horaire')}
            value={
              <div className="space-y-1">
                {classSchedule.map(row => (
                  <div key={`${row.name}-${row.when}`} className="flex items-baseline gap-3">
                    <span className="text-sm font-medium text-gray-900 w-28 shrink-0">{row.name}</span>
                    <span className="text-sm text-gray-500">{row.when}</span>
                  </div>
                ))}
              </div>
            }
          />
        )}
      </div>

      {/* ── Full description (if no overview) ── */}
      {descFull && descFull.length > 200 && !track.overview?.trim() && (
        <>
          <SectionTitle>{t('프로그램 소개', 'About this program', 'À propos')}</SectionTitle>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap mb-8">
            {descFull}
          </p>
        </>
      )}

      {/* ── Included classes ── */}
      {includedClasses.length > 0 && (
        <>
          <SectionTitle>{t('포함 수업', "What's included", 'Ce qui est inclus')}</SectionTitle>
          <ul className="space-y-1.5 mb-8">
            {includedClasses.map(c => (
              <li key={c} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* ── Notes ── */}
      {track.notes?.trim() && (
        <>
          <SectionTitle>{t('참고 사항', 'Additional Info', 'Informations supplémentaires')}</SectionTitle>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap mb-8">
            {track.notes}
          </p>
        </>
      )}

      {/* ── FAQ ── */}
      {faqItems.length > 0 && (
        <>
          <SectionTitle>{t('자주 묻는 질문', 'FAQ', 'FAQ')}</SectionTitle>
          <div className="space-y-4 mb-8">
            {faqItems.map((f, i) => (
              <div key={i}>
                <div className="flex items-start gap-2.5 mb-1.5">
                  <HelpCircle size={14} className="text-gray-300 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-gray-900">{f.question}</p>
                </div>
                <p className="text-[13px] text-gray-500 leading-relaxed pl-[22px]">{f.answer}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Bottom CTA ── */}
      <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">
          {isOpen
            ? t('지금 신청하세요.', 'Ready to join? Apply below.', 'Prêt à rejoindre?')
            : t('이 프로그램은 마감되었습니다.', 'This program is currently closed.', 'Ce programme est actuellement fermé.')
          }
        </p>
        {isOpen
          ? <ApplyButton onClick={() => setApplying(true)} label={applyLabel} />
          : <span className="border border-gray-100 rounded-lg px-5 py-2.5 text-[12px] text-gray-300">{t('마감', 'Closed', 'Fermé')}</span>
        }
      </div>
    </div>
  )

  return (
    <>
      <PageShell
        left={<LeftSidebar lang={lang} />}
        right={<SharedRightSidebar lang={lang} />}
      >
        {mainContent}
      </PageShell>

      {applying && (
        <ApplyModal
          preselectedTrackId={track.id}
          onClose={() => setApplying(false)}
        />
      )}
    </>
  )
}
