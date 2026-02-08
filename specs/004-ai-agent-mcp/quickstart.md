# Quickstart Guide: Conversational Task Management

**Feature**: 004-ai-agent-mcp
**Date**: 2026-02-08
**Purpose**: Developer guide for testing and running the AI agent locally

---

## Prerequisites

Before you begin, ensure you have:

- Python 3.11+ installed
- Access to the existing Phase 2 backend (FastAPI + Neon PostgreSQL)
- OpenAI API key
- Git repository cloned locally

---

## Environment Setup

### 1. Install Dependencies

```bash
cd backend

# Install new dependencies for Phase 3
pip install openai>=1.0.0
pip install mcp>=1.0.0

# Verify existing dependencies are installed
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Existing from Phase 2
DATABASE_URL=postgresql://user:password@host/database
JWT_SECRET=your-jwt-secret
JWT_ALGORITHM=HS256

# New for Phase 3
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 3. Run Database Migrations

```bash
# Create conversation and message tables
alembic revision --autogenerate -m "Add conversation and message tables"
alembic upgrade head
```

---

## Project Structure

After implementation, your backend structure will look like:

```
backend/
├── src/
│   ├── models/
│   │   ├── conversation.py      # NEW
│   │   └── message.py           # NEW
│   ├── mcp/
│   │   ├── server.py            # NEW
│   │   └── tools/               # NEW
│   │       ├── add_task.py
│   │       ├── list_tasks.py
│   │       ├── complete_task.py
│   │       ├── delete_task.py
│   │       └── update_task.py
│   ├── agent/
│   │   ├── runner.py            # NEW
│   │   └── config.py            # NEW
│   └── api/
│       └── routes/
│           └── chat.py          # NEW
└── tests/
    ├── unit/
    │   ├── test_mcp_tools.py    # NEW
    │   └── test_agent.py        # NEW
    └── integration/
        └── test_chat_api.py     # NEW
```

---

## Testing the Agent Locally

### Option 1: Interactive Python Shell

```python
import asyncio
from src.agent.runner import AgentRunner
from src.mcp.server import MCPServer
from src.database import get_db_session

async def test_agent():
    # Initialize components
    db = await get_db_session()
    mcp_server = MCPServer(db)
    agent_runner = AgentRunner(
        api_key="your-openai-api-key",
        mcp_tools=mcp_server.get_tools()
    )

    # Test user ID (use a real user from your database)
    user_id = "550e8400-e29b-41d4-a716-446655440000"

    # Test conversation
    conversation_history = []

    # Test 1: Add a task
    result = await agent_runner.run_agent(
        user_id=user_id,
        message="Add a task to buy groceries",
        history=conversation_history
    )
    print(f"Agent: {result['response']}")
    print(f"Tool calls: {result['tool_calls']}")

    # Update history
    conversation_history.append({"role": "user", "content": "Add a task to buy groceries"})
    conversation_history.append({"role": "assistant", "content": result['response']})

    # Test 2: List tasks
    result = await agent_runner.run_agent(
        user_id=user_id,
        message="Show me my tasks",
        history=conversation_history
    )
    print(f"Agent: {result['response']}")
    print(f"Tool calls: {result['tool_calls']}")

# Run the test
asyncio.run(test_agent())
```

### Option 2: cURL Commands (via API)

First, start the FastAPI server:

```bash
cd backend
uvicorn src.main:app --reload
```

Then test the chat endpoint:

```bash
# Get JWT token (use existing auth endpoint)
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.token')

# Create a new conversation
CONVERSATION_ID=$(curl -X POST http://localhost:8000/api/chat/conversations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Conversation"}' \
  | jq -r '.data.conversation_id')

# Send a message
curl -X POST http://localhost:8000/api/chat/message \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$CONVERSATION_ID\",
    \"message\": \"Add a task to buy groceries\"
  }" | jq

# Expected response:
# {
#   "success": true,
#   "data": {
#     "response": "I've added 'buy groceries' to your task list.",
#     "tool_calls": [
#       {
#         "tool": "add_task",
#         "parameters": {"user_id": "...", "title": "buy groceries"},
#         "result": {"task_id": "...", "title": "buy groceries", "created_at": "..."}
#       }
#     ]
#   }
# }
```

### Option 3: Pytest Tests

```bash
cd backend

# Run all agent tests
pytest tests/unit/test_agent.py -v

# Run specific test
pytest tests/unit/test_agent.py::test_agent_creates_task -v

