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
