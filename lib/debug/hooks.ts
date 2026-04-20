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
