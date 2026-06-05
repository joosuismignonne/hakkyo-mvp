import { useState } from 'react'

/**
 * Shared image gallery / carousel.
 *
 * - 1 image  → plain img, no controls.
 * - 2+ images → carousel with prev/next arrows, dot indicators, N/total counter.
 *
 * Pass a pre-normalised, non-empty string array.  The component never slices
 * or limits the array — it shows every image exactly as received.
 */

interface Props {
  images: string[]
  aspect?: string   // Tailwind aspect-ratio class, defaults to 'aspect-[16/9]'
  rounded?: string  // Tailwind rounded class applied to the wrapper
}

function ChevronLeft() {
  return (
    <svg width={14} height={14} viewBox="0 0 16 16" fill="none"
         stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="10,3 5,8 10,13"/>
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width={14} height={14} viewBox="0 0 16 16" fill="none"
         stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6,3 11,8 6,13"/>
    </svg>
  )
}

export default function ImageGallery({
  images,
  aspect   = 'aspect-[16/9]',
  rounded  = 'rounded-none',
}: Props) {
  const [idx, setIdx] = useState(0)
  const total = images.length   // never sliced — always the full count

  // ── single image: plain img, no chrome ────────────────────────────────────
  if (total === 1) {
    return (
      <div className={`${aspect} ${rounded} w-full overflow-hidden bg-gray-50`}>
        <img
          src={images[0]}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  // ── multi-image carousel ───────────────────────────────────────────────────
  function prev() { setIdx(i => (i - 1 + total) % total) }
  function next() { setIdx(i => (i + 1) % total) }

  return (
    <div className={`${aspect} ${rounded} relative w-full overflow-hidden bg-gray-50 select-none`}>

      {/* Current slide */}
      <img
        key={idx}           // remounts on change → clean fade-in via CSS
        src={images[idx]}
        alt={`${idx + 1} / ${total}`}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover animate-[fadeIn_0.25s_ease]"
      />

      {/* Prev button */}
      <button
        onClick={prev}
        aria-label="Previous image"
        className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10
                   w-8 h-8 rounded-full bg-white/85 backdrop-blur-sm
                   border border-white/60 shadow-sm
                   flex items-center justify-center text-gray-700
                   hover:bg-white transition-colors duration-150"
      >
        <ChevronLeft />
      </button>

      {/* Next button */}
      <button
        onClick={next}
        aria-label="Next image"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10
                   w-8 h-8 rounded-full bg-white/85 backdrop-blur-sm
                   border border-white/60 shadow-sm
                   flex items-center justify-center text-gray-700
                   hover:bg-white transition-colors duration-150"
      >
        <ChevronRight />
      </button>

      {/* Dot strip — one dot per image, no cap */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10
                      flex items-center gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Go to image ${i + 1}`}
            className={[
              'h-1.5 rounded-full transition-all duration-200',
              i === idx
                ? 'w-4 bg-white'
                : 'w-1.5 bg-white/50 hover:bg-white/75',
            ].join(' ')}
          />
        ))}
      </div>

      {/* N / total counter */}
      <span className="absolute top-2.5 right-2.5 z-10
                       text-[10px] font-medium tracking-wide
                       bg-black/40 text-white rounded-full
                       px-2 py-0.5 backdrop-blur-sm leading-none">
        {idx + 1}&thinsp;/&thinsp;{total}
      </span>
    </div>
  )
}
