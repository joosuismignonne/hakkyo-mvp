import { supabase, isConfigured } from './supabase'
import {
  MOCK_SESSIONS, MOCK_TRACKS, MOCK_NOTICES, MOCK_CONTENTS, MOCK_QUESTIONS,
  MOCK_COMMUNITY_SUBMISSIONS,
} from './mock'
import { isPublicMediaUrl } from './contentStorage'
import { normalizeImageUrls } from './newsContent'
import type {
  Session, ProgramTrack, Notice, Content, FormQuestion, Application,
  CommunitySubmission, AdminNotification,
  ProgramApplication, ProgramApplicationStatus,
} from '../types'

// ─── Answer snapshot helper ───────────────────────────────────────────────────
function questionLabel(q: FormQuestion): string {
  return q.question_ko || q.question_en || q.question_fr || q.id
}

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
    feature_homepage: c.feature_homepage ?? null,
  }
}

function db() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

/** Stable string key for application id ↔ application_id matching */
export function normalizeApplicationId(id: unknown): string {
  if (id == null) return ''
  return String(id).trim().toLowerCase().replace(/^\{|\}$/g, '')
}

const ANSWER_ID_PAGE_SIZE = 1000

async function fetchAnswerCountByApplicationId(): Promise<Record<string, number>> {
  const answerCountMap: Record<string, number> = {}
  let from = 0
  let totalRows = 0

  while (true) {
    const { data, error } = await db()
      .from('application_answers')
      .select('application_id')
      .range(from, from + ANSWER_ID_PAGE_SIZE - 1)

    if (error) throw error

    const rows = data ?? []
    totalRows += rows.length
    for (const row of rows) {
      const key = normalizeApplicationId(row.application_id)
      if (!key) continue
      answerCountMap[key] = (answerCountMap[key] ?? 0) + 1
    }

    if (rows.length < ANSWER_ID_PAGE_SIZE) break
    from += ANSWER_ID_PAGE_SIZE
  }

  console.log('application_answers rows fetched for counting', totalRows)
  return answerCountMap
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

export async function getTrackById(id: string): Promise<ProgramTrack | null> {
  if (!isConfigured) {
    return MOCK_TRACKS.find(t => t.id === id) ?? null
  }
  const { data, error } = await db()
    .from('program_tracks')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as ProgramTrack | null
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
  console.log('[db] delete target table: program_tracks')
  console.log('[db] delete id:', id)
  const { data, error } = await db().from('program_tracks').delete().eq('id', id).select('id')
  console.log('[db] delete result — data:', data, '| error:', error)
  if (error) throw error
  if (!data || data.length === 0) throw new Error(
    'Delete failed: 0 rows deleted from program_tracks. ' +
    'Check that a DELETE RLS policy exists for the authenticated role.'
  )
}

export async function setTrackStatus(id: string, status: 'open' | 'closed'): Promise<void> {
  const { error } = await db().from('program_tracks').update({ status }).eq('id', id)
  if (error) throw error
}

// ─── Notices ──────────────────────────────────────────────────────────────────

export async function getNotices(): Promise<Notice[]> {
  if (!isConfigured) return MOCK_NOTICES
  const { data, error } = await db()
    .from('notices')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []) as Notice[]
}

export async function getNoticeById(id: string): Promise<Notice | null> {
  if (!isConfigured) return MOCK_NOTICES.find(n => n.id === id) ?? null
  const { data, error } = await db()
    .from('notices')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Notice
}

export async function saveNotice(n: Partial<Notice>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, created_at, related_program, ...fields } = n as Notice & { created_at?: string }
  if (id) {
    const { error } = await db().from('notices').update(fields).eq('id', id)
    if (error) throw error
  } else {
    const { error } = await db().from('notices').insert(fields)
    if (error) throw error
  }
}

