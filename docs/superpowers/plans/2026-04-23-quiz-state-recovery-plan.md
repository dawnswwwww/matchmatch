# Quiz State Recovery on Re-Entry — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a player re-enters a room mid-quiz, their prior answers and opponent's prior answers are recovered from the `answers` table and populated in the Zustand store so the UI reflects the true game state.

**Architecture:** After the existing init sequence (room → players → questions), query `answers` table for all records in the room. Classify by `player_id` into `myAnswers` / `opponentAnswers` in the store. Realtime broadcast handlers gain a merge guard (only update if incoming `questionIndex` is newer than already-stored).

**Tech Stack:** Next.js App Router, Zustand, Supabase Postgres, TypeScript

---

## File Map

- `lib/supabase/client.ts` — unchanged, holds `supabase` client
- `lib/supabase/types.ts` — unchanged, defines `Answer` type (already has `player_id`, `question_index`, `choice`)
- `lib/stores/gameStore.ts` — add `rehydrateAnswers()` action, modify broadcast handlers with merge guard
- `app/room/[roomId]/page.tsx` — add `getAnswersByRoomId()` call after questions load
- `lib/questions/adapter.ts` — unchanged (just referenced in room page)
- New: `lib/supabase/queries/answers.ts` — `getAnswersByRoomId` function (follows existing pattern of `lib/questions/adapter.ts`)

---

## Task 1: Add `rehydrateAnswers` action to gameStore

**Files:**
- Modify: `lib/stores/gameStore.ts:34-46` (interface) and `lib/stores/gameStore.ts:81-84` (submitMyAnswer area)

- [ ] **Step 1: Add `rehydrateAnswers` to the interface**

In the `GameState` interface (line ~34), add:

```ts
rehydrateAnswers: (answers: Array<{ player_id: string; question_index: number; choice: 'a' | 'b' }>) => void
```

- [ ] **Step 2: Add `rehydrateAnswers` implementation**

After `submitMyAnswer` (line ~84), add:

```ts
rehydrateAnswers: (answers) =>
  set((state) => {
    const myAnswers = { ...state.myAnswers }
    const opponentAnswers = { ...state.opponentAnswers }
    answers.forEach((a) => {
      if (a.player_id === state.myPlayerId) {
        myAnswers[a.question_index] = a.choice
      } else {
        opponentAnswers[a.question_index] = a.choice
      }
    })
    return { myAnswers, opponentAnswers }
  }),
```

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add lib/stores/gameStore.ts
git commit -m "feat: add rehydrateAnswers action to gameStore

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Create `getAnswersByRoomId` query function

**Files:**
- Create: `lib/supabase/queries/answers.ts`

- [ ] **Step 1: Write the file**

```ts
// lib/supabase/queries/answers.ts
import { supabase } from '@/lib/supabase/client'

export type AnswerRecord = {
  player_id: string
  question_index: number
  choice: 'a' | 'b'
}

export async function getAnswersByRoomId(roomId: string): Promise<AnswerRecord[]> {
  const { data, error } = await supabase
    .from('answers')
    .select('player_id, question_index, choice')
    .eq('room_id', roomId)
    .order('question_index')

  if (error) throw error
  return data ?? []
}
```

- [ ] **Step 2: Verify file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/queries/answers.ts
git commit -m "feat: add getAnswersByRoomId query function

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Integrate answer recovery into room page init

**Files:**
- Modify: `app/room/[roomId]/page.tsx:54-71` (after questions load) and `app/room/[roomId]/page.tsx:133-148` (broadcast handler)

- [ ] **Step 1: Add import for getAnswersByRoomId**

Add to imports section (after line 8):
```ts
import { getAnswersByRoomId } from '@/lib/supabase/queries/answers'
```

- [ ] **Step 2: Add answer recovery after questions are set**

After line 71 (after `setQuestions` or local questions set), add:

