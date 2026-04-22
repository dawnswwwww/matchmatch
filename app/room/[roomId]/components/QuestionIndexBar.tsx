'use client'

import { useRef, useEffect } from 'react'

interface QuestionIndexBarProps {
  total: number
  matchStatus: boolean[]
  currentIndex: number
  onJump: (index: number) => void
}

export default function QuestionIndexBar({ total, matchStatus, currentIndex, onJump }: QuestionIndexBarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const current = itemRefs.current[currentIndex]
    if (current && containerRef.current) {
      current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [currentIndex])

  return (
    <div
      ref={containerRef}
      className="w-full overflow-x-auto flex items-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-3)]"
      style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
    >
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          ref={(el) => { itemRefs.current[i] = el }}
          onClick={() => onJump(i)}
          className={`
            flex-shrink-0 w-8 h-8 rounded-full text-xs font-bold
            transition-all duration-[var(--duration-base)]
            ${currentIndex === i ? 'scale-125' : 'scale-100'}
          `}
          style={{
            background: currentIndex === i
              ? 'var(--foreground)'
              : matchStatus[i]
              ? 'var(--green)'
              : 'var(--surface)',
            color: currentIndex === i
              ? 'var(--background)'
              : matchStatus[i]
              ? 'var(--green-dark)'
              : 'var(--gray)',
            scrollSnapAlign: 'center',
          }}
        >
          {i + 1}
        </button>
      ))}
    </div>
  )
}
