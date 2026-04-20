// app/components/DebugPanel.tsx
'use client'

import { useEffect } from 'react'
import { initDebugInterceptors } from '@/lib/debug/interceptors'
import DebugPanel from '@/lib/debug/panel'

export function DebugPanel() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    initDebugInterceptors()
  }, [])

  if (process.env.NODE_ENV === 'production') return null

  return <DebugPanel />
}
