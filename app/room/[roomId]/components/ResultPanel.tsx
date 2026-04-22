'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/lib/stores/gameStore'
import ResultSummary from './ResultSummary'
import ResultDetailModal from './ResultDetailModal'

export default function ResultPanel() {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const roomId = useGameStore((s) => s.roomId)

  async function handleShare() {
    const url = `${window.location.origin}/result/${roomId}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'MatchMatch', text: '我在 MatchMatch 测出了默契结果！你也来试试？', url })
      } catch {
        await navigator.clipboard.writeText(url)
      }
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  function handleNewGame() {
    router.push('/')
  }

  return (
    <>
      <ResultSummary
        onOpenDetail={() => setModalOpen(true)}
        onShare={handleShare}
        onNewGame={handleNewGame}
      />
      <ResultDetailModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
