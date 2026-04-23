'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'

interface RoomCodeInputProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
  error?: string
}

const RoomCodeInput = ({ value, onChange, maxLength = 6, error }: RoomCodeInputProps) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const charRefs = useRef<(HTMLSpanElement | null)[]>([])
  const prevValueRef = useRef('')

  const characters = value.split('').concat(Array(maxLength - value.length).fill(' ')).slice(0, maxLength)

  const animateChar = useCallback((index: number, char: string) => {
    const el = charRefs.current[index]
    if (!el || char === ' ') return

    gsap.fromTo(el,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'power3.out',
        overwrite: true
      }
    )
  }, [])

  useEffect(() => {
    const prevValue = prevValueRef.current

    // Only animate when adding new character (not when deleting)
    if (value.length > prevValue.length) {
      const newCharIndex = value.length - 1
      animateChar(newCharIndex, value[newCharIndex])
    }

    prevValueRef.current = value
  }, [value, animateChar])

  const handleCharClick = (index: number) => {
    inputRef.current?.focus()
    const input = inputRef.current
    if (input) {
      input.setSelectionRange(index, index)
    }
  }

  return (
    <div className="room-code-input-wrapper">
      <div
        className={`room-code-input-grid ${error ? 'has-error' : ''} ${focusedIndex !== null ? 'focused' : ''}`}
        onClick={() => inputRef.current?.focus()}
      >
        {characters.map((char, index) => (
          <div
            key={index}
            className={`room-code-char ${char !== ' ' ? 'filled' : ''} ${index === focusedIndex ? 'cursor' : ''}`}
            onClick={() => handleCharClick(index)}
          >
            <span
              ref={(el) => { charRefs.current[index] = el }}
              className="room-code-char-text"
              style={{ display: 'inline-block', opacity: char === ' ' ? 0.3 : 1 }}
            >
              {char === ' ' ? '_' : char}
            </span>
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase().slice(0, maxLength))}
        maxLength={maxLength}
        className="room-code-hidden-input"
        onFocus={() => setFocusedIndex(value.length || 0)}
        onBlur={() => setFocusedIndex(null)}
      />

      {error && (
        <p className="room-code-error">{error}</p>
      )}
    </div>
  )
}

export default RoomCodeInput
