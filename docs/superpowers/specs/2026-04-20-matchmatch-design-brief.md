# MatchMatch — Design Brief

> Derived from `docs/superpowers/specs/2026-04-20-matchmatch-design.md`
> Date: 2026/04/20

## 1. Feature Summary

MatchMatch is a lightweight real-time 双人A/B答题小游戏。Two players answer the same questions simultaneously, and the system calculates a "Match Score" based on answer agreement. Built for casual, shareable fun — no account needed, one-minute sessions, results designed for social传播. Target users: friends at a party or strangers breaking the ice.

---

## 2. Primary User Action

**答题选择 A 或 B** — The core loop is binary choice per question. Every UI decision should make this frictionless and satisfying.

---

## 3. Design Direction

### Aesthetic
Bold, instant, playful. Anchored on the Wise design DNA — lime-green hero accent (`#9fe870`), near-black primary text, massive display typography. The interface should feel like a conversation starter at a party: confident, friendly, slightly mischievous.

**Aesthetic keywords**: 玩笑轻松 (playful/lighthearted), bold, unapologetic, youthful.

### Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| Primary CTA / Accent | `#9fe870` | CTAs, highlights, match indicators (~10% of visual weight) |
| CTA Text | `#163300` | Text on lime-green surfaces |
| Background | `#ffffff` / `#f8f9f8` | Page backgrounds |
| Primary Text | `#0e0f0c` | Headlines, body |
| Secondary Text | `#868685` | Metadata, timestamps |
| Light Surface | `#e8ebe6` | Cards, panels, subtle backgrounds |

> Using OKLCH principles: the lime-green accent is the brand anchor. Neutrals carry a tiny chroma tint toward the brand hue for subconscious cohesion.

### Typography

- **Display / Headlines**: Inter weight 900, line-height 0.85, `calt` on
- **Body / UI**: Inter weight 600, `calt` on
- **Scale**: Perfect fifth ratio (1.5) — 5 sizes: xs / sm / base / lg / xl+
- **Score display**: Fluid type (`clamp()`) — massive at rest, scales with viewport
- **UI components**: Fixed rem scale for spatial predictability

### Motion

| Duration | Use Case |
|----------|----------|
| 100-150ms | Button press feedback, toggle |
| 200-300ms | Hover states, tooltip |
| 300-500ms | State transitions (question change, panel reveal) |
| 500-800ms | Page-level entrances, score reveal |
| 2000ms | Confetti burst on high match scores |

- **Easing**: `ease-out-quart` for entrances, `ease-in` for exits, `ease-in-out` for toggles
- **No bounce/elastic** — real objects decelerate smoothly
- **Reduced motion**: All animations degrade to `opacity` fades; functional UI (progress bars) preserved

### Confetti

- Triggers on score ≥ 61% ("有点东西的默契" and above)
- Particles: lime-green `#9fe870` + white
- Duration: 2s
- Library: `canvas-confetti` or equivalent

---

## 4. Layout Strategy

### Landing Page (`/`)

Single-screen, vertically centered. Massive "MatchMatch" headline as hero moment. Two lime-green pill CTAs below: "创建房间" and "输入房间码". Minimal — the accent color on buttons is the only color against white.

```
[MatchMatch — massive headline, centered]
[subheadline — optional one-liner]

[创建房间]  ← lime-green pill
[输入房间码] ← outlined or secondary pill
```

### Room Page (`/room/[roomId]`)

Full-screen question card dominates. Opponent sync indicator subtle at top. Progress bar (question 3/5). Question text large and centered. Two A/B option pills below.

```
[●●○ opponent indicator]          [progress: 3/5]
[room code — small, top]

[ Question text — large, centered ]
[ max 3 lines, breaks gracefully ]

[  A  ]   [  B  ]   ← stacked on mobile, side-by-side on wider screens
```

### Result Page (`/result/[resultId]`)

Score as the hero — massive number (96% style) with Chinese label below. Per-question comparison list. Share CTA prominent.

```
[96%]          ← massive fluid display
[离谱级默契]    ← label below

[per-question breakdown — A vs B matches]

[分享结果]  [再来一局]
```

### Social Share Card (OG Image)

- Server-rendered or canvas-generated image
- Score + label as preview text
- Brand colors (lime-green + white)
- Works for WeChat, SMS, WhatsApp rich previews

