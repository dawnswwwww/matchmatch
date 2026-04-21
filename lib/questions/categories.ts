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
