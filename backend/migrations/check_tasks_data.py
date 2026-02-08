"""
Check existing data in tasks table.
"""

import asyncio
import asyncpg
import os
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))
from dotenv import load_dotenv

load_dotenv()


async def check_tasks_data():
    """Check existing data in tasks table."""
    database_url = os.getenv("DATABASE_URL")
    if database_url.startswith("postgresql+asyncpg://"):
        database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(database_url)

    try:
        print("Checking tasks table data...")

        # Check if tasks table exists
        table_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_name = 'tasks'
            );
        """)

        if not table_exists:
            print("Tasks table does not exist yet.")
            return

        # Get count of tasks
        count = await conn.fetchval("SELECT COUNT(*) FROM tasks;")
        print(f"Total tasks in database: {count}")

        if count > 0:
            # Show sample data
            tasks = await conn.fetch("SELECT id, user_id, title FROM tasks LIMIT 5;")
            print("\nSample tasks:")
            for task in tasks:
                print(f"  - ID: {task['id']}, user_id: {task['user_id']}, title: {task['title']}")

            # Check user_id data type
            user_id_type = await conn.fetchval("""
                SELECT data_type
                FROM information_schema.columns
                WHERE table_name = 'tasks' AND column_name = 'user_id';
            """)
            print(f"\nCurrent user_id data type: {user_id_type}")

            # Check if any user_id values are valid UUIDs
            print("\nChecking if user_id values are valid UUIDs...")
            try:
                invalid_count = await conn.fetchval("""
                    SELECT COUNT(*) FROM tasks
                    WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
                """)
                print(f"Tasks with non-UUID user_id values: {invalid_count}")
            except Exception as e:
                print(f"Could not check UUID format: {e}")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(check_tasks_data())
