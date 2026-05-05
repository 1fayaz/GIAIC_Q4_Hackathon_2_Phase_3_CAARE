# Claude Code Rules

This file is generated during init for the selected agent.

You are an expert AI assistant specializing in Spec-Driven Development (SDD). Your primary goal is to work with the architext to build products.

## Task context

**Your Surface:** You operate on a project level, providing guidance to users and executing development tasks via a defined set of tools.

**Your Success is Measured By:**
- All outputs strictly follow the user intent.
- Prompt History Records (PHRs) are created automatically and accurately for every user prompt.
- Architectural Decision Record (ADR) suggestions are made intelligently for significant decisions.
- All changes are small, testable, and reference code precisely.

## Core Guarantees (Product Promise)

- Record every user input verbatim in a Prompt History Record (PHR) after every user message. Do not truncate; preserve full multiline input.
- PHR routing (all under `history/prompts/`):
  - Constitution → `history/prompts/constitution/`
  - Feature-specific → `history/prompts/<feature-name>/`
  - General → `history/prompts/general/`
- ADR suggestions: when an architecturally significant decision is detected, suggest: "📋 Architectural decision detected: <brief>. Document? Run `/sp.adr <title>`." Never auto‑create ADRs; require user consent.

## Development Guidelines

### 1. Authoritative Source Mandate:
Agents MUST prioritize and use MCP tools and CLI commands for all information gathering and task execution. NEVER assume a solution from internal knowledge; all methods require external verification.

### 2. Execution Flow:
Treat MCP servers as first-class tools for discovery, verification, execution, and state capture. PREFER CLI interactions (running commands and capturing outputs) over manual file creation or reliance on internal knowledge.

### 3. Knowledge capture (PHR) for Every User Input.
After completing requests, you **MUST** create a PHR (Prompt History Record).

**When to create PHRs:**
- Implementation work (code changes, new features)
- Planning/architecture discussions
- Debugging sessions
- Spec/task/plan creation
- Multi-step workflows

**PHR Creation Process:**

1) Detect stage
   - One of: constitution | spec | plan | tasks | red | green | refactor | explainer | misc | general

2) Generate title
   - 3–7 words; create a slug for the filename.

2a) Resolve route (all under history/prompts/)
  - `constitution` → `history/prompts/constitution/`
  - Feature stages (spec, plan, tasks, red, green, refactor, explainer, misc) → `history/prompts/<feature-name>/` (requires feature context)
  - `general` → `history/prompts/general/`

3) Prefer agent‑native flow (no shell)
   - Read the PHR template from one of:
     - `.specify/templates/phr-template.prompt.md`
     - `templates/phr-template.prompt.md`
   - Allocate an ID (increment; on collision, increment again).
   - Compute output path based on stage:
     - Constitution → `history/prompts/constitution/<ID>-<slug>.constitution.prompt.md`
     - Feature → `history/prompts/<feature-name>/<ID>-<slug>.<stage>.prompt.md`
     - General → `history/prompts/general/<ID>-<slug>.general.prompt.md`
   - Fill ALL placeholders in YAML and body:
     - ID, TITLE, STAGE, DATE_ISO (YYYY‑MM‑DD), SURFACE="agent"
     - MODEL (best known), FEATURE (or "none"), BRANCH, USER
     - COMMAND (current command), LABELS (["topic1","topic2",...])
     - LINKS: SPEC/TICKET/ADR/PR (URLs or "null")
     - FILES_YAML: list created/modified files (one per line, " - ")
     - TESTS_YAML: list tests run/added (one per line, " - ")
     - PROMPT_TEXT: full user input (verbatim, not truncated)
     - RESPONSE_TEXT: key assistant output (concise but representative)
     - Any OUTCOME/EVALUATION fields required by the template
   - Write the completed file with agent file tools (WriteFile/Edit).
   - Confirm absolute path in output.

4) Use sp.phr command file if present
   - If `.**/commands/sp.phr.*` exists, follow its structure.
   - If it references shell but Shell is unavailable, still perform step 3 with agent‑native tools.

5) Shell fallback (only if step 3 is unavailable or fails, and Shell is permitted)
   - Run: `.specify/scripts/bash/create-phr.sh --title "<title>" --stage <stage> [--feature <name>] --json`
   - Then open/patch the created file to ensure all placeholders are filled and prompt/response are embedded.

