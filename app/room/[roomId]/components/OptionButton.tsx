'use client'

import { useState } from 'react'

interface OptionButtonProps {
  label: 'A' | 'B'
  text: string
  selected: boolean
  locked: boolean
  opponentSelected: boolean
  isCorrect?: boolean
  onClick: () => void
}

export default function OptionButton({
  label,
  text,
  selected,
  locked,
  opponentSelected,
  isCorrect,
  onClick,
}: OptionButtonProps) {
  const [pressed, setPressed] = useState(false)
  const [hovered, setHovered] = useState(false)

  // Determine visual state
  const isLocked = locked && !selected
  const isMySelected = selected && !locked
  // Only show match/mismatch indicator when BOTH have answered
  const isMySelectedAndLocked = selected && locked && opponentSelected
  const isOpponentCorrectOnMyButton = !selected && locked && opponentSelected && isCorrect

  return (
    <button
      onClick={onClick}
      disabled={locked}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      className={`
        w-full py-[var(--space-5)] px-[var(--space-5)]
        rounded-2xl border-2 font-semibold text-base text-left
        transition-all duration-[var(--duration-base)]
        flex items-center gap-[var(--space-3)]
        select-none
        disabled:cursor-not-allowed
      `}
      style={{
        // Base border
        borderColor: selected
          ? 'var(--green)'
          : isOpponentCorrectOnMyButton
          ? 'var(--green)'
          : 'var(--surface)',
        // Background
        background: selected
          ? 'oklch(86% 0.08 122 / 0.08)'
          : isOpponentCorrectOnMyButton
          ? 'oklch(86% 0.08 122 / 0.04)'
          : 'var(--surface)',
        // Scale transforms
        transform: pressed && !locked
          ? 'scale(0.97)'
          : hovered && !locked
          ? 'scale(1.015)'
          : 'scale(1)',
        // Opacity for locked non-selected
        opacity: isLocked ? 0.45 : 1,
        // Transition easing
        transitionTimingFunction: 'var(--ease-out-quart)',
      }}
    >
      {/* Label badge */}
      <span
        className="
          inline-flex items-center justify-center
          w-8 h-8 rounded-full text-sm font-bold
          flex-shrink-0 transition-all duration-[var(--duration-base)]
        "
        style={{
          background: selected
            ? 'var(--green)'
            : 'oklch(50% 0 0 / 0.08)',
          color: selected
            ? 'var(--green-dark)'
            : 'var(--gray)',
          transform: pressed && !locked ? 'scale(0.92)' : 'scale(1)',
        }}
      >
        {label}
      </span>

      {/* Option text */}
      <span
        className="leading-snug"
        style={{
          color: selected ? 'var(--foreground)' : 'var(--foreground)',
        }}
      >
        {text}
      </span>

      {/* Match indicator — shown when opponent got it right on this option */}
      {isOpponentCorrectOnMyButton && (
        <span
          className="ml-auto text-xs font-semibold flex-shrink-0 animate-scale-in"
          style={{ color: 'var(--green-dark)' }}
        >
          ✓
        </span>
      )}

      {/* My answer locked indicator */}
      {isMySelectedAndLocked && (
        <span
          className="ml-auto text-xs font-semibold flex-shrink-0 animate-scale-in"
          style={{ color: isCorrect ? 'var(--green-dark)' : '#d03238' }}
        >
          {isCorrect ? '✓ 匹配' : '✗'}
        </span>
      )}
    </button>
  )
}
