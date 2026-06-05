import SaveButton from './SaveButton'
import type { MemoryItem } from '../lib/memory'

function PaperPlaneIcon({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2L2 7l4.5 2L8 14l6-12z" />
      <path d="M6.5 9L9 6.5" />
    </svg>
  )
}

export default function CardActions({ item, url, size = 13 }: {
  item: MemoryItem
  url: string
  size?: number
}) {
  function handleShare(e: React.MouseEvent) {
    e.stopPropagation()
    const full = `${window.location.origin}${url}`
    if (navigator.share) navigator.share({ url: full }).catch(() => {})
    else navigator.clipboard?.writeText(full).catch(() => {})
  }

  return (
    <div className="flex items-center gap-0">
      <SaveButton item={item} size={size} />
      <button
        type="button"
        onClick={handleShare}
        title="Share"
        aria-label="Share"
        className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors touch-manipulation"
      >
        <PaperPlaneIcon size={size} />
      </button>
    </div>
  )
}
