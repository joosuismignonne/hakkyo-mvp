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
  status: 'open' | 'closed'
  is_free: boolean
  target_audience?: string | null
  included_sessions?: string[] | string | null
  application_deadline?: string | null
  class_schedule?: string | null
  venue_name?: string | null
  venue_city?: string | null
  google_maps_url?: string | null
  created_at?: string
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
  type: 'notice' | 'schedule' | 'event'
  date: string
  created_at?: string
}

export type ContentCategory = 'archive' | 'language' | 'news' | 'culture' | 'life'
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
  published_at: string
  created_at?: string
}

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
  session?: Session
  track?: ProgramTrack
  answers?: ApplicationAnswer[]
}

export interface ApplicationAnswer {
  id: string
  application_id: string
  question_id: string
  answer: string
  question?: FormQuestion
}
