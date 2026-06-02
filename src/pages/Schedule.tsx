import { useState, useEffect } from 'react'
import { getNotices } from '../lib/db'
import { useLang } from '../context/LangContext'
import type { Notice } from '../types'

const TYPE_STYLE: Record<Notice['type'], string> = {
  event:    'bg-yellow-light text-yellow-hover',
  schedule: 'bg-blue-50 text-blue-600',
  notice:   'bg-gray-100 text-gray-500',
}

export default function Schedule() {
  const { lang, t } = useLang()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [filter,  setFilter]  = useState<'all' | Notice['type']>('all')

  useEffect(() => {
    getNotices()
      .then(setNotices)
      .catch(err => setError(err.message ?? 'Failed to load notices.'))
      .finally(() => setLoading(false))
  }, [])

  const typeLabel = (type: Notice['type']) =>
    type === 'event'    ? t('Events', 'Events', 'Événements') :
    type === 'schedule' ? t('Hiring', 'Hiring', 'Recrutement') :
    t('Notices', 'Notices', 'Avis')

  const noticeTitle = (n: Notice) =>
    lang === 'ko' ? n.title_ko : lang === 'fr' ? n.title_fr : n.title_en
  const noticeBody = (n: Notice) =>
    lang === 'ko' ? n.body_ko : lang === 'fr' ? n.body_fr : n.body_en

  const visible = filter === 'all' ? notices : notices.filter(n => n.type === filter)

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
          <h1 className="text-2xl font-bold">{t('BOARD', 'BOARD', 'BOARD')}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {t(
              '공지 · 이벤트 · 채용 · 커뮤니티 소모임',
              'Notices · events · hiring · community meetups',
              'Avis · événements · recrutement · rencontres communautaires',
            )}
          </p>
        </div>
        <div className="flex items-center border border-gray-200 rounded overflow-hidden text-sm font-medium">
          {(['all', 'schedule', 'event', 'notice'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={['px-3 py-1.5 transition-colors capitalize',
                filter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50',
              ].join(' ')}>
              {f === 'all' ? t('전체', 'All', 'Tout') : typeLabel(f as Notice['type'])}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-gray-400 text-sm py-10 text-center">
          {t('내용이 없습니다.', 'Nothing here yet.', 'Rien pour l\'instant.')}
        </p>
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
          {visible.map(n => (
            <div key={n.id} className="bg-white px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <span className="text-sm text-gray-400 w-24 shrink-0 pt-0.5">{n.date}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${TYPE_STYLE[n.type]}`}>
                      {typeLabel(n.type)}
                    </span>
                    <h3 className="font-medium text-gray-900 text-sm">{noticeTitle(n)}</h3>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{noticeBody(n)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
