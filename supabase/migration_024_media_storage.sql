-- ── migration_024_media_storage.sql ──────────────────────────────────────────
-- Creates the public `media` storage bucket used for image/video uploads
-- from the community post compose toolbar.
--
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. Create the bucket (public so CDN URLs work without signed tokens)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800,   -- 50 MB per file
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public             = true,
  file_size_limit    = 52428800,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Public read — anyone can view uploaded files (needed for CDN URLs in posts)
CREATE POLICY "media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- 3. Admin upload — only the three admin emails can upload
--    (authenticated session must match one of these emails)
CREATE POLICY "media_admin_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
    AND auth.email() IN (
      'seojoo1124@gmail.com',
      'zoe.mekhoukh@gmail.com',
      'carol231227@gmail.com'
    )
  );

-- 4. Admin delete — same admins can remove files they uploaded
CREATE POLICY "media_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
    AND auth.email() IN (
      'seojoo1124@gmail.com',
      'zoe.mekhoukh@gmail.com',
      'carol231227@gmail.com'
    )
  );

-- ── site_content unique constraint (needed for FAQ / calendar upserts) ────────
-- Skip if already exists — the DO $$ block handles that gracefully.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'site_content_page_key_key'
  ) THEN
    ALTER TABLE site_content ADD CONSTRAINT site_content_page_key_key UNIQUE (page, key);
  END IF;
END $$;
