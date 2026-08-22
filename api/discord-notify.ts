import type { VercelRequest, VercelResponse } from '@vercel/node'

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || process.env.VITE_DISCORD_WEBHOOK_URL || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, message, lang } = req.body as { email?: string; message?: string; lang?: string }
  if (!email || !message) return res.status(400).json({ error: 'Missing fields' })

  if (!WEBHOOK_URL) return res.status(500).json({ error: 'Webhook not configured' })

  const payload = {
    embeds: [{
      title: '💬 HAKKYO 문의',
      color: 0x6C63FF,
      fields: [
        { name: '이메일', value: email, inline: true },
        { name: '언어', value: (lang || 'ko').toUpperCase(), inline: true },
        { name: '메세지', value: message },
      ],
      timestamp: new Date().toISOString(),
    }],
  }

  const discordRes = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!discordRes.ok) return res.status(502).json({ error: 'Discord error' })
  return res.status(200).json({ ok: true })
}
