// app/room/[roomId]/page.tsx
'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getUserId } from '@/lib/utils/userId'
import { useGameStore } from '@/lib/stores/gameStore'
import WaitingRoom from './components/WaitingRoom'
import QuestionCard from './components/QuestionCard'
import SyncIndicator from './components/SyncIndicator'
import ProgressBar from './components/ProgressBar'
import ResultPanel from './components/ResultPanel'
import RematchDialog from './components/RematchDialog'

export default function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>
}) {
  const { roomId } = use(params)
  const router = useRouter()
  const userId = getUserId()

  const {
    roomStatus,
    myPlayerId,
    currentQuestion,
    questions,
    setRoom,
    setRoomStatus,
    setOpponent,
    reset,
  } = useGameStore()

  useEffect(() => {
    reset()

    // Load room and self
    async function init() {
      const { data: room } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (!room) {
        router.push('/')
        return
      }

      setRoom(room)

      const { data: players } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)

      if (!players) return

      const me = players.find((p) => p.user_id === userId)
      if (!me) {
        router.push('/')
        return
      }

      // Store myPlayerId in store via a setter — add it to store
      useGameStore.setState({ myPlayerId: me.id, myUserId: userId })

      const opponent = players.find((p) => p.user_id !== userId)
      if (opponent) {
        setOpponent(opponent.id, opponent.user_id)
      }
    }

    init()
  }, [roomId, userId])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`)

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newPlayer = payload.new as { id: string; user_id: string }
          if (newPlayer.user_id !== userId) {
            setOpponent(newPlayer.id, newPlayer.user_id)
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms' }, (payload) => {
        const updated = payload.new as { status: string; current_question: number }
        setRoomStatus(updated.status as 'waiting' | 'playing' | 'finished' | 'expired')
        if ('current_question' in updated) {
          useGameStore.setState({ currentQuestion: updated.current_question })
        }
      })
      .on('broadcast', { event: 'answer_submitted' }, ({ payload }) => {
        if (payload.userId !== userId) {
          useGameStore.getState().setOpponentAnswer(payload.questionIndex, payload.choice)
        }
      })
      .on('broadcast', { event: 'question_result' }, ({ payload }) => {
        useGameStore.getState().setOpponentAnswer(payload.questionIndex, payload.choice)
        useGameStore.getState().setOpponentReady(true)
      })
      .on('broadcast', { event: 'rematch:vote' }, ({ payload }) => {
        if (payload.userId !== userId) {
          useGameStore.getState().setOpponentRematchChoice(payload.vote)
        }
      })
      .on('broadcast', { event: 'rematch:start' }, () => {
        useGameStore.getState().resetForRematch()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, userId])

  if (roomStatus === 'expired') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-4xl font-black mb-4">房间已过期</h2>
          <p className="text-[#868685] mb-6">3 分钟内无人加入，请重新创建房间</p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 rounded-full font-semibold"
            style={{ background: '#9fe870', color: '#163300' }}
          >
            返回首页
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      {roomStatus === 'waiting' && <WaitingRoom />}

      {roomStatus === 'playing' && (
        <div className="w-full max-w-md flex flex-col items-center gap-6">
          <ProgressBar current={currentQuestion + 1} total={questions.length || 5} />
          <QuestionCard />
          <SyncIndicator />
        </div>
      )}

      {roomStatus === 'finished' && (
        <div className="w-full max-w-md flex flex-col items-center gap-6">
          <ResultPanel />
          <RematchDialog />
        </div>
      )}
    </main>
  )
}