// lib/questions/adapter.ts
import type { Question } from '@/lib/supabase/types'
import { QUESTIONS, type StaticQuestion } from './questions'

/**
 * 根据 question_set_id 从本地题库获取题目。
 * 若 setId 不在本地题库覆盖范围内，返回 null 由调用方 fallback 到 Supabase。
 *
 * @param setId 题库标识 ('local' | 'default')
 * @param count 抽取题目数量，默认 5
 * @param seed 随机种子（通常传 roomId），保证同一房间双方抽到相同题目
 */
export function getLocalQuestionsBySetId(
  setId: string,
  count: number = 5,
  seed?: string
): Question[] | null {
  if (setId !== 'local' && setId !== 'default') {
    return null
  }

  const pool = QUESTIONS
  const selected = seededSample(pool, count, seed)
  return selected.map((q, i) => toRuntimeQuestion(q, setId, i))
}

/** Fields: StaticQuestion → Question (Supabase runtime format) */
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

/** Seeded Fisher-Yates shuffle, returns first `count` items */
function seededSample<T>(arr: T[], count: number, seed?: string): T[] {
  // Simple string hash to numeric seed
  let h = 0
  for (let i = 0; i < (seed ?? '').length; i++) {
    h = (Math.imul(31, h) + seed!.charCodeAt(i)) | 0
  }
  if (!seed) h = Date.now()

  const result: T[] = []
  const used = new Set<number>()

  // Deterministic random based on seed
  let s = h
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0
    return (s >>> 0) / 0xffffffff
  }

  while (result.length < count && result.length < arr.length) {
    const idx = Math.floor(rand() * arr.length)
    if (!used.has(idx)) {
      used.add(idx)
      result.push(arr[idx])
    }
  }

  return result
}