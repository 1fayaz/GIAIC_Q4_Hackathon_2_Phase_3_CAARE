# Tasks: Conversational Task Management

**Input**: Design documents from `/specs/004-ai-agent-mcp/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are NOT requested in the specification, so no test tasks are included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Backend: `backend/app/` (verified actual structure)
- Frontend: `frontend/` (separate spec - not included here)
- This spec focuses on backend intelligence layer (AI agent + MCP server)

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Install dependencies and prepare environment for Phase 3 development

- [x] T001 Install OpenAI Agents SDK in backend/requirements.txt (add openai>=1.0.0)
- [x] T002 Install Official MCP SDK in backend/requirements.txt (add mcp>=1.0.0)
- [x] T003 Add OPENAI_API_KEY to backend/.env.example with placeholder value
- [x] T004 Update backend/README.md with Phase 3 setup instructions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create Conversation model in backend/app/models/conversation.py with SQLModel definition
- [x] T006 Create Message model in backend/app/models/message.py with SQLModel definition
- [x] T007 Create database migration script in backend/migrations/ to add conversations and messages tables
- [x] T008 Run migration to create conversations and messages tables in Neon PostgreSQL
- [x] T009 Create MCP module directory structure: backend/app/mcp/__init__.py and backend/app/mcp/tools/__init__.py
- [x] T010 Create Agent module directory structure: backend/app/agent/__init__.py
- [x] T011 Create chat schemas in backend/app/schemas/chat.py with request/response models
- [x] T012 Create conversation service in backend/app/services/conversation_service.py with CRUD operations

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Stories 1 & 2 (P1) - Create and View Tasks via Conversation 🎯 MVP

**Goal**: Enable users to create and view tasks through natural language conversation

**Independent Test**: User can type "Add task to buy groceries" and "Show me my tasks" and see the task created and listed

### Implementation for User Stories 1 & 2

- [x] T013 [P] [US1] Implement add_task MCP tool in backend/app/mcp/tools/add_task.py with user_id validation
- [x] T014 [P] [US2] Implement list_tasks MCP tool in backend/app/mcp/tools/list_tasks.py with user_id filtering
- [x] T015 [US1,US2] Create MCP server in backend/app/mcp/server.py and register add_task and list_tasks tools
- [x] T016 [US1,US2] Create agent configuration in backend/app/agent/config.py with system prompt for task creation and listing
- [x] T017 [US1,US2] Create agent runner in backend/app/agent/runner.py to orchestrate tool invocations
- [x] T018 [US1,US2] Create chat routes in backend/app/routes/chat.py with POST /api/chat/message endpoint
- [x] T019 [US1,US2] Add conversation management endpoints in backend/app/routes/chat.py (create, list, get, delete conversations)
- [x] T020 [US1,US2] Update backend/app/main.py to register chat router
- [x] T021 [US1,US2] Update backend/app/models/__init__.py to export Conversation and Message models

**Checkpoint**: At this point, User Stories 1 & 2 should be fully functional and testable independently. Users can create and view tasks through conversation.

---

## Phase 4: User Story 3 (P2) - Complete Tasks via Conversation

**Goal**: Enable users to mark tasks as complete through natural language

**Independent Test**: User can type "I finished buying groceries" and see the task marked as complete

### Implementation for User Story 3

- [x] T022 [US3] Implement complete_task MCP tool in backend/app/mcp/tools/complete_task.py with user_id and task_id validation
- [x] T023 [US3] Register complete_task tool in backend/app/mcp/server.py
- [x] T024 [US3] Update agent configuration in backend/app/agent/config.py to add task completion behavior rules

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently. Users can create, view, and complete tasks.

---

## Phase 5: User Story 4 (P3) - Delete Tasks via Conversation

**Goal**: Enable users to delete tasks through natural language

**Independent Test**: User can type "Delete buy groceries" and see the task removed from their list

### Implementation for User Story 4

- [x] T025 [US4] Implement delete_task MCP tool in backend/app/mcp/tools/delete_task.py with user_id and task_id validation
- [x] T026 [US4] Register delete_task tool in backend/app/mcp/server.py
- [x] T027 [US4] Update agent configuration in backend/app/agent/config.py to add task deletion behavior rules

**Checkpoint**: At this point, User Stories 1-4 should all work independently. Users can create, view, complete, and delete tasks.

---

## Phase 6: User Story 5 (P3) - Update Tasks via Conversation

**Goal**: Enable users to modify task details through natural language

**Independent Test**: User can type "Change buy groceries to buy groceries and milk" and see the task updated

### Implementation for User Story 5

- [x] T028 [US5] Implement update_task MCP tool in backend/app/mcp/tools/update_task.py with user_id, task_id, and field validation
- [x] T029 [US5] Register update_task tool in backend/app/mcp/server.py
- [x] T030 [US5] Update agent configuration in backend/app/agent/config.py to add task update behavior rules

**Checkpoint**: All user stories should now be independently functional. Full conversational task management is complete.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T031 Add comprehensive error handling to all MCP tools in backend/app/mcp/tools/
- [x] T032 Add tool invocation logging to backend/app/agent/runner.py
- [x] T033 Update backend/app/main.py to add chat endpoints to OpenAPI documentation
- [x] T034 Create developer quickstart validation script based on specs/004-ai-agent-mcp/quickstart.md
- [x] T035 Update backend/README.md with Phase 3 API documentation and examples

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Stories 1 & 2 (P1): Can start after Foundational (Phase 2) - No dependencies on other stories
  - User Story 3 (P2): Can start after Foundational (Phase 2) - No dependencies on other stories (independently testable)
  - User Story 4 (P3): Can start after Foundational (Phase 2) - No dependencies on other stories (independently testable)
  - User Story 5 (P3): Can start after Foundational (Phase 2) - No dependencies on other stories (independently testable)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Stories 1 & 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independently testable (can complete tasks that were created via REST API or conversation)
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Independently testable (can delete tasks that were created via REST API or conversation)
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Independently testable (can update tasks that were created via REST API or conversation)

### Within Each User Story

- MCP tools can be implemented in parallel (marked with [P])
- MCP server registration depends on tool implementation
- Agent configuration depends on MCP server setup
- Chat endpoints depend on agent runner being ready

### Parallel Opportunities

- All Setup tasks (T001-T004) can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- MCP tools within a story marked [P] can run in parallel (T013 and T014 in Phase 3)

---

## Parallel Example: User Stories 1 & 2

```bash
# Launch MCP tools in parallel:
Task: "Implement add_task MCP tool in backend/app/mcp/tools/add_task.py"
Task: "Implement list_tasks MCP tool in backend/app/mcp/tools/list_tasks.py"

