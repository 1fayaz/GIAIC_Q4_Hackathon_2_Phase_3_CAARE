# Quickstart Guide: Backend & Database Foundation

**Feature**: 001-backend-foundation
**Date**: 2026-02-06
**Purpose**: Setup and run instructions for the backend API

## Prerequisites

Before starting, ensure you have:

- **Python 3.11+** installed ([Download](https://www.python.org/downloads/))
- **Neon PostgreSQL account** ([Sign up](https://neon.tech/))
- **Git** installed (for cloning the repository)
- **Code editor** (VS Code, PyCharm, or similar)

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Phase2_H2_Q4_GIAIC
git checkout 001-backend-foundation
```

### 2. Create Virtual Environment

**Windows:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Expected dependencies** (requirements.txt):
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlmodel==0.0.14
asyncpg==0.29.0
python-dotenv==1.0.0
pydantic==2.5.0
pytest==8.0.0
pytest-asyncio==0.23.0
httpx==0.26.0
```

### 4. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Neon PostgreSQL connection string:

```env
# Database Configuration
DATABASE_URL=postgresql+asyncpg://user:password@host.neon.tech/dbname?sslmode=require

# Optional: CORS Configuration (for future frontend)
CORS_ORIGINS=["http://localhost:3000"]

# Optional: Logging
LOG_LEVEL=INFO
```

**Getting your Neon DATABASE_URL:**
1. Log in to [Neon Console](https://console.neon.tech/)
2. Select your project
3. Go to "Connection Details"
4. Copy the connection string
5. Replace `postgresql://` with `postgresql+asyncpg://` (required for async support)

### 5. Initialize Database

The database tables will be created automatically on first run. To manually initialize:

```bash
python -m app.core.database
```

This creates the `tasks` table with the schema defined in `data-model.md`.

## Running the Application

### Development Server

Start the FastAPI development server with auto-reload:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

The API is now running at: **http://localhost:8000**

### Verify Installation

Open your browser and navigate to:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health (if implemented)

You should see the interactive API documentation with all 6 endpoints listed.

## Testing the API

### Using Swagger UI (Recommended)

1. Open http://localhost:8000/docs
2. Expand any endpoint (e.g., "POST /api/{user_id}/tasks")
3. Click "Try it out"
4. Enter parameters:
   - `user_id`: `user123`
   - Request body:
     ```json
     {
       "title": "My first task",
       "description": "Testing the API"
     }
     ```
5. Click "Execute"
6. View the response (should be 201 Created with task details)

### Using cURL

**Create a task:**
```bash
curl -X POST "http://localhost:8000/api/user123/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive API docs"
  }'
```

**List all tasks:**
```bash
curl "http://localhost:8000/api/user123/tasks"
```

**Get a single task:**
```bash
curl "http://localhost:8000/api/user123/tasks/{task_id}"
```

**Update a task:**
```bash
curl -X PUT "http://localhost:8000/api/user123/tasks/{task_id}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated title",
    "completed": true
  }'
```

**Toggle completion:**
```bash
curl -X PATCH "http://localhost:8000/api/user123/tasks/{task_id}/complete"
```

**Delete a task:**
```bash
curl -X DELETE "http://localhost:8000/api/user123/tasks/{task_id}"
```

### Using Python (httpx)

```python
import httpx
import asyncio

async def test_api():
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # Create a task
        response = await client.post(
            "/api/user123/tasks",
            json={"title": "Test task", "description": "Testing"}
        )
        print(f"Created: {response.json()}")

        # List tasks
        response = await client.get("/api/user123/tasks")
        print(f"Tasks: {response.json()}")

asyncio.run(test_api())
```

## Running Tests

### Run All Tests

```bash
pytest
```

### Run with Coverage

```bash
pytest --cov=app --cov-report=html
```

View coverage report: `open htmlcov/index.html`

### Run Specific Test Files

```bash
# Integration tests only
pytest tests/test_task_api.py

# Unit tests only
pytest tests/test_task_service.py

# Run with verbose output
pytest -v
```

### Expected Test Output

```
============================= test session starts ==============================
collected 15 items

tests/test_task_api.py ........                                          [ 53%]
tests/test_task_service.py .......                                       [100%]

============================== 15 passed in 2.34s ===============================
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── core/
│   │   ├── config.py        # Environment configuration
│   │   └── database.py      # Database engine and session
│   ├── models/
│   │   └── task.py          # Task SQLModel
│   ├── schemas/
│   │   └── task.py          # Pydantic request/response schemas
│   ├── routes/
│   │   └── tasks.py         # Task CRUD endpoints
│   └── services/
│       └── task_service.py  # Business logic
├── tests/
│   ├── conftest.py          # Pytest fixtures
│   ├── test_task_api.py     # API integration tests
│   └── test_task_service.py # Service unit tests
├── .env                     # Environment variables (not committed)
├── .env.example             # Environment template
├── .gitignore
├── requirements.txt         # Python dependencies
└── README.md
```

## Common Issues

### Issue: "ModuleNotFoundError: No module named 'app'"

**Solution**: Ensure you're in the `backend/` directory and virtual environment is activated:
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
```

### Issue: "Connection refused" or "Database connection failed"

**Solution**: Verify your DATABASE_URL in `.env`:
- Check username, password, host, and database name
- Ensure `postgresql+asyncpg://` prefix (not just `postgresql://`)
- Verify Neon database is active (not paused)
- Check firewall/network settings

### Issue: "Table 'tasks' doesn't exist"

**Solution**: Tables should auto-create on startup. If not:
```bash
python -m app.core.database
```

### Issue: "Port 8000 already in use"

**Solution**: Use a different port:
```bash
uvicorn app.main:app --reload --port 8001
```

Or kill the process using port 8000:
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <process_id> /F

# macOS/Linux
lsof -ti:8000 | xargs kill -9
```

## Development Workflow

### 1. Make Changes

Edit files in `app/` directory. The server will auto-reload on file changes.

### 2. Test Changes

```bash
# Run tests
pytest

# Test specific endpoint via Swagger UI
# Open http://localhost:8000/docs
```

### 3. Verify Data Isolation

Test that users cannot access each other's tasks:

```bash
# Create task for user1
curl -X POST "http://localhost:8000/api/user1/tasks" \
  -H "Content-Type: application/json" \
  -d '{"title": "User1 task"}'

# Try to access as user2 (should return empty list)
curl "http://localhost:8000/api/user2/tasks"
```

### 4. Check Logs

Monitor server logs for errors:
```bash
# Logs appear in terminal where uvicorn is running
# Look for ERROR or WARNING messages
```

## Next Steps

After completing this feature:

1. **Add Authentication**: Implement JWT token validation (future spec)
2. **Add Frontend**: Build Next.js UI to consume this API (future spec)
3. **Add Pagination**: Support large task lists (future enhancement)
4. **Add Filtering**: Filter tasks by completion status (future enhancement)
5. **Add Deployment**: Deploy to production (Railway, Render, etc.)

## API Documentation

Full API documentation is available at:
- **Interactive Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Spec**: `specs/001-backend-foundation/contracts/tasks-api.yaml`

## Support

For issues or questions:
1. Check the [data-model.md](./data-model.md) for schema details
2. Review [research.md](./research.md) for technology decisions
3. Consult [plan.md](./plan.md) for architecture overview
4. Check constitution compliance in [plan.md](./plan.md#constitution-check)

## Summary

You should now have:
- ✅ Backend server running on http://localhost:8000
- ✅ Database connected to Neon PostgreSQL
- ✅ Interactive API documentation at /docs
- ✅ All 6 CRUD endpoints functional
- ✅ Tests passing

**Verify everything works:**
```bash
# 1. Server is running
curl http://localhost:8000/docs

# 2. Can create tasks
curl -X POST "http://localhost:8000/api/test/tasks" \
  -H "Content-Type: application/json" \
  -d '{"title": "Verification task"}'

# 3. Tests pass
pytest
```

If all three checks pass, the backend foundation is ready for use! 🎉