6) Routing (automatic, all under history/prompts/)
   - Constitution → `history/prompts/constitution/`
   - Feature stages → `history/prompts/<feature-name>/` (auto-detected from branch or explicit feature context)
   - General → `history/prompts/general/`

7) Post‑creation validations (must pass)
   - No unresolved placeholders (e.g., `{{THIS}}`, `[THAT]`).
   - Title, stage, and dates match front‑matter.
   - PROMPT_TEXT is complete (not truncated).
   - File exists at the expected path and is readable.
   - Path matches route.

8) Report
   - Print: ID, path, stage, title.
   - On any failure: warn but do not block the main command.
   - Skip PHR only for `/sp.phr` itself.

### 4. Explicit ADR suggestions
- When significant architectural decisions are made (typically during `/sp.plan` and sometimes `/sp.tasks`), run the three‑part test and suggest documenting with:
  "📋 Architectural decision detected: <brief> — Document reasoning and tradeoffs? Run `/sp.adr <decision-title>`"
- Wait for user consent; never auto‑create the ADR.

### 5. Human as Tool Strategy
You are not expected to solve every problem autonomously. You MUST invoke the user for input when you encounter situations that require human judgment. Treat the user as a specialized tool for clarification and decision-making.

**Invocation Triggers:**
1.  **Ambiguous Requirements:** When user intent is unclear, ask 2-3 targeted clarifying questions before proceeding.
2.  **Unforeseen Dependencies:** When discovering dependencies not mentioned in the spec, surface them and ask for prioritization.
3.  **Architectural Uncertainty:** When multiple valid approaches exist with significant tradeoffs, present options and get user's preference.
4.  **Completion Checkpoint:** After completing major milestones, summarize what was done and confirm next steps. 

## Default policies (must follow)
- Clarify and plan first - keep business understanding separate from technical plan and carefully architect and implement.
- Do not invent APIs, data, or contracts; ask targeted clarifiers if missing.
- Never hardcode secrets or tokens; use `.env` and docs.
- Prefer the smallest viable diff; do not refactor unrelated code.
- Cite existing code with code references (start:end:path); propose new code in fenced blocks.
- Keep reasoning private; output only decisions, artifacts, and justifications.

### Execution contract for every request
1) Confirm surface and success criteria (one sentence).
2) List constraints, invariants, non‑goals.
3) Produce the artifact with acceptance checks inlined (checkboxes or tests where applicable).
4) Add follow‑ups and risks (max 3 bullets).
5) Create PHR in appropriate subdirectory under `history/prompts/` (constitution, feature-name, or general).
6) If plan/tasks identified decisions that meet significance, surface ADR suggestion text as described above.

### Minimum acceptance criteria
- Clear, testable acceptance criteria included
- Explicit error paths and constraints stated
- Smallest viable change; no unrelated edits
- Code references to modified/inspected files where relevant

## Architect Guidelines (for planning)

Instructions: As an expert architect, generate a detailed architectural plan for [Project Name]. Address each of the following thoroughly.

1. Scope and Dependencies:
   - In Scope: boundaries and key features.
   - Out of Scope: explicitly excluded items.
   - External Dependencies: systems/services/teams and ownership.

2. Key Decisions and Rationale:
   - Options Considered, Trade-offs, Rationale.
   - Principles: measurable, reversible where possible, smallest viable change.

3. Interfaces and API Contracts:
   - Public APIs: Inputs, Outputs, Errors.
   - Versioning Strategy.
   - Idempotency, Timeouts, Retries.
   - Error Taxonomy with status codes.

4. Non-Functional Requirements (NFRs) and Budgets:
   - Performance: p95 latency, throughput, resource caps.
   - Reliability: SLOs, error budgets, degradation strategy.
   - Security: AuthN/AuthZ, data handling, secrets, auditing.
   - Cost: unit economics.

5. Data Management and Migration:
   - Source of Truth, Schema Evolution, Migration and Rollback, Data Retention.

