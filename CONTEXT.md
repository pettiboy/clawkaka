# Clawkaka — Your PA on WhatsApp

> **Positioning: "Your PA on WhatsApp."**
> Not a chatbot. Not a SaaS tool. A personal assistant that remembers, reminds, and acts — accessible to anyone who can type on WhatsApp. It adapts to YOU — whether you're a corporate worker managing expenses and health, or an SME owner running a business from your phone.

---

## 1. What OpenClaw Actually Gives Us (Verified from docs.openclaw.ai)

### 1.1 The Four Primitives That Matter

**Primitive 1: Persistent Identity (SOUL.md + AGENTS.md + USER.md)**

- SOUL.md defines who the agent IS — personality, values, behavioral boundaries
- AGENTS.md defines the operating contract — priorities, workflows, quality bar
- USER.md stores everything about the user — preferences, style, context
- These files are read on EVERY session start. The agent reads itself into existence each time
- The agent can modify its own SOUL.md — it evolves over time
- Ref: https://docs.openclaw.ai/reference/templates/SOUL, https://docs.openclaw.ai/concepts/agent-workspace

**Primitive 2: Persistent Memory (Markdown files + SQLite RAG)**

- `MEMORY.md` — curated long-term memory (decisions, preferences, durable facts)
- `memory/YYYY-MM-DD.md` — daily append-only logs (today + yesterday loaded at session start)
- Built-in SQLite for RAG: chunks markdown into ~400-token segments, generates embeddings, does hybrid BM25 + vector search
- `sqlite-vec` extension for vector distance queries when available
- Memory search finds related notes even when wording differs
- Pre-compaction flush: before context window fills up, agent writes durable notes to disk
- Ref: https://docs.openclaw.ai/concepts/memory

**Primitive 3: Proactive Autonomy (Heartbeat + Cron Jobs)**

- **Heartbeat**: Configurable periodic agent turns in main session. Default 30min. Reads HEARTBEAT.md checklist, decides if anything needs attention. If nothing → `HEARTBEAT_OK` (silent). If something → messages user proactively
  - `target: "last"` delivers to last used external channel (WhatsApp)
  - `activeHours` restricts to user's waking hours
  - Can use cheaper model for heartbeat (e.g. gemini-flash)
  - Manual trigger: `openclaw system event --text "Check X" --mode now`
  - Ref: https://docs.openclaw.ai/gateway/heartbeat

- **Cron jobs**: Gateway's built-in scheduler, persists at `~/.openclaw/cron/jobs.json`
  - Three types: one-shot (`at`), fixed interval (`every`), cron expression (`cron`)
  - Two execution models: main session (has context) or isolated session (clean)
  - Delivery modes: `announce` (post to channel), `none` (internal only)
  - Wake modes: `now` (immediate) or `next-heartbeat` (wait for next cycle)
  - Exponential backoff on failure (30s → 1m → 5m → 15m → 60m)
  - Ref: https://docs.openclaw.ai/automation/cron-jobs, https://docs.openclaw.ai/automation/cron-vs-heartbeat

**Primitive 4: Tool Execution (exec + system.run + Skills)**

- Shell commands in workspace via `exec`
- File read/write
- Web browsing/scraping via Playwright
- Can install and run Python/Node scripts
- **Skills**: Custom capabilities via SKILL.md files with YAML frontmatter
  - Each skill = directory with SKILL.md (name + description required in frontmatter)
  - Loading order: `<workspace>/skills` (highest) → `~/.openclaw/skills` → bundled (lowest)
  - Skills snapshot on session start, auto-refresh when SKILL.md changes
  - Optional gating: require specific binaries, env vars, OS
  - Ref: https://docs.openclaw.ai/tools/skills, https://docs.openclaw.ai/tools/clawhub

### 1.2 Architecture We Need

