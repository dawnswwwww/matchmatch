'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getUserId } from '@/lib/utils/userId'
import { useGameStore } from '@/lib/stores/gameStore'
import { getLocalQuestionsBySetId } from '@/lib/questions/adapter'
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
    currentQuestion,
    questions,
    setRoom,
    setRoomStatus,
    setOpponent,
    reset,
  } = useGameStore()

  useEffect(() => {
    reset()

    async function init() {
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (roomError || !room) {
        router.push('/')
        return
      }

      setRoom(room)

      // 优先从本地题库加载，fallback 到 Supabase
      const localQuestions = getLocalQuestionsBySetId(room.question_set_id || 'default')
      if (localQuestions) {
        useGameStore.getState().setQuestions(localQuestions)
      } else if (room.question_set_id) {
        const { data } = await supabase
          .from('questions')
          .select('*')
          .eq('question_set_id', room.question_set_id)
          .order('display_order')
        if (data) {
          useGameStore.getState().setQuestions(data)
        }
      }

      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)

      if (playersError || !players) return

      const me = players.find((p) => p.user_id === userId)
      if (!me) {
        router.push('/')
        return
      }

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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'players' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newPlayer = payload.new as { id: string; user_id: string }
          if (newPlayer.user_id !== userId) {
            setOpponent(newPlayer.id, newPlayer.user_id)
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
        const updated = payload.new as { status: string; current_question: number }
        setRoomStatus(updated.status as 'waiting' | 'playing' | 'finished' | 'expired')
        if ('current_question' in updated) {
          useGameStore.setState({ currentQuestion: updated.current_question })
        }
      })
      .on('broadcast', { event: 'answer_submitted' }, ({ payload }) => {
        if (payload.userId !== userId) {
          useGameStore.getState().setOpponentAnswer(payload.questionIndex, payload.choice)

          // If both players have answered this question, trigger advance to next question
          const { myAnswers } = useGameStore.getState()
          if (myAnswers[payload.questionIndex] !== undefined) {
            fetch('/api/advance-question', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ roomId, questionIndex: payload.questionIndex }),
            })
          }
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
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-[var(--space-6)]">
        <div className="text-center flex flex-col items-center gap-[var(--space-4)] max-w-sm">
          <div
            className="text-5xl font-black leading-tight mb-[var(--space-2)]"
            style={{ fontFamily: 'Inter, sans-serif', color: 'var(--foreground)' }}
          >
            房间已过期
          </div>
          <p className="text-base" style={{ color: 'var(--gray)' }}>
            3 分钟内无人加入，请重新创建房间
          </p>
          <button
            onClick={() => router.push('/')}
            className="
              mt-[var(--space-4)]
              py-[var(--space-3)] px-[var(--space-8)]
              rounded-full font-semibold text-base
              transition-all duration-[var(--duration-base)]
            "
            style={{ background: 'var(--green)', color: 'var(--green-dark)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.04)' }}
          >
            返回首页
          </button>
        </div>
      </main>
    )
  }

  return (
    <main
      className="
        min-h-screen bg-[var(--background)]
        flex flex-col items-center justify-center
        px-[var(--space-6)] py-[var(--space-12)]
      "
    >
      {roomStatus === 'waiting' && (
        <div className="w-full max-w-md">
          <WaitingRoom />
        </div>
      )}

      {roomStatus === 'playing' && (
        <div className="w-full max-w-md flex flex-col items-center gap-[var(--space-8)]">
          <ProgressBar current={currentQuestion + 1} total={questions.length || 5} />
          <div className="w-full">
            <QuestionCard />
          </div>
          <SyncIndicator />
        </div>
      )}

      {roomStatus === 'finished' && (
        <div className="w-full max-w-md flex flex-col items-center gap-[var(--space-8)]">
          <ResultPanel />
          <RematchDialog />
        </div>
      )}
    </main>
  )
}
