-- migration_021: Theme colors + community channel config
-- Run in Supabase SQL editor

INSERT INTO site_content (page, key, label, value_ko, value_en, value_fr) VALUES
  -- Theme colors
  ('theme', 'color_sidebar', '사이드바 배경색', '#111116', '#111116', '#111116'),
  ('theme', 'color_accent',  '포인트 색상',    '#f5c542', '#f5c542', '#f5c542'),
  ('theme', 'color_main_bg', '메인 배경색',    '#fafaf7', '#fafaf7', '#fafaf7'),

  -- Community channels
  ('community_channels', 'ch1_icon', '채널1 아이콘', '📢', '📢', '📢'),
  ('community_channels', 'ch1_name', '채널1 이름',  '공지', '공지', '공지'),
  ('community_channels', 'ch1_href', '채널1 링크',  '/board', '/board', '/board'),

  ('community_channels', 'ch2_icon', '채널2 아이콘', '💬', '💬', '💬'),
  ('community_channels', 'ch2_name', '채널2 이름',  '자유게시판', '자유게시판', '자유게시판'),
  ('community_channels', 'ch2_href', '채널2 링크',  '/board', '/board', '/board'),

  ('community_channels', 'ch3_icon', '채널3 아이콘', '🌐', '🌐', '🌐'),
  ('community_channels', 'ch3_name', '채널3 이름',  '언어교환', '언어교환', '언어교환'),
  ('community_channels', 'ch3_href', '채널3 링크',  '/board', '/board', '/board'),

  ('community_channels', 'ch4_icon', '채널4 아이콘', '🏠', '🏠', '🏠'),
  ('community_channels', 'ch4_name', '채널4 이름',  '주거', '주거', '주거'),
  ('community_channels', 'ch4_href', '채널4 링크',  '/board', '/board', '/board'),

  ('community_channels', 'ch5_icon', '채널5 아이콘', '💼', '💼', '💼'),
  ('community_channels', 'ch5_name', '채널5 이름',  '취업·이민', '취업·이민', '취업·이민'),
  ('community_channels', 'ch5_href', '채널5 링크',  '/board', '/board', '/board'),

  ('community_channels', 'ch6_icon', '채널6 아이콘', '📅', '📅', '📅'),
  ('community_channels', 'ch6_name', '채널6 이름',  '이벤트·모임', '이벤트·모임', '이벤트·모임'),
  ('community_channels', 'ch6_href', '채널6 링크',  '/board', '/board', '/board')

ON CONFLICT (page, key) DO UPDATE SET
  label     = EXCLUDED.label,
  value_ko  = EXCLUDED.value_ko,
  value_en  = EXCLUDED.value_en,
  value_fr  = EXCLUDED.value_fr,
  updated_at = now();