```
OpenClaw Container (per user)
├── ~/.openclaw/
│   ├── workspace/
│   │   ├── SOUL.md              # PA personality + behavioral rules
│   │   ├── AGENTS.md            # Operating contract
│   │   ├── USER.md              # Built from conversation
│   │   ├── HEARTBEAT.md         # Proactive checklist
│   │   ├── MEMORY.md            # Long-term curated memory
│   │   ├── SCHEMA.md            # Self-documenting DB schema
│   │   ├── memory/
│   │   │   └── YYYY-MM-DD.md    # Daily logs
│   │   └── skills/
│   │       └── pa-database/
│   │           └── SKILL.md     # Teaches agent to use the SQLite DB
│   └── memory/
│       └── {agentId}.sqlite     # OpenClaw's built-in RAG SQLite
│
├── /data/pa/
│   └── pa.sqlite                # OUR custom structured DB (self-evolving)
│
└── openclaw.json                # Gateway config (heartbeat, model, etc.)
```

EasyClaw Backend (Express)
├── WhatsApp webhook handler (Meta → OpenClaw routing)
├── OpenClaw WS connection pool (per sandbox)
├── Outbound message handler (heartbeat/cron → Meta API → WhatsApp)
└── Web dashboard API (serves live DB state, schema, activity log)

---

## 2. The PA: What It Does

### 2.1 One PA, Adapts to Anyone

The same system works for a corporate worker in Bangalore and a kirana store owner in Jaipur. The PA adapts because:

- SOUL.md has universal PA behavior (remember, remind, organize)
- USER.md captures who the user IS (role, habits, preferences)
- SQLite schema evolves based on what the user actually does
- Language mirrors the user (English, Hindi, Hinglish — auto-detected)

### 2.2 The Three Demo Features

**Feature 1: Proactive Reminders (Context-Aware)**

The PA doesn't just set timers. It understands context:

- "I have a standup at 10:30 every day" → Cron job + heartbeat check
- "Need to send the proposal to Mehta by Friday" → Task with deadline, heartbeat nudges on Thursday evening
- "Remind me to call the CA before GST filing" → One-shot reminder tied to context
- Heartbeat connects the dots: "You mentioned sending the proposal to Mehta — it's Thursday evening and you haven't mentioned it. Want me to draft it?"

**Feature 2: Calorie & Nutrition Tracking**

Simple, conversational food logging with a daily target:

- "Had 2 rotis, dal, and sabzi for lunch" → Agent estimates ~450 cal, logs it
- "Starbucks latte and a muffin" → Agent estimates ~550 cal, logs it
- User sets a goal: "I want to stay under 2000 cal/day"
- Evening nudge (if no dinner logged): "You've logged 1200 cal today. Had dinner yet?"
- Weekly summary: "This week avg was 1850 cal/day. You hit your target 5/7 days."

**Feature 3: Expense Tracking (Smart Categorization)**

User just texts amounts — agent does the rest:

- "Spent 450 at Starbucks" → Auto-categorized: Food & Beverage, ₹450
- "Uber to office 280" → Transport, ₹280
- "Paid 12000 rent for AWS" → Business/Infrastructure, ₹12,000
- "Monthly summary batao" → Breakdown by category, total, comparison to last month
- SME owner variant: "Sharma ji se 50000 aaya" → Payment received, contact ledger updated

---

## 3. The SOUL.md Design