# Then sequentially:
Task: "Create MCP server and register tools"
Task: "Create agent configuration"
Task: "Create agent runner"
Task: "Create chat routes"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Stories 1 & 2 (create and view tasks)
4. **STOP and VALIDATE**: Test conversational task creation and viewing independently
5. Deploy/demo if ready

**MVP Deliverable**: Users can create and view tasks through natural conversation. This demonstrates the core value proposition.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Stories 1 & 2 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 3 → Test independently → Deploy/Demo
4. Add User Story 4 → Test independently → Deploy/Demo
5. Add User Story 5 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Stories 1 & 2 (create/view)
   - Developer B: User Story 3 (complete)
   - Developer C: User Story 4 (delete)
   - Developer D: User Story 5 (update)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Backend uses `backend/app/` directory (verified actual structure)
- Frontend chat UI is handled by separate spec (not included here)
- Tests are NOT included (not requested in specification)

---

## Task Count Summary

- **Total Tasks**: 35
- **Setup**: 4 tasks
- **Foundational**: 8 tasks (blocks all user stories)
- **User Stories 1 & 2 (P1)**: 9 tasks
- **User Story 3 (P2)**: 3 tasks
- **User Story 4 (P3)**: 3 tasks
- **User Story 5 (P3)**: 3 tasks
- **Polish**: 5 tasks

**Parallel Opportunities**: 2 tasks in Setup, 0 in Foundational (sequential dependencies), 2 in User Stories 1 & 2

**MVP Scope**: Phases 1-3 (21 tasks) delivers create and view tasks via conversation
