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