# 结果页重新设计 - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将结果页从平铺所有题目对比改为"简约首页 + 全屏弹出层详情"结构

**Architecture:** 新增 ResultSummary + IndicatorCard 组件替换现有 ScoreDisplay + ComparisonList，新增 ResultDetailModal 全屏弹出层承载题目详情，组件间通过 props 传递数据，不涉及 store 变更。

**Tech Stack:** React (existing), CSS Variables (existing), scroll-snap (原生 CSS, 无需库)

---

## 文件清单

**新建:**
- `app/room/[roomId]/components/ResultSummary.tsx`
- `app/room/[roomId]/components/IndicatorCard.tsx`
- `app/room/[roomId]/components/ResultDetailModal.tsx`
- `app/room/[roomId]/components/QuestionIndexBar.tsx`
- `app/room/[roomId]/components/QuestionCard.tsx`
- `app/room/[roomId]/components/QuestionTabBar.tsx`
- `lib/utils/score.ts` (扩展)

**修改:**
- `app/room/[roomId]/components/ResultPanel.tsx`

---

## Task 1: 扩展 score.ts 添加辅助函数

**Files:**
- Modify: `lib/utils/score.ts`

- [ ] **Step 1: 在 score.ts 底部添加辅助函数**

```typescript
// lib/utils/score.ts 新增以下函数:

export function getMatchCount(
  myAnswers: Record<number, 'a' | 'b'>,
  opponentAnswers: Record<number, 'a' | 'b' | null>,
  total: number
): number {
  let matches = 0
  for (let i = 0; i < total; i++) {
    if (myAnswers[i] && opponentAnswers[i] && myAnswers[i] === opponentAnswers[i]) {
      matches++
    }
  }
  return matches
}

export function getPersonalityMatchLabel(score: number): string {
  if (score >= 80) return '灵魂伴侣'
  if (score >= 60) return '性格相近'
  if (score >= 40) return '风格互补'
  return '差异较大'
}
```

- [ ] **Step 2: 验证文件语法**

Run: `npx tsc --noEmit lib/utils/score.ts`
Expected: 无错误输出

- [ ] **Step 3: 提交**

```bash
git add lib/utils/score.ts
git commit -m "feat: add getMatchCount and getPersonalityMatchLabel helpers"
```

---

## Task 2: IndicatorCard 组件

**Files:**
- Create: `app/room/[roomId]/components/IndicatorCard.tsx`

- [ ] **Step 1: 创建 IndicatorCard 组件**

```tsx
// app/room/[roomId]/components/IndicatorCard.tsx
'use client'

interface IndicatorCardProps {
  label: string
  value: string | number
  description?: string
}

export default function IndicatorCard({ label, value, description }: IndicatorCardProps) {
  return (
    <div
      className="flex-1 min-w-0 p-[var(--space-3)] rounded-2xl text-center"
      style={{ background: 'var(--surface)' }}
    >
      <div
        className="text-[clamp(20px,4vw,28px)] font-black leading-none mb-[var(--space-1)]"
        style={{ color: 'var(--green)' }}
      >
        {value}
      </div>
      <div
        className="text-xs font-semibold mb-[2px]"
        style={{ color: 'var(--foreground)' }}
      >
        {label}
      </div>
      {description && (
        <div
          className="text-[10px]"
          style={{ color: 'var(--gray)' }}
        >
          {description}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 验证组件渲染**

Run: `npx tsc --noEmit app/room/[roomId]/components/IndicatorCard.tsx`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add app/room/[roomId]/components/IndicatorCard.tsx
git commit -m "feat: add IndicatorCard component"
```

---

## Task 3: ResultSummary 组件

**Files:**
- Create: `app/room/[roomId]/components/ResultSummary.tsx`

- [ ] **Step 1: 创建 ResultSummary 组件**

