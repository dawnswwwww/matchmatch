// lib/supabase/types.ts
export type RoomStatus = 'waiting' | 'playing' | 'finished' | 'expired'

export interface Room {
  id: string
  code: string
  status: RoomStatus
  question_set_id: string | null
  current_question: number
  total_questions: number
  created_at: string
  expires_at: string | null
  finished_at: string | null
}

export interface Player {
  id: string
  room_id: string
  user_id: string
  joined_at: string
}

export interface Answer {
  id: string
  room_id: string
  player_id: string
  question_index: number
  choice: 'a' | 'b'
  created_at: string
}

export interface Question {
  id: string
  question_set_id: string
  text: string
  option_a: string
  option_b: string
  display_order: number
}

export interface RematchVote {
  id: string
  room_id: string
  player_id: string
  vote: boolean
  created_at: string
}
