export type Lang = 'ko' | 'en' | 'fr'

export interface Session {
  id: string
  title_ko: string
  title_en: string
  title_fr: string
  description_ko: string
  description_en: string
  description_fr: string
  language: 'korean' | 'english' | 'french' | 'exchange' | 'active_output'
  price: string
  next_date: string
  day_of_week: string
  time: string
  location: string
  capacity: number
  enrolled: number
  status: 'open' | 'closed'
  created_at?: string
}

export interface ProgramTrack {
  id: string
  name_ko: string
  name_en: string
  name_fr: string
  category: 'program' | 'community'
  price_per_class: number
  class_count: number
  total_price: number | null   // null = auto (price_per_class × class_count)
  currency: string
  start_date: string | null
  end_date: string | null
  duration_weeks: number | null
  day_of_week: string
  time: string
  location: string
  capacity: number
  enrolled: number
  description_ko: string
  description_en: string
  description_fr: string
  notes: string
  recommended: boolean
  is_pinned?: boolean | null
  status: 'open' | 'closed'
  is_free: boolean
  target_audience?: string | null
  included_sessions?: string[] | string | null
  /** New: language/class tags used to match questions to this track. */
  program_tags?: QuestionTag[]
  application_deadline?: string | null
  class_schedule?: string | null
  venue_name?: string | null
  venue_city?: string | null
  google_maps_url?: string | null
  created_at?: string
  // ── Detail page fields (nullable; hidden when empty) ──────────────────────
  overview?: string | null
  target_participants?: string[] | null
  learning_outcomes?: string[] | null
  weekly_structure?: Array<{ week: number; title: string; description?: string }> | null
  instructor_name?: string | null
  instructor_bio?: string | null
  instructor_image_url?: string | null
  faq_items?: Array<{ question: string; answer: string }> | null
  /** Short outcome-focused tags shown on program cards, e.g. ["Self Introduction", "Active Output"] */
  output_tags?: string[] | null
  // joined
  track_sessions?: { session_id: string; session?: Session }[]
}

export interface Notice {
  id: string
  title_ko: string
  title_en: string
  title_fr: string
  body_ko: string
  body_en: string
  body_fr: string
  type: 'notice' | 'hiring' | 'event'
  date: string
  is_pinned?: boolean | null
  created_at?: string
  // Optional rich fields (stored in DB when present)
  image_url?:             string | null
  tags?:                  string[] | null
  location_name?:         string | null
  map_url?:               string | null
  instagram_url?:         string | null
  external_url?:          string | null
  related_program_label?: string | null
  related_program_id?:    string | null
  // Joined — populated by getNotices when related_program_id is set
  related_program?:       ProgramTrack | null
}

export type ContentCategory = 'archive' | 'montreal' | 'language' | 'culture'
export type ContentType = 'text' | 'image' | 'video'

export interface Content {
  id: string
  title_ko: string
  title_en: string
  title_fr: string
  body_ko: string
  body_en: string
  body_fr: string
  category?: ContentCategory | null
  type: ContentType | 'photo' // legacy: photo → image at read time
  link?: string
  thumbnail_url?: string | null
  image_urls?: string[] | null
  video_url?: string | null
  is_pinned?: boolean | null
  feature_homepage?: boolean | null
  published_at: string
  created_at?: string
}

export type QuestionTag = 'korean' | 'english' | 'french' | 'active_output'

export interface FormQuestion {
  id: string
  question_ko: string
  question_en: string
  question_fr: string
  type: 'text' | 'textarea' | 'select'
  options?: string
  required: boolean
  order_index: number
  session_id: string | null
  track_id: string | null
  /** New: language/class tags. Empty array = show on all forms. */
  question_tags: QuestionTag[]
  created_at?: string
}

export interface Application {
  id: string
  session_id: string | null   // legacy
  track_id: string | null     // new
  name: string
  email: string
  phone: string
  instagram: string
  total_price: number | null
  selected_label: string | null
  status: 'pending' | 'contacted' | 'confirmed' | 'waitlist' | 'rejected'
  // Language Exchange specific columns
  application_type?: string | null
  city?: string | null
  language_level?: string | null
  referral_source?: string | null
  message?: string | null
  created_at?: string
  answer_count?: number
  session?: Session
  track?: ProgramTrack
  answers?: ApplicationAnswer[]
}

// ─── New application system ───────────────────────────────────────────────────

export type ProgramApplicationStatus =
  | 'new' | 'reviewing' | 'accepted' | 'waitlist'
  | 'payment_pending' | 'enrolled' | 'cancelled'

export interface ProgramApplication {
  id: string
  created_at: string
  updated_at?: string | null
  program_id?: string | null
  program_name?: string | null
  status: ProgramApplicationStatus
  // Basic
  name: string
  preferred_name?: string | null
  email: string
  phone?: string | null
  preferred_contact?: string | null
  languages_spoken?: string | null
  instagram?: string | null
  // Montréal
  time_in_montreal?: string | null
  current_stage?: string | null
  current_focus?: string | null
  // Korean
  previous_korean_exp?: string | null
  korean_level?: string | null
  interest_in_korean?: string | null
  // Goals
  reason_for_joining?: string | null
  first_korean_goal?: string | null
  six_month_goal?: string | null
  // Learning style
  biggest_challenge?: string | null
  preferred_environment?: string | null
  // HAKKYO questions
  how_found_hakkyo?: string | null
  what_interested?: string | null
  definition_great_class?: string | null
  questions_for_hakkyo?: string | null
  // Admin
  admin_notes?: string | null
}

export type CommunityCategory =
  | 'housing'
  | 'jobs'
  | 'events'
  | 'language_exchange'
  | 'looking_for_people'
  | 'help_needed'
  | 'other'

export interface CommunitySubmission {
  id: string
  type: string
  title: string
  description: string
  author_name?: string | null
  contact?: string | null
  location?: string | null
  link?: string | null
  image_url?: string | null
  video_url?: string | null
  // post_password intentionally omitted from reads — used only in WHERE filters
  status: 'pending' | 'approved' | 'rejected' | 'published'
  created_at?: string
  updated_at?: string
}

export interface CommunityComment {
  id: string
  post_id: string
  nickname: string
  content: string
  created_at?: string
}

export interface AdminNotification {
  id: string
  type: string
  title: string
  message: string
  related_table?: string | null
  related_id?: string | null
  is_read: boolean
  created_at?: string
}

export interface ApplicationAnswer {
  id: string
  application_id: string
  question_id: string
  answer: string
  question?: FormQuestion
}
