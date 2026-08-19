import { supabase } from './supabase'

export interface ChannelPost {
  id: string
  channel: string
  author_name: string
  author_avatar: string
  author_email?: string
  title_ko: string
  title_en: string
  title_fr: string
  body_ko: string
  body_en: string
  body_fr: string
  is_pinned: boolean
  created_at: string
}

export const ADMIN_EMAILS = [
  'seojoo1124@gmail.com',
  'zoe.mekhoukh@gmail.com',
  'carol231227@gmail.com',
]

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email)
}

export async function getChannelPosts(channel: string): Promise<ChannelPost[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('channel_posts')
    .select('*')
    .eq('channel', channel)
    .order('created_at', { ascending: false })
  if (error) { console.warn('getChannelPosts:', error.message); return [] }
  return data ?? []
}

export async function createPost(post: Omit<ChannelPost, 'id' | 'created_at'>): Promise<ChannelPost | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('channel_posts')
    .insert([post])
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deletePost(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('channel_posts').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function togglePin(id: string, is_pinned: boolean): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('channel_posts').update({ is_pinned }).eq('id', id)
  if (error) throw new Error(error.message)
}
