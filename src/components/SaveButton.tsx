import { useState, useEffect } from 'react'
import { isSaved, toggleSaved, subscribeToMemory, type MemoryItem as ArchiveItem } from '../lib/memory'

interface Props {
  item: ArchiveItem
  size?: number
  className?: string
}

export default function SaveButton({ item, size = 14, className = '' }: Props) {
  const [saved, setSaved] = useState(() => isSaved(item.id, item.type))

  // Stay in sync when another component changes saved state
  useEffect(() => {
    return subscribeToMemory(() => setSaved(isSaved(item.id, item.type)))
  }, [item.id, item.type])

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    setSaved(toggleSaved(item))
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? 'Remove from saved' : 'Save'}
      aria-pressed={saved}
      title={saved ? 'Saved' : 'Save'}
      className={[
        'p-1.5 rounded-lg transition-colors touch-manipulation',
        saved
          ? 'text-gray-900 bg-gray-100'
          : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100',
        className,
      ].join(' ')}
    >
      <svg
        width={size} height={size}
        viewBox="0 0 16 16"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M3 2h10v12l-5-3.5L3 14V2z"/>
      </svg>
    </button>
  )
}