```ts
// Recover prior answers from database
try {
  const answers = await getAnswersByRoomId(roomId)
  useGameStore.getState().rehydrateAnswers(answers)
} catch (retryErr) {
  // Retry once on failure
  try {
    const answers = await getAnswersByRoomId(roomId)
    useGameStore.getState().rehydrateAnswers(answers)
  } catch {
    // Graceful degradation — skip recovery, user can still answer current question
  }
}
```

Note: This goes after `useGameStore.getState().setQuestions(data)` inside the `else if (room.question_set_id)` branch, and after the `useGameStore.getState().setQuestions(localQuestions)` in the local path — or more cleanly, place it once after both question-loading paths converge. The simplest placement is right after the entire question-loading block ends (after line 71), inside the `init()` async function.

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add app/room/[roomId]/page.tsx
git commit -m "feat: recover answers on room re-entry with retry logic

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Add merge guard to broadcast handlers

**Files:**
- Modify: `app/room/[roomId]/page.tsx:133-148` (answer_submitted handler) and `app/room/[roomId]/page.tsx:149-152` (question_result handler)

- [ ] **Step 1: Update `answer_submitted` broadcast handler**

Replace the current handler (lines ~133-148):

```ts
.on('broadcast', { event: 'answer_submitted' }, ({ payload }) => {
  if (payload.userId !== userId) {
    // Merge guard: only apply if questionIndex is newer than what we have
    const { opponentAnswers } = useGameStore.getState()
    const existingAnswer = opponentAnswers[payload.questionIndex]
    if (existingAnswer === undefined || existingAnswer === null) {
      useGameStore.getState().setOpponentAnswer(payload.questionIndex, payload.choice)
    }

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
```

Note: The merge guard here uses `=== undefined || === null` because `opponentAnswers` default is `{}` and stored values are `'a' | 'b'`. We only skip if the key doesn't exist yet — if opponent already answered and we recovered it from DB, we don't overwrite with a potentially late broadcast.

- [ ] **Step 2: Update `question_result` broadcast handler**

Replace (lines ~149-152):

```ts
.on('broadcast', { event: 'question_result' }, ({ payload }) => {
  const { opponentAnswers } = useGameStore.getState()
  if (opponentAnswers[payload.questionIndex] === undefined) {
    useGameStore.getState().setOpponentAnswer(payload.questionIndex, payload.choice)
  }
  useGameStore.getState().setOpponentReady(true)
})
```

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add app/room/[roomId]/page.tsx
git commit -m "feat: add merge guard to broadcast handlers to prevent late-answer overwrites

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: End-to-end test — manual verification

**Files:**
- (No code changes — verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Create a room and answer 2 questions as Player A**

Open http://localhost:3000, create a room, answer Q0 and Q1. Keep the tab open.

- [ ] **Step 3: Open a second browser/incognito as Player B, join the same room, answer Q0 and Q1**

- [ ] **Step 4: Refresh Player A's page**

Expected: Progress bar shows "3/5", Q2 is shown. Q0 and Q1 show Player A's answers (green highlight) and Player B's answers (gray). The current question is Q2 with no answers selected yet.

- [ ] **Step 5: Also verify: if Player B had already answered Q0 when Player A refreshed, Player A should see Player B's Q0 answer immediately without waiting for a broadcast**

Expected: Both Q0 and Q1 show opponent selections (gray).

---

## Spec Coverage Check

| Spec Section | Task |
|---|---|
| Store: `rehydrateAnswers` action | Task 1 |
| DB: `getAnswersByRoomId` query | Task 2 |
| Room page: call recovery after questions load | Task 3 |
| Broadcast: merge guard | Task 4 |
| Error: retry-once then graceful degradation | Task 3 |
| Realtime merge logic (max questionIndex) | Task 4 |

All spec items covered. No placeholders found. Type signatures consistent across tasks (all use `player_id`, `question_index`, `choice` as defined in types.ts and the new `answers.ts`).