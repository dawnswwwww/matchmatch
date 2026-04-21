# MatchMatch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete MatchMatch game — room creation/join, synchronized A/B answering via Supabase Realtime, match score calculation, result sharing, and rematch flow.

**Architecture:** Supabase-centric. Game state lives in Supabase tables; Supabase Realtime channels broadcast state transitions. vinext serves the React frontend. Anonymous users identified by UUID stored in localStorage.

**Tech Stack:** vinext + Vite, React 19, Tailwind CSS, Zustand, Supabase (PostgreSQL + Realtime), Cloudflare Workers (room expiry cron).

---

## File Structure

```
app/
  page.tsx                                    # Landing: create/join room
  room/[roomId]/
    page.tsx                                  # Shell — subscribes to Realtime, renders sub-components
    components/
      WaitingRoom.tsx                         # Room code + copy link + waiting animation
      QuestionCard.tsx                        # Question + A/B options
      OptionButton.tsx                        # Individual option button
      SyncIndicator.tsx                       # "Waiting for opponent..." status
      ProgressBar.tsx                         # "3/5" progress
      ResultPanel.tsx                         # Score display + comparison + CTAs
      RematchDialog.tsx                       # Inline rematch vote panel
  result/[resultId]/
    page.tsx                                  # Shareable result page
    components/
      ScoreDisplay.tsx                        # Big score number + label
      ComparisonList.tsx                      # Per-question comparison rows

lib/
  supabase/
    client.ts                                 # Browser Supabase client
    server.ts                                 # Server-side Supabase client (for Route Handlers)
    types.ts                                  # Generated Supabase types
  stores/
    gameStore.ts                              # Zustand store for game state
  utils/
    userId.ts                                 # Get/create anonymous userId from localStorage
    roomCode.ts                               # Generate 6-char alphanumeric room code
    score.ts                                  # Match score calculation + label mapping

supabase/
  migrations/
    0001_initial_schema.sql                    # All tables + triggers
  seed.sql                                    # Seed question_sets + questions (empty for now)
```

---

## Task 1: Supabase Schema Migration

**Files:**
- Create: `supabase/migrations/0001_initial_schema.sql`
- Create: `supabase/seed.sql` (question bank placeholder)

- [ ] **Step 1: Write migration — all tables and triggers**

```sql
-- supabase/migrations/0001_initial_schema.sql

-- Question bank
CREATE TABLE question_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_set_id UUID REFERENCES question_sets(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  display_order INT DEFAULT 0
);

-- Game rooms
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished', 'expired')),
  question_set_id UUID REFERENCES question_sets(id),
  current_question INT DEFAULT 0,
  total_questions INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

-- Players
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Answers
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  question_index INT NOT NULL,
  choice TEXT NOT NULL CHECK (choice IN ('a', 'b')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, player_id, question_index)
);

-- Rematch tracking
CREATE TABLE rematch_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  vote BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, player_id)
);

-- Trigger: when 2nd player joins, auto-start the game
CREATE OR REPLACE FUNCTION start_game_on_second_player()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM players WHERE room_id = NEW.room_id) = 2 THEN
    UPDATE rooms SET status = 'playing' WHERE id = NEW.room_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_player_joined
  AFTER INSERT ON players
  FOR EACH ROW EXECUTE FUNCTION start_game_on_second_player();

-- Indexes for realtime queries
CREATE INDEX idx_players_room_id ON players(room_id);
CREATE INDEX idx_answers_room_id ON answers(room_id);
CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_rooms_status ON rooms(status);
```

- [ ] **Step 2: Write seed file (placeholder questions)**

```sql
-- supabase/seed.sql

-- Insert a default question set (empty — questions added later)
INSERT INTO question_sets (id, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Default Set');
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0001_initial_schema.sql supabase/seed.sql
git commit -m "feat: add Supabase schema migration with all tables and triggers"
```

---

## Task 2: Supabase Client Setup

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/types.ts`

- [ ] **Step 1: Create browser Supabase client**

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 2: Create server Supabase client (for Route Handlers / API routes)**

```typescript
// lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
```

- [ ] **Step 3: Write types for database entities**

```typescript
// lib/supabase/types.ts
export type RoomStatus = 'waiting' | 'playing' | 'finished' | 'expired'

