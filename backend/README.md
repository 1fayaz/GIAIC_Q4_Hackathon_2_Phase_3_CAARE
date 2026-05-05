# Backend API - Task Management

Production-ready FastAPI backend with SQLModel ORM and Neon Serverless PostgreSQL for task management.

## Quick Start

For detailed setup and testing instructions, see [quickstart.md](../specs/002-backend-foundation/quickstart.md).

### Prerequisites

- Python 3.11+
- Neon PostgreSQL account
- Git

### Installation

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env and add your Neon DATABASE_URL
```

4. Run the server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

5. Access API documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

- `POST /api/{user_id}/tasks` - Create task
- `GET /api/{user_id}/tasks` - List all tasks
- `GET /api/{user_id}/tasks/{id}` - Get single task
- `PUT /api/{user_id}/tasks/{id}` - Update task
- `DELETE /api/{user_id}/tasks/{id}` - Delete task
- `PATCH /api/{user_id}/tasks/{id}/complete` - Toggle completion

## Project Structure

```
backend/
├── app/
│   ├── core/          # Configuration and database
│   ├── models/        # SQLModel entities
│   ├── schemas/       # Pydantic request/response schemas
│   ├── routes/        # API endpoints
│   ├── services/      # Business logic
│   └── main.py        # FastAPI application
├── tests/             # Test suite (future)
├── requirements.txt   # Python dependencies
└── .env.example       # Environment template
```

## Development

See [quickstart.md](../specs/002-backend-foundation/quickstart.md) for:
- Testing via Swagger UI
- Testing via cURL
- Running tests
- Common issues and solutions

## Documentation

- [Feature Specification](../specs/002-backend-foundation/spec.md)
- [Implementation Plan](../specs/002-backend-foundation/plan.md)
- [Data Model](../specs/002-backend-foundation/data-model.md)
- [API Contracts](../specs/002-backend-foundation/contracts/tasks-api.yaml)
- [Quickstart Guide](../specs/002-backend-foundation/quickstart.md)