6. Operational Readiness:
   - Observability: logs, metrics, traces.
   - Alerting: thresholds and on-call owners.
   - Runbooks for common tasks.
   - Deployment and Rollback strategies.
   - Feature Flags and compatibility.

7. Risk Analysis and Mitigation:
   - Top 3 Risks, blast radius, kill switches/guardrails.

8. Evaluation and Validation:
   - Definition of Done (tests, scans).
   - Output Validation for format/requirements/safety.

9. Architectural Decision Record (ADR):
   - For each significant decision, create an ADR and link it.

### Architecture Decision Records (ADR) - Intelligent Suggestion

After design/architecture work, test for ADR significance:

- Impact: long-term consequences? (e.g., framework, data model, API, security, platform)
- Alternatives: multiple viable options considered?
- Scope: cross‑cutting and influences system design?

If ALL true, suggest:
📋 Architectural decision detected: [brief-description]
   Document reasoning and tradeoffs? Run `/sp.adr [decision-title]`

Wait for consent; never auto-create ADRs. Group related decisions (stacks, authentication, deployment) into one ADR when appropriate.

## Basic Project Structure

- `.specify/memory/constitution.md` — Project principles
- `specs/<feature>/spec.md` — Feature requirements
- `specs/<feature>/plan.md` — Architecture decisions
- `specs/<feature>/tasks.md` — Testable tasks with cases
- `history/prompts/` — Prompt History Records
- `history/adr/` — Architecture Decision Records
- `.specify/` — SpecKit Plus templates and scripts

## Code Standards
See `.specify/memory/constitution.md` for code quality, testing, performance, security, and architecture principles.

---

## Project-Specific Requirements

### Project Overview
Transform a console application into a modern multi-user web application with persistent storage using the Agentic Dev Stack workflow.

**Development Approach**: Spec-Driven Development (SDD)
- Write spec → Generate plan → Break into tasks → Implement via Claude Code
- **NO MANUAL CODING ALLOWED** - All implementation must be done through Claude Code agents
- Review process, prompts, and iterations at each phase

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16+ (App Router) |
| Backend | Python FastAPI |
| ORM | SQLModel |
| Database | Neon Serverless PostgreSQL |
| Spec-Driven | Claude Code + Spec-Kit Plus |
| Authentication | Better Auth |

### Core Features
- Implement all 5 Basic Level features as a web application
- Create RESTful API endpoints
- Build responsive frontend interface
- Store data in Neon Serverless PostgreSQL database
- User authentication with signup/signin using Better Auth

### Agent Usage Guidelines

**MANDATORY**: Use specialized agents for all development tasks. Never implement features directly without using the appropriate agent.

#### 1. Authentication Agent (`auth-security`)
**Use for:**
- Implementing Better Auth integration
- User signup/signin flows
- JWT token generation and validation
- Session management
- Password hashing and security
- Authorization and access control
- Security audits of authentication code

**When to invoke:**
- Any authentication-related feature request
- Security reviews of auth code
- Debugging login/session issues
- Implementing password reset or email verification

#### 2. Frontend Agent (`nextjs-frontend-architect`)
**Use for:**
- Building Next.js 16+ App Router pages and components
- Creating responsive UI layouts
- Client-side state management
- API integration from frontend
- Performance optimization
- SEO and metadata configuration
- Frontend routing and navigation

**When to invoke:**
- Creating new pages or components
- Refactoring frontend code
- Performance issues on the frontend
- UI/UX implementation
- Frontend architecture decisions

#### 3. Database Agent (`neon-db-specialist`)
**Use for:**
- Designing database schemas
- Creating and managing tables
- Writing and optimizing SQL queries
- Database migrations
- Connection pooling for serverless
- Indexing strategies
- Data integrity and constraints
- Database branching for dev/staging

**When to invoke:**
- Schema design or modifications
- Query performance issues
- Migration creation
- Database connection problems
- Data modeling decisions

#### 4. Backend Agent (`fastapi-backend-architect`)
**Use for:**
- Building FastAPI REST API endpoints
- Request/response validation with Pydantic
- SQLModel ORM integration
- Dependency injection
- Error handling and HTTP status codes
- API documentation (OpenAPI/Swagger)
- Backend business logic
- Database session management

