import { supabase, isConfigured } from './supabase'
import {
  MOCK_SESSIONS, MOCK_TRACKS, MOCK_NOTICES, MOCK_CONTENTS, MOCK_QUESTIONS,
} from './mock'
import { isPublicMediaUrl } from './contentStorage'
import { normalizeImageUrls } from './newsContent'
import type {
  Session, ProgramTrack, Notice, Content, FormQuestion, Application,
} from '../types'

function contentSaveFields(c: Partial<Content>): Omit<Content, 'id' | 'created_at'> {
  const thumb = c.thumbnail_url?.trim() ?? ''
  return {
    title_ko: c.title_ko ?? '',
    title_en: c.title_en ?? '',
    title_fr: c.title_fr ?? '',
    body_ko: c.body_ko ?? '',
    body_en: c.body_en ?? '',
    body_fr: c.body_fr ?? '',
    category: c.category ?? null,
    type: c.type ?? 'text',
    link: c.link?.trim() || undefined,
    thumbnail_url: isPublicMediaUrl(thumb) ? thumb : null,
    image_urls: normalizeImageUrls(c.image_urls).filter(isPublicMediaUrl),
    video_url: c.video_url?.trim() || undefined,
    published_at: c.published_at ?? new Date().toISOString().split('T')[0],
  }
}

function db() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function getSessions(): Promise<Session[]> {
  if (!isConfigured) return MOCK_SESSIONS
  const { data, error } = await db().from('sessions').select('*').order('created_at')
  if (error) throw error
  return data ?? []
}

export async function saveSession(s: Partial<Session>): Promise<void> {
  const { id, created_at, ...fields } = s as Session & { created_at?: string }
  if (id) {
    const { error } = await db().from('sessions').update(fields).eq('id', id)
    if (error) throw error
  } else {
    const { error } = await db().from('sessions').insert(fields)
    if (error) throw error
  }
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await db().from('sessions').delete().eq('id', id)
  if (error) throw error
}
// Legacy compatibility: keep getTracks for now

// Replaces the broken nested select with a simpler query (flat, no joins)
export async function getProgramTracks(): Promise<ProgramTrack[]> {
  if (!isConfigured) {
    // fallback to mock data
    return MOCK_TRACKS.filter(t => t.category === 'program')
  }
  const { data, error } = await db()
    .from('program_tracks')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  // filter only 'program' category to match previous behavior
  return (data ?? []).filter((t: ProgramTrack) => t.category === 'program')
}

export async function setTracksStatus(id: string, status: 'open' | 'closed'): Promise<void> {
  const { error } = await db().from('sessions').update({ status }).eq('id', id)
  if (error) throw error
}

// Get program tracks from the table only (no joins, no track_sessions logic)
export async function getTracks(category?: 'program' | 'community'): Promise<ProgramTrack[]> {
  if (!isConfigured) {
    const all = MOCK_TRACKS
    return category ? all.filter(t => t.category === category) : all
  }
  let query = db()
    .from('program_tracks')
    .select('*')
    .order('recommended', { ascending: false })
    .order('created_at')
  if (category) query = query.eq('category', category)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as ProgramTrack[]
}

export async function saveTrack(
  track: Partial<ProgramTrack>,
  _sessionIds: string[]
): Promise<void> {
  const { id, created_at, track_sessions, ...fields } =
    track as ProgramTrack & { created_at?: string; track_sessions?: unknown }

  let trackId = id
  if (trackId) {
    const { error } = await db().from('program_tracks').update(fields).eq('id', trackId)
    if (error) throw error
  } else {
    const { data, error } = await db()
      .from('program_tracks').insert(fields).select('id').single()
    if (error) throw error
    trackId = data.id
  }
}

export async function deleteTrack(id: string): Promise<void> {
  const { error } = await db().from('program_tracks').delete().eq('id', id)
  if (error) throw error
}

export async function setTrackStatus(id: string, status: 'open' | 'closed'): Promise<void> {
  const { error } = await db().from('program_tracks').update({ status }).eq('id', id)
  if (error) throw error
}

// ─── Notices ──────────────────────────────────────────────────────────────────

