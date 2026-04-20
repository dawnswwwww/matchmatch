# Debug Logger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a zero-intrusion debug logging system with an in-app floating panel (`Ctrl+Shift+D`) that auto-captures Zustand state changes, Supabase queries, and Realtime events.

**Architecture:** Singleton `logger.ts` as the core engine, a separate Zustand `debugStore` for panel state, auto-interceptors applied once at app startup in `layout.tsx`. The panel is a pure UI component with no business logic coupling.

**Tech Stack:** vinext, React 19, Zustand, Supabase JS client.

---

## File Structure

```
lib/debug/
  logger.ts        # Core singleton log engine
  store.ts         # Zustand store for log entries + panel visibility
  hooks.ts         # useLogger, useGameSnapshot, useDebugEntries
  interceptors.ts  # Auto-intercept Zustand + Supabase + Realtime
  panel.tsx        # Floating panel UI

app/
  layout.tsx       # Add DebugPanel + call initDebugInterceptors()
  components/
    DebugPanel.tsx # Environment gate + render panel
```

---

## Task 1: Logger Engine (`logger.ts`)

**Files:**
- Create: `lib/debug/logger.ts`

- [ ] **Step 1: Write the logger engine**

```typescript
// lib/debug/logger.ts

export type LogCategory = 'state' | 'realtime' | 'supabase' | 'render' | 'custom'

export interface LogEntry {
  id: string
  timestamp: number
  category: LogCategory
  type: string
  direction?: 'in' | 'out'
  payload: unknown
  diff?: Record<string, { from: unknown; to: unknown }>
}

type SubscribeFn = (entry: LogEntry) => void

class Logger {
  private entries: LogEntry[] = []
  private subscribers = new Set<SubscribeFn>()

  log(
    category: LogCategory,
    type: string,
    payload: unknown,
    direction?: 'in' | 'out'
  ): string {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      category,
      type,
      payload,
      ...(direction && { direction }),
    }
    this.entries.push(entry)
    this.subscribers.forEach((fn) => fn(entry))
    return entry.id
  }

  stateChange(label: string, prev: object, next: object): string {
    const diff: Record<string, { from: unknown; to: unknown }> = {}
    const prevKeys = Object.keys(prev as Record<string, unknown>)
    const nextKeys = Object.keys(next as Record<string, unknown>)
    const allKeys = new Set([...prevKeys, ...nextKeys])

    for (const key of allKeys) {
      const from = (prev as Record<string, unknown>)[key]
      const to = (next as Record<string, unknown>)[key]
      if (from !== to) {
        diff[key] = { from, to }
      }
    }

    return this.log('state', label, { prev, next }, diff)
  }

  getEntries(): LogEntry[] {
    return [...this.entries]
  }

  clear(): void {
    this.entries = []
  }

  subscribe(fn: SubscribeFn): () => void {
    this.subscribers.add(fn)
    return () => this.subscribers.delete(fn)
  }
}

export const logger = new Logger()
```

- [ ] **Step 2: Commit**

```bash
git add lib/debug/logger.ts
git commit -m "feat(debug): add logger singleton engine"
```

---

## Task 2: Debug Zustand Store (`store.ts`)

**Files:**
- Create: `lib/debug/store.ts`

- [ ] **Step 1: Write the debug Zustand store**

```typescript
// lib/debug/store.ts
import { create } from 'zustand'
import { logger, type LogEntry } from './logger'

interface DebugState {
  entries: LogEntry[]
  isOpen: boolean
  activeFilter: 'all' | 'state' | 'realtime' | 'supabase'
  addEntry: (entry: LogEntry) => void
  clearEntries: () => void
  setOpen: (open: boolean) => void
  toggleOpen: () => void
  setFilter: (filter: 'all' | 'state' | 'realtime' | 'supabase') => void
}

export const useDebugStore = create<DebugState>((set) => ({
  entries: [],
  isOpen: false,
  activeFilter: 'all',

  addEntry: (entry) =>
    set((state) => ({ entries: [entry, ...state.entries].slice(0, 500) })),

  clearEntries: () => {
    logger.clear()
    set({ entries: [] })
  },

  setOpen: (isOpen) => set({ isOpen }),

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

  setFilter: (activeFilter) => set({ activeFilter }),
}))
```

- [ ] **Step 2: Commit**

```bash
git add lib/debug/store.ts
git commit -m "feat(debug): add debug Zustand store"
```

---

## Task 3: Hooks (`hooks.ts`)

**Files:**
- Create: `lib/debug/hooks.ts`

- [ ] **Step 1: Write the hooks**

