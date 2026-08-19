-- migration_020: Mini HAKKYO club metadata in site_content
-- Run this in Supabase SQL editor.
-- Fields editable from Admin > Page Content tab (grouped by page).

INSERT INTO site_content (page, key, label, value_ko, value_en, value_fr)
VALUES
  -- ── 북클럽 ────────────────────────────────────────────
  ('activity_book-club', 'club_title',  '클럽 이름',    '북클럽',        'Book Club',     'Club de lecture'),
  ('activity_book-club', 'club_note',   '한 줄 소개',   '책 한 권으로 시작하는 언어 교환', 'A language exchange that starts with a book', 'Un échange linguistique autour d''un livre'),
  ('activity_book-club', 'club_host',   '진행자',       'Joy',           'Joy',           'Joy'),
  ('activity_book-club', 'club_date',   '날짜',         '9월 9일',       'Sep 9',         '9 sept'),
  ('activity_book-club', 'club_day',    '요일',         '수요일',        'Wednesday',     'mercredi'),
  ('activity_book-club', 'club_time',   '시간',         '오후 7:00–8:30','7–8:30 PM',     '19h–20h30'),
  ('activity_book-club', 'club_entry',  '참가비',       '$10',           '$10',           '10 $'),

  -- ── 러닝클럽 ──────────────────────────────────────────
  ('activity_running-club', 'club_title', '클럽 이름',  '러닝클럽',      'Running Club',  'Club de course'),
  ('activity_running-club', 'club_note',  '한 줄 소개', '달리며 나누는 이야기', 'Stories shared while running', 'Des histoires partagées en courant'),
  ('activity_running-club', 'club_host',  '진행자',     'Joo',           'Joo',           'Joo'),
  ('activity_running-club', 'club_date',  '날짜',       '9월 16일',      'Sep 16',        '16 sept'),
  ('activity_running-club', 'club_day',   '요일',       '수요일',        'Wednesday',     'mercredi'),
  ('activity_running-club', 'club_time',  '시간',       '오후 6:00–7:30','6–7:30 PM',     '18h–19h30'),
  ('activity_running-club', 'club_entry', '참가비',     '$10',           '$10',           '10 $'),

  -- ── 보드게임클럽 ──────────────────────────────────────
  ('activity_boardgame-club', 'club_title', '클럽 이름',  '보드게임클럽',  'Boardgame Club','Club de jeux'),
  ('activity_boardgame-club', 'club_note',  '한 줄 소개', '게임으로 자연스럽게 이어지는 대화', 'Conversations that flow naturally through games', 'Des conversations naturelles autour de jeux'),
  ('activity_boardgame-club', 'club_host',  '진행자',     'Jaehee',       'Jaehee',        'Jaehee'),
  ('activity_boardgame-club', 'club_date',  '날짜',       '9월 23일',     'Sep 23',        '23 sept'),
  ('activity_boardgame-club', 'club_day',   '요일',       '수요일',       'Wednesday',     'mercredi'),
  ('activity_boardgame-club', 'club_time',  '시간',       '오후 7:00–8:30','7–8:30 PM',    '19h–20h30'),
  ('activity_boardgame-club', 'club_entry', '참가비',     '$10',          '$10',           '10 $')

ON CONFLICT (page, key) DO UPDATE SET
  label     = EXCLUDED.label,
  value_ko  = EXCLUDED.value_ko,
  value_en  = EXCLUDED.value_en,
  value_fr  = EXCLUDED.value_fr,
  updated_at = now();
