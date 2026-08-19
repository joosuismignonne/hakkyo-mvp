-- channels: Discord-style dynamic channel list, admin-managed
CREATE TABLE IF NOT EXISTS channels (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text        NOT NULL UNIQUE,
  name        text        NOT NULL,
  icon        text        NOT NULL DEFAULT '#',
  description text        NOT NULL DEFAULT '',
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "channels_read"        ON channels;
DROP POLICY IF EXISTS "channels_admin_write" ON channels;

CREATE POLICY "channels_read" ON channels
  FOR SELECT USING (true);

CREATE POLICY "channels_admin_write" ON channels
  FOR ALL USING (
    (auth.jwt() ->> 'email') IN (
      'seojoo1124@gmail.com',
      'zoe.mekhoukh@gmail.com',
      'carol231227@gmail.com'
    )
  );

-- Seed default channels (idempotent)
INSERT INTO channels (slug, name, icon, description, sort_order) VALUES
  ('board',    '공지',       '📢', '공식 소식과 공지사항',           0),
  ('reviews',  '리뷰',       '⭐', '수강생 솔직 후기',               1),
  ('chat',     '자유게시판', '💬', '자유롭게 이야기해요',            2),
  ('exchange', '언어교환',   '🌐', '언어를 함께 배우고 교환해요',   3),
  ('housing',  '주거',       '🏠', '몬트리올 주거 정보와 경험을 나눠요', 4),
  ('jobs',     '취업·이민', '💼', '일과 이민에 대한 이야기',         5),
  ('events',   '이벤트·모임','📅', '같이 뭔가 하고 싶은 분들',      6)
ON CONFLICT (slug) DO NOTHING;
