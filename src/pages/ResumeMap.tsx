/**
 * ResumeMap — interactive resume drop tracker with Leaflet map.
 * All data stored in localStorage. No Supabase, no login required.
 */
import 'leaflet/dist/leaflet.css'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap,
} from 'react-leaflet'
import L from 'leaflet'
import { X, Plus, Pencil, Trash2, MapPin, Search, Loader2 } from 'lucide-react'
import { useLang } from '../context/LangContext'

// ─── Fix Leaflet default icon paths broken by Vite bundler ───────────────────
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResumeEntry {
  id: string
  place_name: string
  address: string
  latitude: number | null
  longitude: number | null
  category: string
  status: string
  dropped_date: string
  follow_up_date: string
  notes: string
  contact_name: string
  contact_info: string
  created_at: string
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

type FormData = Omit<ResumeEntry, 'id' | 'created_at'>

// ─── Config ───────────────────────────────────────────────────────────────────

const MTL: L.LatLngExpression = [45.5017, -73.5673]
const DEFAULT_ZOOM = 12

const STATUS_CONFIG: Record<string, {
  ko: string; en: string; fr: string; color: string; bg: string; text: string
}> = {
  planned:   { ko: '예정',   en: 'Planned',   fr: 'Prévu',     color: '#9CA3AF', bg: '#F3F4F6', text: '#374151' },
  dropped:   { ko: '제출함', en: 'Dropped',   fr: 'Déposé',    color: '#D97706', bg: '#FFFBEB', text: '#92400E' },
  follow_up: { ko: '팔로업', en: 'Follow Up', fr: 'Suivi',     color: '#3B82F6', bg: '#EFF6FF', text: '#1D4ED8' },
  interview: { ko: '면접',   en: 'Interview', fr: 'Entretien', color: '#8B5CF6', bg: '#F5F3FF', text: '#5B21B6' },
  hired:     { ko: '합격',   en: 'Hired',     fr: 'Embauché',  color: '#10B981', bg: '#ECFDF5', text: '#065F46' },
  rejected:  { ko: '불합격', en: 'Rejected',  fr: 'Refusé',    color: '#EF4444', bg: '#FEF2F2', text: '#991B1B' },
}
const STATUS_ORDER = ['planned', 'dropped', 'follow_up', 'interview', 'hired', 'rejected']

const CATEGORIES = [
  { value: 'cafe',        ko: '카페',   en: 'Café',        fr: 'Café'       },
  { value: 'restaurant',  ko: '식당',   en: 'Restaurant',  fr: 'Restaurant' },
  { value: 'flower_shop', ko: '꽃집',   en: 'Flower Shop', fr: 'Fleuriste'  },
  { value: 'retail',      ko: '리테일', en: 'Retail',      fr: 'Commerce'   },
  { value: 'other',       ko: '기타',   en: 'Other',       fr: 'Autre'      },
]

const BLANK: FormData = {
  place_name: '', address: '', latitude: null, longitude: null,
  category: 'cafe', status: 'planned',
  dropped_date: '', follow_up_date: '', notes: '',
  contact_name: '', contact_info: '',
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'hakkyo_resume_drops'

function loadEntries(): ResumeEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') }
  catch { return [] }
}
function saveEntries(entries: ResumeEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch {}
}

// ─── Custom SVG pin icons coloured by status ──────────────────────────────────

function makeIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38">
    <path d="M14 1C7.373 1 2 6.373 2 13c0 9.625 12 24 12 24S26 22.625 26 13C26 6.373 20.627 1 14 1z"
          fill="${color}" stroke="#fff" stroke-width="2"/>
    <circle cx="14" cy="13" r="5" fill="#fff" opacity="0.9"/>
  </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -40],
  })
}

const STATUS_ICONS: Record<string, L.DivIcon> = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([k, v]) => [k, makeIcon(v.color)])
)
function entryIcon(status: string) {
  return STATUS_ICONS[status] ?? STATUS_ICONS.planned
}

// ─── Map sub-components ───────────────────────────────────────────────────────

