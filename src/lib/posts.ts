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
  view_count?: number
}

export interface PostComment {
  id: string
  post_id: string
  author_name: string
  author_avatar: string
  body: string
  is_private: boolean
  guest_name?: string
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

export async function updatePost(id: string, fields: { title_ko?: string; body_ko?: string; body_en?: string; body_fr?: string }): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('channel_posts').update(fields).eq('id', id)
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

export async function toggleLike(postId: string, userId: string, liked: boolean): Promise<void> {
  if (!supabase) return
  if (liked) {
    const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
    if (error) throw error
  } else {
    const { error } = await supabase.from('post_likes').upsert({ post_id: postId, user_id: userId })
    if (error) throw error
  }
}

export async function incrementPostView(postId: string): Promise<void> {
  if (!supabase) return
  await supabase.rpc('increment_post_view', { post_id: postId })
}

export async function getCommentCounts(postIds: string[]): Promise<Record<string, number>> {
  if (!supabase || postIds.length === 0) return {}
  const { data } = await supabase
    .from('post_comments')
    .select('post_id')
    .in('post_id', postIds)
  const counts: Record<string, number> = {}
  for (const row of (data ?? [])) {
    counts[row.post_id] = (counts[row.post_id] ?? 0) + 1
  }
  return counts
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

export async function updateComment(id: string, body: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('post_comments').update({ body }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteComment(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('post_comments').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function addComment(
  postId: string,
  authorName: string,
  authorAvatar: string,
  body: string,
  isPrivate = false,
  guestName?: string,
): Promise<PostComment | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('post_comments')
    .insert([{ post_id: postId, author_name: authorName, author_avatar: authorAvatar, body, is_private: isPrivate, guest_name: guestName ?? null }])
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}
