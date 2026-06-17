-- Migration 014 — analytics event_logs table
create table if not exists public.event_logs (
  id           uuid         primary key default gen_random_uuid(),
  event_name   text         not null,
  page_path    text,
  target_type  text,
  target_id    text,
  target_label text,
  user_id      uuid,
  metadata     jsonb        default '{}'::jsonb,
  created_at   timestamptz  default now()
);

alter table public.event_logs enable row level security;

create policy "Anyone can insert event logs"
  on public.event_logs for insert
  with check (true);

create policy "Only authenticated users can read event logs"
  on public.event_logs for select
  to authenticated
  using (true);
