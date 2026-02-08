"""
Database migration runner script.

This script executes SQL migration files against the Neon PostgreSQL database.
Usage: python run_migration.py <migration_file.sql>
"""

import asyncio
import asyncpg
import sys
import os
from pathlib import Path

# Add parent directory to path to import from app
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

# Load environment variables
load_dotenv()


async def run_migration(migration_file: str):
    """
    Execute a SQL migration file against the database.

    Args:
        migration_file: Path to the SQL migration file
    """
    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL not found in environment variables")

    # Remove the postgresql+asyncpg:// prefix if present (asyncpg expects postgresql://)
    if database_url.startswith("postgresql+asyncpg://"):
        database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")

    print(f"Connecting to database...")

    # Connect to database
    conn = await asyncpg.connect(database_url)

    try:
        # Read migration file
        migration_path = Path(migration_file)
        if not migration_path.exists():
            raise FileNotFoundError(f"Migration file not found: {migration_file}")

        print(f"Reading migration file: {migration_path.name}")
        sql_content = migration_path.read_text()

        # Execute migration
        print(f"Executing migration...")
        await conn.execute(sql_content)

        print(f"[SUCCESS] Migration completed successfully: {migration_path.name}")

    except Exception as e:
        print(f"[ERROR] Migration failed: {e}")
        raise
    finally:
        await conn.close()
        print("Database connection closed")


async def verify_schema():
    """
    Verify the database schema after migrations.
    """
    database_url = os.getenv("DATABASE_URL")
    if database_url.startswith("postgresql+asyncpg://"):
        database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(database_url)

    try:
        print("\n" + "="*60)
        print("DATABASE SCHEMA VERIFICATION")
        print("="*60)

        # List all tables
        print("\n1. Tables in database:")
        tables = await conn.fetch("""
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename;
        """)
        for table in tables:
            print(f"   - {table['tablename']}")

        # Describe users table
        print("\n2. Users table structure:")
        users_columns = await conn.fetch("""
            SELECT
                column_name,
                data_type,
                character_maximum_length,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position;
        """)

        if users_columns:
            for col in users_columns:
                nullable = "NULL" if col['is_nullable'] == 'YES' else "NOT NULL"
                max_len = f"({col['character_maximum_length']})" if col['character_maximum_length'] else ""
                default = f"DEFAULT {col['column_default']}" if col['column_default'] else ""
                print(f"   - {col['column_name']}: {col['data_type']}{max_len} {nullable} {default}")
        else:
            print("   ✗ Users table not found!")

        # Check indexes on users table
        print("\n3. Indexes on users table:")
        users_indexes = await conn.fetch("""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'users';
        """)
        for idx in users_indexes:
            print(f"   - {idx['indexname']}")
            print(f"     {idx['indexdef']}")

        # Describe tasks table
        print("\n4. Tasks table structure:")
        tasks_columns = await conn.fetch("""
            SELECT
                column_name,
                data_type,
                character_maximum_length,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = 'tasks'
            ORDER BY ordinal_position;
        """)

        if tasks_columns:
            for col in tasks_columns:
                nullable = "NULL" if col['is_nullable'] == 'YES' else "NOT NULL"
                max_len = f"({col['character_maximum_length']})" if col['character_maximum_length'] else ""
                default = f"DEFAULT {col['column_default']}" if col['column_default'] else ""
                print(f"   - {col['column_name']}: {col['data_type']}{max_len} {nullable} {default}")

        # Check foreign key constraints
        print("\n5. Foreign key constraints:")
        fk_constraints = await conn.fetch("""
            SELECT
                tc.constraint_name,
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
            AND tc.table_name = 'tasks';
        """)

        if fk_constraints:
            for fk in fk_constraints:
                print(f"   - {fk['constraint_name']}")
                print(f"     {fk['table_name']}.{fk['column_name']} -> {fk['foreign_table_name']}.{fk['foreign_column_name']}")
                print(f"     ON DELETE {fk['delete_rule']}")
        else:
            print("   ✗ No foreign key constraints found on tasks table")

        print("\n" + "="*60)
        print("VERIFICATION COMPLETE")
        print("="*60 + "\n")

    finally:
        await conn.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python run_migration.py <migration_file.sql>")
        print("   or: python run_migration.py verify")
        sys.exit(1)

    if sys.argv[1] == "verify":
        asyncio.run(verify_schema())
    else:
        migration_file = sys.argv[1]
        asyncio.run(run_migration(migration_file))
