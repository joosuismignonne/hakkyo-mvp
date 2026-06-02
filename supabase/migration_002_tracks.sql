-- ─────────────────────────────────────────────────────────────────────────────
-- HAKKYO Migration 002 — Program Tracks
-- Run in Supabase SQL Editor.
-- Safe to run on top of the existing schema (migration_001 / schema.sql).
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. program_tracks ────────────────────────────────────────────────────────
create table if not exists program_tracks (
  id               uuid          primary key default gen_random_uuid(),
  name_ko          text          not null default '',
  name_en          text          not null default '',
  name_fr          text          not null default '',
  category         text          not null default 'program'
                                 check (category in ('program','community')),
  price_per_class  numeric(10,2) not null default 0,
  class_count      integer       not null default 0,
  -- null means "auto = price_per_class × class_count"; a set value is a manual override
  total_price      numeric(10,2),
  currency         text          not null default 'CAD',
  start_date       date,
  end_date         date,
  duration_weeks   integer,
  day_of_week      text          not null default '',
  time             text          not null default '',
  location         text          not null default '',
  capacity         integer       not null default 12,
  enrolled         integer       not null default 0,
  description_ko   text          not null default '',
  description_en   text          not null default '',
  description_fr   text          not null default '',
  notes            text          not null default '',
  recommended      boolean       not null default false,
  status           text          not null default 'open'
                                 check (status in ('open','closed')),
  is_free          boolean       not null default false,
  created_at       timestamptz   not null default now()
);

-- ── 2. track_sessions (junction) ──────────────────────────────────────────────
create table if not exists track_sessions (
  id         uuid      primary key default gen_random_uuid(),
  track_id   uuid      not null references program_tracks(id) on delete cascade,
  session_id uuid      not null references sessions(id) on delete cascade,
  unique (track_id, session_id)
);

-- ── 3. Add track_id to applications ──────────────────────────────────────────
alter table applications
  add column if not exists track_id uuid references program_tracks(id) on delete set null;

-- Make session_id nullable (new applications use track_id instead)
alter table applications
  alter column session_id drop not null;


-- ── 4. Indexes ────────────────────────────────────────────────────────────────
create index if not exists idx_program_tracks_category    on program_tracks(category);
create index if not exists idx_program_tracks_recommended on program_tracks(recommended desc);
create index if not exists idx_track_sessions_track       on track_sessions(track_id);
create index if not exists idx_applications_track         on applications(track_id);


-- ── 5. RLS ────────────────────────────────────────────────────────────────────
alter table program_tracks  enable row level security;
alter table track_sessions  enable row level security;

do $$ begin
  drop policy if exists "anon_all_program_tracks" on program_tracks;
  drop policy if exists "anon_all_track_sessions" on track_sessions;
exception when others then null;
end $$;

create policy "anon_all_program_tracks"
  on program_tracks for all to anon using (true) with check (true);

create policy "anon_all_track_sessions"
  on track_sessions for all to anon using (true) with check (true);


-- ── 6. Seed tracks (only if table is empty) ──────────────────────────────────
-- These are templates. Link them to sessions via Admin → Tracks after seeding.

insert into program_tracks (
  name_ko, name_en, name_fr, category,
  price_per_class, class_count, total_price, currency,
  duration_weeks, day_of_week, time, location, capacity,
  description_ko, description_en, description_fr,
  recommended, status, is_free
)
select * from (values
  (
    '풀 트랙', 'Full Track', 'Formule complète', 'program',
    30, 12, 360, 'CAD',
    6, 'Mon / Wed / Fri', '19:00 – 20:30', 'HAKKYO Space, Montréal', 10,
    '영어 수업 + 불어 수업 + 액티브 아웃풋으로 구성된 풀 코스입니다. 가장 효과적인 학습 방법을 제공합니다.',
    'English class + French class + Active Output. The most complete learning experience at HAKKYO.',
    'Cours d''anglais + cours de français + Active Output. L''expérience d''apprentissage la plus complète.',
    true, 'open', false
  ),
  (
    '영어 트랙', 'English Track', 'Formule anglais', 'program',
    30, 8, 240, 'CAD',
    6, 'Mon / Wed', '19:00 – 20:30', 'HAKKYO Space, Montréal', 12,
    '영어 수업과 액티브 아웃풋으로 구성된 영어 집중 코스입니다.',
    'English class + Active Output — focused English immersion over 6 weeks.',
    'Cours d''anglais + Active Output — immersion en anglais sur 6 semaines.',
    false, 'open', false
  ),
  (
    '불어 트랙', 'French Track', 'Formule français', 'program',
    30, 8, 240, 'CAD',
    6, 'Tue / Thu', '18:00 – 19:30', 'HAKKYO Space, Montréal', 12,
    '불어 수업과 액티브 아웃풋으로 구성된 불어 집중 코스입니다. 몬트리올 현지 불어에 집중합니다.',
    'French class + Active Output — focused on the real French of Montréal.',
    'Cours de français + Active Output — centré sur le français réel de Montréal.',
    false, 'open', false
  ),
  (
    '단일 수업', 'Single Class', 'Cours individuel', 'program',
    30, 1, null, 'CAD',
    null, 'TBD', 'TBD', 'HAKKYO Space, Montréal', 12,
    '영어 또는 불어 수업 중 하나를 단독으로 수강합니다.',
    'Take a single class — English only or French only.',
    'Un seul cours — anglais uniquement ou français uniquement.',
    false, 'open', false
  ),
  (
    '언어 교환', 'Language Exchange', 'Échange linguistique', 'community',
    0, 0, 0, 'CAD',
    null, 'Sunday', '14:00 – 16:00', 'HAKKYO Space, Montréal', 20,
    '한국어, 영어, 불어를 함께 나누는 무료 커뮤니티 이벤트입니다. 누구나 참여할 수 있습니다.',
    'A free community conversation event — Korean, English, and French together. Open to all.',
    'Un événement de conversation communautaire gratuit — coréen, anglais et français ensemble.',
    false, 'open', true
  )
) as v(
  name_ko, name_en, name_fr, category,
  price_per_class, class_count, total_price, currency,
  duration_weeks, day_of_week, time, location, capacity,
  description_ko, description_en, description_fr,
  recommended, status, is_free
)
where not exists (select 1 from program_tracks limit 1);
