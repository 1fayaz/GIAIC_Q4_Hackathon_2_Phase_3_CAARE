# Implementation Plan: Conversational Task Management

**Branch**: `004-ai-agent-mcp` | **Date**: 2026-02-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-ai-agent-mcp/spec.md`

## Summary

Enable users to manage tasks through natural conversation by implementing an AI agent powered by OpenAI Agents SDK that invokes stateless MCP tools for task operations. The agent interprets natural language commands, executes appropriate tools, and returns conversational responses suitable for the chat interface. All task operations are performed through MCP tools that enforce user ownership and persist data in Neon PostgreSQL.

## Technical Context

**Language/Version**: Python 3.11+ (backend/agent), TypeScript/JavaScript (frontend integration)
**Primary Dependencies**: OpenAI Agents SDK, Official MCP SDK, FastAPI 0.109+, SQLModel 0.0.14+, asyncpg 0.29+, python-dotenv 1.0+
**Storage**: Neon Serverless PostgreSQL (existing from Phase 2, extended with conversation tables)
**Testing**: pytest 7.4+ with pytest-asyncio for async testing
**Target Platform**: Linux server (backend), web browser (frontend)
**Project Type**: Web application (backend + frontend)
**Performance Goals**: <3 seconds response time for 95% of requests, <10 seconds for task creation, <5 seconds for task listing
**Constraints**: Stateless architecture (no in-memory state), all conversation history in database, AI agent must use MCP tools exclusively
**Scale/Scope**: Support existing user base (~10k users), handle conversational task management for 5 core operations (create, list, complete, delete, update)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Compliance

- [x] **I. Spec-Driven Development**: Specification created and approved (spec.md). All implementation decisions will be traceable to spec, plan, and tasks.

- [x] **II. End-to-End Correctness**: AI agent layer will integrate with existing backend (FastAPI), database (Neon PostgreSQL), and frontend (Next.js). MCP tool outputs will be deterministic and verifiable.

- [x] **III. Secure Multi-User Architecture**: AI agent will receive user identity from JWT-verified backend. MCP tools will enforce user ownership on all operations. No cross-user data access.

- [x] **IV. Separation of Concerns**: AI agent handles natural language understanding. MCP tools handle task operations. Backend handles authentication and conversation persistence. Frontend handles UI. No layer mixing.

- [x] **V. No Manual Coding**: All implementation via Claude Code agents (fastapi-backend-architect for MCP tools, general-purpose for agent configuration).

- [x] **VI. Incremental Delivery**: User stories prioritized P1 (create/view), P2 (complete), P3 (delete/update). Each story independently testable.

- [x] **VII. AI Agent Determinism and Tool Isolation**: Agent will operate exclusively through MCP tools. No direct database access. User context provided explicitly. Tool calls logged and auditable.

- [x] **VIII. MCP Tool Architecture**: Tools will be stateless, enforce user ownership, validate inputs, return structured outputs, handle errors gracefully. Tool definitions explicit and versioned.

- [x] **IX. Conversation State Persistence**: Conversation history persisted in Neon PostgreSQL. User-scoped conversations. Backend stateless between requests.

### Technology Stack Compliance

- [x] **Backend**: Python FastAPI (existing from Phase 2)
- [x] **ORM**: SQLModel (existing from Phase 2)
- [x] **Database**: Neon Serverless PostgreSQL (existing from Phase 2)
- [x] **Authentication**: Better Auth with JWT (existing from Phase 2)
- [x] **AI Agent Framework**: OpenAI Agents SDK (new for Phase 3)
- [x] **MCP Implementation**: Official MCP SDK (new for Phase 3)

### AI Chatbot Architecture Standards Compliance

- [x] **Stateless Backend with Persistent Memory**: Backend will not maintain in-memory conversation state. All history persisted in database. Each request loads context from database.

- [x] **Clear Separation of Concerns**: Frontend (chat UI), Backend API (auth, routing, persistence), AI Agent (NLU, intent detection, tool selection), MCP Tools (task operations), Database (storage).

- [x] **Deterministic Tool Operations**: AI agent operates exclusively through MCP tools. Tools are stateless and idempotent where possible. Tool invocations logged.

- [x] **Security Consistency**: AI chatbot endpoints use same JWT authentication as REST APIs. User identity derived from verified JWT. MCP tools enforce user ownership.

- [x] **Reproducible Agent Behavior**: Agent behavior follows explicit tool-use rules. Tool definitions complete and versioned. Same conversation history produces equivalent tool invocations.

- [x] **Backward Compatibility**: Phase 2 REST APIs remain fully functional. AI chatbot features are additive only. No breaking changes.

### MCP Tool Design Standards Compliance

- [x] **Tool Definition Requirements**: Tools follow verb-noun convention (add_task, list_tasks, etc.). Complete input/output schemas. Error cases documented. User context parameter. Version identifiers.

- [x] **Tool Implementation Requirements**: Stateless (no instance variables). Input validation. User ownership enforcement. Structured outputs. Graceful error handling. Invocation logging. Database transactions. Idempotency where applicable.

- [x] **Tool Security Requirements**: Accept user_id as explicit parameter. Verify user ownership before operations. Filter queries by user_id. Return 403 for unauthorized access. Validate user_id against JWT.

- [x] **Tool Testing Requirements**: Unit tests for validation. Integration tests with database. Security tests for user isolation. Error handling tests. Idempotency tests.

**Constitution Check Result**: ✅ PASSED - All principles and standards compliant. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/004-ai-agent-mcp/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (in progress)
├── research.md          # Phase 0 output (to be created)
├── data-model.md        # Phase 1 output (to be created)
├── quickstart.md        # Phase 1 output (to be created)
├── contracts/           # Phase 1 output (to be created)
│   ├── mcp-tools.yaml   # MCP tool definitions
│   └── agent-config.yaml # AI agent configuration
├── checklists/
│   └── requirements.md  # Spec quality checklist (completed)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

**Actual Project Structure** (verified from existing codebase):

```text
backend/
├── app/                         # Main application directory (NOT src/)
│   ├── core/
│   │   ├── auth.py              # Existing: JWT auth utilities
│   │   ├── config.py            # Existing: Settings management
│   │   ├── database.py          # Existing: Database connection
│   │   └── __init__.py
│   ├── dependencies/
│   │   ├── auth.py              # Existing: Auth dependencies
│   │   └── __init__.py
│   ├── models/
│   │   ├── task.py              # Existing from Phase 2
│   │   ├── user.py              # Existing from Phase 2
│   │   ├── conversation.py      # NEW: Conversation model
│   │   ├── message.py           # NEW: Message model
│   │   └── __init__.py
│   ├── routes/
│   │   ├── auth.py              # Existing: Auth endpoints
│   │   ├── tasks.py             # Existing: Task endpoints
│   │   ├── chat.py              # NEW: Chat endpoints
│   │   └── __init__.py
│   ├── schemas/
│   │   ├── auth.py              # Existing: Auth schemas
│   │   ├── task.py              # Existing: Task schemas
│   │   ├── response.py          # Existing: Response schemas
│   │   ├── chat.py              # NEW: Chat schemas
│   │   └── __init__.py
│   ├── services/
│   │   ├── conversation_service.py # NEW: Conversation management
│   │   └── __init__.py
│   ├── mcp/                     # NEW: MCP module
│   │   ├── __init__.py
│   │   ├── server.py            # NEW: MCP server implementation
│   │   └── tools/               # NEW: MCP tool implementations
│   │       ├── __init__.py
│   │       ├── add_task.py
│   │       ├── list_tasks.py
│   │       ├── complete_task.py
│   │       ├── delete_task.py
│   │       └── update_task.py
│   ├── agent/                   # NEW: Agent module
│   │   ├── __init__.py
│   │   ├── runner.py            # NEW: Agent runner/orchestrator
│   │   └── config.py            # NEW: Agent configuration
│   └── main.py                  # Existing: FastAPI app initialization
├── migrations/
│   ├── run_migration.py         # Existing: Migration runner
│   └── check_tasks_data.py      # Existing: Data verification
└── tests/                       # NEW: Test directory
    ├── unit/
    │   ├── test_mcp_tools.py    # NEW: MCP tool unit tests
    │   └── test_agent.py        # NEW: Agent unit tests
    ├── integration/
    │   ├── test_chat_api.py     # NEW: Chat API integration tests
    │   └── test_agent_tools.py  # NEW: Agent + tools integration tests
    └── security/
        └── test_tool_isolation.py # NEW: User isolation security tests

