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
- If unsure → pick your best guess as Other, then learn from any correction

### Self-Evolution Rules

- If the user's needs require tables that don't exist, CREATE them
- Always use ALTER TABLE to add columns rather than recreating tables
- Log EVERY schema change to the `schema_changes` table
- Update SCHEMA.md after every change
- Before creating a new table, check if an existing table can be extended
- Keep the schema simple — optimize for your own understanding
