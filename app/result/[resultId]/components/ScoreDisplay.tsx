'use client'

import { useEffect, useRef, useState } from 'react'

interface ScoreDisplayProps {
  score: number
  label: string
}

const CONFETTI_THRESHOLD = 61

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Dynamic import to avoid SSR issues
    import('canvas-confetti').then(({ default: confetti }) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      canvas.style.position = 'fixed'
      canvas.style.top = '0'
      canvas.style.left = '0'
      canvas.style.pointerEvents = 'none'
      canvas.style.zIndex = '9999'

      const colors = ['#9fe870', '#ffffff', '#163300', '#e8ebe6']

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.55 },
        colors,
        startVelocity: 38,
        gravity: 0.9,
        scalar: 1.1,
        drift: 0,
        ticks: 200,
      })

      // Second wave slightly delayed
      setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 100,
          origin: { y: 0.5 },
          colors,
          startVelocity: 25,
          gravity: 0.85,
          scalar: 0.8,
          drift: 0.2,
          ticks: 150,
        })
      }, 180)
    })

    return () => {
      // Cleanup canvas on unmount
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas)
      }
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" />
}

export default function ScoreDisplay({ score, label }: ScoreDisplayProps) {
  const [displayedScore, setDisplayedScore] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    // Delay the reveal for dramatic effect
    const revealTimer = setTimeout(() => {
      setRevealed(true)

      // Animate score counting up
      const duration = 1200
      const start = performance.now()
      const startVal = 0

      function tick(now: number) {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        // Ease-out curve
        const eased = 1 - Math.pow(1 - progress, 3)
        const current = Math.round(startVal + (score - startVal) * eased)
        setDisplayedScore(current)

        if (progress < 1) {
          requestAnimationFrame(tick)
        } else {
          setDisplayedScore(score)
          if (score >= CONFETTI_THRESHOLD) {
            setShowConfetti(true)
          }
        }
      }

      requestAnimationFrame(tick)
    }, 400)

    return () => clearTimeout(revealTimer)
  }, [score])

  return (
    <div className="text-center relative">
      {showConfetti && <Confetti />}

      {/* Score number — massive fluid display */}
      <div
        className={`
          text-[clamp(80px,22vw,140px)] font-black leading-[0.85]
          tracking-[-0.04em] mb-[var(--space-3)]
          transition-all duration-700
          ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
        style={{
          fontFamily: 'Inter, sans-serif',
          color: revealed ? 'var(--green)' : 'var(--surface)',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {displayedScore}
        <span className="text-[0.45em] align-top">%</span>
      </div>

      {/* Label */}
      <div
        className={`
          text-[clamp(22px,5vw,32px)] font-bold mb-[var(--space-2)]
          transition-all duration-500
          ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}
        `}
        style={{
          color: 'var(--foreground)',
          transitionDelay: '150ms',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {label}
      </div>

      {/* Sub-label */}
      <p
        className={`
          text-base font-medium
          transition-all duration-500
          ${revealed ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          color: 'var(--gray)',
          transitionDelay: '280ms',
        }}
      >
        匹配度
      </p>
    </div>
  )
}
