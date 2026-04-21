# Question Bank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a static question bank library in `lib/questions/` with categories and 18 sample questions (3 per category), plus a converter to transform static questions into Supabase runtime format.

**Architecture:**
- New `lib/questions/` module separate from Supabase runtime types
- Static question data with `StaticQuestion` interface (different from runtime `Question`)
- Converter utility to adapt static questions to Supabase runtime format
- All questions are Chinese personal preference A/B questions (no right/wrong answers)

**Tech Stack:** TypeScript, existing project conventions (Inter as default, path aliases via `@/`)

---

## File Structure

```
lib/
├── questions/
│   ├── index.ts           # Unified exports
│   ├── categories.ts      # Category definitions (CATEGORIES array + Category interface)
│   ├── questions.ts       # All static question data (QUESTIONS array + StaticQuestion interface)
│   └── converter.ts       # Convert StaticQuestion → Supabase Question runtime format
```

---

## Task 1: Create lib/questions/categories.ts

**Files:**
- Create: `lib/questions/categories.ts`

- [ ] **Step 1: Create the categories file**

```typescript
// lib/questions/categories.ts

export interface Category {
  id: string
  name: string
  description: string
  icon: string
}

export const CATEGORIES: Category[] = [
  { id: 'daily-life',   name: '饮食起居', description: '日常生活习惯',    icon: '🏠' },
  { id: 'consumption',  name: '消费娱乐', description: '花钱与闲暇方式',    icon: '💰' },
  { id: 'social',       name: '社交人际', description: '与人相处模式',      icon: '👥' },
  { id: 'work-study',   name: '工作学习', description: '做事方式',          icon: '📚' },
  { id: 'values',       name: '价值观念', description: '原则与判断',        icon: '⚖️' },
  { id: 'self',         name: '自我认知', description: '性格与情绪',          icon: '🪞' },
]
```

- [ ] **Step 2: Verify file is valid TypeScript**

Run: `npx tsc --noEmit lib/questions/categories.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/questions/categories.ts
git commit -m "feat(questions): add category definitions

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Create lib/questions/questions.ts

**Files:**
- Create: `lib/questions/questions.ts`

- [ ] **Step 1: Create the questions file**

```typescript
// lib/questions/questions.ts
import { CATEGORIES } from './categories'

export interface StaticQuestion {
  id: string
  content: string
  optionA: string
  optionB: string
  categoryId: string
}

export const QUESTIONS: StaticQuestion[] = [
  // 饮食起居 (daily-life)
  {
    id: 'daily-life-001',
    content: '周末下午你更想...',
    optionA: '在家休息',
    optionB: '出门社交',
    categoryId: 'daily-life',
  },
  {
    id: 'daily-life-002',
    content: '早餐你更倾向于...',
    optionA: '自己做',
    optionB: '外食/外卖',
    categoryId: 'daily-life',
  },
  {
    id: 'daily-life-003',
    content: '居家环境你更在意...',
    optionA: '整洁有序',
    optionB: '舒适随意',
    categoryId: 'daily-life',
  },

  // 消费娱乐 (consumption)
  {
    id: 'consumption-001',
    content: '买一样想要的东西时...',
    optionA: '犹豫很久比价',
    optionB: '喜欢就买',
    categoryId: 'consumption',
  },
  {
    id: 'consumption-002',
    content: '娱乐时间你更想...',
    optionA: '刷视频/打游戏',
    optionB: '看书/听播客',
    categoryId: 'consumption',
  },
  {
    id: 'consumption-003',
    content: '旅行你偏好...',
    optionA: '做详细攻略',
    optionB: '随性探索',
    categoryId: 'consumption',
  },

  // 社交人际 (social)
  {
    id: 'social-001',
    content: '聚会中你通常是...',
    optionA: '话题发起者',
    optionB: '倾听者',
    categoryId: 'social',
  },
  {
    id: 'social-002',
    content: '和朋友产生分歧时...',
    optionA: '直接说出来',
    optionB: '放在心里',
    categoryId: 'social',
  },
  {
    id: 'social-003',
    content: '独处对你来说是...',
    optionA: '必需品',
    optionB: '偶尔需要',
    categoryId: 'social',
  },

  // 工作学习 (work-study)
  {
    id: 'work-study-001',
    content: '处理任务时你更倾向...',
    optionA: '先规划再执行',
    optionB: '边做边调整',
    categoryId: 'work-study',
  },
  {
    id: 'work-study-002',
    content: '学习新东西时...',
    optionA: '系统看书/课程',
    optionB: '直接动手实践',
    categoryId: 'work-study',
  },
  {
    id: 'work-study-003',
    content: '面对 deadline...',
    optionA: '提前完成',
    optionB: '最后冲刺',
    categoryId: 'work-study',
  },

  // 价值观念 (values)
  {
    id: 'values-001',
    content: '处理冲突时更看重...',
    optionA: '对错',
    optionB: '关系',
    categoryId: 'values',
  },
  {
    id: 'values-002',
    content: '人生选择主要基于...',
    optionA: '理性分析',
    optionB: '内心感受',
    categoryId: 'values',
  },
  {
    id: 'values-003',
    content: "对'成功'的定义...",
    optionA: '事业成就',
    optionB: '生活平衡',
    categoryId: 'values',
  },

  // 自我认知 (self)
  {
    id: 'self-001',
    content: '压力大的时候你倾向于...',
    optionA: '找人倾诉',
    optionB: '自己消化',
    categoryId: 'self',
  },
  {
    id: 'self-002',
    content: '做决定时你更依赖...',
    optionA: '直觉',
    optionB: '逻辑',
    categoryId: 'self',
  },
  {
    id: 'self-003',
    content: '被人夸奖时你通常...',
    optionA: '欣然接受',
    optionB: '觉得不好意思',
    categoryId: 'self',
  },
]
```

- [ ] **Step 2: Verify file is valid TypeScript**

Run: `npx tsc --noEmit lib/questions/questions.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/questions/questions.ts
git commit -m "feat(questions): add 18 static questions across 6 categories

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Create lib/questions/converter.ts

