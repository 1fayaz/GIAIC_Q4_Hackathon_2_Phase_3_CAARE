# Backend API - Task Management

Production-ready FastAPI backend with SQLModel ORM and Neon Serverless PostgreSQL for task management.

**Phase 3 Update**: Now includes AI-powered conversational task management using OpenAI Agents SDK and MCP tools.

## Quick Start

For detailed setup and testing instructions, see [quickstart.md](../specs/002-backend-foundation/quickstart.md).

### Prerequisites

- Python 3.11+
- Neon PostgreSQL account
- OpenAI API account (for Phase 3 conversational features)
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
# Edit .env and add:
# - Your Neon DATABASE_URL
# - Your OPENAI_API_KEY (for Phase 3 features)
```

4. Run database migrations:
```bash
# Phase 3: Create conversations and messages tables
python migrations/003_add_conversations_and_messages.py
```

5. Validate Phase 3 setup:
```bash
python validate_phase3.py
```

6. Run the server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

7. Access API documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Phase 2: Traditional Task Management

- `POST /api/{user_id}/tasks` - Create task
- `GET /api/{user_id}/tasks` - List all tasks
- `GET /api/{user_id}/tasks/{id}` - Get single task
- `PUT /api/{user_id}/tasks/{id}` - Update task
- `DELETE /api/{user_id}/tasks/{id}` - Delete task
- `PATCH /api/{user_id}/tasks/{id}/complete` - Toggle completion

### Phase 3: Conversational Task Management (NEW)

**Chat Endpoint:**
- `POST /api/chat/message` - Send message to AI agent for task management
  - Supports natural language commands: "Add task to buy groceries", "Show my tasks", "Mark X as done"
  - Returns conversational response with tool invocation metadata
  - Automatically creates conversation if not provided

**Conversation Management:**
- `POST /api/chat/conversations` - Create new conversation
- `GET /api/chat/conversations` - List user's conversations
- `GET /api/chat/conversations/{id}` - Get conversation with full message history
- `DELETE /api/chat/conversations/{id}` - Delete conversation and all messages

### AI Agent Capabilities

The AI agent can perform all task operations through natural language:

1. **Create Tasks**: "Add a task to buy groceries tomorrow"
2. **List Tasks**: "Show me my tasks", "What do I need to do?"
3. **Complete Tasks**: "I finished buying groceries", "Mark task X as done"
4. **Delete Tasks**: "Delete the groceries task", "Remove task X"
5. **Update Tasks**: "Change task X to Y", "Add description to task Z"

## Project Structure

```
backend/
├── app/
│   ├── core/              # Configuration and database
│   ├── models/            # SQLModel entities
│   │   ├── task.py        # Phase 2: Task model
│   │   ├── user.py        # Phase 2: User model
│   │   ├── conversation.py # Phase 3: Conversation model (NEW)
│   │   └── message.py     # Phase 3: Message model (NEW)
│   ├── schemas/           # Pydantic request/response schemas
│   │   ├── task.py        # Phase 2: Task schemas
│   │   ├── auth.py        # Phase 2: Auth schemas
│   │   └── chat.py        # Phase 3: Chat schemas (NEW)
│   ├── routes/            # API endpoints
│   │   ├── tasks.py       # Phase 2: Task endpoints
│   │   ├── auth.py        # Phase 2: Auth endpoints
│   │   └── chat.py        # Phase 3: Chat endpoints (NEW)
│   ├── services/          # Business logic
│   │   └── conversation_service.py # Phase 3: Conversation CRUD (NEW)
│   ├── mcp/               # Phase 3: MCP tools (NEW)
│   │   ├── server.py      # MCP server and tool registry
│   │   └── tools/         # MCP tool implementations
│   │       ├── add_task.py
│   │       ├── list_tasks.py
│   │       ├── complete_task.py
│   │       ├── delete_task.py
│   │       └── update_task.py
│   ├── agent/             # Phase 3: AI agent (NEW)
│   │   ├── runner.py      # Agent orchestration
│   │   └── config.py      # Agent configuration and system prompt
│   ├── dependencies/      # FastAPI dependencies
│   └── main.py            # FastAPI application
├── migrations/            # Database migrations
│   ├── 001_*.py           # Phase 2: Initial schema
│   ├── 002_*.py           # Phase 2: User authentication
│   └── 003_*.py           # Phase 3: Conversations and messages (NEW)
├── tests/                 # Test suite
├── requirements.txt       # Python dependencies
├── validate_phase3.py     # Phase 3 validation script (NEW)
└── .env.example           # Environment template
```

## Phase 3 Architecture

### MCP Tools
Stateless functions that perform task operations:
- Enforce user ownership on all operations
- Return structured responses (success/error)
- Log all invocations for auditability
- Handle errors gracefully

### AI Agent
OpenAI-powered agent that:
- Interprets natural language commands
- Maps user intent to MCP tool calls
- Generates conversational responses
- Maintains conversation context

### Conversation Persistence
- All conversations stored in Neon PostgreSQL
- User-scoped conversations (no cross-user access)
- Message history with tool call metadata
- Stateless backend (loads context from database)

## Development

### Testing Phase 3 Features

**Via Swagger UI** (http://localhost:8000/docs):
1. Authenticate to get JWT token
2. Navigate to "chat" section
3. Try POST /api/chat/message with: `{"content": "Add a task to buy groceries"}`
4. View response with agent's reply and tool_calls metadata

**Via cURL**:
```bash
# Send message to AI agent
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_JWT_TOKEN" \
  -d '{"content": "Add a task to buy groceries tomorrow"}'

