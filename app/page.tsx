// app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getUserId } from '@/lib/utils/userId'
import { generateRoomCode } from '@/lib/utils/roomCode'

export default function HomePage() {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [questionCount, setQuestionCount] = useState(10)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleCreateRoom() {
    setLoading(true)
    setError('')

    const userId = getUserId()
    const code = generateRoomCode()

    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .insert({ code, status: 'waiting', total_questions: questionCount })
      .select()
      .single()

    if (roomErr || !room) {
      setError('创建房间失败，请重试')
      setLoading(false)
      return
    }

    const { error: playerErr } = await supabase.from('players').insert({
      room_id: room.id,
      user_id: userId,
    })

    if (playerErr) {
      setError('加入房间失败，请重试')
      setLoading(false)
      return
    }

    router.push(`/room/${room.id}`)
  }

  async function handleJoinRoom() {
    if (!joinCode.trim()) return
    setLoading(true)
    setError('')

    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select()
      .eq('code', joinCode.toUpperCase())
      .single()

    if (roomErr || !room) {
      setError('房间不存在')
      setLoading(false)
      return
    }

    if (room.status !== 'waiting') {
      setError('游戏已开始或已结束')
      setLoading(false)
      return
    }

    const userId = getUserId()

    const { error: playerErr } = await supabase.from('players').insert({
      room_id: room.id,
      user_id: userId,
    })

    if (playerErr) {
      setError('加入房间失败')
      setLoading(false)
      return
    }

    router.push(`/room/${room.id}`)
  }

  return (
    <main className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-[var(--space-6)] overflow-hidden">
      {/* Background decorative element — large faded circle */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: 'min(600px, 90vw)',
          height: 'min(600px, 90vw)',
          background: 'radial-gradient(circle, oklch(86% 0.08 122 / 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-[400px]">

        {/* Headline — fluid, massive */}
        <h1
          className={`
            text-[clamp(64px,18vw,120px)] font-black leading-[0.85]
            tracking-[-0.03em] mb-[var(--space-4)]
            ${mounted ? 'animate-fade-up' : 'opacity-0'}
          `}
          style={{
            fontFamily: 'Inter, sans-serif',
            animationDelay: mounted ? '0ms' : '0ms',
          }}
        >
          Match
          <br />
          <span style={{ color: 'var(--green)' }}>Match</span>
        </h1>

        {/* Subheadline */}
        <p
          className={`
            text-[clamp(16px,3vw,20px)] text-[var(--gray)] font-medium mb-[var(--space-6)]
            ${mounted ? 'animate-fade-up' : 'opacity-0'}
          `}
          style={{ animationDelay: mounted ? '80ms' : '80ms' }}
        >
          看看你和朋友的默契程度
        </p>

        {/* Question count selector */}
        <div
          className={`
            flex items-center gap-[var(--space-3)] mb-[var(--space-4)]
            ${mounted ? 'animate-fade-up' : 'opacity-0'}
          `}
          style={{ animationDelay: mounted ? '120ms' : '120ms' }}
        >
          <span className="text-sm text-[var(--gray)]">题目数量</span>
          <div className="flex gap-2">
            {[5, 10, 15, 20].map(n => (
              <button
                key={n}
                onClick={() => setQuestionCount(n)}
                className={`
                  w-10 h-10 rounded-full text-sm font-semibold
                  transition-all duration-[var(--duration-base)]
                `}
                style={
                  questionCount === n
                    ? { background: 'var(--green)', color: 'var(--green-dark)' }
                    : { background: 'var(--surface)', color: 'var(--foreground)' }
                }
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={handleCreateRoom}
          disabled={loading}
          className={`
            w-full max-w-[280px] py-[var(--space-4)] px-[var(--space-8)]
            rounded-full font-semibold text-lg
            transition-transform duration-[var(--duration-base)]
            ${mounted ? 'animate-fade-up' : 'opacity-0'}
          `}
          style={{
            background: 'var(--green)',
            color: 'var(--green-dark)',
            animationDelay: mounted ? '160ms' : '160ms',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'scale(1.04)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.97)' }}
          onMouseUp={e => { if (!loading) e.currentTarget.style.transform = 'scale(1.04)' }}
        >
          {loading ? '创建中...' : '创建房间'}
        </button>

        {/* Divider */}
        <div
          className={`
            flex items-center gap-[var(--space-4)] my-[var(--space-8)] w-full max-w-[280px]
            ${mounted ? 'animate-fade-up' : 'opacity-0'}
          `}
          style={{ animationDelay: mounted ? '240ms' : '240ms' }}
        >
          <div className="flex-1 h-px bg-[var(--surface)]" />
          <span className="text-sm text-[var(--gray)] font-medium">或</span>
          <div className="flex-1 h-px bg-[var(--surface)]" />
        </div>

        {/* Join section */}
        <div
          className={`
            flex flex-col items-center gap-[var(--space-3)] w-full max-w-[280px]
            ${mounted ? 'animate-fade-up' : 'opacity-0'}
          `}
          style={{ animationDelay: mounted ? '320ms' : '320ms' }}
        >
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="输入房间号"
            maxLength={6}
            className="
              w-full py-[var(--space-3)] px-[var(--space-4)]
              text-center text-xl tracking-[0.2em] font-semibold
              bg-[var(--surface)] rounded-2xl
              border-2 border-transparent
              transition-all duration-[var(--duration-base)]
              placeholder:text-[var(--gray)] placeholder:tracking-normal placeholder:font-normal
              focus:border-[var(--green)] focus:outline-none
            "
          />
          <button
            onClick={handleJoinRoom}
            disabled={loading || joinCode.trim().length < 6}
            className="
              w-full py-[var(--space-3)] px-[var(--space-8)]
              rounded-full font-semibold text-lg
              transition-all duration-[var(--duration-base)]
              border-2
              disabled:opacity-40 disabled:cursor-not-allowed
            "
            style={{
              borderColor: 'var(--foreground)',
              color: 'var(--foreground)',
            }}
            onMouseEnter={e => { if (!loading && joinCode.length >= 6) e.currentTarget.style.background = 'var(--foreground)', e.currentTarget.style.color = 'var(--background)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--foreground)' }}
            onMouseDown={e => { if (!loading && joinCode.length >= 6) e.currentTarget.style.transform = 'scale(0.97)' }}
            onMouseUp={e => { if (!loading && joinCode.length >= 6) e.currentTarget.style.transform = 'scale(1)' }}
          >
            加入
          </button>
        </div>

        {/* Error */}
        {error && (
          <p
            className="mt-[var(--space-4)] text-sm font-medium animate-fade-in"
            style={{ color: '#d03238' }}
          >
            {error}
          </p>
        )}
      </div>

      {/* Footer tagline */}
      <p
        className={`
          absolute bottom-[var(--space-8)] text-sm text-[var(--gray)]
          ${mounted ? 'animate-fade-in' : 'opacity-0'}
        `}
        style={{ animationDelay: mounted ? '600ms' : '600ms' }}
      >
        无需注册，一分钟玩完
      </p>
    </main>
  )
}
