const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || process.env.VITE_DISCORD_WEBHOOK_URL || process.env.VITE_DISCORD_WEBHOOK || ''

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') { res.status(405).end(); return }

  if (!WEBHOOK_URL) { res.status(500).json({ error: 'Webhook not configured' }); return }

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }

  let payload

  // Raw embed passthrough (from discord.ts notifications)
  if (body?.embeds) {
    payload = { embeds: body.embeds }
  } else {
    // Legacy chat widget format
    const { email, message, lang } = body || {}
    if (!email || !message) { res.status(400).json({ error: 'Missing fields' }); return }
    payload = {
      embeds: [{
        title: '💬 HAKKYO 문의',
        color: 0x6C63FF,
        fields: [
          { name: '이메일', value: String(email), inline: true },
          { name: '언어',   value: String(lang || 'ko').toUpperCase(), inline: true },
          { name: '메세지', value: String(message) },
        ],
        timestamp: new Date().toISOString(),
      }],
    }
  }

  try {
    const discordRes = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!discordRes.ok) {
      const text = await discordRes.text()
      res.status(502).json({ error: 'Discord error', detail: text }); return
    }
    res.status(200).json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
}
