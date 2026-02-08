---
id: 0001
title: Create Todo App Constitution
stage: constitution
date: 2026-02-06
surface: agent
model: claude-sonnet-4-5
feature: none
branch: main
user: user
command: /sp.constitution
labels: ["constitution", "governance", "project-setup", "hackathon"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - none
---

## Prompt

/sp.constitution

Project: Todo Full-Stack Web Application (Hackathon Phase II)

Core principles:
- Spec-driven development using the Agentic Dev Stack
- End-to-end correctness across frontend, backend, and database
- Secure, stateless, multi-user architecture
- Clear separation of concerns between system layers
- Reproducibility through Claude Code (no manual coding)
- Incremental delivery through well-defined specifications

Key standards:
- All features must be defined in specifications before implementation
- Every API endpoint must be traceable to a documented feature
- Authentication and authorization must be enforced consistently
- Database access must be scoped to the authenticated user
- Frontend behavior must align exactly with backend API contracts
- All implementation steps must be derivable from specs and plans
- No hidden logic outside the spec-plan-task workflow

Constraints:
- Technology stack is fixed:
  - Frontend: Next.js 16+ (App Router)
  - Backend: Python FastAPI
  - ORM: SQLModel
  - Database: Neon Serverless PostgreSQL
  - Authentication: Better Auth (JWT-based)
- No manual code writing; all code generated via Claude Code
- REST API routes must follow the defined endpoint structure
- All authenticated requests must include a valid JWT token
- Shared JWT secret must be configured via environment variables
- Monorepo must remain compatible with Spec-Kit and Claude Code

Success criteria:
- All 5 basic Todo features work end-to-end in the web application
- REST APIs are fully functional, secure, and user-isolated
- Authentication correctly enforces task ownership
- Data persists reliably in Neon PostgreSQL
- Frontend is responsive and usable across devices
- Specifications, plans, and prompts are complete and reviewable
- The project clearly demonstrates agentic, spec-driven development

## Response snapshot

Created the project constitution (v1.0.0) at `.specify/memory/constitution.md` with 6 core principles:

1. **Spec-Driven Development (NON-NEGOTIABLE)**: All development must follow the Agentic Dev Stack workflow (spec → plan → tasks → implement via Claude Code agents)

2. **End-to-End Correctness**: System must maintain correctness across frontend (Next.js), backend (FastAPI), and database (Neon PostgreSQL) layers

3. **Secure Multi-User Architecture**: JWT-based authentication with strict user data isolation enforced at the API layer

4. **Separation of Concerns**: Clear boundaries between frontend (presentation), backend (business logic), and database (data storage)

5. **No Manual Coding (NON-NEGOTIABLE)**: All code must be generated via specialized agents (auth-security, nextjs-frontend-architect, neon-db-specialist, fastapi-backend-architect)

6. **Incremental Delivery**: Features broken into independently testable user stories with clear priorities (P1=MVP, P2, P3)

The constitution also defines:
- Fixed technology stack constraints
- Development standards for specs, plans, tasks, and implementation
- Documentation requirements (PHRs and ADRs)
- Governance rules including amendment process, compliance review checklist, quality gates, and success criteria

All templates (spec-template.md, plan-template.md, tasks-template.md) were reviewed and confirmed to align with the constitution principles.

## Outcome

- ✅ Impact: Established foundational governance document that will guide all development decisions and ensure hackathon requirements are met
- 🧪 Tests: N/A (constitution is a governance document, not code)
- 📁 Files: Created/updated 1 file (.specify/memory/constitution.md)
- 🔁 Next prompts: Ready to create feature specifications using /sp.specify for the 5 basic Todo features
- 🧠 Reflection: Constitution successfully captures all project requirements including the critical "no manual coding" constraint and multi-user security requirements. The 6 principles are clear, testable, and directly support the hackathon evaluation criteria.

## Evaluation notes (flywheel)

- Failure modes observed: None - constitution creation completed successfully
- Graders run and results (PASS/FAIL): N/A (no automated graders for constitution)
- Prompt variant (if applicable): N/A (first constitution creation)
- Next experiment (smallest change to try): N/A (constitution is complete and ready for use)
