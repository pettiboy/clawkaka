# Clawkaka

**Your PA on WhatsApp. Not a chatbot - a personal assistant that remembers, reminds, and acts.**

---

## The Problem

India runs on WhatsApp (500M+ users), yet managing life still means juggling apps for tasks, expenses, calories, and reminders. Most people don't use any of them consistently. People don't need _another app_ - they need something that works where they already are.

## What Clawkaka Does

Text it like a friend, it handles the rest:

- **"Spent 450 at Starbucks"** → Logs, categorizes as Food, confirms in one line.
- **"Remind me to call Sharma at 4"** → Done. You'll hear about it at 4.
- **"Had paneer tikka and 2 rotis"** → Logs ~650 kcal, moves on.
- **"Rahul owes me 5000 for AC repair"** → Saved. Ask "who owes me?" later.

No onboarding. No category pickers. It just _does the thing_.

**Core capabilities:** Task & reminder management · Expense tracking with auto-categorization · Calorie logging (calibrated for Indian food) · Contact ledger for SMEs · Proactive check-ins (morning briefings, deadline alerts, meal nudges) · Voice calls (speak naturally, get WhatsApp summary) · Hindi/Hinglish support · Self-evolving database schema.

**Who it's for:** Corporate professionals tracking tasks/calories/expenses, and SME owners managing receivables in Hindi - no app literacy required.

---

## Architecture

### Message Flow

User → Meta Webhook → Express backend → Per-user Docker sandbox (OpenClaw agent + SQLite) → LLM processing → WhatsApp response.

Every user gets **their own isolated Docker container** with independent database, AI context, and resource limits (2GB RAM, 1 CPU). The agent can create new tables on its own when it needs to track something new.

Each sandbox runs an [OpenClaw](https://openclaw.ai) agent with personality rules (`SOUL.md`), proactive schedules (`HEARTBEAT.md`), and database skills. Golden rule: **"Just Do It"** - act first, confirm briefly, move on.

A heartbeat runs every 30 minutes (7 AM–11 PM IST) checking for overdue tasks, missed meals, and approaching deadlines.

---

## Tech Stack

| Layer                | Technology                                                                            |
| -------------------- | ------------------------------------------------------------------------------------- |
| **Frontend**         | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui                                       |
| **Backend**          | Express.js, TypeScript, Prisma, PostgreSQL                                            |
| **Per-user sandbox** | Docker + SQLite + OpenClaw agent                                                      |
| **LLM**              | OpenRouter - Antropic: Claude Opus 4.6 (chat), Antropic: Claude Haiku 4.5 (heartbeat) |
| **Messaging**        | Meta WhatsApp Business API                                                            |
| **Voice**            | Twilio (recording + transcription + TTS)                                              |
| **Infra**            | Caddy (HTTPS), PM2, Ed25519 device auth                                               |

---

## What Makes It Different

1. **Not a chatbot** - It logs, tracks, reminds, and checks in proactively. Tell it once and forget.
2. **Zero friction** - No app, no signup, no forms. Just text a WhatsApp number.
3. **Real isolation** - Each user gets a full Docker container, not prompt-level separation.
4. **Self-evolving memory** - The agent creates new database tables when it encounters something new.
5. **Proactive** - Heartbeat checks for overdue tasks, missed meals, approaching deadlines. Max 2-3 nudges/day.
6. **Built for Bharat** - Hindi/Hinglish support, Indian food calorie estimates, INR defaults, Indian spending categories.
