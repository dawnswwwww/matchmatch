'use client'

import { useState, useMemo, useCallback } from 'react'
import { useGameStore } from '@/lib/stores/gameStore'
import QuestionIndexBar from './QuestionIndexBar'
import ResultQuestionCard from './ResultQuestionCard'
import QuestionTabBar from './QuestionTabBar'

interface ResultDetailModalProps {
  open: boolean
  onClose: () => void
}

type Tab = 'all' | 'match' | 'mismatch'

export default function ResultDetailModal({ open, onClose }: ResultDetailModalProps) {
  const { questions, myAnswers, opponentAnswers, totalQuestions } = useGameStore()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [activeTab, setActiveTab] = useState<Tab>('all')

  const comparisons = useMemo(() => {
    return questions.slice(0, totalQuestions).map((q, i) => ({
      question: q.text,
      optionA: q.option_a,
      optionB: q.option_b,
      myChoice: myAnswers[i] ?? null,
      opponentChoice: opponentAnswers[i] ?? null,
      match: myAnswers[i] !== undefined && opponentAnswers[i] !== null && myAnswers[i] === opponentAnswers[i],
    }))
  }, [questions, myAnswers, opponentAnswers, totalQuestions])

  const filteredComparisons = useMemo(() => {
    if (activeTab === 'match') return comparisons.filter((c) => c.match)
    if (activeTab === 'mismatch') return comparisons.filter((c) => !c.match)
    return comparisons
  }, [comparisons, activeTab])

  const matchStatus = useMemo(
    () => comparisons.map((c) => c.match),
    [comparisons]
  )

  const counts = useMemo(
    () => ({
      all: comparisons.length,
      match: comparisons.filter((c) => c.match).length,
      mismatch: comparisons.filter((c) => !c.match).length,
    }),
    [comparisons]
  )

  const handleJump = useCallback((index: number) => {
    setCurrentSlide(index)
  }, [])

  const handlePrev = useCallback(() => {
    setCurrentSlide((s) => Math.max(0, s - 1))
  }, [])

  const handleNext = useCallback(() => {
    setCurrentSlide((s) => Math.min(filteredComparisons.length - 1, s + 1))
  }, [filteredComparisons.length])

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab)
    setCurrentSlide(0)
  }, [])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--background)' }}
    >
      {/* 顶部栏 */}
      <div
        className="flex items-center justify-between px-[var(--space-4)] py-[var(--space-3)]"
        style={{ borderBottom: '1px solid var(--surface)' }}
      >
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-full)] text-lg font-bold"
          style={{ color: 'var(--foreground)' }}
          aria-label="关闭"
        >
          ×
        </button>
        <span className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
          答题详情
        </span>
        <div className="w-8" />
      </div>

      {/* 索引条 */}
      <QuestionIndexBar
        total={comparisons.length}
        matchStatus={matchStatus}
        currentIndex={currentSlide}
        onJump={handleJump}
      />

      {/* 滑动卡片区 */}
      <div
        className="flex-1 overflow-hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        <div
          className="flex h-full transition-transform duration-300"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {filteredComparisons.map((comp, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-full h-full overflow-y-auto snap-center"
              style={{ scrollSnapAlign: 'start' }}
            >
              <ResultQuestionCard
                index={comparisons.indexOf(comp)}
                question={comp.question}
                optionA={comp.optionA}
                optionB={comp.optionB}
                myChoice={comp.myChoice}
                opponentChoice={comp.opponentChoice}
                match={comp.match}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 翻页提示 */}
      <div
        className="flex items-center justify-between px-[var(--space-6)] py-[var(--space-2)]"
        style={{ color: 'var(--gray)', fontSize: '12px' }}
      >
        <button
          onClick={handlePrev}
          disabled={currentSlide === 0}
          className="flex items-center gap-1 disabled:opacity-30"
          style={{ color: 'var(--gray)' }}
        >
          ← 上一题
        </button>
        <span>{currentSlide + 1} / {filteredComparisons.length}</span>
        <button
          onClick={handleNext}
          disabled={currentSlide === filteredComparisons.length - 1}
          className="flex items-center gap-1 disabled:opacity-30"
          style={{ color: 'var(--gray)' }}
        >
          下一题 →
        </button>
      </div>

      {/* Tab 栏 */}
      <QuestionTabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        counts={counts}
      />
    </div>
  )
}
