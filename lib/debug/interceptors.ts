import { logger } from './logger'
import { supabase } from '@/lib/supabase/client'
import { useGameStore } from '@/lib/stores/gameStore'

export function initDebugInterceptors() {
  // ── Zustand Interceptor ──────────────────────────────────────
  if (typeof window !== 'undefined') {
    useGameStore.subscribe((state, prev) => {
      logger.stateChange('gameStore', prev, state)
    })
  }

  // ── Supabase Query Interceptor ───────────────────────────────
  const originalFrom = supabase.from.bind(supabase)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase.from = function (table: string): any {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wrapped = queryBuilder as any
    const methods = ['select', 'insert', 'update', 'delete', 'upsert', 'rpc']
    for (const method of methods) {
      if (typeof wrapped[method] === 'function') {
        wrapped[method] = wrapMethod(method, wrapped[method].bind(queryBuilder))
      }
    }

    return wrapped
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
      const originalCallback = args[2]
      const wrappedCallback = (...cbArgs: unknown[]) => {
        logger.log('realtime', `${channelName}:${eventFilter?.event ?? 'change'}`, {
          channel: channelName,
          event: eventFilter,
          payload: cbArgs[0],
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (originalCallback as (...a: any[]) => any)?.apply(this, cbArgs)
      }
      return originalOn(eventFilter, wrappedCallback)
    }

    return channel
  }

  logger.log('custom', 'interceptors:init', { timestamp: Date.now() })
}
