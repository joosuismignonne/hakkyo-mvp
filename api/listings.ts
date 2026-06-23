export const config = { runtime: 'edge' }

const KIJIJI_RSS =
  'https://www.kijiji.ca/rss-srp-apartments-condos/ville-de-montreal/c37l80002a10?rss=true'

// Craigslist Montréal fallback (fully open RSS)
const CL_RSS = 'https://montreal.craigslist.org/search/apa?format=rss'

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'))
  return m ? m[1].trim() : ''
}

function parseKijijiItems(xml: string, max = 10) {
  const results: Array<{
    title: string
    link: string
    price: string | null
    image: string | null
    pubDate: string
    location: string | null
    source: string
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

    const imgMatch = description.match(/src="([^"]+\.(jpg|jpeg|png|webp))"/i)
    const image = imgMatch ? imgMatch[1] : null

    const locMatch = description.match(/<td[^>]*>\s*([A-Za-zÀ-ÿ\s\-]+,\s*(?:QC|Québec|Quebec|Montréal|Montreal)[^<]*)<\/td>/i)
    const location = locMatch ? locMatch[1].trim() : 'Montréal'

    results.push({ title, link, price, image, pubDate, location, source: 'kijiji' })
  }

  return results
}

function parseCLItems(xml: string, max = 10) {
  const results: Array<{
    title: string
    link: string
    price: string | null
    image: string | null
    pubDate: string
    location: string | null
    source: string
  }> = []

  const itemRe = /<item>([\s\S]*?)<\/item>/g
  let m: RegExpExecArray | null

  while ((m = itemRe.exec(xml)) !== null && results.length < max) {
    const chunk = m[1]
    const title = extractTag(chunk, 'title')
    const link = extractTag(chunk, 'link') || extractTag(chunk, 'guid')
    const pubDate = extractTag(chunk, 'pubDate')

    const priceMatch = title.match(/\$[\d,]+/)
    const price = priceMatch ? priceMatch[0] : null

    const encMatch = chunk.match(/<enclosure[^>]+url="([^"]+)"/i)
    const image = encMatch ? encMatch[1] : null

    const locMatch = chunk.match(/<cl:neighborhood>([\s\S]*?)<\/cl:neighborhood>/i)
    const location = locMatch ? locMatch[1].trim() : 'Montréal'

    results.push({ title, link, price, image, pubDate, location, source: 'craigslist' })
  }

  return results
}

export default async function handler(req: Request): Promise<Response> {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
    'Content-Type': 'application/json',
  }

  // Try Kijiji first
  try {
    const res = await fetch(KIJIJI_RSS, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-CA,en;q=0.9,fr;q=0.5',
        Referer: 'https://www.kijiji.ca/',
      },
      signal: AbortSignal.timeout(7000),
    })

    if (res.ok) {
      const xml = await res.text()
      const items = parseKijijiItems(xml, 10)
      if (items.length > 0) {
        return new Response(
          JSON.stringify({ items, source: 'kijiji', updatedAt: new Date().toISOString() }),
          { headers }
        )
      }
    }
  } catch {
    // fall through to Craigslist
  }

  // Fallback: Craigslist Montréal
  try {
    const res = await fetch(CL_RSS, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RSS reader)' },
      signal: AbortSignal.timeout(7000),
    })

    if (res.ok) {
      const xml = await res.text()
      const items = parseCLItems(xml, 10)
      return new Response(
        JSON.stringify({ items, source: 'craigslist', updatedAt: new Date().toISOString() }),
        { headers }
      )
    }

    return new Response(
      JSON.stringify({ error: `Both sources failed (CL: ${res.status})` }),
      { status: 502, headers }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch listings', detail: String(err) }),
      { status: 500, headers }
    )
  }
}
