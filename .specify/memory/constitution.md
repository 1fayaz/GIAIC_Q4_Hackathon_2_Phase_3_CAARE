<!--
Sync Impact Report:
- Version: 1.0.0 → 1.1.0 (Backend implementation standards expansion)
- Principles Modified: None (core principles unchanged)
- Sections Added: Backend Implementation Standards (new subsection under Development Standards)
- Sections Expanded: Technology Stack Constraints (added backend-specific details)
- Templates Status:
  ✅ spec-template.md - Reviewed, aligns with expanded backend requirements
  ✅ plan-template.md - Reviewed, Constitution Check covers backend standards
  ✅ tasks-template.md - Reviewed, task structure supports backend implementation patterns
- Rationale: Added specific backend implementation standards for FastAPI, SQLModel, and API design
  to ensure consistency across backend development. These standards complement existing principles
  without changing their core intent.
- Follow-up: None - all placeholders filled
-->

# Todo Full-Stack Web Application Constitution

## Core Principles

### I. Spec-Driven Development (NON-NEGOTIABLE)

All development MUST follow the Agentic Dev Stack workflow: Write specification → Generate architectural plan → Break into tasks → Implement via Claude Code agents. No feature may be implemented without a corresponding specification document. Every implementation decision must be traceable back to a spec, plan, or task document.

**Rationale**: Ensures reproducibility, maintains clear documentation trail, and enables review of the development process itself—critical for hackathon evaluation criteria.

### II. End-to-End Correctness

The system MUST maintain correctness across all three layers: frontend (Next.js), backend (FastAPI), and database (Neon PostgreSQL). API contracts defined in specifications must be honored by both frontend consumers and backend providers. Data models must be consistent across ORM definitions and database schemas.

**Rationale**: Multi-layer applications fail when layers drift apart. Enforcing consistency prevents integration bugs and ensures the system works as a cohesive whole.

### III. Secure Multi-User Architecture

Every authenticated request MUST include a valid JWT token. Every database query for user-owned resources MUST filter by the authenticated user's ID. Authorization checks MUST occur at the API layer before any data access. User data isolation is non-negotiable—users must never access other users' data.

**Rationale**: Multi-user applications require strict data isolation. Security violations are unacceptable and can lead to data breaches. Stateless JWT-based auth enables scalability.

### IV. Separation of Concerns

Frontend code MUST NOT contain business logic—only presentation and user interaction. Backend code MUST NOT contain presentation logic—only business rules and data access. Database schemas MUST reflect domain entities, not UI structures. Each layer has a single, well-defined responsibility.

**Rationale**: Clear boundaries enable independent testing, parallel development, and easier maintenance. Mixing concerns creates tight coupling and makes the system fragile.

### V. No Manual Coding (NON-NEGOTIABLE)

All code MUST be generated via Claude Code specialized agents (auth-security, nextjs-frontend-architect, neon-db-specialist, fastapi-backend-architect). Manual code writing is prohibited. Every implementation task must be executed by the appropriate agent as defined in CLAUDE.md.

**Rationale**: This project demonstrates agentic development capabilities. Manual coding defeats the purpose and invalidates the hackathon submission criteria.

### VI. Incremental Delivery

Features MUST be broken into independently testable user stories with clear priorities (P1, P2, P3). Each user story MUST be implementable and deployable independently. The P1 story constitutes the Minimum Viable Product (MVP). Higher-priority stories must not depend on lower-priority stories.

**Rationale**: Enables early validation, reduces risk, allows for scope adjustment, and ensures at least an MVP is deliverable even under time constraints.

## Technology Stack Constraints

The following technology choices are FIXED and non-negotiable:

- **Frontend**: Next.js 16+ with App Router (NOT Pages Router)
- **Backend**: Python FastAPI (NOT Flask, Django, or other frameworks)
- **ORM**: SQLModel (NOT SQLAlchemy alone, Prisma, or other ORMs)
- **Database**: Neon Serverless PostgreSQL (NOT local PostgreSQL, MySQL, MongoDB, or other databases)
- **Authentication**: Better Auth with JWT tokens (NOT NextAuth, Auth0, custom auth, or session-based auth)

