const KIJIJI_RSS =
  'https://www.kijiji.ca/rss-srp-apartments-condos/ville-de-montreal/c37l80002a10?rss=true'

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'))
  return m ? m[1].trim() : ''
}

function parseItems(xml: string, max = 10) {
  const results: Array<{
    title: string
    link: string
    price: string | null
    image: string | null
    pubDate: string
    location: string | null
  }> = []

  const itemRe = /<item>([\s\S]*?)<\/item>/g
  let m: RegExpExecArray | null

  while ((m = itemRe.exec(xml)) !== null && results.length < max) {
    const chunk = m[1]
    const title = extractTag(chunk, 'title')
    const link = extractTag(chunk, 'link') || extractTag(chunk, 'guid')
    const description = extractTag(chunk, 'description')
    const pubDate = extractTag(chunk, 'pubDate')

    const priceMatch = title.match(/\$[\d,]+/)
    const price = priceMatch ? priceMatch[0] : null

    const imgMatch = description.match(/src="([^"]+kijiji[^"]+\.(jpg|jpeg|png|webp))"/i)
    const image = imgMatch ? imgMatch[1] : null

    const locMatch = description.match(/<td[^>]*>\s*([A-Za-zÀ-ÿ\s\-]+,\s*(?:QC|Québec|Quebec|Montréal|Montreal)[^<]*)<\/td>/i)
    const location = locMatch ? locMatch[1].trim() : null

    results.push({ title, link, price, image, pubDate, location })
  }

  return results
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60')

  try {
    const response = await fetch(KIJIJI_RSS, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS/2.0 reader)',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      res.status(502).json({ error: `Kijiji returned ${response.status}` })
      return
    }

    const xml = await response.text()
    const items = parseItems(xml, 10)

    res.json({ items, updatedAt: new Date().toISOString() })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch listings', detail: String(err) })
  }
}
