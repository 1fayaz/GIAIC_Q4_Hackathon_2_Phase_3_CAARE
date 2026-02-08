# Tasks: Backend & Database Foundation

**Input**: Design documents from `/specs/001-backend-foundation/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are NOT included in this task list as they were not explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/app/` for application code
- **Tests**: `backend/tests/` (not included in this phase)
- All paths relative to repository root

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize project structure and dependencies

- [x] T001 Create backend directory structure (backend/app/ with subdirectories: core/, models/, schemas/, routes/, services/)
- [x] T002 Create Python package markers (__init__.py) in backend/app/, backend/app/core/, backend/app/models/, backend/app/schemas/, backend/app/routes/, backend/app/services/
- [x] T003 Create requirements.txt in backend/ with dependencies: fastapi==0.109.0, uvicorn[standard]==0.27.0, sqlmodel==0.0.14, asyncpg==0.29.0, python-dotenv==1.0.0, pydantic==2.5.0, pytest==8.0.0, pytest-asyncio==0.23.0, httpx==0.26.0
- [x] T004 Create .env.example in backend/ with DATABASE_URL placeholder and CORS_ORIGINS configuration
- [x] T005 Create .gitignore in backend/ to exclude .env, __pycache__/, *.pyc, venv/, .pytest_cache/
- [x] T006 Create README.md in backend/ with setup instructions referencing quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 [P] Implement configuration management in backend/app/core/config.py (load DATABASE_URL from environment, Pydantic BaseSettings)
- [x] T008 [P] Implement database engine and session management in backend/app/core/database.py (create_async_engine with asyncpg, async session factory, connection pooling configuration)
- [x] T009 Create Task SQLModel in backend/app/models/task.py (7 fields: id UUID, user_id str, title str, description Optional[str], completed bool, created_at datetime, updated_at datetime with Field constraints per data-model.md)
- [x] T010 [P] Create Pydantic request schemas in backend/app/schemas/task.py (TaskCreate with title and description, TaskUpdate with optional fields)
- [x] T011 [P] Create Pydantic response schema in backend/app/schemas/task.py (TaskResponse with all Task fields, Config.from_attributes=True)
- [x] T012 Initialize FastAPI application in backend/app/main.py (create app instance, configure CORS middleware, add startup event to create tables)
- [x] T013 Create database dependency function in backend/app/core/database.py (get_session async generator for dependency injection)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Basic Task Management (Priority: P1) 🎯 MVP

**Goal**: Enable creating and retrieving tasks for users

**Independent Test**: Create tasks via POST /api/{user_id}/tasks and retrieve them via GET /api/{user_id}/tasks using Swagger UI at http://localhost:8000/docs

### Implementation for User Story 1

- [x] T014 [US1] Create tasks router in backend/app/routes/tasks.py (APIRouter with prefix="/api/{user_id}/tasks", tags=["tasks"])
- [x] T015 [US1] Implement POST /api/{user_id}/tasks endpoint in backend/app/routes/tasks.py (create task, auto-generate id and timestamps, filter by user_id, return 201 with TaskResponse)
- [x] T016 [US1] Implement GET /api/{user_id}/tasks endpoint in backend/app/routes/tasks.py (list all tasks filtered by user_id, order by created_at desc, return 200 with list of TaskResponse)
- [x] T017 [US1] Implement GET /api/{user_id}/tasks/{task_id} endpoint in backend/app/routes/tasks.py (get single task filtered by user_id and task_id, return 200 with TaskResponse or 404 if not found)
- [x] T018 [US1] Register tasks router in backend/app/main.py (app.include_router for tasks router)
- [x] T019 [US1] Add user_id filtering validation in backend/app/routes/tasks.py (ensure all queries filter by user_id to prevent cross-user access)
- [x] T020 [US1] Add error handling for database connection failures in backend/app/routes/tasks.py (catch exceptions, return 500 with error message)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently via Swagger UI

---

## Phase 4: User Story 2 - Full CRUD Operations (Priority: P2)

**Goal**: Enable updating and deleting tasks

**Independent Test**: Create a task (US1), then update it via PUT /api/{user_id}/tasks/{id} and delete it via DELETE /api/{user_id}/tasks/{id} using Swagger UI

### Implementation for User Story 2

