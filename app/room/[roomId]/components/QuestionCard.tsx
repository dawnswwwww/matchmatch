// app/room/[roomId]/components/QuestionCard.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useGameStore } from '@/lib/stores/gameStore'
import OptionButton from './OptionButton'

export default function QuestionCard() {
  const { currentQuestion, questions, myAnswers, opponentAnswers, roomId } = useGameStore()
  const [locked, setLocked] = useState(false)

  const question = questions[currentQuestion]
  if (!question) return null

  const myAnswer = myAnswers[currentQuestion]
  const opponentAnswer = opponentAnswers[currentQuestion]
  const bothAnswered = !!myAnswer && !!opponentAnswer

  async function handleSelect(choice: 'a' | 'b') {
    if (locked) return
    setLocked(true)

    useGameStore.getState().submitMyAnswer(currentQuestion, choice)

    // Insert answer to DB
    const { myPlayerId } = useGameStore.getState()
    await supabase.from('answers').insert({
      room_id: roomId,
      player_id: myPlayerId,
      question_index: currentQuestion,
      choice,
    })

    // Broadcast to opponent
    const { myUserId } = useGameStore.getState()
    await supabase.channel(`room:${roomId}`).send({
      type: 'broadcast',
      event: 'answer_submitted',
      payload: { questionIndex: currentQuestion, choice, userId: myUserId },
    })
  }

  // After both answered, show result then auto-advance
  const opponentSelected = !!opponentAnswer

  return (
    <div className="w-full">
      <p className="text-xl font-semibold mb-6 text-center">{question.text}</p>
      <div className="flex flex-col gap-3">
        <OptionButton
          label="A"
          text={question.option_a}
          selected={myAnswer === 'a'}
          locked={locked || bothAnswered}
          opponentSelected={opponentSelected && opponentAnswer === 'a'}
          isCorrect={opponentAnswer === 'a'}
          onClick={() => handleSelect('a')}
        />
        <OptionButton
          label="B"
          text={question.option_b}
          selected={myAnswer === 'b'}
          locked={locked || bothAnswered}
          opponentSelected={opponentSelected && opponentAnswer === 'b'}
          isCorrect={opponentAnswer === 'b'}
          onClick={() => handleSelect('b')}
        />
      </div>
    </div>
  )
}
