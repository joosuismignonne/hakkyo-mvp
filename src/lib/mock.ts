import type { Session, ProgramTrack, Notice, Content, FormQuestion } from '../types'

export const MOCK_SESSIONS: Session[] = [
  {
    id: 'S1',
    title_ko: '영어 수업', title_en: 'English Class', title_fr: 'Cours d\'anglais',
    description_ko: '영어로 대화하며 실력을 키우는 수업입니다.',
    description_en: 'Develop your English through real conversation.',
    description_fr: 'Développez votre anglais par la conversation.',
    language: 'english', price: '$30/class', next_date: '2026-01-12',
    day_of_week: 'Monday / Wednesday', time: '19:00 – 20:30',
    location: 'HAKKYO Space, Montréal', capacity: 12, enrolled: 8, status: 'open',
  },
  {
    id: 'S2',
    title_ko: '불어 수업', title_en: 'French Class', title_fr: 'Cours de français',
    description_ko: '몬트리올 불어를 배우고 연습하는 수업입니다.',
    description_en: 'Learn and practice the French of Montréal.',
    description_fr: 'Apprenez et pratiquez le français de Montréal.',
    language: 'french', price: '$30/class', next_date: '2026-01-13',
    day_of_week: 'Tuesday / Thursday', time: '18:00 – 19:30',
    location: 'HAKKYO Space, Montréal', capacity: 12, enrolled: 6, status: 'open',
  },
  {
    id: 'S3',
    title_ko: '한국어 수업', title_en: 'Korean Class', title_fr: 'Cours de coréen',
    description_ko: '한국어 기초부터 회화까지 배우는 수업입니다.',
    description_en: 'Korean language from basics to conversation.',
    description_fr: 'Coréen des bases à la conversation.',
    language: 'korean', price: '$30/class', next_date: '2026-02-01',
    day_of_week: 'Saturday', time: '14:00 – 15:30',
    location: 'HAKKYO Space, Montréal', capacity: 10, enrolled: 0, status: 'open',
  },
  {
    id: 'S4',
    title_ko: '액티브 아웃풋', title_en: 'Active Output', title_fr: 'Active Output',
    description_ko: '말하기 중심의 집중 세션입니다.',
    description_en: 'Speaking-intensive practice session.',
    description_fr: 'Session intensive axée sur la prise de parole.',
    language: 'english', price: '$30/class', next_date: '2026-01-14',
    day_of_week: 'Friday', time: '19:00 – 20:30',
    location: 'HAKKYO Space, Montréal', capacity: 8, enrolled: 5, status: 'open',
  },
  {
    id: 'S5',
    title_ko: '언어 교환', title_en: 'Language Exchange', title_fr: 'Échange linguistique',
    description_ko: '한국어, 영어, 불어를 함께 나누는 무료 커뮤니티 이벤트입니다.',
    description_en: 'A free community event — Korean, English, and French together.',
    description_fr: 'Un événement communautaire gratuit — coréen, anglais et français.',
    language: 'exchange', price: 'Free', next_date: '2026-01-18',
    day_of_week: 'Sunday', time: '14:00 – 16:00',
    location: 'HAKKYO Space, Montréal', capacity: 30, enrolled: 12, status: 'open',
  },
]