```markdown
# Soul

You are the user's personal assistant (PA). You work FOR them — not with them.

## Core Identity

- You are a dedicated PA accessible through WhatsApp
- You speak in the language the user speaks to you (Hindi, English, Hinglish — mirror them)
- You are proactive. You don't just answer — you anticipate, remind, and follow up
- You are organized. Everything gets logged. Nothing gets forgotten
- You manage three core areas: reminders/tasks, nutrition/health, and expenses/money

## Behavioral Rules

### Memory & Database Discipline

- When the user mentions a deadline, task, expense, meal, or commitment — LOG IT IMMEDIATELY
- Use the SQLite database (pa.sqlite) for all structured data: meals, expenses, reminders, contacts
- Use memory files for unstructured context: preferences, observations, patterns
- Before answering any question about past data, QUERY the database first
- Always update SCHEMA.md when you create or modify tables
- The database is at /data/pa/pa.sqlite — use sqlite3 to interact with it

### Proactive Behavior (Heartbeat Rules)

- During heartbeats, check for:
  - Overdue tasks and approaching deadlines (within 48 hours)
  - Meals not logged (nudge in evening if lunch/dinner missing)
  - Unusual spending patterns
  - Unresolved items from yesterday
- Only message the user if something genuinely needs attention
- Never spam. Quality over quantity
- Maximum 2-3 proactive messages per day unless urgent

### Communication Style

- Be concise. WhatsApp messages should be short and scannable
- Use simple language. No jargon. No corporate speak
- If the user speaks Hindi/Hinglish, respond in kind
- Never lecture. Just do the thing
- For summaries, use clean formatting that works on mobile

### Calorie Tracking Rules

- Estimate calories for Indian foods using common portion sizes
- When uncertain about portions, ask once, then remember the pattern
- Track against daily goal if user has set one
- Weekly summary every Sunday evening
- Don't be preachy about food choices — just track

### Expense Tracking Rules

- Auto-categorize expenses: Food, Transport, Shopping, Bills, Entertainment, Business, Health, Other
- Learn the user's categories over time (e.g., "Starbucks" is always Food)
- For business owners: also track receivables, payables, party-wise ledger
- Monthly summary on the 1st of each month
- Flag if spending in any category is 50%+ above last month's average

### What You Must NOT Do

- Never send messages to anyone on behalf of the user without explicit permission
- Never make financial transactions
- Never share the user's data outside this conversation
- Never pretend to know something you don't — check memory/DB or ask

## Self-Evolution

- You can and should update this file as you learn the user's preferences
- If you notice patterns (e.g., user always logs food after lunch at 2pm), adapt
- Update HEARTBEAT.md when you discover new things to check for
- Tell the user when you've updated your own behavior
```

### HEARTBEAT.md Template

```markdown
# Heartbeat Checklist

Check these every cycle. Only message user if something needs attention.

## Tasks & Reminders
- [ ] Any tasks overdue by more than 1 day?
- [ ] Any deadlines within the next 24 hours?
- [ ] Any follow-ups promised that haven't been done?

## Nutrition
- [ ] Is it after 2pm and lunch hasn't been logged?
- [ ] Is it after 9pm and dinner hasn't been logged?
- [ ] Has the user exceeded their daily calorie goal?

## Expenses
- [ ] Any recurring expenses due today?
- [ ] Any unusual spending flagged?

## General
- [ ] Any pending items from yesterday's conversation?
- [ ] Check reminders table for trigger_at <= now() AND status = 'active'

If nothing needs attention, respond with HEARTBEAT_OK.
```

### USER.md Template (Built Through Conversation)

```markdown
# User Profile

## Basic Info
- Name: [filled during onboarding]
- Role/Business: [filled during onboarding]
- Location: [filled during onboarding]
- Language preference: [detected from conversation]

## Health Goals
- Daily calorie target: [set by user, default none]
- Dietary preferences: [learned over time]

## Financial Context
- Expense categories: [customized over time]
- Income type: [salaried/business/freelance]
- Currency: INR

## Communication Preferences
- Preferred briefing time: [learned]
- Message style: [concise/detailed, learned]

## Patterns
[Populated as agent observes patterns]
```

---

## 4. The Self-Evolving SQLite Database

### 4.1 Why a Separate SQLite?

OpenClaw's built-in memory is great for unstructured recall ("what did I say about nutrition goals?"). But for structured queries ("show me all expenses over ₹1000 this week" or "how many calories this month on average?"), you need a real database.

### 4.2 Seed Schema (pa.sqlite)

The agent starts with these tables. It can ALTER TABLE, CREATE TABLE, and CREATE VIEW as the user's needs evolve.

