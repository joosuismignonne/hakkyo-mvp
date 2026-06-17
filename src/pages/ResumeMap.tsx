/**
 * ResumeMap — local-only resume drop tracker.
 * All data stored in localStorage. No Supabase.
 */
import { useState, useEffect } from 'react'
import { X, Plus, Pencil, Trash2, MapPin, ChevronDown } from 'lucide-react'
import { useLang } from '../context/LangContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResumeEntry {
  id: string
  place_name: string
  address: string
  category: string
  status: string
  dropped_date: string
  follow_up_date: string
  notes: string
  contact_name: string
  contact_info: string
  created_at: string
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { ko: string; en: string; fr: string; dot: string; bg: string; text: string }> = {
  planned:   { ko: '예정',   en: 'Planned',   fr: 'Prévu',     dot: '#9CA3AF', bg: '#F3F4F6', text: '#374151' },
  dropped:   { ko: '제출함', en: 'Dropped',   fr: 'Déposé',    dot: '#D97706', bg: '#FFFBEB', text: '#92400E' },
  follow_up: { ko: '팔로업', en: 'Follow Up', fr: 'Suivi',     dot: '#3B82F6', bg: '#EFF6FF', text: '#1D4ED8' },
  interview: { ko: '면접',   en: 'Interview', fr: 'Entretien', dot: '#8B5CF6', bg: '#F5F3FF', text: '#5B21B6' },
  hired:     { ko: '합격',   en: 'Hired',     fr: 'Embauché',  dot: '#10B981', bg: '#ECFDF5', text: '#065F46' },
  rejected:  { ko: '불합격', en: 'Rejected',  fr: 'Refusé',    dot: '#EF4444', bg: '#FEF2F2', text: '#991B1B' },
}

const STATUS_ORDER = ['planned', 'dropped', 'follow_up', 'interview', 'hired', 'rejected']

const CATEGORIES: { value: string; ko: string; en: string; fr: string }[] = [
  { value: 'cafe',         ko: '카페',    en: 'Café',        fr: 'Café'       },
  { value: 'restaurant',   ko: '식당',    en: 'Restaurant',  fr: 'Restaurant' },
  { value: 'flower_shop',  ko: '꽃집',    en: 'Flower Shop', fr: 'Fleuriste'  },
  { value: 'retail',       ko: '리테일',  en: 'Retail',      fr: 'Commerce'   },
  { value: 'other',        ko: '기타',    en: 'Other',       fr: 'Autre'      },
]

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'hakkyo_resume_drops'

function loadEntries(): ResumeEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') }
  catch { return [] }
}

function saveEntries(entries: ResumeEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch {}
}

// ─── Blank form ───────────────────────────────────────────────────────────────

type FormData = Omit<ResumeEntry, 'id' | 'created_at'>

const BLANK: FormData = {
  place_name: '', address: '', category: 'cafe', status: 'planned',
  dropped_date: '', follow_up_date: '', notes: '', contact_name: '', contact_info: '',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status, lang }: { status: string; lang: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.planned
  const label = lang === 'ko' ? cfg.ko : lang === 'fr' ? cfg.fr : cfg.en
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
      {label}
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors bg-white'
const selectCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] text-gray-900 focus:outline-none focus:border-gray-400 transition-colors bg-white'

// ─── Entry Form Modal ─────────────────────────────────────────────────────────