```tsx
// app/room/[roomId]/components/ResultSummary.tsx
'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/lib/stores/gameStore'
import { calculateScore, getScoreLabel, getMatchCount, getPersonalityMatchLabel } from '@/lib/utils/score'
import IndicatorCard from './IndicatorCard'

interface ResultSummaryProps {
  onOpenDetail: () => void
  onShare: () => void
  onNewGame: () => void
}

export default function ResultSummary({ onOpenDetail, onShare, onNewGame }: ResultSummaryProps) {
  const { questions, myAnswers, opponentAnswers, totalQuestions } = useGameStore()
  const [score, setScore] = useState(0)
  const [label, setLabel] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const s = calculateScore(myAnswers, opponentAnswers, totalQuestions)
    setScore(s)
    setLabel(getScoreLabel(s))
  }, [myAnswers, opponentAnswers, totalQuestions])

  const matchCount = getMatchCount(myAnswers, opponentAnswers, totalQuestions)
  const personalityLabel = getPersonalityMatchLabel(score)

  return (
    <div className="w-full flex flex-col items-center gap-[var(--space-6)]">
      {/* 综合得分大数字 */}
      <div
        className={`
          text-center transition-all duration-[var(--duration-slow)]
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
        style={{ transitionDelay: mounted ? '200ms' : '200ms' }}
      >
        <div
          className="text-[clamp(72px,20vw,120px)] font-black leading-[0.85] tracking-[-0.04em] mb-[var(--space-2)]"
          style={{ fontFamily: 'Inter, sans-serif', color: 'var(--green)' }}
        >
          {score}
          <span className="text-[0.4em] align-top">%</span>
        </div>
        <div
          className="text-[clamp(22px,5vw,32px)] font-bold mb-[var(--space-1)]"
          style={{ color: 'var(--foreground)' }}
        >
          {label}
        </div>
        <p className="text-sm" style={{ color: 'var(--gray)' }}>
          你们在 {matchCount} / {totalQuestions} 题上想法一致
        </p>
      </div>

      {/* 三个指标卡片 */}
      <div
        className={`
          w-full flex gap-[var(--space-3)] px-[var(--space-2)]
          transition-all duration-[var(--duration-slow)]
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
        style={{ transitionDelay: mounted ? '400ms' : '400ms' }}
      >
        <IndicatorCard label="综合得分" value={`${score}%`} />
        <IndicatorCard label="默契题数" value={`${matchCount}/${totalQuestions}`} />
        <IndicatorCard label="性格匹配" value={`${score}%`} description={personalityLabel} />
      </div>

      {/* 主 CTA: 查看答题详情 */}
      <button
        onClick={onOpenDetail}
        className={`
          w-full max-w-[320px] py-[var(--space-3)] px-[var(--space-6)]
          rounded-full font-semibold text-base
          transition-all duration-[var(--duration-base)]
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
        style={{
          background: 'var(--foreground)',
          color: 'var(--background)',
          transitionDelay: mounted ? '500ms' : '500ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.03)' }}
      >
        查看答题详情
      </button>

      {/* 次要 CTA: 分享 + 再开一局 */}
      <div
        className={`
          flex gap-[var(--space-3)] w-full max-w-[320px]
          transition-all duration-[var(--duration-slow)]
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
        style={{ transitionDelay: mounted ? '600ms' : '600ms' }}
      >
        <button
          onClick={onShare}
          className="flex-1 py-[var(--space-3)] px-[var(--space-6)] rounded-full font-semibold text-base transition-all duration-[var(--duration-base)]"
          style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--foreground)', e.currentTarget.style.color = 'var(--background)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)', e.currentTarget.style.color = 'var(--foreground)' }}
        >
          分享结果
        </button>
        <button
          onClick={onNewGame}
          className="flex-1 py-[var(--space-3)] px-[var(--space-6)] rounded-full font-semibold text-base transition-all duration-[var(--duration-base)]"
          style={{ background: 'var(--green)', color: 'var(--green-dark)' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.03)' }}
        >
          再开一局
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 验证语法**

Run: `npx tsc --noEmit app/room/[roomId]/components/ResultSummary.tsx`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add app/room/[roomId]/components/ResultSummary.tsx
git commit -m "feat: add ResultSummary component"
```

---

## Task 4: QuestionCard 组件 (弹出层内部)

**Files:**
- Create: `app/room/[roomId]/components/QuestionCard.tsx`

- [ ] **Step 1: 创建 QuestionCard 组件**

```tsx
// app/room/[roomId]/components/QuestionCard.tsx
'use client'

interface QuestionCardProps {
  index: number
  question: string
  optionA: string
  optionB: string
  myChoice: 'a' | 'b' | null
  opponentChoice: 'a' | 'b' | null
  match: boolean
}

function OptionBadge({ choice, label }: { choice: 'a' | 'b' | null; label: string }) {
  if (!choice) return null
  const isA = choice === 'a'
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-1"
      style={isA ? { background: 'var(--green)', color: 'var(--green-dark)' } : { background: 'var(--foreground)', color: 'var(--background)' }}
    >
      {choice.toUpperCase()}
    </span>
  )
}

export default function QuestionCard({ index, question, optionA, optionB, myChoice, opponentChoice, match }: QuestionCardProps) {
  return (
    <div
      className="flex-shrink-0 w-full snap-center px-[var(--space-6)] py-[var(--space-4)]"
    >
      <div
        className={`
          p-[var(--space-5)] rounded-2xl border-2
          ${match ? 'border-[var(--green)]' : 'border-[var(--surface)]'}
        `}
        style={{
          background: match ? 'oklch(86% 0.08 122 / 0.06)' : 'var(--surface)',
        }}
      >
        {/* 题目编号和匹配状态 */}
        <div className="flex items-center justify-between mb-[var(--space-4)]">
          <span className="text-sm font-semibold" style={{ color: 'var(--gray)' }}>
            第 {index + 1} 题
          </span>
          {match ? (
            <span className="text-xs font-semibold" style={{ color: 'var(--green-dark)' }}>
              ✓ 默契
            </span>
          ) : (
            <span className="text-xs" style={{ color: 'var(--gray)' }}>
              ✗ 分歧
            </span>
          )}
        </div>

        {/* 题目文本 */}
        <p className="text-base font-medium mb-[var(--space-5)] leading-snug" style={{ color: 'var(--foreground)' }}>
          {question}
        </p>

        {/* 选项区域 */}
        <div className="flex items-center gap-[var(--space-4)]">
          {/* 选项 A */}
          <div className="flex-1">
            <div
              className={`
                p-[var(--space-3)] rounded-xl border-2
                ${myChoice === 'a' || opponentChoice === 'a' ? 'border-[var(--green)]' : 'border-transparent'}
              `}
              style={{ background: myChoice === 'a' ? 'oklch(86% 0.08 122 / 0.15)' : 'var(--background)' }}
            >
              <div className="flex items-center mb-[var(--space-1)]">
                <OptionBadge choice={myChoice === 'a' ? 'a' : null} label="你" />
                <span className="text-xs" style={{ color: 'var(--gray)' }}>你的</span>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                A: {optionA}
              </p>
              {opponentChoice === 'a' && (
                <p className="text-xs mt-[2px]" style={{ color: 'var(--gray)' }}>
                  对方也选 A
                </p>
              )}
            </div>
          </div>

          {/* VS */}
          <div className="text-sm font-bold" style={{ color: 'var(--gray)' }}>vs</div>

          {/* 选项 B */}
          <div className="flex-1">
            <div
              className={`
                p-[var(--space-3)] rounded-xl border-2
                ${myChoice === 'b' || opponentChoice === 'b' ? 'border-[var(--foreground)]' : 'border-transparent'}
              `}
              style={{ background: myChoice === 'b' ? 'oklch(0 0 0 / 0.06)' : 'var(--background)' }}
            >
              <div className="flex items-center mb-[var(--space-1)]">
                <OptionBadge choice={myChoice === 'b' ? 'b' : null} label="你" />
                <span className="text-xs" style={{ color: 'var(--gray)' }}>你的</span>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                B: {optionB}
              </p>
              {opponentChoice === 'b' && (
                <p className="text-xs mt-[2px]" style={{ color: 'var(--gray)' }}>
                  对方也选 B
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 验证语法**

Run: `npx tsc --noEmit app/room/[roomId]/components/QuestionCard.tsx`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add app/room/[roomId]/components/QuestionCard.tsx
git commit -m "feat: add QuestionCard component for modal"
```

---

## Task 5: QuestionIndexBar 组件

**Files:**
- Create: `app/room/[roomId]/components/QuestionIndexBar.tsx`

- [ ] **Step 1: 创建 QuestionIndexBar 组件**

```tsx
// app/room/[roomId]/components/QuestionIndexBar.tsx
'use client'

import { useRef, useEffect } from 'react'

interface QuestionIndexBarProps {
  total: number
  matchStatus: boolean[]
  currentIndex: number
  onJump: (index: number) => void
}

export default function QuestionIndexBar({ total, matchStatus, currentIndex, onJump }: QuestionIndexBarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const current = itemRefs.current[currentIndex]
    if (current && containerRef.current) {
      current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [currentIndex])

  return (
    <div
      ref={containerRef}
      className="w-full overflow-x-auto flex items-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-3)]"
      style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
    >
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          ref={(el) => { itemRefs.current[i] = el }}
          onClick={() => onJump(i)}
          className={`
            flex-shrink-0 w-8 h-8 rounded-full text-xs font-bold
            transition-all duration-[var(--duration-base)]
            ${currentIndex === i ? 'scale-125' : 'scale-100'}
          `}
          style={{
            background: currentIndex === i
              ? 'var(--foreground)'
              : matchStatus[i]
              ? 'var(--green)'
              : 'var(--surface)',
            color: currentIndex === i
              ? 'var(--background)'
              : matchStatus[i]
              ? 'var(--green-dark)'
              : 'var(--gray)',
            scrollSnapAlign: 'center',
          }}
        >
          {i + 1}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: 验证语法**

Run: `npx tsc --noEmit app/room/[roomId]/components/QuestionIndexBar.tsx`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add app/room/[roomId]/components/QuestionIndexBar.tsx
git commit -m "feat: add QuestionIndexBar component"
```

---

## Task 6: QuestionTabBar 组件

**Files:**
- Create: `app/room/[roomId]/components/QuestionTabBar.tsx`

- [ ] **Step 1: 创建 QuestionTabBar 组件**

```tsx
// app/room/[roomId]/components/QuestionTabBar.tsx
'use client'

type Tab = 'all' | 'match' | 'mismatch'

interface QuestionTabBarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  counts: { all: number; match: number; mismatch: number }
}

export default function QuestionTabBar({ activeTab, onTabChange, counts }: QuestionTabBarProps) {
  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: `全部 (${counts.all})` },
    { key: 'match', label: `默契 (${counts.match})` },
    { key: 'mismatch', label: `分歧 (${counts.mismatch})` },
  ]

  return (
    <div
      className="flex gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-3)]"
      style={{ borderTop: '1px solid var(--surface)' }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`
            flex-1 py-[var(--space-2)] px-[var(--space-3)]
            rounded-full text-sm font-medium
            transition-all duration-[var(--duration-base)]
          `}
          style={
            activeTab === tab.key
              ? { background: 'var(--foreground)', color: 'var(--background)' }
              : { background: 'var(--surface)', color: 'var(--gray)' }
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: 验证语法**

Run: `npx tsc --noEmit app/room/[roomId]/components/QuestionTabBar.tsx`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add app/room/[roomId]/components/QuestionTabBar.tsx
git commit -m "feat: add QuestionTabBar component"
```

---

## Task 7: ResultDetailModal 组件

**Files:**
- Create: `app/room/[roomId]/components/ResultDetailModal.tsx`

- [ ] **Step 1: 创建 ResultDetailModal 组件**

```tsx
// app/room/[roomId]/components/ResultDetailModal.tsx
'use client'

import { useState, useMemo, useCallback } from 'react'
import { useGameStore } from '@/lib/stores/gameStore'
import QuestionIndexBar from './QuestionIndexBar'
import QuestionCard from './QuestionCard'
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
          className="w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold"
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
        style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
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
              <QuestionCard
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
```

- [ ] **Step 2: 验证语法**

Run: `npx tsc --noEmit app/room/[roomId]/components/ResultDetailModal.tsx`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add app/room/[roomId]/components/ResultDetailModal.tsx
git commit -m "feat: add ResultDetailModal component"
```

---

## Task 8: 重构 ResultPanel 使用新组件

**Files:**
- Modify: `app/room/[roomId]/components/ResultPanel.tsx`
- Delete: `app/result/[resultId]/components/ScoreDisplay.tsx` (如无其他引用)
- Delete: `app/result/[resultId]/components/ComparisonList.tsx` (如无其他引用)

- [ ] **Step 1: 用新组件重写 ResultPanel**

```tsx
// app/room/[roomId]/components/ResultPanel.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ResultSummary from './ResultSummary'
import ResultDetailModal from './ResultDetailModal'

export default function ResultPanel() {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)

  async function handleShare() {
    const roomId = useGameStore.getState().roomId
    const score = 0 // 获取实际分数需要重构，略过
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
```

**注意:** 上述 handleShare 中 `score` 变量未使用是正常的，因为 share text 中不需要分数。实际 roomId 从 store 获取需要 import useGameStore。

实际代码:

```tsx
// app/room/[roomId]/components/ResultPanel.tsx
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
```

- [ ] **Step 2: 验证语法**

Run: `npx tsc --noEmit app/room/[roomId]/components/ResultPanel.tsx`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add app/room/[roomId]/components/ResultPanel.tsx
git commit -m "refactor: ResultPanel to use ResultSummary + ResultDetailModal"
```

---

## 自检清单

1. **Spec 覆盖检查**:
   - 首页展示综合得分 + 指标卡 + CTA → Task 3 ✓
   - 弹出层全屏展示 → Task 7 ✓
   - 横向索引条 + 快速跳转 → Task 5 ✓
   - 滑动翻页卡片 → Task 4 + Task 7 ✓
   - Tab 筛选 (全部/默契/分歧) → Task 6 + Task 7 ✓

2. **占位符扫描**: 无 TBD/TODO ✓

3. **类型一致性**: 所有接口与 gameStore 中的 types 一致 ✓

4. **文件引用**: 无引用不存在的组件 ✓
