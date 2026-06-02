import type { Content, ContentCategory, ContentType, Lang } from '../types'
import { isHtmlBody, stripHtmlForExcerpt } from './htmlContent'

export type NewsItem = Content

export const CONTENT_CATEGORIES: ContentCategory[] = [
  'archive',
  'language',
  'news',
  'culture',
  'life',
]

export const CONTENT_TYPES: ContentType[] = ['text', 'image', 'video']

export function normalizeContentType(type: Content['type'] | string | null | undefined): ContentType {
  if (type === 'photo') return 'image'
  if (type === 'text' || type === 'image' || type === 'video') return type
  return 'text'
}

export function resolveContentCategory(
  item: Pick<Content, 'category' | 'type'>,
): ContentCategory {
  if (item.category && CONTENT_CATEGORIES.includes(item.category)) {
    return item.category
  }
  const type = normalizeContentType(item.type)
  if (type === 'video') return 'archive'
  return 'news'
}

export function categoryLabel(
  category: ContentCategory,
  t: (ko: string, en: string, fr: string) => string,
): string {
  const labels: Record<ContentCategory, [string, string, string]> = {
    archive:  ['ARCHIVE', 'ARCHIVE', 'ARCHIVE'],
    language: ['LANGUAGE', 'LANGUAGE', 'LANGUAGE'],
    news:     ['NEWS', 'NEWS', 'NEWS'],
    culture:  ['CULTURE', 'CULTURE', 'CULTURE'],
    life:     ['LIFE', 'LIFE', 'LIFE'],
  }
  const [ko, en, fr] = labels[category]
  return t(ko, en, fr)
}

export function contentTypeLabel(
  type: ContentType,
  t: (ko: string, en: string, fr: string) => string,
): string {
  if (type === 'video') return t('영상', 'Video', 'Vidéo')
  if (type === 'image') return t('이미지', 'Image', 'Image')
  return t('텍스트', 'Text', 'Texte')
}

export function pickNewsTitle(item: Content, lang: Lang): string {
  return lang === 'ko' ? item.title_ko : lang === 'fr' ? item.title_fr : item.title_en
}

export function pickNewsBody(item: Content, lang: Lang): string {
  return lang === 'ko' ? item.body_ko : lang === 'fr' ? item.body_fr : item.body_en
}

export function newsExcerpt(body: string, max = 160): string {
  if (isHtmlBody(body)) return stripHtmlForExcerpt(body, max)
  const plain = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/[#>*_~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!plain) return ''
  return plain.length > max ? `${plain.slice(0, max).trim()}…` : plain
}

export function youtubeIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace(/^\//, '').split('/')[0]
      return id || null
    }
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtube-nocookie.com')) {
      if (u.pathname.startsWith('/embed/')) {
        return u.pathname.split('/')[2] || null
      }
      if (u.pathname.startsWith('/shorts/')) {
        return u.pathname.split('/')[2] || null
      }
      const v = u.searchParams.get('v')
      return v || null
    }
  } catch {
    return null
  }
  return null
}

export function vimeoIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (!u.hostname.includes('vimeo.com')) return null
    if (u.hostname === 'player.vimeo.com' && u.pathname.startsWith('/video/')) {
      return u.pathname.split('/')[2] || null
    }
    const parts = u.pathname.split('/').filter(Boolean)
    const videoIdx = parts.indexOf('video')
    if (videoIdx >= 0 && parts[videoIdx + 1] && /^\d+$/.test(parts[videoIdx + 1])) {
      return parts[videoIdx + 1]
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      if (/^\d+$/.test(parts[i])) return parts[i]
    }
  } catch {
    return null
  }
  return null
}

export type VideoEmbedInfo = {
  provider: 'youtube' | 'vimeo'
  embedUrl: string
}

/** Build iframe embed URL from admin video_url (YouTube or Vimeo). */
export function videoEmbedFromUrl(url: string | null | undefined): VideoEmbedInfo | null {
  const raw = url?.trim()
  if (!raw) return null

  const youtubeId = youtubeIdFromUrl(raw)
  if (youtubeId) {
    const params = new URLSearchParams({ rel: '0' })
    return {
      provider: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${youtubeId}?${params}`,
    }
  }

  const vimeoId = vimeoIdFromUrl(raw)
  if (vimeoId) {
    return {
      provider: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
    }
  }

  return null
}

export function thumbnailUrl(item: Pick<Content, 'thumbnail_url'>): string | null {
  const url = item.thumbnail_url?.trim()
  return url || null
}

export function normalizeImageUrls(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(u => String(u).trim()).filter(Boolean)
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return normalizeImageUrls(parsed)
    } catch {
      return [value.trim()]
    }
  }
  return []
}

export function normalizeContent(item: Content): NewsItem {
  return {
    ...item,
    type: normalizeContentType(item.type),
    category: resolveContentCategory(item),
  }
}