export const MOCK_TRACKS: ProgramTrack[] = [
  {
    id: 'T1',
    name_ko: '풀 트랙', name_en: 'Full Track', name_fr: 'Formule complète',
    category: 'program',
    price_per_class: 30, class_count: 12, total_price: 360, currency: 'CAD',
    start_date: '2026-01-12', end_date: '2026-02-20', duration_weeks: 6,
    day_of_week: 'Mon / Wed / Fri', time: '19:00 – 20:30',
    location: 'HAKKYO Space, Montréal', capacity: 10, enrolled: 6,
    description_ko: '영어 수업 + 불어 수업 + 액티브 아웃풋. 가장 효과적인 학습 코스입니다.',
    description_en: 'English class + French class + Active Output — the most complete learning experience at HAKKYO.',
    description_fr: 'Cours d\'anglais + cours de français + Active Output — l\'expérience la plus complète.',
    notes: '', recommended: true, status: 'open', is_free: false,
    target_audience: 'korean_speaker',
    included_sessions: ['English Class', 'French Class', 'Active Output'],
    application_deadline: '2026-01-10',
    class_schedule:
      'English Class | Mon / Wed | 19:00 – 20:30\nFrench Class | Tue / Thu | 18:00 – 19:30\nActive Output | Fri | 19:00 – 20:30',
    venue_name: 'HAKKYO Space',
    venue_city: 'Montréal, QC',
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=HAKKYO+Space+Montreal',
    track_sessions: [
      { session_id: 'S1', session: MOCK_SESSIONS.find(s => s.id === 'S1') },
      { session_id: 'S2', session: MOCK_SESSIONS.find(s => s.id === 'S2') },
      { session_id: 'S4', session: MOCK_SESSIONS.find(s => s.id === 'S4') },
    ],
  },
  {
    id: 'T2',
    name_ko: '영어 트랙', name_en: 'English Track', name_fr: 'Formule anglais',
    category: 'program',
    price_per_class: 30, class_count: 8, total_price: 240, currency: 'CAD',
    start_date: '2026-01-12', end_date: '2026-02-20', duration_weeks: 6,
    day_of_week: 'Mon / Wed', time: '19:00 – 20:30',
    location: 'HAKKYO Space, Montréal', capacity: 12, enrolled: 4,
    description_ko: '영어 수업 + 액티브 아웃풋. 영어에 집중하는 6주 코스입니다.',
    description_en: 'English class + Active Output — focused English immersion over 6 weeks.',
    description_fr: 'Cours d\'anglais + Active Output — immersion en anglais sur 6 semaines.',
    notes: '', recommended: false, status: 'open', is_free: false,
    target_audience: 'korean_speaker',
    included_sessions: ['English Class', 'Active Output'],
    application_deadline: '2026-01-10',
    class_schedule:
      'English Class | Mon / Wed | 19:00 – 20:30\nActive Output | Fri | 19:00 – 20:30',
    venue_name: 'HAKKYO Space',
    venue_city: 'Montréal, QC',
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=HAKKYO+Space+Montreal',
    track_sessions: [
      { session_id: 'S1', session: MOCK_SESSIONS.find(s => s.id === 'S1') },
      { session_id: 'S4', session: MOCK_SESSIONS.find(s => s.id === 'S4') },
    ],
  },
  {
    id: 'T3',
    name_ko: '불어 트랙', name_en: 'French Track', name_fr: 'Formule français',
    category: 'program',
    price_per_class: 30, class_count: 8, total_price: 240, currency: 'CAD',
    start_date: '2026-01-13', end_date: '2026-02-19', duration_weeks: 6,
    day_of_week: 'Tue / Thu', time: '18:00 – 19:30',
    location: 'HAKKYO Space, Montréal', capacity: 12, enrolled: 3,
    description_ko: '불어 수업 + 액티브 아웃풋. 몬트리올 불어에 집중하는 6주 코스입니다.',
    description_en: 'French class + Active Output — focused on the real French of Montréal.',
    description_fr: 'Cours de français + Active Output — centré sur le français réel de Montréal.',
    notes: '', recommended: false, status: 'open', is_free: false,
    target_audience: 'montreal_local',
    included_sessions: ['French Class', 'Active Output'],
    application_deadline: '2026-01-12',
    class_schedule:
      'French Class | Tue / Thu | 18:00 – 19:30\nActive Output | Fri | 19:00 – 20:30',
    venue_name: 'HAKKYO Space',
    venue_city: 'Montréal, QC',
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=HAKKYO+Space+Montreal',
    track_sessions: [
      { session_id: 'S2', session: MOCK_SESSIONS.find(s => s.id === 'S2') },
      { session_id: 'S4', session: MOCK_SESSIONS.find(s => s.id === 'S4') },
    ],
  },
  {
    id: 'T4',
    name_ko: '단일 수업', name_en: 'Single Class', name_fr: 'Cours individuel',
    category: 'program',
    price_per_class: 30, class_count: 1, total_price: null, currency: 'CAD',
    start_date: null, end_date: null, duration_weeks: null,
    day_of_week: 'TBD', time: 'TBD',
    location: 'HAKKYO Space, Montréal', capacity: 12, enrolled: 0,
    description_ko: '영어 또는 불어 수업 중 하나를 단독으로 수강합니다. $30/수업.',
    description_en: 'Take a single class — English only or French only. $30 per class.',
    description_fr: 'Un seul cours au choix — anglais ou français. $30 par cours.',
    notes: '', recommended: false, status: 'open', is_free: false,
    track_sessions: [],
  },
  {
    id: 'T5',
    name_ko: '언어 교환', name_en: 'Language Exchange', name_fr: 'Échange linguistique',
    category: 'community',
    price_per_class: 0, class_count: 0, total_price: 0, currency: 'CAD',
    start_date: null, end_date: null, duration_weeks: null,
    day_of_week: 'Sunday', time: '14:00 – 16:00',
    location: 'HAKKYO Space, Montréal', capacity: 30, enrolled: 12,
    description_ko: '한국어, 영어, 불어를 함께 나누는 무료 커뮤니티 이벤트입니다. 누구나 참여할 수 있습니다.',
    description_en: 'A free community conversation event — Korean, English, and French together. Open to all.',
    description_fr: 'Un événement de conversation communautaire gratuit. Ouvert à tous.',
    notes: '', recommended: false, status: 'open', is_free: true,
    application_deadline: '2026-01-17',
    class_schedule: 'Language Exchange | Sun | 14:00 – 16:00',
    venue_name: 'HAKKYO Space',
    venue_city: 'Montréal, QC',
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=HAKKYO+Space+Montreal',
    track_sessions: [
      { session_id: 'S5', session: MOCK_SESSIONS.find(s => s.id === 'S5') },
    ],
  },
]