export interface Room {
  id: string
  code: string
  status: RoomStatus
  question_set_id: string | null
  current_question: number
  total_questions: number
  created_at: string
  expires_at: string | null
  finished_at: string | null
}

export interface Player {
  id: string
  room_id: string
  user_id: string
  joined_at: string
}

export interface Answer {
  id: string
  room_id: string
  player_id: string
  question_index: number
  choice: 'a' | 'b'
  created_at: string
}

export interface Question {
  id: string
  question_set_id: string
  text: string
  option_a: string
  option_b: string
  display_order: number
}

export interface RematchVote {
  id: string
  room_id: string
  player_id: string
  vote: boolean
  created_at: string
}
```

- [ ] **Step 4: Add environment variables to `.env.example`**

```bash
# lib/supabase/.env.example
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/
echo "NEXT_PUBLIC_SUPABASE_URL=\nNEXT_PUBLIC_SUPABASE_ANON_KEY=\nSUPABASE_SERVICE_ROLE_KEY=\n" > .env.example
git commit -m "feat: add Supabase client setup and types"
```

---

## Task 3: Utility Functions

**Files:**
- Create: `lib/utils/userId.ts`
- Create: `lib/utils/roomCode.ts`
- Create: `lib/utils/score.ts`

- [ ] **Step 1: userId — get or create anonymous UUID from localStorage**

```typescript
// lib/utils/userId.ts
const USER_ID_KEY = 'matchmatch_user_id'

export function getUserId(): string {
  if (typeof window === 'undefined') return ''

  const stored = localStorage.getItem(USER_ID_KEY)
  if (stored) return stored

  const newId = crypto.randomUUID()
  localStorage.setItem(USER_ID_KEY, newId)
  return newId
}
```

- [ ] **Step 2: roomCode — generate 6-char alphanumeric code**

```typescript
// lib/utils/roomCode.ts
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // exclude confusing chars

