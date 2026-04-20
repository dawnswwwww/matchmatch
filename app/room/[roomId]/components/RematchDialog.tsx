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
    <div className="w-full border border-[rgba(14,15,12,0.12)] rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4 text-center">再来一次？</h3>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => handleVote(true)}
          disabled={myRematchChoice !== null}
          className={`py-2 px-6 rounded-full font-semibold transition-all ${
            myRematchChoice === true
              ? 'bg-[#9fe870] text-[#163300]'
              : 'bg-[rgba(22,51,0,0.08)] text-[#0e0f0c]'
          }`}
        >
          {myRematchChoice === true ? '✓ 等待中...' : '再来一次'}
        </button>
        <button
          onClick={() => handleVote(false)}
          disabled={myRematchChoice !== null}
          className={`py-2 px-6 rounded-full font-semibold transition-all ${
            myRematchChoice === false
              ? 'bg-[rgba(208,50,56,0.1)] text-[#d03238]'
              : 'bg-[rgba(22,51,0,0.08)] text-[#0e0f0c]'
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