- [x] T021 [US2] Implement PUT /api/{user_id}/tasks/{task_id} endpoint in backend/app/routes/tasks.py (update task fields, verify user_id ownership, refresh updated_at timestamp, return 200 with TaskResponse or 404 if not found)
- [x] T022 [US2] Implement DELETE /api/{user_id}/tasks/{task_id} endpoint in backend/app/routes/tasks.py (delete task, verify user_id ownership, return 200 with success message or 404 if not found)
- [x] T023 [US2] Add validation for TaskUpdate schema in backend/app/routes/tasks.py (handle partial updates, validate field constraints, return 400 for invalid data)
- [x] T024 [US2] Add error handling for update/delete operations in backend/app/routes/tasks.py (handle not found, validation errors, database errors)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Task Completion Workflow (Priority: P3)

**Goal**: Provide dedicated endpoint to toggle task completion status

**Independent Test**: Create a task (US1), then toggle its completion status via PATCH /api/{user_id}/tasks/{id}/complete using Swagger UI

### Implementation for User Story 3

- [x] T025 [US3] Implement PATCH /api/{user_id}/tasks/{task_id}/complete endpoint in backend/app/routes/tasks.py (toggle completed field, verify user_id ownership, refresh updated_at timestamp, return 200 with TaskResponse or 404 if not found)
- [x] T026 [US3] Add completion toggle logic in backend/app/routes/tasks.py (if completed=true set to false, if completed=false set to true)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T027 [P] Add API documentation metadata in backend/app/main.py (title, description, version, contact info per OpenAPI spec)
- [x] T028 [P] Verify Swagger UI accessibility at http://localhost:8000/docs (ensure all 6 endpoints are documented)
- [x] T029 [P] Add consistent error response format across all endpoints in backend/app/routes/tasks.py (use HTTPException with detail field)
- [x] T030 Validate data isolation by testing cross-user access scenarios (verify user A cannot access user B's tasks)
- [x] T031 Run quickstart.md validation (follow setup instructions, verify all endpoints work via Swagger UI)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Uses US1 endpoints for testing but is independently implementable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses US1 endpoints for testing but is independently implementable

### Within Each User Story

- All tasks within a user story should be completed in order (T014 → T015 → T016 → T017 → T018 → T019 → T020 for US1)
- Tasks marked [P] in Foundational phase can run in parallel
- Router must be created before endpoints
- Endpoints must be implemented before registration in main.py

### Parallel Opportunities

- **Setup Phase**: T002 (package markers) can run in parallel with T003-T006 (config files)
- **Foundational Phase**: T007 (config.py), T008 (database.py), T010 (schemas), T011 (schemas) can all run in parallel
- **User Stories**: Once Foundational phase completes, all three user stories (US1, US2, US3) can be worked on in parallel by different team members
- **Polish Phase**: T027 (docs metadata), T028 (Swagger verification), T029 (error format) can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch foundational tasks in parallel (different files):
Task T007: "Implement configuration management in backend/app/core/config.py"
Task T008: "Implement database engine in backend/app/core/database.py"
Task T010: "Create TaskCreate schema in backend/app/schemas/task.py"
Task T011: "Create TaskResponse schema in backend/app/schemas/task.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently via Swagger UI
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (T014-T020)
   - Developer B: User Story 2 (T021-T024)
   - Developer C: User Story 3 (T025-T026)
3. Stories complete and integrate independently

---

## Agent Assignment

**All tasks must be executed by specialized agents (no manual coding):**

- **Setup Phase (T001-T006)**: General file creation (can use any agent)
- **Foundational Phase (T007-T013)**:
  - T007-T008, T013: `neon-db-specialist` (database configuration)
  - T009: `neon-db-specialist` (Task model)
  - T010-T011: `fastapi-backend-architect` (Pydantic schemas)
  - T012: `fastapi-backend-architect` (FastAPI app)
- **User Story 1 (T014-T020)**: `fastapi-backend-architect` (API endpoints)
- **User Story 2 (T021-T024)**: `fastapi-backend-architect` (API endpoints)
- **User Story 3 (T025-T026)**: `fastapi-backend-architect` (API endpoints)
- **Polish Phase (T027-T031)**: `fastapi-backend-architect` (documentation and validation)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All endpoints must filter by user_id to ensure data isolation (FR-003)
- Use async/await for all database operations
- Use dependency injection for database sessions
- Follow REST conventions for all endpoints
- Return appropriate HTTP status codes (200, 201, 400, 404, 500)