**Files:**
- Create: `lib/questions/converter.ts`

- [ ] **Step 1: Create the converter file**

```typescript
// lib/questions/converter.ts
import type { Question as RuntimeQuestion } from '@/lib/supabase/types'
import type { StaticQuestion } from './questions'

/**
 * Converts a StaticQuestion (from the question bank library)
 * to the Supabase runtime Question format.
 *
 * Runtime Question fields:
 * - id: string (uses static question id)
 * - question_set_id: string (placeholder for runtime)
 * - text: string (from static content)
 * - option_a: string (from static optionA)
 * - option_b: string (from static optionB)
 * - display_order: number (not applicable for static, set to 0)
 */
export function toRuntimeQuestion(
  staticQuestion: StaticQuestion,
  questionSetId: string = 'default',
  displayOrder: number = 0
): RuntimeQuestion {
  return {
    id: staticQuestion.id,
    question_set_id: questionSetId,
    text: staticQuestion.content,
    option_a: staticQuestion.optionA,
    option_b: staticQuestion.optionB,
    display_order: displayOrder,
  }
}

/**
 * Converts an array of StaticQuestion to runtime Question[].
 * displayOrder is auto-incremented.
 */
export function toRuntimeQuestions(
  staticQuestions: StaticQuestion[],
  questionSetId: string = 'default'
): RuntimeQuestion[] {
  return staticQuestions.map((q, index) =>
    toRuntimeQuestion(q, questionSetId, index)
  )
}
```

- [ ] **Step 2: Verify file is valid TypeScript**

Run: `npx tsc --noEmit lib/questions/converter.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/questions/converter.ts
git commit -m "feat(questions): add converter to runtime Question format

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Create lib/questions/index.ts

**Files:**
- Create: `lib/questions/index.ts`

- [ ] **Step 1: Create the index file**

```typescript
// lib/questions/index.ts
export { CATEGORIES, type Category } from './categories'
export { QUESTIONS, type StaticQuestion } from './questions'
export { toRuntimeQuestion, toRuntimeQuestions } from './converter'
```

- [ ] **Step 2: Verify file is valid TypeScript**

Run: `npx tsc --noEmit lib/questions/index.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/questions/index.ts
git commit -m "feat(questions): add unified exports for question bank library

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Final Verification

**Files to verify:**
- `lib/questions/index.ts`
- `lib/questions/categories.ts`
- `lib/questions/questions.ts`
- `lib/questions/converter.ts`

- [ ] **Step 1: Run full TypeScript check on the questions module**

Run: `npx tsc --noEmit lib/questions/index.ts lib/questions/categories.ts lib/questions/questions.ts lib/questions/converter.ts`
Expected: No errors

- [ ] **Step 2: Verify all exports are accessible**

Run: `node -e "const q = require('./lib/questions'); console.log('CATEGORIES:', q.CATEGORIES.length); console.log('QUESTIONS:', q.QUESTIONS.length); console.log('First category:', JSON.stringify(q.CATEGORIES[0])); console.log('First question:', JSON.stringify(q.QUESTIONS[0]));"`
Expected: Should print CATEGORIES: 6, QUESTIONS: 18, and show first entries

- [ ] **Step 3: Verify converter works**

Run: `node -e "const { QUESTIONS, toRuntimeQuestion } = require('./lib/questions'); const runtime = toRuntimeQuestion(QUESTIONS[0], 'test-set', 5); console.log('Runtime question:', JSON.stringify(runtime));"`
Expected: Should show converted question with runtime format

---

## Spec Coverage Check

| Spec Section | Task |
|--------------|------|
| File structure (lib/questions/) | Tasks 1-4 |
| Category interface + CATEGORIES array | Task 1 |
| StaticQuestion interface + QUESTIONS array | Task 2 |
| Converter (StaticQuestion → Runtime) | Task 3 |
| Unified index.ts exports | Task 4 |
| TypeScript validation | Tasks 1-4 + Task 5 |
