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
  like_count?: number
}

export interface PostComment {
  id: string
  post_id: string
  author_name: string
  author_avatar: string
  body: string
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

export async function getLikedPostIds(userId: string, postIds: string[]): Promise<Set<string>> {
  if (!supabase || postIds.length === 0) return new Set()
  const { data } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', userId)
    .in('post_id', postIds)
  return new Set((data ?? []).map((r: { post_id: string }) => r.post_id))
}

export async function toggleLike(postId: string, userId: string, liked: boolean): Promise<number> {
  if (!supabase) return 0
  if (liked) {
    await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
  } else {
    await supabase.from('post_likes').upsert({ post_id: postId, user_id: userId })
  }
  const { count } = await supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', postId)
  const newCount = count ?? 0
  await supabase.from('channel_posts').update({ like_count: newCount }).eq('id', postId)
  return newCount
}

export async function getComments(postId: string): Promise<PostComment[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function addComment(postId: string, authorName: string, authorAvatar: string, body: string): Promise<PostComment | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('post_comments')
    .insert([{ post_id: postId, author_name: authorName, author_avatar: authorAvatar, body }])
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}
