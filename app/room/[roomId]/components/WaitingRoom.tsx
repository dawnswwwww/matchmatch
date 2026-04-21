'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/lib/stores/gameStore'

export default function WaitingRoom() {
  const { roomCode, roomId } = useGameStore()
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function copyLink() {
    const url = `${window.location.origin}/room/${roomId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="text-center flex flex-col items-center gap-[var(--space-8)]">

      {/* Room code — large, spaced, with subtle background */}
      <div className="relative">
        {/* Decorative ring */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -m-4 rounded-full animate-pulse"
          style={{
            background: 'oklch(86% 0.08 122 / 0.08)',
            animationDuration: '2.5s',
          }}
        />

        <div
          className={`
            relative text-[clamp(48px,14vw,80px)] font-black leading-[0.85]
            tracking-[0.15em] select-all
            ${mounted ? 'animate-scale-in' : 'opacity-0'}
          `}
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {roomCode}
        </div>
      </div>

      {/* Label */}
      <p
        className={`
          text-base font-medium
          ${mounted ? 'animate-fade-up' : 'opacity-0'}
        `}
        style={{ color: 'var(--gray)', animationDelay: mounted ? '100ms' : '100ms' }}
      >
        房间号，分享给朋友
      </p>

      {/* Copy link button */}
      <button
        onClick={copyLink}
        className={`
          py-[var(--space-3)] px-[var(--space-8)] rounded-full font-semibold text-base
          transition-all duration-[var(--duration-base)]
          ${mounted ? 'animate-fade-up' : 'opacity-0'}
        `}
        style={{
          animationDelay: mounted ? '180ms' : '180ms',
          background: copied ? 'var(--green)' : 'var(--surface)',
          color: copied ? 'var(--green-dark)' : 'var(--foreground)',
          transitionTimingFunction: 'var(--ease-out-quart)',
        }}
        onMouseEnter={e => {
          if (!copied) e.currentTarget.style.background = 'var(--foreground)',
            e.currentTarget.style.color = 'var(--background)'
        }}
        onMouseLeave={e => {
          if (!copied) e.currentTarget.style.background = 'var(--surface)',
            e.currentTarget.style.color = 'var(--foreground)'
        }}
      >
        {copied ? '已复制 ✓' : '复制链接'}
      </button>

      {/* Waiting indicator */}
      <div
        className={`
          flex items-center gap-[var(--space-3)] text-sm
          ${mounted ? 'animate-fade-up' : 'opacity-0'}
        `}
        style={{ animationDelay: mounted ? '300ms' : '300ms', color: 'var(--gray)' }}
      >
        {/* Three bouncing dots */}
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: 'var(--green)',
                animation: 'bounce 1.2s ease-in-out infinite',
                animationDelay: `${i * 180}ms`,
              }}
            />
          ))}
        </div>
        <span className="font-medium">等待好友加入...</span>
      </div>

      {/* Share prompt — subtle */}
      <p
        className={`
          text-sm
          ${mounted ? 'animate-fade-in' : 'opacity-0'}
        `}
        style={{ animationDelay: mounted ? '500ms' : '500ms', color: 'var(--gray)' }}
      >
        把链接发给朋友，朋友打开后自动加入
      </p>
    </div>
  )
}
