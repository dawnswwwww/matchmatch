// app/room/[roomId]/components/ResultPanel.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/lib/stores/gameStore'
import { calculateScore, getScoreLabel } from '@/lib/utils/score'
import ScoreDisplay from '../../../result/[resultId]/components/ScoreDisplay'
import ComparisonList from '../../../result/[resultId]/components/ComparisonList'

export default function ResultPanel() {
  const router = useRouter()
  const { roomId, questions, myAnswers, opponentAnswers } = useGameStore()
  const [score, setScore] = useState(0)
  const [label, setLabel] = useState('')

  useEffect(() => {
    const s = calculateScore(myAnswers, opponentAnswers, questions.length)
    setScore(s)
    setLabel(getScoreLabel(s))
  }, [myAnswers, opponentAnswers, questions.length])

  function handleShare() {
    const url = `${window.location.origin}/result/${roomId}`
    navigator.clipboard.writeText(url)
  }

  function handleNewGame() {
    router.push('/')
  }

  const comparisons = questions.map((q, i) => ({
    question: q.text,
    optionA: q.option_a,
    optionB: q.option_b,
    myChoice: myAnswers[i],
    opponentChoice: opponentAnswers[i],
    match: myAnswers[i] === opponentAnswers[i],
  }))

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <ScoreDisplay score={score} label={label} />
      <ComparisonList comparisons={comparisons} />
      <div className="flex gap-4">
        <button
          onClick={handleShare}
          className="py-3 px-8 rounded-full font-semibold transition-transform text-[18px]"
          style={{ background: 'rgba(22,51,0,0.08)', color: '#0e0f0c' }}
        >
          分享结果
        </button>
        <button
          onClick={handleNewGame}
          className="py-3 px-8 rounded-full font-semibold transition-transform text-[18px]"
          style={{ background: '#9fe870', color: '#163300' }}
        >
          再开一局
        </button>
      </div>
    </div>
  )
}
