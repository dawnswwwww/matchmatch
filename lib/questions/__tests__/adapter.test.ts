import { describe, it, expect } from 'vitest'
import { getLocalQuestionsBySetId } from '../adapter'

describe('getLocalQuestionsBySetId', () => {
  it('returns null for unsupported setId', () => {
    expect(getLocalQuestionsBySetId('unknown')).toBeNull()
    expect(getLocalQuestionsBySetId('some-other-id')).toBeNull()
  })

  it('returns array for local setId', () => {
    const result = getLocalQuestionsBySetId('local')
    expect(result).not.toBeNull()
    expect(Array.isArray(result)).toBe(true)
    expect(result!.length).toBeGreaterThan(0)
  })

  it('returns array for default setId', () => {
    const result = getLocalQuestionsBySetId('default')
    expect(result).not.toBeNull()
    expect(Array.isArray(result)).toBe(true)
  })

  it('returns all questions when count not specified', () => {
    const result = getLocalQuestionsBySetId('local')
    expect(result!.length).toBe(300)
  })

  it('returns specified count of questions', () => {
    const result = getLocalQuestionsBySetId('local', 10)
    expect(result!.length).toBe(10)
  })

  it('same seed produces same order', () => {
    const result1 = getLocalQuestionsBySetId('local', 10, 'seed-123')
    const result2 = getLocalQuestionsBySetId('local', 10, 'seed-123')
    expect(result1).toEqual(result2)
  })

  it('different seeds produce potentially different order', () => {
    const result1 = getLocalQuestionsBySetId('local', 10, 'seed-abc')
    const result2 = getLocalQuestionsBySetId('local', 10, 'seed-xyz')
    // Very likely different, but not guaranteed
    // Just check they are both valid arrays of same questions
    expect(result1).not.toEqual(result2)
  })

  it('questions have correct shape', () => {
    const result = getLocalQuestionsBySetId('local', 1)
    const q = result![0]
    expect(q).toHaveProperty('id')
    expect(q).toHaveProperty('question_set_id')
    expect(q).toHaveProperty('text')
    expect(q).toHaveProperty('option_a')
    expect(q).toHaveProperty('option_b')
    expect(q).toHaveProperty('display_order')
    expect(q.question_set_id).toBe('local')
  })

  it('questions have correct types', () => {
    const result = getLocalQuestionsBySetId('local', 1)
    const q = result![0]
    expect(typeof q.id).toBe('string')
    expect(typeof q.question_set_id).toBe('string')
    expect(typeof q.text).toBe('string')
    expect(typeof q.option_a).toBe('string')
    expect(typeof q.option_b).toBe('string')
    expect(typeof q.display_order).toBe('number')
  })
})