-- ─────────────────────────────────────────────────────────────────────────────
-- HAKKYO Migration 010 — Question tagging system
--
-- Adds:
--   form_questions.question_tags  text[]  — which language/class tags this
--                                           question applies to (empty = global)
--   program_tracks.program_tags   text[]  — language/class tags for this track
--
-- Tag vocabulary: korean | english | french | active_output
--
-- Visibility rule (applied in the application form):
--   Show question if:
--     question_tags is empty/null  (global)
--     OR question_tags && program_tags  (array overlap)
--     OR legacy session_id matches the selected track id
--
-- Run once in: Supabase Dashboard → SQL Editor → Run
-- Safe to re-run (IF NOT EXISTS / does nothing if already present).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add question_tags to form_questions
alter table public.form_questions
  add column if not exists question_tags text[] not null default '{}';

-- 2. Add program_tags to program_tracks
alter table public.program_tracks
  add column if not exists program_tags text[] not null default '{}';

-- 3. Index for fast overlap queries (GIN on array columns)
create index if not exists idx_fq_question_tags
  on public.form_questions using gin (question_tags);

create index if not exists idx_pt_program_tags
  on public.program_tracks using gin (program_tags);
