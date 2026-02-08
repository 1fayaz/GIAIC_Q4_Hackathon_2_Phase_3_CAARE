# Tasks: Authentication & API Security

**Input**: Design documents from `/specs/002-auth-integration/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/auth-api.yaml ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a web application with separate backend and frontend:
- Backend: `backend/app/` (FastAPI)
- Frontend: `frontend/` (Next.js 16+ App Router)
- Tests: `backend/tests/` and `frontend/__tests__/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [x] T001 [P] Install backend authentication dependencies (python-jose[cryptography]==3.3.0, passlib[bcrypt]==1.7.4) in backend/requirements.txt
- [x] T002 [P] Install Better Auth in frontend via npm/yarn (frontend/package.json)
- [x] T003 [P] Generate JWT secret key and update environment variables (.env, frontend/.env.local)
- [x] T004 [P] Update backend/app/core/config.py to add JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION settings

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema

- [x] T005 Create users table migration SQL script (see data-model.md for schema)
- [x] T006 Execute database migration to create users table in Neon PostgreSQL
- [x] T007 Add foreign key constraint from tasks.user_id to users.id (ALTER TABLE tasks)
- [x] T008 Verify database schema with \dt and \d users commands

### Backend Core Models & Utilities

- [x] T009 [P] Create User SQLModel in backend/app/models/user.py (id UUID, email, hashed_password, timestamps)
- [x] T010 [P] Create password hashing utilities in backend/app/core/auth.py (pwd_context with bcrypt)
- [x] T011 [P] Create JWT token utilities in backend/app/core/auth.py (create_token, decode_token, verify_token)
- [x] T012 Modify Task model in backend/app/models/task.py to add foreign key relationship to User

### Backend Authentication Schemas

- [x] T013 [P] Create RegisterRequest schema in backend/app/schemas/auth.py (email, password validation)
- [x] T014 [P] Create LoginRequest schema in backend/app/schemas/auth.py (email, password)
- [x] T015 [P] Create AuthResponse schema in backend/app/schemas/auth.py (access_token, token_type, user)
- [x] T016 [P] Create UserInfo schema in backend/app/schemas/auth.py (id, email)

### Backend Authentication Dependency

- [x] T017 Create get_current_user dependency in backend/app/dependencies/auth.py (HTTPBearer, JWT verification)
- [x] T018 Add error handling for invalid/expired/missing tokens in get_current_user dependency

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Registration & Login (Priority: P1) 🎯 MVP

**Goal**: Enable users to create accounts and authenticate to receive JWT tokens

**Independent Test**: Create account via signup form, then login with credentials. Success = JWT token received and user can access application.

### Backend Authentication Routes

- [x] T019 [US1] Create POST /api/auth/register endpoint in backend/app/routes/auth.py (hash password, create user, return JWT)
- [x] T020 [US1] Create POST /api/auth/login endpoint in backend/app/routes/auth.py (verify password, return JWT)
- [x] T021 [US1] Create POST /api/auth/logout endpoint in backend/app/routes/auth.py (optional, stateless)
- [x] T022 [US1] Register auth routes in backend/app/main.py (app.include_router)
- [x] T023 [US1] Add error handling for duplicate email (409 Conflict) in register endpoint
- [x] T024 [US1] Add error handling for invalid credentials (401 Unauthorized) in login endpoint

### Frontend Better Auth Configuration

- [ ] T025 [P] [US1] Configure Better Auth in frontend/lib/auth.ts (JWT plugin, custom claims, token expiration)
- [ ] T026 [P] [US1] Create registration page in frontend/app/(auth)/register/page.tsx (form with email/password)
- [ ] T027 [P] [US1] Create login page in frontend/app/(auth)/login/page.tsx (form with email/password)
- [ ] T028 [US1] Add Better Auth provider to frontend/app/layout.tsx
- [ ] T029 [US1] Implement client-side validation for email format and password strength
- [ ] T030 [US1] Add error message display for authentication failures (user-friendly messages)
- [ ] T031 [US1] Implement redirect to dashboard after successful login/registration

### Backend Tests for User Story 1

- [ ] T032 [P] [US1] Create test_auth_register.py in backend/tests/ (test successful registration, duplicate email, invalid input)
- [ ] T033 [P] [US1] Create test_auth_login.py in backend/tests/ (test successful login, invalid credentials, missing fields)
- [ ] T034 [P] [US1] Create test_jwt_utilities.py in backend/tests/ (test token creation, decoding, expiration)

**Checkpoint**: At this point, User Story 1 should be fully functional - users can register, login, and receive JWT tokens

---

## Phase 4: User Story 2 - Protected API Access (Priority: P2)

**Goal**: Enforce authentication on all task endpoints and ensure user data isolation

**Independent Test**: Make API requests with/without JWT tokens. With valid token = access granted. Without token or invalid token = 401 Unauthorized.

### Backend Route Protection

