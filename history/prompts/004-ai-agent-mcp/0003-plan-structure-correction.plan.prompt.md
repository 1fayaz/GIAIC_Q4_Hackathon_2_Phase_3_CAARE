---
id: 0003
title: Plan Structure Correction
stage: plan
date: 2026-02-08
surface: agent
model: claude-sonnet-4-5
feature: 004-ai-agent-mcp
branch: 004-ai-agent-mcp
user: Fayaz ALI
command: /sp.plan
labels: ["plan", "structure-correction", "verification", "phase-3"]
links:
  spec: specs/004-ai-agent-mcp/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/004-ai-agent-mcp/plan.md
tests:
  - none
---

## Prompt

```text
first check the frontend and backend folders after then update plan /sp.plan Phase 3 – Spec 4: AI Agent + MCP Server

1. Define MCP Tools
   - add_task, list_tasks, update_task, complete_task, delete_task
   - Stateless inputs, clear schemas, DB-backed via SQLModel + Neon

2. Implement MCP Server
   - Use Official MCP SDK
   - Connect tools to database and handle errors

3. Build AI Agent
   - OpenAI Agents SDK
   - Register MCP tools
   - Map natural language → correct tool calls
   - Confirm actions in responses

4. Backend ↔ Frontend Integration
   - Agent returns ChatKit-ready responses
   - Include tool_calls metadata
   - Stateless per request

5. Validate
   - Test common task commands
   - Verify correct tool invocation and responses

Deliverable:
- Stateless AI Agent + MCP Server fully usable by FastAPI and frontend
```

## Response snapshot

Verified actual project structure and corrected plan.md to reflect existing Phase 2 implementation.

**Structure Verification**:
- Backend uses `backend/app/` directory (NOT `backend/src/`)
- Frontend uses Next.js App Router with route groups: `(auth)`, `(dashboard)`
- Existing structure includes: core/, dependencies/, models/, routes/, schemas/, services/
- Main FastAPI app in `backend/app/main.py`

**Key Corrections Made**:
1. Changed all references from `backend/src/` to `backend/app/`
2. Updated directory structure to match actual layout
3. Noted existing Phase 2 components: auth.py, tasks.py, user.py, task.py
4. Identified correct locations for new Phase 3 components:
   - `app/mcp/` for MCP server and tools
   - `app/agent/` for agent runner and config
   - `app/models/conversation.py` and `app/models/message.py` for new models
   - `app/routes/chat.py` for chat endpoints
   - `app/schemas/chat.py` for chat schemas
   - `app/services/conversation_service.py` for conversation management

**Frontend Structure Verified**:
- Uses App Router with route groups (not Pages Router)
- Existing components in `components/auth/`, `components/tasks/`, `components/ui/`
- Hooks directory exists
- Lib directory for utilities
- Middleware.ts for Next.js middleware

**No Changes to Research/Design**:
- research.md remains valid (architecture decisions are path-agnostic)
- data-model.md remains valid (SQLModel definitions are path-agnostic)
- contracts/ remain valid (tool definitions and agent config are path-agnostic)
- quickstart.md remains valid (testing approaches are path-agnostic)

## Outcome

- ✅ Impact: Plan corrected to reflect actual project structure. All file paths updated from `backend/src/` to `backend/app/`. Structure now matches existing Phase 2 implementation, ensuring smooth integration.
- 🧪 Tests: No tests affected. Test structure remains valid (tests/ directory at backend root).
- 📁 Files: Modified 1 file - plan.md (updated Project Structure section with actual paths).
- 🔁 Next prompts: Ready for `/sp.tasks` with correct file paths. Tasks will reference `backend/app/` for all backend implementation.
- 🧠 Reflection: This correction was essential before task breakdown. Using incorrect paths (`src/`) would have caused confusion during implementation. Verifying actual structure ensures tasks reference correct locations. The Phase 2 implementation uses `app/` directory, which is a valid FastAPI convention (alternative to `src/`). All design artifacts remain valid as they focus on architecture, not specific paths.

## Evaluation notes (flywheel)

- Failure modes observed: Initial plan assumed `src/` directory based on common convention, but actual project uses `app/` directory. This highlights importance of verifying existing structure before planning.
- Graders run and results (PASS/FAIL): PASS - Structure verification completed successfully. All paths corrected to match actual implementation.
- Prompt variant (if applicable): User explicitly requested structure verification before proceeding ("first check the frontend and backend folders after then update plan"). This proactive verification prevented downstream issues.
- Next experiment (smallest change to try): In future planning sessions, always verify existing project structure first before generating file paths. Could add a mandatory verification step to /sp.plan workflow: "Phase -1: Structure Verification" that runs before Phase 0 Research.
