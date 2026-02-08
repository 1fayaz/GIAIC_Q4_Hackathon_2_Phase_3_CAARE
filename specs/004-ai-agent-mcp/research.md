# Research: Conversational Task Management

**Feature**: 004-ai-agent-mcp
**Date**: 2026-02-08
**Purpose**: Document technology decisions and implementation patterns for AI agent + MCP server

## Research Questions & Decisions

### 1. OpenAI Agents SDK Integration Patterns

**Question**: How should we integrate OpenAI Agents SDK with FastAPI backend?

**Decision**: Use OpenAI Agents SDK as a library within FastAPI application, not as a separate service.

**Rationale**:
- Simplifies deployment (single backend service)
- Reduces latency (no inter-service communication)
- Easier to manage user context and authentication
- Aligns with stateless architecture (agent instantiated per request)

**Implementation Pattern**:
```python
# backend/src/agent/runner.py
from openai import OpenAI
from openai.agents import Agent

class AgentRunner:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    async def run_agent(self, user_id: str, message: str, history: list) -> dict:
        # Instantiate agent per request (stateless)
        agent = Agent(
            client=self.client,
            tools=self.get_mcp_tools(user_id),
            system_prompt=self.get_system_prompt()
        )

        # Run agent with conversation history
        response = await agent.run(message, history)

        return {
            "response": response.message,
            "tool_calls": response.tool_calls
        }
```

**Alternatives Considered**:
- Separate agent service: Rejected due to added complexity and latency
- Agent as serverless function: Rejected due to cold start issues and state management complexity

---

### 2. Official MCP SDK Implementation Patterns

**Question**: How should we structure MCP server and tools?

**Decision**: Implement MCP server as a Python module within backend, with tools as individual async functions.

**Rationale**:
- MCP SDK provides Python bindings for tool definitions
- Tools can directly access database via SQLModel
- Async functions align with FastAPI's async architecture
- Easy to test tools independently

**Implementation Pattern**:
```python
# backend/src/mcp/server.py
from mcp import Server, Tool

class MCPServer:
    def __init__(self, db_session):
        self.db = db_session
        self.server = Server()
        self.register_tools()

    def register_tools(self):
        self.server.add_tool(Tool(
            name="add_task",
            description="Create a new task for the user",
            parameters={
                "user_id": {"type": "string", "required": True},
                "title": {"type": "string", "required": True},
                "description": {"type": "string", "required": False}
            },
            handler=self.add_task_handler
        ))
        # ... register other tools

    async def add_task_handler(self, user_id: str, title: str, description: str = None):
        # Tool implementation
        pass
```

**Alternatives Considered**:
- Separate MCP server process: Rejected due to added deployment complexity
- REST API for tools: Rejected as MCP SDK provides better type safety and validation

---

### 3. Agent-to-MCP-Tool Communication Architecture

**Question**: How should the AI agent invoke MCP tools?

**Decision**: Agent registers MCP tools as callable functions, invokes them directly via MCP SDK.

**Rationale**:
- MCP SDK handles tool invocation protocol
- Type-safe tool calls with schema validation
- Tool results automatically formatted for agent consumption
- Supports tool call logging and debugging

**Architecture**:
```
User Request → FastAPI Endpoint → Agent Runner
                                      ↓
                                  OpenAI Agent
                                      ↓
                                  MCP Tool Registry
                                      ↓
                                  MCP Tool Handler
                                      ↓
                                  Database (SQLModel)
```

**Data Flow**:
1. FastAPI receives chat message + user_id (from JWT)
2. Agent Runner loads conversation history from database
3. Agent Runner instantiates OpenAI Agent with MCP tools
4. Agent processes message and decides which tools to call
5. MCP tools execute with user_id parameter
6. Tool results returned to agent
7. Agent generates response message
8. Response + tool_calls returned to FastAPI
9. FastAPI persists conversation and returns to frontend