- [ ] T035 [US2] Apply get_current_user dependency to GET /api/{user_id}/tasks in backend/app/routes/tasks.py
- [ ] T036 [US2] Apply get_current_user dependency to POST /api/{user_id}/tasks in backend/app/routes/tasks.py
- [ ] T037 [US2] Apply get_current_user dependency to GET /api/{user_id}/tasks/{task_id} in backend/app/routes/tasks.py
- [ ] T038 [US2] Apply get_current_user dependency to PUT /api/{user_id}/tasks/{task_id} in backend/app/routes/tasks.py
- [ ] T039 [US2] Apply get_current_user dependency to DELETE /api/{user_id}/tasks/{task_id} in backend/app/routes/tasks.py
- [ ] T040 [US2] Apply get_current_user dependency to PATCH /api/{user_id}/tasks/{task_id} in backend/app/routes/tasks.py

### User Data Isolation Enforcement

- [ ] T041 [US2] Add user_id validation in GET /api/{user_id}/tasks (compare JWT user_id with path user_id)
- [ ] T042 [US2] Add user_id validation in POST /api/{user_id}/tasks (auto-assign task to authenticated user)
- [ ] T043 [US2] Add user_id validation in GET /api/{user_id}/tasks/{task_id} (filter by user_id, return 404 not 403)
- [ ] T044 [US2] Add user_id validation in PUT /api/{user_id}/tasks/{task_id} (filter by user_id, return 404 not 403)
- [ ] T045 [US2] Add user_id validation in DELETE /api/{user_id}/tasks/{task_id} (filter by user_id, return 404 not 403)
- [ ] T046 [US2] Add user_id validation in PATCH /api/{user_id}/tasks/{task_id} (filter by user_id, return 404 not 403)

### Frontend API Client Integration

- [ ] T047 [P] [US2] Create API client wrapper in frontend/lib/api-client.ts (fetch with automatic JWT token injection)
- [ ] T048 [P] [US2] Implement Authorization header injection (Bearer <token>) in API client
- [ ] T049 [US2] Add 401 response handler in API client (redirect to login on unauthorized)
- [ ] T050 [US2] Update all task CRUD operations in frontend to use authenticated API client

### Backend Tests for User Story 2

- [ ] T051 [P] [US2] Create test_tasks_auth.py in backend/tests/ (test authenticated access to task endpoints)
- [ ] T052 [P] [US2] Add test for missing token (expect 401) in test_tasks_auth.py
- [ ] T053 [P] [US2] Add test for invalid token (expect 401) in test_tasks_auth.py
- [ ] T054 [P] [US2] Add test for expired token (expect 401) in test_tasks_auth.py
- [ ] T055 [P] [US2] Add test for cross-user access attempt (expect 404) in test_tasks_auth.py
- [ ] T056 [P] [US2] Add test for valid user full CRUD flow (expect success) in test_tasks_auth.py

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - authentication works and all endpoints are protected

---

## Phase 5: User Story 3 - Token Refresh & Session Management (Priority: P3)

**Goal**: Enable users to stay logged in without frequent re-authentication via token refresh

**Independent Test**: Wait for token to expire, then use refresh token to obtain new access token without re-login.

### Backend Token Refresh

- [ ] T057 [US3] Add refresh token generation to login/register endpoints in backend/app/routes/auth.py
- [ ] T058 [US3] Create POST /api/auth/refresh endpoint in backend/app/routes/auth.py (accept refresh token, return new access token)
- [ ] T059 [US3] Add refresh token validation logic in backend/app/core/auth.py (verify signature, check expiration)
- [ ] T060 [US3] Implement token blacklist mechanism for logout (optional, requires Redis or database)

### Frontend Token Refresh

- [ ] T061 [P] [US3] Implement automatic token refresh in frontend/lib/api-client.ts (intercept 401, refresh, retry)
- [ ] T062 [P] [US3] Add refresh token storage in Better Auth configuration (frontend/lib/auth.ts)
- [ ] T063 [US3] Implement logout functionality that clears all tokens (frontend)
- [ ] T064 [US3] Add token expiration monitoring and proactive refresh (before expiration)

### Backend Tests for User Story 3

- [ ] T065 [P] [US3] Create test_token_refresh.py in backend/tests/ (test refresh token flow, expired refresh token)
- [ ] T066 [P] [US3] Add test for logout invalidating tokens in test_token_refresh.py

**Checkpoint**: All user stories should now be independently functional - complete authentication system with refresh

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Security Hardening

- [ ] T067 [P] Add rate limiting to authentication endpoints (prevent brute force attacks)
- [ ] T068 [P] Add logging for authentication failures in backend/app/routes/auth.py
- [ ] T069 [P] Verify JWT_SECRET is strong (minimum 256 bits) and stored in environment variables
- [ ] T070 [P] Add CORS configuration validation in backend/app/main.py (restrict to known origins)

### Documentation & Validation

- [ ] T071 [P] Update .env.example files with authentication variables (backend and frontend)
- [ ] T072 [P] Verify quickstart.md instructions work end-to-end
- [ ] T073 [P] Update API documentation (Swagger/OpenAPI) with authentication requirements
- [ ] T074 [P] Add security checklist validation from quickstart.md

