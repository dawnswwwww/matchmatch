// app/room/[roomId]/components/RematchDialog.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useGameStore } from '@/lib/stores/gameStore'
import Button from '@/components/ui/Button'

export default function RematchDialog() {
  const { roomId, myRematchChoice, opponentRematchChoice, myPlayerId } = useGameStore()
  const { myUserId } = useGameStore.getState()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleVote(vote: boolean) {
    useGameStore.getState().setRematchChoice(vote)

    await supabase.from('rematch_votes').upsert({
      room_id: roomId,
      player_id: myPlayerId,
      vote,
    })

    await supabase.channel(`room:${roomId}`).send({
      type: 'broadcast',
      event: 'rematch:vote',
      payload: { vote, userId: myUserId },
    })
  }

  const isWaiting = myRematchChoice !== null

  return (
    <div
      className={`
        w-full rounded-2xl p-[var(--space-6)]
        transition-all duration-[var(--duration-slow)]
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      style={{
        transitionDelay: mounted ? '300ms' : '300ms',
        transitionTimingFunction: 'var(--ease-out-quart)',
        background: 'oklch(86% 0.08 122 / 0.12)',
        border: '2px solid oklch(86% 0.12 122 / 0.25)',
      }}
    >
      <h3
        className="text-lg font-bold mb-[var(--space-5)] text-center tracking-wide"
        style={{ color: 'var(--green-dark)' }}
      >
        再来一次？
      </h3>

      <div className="flex gap-[var(--space-3)] justify-center">
        <div className="relative">
          <Button
            variant={myRematchChoice === true ? 'primary' : 'secondary'}
            onClick={() => handleVote(true)}
            disabled={isWaiting}
            className="min-w-[120px]"
          >
            {myRematchChoice === true ? '✓' : '再来一次'}
          </Button>
          {opponentRematchChoice === true && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-lg">👤</div>
          )}
          {myRematchChoice === true && !opponentRematchChoice && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <span className="text-xs" style={{ color: 'var(--gray)' }}>等待中...</span>
              <span className="text-lg animate-pulse">⏳</span>
            </div>
          )}
        </div>

        <div className="relative">
          <Button
            variant={myRematchChoice === false ? 'primary' : 'secondary'}
            onClick={() => handleVote(false)}
            disabled={isWaiting}
            className="min-w-[120px]"
          >
            {myRematchChoice === false ? '✓' : '不用了'}
          </Button>
          {opponentRematchChoice === false && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-lg">👤</div>
          )}
          {myRematchChoice === false && !opponentRematchChoice && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <span className="text-xs" style={{ color: 'var(--gray)' }}>等待中...</span>
              <span className="text-lg animate-pulse">⏳</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