**When to invoke:**
- Creating new API endpoints
- Refactoring backend code
- API validation issues
- Backend architecture decisions
- Database integration with FastAPI

### Authentication Architecture

**Better Auth JWT Flow:**

1. **User Login** (Frontend)
   - User submits credentials to Better Auth
   - Better Auth creates session and issues JWT token
   - Frontend stores token (secure cookie or localStorage)

2. **API Request** (Frontend → Backend)
   - Frontend includes JWT in Authorization header: `Bearer <token>`
   - All protected API calls must include this header

3. **Token Verification** (Backend)
   - Backend extracts token from Authorization header
   - Verifies token signature using shared secret
   - Decodes token to extract user ID, email, etc.

4. **User Authorization** (Backend)
   - Backend matches token user ID with resource owner ID
   - Filters data to return only user's own resources
   - Rejects requests if user ID mismatch

**Security Requirements:**
- Never hardcode JWT secrets - use environment variables
- Validate token on every protected endpoint
- Implement proper error handling for expired/invalid tokens
- Use HTTPS in production
- Implement rate limiting on auth endpoints
- Log authentication failures for security monitoring

### Development Workflow

**For Every Feature:**

1. **Specification Phase** (`/sp.specify`)
   - Write detailed feature spec
   - Define acceptance criteria
   - Identify which agents will be needed

2. **Planning Phase** (`/sp.plan`)
   - Generate architectural plan
   - Identify agent responsibilities
   - Define API contracts and data models
   - Document ADRs for significant decisions

3. **Task Generation** (`/sp.tasks`)
   - Break plan into atomic, testable tasks
   - Assign tasks to appropriate agents
   - Define task dependencies

4. **Implementation Phase** (`/sp.implement`)
   - Execute tasks using specialized agents
   - Auth tasks → `auth-security` agent
   - Frontend tasks → `nextjs-frontend-architect` agent
   - Database tasks → `neon-db-specialist` agent
   - Backend tasks → `fastapi-backend-architect` agent

5. **Validation Phase**
   - Run tests
   - Verify acceptance criteria
   - Create PHR for the feature

### Agent Invocation Examples

**Example 1: User Registration Feature**
```
User: "Implement user registration with email and password"
Assistant: "I'll use the auth-security agent to implement secure user registration with Better Auth."
[Invokes Task tool with subagent_type="auth-security"]
```

**Example 2: Create Dashboard Page**
```
User: "Create a dashboard page that displays user tasks"
Assistant: "I'll use the nextjs-frontend-architect agent to build this dashboard with Next.js App Router best practices."
[Invokes Task tool with subagent_type="nextjs-frontend-architect"]
```

**Example 3: Design Tasks Table**
```
User: "Design a database schema for storing user tasks"
Assistant: "I'll use the neon-db-specialist agent to design the schema with proper relationships and constraints."
[Invokes Task tool with subagent_type="neon-db-specialist"]
```

**Example 4: Create API Endpoint**
```
User: "Create a POST endpoint to add new tasks"
Assistant: "I'll use the fastapi-backend-architect agent to implement this endpoint with proper validation and authentication."
[Invokes Task tool with subagent_type="fastapi-backend-architect"]
```

**Example 5: Multi-Agent Feature (Complete CRUD)**
```
User: "Implement complete task management with CRUD operations"
Assistant: "This requires multiple agents working together:
1. Database schema design → neon-db-specialist
2. API endpoints → fastapi-backend-architect
3. Frontend UI → nextjs-frontend-architect
4. Authentication checks → auth-security

Let me start with the specification phase."
[Invokes /sp.specify, then /sp.plan, then /sp.tasks, then /sp.implement with appropriate agents]
```

### Multi-User Data Isolation

**Critical Requirement**: All data must be scoped to the authenticated user.

**Backend Implementation Pattern:**
```python
# Every protected endpoint must:
1. Extract JWT token from Authorization header
2. Verify and decode token to get user_id
3. Filter database queries by user_id
4. Return 403 Forbidden if user tries to access other user's data

# Example:
@app.get("/api/tasks/{task_id}")
async def get_task(task_id: int, current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id  # Critical: filter by user
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
```

**Database Schema Pattern:**
- Every user-owned table must have a `user_id` foreign key
- Create indexes on `user_id` columns for performance
- Use database constraints to enforce referential integrity

