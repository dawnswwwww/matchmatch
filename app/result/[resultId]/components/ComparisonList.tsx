'use client'

import { useState, useEffect } from 'react'

interface Comparison {
  question: string
  optionA: string
  optionB: string
  myChoice: 'a' | 'b' | null
  opponentChoice: 'a' | 'b' | null
  match: boolean
}

interface ComparisonListProps {
  comparisons: Comparison[]
}

function ChoiceBadge({ choice }: { choice: 'a' | 'b' | null }) {
  if (!choice) return <span className="text-[var(--gray)]">—</span>
  const isA = choice === 'a'
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
      style={
        isA
          ? { background: 'var(--green)', color: 'var(--green-dark)' }
          : { background: 'var(--foreground)', color: 'var(--background)' }
      }
    >
      {choice.toUpperCase()}
    </span>
  )
}

export default function ComparisonList({ comparisons }: ComparisonListProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="w-full flex flex-col gap-[var(--space-3)]">
      <h3
        className="text-base font-semibold mb-[var(--space-1)]"
        style={{ color: 'var(--gray)' }}
      >
        答题对比
      </h3>

      {comparisons.map((comp, i) => (
        <div
          key={i}
          className={`
            p-[var(--space-4)] rounded-2xl border-2 transition-all
            ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
          `}
          style={{
            borderColor: comp.match ? 'var(--green)' : 'var(--surface)',
            background: comp.match ? 'oklch(86% 0.08 122 / 0.06)' : 'var(--surface)',
            transitionDelay: visible ? `${i * 60}ms` : '0ms',
            transitionTimingFunction: 'var(--ease-out-quart)',
            transitionDuration: 'var(--duration-slow)',
          }}
        >
          <p className="text-sm font-medium mb-[var(--space-3)] leading-snug">
            {comp.question}
          </p>

          <div className="flex items-center gap-[var(--space-4)] text-sm">
            {/* My choice */}
            <div className="flex items-center gap-[var(--space-2)]">
              <ChoiceBadge choice={comp.myChoice} />
              <span className="text-[var(--gray)]">你的</span>
            </div>

            {/* Separator */}
            <div
              className="w-4 h-px rounded-full"
              style={{ background: 'var(--gray)', opacity: 0.3 }}
            />

            {/* Opponent choice */}
            <div className="flex items-center gap-[var(--space-2)]">
              <ChoiceBadge choice={comp.opponentChoice} />
              <span className="text-[var(--gray)]">对方</span>
            </div>

            {/* Match indicator */}
            {comp.match && (
              <span
                className="ml-auto text-xs font-semibold animate-scale-in"
                style={{ color: 'var(--green-dark)' }}
              >
                ✓ 默契
              </span>
            )}
            {!comp.match && (
              <span
                className="ml-auto text-xs"
                style={{ color: 'var(--gray)' }}
              >
                ✗
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
