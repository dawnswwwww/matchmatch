'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useGameStore } from '@/lib/stores/gameStore'
import OptionButton from './OptionButton'

export default function QuestionCard() {
  const { currentQuestion, questions, myAnswers, opponentAnswers, roomId } = useGameStore()
  const [entered, setEntered] = useState(false)

  const question = questions[currentQuestion]
  if (!question) return null

  const myAnswer = myAnswers[currentQuestion]
  const opponentAnswer = opponentAnswers[currentQuestion]
  const bothAnswered = !!myAnswer && !!opponentAnswer
  const opponentSelected = !!opponentAnswer

  // Animate in on question change
  useEffect(() => {
    setEntered(false)
    const t = setTimeout(() => setEntered(true), 50)
    return () => clearTimeout(t)
  }, [currentQuestion])

  async function handleSelect(choice: 'a' | 'b') {
    if (bothAnswered) return

    useGameStore.getState().submitMyAnswer(currentQuestion, choice)

    const { myPlayerId, myUserId } = useGameStore.getState()
    await supabase.from('answers').insert({
      room_id: roomId,
      player_id: myPlayerId,
      question_index: currentQuestion,
      choice,
    })

    await supabase.channel(`room:${roomId}`).send({
      type: 'broadcast',
      event: 'answer_submitted',
      payload: { questionIndex: currentQuestion, choice, userId: myUserId },
    })
  }

  return (
    <div
      className={`
        w-full flex flex-col gap-[var(--space-6)]
        transition-all duration-[var(--duration-slow)]
        ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      style={{
        transitionTimingFunction: 'var(--ease-out-quart)',
      }}
    >
      {/* Question text */}
      <p
        className="text-[clamp(20px,4vw,26px)] font-bold text-center leading-tight"
        style={{ color: 'var(--foreground)' }}
      >
        {question.text}
      </p>

      {/* Options */}
      <div className="flex flex-col gap-[var(--space-3)]">
        <OptionButton
          label="A"
          text={question.option_a}
          selected={myAnswer === 'a'}
          locked={!!myAnswer || bothAnswered}
          opponentSelected={opponentSelected && opponentAnswer === 'a'}
          isCorrect={opponentAnswer === 'a'}
          onClick={() => handleSelect('a')}
        />
        <OptionButton
          label="B"
          text={question.option_b}
          selected={myAnswer === 'b'}
          locked={!!myAnswer || bothAnswered}
          opponentSelected={opponentSelected && opponentAnswer === 'b'}
          isCorrect={opponentAnswer === 'b'}
          onClick={() => handleSelect('b')}
        />
      </div>
    </div>
  )
}