export async function deleteNotice(id: string): Promise<void> {
  console.log('[db] delete target table: notices')
  console.log('[db] delete id:', id)
  const { data, error } = await db().from('notices').delete().eq('id', id).select('id')
  console.log('[db] delete result — data:', data, '| error:', error)
  if (error) throw error
  if (!data || data.length === 0) throw new Error(
    'Delete failed: 0 rows deleted from notices. ' +
    'Check that a DELETE RLS policy exists for the authenticated role.'
  )
}

// ─── Contents ─────────────────────────────────────────────────────────────────

export async function getContents(): Promise<Content[]> {
  if (!isConfigured) return MOCK_CONTENTS
  const { data, error } = await db()
    .from('contents').select('*').order('published_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getFeaturedContent(): Promise<Content[]> {
  if (!isConfigured) return MOCK_CONTENTS.filter(c => (c as Content & { feature_homepage?: boolean }).feature_homepage)
  const { data, error } = await db()
    .from('contents')
    .select('*')
    .eq('feature_homepage', true)
    .order('published_at', { ascending: false })
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
  console.log('[db] delete target table: contents')
  console.log('[db] delete id:', id)
  const { data, error } = await db().from('contents').delete().eq('id', id).select('id')
  console.log('[db] delete result — data:', data, '| error:', error)
  if (error) throw error
  if (!data || data.length === 0) throw new Error(
    'Delete failed: 0 rows deleted from contents. ' +
    'Check that a DELETE RLS policy exists for the authenticated role.'
  )
}

// ─── Form Questions ───────────────────────────────────────────────────────────

// getQuestions now returns ALL questions without server-side filtering.
// Filtering by track/tag is done client-side in ApplyModal.visibleQuestions
// so that it can react to the user's selected track.
export async function getQuestions(): Promise<FormQuestion[]> {
  if (!isConfigured) {
    return MOCK_QUESTIONS.slice().sort((a, b) => a.order_index - b.order_index)
  }

  const { data, error } = await db()
    .from('form_questions')
    .select('*')
    .order('order_index')
  if (error) throw error

  return (data ?? []) as FormQuestion[]
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
  answers: Record<string, string>   // keys must be real UUIDs from form_questions
  questions?: FormQuestion[]        // snapshot source — pass the loaded questions array
}

export interface LeSubmitPayload {
  name: string
  email: string
  phone: string
  instagram: string
  city: string
  languageLevel: string
  referralSource: string
  message: string
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
    questions = [],
  } = payload
  if (!isConfigured) {
    await new Promise(r => setTimeout(r, 700))
    return
  }
  // Generate the ID client-side so we never need SELECT after INSERT.
  // This avoids the RLS chicken-and-egg: INSERT + RETURNING requires a SELECT policy.
  const applicationId = crypto.randomUUID()

  const { error: appErr } = await db()
    .from('applications')
    .insert({
      id:         applicationId,
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
  if (appErr) {
    console.error(appErr)
    throw appErr
  }

  // Build a lookup map from the questions snapshot passed at call time
  const questionMap = new Map<string, FormQuestion>(questions.map(q => [q.id, q]))

  const rows = Object.entries(answers)
    .filter(([, v]) => v.trim())
    .map(([question_id, answer]) => {
      const q = questionMap.get(question_id)
      return {
        application_id:          applicationId,
        question_id,
        answer,
        question_label_snapshot: q ? questionLabel(q) : null,
        question_type_snapshot:  q?.type  ?? null,
        question_order_snapshot: q?.order_index ?? null,
      }
    })

  console.log('[submitApplication] application_answers payload before insert:', rows)

  if (rows.length > 0) {
    const { error } = await db().from('application_answers').insert(rows)
    if (error) {
      console.error(error)
      throw error
    }
  }

  // Fire notification — must never block or fail the submission
  createAdminNotification({
    type: 'application',
    title: `New Application: ${selectedLabel ?? trackId ?? 'Program'}`,
    message: `${name} (${email}) submitted an application.`,
    related_table: 'applications',
    related_id: applicationId,
  }).catch(() => {})
}


// ─── Admin Notifications ──────────────────────────────────────────────────────

export async function createAdminNotification(n: {
  type: string
  title: string
  message: string
  related_table?: string
  related_id?: string
}): Promise<void> {
  if (!isConfigured) return
  await db().from('admin_notifications').insert({ ...n, is_read: false })
  // errors silently ignored by caller
}

export async function getAdminNotifications(): Promise<AdminNotification[]> {
  if (!isConfigured) return []
  const { data, error } = await db()
    .from('admin_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) {
    console.warn('[notifications]', error.message)
    return []
  }
  return (data ?? []) as AdminNotification[]
}

export async function markNotificationRead(id: string): Promise<void> {
  if (!isConfigured) return
  const { error } = await db().from('admin_notifications').update({ is_read: true }).eq('id', id)
  if (error) console.warn('[notifications] markNotificationRead:', error.message)
}

export async function markAllNotificationsRead(): Promise<void> {
  if (!isConfigured) return
  const { error } = await db()
    .from('admin_notifications')
    .update({ is_read: true })
    .eq('is_read', false)
  if (error) console.warn('[notifications] markAllNotificationsRead:', error.message)
}

export async function submitLeApplication(payload: LeSubmitPayload): Promise<void> {
  const { name, email, phone, instagram, city, languageLevel, referralSource, message } = payload
  if (!isConfigured) {
    await new Promise(r => setTimeout(r, 700))
    return
  }

  // Generate client-side UUID so answers can reference it without a SELECT round-trip
  const applicationId = crypto.randomUUID()

  const { error: appErr } = await db().from('applications').insert({
    id:               applicationId,
    application_type: 'language_exchange',
    selected_label:   'Language Exchange',
    total_price:      0,
    track_id:         null,
    session_id:       null,
    status:           'pending',
    name,
    email,
    phone,
    instagram,
    // Keep flat columns for backward compat — not relied on for Admin display
    city,
    language_level:  languageLevel,
    referral_source: referralSource,
    message,
  })
  if (appErr) {
    console.error('[submitLeApplication] insert error:', appErr)
    throw appErr
  }

  // Write each LE answer into application_answers as the single source of truth.
  // question_id is null because LE questions are not stored in form_questions;
  // question_label_snapshot preserves the label permanently.
  const leAnswerDefs = [
    { label: '현재 거주 도시',               type: 'text',     order: 1, value: city           },
    { label: '언어 레벨',                    type: 'select',   order: 2, value: languageLevel   },
    { label: 'HAKKYO를 어떻게 알게 되셨나요?', type: 'text',     order: 3, value: referralSource  },
    { label: '목표 / 메시지',                 type: 'textarea', order: 4, value: message         },
  ] as const

  const answerRows = leAnswerDefs
    .filter(a => a.value?.trim())
    .map(a => ({
      application_id:          applicationId,
      question_id:             null,
      answer:                  a.value,
      question_label_snapshot: a.label,
      question_type_snapshot:  a.type,
      question_order_snapshot: a.order,
    }))

  if (answerRows.length > 0) {
    const { error: ansErr } = await db().from('application_answers').insert(answerRows)
    if (ansErr) {
      console.error('[submitLeApplication] answers insert error:', ansErr)
      throw ansErr
    }
  }
}

export async function getApplications(): Promise<Application[]> {
  if (!isConfigured) return []

  const [appsResult, answerCountMap] = await Promise.all([
    db().from('applications').select('*').order('created_at', { ascending: false }),
    fetchAnswerCountByApplicationId(),
  ])
  if (appsResult.error) throw appsResult.error

  const applications = (appsResult.data ?? []).map(raw => {
    const app = raw as Application
    const idKey = normalizeApplicationId(app.id)
    return {
      ...app,
      answer_count: answerCountMap[idKey] ?? 0,
    }
  }) as Application[]

  console.log('apps ids', applications.map(a => a.id))
  console.log('answer count map', answerCountMap)
  console.log('mapped apps', applications.map(a => ({ id: a.id, answer_count: a.answer_count })))

  return applications
}

export async function setApplicationStatus(
  id: string, status: Application['status']
): Promise<void> {
  const { error } = await db().from('applications').update({ status }).eq('id', id)
  if (error) throw error
}

// ─── Site Settings ────────────────────────────────────────────────────────────

export interface SiteSettings {
  programs_season_label?: string | null
  language_exchange_title?: string | null
  language_exchange_description_ko?: string | null
  language_exchange_description_en?: string | null
  language_exchange_description_fr?: string | null
  language_exchange_button_text?: string | null
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isConfigured) return {}
  const { data, error } = await db()
    .from('site_settings')
    .select(
      'programs_season_label, language_exchange_title, language_exchange_description_ko, language_exchange_description_en, language_exchange_description_fr, language_exchange_button_text'
    )
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error(error)
    return {}
  }
  return (data ?? {}) as SiteSettings
}

