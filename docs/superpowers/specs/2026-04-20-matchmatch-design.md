# MatchMatch - Product Specification

## 1. Concept & Vision

MatchMatch is a lightweight real-time双人互动测试小游戏. Two players answer the same set of A/B questions simultaneously, and the system calculates their "Match Score" based on answer agreement. The product is built for casual, shareable fun — no account needed, one-minute sessions, and results designed for social传播.

The experience should feel **instant, playful, and slightly addictive** — like a conversation starter at a party. The visual personality draws from the Wise design system: bold lime-green accents, massive display typography, and a confident, friendly tone.

## 2. Design Language

### Color Palette (from DESIGN.md)
- **Primary CTA**: Lime Green `#9fe870` with dark green text `#163300`
- **Background**: White / off-white `#ffffff`
- **Primary Text**: Near Black `#0e0f0c`
- **Secondary Text**: Gray `#868685`
- **Light Surface**: `#e8ebe6`

### Typography
- **Display / Headlines**: Inter, weight 900, line-height 0.85, `"calt"` on
- **Body / UI**: Inter, weight 600 default, `"calt"` on
- **Button**: Inter weight 600

### Component Behavior
- **Buttons**: scale(1.05) on hover, scale(0.95) on active, pill shape (9999px radius)
- **Cards**: 16px–30px radius, ring shadow only

### Match Score Labels
| Range | Label |
|-------|-------|
| 0%–20% | 完全不在一个频道 |
| 21%–40% | 有点熟，但不多 |
| 41%–60% | 普通朋友水平 |
| 61%–80% | 有点东西的默契 |
| 81%–95% | 默契达人 |
| 96%–100% | 离谱级默契 |

## 3. Architecture

### Tech Stack
- **Frontend**: vinext + Vite, React 19, Tailwind CSS, Zustand
- **Backend/Deploy**: Cloudflare Workers
- **Real-time & Database**: Supabase (PostgreSQL + Realtime)

### Supabase Schema

```sql
-- Question bank
CREATE TABLE question_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_set_id UUID REFERENCES question_sets(id),
  text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  display_order INT DEFAULT 0
);

-- Game rooms
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,  -- 6-char alphanumeric
  status TEXT DEFAULT 'waiting',  -- waiting | playing | finished
  question_set_id UUID REFERENCES question_sets(id),
  current_question INT DEFAULT 0,
  total_questions INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,  -- for 3-min timeout on waiting
  finished_at TIMESTAMPTZ
);

-- Players
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,  -- browser fingerprint UUID
  joined_at TIMESTAMPTZ DEFAULT now()
);

-- Answers
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  question_index INT NOT NULL,
  choice TEXT NOT NULL,  -- 'a' or 'b'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, player_id, question_index)
);

-- Rematch tracking
CREATE TABLE rematch_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  vote BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, player_id)
);
```

### Real-time Strategy
- Supabase Realtime channels per room (`room:{roomId}`)
- Game state changes broadcast via Realtime broadcast
- All players subscribe to their room's channel
- DB writes happen on state transitions; Realtime broadcasts events

### Database Triggers
```sql
-- When 2nd player joins, auto-start the game
CREATE OR REPLACE FUNCTION start_game_on_second_player()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM players WHERE room_id = NEW.room_id) = 2 THEN
    UPDATE rooms SET status = 'playing' WHERE id = NEW.room_id;
    -- Broadcast via Realtime channel (handled by Supabase)
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_player_joined
  AFTER INSERT ON players
  FOR EACH ROW EXECUTE FUNCTION start_game_on_second_player();
```

## 4. User Flows

### 4.1 Create Room
1. User lands on `/`
2. Clicks "创建房间"
3. Browser generates/retrieves `userId` from localStorage (UUID)
4. Frontend calls Supabase: insert room + insert self as player
5. Redirect to `/room/[roomId]` with room code shown
6. Supabase Realtime subscription starts

### 4.2 Join Room
1. User B opens shared link `/room/[roomId]`
2. Browser generates/retrieves `userId` from localStorage
3. Frontend calls Supabase: insert player
4. If room status was `waiting`, Supabase trigger updates status to `playing`
5. Both players receive Realtime event → game starts

### 4.3 Waiting Room (3-min timeout)
- Room created with `expires_at = now() + 3 minutes`
- A Supabase cron/job or Cloudflare Worker checks for expired waiting rooms
- If timeout: room status → `expired`, players redirected

### 4.4 Synchronous Answering
1. Both players see same question (question_index = 0)
2. Each player selects A or B → local state locked, answer written to DB
3. Frontend subscribes to Realtime `answer_submitted` event
4. When both answers in DB for current question:
   - Supabase edge function or Worker broadcasts `question_result`
   - Both clients show match/mismatch for that question
   - After 1.5s delay, advance to next question
5. After last question: room status → `finished`, results computed

### 4.5 Result Page
1. Match score = (same answers / total questions) × 100%
2. Results stored in DB with room_id
3. Shareable URL: `/result/[resultId]` (resultId = roomId)
4. Page shows: score, label, per-question comparison, CTA buttons

### 4.6 Rematch Flow (3-min window)
1. After result shown, both players see rematch panel (inline, not modal)
2. Each can click "再来一次" (yes) or leave (no)
3. Vote written to `rematch_votes` table
4. If both vote yes within 3 minutes: room resets, new game starts (same question set)
5. If 3 minutes pass or one declines: room closed, show "重新开局" button → redirect to `/`

## 5. Pages & Routes

```
app/
  page.tsx                              # Landing: create / join
  room/[roomId]/
    page.tsx                            # Shell — subscribes to Realtime
    components/
      WaitingRoom.tsx
      QuestionCard.tsx
      OptionButton.tsx
      SyncIndicator.tsx
      ProgressBar.tsx
      ResultPanel.tsx
      RematchDialog.tsx
  result/[resultId]/
    page.tsx                            # Shareable result page
    components/
      ScoreDisplay.tsx
      ComparisonList.tsx
      ShareButtons.tsx
```

## 6. Key Implementation Details

### Browser Fingerprint → userId
- On first visit, generate a UUID and store in `localStorage`
- Use as anonymous user identity
- Future: link to real account if login added

### Room Code Generation
- 6-character alphanumeric (e.g., `ABC123`)
- Generated client-side or server-side
- Unique constraint in DB

### Supabase Realtime Channels
```
Channel: room:{roomId}
Events:
  - player:joined      # Player B joined
  - game:start         # Both players ready
  - answer:submitted   # Player answered (broadcast to opponent)
  - question:result    # Both answered, show result
  - game:finished     # All questions done
  - rematch:vote       # Player voted on rematch
  - rematch:start      # Both voted yes, new round
  - room:expired       # 3-min timeout fired
```

### Match Score Calculation (Edge Function)
```
score = sum(myAnswers[i] == opponentAnswers[i] for i in range(total)) / total * 100
```

### Cloudflare Worker Responsibilities
- Room expiration check (cron: every minute)
- Result calculation trigger
- Room cleanup for expired/finished rooms after 3-min window

## 7. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Room response time | < 300ms |
| Sync latency | < 1s |
| Room expiration check | Every 60s |
| Rematch window | 3 minutes |
| Max players per room | 2 |
| Default questions per game | 5 |

## 8. Out of Scope (Future)

- User accounts / login
- Custom question sets (admin UI)
- AI-generated commentary
- Social login
- Leaderboards
- Room history
