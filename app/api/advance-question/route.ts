// app/api/advance-question/route.ts
import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { roomId, questionIndex } = await req.json()

  const supabase = createServerClient()

  // Verify both answers exist for this question
  const { data: answers } = await supabase
    .from('answers')
    .select('player_id')
    .eq('room_id', roomId)
    .eq('question_index', questionIndex)

  if (!answers || answers.length < 2) {
    return Response.json({ error: 'Waiting for both answers' }, { status: 400 })
  }

  // Get room to check total questions
  const { data: room } = await supabase
    .from('rooms')
    .select('total_questions, current_question')
    .eq('id', roomId)
    .single()

  if (!room) {
    return Response.json({ error: 'Room not found' }, { status: 404 })
  }

  const nextIndex = questionIndex + 1

  if (nextIndex >= room.total_questions) {
    // Game finished
    await supabase
      .from('rooms')
      .update({ status: 'finished', finished_at: new Date().toISOString() })
      .eq('id', roomId)
  } else {
    // Advance to next question
    await supabase
      .from('rooms')
      .update({ current_question: nextIndex })
      .eq('id', roomId)
  }

  return Response.json({ success: true, nextIndex })
}
