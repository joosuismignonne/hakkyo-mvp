import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { getCommunityPostById } from '../lib/db'
import { useLang } from '../context/LangContext'
import { LeftSidebar, PageShell, SharedRightSidebar } from '../components/PageLayout'
import type { CommunitySubmission } from '../types'

type Lang = 'ko' | 'en' | 'fr'

const COMMUNITY_SUBTYPE_LABEL: Record<string, string> = {
  housing:            'Housing',
  jobs:               'Jobs',
  looking_for_people: 'Roommates',
  language_exchange:  'Language Exchange',
  general:            'General',
  other:              'General',
  events:             'Events',
  help_needed:        'Help',
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    const diff  = Date.now() - new Date(iso).getTime()
    const days  = Math.floor(diff / 86_400_000)
    const weeks = Math.floor(days / 7)
    const mins  = Math.floor(diff / 60_000)
    const hours = Math.floor(diff / 3_600_000)
    if (mins  <  1)  return 'just now'
    if (mins  < 60)  return `${mins}m ago`
    if (hours < 24)  return `${hours}h ago`
    if (days  === 1) return 'Yesterday'
    if (days  <  7)  return `${days}d ago`
    if (days  < 30)  return `${weeks}w ago`
    return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(iso))
  } catch { return '' }
}

export default function CommunityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { lang: rawLang, t } = useLang()
  const lang = rawLang as Lang

  const [post,    setPost]    = useState<CommunitySubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!id) { setError('Post not found.'); setLoading(false); return }
    getCommunityPostById(id)
      .then(data => {
        if (!data) setError('Post not found.')
        else setPost(data)
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

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-red-400">{error || 'Post not found.'}</p>
        <button onClick={() => navigate('/')} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
          ← Back
        </button>
      </div>
    )
  }

  const catLabel = COMMUNITY_SUBTYPE_LABEL[post.type] ?? 'General'

  const mainContent = (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors mb-6"
      >
        <ChevronLeft size={12} />
        {t('뒤로', 'Back', 'Retour')}
      </button>

      {/* Category + time */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-gray-400">
          {t('커뮤니티', 'Community', 'Communauté')} · {catLabel}
        </span>
        {post.created_at && (
          <span className="text-[11px] text-gray-400">{relativeTime(post.created_at)}</span>
        )}
      </div>

      {/* Title */}
      <h1 className="text-2xl font-light tracking-tight text-gray-900 leading-tight mb-6">
        {post.title}
      </h1>

      {/* Image */}
      {post.image_url && (
        <div className="overflow-hidden rounded-xl mb-6 bg-gray-50" style={{ maxHeight: 480 }}>
          <img src={post.image_url} alt="" className="w-full object-cover" style={{ maxHeight: 480 }} />
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap mb-8">
        {post.description}
      </p>

      {/* Footer info */}
      <div className="border-t border-gray-100 pt-6 space-y-3">
        {post.location && (
          <div>
            <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-gray-300 mb-1">Location</p>
            <p className="text-[13px] text-gray-500">📍 {post.location}</p>
          </div>
        )}
        {post.link && (
          <div>
            <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-gray-300 mb-1">Link</p>
            <a
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-gray-500 hover:text-gray-900 underline break-all transition-colors"
            >
              {post.link} ↗
            </a>
          </div>
        )}
        <div>
          <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-gray-300 mb-1">
            {t('제출자', 'Submitted by', 'Soumis par')}
          </p>
          <p className="text-[13px] text-gray-500">{post.contact}</p>
        </div>
      </div>
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