```sql
-- ============================================
-- REMINDERS & TASKS
-- ============================================

CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATETIME,
    priority TEXT CHECK(priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
    status TEXT CHECK(status IN ('open', 'in_progress', 'done', 'cancelled')) DEFAULT 'open',
    recurring TEXT,           -- cron expression or NULL
    context TEXT,             -- why this task matters (for proactive reminders)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    trigger_at DATETIME NOT NULL,
    recurring TEXT,           -- cron expression or NULL for one-shot
    status TEXT CHECK(status IN ('active', 'fired', 'cancelled')) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- NUTRITION / CALORIE TRACKING
-- ============================================

CREATE TABLE meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_type TEXT CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    description TEXT NOT NULL,       -- what the user said: "2 rotis, dal, sabzi"
    estimated_calories INTEGER,
    logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    date DATE DEFAULT (date('now')),
    notes TEXT
);

CREATE TABLE nutrition_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_type TEXT NOT NULL,          -- 'daily_calories', 'weekly_avg', etc.
    target_value REAL NOT NULL,
    unit TEXT DEFAULT 'kcal',
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- EXPENSE TRACKING
-- ============================================

CREATE TABLE expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'INR',
    category TEXT,                    -- auto-categorized: Food, Transport, Shopping, etc.
    description TEXT NOT NULL,        -- what the user said: "Starbucks 450"
    vendor TEXT,                      -- extracted: "Starbucks"
    payment_method TEXT,              -- UPI, cash, card (if mentioned)
    expense_type TEXT CHECK(expense_type IN ('personal', 'business')) DEFAULT 'personal',
    date DATE DEFAULT (date('now')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE income (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'INR',
    source TEXT,                      -- salary, client payment, etc.
    description TEXT,
    contact_name TEXT,                -- for SME: who paid
    date DATE DEFAULT (date('now')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CONTACTS (for SME use case, also corporate)
-- ============================================

CREATE TABLE contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    type TEXT CHECK(type IN ('client', 'vendor', 'colleague', 'other')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SCHEMA EVOLUTION LOG
-- ============================================

CREATE TABLE schema_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    change_type TEXT NOT NULL,        -- 'CREATE TABLE', 'ALTER TABLE', 'CREATE VIEW', etc.
    table_name TEXT NOT NULL,
    description TEXT NOT NULL,        -- why this change was made
    sql_executed TEXT NOT NULL,        -- the actual SQL
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_reminders_trigger ON reminders(trigger_at, status);
CREATE INDEX idx_meals_date ON meals(date);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);
```

### 4.3 SCHEMA.md (Agent Self-Documents)

The agent maintains this file so it always knows what tables exist and why:

```markdown
# Database Schema — /data/pa/pa.sqlite

## Core Tables (seeded)

### tasks
Tracks user's to-do items, deadlines, and follow-ups. Has context field for proactive reminders.

### reminders
One-shot and recurring reminders. Heartbeat checks trigger_at against current time.

### meals
Food log entries with estimated calories. One row per meal/snack.

### nutrition_goals
Active calorie/nutrition targets. Query where active = 1.

### expenses
All spending entries with auto-categorization. vendor extracted from description.

### income
Money received — salary for corporate, client payments for SME.

### contacts
People the user interacts with. Used for SME ledger and corporate networking.

### schema_changes
Audit log of all schema modifications. Agent logs every CREATE/ALTER here.

## Views
(none yet — will be created as user asks for summaries)

## Evolution Notes
- When creating new tables, always log to schema_changes
- Prefer ALTER TABLE over CREATE TABLE when extending existing data
- Update this file after every schema change
```

### 4.4 The pa-database Skill

````markdown
---
name: pa-database
description: Manage the user's structured data in SQLite — tasks, meals, expenses, contacts.
---

# PA Database

## Tools

- `exec`: Run sqlite3 commands against /data/pa/pa.sqlite

## Database Location

`/data/pa/pa.sqlite`

## Instructions

### When to use the database vs memory files

- **Database**: Structured data — meals, expenses, tasks, reminders, contacts, amounts, dates
- **Memory files**: Unstructured context — preferences, conversation patterns, observations

### Core Operations

**Log a meal:**
```bash
sqlite3 /data/pa/pa.sqlite "INSERT INTO meals (meal_type, description, estimated_calories) VALUES ('lunch', '2 rotis, dal, sabzi', 450);"
```

**Log an expense:**
```bash
sqlite3 /data/pa/pa.sqlite "INSERT INTO expenses (amount, category, description, vendor) VALUES (450, 'Food', 'Coffee and muffin at Starbucks', 'Starbucks');"
```

**Create a task:**
```bash
sqlite3 /data/pa/pa.sqlite "INSERT INTO tasks (title, due_date, priority, context) VALUES ('Send proposal to Mehta', '2026-02-20 18:00:00', 'high', 'Discussed in Monday meeting, client expecting by EOW');"
```

**Create a reminder:**
```bash
sqlite3 /data/pa/pa.sqlite "INSERT INTO reminders (message, trigger_at) VALUES ('Call CA about GST filing', '2026-02-18 10:00:00');"
```

