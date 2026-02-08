---
id: 0002
title: Create Todo Fullstack Implementation Plan
stage: plan
date: 2026-02-06
surface: agent
model: claude-sonnet-4-5
feature: 001-todo-fullstack-web
branch: 001-todo-fullstack-web
user: user
command: /sp.plan
labels: ["plan", "architecture", "fullstack", "fastapi", "nextjs", "neon", "better-auth", "jwt", "sqlmodel"]
links:
  spec: specs/001-todo-fullstack-web/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-todo-fullstack-web/plan.md
  - specs/001-todo-fullstack-web/research.md
  - specs/001-todo-fullstack-web/data-model.md
  - specs/001-todo-fullstack-web/contracts/auth-api.yaml
  - specs/001-todo-fullstack-web/contracts/tasks-api.yaml
  - specs/001-todo-fullstack-web/quickstart.md
  - CLAUDE.md (updated with technology context)
tests:
  - none
---

## Prompt

/sp.plan Todo Full-Stack Web Application (Hackathon Phase II)

Objective:
Deliver a secure, full-stack Todo web application using a spec-driven, agentic development workflow with no manual coding.

Phases:

Phase 1: Core Full-Stack Foundation
- Define database schema using SQLModel
- Set up Neon PostgreSQL connection
- Implement task CRUD REST APIs in FastAPI
- Build basic Next.js App Router pages for task management
- Connect frontend to backend APIs
- Verify persistent storage and end-to-end functionality

Phase 2: Authentication & API Security
- Configure Better Auth for user signup and signin
- Enable JWT token issuance
- Configure shared JWT secret across frontend and backend
- Update frontend API client to attach JWT tokens
- Implement FastAPI middleware for JWT verification
- Enforce user-based task filtering and ownership
- Return 401 Unauthorized for unauthenticated requests

Phase 3: UX, Architecture & Polish
- Improve frontend responsiveness and usability
- Add loading, error, and empty states
- [truncated in original prompt]

## Response snapshot

Created comprehensive implementation plan for Todo Full-Stack Web Application with complete architecture, technical decisions, and design artifacts.

**Constitution Check**: ✅ ALL 6 PRINCIPLES PASSED
- Spec-Driven Development: Following Agentic Dev Stack workflow
- End-to-End Correctness: API contracts and data models ensure layer consistency
- Secure Multi-User Architecture: JWT-based auth with strict user isolation
- Separation of Concerns: Clean layer boundaries (frontend/backend/database)
- No Manual Coding: All implementation via specialized agents
- Incremental Delivery: 5 user stories prioritized P1-P5

**Technical Context Defined**:
- Backend: Python 3.11+, FastAPI 0.104+, SQLModel, python-jose, passlib
- Frontend: TypeScript 5.0+, Next.js 16+, Better Auth, Tailwind CSS
- Database: Neon Serverless PostgreSQL with async SQLModel
- Performance: <2s API response, 100 concurrent users, <500ms p95 queries

**Phase 0 - Research Completed** (research.md):
1. Better Auth Integration: JWT tokens with Next.js App Router
2. FastAPI JWT Verification: python-jose with dependency injection
3. Neon PostgreSQL: Async SQLModel with connection pooling
4. CORS Configuration: FastAPI middleware with explicit origins
5. API Communication: Native fetch wrapper with JWT attachment

**Phase 1 - Design Artifacts Created**:

1. **Data Model** (data-model.md):
   - User entity: id, email, hashed_password, timestamps
   - Task entity: id, user_id (FK), title, description, is_completed, timestamps
   - Relationships: One User → Many Tasks (cascade delete)
   - Indexes: user_id, (user_id, created_at) composite
   - Validation rules and security considerations documented

2. **API Contracts** (OpenAPI 3.0):
   - auth-api.yaml: POST /signup, POST /login, GET /me
   - tasks-api.yaml: GET/POST /tasks, GET/PUT/DELETE /tasks/{id}, PATCH /tasks/{id}/complete
   - Standard response/error formats defined
   - HTTP status codes: 200, 201, 400, 401, 403, 404, 500

3. **Quickstart Guide** (quickstart.md):
   - Prerequisites and setup instructions
   - Environment variable configuration
   - Backend and frontend startup commands
   - Troubleshooting common issues
   - Development workflow guidance

**Project Structure Defined**:
- backend/: FastAPI app with models/, services/, api/, core/
- frontend/: Next.js App Router with app/, components/, lib/
- Separation enables independent deployment and parallel development

**Implementation Phases**:
- Phase 1: Core Full-Stack Foundation (database → APIs → frontend → integration)
- Phase 2: Authentication & API Security (Better Auth → JWT → user isolation)
- Phase 3: UX & Polish (responsive design → loading states → error handling)

**Agent Assignments**:
- Database: neon-db-specialist
- Backend APIs: fastapi-backend-architect
- Frontend: nextjs-frontend-architect
- Authentication: auth-security

**Risk Analysis**:
1. Better Auth + FastAPI JWT integration complexity (mitigation: python-jose library)
2. Neon serverless connection management (mitigation: built-in pooling)
3. CORS configuration errors (mitigation: early middleware setup)

## Outcome

- ✅ Impact: Established complete architectural plan with technical decisions, data models, API contracts, and implementation roadmap. All 6 constitution principles verified and passed. Ready for task generation and implementation.
- 🧪 Tests: N/A (planning phase, no code yet)
- 📁 Files: Created 6 files (plan.md, research.md, data-model.md, 2 API contracts, quickstart.md) + updated CLAUDE.md
- 🔁 Next prompts: Ready for `/sp.tasks` to generate atomic, testable tasks organized by user story
- 🧠 Reflection: Planning phase successfully completed all required artifacts. Research phase resolved 5 technical decisions with clear rationale. Data model defines 2 entities with proper relationships and indexes. API contracts specify 9 endpoints with complete request/response schemas. Constitution check passed all 6 principles without violations. Project structure supports parallel agent development. Implementation phases clearly define goals, deliverables, and success criteria.

## Evaluation notes (flywheel)

- Failure modes observed: None - planning phase completed successfully with all required artifacts
- Graders run and results (PASS/FAIL): Constitution Check - ALL 6 PRINCIPLES PASSED (Spec-Driven ✅, End-to-End Correctness ✅, Secure Multi-User ✅, Separation of Concerns ✅, No Manual Coding ✅, Incremental Delivery ✅)
- Prompt variant (if applicable): N/A (first planning iteration for this feature)
- Next experiment (smallest change to try): N/A (planning complete, ready for task generation)
