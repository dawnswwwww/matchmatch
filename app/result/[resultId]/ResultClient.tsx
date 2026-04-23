// app/result/[resultId]/ResultClient.tsx
'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { calculateScore, getScoreLabel } from '@/lib/utils/score'
import { getLocalQuestionsBySetId } from '@/lib/questions/adapter'
import ScoreDisplay from './components/ScoreDisplay'
import ComparisonList from './components/ComparisonList'
import Button from '@/components/ui/Button'

interface Question {
  id: string
  text: string
  option_a: string
  option_b: string
}

interface Comparison {
  question: string
  optionA: string
  optionB: string
  myChoice: 'a' | 'b' | null
  opponentChoice: 'a' | 'b' | null
  match: boolean
}

interface ResultData {
  score: number
  label: string
  comparisons: Comparison[]
  roomCode: string
}

interface ResultClientProps {
  resultId: string
  initialData?: ResultData | null
}

export default function ResultClient({ resultId, initialData }: ResultClientProps) {
  const router = useRouter()
  const [data, setData] = useState<ResultData | null>(initialData ?? null)
  const [loading, setLoading] = useState(!initialData)

  useEffect(() => {
    if (initialData) return

    async function loadResult() {
      const { data: room } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', resultId)
        .single()

      if (!room || room.status !== 'finished') {
        router.push('/')
        return
      }

      if (room.question_set_id) {
        // 优先从本地题库获取，fallback 到 Supabase
        const localQuestions = getLocalQuestionsBySetId(room.question_set_id)
        let questions: Question[] | null = localQuestions

        if (!questions) {
          const { data } = await supabase
            .from('questions')
            .select('*')
            .eq('question_set_id', room.question_set_id)
            .order('display_order')
          questions = data
        }

        const { data: answers } = await supabase
          .from('answers')
          .select('*')
          .eq('room_id', resultId)

        if (!answers || answers.length === 0) {
          setLoading(false)
          return
        }

        const myAnswers: Record<number, 'a' | 'b'> = {}
        const opponentAnswers: Record<number, 'a' | 'b' | null> = {}

        const players = [...new Set(answers.map((a) => a.player_id))]
        const [player1] = players

        answers.forEach((a) => {
          if (a.player_id === player1) {
            myAnswers[a.question_index] = a.choice
          } else {
            opponentAnswers[a.question_index] = a.choice
          }
        })

        const s = calculateScore(myAnswers, opponentAnswers, room.total_questions)
        const label = getScoreLabel(s)

        const comps = (questions || []).slice(0, room.total_questions).map((q: Question, i: number) => ({
          question: q.text,
          optionA: q.option_a,
          optionB: q.option_b,
          myChoice: myAnswers[i] || null,
          opponentChoice: opponentAnswers[i] || null,
          match: myAnswers[i] === opponentAnswers[i],
        }))

        setData({ score: s, label, comparisons: comps, roomCode: room.code })
      }

      setLoading(false)
    }

    loadResult()
  }, [resultId])

  if (loading || !data) {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-[var(--space-4)]">
          <div
            className="w-32 h-4 rounded-full animate-pulse"
            style={{ background: 'var(--surface)' }}
          />
          <div
            className="w-48 h-2 rounded-full animate-pulse"
            style={{ background: 'var(--surface)' }}
          />
        </div>
      </main>
    )
  }

  const shareText = `我在 MatchMatch 测出了 ${data.score}% ${data.label}！你也来试试？`
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'MatchMatch', text: shareText, url: shareUrl })
      } catch {
        await navigator.clipboard.writeText(shareUrl)
      }
    } else {
      await navigator.clipboard.writeText(shareUrl)
    }
  }

  function handleNewGame() {
    router.push('/')
  }

  return (
    <main className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-[var(--space-6)] py-[var(--space-12)]">
      <div className="w-full max-w-md flex flex-col items-center gap-[var(--space-8)]">

        <ScoreDisplay score={data.score} label={data.label} />

        <ComparisonList comparisons={data.comparisons} />

        {data.roomCode && (
          <p className="text-sm font-medium tracking-widest" style={{ color: 'var(--gray)' }}>
            房间号 · {data.roomCode}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-[var(--space-3)] w-full max-w-[320px]">
          <Button
            variant="secondary"
            onClick={handleShare}
            className="w-full"
          >
            分享结果
          </Button>
          <Button
            variant="primary"
            onClick={handleNewGame}
            className="w-full"
          >
            我也来测
          </Button>
        </div>
      </div>
    </main>
  )
}
