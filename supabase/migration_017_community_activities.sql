-- Migration 017 — community_activities table
-- Admin-managed list of recurring/one-off community activities (e.g. Wednesday
-- movie night, running club, history class) shown publicly on /programs.
create table if not exists public.community_activities (
  id               uuid         primary key default gen_random_uuid(),
  emoji            text,
  title_ko         text         not null,
  title_en         text,
  title_fr         text,
  activity_date    date         not null,
  time_range       text,
  location_name    text,
  location_address text,
  google_maps_url  text,
  notes            text,
  status           text         not null default 'active' check (status in ('active', 'archived')),
  created_at       timestamptz  default now()
);

create index if not exists community_activities_date_idx
  on public.community_activities (activity_date);

alter table public.community_activities enable row level security;

-- Public can only read active activities — matches how this app already
-- gates admin-managed content: admin access itself is enforced client-side
-- (RequireAdmin.tsx email allowlist), so writes are scoped to "authenticated"
-- rather than a separate DB-level admin role, consistent with other tables.
create policy "Anyone can read active activities"
  on public.community_activities for select
  using (status = 'active');

create policy "Authenticated users can manage activities"
  on public.community_activities for all
  to authenticated
  using (true)
  with check (true);
