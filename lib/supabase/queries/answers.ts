// lib/supabase/queries/answers.ts
import { supabase } from '@/lib/supabase/client'

export type AnswerRecord = {
  player_id: string
  question_index: number
  choice: 'a' | 'b'
}

export async function getAnswersByRoomId(roomId: string): Promise<AnswerRecord[]> {
  const { data, error } = await supabase
    .from('answers')
    .select('player_id, question_index, choice')
    .eq('room_id', roomId)
    .order('question_index')

  if (error) throw error
  return data ?? []
}
