'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/lib/stores/gameStore'
import { calculateScore, getScoreLabel, getMatchCount, getPersonalityMatchLabel } from '@/lib/utils/score'
import IndicatorCard from './IndicatorCard'

interface ResultSummaryProps {
  onOpenDetail: () => void
  onShare: () => void
  onNewGame: () => void
}

export default function ResultSummary({ onOpenDetail, onShare, onNewGame }: ResultSummaryProps) {
  const { questions, myAnswers, opponentAnswers, totalQuestions } = useGameStore()
  const [score, setScore] = useState(0)
  const [label, setLabel] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const s = calculateScore(myAnswers, opponentAnswers, totalQuestions)
    setScore(s)
    setLabel(getScoreLabel(s))
  }, [myAnswers, opponentAnswers, totalQuestions])

  const matchCount = getMatchCount(myAnswers, opponentAnswers, totalQuestions)
  const personalityLabel = getPersonalityMatchLabel(score)

  return (
    <div className="w-full flex flex-col items-center gap-[var(--space-6)]">
      {/* 综合得分大数字 */}
      <div
        className={`
          text-center transition-all duration-[var(--duration-slow)]
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
        style={{ transitionDelay: mounted ? '200ms' : '200ms' }}
      >
        <div
          className="text-[clamp(72px,20vw,120px)] font-black leading-[0.85] tracking-[-0.04em] mb-[var(--space-2)]"
          style={{ fontFamily: 'Inter, sans-serif', color: 'var(--green)' }}
        >
          {score}
          <span className="text-[0.4em] align-top">%</span>
        </div>
        <div
          className="text-[clamp(22px,5vw,32px)] font-bold mb-[var(--space-1)]"
          style={{ color: 'var(--foreground)' }}
        >
          {label}
        </div>
        <p className="text-sm" style={{ color: 'var(--gray)' }}>
          你们在 {matchCount} / {totalQuestions} 题上想法一致
        </p>
      </div>

      {/* 三个指标卡片 */}
      <div
        className={`
          w-full flex gap-[var(--space-3)] px-[var(--space-2)]
          transition-all duration-[var(--duration-slow)]
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
        style={{ transitionDelay: mounted ? '400ms' : '400ms' }}
      >
        <IndicatorCard label="综合得分" value={`${score}%`} />
        <IndicatorCard label="默契题数" value={`${matchCount}/${totalQuestions}`} />
        <IndicatorCard label="性格匹配" value={`${score}%`} description={personalityLabel} />
      </div>

      {/* 主 CTA: 查看答题详情 */}
      <button
        onClick={onOpenDetail}
        className={`
          w-full max-w-[320px] py-[var(--space-3)] px-[var(--space-6)]
          rounded-full font-semibold text-base
          transition-all duration-[var(--duration-base)]
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
        style={{
          background: 'var(--foreground)',
          color: 'var(--background)',
          transitionDelay: mounted ? '500ms' : '500ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.03)' }}
      >
        查看答题详情
      </button>

      {/* 次要 CTA: 分享 + 再开一局 */}
      <div
        className={`
          flex gap-[var(--space-3)] w-full max-w-[320px]
          transition-all duration-[var(--duration-slow)]
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
        style={{ transitionDelay: mounted ? '600ms' : '600ms' }}
      >
        <button
          onClick={onShare}
          className="flex-1 py-[var(--space-3)] px-[var(--space-6)] rounded-full font-semibold text-base transition-all duration-[var(--duration-base)]"
          style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--foreground)', e.currentTarget.style.color = 'var(--background)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)', e.currentTarget.style.color = 'var(--foreground)' }}
        >
          分享结果
        </button>
        <button
          onClick={onNewGame}
          className="flex-1 py-[var(--space-3)] px-[var(--space-6)] rounded-full font-semibold text-base transition-all duration-[var(--duration-base)]"
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