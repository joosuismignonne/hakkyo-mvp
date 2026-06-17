/**
 * HAKKYO Radar — curated local discovery page for Montréal newcomers.
 * MVP: manual submission + Supabase backend. Crawler-ready schema.
 */
import { useState, useEffect, useCallback } from 'react'
import { X, Plus, Pencil, Trash2, ExternalLink, Bookmark, BookmarkCheck, Radio } from 'lucide-react'
import { useLang } from '../context/LangContext'
import { supabase } from '../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RadarItem {
  id: string
  category: string
  title: string
  source_url: string | null
  source_platform: string | null
  location: string | null
  summary: string | null
  language_required: string | null
  status: string
  detected_date: string
  notes: string | null
  // crawler-ready fields
  source_id: string | null
  external_id: string | null
  raw_text: string | null
  ai_summary: string | null
  is_verified: boolean
  created_at: string
}

type FormData = {
  category: string
  title: string
  source_url: string
  source_platform: string
  location: string
  summary: string
  language_required: string
  status: string
  detected_date: string
  notes: string
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'jobs',      ko: '일자리',   en: 'Jobs',      fr: 'Emplois',    icon: '💼' },
  { id: 'housing',   ko: '주거',     en: 'Housing',   fr: 'Logement',   icon: '🏠' },
  { id: 'events',    ko: '이벤트',   en: 'Events',    fr: 'Événements', icon: '📅' },
  { id: 'language',  ko: '언어교환', en: 'Language',  fr: 'Langue',     icon: '💬' },
  { id: 'volunteer', ko: '자원봉사', en: 'Volunteer', fr: 'Bénévolat',  icon: '🤝' },
]

const STATUS_CONFIG: Record<string, { ko: string; en: string; fr: string; bg: string; text: string }> = {
  new:      { ko: '신규',   en: 'New',      fr: 'Nouveau',  bg: '#ECFDF5', text: '#065F46' },
  active:   { ko: '활성',   en: 'Active',   fr: 'Actif',    bg: '#EFF6FF', text: '#1D4ED8' },
  expired:  { ko: '만료됨', en: 'Expired',  fr: 'Expiré',   bg: '#F3F4F6', text: '#6B7280' },
  verified: { ko: '검증됨', en: 'Verified', fr: 'Vérifié',  bg: '#FDF6D8', text: '#92400E' },
}

const PLATFORMS = ['Facebook', 'Kijiji', 'Indeed', 'Craigslist', 'Meetup', 'Eventbrite', 'LinkedIn', 'Workopolis', 'LesPAC', 'Other']

const BLANK: FormData = {
  category: 'jobs', title: '', source_url: '', source_platform: '',
  location: '', summary: '', language_required: '', status: 'new',
  detected_date: new Date().toISOString().split('T')[0], notes: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function db() {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase
}

function catInfo(id: string, lang: string) {
  const c = CATEGORIES.find(c => c.id === id)
  if (!c) return { label: id, icon: '📌' }
  return { label: lang === 'ko' ? c.ko : lang === 'fr' ? c.fr : c.en, icon: c.icon }
}

function relativeDate(dateStr: string, lang: string): string {
  const d = new Date(dateStr)
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diff === 0) return lang === 'ko' ? '오늘' : lang === 'fr' ? "Aujourd'hui" : 'Today'
  if (diff === 1) return lang === 'ko' ? '어제' : lang === 'fr' ? 'Hier' : 'Yesterday'
  if (diff < 7)  return lang === 'ko' ? `${diff}일 전` : lang === 'fr' ? `Il y a ${diff} jours` : `${diff}d ago`
  return d.toLocaleDateString(lang === 'ko' ? 'ko-KR' : lang === 'fr' ? 'fr-CA' : 'en-CA', { month: 'short', day: 'numeric' })
}

const SAVED_KEY = 'hakkyo_radar_saved'
function loadSaved(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]')) } catch { return new Set() }
}
function toggleSaved(id: string, saved: Set<string>): Set<string> {
  const next = new Set(saved)
  next.has(id) ? next.delete(id) : next.add(id)
  try { localStorage.setItem(SAVED_KEY, JSON.stringify([...next])) } catch {}
  return next
}

// ─── Input / select styles ────────────────────────────────────────────────────

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors bg-white'
const selectCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] text-gray-900 focus:outline-none focus:border-gray-400 transition-colors bg-white'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  )
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

