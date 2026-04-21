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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const s = calculateScore(myAnswers, opponentAnswers, questions.length)
    setScore(s)
    setLabel(getScoreLabel(s))
  }, [myAnswers, opponentAnswers, questions.length])

  async function handleShare() {
    const url = `${window.location.origin}/result/${roomId}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'MatchMatch', text: `我在 MatchMatch 测出了 ${score}% ${label}！你也来试试？`, url })
      } catch {
        await navigator.clipboard.writeText(url)
      }
    } else {
      await navigator.clipboard.writeText(url)
    }
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
    <div className="w-full flex flex-col items-center gap-[var(--space-8)]">
      <ScoreDisplay score={score} label={label} />

      <div
        className={`
          w-full transition-all duration-[var(--duration-slow)]
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
        style={{ transitionDelay: mounted ? '400ms' : '400ms' }}
      >
        <ComparisonList comparisons={comparisons} />
      </div>

      {/* CTAs */}
      <div
        className={`
          flex gap-[var(--space-3)] flex-col sm:flex-row
          w-full max-w-[320px]
          transition-all duration-[var(--duration-slow)]
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
        style={{ transitionDelay: mounted ? '600ms' : '600ms' }}
      >
        <button
          onClick={handleShare}
          className="
            flex-1 py-[var(--space-3)] px-[var(--space-6)]
            rounded-full font-semibold text-base
            transition-all duration-[var(--duration-base)]
          "
          style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--foreground)', e.currentTarget.style.color = 'var(--background)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)', e.currentTarget.style.color = 'var(--foreground)' }}
        >
          分享结果
        </button>
        <button
          onClick={handleNewGame}
          className="
            flex-1 py-[var(--space-3)] px-[var(--space-6)]
            rounded-full font-semibold text-base
            transition-all duration-[var(--duration-base)]
          "
          style={{ background: 'var(--green)', color: 'var(--green-dark)' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.03)' }}
        >
          再开一局
        </button>
      </div>
    </div>
  )
}
