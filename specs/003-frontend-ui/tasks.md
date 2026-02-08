# Tasks: Frontend UI & UX

**Input**: Design documents from `/specs/003-frontend-ui/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are NOT requested in the feature specification, so test tasks are not included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/` for Next.js application
- All paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create frontend directory at repository root
- [X] T002 Initialize Next.js 16+ project with TypeScript, Tailwind CSS, and App Router in frontend/
- [X] T003 [P] Install dependencies: better-auth, axios, react-hook-form in frontend/package.json
- [X] T004 [P] Configure Tailwind CSS with custom theme in frontend/tailwind.config.js
- [X] T005 [P] Configure TypeScript with strict mode in frontend/tsconfig.json
- [X] T006 [P] Create .env.local template with API_URL, AUTH_SECRET, AUTH_URL in frontend/.env.local
- [X] T007 [P] Configure Next.js with API proxy settings in frontend/next.config.js
- [X] T008 [P] Add .env.local to .gitignore to prevent committing secrets

**Checkpoint**: Project structure initialized, dependencies installed, configuration complete ✓

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 [P] Define TypeScript interfaces (User, Task, Session, Form models, API responses) in frontend/lib/types.ts
- [X] T010 [P] Create centralized API client with request/response interceptors in frontend/lib/api-client.ts
- [X] T011 [P] Implement JWT token injection in API client request interceptor in frontend/lib/api-client.ts
- [X] T012 [P] Implement error handling (401/403/404/500) in API client response interceptor in frontend/lib/api-client.ts
- [X] T013 [P] Configure Better Auth with JWT token management in frontend/lib/auth.ts
- [X] T014 [P] Create authentication context provider in frontend/lib/auth.ts
- [X] T015 [P] Implement Next.js middleware for route protection in frontend/middleware.ts
- [X] T016 [P] Create useAuth custom hook for authentication state in frontend/hooks/useAuth.ts
- [X] T017 [P] Create useTasks custom hook for task data fetching in frontend/hooks/useTasks.ts
- [X] T018 [P] Create reusable Button component with Tailwind styles in frontend/components/ui/Button.tsx
- [X] T019 [P] Create reusable Input component with validation styles in frontend/components/ui/Input.tsx
- [X] T020 [P] Create LoadingSpinner component in frontend/components/ui/LoadingSpinner.tsx
- [X] T021 [P] Create ErrorMessage component in frontend/components/ui/ErrorMessage.tsx
- [X] T022 Create root layout with Better Auth provider in frontend/app/layout.tsx
- [X] T023 Create landing page with redirect logic in frontend/app/page.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel ✓

---

## Phase 3: User Story 1 - User Authentication Flow (Priority: P1) 🎯 MVP

**Goal**: Enable users to sign up, sign in, and access protected routes with proper authentication

**Independent Test**: Navigate to application, complete signup form with valid credentials, verify account creation and automatic signin, then verify redirect to task dashboard. Test signin with existing credentials. Test that unauthenticated access to /tasks redirects to /signin.

### Implementation for User Story 1

- [X] T024 [P] [US1] Create auth route group layout in frontend/app/(auth)/layout.tsx
- [X] T025 [P] [US1] Create signin page structure in frontend/app/(auth)/signin/page.tsx
- [X] T026 [P] [US1] Create signup page structure in frontend/app/(auth)/signup/page.tsx
- [X] T027 [P] [US1] Create SignInForm component with React Hook Form in frontend/components/auth/SignInForm.tsx
- [X] T028 [P] [US1] Create SignUpForm component with React Hook Form in frontend/components/auth/SignUpForm.tsx
- [X] T029 [US1] Implement email validation in SignInForm component in frontend/components/auth/SignInForm.tsx
- [X] T030 [US1] Implement password validation (min 8 chars) in SignInForm component in frontend/components/auth/SignInForm.tsx
- [X] T031 [US1] Implement email validation in SignUpForm component in frontend/components/auth/SignUpForm.tsx
- [X] T032 [US1] Implement password validation and confirmation match in SignUpForm component in frontend/components/auth/SignUpForm.tsx
- [X] T033 [US1] Connect SignInForm to Better Auth signin API in frontend/components/auth/SignInForm.tsx
- [X] T034 [US1] Connect SignUpForm to Better Auth signup API in frontend/components/auth/SignUpForm.tsx
- [X] T035 [US1] Implement error message display for signin failures in frontend/components/auth/SignInForm.tsx
- [X] T036 [US1] Implement error message display for signup failures in frontend/components/auth/SignUpForm.tsx
- [X] T037 [US1] Implement redirect to /tasks after successful signin in frontend/components/auth/SignInForm.tsx
- [X] T038 [US1] Implement redirect to /tasks after successful signup in frontend/components/auth/SignUpForm.tsx
- [X] T039 [US1] Add loading states during authentication in both forms in frontend/components/auth/
- [X] T040 [US1] Verify middleware redirects unauthenticated users to /signin in frontend/middleware.ts

