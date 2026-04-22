// lib/stores/gameStore.ts
import { create } from 'zustand'
import type { Room, Player, Question } from '@/lib/supabase/types'

type RoomStatus = 'waiting' | 'playing' | 'finished' | 'expired' | 'full'

interface GameState {
  // Room
  roomId: string
  roomCode: string
  roomStatus: RoomStatus
  totalQuestions: number

  // Players
  myUserId: string
  myPlayerId: string
  opponentPlayerId: string | null
  opponentUserId: string | null

  // Questions & answers
  questions: Question[]
  currentQuestion: number
  myAnswers: Record<number, 'a' | 'b'>
  opponentAnswers: Record<number, 'a' | 'b' | null>

  // Local UI state
  opponentReady: boolean

  // Rematch
  myRematchChoice: boolean | null
  opponentRematchChoice: boolean | null

  // Actions
  setRoom: (room: Room) => void
  setQuestions: (questions: Question[]) => void
  setOpponent: (playerId: string, userId: string) => void
  setRoomStatus: (status: RoomStatus) => void
  setCurrentQuestion: (index: number) => void
  submitMyAnswer: (questionIndex: number, choice: 'a' | 'b') => void
  setOpponentAnswer: (questionIndex: number, choice: 'a' | 'b') => void
  setOpponentReady: (ready: boolean) => void
  setRematchChoice: (choice: boolean) => void
  setOpponentRematchChoice: (choice: boolean) => void
  resetForRematch: () => void
  reset: () => void
}

const initialState = {
  roomId: '',
  roomCode: '',
  roomStatus: 'waiting' as RoomStatus,
  totalQuestions: 0,
  myUserId: '',
  myPlayerId: '',
  opponentPlayerId: null as string | null,
  opponentUserId: null as string | null,
  questions: [],
  currentQuestion: 0,
  myAnswers: {} as Record<number, 'a' | 'b'>,
  opponentAnswers: {} as Record<number, 'a' | 'b' | null>,
  opponentReady: false,
  myRematchChoice: null as boolean | null,
  opponentRematchChoice: null as boolean | null,
}

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setRoom: (room) =>
    set({ roomId: room.id, roomCode: room.code, roomStatus: room.status, currentQuestion: room.current_question, totalQuestions: room.total_questions }),

  setQuestions: (questions) => set({ questions }),

  setOpponent: (playerId, userId) =>
    set({ opponentPlayerId: playerId, opponentUserId: userId }),

  setRoomStatus: (roomStatus) => set({ roomStatus }),

  setCurrentQuestion: (currentQuestion) => set({ currentQuestion }),

  submitMyAnswer: (questionIndex, choice) =>
    set((state) => ({
      myAnswers: { ...state.myAnswers, [questionIndex]: choice },
    })),

  setOpponentAnswer: (questionIndex, choice) =>
    set((state) => ({
      opponentAnswers: { ...state.opponentAnswers, [questionIndex]: choice },
    })),

  setOpponentReady: (opponentReady) => set({ opponentReady }),

  setRematchChoice: (myRematchChoice) => set({ myRematchChoice }),

  setOpponentRematchChoice: (opponentRematchChoice) => set({ opponentRematchChoice }),

  resetForRematch: () =>
    set({
      currentQuestion: 0,
      myAnswers: {},
      opponentAnswers: {},
      opponentReady: false,
      myRematchChoice: null,
      opponentRematchChoice: null,
      roomStatus: 'playing',
    }),

  reset: () => set(initialState),
}))
