import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Archive, MapPin, Languages, BookOpen } from 'lucide-react'
import { getContents } from '../lib/db'
import { useLang } from '../context/LangContext'
import { LeftSidebar, PageShell, SharedRightSidebar } from '../components/PageLayout'
import type { ContentCategory, Lang } from '../types'
import {
  categoryLabel,
  CONTENT_CATEGORIES,
  newsExcerpt,
  normalizeContent,
  normalizeImageUrls,
  pickNewsBody,
  pickNewsTitle,
  resolveContentCategory,
  thumbnailUrl,
  videoEmbedFromUrl,
  type NewsItem,
} from '../lib/newsContent'
import ImageGallery from '../components/ImageGallery'
import {
  pushRecent,
  type MemoryItem as ArchiveItem,
} from '../lib/memory'
import CardActions from '../components/CardActions'

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | undefined, lang: string): string {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat(
      lang === 'ko' ? 'ko-KR' : lang === 'fr' ? 'fr-CA' : 'en-CA',
      { year: 'numeric', month: 'short', day: 'numeric' },
    ).format(new Date(iso))
  } catch { return iso }
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    const diff  = Date.now() - new Date(iso).getTime()
    const mins  = Math.floor(diff / 60_000)
    const hours = Math.floor(diff / 3_600_000)
    const days  = Math.floor(diff / 86_400_000)
    const weeks = Math.floor(days / 7)
    if (mins  <  1)  return 'just now'
    if (mins  < 60)  return `${mins}m ago`
    if (hours < 24)  return `${hours}h ago`
    if (days  === 1) return 'Yesterday'
    if (days  <  7)  return `${days}d ago`
    if (days  < 30)  return `${weeks}w ago`
    return fmtDate(iso, 'en')
  } catch { return '' }
}

function readingTime(body: string, t: (ko: string, en: string, fr: string) => string): string {
  const words = body.trim().split(/\s+/).filter(Boolean).length
  const mins  = Math.max(1, Math.round(words / 200))
  return `${mins} ${t('분 읽기', 'min read', 'min de lecture')}`
}

function itemToArchive(item: NewsItem, lang: Lang): ArchiveItem {
  return {
    id:    item.id,
    type:  'archive',
    title: pickNewsTitle(item, 'en') || pickNewsTitle(item, lang),
    image: thumbnailUrl(item),
    url:   `/news/${item.id}`,
    date:  item.published_at ?? null,
  }
}

/**
 * Merge thumbnail_url + image_urls into one deduplicated, non-empty array.
 * normalizeImageUrls handles JSON-encoded strings coming from Supabase.
 */
function buildGallery(item: NewsItem): string[] {
  const thumb = thumbnailUrl(item)
  const extra = normalizeImageUrls(item.image_urls)
  const all   = [thumb, ...extra].filter((u): u is string => typeof u === 'string' && u.trim() !== '')
  // dedupe preserving order (thumbnail first)
  const seen = new Set<string>()
  return all.filter(u => seen.has(u) ? false : (seen.add(u), true))
}

// ─── icons ────────────────────────────────────────────────────────────────────

// ─── VideoEmbed (feed) ────────────────────────────────────────────────────────

