import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'
import {
  getTracks,     saveTrack,     deleteTrack,     setTrackStatus,
  getNotices,    saveNotice,    deleteNotice,
  getContents,   saveContent,   deleteContent,
  getAllQuestions, saveQuestion, deleteQuestion, swapQuestionOrder,
  getApplications, setApplicationStatus,
  getProgramApplications, updateProgramApplicationStatus, updateProgramApplicationNotes,
  getLeSettings, saveLeSettings,
  getAllCommunitySubmissions, setCommunitySubmissionStatus, deleteCommunitySubmission, updateCommunityPost,
  getAdminNotifications, markNotificationRead, markAllNotificationsRead,
} from '../lib/db'
import type { LeSettings } from '../lib/db'
import type { ProgramTrack, Notice, Content, FormQuestion, Application, ContentCategory, ContentType, CommunitySubmission, AdminNotification, ProgramApplication, ProgramApplicationStatus } from '../types'
import {
  CONTENT_CATEGORIES,
  CONTENT_TYPES,
  normalizeContentType,
  normalizeImageUrls,
  resolveContentCategory,
} from '../lib/newsContent'
import ContentMediaDropzone from '../components/ContentMediaDropzone'
import {
  filterImageFiles,
  isPublicMediaUrl,
  uploadContentImage,
  uploadContentImages,
} from '../lib/contentStorage'
import type { Editor } from '@tiptap/core'
import ContentBodyRichEditors from '../components/ContentBodyRichEditors'
import { insertImageInEditor } from '../components/ContentRichEditor'
import { imageHtml } from '../lib/htmlContent'

type BodyLang = 'ko' | 'en' | 'fr'
const BODY_FIELD: Record<BodyLang, 'body_ko' | 'body_en' | 'body_fr'> = {
  ko: 'body_ko',
  en: 'body_en',
  fr: 'body_fr',
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────
function Spinner() {
  return <div className="py-8 text-center"><div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" /></div>
}
function ErrorMsg({ msg }: { msg: string }) {
  return <p className="py-4 text-sm text-red-500">{msg}</p>
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="py-2 pr-4 text-sm text-gray-700 align-top">{children}</td>
}
function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}
function FL({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>
}
function LangFields({ prefix, ko, en, fr, onChange, multiline = false, textareaRows = 3 }: {
  prefix: string; ko: string; en: string; fr: string
  onChange: (k: string, v: string) => void; multiline?: boolean; textareaRows?: number
}) {
  const el = multiline
    ? (k: string, v: string) => <textarea rows={textareaRows} className="input resize-y min-h-[120px] font-mono text-sm leading-relaxed" value={v} onChange={e => onChange(k, e.target.value)} />
    : (k: string, v: string) => <input type="text" className="input" value={v} onChange={e => onChange(k, e.target.value)} />
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <FL label="KO">{el(`${prefix}_ko`, ko)}</FL>
      <FL label="EN">{el(`${prefix}_en`, en)}</FL>
      <FL label="FR">{el(`${prefix}_fr`, fr)}</FL>
    </div>
  )
}
function SaveRow({ onSave, onCancel, saving, label = 'Save' }: {
  onSave: () => void; onCancel: () => void; saving: boolean; label?: string
}) {
  return (
    <div className="flex gap-2 pt-2">
      <button onClick={onSave} disabled={saving} className="btn-yellow">
        {saving ? 'Saving…' : label}
      </button>
      <button onClick={onCancel} className="btn-outline">Cancel</button>
    </div>
  )
}

// ─── Structured field editors ─────────────────────────────────────────────────

type WeekRow = { week: number; title: string; description: string }
type FaqRow  = { question: string; answer: string }