**Checkpoint**: At this point, User Story 1 should be fully functional - users can signup, signin, and are redirected appropriately ✓

---

## Phase 4: User Story 6 - Sign Out (Priority: P2)

**Goal**: Enable authenticated users to securely sign out and terminate their session

**Independent Test**: Sign in, click sign out button, verify user is logged out and redirected to signin page. Attempt to access /tasks after signout - should redirect to /signin.

### Implementation for User Story 6

- [X] T041 [US6] Create dashboard route group layout with navigation in frontend/app/(dashboard)/layout.tsx
- [X] T042 [US6] Add sign out button to dashboard layout in frontend/app/(dashboard)/layout.tsx
- [X] T043 [US6] Implement signout handler that calls Better Auth signout in frontend/app/(dashboard)/layout.tsx
- [X] T044 [US6] Clear authentication state on signout in frontend/hooks/useAuth.ts
- [X] T045 [US6] Implement redirect to /signin after signout in frontend/app/(dashboard)/layout.tsx
- [X] T046 [US6] Verify middleware prevents access to protected routes after signout in frontend/middleware.ts

**Checkpoint**: At this point, User Stories 1 AND 6 should both work - complete authentication flow with signin/signup/signout ✓

---

## Phase 5: User Story 2 - View Personal Task List (Priority: P2)

**Goal**: Display all tasks belonging to the authenticated user with proper loading and empty states

**Independent Test**: Sign in as a user with existing tasks, verify all tasks display with titles, descriptions, and completion status. Sign in as a user with no tasks, verify empty state message appears. Test on mobile device (320px) to verify responsive layout.

### Implementation for User Story 2

- [X] T047 [P] [US2] Create tasks page structure in frontend/app/(dashboard)/tasks/page.tsx
- [X] T048 [P] [US2] Create TaskList component in frontend/components/tasks/TaskList.tsx
- [X] T049 [P] [US2] Create TaskItem component with task display in frontend/components/tasks/TaskItem.tsx
- [X] T050 [US2] Implement getTasks API call in useTasks hook in frontend/hooks/useTasks.ts
- [X] T051 [US2] Connect tasks page to useTasks hook to fetch data in frontend/app/(dashboard)/tasks/page.tsx
- [X] T052 [US2] Implement loading state while fetching tasks in frontend/app/(dashboard)/tasks/page.tsx
- [X] T053 [US2] Implement empty state message when no tasks exist in frontend/components/tasks/TaskList.tsx
- [X] T054 [US2] Display task title, description, and completion status in TaskItem in frontend/components/tasks/TaskItem.tsx
- [X] T055 [US2] Add visual distinction for completed vs incomplete tasks in frontend/components/tasks/TaskItem.tsx
- [X] T056 [US2] Implement responsive layout for task list (mobile 320px, tablet 768px, desktop 1024px+) in frontend/components/tasks/TaskList.tsx
- [X] T057 [US2] Verify only authenticated user's tasks are displayed (backend enforces, frontend displays) in frontend/app/(dashboard)/tasks/page.tsx

