-- ─────────────────────────────────────────────────────────────────────────────
-- HAKKYO Migration 009 — Unify all answers into application_answers
--
-- Problem:
--   Language Exchange applications store answers in flat columns
--   (city, language_level, referral_source, message) on the applications table.
--   Admin display was inconsistent: program apps used application_answers,
--   LE apps used flat columns.
--
-- Fix:
--   1. Drop FK constraint on application_answers.question_id so LE answers
--      (which have no corresponding form_questions row) can be stored with
--      question_id = NULL and rely on question_label_snapshot instead.
--   2. Make question_id nullable for the same reason.
--   3. Also drop the cascade on application_id (preserve answers if app deleted).
--      Actually keep cascade on application_id — that's fine. Drop only question FK.
--
-- After running this, submitLeApplication will insert into application_answers
-- and Admin will read exclusively from application_answers for all app types.
--
-- Run once in: Supabase Dashboard → SQL Editor → Run
-- Safe to re-run (constraint names are deterministic).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Drop FK + cascade from question_id (keeps answers alive when question deleted)
alter table public.application_answers
  drop constraint if exists application_answers_question_id_fkey;

-- 2. Make question_id nullable (LE answers have no form_questions row)
alter table public.application_answers
  alter column question_id drop not null;

-- 3. Ensure snapshot columns exist (idempotent with migration_008)
alter table public.application_answers
  add column if not exists question_label_snapshot text,
  add column if not exists question_type_snapshot  text,
  add column if not exists question_order_snapshot integer;

-- 4. Backfill snapshots for existing program-application rows
update public.application_answers aa
set
  question_label_snapshot = coalesce(
    nullif(fq.question_ko, ''),
    nullif(fq.question_en, ''),
    nullif(fq.question_fr, '')
  ),
  question_type_snapshot  = fq.type,
  question_order_snapshot = fq.order_index
from public.form_questions fq
where aa.question_id = fq.id
  and aa.question_label_snapshot is null;