**API Design**: RESTful conventions MUST be followed:
- `GET /api/resource` - List (filtered by current user)
- `GET /api/resource/{id}` - Retrieve single (verify ownership)
- `POST /api/resource` - Create (auto-assign to current user)
- `PUT /api/resource/{id}` - Update (verify ownership)
- `DELETE /api/resource/{id}` - Delete (verify ownership)

**Environment Variables**: All secrets MUST be stored in `.env` files (never committed). Required variables include: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `API_URL`, `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_EXPIRATION`, `CORS_ORIGINS`.

**Monorepo Structure**: Project MUST remain compatible with Spec-Kit Plus and Claude Code tooling. The `.specify/` directory structure must be preserved.

## Development Standards

### Specification Requirements

Every feature MUST have:
- A `spec.md` file with user stories, acceptance criteria, functional requirements, and success criteria
- User stories prioritized as P1 (MVP), P2, P3, etc.
- Each user story marked as independently testable
- Clear edge cases and error scenarios documented
- Functional requirements numbered (FR-001, FR-002, etc.)

### Planning Requirements

Every feature MUST have:
- A `plan.md` file with technical context, architecture decisions, and implementation approach
- Constitution Check section verifying compliance with all principles
- Project structure clearly defined (frontend/, backend/, database schemas)
- API contracts documented (endpoints, request/response formats, error codes)
- Data models documented with relationships and constraints

### Task Requirements

Every feature MUST have:
- A `tasks.md` file with atomic, testable tasks
- Tasks organized by user story (US1, US2, US3)
- Foundational phase clearly separated (blocks all user stories)
- Tasks marked with [P] for parallel execution where applicable
- Each task includes exact file paths
- Dependencies explicitly documented

### Implementation Requirements

Every implementation MUST:
- Be executed by the appropriate specialized agent (see CLAUDE.md)
- Follow the task list in `tasks.md` sequentially or in documented parallel groups
- Include authentication checks on all protected endpoints
- Filter database queries by `user_id` for user-owned resources
- Return proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Handle errors gracefully with user-friendly messages
- Log security-relevant events (login attempts, authorization failures)

### Documentation Requirements

Every feature MUST generate:
- A Prompt History Record (PHR) in `history/prompts/<feature-name>/` for each significant interaction
- Architecture Decision Records (ADRs) in `history/adr/` for significant architectural choices
- PHRs must capture full user input (verbatim) and assistant response (concise)
- ADRs must document context, decision, consequences, and alternatives considered

### Backend Implementation Standards

**Core Backend Principles:**

All backend development MUST adhere to the following non-negotiable standards:

1. **Correctness of Data Modeling and API Behavior**
   - Database schemas MUST accurately represent domain entities and relationships
   - API responses MUST match documented contracts exactly
   - Data validation MUST occur at API boundaries before persistence
   - All state changes MUST be deterministic and reproducible

2. **Simplicity and Clarity in Architecture**
   - Backend code MUST follow clear separation of concerns: models, routes, services
   - Each module MUST have a single, well-defined responsibility
   - Avoid premature abstractions—prefer explicit code over clever patterns
   - Code MUST be readable without extensive comments (self-documenting)

3. **Deterministic, Reproducible Behavior**
   - Given the same input, APIs MUST return the same output
   - Side effects (database writes, external calls) MUST be explicit and traceable
   - Random or time-dependent behavior MUST be injected as dependencies for testability
   - Error conditions MUST be consistent and predictable

**Database Interaction Standards:**

- All database operations MUST go through SQLModel ORM (no raw SQL queries)
- Database models MUST inherit from `SQLModel` with `table=True`
- Relationships MUST be defined using SQLModel's `Relationship` type
- Migrations MUST be version-controlled and reversible
- Connection pooling MUST be configured for Neon Serverless PostgreSQL
- Database sessions MUST be managed via FastAPI dependency injection

**API Design Standards:**

- All endpoints MUST strictly follow REST conventions:
  - `GET /api/resource` - List resources (filtered by authenticated user)
  - `GET /api/resource/{id}` - Retrieve single resource (verify ownership)
  - `POST /api/resource` - Create resource (auto-assign to authenticated user)
  - `PUT /api/resource/{id}` - Update resource (verify ownership)
  - `DELETE /api/resource/{id}` - Delete resource (verify ownership)

