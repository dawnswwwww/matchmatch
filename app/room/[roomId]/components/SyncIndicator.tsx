// app/room/[roomId]/components/SyncIndicator.tsx
'use client'

import { useGameStore } from '@/lib/stores/gameStore'

export default function SyncIndicator() {
  const { opponentReady, myAnswers, currentQuestion } = useGameStore()
  const myAnswered = !!myAnswers[currentQuestion]

  if (!myAnswered) {
    return <p className="text-[#868685] text-sm">选择后等待好友...</p>
  }

  if (myAnswered && !opponentReady) {
    return <p className="text-[#868685] text-sm">等待好友选择...</p>
  }

  return <p className="text-[#9fe870] text-sm font-semibold">匹配结果已显示 ↑</p>
}
