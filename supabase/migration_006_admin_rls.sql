-- ─────────────────────────────────────────────────────────────────────────────
-- HAKKYO Migration 006 — Admin RLS + admin_notifications + community_submissions
--
-- Problem:
--   All existing RLS policies are `FOR ALL TO anon` — they only cover
--   unauthenticated (public) users.
--   When an admin signs in they use the `authenticated` role, which has
--   zero matching policies. Supabase silently returns 0 rows on DELETE
--   instead of an error, making deletes appear to work in the UI but
--   never actually touching the database.
--
-- Fix:
--   Add `FOR ALL TO authenticated` policies on every admin-managed table.
--   Authenticated = signed-in admin. Anon = public visitor. Both are safe.
--
-- Run once in: Supabase Dashboard → SQL Editor → Run
-- Safe to re-run (uses DROP IF EXISTS before every CREATE).
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Authenticated policies for existing tables ─────────────────────────────

-- notices
drop policy if exists "auth_all_notices" on notices;
create policy "auth_all_notices"
  on notices for all to authenticated using (true) with check (true);

-- contents
drop policy if exists "auth_all_contents" on contents;
create policy "auth_all_contents"
  on contents for all to authenticated using (true) with check (true);

-- program_tracks
drop policy if exists "auth_all_program_tracks" on program_tracks;
create policy "auth_all_program_tracks"
  on program_tracks for all to authenticated using (true) with check (true);

-- sessions
drop policy if exists "auth_all_sessions" on sessions;
create policy "auth_all_sessions"
  on sessions for all to authenticated using (true) with check (true);

-- form_questions
drop policy if exists "auth_all_form_questions" on form_questions;
create policy "auth_all_form_questions"
  on form_questions for all to authenticated using (true) with check (true);

-- applications (admin read/update only — no public delete)
drop policy if exists "auth_all_applications" on applications;
create policy "auth_all_applications"
  on applications for all to authenticated using (true) with check (true);

-- application_answers
drop policy if exists "auth_all_application_answers" on application_answers;
create policy "auth_all_application_answers"
  on application_answers for all to authenticated using (true) with check (true);

-- track_sessions
drop policy if exists "auth_all_track_sessions" on track_sessions;
create policy "auth_all_track_sessions"
  on track_sessions for all to authenticated using (true) with check (true);


-- ── 2. community_submissions (created outside schema.sql) ─────────────────────

create table if not exists community_submissions (
  id          uuid        primary key default gen_random_uuid(),
  type        text        not null default 'other',
  title       text        not null default '',
  description text        not null default '',
  contact     text        not null default '',
  location    text,
  link        text,
  image_url   text,
  status      text        not null default 'pending'
                          check (status in ('pending','approved','rejected','published')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table community_submissions enable row level security;

-- anon: read published posts only
drop policy if exists "anon_read_published_community" on community_submissions;
create policy "anon_read_published_community"
  on community_submissions for select to anon
  using (status = 'published');

-- anon: insert new submissions (public submit form)
drop policy if exists "anon_insert_community" on community_submissions;
create policy "anon_insert_community"
  on community_submissions for insert to anon
  with check (true);

-- authenticated: full access (admin)
drop policy if exists "auth_all_community_submissions" on community_submissions;
create policy "auth_all_community_submissions"
  on community_submissions for all to authenticated
  using (true) with check (true);


-- ── 3. admin_notifications ────────────────────────────────────────────────────

create table if not exists admin_notifications (
  id            uuid        primary key default gen_random_uuid(),
  type          text        not null default 'general',
  title         text        not null default '',
  message       text        not null default '',
  related_table text,
  related_id    text,
  is_read       boolean     not null default false,
  created_at    timestamptz not null default now()
);

alter table admin_notifications enable row level security;

-- authenticated: full access (only admin reads/writes notifications)
drop policy if exists "auth_all_admin_notifications" on admin_notifications;
create policy "auth_all_admin_notifications"
  on admin_notifications for all to authenticated
  using (true) with check (true);

-- anon: no access (notifications are private)
-- (no policy = blocked by default — correct)


-- ── 4. Indexes ────────────────────────────────────────────────────────────────

create index if not exists idx_community_submissions_status
  on community_submissions(status);

create index if not exists idx_community_submissions_created
  on community_submissions(created_at desc);

create index if not exists idx_admin_notifications_created
  on admin_notifications(created_at desc);

create index if not exists idx_admin_notifications_unread
  on admin_notifications(is_read) where is_read = false;
