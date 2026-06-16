/**
 * Floating Archive Widget
 * Shows Recently Viewed + Saved items across Programs, Board, and Archive.
 * localStorage only — no Supabase. Hidden on mobile (md+).
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import {
  readRecent,
  readSaved,
  unsaveItem,
  subscribeToMemory,
  type MemoryItem      as ArchiveItem,
  type MemoryItemType  as ArchiveItemType,
} from '../lib/memory'

// ─── icons ────────────────────────────────────────────────────────────────────

function IconBookmark({ filled, size = 12 }: { filled?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16"
         fill={filled ? 'currentColor' : 'none'}
         stroke="currentColor" strokeWidth="1.6"
         strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2h10v12l-5-3.5L3 14V2z"/>
    </svg>
  )
}

function IconClock({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="8" cy="8" r="6"/>
      <polyline points="8,4.5 8,8 10.5,10"/>
    </svg>
  )
}

function IconX({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="3" x2="13" y2="13"/>
      <line x1="13" y1="3" x2="3" y2="13"/>
    </svg>
  )
}

// ─── type badge ───────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<ArchiveItemType, string> = {
  program: 'bg-gray-100 text-gray-700',
  board:   'bg-blue-50 text-blue-500',
  archive: 'bg-gray-100 text-gray-400',
}

function TypeBadge({ type }: { type: ArchiveItemType }) {
  return (
    <span className={`text-[8px] font-bold tracking-[0.16em] uppercase px-1 py-0.5 rounded-sm ${TYPE_STYLE[type]}`}>
      {type}
    </span>
  )
}

// ─── item row ─────────────────────────────────────────────────────────────────

function ItemRow({
  item, onUnsave, onClick,
}: {
  item: ArchiveItem
  onUnsave?: () => void
  onClick:   () => void
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors
                 cursor-pointer rounded-lg group/item"
    >
      {/* Thumbnail */}
      <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0">
        {item.image
          ? <img src={item.image} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gray-50 flex items-center justify-center">
              <span className="text-[7px] tracking-widest text-gray-300 font-semibold uppercase">HK</span>
            </div>
        }
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="mb-0.5"><TypeBadge type={item.type} /></div>
        <p className="text-[11px] text-gray-700 font-medium leading-tight truncate">
          {item.title}
        </p>
      </div>

      {/* Unsave button (saved tab only) */}
      {onUnsave && (
        <button
          onClick={e => { e.stopPropagation(); onUnsave() }}
          title="Remove"
          className="shrink-0 p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100
                     transition-colors opacity-0 group-hover/item:opacity-100"
        >
          <IconX />
        </button>
      )}
    </div>
  )
}

// ─── empty state ──────────────────────────────────────────────────────────────

function EmptyTab({ label }: { label: string }) {
  return (
    <p className="text-[11px] text-gray-300 text-center py-5 tracking-wide">{label}</p>
  )
}

// ─── widget ───────────────────────────────────────────────────────────────────

type Tab = 'recent' | 'saved'

export default function BoardMemoryWidget() {
  const { t }    = useLang()
  const navigate = useNavigate()
  const location = useLocation()

  const [open,    setOpen]    = useState(false)
  const [tab,     setTab]     = useState<Tab>('recent')
  const [recent,  setRecent]  = useState<ArchiveItem[]>([])
  const [saved,   setSaved]   = useState<ArchiveItem[]>([])
  const [visible, setVisible] = useState(false)

  const refresh = useCallback(() => {
    setRecent(readRecent().slice(0, 5))
    setSaved(readSaved().slice(0, 5))
  }, [])

  useEffect(() => {
    refresh()
    return subscribeToMemory(refresh)
  }, [refresh])

  // Listen for sidebar trigger
  useEffect(() => {
    function onOpen() { refresh(); setOpen(true); setVisible(true) }
    window.addEventListener('hakkyo:open-archive', onOpen)
    return () => window.removeEventListener('hakkyo:open-archive', onOpen)
  }, [refresh])

  const hasData = recent.length > 0 || saved.length > 0
  useEffect(() => {
    if (!hasData) {
      setVisible(false)
      setOpen(false)
    }
  }, [hasData])

  if (location.pathname.startsWith('/admin')) return null
  if (!hasData) return null

  function handleUnsave(item: ArchiveItem) {
    unsaveItem(item.id, item.type)
    refresh()
  }

  function handleItemClick(item: ArchiveItem) {
    setOpen(false)
    navigate(item.url)
  }

  const recentCount = recent.length
  const savedCount  = saved.length
  const totalCount  = recentCount + savedCount

  if (!open || !visible) return null

  return (
    <div
      className="fixed bottom-8 right-8 z-50 hidden lg:block"
      style={{ animation: 'modal-up 0.18s ease-out' }}
    >
      {/* Panel — opens when triggered from sidebar Archive button */}
      <div className="w-[272px] bg-white/95 backdrop-blur-md border border-gray-200/80 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.1)] overflow-hidden">
        {/* Header */}
        <div className="px-3 pt-3 pb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-gray-400 uppercase">
            {t('아카이브', 'Archive', 'Archives')}
          </p>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-300 hover:text-gray-500 transition-colors p-0.5 rounded"
          >
            <IconX size={10} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center px-3 mb-1 gap-1">
          {([
            { key: 'recent' as Tab, icon: <IconClock />,         label: t('최근 본', 'Recent', 'Récents'),   count: recentCount },
            { key: 'saved'  as Tab, icon: <IconBookmark filled/>, label: t('저장됨',  'Saved',  'Enregistrés'), count: savedCount  },
          ]).map(({ key, icon, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={[
                'flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg transition-colors',
                tab === key
                  ? 'bg-gray-100 text-gray-700 font-medium'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50',
              ].join(' ')}
            >
              <span className={tab === key ? 'text-gray-500' : 'text-gray-300'}>{icon}</span>
              {label}
              {count > 0 && (
                <span className={`text-[9px] font-semibold tabular-nums ${tab === key ? 'text-gray-500' : 'text-gray-300'}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mx-3 border-t border-gray-100 mb-1" />

        {/* Items */}
        <div className="pb-2">
          {tab === 'recent' && (
            recent.length > 0
              ? recent.map(item => (
                  <ItemRow key={`${item.type}-${item.id}`} item={item}
                           onClick={() => handleItemClick(item)} />
                ))
              : <EmptyTab label={t('최근 본 항목이 없습니다', 'No recent views yet', 'Aucune vue récente')} />
          )}
          {tab === 'saved' && (
            saved.length > 0
              ? saved.map(item => (
                  <ItemRow key={`${item.type}-${item.id}`} item={item}
                           onUnsave={() => handleUnsave(item)}
                           onClick={() => handleItemClick(item)} />
                ))
              : <EmptyTab label={t('저장된 항목이 없습니다', 'Nothing saved yet', 'Rien enregistré')} />
          )}
        </div>
      </div>
    </div>
  )
}
