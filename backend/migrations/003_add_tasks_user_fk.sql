-- Migration: Add foreign key constraint from tasks.user_id to users.id
-- Feature: 002-auth-integration
-- Date: 2026-02-07
-- Description: Converts tasks.user_id from VARCHAR to UUID and adds foreign key constraint
-- WARNING: This migration will delete existing test data if user_id values are not valid UUIDs

-- Step 1: Check if tasks table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        RAISE EXCEPTION 'Tasks table does not exist. Please run backend foundation migrations first.';
    END IF;
END $$;

-- Step 2: Handle existing data that cannot be converted to UUID
DO $$
DECLARE
    invalid_count INTEGER;
    total_count INTEGER;
BEGIN
    -- Check current data type
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tasks'
        AND column_name = 'user_id'
        AND data_type IN ('character varying', 'varchar', 'text')
    ) THEN
        -- Count total tasks
        SELECT COUNT(*) INTO total_count FROM tasks;

        -- Count tasks with invalid UUID format
        SELECT COUNT(*) INTO invalid_count
        FROM tasks
        WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

        IF invalid_count > 0 THEN
            RAISE NOTICE 'Found % tasks with non-UUID user_id values out of % total tasks', invalid_count, total_count;
            RAISE NOTICE 'Deleting test data to enable UUID conversion...';

            -- Delete tasks with invalid UUID format (test data from Spec 1)
            DELETE FROM tasks
            WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

            RAISE NOTICE 'Deleted % test tasks. Database is now ready for authentication.', invalid_count;
        END IF;

        -- Convert VARCHAR to UUID
        ALTER TABLE tasks ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
        RAISE NOTICE 'Converted tasks.user_id from VARCHAR to UUID';
    ELSE
        RAISE NOTICE 'tasks.user_id is already UUID type, skipping conversion';
    END IF;
END $$;

-- Step 3: Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_tasks_user_id'
        AND table_name = 'tasks'
    ) THEN
        ALTER TABLE tasks
        ADD CONSTRAINT fk_tasks_user_id
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE;

        RAISE NOTICE 'Added foreign key constraint fk_tasks_user_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint fk_tasks_user_id already exists';
    END IF;
END $$;

-- Step 4: Verify the constraint was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_tasks_user_id'
        AND table_name = 'tasks'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE NOTICE 'Foreign key constraint verified successfully';
    ELSE
        RAISE EXCEPTION 'Foreign key constraint was not created';
    END IF;
END $$;

-- Add comment explaining the relationship
COMMENT ON CONSTRAINT fk_tasks_user_id ON tasks IS 'Ensures every task belongs to a valid user. Cascades deletes when user is removed.';

-- Rollback instructions:
-- ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_tasks_user_id;
-- ALTER TABLE tasks ALTER COLUMN user_id TYPE VARCHAR(255);
