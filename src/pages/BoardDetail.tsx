import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { getNoticeById } from '../lib/db'
import { trackEvent } from '../lib/analytics'
import { useLang } from '../context/LangContext'
import { LeftSidebar, PageShell, SharedRightSidebar } from '../components/PageLayout'
import ArticleBody from '../components/ArticleBody'
import type { Notice } from '../types'

type Lang = 'ko' | 'en' | 'fr'

function pickText(lang: Lang, ko: string, en: string, fr: string): string {
  const order = lang === 'ko' ? [ko, en, fr] : lang === 'fr' ? [fr, ko, en] : [en, ko, fr]
  return order.find(s => s?.trim()) ?? ''
}

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }).format(
      new Date(iso + 'T00:00:00'),
    )
  } catch { return iso }
}

const TYPE_LABEL: Record<Notice['type'], string> = {
  event:  'Event',
  hiring: 'Hiring',
  notice: 'Notice',
}

export default function BoardDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { lang: rawLang } = useLang()
  const lang = rawLang as Lang

  const [notice,  setNotice]  = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!id) { setError('Post not found.'); setLoading(false); return }
    getNoticeById(id)
      .then(data => {
        if (!data) setError('Post not found.')
        else {
          setNotice(data)
          trackEvent({ eventName: 'post_clicked', targetType: 'notice', targetId: id, targetLabel: data.title_en || data.title_ko })
        }
      })
      .catch(() => setError('Failed to load post.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-4 h-4 border border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !notice) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-red-400">{error || 'Post not found.'}</p>
        <button onClick={() => navigate('/board')} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
          ← Back to Board
        </button>
      </div>
    )
  }

  const title = pickText(lang, notice.title_ko, notice.title_en, notice.title_fr)
  const body  = pickText(lang, notice.body_ko,  notice.body_en,  notice.body_fr)

  const mainContent = (
    <div>
      <button
        onClick={() => navigate('/board')}
        className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors mb-6"
      >
        <ChevronLeft size={12} />
        Board
      </button>

      {/* Type + date */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[9px] font-bold tracking-[0.18em] uppercase px-1.5 py-0.5 rounded-sm bg-gray-100 text-gray-600">
          {TYPE_LABEL[notice.type]}
        </span>
        <span className="text-[11px] text-gray-400">{fmtDate(notice.date)}</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-light tracking-tight text-gray-900 leading-tight mb-6">
        {title}
      </h1>

      {/* Cover image — full aspect ratio, no cropping */}
      {notice.image_url && (
        <div className="rounded-xl overflow-hidden mb-6 bg-gray-50">
          <img src={notice.image_url} alt=""
            className="w-full h-auto object-contain rounded-xl" />
        </div>
      )}

      {/* Body — renders HTML from rich text editor */}
      {body && (
        <div className="mb-8">
          <ArticleBody body={body} />
        </div>
      )}

      {/* Tags */}
      {notice.tags && notice.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-8">
          {notice.tags.map(tag => (
            <span key={tag} className="text-[10px] text-gray-400 px-2 py-1 bg-gray-50 rounded-sm border border-gray-100">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Links */}
      {(notice.location_name || notice.map_url || notice.instagram_url || notice.external_url) && (
        <div className="border-t border-gray-100 pt-6 space-y-3">
          {notice.location_name && (
            <div>
              <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-gray-300 mb-1">Location</p>
              {notice.map_url ? (
                <a href={notice.map_url} target="_blank" rel="noopener noreferrer"
                   className="text-[13px] text-gray-500 hover:text-gray-900 underline transition-colors">
                  {notice.location_name}
                </a>
              ) : (
                <p className="text-[13px] text-gray-500">{notice.location_name}</p>
              )}
            </div>
          )}
          {(notice.map_url || notice.instagram_url || notice.external_url) && (
            <div>
              <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-gray-300 mb-1">Links</p>
              <div className="space-y-1">
                {notice.map_url && (
                  <a href={notice.map_url} target="_blank" rel="noopener noreferrer"
                     className="block text-[13px] text-gray-500 hover:text-gray-900 underline transition-colors">
                    View Map ↗
                  </a>
                )}
                {notice.instagram_url && (
                  <a href={notice.instagram_url} target="_blank" rel="noopener noreferrer"
                     className="block text-[13px] text-gray-500 hover:text-gray-900 underline transition-colors">
                    Instagram ↗
                  </a>
                )}
                {notice.external_url && (
                  <a href={notice.external_url} target="_blank" rel="noopener noreferrer"
                     className="block text-[13px] text-gray-500 hover:text-gray-900 underline transition-colors">
                    Website ↗
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <PageShell
      left={<LeftSidebar lang={lang} />}
      right={<SharedRightSidebar lang={lang} />}
    >
      {mainContent}
    </PageShell>
  )
}
