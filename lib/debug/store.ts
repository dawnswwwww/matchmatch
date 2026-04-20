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