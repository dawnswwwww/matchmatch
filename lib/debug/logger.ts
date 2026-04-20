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
