# MatchMatch 题库设计规范

## 概述

MatchMatch 是一款多人问答对决游戏，本规范定义题库的数据结构和分类体系。

**题目类型**：个人喜好判断题（二选一），无正确答案之分
**游戏局制**：15 道题/局
**题目难度**：混合型（浅层偏好 + 深层偏好）

---

## 题库文件结构

```
lib/
├── questions/
│   ├── index.ts         # 统一导出
│   ├── categories.ts    # 分类定义
│   └── questions.ts     # 所有题目数据
```

---

## 分类体系

### 六大分类

| ID | 名称 | 描述 | Icon |
|----|------|------|------|
| `daily-life` | 饮食起居 | 日常生活习惯（饮食、作息、居住） | 🏠 |
| `consumption` | 消费娱乐 | 花钱与闲暇方式 | 💰 |
| `social` | 社交人际 | 与人相处模式 | 👥 |
| `work-study` | 工作学习 | 做事方式 | 📚 |
| `values` | 价值观念 | 原则与判断 | ⚖️ |
| `self` | 自我认知 | 性格与情绪 | 🪞 |

### categories.ts

```typescript
export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: "daily-life",   name: "饮食起居", description: "日常生活习惯",    icon: "🏠" },
  { id: "consumption",  name: "消费娱乐", description: "花钱与闲暇方式",    icon: "💰" },
  { id: "social",      name: "社交人际", description: "与人相处模式",      icon: "👥" },
  { id: "work-study",  name: "工作学习", description: "做事方式",         icon: "📚" },
  { id: "values",      name: "价值观念", description: "原则与判断",       icon: "⚖️" },
  { id: "self",        name: "自我认知", description: "性格与情绪",       icon: "🪞" },
];
```

---

## 题目结构

### Question 接口

```typescript
export interface Question {
  id: string;           // 唯一标识，格式："<category>-<number>"，如 "life-001"
  content: string;      // 题目内容，如 "周末下午你更想..."
  optionA: string;      // 选项A
  optionB: string;      // 选项B
  categoryId: string;   // 关联 CATEGORIES.id
}
```

### 数据示例（每类3道，共18道）

**饮食起居 (daily-life)**
```typescript
{ id: "daily-life-001", content: "周末下午你更想...", optionA: "在家休息", optionB: "出门社交", categoryId: "daily-life" },
{ id: "daily-life-002", content: "早餐你更倾向于...", optionA: "自己做", optionB: "外食/外卖", categoryId: "daily-life" },
{ id: "daily-life-003", content: "居家环境你更在意...", optionA: "整洁有序", optionB: "舒适随意", categoryId: "daily-life" },
```

**消费娱乐 (consumption)**
```typescript
{ id: "consumption-001", content: "买一样想要的东西时...", optionA: "犹豫很久比价", optionB: "喜欢就买", categoryId: "consumption" },
{ id: "consumption-002", content: "娱乐时间你更想...", optionA: "刷视频/打游戏", optionB: "看书/听播客", categoryId: "consumption" },
{ id: "consumption-003", content: "旅行你偏好...", optionA: "做详细攻略", optionB: "随性探索", categoryId: "consumption" },
```

**社交人际 (social)**
```typescript
{ id: "social-001", content: "聚会中你通常是...", optionA: "话题发起者", optionB: "倾听者", categoryId: "social" },
{ id: "social-002", content: "和朋友产生分歧时...", optionA: "直接说出来", optionB: "放在心里", categoryId: "social" },
{ id: "social-003", content: "独处对你来说是...", optionA: "必需品", optionB: "偶尔需要", categoryId: "social" },
```

**工作学习 (work-study)**
```typescript
{ id: "work-study-001", content: "处理任务时你更倾向...", optionA: "先规划再执行", optionB: "边做边调整", categoryId: "work-study" },
{ id: "work-study-002", content: "学习新东西时...", optionA: "系统看书/课程", optionB: "直接动手实践", categoryId: "work-study" },
{ id: "work-study-003", content: "面对 deadline...", optionA: "提前完成", optionB: "最后冲刺", categoryId: "work-study" },
```

**价值观念 (values)**
```typescript
{ id: "values-001", content: "处理冲突时更看重...", optionA: "对错", optionB: "关系", categoryId: "values" },
{ id: "values-002", content: "人生选择主要基于...", optionA: "理性分析", optionB: "内心感受", categoryId: "values" },
{ id: "values-003", content: "对'成功'的定义...", optionA: "事业成就", optionB: "生活平衡", categoryId: "values" },
```

**自我认知 (self)**
```typescript
{ id: "self-001", content: "压力大的时候你倾向于...", optionA: "找人倾诉", optionB: "自己消化", categoryId: "self" },
{ id: "self-002", content: "做决定时你更依赖...", optionA: "直觉", optionB: "逻辑", categoryId: "self" },
{ id: "self-003", content: "被人夸奖时你通常...", optionA: "欣然接受", optionB: "觉得不好意思", categoryId: "self" },
```

---

## 统一导出 (index.ts)

```typescript
export { CATEGORIES, type Category } from "./categories";
export { QUESTIONS, type Question } from "./questions";
```

---

## 后续扩展方向

- **题目数量扩展**：按比例增加每类题目数量（如每类10道）
- **难度分层**：为题目增加 `difficulty: "easy" | "medium" | "hard"` 字段
- **题目国际化**：增加 `locale` 字段支持多语言
- **题目标签**：增加 `tags` 字段支持更细粒度筛选
