// app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getUserId } from '@/lib/utils/userId'
import { generateRoomCode } from '@/lib/utils/roomCode'
import Button from '@/components/ui/Button'
import RoomCodeInput from '@/components/ui/RoomCodeInput'
import { LayoutGroup, motion } from 'motion/react'
import RotatingText from '@/components/RotatingText'

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
        <LayoutGroup>
          <div className="mb-[var(--space-4)] relative flex flex-col items-start" style={{ fontFamily: 'Inter, sans-serif' }}>
            <motion.span
              layout
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="rounded-xl px-2 py-1 mb-2"
            >
              <span className="text-[clamp(48px,14vw,96px)] font-black leading-[0.85] tracking-[-0.03em]">
                Match
              </span>
            </motion.span>
            <motion.span layout className="overflow-hidden rounded-xl px-2 py-1" style={{ background: 'oklch(86% 0.12 122 / 0.2)' }}>
              <RotatingText
                texts={['Match', 'Minds', 'Vibes', 'Fun']}
                splitBy="characters"
                staggerDuration={0.06}
                rotationInterval={2000}
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '-120%' }}
                mainClassName="text-[clamp(48px,14vw,96px)] leading-[0.85] tracking-[-0.03em]"
                elementLevelClassName="font-black text-[var(--green)]"
              />
            </motion.span>
          </div>
        </LayoutGroup>

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
                className="w-10 h-10 rounded-full text-sm font-semibold transition-all duration-[var(--duration-base)] border-[3px]"
                style={
                  questionCount === n
                    ? { background: 'var(--green)', color: 'var(--green-dark)', borderColor: 'var(--green)', boxShadow: '3px 3px 0 0 var(--green-dark)' }
                    : { background: 'var(--surface)', color: 'var(--foreground)', borderColor: 'var(--foreground)', boxShadow: '3px 3px 0 0 var(--foreground)' }
                }
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Primary CTA */}
        <Button
          variant="primary"
          onClick={handleCreateRoom}
          disabled={loading}
          className={`create-room-btn ${mounted ? 'animate-fade-up' : 'opacity-0'}`}
        >
          {loading ? '创建中...' : '创建房间'}
        </Button>

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
          <RoomCodeInput
            value={joinCode}
            onChange={setJoinCode}
            maxLength={6}
            error={error}
          />
          <Button
            variant="secondary"
            onClick={handleJoinRoom}
            disabled={loading || joinCode.trim().length < 6}
            className="w-full"
          >
            加入
          </Button>
        </div>
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
