# EasyClaw v2 — Revised Product Strategy

> **Positioning: "Your PA on WhatsApp."**
> Not a chatbot. Not a SaaS tool. A personal assistant that remembers, reminds, and acts — accessible to anyone who can type on WhatsApp.

---

## 1. What OpenClaw Actually Gives Us (Verified Capabilities)

After going through the docs, here's what's real and what matters for our use case:

### 1.1 The Four Primitives That Matter

OpenClaw gives us four primitives that, combined, create something genuinely new:

**Primitive 1: Persistent Identity (SOUL.md + AGENTS.md)**

- SOUL.md defines who the agent IS — personality, values, behavioral boundaries
- AGENTS.md defines the operating contract — priorities, workflows, quality bar
- USER.md stores everything about the user — preferences, style, context
- These files are read on EVERY session start. The agent literally reads itself into existence each time
- **Crucially: the agent can modify its own SOUL.md** — it can evolve

**Primitive 2: Persistent Memory (Markdown files + SQLite RAG)**

- `MEMORY.md` — curated long-term memory (decisions, preferences, durable facts)
- `memory/YYYY-MM-DD.md` — daily append-only logs (today + yesterday loaded at session start)
- OpenClaw already uses SQLite internally for its RAG system — chunks markdown, generates embeddings, does hybrid BM25 + vector search
- Memory search finds related notes even when wording differs
- Pre-compaction flush: before context window fills up, agent writes durable notes to disk. This prevents forgetting

**Primitive 3: Proactive Autonomy (Heartbeat + Cron Jobs)**