function WeeklyStructureEditor({ value, onChange }: {
  value: WeekRow[]
  onChange: (v: WeekRow[]) => void
}) {
  function add()              { onChange([...value, { week: value.length + 1, title: '', description: '' }]) }
  function remove(i: number)  { onChange(value.filter((_, idx) => idx !== i)) }
  function upd(i: number, k: keyof WeekRow, v: string | number) {
    onChange(value.map((r, idx) => idx === i ? { ...r, [k]: v } : r))
  }
  return (
    <div className="space-y-2">
      {value.map((row, i) => (
        <div key={i} className="grid grid-cols-[48px_1fr_1fr_24px] gap-2 items-start">
          <input type="number" className="input text-center" value={row.week}
                 onChange={e => upd(i, 'week', Number(e.target.value))} placeholder="Wk" />
          <input className="input" value={row.title}
                 onChange={e => upd(i, 'title', e.target.value)} placeholder="Week title" />
          <input className="input" value={row.description}
                 onChange={e => upd(i, 'description', e.target.value)} placeholder="Description (optional)" />
          <button type="button" onClick={() => remove(i)}
                  className="text-gray-300 hover:text-red-500 text-lg leading-none mt-2">×</button>
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs text-gray-400 hover:text-gray-700">+ Add week</button>
    </div>
  )
}

function FaqEditor({ value, onChange }: {
  value: FaqRow[]
  onChange: (v: FaqRow[]) => void
}) {
  function add()             { onChange([...value, { question: '', answer: '' }]) }
  function remove(i: number) { onChange(value.filter((_, idx) => idx !== i)) }
  function upd(i: number, k: keyof FaqRow, v: string) {
    onChange(value.map((r, idx) => idx === i ? { ...r, [k]: v } : r))
  }
  return (
    <div className="space-y-3">
      {value.map((row, i) => (
        <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2">
          <div className="flex gap-2">
            <input className="input flex-1" value={row.question}
                   onChange={e => upd(i, 'question', e.target.value)} placeholder="Question" />
            <button type="button" onClick={() => remove(i)}
                    className="text-gray-300 hover:text-red-500 text-lg leading-none px-1">×</button>
          </div>
          <textarea className="input resize-none w-full" rows={2} value={row.answer}
                    onChange={e => upd(i, 'answer', e.target.value)} placeholder="Answer" />
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs text-gray-400 hover:text-gray-700">+ Add FAQ item</button>
    </div>
  )
}

// ─── Sessions Admin ────────────────────────────────────────────────────────────
function SessionsAdmin() {
  type AdminTrack = ProgramTrack & { target_audience?: string; included_sessions?: string[] }
  const [rows, setRows] = useState<AdminTrack[]>([])
  const [editing, setEditing] = useState<Partial<AdminTrack> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(
    () =>
      getTracks()
        .then(data => setRows((data ?? []) as AdminTrack[]))
        .catch((e) => setErr(e.message))
        .finally(() => setLoading(false)),
    []
  )
  useEffect(() => {
    load()
  }, [load])

  const TRACK_TARGET_AUDIENCES = [
    { value: 'korean_speaker', label: 'Korean Speaker' },
    { value: 'montreal_local', label: 'Montreal Local / Non-Korean Speaker' },
    { value: 'community', label: 'Community (Language Exchange)' }
  ]

  // This list is display-only/documentation help; admin should create all tracks manually
  // The admin can freely set the fields accordingly
  const TRACK_SUGGESTIONS: Record<string, { label: string; included_sessions: string[] }> = {
    english_track: {
      label: 'English Program (for Korean Speakers)',
      included_sessions: ['English Class', 'Active Output']
    },
    french_track: {
      label: 'French Program (for Korean Speakers)',
      included_sessions: ['French Class', 'Active Output']
    },
    bilingual_track: {
      label: 'Bilingual Program (for Korean Speakers)',
      included_sessions: ['English Class', 'French Class', 'Active Output']
    },
    korean_track: {
      label: 'Korean Program (for Montreal Locals/Non-Korean Speakers)',
      included_sessions: ['Korean Class', 'Active Output']
    },
    korean_french_track: {
      label: 'Korean + French Program (for Montreal Locals/Non-Korean Speakers)',
      included_sessions: ['Korean Class', 'French Class', 'Active Output']
    },
    exchange_track: {
      label: 'Language Exchange (Community Program)',
      included_sessions: ['Open Community Participation']
    }
  }

  const blank = (): Partial<AdminTrack> => ({
    name_ko: '',
    name_en: '',
    name_fr: '',

    description_ko: '',
    description_en: '',
    description_fr: '',

    category: 'program',
    target_audience: '',
    included_sessions: [],

    total_price: 0,
    price_per_class: 0,
    class_count: 0,
    currency: 'CAD',
    duration_weeks: null,

    start_date: null,
    end_date: null,
    application_deadline: null,
    class_schedule: '',
    venue_name: '',
    venue_city: '',
    google_maps_url: '',
    day_of_week: '',
    time: '',
    location: '',
    capacity: 12,
    enrolled: 0,
    recommended: false,
    is_free: false,
    notes: '',

    overview: '',
    target_participants: [],
    learning_outcomes: [],
    output_tags: [],
    weekly_structure: [],
    instructor_name: '',
    instructor_bio: '',
    instructor_image_url: '',
    faq_items: [],
    program_tags: [],

    status: 'open'
  })

  const set = (k: string, v: unknown) => setEditing((e) => (e ? { ...e, [k]: v } : e))

  // included_sessions edit helper
  function includedSessionToggle(name: string) {
    if (!editing) return
    const sessions = Array.isArray(editing.included_sessions) ? editing.included_sessions : []
    set('included_sessions', sessions.includes(name)
      ? sessions.filter((n: string) => n !== name)
      : [...sessions, name]
    );
  }

  async function save() {
    if (!editing) return
    setSaving(true)
    setErr('')
    try {
      await saveTrack({
        ...editing,
        application_deadline: editing.application_deadline || null,
        class_schedule: editing.class_schedule?.trim() || null,
        venue_name: editing.venue_name?.trim() || null,
        venue_city: editing.venue_city?.trim() || null,
        google_maps_url: editing.google_maps_url?.trim() || null,
      } as Partial<ProgramTrack>, [])
      await load()
      setEditing(null)
    } catch (e: unknown) {
      setErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }
  async function remove(id: string) {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) return
    setErr('')
    try {
      await deleteTrack(id)
      setRows((r) => r.filter((x) => x.id !== id))
    } catch (e: unknown) {
      setErr((e as Error).message)
    }
  }
  async function toggle(s: AdminTrack) {
    const next = s.status === 'open' ? 'closed' : 'open'
    setRows((r) => r.map((x) => (x.id === s.id ? { ...x, status: next } : x)))
    try {
      await setTrackStatus(s.id, next)
    } catch (e: unknown) {
      setErr((e as Error).message)
      await load()
    }
  }

  // Included sessions options based on target_audience
  function includedSessionOptions(audience: string) {
    if (audience === 'korean_speaker') {
      return [
        { label: 'English Class', value: 'English Class' },
        { label: 'French Class', value: 'French Class' },
        { label: 'Active Output', value: 'Active Output' }
      ]
    }
    if (audience === 'montreal_local') {
      return [
        { label: 'Korean Class', value: 'Korean Class' },
        { label: 'French Class', value: 'French Class' },
        { label: 'Active Output', value: 'Active Output' }
      ]
    }
    if (audience === 'community') {
      return [{ label: 'Language Exchange', value: 'Open Community Participation' }]
    }
    // fallback: all
    return [
      { label: 'English Class', value: 'English Class' },
      { label: 'French Class', value: 'French Class' },
      { label: 'Korean Class', value: 'Korean Class' },
      { label: 'Active Output', value: 'Active Output' },
      { label: 'Language Exchange', value: 'Open Community Participation' }
    ]
  }

  if (loading) return <Spinner />
  return (
    <div className="space-y-4">
      {err && <ErrorMsg msg={err} />}
      <div className="flex justify-end">
        <button onClick={() => setEditing(blank())} className="btn-yellow">+ New Program</button>
      </div>
      {editing && (
        <FormCard title={editing.id ? 'Edit Program' : 'New Program'}>
          <div className="space-y-4">
            <div>
              <p className="label mb-1">Program Name</p>
              <LangFields prefix="name"
                ko={editing.name_ko || ''}
                en={editing.name_en || ''}
                fr={editing.name_fr || ''}
                onChange={set}
              />
            </div>
            <FL label="Category">
              <select
                className="input"
                value={editing.category || 'program'}
                onChange={e => set('category', e.target.value)}
              >
                <option value="program">Program</option>
                <option value="community">Community</option>
              </select>
            </FL>
            <div>
              <p className="label mb-1">Target Audience</p>
              <select
                className="input"
                value={editing.target_audience || ''}
                onChange={e => set('target_audience', e.target.value)}
              >
                <option value="">Select...</option>
                {TRACK_TARGET_AUDIENCES.map((aud) => (
                  <option key={aud.value} value={aud.value}>{aud.label}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="label mb-1">Included Classes</p>
              <div className="flex flex-wrap gap-3">
                {includedSessionOptions(editing.target_audience || '').map(opt => (
                  <label key={opt.value} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={Array.isArray(editing.included_sessions) ? editing.included_sessions.includes(opt.value) : false}
                      onChange={() => includedSessionToggle(opt.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="label mb-1">Program tags <span className="font-normal text-gray-400">(used to filter application questions)</span></p>
              <p className="text-[11px] text-gray-400 mb-2">
                Questions tagged with matching tags will appear on this program's application form.
              </p>
              <div className="flex flex-wrap gap-3">
                {([ ['korean','Korean'], ['english','English'], ['french','French'], ['active_output','Active Output'] ] as [string,string][]).map(([tag, label]) => {
                  const current: string[] = Array.isArray(editing.program_tags) ? editing.program_tags as string[] : []
                  const checked = current.includes(tag)
                  return (
                    <label key={tag} className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={checked}
                        className="w-4 h-4 accent-black rounded"
                        onChange={() => set('program_tags', checked ? current.filter(t => t !== tag) : [...current, tag])}
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
            <div>
              <p className="label mb-1">Description</p>
              <LangFields prefix="description"
                ko={editing.description_ko || ''}
                en={editing.description_en || ''}
                fr={editing.description_fr || ''}
                onChange={set}
                multiline
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <FL label="Price">
                <input
                  type="number"
                  className="input"
                  value={editing.total_price ?? ''}
                  onChange={e => set('total_price', Number(e.target.value) || 0)}
                />
              </FL>
              <FL label="Duration">
                <input
                  type="number"
                  className="input"
                  value={editing.duration_weeks ?? ''}
                  onChange={e => set('duration_weeks', Number(e.target.value) || null)}
                  placeholder="weeks"
                />
              </FL>
              <FL label="Class Count">
                <input type="number" className="input" value={editing.class_count ?? ''} onChange={e => set('class_count', Number(e.target.value) || 0)} />
              </FL>
              <FL label="Start Date">
                <input type="date" className="input" value={editing.start_date || ''} onChange={e => set('start_date', e.target.value || null)} />
              </FL>
              <FL label="End Date">
                <input type="date" className="input" value={editing.end_date || ''} onChange={e => set('end_date', e.target.value || null)} />
              </FL>
              <FL label="Application deadline">
                <input
                  type="date"
                  className="input"
                  value={editing.application_deadline || ''}
                  onChange={e => set('application_deadline', e.target.value || null)}
                />
              </FL>
              <FL label="Capacity">
                <input type="number" className="input" value={editing.capacity ?? 12} onChange={e => set('capacity', Number(e.target.value) || 0)} />
              </FL>
              <FL label="Status">
                <select className="input" value={editing.status} onChange={e => set('status', e.target.value)}>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </FL>
            </div>
            {/* Pinned toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={!!editing.is_pinned} onChange={e => set('is_pinned', e.target.checked)}
                     className="w-4 h-4 rounded border-gray-300 accent-gray-900" />
              <span className="text-sm text-gray-700">Pin to top of homepage feed</span>
            </label>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Public Programs page details
              </p>
              <FL label="Class schedule">
                <textarea
                  rows={5}
                  className="input resize-y min-h-[120px] font-mono text-sm leading-relaxed"
                  placeholder={'English Class | Mon / Wed | 19:00 – 20:30\nFrench Class | Tue / Thu | 18:00 – 19:30'}
                  value={editing.class_schedule ?? ''}
                  onChange={e => set('class_schedule', e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">One class per line: Name | Days | Time</p>
              </FL>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FL label="Venue name">
                  <input
                    className="input"
                    placeholder="HAKKYO Space"
                    value={editing.venue_name ?? ''}
                    onChange={e => set('venue_name', e.target.value)}
                  />
                </FL>
                <FL label="Venue city">
                  <input
                    className="input"
                    placeholder="Montréal, QC"
                    value={editing.venue_city ?? ''}
                    onChange={e => set('venue_city', e.target.value)}
                  />
                </FL>
              </div>
              <FL label="Google Maps URL">
                <input
                  type="url"
                  className="input"
                  placeholder="https://maps.google.com/..."
                  value={editing.google_maps_url ?? ''}
                  onChange={e => set('google_maps_url', e.target.value)}
                />
              </FL>
            </div>

            {/* ── Detail page content ── */}
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Detail page content
              </p>

              <FL label="Overview">
                <textarea
                  rows={3}
                  className="input resize-y"
                  placeholder="Short intro — what the program is and who it's for."
                  value={(editing as Partial<ProgramTrack>).overview ?? ''}
                  onChange={e => set('overview', e.target.value)}
                />
              </FL>

              <FL label="Who It's For (one per line)">
                <textarea
                  rows={3}
                  className="input resize-y font-mono text-sm"
                  placeholder={"Korean speakers learning English\nBeginners welcome"}
                  value={((editing as Partial<ProgramTrack>).target_participants ?? []).join('\n')}
                  onChange={e => set('target_participants', e.target.value.split('\n'))}
                />
              </FL>

              <FL label="What You'll Learn (one per line)">
                <textarea
                  rows={3}
                  className="input resize-y font-mono text-sm"
                  placeholder={"Build conversational fluency\nLearn grammar in context"}
                  value={((editing as Partial<ProgramTrack>).learning_outcomes ?? []).join('\n')}
                  onChange={e => set('learning_outcomes', e.target.value.split('\n'))}
                />
              </FL>

              <FL label="Output Tags — shown on program cards (comma-separated)">
                <input
                  type="text"
                  className="input"
                  placeholder="Self Introduction, Café Ordering, Daily Conversation, Active Output"
                  value={((editing as Partial<ProgramTrack>).output_tags ?? []).join(', ')}
                  onChange={e => set('output_tags', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                />
              </FL>

              <div>
                <p className="label mb-2">Weekly Structure</p>
                <WeeklyStructureEditor
                  value={(editing as Partial<ProgramTrack>).weekly_structure as WeekRow[] ?? []}
                  onChange={v => set('weekly_structure', v)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FL label="Instructor name">
                  <input
                    className="input"
                    placeholder="e.g. Joohyeong"
                    value={(editing as Partial<ProgramTrack>).instructor_name ?? ''}
                    onChange={e => set('instructor_name', e.target.value)}
                  />
                </FL>
                <FL label="Instructor image URL">
                  <input
                    type="url"
                    className="input"
                    placeholder="https://…"
                    value={(editing as Partial<ProgramTrack>).instructor_image_url ?? ''}
                    onChange={e => set('instructor_image_url', e.target.value)}
                  />
                </FL>
              </div>

              <FL label="Instructor bio">
                <textarea
                  rows={3}
                  className="input resize-y"
                  placeholder="Short bio about the instructor."
                  value={(editing as Partial<ProgramTrack>).instructor_bio ?? ''}
                  onChange={e => set('instructor_bio', e.target.value)}
                />
              </FL>

              <div>
                <p className="label mb-2">FAQ</p>
                <FaqEditor
                  value={(editing as Partial<ProgramTrack>).faq_items as FaqRow[] ?? []}
                  onChange={v => set('faq_items', v)}
                />
              </div>
            </div>

            <SaveRow onSave={save} onCancel={() => setEditing(null)} saving={saving} />
          </div>
        </FormCard>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <Th>Program</Th>
              <Th>Audience</Th>
              <Th>Tags</Th>
              <Th>Price</Th>
              <Th>Duration</Th>
              <Th>Spots</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((s) => (
              <tr key={s.id}>
                <Td>
                  <span className="font-medium text-gray-900">
                    {s.name_en || s.name_ko}
                  </span>
                </Td>
                <Td>
                  {TRACK_TARGET_AUDIENCES.find(a => a.value === s.target_audience)?.label || ''}
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(s.program_tags) && s.program_tags.length > 0)
                      ? (s.program_tags as string[]).map(tag => (
                          <span key={tag} className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))
                      : <span className="text-xs text-gray-300">—</span>}
                  </div>
                </Td>
                <Td>{s.total_price ?? '-'}</Td>
                <Td>{s.duration_weeks ?? '-'}</Td>
                <Td>{s.capacity}</Td>
                <Td>
                  <button
                    onClick={() => toggle(s)}
                    className={
                      (s.status === 'open'
                        ? 'badge-open'
                        : 'badge-closed') + ' cursor-pointer'
                    }
                  >
                    {s.status}
                  </button>
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(s)}
                      className="btn-ghost py-1 px-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(s.id)}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pt-6">
        <details>
          <summary className="cursor-pointer underline">Program structure reference</summary>
          <ul className="mt-2 text-sm space-y-1">
            <li>For Korean Speakers:</li>
            <li>• English Program: English Class, Active Output</li>
            <li>• French Program: French Class, Active Output</li>
            <li>• Bilingual Program: English Class, French Class, Active Output</li>
            <li className="mt-2">For Montreal Locals / Non-Korean Speakers:</li>
            <li>• Korean Program: Korean Class, Active Output</li>
            <li>• Korean + French Program: Korean Class, French Class, Active Output</li>
            <li className="mt-2">Community:</li>
            <li>• Language Exchange: Open Community Participation</li>
          </ul>
        </details>
      </div>
    </div>
  )
}

// ─── Notices Admin ─────────────────────────────────────────────────────────────
function NoticesAdmin() {
  const [rows,      setRows]      = useState<Notice[]>([])
  const [editing,   setEditing]   = useState<Partial<Notice> | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [err,       setErr]       = useState('')
  const [tracks,    setTracks]    = useState<ProgramTrack[]>([])

  const load = useCallback(() =>
    getNotices().then(setRows).catch(e => setErr(e.message)).finally(() => setLoading(false))
  , [])
  useEffect(() => {
    load()
    getTracks('program').then(setTracks).catch(() => {})
  }, [load])

  const blank = (): Partial<Notice> => ({
    title_ko:'', title_en:'', title_fr:'',
    body_ko:'', body_en:'', body_fr:'',
    type:'notice', date: new Date().toISOString().split('T')[0],
    image_url: '',
    location_name: '',
    map_url: '',
    instagram_url: '',
    external_url: '',
    related_program_label: '',
    related_program_id: null,
  })
  const set = (k: string, v: unknown) => setEditing(e => e ? { ...e, [k]: v } : e)

  const uploadFolder = () => (editing?.id ? `notice-${editing.id}` : 'notice-draft')

  async function onImageFile(files: File[]) {
    const images = filterImageFiles(files)
    const file = images[0]
    if (!file || !editing) return
    setUploading(true); setErr('')
    try {
      const url = await uploadContentImage(file, uploadFolder())
      set('image_url', url)
    } catch (e: unknown) { setErr((e as Error).message) }
    finally { setUploading(false) }
  }

  async function save() {
    if (!editing) return
    setSaving(true); setErr('')
    try {
      await saveNotice({
        ...editing,
        image_url:             isPublicMediaUrl(editing.image_url) ? editing.image_url : null,
        location_name:         editing.location_name?.trim()         || null,
        map_url:               editing.map_url?.trim()               || null,
        instagram_url:         editing.instagram_url?.trim()         || null,
        external_url:          editing.external_url?.trim()          || null,
        related_program_label: editing.related_program_label?.trim() || null,
        related_program_id:    editing.related_program_id    || null,
      })
      await load(); setEditing(null)
    }
    catch (e: unknown) { setErr((e as Error).message) }
    finally { setSaving(false) }
  }
  async function remove(id: string) {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) return
    setDeleting(id); setErr('')
    try {
      await deleteNotice(id)
      setRows(r => r.filter(x => x.id !== id))
    } catch (e: unknown) {
      setErr((e as Error).message ?? 'Failed to delete.')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return <Spinner />
  return (
    <div className="space-y-4">
      {err && <ErrorMsg msg={err} />}
      <div className="flex justify-end">
        <button onClick={() => setEditing(blank())} className="btn-yellow">+ New Notice</button>
      </div>
      {editing && (
        <FormCard title={editing.id ? 'Edit Notice' : 'New Notice'}>
          <div className="space-y-4">
            <div><p className="label mb-1">Title</p><LangFields prefix="title" ko={editing.title_ko||''} en={editing.title_en||''} fr={editing.title_fr||''} onChange={set} /></div>
            <div><p className="label mb-1">Body</p><LangFields prefix="body" ko={editing.body_ko||''} en={editing.body_en||''} fr={editing.body_fr||''} onChange={set} multiline /></div>
            <div className="grid grid-cols-2 gap-3">
              <FL label="Type">
                <select className="input" value={editing.type} onChange={e => set('type', e.target.value)}>
                  {['hiring','event','notice'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FL>
              <FL label="Date"><input type="date" className="input" value={editing.date||''} onChange={e => set('date', e.target.value)} /></FL>
            </div>

            {/* Pinned toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={!!editing.is_pinned} onChange={e => set('is_pinned', e.target.checked)}
                     className="w-4 h-4 rounded border-gray-300 accent-gray-900" />
              <span className="text-sm text-gray-700">Pin to top of homepage feed</span>
            </label>

            {/* Image upload */}
            <FL label="Cover image (optional)">
              {editing.image_url && isPublicMediaUrl(editing.image_url) ? (
                <div className="flex items-start gap-3">
                  <img
                    src={editing.image_url}
                    alt=""
                    className="w-24 h-16 object-cover rounded border border-gray-200 shrink-0"
                  />
                  <button
                    type="button"
                    onClick={() => set('image_url', '')}
                    className="text-xs text-red-500 hover:text-red-700 mt-1"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <ContentMediaDropzone
                  disabled={uploading}
                  onFiles={onImageFile}
                />
              )}
              {uploading && <p className="text-xs text-gray-400 mt-1">Uploading…</p>}
            </FL>

            {/* Optional detail fields */}
            <div className="pt-1 border-t border-gray-100">
              <p className="label mb-3">Details (optional)</p>
              <div className="grid grid-cols-1 gap-3">
                <FL label="Location name">
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. HAKKYO Space, Café Osmo"
                    value={editing.location_name ?? ''}
                    onChange={e => set('location_name', e.target.value)}
                  />
                </FL>
                <FL label="Map URL">
                  <input
                    type="url"
                    className="input"
                    placeholder="https://maps.google.com/..."
                    value={editing.map_url ?? ''}
                    onChange={e => set('map_url', e.target.value)}
                  />
                </FL>
                <FL label="Instagram URL">
                  <input
                    type="url"
                    className="input"
                    placeholder="https://instagram.com/..."
                    value={editing.instagram_url ?? ''}
                    onChange={e => set('instagram_url', e.target.value)}
                  />
                </FL>
                <FL label="External link">
                  <input
                    type="url"
                    className="input"
                    placeholder="https://..."
                    value={editing.external_url ?? ''}
                    onChange={e => set('external_url', e.target.value)}
                  />
                </FL>
                <FL label="Related program">
                  <select
                    className="input"
                    value={editing.related_program_id ?? ''}
                    onChange={e => {
                      const id = e.target.value || null
                      const track = tracks.find(t => t.id === id)
                      set('related_program_id', id)
                      set('related_program_label', track?.name_en ?? null)
                    }}
                  >
                    <option value="">— none —</option>
                    {tracks.map(t => (
                      <option key={t.id} value={t.id}>{t.name_en || t.name_ko}</option>
                    ))}
                  </select>
                </FL>
              </div>
            </div>

            <SaveRow onSave={save} onCancel={() => setEditing(null)} saving={saving} />
          </div>
        </FormCard>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr><Th>Title</Th><Th>Type</Th><Th>Date</Th><Th>Image</Th><Th>Actions</Th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(n => (
              <tr key={n.id}>
                <Td><span className="font-medium">{n.title_en||n.title_ko}</span></Td>
                <Td><span className="text-xs uppercase tracking-wide font-semibold text-gray-400">{n.type}</span></Td>
                <Td>{n.date}</Td>
                <Td>
                  {n.image_url
                    ? <img src={n.image_url} alt="" className="w-10 h-7 object-cover rounded border border-gray-200" />
                    : <span className="text-xs text-gray-300">—</span>}
                </Td>
                <Td><div className="flex gap-2">
                  <button onClick={() => setEditing(n)} className="btn-ghost py-1 px-2">Edit</button>
                  <button onClick={() => remove(n.id)} disabled={deleting === n.id}
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1 disabled:opacity-40">
                    {deleting === n.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Content Admin ─────────────────────────────────────────────────────────────
function ContentAdmin() {
  const [rows,    setRows]    = useState<Content[]>([])
  const [editing,  setEditing]  = useState<Partial<Content> | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [uploading, setUploading] = useState<'thumb' | 'images' | null>(null)
  const [err,      setErr]      = useState('')
  const [copyOk,   setCopyOk]   = useState<string | null>(null)
  const editorRefs = useRef<Record<BodyLang, Editor | null>>({
    ko: null,
    en: null,
    fr: null,
  })

  const load = useCallback(() =>
    getContents()
      .then(data => setRows(data ?? []))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
  , [])
  useEffect(() => { load() }, [load])

  const blank = (): Partial<Content> => ({
    title_ko:'', title_en:'', title_fr:'',
    body_ko:'', body_en:'', body_fr:'',
    category: 'montreal',
    type:'text',
    link:'',
    thumbnail_url: '',
    image_urls: [],
    video_url: '',
    published_at: new Date().toISOString().split('T')[0],
  })
  const set = (k: string, v: unknown) => setEditing(e => e ? { ...e, [k]: v } : e)

  const uploadFolder = () => (editing?.id ? String(editing.id) : 'draft')

  async function onThumbnailFiles(files: File[]) {
    const images = filterImageFiles(files)
    const file = images[0]
    if (!file || !editing) return
    setUploading('thumb')
    setErr('')
    try {
      const url = await uploadContentImage(file, uploadFolder())
      set('thumbnail_url', url)
    } catch (e: unknown) {
      setErr((e as Error).message)
    } finally {
      setUploading(null)
    }
  }

  async function onContentImageFiles(files: File[]) {
    const images = filterImageFiles(files)
    if (!images.length || !editing) return
    setUploading('images')
    setErr('')
    try {
      const urls = await uploadContentImages(images, uploadFolder())
      const existing = normalizeImageUrls(editing.image_urls)
      set('image_urls', [...existing, ...urls])
    } catch (e: unknown) {
      setErr((e as Error).message)
    } finally {
      setUploading(null)
    }
  }

  function removeContentImage(url: string) {
    if (!editing) return
    const next = normalizeImageUrls(editing.image_urls).filter(u => u !== url)
    set('image_urls', next)
  }

  function insertImageIntoBody(lang: BodyLang, url: string) {
    if (!editing) return
    const field = BODY_FIELD[lang]
    const editor = editorRefs.current[lang]
    if (insertImageInEditor(editor, url)) {
      set(field, editor!.getHTML())
      return
    }
    const current = (editing[field] as string | undefined) ?? ''
    set(field, `${current}<p>${imageHtml(url)}</p>`)
  }

  async function copyImageHtml(url: string) {
    const snippet = imageHtml(url)
    try {
      await navigator.clipboard.writeText(snippet)
      setCopyOk(url)
      window.setTimeout(() => setCopyOk(prev => (prev === url ? null : prev)), 2000)
    } catch {
      setErr('Could not copy to clipboard.')
    }
  }

  async function save() {
    if (!editing) return
    setSaving(true); setErr('')
    try {
      const thumb = editing.thumbnail_url?.trim() ?? ''
      await saveContent({
        ...editing,
        type: normalizeContentType(editing.type),
        category: (editing.category as ContentCategory) || 'montreal',
        thumbnail_url: isPublicMediaUrl(thumb) ? thumb : null,
        image_urls: normalizeImageUrls(editing.image_urls).filter(isPublicMediaUrl),
        video_url: editing.video_url?.trim() || null,
      })
      await load()
      setEditing(null)
    }
    catch (e: unknown) { setErr((e as Error).message) }
    finally { setSaving(false) }
  }
  async function remove(id: string) {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) return
    setDeleting(id); setErr('')
    try {
      await deleteContent(id)
      setRows(r => r.filter(x => x.id !== id))
    } catch (e: unknown) {
      setErr((e as Error).message ?? 'Failed to delete.')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return <Spinner />
  return (
    <div className="space-y-4">
      {err && <ErrorMsg msg={err} />}
      <div className="flex justify-end">
        <button onClick={() => setEditing(blank())} className="btn-yellow">+ New Content</button>
      </div>
      {editing && (
        <FormCard title={editing.id ? 'Edit Content' : 'New Content'}>
          <div className="space-y-4">
            <div><p className="label mb-1">Title</p><LangFields prefix="title" ko={editing.title_ko||''} en={editing.title_en||''} fr={editing.title_fr||''} onChange={set} /></div>
            <div>
              <p className="label mb-1">Body</p>
              <p className="text-xs text-gray-400 mb-2">
                Rich text editor — saved as HTML. Headings, lists, quotes, links, images, and YouTube embeds.
              </p>
              <ContentBodyRichEditors
                ko={editing.body_ko || ''}
                en={editing.body_en || ''}
                fr={editing.body_fr || ''}
                onChange={set}
                editorRefs={editorRefs}
              />
            </div>
            <FL label="Thumbnail">
              <input
                type="file"
                accept="image/*"
                className="input text-sm"
                disabled={uploading === 'thumb'}
                onChange={e => {
                  const files = e.target.files ? Array.from(e.target.files) : []
                  e.target.value = ''
                  void onThumbnailFiles(files)
                }}
              />
              <ContentMediaDropzone
                disabled={uploading === 'thumb'}
                onFiles={files => void onThumbnailFiles(files)}
              />
              {uploading === 'thumb' && (
                <p className="text-xs text-gray-400 mt-2">Uploading to Supabase…</p>
              )}
              <input
                type="url"
                className="input mt-2"
                placeholder="Or paste public image URL (https://…)"
                value={isPublicMediaUrl(editing.thumbnail_url) ? editing.thumbnail_url ?? '' : ''}
                onChange={e => set('thumbnail_url', e.target.value)}
              />
              {isPublicMediaUrl(editing.thumbnail_url) && (
                <div className="mt-3 aspect-[16/10] max-w-sm overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  <img
                    src={editing.thumbnail_url!.trim()}
                    alt="Thumbnail preview"
                    className="h-full w-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              )}
            </FL>
            <FL label="Content images (body)">
              <input
                type="file"
                accept="image/*"
                multiple
                className="input text-sm"
                disabled={uploading === 'images'}
                onChange={e => {
                  const files = e.target.files ? Array.from(e.target.files) : []
                  e.target.value = ''
                  void onContentImageFiles(files)
                }}
              />
              <ContentMediaDropzone
                multiple
                disabled={uploading === 'images'}
                onFiles={files => void onContentImageFiles(files)}
              />
              {uploading === 'images' && (
                <p className="text-xs text-gray-400 mt-2">Uploading to Supabase…</p>
              )}
              {normalizeImageUrls(editing.image_urls).length > 0 && (
                <div className="mt-3 space-y-3">
                  {normalizeImageUrls(editing.image_urls).map(url => (
                    <div
                      key={url}
                      className="flex flex-col sm:flex-row gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
                    >
                      <div className="sm:w-36 shrink-0 aspect-[4/3] overflow-hidden rounded-md border border-gray-200 bg-white">
                        <img src={url} alt="Content image preview" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <code className="block truncate text-[10px] text-gray-500">{imageHtml(url)}</code>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => void copyImageHtml(url)}
                            className="btn-ghost py-1 px-2 text-xs"
                          >
                            {copyOk === url ? 'Copied' : 'Copy HTML'}
                          </button>
                          <button
                            type="button"
                            onClick={() => insertImageIntoBody('ko', url)}
                            className="btn-ghost py-1 px-2 text-xs"
                          >
                            Insert KO
                          </button>
                          <button
                            type="button"
                            onClick={() => insertImageIntoBody('en', url)}
                            className="btn-ghost py-1 px-2 text-xs"
                          >
                            Insert EN
                          </button>
                          <button
                            type="button"
                            onClick={() => insertImageIntoBody('fr', url)}
                            className="btn-ghost py-1 px-2 text-xs"
                          >
                            Insert FR
                          </button>
                          <button
                            type="button"
                            onClick={() => removeContentImage(url)}
                            className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400">
                          Inserts image at cursor in the active editor.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">
                URLs saved to <code className="text-gray-500">image_urls</code> on Save.
              </p>
            </FL>
            <FL label="Video URL (YouTube / Vimeo)">
              <input
                type="url"
                className="input"
                placeholder="https://www.youtube.com/watch?v=… or https://vimeo.com/…"
                value={editing.video_url ?? ''}
                onChange={e => set('video_url', e.target.value)}
              />
            </FL>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <FL label="Category">
                <select
                  className="input"
                  value={editing.category || 'montreal'}
                  onChange={e => set('category', e.target.value)}
                >
                  {CONTENT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                  ))}
                </select>
              </FL>
              <FL label="Content type (internal)">
                <select
                  className="input"
                  value={normalizeContentType(editing.type)}
                  onChange={e => set('type', e.target.value as ContentType)}
                >
                  {CONTENT_TYPES.map(ct => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                </select>
              </FL>
              <FL label="Link (optional)"><input className="input" value={editing.link||''} onChange={e => set('link', e.target.value)} /></FL>
              <FL label="Published Date"><input type="date" className="input" value={editing.published_at||''} onChange={e => set('published_at', e.target.value)} /></FL>
            </div>
            <SaveRow onSave={save} onCancel={() => setEditing(null)} saving={saving} />
          </div>
        </FormCard>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr><Th>Title</Th><Th>Category</Th><Th>Type</Th><Th>Published</Th><Th>Actions</Th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(c => (
              <tr key={c.id}>
                <Td><span className="font-medium">{c.title_en||c.title_ko}</span></Td>
                <Td><span className="text-xs uppercase tracking-wide font-semibold text-gray-400">{resolveContentCategory(c)}</span></Td>
                <Td><span className="text-xs uppercase tracking-wide font-semibold text-gray-400">{normalizeContentType(c.type)}</span></Td>
                <Td>{c.published_at}</Td>
                <Td><div className="flex gap-2">
                  <button onClick={() => setEditing({
                    ...c,
                    type: normalizeContentType(c.type),
                    category: resolveContentCategory(c),
                    image_urls: normalizeImageUrls(c.image_urls),
                    video_url: c.video_url ?? '',
                  })} className="btn-ghost py-1 px-2">Edit</button>
                  <button onClick={() => remove(c.id)} disabled={deleting === c.id}
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1 disabled:opacity-40">
                    {deleting === c.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Unified Content Admin ─────────────────────────────────────────────────────
// Writes to `contents` (News) or `notices` (Board) based on Publish To selection.
// Board category → Notice.type mapping:  notice→'notice'  events→'event'  community→'hiring'
// Board community subtype stored in Notice.tags[0].

type PublishTo   = 'news' | 'board'
type BoardCat    = 'notice' | 'events' | 'community'
type CommSubtype = 'housing' | 'jobs' | 'roommates' | 'language-exchange' | 'general'

interface UnifiedDraft {
  publishTo:           PublishTo
  id?:                 string
  sourceTable?:        'contents' | 'notices'
  // shared
  title_ko: string;  title_en: string;  title_fr: string
  body_ko:  string;  body_en:  string;  body_fr:  string
  thumbnail_url:       string | null
  image_urls:          string[]
  video_url:           string
  link:                string
  is_pinned:           boolean
  feature_homepage:    boolean
  // news
  newsCategory:        ContentCategory
  contentType:         ContentType
  published_at:        string
  // board
  boardCategory:       BoardCat
  communitySubtype:    CommSubtype
  date:                string
  location_name:       string
  map_url:             string
  instagram_url:       string
  external_url:        string
  related_program_id:  string | null
  related_program_label: string | null
}

const todayStr = () => new Date().toISOString().split('T')[0]

function blankUnified(publishTo: PublishTo = 'news'): UnifiedDraft {
  return {
    publishTo,
    title_ko: '', title_en: '', title_fr: '',
    body_ko:  '', body_en:  '', body_fr:  '',
    thumbnail_url: null, image_urls: [], video_url: '', link: '', is_pinned: false, feature_homepage: false,
    newsCategory: 'montreal', contentType: 'text', published_at: todayStr(),
    boardCategory: 'notice', communitySubtype: 'general',
    date: todayStr(),
    location_name: '', map_url: '', instagram_url: '', external_url: '',
    related_program_id: null, related_program_label: null,
  }
}

function contentToDraft(c: Content): UnifiedDraft {
  return {
    ...blankUnified('news'),
    id: c.id, sourceTable: 'contents',
    title_ko: c.title_ko, title_en: c.title_en, title_fr: c.title_fr,
    body_ko: c.body_ko,   body_en: c.body_en,   body_fr: c.body_fr,
    thumbnail_url: c.thumbnail_url ?? null,
    image_urls: normalizeImageUrls(c.image_urls),
    video_url: c.video_url ?? '',
    link: c.link ?? '',
    is_pinned: !!c.is_pinned,
    feature_homepage: !!c.feature_homepage,
    newsCategory: resolveContentCategory(c),
    contentType: normalizeContentType(c.type),
    published_at: c.published_at,
  }
}

function noticeToDraft(n: Notice): UnifiedDraft {
  const boardCategory: BoardCat =
    n.type === 'event' ? 'events' : n.type === 'hiring' ? 'community' : 'notice'
  return {
    ...blankUnified('board'),
    id: n.id, sourceTable: 'notices',
    title_ko: n.title_ko, title_en: n.title_en, title_fr: n.title_fr,
    body_ko: n.body_ko,   body_en: n.body_en,   body_fr: n.body_fr,
    thumbnail_url: n.image_url ?? null,
    is_pinned: !!n.is_pinned,
    boardCategory,
    communitySubtype: ((n.tags ?? [])[0] as CommSubtype | undefined) ?? 'general',
    date: n.date,
    location_name: n.location_name ?? '',
    map_url: n.map_url ?? '',
    instagram_url: n.instagram_url ?? '',
    external_url: n.external_url ?? '',
    related_program_id: n.related_program_id ?? null,
    related_program_label: n.related_program_label ?? null,
  }
}

function UnifiedContentAdmin() {
  const [newsRows,    setNewsRows]    = useState<Content[]>([])
  const [boardRows,   setBoardRows]   = useState<Notice[]>([])
  const [editing,     setEditing]     = useState<UnifiedDraft | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [deleting,    setDeleting]    = useState<string | null>(null)
  const [uploading,   setUploading]   = useState<'thumb' | 'images' | null>(null)
  const [err,         setErr]         = useState('')
  const [copyOk,      setCopyOk]      = useState<string | null>(null)
  const [tracks,      setTracks]      = useState<ProgramTrack[]>([])

  const editorRefs = useRef<Record<BodyLang, Editor | null>>({ ko: null, en: null, fr: null })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [news, board] = await Promise.all([getContents(), getNotices()])
      setNewsRows(news ?? [])
      setBoardRows(board ?? [])
    } catch (e: unknown) { setErr((e as Error).message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    void load()
    getTracks('program').then(setTracks).catch(() => {})
  }, [load])

  const set = (k: string, v: unknown) =>
    setEditing(e => e ? { ...e, [k]: v } : e)

  const uploadFolder = () =>
    editing?.id ? String(editing.id) : `draft-${editing?.publishTo ?? 'news'}`

  async function onThumbFiles(files: File[]) {
    const file = filterImageFiles(files)[0]
    if (!file || !editing) return
    setUploading('thumb'); setErr('')
    try { set('thumbnail_url', await uploadContentImage(file, uploadFolder())) }
    catch (e: unknown) { setErr((e as Error).message) }
    finally { setUploading(null) }
  }

  async function onBodyImageFiles(files: File[]) {
    const imgs = filterImageFiles(files)
    if (!imgs.length || !editing) return
    setUploading('images'); setErr('')
    try {
      const urls = await uploadContentImages(imgs, uploadFolder())
      set('image_urls', [...(editing.image_urls ?? []), ...urls])
    } catch (e: unknown) { setErr((e as Error).message) }
    finally { setUploading(null) }
  }

  function removeBodyImage(url: string) {
    if (!editing) return
    set('image_urls', (editing.image_urls ?? []).filter(u => u !== url))
  }

  function insertBodyImage(lang: BodyLang, url: string) {
    if (!editing) return
    const field = BODY_FIELD[lang]
    const editor = editorRefs.current[lang]
    if (insertImageInEditor(editor, url)) { set(field, editor!.getHTML()); return }
    set(field, `${(editing[field] as string) ?? ''}<p>${imageHtml(url)}</p>`)
  }

  async function copyHtml(url: string) {
    try {
      await navigator.clipboard.writeText(imageHtml(url))
      setCopyOk(url)
      window.setTimeout(() => setCopyOk(p => p === url ? null : p), 2000)
    } catch { setErr('Could not copy to clipboard.') }
  }

  async function save() {
    if (!editing) return
    setSaving(true); setErr('')
    try {
      if (editing.publishTo === 'news') {
        await saveContent({
          ...(editing.id ? { id: editing.id } : {}),
          title_ko: editing.title_ko, title_en: editing.title_en, title_fr: editing.title_fr,
          body_ko: editing.body_ko,   body_en: editing.body_en,   body_fr: editing.body_fr,
          category: editing.newsCategory,
          type: editing.contentType,
          thumbnail_url: isPublicMediaUrl(editing.thumbnail_url) ? editing.thumbnail_url : null,
          image_urls: (editing.image_urls ?? []).filter(isPublicMediaUrl),
          video_url: editing.video_url?.trim() || null,
          link: editing.link?.trim() || undefined,
          published_at: editing.published_at,
          is_pinned: editing.is_pinned || undefined,
          feature_homepage: editing.feature_homepage || undefined,
        })
      } else {
        const noticeType: Notice['type'] =
          editing.boardCategory === 'events'    ? 'event'  :
          editing.boardCategory === 'community' ? 'hiring' : 'notice'
        const tags: string[] | null =
          editing.boardCategory === 'community' ? [editing.communitySubtype] : null
        await saveNotice({
          ...(editing.id ? { id: editing.id } : {}),
          title_ko: editing.title_ko, title_en: editing.title_en, title_fr: editing.title_fr,
          body_ko: editing.body_ko,   body_en: editing.body_en,   body_fr: editing.body_fr,
          type: noticeType,
          date: editing.date,
          image_url: isPublicMediaUrl(editing.thumbnail_url) ? editing.thumbnail_url : null,
          is_pinned: editing.is_pinned || undefined,
          tags,
          location_name:       editing.location_name?.trim()       || null,
          map_url:             editing.map_url?.trim()             || null,
          instagram_url:       editing.instagram_url?.trim()       || null,
          external_url:        editing.external_url?.trim()        || null,
          related_program_id:  editing.related_program_id          || null,
          related_program_label: editing.related_program_label?.trim() || null,
        })
      }
      await load(); setEditing(null)
    } catch (e: unknown) { setErr((e as Error).message) }
    finally { setSaving(false) }
  }

  async function remove(id: string, table: 'contents' | 'notices') {
    if (!confirm('Delete this post? This cannot be undone.')) return
    setDeleting(id); setErr('')
    try {
      if (table === 'contents') {
        await deleteContent(id)
        setNewsRows(r => r.filter(x => x.id !== id))
      } else {
        await deleteNotice(id)
        setBoardRows(r => r.filter(x => x.id !== id))
      }
    } catch (e: unknown) { setErr((e as Error).message ?? 'Failed to delete.') }
    finally { setDeleting(null) }
  }

  // ── combined list sorted newest-first ────────────────────────────────────────
  type ListRow = { key: string; dest: string; title: string; date: string; onEdit: () => void; onDelete: () => void; deleteKey: string }
  const listRows: ListRow[] = [
    ...newsRows.map(c => ({
      key: `news-${c.id}`,
      dest: `News / ${resolveContentCategory(c).toUpperCase()}`,
      title: c.title_en || c.title_ko,
      date: c.published_at,
      onEdit: () => setEditing(contentToDraft(c)),
      onDelete: () => remove(c.id, 'contents'),
      deleteKey: c.id,
    })),
    ...boardRows.map(n => {
      const cat = n.type === 'event' ? 'Events' : n.type === 'hiring' ? 'Community' : 'Notice'
      const sub = n.type === 'hiring' && n.tags?.[0] ? ` · ${n.tags[0]}` : ''
      return {
        key: `board-${n.id}`,
        dest: `Board / ${cat}${sub}`,
        title: n.title_en || n.title_ko,
        date: n.date,
        onEdit: () => setEditing(noticeToDraft(n)),
        onDelete: () => remove(n.id, 'notices'),
        deleteKey: n.id,
      }
    }),
  ].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))

  if (loading) return <Spinner />

  const d = editing

  return (
    <div className="space-y-4">
      {err && <ErrorMsg msg={err} />}

      <div className="flex gap-3 justify-end">
        <button onClick={() => setEditing(blankUnified('news'))}  className="btn-yellow">+ News post</button>
        <button onClick={() => setEditing(blankUnified('board'))} className="btn-outline">+ Board post</button>
      </div>

      {/* ── Editor form ── */}
      {d && (
        <FormCard title={d.id ? 'Edit post' : 'New post'}>
          <div className="space-y-5">

            {/* 1 ── Publish To */}
            <div>
              <p className="label mb-2">Publish to</p>
              <div className="flex gap-2">
                {(['news', 'board'] as PublishTo[]).map(pt => (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => set('publishTo', pt)}
                    className={[
                      'flex-1 py-2 text-sm font-semibold rounded-lg border transition-colors',
                      d.publishTo === pt
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
                    ].join(' ')}
                  >
                    {pt === 'news' ? '📰 News' : '📋 Board'}
                  </button>
                ))}
              </div>
            </div>

            {/* 2 ── Category (conditional) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {d.publishTo === 'news' ? (
                <FL label="Category">
                  <select className="input" value={d.newsCategory}
                    onChange={e => set('newsCategory', e.target.value as ContentCategory)}>
                    {(['archive','montreal','language','culture'] as ContentCategory[]).map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </FL>
              ) : (
                <>
                  <FL label="Board category">
                    <select className="input" value={d.boardCategory}
                      onChange={e => set('boardCategory', e.target.value as BoardCat)}>
                      <option value="notice">Notice</option>
                      <option value="events">Events</option>
                      <option value="community">Community</option>
                    </select>
                  </FL>
                  {d.boardCategory === 'community' && (
                    <FL label="Community type">
                      <select className="input" value={d.communitySubtype}
                        onChange={e => set('communitySubtype', e.target.value as CommSubtype)}>
                        <option value="housing">Housing</option>
                        <option value="jobs">Jobs</option>
                        <option value="roommates">Roommates</option>
                        <option value="language-exchange">Language Exchange</option>
                        <option value="general">General</option>
                      </select>
                    </FL>
                  )}
                </>
              )}

              {/* Date / Published */}
              {d.publishTo === 'news' ? (
                <FL label="Published date">
                  <input type="date" className="input" value={d.published_at}
                    onChange={e => set('published_at', e.target.value)} />
                </FL>
              ) : (
                <FL label="Date">
                  <input type="date" className="input" value={d.date}
                    onChange={e => set('date', e.target.value)} />
                </FL>
              )}

              {d.publishTo === 'news' && (
                <FL label="Content type">
                  <select className="input" value={d.contentType}
                    onChange={e => set('contentType', e.target.value as ContentType)}>
                    {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FL>
              )}
            </div>

            {/* 3 ── Title */}
            <div>
              <p className="label mb-1">Title</p>
              <LangFields prefix="title"
                ko={d.title_ko} en={d.title_en} fr={d.title_fr} onChange={set} />
            </div>

            {/* 4 ── Body (rich editor) */}
            <div>
              <p className="label mb-1">Body</p>
              <p className="text-xs text-gray-400 mb-2">
                Rich text — saved as HTML. Supports headings, lists, links, images, YouTube embeds.
              </p>
              <ContentBodyRichEditors
                ko={d.body_ko} en={d.body_en} fr={d.body_fr}
                onChange={set} editorRefs={editorRefs}
              />
            </div>

            {/* 5 ── Thumbnail / cover image */}
            <FL label={d.publishTo === 'news' ? 'Thumbnail' : 'Cover image'}>
              {isPublicMediaUrl(d.thumbnail_url) ? (
                <div className="flex items-start gap-3">
                  <div className="w-32 aspect-[16/10] overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shrink-0">
                    <img src={d.thumbnail_url!} alt="Thumbnail preview"
                      className="h-full w-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                  <button type="button" onClick={() => set('thumbnail_url', '')}
                    className="text-xs text-red-500 hover:text-red-700 mt-1">Remove</button>
                </div>
              ) : (
                <>
                  <ContentMediaDropzone disabled={uploading === 'thumb'}
                    onFiles={files => void onThumbFiles(files)} />
                  <input type="url" className="input mt-2"
                    placeholder="Or paste image URL (https://…)"
                    value={d.thumbnail_url ?? ''}
                    onChange={e => set('thumbnail_url', e.target.value)} />
                </>
              )}
              {uploading === 'thumb' && <p className="text-xs text-gray-400 mt-1">Uploading…</p>}
            </FL>

            {/* 6 ── Body images (all publish modes) */}
            <FL label="Body images (optional)">
              <p className="text-xs text-gray-400 mb-2">
                Upload images, then insert them at the cursor position in any body editor.
                {d.publishTo === 'board' && ' Inserted images are saved inside the body HTML.'}
              </p>
              <ContentMediaDropzone multiple disabled={uploading === 'images'}
                onFiles={files => void onBodyImageFiles(files)} />
              {uploading === 'images' && <p className="text-xs text-gray-400 mt-1">Uploading…</p>}
              {(d.image_urls ?? []).length > 0 && (
                <div className="mt-3 space-y-3">
                  {(d.image_urls ?? []).map(url => (
                    <div key={url} className="flex flex-col sm:flex-row gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="sm:w-32 shrink-0 aspect-[4/3] overflow-hidden rounded-md border border-gray-200 bg-white">
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <code className="block truncate text-[10px] text-gray-500 select-all">{url}</code>
                        <div className="flex flex-wrap gap-1.5">
                          <button type="button"
                            onClick={async () => {
                              try { await navigator.clipboard.writeText(url); setCopyOk(url); window.setTimeout(() => setCopyOk(p => p === url ? null : p), 2000) }
                              catch { setErr('Could not copy to clipboard.') }
                            }}
                            className="btn-ghost py-1 px-2 text-xs">
                            {copyOk === url ? '✓ Copied' : 'Copy URL'}
                          </button>
                          <button type="button" onClick={() => void copyHtml(url)}
                            className="btn-ghost py-1 px-2 text-xs">
                            Copy HTML
                          </button>
                          {(['ko','en','fr'] as BodyLang[]).map(l => (
                            <button key={l} type="button"
                              onClick={() => insertBodyImage(l, url)}
                              className="btn-ghost py-1 px-2 text-xs">
                              Insert {l.toUpperCase()}
                            </button>
                          ))}
                          <button type="button" onClick={() => removeBodyImage(url)}
                            className="text-xs text-red-500 hover:text-red-700 px-2 py-1">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </FL>

            {/* 7 ── Video URL (News only) */}
            {d.publishTo === 'news' && (
              <FL label="Video URL (YouTube / Vimeo)">
                <input type="url" className="input"
                  placeholder="https://www.youtube.com/watch?v=…"
                  value={d.video_url ?? ''} onChange={e => set('video_url', e.target.value)} />
              </FL>
            )}

            {/* 8 ── Link (News only) */}
            {d.publishTo === 'news' && (
              <FL label="Link (optional)">
                <input className="input" value={d.link ?? ''}
                  onChange={e => set('link', e.target.value)} />
              </FL>
            )}

            {/* 9 ── Board-only: location / links / related program */}
            {d.publishTo === 'board' && (
              <details className="border border-gray-100 rounded-lg">
                <summary className="px-4 py-2.5 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-50 rounded-lg">
                  Location &amp; links (optional)
                </summary>
                <div className="px-4 pb-4 pt-2 grid grid-cols-1 gap-3">
                  <FL label="Location name">
                    <input type="text" className="input" placeholder="e.g. HAKKYO Space"
                      value={d.location_name ?? ''} onChange={e => set('location_name', e.target.value)} />
                  </FL>
                  <FL label="Map URL">
                    <input type="url" className="input" placeholder="https://maps.google.com/…"
                      value={d.map_url ?? ''} onChange={e => set('map_url', e.target.value)} />
                  </FL>
                  <FL label="Instagram URL">
                    <input type="url" className="input" placeholder="https://instagram.com/…"
                      value={d.instagram_url ?? ''} onChange={e => set('instagram_url', e.target.value)} />
                  </FL>
                  <FL label="External link">
                    <input type="url" className="input" placeholder="https://…"
                      value={d.external_url ?? ''} onChange={e => set('external_url', e.target.value)} />
                  </FL>
                  <FL label="Related program">
                    <select className="input" value={d.related_program_id ?? ''}
                      onChange={e => {
                        const id = e.target.value || null
                        set('related_program_id', id)
                        set('related_program_label', tracks.find(t => t.id === id)?.name_en ?? null)
                      }}>
                      <option value="">— none —</option>
                      {tracks.map(t => (
                        <option key={t.id} value={t.id}>{t.name_en || t.name_ko}</option>
                      ))}
                    </select>
                  </FL>
                </div>
              </details>
            )}

            {/* 10 ── Pinned */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={d.is_pinned}
                onChange={e => set('is_pinned', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-gray-900" />
              <span className="text-sm text-gray-700">Pin to top of homepage feed</span>
            </label>

            {/* 11 ── Community Moments (News only) */}
            {d.publishTo === 'news' && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={d.feature_homepage}
                  onChange={e => set('feature_homepage', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 accent-gray-900" />
                <span className="text-sm text-gray-700">Feature on Homepage Community Moments</span>
              </label>
            )}

            <SaveRow onSave={save} onCancel={() => setEditing(null)} saving={saving} />
          </div>
        </FormCard>
      )}

      {/* ── Combined list ── */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <Th>Title</Th>
              <Th>Destination</Th>
              <Th>Date</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {listRows.map(row => (
              <tr key={row.key}>
                <Td><span className="font-medium">{row.title || '—'}</span></Td>
                <Td>
                  <span className={[
                    'text-xs font-semibold uppercase tracking-wide',
                    row.dest.startsWith('News') ? 'text-blue-500' : 'text-amber-600',
                  ].join(' ')}>
                    {row.dest}
                  </span>
                </Td>
                <Td>{row.date}</Td>
                <Td>
                  <div className="flex gap-2">
                    <button onClick={row.onEdit} className="btn-ghost py-1 px-2">Edit</button>
                    <button onClick={row.onDelete} disabled={deleting === row.deleteKey}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 disabled:opacity-40">
                      {deleting === row.deleteKey ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
            {listRows.length === 0 && (
              <tr><Td><span className="text-gray-400">No posts yet.</span></Td><Td>{null}</Td><Td>{null}</Td><Td>{null}</Td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Questions Admin ────────────────────────────────────────────────────────────
function QuestionsAdmin() {
  const [items,     setItems]     = useState<FormQuestion[]>([])
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [draft,     setDraft]     = useState<Partial<FormQuestion>>({})
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [err,       setErr]       = useState('')

  const load = useCallback(() =>
    getAllQuestions().then(setItems).catch(e => setErr(e.message)).finally(() => setLoading(false))
  , [])
  useEffect(() => { load() }, [load])

  const blankDraft = (): Partial<FormQuestion> => ({
    question_ko:'', question_en:'', question_fr:'',
    type:'text', options:'', required:false,
    order_index:(items.length||0) + 1, session_id:null,
    question_tags: [],
  })

  const openEdit = (q: FormQuestion) => { setDraft({ ...q }); setEditingId(q.id) }
  const cancelEdit = () => { setEditingId(null); setDraft({}) }
  const setD = (k: string, v: unknown) => setDraft(d => ({ ...d, [k]: v }))

  async function save() {
    setSaving(true); setErr('')
    try { await saveQuestion(draft); await load(); cancelEdit() }
    catch (e: unknown) { setErr((e as Error).message) }
    finally { setSaving(false) }
  }
  async function remove(id: string) {
    if (!confirm('Delete this question?')) return
    try { await deleteQuestion(id); setItems(r => r.filter(x => x.id !== id)) }
    catch (e: unknown) { setErr((e as Error).message) }
  }
  async function move(q: FormQuestion, dir: -1 | 1) {
    const sorted = [...items].sort((a, b) => a.order_index - b.order_index)
    const idx = sorted.findIndex(x => x.id === q.id)
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const a = sorted[idx], b = sorted[swapIdx]
    // Optimistic update
    setItems(prev => prev.map(x => {
      if (x.id === a.id) return { ...x, order_index: b.order_index }
      if (x.id === b.id) return { ...x, order_index: a.order_index }
      return x
    }))
    try { await swapQuestionOrder(a, b) }
    catch (e: unknown) { setErr((e as Error).message); await load() }
  }

  const typeIcon: Record<FormQuestion['type'], string> = { text:'T', textarea:'¶', select:'▾' }
  const sorted = [...items].sort((a, b) => a.order_index - b.order_index)

  if (loading) return <Spinner />
  return (
    <div className="space-y-3">
      {err && <ErrorMsg msg={err} />}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500">
          Questions appear on every registration form.
          Leave <strong>Class scope</strong> blank to show for all classes.
        </p>
        <button onClick={() => { setDraft(blankDraft()); setEditingId('new') }} className="btn-yellow shrink-0">
          + Add Question
        </button>
      </div>

      {editingId === 'new' && (
        <div className="border-2 border-gray-900 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">New Question</p>
          </div>
          <QuestionForm draft={draft} setD={setD} onSave={save} onCancel={cancelEdit} saving={saving} isNew />
        </div>
      )}

      {sorted.map((q, i) => {
        const isEditing = editingId === q.id
        return (
          <div key={q.id} className={`border rounded-xl overflow-hidden transition-colors ${isEditing ? 'border-gray-400' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3 px-4 py-3 bg-white">
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => move(q, -1)} disabled={i === 0}
                    className="w-5 h-4 flex items-center justify-center text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">▲</button>
                  <button onClick={() => move(q, 1)} disabled={i === sorted.length - 1}
                    className="w-5 h-4 flex items-center justify-center text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">▼</button>
                </div>
                <span className="w-6 h-6 rounded bg-gray-100 text-gray-500 font-bold text-xs flex items-center justify-center">
                  {typeIcon[q.type]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{q.question_en||q.question_ko}</p>
                {q.question_ko && <p className="text-xs text-gray-400 truncate mt-0.5">{q.question_ko}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                <span className="text-xs font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{q.type}</span>
                {q.required && <span className="text-xs font-semibold bg-red-50 text-red-500 px-1.5 py-0.5 rounded">Required</span>}
                {q.session_id && <span className="text-xs font-semibold bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded">Legacy scope</span>}
                {Array.isArray(q.question_tags) && q.question_tags.length > 0
                  ? (q.question_tags as string[]).map(tag => (
                      <span key={tag} className="text-[10px] font-semibold bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))
                  : <span className="text-[10px] text-gray-300 px-1 py-0.5">all programs</span>}
              </div>
              <div className="flex gap-1 shrink-0 ml-1">
                {isEditing
                  ? <button onClick={cancelEdit} className="btn-ghost py-1 px-2 text-xs">✕</button>
                  : <button onClick={() => openEdit(q)} className="btn-ghost py-1 px-2 text-xs">Edit</button>}
                <button onClick={() => remove(q.id)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">Delete</button>
              </div>
            </div>
            {isEditing && (
              <div className="border-t border-gray-100 bg-gray-50">
                <QuestionForm draft={draft} setD={setD} onSave={save} onCancel={cancelEdit} saving={saving} />
              </div>
            )}
            {!isEditing && q.type === 'select' && q.options && (
              <div className="border-t border-gray-100 px-4 py-2 bg-gray-50 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">Options:</span>
                {q.options.split(',').map(o => o.trim()).filter(Boolean).map(o => (
                  <span key={o} className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 text-gray-600">{o}</span>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {sorted.length === 0 && editingId !== 'new' && (
        <div className="py-10 text-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
          No questions yet. Click <strong>Add Question</strong> to create the first one.
        </div>
      )}
    </div>
  )
}

function QuestionForm({ draft, setD, onSave, onCancel, saving, isNew = false }: {
  draft: Partial<FormQuestion>; setD: (k: string, v: unknown) => void
  onSave: () => void; onCancel: () => void; saving: boolean; isNew?: boolean
}) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <p className="label mb-2">Question text</p>
        <div className="space-y-2">
          {([['KO','question_ko'],['EN','question_en'],['FR','question_fr']] as [string,string][]).map(([lbl,key]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 w-6 shrink-0">{lbl}</span>
              <input type="text" className="input-sm flex-1"
                value={(draft as Record<string,string>)[key]||''}
                onChange={e => setD(key, e.target.value)}
                placeholder={lbl==='KO'?'한국어로 질문 입력':lbl==='EN'?'English question':'Question en français'}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <FL label="Type">
          <select className="input-sm" value={draft.type||'text'} onChange={e => setD('type', e.target.value)}>
            <option value="text">Short text</option>
            <option value="textarea">Long text</option>
            <option value="select">Dropdown</option>
          </select>
        </FL>
        <FL label="Options (if dropdown)">
          <input className="input-sm" value={draft.options||''} onChange={e => setD('options', e.target.value)}
            placeholder="A, B, C" disabled={draft.type !== 'select'} />
        </FL>
        <FL label="Order">
          <input type="number" className="input-sm" min={1} value={draft.order_index||1}
            onChange={e => setD('order_index', +e.target.value)} />
        </FL>
        <FL label="Required">
          <label className="flex items-center gap-2 cursor-pointer h-[42px]">
            <input type="checkbox" checked={draft.required||false} onChange={e => setD('required', e.target.checked)}
              className="w-4 h-4 accent-black rounded" />
            <span className="text-sm text-gray-600">Yes</span>
          </label>
        </FL>
      </div>
      {/* Tag-based scoping — replaces the legacy UUID field */}
      <div>
        <p className="label mb-1">Question applies to</p>
        <p className="text-[11px] text-gray-400 mb-2">
          Leave all unchecked to show on every form. Check tags to show only when a matching program is selected.
        </p>
        <div className="flex flex-wrap gap-3">
          {([ ['korean','Korean'], ['english','English'], ['french','French'], ['active_output','Active Output'] ] as [string,string][]).map(([tag, label]) => {
            const tags: string[] = Array.isArray(draft.question_tags) ? draft.question_tags as string[] : []
            const checked = tags.includes(tag)
            return (
              <label key={tag} className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checked}
                  className="w-4 h-4 accent-black rounded"
                  onChange={() => {
                    const next = checked ? tags.filter(t => t !== tag) : [...tags, tag]
                    setD('question_tags', next)
                  }}
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            )
          })}
        </div>
      </div>
      {/* Legacy class scope UUID — kept for backward compat, hidden behind details */}
      <details className="text-xs text-gray-400">
        <summary className="cursor-pointer hover:text-gray-600">Legacy: Class scope UUID (advanced)</summary>
        <div className="mt-2">
          <input className="input-sm w-full" value={draft.session_id||''}
            onChange={e => setD('session_id', e.target.value||null)}
            placeholder="Paste class UUID to limit this question to one class" />
        </div>
      </details>
      <div className="flex items-center gap-2 pt-1">
        <button onClick={onSave} disabled={saving} className="btn-yellow">
          {saving ? 'Saving…' : isNew ? 'Add Question' : 'Save Changes'}
        </button>
        <button onClick={onCancel} className="btn-outline">Cancel</button>
      </div>
    </div>
  )
}

// ─── Applications Admin ─────────────────────────────────────────────────────────
// Raw row shape returned by application_answers select('*')
type AnswerRow = {
  id: string
  application_id: string
  question_id: string | null
  answer: string
  question_label_snapshot: string | null
  question_type_snapshot: string | null
  question_order_snapshot: number | null
  created_at: string
  // optional: enriched after label lookup
  question_label_current?: string | null
}

// ── Helpers imported from ApplyPage ──────────────────────────────────────────
import { detectProgLang, shortLevel, type ProgLang } from './ApplyPage'

const PROG_LANG_LABEL: Record<ProgLang, string> = {
  korean:  'Korean',
  french:  'French',
  english: 'English',
}

function getProgLangFromApp(app: ProgramApplication, tracksMap: Map<string, ProgramTrack>): ProgLang {
  const track = app.program_id ? tracksMap.get(app.program_id) : null
  if (track) return detectProgLang(track)
  // fallback: try to parse the "lang:name" format stored in program_name
  const prefix = app.program_name?.split(':')[0]?.toLowerCase()
  if (prefix === 'french')  return 'french'
  if (prefix === 'english') return 'english'
  return 'korean'
}

function ApplicationsAdmin() {
  const [apps,         setApps]         = useState<ProgramApplication[]>([])
  const [tracksMap,    setTracksMap]    = useState<Map<string, ProgramTrack>>(new Map())
  const [selected,     setSelected]     = useState<ProgramApplication | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [err,          setErr]          = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ProgramApplicationStatus>('all')
  const [searchQuery,  setSearchQuery]  = useState('')
  const [notes,        setNotes]        = useState('')
  const [notesSaving,  setNotesSaving]  = useState(false)

  const load = useCallback(() =>
    Promise.all([getProgramApplications(), getTracks('program')])
      .then(([fetched, tracks]) => {
        setApps(fetched)
        setTracksMap(new Map(tracks.map(t => [t.id, t])))
        setSelected(prev => {
          if (!prev) return prev
          return fetched.find(a => a.id === prev.id) ?? prev
        })
      })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
  , [])
  useEffect(() => { load() }, [load])

  // Sync notes field when selection changes
  useEffect(() => { setNotes(selected?.admin_notes ?? '') }, [selected?.id])

  async function updateStatus(id: string, status: ProgramApplicationStatus) {
    setApps(a => a.map(x => x.id === id ? { ...x, status } : x))
    if (selected?.id === id) setSelected(s => s ? { ...s, status } : s)
    try { await updateProgramApplicationStatus(id, status) }
    catch (e: unknown) { setErr((e as Error).message); await load() }
  }

  async function saveNotes() {
    if (!selected) return
    setNotesSaving(true)
    try {
      await updateProgramApplicationNotes(selected.id, notes)
      setApps(a => a.map(x => x.id === selected.id ? { ...x, admin_notes: notes } : x))
      setSelected(s => s ? { ...s, admin_notes: notes } : s)
    } catch (e: unknown) { setErr((e as Error).message) }
    finally { setNotesSaving(false) }
  }

  const statusColor = (s: ProgramApplicationStatus) =>
    s === 'enrolled'        ? 'bg-green-100 text-green-700'   :
    s === 'accepted'        ? 'bg-blue-100 text-blue-700'     :
    s === 'cancelled'       ? 'bg-red-50 text-red-500'        :
    s === 'payment_pending' ? 'bg-amber-100 text-amber-700'   :
    s === 'waitlist'        ? 'bg-orange-100 text-orange-600' :
    s === 'reviewing'       ? 'bg-purple-100 text-purple-700' :
    'bg-gray-100 text-gray-500'

  // shortLevel imported from ApplyPage handles all languages

  const visible = apps
    .filter(a => statusFilter === 'all' || a.status === statusFilter)
    .filter(a => {
      const q = searchQuery.trim().toLowerCase()
      if (!q) return true
      return [a.name, a.email, a.phone, a.program_name, a.korean_level, a.time_in_montreal, a.interest_in_korean]
        .some(f => (f ?? '').toLowerCase().includes(q))
    })

  if (loading) return <Spinner />

  const STATUSES: ProgramApplicationStatus[] = ['new','reviewing','accepted','waitlist','payment_pending','enrolled','cancelled']

  type ProfileRow = [string, string | null | undefined, 'normal' | 'highlight']

  function buildProfileSections(pl: ProgLang): { label: string; rows: (a: ProgramApplication) => ProfileRow[] }[] {
    const langLabel = PROG_LANG_LABEL[pl]
    return [
      {
        label: 'Basic Information',
        rows: a => [
          ['Email',        a.email,              'normal'],
          ['Phone',        a.phone,              'normal'],
          ['Contact via',  a.preferred_contact,  'normal'],
          ['Instagram',    a.instagram,          'normal'],
          ['Languages',    a.languages_spoken,   'normal'],
        ],
      },
      {
        label: 'Montréal Journey',
        rows: a => [
          ['Time in Montréal',     a.time_in_montreal, 'highlight'],
          ['Stage',                a.current_stage,    'normal'],
          ['Currently focused on', a.current_focus,    'highlight'],
        ],
      },
      {
        label: `${langLabel} Journey`,
        rows: a => [
          [`${langLabel} level`, a.korean_level ? shortLevel(a.korean_level) : null, 'highlight'],
          ['Experience',         a.previous_korean_exp,                               'normal'],
          [`Why ${langLabel}?`,  a.interest_in_korean,                                'normal'],
        ],
      },
      {
        label: 'Goals',
        rows: a => [
          [`First thing in ${langLabel}`, a.first_korean_goal,  'normal'],
          ['In 6 months',                 a.six_month_goal,     'highlight'],
          ['Why joining',                 a.reason_for_joining, 'highlight'],
        ],
      },
      {
        label: 'Learning Style',
        rows: a => [
          ['Biggest challenge', a.biggest_challenge,     'normal'],
          ['Environment',       a.preferred_environment, 'normal'],
        ],
      },
      {
        label: 'About HAKKYO',
        rows: a => [
          ['How found us',        a.how_found_hakkyo, 'normal'],
          ['What interested you', a.what_interested,  'normal'],
        ],
      },
      {
        label: 'One Last Question',
        rows: a => [
          ['A great class',    a.definition_great_class, 'normal'],
          ['Questions for us', a.questions_for_hakkyo,   'normal'],
        ],
      },
    ]
  }

  return (
    <div className="space-y-4">
      {err && <ErrorMsg msg={err} />}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">{visible.length} application{visible.length !== 1 ? 's' : ''}</p>
        <div className="flex flex-wrap items-center gap-1">
          {(['all', ...STATUSES] as const).map(f => (
            <button key={f} onClick={() => setStatusFilter(f as 'all' | ProgramApplicationStatus)}
              className={['px-2.5 py-1 rounded text-[11px] font-semibold transition-colors capitalize',
                statusFilter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
              ].join(' ')}>
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">

        {/* ── Application list ── */}
        <div className="space-y-2">
          <input
            type="search"
            className="input w-full"
            placeholder="Search name, email, Korean level…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden max-h-[680px] overflow-y-auto">
            {visible.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">No applications yet.</div>
            ) : (
              visible.map(a => (
                <div
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className={['px-4 py-3.5 cursor-pointer transition-colors border-l-2',
                    selected?.id === a.id
                      ? 'bg-gray-50 border-l-gray-900'
                      : 'hover:bg-gray-50 border-l-transparent',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 leading-tight">
                        {a.name}{a.preferred_name ? ` · ${a.preferred_name}` : ''}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">{a.email}</p>
                    </div>
                    <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${statusColor(a.status)}`}>
                      {a.status.replace('_',' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {a.korean_level && (
                      <span className="text-[11px] text-gray-500">
                        {shortLevel(a.korean_level)}
                      </span>
                    )}
                    {a.korean_level && a.time_in_montreal && (
                      <span className="text-gray-200 text-[11px]">·</span>
                    )}
                    {a.time_in_montreal && (
                      <span className="text-[11px] text-gray-400">{a.time_in_montreal}</span>
                    )}
                  </div>
                  {a.created_at && (
                    <p className="text-[10px] text-gray-300 mt-1">{a.created_at.split('T')[0]}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Detail panel ── */}
        {selected ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">

            {/* Profile header card */}
            <div className="px-5 py-5 border-b border-gray-100 bg-gray-50/70">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-[17px] font-medium text-gray-900 leading-tight">
                    {selected.name}
                    {selected.preferred_name && (
                      <span className="text-gray-400 font-normal ml-2 text-[14px]">
                        ({selected.preferred_name})
                      </span>
                    )}
                  </h3>
                  {selected.program_name && (
                    <p className="text-[11px] text-gray-400 mt-0.5 tracking-wide">{selected.program_name}</p>
                  )}
                </div>
                <select
                  value={selected.status}
                  onChange={e => updateStatus(selected.id, e.target.value as ProgramApplicationStatus)}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold bg-white text-gray-700 shrink-0"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              {/* Snapshot row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {selected.korean_level && (
                  <div className="bg-white rounded-lg px-3 py-2.5 border border-gray-100">
                    <p className="text-[9px] font-bold tracking-[0.14em] uppercase text-gray-300 mb-1">{PROG_LANG_LABEL[getProgLangFromApp(selected, tracksMap)]}</p>
                    <p className="text-[12px] font-medium text-gray-700 leading-tight">{shortLevel(selected.korean_level)}</p>
                  </div>
                )}
                {selected.time_in_montreal && (
                  <div className="bg-white rounded-lg px-3 py-2.5 border border-gray-100">
                    <p className="text-[9px] font-bold tracking-[0.14em] uppercase text-gray-300 mb-1">Montréal</p>
                    <p className="text-[12px] font-medium text-gray-700 leading-tight">{selected.time_in_montreal}</p>
                  </div>
                )}
                {selected.current_focus && (
                  <div className="bg-white rounded-lg px-3 py-2.5 border border-gray-100 sm:col-span-2">
                    <p className="text-[9px] font-bold tracking-[0.14em] uppercase text-gray-300 mb-1">Focus</p>
                    <p className="text-[12px] font-medium text-gray-700 leading-tight line-clamp-2">{selected.current_focus}</p>
                  </div>
                )}
              </div>

              {/* Highlight: reason + goal */}
              {(selected.reason_for_joining || selected.six_month_goal) && (
                <div className="mt-3 space-y-2">
                  {selected.reason_for_joining && (
                    <div className="bg-white rounded-lg px-3 py-2.5 border border-gray-100">
                      <p className="text-[9px] font-bold tracking-[0.14em] uppercase text-gray-300 mb-1">Why joining</p>
                      <p className="text-[12px] text-gray-700 leading-relaxed line-clamp-3">{selected.reason_for_joining}</p>
                    </div>
                  )}
                  {selected.six_month_goal && (
                    <div className="bg-white rounded-lg px-3 py-2.5 border border-gray-100">
                      <p className="text-[9px] font-bold tracking-[0.14em] uppercase text-gray-300 mb-1">Goal in 6 months</p>
                      <p className="text-[12px] text-gray-700 leading-relaxed line-clamp-3">{selected.six_month_goal}</p>
                    </div>
                  )}
                </div>
              )}

              <p className="text-[10px] text-gray-300 mt-3">
                Submitted {selected.created_at?.split('T')[0]}
              </p>
            </div>

            {/* Sectioned profile */}
            <div className="p-5 space-y-6 overflow-y-auto max-h-[540px]">
              {buildProfileSections(getProgLangFromApp(selected, tracksMap)).map(sec => {
                const rows = sec.rows(selected).filter(([, v]) => v?.toString().trim())
                if (rows.length === 0) return null
                return (
                  <div key={sec.label}>
                    <p className="text-[9px] font-bold tracking-[0.16em] uppercase text-gray-300 mb-3">{sec.label}</p>
                    <div className="space-y-3">
                      {rows.map(([k, v, weight]) => (
                        <div key={k} className="grid grid-cols-[130px_1fr] gap-3">
                          <span className="text-[11px] text-gray-400 pt-0.5 leading-snug shrink-0">{k}</span>
                          <span className={[
                            'leading-relaxed whitespace-pre-wrap',
                            weight === 'highlight' ? 'text-[13px] text-gray-800 font-medium' : 'text-[13px] text-gray-600',
                          ].join(' ')}>
                            {v}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Admin notes */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-[9px] font-bold tracking-[0.16em] uppercase text-gray-300 mb-2">Internal notes</p>
                <textarea
                  rows={4}
                  className="w-full border border-gray-100 rounded-lg px-3 py-2.5 text-[13px] text-gray-700 resize-none focus:outline-none focus:border-gray-300 transition-colors bg-gray-50/50 placeholder:text-gray-300"
                  placeholder="Met at language exchange · Interested in volunteering · Conversation-focused learner…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  onBlur={saveNotes}
                />
                {notesSaving && <p className="text-[10px] text-gray-300 mt-1">Saving…</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg flex items-center justify-center text-gray-300 text-sm h-48">
            Select an applicant to view their profile
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Site Settings Admin ───────────────────────────────────────────────────────
type SiteSettingsRow = {
  id?: string
  instagram?: string
  email?: string
  location?: string
  location_ko?: string
  location_en?: string
  location_fr?: string
  footer_text_ko?: string
  footer_text_en?: string
  footer_text_fr?: string
  programs_season_label?: string
  language_exchange_title?: string
  language_exchange_description_ko?: string
  language_exchange_description_en?: string
  language_exchange_description_fr?: string
  language_exchange_button_text?: string
}

function SiteSettingsAdmin() {
  const [form, setForm] = useState<SiteSettingsRow>({})
  const [rowId, setRowId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [saved, setSaved] = useState(false)

  const blank = (): SiteSettingsRow => ({
    instagram: '@hakkyo.mtl',
    email: 'hello@hakkyo.ca',
    location_ko: 'Montréal',
    location_en: 'Montréal',
    location_fr: 'Montréal',
    footer_text_ko: 'A Montréal community built around language and conversation.',
    footer_text_en: 'A Montréal community built around language and conversation.',
    footer_text_fr: 'A Montréal community built around language and conversation.',
    programs_season_label: '',
    language_exchange_title: '',
    language_exchange_description_ko: '',
    language_exchange_description_en: '',
    language_exchange_description_fr: '',
    language_exchange_button_text: '',
  })

  const load = useCallback(async () => {
    setErr('')
    setSaved(false)
    if (!isConfigured || !supabase) {
      setForm(blank())
      setRowId(null)
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1)
      .maybeSingle()
    if (error) {
      console.error(error)
      setErr(error.message)
      setForm(blank())
    } else if (data) {
      setForm(data as SiteSettingsRow)
      setRowId(data.id ?? null)
    } else {
      setForm(blank())
      setRowId(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function save() {
    if (!isConfigured || !supabase) {
      setErr('Supabase is not configured.')
      return
    }
    setSaving(true)
    setErr('')
    setSaved(false)
    const fields = {
      instagram: form.instagram ?? '',
      email: form.email ?? '',
      location: form.location_en ?? form.location ?? '',
      location_ko: form.location_ko ?? '',
      location_en: form.location_en ?? '',
      location_fr: form.location_fr ?? '',
      footer_text_ko: form.footer_text_ko ?? '',
      footer_text_en: form.footer_text_en ?? '',
      footer_text_fr: form.footer_text_fr ?? '',
      programs_season_label: form.programs_season_label ?? '',
      language_exchange_title: form.language_exchange_title ?? '',
      language_exchange_description_ko: form.language_exchange_description_ko ?? '',
      language_exchange_description_en: form.language_exchange_description_en ?? '',
      language_exchange_description_fr: form.language_exchange_description_fr ?? '',
      language_exchange_button_text: form.language_exchange_button_text ?? '',
    }
    try {
      if (rowId) {
        const { error } = await supabase.from('site_settings').update(fields).eq('id', rowId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('site_settings')
          .insert(fields)
          .select('id')
          .single()
        if (error) throw error
        setRowId(data.id)
      }
      setSaved(true)
    } catch (e: unknown) {
      console.error(e)
      setErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-4 max-w-3xl">
      {err && <ErrorMsg msg={err} />}
      {saved && (
        <p className="text-sm text-green-600">Settings saved.</p>
      )}
      <FormCard title="Site Settings">
        <div className="space-y-4">
          <FL label="Instagram">
            <input
              className="input"
              value={form.instagram ?? ''}
              onChange={e => set('instagram', e.target.value)}
              placeholder="@hakkyo.mtl"
            />
          </FL>
          <FL label="Email">
            <input
              type="email"
              className="input"
              value={form.email ?? ''}
              onChange={e => set('email', e.target.value)}
              placeholder="hello@hakkyo.ca"
            />
          </FL>
          <div>
            <p className="label mb-1">Location</p>
            <LangFields
              prefix="location"
              ko={form.location_ko ?? ''}
              en={form.location_en ?? ''}
              fr={form.location_fr ?? ''}
              onChange={set}
            />
          </div>
          <div>
            <p className="label mb-1">Footer text</p>
            <LangFields
              prefix="footer_text"
              ko={form.footer_text_ko ?? ''}
              en={form.footer_text_en ?? ''}
              fr={form.footer_text_fr ?? ''}
              onChange={set}
            />
          </div>
          <FL label="Programs season label">
            <input
              className="input"
              value={form.programs_season_label ?? ''}
              onChange={e => set('programs_season_label', e.target.value)}
              placeholder="e.g. Season 3 · 2025–2026"
            />
            <p className="text-xs text-gray-400 mt-1">Shown below the Programs page title. Leave empty to hide.</p>
          </FL>
          <div className="border-t border-gray-100 pt-4 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Language Exchange CTA</p>
            <FL label="Title">
              <input
                className="input"
                value={form.language_exchange_title ?? ''}
                onChange={e => set('language_exchange_title', e.target.value)}
                placeholder="Language Exchange"
              />
              <p className="text-xs text-gray-400 mt-1">Leave empty to use "Language Exchange".</p>
            </FL>
            <div>
              <p className="label mb-1">Description</p>
              <LangFields
                prefix="language_exchange_description"
                ko={form.language_exchange_description_ko ?? ''}
                en={form.language_exchange_description_en ?? ''}
                fr={form.language_exchange_description_fr ?? ''}
                onChange={set}
                multiline
                textareaRows={2}
              />
              <p className="text-xs text-gray-400 mt-1">Leave empty to use the default description.</p>
            </div>
            <FL label="Button text">
              <input
                className="input"
                value={form.language_exchange_button_text ?? ''}
                onChange={e => set('language_exchange_button_text', e.target.value)}
                placeholder="Apply for Language Exchange"
              />
              <p className="text-xs text-gray-400 mt-1">Leave empty to use "Apply for Language Exchange".</p>
            </FL>
          </div>
          <button onClick={save} disabled={saving} className="btn-yellow">
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </FormCard>
    </div>
  )
}

// ─── Language Exchange Settings Admin ─────────────────────────────────────────
function LeSettingsAdmin() {
  const [form, setForm] = useState<LeSettings>({})
  const [rowId, setRowId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    setErr('')
    setSaved(false)
    const data = await getLeSettings().catch(e => { setErr(e.message); return {} as LeSettings })
    setForm(data)
    setRowId(data.id ?? null)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    setSaving(true); setErr(''); setSaved(false)
    try {
      await saveLeSettings({ ...form, id: rowId ?? undefined })
      setSaved(true)
      await load()
    } catch (e: unknown) {
      setErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-4 max-w-2xl">
      {err && <ErrorMsg msg={err} />}
      {saved && <p className="text-sm text-green-600">Saved.</p>}
      <FormCard title="Language Exchange Settings">
        <div className="space-y-4">
          <FL label="Schedule">
            <input
              className="input"
              value={form.schedule ?? ''}
              onChange={e => set('schedule', e.target.value)}
              placeholder="e.g. Every Saturday · 14:00–16:00"
            />
            <p className="text-xs text-gray-400 mt-1">Shown on the Programs page CTA. Leave empty to hide.</p>
          </FL>
          <FL label="Location name">
            <input
              className="input"
              value={form.location_name ?? ''}
              onChange={e => set('location_name', e.target.value)}
              placeholder="e.g. HAKKYO Space"
            />
          </FL>
          <FL label="Location address">
            <input
              className="input"
              value={form.location_address ?? ''}
              onChange={e => set('location_address', e.target.value)}
              placeholder="e.g. Montréal, QC"
            />
          </FL>
          <FL label="Google Maps URL">
            <input
              type="url"
              className="input"
              value={form.google_maps_url ?? ''}
              onChange={e => set('google_maps_url', e.target.value)}
              placeholder="https://maps.google.com/..."
            />
          </FL>
          <FL label="Notes">
            <input
              className="input"
              value={form.notes ?? ''}
              onChange={e => set('notes', e.target.value)}
              placeholder="Any additional info shown below schedule"
            />
          </FL>
          <button onClick={save} disabled={saving} className="btn-yellow">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </FormCard>
    </div>
  )
}

// ─── Community Submissions Admin ──────────────────────────────────────────────

const COMMUNITY_CAT_LABEL: Record<string, string> = {
  housing:            'Housing',
  jobs:               'Jobs',
  events:             'Events',
  language_exchange:  'Language Exchange',
  looking_for_people: 'Looking for People',
  help_needed:        'Help Needed',
  other:              'Other',
}

type EditDraft = { title: string; description: string; type: string }

function CommunityAdmin() {
  const [submissions, setSubmissions] = useState<CommunitySubmission[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState<'all' | 'pending' | 'approved' | 'rejected' | 'published'>('all')
  const [saving,      setSaving]      = useState<string | null>(null)
  const [err,         setErr]         = useState('')
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [draft,       setDraft]       = useState<EditDraft>({ title: '', description: '', type: 'housing' })

  function load() {
    setLoading(true)
    setErr('')
    getAllCommunitySubmissions()
      .then(setSubmissions)
      .catch(e => setErr(e?.message ?? 'Failed to load submissions.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function startEdit(s: CommunitySubmission) {
    setEditingId(s.id)
    setDraft({ title: s.title, description: s.description, type: s.type })
  }

  async function saveEdit(id: string) {
    setSaving(id)
    setErr('')
    try {
      await updateCommunityPost(id, { title: draft.title, description: draft.description, type: draft.type })
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, ...draft } : s))
      setEditingId(null)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to save.')
    } finally {
      setSaving(null)
    }
  }

  async function setStatus(id: string, status: CommunitySubmission['status']) {
    setSaving(id)
    setErr('')
    try {
      await setCommunitySubmissionStatus(id, status)
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to update status.')
    } finally {
      setSaving(null)
    }
  }

  async function remove(id: string) {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) return
    setSaving(id)
    setErr('')
    try {
      await deleteCommunitySubmission(id)
      setSubmissions(prev => prev.filter(s => s.id !== id))
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to delete submission.')
    } finally {
      setSaving(null)
    }
  }

  const visible = submissions.filter(s => filter === 'all' || s.status === filter)

  if (loading) return <Spinner />

  return (
    <div>
      {/* Filter bar + refresh */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(['pending', 'approved', 'published', 'rejected', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize',
              filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
            ].join(' ')}
          >
            {f}
            {f !== 'all' && (
              <span className="ml-1.5 text-[10px] opacity-60">
                {submissions.filter(s => s.status === f).length}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={load}
          className="ml-auto text-[11px] text-gray-400 hover:text-gray-700 transition-colors px-2 py-1.5"
        >
          ↻ Refresh
        </button>
      </div>

      {err && (
        <p className="text-xs text-red-500 mb-4 px-1">{err}</p>
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-gray-400 py-12 text-center">No submissions in this category.</p>
      ) : (
        <div className="space-y-4">
          {visible.map(s => {
            const isEditing = editingId === s.id
            return (
              <div key={s.id} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className={[
                      'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded',
                      s.status === 'pending'   ? 'bg-gray-200 text-gray-700'  :
                      s.status === 'approved'  ? 'bg-blue-100 text-blue-700'  :
                      s.status === 'published' ? 'bg-gray-900 text-white'     :
                      'bg-gray-100 text-gray-400 line-through',
                    ].join(' ')}>
                      {s.status}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                      {COMMUNITY_CAT_LABEL[s.type] ?? s.type}
                    </span>
                    <span className="text-[10px] text-gray-300">
                      {s.created_at?.slice(0, 10) ?? ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Edit toggle */}
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveEdit(s.id)}
                          disabled={saving === s.id}
                          className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors disabled:opacity-40"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors px-2 py-1.5"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEdit(s)}
                        className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors px-2 py-1.5"
                      >
                        Edit
                      </button>
                    )}
                    {/* Status actions */}
                    {!isEditing && s.status === 'pending' && (
                      <button
                        onClick={() => setStatus(s.id, 'approved')}
                        disabled={saving === s.id}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-40"
                      >
                        Approve
                      </button>
                    )}
                    {!isEditing && s.status === 'approved' && (
                      <button
                        onClick={() => setStatus(s.id, 'published')}
                        disabled={saving === s.id}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors disabled:opacity-40"
                      >
                        Publish
                      </button>
                    )}
                    {!isEditing && s.status === 'published' && (
                      <button
                        onClick={() => setStatus(s.id, 'approved')}
                        disabled={saving === s.id}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:border-gray-500 transition-colors disabled:opacity-40"
                      >
                        Unpublish
                      </button>
                    )}
                    {!isEditing && (s.status === 'pending' || s.status === 'approved') && (
                      <button
                        onClick={() => setStatus(s.id, 'rejected')}
                        disabled={saving === s.id}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:border-gray-500 transition-colors disabled:opacity-40"
                      >
                        Reject
                      </button>
                    )}
                    <button
                      onClick={() => remove(s.id)}
                      disabled={saving === s.id}
                      className="text-[11px] text-gray-300 hover:text-red-500 transition-colors px-2 py-1.5 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Body — view or edit */}
                <div className="px-4 py-4 space-y-3">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="label">Title</label>
                        <input className="input" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} maxLength={120} />
                      </div>
                      <div>
                        <label className="label">Body</label>
                        <textarea className="input resize-y" rows={5} value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} maxLength={2000} />
                      </div>
                      <div>
                        <label className="label">Category</label>
                        <select className="input" value={draft.type} onChange={e => setDraft(d => ({ ...d, type: e.target.value }))}>
                          {Object.entries(COMMUNITY_CAT_LABEL).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold text-gray-900 text-sm">{s.title}</h3>
                      <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">{s.description}</p>
                      {s.location && <p className="text-[11px] text-gray-400">📍 {s.location}</p>}
                      {s.link && (
                        <a href={s.link} target="_blank" rel="noopener noreferrer"
                           className="text-[11px] text-blue-500 hover:underline break-all block">
                          {s.link}
                        </a>
                      )}
                      {s.image_url && (
                        <div className="rounded-lg overflow-hidden bg-gray-50 border border-gray-100" style={{ maxHeight: 300 }}>
                          <img src={s.image_url} alt="" className="w-full object-cover" style={{ maxHeight: 300 }}
                               onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        </div>
                      )}
                      <div className="flex items-center gap-3 pt-0.5">
                        {s.author_name && <p className="text-[11px] text-gray-500 font-medium">{s.author_name}</p>}
                        {s.contact     && <p className="text-[11px] text-gray-400">Contact: {s.contact}</p>}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Notifications Admin ──────────────────────────────────────────────────────

function NotificationsAdmin() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  function load() {
    setLoading(true)
    getAdminNotifications()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function markRead(id: string) {
    await markNotificationRead(id).catch(() => {})
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAll() {
    setMarking(true)
    await markAllNotificationsRead().catch(() => {})
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setMarking(false)
  }

  const unread = notifications.filter(n => !n.is_read).length

  if (loading) return <Spinner />

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        {unread > 0 && (
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase bg-gray-900 text-white px-2 py-0.5 rounded-full">
            {unread} unread
          </span>
        )}
        <button onClick={load} className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors">↻ Refresh</button>
        {unread > 0 && (
          <button
            onClick={markAll}
            disabled={marking}
            className="ml-auto text-[11px] text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-40"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-sm text-gray-400 py-12 text-center">No notifications yet.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`border rounded-xl px-4 py-3.5 flex items-start gap-3 transition-colors ${
                n.is_read ? 'border-gray-100 bg-white' : 'border-gray-300 bg-white'
              }`}
            >
              {/* Unread dot */}
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-gray-900'}`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-400">
                    {n.type}
                  </span>
                  <span className="text-[10px] text-gray-300">
                    {n.created_at ? new Date(n.created_at).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 leading-snug">{n.title}</p>
                <p className="text-[12px] text-gray-500 mt-0.5">{n.message}</p>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => markRead(n.id)}
                  className="text-[10px] text-gray-400 hover:text-gray-700 transition-colors shrink-0 mt-0.5"
                >
                  ✓ Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Analytics admin ─────────────────────────────────────────────────────────

function AnalyticsAdmin() {
  const [loading, setLoading] = useState(true)
  const [todayCount, setTodayCount]   = useState(0)
  const [weekCount, setWeekCount]     = useState(0)
  const [applyCount, setApplyCount]   = useState(0)
  const [postCount, setPostCount]     = useState(0)
  const [hoodCount, setHoodCount]     = useState(0)
  const [topButtons, setTopButtons]   = useState<{ label: string; count: number }[]>([])
  const [topPages, setTopPages]       = useState<{ page: string; count: number }[]>([])
  const [recent, setRecent]           = useState<Array<{ created_at: string; event_name: string; page_path: string; target_label: string; user_id: string | null }>>([])
  const [error, setError]             = useState('')

  useEffect(() => {
    if (!supabase || !isConfigured) { setLoading(false); return }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekStart  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    async function load() {
      try {
        const [todayRes, weekRes, applyRes, postRes, hoodRes, recentRes] = await Promise.all([
          supabase!.from('event_logs').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
          supabase!.from('event_logs').select('id', { count: 'exact', head: true }).gte('created_at', weekStart),
          supabase!.from('event_logs').select('id', { count: 'exact', head: true }).eq('event_name', 'program_apply_clicked'),
          supabase!.from('event_logs').select('id', { count: 'exact', head: true }).eq('event_name', 'post_submit_success'),
          supabase!.from('event_logs').select('id', { count: 'exact', head: true }).eq('event_name', 'neighbourhood_comment_submitted'),
          supabase!.from('event_logs').select('created_at, event_name, page_path, target_label, user_id').order('created_at', { ascending: false }).limit(50),
        ])

        setTodayCount(todayRes.count ?? 0)
        setWeekCount(weekRes.count ?? 0)
        setApplyCount(applyRes.count ?? 0)
        setPostCount(postRes.count ?? 0)
        setHoodCount(hoodRes.count ?? 0)
        setRecent(recentRes.data ?? [])

        // Top buttons from recent data — aggregate target_label frequency
        const labelMap: Record<string, number> = {}
        const pageMap: Record<string, number> = {}
        for (const row of (recentRes.data ?? [])) {
          if (row.target_label) labelMap[row.target_label] = (labelMap[row.target_label] ?? 0) + 1
          if (row.page_path)    pageMap[row.page_path]     = (pageMap[row.page_path]     ?? 0) + 1
        }
        setTopButtons(Object.entries(labelMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, count]) => ({ label, count })))
        setTopPages(Object.entries(pageMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([page, count]) => ({ page, count })))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) return <Spinner />
  if (!isConfigured) return <ErrorMsg msg="Supabase is not configured — analytics unavailable in demo mode." />
  if (error) return <ErrorMsg msg={error} />

  const statCards = [
    { label: 'Today Events',           value: todayCount },
    { label: 'This Week Events',        value: weekCount  },
    { label: 'Program Apply Clicks',    value: applyCount },
    { label: 'Post Submissions',        value: postCount  },
    { label: 'Neighbourhood Comments',  value: hoodCount  },
  ]

  function fmtTime(iso: string) {
    try { return new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso)) }
    catch { return iso }
  }

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map(c => (
          <div key={c.label} className="border border-gray-100 rounded-2xl px-4 py-4 bg-white">
            <p className="text-[11px] font-semibold text-gray-400 mb-1">{c.label}</p>
            <p className="text-2xl font-bold text-gray-900">{c.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Top buttons + pages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Clicked Labels</h3>
          <div className="space-y-1">
            {topButtons.length === 0 ? <p className="text-xs text-gray-400">No data yet.</p> : topButtons.map(b => (
              <div key={b.label} className="flex items-center justify-between text-[12px] py-1 border-b border-gray-50">
                <span className="text-gray-700 truncate max-w-[180px]">{b.label}</span>
                <span className="font-semibold text-gray-900 shrink-0">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Pages</h3>
          <div className="space-y-1">
            {topPages.length === 0 ? <p className="text-xs text-gray-400">No data yet.</p> : topPages.map(p => (
              <div key={p.page} className="flex items-center justify-between text-[12px] py-1 border-b border-gray-50">
                <span className="text-gray-700 truncate max-w-[180px]">{p.page}</span>
                <span className="font-semibold text-gray-900 shrink-0">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent events table */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Events</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-400">
                <Th>Time</Th>
                <Th>Event</Th>
                <Th>Page</Th>
                <Th>Label</Th>
                <Th>User ID</Th>
              </tr>
            </thead>
            <tbody>
              {recent.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-2 pr-3 whitespace-nowrap text-gray-400">{fmtTime(row.created_at)}</td>
                  <td className="py-2 pr-3 font-medium text-gray-800">{row.event_name}</td>
                  <td className="py-2 pr-3 text-gray-500">{row.page_path}</td>
                  <td className="py-2 pr-3 text-gray-600">{row.target_label ?? '—'}</td>
                  <td className="py-2 text-gray-400 font-mono">{row.user_id ? row.user_id.slice(0, 8) + '…' : '—'}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-300">No events yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Root Admin page ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'notifications', label: 'Notifications',   Component: NotificationsAdmin },
  { id: 'sessions',      label: 'Programs',         Component: SessionsAdmin      },
  { id: 'content',       label: 'Content',           Component: UnifiedContentAdmin },
  { id: 'community',     label: 'Community',         Component: CommunityAdmin     },
  { id: 'questions',     label: 'Questions',         Component: QuestionsAdmin     },
  { id: 'applications',  label: 'Applications',      Component: ApplicationsAdmin  },
  { id: 'le',            label: 'Lang. Exchange',    Component: LeSettingsAdmin    },
  { id: 'settings',      label: 'Site Settings',     Component: SiteSettingsAdmin  },
  { id: 'analytics',     label: 'Analytics',         Component: AnalyticsAdmin     },
]

export default function Admin() {
  const [tab, setTab] = useState('notifications')
  const [unreadCount, setUnreadCount] = useState(0)
  const active = TABS.find(t => t.id === tab)!
  const navigate = useNavigate()

  // Fetch unread count for the badge on initial mount
  useEffect(() => {
    getAdminNotifications()
      .then(ns => setUnreadCount(ns.filter(n => !n.is_read).length))
      .catch(() => {})
  }, [])

  async function handleLogout() {
    if (supabase) await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold">Admin</h1>
        {!isConfigured && (
          <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded">
            Demo mode — changes are local only
          </span>
        )}
        <div className="ml-auto">
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors border border-gray-200 rounded px-2.5 py-1"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'notifications') setUnreadCount(0) }}
            className={['inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
              tab === t.id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700',
            ].join(' ')}>
            {t.label}
            {t.id === 'notifications' && unreadCount > 0 && (
              <span className="bg-gray-900 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <active.Component />
    </div>
  )
}