**Alternatives Considered**:
- HTTP-based tool invocation: Rejected due to added latency and complexity
- Direct database access by agent: Rejected as it violates tool isolation principle

---

### 4. Conversation State Management in Stateless Backend

**Question**: How should we persist and retrieve conversation history?

**Decision**: Store conversations and messages in Neon PostgreSQL with user_id foreign key.

**Rationale**:
- Aligns with existing Phase 2 architecture (all data in Neon)
- Enables conversation history queries and analytics
- Supports multi-device access (conversations sync across devices)
- Stateless backend (no in-memory session storage)

**Data Model**:
```python
# Conversation: Container for a chat session
class Conversation(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    title: str | None = None  # Optional: first message or AI-generated summary

# Message: Individual message in conversation
class Message(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    conversation_id: UUID = Field(foreign_key="conversation.id")
    role: str  # "user" or "assistant"
    content: str
    tool_calls: str | None = None  # JSON string of tool calls (for assistant messages)
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

**Retrieval Pattern**:
```python
async def get_conversation_history(conversation_id: UUID, user_id: UUID) -> list:
    # Verify ownership
    conversation = await db.get(Conversation, conversation_id)
    if conversation.user_id != user_id:
        raise HTTPException(status_code=403)

    # Load messages
    messages = await db.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )

    return [{"role": m.role, "content": m.content} for m in messages]
```

**Alternatives Considered**:
- Redis for conversation cache: Rejected as it adds complexity and doesn't align with stateless principle
- In-memory session storage: Rejected as it violates stateless architecture requirement

---

### 5. Tool Invocation Logging and Auditability

**Question**: How should we log tool invocations for debugging and auditing?

**Decision**: Store tool_calls as JSON in assistant messages, with optional separate audit log table.

**Rationale**:
- Tool calls embedded in messages provide conversation context
- JSON format allows structured querying
- Separate audit log enables security analysis without affecting conversation storage
- Supports debugging (can replay tool calls)

**Logging Pattern**:
```python
# Store tool calls in message
assistant_message = Message(
    conversation_id=conversation_id,
    role="assistant",
    content=agent_response.message,
    tool_calls=json.dumps([
        {
            "tool": "add_task",
            "parameters": {"user_id": user_id, "title": "Buy groceries"},
            "result": {"task_id": "123", "created_at": "2026-02-08T10:00:00Z"},
            "timestamp": "2026-02-08T10:00:00Z"
        }
    ])
)

# Optional: Separate audit log for security analysis
class ToolInvocationLog(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id")
    tool_name: str
    parameters: str  # JSON
    result: str  # JSON
    success: bool
    error: str | None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
```

**Alternatives Considered**:
- External logging service: Rejected as it adds dependency and complexity
- File-based logs: Rejected as they're harder to query and don't support user-scoped access

---

### 6. Error Handling Patterns for AI Agent Failures

**Question**: How should we handle errors from agent, tools, or external services?

**Decision**: Implement layered error handling with user-friendly messages at each level.

**Rationale**:
- Users should never see technical errors or stack traces
- Different error types require different handling strategies
- Agent should be able to recover from tool failures
- Backend should catch all unhandled errors

**Error Handling Layers**:

**Layer 1: Tool-Level Errors**
```python
async def add_task_handler(user_id: str, title: str, description: str = None):
    try:
        # Validate inputs
        if not title or len(title) > 200:
            return {"error": "INVALID_INPUT", "message": "Task title must be 1-200 characters"}

        # Execute operation
        task = await create_task(user_id, title, description)
        return {"task_id": str(task.id), "title": task.title}

    except DatabaseError as e:
        logger.error(f"Database error in add_task: {e}")
        return {"error": "DATABASE_ERROR", "message": "Unable to save task. Please try again."}

    except Exception as e:
        logger.error(f"Unexpected error in add_task: {e}")
        return {"error": "INTERNAL_ERROR", "message": "An error occurred. Please try again."}
```

**Layer 2: Agent-Level Errors**
```python
async def run_agent(user_id: str, message: str, history: list) -> dict:
    try:
        agent = Agent(...)
        response = await agent.run(message, history)
        return {"response": response.message, "tool_calls": response.tool_calls}

    except OpenAIError as e:
        logger.error(f"OpenAI API error: {e}")
        return {
            "response": "I'm having trouble processing your request right now. Please try again in a moment.",
            "tool_calls": [],
            "error": "AGENT_ERROR"
        }

    except Exception as e:
        logger.error(f"Unexpected agent error: {e}")
        return {
            "response": "Something went wrong. Please try again.",
            "tool_calls": [],
            "error": "INTERNAL_ERROR"
        }
```

**Layer 3: API-Level Errors**
```python
@router.post("/chat/message")
async def send_message(request: ChatRequest, user_id: UUID = Depends(get_current_user)):
    try:
        # Load conversation
        history = await get_conversation_history(request.conversation_id, user_id)

        # Run agent
        result = await agent_runner.run_agent(user_id, request.message, history)

        # Persist conversation
        await save_message(request.conversation_id, "user", request.message)
        await save_message(request.conversation_id, "assistant", result["response"], result["tool_calls"])

        return {"success": True, "data": result}

    except HTTPException:
        raise  # Re-raise HTTP exceptions (403, 404, etc.)

    except Exception as e:
        logger.error(f"Chat API error: {e}")
        return {
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "Unable to process your message. Please try again."
            }
        }