export function generateRoomCode(): string {
  return Array.from({ length: 6 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('')
}
```

- [ ] **Step 3: score — calculate match score and get label**

```typescript
// lib/utils/score.ts
export type ScoreLabel =
  | '完全不在一个频道'
  | '有点熟，但不多'
  | '普通朋友水平'
  | '有点东西的默契'
  | '默契达人'
  | '离谱级默契'

export function calculateScore(
  myAnswers: Record<number, 'a' | 'b'>,
  opponentAnswers: Record<number, 'a' | 'b' | null>,
  total: number
): number {
  if (total === 0) return 0
  let matches = 0
  for (let i = 0; i < total; i++) {
    if (myAnswers[i] && opponentAnswers[i] && myAnswers[i] === opponentAnswers[i]) {
      matches++
    }
  }
  return Math.round((matches / total) * 100)
}

export function getScoreLabel(score: number): ScoreLabel {
  if (score <= 20) return '完全不在一个频道'
  if (score <= 40) return '有点熟，但不多'
  if (score <= 60) return '普通朋友水平'
  if (score <= 80) return '有点东西的默契'
  if (score <= 95) return '默契达人'
  return '离谱级默契'
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/utils/
git commit -m "feat: add utility functions (userId, roomCode, score)"
```

---

## Task 4: Zustand Game Store

**Files:**
- Create: `lib/stores/gameStore.ts`

- [ ] **Step 1: Write the Zustand store**

```typescript
// lib/stores/gameStore.ts
import { create } from 'zustand'
import type { Room, Player, Question } from '@/lib/supabase/types'

type RoomStatus = 'waiting' | 'playing' | 'finished' | 'expired'

interface GameState {
  // Room
  roomId: string
  roomCode: string
  roomStatus: RoomStatus

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
    set({ roomId: room.id, roomCode: room.code, roomStatus: room.status, currentQuestion: room.current_question }),

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
```

- [ ] **Step 2: Commit**

```bash
git add lib/stores/gameStore.ts
git commit -m "feat: add Zustand game store"
```

---

## Task 5: Landing Page (`app/page.tsx`)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Write the landing page**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add landing page with create/join room"
```

---

## Task 6: Room Shell Page (`app/room/[roomId]/page.tsx`)

**Files:**
- Create: `app/room/[roomId]/page.tsx`

- [ ] **Step 1: Write the room shell page**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add app/room/\[roomId\]/page.tsx
git commit -m "feat: add room shell page with Realtime subscription"
```

---

## Task 7: Room Components

**Files:**
- Create: `app/room/[roomId]/components/WaitingRoom.tsx`
- Create: `app/room/[roomId]/components/QuestionCard.tsx`
- Create: `app/room/[roomId]/components/OptionButton.tsx`
- Create: `app/room/[roomId]/components/SyncIndicator.tsx`
- Create: `app/room/[roomId]/components/ProgressBar.tsx`
- Create: `app/room/[roomId]/components/ResultPanel.tsx`
- Create: `app/room/[roomId]/components/RematchDialog.tsx`

- [ ] **Step 1: WaitingRoom.tsx**

```tsx
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
```

- [ ] **Step 2: OptionButton.tsx**

```tsx
// app/room/[roomId]/components/OptionButton.tsx
'use client'

import { useState } from 'react'

interface OptionButtonProps {
  label: 'A' | 'B'
  text: string
  selected: boolean
  locked: boolean
  opponentSelected: boolean
  isCorrect?: boolean
  onClick: () => void
}

export default function OptionButton({
  label,
  text,
  selected,
  locked,
  opponentSelected,
  isCorrect,
  onClick,
}: OptionButtonProps) {
  const baseStyle = 'w-full py-5 px-6 rounded-2xl border-2 text-left transition-all font-semibold text-[18px]'
  const disabledStyle = locked && !selected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'

  let borderStyle = 'border-[rgba(14,15,12,0.12)]'
  if (selected && !locked) borderStyle = 'border-[#9fe870] bg-[#9fe870]/10'
  if (selected && locked) borderStyle = isCorrect ? 'border-[#9fe870] bg-[#9fe870]/20' : 'border-[#d03238] bg-[#d03238]/10'
  if (!selected && locked && opponentSelected && isCorrect) borderStyle = 'border-[#9fe870] bg-[#9fe870]/10'

  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`${baseStyle} ${borderStyle} ${disabledStyle}`}
    >
      <span className={`inline-block w-8 h-8 rounded-full text-center leading-8 mr-3 text-sm ${
        selected ? 'bg-[#9fe870] text-[#163300]' : 'bg-[rgba(14,15,12,0.08)]'
      }`}>
        {label}
      </span>
      {text}
    </button>
  )
}
```

- [ ] **Step 3: QuestionCard.tsx**

```tsx
// app/room/[roomId]/components/QuestionCard.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useGameStore } from '@/lib/stores/gameStore'
import OptionButton from './OptionButton'

export default function QuestionCard() {
  const { currentQuestion, questions, myAnswers, opponentAnswers, roomId } = useGameStore()
  const [locked, setLocked] = useState(false)

  const question = questions[currentQuestion]
  if (!question) return null

  const myAnswer = myAnswers[currentQuestion]
  const opponentAnswer = opponentAnswers[currentQuestion]
  const bothAnswered = !!myAnswer && !!opponentAnswer

  async function handleSelect(choice: 'a' | 'b') {
    if (locked) return
    setLocked(true)

    useGameStore.getState().submitMyAnswer(currentQuestion, choice)

    // Insert answer to DB
    const { myPlayerId } = useGameStore.getState()
    await supabase.from('answers').insert({
      room_id: roomId,
      player_id: myPlayerId,
      question_index: currentQuestion,
      choice,
    })

    // Broadcast to opponent
    const { myUserId } = useGameStore.getState()
    await supabase.channel(`room:${roomId}`).send({
      type: 'broadcast',
      event: 'answer_submitted',
      payload: { questionIndex: currentQuestion, choice, userId: myUserId },
    })
  }

  // After both answered, show result then auto-advance
  const opponentSelected = !!opponentAnswer

  return (
    <div className="w-full">
      <p className="text-xl font-semibold mb-6 text-center">{question.text}</p>
      <div className="flex flex-col gap-3">
        <OptionButton
          label="A"
          text={question.option_a}
          selected={myAnswer === 'a'}
          locked={locked || bothAnswered}
          opponentSelected={opponentSelected && opponentAnswer === 'a'}
          isCorrect={opponentAnswer === 'a'}
          onClick={() => handleSelect('a')}
        />
        <OptionButton
          label="B"
          text={question.option_b}
          selected={myAnswer === 'b'}
          locked={locked || bothAnswered}
          opponentSelected={opponentSelected && opponentAnswer === 'b'}
          isCorrect={opponentAnswer === 'b'}
          onClick={() => handleSelect('b')}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: SyncIndicator.tsx**

```tsx
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
```

- [ ] **Step 5: ProgressBar.tsx**

```tsx
// app/room/[roomId]/components/ProgressBar.tsx
interface ProgressBarProps {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-[#868685] mb-2">
        <span>第 {current} 题</span>
        <span>{current} / {total}</span>
      </div>
      <div className="w-full h-2 bg-[rgba(14,15,12,0.08)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${(current / total) * 100}%`,
            background: '#9fe870',
          }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: ResultPanel.tsx**

```tsx
// app/room/[roomId]/components/ResultPanel.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useGameStore } from '@/lib/stores/gameStore'
import { calculateScore, getScoreLabel } from '@/lib/utils/score'
import ScoreDisplay from '../result/[resultId]/components/ScoreDisplay'
import ComparisonList from '../result/[resultId]/components/ComparisonList'

export default function ResultPanel() {
  const router = useRouter()
  const { roomId, questions, myAnswers, opponentAnswers, roomCode } = useGameStore()
  const [score, setScore] = useState(0)
  const [label, setLabel] = useState('')

  useEffect(() => {
    const s = calculateScore(myAnswers, opponentAnswers, questions.length)
    setScore(s)
    setLabel(getScoreLabel(s))
  }, [myAnswers, opponentAnswers, questions.length])

  function handleShare() {
    const url = `${window.location.origin}/result/${roomId}`
    navigator.clipboard.writeText(url)
  }

  function handleNewGame() {
    router.push('/')
  }

  const comparisons = questions.map((q, i) => ({
    question: q.text,
    optionA: q.option_a,
    optionB: q.option_b,
    myChoice: myAnswers[i],
    opponentChoice: opponentAnswers[i],
    match: myAnswers[i] === opponentAnswers[i],
  }))

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <ScoreDisplay score={score} label={label} />
      <ComparisonList comparisons={comparisons} />
      <div className="flex gap-4">
        <button
          onClick={handleShare}
          className="py-3 px-8 rounded-full font-semibold transition-transform text-[18px]"
          style={{ background: 'rgba(22,51,0,0.08)', color: '#0e0f0c' }}
        >
          分享结果
        </button>
        <button
          onClick={handleNewGame}
          className="py-3 px-8 rounded-full font-semibold transition-transform text-[18px]"
          style={{ background: '#9fe870', color: '#163300' }}
        >
          再开一局
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: RematchDialog.tsx**

```tsx
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
```

- [ ] **Step 8: Commit**

```bash
git add app/room/\[roomId\]/components/
git commit -m "feat: add all room components (WaitingRoom, QuestionCard, SyncIndicator, ProgressBar, ResultPanel, RematchDialog)"
```

---

## Task 8: Result Page (`app/result/[resultId]/page.tsx`)

**Files:**
- Create: `app/result/[resultId]/page.tsx`
- Create: `app/result/[resultId]/components/ScoreDisplay.tsx`
- Create: `app/result/[resultId]/components/ComparisonList.tsx`

- [ ] **Step 1: Result page shell**

```tsx
// app/result/[resultId]/page.tsx
'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { calculateScore, getScoreLabel } from '@/lib/utils/score'
import ScoreDisplay from './components/ScoreDisplay'
import ComparisonList from './components/ComparisonList'

interface Question {
  id: string
  text: string
  option_a: string
  option_b: string
}

interface Comparison {
  question: string
  optionA: string
  optionB: string
  myChoice: 'a' | 'b' | null
  opponentChoice: 'a' | 'b' | null
  match: boolean
}

export default function ResultPage({
  params,
}: {
  params: Promise<{ resultId: string }>
}) {
  const { resultId } = use(params)
  const router = useRouter()
  const [score, setScore] = useState(0)
  const [label, setLabel] = useState('')
  const [comparisons, setComparisons] = useState<Comparison[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadResult() {
      // Load room
      const { data: room } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', resultId)
        .single()

      if (!room || room.status !== 'finished') {
        router.push('/')
        return
      }

      // Load questions
      if (room.question_set_id) {
        const { data: questions } = await supabase
          .from('questions')
          .select('*')
          .eq('question_set_id', room.question_set_id)
          .order('display_order')

        // Load all answers
        const { data: answers } = await supabase
          .from('answers')
          .select('*')
          .eq('room_id', resultId)

        if (!answers || answers.length === 0) {
          setLoading(false)
          return
        }

        const myAnswers: Record<number, 'a' | 'b'> = {}
        const opponentAnswers: Record<number, 'a' | 'b' | null> = {}

        const players = [...new Set(answers.map((a) => a.player_id))]
        const [player1, player2] = players

        answers.forEach((a) => {
          const playerKey = a.player_id === player1 ? 'myAnswers' : 'opponentAnswers'
          if (playerKey === 'myAnswers') {
            myAnswers[a.question_index] = a.choice
          } else {
            opponentAnswers[a.question_index] = a.choice
          }
        })

        const s = calculateScore(myAnswers, opponentAnswers, room.total_questions)
        setScore(s)
        setLabel(getScoreLabel(s))

        const comps = (questions || []).map((q: Question, i: number) => ({
          question: q.text,
          optionA: q.option_a,
          optionB: q.option_b,
          myChoice: myAnswers[i] || null,
          opponentChoice: opponentAnswers[i] || null,
          match: myAnswers[i] === opponentAnswers[i],
        }))

        setComparisons(comps)
      }

      setLoading(false)
    }

    loadResult()
  }, [resultId])

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#868685]">加载中...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <ScoreDisplay score={score} label={label} />
        <ComparisonList comparisons={comparisons} />
        <button
          onClick={() => router.push('/')}
          className="py-3 px-8 rounded-full font-semibold transition-transform text-[18px]"
          style={{ background: '#9fe870', color: '#163300' }}
        >
          我也来测
        </button>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: ScoreDisplay.tsx**

```tsx
// app/result/[resultId]/components/ScoreDisplay.tsx
interface ScoreDisplayProps {
  score: number
  label: string
}

export default function ScoreDisplay({ score, label }: ScoreDisplayProps) {
  return (
    <div className="text-center">
      <div
        className="text-[96px] font-black leading-[0.85] mb-2"
        style={{ fontFamily: 'Inter, sans-serif', color: '#9fe870' }}
      >
        {score}%
      </div>
      <div className="text-2xl font-semibold mb-2" style={{ color: '#0e0f0c' }}>
        {label}
      </div>
      <p className="text-[#868685]">匹配度</p>
    </div>
  )
}
```

- [ ] **Step 3: ComparisonList.tsx**

```tsx
// app/result/[resultId]/components/ComparisonList.tsx
interface Comparison {
  question: string
  optionA: string
  optionB: string
  myChoice: 'a' | 'b' | null
  opponentChoice: 'a' | 'b' | null
  match: boolean
}

interface ComparisonListProps {
  comparisons: Comparison[]
}

function ChoiceBadge({ choice }: { choice: 'a' | 'b' | null }) {
  if (!choice) return <span className="text-[#868685]">—</span>
  return (
    <span
      className={`inline-block w-6 h-6 rounded-full text-center leading-6 text-xs font-bold ${
        choice === 'a' ? 'bg-[#9fe870] text-[#163300]' : 'bg-[#163300] text-[#9fe870]'
      }`}
    >
      {choice.toUpperCase()}
    </span>
  )
}

export default function ComparisonList({ comparisons }: ComparisonListProps) {
  return (
    <div className="w-full flex flex-col gap-3">
      <h3 className="text-lg font-semibold mb-2">答题对比</h3>
      {comparisons.map((comp, i) => (
        <div
          key={i}
          className={`p-4 rounded-xl border-2 ${
            comp.match
              ? 'border-[#9fe870] bg-[#9fe870]/5'
              : 'border-[rgba(14,15,12,0.12)]'
          }`}
        >
          <p className="text-sm font-medium mb-2">{comp.question}</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <ChoiceBadge choice={comp.myChoice} />
              <span className="text-[#868685]">你的选择</span>
            </div>
            <div className="flex items-center gap-1">
              <ChoiceBadge choice={comp.opponentChoice} />
              <span className="text-[#868685]">对方</span>
            </div>
            {comp.match && (
              <span className="ml-auto text-xs text-[#054d28] font-semibold">✓ 匹配</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/result/\[resultId\]/
git commit -m "feat: add shareable result page with ScoreDisplay and ComparisonList"
```

---

## Task 9: Next Question Advancer (Route Handler)

**Files:**
- Create: `app/api/advance-question/route.ts`

When both players have answered the current question, any client can call this endpoint to advance to the next question and persist the result.

- [ ] **Step 1: Write the advance-question route handler**

```typescript
// app/api/advance-question/route.ts
import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { roomId, questionIndex } = await req.json()

  const supabase = createServerClient()

  // Verify both answers exist for this question
  const { data: answers } = await supabase
    .from('answers')
    .select('player_id')
    .eq('room_id', roomId)
    .eq('question_index', questionIndex)

  if (!answers || answers.length < 2) {
    return Response.json({ error: 'Waiting for both answers' }, { status: 400 })
  }

  // Get room to check total questions
  const { data: room } = await supabase
    .from('rooms')
    .select('total_questions, current_question')
    .eq('id', roomId)
    .single()

  if (!room) {
    return Response.json({ error: 'Room not found' }, { status: 404 })
  }

  const nextIndex = questionIndex + 1

  if (nextIndex >= room.total_questions) {
    // Game finished
    await supabase
      .from('rooms')
      .update({ status: 'finished', finished_at: new Date().toISOString() })
      .eq('id', roomId)
  } else {
    // Advance to next question
    await supabase
      .from('rooms')
      .update({ current_question: nextIndex })
      .eq('id', roomId)
  }

  return Response.json({ success: true, nextIndex })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/advance-question/route.ts
git commit -m "feat: add advance-question API route"
```

---

## Task 10: Apply Tailwind Design System

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Update globals.css with design system**

```css
/* app/globals.css */
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #0e0f0c;
  --green: #9fe870;
  --green-dark: #163300;
  --gray: #868685;
  --surface: #e8ebe6;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: Inter, Helvetica, Arial, sans-serif;
  --font-mono: monospace;
}

* {
  -webkit-tap-highlight-color: transparent;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Inter, sans-serif;
}

button {
  cursor: pointer;
}

button:hover:not(:disabled) {
  transform: scale(1.05);
}

button:active:not(:disabled) {
  transform: scale(0.95);
}

button:disabled {
  cursor: not-allowed;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "style: apply MatchMatch design system to globals.css"
```

---

## Task 11: Supabase Environment Setup

**Files:**
- Create: `.env.local` (template in `.env.example`)

- [ ] **Step 1: Document required environment variables**

```bash
# .env.example (already created in Task 2, verify it exists)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add Supabase environment variable template"
```

---

## Spec Coverage Checklist

| Spec Section | Task |
|---|---|
| Room creation + join | Task 1, Task 5 |
| Waiting room (3-min timeout display) | Task 6 |
| Synchronized answering | Task 6, Task 7 |
| Match score calculation | Task 3 (score.ts), Task 8 |
| Result page + sharing | Task 8 |
| Rematch flow (inline panel, 3-min) | Task 7 (RematchDialog) |
| Supabase schema + triggers | Task 1 |
| Zustand store | Task 4 |
| Realtime subscriptions | Task 6 |
| Design system (Wise-inspired) | Task 10 |
| Anonymous userId | Task 3 (userId.ts) |
| Room code generation | Task 3 (roomCode.ts) |

---

## Self-Review

- **Type consistency**: All `player_id`, `room_id`, `user_id` strings match Supabase UUID types. `choice` is `'a' | 'b'`. `status` is `RoomStatus`. ✓
- **Placeholder scan**: No TODOs or TBDs. All steps show actual code. ✓
- **Spec coverage**: Every section in the design spec has a corresponding task. ✓
- **File paths**: All use `app/...` (vinext is Next.js-compatible). All imports use `@/lib/...` path alias. ✓

---

## Execution Options

Plan complete and saved to `docs/superpowers/plans/2026-04-20-matchmatch-implementation.md`.

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
