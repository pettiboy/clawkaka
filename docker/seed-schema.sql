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