- **Heartbeat**: Agent wakes every 30min, reads HEARTBEAT.md checklist, decides if anything needs attention. If nothing → silent HEARTBEAT_OK. If something → messages user proactively
- **Cron jobs**: Scheduled tasks with full cron syntax. Can deliver to WhatsApp specifically with `--channel whatsapp --to "+91XXXXXXXXXX"`
- Cron can run in `isolated` sessions (don't pollute main conversation) or `main` session (have full context)
- Heartbeat runs in main session context — so it can reference past conversations when deciding what to flag

**Primitive 4: Tool Execution (exec + system.run)**

- Shell commands in workspace
- File read/write
- Web browsing/scraping via Playwright
- Can install and run Python/Node scripts
- All from within Docker container (your existing architecture already handles this)

### 1.2 What Your Architecture Already Solves

Looking at the EasyClaw architecture doc, you've already built the hard parts:

- ✅ Per-user Docker containers with OpenClaw pre-installed
- ✅ WhatsApp → OpenClaw message routing via Meta webhooks
- ✅ Persistent WS connection pool (openclawConnectionManager)
- ✅ Ed25519 device attestation
- ✅ Per-user message queue with concurrency control
- ✅ Auto-provisioning on first "Hi" message
- ✅ Database schema for users, sandboxes, messages

What's missing for the PA positioning:

- ❌ Custom SOUL.md per user (currently using defaults)
- ❌ HEARTBEAT.md configured for proactive behavior
- ❌ Cron jobs for scheduled reminders/briefings
- ❌ Custom skills for India-specific workflows
- ❌ SQLite DB for structured business data (beyond OpenClaw's built-in memory SQLite)
- ❌ Onboarding flow that builds USER.md from conversation

---

## 2. The PA Framing: What This Actually Means

### 2.1 Stop Thinking "AI Tool." Think "Munshi."

Every Indian business owner/corporate worker has had (or wanted) a PA/munshi — someone who:

- Remembers everything about your business/work
- Reminds you before you forget
- Handles the small stuff so you can focus
- Gets better at their job over time because they know YOU

EasyClaw is that munshi, living inside WhatsApp.

### 2.2 The Three Jobs of the PA

**Job 1: Remember** (Memory Layer)

- "Sharma ji only pays on the 15th"
- "My standup is at 10:30 AM"
- "The Gupta deal is ₹4.5L, pending since Feb 3"
- → All stored in MEMORY.md + daily logs + custom SQLite

**Job 2: Remind** (Heartbeat + Cron Layer)

- Morning briefing: "3 follow-ups due, 1 payment overdue, standup in 2 hours"
- Contextual nudges: "You said you'd send the proposal to Mehta by today. Done?"
- Deadline alerts: "GST filing deadline in 3 days"
- → Heartbeat checks every 30min, cron for scheduled deliveries

**Job 3: Do** (Tool Execution Layer)

- Generate invoices/quotations as PDFs
- Calculate GST, totals, margins
- Draft messages for customers/suppliers
- Look up information (commodity prices, government schemes)
- → exec tool + custom skills + web search

---

## 3. Giving OpenClaw a Soul — The SOUL.md Design

This is the most important configuration decision. The soul determines whether the PA feels like a generic chatbot or like someone who works for YOU.

### 3.1 Base SOUL.md Template (Injected at Container Creation)

```markdown
# Soul

You are the user's personal assistant (PA). You work for them. Not with them — FOR them.

## Core Identity

- You are a dedicated PA accessible through WhatsApp
- You speak in the language the user speaks to you (Hindi, English, Hinglish — mirror them)
- You are proactive. You don't just answer — you anticipate, remind, and follow up
- You are organized. Everything gets logged. Nothing gets forgotten

## Behavioral Rules

### Memory Discipline

- When the user mentions a person, a deadline, an amount, or a commitment — WRITE IT DOWN immediately to memory
- Maintain a running log of all business contacts with their traits, payment habits, and preferences
- Track every open item (pending payments, quotes sent, follow-ups due)
- Before answering any question about past events, SEARCH your memory first

### Proactive Behavior

- During heartbeats, check for:
  - Overdue follow-ups (items older than 3 days with no update)
  - Upcoming deadlines (within 48 hours)
  - Unresolved items from yesterday
- Only message the user if something genuinely needs attention
- Never spam. Quality over quantity

### Communication Style

- Be concise. WhatsApp messages should be short and scannable
- Use simple language. No jargon. No corporate speak
- If the user speaks Hindi/Hinglish, respond in kind
- Use ✅ ⚠️ 📋 sparingly for visual scanning on mobile
- Never lecture. Just do the thing

### What You Can Do

- Track orders, payments, and customer interactions
- Set reminders and follow-up alerts
- Generate invoices and quotations
- Calculate GST and financial summaries
- Draft WhatsApp messages for the user to forward
- Search the web for prices, schemes, or information
- Maintain a structured database of the user's business data

### What You Must NOT Do

- Never send messages to anyone on behalf of the user without explicit permission
- Never make financial transactions
- Never share the user's data outside this conversation
- Never pretend to know something you don't — check memory or ask

## Self-Evolution

- You can and should update this file as you learn the user's preferences
- If you notice patterns (e.g., user always asks for weekly summaries on Friday),
  adapt your behavior and update HEARTBEAT.md
- Tell the user when you've updated your own behavior
```

### 3.2 HEARTBEAT.md Template

```markdown
# Heartbeat Checklist

Check these every cycle. Only message user if something needs attention.

- [ ] Any items in the task list overdue by more than 2 days?
- [ ] Any follow-ups promised to contacts that haven't been done?
- [ ] Any payment reminders due today or tomorrow?
- [ ] Is there a morning briefing scheduled that hasn't been sent today?
- [ ] Check the custom database for any time-triggered items

If nothing needs attention, respond with HEARTBEAT_OK.
```

### 3.3 USER.md (Built Through Conversation)

This starts empty and gets populated during onboarding:

```markdown
# User Profile

## Basic Info

- Name: [filled during onboarding]
- Business/Role: [filled during onboarding]
- Location: [filled during onboarding]
- Language preference: [detected from conversation]

## Business Context

[Populated as user shares information]

## Communication Preferences

[Learned over time — e.g., "prefers short messages", "checks WhatsApp at 9 AM and 8 PM"]

## Key Contacts

[Accumulated from conversations]
```

---

## 4. The Self-Evolving SQLite Database

This is where EasyClaw goes beyond vanilla OpenClaw. OpenClaw already uses SQLite for memory RAG, but we add a SECOND SQLite database that the agent can query and mutate — a structured business database.

### 4.1 Why a Separate SQLite?

OpenClaw's built-in memory is great for unstructured recall ("what did I say about Sharma ji?"). But for structured queries ("show me all pending payments over ₹50K" or "who are my top 5 customers by revenue this quarter?"), you need a real database.

### 4.2 Architecture

```
OpenClaw Container
├── ~/.openclaw/                    # Standard OpenClaw
│   ├── workspace/
│   │   ├── SOUL.md
│   │   ├── AGENTS.md
│   │   ├── USER.md
│   │   ├── HEARTBEAT.md
│   │   ├── MEMORY.md
│   │   └── memory/
│   │       └── YYYY-MM-DD.md
│   └── memory/
│       └── {agentId}.sqlite        # OpenClaw's built-in RAG SQLite
│
├── /data/easyclaw/
│   ├── business.sqlite             # OUR custom structured DB
│   └── skills/
│       └── easyclaw-db/
│           └── SKILL.md            # Skill that teaches agent to use business.sqlite
```

### 4.3 business.sqlite Schema (Self-Evolving)

The agent starts with a base schema, but here's the key insight: **the agent can ALTER TABLE and CREATE TABLE on its own.** The skill teaches it to evolve the schema as the user's needs become clear.

**Base schema (seeded at container creation):**

```sql
-- Core tables the agent always has

CREATE TABLE contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    type TEXT CHECK(type IN ('customer', 'supplier', 'staff', 'other')),
    notes TEXT,
    payment_habit TEXT,  -- 'on-time', 'late', 'very-late'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER REFERENCES contacts(id),
    type TEXT CHECK(type IN ('receivable', 'payable', 'received', 'paid')),
    amount REAL NOT NULL,
    description TEXT,
    due_date DATE,
    status TEXT CHECK(status IN ('pending', 'partial', 'complete', 'overdue')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    related_contact_id INTEGER REFERENCES contacts(id),
    due_date DATETIME,
    priority TEXT CHECK(priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
    status TEXT CHECK(status IN ('open', 'in_progress', 'done', 'cancelled')) DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    trigger_at DATETIME NOT NULL,
    recurring TEXT,  -- cron expression or NULL for one-shot
    status TEXT CHECK(status IN ('active', 'fired', 'cancelled')) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE daily_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE UNIQUE NOT NULL,
    total_receivable REAL DEFAULT 0,
    total_payable REAL DEFAULT 0,
    total_received REAL DEFAULT 0,
    total_paid REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_due_date ON transactions(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_reminders_trigger ON reminders(trigger_at, status);
```

### 4.4 The easyclaw-db Skill

This is a custom OpenClaw skill that teaches the agent how to use the database:

````markdown
# EasyClaw Business Database

## Description

Manage the user's structured business data in SQLite. Use for contacts, transactions,
tasks, reminders, and financial tracking.

## Tools

- `exec`: Run sqlite3 commands against /data/easyclaw/business.sqlite

## Instructions

### When to use the database vs memory files

- **Database**: Structured data — contacts, transactions, amounts, dates, statuses
- **Memory files**: Unstructured context — preferences, conversation notes, observations

### Core operations

**Adding a contact:**

```bash
sqlite3 /data/easyclaw/business.sqlite "INSERT INTO contacts (name, phone, type, notes) VALUES ('Sharma Traders', '+919876543210', 'customer', 'Prefers blue fabric, pays on 15th');"
```
````

**Logging a transaction:**

```bash
sqlite3 /data/easyclaw/business.sqlite "INSERT INTO transactions (contact_id, type, amount, description, due_date, status) VALUES (1, 'receivable', 60000, '500m blue cotton @ 120/m', '2026-02-28', 'pending');"
```

**Creating a reminder:**

```bash
sqlite3 /data/easyclaw/business.sqlite "INSERT INTO reminders (message, trigger_at) VALUES ('Follow up with Sharma Traders on cotton order', '2026-02-18 10:00:00');"
```

**Querying overdue items (used in heartbeat):**

```bash
sqlite3 -json /data/easyclaw/business.sqlite "SELECT t.*, c.name as contact_name FROM transactions t JOIN contacts c ON t.contact_id = c.id WHERE t.status = 'pending' AND t.due_date < date('now');"
```

**Financial summary:**

```bash
sqlite3 -json /data/easyclaw/business.sqlite "SELECT type, SUM(amount) as total FROM transactions WHERE status IN ('pending', 'partial') GROUP BY type;"
```

### Self-evolution rules

- If the user's business needs tables that don't exist, CREATE them
- Always use ALTER TABLE to add columns rather than recreating tables
- Log every schema change to MEMORY.md so you remember what you built
- Before creating a new table, check if an existing table can be extended
- Keep the schema simple — the user doesn't see it, so optimize for YOUR understanding

### During heartbeat

- Check `reminders` table for any trigger_at <= now() AND status = 'active'
- Check `transactions` for overdue items
- Check `tasks` for items due within 48 hours
- Update `daily_summary` once per day

````

### 4.5 How Self-Evolution Works in Practice

**Week 1**: User is a textile trader. Base schema works fine — contacts, transactions, tasks.

**Week 3**: User starts mentioning inventory. Agent creates:
```sql
CREATE TABLE inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    quantity REAL,
    unit TEXT,
    last_price REAL,
    supplier_id INTEGER REFERENCES contacts(id),
    low_stock_threshold REAL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
````

Agent logs to MEMORY.md: "Created inventory table. User tracks cotton stock levels."

**Week 5**: User starts asking about profitability per customer. Agent creates:

```sql
CREATE VIEW customer_profitability AS
SELECT c.name,
       SUM(CASE WHEN t.type = 'received' THEN t.amount ELSE 0 END) as total_received,
       SUM(CASE WHEN t.type = 'paid' THEN t.amount ELSE 0 END) as total_paid,
       COUNT(*) as transaction_count
FROM contacts c
JOIN transactions t ON t.contact_id = c.id
GROUP BY c.id;
```

**The agent doesn't just store data — it builds the data model that fits the user's business.**

---

## 5. The Reminder System — How It Actually Works

### 5.1 Three Layers of Proactivity

**Layer 1: Heartbeat (every 30 min)**

- Runs in main session context (has full conversation history)
- Checks HEARTBEAT.md checklist
- Queries SQLite for overdue/upcoming items
- Light, cheap model (gemini-3-flash) to keep costs low
- WhatsApp delivery: `target: "last"` sends to WhatsApp since that's the only channel

**Layer 2: Cron Jobs (scheduled)**

- Morning briefing at user's preferred time
- Weekly financial summary on weekends
- GST/tax filing deadline reminders (fixed schedule)
- These run in `isolated` sessions with `--announce --channel whatsapp`

**Layer 3: In-Conversation Reminders**

- User says "remind me to call Gupta tomorrow at 3"
- Agent creates both:
  - A row in `reminders` table (for heartbeat to pick up)
  - A cron job: `openclaw cron add --name "Call Gupta" --at "2026-02-16T09:30:00Z" --channel whatsapp --message "⏰ Reminder: Call Gupta about the pending order"`

### 5.2 Implementation in Your Architecture

Your `entrypoint.sh` needs to be extended:

```bash
#!/bin/bash

# Existing: configure OpenClaw, set up auth, etc.
# ...

# NEW: Seed the SOUL, HEARTBEAT, and USER files
cp /templates/SOUL.md /home/openclaw/workspace/SOUL.md
cp /templates/HEARTBEAT.md /home/openclaw/workspace/HEARTBEAT.md
cp /templates/USER.md /home/openclaw/workspace/USER.md
cp /templates/AGENTS.md /home/openclaw/workspace/AGENTS.md

# NEW: Create and seed the business SQLite DB
mkdir -p /data/easyclaw
sqlite3 /data/easyclaw/business.sqlite < /templates/schema.sql

# NEW: Install the easyclaw-db skill
mkdir -p /home/openclaw/workspace/skills/easyclaw-db
cp /templates/skills/easyclaw-db/SKILL.md /home/openclaw/workspace/skills/easyclaw-db/SKILL.md

# NEW: Configure heartbeat for WhatsApp delivery
# Patch openclaw.json to enable heartbeat
cat <<EOF > /tmp/heartbeat-patch.json
{
  "agents": {
    "defaults": {
      "heartbeat": {
        "every": "30m",
        "target": "last",
        "model": "moonshotai/kimi-k2.5",
        "activeHours": {
          "start": "07:00",
          "end": "23:00"
        }
      }
    }
  }
}
EOF
# Merge into openclaw.json (you'll need a JSON merge utility or jq)

# NEW: Set up morning briefing cron
openclaw cron add \
  --name "morning-briefing" \
  --cron "0 8 * * *" \
  --tz "Asia/Kolkata" \
  --session isolated \
  --message "Generate today's briefing. Check: overdue tasks, pending payments, upcoming deadlines. Query the business database. Keep it under 200 words." \
  --announce \
  --channel whatsapp

# Start gateway (existing)
openclaw gateway start --foreground
```

### 5.3 The Heartbeat → WhatsApp Flow

```
OpenClaw Gateway (every 30 min)
    │
    ├── Read HEARTBEAT.md checklist
    ├── Run sqlite3 queries against business.sqlite
    │   ├── SELECT * FROM reminders WHERE trigger_at <= now() AND status = 'active'
    │   ├── SELECT * FROM transactions WHERE status = 'pending' AND due_date < date('now')
    │   └── SELECT * FROM tasks WHERE due_date < datetime('now', '+48 hours') AND status = 'open'
    │
    ├── IF nothing needs attention → HEARTBEAT_OK (silent, no message)
    │
    └── IF something found → Compose WhatsApp message
        │
        v
    OpenClaw WS → EasyClaw Backend (openclawConnectionManager) → Meta API → User's WhatsApp
```

**Critical detail**: Your `openclawConnectionManager` already maintains persistent WS connections per sandbox. Heartbeat messages from OpenClaw will flow through these same connections as `chat` events. Your `whatsappHandler` needs to handle these outbound messages that originate from the agent (not from user input).

Currently your flow is: User → Webhook → Handler → OpenClaw → Response → User

Heartbeat adds: OpenClaw (proactive) → WS event → Handler → Meta API → User

You need to listen for unsolicited `chat` events on the WS connection and route them to WhatsApp.

---

## 6. Onboarding Flow — The First 5 Minutes

This is what judges see. This is what users experience. It must be flawless.

```
User sends: "Hi"

EasyClaw: "👋 Namaste! I'm setting up your personal assistant...
This takes about 30 seconds."

[Container spins up. SOUL.md, HEARTBEAT.md, USER.md seeded. business.sqlite created.]

EasyClaw: "✅ Ready! I'm your PA now. I work for you 24/7 on WhatsApp.

To get started, tell me a bit about yourself:
- What's your name?
- What do you do? (business type or job role)
- What city are you in?

Or just start giving me tasks — I'll figure it out as we go."

User: "Main Rajesh hoon, Surat mein textile ka kaam karta hoon"

EasyClaw: "Nice to meet you Rajesh! Main aapka PA hoon.

Textile business, Surat — noted. ✅

Aap mujhse kuch bhi keh sakte ho:
📋 'Sharma Traders se 500 meter ka order aaya hai'
💰 'Gupta ka 2 lakh baaki hai'
⏰ 'Kal 3 baje Mehta ko call karna hai'
📊 'Iss hafte ka hisaab batao'

Main sab yaad rakhunga aur time pe yaad dilaaunga."

[Behind the scenes: USER.md updated with name, business, location.
Contact 'self' created in business.sqlite. Language preference set to Hinglish.]
```

### What happens in the first week:

- Day 1-2: User tells agent about orders, contacts, payments casually
- Agent populates contacts, transactions tables. Writes daily memory notes
- Day 3: First proactive heartbeat message: "Rajesh, kal aapne kaha tha Sharma ji ko invoice bhejna hai. Bheja?"
- Day 5: Morning briefing starts: "Good morning! 📋 Aaj: 2 deliveries pending, ₹1.2L receivable overdue"
- Day 7: Agent has enough data to update its own SOUL.md with user-specific patterns

---

## 7. Revised Demo Script for Judges

### The Story (3 min)

**[0:00 - 0:30] The Problem**
"63 million MSMEs in India. Most run on WhatsApp, notebooks, and memory. They can't afford a PA. They don't have time to learn new software. But OpenClaw — the 150K-star AI agent — proves that an always-on PA is now possible. The problem? Setting it up requires a developer. We fix that."

**[0:30 - 1:00] The Magic Moment**
Send "Hi" on WhatsApp. Live. Show the container provisioning in real-time. Show the response arriving.

**[1:00 - 1:30] Natural Conversation → Structured Data**
Type (in Hinglish):

- "Sharma Traders se 500 meter blue cotton ka order aaya, ₹120 per meter"
- "Gupta Electronics ka ₹2 lakh pending hai, 15 Feb ko dena tha"

Show: Agent logs both to SQLite (run `sqlite3 business.sqlite "SELECT * FROM transactions"` on screen split to prove it's structured, not just chat history).

**[1:30 - 2:00] Proactive Reminder**
Either fast-forward or trigger heartbeat manually. Show the agent sending:
"⚠️ Rajesh — Gupta Electronics ka ₹2L aaj due tha. Payment follow-up karein?"

**[2:00 - 2:30] Structured Query**
"Sabse zyada paisa kispe pending hai?"
Agent queries SQLite, returns ranked list of outstanding receivables.

**[2:30 - 3:00] The Punchline**
"This isn't a chatbot. It's a PA that runs 24/7. It remembers everything. It reminds before you forget. It organizes data you didn't even know you had. And it took one WhatsApp message to set up."

"Zero app download. Zero training. Zero tech skills needed. Just WhatsApp."

---

## 8. What Needs to Be Built (Prioritized)

### Must-Have for Demo

1. **Custom SOUL.md template** — PA personality, Hinglish support, memory discipline rules
2. **HEARTBEAT.md template** — Checklist that queries business.sqlite
3. **business.sqlite schema** — Seeded at container creation
4. **easyclaw-db SKILL.md** — Teaches agent to use the database
5. **Onboarding flow** — First conversation populates USER.md
6. **Outbound message handling** — Heartbeat/cron messages route through your existing WhatsApp infrastructure

### Nice-to-Have for Demo

7. Morning briefing cron job
8. Invoice/quotation PDF generation skill
9. GST calculation skill
10. Web search for commodity prices

### Post-Hackathon

11. Container pooling for instant provisioning
12. Multi-language SOUL.md (Tamil, Marathi, Bengali templates)
13. IndiaMART lead integration skill
14. Tally accounting sync skill
15. UPI payment confirmation parsing

---

## 9. Cost Analysis (Per User)

| Component             | Cost/Month            | Notes                                            |
| --------------------- | --------------------- | ------------------------------------------------ |
| Docker container      | ~$2-3                 | 512MB RAM, 1 CPU. Can pack ~50 users per $25 VPS |
| LLM (main model)      | ~$3-8                 | Kimi K2.5 via OpenRouter. ~10-20 msgs/day        |
| LLM (heartbeat)       | ~$0.50                | Gemini Flash. 48 heartbeats/day × 30 days        |
| LLM (cron jobs)       | ~$0.30                | 1 morning briefing/day                           |
| WhatsApp Business API | ~$1-2                 | Meta pricing for India                           |
| **Total**             | **~$7-14/user/month** |                                                  |
| **Price to user**     | **₹499/month** (~$6)  | Subsidized initially, sustainable at scale       |

At scale with container sharing and model optimization, unit economics improve dramatically.

---

## 10. The Core Insight

OpenClaw's four primitives (identity, memory, autonomy, tools) are exactly what a PA needs. The gap isn't the technology — it's the distribution and configuration.

What we're building isn't an "OpenClaw wrapper." We're building the **India distribution layer** for personal AI assistants:

- **WhatsApp as the interface** (where the users already are)
- **Docker as the infrastructure** (one container per soul)
- **SOUL.md as the personality** (PA, not chatbot)
- **SQLite as the brain** (structured data that compounds)
- **Heartbeat as the heartbeat** (literally — the PA checks on you)

The agent doesn't just respond. It remembers, reminds, and evolves. That's not a chatbot. That's a PA.
