// lib/utils/score.ts
export type ScoreLabel =
  | '完全不在一个频道'
  | '有点熟，但不多'
  | '普通朋友水平'
  | '有点东西的默契'
  | '默契达人'
  | '离谱级默契'

export function calculateScore(
  myAnswers: Record<number, 'a' | 'b'>,
  opponentAnswers: Record<number, 'a' | 'b' | null>,
  total: number
): number {
  if (total === 0) return 0
  let matches = 0
  for (let i = 0; i < total; i++) {
    if (myAnswers[i] && opponentAnswers[i] && myAnswers[i] === opponentAnswers[i]) {
      matches++
    }
  }
  return Math.round((matches / total) * 100)
}

export function getScoreLabel(score: number): ScoreLabel {
  if (score <= 20) return '完全不在一个频道'
  if (score <= 40) return '有点熟，但不多'
  if (score <= 60) return '普通朋友水平'
  if (score <= 80) return '有点东西的默契'
  if (score <= 95) return '默契达人'
  return '离谱级默契'
}

export function getMatchCount(
  myAnswers: Record<number, 'a' | 'b'>,
  opponentAnswers: Record<number, 'a' | 'b' | null>,
  total: number
): number {
  let matches = 0
  for (let i = 0; i < total; i++) {
    if (myAnswers[i] && opponentAnswers[i] && myAnswers[i] === opponentAnswers[i]) {
      matches++
    }
  }
  return matches
}

export function getPersonalityMatchLabel(score: number): string {
  if (score >= 80) return '灵魂伴侣'
  if (score >= 60) return '性格相近'
  if (score >= 40) return '风格互补'
  return '差异较大'
}
