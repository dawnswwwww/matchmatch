// app/result/[resultId]/page.tsx
'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { calculateScore, getScoreLabel } from '@/lib/utils/score'
import ScoreDisplay from './components/ScoreDisplay'
import ComparisonList from './components/ComparisonList'

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

export default function ResultPage({
  params,
}: {
  params: Promise<{ resultId: string }>
}) {
  const { resultId } = use(params)
  const router = useRouter()
  const [score, setScore] = useState(0)
  const [label, setLabel] = useState('')
  const [comparisons, setComparisons] = useState<Comparison[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadResult() {
      // Load room
      const { data: room } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', resultId)
        .single()

      if (!room || room.status !== 'finished') {
        router.push('/')
        return
      }

      // Load questions
      if (room.question_set_id) {
        const { data: questions } = await supabase
          .from('questions')
          .select('*')
          .eq('question_set_id', room.question_set_id)
          .order('display_order')

        // Load all answers
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
        setScore(s)
        setLabel(getScoreLabel(s))

        const comps = (questions || []).map((q: Question, i: number) => ({
          question: q.text,
          optionA: q.option_a,
          optionB: q.option_b,
          myChoice: myAnswers[i] || null,
          opponentChoice: opponentAnswers[i] || null,
          match: myAnswers[i] === opponentAnswers[i],
        }))

        setComparisons(comps)
      }

      setLoading(false)
    }

    loadResult()
  }, [resultId])

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#868685]">加载中...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <ScoreDisplay score={score} label={label} />
        <ComparisonList comparisons={comparisons} />
        <button
          onClick={() => router.push('/')}
          className="py-3 px-8 rounded-full font-semibold transition-transform text-[18px]"
          style={{ background: '#9fe870', color: '#163300' }}
        >
          我也来测
        </button>
      </div>
    </main>
  )
}