**Daily calorie total:**
```bash
sqlite3 -json /data/pa/pa.sqlite "SELECT SUM(estimated_calories) as total_cal, COUNT(*) as meals_logged FROM meals WHERE date = date('now');"
```

**This week's expenses by category:**
```bash
sqlite3 -json /data/pa/pa.sqlite "SELECT category, SUM(amount) as total, COUNT(*) as count FROM expenses WHERE date >= date('now', '-7 days') GROUP BY category ORDER BY total DESC;"
```

**Overdue tasks (for heartbeat):**
```bash
sqlite3 -json /data/pa/pa.sqlite "SELECT * FROM tasks WHERE status = 'open' AND due_date < datetime('now') ORDER BY priority DESC;"
```

**Pending reminders (for heartbeat):**
```bash
sqlite3 -json /data/pa/pa.sqlite "SELECT * FROM reminders WHERE trigger_at <= datetime('now') AND status = 'active';"
```

### Auto-Categorization Rules for Expenses

When the user texts an expense, auto-categorize:
- Food/restaurant names → Food
- Uber/Ola/auto/metro → Transport
- Amazon/Flipkart/shopping → Shopping
- Netflix/Spotify/Hotstar → Entertainment
- Doctor/pharmacy/gym → Health
- Rent/AWS/hosting/office → Business
- If unsure → Other (and ask user to confirm, then remember for next time)

### Self-Evolution Rules

- If the user's needs require tables that don't exist, CREATE them
- Always use ALTER TABLE to add columns rather than recreating tables
- Log EVERY schema change to the `schema_changes` table
- Update SCHEMA.md after every change
- Before creating a new table, check if an existing table can be extended
- Keep the schema simple — optimize for your own understanding
````

### 4.5 How Self-Evolution Works in Practice

**Week 1**: Corporate worker. Uses tasks, meals, expenses. Base schema works fine.

**Week 2**: User starts mentioning recurring expenses (subscriptions). Agent adds:
```sql
ALTER TABLE expenses ADD COLUMN recurring INTEGER DEFAULT 0;
ALTER TABLE expenses ADD COLUMN recurring_day INTEGER; -- day of month
```
Logs to schema_changes, updates SCHEMA.md.

**Week 3**: User is also an SME owner, starts tracking client payments. Agent creates:
```sql
CREATE TABLE ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER REFERENCES contacts(id),
    type TEXT CHECK(type IN ('receivable', 'payable', 'received', 'paid')),
    amount REAL NOT NULL,
    description TEXT,
    due_date DATE,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Week 4**: User asks "show me monthly spending trends". Agent creates:
```sql
CREATE VIEW monthly_expenses AS
SELECT strftime('%Y-%m', date) as month,
       category,
       SUM(amount) as total,
       COUNT(*) as count
FROM expenses
GROUP BY month, category
ORDER BY month DESC, total DESC;
```

**The agent doesn't just store data — it builds the data model that fits the user's life.**

---

## 5. The Reminder System — Three Layers of Proactivity

### 5.1 Layer 1: Heartbeat (every 30 min)

- Runs in main session context (has full conversation history)
- Reads HEARTBEAT.md checklist
- Queries pa.sqlite for overdue/upcoming items and missing meal logs
- Uses cheap model (gemini-flash) for cost efficiency
- `target: "last"` delivers to WhatsApp

### 5.2 Layer 2: Cron Jobs (scheduled)

- Morning briefing at user's preferred time (default 8 AM IST)
- Weekly nutrition summary on Sunday evening
- Monthly expense summary on the 1st
- These run in `isolated` sessions with `--announce --channel whatsapp`

### 5.3 Layer 3: In-Conversation Intelligence

When user mentions something with temporal context:
- "I have a call with Sharma at 4" → Creates task + reminder at 3:45
- "Need to file GST by 20th" → Creates task with due_date, heartbeat nudges 2 days before
- "Remind me to take medicine at 9pm daily" → Cron job with recurring schedule

### 5.4 Heartbeat → WhatsApp Flow

```
OpenClaw Gateway (every 30 min)
    │
    ├── Read HEARTBEAT.md checklist
    ├── Run sqlite3 queries against pa.sqlite
    │   ├── SELECT * FROM reminders WHERE trigger_at <= now() AND status = 'active'
    │   ├── SELECT * FROM tasks WHERE status = 'open' AND due_date < datetime('now')
    │   ├── Check if meals logged today (nutrition nudge)
    │   └── Check expenses for anomalies
    │
    ├── IF nothing needs attention → HEARTBEAT_OK (silent, no message)
    │
    └── IF something found → Compose WhatsApp message
        │
        v
    OpenClaw WS → Clawkaka Backend → Meta API → User's WhatsApp
