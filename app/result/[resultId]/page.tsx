// app/result/[resultId]/page.tsx
import { Metadata } from 'next'
import { supabase } from '@/lib/supabase/client'
import { calculateScore, getScoreLabel } from '@/lib/utils/score'
import { getLocalQuestionsBySetId } from '@/lib/questions/adapter'
import type { Question } from '@/lib/supabase/types'
import ResultClient from './ResultClient'

interface PageProps {
  params: Promise<{ resultId: string }>
}

// Dynamic OG metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { resultId } = await params

  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', resultId)
    .single()

  let score = 0
  let label = '匹配度'

  if (room && room.status === 'finished') {
    const { data: answers } = await supabase
      .from('answers')
      .select('*')
      .eq('room_id', resultId)

    if (answers && answers.length > 0) {
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

      score = calculateScore(myAnswers, opponentAnswers, room.total_questions)
      label = getScoreLabel(score)
    }
  }

  const title = `${score}% ${label} — MatchMatch`
  const description = `我在 MatchMatch 测出了 ${score}% ${label}！你也来试试？`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: `/api/og?score=${score}&label=${encodeURIComponent(label)}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og?score=${score}&label=${encodeURIComponent(label)}`],
    },
  }
}

export default async function ResultPage({ params }: PageProps) {
  const { resultId } = await params

  // Server-side data fetch for metadata + initial data
  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', resultId)
    .single()

  let initialData = null

  if (room && room.status === 'finished') {
    // 优先从本地题库获取，fallback 到 Supabase
    const localQuestions = getLocalQuestionsBySetId(room.question_set_id || 'default')
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

    if (answers && answers.length > 0) {
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

      const score = calculateScore(myAnswers, opponentAnswers, room.total_questions)
      const label = getScoreLabel(score)

      const comparisons = (questions || []).map((q: Question, i: number) => ({
        question: q.text,
        optionA: q.option_a,
        optionB: q.option_b,
        myChoice: myAnswers[i] || null,
        opponentChoice: opponentAnswers[i] || null,
        match: myAnswers[i] === opponentAnswers[i],
      }))

      initialData = { score, label, comparisons, roomCode: room.code }
    }
  }

  return <ResultClient resultId={resultId} initialData={initialData} />
}
