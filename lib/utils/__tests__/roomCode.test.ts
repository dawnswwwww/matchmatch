import { describe, it, expect } from 'vitest'
import { generateRoomCode } from '../roomCode'

describe('generateRoomCode', () => {
  it('returns string of length 6', () => {
    const code = generateRoomCode()
    expect(code).toHaveLength(6)
  })

  it('contains only uppercase letters and numbers', () => {
    const code = generateRoomCode()
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ2345679]+$/)
  })

  it('does not contain confusing characters (I, O, 0, 1)', () => {
    const code = generateRoomCode()
    expect(code).not.toMatch(/[IO01]/)
  })

  it('returns different codes on multiple calls', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateRoomCode()))
    // With 6 chars from 28-char alphabet, collision unlikely but possible
    // 28^6 = 380 billion combinations, 100 samples should all be unique
    expect(codes.size).toBe(100)
  })
})