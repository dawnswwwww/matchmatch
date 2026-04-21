'use client'

import { useGameStore } from '@/lib/stores/gameStore'

export default function SyncIndicator() {
  const { opponentReady, myAnswers, currentQuestion } = useGameStore()
  const myAnswered = !!myAnswers[currentQuestion]

  if (!myAnswered) {
    return (
      <p className="text-sm font-medium animate-fade-in" style={{ color: 'var(--gray)' }}>
        选择后等待好友...
      </p>
    )
  }

  if (myAnswered && !opponentReady) {
    return (
      <div className="flex items-center gap-2 animate-fade-in">
        {/* Animated dots */}
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: 'var(--gray)',
                animation: 'bounce 1.2s ease-in-out infinite',
                animationDelay: `${i * 160}ms`,
              }}
            />
          ))}
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--gray)' }}>
          等待好友选择...
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 animate-scale-in">
      <span style={{ color: 'var(--green-dark)', fontSize: '16px' }}>✓</span>
      <p className="text-sm font-semibold" style={{ color: 'var(--green-dark)' }}>
        匹配结果已显示 ↑
      </p>
    </div>
  )
}
