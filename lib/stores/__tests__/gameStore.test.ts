import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../gameStore'

describe('gameStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useGameStore.getState().reset()
  })

  describe('initial state', () => {
    it('has empty roomId', () => {
      expect(useGameStore.getState().roomId).toBe('')
    })
    it('has waiting status', () => {
      expect(useGameStore.getState().roomStatus).toBe('waiting')
    })
    it('has empty questions', () => {
      expect(useGameStore.getState().questions).toEqual([])
    })
    it('has empty myAnswers', () => {
      expect(useGameStore.getState().myAnswers).toEqual({})
    })
    it('has empty opponentAnswers', () => {
      expect(useGameStore.getState().opponentAnswers).toEqual({})
    })
  })

  describe('submitMyAnswer', () => {
    it('records answer at correct index', () => {
      const { submitMyAnswer } = useGameStore.getState()
      submitMyAnswer(0, 'a')
      expect(useGameStore.getState().myAnswers[0]).toBe('a')
    })

    it('overwrites previous answer at same index', () => {
      const { submitMyAnswer } = useGameStore.getState()
      submitMyAnswer(0, 'a')
      submitMyAnswer(0, 'b')
      expect(useGameStore.getState().myAnswers[0]).toBe('b')
    })

    it('records multiple answers at different indices', () => {
      const { submitMyAnswer } = useGameStore.getState()
      submitMyAnswer(0, 'a')
      submitMyAnswer(1, 'b')
      submitMyAnswer(2, 'a')
      expect(useGameStore.getState().myAnswers).toEqual({ 0: 'a', 1: 'b', 2: 'a' })
    })
  })

  describe('setOpponentAnswer', () => {
    it('records opponent answer at correct index', () => {
      const { setOpponentAnswer } = useGameStore.getState()
      setOpponentAnswer(0, 'b')
      expect(useGameStore.getState().opponentAnswers[0]).toBe('b')
    })

    it('returns undefined for unanswered questions (key not set)', () => {
      expect(useGameStore.getState().opponentAnswers[99]).toBeUndefined()
    })
  })

  describe('setRoom', () => {
    it('sets room properties', () => {
      const { setRoom } = useGameStore.getState()
      setRoom({
        id: 'room-123',
        code: 'ABC123',
        status: 'playing',
        question_set_id: 'local',
        current_question: 5,
        total_questions: 10,
        created_at: '2024-01-01',
        expires_at: null,
        finished_at: null,
      })
      const state = useGameStore.getState()
      expect(state.roomId).toBe('room-123')
      expect(state.roomCode).toBe('ABC123')
      expect(state.roomStatus).toBe('playing')
      expect(state.currentQuestion).toBe(5)
      expect(state.totalQuestions).toBe(10)
    })
  })

  describe('setQuestions', () => {
    it('sets questions array', () => {
      const { setQuestions } = useGameStore.getState()
      const questions = [
        { id: 'q1', question_set_id: 'local', text: 'Q1', option_a: 'A', option_b: 'B', display_order: 0 },
        { id: 'q2', question_set_id: 'local', text: 'Q2', option_a: 'A', option_b: 'B', display_order: 1 },
      ]
      setQuestions(questions)
      expect(useGameStore.getState().questions).toEqual(questions)
    })
  })

  describe('setOpponent', () => {
    it('sets opponent player and user id', () => {
      const { setOpponent } = useGameStore.getState()
      setOpponent('player-456', 'user-789')
      const state = useGameStore.getState()
      expect(state.opponentPlayerId).toBe('player-456')
      expect(state.opponentUserId).toBe('user-789')
    })
  })

  describe('setRoomStatus', () => {
    it('updates room status', () => {
      const { setRoomStatus } = useGameStore.getState()
      setRoomStatus('playing')
      expect(useGameStore.getState().roomStatus).toBe('playing')
    })
  })

  describe('setCurrentQuestion', () => {
    it('updates current question index', () => {
      const { setCurrentQuestion } = useGameStore.getState()
      setCurrentQuestion(5)
      expect(useGameStore.getState().currentQuestion).toBe(5)
    })
  })

  describe('setOpponentReady', () => {
    it('sets opponent ready state', () => {
      const { setOpponentReady } = useGameStore.getState()
      setOpponentReady(true)
      expect(useGameStore.getState().opponentReady).toBe(true)
    })
  })

  describe('setRematchChoice', () => {
    it('records my rematch choice', () => {
      const { setRematchChoice } = useGameStore.getState()
      setRematchChoice(true)
      expect(useGameStore.getState().myRematchChoice).toBe(true)
    })
  })

  describe('setOpponentRematchChoice', () => {
    it('records opponent rematch choice', () => {
      const { setOpponentRematchChoice } = useGameStore.getState()
      setOpponentRematchChoice(true)
      expect(useGameStore.getState().opponentRematchChoice).toBe(true)
    })
  })

  describe('resetForRematch', () => {
    it('resets question state but keeps room info', () => {
      const store = useGameStore.getState()
      // Setup some state
      store.setRoom({
        id: 'room-123',
        code: 'ABC123',
        status: 'finished',
        question_set_id: 'local',
        current_question: 10,
        total_questions: 10,
        created_at: '2024-01-01',
        expires_at: null,
        finished_at: null,
      })
      store.submitMyAnswer(0, 'a')
      store.setOpponentAnswer(0, 'a')
      store.setRematchChoice(true)
      store.setOpponentRematchChoice(true)
      store.setOpponentReady(true)

      // Reset for rematch
      store.resetForRematch()

      const state = useGameStore.getState()
      expect(state.currentQuestion).toBe(0)
      expect(state.myAnswers).toEqual({})
      expect(state.opponentAnswers).toEqual({})
      expect(state.opponentReady).toBe(false)
      expect(state.myRematchChoice).toBeNull()
      expect(state.opponentRematchChoice).toBeNull()
      expect(state.roomStatus).toBe('playing')
      expect(state.roomId).toBe('room-123') // Room info kept
    })
  })

  describe('reset', () => {
    it('resets entire state to initial', () => {
      const store = useGameStore.getState()
      store.setRoom({
        id: 'room-123',
        code: 'ABC123',
        status: 'playing',
        question_set_id: 'local',
        current_question: 5,
        total_questions: 10,
        created_at: '2024-01-01',
        expires_at: null,
        finished_at: null,
      })
      store.submitMyAnswer(0, 'a')
      store.setOpponentAnswer(0, 'b')
      store.setOpponentReady(true)

      store.reset()

      const state = useGameStore.getState()
      expect(state.roomId).toBe('')
      expect(state.roomCode).toBe('')
      expect(state.roomStatus).toBe('waiting')
      expect(state.myAnswers).toEqual({})
      expect(state.opponentAnswers).toEqual({})
      expect(state.opponentReady).toBe(false)
      expect(state.currentQuestion).toBe(0)
    })
  })
})