// ─── Language Exchange Settings ───────────────────────────────────────────────

export interface LeSettings {
  id?: string
  schedule?: string | null       // e.g. "Every Saturday · 14:00–16:00"
  location_name?: string | null  // e.g. "HAKKYO Space"
  location_address?: string | null
  google_maps_url?: string | null
  notes?: string | null
}

export async function getLeSettings(): Promise<LeSettings> {
  if (!isConfigured) return {}
  const { data, error } = await db()
    .from('language_exchange_settings')
    .select('*')
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error(error)
    return {}
  }
  return (data ?? {}) as LeSettings
}

// ─── Community Submissions ────────────────────────────────────────────────────
//
// Actual live DB columns (verified 2026-06-16 by probing PostgREST responses):
//   id, type, title, description, author_name, contact, location, link, image_url,
//   status, created_at, updated_at
//
// Columns that do NOT exist: nickname, name, author, source, tags, category
//
// REQUIRED MIGRATION — run once in Supabase SQL editor to enable public posting:
//
//   -- Allow anonymous users to insert
//   drop policy if exists "anon can insert community_submissions" on community_submissions;
//   create policy "anon can insert community_submissions"
//     on community_submissions for insert to anon with check (true);
//
// Without this, every public insert returns 42501 (RLS violation).
//
// Status workflow: pending → approved → published  (or → rejected)
// Only 'published' rows appear on the homepage feed.

