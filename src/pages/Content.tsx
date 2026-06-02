import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getContents } from '../lib/db'
import { useLang } from '../context/LangContext'
import type { ContentCategory } from '../types'
import {
  categoryLabel,
  CONTENT_CATEGORIES,
  newsExcerpt,
  normalizeContent,
  pickNewsBody,
  pickNewsTitle,
  resolveContentCategory,
  thumbnailUrl,
  type NewsItem,
} from '../lib/newsContent'

export default function ContentPage() {
  const { lang, t } = useLang()
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

  if (loading) {
    return (
      <div className="section flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="section flex items-center justify-center h-48">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">{t('NEWS', 'NEWS', 'NEWS')}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {t(
              '몬트리올 소식 · 캐나다 업데이트 · 문화 아카이브',
              'Montréal news · Canada updates · Cultural archive',
              'Actualités de Montréal · Canada · Archives culturelles',
            )}
          </p>
        </div>
        <div className="flex items-center border border-gray-200 rounded overflow-hidden text-sm font-medium overflow-x-auto whitespace-nowrap scrollbar-none shrink-0 max-w-full">
          <button
            onClick={() => setFilter('all')}
            className={['px-3 py-1.5 transition-colors',
              filter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50',
            ].join(' ')}
          >
            {t('전체', 'All', 'Tout')}
          </button>
          {CONTENT_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={['px-3 py-1.5 transition-colors uppercase tracking-wide text-xs',
                filter === cat ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50',
              ].join(' ')}
            >
              {categoryLabel(cat, t)}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-gray-400 text-sm py-10 text-center">
          {t('내용이 없습니다.', 'Nothing here yet.', 'Rien pour l\'instant.')}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {visible.map(c => {
            const src = thumbnailUrl(c)
            const title = pickNewsTitle(c, lang)
            const excerpt = newsExcerpt(pickNewsBody(c, lang))
            const category = resolveContentCategory(c)

            return (
              <Link
                key={c.id}
                to={`/content/${c.id}`}
                className="card group !p-0 overflow-hidden hover:border-gray-300 transition-colors block"
              >
                <div className="aspect-[16/10] w-full overflow-hidden bg-gray-100">
                  {src ? (
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center border-b border-gray-100 bg-gray-50"
                      aria-hidden
                    >
                      <span className="text-xs font-semibold uppercase tracking-widest text-gray-300">
                        HAKKYO
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide truncate">
                      {categoryLabel(category, t)}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">{c.published_at}</span>
                  </div>

                  <h2 className="font-semibold text-gray-900 leading-snug group-hover:text-gray-600 transition-colors">
                    {title}
                  </h2>

                  {excerpt && (
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{excerpt}</p>
                  )}

                  <span className="inline-flex text-xs font-medium text-gray-700 group-hover:text-yellow transition-colors">
                    {t('읽기', 'Read', 'Lire')} →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
