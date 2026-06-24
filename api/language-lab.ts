export const config = { runtime: 'edge' }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

const LANG_NAME: Record<string, string> = {
  ko: 'Korean',
  en: 'English',
  fr: 'French',
}

const SCENARIO_NAME: Record<string, string> = {
  intro: 'Self Introduction',
  cafe: 'Café Ordering',
  housing: 'Housing Inquiry',
  phone: 'Phone Call',
  job: 'Job Interview',
  free: 'Free Speaking',
}

function buildPrompt(transcript: string, lang: string, scenario: string): string {
  const langName = LANG_NAME[lang] ?? lang
  const scenarioName = SCENARIO_NAME[scenario] ?? scenario
  return `You are a ${langName} language coach. A student just completed a "${scenarioName}" speaking exercise. Analyze their speech below and give structured, encouraging feedback.

Transcript:
"""
${transcript}
"""

Respond ONLY with valid JSON in this exact format:
{
  "overall_score": <integer 0-100>,
  "scores": {
    "pronunciation": <integer 0-10>,
    "grammar": <integer 0-10>,
    "fluency": <integer 0-10>,
    "vocabulary": <integer 0-10>,
    "naturalness": <integer 0-10>
  },
  "strengths": [<up to 3 short strings in ${langName}>,],
  "improvements": [<up to 3 short strings in ${langName}>],
  "practice_sentences": [<3 example sentences in ${langName} relevant to the scenario>]
}

Be encouraging but honest. Score leniently for beginners. Give feedback in ${langName}.`
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS })
  }

  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), { status: 500, headers: CORS })
  }

  let body: { audio_base64: string; mime_type: string; language: string; scenario: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: CORS })
  }

  const { audio_base64, mime_type, language, scenario } = body
  if (!audio_base64 || !language || !scenario) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: CORS })
  }

  // Decode base64 → Uint8Array
  const binaryString = atob(audio_base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  const ext = mime_type === 'audio/mpeg' ? 'mp3'
    : mime_type === 'audio/wav' ? 'wav'
    : mime_type === 'audio/mp4' || mime_type === 'audio/x-m4a' ? 'm4a'
    : mime_type === 'audio/webm' ? 'webm'
    : 'mp3'

  const audioBlob = new Blob([bytes], { type: mime_type || 'audio/mpeg' })

  // 1. Whisper transcription
  const whisperForm = new FormData()
  whisperForm.append('file', audioBlob, `recording.${ext}`)
  whisperForm.append('model', 'whisper-1')
  whisperForm.append('language', language)

  let transcript = ''
  try {
    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: whisperForm,
    })
    if (!whisperRes.ok) {
      const err = await whisperRes.text()
      return new Response(JSON.stringify({ error: 'Whisper failed', detail: err }), { status: 502, headers: CORS })
    }
    const whisperData = await whisperRes.json() as { text: string }
    transcript = whisperData.text?.trim() ?? ''
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Transcription error', detail: String(e) }), { status: 500, headers: CORS })
  }

  if (!transcript) {
    return new Response(JSON.stringify({ error: 'No speech detected in recording' }), { status: 422, headers: CORS })
  }

  // 2. GPT analysis
  let feedback: Record<string, unknown> = {}
  try {
    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          { role: 'system', content: 'You are a language coach. Always respond with valid JSON only.' },
          { role: 'user', content: buildPrompt(transcript, language, scenario) },
        ],
        response_format: { type: 'json_object' },
      }),
    })
    if (!gptRes.ok) {
      const err = await gptRes.text()
      return new Response(JSON.stringify({ error: 'GPT failed', detail: err }), { status: 502, headers: CORS })
    }
    const gptData = await gptRes.json() as { choices: Array<{ message: { content: string } }> }
    const raw = gptData.choices[0]?.message?.content ?? '{}'
    feedback = JSON.parse(raw)
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Analysis error', detail: String(e) }), { status: 500, headers: CORS })
  }

  return new Response(JSON.stringify({ transcript, feedback }), { headers: CORS })
}