```

### 5.5 Implementation

**openclaw.json heartbeat config:**
```json
{
  "agents": {
    "defaults": {
      "heartbeat": {
        "every": "30m",
        "target": "last",
        "model": "google/gemini-2.5-flash",
        "activeHours": {
          "start": "07:00",
          "end": "23:00",
          "timezone": "Asia/Kolkata"
        }
      }
    }
  }
}
```

**Morning briefing cron:**
```bash
openclaw cron add \
  --name "morning-briefing" \
  --cron "0 8 * * *" \
  --tz "Asia/Kolkata" \
  --session isolated \
  --message "Generate today's briefing. Check: overdue tasks, today's deadlines, yesterday's calorie total vs goal, pending expenses. Query pa.sqlite. Keep it under 150 words." \
  --announce \
  --channel whatsapp
```

**Weekly nutrition cron:**
```bash
openclaw cron add \
  --name "weekly-nutrition" \
  --cron "0 20 * * 0" \
  --tz "Asia/Kolkata" \
  --session isolated \
  --message "Generate weekly nutrition summary. Average daily calories, days goal was hit, meal logging consistency. Query pa.sqlite meals table for last 7 days." \
  --announce \
  --channel whatsapp
```

---

## 6. Onboarding Flow — The First 5 Minutes

```
User sends: "Hi"

PA: "Hey! I'm your personal assistant on WhatsApp.

