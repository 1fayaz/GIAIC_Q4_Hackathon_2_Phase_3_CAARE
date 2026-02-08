"""
Migration 003: Add conversations and messages tables for Phase 3 conversational task management.

This migration creates:
1. conversations table - stores chat sessions between users and AI agent
2. messages table - stores individual messages within conversations
3. Trigger to auto-update conversation.updated_at when messages are added

Usage:
    python backend/migrations/003_add_conversations_and_messages.py
"""

import asyncio
import asyncpg
import os
import sys
from pathlib import Path

# Add parent directory to path to import from app
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

# Load environment variables
load_dotenv()


# SQL for creating conversations table
CREATE_CONVERSATIONS_TABLE = """
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);
"""


# SQL for creating messages table
CREATE_MESSAGES_TABLE = """
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 10000),
    tool_calls TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
"""


# SQL for creating trigger to auto-update conversation.updated_at
CREATE_UPDATE_TRIGGER = """
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages;

CREATE TRIGGER trigger_update_conversation_timestamp
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();
"""


async def run_migration():
    """
    Execute the migration to add conversations and messages tables.
    """
    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL not found in environment variables")

    # Remove the postgresql+asyncpg:// prefix if present (asyncpg expects postgresql://)
    if database_url.startswith("postgresql+asyncpg://"):
        database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")

    print("="*70)
    print("MIGRATION 003: Add Conversations and Messages Tables")
    print("="*70)
    print("\nConnecting to database...")

    # Connect to database
    conn = await asyncpg.connect(database_url)

    try:
        # Step 1: Create conversations table
        print("\n[1/3] Creating conversations table...")
        await conn.execute(CREATE_CONVERSATIONS_TABLE)
        print("      [OK] Conversations table created successfully")

        # Step 2: Create messages table
        print("\n[2/3] Creating messages table...")
        await conn.execute(CREATE_MESSAGES_TABLE)
        print("      [OK] Messages table created successfully")

        # Step 3: Create trigger for auto-updating conversation.updated_at
        print("\n[3/3] Creating trigger for conversation.updated_at...")
        await conn.execute(CREATE_UPDATE_TRIGGER)
        print("      [OK] Trigger created successfully")

        print("\n" + "="*70)
        print("MIGRATION COMPLETED SUCCESSFULLY")
        print("="*70)

    except Exception as e:
        print(f"\n[ERROR] Migration failed: {e}")
        raise
    finally:
        await conn.close()
        print("\nDatabase connection closed")


async def verify_migration():
    """
    Verify that the migration was applied successfully.
    """
    database_url = os.getenv("DATABASE_URL")
    if database_url.startswith("postgresql+asyncpg://"):
        database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(database_url)

    try:
        print("\n" + "="*70)
        print("MIGRATION VERIFICATION")
        print("="*70)

        # Check if conversations table exists
        print("\n1. Checking conversations table...")
        conversations_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_name = 'conversations'
            );
        """)

        if conversations_exists:
            print("   [OK] Conversations table exists")

            # Check columns
            columns = await conn.fetch("""
                SELECT column_name, data_type, character_maximum_length, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'conversations'
                ORDER BY ordinal_position;
            """)
            print("   Columns:")
            for col in columns:
                nullable = "NULL" if col['is_nullable'] == 'YES' else "NOT NULL"
                max_len = f"({col['character_maximum_length']})" if col['character_maximum_length'] else ""
                print(f"     - {col['column_name']}: {col['data_type']}{max_len} {nullable}")

            # Check indexes
            indexes = await conn.fetch("""
                SELECT indexname FROM pg_indexes
                WHERE tablename = 'conversations';
            """)
            print("   Indexes:")
            for idx in indexes:
                print(f"     - {idx['indexname']}")
        else:
            print("   ✗ Conversations table NOT found")

        # Check if messages table exists
        print("\n2. Checking messages table...")
        messages_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_name = 'messages'
            );
        """)

        if messages_exists:
            print("   [OK] Messages table exists")

            # Check columns
            columns = await conn.fetch("""
                SELECT column_name, data_type, character_maximum_length, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'messages'
                ORDER BY ordinal_position;
            """)
            print("   Columns:")
            for col in columns:
                nullable = "NULL" if col['is_nullable'] == 'YES' else "NOT NULL"
                max_len = f"({col['character_maximum_length']})" if col['character_maximum_length'] else ""
                print(f"     - {col['column_name']}: {col['data_type']}{max_len} {nullable}")

            # Check indexes
            indexes = await conn.fetch("""
                SELECT indexname FROM pg_indexes
                WHERE tablename = 'messages';
            """)
            print("   Indexes:")
            for idx in indexes:
                print(f"     - {idx['indexname']}")
        else:
            print("   ✗ Messages table NOT found")

        # Check if trigger exists
        print("\n3. Checking trigger...")
        trigger_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.triggers
                WHERE trigger_name = 'trigger_update_conversation_timestamp'
            );
        """)

        if trigger_exists:
            print("   [OK] Trigger 'trigger_update_conversation_timestamp' exists")
        else:
            print("   ✗ Trigger NOT found")

        # Check foreign key constraints
        print("\n4. Checking foreign key constraints...")
        fk_constraints = await conn.fetch("""
            SELECT
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                rc.delete_rule
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            JOIN information_schema.referential_constraints AS rc
                ON rc.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name IN ('conversations', 'messages');
        """)

        if fk_constraints:
            for fk in fk_constraints:
                print(f"   [OK] {fk['table_name']}.{fk['column_name']} -> {fk['foreign_table_name']}.{fk['foreign_column_name']}")
                print(f"     ON DELETE {fk['delete_rule']}")
        else:
            print("   ✗ No foreign key constraints found")

        print("\n" + "="*70)
        print("VERIFICATION COMPLETE")
        print("="*70 + "\n")

    finally:
        await conn.close()


async def rollback_migration():
    """
    Rollback the migration by dropping the tables and trigger.
    """
    database_url = os.getenv("DATABASE_URL")
    if database_url.startswith("postgresql+asyncpg://"):
        database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")

    print("="*70)
    print("MIGRATION 003 ROLLBACK: Remove Conversations and Messages Tables")
    print("="*70)
    print("\nWARNING: This will delete all conversation and message data!")
    print("Connecting to database...")

    conn = await asyncpg.connect(database_url)

    try:
        # Drop trigger
        print("\n[1/3] Dropping trigger...")
        await conn.execute("DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages;")
        await conn.execute("DROP FUNCTION IF EXISTS update_conversation_timestamp();")
        print("      [OK] Trigger dropped")

        # Drop messages table (must be before conversations due to FK)
        print("\n[2/3] Dropping messages table...")
        await conn.execute("DROP TABLE IF EXISTS messages CASCADE;")
        print("      [OK] Messages table dropped")

        # Drop conversations table
        print("\n[3/3] Dropping conversations table...")
        await conn.execute("DROP TABLE IF EXISTS conversations CASCADE;")
        print("      [OK] Conversations table dropped")

        print("\n" + "="*70)
        print("ROLLBACK COMPLETED SUCCESSFULLY")
        print("="*70)

    except Exception as e:
        print(f"\n[ERROR] Rollback failed: {e}")
        raise
    finally:
        await conn.close()
        print("\nDatabase connection closed")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "verify":
            asyncio.run(verify_migration())
        elif command == "rollback":
            asyncio.run(rollback_migration())
        else:
            print(f"Unknown command: {command}")
            print("Usage: python 003_add_conversations_and_messages.py [verify|rollback]")
            sys.exit(1)
    else:
        # Default: run migration
        asyncio.run(run_migration())
