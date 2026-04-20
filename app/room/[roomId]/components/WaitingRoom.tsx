// app/room/[roomId]/components/WaitingRoom.tsx
'use client'

import { useGameStore } from '@/lib/stores/gameStore'

export default function WaitingRoom() {
  const { roomCode, roomId } = useGameStore()

  async function copyLink() {
    const url = `${window.location.origin}/room/${roomId}`
    await navigator.clipboard.writeText(url)
  }

  return (
    <div className="text-center">
      <div
        className="text-[64px] font-black leading-[0.85] mb-4"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {roomCode}
      </div>
      <p className="text-[#868685] mb-8">房间号，分享给朋友</p>
      <button
        onClick={copyLink}
        className="mb-8 py-3 px-8 rounded-full font-semibold transition-transform text-[18px]"
        style={{
          background: 'rgba(22,51,0,0.08)',
          color: '#0e0f0c',
        }}
      >
        复制链接
      </button>
      <div className="flex items-center justify-center gap-2 text-[#868685]">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-[#9fe870] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#9fe870] animate-bounce" style={{ animationDelay: '160ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#9fe870] animate-bounce" style={{ animationDelay: '320ms' }} />
        </div>
        <span className="text-sm">等待好友加入...</span>
      </div>
    </div>
  )
}
