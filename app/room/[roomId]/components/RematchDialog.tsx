// app/room/[roomId]/components/RematchDialog.tsx
'use client'

import { supabase } from '@/lib/supabase/client'
import { useGameStore } from '@/lib/stores/gameStore'

export default function RematchDialog() {
  const { roomId, myRematchChoice, opponentRematchChoice, myPlayerId } = useGameStore()
  const { myUserId } = useGameStore.getState()

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

  return (
    <div className="w-full border border-[rgba(14,15,12,0.12)] rounded-[var(--radius-lg)] p-6">
      <h3 className="text-lg font-semibold mb-4 text-center">再来一次？</h3>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => handleVote(true)}
          disabled={myRematchChoice !== null}
          className={`py-2 px-6 rounded-[var(--radius-full)] font-semibold transition-all ${
            myRematchChoice === true
              ? 'bg-[var(--green)] text-[var(--green-dark)]'
              : 'bg-[var(--surface)] text-[var(--foreground)]'
          }`}
        >
          {myRematchChoice === true ? '✓ 等待中...' : '再来一次'}
        </button>
        <button
          onClick={() => handleVote(false)}
          disabled={myRematchChoice !== null}
          className={`py-2 px-6 rounded-[var(--radius-full)] font-semibold transition-all ${
            myRematchChoice === false
              ? 'bg-[var(--foreground)] text-[var(--background)]'
              : 'bg-[var(--surface)] text-[var(--foreground)]'
          }`}
        >
          {myRematchChoice === false ? '已跳过' : '不用了'}
        </button>
      </div>
      {opponentRematchChoice !== null && (
        <p className="text-center text-sm text-[#868685] mt-3">
          朋友已选择 {opponentRematchChoice ? '"再来一次"' : '"不用了"'}
        </p>
      )}
    </div>
  )
}
