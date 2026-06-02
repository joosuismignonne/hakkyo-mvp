import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  console.warn('Supabase env vars not set — using demo mode with mock data.')
}

export const supabase = url && key ? createClient(url, key) : null
export const isConfigured = Boolean(url && key)