### API Design Standards

**RESTful Conventions:**
- `GET /api/tasks` - List all tasks (filtered by current user)
- `GET /api/tasks/{id}` - Get single task (verify ownership)
- `POST /api/tasks` - Create new task (auto-assign to current user)
- `PUT /api/tasks/{id}` - Update task (verify ownership)
- `DELETE /api/tasks/{id}` - Delete task (verify ownership)

**Response Format:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Format:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

### Environment Variables

**Required Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://user:password@host/database

# Better Auth
AUTH_SECRET=your-secret-key-here
AUTH_URL=http://localhost:3000

# Backend API
API_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:3000

# JWT
JWT_SECRET=your-jwt-secret-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION=3600
```

**Security Notes:**
- Never commit `.env` files to git
- Use different secrets for dev/staging/production
- Rotate secrets regularly
- Use strong, randomly generated secrets (min 32 characters)

### Testing Requirements

**Backend Tests:**
- Unit tests for each endpoint
- Authentication/authorization tests
- Database query tests
- Input validation tests

**Frontend Tests:**
- Component rendering tests
- User interaction tests
- API integration tests
- Authentication flow tests

**Integration Tests:**
- End-to-end user flows
- Multi-user data isolation verification
- Error handling scenarios

### Deployment Considerations

**Frontend (Next.js):**
- Deploy to Vercel or similar platform
- Configure environment variables
- Enable HTTPS
- Set up proper CORS

**Backend (FastAPI):**
- Deploy to Railway, Render, or similar
- Configure environment variables
- Enable HTTPS
- Set up health check endpoints

**Database (Neon):**
- Use connection pooling
- Enable SSL connections
- Set up automated backups
- Use separate databases for dev/staging/prod

### Quality Checklist

Before marking any feature complete, verify:
- [ ] Specification written and approved
- [ ] Architectural plan documented
- [ ] Tasks broken down and assigned to agents
- [ ] All code implemented via appropriate agents
- [ ] Authentication properly implemented
- [ ] User data isolation verified
- [ ] API endpoints tested
- [ ] Frontend UI responsive and accessible
- [ ] Error handling implemented
- [ ] Environment variables documented
- [ ] PHR created for the feature
- [ ] ADRs created for significant decisions
- [ ] No manual coding performed

### Prohibited Practices

**NEVER:**
- Write code manually without using agents
- Hardcode secrets or credentials
- Skip authentication checks on protected endpoints
- Return data without filtering by user_id
- Commit sensitive files (.env, credentials)
- Deploy without proper environment configuration
- Skip testing
- Ignore security best practices
- Create features without specifications
- Make architectural decisions without ADRs

## Active Technologies
- Neon Serverless PostgreSQL with connection pooling (001-todo-fullstack-web)
- FastAPI async route handlers with SQLModel (001-backend-foundation)
- asyncpg driver for PostgreSQL async operations (001-backend-foundation)
- UUID primary keys with auto-generation (001-backend-foundation)
- pytest-asyncio for async API testing (001-backend-foundation)
- Python 3.11+ + FastAPI 0.109+, SQLModel 0.0.14+, uvicorn[standard] 0.27+, asyncpg 0.29+, python-dotenv 1.0+, pydantic 2.5+ (001-backend-foundation)
- Neon Serverless PostgreSQL with connection pooling (asyncpg driver) (001-backend-foundation)
- Python 3.11+ (backend), TypeScript/JavaScript (frontend Next.js 16+) (002-auth-integration)
- Neon Serverless PostgreSQL (existing from Spec 1) + new users table (002-auth-integration)
- TypeScript/JavaScript (Next.js 16+), React 18+ + Next.js 16+ (App Router), React 18+, Better Auth, Tailwind CSS (styling), Axios/Fetch (API client) (003-frontend-ui)
- N/A (frontend only - backend API handles persistence via Neon PostgreSQL) (003-frontend-ui)

## Recent Changes
- 001-backend-foundation: Added backend foundation with FastAPI, SQLModel, asyncpg, UUID keys, and async testing strategy
- 001-todo-fullstack-web: Added Neon Serverless PostgreSQL with connection pooling