# List conversations
curl -X GET http://localhost:8000/api/chat/conversations \
  -H "Cookie: session=YOUR_JWT_TOKEN"
```

**Via Python**:
```python
import asyncio
from app.agent.runner import AgentRunner
from app.core.database import get_session

async def test_agent():
    runner = AgentRunner(api_key="sk-...")
    result = await runner.run(
        user_id="user-uuid",
        message="Add a task to buy groceries",
        conversation_history=[],
        session=await get_session()
    )
    print(result)

asyncio.run(test_agent())
```

### Running Validation

```bash
# Validate Phase 3 setup
python validate_phase3.py

# Expected output:
# [OK] Environment
# [OK] Dependencies
# [OK] File Structure
# [OK] Database
```

## Documentation

### Phase 2 Documentation
- [Feature Specification](../specs/002-backend-foundation/spec.md)
- [Implementation Plan](../specs/002-backend-foundation/plan.md)
- [Data Model](../specs/002-backend-foundation/data-model.md)
- [API Contracts](../specs/002-backend-foundation/contracts/tasks-api.yaml)
- [Quickstart Guide](../specs/002-backend-foundation/quickstart.md)

### Phase 3 Documentation (NEW)
- [Feature Specification](../specs/004-ai-agent-mcp/spec.md)
- [Implementation Plan](../specs/004-ai-agent-mcp/plan.md)
- [Data Model](../specs/004-ai-agent-mcp/data-model.md)
- [MCP Tool Contracts](../specs/004-ai-agent-mcp/contracts/mcp-tools.yaml)
- [Agent Configuration](../specs/004-ai-agent-mcp/contracts/agent-config.yaml)
- [Quickstart Guide](../specs/004-ai-agent-mcp/quickstart.md)
- [Research & Decisions](../specs/004-ai-agent-mcp/research.md)

## Troubleshooting

### Phase 3 Common Issues

**Issue**: "OpenAI API key not found"
- **Solution**: Add `OPENAI_API_KEY=sk-...` to `.env` file

**Issue**: "Table 'conversations' does not exist"
- **Solution**: Run migration: `python migrations/003_add_conversations_and_messages.py`

**Issue**: "Agent returns generic error"
- **Solution**: Check logs for tool invocation errors. Verify database connection and user_id validity.

**Issue**: "Tool calls not appearing in response"
- **Solution**: Ensure OpenAI API key has access to function calling (GPT-4 or later)

For more issues and solutions, see [quickstart.md](../specs/004-ai-agent-mcp/quickstart.md).

