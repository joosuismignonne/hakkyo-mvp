-- Migration 016: Insert HAKKYO Session 03 — English + French + Active Output combined course
-- Run once in: Supabase Dashboard → SQL Editor → Run
-- This creates ONE combined program card. Does NOT touch the existing Korean Course.

INSERT INTO program_tracks (
  name_ko,
  name_en,
  name_fr,
  category,
  price_per_class,
  class_count,
  total_price,
  currency,
  start_date,
  end_date,
  duration_weeks,
  day_of_week,
  time,
  location,
  capacity,
  enrolled,
  status,
  is_free,
  recommended,
  is_pinned,
  target_audience,
  included_sessions,
  output_tags,
  class_schedule,
  venue_name,
  venue_city,
  notes,
  description_ko,
  description_en,
  description_fr,
  instructor_name,
  instructor_bio,
  overview,
  target_participants,
  learning_outcomes,
  application_deadline
)
VALUES (
  -- Korean name
  'English + French + Active Output 통합 과정',

  -- English name
  'English + French + Active Output Course',

  -- French name
  'Cours combiné English + French + Active Output',

  -- category
  'program',

  -- price_per_class (per week)
  57,

  -- class_count (weeks)
  4,

  -- total_price
  228,

  -- currency
  'CAD',

  -- start_date
  '2026-07-05',

  -- end_date
  '2026-07-26',

  -- duration_weeks
  4,

  -- day_of_week
  'Sunday',

  -- time (overall block)
  '12:00 – 16:15',

  -- location
  'SUM Gourmand, Montréal',

  -- capacity
  6,

  -- enrolled
  0,

  -- status
  'open',

  -- is_free
  false,

  -- recommended
  true,

  -- is_pinned
  true,

  -- target_audience
  'montreal_local',

  -- included_sessions (JSON array)
  '["English Class", "French Class", "Active Output"]',

  -- output_tags (JSON array)
  '["English Speaking", "Québec French", "Active Output"]',

  -- class_schedule (displayed on card / detail page)
  E'매주 일요일 (Every Sunday)\n\nEnglish     12:00 – 13:15\nFrench      13:30 – 14:45\nActive Output  15:00 – 16:15',

  -- venue_name
  'SUM Gourmand',

  -- venue_city
  'Montréal',

  -- notes (admin-only)
  'HAKKYO Session 03 — 영어+불어+Active Output 통합 1카드. 강사: English=Joy, French=Jaehee, Active Output=HAKKYO Team.',

  -- description_ko
  E'몬트리올에 살면서 영어와 불어를 동시에 향상시키고 싶은 분들을 위한 4주 통합 언어 과정입니다.\n\n매주 일요일, 영어 → 불어 → Active Output 세 가지 수업이 이어지며, 배운 내용을 즉시 말하고 써보는 구조로 설계되어 있어요.\n\n과정 포함 내용:\n• 영어 스피킹 연습 (Joy 강사)\n• 퀘벡 생활에 맞는 입문 불어 (Jaehee 강사)\n• Active Output 말하기/쓰기 실습 (HAKKYO 팀)\n• 자기소개 연습\n• 일상 회화 시나리오\n• 반복 출력을 통한 자신감 키우기',

  -- description_en
  E'A 4-week combined language course for people living in Montréal who want to improve both English and French while practising real output.\n\nEvery Sunday includes English, French, and Active Output sessions back-to-back, so learners can study, speak, and immediately apply what they learn.\n\nCourse includes:\n• English speaking practice (Instructor: Joy)\n• Beginner-friendly French for Québec life (Instructor: Jaehee)\n• Active Output speaking / writing tasks (HAKKYO Team)\n• Self-introduction practice\n• Real-life conversation scenarios\n• Confidence building through repeated output',

  -- description_fr
  E'Un cours de langue combiné de 4 semaines pour les personnes vivant à Montréal qui souhaitent améliorer leur anglais et leur français tout en pratiquant la production réelle.\n\nChaque dimanche comprend des sessions d''anglais, de français et d''Active Output consécutives.\n\nLe cours comprend :\n• Pratique de l''anglais oral (Instructeur : Joy)\n• Français débutant pour la vie au Québec (Instructeur : Jaehee)\n• Tâches de production Active Output (Équipe HAKKYO)\n• Pratique de l''auto-présentation\n• Scénarios de conversation du quotidien\n• Développement de la confiance par la répétition',

  -- instructor_name
  'Joy (English) · Jaehee (French) · HAKKYO Team (Active Output)',

  -- instructor_bio
  'Joy leads the English speaking sessions, Jaehee leads Québec French for beginners, and the HAKKYO Team facilitates Active Output practice.',

  -- overview
  'HAKKYO Session 03 — 4-week Sunday course combining English speaking, Québec French, and Active Output in one block.',

  -- target_participants (JSON array)
  '["몬트리올 거주 한국인", "영어·불어를 동시에 배우고 싶은 분", "실생활 회화 연습이 필요한 분", "Koreans living in Montréal", "Anyone wanting to improve English & French together"]',

  -- learning_outcomes (JSON array)
  '["영어 일상 회화 자신감 향상", "퀘벡 불어 기초 표현 습득", "배운 내용을 즉시 말하고 쓰는 Active Output 루틴 형성", "자기소개 완성", "Improved English conversation confidence", "Basic Québec French for daily life", "Active Output speaking and writing habit"]',

  -- application_deadline
  '2026-07-03'
);
