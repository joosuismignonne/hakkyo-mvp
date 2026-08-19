import { supabase } from './supabase'
import { ADMIN_EMAILS } from './posts'

export interface Channel {
  id: string
  slug: string
  name: string
  icon: string
  description: string
  sort_order: number
}

export { ADMIN_EMAILS }

export async function getChannels(): Promise<Channel[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) { console.warn('getChannels:', error.message); return [] }
  return data ?? []
}

export async function createChannel(
  ch: Omit<Channel, 'id'>,
): Promise<Channel | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('channels')
    .insert([ch])
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteChannel(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('channels').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function reorderChannel(id: string, sort_order: number): Promise<void> {
  if (!supabase) return
  await supabase.from('channels').update({ sort_order }).eq('id', id)
}
