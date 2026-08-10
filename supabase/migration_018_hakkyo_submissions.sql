-- Migration 018 — hakkyo_submissions + chat_messages
-- Replaces direct `applications` table inserts from new public pages.
-- All form submissions (newsletter, program, activity, community) go here.
-- Q&A chatbot messages go to chat_messages.
-- Both tables auto-insert an admin_notification on new row via trigger.

-- ── 1. hakkyo_submissions ─────────────────────────────────────────────────────

create table if not exists public.hakkyo_submissions (
  id                  uuid        primary key default gen_random_uuid(),
  kind                text        not null,   -- 'newsletter' | 'program' | 'activity' | 'community'
  selection           text        not null,   -- e.g. '한국어', 'running', 'SESSION 04 NEWS'
  name                text,
  email               text        not null,
  phone               text,
  instagram           text,
  city                text,
  time_in_montreal    text,
  current_stage       text,
  language_level      text,
  learning_experience text,
  speaking_barrier    text,
  goal                text,
  preferred_class_style text,
  experience          text,
  join_reason         text,
  comfort             text,
  availability        text,
  preferred_location  text,
  discovery           text,
  message             text,
  language            text,
  interests           text,
  extra               jsonb       default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

alter table public.hakkyo_submissions enable row level security;

drop policy if exists "anon_insert_hakkyo_submissions" on public.hakkyo_submissions;
create policy "anon_insert_hakkyo_submissions"
  on public.hakkyo_submissions for insert to anon with check (true);

drop policy if exists "auth_all_hakkyo_submissions" on public.hakkyo_submissions;
create policy "auth_all_hakkyo_submissions"
  on public.hakkyo_submissions for all to authenticated
  using (true) with check (true);

create index if not exists idx_hakkyo_submissions_kind on public.hakkyo_submissions(kind);
create index if not exists idx_hakkyo_submissions_created on public.hakkyo_submissions(created_at desc);


-- ── 2. chat_messages ──────────────────────────────────────────────────────────

create table if not exists public.chat_messages (
  id         uuid        primary key default gen_random_uuid(),
  name       text,
  email      text,
  message    text        not null,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

drop policy if exists "anon_insert_chat_messages" on public.chat_messages;
create policy "anon_insert_chat_messages"
  on public.chat_messages for insert to anon with check (true);

drop policy if exists "auth_all_chat_messages" on public.chat_messages;
create policy "auth_all_chat_messages"
  on public.chat_messages for all to authenticated
  using (true) with check (true);

create index if not exists idx_chat_messages_created on public.chat_messages(created_at desc);


-- ── 3. analytics_events (if not yet created) ─────────────────────────────────

create table if not exists public.analytics_events (
  id           uuid        primary key default gen_random_uuid(),
  event_name   text        not null,
  page_path    text,
  target_type  text,
  target_id    text,
  target_label text,
  user_id      uuid,
  metadata     jsonb       default '{}'::jsonb,
  created_at   timestamptz default now()
);

alter table public.analytics_events enable row level security;

drop policy if exists "anon_insert_analytics_events" on public.analytics_events;
create policy "anon_insert_analytics_events"
  on public.analytics_events for insert to anon with check (true);

drop policy if exists "auth_all_analytics_events" on public.analytics_events;
create policy "auth_all_analytics_events"
  on public.analytics_events for all to authenticated
  using (true) with check (true);


-- ── 4. Auto-notify admin on new submission ────────────────────────────────────

create or replace function public.notify_admin_on_submission()
returns trigger language plpgsql security definer as $$
declare
  _title   text;
  _message text;
begin
  _title   := case new.kind
    when 'newsletter' then '뉴스레터 신청'
    when 'program'    then '프로그램 신청: ' || new.selection
    when 'activity'   then '액티비티 신청: ' || new.selection
    when 'community'  then '커뮤니티 참여 신청'
    else '새 신청: ' || new.kind
  end;
  _message := coalesce(new.name, '(이름 없음)') || ' · ' || new.email;

  insert into public.admin_notifications(type, title, message, related_table, related_id)
  values ('submission', _title, _message, 'hakkyo_submissions', new.id::text);

  return new;
end;
$$;

drop trigger if exists trg_notify_admin_on_submission on public.hakkyo_submissions;
create trigger trg_notify_admin_on_submission
  after insert on public.hakkyo_submissions
  for each row execute procedure public.notify_admin_on_submission();


-- ── 5. Auto-notify admin on new chat message ──────────────────────────────────

create or replace function public.notify_admin_on_chat()
returns trigger language plpgsql security definer as $$
begin
  insert into public.admin_notifications(type, title, message, related_table, related_id)
  values (
    'chat',
    'Q&A 메시지: ' || coalesce(new.name, '(이름 없음)'),
    coalesce(new.email, '') || ' — ' || left(new.message, 100),
    'chat_messages',
    new.id::text
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_admin_on_chat on public.chat_messages;
create trigger trg_notify_admin_on_chat
  after insert on public.chat_messages
  for each row execute procedure public.notify_admin_on_chat();