function MapClickHandler({ onPin }: { onPin: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPin(e.latlng.lat, e.latlng.lng) } })
  return null
}

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap()
  const prevRef = useRef<[number, number] | null>(null)
  useEffect(() => {
    if (!target) return
    if (prevRef.current?.[0] === target[0] && prevRef.current?.[1] === target[1]) return
    prevRef.current = target
    map.flyTo(target, Math.max(map.getZoom(), 15), { duration: 0.8 })
  }, [target, map])
  return null
}

// ─── Nominatim search hook ────────────────────────────────────────────────────

function useNominatim() {
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((q: string) => {
    setQuery(q)
    if (timer.current) clearTimeout(timer.current)
    if (q.trim().length < 2) { setResults([]); return }
    timer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const p = new URLSearchParams({ q: `${q}, Montréal`, format: 'json', limit: '6', countrycodes: 'ca' })
        const res  = await fetch(`https://nominatim.openstreetmap.org/search?${p}`, {
          headers: { 'Accept-Language': 'fr-CA,fr;q=0.9,en;q=0.8' },
        })
        setResults(await res.json())
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 400)
  }, [])

  const clear = useCallback(() => { setQuery(''); setResults([]) }, [])

  return { query, results, searching, search, clear }
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls  = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors bg-white'
const selectCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] text-gray-900 focus:outline-none focus:border-gray-400 transition-colors bg-white'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  )
}

// ─── Mini map (inside modal) ──────────────────────────────────────────────────

function MiniMap({
  pin, onPin, status,
}: {
  pin: [number, number] | null
  onPin: (lat: number, lng: number) => void
  status: string
}) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 220 }}>
      <MapContainer
        center={pin ?? MTL}
        zoom={pin ? 15 : DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapClickHandler onPin={onPin} />
        {pin && <Marker position={pin} icon={entryIcon(status)} />}
        <FlyTo target={pin} />
      </MapContainer>
    </div>
  )
}

// ─── Entry Form Modal ─────────────────────────────────────────────────────────

interface EntryFormProps {
  initial: FormData & { id?: string }
  onSave: (data: FormData) => void
  onClose: () => void
}