# Run integration tests
pytest tests/integration/test_chat_api.py -v
```

---

## Testing Scenarios

### Scenario 1: Task Creation

**Input**: "I need to buy milk"

**Expected Behavior**:
1. Agent calls `add_task` with title="buy milk"
2. Tool creates task in database
3. Agent responds: "I've added 'buy milk' to your task list."

**Verification**:
```bash
# Check database
psql $DATABASE_URL -c "SELECT * FROM tasks WHERE title = 'buy milk';"
```

### Scenario 2: Task Listing

**Input**: "Show me my tasks"

**Expected Behavior**:
1. Agent calls `list_tasks` with user_id
2. Tool retrieves tasks from database
3. Agent responds with formatted list

**Verification**:
- Response includes all user's tasks
- Tasks are formatted clearly (numbered or bulleted)
- Count summary is included

### Scenario 3: Task Completion

**Input**: "I finished buying milk"

**Expected Behavior**:
1. Agent calls `list_tasks` to find "buy milk" task
2. Agent calls `complete_task` with task_id
3. Tool updates task.completed = true
4. Agent responds: "Great! I've marked 'buy milk' as complete."

**Verification**:
```bash
# Check database
psql $DATABASE_URL -c "SELECT * FROM tasks WHERE title = 'buy milk';"
# Should show completed = true
```

### Scenario 4: Ambiguous Request

**Input**: "Complete it"

**Expected Behavior**:
1. Agent recognizes ambiguity
2. Agent calls `list_tasks` to show options
3. Agent asks: "Which task would you like to mark as complete? You have: ..."

**Verification**:
- No tool calls to `complete_task`
- Response includes clarifying question
- Response lists available tasks

### Scenario 5: Error Handling

**Input**: "Delete 'write novel'"

**Expected Behavior**:
1. Agent calls `delete_task` with non-existent task
2. Tool returns TASK_NOT_FOUND error
3. Agent responds: "I couldn't find a task called 'write novel'. Would you like to see your current tasks?"

**Verification**:
- Error is handled gracefully
- No exception thrown
- User receives helpful message

---

## Debugging Tips

### Enable Debug Logging

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("agent")
logger.setLevel(logging.DEBUG)
```

### Inspect Tool Calls

```python
result = await agent_runner.run_agent(...)
print(json.dumps(result['tool_calls'], indent=2))
```

### Check Database State

```bash
# View conversations
psql $DATABASE_URL -c "SELECT * FROM conversations WHERE user_id = 'your-user-id';"

# View messages
psql $DATABASE_URL -c "SELECT * FROM messages WHERE conversation_id = 'your-conversation-id' ORDER BY created_at;"

# View tasks
psql $DATABASE_URL -c "SELECT * FROM tasks WHERE user_id = 'your-user-id';"
```

### Monitor OpenAI API Usage

```python
# Add callback to track API calls
def log_api_call(request, response):
    print(f"API Call: {request.model}, Tokens: {response.usage.total_tokens}")

agent_runner.client.on_request = log_api_call
```

---

## Common Issues and Solutions

### Issue 1: "OpenAI API key not found"

**Solution**: Ensure `OPENAI_API_KEY` is set in `.env` file and loaded:

```python
from dotenv import load_dotenv
load_dotenv()
```

### Issue 2: "Tool not found" error

**Solution**: Verify MCP tools are registered correctly:

```python
mcp_server = MCPServer(db)
tools = mcp_server.get_tools()
print([tool.name for tool in tools])
# Should print: ['add_task', 'list_tasks', 'complete_task', 'delete_task', 'update_task']
```

### Issue 3: "Database connection failed"

**Solution**: Check `DATABASE_URL` is correct and database is running:

```bash
psql $DATABASE_URL -c "SELECT 1;"
```

### Issue 4: Agent doesn't call tools

**Solution**: Check system prompt is loaded and tools are registered:

```python
print(agent.system_prompt)  # Should show full prompt
print(agent.tools)  # Should show all 5 tools
```

### Issue 5: "User not found" error

**Solution**: Ensure user exists in database:

```bash
psql $DATABASE_URL -c "SELECT id, email FROM users;"
```

---

## Performance Testing

### Load Test Script

```python
import asyncio
import time

async def load_test(num_requests: int):
    agent_runner = AgentRunner(...)
    user_id = "..."

    start = time.time()
    tasks = []

    for i in range(num_requests):
        task = agent_runner.run_agent(
            user_id=user_id,
            message=f"Add task {i}",
            history=[]
        )
        tasks.append(task)

    results = await asyncio.gather(*tasks)
    duration = time.time() - start

    print(f"Completed {num_requests} requests in {duration:.2f}s")
    print(f"Average: {duration/num_requests:.2f}s per request")

asyncio.run(load_test(10))
```

**Expected Performance**:
- <3 seconds per request (95th percentile)
- <10 seconds for task creation
- <5 seconds for task listing

---

## Next Steps

After verifying the agent works locally:

1. **Run Full Test Suite**: `pytest tests/ -v`
2. **Test User Isolation**: Verify users can only access their own tasks
3. **Test Error Scenarios**: Simulate database errors, API failures
4. **Deploy to Staging**: Test in staging environment
5. **Monitor Metrics**: Track tool success rates, response times
6. **Iterate on Prompts**: Refine system prompt based on testing

---

## Additional Resources

- **OpenAI Agents SDK Docs**: https://platform.openai.com/docs/agents
- **MCP SDK Docs**: https://modelcontextprotocol.io/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **SQLModel Docs**: https://sqlmodel.tiangolo.com/

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the contracts (mcp-tools.yaml, agent-config.yaml)
3. Inspect logs and database state
4. Consult the research.md for architecture decisions

---

**Last Updated**: 2026-02-08
**Version**: 1.0.0
