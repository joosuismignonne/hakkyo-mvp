import type { ProgramTrack } from '../types'

export type TrackView = ProgramTrack

export type ClassScheduleRow = { name: string; when: string }

export type VenueInfo = {
  name: string
  detail: string
  mapsUrl: string
}

/** Parse admin textarea: `Class name | days | time` per line. */
export function parseClassScheduleText(text: string | null | undefined): ClassScheduleRow[] {
  if (!text?.trim()) return []
  return text
    .trim()
    .split('\n')
    .map(line => {
      const parts = line.split('|').map(p => p.trim()).filter(Boolean)
      if (parts.length >= 3) {
        return { name: parts[0], when: `${parts[1]} · ${parts[2]}` }
      }
      if (parts.length === 2) {
        return { name: parts[0], when: parts[1] }
      }
      if (parts.length === 1) {
        return { name: parts[0], when: '—' }
      }
      return { name: line.trim(), when: '—' }
    })
    .filter(row => row.name)
}

export function buildClassSchedule(track: TrackView): ClassScheduleRow[] {
  return parseClassScheduleText(track.class_schedule)
}

export function formatProgramDateRange(track: TrackView): string | null {
  if (track.start_date && track.end_date) return `${track.start_date} – ${track.end_date}`
  if (track.start_date) return track.start_date
  if (track.end_date) return track.end_date
  return null
}

export function resolveApplicationDeadline(track: TrackView): string | null {
  const d = track.application_deadline?.trim()
  return d || null
}

export function resolveVenue(track: TrackView): VenueInfo | null {
  const name = track.venue_name?.trim() ?? ''
  const detail = track.venue_city?.trim() ?? ''
  const mapsUrl = track.google_maps_url?.trim() ?? ''
  if (!name && !detail && !mapsUrl) return null
  return { name: name || '—', detail, mapsUrl }
}

export function resolveTrackTypeLabel(s: TrackView): string | null {
  if (s.category === 'community') return 'Language Exchange'
  const classes = parseIncludedSessionsList(s.included_sessions).map(c => c.toLowerCase())
  if (classes.length > 0) {
    const hasKo = classes.some(c => c.includes('korean'))
    const hasEn = classes.some(c => c.includes('english'))
    const hasFr = classes.some(c => c.includes('french'))
    const hasAo = classes.some(c => c.includes('active output'))
    const langCount = [hasKo, hasEn, hasFr].filter(Boolean).length
    if (hasAo && langCount >= 2) return 'Full Course'
    if (hasAo && langCount === 0) return 'Active Output'
    if (hasEn && hasFr && !hasKo && !hasAo) return 'EN / FR'
    if (hasKo && hasFr && !hasEn && !hasAo) return 'KR / FR'
    if (hasKo && hasEn && !hasFr && !hasAo) return 'KR / EN'
    if (hasKo && langCount === 1) return 'Korean'
    if (hasEn && langCount === 1) return 'English'
    if (hasFr && langCount === 1) return 'French'
  }
  const name = (s.name_en ?? '').toLowerCase()
  if (name.includes('active output')) return 'Active Output'
  if (s.class_count === 1) return 'Single class'
  if (s.class_count > 1)  return 'Course'
  return null
}

export type ProgramTypeChip = { emoji: string; label: string }

export function resolveProgramTypeChip(track: TrackView, typeLabel: string | null): ProgramTypeChip | null {
  if (track.category === 'community') return { emoji: '🌎', label: 'Language Exchange' }
  const t = (typeLabel ?? '').toLowerCase()
  if (t === 'full course')     return { emoji: '⭐', label: 'Full Course' }
  if (t === 'active output')   return { emoji: '🎤', label: 'Active Output' }
  if (t === 'kr / fr')         return { emoji: '🇰🇷🇫🇷', label: 'Korean · French' }
  if (t === 'kr / en')         return { emoji: '🇰🇷🇬🇧', label: 'Korean · English' }
  if (t === 'en / fr')         return { emoji: '🇬🇧🇫🇷', label: 'English · French' }
  if (t === 'korean')          return { emoji: '🇰🇷', label: 'Korean' }
  if (t === 'french')          return { emoji: '🇫🇷', label: 'French' }
  if (t === 'english')         return { emoji: '🇬🇧', label: 'English' }
  if (typeLabel)               return { emoji: '📚', label: typeLabel }
  return null
}

export function parseIncludedSessionsList(value: unknown): string[] {
  if (value == null) return []
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    const raw = value.trim()
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.map(v => String(v).trim()).filter(Boolean)
      }
    } catch {
      // comma-separated
    }
    return raw.split(',').map(v => v.trim()).filter(Boolean)
  }
  return []
}
