"""
Phase 3 Quickstart Validation Script

This script validates that the Phase 3 conversational task management
implementation is correctly set up and ready for testing.

Usage:
    python validate_phase3.py
"""

import os
import sys
from pathlib import Path

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def check_mark(passed: bool) -> str:
    """Return colored check mark or X based on test result."""
    return f"{GREEN}[OK]{RESET}" if passed else f"{RED}[FAIL]{RESET}"

def validate_environment():
    """Validate environment variables are set."""
    print("\n" + "="*70)
    print("ENVIRONMENT VALIDATION")
    print("="*70)

    required_vars = {
        "DATABASE_URL": "Neon PostgreSQL connection string",
        "OPENAI_API_KEY": "OpenAI API key for AI agent"
    }

    all_passed = True
    for var, description in required_vars.items():
        value = os.getenv(var)
        passed = value is not None and len(value) > 0
        all_passed = all_passed and passed
        print(f"{check_mark(passed)} {var}: {description}")
        if not passed:
            print(f"    {YELLOW}Set in .env file{RESET}")

    return all_passed

def validate_dependencies():
    """Validate required Python packages are installed."""
    print("\n" + "="*70)
    print("DEPENDENCY VALIDATION")
    print("="*70)

    required_packages = {
        "openai": "OpenAI Agents SDK",
        "fastapi": "FastAPI framework",
        "sqlmodel": "SQLModel ORM",
        "asyncpg": "Async PostgreSQL driver"
    }

    all_passed = True
    for package, description in required_packages.items():
        try:
            __import__(package)
            passed = True
        except ImportError:
            passed = False
            all_passed = False

        print(f"{check_mark(passed)} {package}: {description}")
        if not passed:
            print(f"    {YELLOW}Install with: pip install {package}{RESET}")

    return all_passed

def validate_file_structure():
    """Validate Phase 3 files exist."""
    print("\n" + "="*70)
    print("FILE STRUCTURE VALIDATION")
    print("="*70)

    base_path = Path(__file__).parent / "app"

    required_files = {
        "Models": [
            "models/conversation.py",
            "models/message.py"
        ],
        "MCP Tools": [
            "mcp/server.py",
            "mcp/tools/add_task.py",
            "mcp/tools/list_tasks.py",
            "mcp/tools/complete_task.py",
            "mcp/tools/delete_task.py",
            "mcp/tools/update_task.py"
        ],
        "Agent": [
            "agent/runner.py",
            "agent/config.py"
        ],
        "API Routes": [
            "routes/chat.py"
        ],
        "Schemas": [
            "schemas/chat.py"
        ],
        "Services": [
            "services/conversation_service.py"
        ]
    }

    all_passed = True
    for category, files in required_files.items():
        print(f"\n{category}:")
        for file_path in files:
            full_path = base_path / file_path
            passed = full_path.exists()
            all_passed = all_passed and passed
            print(f"  {check_mark(passed)} {file_path}")

    return all_passed

def validate_database_tables():
    """Validate database tables exist."""
    print("\n" + "="*70)
    print("DATABASE VALIDATION")
    print("="*70)

    try:
        import asyncio
        import asyncpg
        from dotenv import load_dotenv

        load_dotenv()
        database_url = os.getenv("DATABASE_URL")

        if not database_url:
            print(f"{RED}[FAIL]{RESET} DATABASE_URL not set")
            return False

        # Convert SQLAlchemy URL to asyncpg format
        if database_url.startswith("postgresql+asyncpg://"):
            database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")

        async def check_tables():
            try:
                conn = await asyncpg.connect(database_url)

                required_tables = ["conversations", "messages"]
                results = {}

                for table in required_tables:
                    exists = await conn.fetchval(
                        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)",
                        table
                    )
                    results[table] = exists

                await conn.close()
                return results
            except Exception as e:
                print(f"{RED}[ERROR]{RESET} Database connection failed: {e}")
                return None

        results = asyncio.run(check_tables())

        if results is None:
            return False

        all_passed = True
        for table, exists in results.items():
            passed = exists
            all_passed = all_passed and passed
            print(f"{check_mark(passed)} Table '{table}' exists")
            if not passed:
                print(f"    {YELLOW}Run migration: python backend/migrations/003_add_conversations_and_messages.py{RESET}")

        return all_passed

    except ImportError as e:
        print(f"{RED}[ERROR]{RESET} Missing dependency: {e}")
        return False
    except Exception as e:
        print(f"{RED}[ERROR]{RESET} Validation failed: {e}")
        return False

def main():
    """Run all validation checks."""
    print("\n" + "="*70)
    print("PHASE 3: CONVERSATIONAL TASK MANAGEMENT - VALIDATION")
    print("="*70)

    results = {
        "Environment": validate_environment(),
        "Dependencies": validate_dependencies(),
        "File Structure": validate_file_structure(),
        "Database": validate_database_tables()
    }

    print("\n" + "="*70)
    print("VALIDATION SUMMARY")
    print("="*70)

    for category, passed in results.items():
        print(f"{check_mark(passed)} {category}")

    all_passed = all(results.values())

    if all_passed:
        print(f"\n{GREEN}All validation checks passed!{RESET}")
        print("\nNext steps:")
        print("1. Start the backend server: uvicorn app.main:app --reload")
        print("2. Access Swagger UI: http://localhost:8000/docs")
        print("3. Test chat endpoint: POST /api/chat/message")
        return 0
    else:
        print(f"\n{RED}Some validation checks failed.{RESET}")
        print("Please fix the issues above before proceeding.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