---

## 5. Key States

| State | User sees |
|-------|-----------|
| **Landing** | Clean white, two lime-green pill buttons |
| **Waiting room** | Room code large + centered, "等待中..." pulse animation, 3-min countdown |
| **Question** | Full-screen question card, A/B pills, progress bar, subtle opponent dot |
| **Answered, waiting** | Selected pill locked, "对方答题中..." indicator |
| **Match revealed** | Brief match/mismatch highlight (300ms ease-in), 1.5s hold, auto-advance |
| **All done → result** | Score reveal with confetti if ≥61%, Chinese label, per-question breakdown |
| **Rematch panel** | Inline (not modal): "再来一次" / "算了", 3-min countdown |
| **Rematch both yes** | Smooth reset to question 1 |
| **Room expired** | "房间已过期" message, auto-redirect to `/` |
| **Error / disconnect** | Toast: "网络开小差了，稍等一下", auto-reconnect |

---

## 6. Interaction Model

### Core Loop
1. User lands on `/` → creates or joins room
2. Both players connected → Supabase trigger auto-starts game
3. Question appears → user taps A or B
4. On tap: button scales `0.95` (active), answer locks, DB write in background
5. When both answer → 300ms pause → match indicator reveals → 1.5s → next question
6. After last question → room status `finished` → results computed → `/result/[resultId]`

### Optimistic UI
Answer submission updates local state immediately (button locked). If DB write fails, show toast + retry. This makes the interaction feel instant (<80ms perceived).

### Button Micro-interactions
- Hover: `scale(1.05)`, `ease-out-quart`, 150ms
- Active: `scale(0.95)`, `ease-in`, 100ms
- Disabled/locked: no scale, muted color

### Share Interaction
- Mobile: Web Share API (`navigator.share()`)
- Desktop: Copy-to-clipboard with toast confirmation ("已复制到剪贴板")

### Sound Effects (optional)
- Answer select: soft "pop" (30-50ms)
- High match reveal (≥61%): triumphant 200ms jingle
- Default: muted. Toggle in corner (speaker icon). User must opt into sound.

---

## 7. Content Requirements

### Labels (Chinese-first, bilingual-ready)

| Key | Value |
|-----|-------|
| Landing headline | MatchMatch |
| CTA create | 创建房间 |
| CTA join | 输入房间码 |
| Room code label | 房间码 |
| Waiting | 等待中... |
| Opponent answering | 对方答题中... |
| Match score labels | 完全不在一个频道 / 有点熟但不多 / 普通朋友水平 / 有点东西的默契 / 默契达人 / 离谱级默契 |
| Rematch yes | 再来一次 |
| Rematch no | 算了 |
| Restart | 重新开局 |
| Share | 分享结果 |
| Room expired | 房间已过期 |
| Error reconnect | 网络开小差了，稍等一下 |
| Retry | 正在重试... |

### Dynamic Content
- **Room code**: 6-char alphanumeric, letter-spaced, large (min 32px), e.g., `A B C 1 2 3`
- **Question text**: Variable 1-3 lines at display size without layout break
- **Score**: 0–100%, no decimal, displayed as `96%`
- **Progress**: `3/5` format

---

## 8. Open Questions

1. **Sound default**: Muted by default (opt-in) or on by default (opt-out)? Party/social context favors opt-out, but may startle in quiet environments.
2. **Share image generation**: Cloudflare Workers + `html2canvas` vs canvas edge function vs pre-rendered static images per score range?
3. **Waiting room timeout**: Auto-redirect on expiry with no prompt, or show "房间已过期" modal first?
4. **Question seed data**: Should a SQL migration include sample questions, or is DB pre-seeded?
5. **Rematch result identity**: Does `/result/[resultId]` show latest result only, or history? (Same URL overwrites vs new resultId per rematch)

---

## 9. Reference Sources

- Design spec: `docs/superpowers/specs/2026-04-20-matchmatch-design.md`
- Impeccable references:
  - `.agents/skills/impeccable/reference/motion-design.md`
  - `.agents/skills/impeccable/reference/color-and-contrast.md`
  - `.agents/skills/impeccable/reference/typography.md`
  - `.agents/skills/impeccable/reference/spatial-design.md`
  - `.agents/skills/impeccable/reference/interaction-design.md`
