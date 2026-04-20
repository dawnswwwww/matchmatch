// app/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getUserId } from '@/lib/utils/userId'
import { generateRoomCode } from '@/lib/utils/roomCode'

export default function HomePage() {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreateRoom() {
    setLoading(true)
    setError('')

    const userId = getUserId()
    const code = generateRoomCode()

    // Insert room + self as player
    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .insert({ code, status: 'waiting', total_questions: 5 })
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

    // Find room by code
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
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1
          className="text-[96px] font-black leading-[0.85] mb-6"
          style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
        >
          MatchMatch
        </h1>
        <p className="text-lg text-[#868685] mb-12">
          看看你和朋友的默契程度
        </p>

        <button
          onClick={handleCreateRoom}
          disabled={loading}
          className="w-full max-w-[280px] py-4 px-6 rounded-full text-[18px] font-semibold transition-transform"
          style={{
            background: '#9fe870',
            color: '#163300',
          }}
        >
          {loading ? '创建中...' : '创建房间'}
        </button>

        <div className="mt-8 text-[#868685] text-sm">或</div>

        <div className="mt-6">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="输入房间号"
            maxLength={6}
            className="w-full max-w-[200px] px-4 py-3 text-center text-lg tracking-widest border border-[rgba(14,15,12,0.12)] rounded-xl"
          />
          <button
            onClick={handleJoinRoom}
            disabled={loading || !joinCode.trim()}
            className="mt-3 w-full max-w-[200px] py-3 px-6 rounded-full text-[18px] font-semibold transition-transform border border-[rgba(14,15,12,0.12)]"
          >
            加入
          </button>
        </div>

        {error && (
          <p className="mt-4 text-[#d03238] text-sm">{error}</p>
        )}
      </div>
    </main>
  )
}