### Performance & Monitoring

- [ ] T075 [P] Verify JWT validation latency is under 50ms (performance requirement)
- [ ] T076 [P] Test system with 1000 concurrent authenticated users (load testing)
- [ ] T077 [P] Add authentication metrics and monitoring (login success rate, token validation time)

### Code Quality

- [ ] T078 [P] Code review for security vulnerabilities (SQL injection, XSS, token leakage)
- [ ] T079 [P] Refactor duplicate code in authentication routes
- [ ] T080 [P] Add comprehensive error messages for all authentication failure scenarios

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
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Requires US1 for JWT tokens but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Requires US1 for basic auth but should be independently testable

### Within Each User Story

- Backend routes before frontend integration
- Core implementation before tests
- Tests should verify story works independently
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**: All 4 tasks can run in parallel
```bash
T001: Install python-jose and passlib
T002: Install Better Auth
T003: Generate JWT secret
T004: Update config.py
```

**Phase 2 (Foundational) - Database**: Sequential (T005 → T006 → T007 → T008)

**Phase 2 (Foundational) - Backend Models**: Parallel
```bash
T009: Create User model
T010: Create password utilities
T011: Create JWT utilities
```

**Phase 2 (Foundational) - Backend Schemas**: All 4 schemas can run in parallel (T013-T016)

**Phase 3 (User Story 1) - Frontend**: Parallel
```bash
T025: Configure Better Auth
T026: Create registration page
T027: Create login page
```

**Phase 3 (User Story 1) - Tests**: All 3 tests can run in parallel (T032-T034)

**Phase 4 (User Story 2) - Route Protection**: All 6 endpoints can be updated in parallel (T035-T040)

**Phase 4 (User Story 2) - Frontend**: Parallel
```bash
T047: Create API client
T048: Implement Authorization header
T049: Add 401 handler
```

**Phase 4 (User Story 2) - Tests**: All 6 tests can run in parallel (T051-T056)

**Phase 5 (User Story 3) - Frontend**: Parallel
```bash
T061: Implement auto-refresh
T062: Add refresh token storage
```

**Phase 6 (Polish)**: Most tasks can run in parallel (T067-T080)

---

## Parallel Example: User Story 1 Backend Routes

```bash
# Launch all backend authentication routes together:
Task: "Create POST /api/auth/register endpoint in backend/app/routes/auth.py"
Task: "Create POST /api/auth/login endpoint in backend/app/routes/auth.py"
Task: "Create POST /api/auth/logout endpoint in backend/app/routes/auth.py"
```

## Parallel Example: User Story 2 Route Protection

```bash
# Launch all route protection tasks together:
Task: "Apply get_current_user dependency to GET /api/{user_id}/tasks"
Task: "Apply get_current_user dependency to POST /api/{user_id}/tasks"
Task: "Apply get_current_user dependency to GET /api/{user_id}/tasks/{task_id}"
Task: "Apply get_current_user dependency to PUT /api/{user_id}/tasks/{task_id}"
Task: "Apply get_current_user dependency to DELETE /api/{user_id}/tasks/{task_id}"
Task: "Apply get_current_user dependency to PATCH /api/{user_id}/tasks/{task_id}"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T018) - CRITICAL
3. Complete Phase 3: User Story 1 (T019-T034)
4. **STOP and VALIDATE**: Test registration and login independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Secure API!)
4. Add User Story 3 → Test independently → Deploy/Demo (Enhanced UX!)
5. Add Polish → Final production-ready system

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T018)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (T019-T034) - Authentication MVP
   - **Developer B**: User Story 2 (T035-T056) - API Protection (requires US1 tokens for testing)
   - **Developer C**: User Story 3 (T057-T066) - Token Refresh (requires US1 for base auth)
3. Stories complete and integrate independently

### Agent Assignment Strategy

Based on CLAUDE.md agent guidelines:

- **T005-T008 (Database)**: Use `neon-db-specialist` agent
- **T009-T018 (Backend Foundation)**: Use `fastapi-backend-architect` agent
- **T019-T024, T032-T034 (US1 Backend)**: Use `auth-security` agent
- **T025-T031 (US1 Frontend)**: Use `nextjs-frontend-architect` agent
- **T035-T046, T051-T056 (US2 Backend)**: Use `fastapi-backend-architect` + `auth-security` agents
- **T047-T050 (US2 Frontend)**: Use `nextjs-frontend-architect` agent
- **T057-T060, T065-T066 (US3 Backend)**: Use `auth-security` agent
- **T061-T064 (US3 Frontend)**: Use `nextjs-frontend-architect` agent
- **T067-T080 (Polish)**: Use appropriate agents based on task type

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability (US1, US2, US3)
- Each user story should be independently completable and testable
- Tests verify authentication works correctly before moving to next story
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Follow security best practices: never hardcode secrets, always validate tokens, filter by user_id
- Use specialized agents as defined in CLAUDE.md for each task type
- Refer to quickstart.md for testing procedures after each phase