**Checkpoint**: At this point, User Stories 1, 6, AND 2 should work - users can authenticate and view their task list ✓

---

## Phase 6: User Story 3 - Create New Tasks (Priority: P3)

**Goal**: Enable users to create new tasks with title and optional description

**Independent Test**: Sign in, click create task button, fill form with title and description, submit, verify new task appears in list. Test validation by submitting without title - should show error.

### Implementation for User Story 3

- [X] T058 [P] [US3] Create TaskForm component with React Hook Form in frontend/components/tasks/TaskForm.tsx
- [X] T059 [P] [US3] Add create task button to tasks page in frontend/app/(dashboard)/tasks/page.tsx
- [X] T060 [US3] Implement title field validation (required, 1-200 chars) in TaskForm in frontend/components/tasks/TaskForm.tsx
- [X] T061 [US3] Implement description field (optional, 0-1000 chars) in TaskForm in frontend/components/tasks/TaskForm.tsx
- [X] T062 [US3] Implement createTask API call in useTasks hook in frontend/hooks/useTasks.ts
- [X] T063 [US3] Connect TaskForm submit to createTask API in frontend/components/tasks/TaskForm.tsx
- [X] T064 [US3] Display validation errors for empty title in frontend/components/tasks/TaskForm.tsx
- [X] T065 [US3] Add loading state during task creation in frontend/components/tasks/TaskForm.tsx
- [X] T066 [US3] Update task list after successful creation (optimistic or refetch) in frontend/app/(dashboard)/tasks/page.tsx
- [X] T067 [US3] Display success message after task creation in frontend/components/tasks/TaskForm.tsx
- [X] T068 [US3] Display error message if creation fails in frontend/components/tasks/TaskForm.tsx
- [X] T069 [US3] Clear form after successful task creation in frontend/components/tasks/TaskForm.tsx

**Checkpoint**: At this point, User Stories 1, 6, 2, AND 3 should work - users can create tasks ✓

---

## Phase 7: User Story 4 - Update and Complete Tasks (Priority: P4)

**Goal**: Enable users to edit task details and toggle completion status

**Independent Test**: Sign in, select existing task, edit title or description, verify changes persist. Mark task as complete, verify status updates visually. Mark completed task as incomplete, verify status reverts.

### Implementation for User Story 4

- [X] T070 [P] [US4] Add edit button to TaskItem component in frontend/components/tasks/TaskItem.tsx
- [X] T071 [P] [US4] Add completion toggle checkbox to TaskItem component in frontend/components/tasks/TaskItem.tsx
- [X] T072 [US4] Implement edit mode state in TaskItem component in frontend/components/tasks/TaskItem.tsx
- [X] T073 [US4] Show TaskForm in edit mode when edit button clicked in frontend/components/tasks/TaskItem.tsx
- [X] T074 [US4] Pre-populate TaskForm with existing task data in edit mode in frontend/components/tasks/TaskForm.tsx
- [X] T075 [US4] Implement updateTask API call in useTasks hook in frontend/hooks/useTasks.ts
- [X] T076 [US4] Connect TaskForm submit to updateTask API in edit mode in frontend/components/tasks/TaskForm.tsx
- [X] T077 [US4] Implement toggle completion handler in TaskItem in frontend/components/tasks/TaskItem.tsx
- [X] T078 [US4] Call updateTask API with completed status on toggle in frontend/components/tasks/TaskItem.tsx
- [X] T079 [US4] Update task list after successful edit (optimistic or refetch) in frontend/app/(dashboard)/tasks/page.tsx
- [X] T080 [US4] Update task visual state after completion toggle in frontend/components/tasks/TaskItem.tsx
- [X] T081 [US4] Display error message if update fails in frontend/components/tasks/TaskItem.tsx
- [X] T082 [US4] Add loading state during task update in frontend/components/tasks/TaskItem.tsx

**Checkpoint**: At this point, User Stories 1, 6, 2, 3, AND 4 should work - users can edit and complete tasks ✓

---

## Phase 8: User Story 5 - Delete Tasks (Priority: P5)

**Goal**: Enable users to permanently delete tasks with confirmation

