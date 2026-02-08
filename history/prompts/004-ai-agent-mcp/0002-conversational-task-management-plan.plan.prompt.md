---
id: 0002
title: Conversational Task Management Plan
stage: plan
date: 2026-02-08
surface: agent
model: claude-sonnet-4-5
feature: 004-ai-agent-mcp
branch: 004-ai-agent-mcp
user: Fayaz ALI
command: /sp.plan
labels: ["plan", "phase-3", "ai-agent", "mcp-server", "openai-agents", "stateless-architecture"]
links:
  spec: specs/004-ai-agent-mcp/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/004-ai-agent-mcp/plan.md
  - specs/004-ai-agent-mcp/research.md
  - specs/004-ai-agent-mcp/data-model.md
  - specs/004-ai-agent-mcp/contracts/mcp-tools.yaml
  - specs/004-ai-agent-mcp/contracts/agent-config.yaml
  - specs/004-ai-agent-mcp/quickstart.md
tests:
  - none
---

## Prompt

```text
/sp.plan Phase 3 – Spec 4: AI Agent + MCP Server

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

Created comprehensive implementation plan for Conversational Task Management feature (004-ai-agent-mcp).

**Phase 0: Research (Completed)**
- Documented 6 key technology decisions
- OpenAI Agents SDK integration pattern: library within FastAPI (not separate service)
- MCP SDK implementation: Python module with async tool handlers
- Agent-to-tool communication: direct invocation via MCP SDK
- Conversation persistence: Neon PostgreSQL with user_id scoping
- Tool invocation logging: JSON in assistant messages
- Error handling: layered approach (tool → agent → API)

**Phase 1: Design (Completed)**
- Data model: 2 new entities (Conversation, Message) with SQLModel definitions
- MCP tools: 5 tool definitions with complete schemas (add_task, list_tasks, complete_task, delete_task, update_task)
- Agent configuration: comprehensive system prompt with behavior guidelines, response patterns, and examples
- Quickstart guide: developer testing guide with 3 testing options (Python shell, cURL, pytest)

**Constitution Check**
- ✅ All 9 core principles compliant
- ✅ All technology stack constraints followed
- ✅ All AI chatbot architecture standards met
- ✅ All MCP tool design standards met
- ✅ No violations to justify

**Project Structure**
- Backend: src/mcp/, src/agent/, src/models/ (conversation, message)
- Tests: unit/, integration/, security/
- Documentation: research.md, data-model.md, contracts/, quickstart.md

**Key Architectural Decisions**
- Stateless architecture: no in-memory state, all conversation history in database
- Tool isolation: AI agent operates exclusively through MCP tools, no direct DB access
- User ownership: enforced at tool level with user_id parameter
- Backward compatibility: Phase 2 REST APIs unchanged, additive only

## Outcome

- ✅ Impact: Implementation plan successfully created with complete research, design, and contracts. All constitutional principles validated. Ready for task breakdown phase.
- 🧪 Tests: No tests at planning phase. Testing strategy documented in quickstart.md with 7 test scenarios covering task creation, listing, completion, deletion, updates, ambiguity handling, and error recovery.
- 📁 Files: Created 6 files - plan.md (196 lines), research.md (450 lines), data-model.md (380 lines), contracts/mcp-tools.yaml (520 lines), contracts/agent-config.yaml (480 lines), quickstart.md (420 lines). Total: ~2,450 lines of planning documentation.
- 🔁 Next prompts: Ready for `/sp.tasks` to break implementation plan into atomic, testable tasks organized by user story priority (P1: create/view, P2: complete, P3: delete/update). Expected 6 task phases: Foundational, US1 (P1), US2 (P1), US3 (P2), US4 (P3), US5 (P3), Polish.
- 🧠 Reflection: This planning session successfully translated user-focused specification (conversational task management) into technical architecture (AI agent + MCP server). The research phase resolved all technology decisions upfront, preventing ambiguity during implementation. The design phase produced complete contracts that enable parallel development (MCP tools, agent configuration, database models). The stateless architecture with database-backed persistence aligns perfectly with Phase 3 constitutional principles while maintaining backward compatibility with Phase 2.

## Evaluation notes (flywheel)

- Failure modes observed: None. Planning workflow executed successfully with all phases completed (Phase 0: Research, Phase 1: Design, Constitution Check re-validation).
- Graders run and results (PASS/FAIL): PASS - Constitution Check validated all 9 core principles, technology stack constraints, AI chatbot architecture standards, and MCP tool design standards. No violations identified. All design decisions traceable to constitutional requirements.
- Prompt variant (if applicable): Standard /sp.plan workflow. User provided implementation-focused input (AI Agent + MCP Server), which was correctly translated into technical architecture while maintaining alignment with user-focused specification from /sp.specify.
- Next experiment (smallest change to try): During task breakdown (/sp.tasks), validate that foundational phase properly blocks all user story phases. Ensure MCP tool implementation tasks are assigned to fastapi-backend-architect agent, and agent configuration tasks are assigned to general-purpose agent. Monitor whether task dependencies correctly reflect the architecture (database migrations → MCP tools → agent runner → chat endpoints).