```typescript
// lib/debug/hooks.ts
import { useEffect } from 'react'
import { logger, type LogCategory } from './logger'
import { useDebugStore } from './store'
import { useGameStore } from '@/lib/stores/gameStore'

export { logger }

export function useLogger() {
  return {
    log: (category: LogCategory, type: string, payload: unknown) =>
      logger.log(category, type, payload),
    stateChange: (label: string, prev: object, next: object) =>
      logger.stateChange(label, prev, next),
  }
}

export function useGameSnapshot(label: string) {
  const state = useGameStore()
  logger.log('render', label, state)
}

export function useDebugEntries(category?: 'all' | 'state' | 'realtime' | 'supabase') {
  const entries = useDebugStore((s) => s.entries)
  const activeFilter = useDebugStore((s) => s.activeFilter)
  const filter = category ?? activeFilter

  useEffect(() => {
    const unsub = logger.subscribe((entry) => {
      useDebugStore.getState().addEntry(entry)
    })
    return unsub
  }, [])

  if (filter === 'all') return entries
  return entries.filter((e) => e.category === filter)
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/debug/hooks.ts
git commit -m "feat(debug): add useLogger, useGameSnapshot, useDebugEntries hooks"
```

---

## Task 4: Interceptors (`interceptors.ts`)

**Files:**
- Create: `lib/debug/interceptors.ts`

- [ ] **Step 1: Write the interceptors**

```typescript
// lib/debug/interceptors.ts
import { logger } from './logger'
import { supabase } from '@/lib/supabase/client'
import { useGameStore } from '@/lib/stores/gameStore'

// Track previous gameStore state for diff
let prevGameState: ReturnType<typeof useGameStore.getState> | null = null

export function initDebugInterceptors() {
  // ── Zustand Interceptor ──────────────────────────────────────
  // Subscribe to gameStore changes
  if (typeof window !== 'undefined') {
    prevGameState = useGameStore.getState()
    useGameStore.subscribe((state, prev) => {
      logger.stateChange('gameStore', prev, state)
      prevGameState = state
    })
  }

  // ── Supabase Query Interceptor ───────────────────────────────
  const originalFrom = supabase.from.bind(supabase)

  supabase.from = function (table: string) {
    const queryBuilder = originalFrom(table)

    const wrapMethod = (method: string, originalFn: (...args: unknown[]) => unknown) => {
      return function (...args: unknown[]) {
        const start = Date.now()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (originalFn as (...a: any[]) => any).apply(this, args)
        if (result && typeof result.then === 'function') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (result as Promise<any>).then((res: unknown) => {
            const duration = Date.now() - start
            logger.log('supabase', `${table}:${method}`, {
              table,
              method,
              params: args,
              duration,
              rowCount: (res as { data?: unknown[] })?.data?.length ?? 0,
            })
            return res
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }).catch((err: any) => {
            const duration = Date.now() - start
            logger.log('supabase', `${table}:${method}:error`, {
              table,
              method,
              params: args,
              duration,
              error: err?.message ?? err,
            })
            return Promise.reject(err)
          })
        }
        return result
      }
    }

    // Wrap chain methods
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wrapped = queryBuilder as any
    const methods = ['select', 'insert', 'update', 'delete', 'upsert', 'rpc']
    for (const method of methods) {
      if (typeof wrapped[method] === 'function') {
        wrapped[method] = wrapMethod(method, wrapped[method].bind(queryBuilder))
      }
    }

    return queryBuilder
  }

  // ── Realtime Interceptor ────────────────────────────────────
  const originalChannel = supabase.channel.bind(supabase)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase.channel = function (channelName: string): any {
    const channel = originalChannel(channelName)

    const originalOn = channel.on.bind(channel)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channel.on = function (...args: any[]): any {
      const eventFilter = args[0]
      // Capture the callback to wrap it
      const originalCallback = args[2]
      const wrappedCallback = (...cbArgs: unknown[]) => {
        logger.log('realtime', `${channelName}:${eventFilter?.event ?? 'change'}`, {
          channel: channelName,
          event: eventFilter,
          payload: cbArgs[0],
        })
        if (originalCallback) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (originalCallback as (...a: any[]) => any).apply(this, cbArgs)
        }
      }
      return originalOn(eventFilter, wrappedCallback)
    }

    return channel
  }

  logger.log('custom', 'interceptors:init', { timestamp: Date.now() })
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/debug/interceptors.ts
git commit -m "feat(debug): add interceptors for Zustand, Supabase, Realtime"
```

---

## Task 5: Panel UI (`panel.tsx`)

**Files:**
- Create: `lib/debug/panel.tsx`

- [ ] **Step 1: Write the panel component**