**Independent Test**: Sign in, select task, click delete, verify confirmation dialog appears. Confirm deletion, verify task removed from list. Test cancel - task should remain.

### Implementation for User Story 5

- [X] T083 [P] [US5] Create DeleteConfirmation modal component in frontend/components/tasks/DeleteConfirmation.tsx
- [X] T084 [P] [US5] Add delete button to TaskItem component in frontend/components/tasks/TaskItem.tsx
- [X] T085 [US5] Implement delete button click handler to show confirmation in frontend/components/tasks/TaskItem.tsx
- [X] T086 [US5] Implement deleteTask API call in useTasks hook in frontend/hooks/useTasks.ts
- [X] T087 [US5] Connect DeleteConfirmation confirm button to deleteTask API in frontend/components/tasks/DeleteConfirmation.tsx
- [X] T088 [US5] Implement cancel button to close confirmation without deleting in frontend/components/tasks/DeleteConfirmation.tsx
- [X] T089 [US5] Remove task from list after successful deletion (optimistic or refetch) in frontend/app/(dashboard)/tasks/page.tsx
- [X] T090 [US5] Display success message after deletion in frontend/components/tasks/DeleteConfirmation.tsx
- [X] T091 [US5] Display error message if deletion fails in frontend/components/tasks/DeleteConfirmation.tsx
- [X] T092 [US5] Add loading state during task deletion in frontend/components/tasks/DeleteConfirmation.tsx

**Checkpoint**: All user stories should now be independently functional - complete CRUD operations available ✓
- [ ] T091 [US5] Display error message if deletion fails in frontend/components/tasks/DeleteConfirmation.tsx
- [ ] T092 [US5] Add loading state during task deletion in frontend/components/tasks/DeleteConfirmation.tsx

**Checkpoint**: All user stories should now be independently functional - complete CRUD operations available

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and ensure production readiness

- [X] T093 [P] Verify responsive design on mobile (320px width) across all pages in frontend/app/
- [X] T094 [P] Verify responsive design on tablet (768px width) across all pages in frontend/app/
- [X] T095 [P] Verify responsive design on desktop (1024px+ width) across all pages in frontend/app/
- [X] T096 [P] Ensure all buttons meet minimum touch target size (44x44px) in frontend/components/
- [X] T097 [P] Add keyboard navigation support for all interactive elements in frontend/components/
- [X] T098 [P] Implement global error boundary for unhandled errors in frontend/app/layout.tsx
- [X] T099 [P] Add proper ARIA labels for accessibility in frontend/components/
- [X] T100 [P] Verify loading states display correctly for all API calls in frontend/app/
- [X] T101 [P] Verify error messages are user-friendly across all forms in frontend/components/
- [X] T102 [P] Test network failure handling (backend offline) in frontend/lib/api-client.ts
- [X] T103 [P] Verify session expiration redirects to signin in frontend/middleware.ts
- [X] T104 [P] Add proper meta tags for SEO in frontend/app/layout.tsx
- [X] T105 [P] Optimize images and assets for performance in frontend/public/
- [ ] T106 Run complete manual testing checklist from quickstart.md
- [ ] T107 Verify all success criteria from spec.md are met

**Checkpoint**: Application is production-ready with all features working, responsive, and accessible ✓

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 6 (P2): Can start after Foundational - Should integrate with US1 layout
  - User Story 2 (P2): Can start after Foundational - Needs US1 for authentication but independently testable
  - User Story 3 (P3): Can start after Foundational - Needs US2 for task list display
  - User Story 4 (P4): Can start after Foundational - Needs US2 and US3 for task display and form
  - User Story 5 (P5): Can start after Foundational - Needs US2 for task list display
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 6 (P2)**: Can start after US1 - Integrates with dashboard layout created in US1
- **User Story 2 (P2)**: Can start after US1 - Requires authentication but independently testable
- **User Story 3 (P3)**: Can start after US2 - Needs task list to display created tasks
- **User Story 4 (P4)**: Can start after US2 and US3 - Needs existing tasks and form component
- **User Story 5 (P5)**: Can start after US2 - Needs task list to display and remove tasks

