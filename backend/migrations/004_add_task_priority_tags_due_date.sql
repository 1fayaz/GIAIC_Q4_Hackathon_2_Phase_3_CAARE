-- Migration: Add priority, tags, and due_date columns to tasks table
-- Feature: Intermediate todo features (priority, tags, due dates)
-- Date: 2026-05-05
-- Description: Extends the tasks table with priority (enum-like CHECK), tags (CSV TEXT),
--              and due_date columns, plus composite indexes to accelerate per-user
--              filtering and sorting. Idempotent: safe to re-run.

-- Step 1: Verify tasks table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        RAISE EXCEPTION 'Tasks table does not exist. Please run earlier migrations first.';
    END IF;
END $$;

-- Step 2: Add priority column (nullable first so backfill can run safely)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(10);

-- Step 3: Backfill existing rows with the default before enforcing NOT NULL
UPDATE tasks SET priority = 'medium' WHERE priority IS NULL;

-- Step 4: Set default and NOT NULL on priority
DO $$
BEGIN
    -- Set default if not already set
    ALTER TABLE tasks ALTER COLUMN priority SET DEFAULT 'medium';
    -- Enforce NOT NULL only if currently nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks'
          AND column_name = 'priority'
          AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE tasks ALTER COLUMN priority SET NOT NULL;
    END IF;
END $$;

-- Step 5: Add CHECK constraint enforcing allowed priority values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'chk_tasks_priority'
          AND table_name = 'tasks'
    ) THEN
        ALTER TABLE tasks
        ADD CONSTRAINT chk_tasks_priority
        CHECK (priority IN ('low', 'medium', 'high'));
        RAISE NOTICE 'Added CHECK constraint chk_tasks_priority';
    ELSE
        RAISE NOTICE 'CHECK constraint chk_tasks_priority already exists';
    END IF;
END $$;

-- Step 6: Add tags column (nullable CSV TEXT, capped at 500 chars for portability)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags VARCHAR(500);

-- Step 7: Add due_date column (nullable timestamp without timezone, app stores UTC)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;

-- Step 8: Create indexes to accelerate per-user filtering and sorting
CREATE INDEX IF NOT EXISTS idx_tasks_user_priority
    ON tasks (user_id, priority);

CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date
    ON tasks (user_id, due_date)
    WHERE due_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_user_completed
    ON tasks (user_id, completed);

-- Single-column index on tags to support simple LIKE/equality lookups
CREATE INDEX IF NOT EXISTS idx_tasks_tags
    ON tasks (tags);

-- Step 9: Helpful comments
COMMENT ON COLUMN tasks.priority IS 'Task priority: low | medium | high (default medium).';
COMMENT ON COLUMN tasks.tags IS 'Comma-separated lowercase labels (e.g. "work,urgent"); CSV stored as TEXT for portability.';
COMMENT ON COLUMN tasks.due_date IS 'Optional due date for the task (UTC).';

-- Step 10: Verify columns and indexes were created
DO $$
DECLARE
    missing_cols TEXT := '';
    missing_idx  TEXT := '';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='priority') THEN
        missing_cols := missing_cols || 'priority ';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='tags') THEN
        missing_cols := missing_cols || 'tags ';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='due_date') THEN
        missing_cols := missing_cols || 'due_date ';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='idx_tasks_user_priority') THEN
        missing_idx := missing_idx || 'idx_tasks_user_priority ';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='idx_tasks_user_due_date') THEN
        missing_idx := missing_idx || 'idx_tasks_user_due_date ';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='idx_tasks_user_completed') THEN
        missing_idx := missing_idx || 'idx_tasks_user_completed ';
    END IF;

    IF length(missing_cols) > 0 THEN
        RAISE EXCEPTION 'Missing columns after migration: %', missing_cols;
    END IF;
    IF length(missing_idx) > 0 THEN
        RAISE EXCEPTION 'Missing indexes after migration: %', missing_idx;
    END IF;

    RAISE NOTICE 'Migration 004 verified: columns and indexes present.';
END $$;

-- Rollback instructions:
-- DROP INDEX IF EXISTS idx_tasks_tags;
-- DROP INDEX IF EXISTS idx_tasks_user_completed;
-- DROP INDEX IF EXISTS idx_tasks_user_due_date;
-- DROP INDEX IF EXISTS idx_tasks_user_priority;
-- ALTER TABLE tasks DROP CONSTRAINT IF EXISTS chk_tasks_priority;
-- ALTER TABLE tasks DROP COLUMN IF EXISTS due_date;
-- ALTER TABLE tasks DROP COLUMN IF EXISTS tags;
-- ALTER TABLE tasks DROP COLUMN IF EXISTS priority;
