-- ─────────────────────────────────────────────────────────────────────────────
-- HAKKYO Migration 008 — Question snapshots on application_answers
--
-- Problem:
--   Admin questions can be edited or deleted at any time.
--   application_answers only stores question_id (a FK), so if a question is
--   edited/deleted the original question text is lost and answers become
--   unreadable.
--
-- Fix:
--   Add snapshot columns to application_answers so the question label, type,
--   and order at the time of submission are preserved permanently.
--
-- Run once in: Supabase Dashboard → SQL Editor → Run
-- Safe to re-run (uses IF NOT EXISTS).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.application_answers
  add column if not exists question_label_snapshot text,
  add column if not exists question_type_snapshot  text,
  add column if not exists question_order_snapshot integer;

-- Backfill snapshots for existing rows where the question still exists
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