// Only columns confirmed to exist in the live DB
const COMMUNITY_COLS = 'id, type, title, description, author_name, contact, location, link, image_url, status, created_at'

export interface CommunitySubmitPayload {
  type:         string
  title:        string
  description:  string
  author_name?: string | null   // DB column: author_name — shown as author in feed
  contact?:     string | null
  location?:    string | null
  link?:        string | null
  image_url?:   string | null
}

export async function submitCommunityPost(payload: CommunitySubmitPayload): Promise<string> {
  const id = crypto.randomUUID()
  if (!isConfigured) {
    await new Promise(r => setTimeout(r, 600))
    return id
  }

  const insertPayload = {
    id,
    type:        payload.type,
    title:       payload.title,
    description: payload.description,
    author_name: payload.author_name ?? null,
    contact:     payload.contact     ?? null,
    location:    payload.location    ?? null,
    link:        payload.link        ?? null,
    image_url:   payload.image_url   ?? null,
    status:      'published',
  }

  const { error } = await db().from('community_submissions').insert(insertPayload)

  if (error) {
    console.error('[db] submitCommunityPost error:', JSON.stringify(error, null, 2))
    if (error.code === '42501') {
      throw new Error('Public posting is not enabled yet. Run the anon insert RLS migration in Supabase.')
    }
    throw error
  }

  return id
}

export async function updateCommunityPost(
  id: string,
  updates: Partial<Pick<CommunitySubmission, 'title' | 'description' | 'type' | 'status' | 'contact' | 'author_name'>>,
): Promise<void> {
  if (!isConfigured) return
  const { error } = await db()
    .from('community_submissions')
    .update(updates)
    .eq('id', id)
  if (error) {
    console.error('[db] updateCommunityPost error:', JSON.stringify(error, null, 2))
    throw error
  }
}

