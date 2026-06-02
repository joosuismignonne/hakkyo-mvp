import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import {
  getTracks,     saveTrack,     deleteTrack,     setTrackStatus,
  getNotices,    saveNotice,    deleteNotice,
  getContents,   saveContent,   deleteContent,
  getAllQuestions, saveQuestion, deleteQuestion, swapQuestionOrder,
  getApplications, setApplicationStatus,
} from '../lib/db'
import type { ProgramTrack, Notice, Content, FormQuestion, Application, ContentCategory, ContentType } from '../types'
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
  return <div className="py-8 text-center"><div className="w-5 h-5 border-2 border-yellow border-t-transparent rounded-full animate-spin mx-auto" /></div>
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
    if (!confirm('Delete this program?')) return
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
              <FL label="Day (legacy)">
                <input className="input" value={editing.day_of_week ?? ''} onChange={e => set('day_of_week', e.target.value)} />
              </FL>
              <FL label="Time (legacy)">
                <input className="input" value={editing.time ?? ''} onChange={e => set('time', e.target.value)} />
              </FL>
              <FL label="Location (legacy)">
                <input className="input" value={editing.location ?? ''} onChange={e => set('location', e.target.value)} />
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
              <Th>Classes</Th>
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
                  {Array.isArray(s.included_sessions)
                    ? s.included_sessions.join(', ')
                    : ''}
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
  const [rows,    setRows]    = useState<Notice[]>([])
  const [editing, setEditing] = useState<Partial<Notice> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState('')

  const load = useCallback(() =>
    getNotices().then(setRows).catch(e => setErr(e.message)).finally(() => setLoading(false))
  , [])
  useEffect(() => { load() }, [load])

  const blank = (): Partial<Notice> => ({
    title_ko:'', title_en:'', title_fr:'',
    body_ko:'', body_en:'', body_fr:'',
    type:'notice', date: new Date().toISOString().split('T')[0],
  })
  const set = (k: string, v: unknown) => setEditing(e => e ? { ...e, [k]: v } : e)

  async function save() {
    if (!editing) return
    setSaving(true); setErr('')
    try { await saveNotice(editing); await load(); setEditing(null) }
    catch (e: unknown) { setErr((e as Error).message) }
    finally { setSaving(false) }
  }
  async function remove(id: string) {
    if (!confirm('Delete?')) return
    try { await deleteNotice(id); setRows(r => r.filter(x => x.id !== id)) }
    catch (e: unknown) { setErr((e as Error).message) }
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
                  {['notice','schedule','event'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FL>
              <FL label="Date"><input type="date" className="input" value={editing.date||''} onChange={e => set('date', e.target.value)} /></FL>
            </div>
            <SaveRow onSave={save} onCancel={() => setEditing(null)} saving={saving} />
          </div>
        </FormCard>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr><Th>Title</Th><Th>Type</Th><Th>Date</Th><Th>Actions</Th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(n => (
              <tr key={n.id}>
                <Td><span className="font-medium">{n.title_en||n.title_ko}</span></Td>
                <Td><span className="text-xs uppercase tracking-wide font-semibold text-gray-400">{n.type}</span></Td>
                <Td>{n.date}</Td>
                <Td><div className="flex gap-2">
                  <button onClick={() => setEditing(n)} className="btn-ghost py-1 px-2">Edit</button>
                  <button onClick={() => remove(n.id)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1">Delete</button>
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
  const [editing, setEditing] = useState<Partial<Content> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [uploading, setUploading] = useState<'thumb' | 'images' | null>(null)
  const [err,     setErr]     = useState('')
  const [copyOk,  setCopyOk]  = useState<string | null>(null)
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
    category: 'news',
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
        category: (editing.category as ContentCategory) || 'news',
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
    if (!confirm('Delete?')) return
    try { await deleteContent(id); setRows(r => r.filter(x => x.id !== id)) }
    catch (e: unknown) { setErr((e as Error).message) }
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
                  value={editing.category || 'news'}
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
                  <button onClick={() => remove(c.id)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1">Delete</button>
                </div></Td>
              </tr>
            ))}
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
        <div className="border-2 border-yellow rounded-xl overflow-hidden">
          <div className="bg-yellow/10 px-4 py-2.5 border-b border-yellow/20">
            <p className="text-xs font-bold text-yellow-hover uppercase tracking-wide">New Question</p>
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
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{q.type}</span>
                {q.required && <span className="text-xs font-semibold bg-red-50 text-red-500 px-1.5 py-0.5 rounded">Required</span>}
                {q.session_id && <span className="text-xs font-semibold bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded">Class</span>}
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
              className="w-4 h-4 accent-yellow rounded" />
            <span className="text-sm text-gray-600">Yes</span>
          </label>
        </FL>
      </div>
      <FL label="Class scope (blank = all classes)">
        <input className="input-sm" value={draft.session_id||''}
          onChange={e => setD('session_id', e.target.value||null)}
          placeholder="Paste class UUID to limit this question to one class" />
      </FL>
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
function ApplicationsAdmin() {
  const [apps,           setApps]           = useState<Application[]>([])
  const [selected,       setSelected]       = useState<Application | null>(null)
  const [detailAnswers,  setDetailAnswers]  = useState<Application['answers']>([])
  const [answersLoading, setAnswersLoading] = useState(false)
  const [loading,        setLoading]        = useState(true)
  const [err,            setErr]            = useState('')
  const [statusFilter,   setStatusFilter]   = useState<'all' | Application['status']>('all')
  const [searchQuery,  setSearchQuery]    = useState('')

  const load = useCallback(() =>
    getApplications().then(setApps).catch(e => setErr(e.message)).finally(() => setLoading(false))
  , [])
  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!selected?.id) {
      setDetailAnswers([])
      return
    }
    if (!isConfigured || !supabase) {
      setDetailAnswers([])
      return
    }

    let cancelled = false
    setAnswersLoading(true)

    ;(async () => {
      const { data: rows, error } = await supabase
        .from('application_answers')
        .select('id, application_id, question_id, answer')
        .eq('application_id', selected.id)

      if (cancelled) return
      if (error) {
        console.error(error)
        setDetailAnswers([])
        setAnswersLoading(false)
        return
      }

      const answers = rows ?? []
      const questionIds = [...new Set(answers.map((r) => r.question_id).filter(Boolean))]
      const questionsById: Record<string, FormQuestion> = {}

      if (questionIds.length > 0) {
        const { data: questions, error: qErr } = await supabase
          .from('form_questions')
          .select('id, question_ko, question_en, question_fr')
          .in('id', questionIds)

        if (qErr) {
          console.error(qErr)
        } else {
          for (const q of questions ?? []) {
            questionsById[q.id] = q as FormQuestion
          }
        }
      }

      setDetailAnswers(
        answers.map((a) => ({
          ...a,
          question: questionsById[a.question_id],
        })),
      )
      setAnswersLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [selected?.id])

  async function updateStatus(id: string, status: Application['status']) {
    // Optimistic update
    setApps(a => a.map(x => x.id === id ? { ...x, status } : x))
    if (selected?.id === id) setSelected(s => s ? { ...s, status } : s)
    try { await setApplicationStatus(id, status) }
    catch (e: unknown) { setErr((e as Error).message); await load() }
  }

  function matchesSearch(app: Application, query: string): boolean {
    const q = query.trim().toLowerCase()
    if (!q) return true
    const fields = [
      app.name,
      app.email,
      app.phone,
      app.instagram,
      app.selected_label,
    ]
    return fields.some((f) => (f ?? '').toLowerCase().includes(q))
  }

  const visible = apps
    .filter((a) => statusFilter === 'all' || a.status === statusFilter)
    .filter((a) => matchesSearch(a, searchQuery))

  const statusBadgeClass = (status: Application['status']) =>
    status === 'confirmed' ? 'bg-green-100 text-green-700' :
    status === 'rejected'  ? 'bg-red-100 text-red-600'   :
    'bg-yellow-light text-yellow-hover'

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      {err && <ErrorMsg msg={err} />}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {visible.length} application{visible.length !== 1 ? 's' : ''}
          {!isConfigured && (
            <span className="ml-2 text-xs text-gray-400">
              (demo — connect Supabase to see real submissions)
            </span>
          )}
        </p>
        <div className="flex items-center border border-gray-200 rounded overflow-hidden text-xs font-semibold">
        {(['all','pending','contacted','confirmed','waitlist','rejected'] as const).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={['px-2.5 py-1.5 transition-colors capitalize',
                statusFilter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50',
              ].join(' ')}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* List */}
        <div className="space-y-2">
          <input
            type="search"
            className="input w-full"
            placeholder="Search name, email, phone, instagram, program…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
          {visible.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              {isConfigured ? 'No applications yet.' : 'No applications in demo mode.'}
            </div>
          ) : (
            visible.map(a => {
              const legacyClass = a.session as unknown as Record<string, string> | undefined
              const programLabel = a.selected_label || legacyClass?.title_en || legacyClass?.title_ko
              return (
                <div
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className={['px-4 py-3 cursor-pointer transition-colors',
                    selected?.id === a.id ? 'bg-yellow-light' : 'hover:bg-gray-50',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{a.name}</span>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${statusBadgeClass(a.status)}`}>
                      {a.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{a.email}</p>
                  {programLabel && (
                    <p className="text-xs text-gray-500 mt-0.5">{programLabel}</p>
                  )}
                  {a.created_at && (
                    <p className="text-xs text-gray-300 mt-0.5">{a.created_at.split('T')[0]}</p>
                  )}
                </div>
              )
            })
          )}
          </div>
        </div>

        {/* Detail panel */}
        {selected ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-sm">{selected.name}</span>
              <select
  value={selected.status}
  onChange={(e) => updateStatus(selected.id, e.target.value as Application['status'])}
  className="border border-gray-200 rounded px-2 py-1 text-xs font-semibold bg-white"
>
<option value="pending">Pending</option>
<option value="contacted">Contacted</option>
<option value="confirmed">Confirmed</option>
<option value="waitlist">Waitlist</option>
<option value="rejected">Rejected</option>
</select>
            </div>
            <div className="p-4 space-y-3 text-sm overflow-y-auto max-h-[520px]">
              {([
                ['Email', selected.email],
                ['Phone', selected.phone],
                ['Instagram', selected.instagram],
                ['Selected', selected.selected_label],
                [
                  'Total price',
                  selected.total_price != null ? `$${selected.total_price}` : '',
                ],
                [
                  'Class',
                  (selected.session as unknown as Record<string, string>)?.title_en || '',
                ],
                ['Applied', selected.created_at?.split('T')[0] || ''],
                ['Status', selected.status],
              ] as [string, string][])
                .filter(([, v]) => v != null && String(v).trim() !== '')
                .map(([k, v]) => (
                  <div key={k} className="flex gap-3">
                    <span className="text-gray-400 w-24 shrink-0 text-xs pt-0.5">{k}</span>
                    <span className="text-gray-900 text-sm">{v}</span>
                  </div>
                ))}

              <div className="pt-3 border-t border-gray-100 space-y-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Answers</p>
                {answersLoading && (
                  <p className="text-xs text-gray-400">Loading answers…</p>
                )}
                {!answersLoading && detailAnswers && detailAnswers.length > 0 && (
                  detailAnswers.map((a) => {
                    const q = a.question
                    const questionText =
                      q?.question_en || q?.question_ko || q?.question_fr || a.question_id
                    return (
                      <div key={a.id}>
                        <p className="text-xs text-gray-400 mb-0.5">{questionText}</p>
                        <p className="text-gray-900 text-sm whitespace-pre-wrap">{a.answer}</p>
                      </div>
                    )
                  })
                )}
                {!answersLoading && (!detailAnswers || detailAnswers.length === 0) && (
                  <p className="text-xs text-gray-400">No answers submitted.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg flex items-center justify-center text-gray-300 text-sm h-48">
            Select an application to view details
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
    footer_text_ko: '다국어 문화 플랫폼',
    footer_text_en: 'Multilingual Cultural Platform',
    footer_text_fr: 'Plateforme culturelle multilingue',
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
          <button onClick={save} disabled={saving} className="btn-yellow">
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </FormCard>
    </div>
  )
}

// ─── Root Admin page ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'sessions',     label: 'Programs',     Component: SessionsAdmin    },
  { id: 'notices',      label: 'Notices',       Component: NoticesAdmin     },
  { id: 'content',      label: 'Content',       Component: ContentAdmin     },
  { id: 'questions',    label: 'Questions',     Component: QuestionsAdmin   },
  { id: 'applications', label: 'Applications',  Component: ApplicationsAdmin},
  { id: 'settings',     label: 'Site Settings', Component: SiteSettingsAdmin },
]

export default function Admin() {
  const [tab, setTab] = useState('sessions')
  const active = TABS.find(t => t.id === tab)!

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold">Admin</h1>
        {!isConfigured && (
          <span className="text-xs bg-yellow-light text-yellow-hover font-semibold px-2 py-0.5 rounded">
            Demo mode — changes are local only
          </span>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={['px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
              tab === t.id ? 'border-yellow text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700',
            ].join(' ')}>
            {t.label}
          </button>
        ))}
      </div>

      <active.Component />
    </div>
  )
}
// ─── Editable Detailed Program/Track Info for Admin ────────────────────────────

function EditableProgramFields({
  state,
  setState,
}: {
  state: any
  setState: (fn: (prev: any) => any) => void
}) {
  // Helper to update a given field in state
  const update = (k: string, v: any) => {
    setState((s: any) => ({ ...s, [k]: v }))
  }

  // Effect: auto-calculate total_price, but allow manual override
  useEffect(() => {
    // Only auto-update if the admin hasn't manually overridden total_price
    // If total_price === calculated value or empty, then recalc
    const calc = Number(state.price_per_class || 0) * Number(state.class_count || 0)
    if (
      state._total_price_manual !== true &&
      (Number(state.total_price) !== calc || !state.total_price)
    ) {
      update('total_price', calc)
    }
    // eslint-disable-next-line
  }, [state.price_per_class, state.class_count])

  // Mark manual override if admin types a value
  const onTotalPriceChange = (v: string) => {
    setState((s: any) => ({
      ...s,
      total_price: v,
      _total_price_manual: true,
    }))
  }

  // category: program/community selectable, default from language type
  const langTypes = [
    { key: "korean", label: "Korean" },
    { key: "english", label: "English" },
    { key: "french", label: "French" },
    { key: "exchange", label: "Language Exchange" },
    { key: "active_output", label: "Active Output" }
  ]

  // setting category automatically based on language/type
  const onLangTypeChange = (v: string) => {
    update('lang_type', v)
    if (v === "exchange") update('category', 'community')
    else update('category', 'program')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Category selector */}
      <FL label="Category">
        <select
          className="input"
          value={state.category ?? ""}
          onChange={e => update('category', e.target.value)}
        >
          <option value="">Select category</option>
          <option value="program">Program</option>
          <option value="community">Community</option>
        </select>
      </FL>

      {/* Language/type */}
      <FL label="Type/Language">
        <select
          className="input"
          value={state.lang_type ?? ""}
          onChange={e => onLangTypeChange(e.target.value)}
        >
          <option value="">Select type/language</option>
          {langTypes.map(lang => (
            <option value={lang.key} key={lang.key}>{lang.label}</option>
          ))}
        </select>
      </FL>

      <FL label="Price per class">
        <input
          className="input"
          type="number"
          min="0"
          step="1"
          value={state.price_per_class ?? ""}
          onChange={e => {
            update('price_per_class', e.target.value)
            // removing manual override if class_count or price changes
            setState(s => ({ ...s, _total_price_manual: false }))
          }}
        />
      </FL>
      <FL label="Number of classes">
        <input
          className="input"
          type="number"
          min="0"
          step="1"
          value={state.class_count ?? ""}
          onChange={e => {
            update('class_count', e.target.value)
            setState(s => ({ ...s, _total_price_manual: false }))
          }}
        />
      </FL>
      <FL label="Total price">
        <input
          className="input"
          type="number"
          min="0"
          step="1"
          value={state.total_price ?? ""}
          onChange={e => onTotalPriceChange(e.target.value)}
        />
        <p className="text-xs text-gray-400 pt-1">
          Calculated, but can be overridden manually.
        </p>
      </FL>
      <FL label="Start date">
        <input
          className="input"
          type="date"
          value={state.start_date ?? ""}
          onChange={e => update('start_date', e.target.value)}
        />
      </FL>
      <FL label="End date">
        <input
          className="input"
          type="date"
          value={state.end_date ?? ""}
          onChange={e => update('end_date', e.target.value)}
        />
      </FL>
      <FL label="Duration (weeks)">
        <input
          className="input"
          type="number"
          min="0"
          step="1"
          value={state.duration_weeks ?? ""}
          onChange={e => update('duration_weeks', e.target.value)}
        />
      </FL>
      <FL label="Day of week">
        <input
          className="input"
          type="text"
          placeholder="e.g. Monday, Thurs"
          value={state.day_of_week ?? ""}
          onChange={e => update('day_of_week', e.target.value)}
        />
      </FL>
      <FL label="Time">
        <input
          className="input"
          type="text"
          placeholder="e.g. 19:00–21:00"
          value={state.time ?? ""}
          onChange={e => update('time', e.target.value)}
        />
      </FL>
      <FL label="Location">
        <input
          className="input"
          type="text"
          value={state.location ?? ""}
          onChange={e => update('location', e.target.value)}
        />
      </FL>
      <FL label="Capacity">
        <input
          className="input"
          type="number"
          min="0"
          step="1"
          value={state.capacity ?? ""}
          onChange={e => update('capacity', e.target.value)}
        />
      </FL>
      <FL label="Recommended?">
        <select
          className="input"
          value={state.recommended ? 'yes' : 'no'}
          onChange={e => update('recommended', e.target.value === "yes")}
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </FL>
      <FL label="Is free?">
        <select
          className="input"
          value={state.is_free ? 'yes' : 'no'}
          onChange={e => update('is_free', e.target.value === "yes")}
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </FL>
      <FL label="Status">
        <select
          className="input"
          value={state.status ?? ""}
          onChange={e => update('status', e.target.value)}
        >
          <option value="">Select status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </FL>
      <FL label="Notes">
        <textarea
          className="input resize-none"
          rows={2}
          value={state.notes ?? ""}
          onChange={e => update('notes', e.target.value)}
        />
      </FL>
    </div>
  )
}

// You should use <EditableProgramFields state={state} setState={setState} />
// inside your admin session/content/program creation/edit forms,
// placing it inside the form UI to display these fields.