// lib/questions/adapter.ts
import type { Question } from '@/lib/supabase/types'
import { QUESTIONS, type StaticQuestion } from './questions'

/**
 * 根据 question_set_id 从本地题库获取对应题目。
 * 若 setId 不在本地题库覆盖范围内，返回 null 由调用方 fallback 到 Supabase。
 */
export function getLocalQuestionsBySetId(setId: string): Question[] | null {
  // 目前本地题库固定返回全部 300 题
  // 未来可按 setId 过滤不同题组
  if (setId === 'local' || setId === 'default') {
    return QUESTIONS.map((q, i) => toRuntimeQuestion(q, setId, i))
  }

  // 其他 setId 不支持，返回 null 让调用方使用 Supabase
  return null
}

/** 字段映射：StaticQuestion → Question (Supabase runtime format) */
function toRuntimeQuestion(
  q: StaticQuestion,
  questionSetId: string,
  displayOrder: number
): Question {
  return {
    id: q.id,
    question_set_id: questionSetId,
    text: q.content,
    option_a: q.optionA,
    option_b: q.optionB,
    display_order: displayOrder,
  }
}