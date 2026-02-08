# Implementation Plan: Frontend UI & UX

**Branch**: `003-frontend-ui` | **Date**: 2026-02-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-frontend-ui/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a responsive, authenticated Todo application frontend using Next.js 16+ App Router that integrates securely with existing FastAPI backend (Spec 1) and Better Auth authentication system (Spec 2). The frontend will provide signup/signin flows, protected task management pages, and full CRUD operations for tasks, all with proper JWT token handling and multi-user data isolation. Implementation will be executed via specialized Claude Code agents with strict role separation.

## Technical Context

**Language/Version**: TypeScript/JavaScript (Next.js 16+), React 18+
**Primary Dependencies**: Next.js 16+ (App Router), React 18+, Better Auth, Tailwind CSS (styling), Axios/Fetch (API client)
**Storage**: N/A (frontend only - backend API handles persistence via Neon PostgreSQL)
**Testing**: Jest + React Testing Library (component tests), Playwright (E2E tests)
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
**Project Type**: Web application (frontend only - backend exists from Spec 1)
**Performance Goals**: Signin <10s, task creation <30s, list rendering for 100+ tasks without lag, First Contentful Paint <2s
**Constraints**: Must use App Router (not Pages Router), no direct DB access, JWT required on all API calls, mobile-first responsive design (320px-2560px)
**Scale/Scope**: Single-page application with ~6 routes, ~15 components, supports concurrent multi-user access via backend isolation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Spec-Driven Development**: Feature has complete spec.md with user stories, acceptance criteria, and functional requirements
- [x] **End-to-End Correctness**: Frontend will consume documented backend API contracts from Spec 1; data models align with backend Task schema
- [x] **Secure Multi-User Architecture**: All API requests will include JWT token; frontend respects backend authorization (no client-side data filtering)
- [x] **Separation of Concerns**: Frontend contains only presentation logic; all business logic handled by backend APIs
- [x] **No Manual Coding**: All implementation via nextjs-frontend-architect, auth-security, fastapi-backend-architect, neon-db-specialist agents
- [x] **Incremental Delivery**: 6 user stories prioritized P1-P5; P1 (authentication) is MVP; each story independently testable
- [x] **Technology Stack**: Next.js 16+ App Router (✓), Better Auth with JWT (✓), integrates with FastAPI backend (✓)
- [x] **API Design**: Frontend will consume RESTful endpoints from Spec 1 (GET/POST/PUT/DELETE /api/tasks)
- [x] **Environment Variables**: Will use .env.local for API_URL, AUTH_SECRET, AUTH_URL (never committed)
- [x] **Monorepo Structure**: Frontend code in frontend/ directory; .specify/ structure preserved

**Gate Status**: ✅ PASSED - All constitutional requirements satisfied. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/003-frontend-ui/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
│   └── api-client.yaml  # Frontend API client contract
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
frontend/
├── app/                      # Next.js 16+ App Router
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Landing/redirect page
│   ├── (auth)/              # Auth route group (public)
│   │   ├── layout.tsx       # Auth layout
│   │   ├── signin/
│   │   │   └── page.tsx     # Sign in page
│   │   └── signup/
│   │       └── page.tsx     # Sign up page
│   └── (dashboard)/         # Dashboard route group (protected)
│       ├── layout.tsx       # Protected layout with auth check
│       └── tasks/
│           └── page.tsx     # Task list and management page
├── components/              # Reusable UI components
│   ├── auth/
│   │   ├── SignInForm.tsx
│   │   └── SignUpForm.tsx
│   ├── tasks/
│   │   ├── TaskList.tsx
│   │   ├── TaskItem.tsx
│   │   ├── TaskForm.tsx
│   │   └── DeleteConfirmation.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── LoadingSpinner.tsx
│       └── ErrorMessage.tsx
├── lib/                     # Utilities and configurations
│   ├── api-client.ts        # Centralized API client with JWT handling
│   ├── auth.ts              # Better Auth configuration
│   └── types.ts             # TypeScript type definitions
├── hooks/                   # Custom React hooks
│   ├── useAuth.ts           # Authentication state management
│   └── useTasks.ts          # Task data fetching and mutations
├── middleware.ts            # Next.js middleware for route protection
├── .env.local               # Environment variables (not committed)
├── next.config.js           # Next.js configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies

