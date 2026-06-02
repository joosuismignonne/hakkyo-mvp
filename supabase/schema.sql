-- ─────────────────────────────────────────────────────────────────────────────
-- HAKKYO MVP — Supabase Schema
-- Paste this entire file into: Supabase Dashboard → SQL Editor → Run
--
-- Safe to run on an empty project. Uses IF NOT EXISTS throughout.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. TABLES ────────────────────────────────────────────────────────────────

create table if not exists sessions (
  id            uuid        primary key default gen_random_uuid(),
  title_ko      text        not null default '',
  title_en      text        not null default '',
  title_fr      text        not null default '',
  description_ko text       not null default '',
  description_en text       not null default '',
  description_fr text       not null default '',
  language      text        not null default 'korean'
                            check (language in ('korean','english','french','exchange')),
  price         text        not null default '',
  next_date     date,
  day_of_week   text        not null default '',
  time          text        not null default '',
  location      text        not null default '',
  capacity      integer     not null default 12,
  enrolled      integer     not null default 0,
  status        text        not null default 'open'
                            check (status in ('open','closed')),
  created_at    timestamptz not null default now()
);

create table if not exists notices (
  id         uuid        primary key default gen_random_uuid(),
  title_ko   text        not null default '',
  title_en   text        not null default '',
  title_fr   text        not null default '',
  body_ko    text        not null default '',
  body_en    text        not null default '',
  body_fr    text        not null default '',
  type       text        not null default 'notice'
                         check (type in ('notice','schedule','event')),
  date       date        not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists contents (
  id           uuid        primary key default gen_random_uuid(),
  title_ko     text        not null default '',
  title_en     text        not null default '',
  title_fr     text        not null default '',
  body_ko      text        not null default '',
  body_en      text        not null default '',
  body_fr      text        not null default '',
  category     text,
  type         text        not null default 'text'
                           check (type in ('video','text','photo','image')),
  link         text,
  thumbnail_url text,
  image_urls   text[]      default '{}',
  video_url    text,
  published_at date        not null default current_date,
  created_at   timestamptz not null default now()
);

create table if not exists form_questions (
  id           uuid        primary key default gen_random_uuid(),
  question_ko  text        not null default '',
  question_en  text        not null default '',
  question_fr  text        not null default '',
  type         text        not null default 'text'
                           check (type in ('text','textarea','select')),
  options      text,                          -- comma-separated values for select
  required     boolean     not null default false,
  order_index  integer     not null default 1,
  session_id   uuid        references sessions(id) on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists applications (
  id         uuid        primary key default gen_random_uuid(),
  session_id uuid        not null references sessions(id) on delete cascade,
  name       text        not null,
  email      text        not null,
  phone      text        not null default '',
  instagram  text        not null default '',
  status     text        not null default 'pending'
                         check (status in ('pending','confirmed','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists application_answers (
  id             uuid        primary key default gen_random_uuid(),
  application_id uuid        not null references applications(id) on delete cascade,
  question_id    uuid        not null references form_questions(id) on delete cascade,
  answer         text        not null default '',
  created_at     timestamptz not null default now()
);


-- ── 2. INDEXES ───────────────────────────────────────────────────────────────

create index if not exists idx_sessions_created         on sessions(created_at);
create index if not exists idx_notices_date             on notices(date desc);
create index if not exists idx_contents_published       on contents(published_at desc);
create index if not exists idx_fq_order                 on form_questions(order_index);
create index if not exists idx_fq_session               on form_questions(session_id);
create index if not exists idx_applications_session     on applications(session_id);
create index if not exists idx_applications_status      on applications(status);
create index if not exists idx_answers_application      on application_answers(application_id);
create index if not exists idx_answers_question         on application_answers(question_id);


-- ── 3. ROW LEVEL SECURITY ────────────────────────────────────────────────────
-- MVP: open access for anon role so the app works without auth.
-- Before going public: restrict admin writes to authenticated users.

alter table sessions           enable row level security;
alter table notices            enable row level security;
alter table contents           enable row level security;
alter table form_questions     enable row level security;
alter table applications       enable row level security;
alter table application_answers enable row level security;

-- Drop any stale policies first (safe to re-run)
do $$ begin
  drop policy if exists "anon_all_sessions"           on sessions;
  drop policy if exists "anon_all_notices"            on notices;
  drop policy if exists "anon_all_contents"           on contents;
  drop policy if exists "anon_all_form_questions"     on form_questions;
  drop policy if exists "anon_all_applications"       on applications;
  drop policy if exists "anon_all_application_answers" on application_answers;
  -- Legacy names from previous schema versions
  drop policy if exists "public read sessions"        on sessions;
  drop policy if exists "service full access sessions" on sessions;
  drop policy if exists "public read notices"         on notices;
  drop policy if exists "service full access notices"  on notices;
  drop policy if exists "public read contents"        on contents;
  drop policy if exists "service full access contents" on contents;
  drop policy if exists "public read form_questions"  on form_questions;
  drop policy if exists "service full access questions" on form_questions;
  drop policy if exists "public insert applications"  on applications;
  drop policy if exists "service full access apps"    on applications;
  drop policy if exists "public insert answers"       on application_answers;
  drop policy if exists "service full access answers" on application_answers;
exception when others then null;
end $$;

create policy "anon_all_sessions"
  on sessions for all to anon using (true) with check (true);

create policy "anon_all_notices"
  on notices for all to anon using (true) with check (true);

create policy "anon_all_contents"
  on contents for all to anon using (true) with check (true);

create policy "anon_all_form_questions"
  on form_questions for all to anon using (true) with check (true);

create policy "anon_all_applications"
  on applications for all to anon using (true) with check (true);

create policy "anon_all_application_answers"
  on application_answers for all to anon using (true) with check (true);


-- ── 4. SEED DATA ─────────────────────────────────────────────────────────────
-- Only inserts if the tables are empty.

insert into sessions (title_ko, title_en, title_fr, description_ko, description_en, description_fr,
                      language, price, next_date, day_of_week, time, location, capacity, enrolled, status)
select * from (values
  ('한국어 교환', 'Korean Exchange', 'Échange en coréen',
   '한국어로 일상 대화를 나누며 서로의 언어와 문화를 교류합니다. 초급자도 환영합니다.',
   'Practice Korean through daily conversation and cultural exchange. All levels welcome.',
   'Pratiquez le coréen en conversation quotidienne. Tous niveaux bienvenus.',
   'korean', '$120/month', '2026-01-09'::date, 'Thursday', '19:00 – 20:30',
   'HAKKYO Space, Montréal', 14, 9, 'open'),

  ('영어 교환', 'English Exchange', 'Échange en anglais',
   '영어로 대화하며 실력을 키우는 공간입니다. 원어민과 학습자가 함께합니다.',
   'Develop your English through real conversation with native speakers and learners.',
   'Développez votre anglais par la conversation avec des locuteurs natifs.',
   'english', '$120/month', '2026-01-14'::date, 'Wednesday', '18:30 – 20:00',
   'HAKKYO Space, Montréal', 12, 12, 'closed'),

  ('불어 교환', 'French Exchange', 'Échange en français',
   '몬트리올 불어를 배우고 연습하는 교환 세션입니다.',
   'Learn and practice the French of Montréal — real, everyday language.',
   'Apprenez et pratiquez le français de Montréal — la vraie langue du quotidien.',
   'french', '$120/month', '2026-01-20'::date, 'Tuesday', '18:00 – 19:30',
   'HAKKYO Space, Montréal', 12, 6, 'open'),

  ('다국어 교환', 'Language Exchange', 'Échange multilingue',
   '한국어, 영어, 불어를 함께 사용하며 진행되는 다언어 교환 세션입니다.',
   'A trilingual exchange — Korean, English, and French in one session.',
   'Un échange trilingue — coréen, anglais et français en une séance.',
   'exchange', 'Free', '2026-01-18'::date, 'Sunday', '14:00 – 16:00',
   'HAKKYO Space, Montréal', 20, 8, 'open')
) as v(title_ko, title_en, title_fr, description_ko, description_en, description_fr,
        language, price, next_date, day_of_week, time, location, capacity, enrolled, status)
where not exists (select 1 from sessions limit 1);

insert into notices (title_ko, title_en, title_fr, body_ko, body_en, body_fr, type, date)
select * from (values
  ('HAKKYO 시즌 3 공식 개막', 'HAKKYO Season 3 — Now Open', 'HAKKYO Saison 3 — Maintenant ouverte',
   '2026년 1월부터 시즌 3가 공식적으로 시작됩니다. 신청은 세션 페이지에서 하실 수 있습니다.',
   'Season 3 officially begins in January 2026. Register on the Sessions page.',
   'La Saison 3 commence officiellement en janvier 2026. Inscrivez-vous sur la page Séances.',
   'notice', '2025-12-15'::date),

  ('1월 9일 한국어 교환 세션', 'Korean Exchange — Jan 9', 'Échange en coréen — 9 janvier',
   '1월 첫 번째 한국어 교환 세션. HAKKYO Space. 19:00 시작.',
   'First Korean exchange session in January. HAKKYO Space. Starts 19:00.',
   'Première séance d''échange coréen. HAKKYO Space. Début à 19h.',
   'schedule', '2026-01-09'::date),

  ('아카이브 상영회 — 1월 25일', 'Archive Screening — Jan 25', 'Projection d''archives — 25 janvier',
   '몬트리올 언어 다큐멘터리 상영회. 무료 입장. 장소 추후 공개.',
   'Montreal language documentary screening. Free entry. Venue TBA.',
   'Projection du documentaire linguistique. Entrée libre. Lieu à confirmer.',
   'event', '2026-01-25'::date)
) as v(title_ko, title_en, title_fr, body_ko, body_en, body_fr, type, date)
where not exists (select 1 from notices limit 1);

insert into contents (title_ko, title_en, title_fr, body_ko, body_en, body_fr, type, link, published_at)
select * from (values
  ('몬트리올의 겨울과 언어', 'Winter in Montreal and Language', 'L''hiver à Montréal et la langue',
   '겨울 몬트리올에서 불어를 배운다는 것의 의미에 대한 기록.',
   'A documentary on what it means to learn French in winter Montreal.',
   'Un documentaire sur le sens d''apprendre le français à Montréal en hiver.',
   'video', null, '2025-11-15'::date),

  ('세 언어로 사는 것에 대하여', 'On Living in Three Languages', 'Sur la vie en trois langues',
   '한국어, 영어, 불어 사이에서 정체성을 찾는 이야기.',
   'Finding identity between Korean, English, and French.',
   'Trouver une identité entre le coréen, l''anglais et le français.',
   'text', null, '2025-06-10'::date)
) as v(title_ko, title_en, title_fr, body_ko, body_en, body_fr, type, link, published_at)
where not exists (select 1 from contents limit 1);

insert into form_questions (question_ko, question_en, question_fr, type, options, required, order_index)
select * from (values
  ('현재 거주 도시는 어디인가요?', 'What city do you currently live in?',
   'Dans quelle ville vivez-vous actuellement?',
   'text', null, true, 1),

  ('현재 언어 수준은 어떻게 되나요?', 'What is your current language level?',
   'Quel est votre niveau actuel?',
   'select', 'Beginner,Intermediate,Advanced,Native', true, 2),

  ('어떤 경로로 HAKKYO를 알게 되셨나요?', 'How did you hear about HAKKYO?',
   'Comment avez-vous entendu parler de HAKKYO?',
   'select', 'Instagram,Friend,Google,Other', false, 3),

  ('언어 교환을 통해 이루고 싶은 목표가 있으신가요?', 'What is your main goal for joining?',
   'Quel est votre principal objectif?',
   'textarea', null, false, 4)
) as v(question_ko, question_en, question_fr, type, options, required, order_index)
where not exists (select 1 from form_questions limit 1);