function ItemForm({
  initial, onSave, onClose, saving,
}: {
  initial: FormData & { id?: string }
  onSave: (data: FormData) => Promise<void>
  onClose: () => void
  saving: boolean
}) {
  const { t } = useLang()
  const [form, setForm] = useState<FormData>({ ...BLANK, ...initial })
  const [error, setError] = useState('')

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm(p => ({ ...p, [k]: v }))
  }

  async function submit() {
    if (!form.title.trim()) { setError(t('제목을 입력해주세요.', 'Please enter a title.', 'Veuillez entrer un titre.')); return }
    setError('')
    await onSave(form)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col"
        style={{ animation: 'modal-up 0.18s ease-out', maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <h2 className="text-[15px] font-bold text-gray-900">
            {initial.id ? t('수정하기', 'Edit', 'Modifier') : t('유용한 정보 공유하기', 'Share Something Helpful', 'Partager')}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-50">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('카테고리', 'Category', 'Catégorie')}>
              <select className={selectCls} value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.en}</option>
                ))}
              </select>
            </Field>
            <Field label={t('상태', 'Status', 'Statut')}>
              <select className={selectCls} value={form.status} onChange={e => set('status', e.target.value)}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.en}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t('제목 *', 'Title *', 'Titre *')}>
            <input
              className={inputCls} autoFocus value={form.title}
              placeholder={t('예: Barista 채용 — Café Myriade', 'e.g. Barista hiring — Café Myriade', 'ex: Recrutement barista — Café Myriade')}
              onChange={e => set('title', e.target.value)}
            />
          </Field>

          <Field label={t('요약', 'Summary', 'Résumé')}>
            <textarea
              className={inputCls + ' resize-none'} rows={3} value={form.summary}
              placeholder={t('간단한 설명 (선택 사항)', 'Brief description (optional)', 'Courte description (optionnel)')}
              onChange={e => set('summary', e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('플랫폼', 'Platform', 'Plateforme')}>
              <select className={selectCls} value={form.source_platform} onChange={e => set('source_platform', e.target.value)}>
                <option value="">{t('선택 (선택 사항)', 'Select (optional)', 'Sélectionner')}</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label={t('발견 날짜', 'Detected Date', 'Date de détection')}>
              <input type="date" className={inputCls} value={form.detected_date} onChange={e => set('detected_date', e.target.value)} />
            </Field>
          </div>

          <Field label={t('원본 링크', 'Source URL', 'Lien source')}>
            <input className={inputCls} value={form.source_url} placeholder="https://" onChange={e => set('source_url', e.target.value)} />
          </Field>

          <Field label={t('위치', 'Location', 'Lieu')}>
            <input className={inputCls} value={form.location} placeholder={t('예: Plateau-Mont-Royal', 'e.g. Plateau-Mont-Royal', 'ex: Plateau-Mont-Royal')} onChange={e => set('location', e.target.value)} />
          </Field>

          <Field label={t('요구 언어', 'Language Required', 'Langue requise')}>
            <input className={inputCls} value={form.language_required} placeholder={t('예: 불어 필수, 영어 우대', 'e.g. French required, English an asset', 'ex: Français requis, anglais un atout')} onChange={e => set('language_required', e.target.value)} />
          </Field>

          <Field label={t('메모 (내부용)', 'Notes (internal)', 'Notes (interne)')}>
            <input className={inputCls} value={form.notes} placeholder={t('선택 사항', 'Optional', 'Optionnel')} onChange={e => set('notes', e.target.value)} />
          </Field>

          {error && <p className="text-[12px] text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-2 shrink-0">
          <button
            onClick={submit}
            disabled={saving}
            className="btn-yellow w-full rounded-xl py-3 text-[14px] font-bold disabled:opacity-60"
          >
            {saving
              ? t('저장 중...', 'Saving...', 'Enregistrement...')
              : initial.id ? t('저장', 'Save', 'Enregistrer') : t('추가', 'Add', 'Ajouter')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Radar Card ───────────────────────────────────────────────────────────────

function RadarCard({
  item, lang, saved, onToggleSave, onEdit, onDelete,
}: {
  item: RadarItem
  lang: string
  saved: boolean
  onToggleSave: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { icon, label } = catInfo(item.category, lang)
  const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.new
  const statusLabel = lang === 'ko' ? statusCfg.ko : lang === 'fr' ? statusCfg.fr : statusCfg.en

  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-4 hover:border-gray-200 transition-colors group">
      {/* Row 1: category chip + status + date */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
          {icon} {label}
        </span>
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: statusCfg.bg, color: statusCfg.text }}
        >
          {statusLabel}
        </span>
        {item.is_verified && (
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">✓ verified</span>
        )}
        <span className="ml-auto text-[11px] text-gray-400 shrink-0">
          {relativeDate(item.detected_date, lang)}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-[15px] font-semibold text-gray-900 leading-snug mb-1.5">
        {item.title}
      </h3>

      {/* Summary */}
      {item.summary && (
        <p className="text-[13px] text-gray-600 leading-relaxed mb-2 line-clamp-3">{item.summary}</p>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-gray-400 mb-3">
        {item.location && <span>📍 {item.location}</span>}
        {item.source_platform && <span>🔗 {item.source_platform}</span>}
        {item.language_required && <span>💬 {item.language_required}</span>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {item.source_url ? (
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            <ExternalLink size={12} />
            {lang === 'ko' ? '원본 보기' : lang === 'fr' ? 'Voir l\'original' : 'View original'}
          </a>
        ) : (
          <span className="text-[11px] text-gray-300 italic">
            {lang === 'ko' ? '링크 없음' : lang === 'fr' ? 'Pas de lien' : 'No link'}
          </span>
        )}

        <button
          onClick={onToggleSave}
          className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
          style={saved ? { color: 'var(--y-h)', background: 'var(--y-l)' } : { color: '#9CA3AF' }}
          title={saved ? 'Unsave' : 'Save'}
        >
          {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
        </button>

        <button
          onClick={onEdit}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={onDelete}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TAB_ALL = 'all'

export default function Radar() {
  const { lang, t } = useLang()

  const [items, setItems]     = useState<RadarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(TAB_ALL)
  const [saved, setSaved]     = useState<Set<string>>(loadSaved)

  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<RadarItem | null>(null)
  const [deleteId, setDeleteId]   = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await db()
        .from('radar_items')
        .select('*')
        .order('detected_date', { ascending: false })
        .order('created_at', { ascending: false })
      if (err) throw err
      setItems(data ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async function addItem(form: FormData) {
    setSaving(true)
    try {
      const payload = {
        category:          form.category,
        title:             form.title.trim(),
        source_url:        form.source_url.trim() || null,
        source_platform:   form.source_platform || null,
        location:          form.location.trim() || null,
        summary:           form.summary.trim() || null,
        language_required: form.language_required.trim() || null,
        status:            form.status,
        detected_date:     form.detected_date,
        notes:             form.notes.trim() || null,
      }
      const { error: err } = await db().from('radar_items').insert(payload)
      if (err) throw err
      setShowForm(false)
      await fetchItems()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function updateItem(form: FormData) {
    if (!editing) return
    setSaving(true)
    try {
      const payload = {
        category:          form.category,
        title:             form.title.trim(),
        source_url:        form.source_url.trim() || null,
        source_platform:   form.source_platform || null,
        location:          form.location.trim() || null,
        summary:           form.summary.trim() || null,
        language_required: form.language_required.trim() || null,
        status:            form.status,
        detected_date:     form.detected_date,
        notes:             form.notes.trim() || null,
      }
      const { error: err } = await db().from('radar_items').update(payload).eq('id', editing.id)
      if (err) throw err
      setEditing(null)
      await fetchItems()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(id: string) {
    try {
      const { error: err } = await db().from('radar_items').delete().eq('id', id)
      if (err) throw err
      setDeleteId(null)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error')
    }
  }

  // ── Filter ──────────────────────────────────────────────────────────────────

  const filtered = activeTab === TAB_ALL ? items : items.filter(i => i.category === activeTab)

  const countFor = (id: string) => items.filter(i => i.category === id).length

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-24">
      <div className="max-w-[760px] mx-auto px-4 py-8 md:py-12">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <div className="mb-1">
              <h1 className="t-section text-gray-900">HAKKYO Radar</h1>
            </div>
            <p className="text-[13px] text-gray-500">
              {t(
                '커뮤니티가 발견한 몬트리올 생활 정보',
                'Useful leads shared by the community',
                'Bons plans partagés par la communauté',
              )}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-yellow flex items-center gap-1.5 text-[13px] rounded-xl px-4 py-2.5 shrink-0"
          >
            <Plus size={15} />
            {t('공유하기', 'Share a Lead', 'Partager')}
          </button>
        </div>

        {/* ── Narrative Anchor ── */}
        <p className="text-[13px] text-gray-400 leading-relaxed mb-6 italic">
          {t(
            '새 도시에서 사람을 찾는 건 집을 찾는 것보다 오래 걸려요.',
            'In a new city, finding people often takes longer than finding a place to live.',
            'Dans une nouvelle ville, trouver des gens prend souvent plus de temps que trouver un logement.',
          )}
        </p>

        {/* ── Category tabs ───────────────────────────────────────────────── */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5 hide-scrollbar">
          {/* All tab */}
          <button
            onClick={() => setActiveTab(TAB_ALL)}
            className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-full border whitespace-nowrap transition-all shrink-0"
            style={activeTab === TAB_ALL
              ? { background: '#111', borderColor: '#111', color: '#fff' }
              : { background: '#fff', borderColor: '#E5E7EB', color: '#374151' }
            }
          >
            {t('전체', 'All', 'Tout')}
            {items.length > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === TAB_ALL ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {items.length}
              </span>
            )}
          </button>

          {CATEGORIES.map(c => {
            const active = activeTab === c.id
            const count  = countFor(c.id)
            const label  = lang === 'ko' ? c.ko : lang === 'fr' ? c.fr : c.en
            return (
              <button
                key={c.id}
                onClick={() => setActiveTab(c.id)}
                className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-full border whitespace-nowrap transition-all shrink-0"
                style={active
                  ? { background: '#111', borderColor: '#111', color: '#fff' }
                  : { background: '#fff', borderColor: '#E5E7EB', color: '#374151' }
                }
              >
                <span>{c.icon}</span>
                {label}
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-white border border-gray-100 rounded-2xl px-4 py-4 animate-pulse">
                <div className="h-3 bg-gray-100 rounded w-24 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-[13px] text-red-600">
            <p className="font-semibold mb-1">{t('오류가 발생했어요.', 'Something went wrong.', 'Une erreur s\'est produite.')}</p>
            <p className="text-red-400">{error}</p>
            <button onClick={fetchItems} className="mt-3 text-[12px] underline text-red-500">
              {t('다시 시도', 'Retry', 'Réessayer')}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📡</div>
            <p className="text-[15px] font-semibold text-gray-700 mb-1">
              {items.length === 0
                ? t('아직 공유된 정보가 없어요.', 'Be the first to share something useful.', 'Soyez le premier à partager quelque chose d\'utile.')
                : t('이 카테고리에 항목이 없어요.', 'Nothing here yet in this category.', 'Rien dans cette catégorie pour l\'instant.')}
            </p>
            <p className="text-[13px] text-gray-400 mb-6">
              {t(
                '일자리, 집, 이벤트 등 몬트리올 생활에 도움이 되는 정보를 나눠주세요.',
                'Share a job lead, housing tip, local event, or anything helpful for newcomers.',
                'Partagez une piste d\'emploi, un conseil logement, ou tout ce qui peut aider.',
              )}
            </p>
            <button onClick={() => setShowForm(true)} className="btn-yellow rounded-xl px-5 py-2.5 text-[13px] font-bold">
              {t('유용한 정보 공유하기', 'Share Something Helpful', 'Partager quelque chose d\'utile')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <RadarCard
                key={item.id}
                item={item}
                lang={lang}
                saved={saved.has(item.id)}
                onToggleSave={() => setSaved(prev => toggleSaved(item.id, prev))}
                onEdit={() => setEditing(item)}
                onDelete={() => setDeleteId(item.id)}
              />
            ))}
          </div>
        )}

        {/* Stats footer */}
        {items.length > 0 && (
          <p className="text-center text-[11px] text-gray-400 mt-8">
            {t(
              `총 ${items.length}개의 항목`,
              `${items.length} item${items.length !== 1 ? 's' : ''} total`,
              `${items.length} élément${items.length !== 1 ? 's' : ''} au total`,
            )}
          </p>
        )}
      </div>

      {/* ── Add form ── */}
      {showForm && (
        <ItemForm
          initial={{ ...BLANK }}
          onSave={addItem}
          onClose={() => setShowForm(false)}
          saving={saving}
        />
      )}

      {/* ── Edit form ── */}
      {editing && (
        <ItemForm
          initial={{
            id: editing.id,
            category: editing.category,
            title: editing.title,
            source_url: editing.source_url ?? '',
            source_platform: editing.source_platform ?? '',
            location: editing.location ?? '',
            summary: editing.summary ?? '',
            language_required: editing.language_required ?? '',
            status: editing.status,
            detected_date: editing.detected_date,
            notes: editing.notes ?? '',
          }}
          onSave={updateItem}
          onClose={() => setEditing(null)}
          saving={saving}
        />
      )}

      {/* ── Delete confirm ── */}
      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setDeleteId(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 w-full" onClick={e => e.stopPropagation()}>
            <p className="text-[15px] font-semibold text-gray-900 mb-1">
              {t('삭제하시겠어요?', 'Delete this item?', 'Supprimer cet élément?')}
            </p>
            <p className="text-[13px] text-gray-500 mb-5">
              {t('이 작업은 되돌릴 수 없습니다.', 'This cannot be undone.', 'Cette action est irréversible.')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('취소', 'Cancel', 'Annuler')}
              </button>
              <button
                onClick={() => deleteItem(deleteId)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[14px] font-bold hover:bg-red-600 transition-colors"
              >
                {t('삭제', 'Delete', 'Supprimer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
