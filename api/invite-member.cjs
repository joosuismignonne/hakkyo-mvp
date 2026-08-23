const https = require('https')
const url   = require('url')

function post(targetUrl, data, headers) {
  return new Promise((resolve, reject) => {
    const parsed = url.parse(targetUrl)
    const body   = JSON.stringify(data)
    const req    = https.request({
      hostname: parsed.hostname,
      path:     parsed.path,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers },
    }, res => {
      let raw = ''
      res.on('data', c => { raw += c })
      res.on('end', () => resolve({ status: res.statusCode, body: raw }))
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })

  try {
    const { email } = req.body || {}
    if (!email) return res.status(400).json({ error: 'email required' })

    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' })
    }

    const result = await post(
      `${supabaseUrl}/auth/v1/invite`,
      { email, data: { role: 'member' } },
      { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    )

    let parsed = {}
    try { parsed = JSON.parse(result.body) } catch {}

    if (result.status >= 400) {
      return res.status(400).json({ error: parsed.msg || parsed.error_description || parsed.error || result.body || '초대 실패' })
    }
    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'internal error' })
  }
}
