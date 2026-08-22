const WEBHOOK = import.meta.env.VITE_DISCORD_WEBHOOK as string | undefined

interface DiscordEmbed {
  title: string
  description?: string
  color: number
  fields?: { name: string; value: string; inline?: boolean }[]
  footer?: { text: string }
  timestamp?: string
}

async function send(embed: DiscordEmbed): Promise<void> {
  if (!WEBHOOK) return
  try {
    await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })
  } catch {
    // never throw — notifications must never break UX
  }
}

// ─── 📋 프로그램 신청서 ──────────────────────────────────────────────────────
export function notifyProgramApplication(opts: {
  name: string
  email: string
  track: string
}) {
  return send({
    title: '📋 새 프로그램 신청서',
    color: 0x5b8af5,
    fields: [
      { name: '이름',      value: opts.name,  inline: true },
      { name: '이메일',    value: opts.email, inline: true },
      { name: '트랙',      value: opts.track, inline: true },
    ],
    footer: { text: 'HAKKYO Admin' },
    timestamp: new Date().toISOString(),
  })
}

// ─── 🏃 Mini HAKKYO 액티비티 신청 ───────────────────────────────────────────
export function notifyActivityApplication(opts: {
  name: string
  email: string
  activity: string
}) {
  return send({
    title: '🏃 새 액티비티 신청',
    color: 0xf5c542,
    fields: [
      { name: '이름',      value: opts.name,     inline: true },
      { name: '이메일',    value: opts.email,    inline: true },
      { name: '액티비티',  value: opts.activity, inline: true },
    ],
    footer: { text: 'HAKKYO Admin' },
    timestamp: new Date().toISOString(),
  })
}

// ─── 📰 소식 구독 (뉴스레터) ────────────────────────────────────────────────
export function notifyNewsletterSubscription(opts: {
  email: string
}) {
  return send({
    title: '📰 새 소식 구독',
    color: 0x22c55e,
    fields: [
      { name: '이메일', value: opts.email, inline: true },
    ],
    footer: { text: 'HAKKYO Admin' },
    timestamp: new Date().toISOString(),
  })
}

// ─── 💬 커뮤니티 게시글 ──────────────────────────────────────────────────────
export function notifyCommunityPost(opts: {
  author: string
  title: string
  type: string
}) {
  return send({
    title: '💬 새 커뮤니티 게시글',
    color: 0xa855f7,
    fields: [
      { name: '작성자',  value: opts.author, inline: true },
      { name: '카테고리', value: opts.type,  inline: true },
      { name: '제목',    value: opts.title.slice(0, 100) },
    ],
    footer: { text: 'HAKKYO Admin' },
    timestamp: new Date().toISOString(),
  })
}