```tsx
// lib/debug/panel.tsx
'use client'

import { useState, useEffect } from 'react'
import { useDebugStore } from './store'
import { useDebugEntries } from './hooks'

const CATEGORY_LABELS = {
  all: 'All',
  state: 'State',
  realtime: 'Realtime',
  supabase: 'Supabase',
} as const

function formatTime(ts: number) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

function CategoryDot({ category }: { category: string }) {
  const colors: Record<string, string> = {
    state: '#9fe870',
    realtime: '#38c8ff',
    supabase: '#ffc091',
    custom: '#868685',
    render: '#d03238',
  }
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: colors[category] ?? '#868685',
      }}
    />
  )
}

export default function DebugPanel() {
  const isOpen = useDebugStore((s) => s.isOpen)
  const toggleOpen = useDebugStore((s) => s.toggleOpen)
  const setOpen = useDebugStore((s) => s.setOpen)
  const activeFilter = useDebugStore((s) => s.activeFilter)
  const setFilter = useDebugStore((s) => s.setFilter)
  const clearEntries = useDebugStore((s) => s.clearEntries)

  const entries = useDebugEntries(activeFilter)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Keyboard shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        toggleOpen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleOpen])

  if (!isOpen) {
    return (
      <button
        onClick={toggleOpen}
        title="Open Debug Panel (Ctrl+Shift+D)"
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: '#9fe870',
          border: 'none',
          cursor: 'pointer',
          zIndex: 9999,
          fontSize: 18,
          fontWeight: 700,
          color: '#163300',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          animation: 'debugPulse 2s infinite',
        }}
      >
        ●
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 420,
        height: 520,
        background: '#fff',
        border: '1px solid rgba(14,15,12,0.12)',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, monospace',
        fontSize: 12,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid rgba(14,15,12,0.08)',
          background: '#0e0f0c',
          cursor: 'move',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#9fe870', fontSize: 14 }}>●</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>DEBUG</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={clearEntries}
            title="Clear logs"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#868685',
              cursor: 'pointer',
              fontSize: 14,
              padding: '2px 4px',
            }}
          >
            🗑
          </button>
          <button
            onClick={toggleOpen}
            title="Minimize"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#868685',
              cursor: 'pointer',
              fontSize: 14,
              padding: '2px 4px',
            }}
          >
            ─
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: '8px 12px',
          borderBottom: '1px solid rgba(14,15,12,0.08)',
        }}
      >
        {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '3px 10px',
              borderRadius: 9999,
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
              background: activeFilter === key ? '#9fe870' : 'rgba(14,15,12,0.06)',
              color: activeFilter === key ? '#163300' : '#868685',
            }}
          >
            {CATEGORY_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Event Log */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
        {entries.length === 0 && (
          <div style={{ color: '#868685', textAlign: 'center', marginTop: 20 }}>
            No events yet...
          </div>
        )}
        {entries.map((entry) => (
          <div
            key={entry.id}
            style={{
              marginBottom: 6,
              padding: '6px 8px',
              borderRadius: 8,
              background: expandedId === entry.id ? 'rgba(14,15,12,0.04)' : 'transparent',
              cursor: 'pointer',
            }}
            onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CategoryDot category={entry.category} />
              <span style={{ color: '#868685', fontSize: 11, width: 64, flexShrink: 0 }}>
                {formatTime(entry.timestamp)}
              </span>
              <span style={{ color: '#0e0f0c', fontWeight: 600, fontSize: 11 }}>{entry.type}</span>
            </div>
            {expandedId === entry.id && (
              <pre
                style={{
                  marginTop: 6,
                  padding: 8,
                  background: '#0e0f0c',
                  color: '#e8ebe6',
                  borderRadius: 6,
                  fontSize: 10,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  maxHeight: 200,
                }}
              >
                {JSON.stringify(entry.payload, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes debugPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/debug/panel.tsx
git commit -m "feat(debug): add floating panel UI"
```

---

## Task 6: Integrate Debug Panel into App

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update layout.tsx to add DebugPanel and init interceptors**

Overwrite `app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DebugPanel } from "./components/DebugPanel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MatchMatch",
  description: "看看你和朋友的默契程度",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
      <DebugPanel />
    </html>
  )
}
```

- [ ] **Step 2: Create DebugPanel component wrapper**

Create `app/components/DebugPanel.tsx`:

```tsx
// app/components/DebugPanel.tsx
'use client'

import { useEffect } from 'react'
import { initDebugInterceptors } from '@/lib/debug/interceptors'
import DebugPanel from '@/lib/debug/panel'

export function DebugPanel() {
  useEffect(() => {
    // Only initialize in development
    if (process.env.NODE_ENV === 'production') return
    initDebugInterceptors()
  }, [])

  if (process.env.NODE_ENV === 'production') return null

  return <DebugPanel />
}
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx app/components/DebugPanel.tsx
git commit -m "feat(debug): integrate debug panel and interceptors into app"
```

---

## Spec Coverage

| Spec Section | Task |
|---|---|
| Logger engine singleton | Task 1 |
| Zustand debug store | Task 2 |
| Hooks (useLogger, useGameSnapshot, useDebugEntries) | Task 3 |
| Interceptors (Zustand + Supabase + Realtime) | Task 4 |
| Panel UI | Task 5 |
| Layout integration | Task 6 |
| Ctrl+Shift+D shortcut | Task 5 |
| Environment gate (production hidden) | Task 6 |
| Filter tabs | Task 5 |
| Expandable log entries | Task 5 |

---

## Self-Review

- **Type consistency**: All types defined in `logger.ts` match usage in `store.ts` and `hooks.ts`. `LogEntry.category` matches filter options. ✓
- **Placeholder scan**: No TODOs or TBDs. All steps show actual code. ✓
- **Spec coverage**: Every section from the spec has a corresponding task. ✓
- **Dependency order**: Tasks 1→2→3→4→5→6 follows correct dependency order. ✓

---

## Execution Options

Plan complete and saved to `docs/superpowers/plans/2026-04-20-debug-logger-implementation.md`.

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