function VideoEmbed({ url }: { url: string }) {
  const info = videoEmbedFromUrl(url)
  if (!info) return null
  return (
    <div className="w-full aspect-[16/9] bg-gray-900 overflow-hidden">
      <iframe
        src={info.embedUrl}
        title="video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className="w-full h-full border-0"
      />
    </div>
  )
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({
  item, lang, t,
}: {
  item: NewsItem
  lang: Lang
  t: (ko: string, en: string, fr: string) => string
}) {
  const hasVideo = !!item.video_url?.trim()
  const gallery  = buildGallery(item)   // thumbnail + image_urls, deduped, normalised
  const title    = pickNewsTitle(item, lang)
  const body     = pickNewsBody(item, lang)
  const excerpt  = newsExcerpt(body, 200)
  const category = resolveContentCategory(item)
  const rt       = readingTime(body, t)
  const archive  = itemToArchive(item, lang)

  // Media priority: video > gallery (≥1 image) > nothing
  let media: React.ReactNode = null
  if (hasVideo) {
    media = <VideoEmbed url={item.video_url!} />
  } else if (gallery.length > 0) {
    media = <ImageGallery images={gallery} />
  }

  function onOpen() {
    pushRecent(archive)
  }

  return (
    <article className="bg-white border border-gray-100 rounded-2xl overflow-hidden cursor-pointer
                        transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)] hover:border-gray-200">

      {/* ── Meta ── */}
      <div className="px-5 pt-5 pb-3">
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5
                      text-[10px] font-semibold tracking-[0.16em] uppercase text-gray-300">
          <span>HAKKYO</span>
          <span className="opacity-50">·</span>
          <span>{categoryLabel(category, t)}</span>
          {item.published_at && (
            <>
              <span className="opacity-50">·</span>
              <span className="font-normal normal-case tracking-wide" style={{ letterSpacing: '0.04em' }}>
                {relativeTime(item.published_at)} · {fmtDate(item.published_at, lang)}
              </span>
            </>
          )}
          {body.trim() && (
            <>
              <span className="opacity-50">·</span>
              <span className="font-normal normal-case tracking-wide">{rt}</span>
            </>
          )}
        </p>
      </div>

      {/* ── Title ── */}
      <div className="px-5 pb-3">
        <Link to={`/news/${item.id}`} onClick={onOpen}>
          <h2 className="text-[1.05rem] font-medium tracking-tight text-gray-900 leading-snug
                         hover:text-gray-500 transition-colors duration-200">
            {title}
          </h2>
        </Link>
      </div>

      {/* ── Excerpt ── */}
      {excerpt && (
        <div className="px-5 pb-4">
          <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
            {excerpt}
          </p>
        </div>
      )}

      {/* ── Media ── */}
      {media && (
        <div className="mx-5 mb-4 rounded-xl overflow-hidden" style={{ maxHeight: 520 }}>
          {media}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="px-5 pb-4 pt-1 flex items-center justify-between border-t border-gray-50 mt-1">
        <Link
          to={`/news/${item.id}`}
          onClick={onOpen}
          className="text-xs font-medium text-gray-400 hover:text-gray-900
                     transition-colors duration-200 tracking-wide"
        >
          {t('전체 보기', 'Read more', 'Lire la suite')} →
        </Link>

        <CardActions item={archive} url={`/news/${item.id}`} size={13} />
      </div>
    </article>
  )
}

// ─── Content page ─────────────────────────────────────────────────────────────

export default function ContentPage() {
  const { lang, t } = useLang()
  const filterRef = useRef<HTMLDivElement>(null)
  const [items,   setItems]   = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [filter,  setFilter]  = useState<'all' | ContentCategory>('all')

  useEffect(() => {
    getContents()
      .then(data => setItems((data ?? []).map(normalizeContent)))
      .catch(err => setError(err.message ?? 'Failed to load content.'))
      .finally(() => setLoading(false))
  }, [])

  const visible = filter === 'all'
    ? items
    : items.filter(c => resolveContentCategory(c) === filter)

  const CATEGORY_ICON: Record<ContentCategory, React.ElementType> = {
    archive:  Archive,
    montreal: MapPin,
    language: Languages,
    culture:  BookOpen,
  }

  const FILTERS: Array<{ key: 'all' | ContentCategory; label: string; icon: React.ElementType }> = [
    { key: 'all', label: t('전체', 'All', 'Tous'), icon: Zap },
    ...CONTENT_CATEGORIES.map(cat => ({
      key:   cat as 'all' | ContentCategory,
      label: categoryLabel(cat, t),
      icon:  CATEGORY_ICON[cat],
    })),
  ]

  function changeFilter(key: 'all' | ContentCategory) {
    setFilter(key)
    // Scroll filter bar into view on mobile after tap
    filterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  if (loading) return (
    <div className="section flex items-center justify-center h-48">
      <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="section flex items-center justify-center h-48">
      <p className="text-sm text-red-500">{error}</p>
    </div>
  )

  return (
    <PageShell
      left={<LeftSidebar lang={lang as 'ko' | 'en' | 'fr'} />}
      right={<SharedRightSidebar lang={lang as 'ko' | 'en' | 'fr'} />}
    >
      {/* ── Filter chips ── */}
      <div ref={filterRef} className="flex items-center gap-2 mb-5 flex-wrap">
        {FILTERS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => changeFilter(key)}
            className={[
              'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.06em] transition-colors',
              filter === key
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700',
            ].join(' ')}
          >
            <Icon size={11} className="shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Feed ── */}
      {visible.length === 0 ? (
        <p className="text-gray-300 text-sm py-20 text-center tracking-wide">
          {t('내용이 없습니다.', 'Nothing here yet.', "Rien pour l'instant.")}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map(item => (
            <PostCard key={item.id} item={item} lang={lang} t={t} />
          ))}
        </div>
      )}
    </PageShell>
  )
}