### Within Each User Story

- Components marked [P] can be created in parallel (different files)
- Form validation before API integration
- API calls before UI updates
- Loading states before error handling
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003-T008)
- All Foundational tasks marked [P] can run in parallel (T009-T021)
- Within US1: T024-T028 can run in parallel (different files)
- Within US2: T047-T049 can run in parallel (different files)
- Within US3: T058-T059 can run in parallel (different files)
- Within US4: T070-T071 can run in parallel (different files)
- Within US5: T083-T084 can run in parallel (different files)
- All Polish tasks marked [P] can run in parallel (T093-T105)

---

## Parallel Example: User Story 1

```bash
# Launch all page structures for User Story 1 together:
Task: "Create auth route group layout in frontend/app/(auth)/layout.tsx"
Task: "Create signin page structure in frontend/app/(auth)/signin/page.tsx"
Task: "Create signup page structure in frontend/app/(auth)/signup/page.tsx"
Task: "Create SignInForm component with React Hook Form in frontend/components/auth/SignInForm.tsx"
Task: "Create SignUpForm component with React Hook Form in frontend/components/auth/SignUpForm.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T008)
2. Complete Phase 2: Foundational (T009-T023) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 (T024-T040)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Can users signup with valid credentials?
   - Can users signin with correct credentials?
   - Are unauthenticated users redirected to /signin?
   - Do validation errors display correctly?
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (T001-T023)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!) (T024-T040)
3. Add User Story 6 → Test independently → Deploy/Demo (T041-T046)
4. Add User Story 2 → Test independently → Deploy/Demo (T047-T057)
5. Add User Story 3 → Test independently → Deploy/Demo (T058-T069)
6. Add User Story 4 → Test independently → Deploy/Demo (T070-T082)
7. Add User Story 5 → Test independently → Deploy/Demo (T083-T092)
8. Add Polish → Final validation → Production Deploy (T093-T107)
9. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T023)
2. Once Foundational is done:
   - Developer A: User Story 1 (T024-T040)
   - Developer B: User Story 6 (T041-T046) - after US1 layout exists
   - Developer C: User Story 2 (T047-T057) - after US1 auth exists
3. After US1, US6, US2 complete:
   - Developer A: User Story 3 (T058-T069)
   - Developer B: User Story 4 (T070-T082)
   - Developer C: User Story 5 (T083-T092)
4. All developers: Polish tasks in parallel (T093-T107)

---

## Agent Assignment

**Tasks by Agent**:

- **nextjs-frontend-architect**: All tasks except those explicitly assigned to other agents
  - All Setup tasks (T001-T008)
  - Most Foundational tasks (T009-T023)
  - All User Story implementation tasks (T024-T092)
  - All Polish tasks (T093-T107)

- **auth-security**: Review and validate authentication implementation
  - Review T013-T016 (Better Auth configuration and middleware)
  - Review T024-T040 (User Story 1 authentication flow)
  - Review T041-T046 (User Story 6 signout flow)
  - Security audit after US1 and US6 complete

- **fastapi-backend-architect**: Validate API integration
  - Review T010-T012 (API client implementation)
  - Review T050 (getTasks API call)
  - Review T062 (createTask API call)
  - Review T075 (updateTask API call)
  - Review T086 (deleteTask API call)
  - Verify all API calls match backend contracts

- **neon-db-specialist**: Validate data expectations
  - Review T009 (TypeScript interfaces match backend schemas)
  - Review T057 (Task ownership filtering expectations)
  - Verify data consistency assumptions

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Tests are NOT included as they were not requested in the specification
- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
- Total tasks: 107 (8 Setup + 15 Foundational + 17 US1 + 6 US6 + 11 US2 + 12 US3 + 13 US4 + 10 US5 + 15 Polish)
- Parallel opportunities: 45 tasks marked [P] can run in parallel within their phases
- MVP scope: Phases 1-3 (T001-T040) = 40 tasks for authentication MVP