export const MOCK_NOTICES: Notice[] = [
  {
    id: 'N1',
    title_ko: 'HAKKYO 시즌 3 공식 개막', title_en: 'HAKKYO Season 3 — Now Open', title_fr: 'HAKKYO Saison 3 — Maintenant ouverte',
    body_ko: '2026년 1월부터 시즌 3가 공식적으로 시작됩니다. Programs 페이지에서 신청하세요.',
    body_en: 'Season 3 officially begins in January 2026. Apply on the Programs page.',
    body_fr: 'La Saison 3 commence en janvier 2026. Inscrivez-vous sur la page Programs.',
    type: 'notice', date: '2025-12-15',
  },
  {
    id: 'N2',
    title_ko: '1월 12일 풀 트랙 시작', title_en: 'Full Track starts Jan 12', title_fr: 'Formule complète — début 12 janvier',
    body_ko: '풀 트랙 첫 수업이 1월 12일 월요일 19:00에 시작됩니다.',
    body_en: 'Full Track first class: Monday Jan 12, 19:00. HAKKYO Space.',
    body_fr: 'Premier cours Formule complète : lundi 12 janvier, 19h. HAKKYO Space.',
    type: 'schedule', date: '2026-01-12',
  },
  {
    id: 'N3',
    title_ko: '언어 교환 — 1월 18일', title_en: 'Language Exchange — Jan 18', title_fr: 'Échange linguistique — 18 janvier',
    body_ko: '1월 언어 교환 이벤트. 무료 참여. 14:00 시작.',
    body_en: 'January Language Exchange event. Free entry. Starts 14:00.',
    body_fr: 'Échange linguistique de janvier. Entrée libre. Début à 14h.',
    type: 'event', date: '2026-01-18',
  },
]

export const MOCK_CONTENTS: Content[] = [
  {
    id: 'C1',
    title_ko: '몬트리올의 겨울과 언어', title_en: 'Winter in Montreal and Language', title_fr: 'L\'hiver à Montréal et la langue',
    body_ko: '겨울 몬트리올에서 불어를 배운다는 것의 의미에 대한 기록.',
    body_en: `## A season of listening

Montreal in winter slows everything down — including how we learn to speak.

- Long walks between classes
- Coffee after language exchange
- Notes passed between new friends

Watch a conversation we hosted last season:
https://www.youtube.com/watch?v=dQw4w9WgXcQ

![Montreal street in winter](https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=1200&q=80)

> Language is not only grammar. It is weather, habit, and courage.`,
    body_fr: 'Un documentaire sur le sens d\'apprendre le français à Montréal en hiver.',
    category: 'language',
    type: 'video',
    thumbnail_url: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=1200&q=80',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    published_at: '2025-11-15',
  },
  {
    id: 'C2',
    title_ko: '세 언어로 사는 것에 대하여', title_en: 'On Living in Three Languages', title_fr: 'Sur la vie en trois langues',
    body_ko: '한국어, 영어, 불어 사이에서 정체성을 찾는 이야기.',
    body_en: `## Three languages, one city

Finding identity between Korean, English, and French means accepting that you will never sound the same in every room.

### What we heard from members

1. Korean for warmth and memory
2. English for work and study
3. French for everyday Montreal

[Read our community guidelines](https://example.com)`,
    body_fr: 'Trouver une identité entre le coréen, l\'anglais et le français.',
    category: 'culture',
    type: 'text',
    published_at: '2025-06-10',
  },
]

export const MOCK_QUESTIONS: FormQuestion[] = [
  {
    id: 'Q1',
    question_ko: '현재 거주 도시는 어디인가요?', question_en: 'What city do you currently live in?',
    question_fr: 'Dans quelle ville vivez-vous actuellement?',
    type: 'text', required: true, track_id: null, order_index: 1, session_id: null,
  },
  {
    id: 'Q2',
    question_ko: '현재 언어 수준은 어떻게 되나요?', question_en: 'What is your current language level?',
    question_fr: 'Quel est votre niveau actuel?',
    type: 'select', options: 'Beginner,Intermediate,Advanced,Native',
    required: true, track_id: null,order_index: 2, session_id: null,
  },
  {
    id: 'Q3',
    question_ko: '어떤 경로로 HAKKYO를 알게 되셨나요?', question_en: 'How did you hear about HAKKYO?',
    question_fr: 'Comment avez-vous entendu parler de HAKKYO?',
    type: 'select', options: 'Instagram,Friend,Google,Other',
    required: false, track_id: null, order_index: 3, session_id: null,
  },
  {
    id: 'Q4',
    question_ko: '참여 목표를 알려주세요.', question_en: 'What is your main goal for joining?',
    question_fr: 'Quel est votre principal objectif?',
    type: 'textarea', required: false, track_id: null, order_index: 4, session_id: null,
  },
]
