import { isValidElement, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { youtubeIdFromUrl } from '../lib/newsContent'

function YouTubeEmbed({ id }: { id: string }) {
  return (
    <div className="my-10 aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube.com/embed/${id}`}
        title="YouTube video"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  )
}

function paragraphYouTubeOnly(children: ReactNode): string | null {
  let text = ''
  const hrefs: string[] = []

  const walk = (node: ReactNode) => {
    if (typeof node === 'string') {
      text += node
      return
    }
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }
    if (!isValidElement(node)) return
    const props = node.props as { href?: string; children?: ReactNode }
    if (props.href) hrefs.push(props.href)
    if (props.children) walk(props.children)
  }
  walk(children)

  const trimmed = text.replace(/\s/g, '')
  if (hrefs.length === 1) {
    const yt = youtubeIdFromUrl(hrefs[0])
    if (yt && (!trimmed || trimmed === hrefs[0].replace(/\s/g, ''))) return yt
  }
  if (!hrefs.length && trimmed) {
    const yt = youtubeIdFromUrl(trimmed)
    if (yt) return yt
  }
  return null
}

export default function MarkdownArticle({ markdown }: { markdown: string }) {
  if (!markdown.trim()) {
    return <p className="text-gray-500 text-sm">No content yet.</p>
  }

  return (
    <div className="article-body text-[17px] leading-[1.75] text-gray-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="mt-12 mb-5 text-2xl font-bold text-gray-900 leading-snug tracking-tight first:mt-0">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h2 className="mt-12 mb-5 text-xl font-bold text-gray-900 leading-snug tracking-tight first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-10 mb-4 text-lg font-semibold text-gray-900 leading-snug first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => {
            const yt = paragraphYouTubeOnly(children)
            if (yt) return <YouTubeEmbed id={yt} />
            return (
              <p className="mb-6 text-[17px] leading-[1.75] text-gray-700 last:mb-0">{children}</p>
            )
          },
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
          ul: ({ children }) => (
            <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-6 list-decimal space-y-2 pl-6 text-gray-700">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-[1.75] pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-8 border-l-[3px] border-gray-900 pl-5 text-gray-600">
              <div className="space-y-4 text-[17px] leading-[1.75] italic [&>p]:mb-0">{children}</div>
            </blockquote>
          ),
          hr: () => <hr className="my-12 border-0 border-t border-gray-200" />,
          a: ({ href, children }) => {
            const yt = href ? youtubeIdFromUrl(href) : null
            if (yt && (!children || String(children) === href)) return <YouTubeEmbed id={yt} />
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-900 underline decoration-gray-300 underline-offset-[3px] transition-colors hover:decoration-gray-900"
              >
                {children}
              </a>
            )
          },
          img: ({ src, alt }) =>
            src ? (
              <figure className="my-10">
                <img
                  src={src}
                  alt={alt ?? ''}
                  loading="lazy"
                  className="w-full rounded-lg border border-gray-100"
                />
                {alt && (
                  <figcaption className="mt-2 text-center text-xs text-gray-400">{alt}</figcaption>
                )}
              </figure>
            ) : null,
          pre: ({ children }) => (
            <pre className="my-8 overflow-x-auto rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">
              {children}
            </pre>
          ),
          code: ({ className, children }) => {
            const isBlock = className?.includes('language-')
            if (isBlock) {
              return <code className="font-mono text-sm">{children}</code>
            }
            return (
              <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.9em] text-gray-800">
                {children}
              </code>
            )
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
