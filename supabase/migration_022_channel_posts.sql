-- channel_posts: admin-posted messages shown in each channel
CREATE TABLE IF NOT EXISTS channel_posts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  channel     text        NOT NULL,           -- 'home' | 'reviews' | 'chat' | 'exchange' | 'housing' | 'jobs' | 'events'
  author_name text        NOT NULL DEFAULT 'HAKKYO',
  author_avatar text      NOT NULL DEFAULT '🐱',
  author_email text,
  title_ko    text        NOT NULL DEFAULT '',
  title_en    text        NOT NULL DEFAULT '',
  title_fr    text        NOT NULL DEFAULT '',
  body_ko     text        NOT NULL DEFAULT '',
  body_en     text        NOT NULL DEFAULT '',
  body_fr     text        NOT NULL DEFAULT '',
  is_pinned   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE channel_posts ENABLE ROW LEVEL SECURITY;

-- Everyone can read
DROP POLICY IF EXISTS "channel_posts_read" ON channel_posts;
CREATE POLICY "channel_posts_read" ON channel_posts
  FOR SELECT USING (true);

-- Only admins can write (insert / update / delete)
DROP POLICY IF EXISTS "channel_posts_admin_write" ON channel_posts;
CREATE POLICY "channel_posts_admin_write" ON channel_posts
  FOR ALL USING (
    (auth.jwt() ->> 'email') IN (
      'seojoo1124@gmail.com',
      'zoe.mekhoukh@gmail.com',
      'carol231227@gmail.com'
    )
  );

-- Index for channel feed queries
CREATE INDEX IF NOT EXISTS channel_posts_channel_idx ON channel_posts (channel, created_at DESC);
