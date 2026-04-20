# MatchMatch Debug Logger — Design Specification

## 1. Concept & Vision

A zero-intrusion debugging system for the MatchMatch real-time game. It captures state changes, Supabase queries, and Realtime events automatically, exposing them through an in-app floating panel toggled by `Ctrl+Shift+D`. The goal is to make multiplayer sync bugs trivially reproducible by giving developers a complete event timeline without modifying any business logic.

The system is purely a development tool — it is never shipped to production.

## 2. Architecture

```
lib/debug/
  logger.ts        # Core log engine — memory store, event bus, diff calculator
  store.ts         # Zustand store for log entries (separate from gameStore)
  panel.tsx        # Floating panel UI component
  hooks.ts         # useLogger, useGameSnapshot hooks
  interceptors.ts  # Auto-intercept Zustand, Supabase, and Realtime events
```

### Log Entry

```typescript
interface LogEntry {
  id: string           // crypto.randomUUID()
  timestamp: number     // Date.now()
  category: 'state' | 'realtime' | 'supabase' | 'render'
  type: string          // e.g. 'room:status_changed', 'answer:submitted'
  direction?: 'in' | 'out'  // for supabase/realtime
  payload: unknown      // actual data
  diff?: Record<string, { from: unknown; to: unknown }>  // for state changes
}

interface StateSnapshot {
  timestamp: number
  label: string
  state: Record<string, unknown>
}
```

## 3. Logger Engine (`logger.ts`)

- **Singleton** — no external state, importable anywhere
- Memory store — refresh/page close clears all logs
- `log(category, type, payload): string` — returns log ID
- `stateChange(label, prev, next): string` — auto-computes `diff` of changed keys
- `getEntries(): LogEntry[]` — returns all entries
- `clear(): void` — wipes all entries
- `subscribe(fn): () => void` — returns unsubscribe function; panel uses this

## 4. Store (`store.ts`)

- Separate Zustand store, independent from `gameStore`
- Holds: `entries: LogEntry[]`, `snapshots: StateSnapshot[]`, `isOpen: boolean`
- Actions: `addEntry`, `clearEntries`, `setOpen`

## 5. Hooks (`hooks.ts`)

- `useLogger()` — exposes `logger` for manual logging from components
- `useGameSnapshot(label)` — captures current `gameStore` state as a labeled snapshot
- `useDebugEntries(category?: string)` — returns filtered log entries (reactive, re-renders on new entries)

## 6. Interceptors (`interceptors.ts`)

Zero-intrusion — these are applied once at app startup and automatically hook into:

**Zustand Interceptor:**
- Wraps `gameStore.subscribe()` on app init
- On every state change, calls `logger.stateChange('gameStore', prevState, nextState)`
- Subscribes before other subscribers to capture the earliest snapshot

**Supabase Query Interceptor:**
- Monkey-patches `supabase.from()` chain methods (`.select()`, `.insert()`, `.update()`, `.delete()`, `.upsert()`)
- Wraps each call to record: `{ table, method, params, response, error, duration }`
- Adds ~5ms overhead per call — acceptable for debug only

**Realtime Interceptor:**
- Wraps `supabase.channel().on().subscribe()` chain
- Records incoming broadcast and postgres_changes events with full payload and timestamp

All three interceptors are applied in a single `initDebugInterceptors()` call from `app/layout.tsx`.

## 7. Panel UI (`panel.tsx`)

- **Collapsed state**: Small 40x40px lime-green circle at bottom-right corner, visible only in development (`process.env.NODE_ENV !== 'production'`), with a subtle pulse animation
- **Expanded state**: 400x500px floating window, resizable, draggable

### Panel Layout

```
┌─────────────────────────────────┐
│ ● DEBUG          [_] [×]       │  ← header with minimize/close
├─────────────────────────────────┤
│ [state] [realtime] [supabase]   │  ← filter tabs
├─────────────────────────────────┤
│ State Snapshot                  │
│ ┌─────────────────────────────┐ │
│ │ roomStatus: "playing"       │ │
│ │ currentQuestion: 2         │ │  ← current gameStore snapshot
│ │ myAnswers: {0:'a',1:'b'}   │ │     green = changed since last
│ │ opponentReady: true        │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Event Log (newest first)        │
│ ┌─────────────────────────────┐ │
│ │ 14:32:01  state   game..  │ │
│ │ 14:32:00  realtime answer..│ │  ← scrollable event list
│ │ 14:31:58  supabase select..│ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

- **Filter tabs**: All / State / Realtime / Supabase
- **State Snapshot**: Shows current `gameStore` fields; fields that changed in the last 3 entries pulse green briefly
- **Event Log**: Time倒序，每条可点击展开显示完整 payload 和 diff
- **Minimize button** (`[_]`) → collapses to circle
- **Close button** (`[×]`) → hides panel (panel visible state in Zustand, survives hot reload)

### Keyboard Shortcut

- `Ctrl+Shift+D` — toggles panel open/closed
- Listens on `window` at app startup

## 8. Usage in Code

**Business logic requires zero changes.** All interception is automatic.

For manual logging when needed:

```typescript
import { useLogger } from '@/lib/debug/hooks'

function MyComponent() {
  const { log } = useLogger()
  log('custom', 'my_event', { foo: 'bar' })
}
```

## 9. Environment Gate

- Panel only renders when `process.env.NODE_ENV !== 'production'`
- Interceptors always run (they're cheap), but panel is hidden in production
- Safe to leave debug code in production builds — it simply won't render

## 10. Files to Create

| File | Purpose |
|------|---------|
| `lib/debug/logger.ts` | Core singleton log engine |
| `lib/debug/store.ts` | Zustand store for log entries + panel visibility |
| `lib/debug/hooks.ts` | useLogger, useGameSnapshot, useDebugEntries |
| `lib/debug/interceptors.ts` | Auto-intercept Zustand + Supabase + Realtime |
| `lib/debug/panel.tsx` | Floating panel UI component |
| `app/components/DebugPanel.tsx` | Render DebugPanel in layout (dev only) |

## 11. Out of Scope

- No Supabase persistence (memory-only)
- No mobile-optimized panel layout
- No export/import logs
- No production builds with debug stripped — just don't render panel
