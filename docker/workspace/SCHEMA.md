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