function EntryForm({
  initial, onSave, onClose,
}: {
  initial: FormData & { id?: string }
  onSave: (data: FormData) => void
  onClose: () => void
}) {
  const { t } = useLang()
  const [form, setForm] = useState<FormData>({ ...BLANK, ...initial })
  const [error, setError] = useState('')

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function submit() {
    if (!form.place_name.trim()) { setError(t('장소 이름을 입력해주세요.', 'Please enter a place name.', 'Veuillez entrer un nom.')); return }
    onSave(form)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col"
        style={{ animation: 'modal-up 0.18s ease-out', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <h2 className="text-[15px] font-bold text-gray-900">
            {initial.id ? t('수정', 'Edit Entry', 'Modifier') : t('장소 추가', 'Add Place', 'Ajouter')}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-50">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

          <Field label={t('장소 이름 *', 'Place Name *', 'Nom du lieu *')}>
            <input
              className={inputCls} value={form.place_name} autoFocus
              placeholder={t('예: Fleuriste Mondoux', 'e.g. Fleuriste Mondoux', 'ex: Fleuriste Mondoux')}
              onChange={e => set('place_name', e.target.value)}
            />
          </Field>

          <Field label={t('주소', 'Address', 'Adresse')}>
            <input
              className={inputCls} value={form.address}
              placeholder={t('예: 123 Rue Saint-Denis, Montréal', 'e.g. 123 Rue Saint-Denis', 'ex: 123 Rue Saint-Denis')}
              onChange={e => set('address', e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('카테고리', 'Category', 'Catégorie')}>
              <select className={selectCls} value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{t(c.ko, c.en, c.fr)}</option>
                ))}
              </select>
            </Field>
            <Field label={t('상태', 'Status', 'Statut')}>
              <select className={selectCls} value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_ORDER.map(s => {
                  const cfg = STATUS_CONFIG[s]
                  return <option key={s} value={s}>{t(cfg.ko, cfg.en, cfg.fr)}</option>
                })}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('제출일', 'Dropped Date', 'Date de dépôt')}>
              <input type="date" className={inputCls} value={form.dropped_date} onChange={e => set('dropped_date', e.target.value)} />
            </Field>
            <Field label={t('팔로업 날짜', 'Follow-up Date', 'Date de suivi')}>
              <input type="date" className={inputCls} value={form.follow_up_date} onChange={e => set('follow_up_date', e.target.value)} />
            </Field>
          </div>

          <Field label={t('담당자 이름', 'Contact Name', 'Nom du contact')}>
            <input className={inputCls} value={form.contact_name} placeholder={t('선택 사항', 'Optional', 'Optionnel')} onChange={e => set('contact_name', e.target.value)} />
          </Field>

          <Field label={t('연락처', 'Contact Info', 'Coordonnées')}>
            <input className={inputCls} value={form.contact_info} placeholder={t('전화번호 또는 이메일', 'Phone or email', 'Téléphone ou email')} onChange={e => set('contact_info', e.target.value)} />
          </Field>

          <Field label={t('메모', 'Notes', 'Notes')}>
            <textarea
              className={inputCls + ' resize-none'} rows={3} value={form.notes}
              placeholder={t('예: 매니저 이름 Marie, 화요일 오전 방문', 'e.g. Manager: Marie, visited Tuesday morning', 'ex: Responsable: Marie, visité mardi matin')}
              onChange={e => set('notes', e.target.value)}
            />
          </Field>

          {error && <p className="text-[12px] text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-2 shrink-0">
          <button onClick={submit} className="btn-yellow w-full rounded-xl py-3 text-[14px] font-bold">
            {initial.id ? t('저장', 'Save', 'Enregistrer') : t('추가', 'Add', 'Ajouter')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Entry Card ───────────────────────────────────────────────────────────────

function EntryCard({
  entry, lang, onEdit, onDelete,
}: {
  entry: ResumeEntry; lang: string; onEdit: () => void; onDelete: () => void
}) {
  const cat = CATEGORIES.find(c => c.value === entry.category)
  const catLabel = lang === 'ko' ? cat?.ko : lang === 'fr' ? cat?.fr : cat?.en

  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3.5 hover:border-gray-200 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Row 1: name + category */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-semibold text-[15px] text-gray-900">{entry.place_name}</span>
            {catLabel && (
              <span className="text-[11px] text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">{catLabel}</span>
            )}
            <StatusBadge status={entry.status} lang={lang} />
          </div>

          {/* Address */}
          {entry.address && (
            <div className="flex items-center gap-1 text-[12px] text-gray-500 mb-1.5">
              <MapPin size={11} className="shrink-0 text-gray-400" />
              {entry.address}
            </div>
          )}

          {/* Dates */}
          <div className="flex gap-3 text-[11px] text-gray-400 flex-wrap mb-1">
            {entry.dropped_date && <span>📅 {entry.dropped_date}</span>}
            {entry.follow_up_date && <span>🔔 {entry.follow_up_date}</span>}
          </div>

          {/* Contact */}
          {(entry.contact_name || entry.contact_info) && (
            <div className="text-[11px] text-gray-400">
              {entry.contact_name && <span className="mr-2">👤 {entry.contact_name}</span>}
              {entry.contact_info && <span>{entry.contact_info}</span>}
            </div>
          )}

          {/* Notes */}
          {entry.notes && (
            <p className="mt-1.5 text-[12px] text-gray-600 leading-relaxed line-clamp-2">{entry.notes}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ResumeMap() {
  const { lang, t } = useLang()
  const [entries, setEntries] = useState<ResumeEntry[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ResumeEntry | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => { setEntries(loadEntries()) }, [])

  function addEntry(data: FormData) {
    const entry: ResumeEntry = { ...data, id: crypto.randomUUID(), created_at: new Date().toISOString() }
    const next = [entry, ...entries]
    setEntries(next); saveEntries(next); setShowForm(false)
  }

  function updateEntry(data: FormData) {
    if (!editing) return
    const next = entries.map(e => e.id === editing.id ? { ...e, ...data } : e)
    setEntries(next); saveEntries(next); setEditing(null)
  }

  function deleteEntry(id: string) {
    const next = entries.filter(e => e.id !== id)
    setEntries(next); saveEntries(next); setDeleteId(null)
  }

  const filtered = filter === 'all' ? entries : entries.filter(e => e.status === filter)

  // Summary counts
  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = entries.filter(e => e.status === s).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-20">
      <div className="max-w-[720px] mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900">
              {t('이력서 지도', 'Resume Tracker', 'Suivi CV')}
            </h1>
            <p className="text-[13px] text-gray-500 mt-0.5">
              {t('이력서를 낸 곳을 기록하고 팔로업을 관리하세요.', 'Track where you dropped resumes and manage follow-ups.', 'Suivez vos dépôts de CV et gérez vos relances.')}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-yellow flex items-center gap-1.5 text-[13px] rounded-xl px-4 py-2.5"
          >
            <Plus size={15} />
            {t('추가', 'Add', 'Ajouter')}
          </button>
        </div>

        {/* Summary row */}
        {entries.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
            {STATUS_ORDER.map(s => {
              const cfg = STATUS_CONFIG[s]
              if (!counts[s]) return null
              return (
                <button
                  key={s}
                  onClick={() => setFilter(f => f === s ? 'all' : s)}
                  className="flex flex-col items-center py-2 px-1 rounded-xl border transition-all text-center"
                  style={filter === s
                    ? { background: cfg.bg, borderColor: cfg.dot, color: cfg.text }
                    : { background: '#fff', borderColor: '#E5E7EB', color: '#6B7280' }
                  }
                >
                  <span className="text-[18px] font-bold leading-tight">{counts[s]}</span>
                  <span className="text-[10px] font-medium">{t(cfg.ko, cfg.en, cfg.fr)}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Filter pills */}
        {entries.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            <button
              onClick={() => setFilter('all')}
              className="text-[12px] font-medium px-3 py-1.5 rounded-full border transition-all"
              style={filter === 'all'
                ? { background: '#111', borderColor: '#111', color: '#fff' }
                : { background: '#fff', borderColor: '#E5E7EB', color: '#374151' }
              }
            >
              {t('전체', 'All', 'Tous')} ({entries.length})
            </button>
            {STATUS_ORDER.filter(s => counts[s] > 0).map(s => {
              const cfg = STATUS_CONFIG[s]
              return (
                <button
                  key={s}
                  onClick={() => setFilter(f => f === s ? 'all' : s)}
                  className="text-[12px] font-medium px-3 py-1.5 rounded-full border transition-all"
                  style={filter === s
                    ? { background: cfg.dot, borderColor: cfg.dot, color: '#fff' }
                    : { background: '#fff', borderColor: '#E5E7EB', color: '#374151' }
                  }
                >
                  {t(cfg.ko, cfg.en, cfg.fr)} ({counts[s]})
                </button>
              )
            })}
          </div>
        )}

        {/* Entry list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📍</div>
            <p className="text-[15px] font-medium text-gray-700 mb-1">
              {entries.length === 0
                ? t('아직 기록된 장소가 없어요.', 'No places recorded yet.', 'Aucun lieu enregistré.')
                : t('해당 상태의 장소가 없어요.', 'No places with this status.', 'Aucun lieu avec ce statut.')}
            </p>
            <p className="text-[13px] text-gray-400">
              {t('이력서를 낸 곳을 추가해보세요.', 'Add the places where you dropped your resume.', 'Ajoutez les lieux où vous avez déposé votre CV.')}
            </p>
            {entries.length === 0 && (
              <button onClick={() => setShowForm(true)} className="btn-yellow mt-5 rounded-xl px-5 py-2.5 text-[13px] font-bold">
                {t('첫 장소 추가하기', 'Add your first place', 'Ajouter votre premier lieu')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                lang={lang}
                onEdit={() => setEditing(entry)}
                onDelete={() => setDeleteId(entry.id)}
              />
            ))}
          </div>
        )}

        {/* Storage note */}
        <p className="text-center text-[11px] text-gray-400 mt-8">
          {t('데이터는 이 기기에만 저장됩니다.', 'Data is stored locally on this device only.', 'Les données sont stockées localement sur cet appareil.')}
        </p>
      </div>

      {/* Add form */}
      {showForm && (
        <EntryForm
          initial={{ ...BLANK }}
          onSave={addEntry}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Edit form */}
      {editing && (
        <EntryForm
          initial={{ ...editing }}
          onSave={updateEntry}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setDeleteId(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 w-full" onClick={e => e.stopPropagation()}>
            <p className="text-[15px] font-semibold text-gray-900 mb-1">
              {t('삭제하시겠어요?', 'Delete this entry?', 'Supprimer cette entrée?')}
            </p>
            <p className="text-[13px] text-gray-500 mb-5">
              {t('이 작업은 되돌릴 수 없습니다.', 'This cannot be undone.', 'Cette action est irréversible.')}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                {t('취소', 'Cancel', 'Annuler')}
              </button>
              <button onClick={() => deleteEntry(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[14px] font-bold hover:bg-red-600 transition-colors">
                {t('삭제', 'Delete', 'Supprimer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