frontend/
├── app/                         # Next.js App Router directory
│   ├── (auth)/                  # Existing: Auth route group
│   ├── (dashboard)/             # Existing: Dashboard route group
│   └── chat/                    # NEW: Chat route (separate spec)
├── components/
│   ├── auth/                    # Existing: Auth components
│   ├── tasks/                   # Existing: Task components
│   ├── ui/                      # Existing: UI components
│   └── chat/                    # NEW: Chat UI components (separate spec)
├── hooks/                       # Existing: React hooks
├── lib/                         # Existing: Utility libraries
│   └── chat-api.ts              # NEW: Chat API client (separate spec)
└── middleware.ts                # Existing: Next.js middleware
```

**Structure Decision**: Web application structure with existing Phase 2 foundation. Backend uses `app/` directory (not `src/`). Frontend uses Next.js 16+ App Router with route groups. This feature adds:
- Backend: `app/mcp/`, `app/agent/`, new models (conversation, message), new routes (chat)
- Frontend: Chat UI components and API client (handled by separate spec)
- Tests: Comprehensive test suite for MCP tools, agent, and integration

**Key Path Adjustments**:
- All backend code in `backend/app/` (not `backend/src/`)
- Frontend uses App Router with route groups `(auth)` and `(dashboard)`
- Services directory exists but currently empty (will add conversation_service.py)

## Complexity Tracking

> **No violations to justify** - All constitution principles and standards are followed.

---

## Phase 0: Research & Technology Decisions

**Status**: ✅ COMPLETED

**Research Tasks**:
1. ✅ OpenAI Agents SDK integration patterns
2. ✅ Official MCP SDK implementation patterns
3. ✅ Agent-to-MCP-tool communication architecture
4. ✅ Conversation state management in stateless backend
5. ✅ Tool invocation logging and auditability
6. ✅ Error handling patterns for AI agent failures

**Output**: `research.md` with all technology decisions documented

**Key Decisions**:
- OpenAI Agents SDK integrated as library within FastAPI (not separate service)
- MCP server implemented as Python module with async tool handlers
- Agent invokes tools directly via MCP SDK (no HTTP layer)
- Conversations persisted in Neon PostgreSQL with user_id foreign key
- Tool calls logged as JSON in assistant messages
- Layered error handling (tool → agent → API) with user-friendly messages

---

## Phase 1: Design & Contracts

**Status**: ✅ COMPLETED

**Deliverables**:
1. ✅ `data-model.md` - Conversation and message entities with SQLModel definitions
2. ✅ `contracts/mcp-tools.yaml` - 5 MCP tool definitions (add, list, complete, delete, update)
3. ✅ `contracts/agent-config.yaml` - AI agent system prompt, behavior guidelines, tool registry
4. ✅ `quickstart.md` - Developer guide with testing scenarios and debugging tips

**Output**: Complete design artifacts ready for task breakdown

**Design Highlights**:
- Two new entities: Conversation (1:N with User) and Message (1:N with Conversation)
- Five MCP tools with complete input/output schemas and error cases
- Comprehensive system prompt with response patterns and behavior rules
- Testing scenarios covering task creation, listing, completion, deletion, updates
- Quickstart guide with local testing options (Python shell, cURL, pytest)

---

## Constitution Check Re-Validation

**Status**: ✅ PASSED (Post-Design)

All design decisions comply with constitutional principles:
- ✅ Stateless architecture maintained (no in-memory state)
- ✅ User data isolation enforced at tool level
- ✅ AI agent operates exclusively through MCP tools
- ✅ Conversation history persisted in database
- ✅ Tool definitions explicit and versioned
- ✅ Backward compatibility preserved (Phase 2 APIs unchanged)

---

## Next Steps

**Planning Complete** ✅

Ready for `/sp.tasks` to break implementation plan into atomic, testable tasks organized by user story priority (P1, P2, P3).

**Expected Task Phases**:
1. **Foundational**: Database migrations, MCP server setup, agent runner
2. **User Story 1 (P1)**: Task creation and listing via conversation
3. **User Story 2 (P2)**: Task completion via conversation
4. **User Story 3 (P3)**: Task deletion via conversation
5. **User Story 4 (P3)**: Task updates via conversation
6. **Polish**: Testing, documentation, validation
