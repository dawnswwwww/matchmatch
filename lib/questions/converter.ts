// lib/questions/converter.ts
import type { Question as RuntimeQuestion } from '@/lib/supabase/types'
import type { StaticQuestion } from './questions'

/**
 * Converts a StaticQuestion (from the question bank library)
 * to the Supabase runtime Question format.
 *
 * Runtime Question fields:
 * - id: string (uses static question id)
 * - question_set_id: string (placeholder for runtime)
 * - text: string (from static content)
 * - option_a: string (from static optionA)
 * - option_b: string (from static optionB)
 * - display_order: number (not applicable for static, set to 0)
 */
export function toRuntimeQuestion(
  staticQuestion: StaticQuestion,
  questionSetId: string = 'default',
  displayOrder: number = 0
): RuntimeQuestion {
  return {
    id: staticQuestion.id,
    question_set_id: questionSetId,
    text: staticQuestion.content,
    option_a: staticQuestion.optionA,
    option_b: staticQuestion.optionB,
    display_order: displayOrder,
  }
}

/**
 * Converts an array of StaticQuestion to runtime Question[].
 * displayOrder is auto-incremented.
 */
export function toRuntimeQuestions(
  staticQuestions: StaticQuestion[],
  questionSetId: string = 'default'
): RuntimeQuestion[] {
  return staticQuestions.map((q, index) =>
    toRuntimeQuestion(q, questionSetId, index)
  )
}
