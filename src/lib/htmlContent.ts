/** Detect stored HTML vs legacy markdown bodies. */
export function isHtmlBody(body: string): boolean {
  const t = body.trim()
  if (!t) return false
  if (t.startsWith('<')) return true
  return /<(?:p|h[1-6]|ul|ol|li|blockquote|img|div|hr|figure|iframe)\b/i.test(t)
}

export function stripHtmlForExcerpt(html: string, max = 160): string {
  const plain = html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
  if (!plain) return ''
  return plain.length > max ? `${plain.slice(0, max).trim()}…` : plain
}

export function imageHtml(url: string): string {
  const safe = url.replace(/"/g, '&quot;')
  return `<img src="${safe}" alt="image" />`
}