backend/                     # Existing from Spec 1
├── app/
│   ├── routes/
│   │   ├── auth.py         # Auth endpoints (from Spec 2)
│   │   └── tasks.py        # Task CRUD endpoints (from Spec 1)
│   └── models/
│       ├── user.py         # User model (from Spec 2)
│       └── task.py         # Task model (from Spec 1)
```

**Structure Decision**: Using web application structure (Option 2) with frontend/ and backend/ directories. Frontend uses Next.js 16+ App Router with route groups for auth (public) and dashboard (protected). Backend already exists from Specs 1 and 2. Frontend will be a new directory at repository root level.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations detected.** All constitutional requirements are satisfied. No complexity justification needed.

---

## Phase 0: Research Summary

**Status**: ✅ Complete

**Artifacts Generated**:
- `research.md` - Technology decisions and best practices

**Key Decisions**:
1. **Next.js 16+ App Router**: Modern routing with route groups for auth/dashboard separation
2. **Better Auth Integration**: JWT token management with automatic refresh
3. **Centralized API Client**: Automatic token injection and error handling
4. **React Hooks + Context**: State management without external libraries
5. **Tailwind CSS**: Mobile-first responsive design
6. **React Hook Form**: Performant form handling with validation
7. **Middleware Route Protection**: Edge-level authentication checks
8. **Global Error Boundary**: Graceful error handling

**Unknowns Resolved**: All technical context clarified. No NEEDS CLARIFICATION markers remain.

---

## Phase 1: Design & Contracts Summary

**Status**: ✅ Complete

**Artifacts Generated**:
- `data-model.md` - TypeScript interfaces for all entities
- `contracts/api-client.yaml` - API client contract specification
- `quickstart.md` - Developer implementation guide

**Key Designs**:

### Data Models
- **User**: Authentication identity (id, email, created_at)
- **Task**: Todo item (id, title, description, completed, user_id, timestamps)
- **Session**: Auth session (user, token, expires_at)
- **Form Models**: SignInFormData, SignUpFormData, TaskFormData
- **API Models**: ApiSuccessResponse<T>, ApiErrorResponse

### API Contracts
- **Authentication**: signup, signin, signout, getSession
- **Task Management**: getTasks, getTask, createTask, updateTask, deleteTask
- **Error Handling**: Consistent error codes and status codes
- **Request Interceptor**: Automatic JWT token injection
- **Response Interceptor**: Error parsing and 401 handling

### Project Structure
- **Route Groups**: (auth) for public, (dashboard) for protected
- **Components**: auth/, tasks/, ui/ organized by domain
- **Utilities**: api-client.ts, auth.ts, types.ts
- **Middleware**: Route protection at edge level

---

## Constitution Check (Post-Design)

*Re-evaluation after Phase 1 design completion*

- [x] **Spec-Driven Development**: Complete spec.md drives all design decisions
- [x] **End-to-End Correctness**: Data models match backend schemas; API contracts align with backend endpoints
- [x] **Secure Multi-User Architecture**: JWT token required on all protected requests; backend enforces user isolation
- [x] **Separation of Concerns**: Frontend only handles presentation; all business logic in backend
- [x] **No Manual Coding**: Implementation will use nextjs-frontend-architect, auth-security, fastapi-backend-architect, neon-db-specialist
- [x] **Incremental Delivery**: Design supports P1-P5 user stories; each independently implementable
- [x] **Technology Stack**: Next.js 16+ App Router ✓, Better Auth ✓, Tailwind CSS ✓, TypeScript ✓
- [x] **API Design**: Consumes RESTful endpoints from Spec 1; follows backend conventions
- [x] **Environment Variables**: .env.local for API_URL, AUTH_SECRET, AUTH_URL
- [x] **Monorepo Structure**: Frontend in frontend/ directory; .specify/ preserved

**Post-Design Gate Status**: ✅ PASSED - Design maintains constitutional compliance. Ready for task generation.

---

## Implementation Phases (from User Input)

The user provided a detailed phase breakdown that aligns with our design:

### Phase 0: Agent Assignment ✅
- nextjs-frontend-architect: App Router, layouts, pages, components, responsive UI
- auth-security: Auth flow validation, JWT handling, route protection
- fastapi-backend-architect: API contract verification, endpoint usage
- neon-db-specialist: Task data shape validation, ownership expectations

### Phase 1: App Router & Layouts
- Define route groups: /auth (login, signup), /dashboard (protected)
- Create root layout with providers
- Implement protected layout wrapper
- Redirect unauthenticated users via middleware

### Phase 2: Authentication UI
- Build login page with form validation
- Build signup page with form validation
- Integrate Better Auth components
- Validate session creation, redirect behavior, error states

### Phase 3: API Client Setup
- Create centralized API client with JWT injection
- Handle 401/403 globally (redirect/error)
- Validate endpoints against backend spec

### Phase 4: Task Dashboard
- Fetch authenticated user tasks
- Render task list with loading states
- Display empty state when no tasks
- Show loading indicators

### Phase 5: Task CRUD UI
- Create task form (title + description)
- Edit task flow with validation
- Delete confirmation dialog
- Toggle completion status
- Validate request/response mapping

### Phase 6: Responsiveness & UX
- Mobile-first layout (320px+)
- Button accessibility (44x44px touch targets)
- Touch-friendly interactions
- Prevent layout shift

### Phase 7: Security & Integration Validation
- Verify JWT tokens on all requests
- Test multi-user data isolation
- Validate error handling
- End-to-end testing

---

## Next Steps

**Planning Phase Complete** ✅

The next command is `/sp.tasks` to generate the task breakdown based on this plan.

**What to do next**:
1. Run `/sp.tasks` to generate `tasks.md` with atomic, testable tasks
2. Tasks will be organized by user story (US1-US6) with dependencies
3. Each task will specify exact file paths and agent assignments
4. Implementation will follow task order using appropriate agents

**Artifacts Ready for Task Generation**:
- ✅ spec.md - User stories and requirements
- ✅ plan.md - This file with technical design
- ✅ research.md - Technology decisions
- ✅ data-model.md - TypeScript interfaces
- ✅ contracts/api-client.yaml - API client contract
- ✅ quickstart.md - Implementation guide

**Agent Context Updated**: CLAUDE.md now includes Next.js 16+, React 18+, Better Auth, Tailwind CSS technologies.
