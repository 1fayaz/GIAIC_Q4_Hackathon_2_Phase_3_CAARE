---
id: 0001
title: Conversational Task Management Spec
stage: spec
date: 2026-02-08
surface: agent
model: claude-sonnet-4-5
feature: 004-ai-agent-mcp
branch: 004-ai-agent-mcp
user: Fayaz ALI
command: /sp.specify
labels: ["spec", "phase-3", "conversational-task-management", "ai-chatbot", "natural-language"]
links:
  spec: specs/004-ai-agent-mcp/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/004-ai-agent-mcp/spec.md
  - specs/004-ai-agent-mcp/checklists/requirements.md
tests:
  - none
---

## Prompt

```text
/sp.specify Phase 3 – Spec 4: AI Agent + MCP Server (Integrated with Backend API)

Target audience:
Backend & AI engineers implementing the intelligence layer that powers the ChatKit frontend.

Primary focus:
Design and implement the AI Agent using OpenAI Agents SDK and an MCP Server using the Official MCP SDK, ensuring the agent can be invoked by the FastAPI backend and return responses consumable by the frontend chat UI.

Scope includes:
- AI Agent logic and behavior
- MCP Server and tool definitions
- Integration contract between Agent ↔ FastAPI backend
- Agent readiness for frontend chat consumption

Success criteria:
- AI agent correctly interprets natural language todo commands
- Agent invokes MCP tools (add, list, update, complete, delete) accurately
- MCP tools are stateless and persist data in Neon PostgreSQL
- Agent can be invoked programmatically by FastAPI (no UI coupling)
- Agent responses are structured so FastAPI can forward them directly to the ChatKit frontend
- Tool calls made by the agent are surfaced in the backend response payload

Functional requirements:

AI Agent:
- Built using OpenAI Agents SDK
- Accepts:
  - Conversation history (messages fetched by backend)
  - Current user message
- Decides whether to:
  - Respond conversationally
  - Invoke one or more MCP tools
- Always produces a friendly, user-facing confirmation message
- Returns:
  - Final assistant response (string)
  - List of MCP tool calls executed (for transparency/debugging)

Agent behavior rules:
- Task creation → use add_task
- Task listing → use list_tasks
- Task completion → use complete_task
- Task deletion → use delete_task
- Task update → use update_task
- If task reference is ambiguous, ask a clarifying question
- Gracefully handle errors (task not found, invalid input)

MCP Server:
- Implemented using Official MCP SDK
- Exposes tools:
  - add_task
  - list_tasks
  - complete_task
  - delete_task
  - update_task
- Tools must:
  - Be stateless
  - Accept all required parameters explicitly
  - Persist and retrieve data via SQLModel + Neon PostgreSQL
- MCP server must be callable by the AI Agent runtime

Backend integration contract:
- AI Agent is invoked by FastAPI chat endpoint (e.g. POST /api/{user_id}/chat)
- Backend responsibilities (context only, not implemented here):
  - Fetch conversation history from database
  - Pass history + new message into agent
  - Receive agent response and tool calls
  - Return agent output to frontend
- Agent must NOT assume any HTTP, request, or frontend logic
- Agent output format must be backend-friendly and frontend-ready

Frontend awareness (explicit but indirect):
- Agent responses must be clear, concise, and conversational
- Responses should be suitable for direct rendering in ChatKit UI
- No markdown-heavy or system-level output
- Tool execution confirmations should be human-readable

Constraints:
- No frontend UI implementation
- No FastAPI endpoint implementation
- No authentication logic
- No database schema creation
- No long-term memory inside agent (stateless)
```

## Response snapshot

Created specification for Conversational Task Management feature (004-ai-agent-mcp).

**Initial Attempt (Failed Validation)**:
- Wrote spec focused on technical implementation (AI Agent, MCP Server, tools, integration contracts)
- Validation checklist identified critical issues: implementation details throughout, not written for business stakeholders, success criteria were technology-specific

**Iteration 2 (Passed Validation)**:
- Rewrote spec to focus on user value: "Conversational Task Management"
- Removed all technology references (OpenAI, MCP, FastAPI, SQLModel, etc.)
- Reframed requirements as user capabilities: "Users can create tasks through conversation"
- Made success criteria user-focused and measurable: "Users can create tasks in under 10 seconds"
- Maintained all mandatory sections with user-centric content

**Final Specification**:
- 5 user stories (P1: Create & View tasks, P2: Complete tasks, P3: Delete & Update tasks)
- 15 functional requirements focused on conversational understanding, task operations, error handling, context management
- 10 measurable success criteria (response time, success rates, user satisfaction)
- 6 assumptions, 3 dependencies, 9 out-of-scope items
- 6 edge cases documented

**Validation Results**: ✅ All checklist items passed on iteration 2

## Outcome

- ✅ Impact: Specification successfully created for conversational task management feature. Spec passed quality validation after rewrite to focus on user value rather than technical implementation. Ready for planning phase.
- 🧪 Tests: No tests at specification phase. Validation performed through quality checklist (14 criteria, all passed).
- 📁 Files: Created 2 files - spec.md (219 lines) and checklists/requirements.md (70 lines) in specs/004-ai-agent-mcp/
- 🔁 Next prompts: Ready for `/sp.plan` to translate user requirements into technical architecture (AI Agent + MCP Server implementation). Planning will define OpenAI Agents SDK configuration, MCP tool definitions, and integration contracts.
- 🧠 Reflection: This session demonstrated the importance of separating "what users need" (specification) from "how to build it" (planning). The initial spec was too implementation-focused because the user's input described technical components. The rewrite successfully abstracted to user value while preserving all functional requirements. The validation checklist caught the issue early, preventing downstream problems in planning and implementation.

## Evaluation notes (flywheel)

- Failure modes observed: Initial spec violated core principle "Focus on WHAT users need and WHY. Avoid HOW to implement." User input was implementation-focused (AI Agent + MCP Server), which led to implementation-focused spec. Validation checklist successfully caught this before proceeding to planning.
- Graders run and results (PASS/FAIL): FAIL (iteration 1) → PASS (iteration 2). Checklist validation identified 8 failing criteria in iteration 1, all resolved in iteration 2 through complete rewrite.
- Prompt variant (if applicable): Standard /sp.specify workflow. User provided implementation-focused description, which required translation to user-focused specification.
- Next experiment (smallest change to try): In future, when user input is implementation-focused, immediately reframe to user value before writing spec. Could add a pre-processing step: "I notice your description focuses on technical components. Let me reframe this as user capabilities before writing the spec." This would avoid the failed iteration and save time.
