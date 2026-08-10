import type { TrackView } from './programDisplay'

/** Shared across Sessions.tsx and ProgramDetail.tsx — was previously duplicated in both. */

export function formatPrice(s: TrackView): string {
  if (s.is_free) return 'Free'
  if (s.total_price && s.total_price > 0) return `$${s.total_price} ${s.currency}`
  if (s.class_count > 0 && s.price_per_class > 0) return `$${s.price_per_class * s.class_count} ${s.currency}`
  if (s.price_per_class > 0) return `$${s.price_per_class} ${s.currency}`
  return 'Free'
}

export function formatDuration(s: TrackView): string | null {
  const dur = (s as TrackView & { duration?: string }).duration
  if (dur?.trim()) return dur.trim()
  if (s.duration_weeks) return `${s.duration_weeks} weeks`
  if (s.class_count > 1) return `${s.class_count} classes`
  return null
}

/** Returns null when capacity isn't set — never force-display "0 seats". */
export function formatSeats(capacity: number | null | undefined, enrolled: number | null | undefined): { text: string; low: boolean } | null {
  if (!capacity || capacity <= 0) return null
  const left = Math.max(capacity - (enrolled ?? 0), 0)
  return { text: `${left} seats left`, low: left > 0 && left <= 3 }
}

/** Relative phrasing only within 14 days — further out just show the date, to avoid noisy "in 27 days". */
export function formatDeadlineDelta(deadlineIso: string | null | undefined, now: Date = new Date()): string | null {
  if (!deadlineIso) return null
  const deadline = new Date(deadlineIso)
  if (Number.isNaN(deadline.getTime())) return null
  const days = Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000)
  if (days < 0) return null
  if (days === 0) return 'Closes today'
  if (days === 1) return 'Closes tomorrow'
  if (days <= 14) return `Closes in ${days}d`
  return `Closes ${formatDateShort(deadlineIso)}`
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric' }).format(new Date(iso))
  } catch {
    return iso
  }
}