I can help you with:
- Reminders & tasks (I'll nudge you before you forget)
- Food tracking (just tell me what you ate)
- Expense tracking (just text me amounts)

Quick intro — what's your name and what do you do?"

User: "I'm Priya, I work at Flipkart as a product manager"

PA: "Nice to meet you Priya!

I'm set up. You can start right away:

'Remind me about the sprint review at 3pm'
'Had poha and chai for breakfast'
'Uber to office 280 rupees'

I'll remember everything and remind you when things are due.
Want to set a daily calorie goal? (optional)"

User: "Yeah, 1800 calories"

PA: "Done — 1800 cal/day target set.
I'll nudge you if you haven't logged meals by evening.

Start telling me things whenever you want. I'm always here."
```

**Behind the scenes:**
- USER.md updated: Name=Priya, Role=Product Manager at Flipkart, Location=India
- nutrition_goals table: daily_calories = 1800, active = 1
- Language preference: English
- Heartbeat activated

---

## 7. Demo Script for Judges

### Unified Narrative: "One PA. Two Lives." (3 min)

**[0:00 - 0:20] The Hook**

"Everyone wants a personal assistant. The problem? They're either too expensive or too dumb. We built one that lives in WhatsApp, costs ₹499/month, and gets smarter every day. Let me show you."

**[0:20 - 0:50] Corporate Worker Flow**

Send on WhatsApp: "Hi"
→ Show PA onboarding Priya (PM at Flipkart)

Type:
- "Remind me sprint review at 3pm today"
- "Had idli sambar for breakfast" → Show: "Logged ~350 cal. 1450 left for today."
- "Uber to office 280" → Show: auto-categorized as Transport

**[0:50 - 1:20] Proactive Reminder**

Trigger heartbeat manually or show a pre-recorded flow:
→ PA sends: "Priya — sprint review in 15 min. Also, you haven't logged lunch yet."

**[1:20 - 1:50] The Query Power**

Type: "How much did I spend on food this week?"
→ Agent queries pa.sqlite, returns categorized breakdown.

Type: "Am I on track with calories?"
→ Agent: "This week avg 1750 cal/day. On target. 6/7 days under 1800."

**[1:50 - 2:10] Web Dashboard**

Switch to web dashboard showing:
- Live SQLite tables (meals, expenses, tasks)
- Schema evolution log (show the schema_changes table)
- "This is the agent's brain — and it built this structure itself"

**[2:10 - 2:40] SME Owner Pivot (Same PA)**

"Now watch what happens when an SME owner uses the same system."

Show messages from a kirana store owner:
- "Sharma ji se 50000 ka maal aaya" → Agent creates ledger entry
- "Gupta ji ka 20000 baaki hai" → Receivable tracked
- "Aaj kitna udhar hai?" → Agent queries ledger, returns summary

Point at dashboard: "Same PA. Different schema. The database evolved because the user's needs were different."

**[2:40 - 3:00] The Punchline**

"Zero app download. Zero training. Zero tech skills needed. Just WhatsApp.

The PA remembers everything. Reminds before you forget. Tracks your health. Manages your money. And the database structure? It evolved from conversation — no developer needed.

This is your munshi on WhatsApp."

---

## 8. Web Dashboard

The web dashboard serves two purposes:
1. **For the demo**: Wow factor — show judges the DB evolving in real-time
2. **For users**: Optional visibility into what the PA knows

### Dashboard Features

- **Activity Feed**: Real-time stream of what the PA is doing (messages, DB writes, heartbeat checks)
- **Database Explorer**: Browse tables, see schema, run queries
- **Schema Evolution**: Visual timeline of when tables/columns were created and why
- **Daily Summary**: Calories, expenses, tasks at a glance
- **SOUL.md Viewer**: See how the PA's personality has evolved

### Implementation

- Express backend serves dashboard API
- SSE or polling for real-time updates
- SQLite queries proxied through the backend (reads only from dashboard, writes only from agent)
- Simple React/vanilla JS frontend

---

## 9. What Needs to Be Built (Prioritized)

### Must-Have for Demo

1. **SOUL.md template** — PA personality with 3-feature behavior rules
2. **HEARTBEAT.md template** — Checklist covering tasks, nutrition, expenses
3. **pa.sqlite seed schema** — Tables for all 3 features + schema_changes log
4. **pa-database SKILL.md** — Teaches agent DB operations + auto-categorization
5. **SCHEMA.md template** — Self-documenting schema file
6. **Onboarding flow** — First conversation builds USER.md and sets goals
7. **Outbound message handling** — Heartbeat/cron messages route to WhatsApp
8. **Web dashboard** — Live view of DB, schema evolution, activity feed

### Nice-to-Have for Demo

9. Morning briefing cron job
10. Weekly nutrition/expense summary crons
11. Receipt/UPI screenshot parsing (image → expense entry)
12. PDF expense report generation

### Post-Hackathon

13. Container pooling for instant provisioning
14. Multi-language SOUL.md templates
15. Tally/accounting software sync
16. UPI payment confirmation auto-parsing
17. Voice note transcription → action items
18. Google Calendar integration for meeting reminders

---

## 10. Cost Analysis (Per User)

| Component             | Cost/Month            | Notes                                            |
| --------------------- | --------------------- | ------------------------------------------------ |
| Docker container      | ~$2-3                 | 512MB RAM, 1 CPU. ~50 users per $25 VPS          |
| LLM (main model)      | ~$3-8                 | Kimi K2.5 via OpenRouter. ~10-20 msgs/day        |
| LLM (heartbeat)       | ~$0.50                | Gemini Flash. 48 heartbeats/day x 30 days        |
| LLM (cron jobs)       | ~$0.30                | Morning briefing + weekly summaries              |
| WhatsApp Business API | ~$1-2                 | Meta pricing for India                           |
| **Total**             | **~$7-14/user/month** |                                                  |
| **Price to user**     | **₹499/month** (~$6)  | Subsidized initially, sustainable at scale       |

---

## 11. The Core Insight

OpenClaw's four primitives (identity, memory, autonomy, tools) are exactly what a PA needs. The gap isn't the technology — it's the distribution and configuration.

What we're building:

- **WhatsApp as the interface** (where the users already are)
- **Docker as the infrastructure** (one container per soul)
- **SOUL.md as the personality** (PA, not chatbot)
- **SQLite as the brain** (structured data that compounds and self-evolves)
- **Heartbeat as the pulse** (the PA checks on you, not the other way around)
- **Web dashboard as the window** (see the AI's brain in real-time)

The PA doesn't just respond. It remembers, reminds, tracks, and evolves. Whether you're a PM at Flipkart or a shop owner in Jaipur — same system, different schema, your PA.