- Request and response schemas MUST be explicitly defined using Pydantic models
- All request bodies MUST be validated automatically via Pydantic
- All responses MUST follow consistent format:
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Operation successful"
  }
  ```

- Error responses MUST return appropriate HTTP status codes:
  - `200 OK` - Successful GET/PUT/DELETE
  - `201 Created` - Successful POST
  - `400 Bad Request` - Invalid input/validation failure
  - `401 Unauthorized` - Missing or invalid authentication token
  - `403 Forbidden` - Valid token but insufficient permissions
  - `404 Not Found` - Resource does not exist or user lacks access
  - `500 Internal Server Error` - Unexpected server error

- Error responses MUST follow consistent format:
  ```json
  {
    "success": false,
    "error": {
      "code": "ERROR_CODE",
      "message": "Human-readable error message"
    }
  }
  ```

**Code Structure Standards:**

- Route handlers MUST be thin—delegate business logic to service layer
- Service layer MUST contain all business logic and orchestration
- Models MUST contain only data structure and basic validation
- Database queries MUST be encapsulated in repository or service methods
- Dependency injection MUST be used for database sessions, services, and configuration
- Async/await MUST be used consistently for all I/O operations
- Type hints MUST be provided for all function signatures

**Testing Standards for Backend:**

- All API endpoints MUST have integration tests
- Service layer logic MUST have unit tests
- Database models MUST have validation tests
- Authentication/authorization logic MUST have security tests
- Error handling MUST be tested for all failure scenarios
- Tests MUST use pytest with async support (pytest-asyncio)

## Governance

### Authority

This constitution supersedes all other development practices, coding standards, or architectural preferences. When conflicts arise, the constitution takes precedence. Violations must be explicitly justified in the Complexity Tracking section of `plan.md`.

### Amendment Process

1. Proposed amendments must be documented with rationale
2. Impact analysis must identify affected templates, specs, plans, and tasks
3. Version must be incremented according to semantic versioning:
   - **MAJOR**: Backward-incompatible principle removals or redefinitions
   - **MINOR**: New principles added or materially expanded guidance
   - **PATCH**: Clarifications, wording improvements, typo fixes
4. All dependent templates must be updated before amendment is ratified
5. A Sync Impact Report must be generated and prepended to this file

### Compliance Review

All specifications, plans, and tasks MUST include a Constitution Check section verifying:
- [ ] All features defined in specifications before implementation
- [ ] API endpoints traceable to documented features
- [ ] Authentication and authorization enforced consistently
- [ ] Database access scoped to authenticated user
- [ ] Frontend behavior aligns with backend API contracts
- [ ] Implementation derivable from specs and plans
- [ ] No hidden logic outside spec-plan-task workflow
- [ ] Technology stack constraints followed
- [ ] Appropriate agents used for all implementation
- [ ] PHRs and ADRs created as required
- [ ] Backend: All database operations use SQLModel (no raw SQL)
- [ ] Backend: API endpoints follow REST conventions exactly
- [ ] Backend: Request/response schemas explicitly defined with Pydantic
- [ ] Backend: Error responses return appropriate HTTP status codes
- [ ] Backend: Code follows separation of concerns (models, routes, services)
- [ ] Backend: Async/await used consistently for I/O operations
- [ ] Backend: Type hints provided for all function signatures

### Quality Gates

Before marking any feature complete:
- [ ] Specification written and approved
- [ ] Architectural plan documented with Constitution Check passed
- [ ] Tasks broken down and assigned to appropriate agents
- [ ] All code implemented via specialized agents (no manual coding)
- [ ] Authentication properly implemented and tested
- [ ] User data isolation verified (cannot access other users' data)
- [ ] API endpoints tested with valid and invalid tokens
- [ ] Frontend UI responsive and accessible
- [ ] Error handling implemented for all failure scenarios
- [ ] Environment variables documented
- [ ] PHR created for the feature
- [ ] ADRs created for significant decisions

### Success Criteria

The project is considered successful when:
- All 5 basic Todo features work end-to-end in the web application
- REST APIs are fully functional, secure, and user-isolated
- Authentication correctly enforces task ownership
- Data persists reliably in Neon Serverless PostgreSQL
- Frontend is responsive and usable across devices
- Specifications, plans, tasks, and prompts are complete and reviewable
- The project clearly demonstrates agentic, spec-driven development
- No manual code was written—all implementation via Claude Code agents

**Version**: 1.1.0 | **Ratified**: 2026-02-06 | **Last Amended**: 2026-02-06