```

**Error Recovery Strategy**:
- Tool errors: Agent receives error message and can retry or ask user for clarification
- Agent errors: Return friendly message to user, log for debugging
- API errors: Return error response to frontend, frontend shows user-friendly message

**Alternatives Considered**:
- Retry logic for all errors: Rejected as some errors (validation, authorization) shouldn't be retried
- Exposing technical errors to users: Rejected as it violates user experience requirements

---

## Technology Stack Summary

**Confirmed Technologies**:
- **AI Agent**: OpenAI Agents SDK (integrated as library in FastAPI)
- **MCP Server**: Official MCP SDK (Python module in backend)
- **Database**: Neon Serverless PostgreSQL (existing + new conversation tables)
- **ORM**: SQLModel (existing, extended for conversation models)
- **Backend**: FastAPI (existing, extended with chat endpoints)
- **Testing**: pytest + pytest-asyncio (existing)

**New Dependencies**:
- `openai>=1.0.0` - OpenAI Agents SDK
- `mcp>=1.0.0` - Official MCP SDK
- No additional infrastructure required (all runs in existing FastAPI backend)

**Environment Variables**:
- `OPENAI_API_KEY` - OpenAI API key for agent
- Existing: `DATABASE_URL`, `JWT_SECRET`, etc.

---

## Implementation Risks & Mitigations

**Risk 1: OpenAI API Rate Limits**
- **Mitigation**: Implement request queuing and rate limiting at backend level
- **Fallback**: Return friendly error message if rate limit hit

**Risk 2: Agent Produces Incorrect Tool Calls**
- **Mitigation**: Tool validation catches invalid parameters, returns error to agent
- **Fallback**: Agent can retry with corrected parameters or ask user for clarification

**Risk 3: Conversation History Grows Large**
- **Mitigation**: Limit conversation history to last N messages (e.g., 50) when passing to agent
- **Fallback**: Implement conversation summarization for very long conversations

**Risk 4: Database Connection Pool Exhaustion**
- **Mitigation**: Use existing Neon connection pooling configuration
- **Fallback**: Implement connection retry logic with exponential backoff

**Risk 5: Tool Execution Takes Too Long**
- **Mitigation**: Set timeout on tool execution (e.g., 5 seconds per tool)
- **Fallback**: Return timeout error to agent, agent informs user

---

## Next Steps

Phase 0 research complete. Ready to proceed to Phase 1: Design (data-model.md, contracts/, quickstart.md).