function EntryForm({ initial, onSave, onClose }: EntryFormProps) {
  const { t } = useLang()
  const [form, setForm]     = useState<FormData>({ ...BLANK, ...initial })
  const [error, setError]   = useState('')
  const nom = useNominatim()
  const [showDrop, setShowDrop] = useState(false)

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function handlePin(lat: number, lng: number) {
    set('latitude', lat)
    set('longitude', lng)
  }

  function pickNominatim(r: NominatimResult) {
    set('address', r.display_name)
    set('latitude', parseFloat(r.lat))
    set('longitude', parseFloat(r.lon))
    nom.clear()
    setShowDrop(false)
  }

  function submit() {
    if (!form.place_name.trim()) {
      setError(t('장소 이름을 입력해주세요.', 'Please enter a place name.', 'Veuillez entrer un nom.'))
      return
    }
    onSave(form)
  }

  const pin: [number, number] | null =
    form.latitude != null && form.longitude != null
      ? [form.latitude, form.longitude]
      : null

  return (
    <div
      className="fixed inset-0 z-[1001] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col"
        style={{ animation: 'modal-up 0.18s ease-out', maxHeight: '94vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <h2 className="text-[15px] font-bold text-gray-900">
            {initial.id
              ? t('수정', 'Edit Entry', 'Modifier')
              : t('장소 추가', 'Add Place', 'Ajouter un lieu')}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-50">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

          <Field label={t('장소 이름 *', 'Place Name *', 'Nom du lieu *')}>
            <input
              autoFocus
              className={inputCls}
              value={form.place_name}
              placeholder={t('예: Fleuriste Mondoux', 'e.g. Fleuriste Mondoux', 'ex: Fleuriste Mondoux')}
              onChange={e => set('place_name', e.target.value)}
            />
          </Field>

          {/* Nominatim search */}
          <Field label={t('주소 검색 (OpenStreetMap)', 'Address Search (OpenStreetMap)', 'Recherche d\'adresse (OpenStreetMap)')}>
            <div className="relative">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  className={inputCls + ' pl-8 pr-8'}
                  value={nom.query}
                  placeholder={t('카페, 식당, 주소...', 'café, restaurant, address...', 'café, restaurant, adresse...')}
                  onChange={e => { nom.search(e.target.value); setShowDrop(true) }}
                  onFocus={() => setShowDrop(true)}
                  onBlur={() => setTimeout(() => setShowDrop(false), 150)}
                />
                {nom.searching && (
                  <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                )}
              </div>
              {showDrop && nom.results.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-xl mt-1 shadow-lg overflow-hidden">
                  {nom.results.map(r => (
                    <button
                      key={r.place_id}
                      className="w-full text-left px-3 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                      onMouseDown={() => pickNominatim(r)}
                    >
                      <span className="line-clamp-2 leading-relaxed">{r.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>

          {/* Address field (auto-filled by search or manual) */}
          <Field label={t('주소', 'Address', 'Adresse')}>
            <input
              className={inputCls}
              value={form.address}
              placeholder={t('검색하거나 직접 입력', 'Search above or type manually', 'Cherchez ou saisissez manuellement')}
              onChange={e => set('address', e.target.value)}
            />
          </Field>

          {/* Mini map */}
          <Field label={t('지도에서 위치 클릭 (선택 사항)', 'Click map to place pin (optional)', 'Cliquez sur la carte pour épingler (optionnel)')}>
            <MiniMap pin={pin} onPin={handlePin} status={form.status} />
            {pin ? (
              <p className="text-[11px] text-gray-400 mt-1 flex items-center justify-between">
                <span>{pin[0].toFixed(5)}, {pin[1].toFixed(5)}</span>
                <button
                  className="text-red-400 hover:text-red-600 underline"
                  onClick={() => { set('latitude', null); set('longitude', null) }}
                >
                  {t('핀 제거', 'Remove pin', 'Supprimer')}
                </button>
              </p>
            ) : (
              <p className="text-[11px] text-gray-400 mt-1">
                {t('지도를 클릭하면 핀이 추가됩니다.', 'Click anywhere on the map to drop a pin.', 'Cliquez sur la carte pour placer une épingle.')}
              </p>
            )}
          </Field>

          {/* Category + Status */}
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

          {/* Dates */}
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
              className={inputCls + ' resize-none'} rows={2}
              value={form.notes}
              placeholder={t('예: 화요일 오전 방문, 매니저 이름 Marie', 'e.g. Visited Tuesday morning, manager: Marie', 'ex: Visité mardi matin, responsable: Marie')}
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

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, lang }: { status: string; lang: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.planned
  const label = lang === 'ko' ? cfg.ko : lang === 'fr' ? cfg.fr : cfg.en
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
      {label}
    </span>
  )
}

// ─── Side-panel entry card ────────────────────────────────────────────────────

function EntryCard({
  entry, lang, selected, onSelect, onEdit, onDelete,
}: {
  entry: ResumeEntry; lang: string; selected: boolean
  onSelect: () => void; onEdit: () => void; onDelete: () => void
}) {
  const cat = CATEGORIES.find(c => c.value === entry.category)
  const catLabel = lang === 'ko' ? cat?.ko : lang === 'fr' ? cat?.fr : cat?.en

  return (
    <div
      className="border rounded-xl px-3.5 py-3 cursor-pointer transition-all"
      style={selected
        ? { borderColor: 'var(--y)', background: 'var(--y-l)' }
        : { borderColor: '#E5E7EB', background: '#fff' }}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="font-semibold text-[13px] text-gray-900 truncate">{entry.place_name}</span>
            {catLabel && (
              <span className="text-[10px] text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded-full shrink-0">{catLabel}</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={entry.status} lang={lang} />
            {entry.latitude != null && (
              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                <MapPin size={9} />
                {lang === 'ko' ? '핀 있음' : lang === 'fr' ? 'Épinglé' : 'Pinned'}
              </span>
            )}
          </div>

          {entry.address && (
            <p className="text-[11px] text-gray-500 mt-1 line-clamp-1 leading-snug">{entry.address}</p>
          )}

          {(entry.dropped_date || entry.follow_up_date) && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              {entry.dropped_date && `📅 ${entry.dropped_date}`}
              {entry.follow_up_date && `  🔔 ${entry.follow_up_date}`}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onEdit() }}
            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ResumeMap() {
  const { lang, t } = useLang()

  const [entries, setEntries]   = useState<ResumeEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<ResumeEntry | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [flyTo, setFlyTo]       = useState<[number, number] | null>(null)

  useEffect(() => { setEntries(loadEntries()) }, [])

  function addEntry(data: FormData) {
    const entry: ResumeEntry = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }
    const next = [entry, ...entries]
    setEntries(next)
    saveEntries(next)
    setShowForm(false)
    if (data.latitude != null && data.longitude != null) {
      setSelected(entry.id)
      setFlyTo([data.latitude, data.longitude])
    }
  }

  function updateEntry(data: FormData) {
    if (!editing) return
    const next = entries.map(e => e.id === editing.id ? { ...e, ...data } : e)
    setEntries(next)
    saveEntries(next)
    setEditing(null)
    if (data.latitude != null && data.longitude != null) {
      setFlyTo([data.latitude, data.longitude])
    }
  }

  function deleteEntry(id: string) {
    const next = entries.filter(e => e.id !== id)
    setEntries(next)
    saveEntries(next)
    setDeleteId(null)
    if (selected === id) setSelected(null)
  }

  function selectEntry(entry: ResumeEntry) {
    setSelected(entry.id)
    if (entry.latitude != null && entry.longitude != null) {
      setFlyTo([entry.latitude, entry.longitude])
    }
  }

  const counts = STATUS_ORDER.reduce(
    (a, s) => ({ ...a, [s]: entries.filter(e => e.status === s).length }),
    {} as Record<string, number>
  )

  return (
    <div className="w-full flex flex-col lg:flex-row" style={{ minHeight: '100dvh' }}>

      {/* ── Map ───────────────────────────────────────────────────────────── */}
      <div className="w-full lg:flex-1 relative" style={{ height: 400, flexShrink: 0 }}>
        {/* Leaflet needs a concrete height. On lg+ it becomes sticky full-height. */}
        <style>{`.resume-main-map { height: 400px; } @media (min-width: 1024px) { .resume-main-map { position: sticky; top: 0; height: 100dvh; } }`}</style>

        <MapContainer
          center={MTL}
          zoom={DEFAULT_ZOOM}
          className="resume-main-map"
          style={{ width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <FlyTo target={flyTo} />

          {entries
            .filter(e => e.latitude != null && e.longitude != null)
            .map(entry => (
              <Marker
                key={entry.id}
                position={[entry.latitude!, entry.longitude!]}
                icon={entryIcon(entry.status)}
                eventHandlers={{ click: () => setSelected(entry.id) }}
              >
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, color: '#111', marginBottom: 4 }}>
                      {entry.place_name}
                    </p>
                    <StatusBadge status={entry.status} lang={lang} />
                    {entry.address && (
                      <p style={{ fontSize: 11, color: '#6B7280', marginTop: 6, lineHeight: 1.4 }}>
                        {entry.address}
                      </p>
                    )}
                    {entry.dropped_date && (
                      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>📅 {entry.dropped_date}</p>
                    )}
                    {entry.notes && (
                      <p style={{ fontSize: 11, color: '#374151', marginTop: 4, fontStyle: 'italic' }}>
                        {entry.notes.slice(0, 80)}{entry.notes.length > 80 ? '…' : ''}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))
          }
        </MapContainer>

        {/* Legend overlay */}
        <div className="absolute bottom-3 left-3 z-[400] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2.5 shadow-md">
          {STATUS_ORDER.filter(s => counts[s] > 0).map(s => {
            const cfg = STATUS_CONFIG[s]
            return (
              <div key={s} className="flex items-center gap-1.5 text-[10px] font-medium text-gray-600 py-0.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                <span>{t(cfg.ko, cfg.en, cfg.fr)}</span>
                <span className="text-gray-400 ml-auto pl-3">{counts[s]}</span>
              </div>
            )
          })}
          {entries.length === 0 && (
            <p className="text-[10px] text-gray-400">{t('저장된 장소 없음', 'No saved places', 'Aucun lieu')}</p>
          )}
        </div>
      </div>

      {/* ── Side panel ────────────────────────────────────────────────────── */}
      <div
        className="w-full lg:w-[360px] xl:w-[400px] shrink-0 bg-white border-l border-gray-100 flex flex-col"
        style={{ maxHeight: '100dvh', overflowY: 'auto', position: 'sticky', top: 0 }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between mb-0.5">
            <h1 className="text-[18px] font-bold text-gray-900">
              {t('이력서 지도', 'Resume Tracker', 'Suivi CV')}
            </h1>
            <button
              onClick={() => setShowForm(true)}
              className="btn-yellow flex items-center gap-1.5 text-[12px] rounded-xl px-3.5 py-2"
            >
              <Plus size={14} />
              {t('추가', 'Add', 'Ajouter')}
            </button>
          </div>
          <p className="text-[12px] text-gray-500">
            {t(
              '이력서를 낸 곳을 기록하고 팔로업을 관리하세요.',
              'Track where you dropped resumes and manage follow-ups.',
              'Suivez vos dépôts de CV et gérez vos relances.',
            )}
          </p>

          {entries.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-3">
              {STATUS_ORDER.filter(s => counts[s] > 0).map(s => {
                const cfg = STATUS_CONFIG[s]
                return (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
                    style={{ background: cfg.bg, color: cfg.text }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                    {t(cfg.ko, cfg.en, cfg.fr)} {counts[s]}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📍</div>
              <p className="text-[14px] font-medium text-gray-700 mb-1">
                {t('아직 기록된 장소가 없어요.', 'No places recorded yet.', 'Aucun lieu enregistré.')}
              </p>
              <p className="text-[12px] text-gray-400 mb-5">
                {t(
                  '+ 추가 버튼을 눌러 이력서 낸 곳을 지도에 추가해보세요.',
                  'Click + Add to pin places where you dropped your resume.',
                  'Cliquez sur + Ajouter pour épingler vos dépôts.',
                )}
              </p>
              <button onClick={() => setShowForm(true)} className="btn-yellow rounded-xl px-4 py-2.5 text-[12px] font-bold">
                {t('첫 장소 추가하기', 'Add your first place', 'Ajouter votre premier lieu')}
              </button>
            </div>
          ) : (
            entries.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                lang={lang}
                selected={selected === entry.id}
                onSelect={() => selectEntry(entry)}
                onEdit={() => setEditing(entry)}
                onDelete={() => setDeleteId(entry.id)}
              />
            ))
          )}

          <p className="text-center text-[10px] text-gray-400 pt-2 pb-6">
            {t('데이터는 이 기기에만 저장됩니다.', 'Data is stored locally on this device only.', 'Les données sont stockées localement sur cet appareil.')}
          </p>
        </div>
      </div>

      {/* ── Add modal ── */}
      {showForm && (
        <EntryForm
          initial={{ ...BLANK }}
          onSave={addEntry}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* ── Edit modal ── */}
      {editing && (
        <EntryForm
          initial={{
            id: editing.id,
            place_name:    editing.place_name,
            address:       editing.address,
            latitude:      editing.latitude,
            longitude:     editing.longitude,
            category:      editing.category,
            status:        editing.status,
            dropped_date:  editing.dropped_date,
            follow_up_date: editing.follow_up_date,
            notes:         editing.notes,
            contact_name:  editing.contact_name,
            contact_info:  editing.contact_info,
          }}
          onSave={updateEntry}
          onClose={() => setEditing(null)}
        />
      )}

      {/* ── Delete confirm ── */}
      {deleteId && (
        <div
          className="fixed inset-0 z-[1001] flex items-center justify-center"
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
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('취소', 'Cancel', 'Annuler')}
              </button>
              <button
                onClick={() => deleteEntry(deleteId)}
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
