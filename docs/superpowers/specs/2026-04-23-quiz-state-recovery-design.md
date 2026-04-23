# Quiz State Recovery on Re-Entry

## Status

Accepted

## Problem

When a player re-enters a room mid-quiz (via page refresh, navigation, or reconnection), the in-memory Zustand store is wiped. The client fetches the current question index from the `rooms` table, but does not reload prior answer records. This results in:

- The player's own previous answers are unknown — they may attempt to re-answer the same question
- The opponent's previous answers are unknown — opponent selections display as empty until new realtime events arrive
- On repeated re-entry, the same data gap persists

## Solution

After loading room + players + questions, query the `answers` table for all records in the room, then populate `myAnswers` and `opponentAnswers` in the Zustand store before rendering the quiz UI. Realtime broadcasts continue to flow normally but only update answers that are newer than the recovered state.

## Data Flow

```
Enter room → reset() → fetch room → fetch players → fetch questions
         → getAnswersByRoomId(roomId) → rehydrateAnswers(answers)
         → render quiz UI
```

`rehydrateAnswers` classifies each answer record by `player_id`:
- If `player_id === myPlayerId` →写入 `myAnswers[questionIndex]`
- Otherwise → 写入 `opponentAnswers[questionIndex]`

## Store Changes

### `lib/stores/gameStore.ts`

Add `rehydrateAnswers(answers: AnswerRecord[])` action:

```ts
rehydrateAnswers(answers) {
  answers.forEach(a => {
    if (a.player_id === state.myPlayerId) {
      state.myAnswers[a.question_index] = a.selected_option_index
    } else {
      state.opponentAnswers[a.question_index] = a.selected_option_index
    }
  })
}
```

Modify broadcast handlers (`handleAnswerSubmitted`, etc.) to only update when `questionIndex > existingAnswerIndex`, using merge logic.

## Database Query

### `lib/supabase/database.ts`

Add:

```ts
export async function getAnswersByRoomId(roomId: string): Promise<AnswerRecord[]> {
  const { data } = await supabase
    .from('answers')
    .select('player_id, question_index, selected_option_index')
    .eq('room_id', roomId)
  return data ?? []
}
```

## Room Page Changes

### `app/room/[roomId]/page.tsx`

After questions are loaded and before render, add:

```ts
// Load and recover answers
const answers = await getAnswersByRoomId(room.id)
gameStore.getState().rehydrateAnswers(answers)
```

Failure handling: if the query fails, retry once. If still failing, silently proceed without answer recovery (graceful degradation — user sees current question and can still answer).

## Realtime Broadcast Merge Logic

Broadcast handlers must compare incoming `questionIndex` against already-stored answers:

```ts
// Only apply if this answer is newer (higher questionIndex)
if (questionIndex > currentStoredIndex) {
  // update opponentAnswers / myAnswers
}
```

This prevents a late-arriving broadcast from overwriting an answer that was already recovered from DB on re-entry.

## Error Handling

- **First attempt fails**: retry once
- **Retry fails**: silently skip recovery, page renders in partial state as before
- **No error toast / blocking modal** — user experience is uninterrupted

## Scope

- Does not change the Supabase schema
- Does not add new realtime channels
- Does not affect normal (non-re-entry) flow — broadcast handlers already update answers; merge guard only kicks in on recovered state