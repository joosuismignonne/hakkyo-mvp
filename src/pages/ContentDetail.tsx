import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getContentById } from '../lib/db'
import { useLang } from '../context/LangContext'
import ArticleBody from '../components/ArticleBody'
import VideoEmbed from '../components/VideoEmbed'
import {
  categoryLabel,
  newsExcerpt,
  normalizeContent,
  pickNewsBody,
  pickNewsTitle,
  resolveContentCategory,
  thumbnailUrl,
  videoEmbedFromUrl,
  type NewsItem,
} from '../lib/newsContent'

export default function ContentDetail() {
  const { id } = useParams<{ id: string }>()
  const { lang, t } = useLang()
  const [item, setItem] = useState<NewsItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError('Post not found.')
      return
    }
    getContentById(id)
      .then(data => {
        if (!data) setError('Post not found.')
        else setItem(normalizeContent(data))
      })
      .catch(err => setError(err.message ?? 'Failed to load article.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="section flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="section">
        <p className="text-sm text-red-500 mb-4">{error || 'Post not found.'}</p>
        <Link to="/content" className="text-sm text-gray-600 hover:text-gray-900">
          ← {t('NEWS로 돌아가기', 'Back to NEWS', 'Retour aux NEWS')}
        </Link>
      </div>
    )
  }

  const title = pickNewsTitle(item, lang)
  const body = pickNewsBody(item, lang)
  const thumb = thumbnailUrl(item)
  const summary = newsExcerpt(body, 280)
  const category = resolveContentCategory(item)
  const video = videoEmbedFromUrl(item.video_url)

  return (
    <article className="section pb-16">
      <div className="max-w-[42rem] mx-auto">
        <Link
          to="/content"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors"
        >
          ← {t('NEWS', 'NEWS', 'NEWS')}
        </Link>

        {thumb && (
          <div className="mb-10 aspect-[2/1] sm:aspect-[21/9] w-full overflow-hidden rounded-xl bg-gray-100">
            <img
              src={thumb}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {video && <VideoEmbed embedUrl={video.embedUrl} title={title} />}

        <header className="mb-10 space-y-5 border-b border-gray-100 pb-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded bg-gray-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
              {categoryLabel(category, t)}
            </span>
            <time className="text-sm text-gray-400" dateTime={item.published_at}>
              {item.published_at}
            </time>
          </div>

          <h1 className="text-[1.75rem] sm:text-4xl font-bold text-gray-900 leading-[1.15] tracking-tight">
            {title}
          </h1>

          {summary && (
            <p className="text-lg sm:text-xl text-gray-500 leading-relaxed font-light">
              {summary}
            </p>
          )}
        </header>

        <ArticleBody body={body} />

        {item.link?.trim() && (
          <div className="mt-14 pt-8 border-t border-gray-100">
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              {t('외부 링크', 'External link', 'Lien externe')} →
            </a>
          </div>
        )}
      </div>
    </article>
  )
}
