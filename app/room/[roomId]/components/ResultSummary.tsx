'use client'

import { useEffect, useState, useRef } from 'react'
import { useGameStore } from '@/lib/stores/gameStore'
import { calculateScore, getScoreLabel, getMatchCount, getPersonalityMatchLabel } from '@/lib/utils/score'
import IndicatorCard from './IndicatorCard'
import Button from '@/components/ui/Button'

interface ResultSummaryProps {
  onOpenDetail: () => void
  onShare: () => void
  onNewGame: () => void
}

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const start = performance.now()
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(value * eased))
      if (progress < 1) requestAnimationFrame(tick)
      else setDisplayed(value)
    }
    requestAnimationFrame(tick)
  }, [value, duration])

  return <>{displayed}</>
}

function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 },
        colors: ['#9fe870', '#ffffff', '#163300', '#e8ebe6'],
        startVelocity: 30,
        gravity: 0.85,
        scalar: 0.9,
        ticks: 180,
      })
    })
    return () => {
      if (canvasRef.current?.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current)
      }
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className="fixed inset-0 w-full h-full pointer-events-none z-[9999]" />
}

export default function ResultSummary({ onOpenDetail, onShare, onNewGame }: ResultSummaryProps) {
  const { questions, myAnswers, opponentAnswers, totalQuestions } = useGameStore()
  const [score, setScore] = useState(0)
  const [label, setLabel] = useState('')
  const [mounted, setMounted] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const confettiRan = useRef(false)

  useEffect(() => {
    setMounted(true)
    const s = calculateScore(myAnswers, opponentAnswers, totalQuestions)
    setScore(s)
    setLabel(getScoreLabel(s))
  }, [myAnswers, opponentAnswers, totalQuestions])

  const matchCount = getMatchCount(myAnswers, opponentAnswers, totalQuestions)
  const personalityLabel = getPersonalityMatchLabel(score)

  // Trigger confetti when score is revealed and above threshold
  useEffect(() => {
    if (mounted && score > 0 && !confettiRan.current) {
      confettiRan.current = true
      if (score >= 61) {
        const timer = setTimeout(() => setShowConfetti(true), 800)
        return () => clearTimeout(timer)
      }
    }
  }, [mounted, score])

  return (
    <div className="w-full flex flex-col items-center gap-[var(--space-6)]">
      {showConfetti && <ConfettiCanvas />}
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
          <AnimatedNumber key={score} value={score} />
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
      <Button
        variant="primary"
        onClick={onOpenDetail}
        className={`w-full max-w-[320px] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ transitionDelay: mounted ? '500ms' : '500ms' }}
      >
        查看答题详情
      </Button>

      {/* 次要 CTA: 分享 + 再开一局 */}
      <div
        className={`
          flex gap-[var(--space-3)] w-full max-w-[320px]
          transition-all duration-[var(--duration-slow)]
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
        style={{ transitionDelay: mounted ? '600ms' : '600ms' }}
      >
        <Button
          variant="secondary"
          onClick={onShare}
          className="flex-1"
        >
          分享结果
        </Button>
        <Button
          variant="primary"
          onClick={onNewGame}
          className="flex-1"
        >
          再开一局
        </Button>
      </div>
    </div>
  )
}