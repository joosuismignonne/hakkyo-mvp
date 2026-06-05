-- ─────────────────────────────────────────────────────────────────────────────
-- HAKKYO Migration 007 — Fix application_answers RLS
--
-- Problem:
--   If this DB was set up via migration_006 alone (not from the full schema.sql),
--   the anon INSERT policy for application_answers may be missing.
--   Without it, anonymous users cannot save answers when submitting an application.
--
-- Fix:
--   Re-apply both anon and authenticated policies for application_answers.
--
-- Run once in: Supabase Dashboard → SQL Editor → Run
-- Safe to re-run (uses DROP IF EXISTS before every CREATE).
-- ─────────────────────────────────────────────────────────────────────────────

-- anon: full access (public submit form inserts answers)
drop policy if exists "anon_all_application_answers" on application_answers;
create policy "anon_all_application_answers"
  on application_answers for all to anon using (true) with check (true);

-- authenticated: full access (admin reads/manages answers)
drop policy if exists "auth_all_application_answers" on application_answers;
create policy "auth_all_application_answers"
  on application_answers for all to authenticated using (true) with check (true);

-- Also re-apply anon policy for applications in case it's missing
drop policy if exists "anon_all_applications" on applications;
create policy "anon_all_applications"
  on applications for all to anon using (true) with check (true);

-- Also re-apply anon policy for form_questions in case it's missing
drop policy if exists "anon_all_form_questions" on form_questions;
create policy "anon_all_form_questions"
  on form_questions for all to anon using (true) with check (true);
