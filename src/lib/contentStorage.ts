import { supabase, isConfigured } from './supabase'

export const CONTENT_IMAGES_BUCKET = 'content-images'

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|svg)$/i
const VIDEO_EXT = /\.(mp4|webm|mov|avi|mkv|m4v)$/i

function storage() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase.storage.from(CONTENT_IMAGES_BUCKET)
}

function safeExt(filename: string): string {
  const part = filename.split('.').pop()?.toLowerCase() ?? ''
  if (/^[a-z0-9]{1,8}$/.test(part)) return part
  return 'jpg'
}

export function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  return IMAGE_EXT.test(file.name)
}

export function filterImageFiles(files: Iterable<File>): File[] {
  return Array.from(files).filter(isImageFile)
}

export function isVideoFile(file: File): boolean {
  if (file.type.startsWith('video/')) return true
  return VIDEO_EXT.test(file.name)
}

/** Upload a video to the content-images bucket under community-videos/; returns public URL. */
export async function uploadCommunityVideo(file: File): Promise<string> {
  if (!isConfigured || !supabase) {
    throw new Error('Supabase is not configured.')
  }
  const ext = safeExt(file.name)
  const path = `community-videos/${crypto.randomUUID()}.${ext}`
  const { error } = await storage().upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  })
  if (error) throw error
  const { data } = storage().getPublicUrl(path)
  if (!data.publicUrl) throw new Error('Failed to get public URL for video.')
  return data.publicUrl
}

/** Upload to content-images bucket; returns public URL. */
export async function uploadContentImage(file: File, folder: string): Promise<string> {
  if (!isConfigured || !supabase) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }
  if (!isImageFile(file)) {
    throw new Error('Only image files can be uploaded.')
  }

  const prefix = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'draft'
  const path = `${prefix}/${crypto.randomUUID()}.${safeExt(file.name)}`

  const { error: uploadError } = await storage().upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  })
  if (uploadError) {
    const msg = uploadError.message ?? 'Storage upload failed.'
    if (/row-level security|RLS/i.test(msg)) {
      throw new Error(
        `${msg} Run supabase/migration_004_content_images_storage_rls.sql in the SQL editor.`,
      )
    }
    throw uploadError
  }

  const { data } = storage().getPublicUrl(path)
  if (!data.publicUrl) throw new Error('Failed to get public URL for uploaded image.')
  return data.publicUrl
}

/** Only persist remote URLs — never blob:, file:, or local paths. */
export function isPublicMediaUrl(url: string | null | undefined): boolean {
  const u = url?.trim() ?? ''
  return u.startsWith('https://') || u.startsWith('http://')
}

export async function uploadContentImages(files: File[], folder: string): Promise<string[]> {
  const images = filterImageFiles(files)
  if (!images.length) throw new Error('No valid image files selected.')
  return Promise.all(images.map(f => uploadContentImage(f, folder)))
}
