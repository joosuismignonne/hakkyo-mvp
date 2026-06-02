import { isHtmlBody } from '../lib/htmlContent'
import MarkdownArticle from './MarkdownArticle'

type Props = { body: string }

export default function ArticleBody({ body }: Props) {
  if (!body.trim()) {
    return <p className="text-gray-500 text-sm">No content yet.</p>
  }
  if (isHtmlBody(body)) {
    return (
      <div
        className="article-html-body text-[17px] leading-[1.75] text-gray-700"
        dangerouslySetInnerHTML={{ __html: body }}
      />
    )
  }
  return <MarkdownArticle markdown={body} />
}
