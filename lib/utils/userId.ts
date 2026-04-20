// lib/utils/userId.ts
const USER_ID_KEY = 'matchmatch_user_id'

export function getUserId(): string {
  if (typeof window === 'undefined') return ''

  const stored = localStorage.getItem(USER_ID_KEY)
  if (stored) return stored

  const newId = crypto.randomUUID()
  localStorage.setItem(USER_ID_KEY, newId)
  return newId
}
