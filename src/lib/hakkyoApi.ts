import { supabase } from './supabase'

export interface ApplicationPayload {
  kind: 'program' | 'activity' | 'community' | 'newsletter'
  selection: string
  name?: string
  email?: string
  phone?: string
  instagram?: string
  city?: string
  timeInMontreal?: string
  currentStage?: string
  languageLevel?: string
  learningExperience?: string
  speakingBarrier?: string
  goal?: string
  preferredClassStyle?: string
  experience?: string
  joinReason?: string
  comfort?: string
  availability?: string
  preferredLocation?: string
  discovery?: string
  message?: string
  language?: string
  interests?: string
  [key: string]: string | undefined
}

export async function submitApplication(payload: ApplicationPayload): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase.from('hakkyo_submissions').insert([{
    kind:                   payload.kind,
    selection:              payload.selection,
    name:                   payload.name,
    email:                  payload.email,
    phone:                  payload.phone,
    instagram:              payload.instagram,
    city:                   payload.city,
    time_in_montreal:       payload.timeInMontreal,
    current_stage:          payload.currentStage,
    language_level:         payload.languageLevel,
    learning_experience:    payload.learningExperience,
    speaking_barrier:       payload.speakingBarrier,
    goal:                   payload.goal,
    preferred_class_style:  payload.preferredClassStyle,
    experience:             payload.experience,
    join_reason:            payload.joinReason,
    comfort:                payload.comfort,
    availability:           payload.availability,
    preferred_location:     payload.preferredLocation,
    discovery:              payload.discovery,
    message:                payload.message,
    language:               payload.language,
    interests:              payload.interests,
  }])

  if (error) throw error
}

export interface ChatMessage {
  message: string
  email?: string
  name?: string
}

export async function submitChatMessage(payload: ChatMessage): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('chat_messages').insert([payload])
  if (error) throw error
}
