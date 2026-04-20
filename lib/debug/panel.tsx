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
        flexShrink: 0,
      }}
    />
  )
}

export default function DebugPanel() {
  const isOpen = useDebugStore((s) => s.isOpen)
  const toggleOpen = useDebugStore((s) => s.toggleOpen)
  const activeFilter = useDebugStore((s) => s.activeFilter)
  const setFilter = useDebugStore((s) => s.setFilter)
  const clearEntries = useDebugStore((s) => s.clearEntries)

  const entries = useDebugEntries(activeFilter)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Keyboard shortcut: Ctrl+Shift+D
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
