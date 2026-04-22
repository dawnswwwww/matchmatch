import { describe, it, expect } from 'vitest'
import { calculateScore, getScoreLabel } from '../score'

describe('calculateScore', () => {
  it('returns 0 when total is 0', () => {
    const result = calculateScore({}, {}, 0)
    expect(result).toBe(0)
  })

  it('returns 100 when all answers match', () => {
    const myAnswers = { 0: 'a', 1: 'b', 2: 'a' }
    const opponentAnswers = { 0: 'a', 1: 'b', 2: 'a' }
    const result = calculateScore(myAnswers, opponentAnswers, 3)
    expect(result).toBe(100)
  })

  it('returns 0 when no answers match', () => {
    const myAnswers = { 0: 'a', 1: 'b' }
    const opponentAnswers = { 0: 'b', 1: 'a' }
    const result = calculateScore(myAnswers, opponentAnswers, 2)
    expect(result).toBe(0)
  })

  it('calculates partial match correctly', () => {
    const myAnswers = { 0: 'a', 1: 'b', 2: 'a' }
    const opponentAnswers = { 0: 'a', 1: 'a', 2: 'b' }
    const result = calculateScore(myAnswers, opponentAnswers, 3)
    expect(result).toBe(33) // 1/3 = 33.33... → 33
  })

  it('rounds to nearest integer', () => {
    const myAnswers = { 0: 'a', 1: 'b', 2: 'a', 3: 'b', 4: 'a' }
    const opponentAnswers = { 0: 'a', 1: 'b', 2: 'a', 3: 'b', 4: 'b' }
    const result = calculateScore(myAnswers, opponentAnswers, 5)
    expect(result).toBe(80) // 4/5 = 80%
  })

  it('ignores missing opponent answers (null)', () => {
    const myAnswers = { 0: 'a', 1: 'b' }
    const opponentAnswers = { 0: 'a', 1: null }
    const result = calculateScore(myAnswers, opponentAnswers, 2)
    expect(result).toBe(50) // only index 0 counts as match
  })
})

describe('getScoreLabel', () => {
  it('returns 完全不在一个频道 for score <= 20', () => {
    expect(getScoreLabel(0)).toBe('完全不在一个频道')
    expect(getScoreLabel(20)).toBe('完全不在一个频道')
    expect(getScoreLabel(15)).toBe('完全不在一个频道')
  })

  it('returns 有点熟，但不多 for score 21-40', () => {
    expect(getScoreLabel(21)).toBe('有点熟，但不多')
    expect(getScoreLabel(40)).toBe('有点熟，但不多')
    expect(getScoreLabel(35)).toBe('有点熟，但不多')
  })

  it('returns 普通朋友水平 for score 41-60', () => {
    expect(getScoreLabel(41)).toBe('普通朋友水平')
    expect(getScoreLabel(60)).toBe('普通朋友水平')
    expect(getScoreLabel(50)).toBe('普通朋友水平')
  })

  it('returns 有点东西的默契 for score 61-80', () => {
    expect(getScoreLabel(61)).toBe('有点东西的默契')
    expect(getScoreLabel(80)).toBe('有点东西的默契')
    expect(getScoreLabel(75)).toBe('有点东西的默契')
  })

  it('returns 默契达人 for score 81-95', () => {
    expect(getScoreLabel(81)).toBe('默契达人')
    expect(getScoreLabel(95)).toBe('默契达人')
    expect(getScoreLabel(90)).toBe('默契达人')
  })

  it('returns 离谱级默契 for score > 95', () => {
    expect(getScoreLabel(96)).toBe('离谱级默契')
    expect(getScoreLabel(100)).toBe('离谱级默契')
    expect(getScoreLabel(99)).toBe('离谱级默契')
  })
})