export async function getNotices(): Promise<Notice[]> {
  if (!isConfigured) return MOCK_NOTICES
  const { data, error } = await db()
    .from('notices').select('*').order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function saveNotice(n: Partial<Notice>): Promise<void> {
  const { id, created_at, ...fields } = n as Notice & { created_at?: string }
  if (id) {
    const { error } = await db().from('notices').update(fields).eq('id', id)
    if (error) throw error
  } else {
    const { error } = await db().from('notices').insert(fields)
    if (error) throw error
  }
}

export async function deleteNotice(id: string): Promise<void> {
  const { error } = await db().from('notices').delete().eq('id', id)
  if (error) throw error
}

// ─── Contents ─────────────────────────────────────────────────────────────────

export async function getContents(): Promise<Content[]> {
  if (!isConfigured) return MOCK_CONTENTS
  const { data, error } = await db()
    .from('contents').select('*').order('published_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getContentById(id: string): Promise<Content | null> {
  if (!isConfigured) {
    return MOCK_CONTENTS.find(c => c.id === id) ?? null
  }
  const { data, error } = await db()
    .from('contents')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function saveContent(c: Partial<Content>): Promise<void> {
  const { id } = c
  const fields = contentSaveFields(c)
  if (id) {
    const { error } = await db().from('contents').update(fields).eq('id', id)
    if (error) throw error
  } else {
    const { error } = await db().from('contents').insert(fields)
    if (error) throw error
  }
}

export async function deleteContent(id: string): Promise<void> {
  const { error } = await db().from('contents').delete().eq('id', id)
  if (error) throw error
}

// ─── Form Questions ───────────────────────────────────────────────────────────

export async function getQuestions(sessionId?: string): Promise<FormQuestion[]> {
  if (!isConfigured) {
    return MOCK_QUESTIONS.filter(q => !q.session_id || q.session_id === sessionId)
      .sort((a, b) => a.order_index - b.order_index)
  }
  let query = db().from('form_questions').select('*').order('order_index')
  if (sessionId) query = query.or(`session_id.is.null,session_id.eq.${sessionId}`)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getAllQuestions(): Promise<FormQuestion[]> {
  if (!isConfigured) return MOCK_QUESTIONS
  const { data, error } = await db()
    .from('form_questions').select('*').order('order_index')
  if (error) throw error
  return data ?? []
}

export async function saveQuestion(q: Partial<FormQuestion>): Promise<void> {
  const { id, created_at, ...fields } = q as FormQuestion & { created_at?: string }
  if (id) {
    const { error } = await db().from('form_questions').update(fields).eq('id', id)
    if (error) throw error
  } else {
    const { error } = await db().from('form_questions').insert(fields)
    if (error) throw error
  }
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await db().from('form_questions').delete().eq('id', id)
  if (error) throw error
}

export async function swapQuestionOrder(a: FormQuestion, b: FormQuestion): Promise<void> {
  const [r1, r2] = await Promise.all([
    db().from('form_questions').update({ order_index: b.order_index }).eq('id', a.id),
    db().from('form_questions').update({ order_index: a.order_index }).eq('id', b.id),
  ])
  if (r1.error) throw r1.error
  if (r2.error) throw r2.error
}

// ─── Applications ─────────────────────────────────────────────────────────────

export interface SubmitPayload {
  trackId?: string
  sessionId?: string    // legacy fallback
  name: string
  email: string
  phone: string
  instagram: string
  totalPrice?: number | null
  selectedLabel?: string | null
  answers: Record<string, string>
}

export async function submitApplication(payload: SubmitPayload): Promise<void> {
  const {
    trackId,
    sessionId,
    name,
    email,
    phone,
    instagram,
    totalPrice,
    selectedLabel,
    answers,
  } = payload
  if (!isConfigured) {
    await new Promise(r => setTimeout(r, 700))
    return
  }
  const { data: app, error: appErr } = await db()
    .from('applications')
    .insert({
      track_id:   trackId   ?? null,
      session_id: sessionId ?? null,
      name,
      email,
      phone,
      instagram,
      total_price: totalPrice ?? null,
      selected_label: selectedLabel ?? null,
      status: 'pending',
    })
    .select('id').single()
  if (appErr) {
    console.error(appErr)
    throw appErr
  }

  const rows = Object.entries(answers)
    .filter(([, v]) => v.trim())
    .map(([question_id, answer]) => ({ application_id: app.id, question_id, answer }))
  if (rows.length > 0) {
    const { error } = await db().from('application_answers').insert(rows)
    if (error) {
      console.error(error)
      throw error
    }
  }
}

export async function getApplications(): Promise<Application[]> {
  if (!isConfigured) return []
  const { data, error } = await db()
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as Application[]
}

export async function setApplicationStatus(
  id: string, status: Application['status']
): Promise<void> {
  const { error } = await db().from('applications').update({ status }).eq('id', id)
  if (error) throw error
}