export async function getPublishedCommunityPosts(): Promise<CommunitySubmission[]> {
  if (!isConfigured) {
    return MOCK_COMMUNITY_SUBMISSIONS.filter(s => s.status === 'published')
  }
  const { data, error } = await db()
    .from('community_submissions')
    .select(COMMUNITY_COLS)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  if (error) {
    console.warn('[community] getPublishedCommunityPosts:', error.message)
    return []
  }
  return (data ?? []) as CommunitySubmission[]
}

export async function getCommunityPostById(id: string): Promise<CommunitySubmission | null> {
  if (!isConfigured) {
    return MOCK_COMMUNITY_SUBMISSIONS.find(s => s.id === id) ?? null
  }
  const { data, error } = await db()
    .from('community_submissions')
    .select(COMMUNITY_COLS)
    .eq('id', id)
    .eq('status', 'published')
    .single()
  if (error) return null
  return data as CommunitySubmission
}

// backward-compat alias
export const getApprovedCommunityPosts = getPublishedCommunityPosts

export async function getAllCommunitySubmissions(): Promise<CommunitySubmission[]> {
  if (!isConfigured) return MOCK_COMMUNITY_SUBMISSIONS
  const { data, error } = await db()
    .from('community_submissions')
    .select(COMMUNITY_COLS)
    .order('created_at', { ascending: false })
  if (error) {
    console.warn('[community] getAllCommunitySubmissions:', error.message)
    return []
  }
  return (data ?? []) as CommunitySubmission[]
}

export async function setCommunitySubmissionStatus(
  id: string,
  status: CommunitySubmission['status'],
): Promise<void> {
  if (!isConfigured) return
  const { error } = await db().from('community_submissions').update({ status }).eq('id', id)
  if (error) throw error
}

export async function deleteCommunitySubmission(id: string): Promise<void> {
  if (!isConfigured) return
  console.log('[db] delete target table: community_submissions')
  console.log('[db] delete id:', id)
  const { data, error } = await db().from('community_submissions').delete().eq('id', id).select('id')
  console.log('[db] delete result — data:', data, '| error:', error)
  if (error) throw error
  if (!data || data.length === 0) throw new Error(
    'Delete failed: 0 rows deleted from community_submissions. ' +
    'Check that a DELETE RLS policy exists for the authenticated role.'
  )
}

// ─── Program Applications (new system) ───────────────────────────────────────

export async function submitProgramApplication(
  data: Omit<ProgramApplication, 'id' | 'created_at' | 'updated_at' | 'status' | 'admin_notes'>,
): Promise<string> {
  if (!isConfigured) return 'demo-' + Math.random().toString(36).slice(2)
  const id = crypto.randomUUID()
  const { error } = await db()
    .from('program_applications')
    .insert({ id, ...data, status: 'new' })
  if (error) throw error
  return id
}

export async function getProgramApplications(programId?: string): Promise<ProgramApplication[]> {
  if (!isConfigured) return []
  let q = db()
    .from('program_applications')
    .select('*')
    .order('created_at', { ascending: false })
  if (programId) q = q.eq('program_id', programId)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as ProgramApplication[]
}

export async function getProgramApplicationById(id: string): Promise<ProgramApplication | null> {
  if (!isConfigured) return null
  const { data, error } = await db()
    .from('program_applications')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as ProgramApplication | null
}

export async function updateProgramApplicationStatus(
  id: string,
  status: ProgramApplicationStatus,
): Promise<void> {
  const { error } = await db().from('program_applications').update({ status }).eq('id', id)
  if (error) throw error
}

export async function updateProgramApplicationNotes(
  id: string,
  admin_notes: string,
): Promise<void> {
  const { error } = await db().from('program_applications').update({ admin_notes }).eq('id', id)
  if (error) throw error
}

export async function saveLeSettings(settings: LeSettings): Promise<void> {
  if (!isConfigured) return
  const { id, ...fields } = settings
  if (id) {
    const { error } = await db().from('language_exchange_settings').update(fields).eq('id', id)
    if (error) throw error
  } else {
    const { error } = await db().from('language_exchange_settings').insert(fields)
    if (error) throw error
  }
}
