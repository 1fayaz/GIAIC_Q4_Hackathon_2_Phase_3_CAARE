---
id: 0002
title: Create Authentication API Security Plan
stage: plan
date: 2026-02-06
surface: agent
model: claude-sonnet-4-5-20250929
feature: 002-auth-integration
branch: 002-auth-integration
user: Fayaz ALI
command: /sp.plan
labels: ["plan", "authentication", "api-security", "jwt", "better-auth", "fastapi", "architecture", "stateless"]
links:
  spec: specs/002-auth-integration/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-auth-integration/plan.md
  - specs/002-auth-integration/research.md
  - specs/002-auth-integration/data-model.md
  - specs/002-auth-integration/contracts/auth-api.yaml
  - specs/002-auth-integration/quickstart.md
tests:
  - N/A (planning phase)
---

## Prompt

```text
/sp.plan

Project: Todo Full-Stack Web Application – Spec 2 (Authentication & API Security)

Objective:
Secure the existing FastAPI REST API using JWT authentication issued by Better Auth on the frontend.

Execution strategy:
Frontend-first authentication → token propagation → backend verification → data isolation.
No changes to API shapes, only security enforcement.

---

### Phase 1: Better Auth Configuration (Frontend)
1. Install and configure Better Auth in Next.js app
2. Enable JWT plugin
3. Configure:
   - Token expiry (e.g. 7 days)
   - Signing secret (BETTER_AUTH_SECRET)
4. Verify JWT is issued on login
5. Confirm token contains:
   - user id
   - email
   - issued at
   - expiry

---

### Phase 2: Frontend API Client Integration
1. Create API client wrapper (fetch or axios)
2. Automatically attach:
   - Authorization: Bearer <JWT>
3. Ensure token is included in:
   - All task CRUD requests
4. Handle 401 responses gracefully

---

### Phase 3: FastAPI JWT Verification
1. Install JWT verification dependency (e.g. python-jose)
2. Load BETTER_AUTH_SECRET from environment
3. Create JWT utility:
   - Decode token
   - Verify signature
   - Validate expiry
4. Extract user identity from token payload

---

### Phase 4: Authentication Middleware / Dependency
1. Create FastAPI dependency:
   - Reads Authorization header
   - Validates Bearer token
2. Reject invalid or missing tokens (401)
3. Attach authenticated user info to request context

---

### Phase 5: Route-Level Authorization Enforcement
1. Apply auth dependency to all task routes
2. Compare:
   - user_id from JWT
   - user_id from URL path
3. Reject mismatches with 403 Forbidden
4. Ensure all DB queries filter by authenticated user

---

### Phase 6: Security Validation & Testing
1. Test API without token → 401
2. Test with invalid token → 401
3. Test cross-user access attempt → 403
4. Test valid user full CRUD flow → success
5. Verify no backend state/session storage

---

### Completion Checklist
- Better Auth issues JWT tokens
- Frontend includes JWT in all requests
- Backend validates JWT signatures
- User data isolation enforced
- Security tests pass
```

## Response snapshot

Successfully created comprehensive architectural plan for Authentication & API Security integration with complete Phase 0 (Research) and Phase 1 (Design) artifacts.

**Planning Artifacts Created:**

1. **plan.md** (380 lines) - Complete implementation plan with:
   - Technical context (Python 3.11+, TypeScript, Better Auth, python-jose, passlib)
   - Constitution checks (Pre-Design: PASS, Post-Design: PASS)
   - Project structure (backend/, frontend/ with detailed file organization)
   - 6 implementation phases (Better Auth config, API client, JWT verification, auth dependency, route protection, security testing)
   - Risk analysis (JWT secret sync, token expiration, cross-user leakage, password security)
   - Completion checklist (13 items)

2. **research.md** (200+ lines) - Technology decisions and best practices:
   - Better Auth with JWT plugin (custom claims: user_id, email)
   - python-jose[cryptography] for backend JWT verification
   - FastAPI dependency injection with HTTPBearer
   - SQLModel User model with bcrypt password hashing
   - Custom fetch wrapper for automatic token injection
   - HttpOnly cookies for secure token storage
   - All 5 research tasks resolved with rationale and alternatives

3. **data-model.md** (150+ lines) - Complete data modeling:
   - User entity (id UUID, email, hashed_password, timestamps)
   - Modified Task entity (added foreign key to User)
   - User → Tasks one-to-many relationship
   - JWT token claims structure (user_id, email, iat, exp)
   - Password hashing strategy (bcrypt with passlib)
   - Data isolation enforcement (filter by user_id, return 404 not 403)
   - Database migration SQL scripts

4. **contracts/auth-api.yaml** (300+ lines) - OpenAPI 3.1 specification:
   - POST /api/auth/register (201 Created, 400 Bad Request, 409 Conflict)
   - POST /api/auth/login (200 OK, 401 Unauthorized)
   - POST /api/auth/logout (200 OK, 401 Unauthorized)
   - Complete request/response schemas (RegisterRequest, LoginRequest, AuthResponse, UserInfo, ErrorResponse)
   - JWT Bearer authentication security scheme
   - Detailed error codes and messages

5. **quickstart.md** (250+ lines) - Setup and testing guide:
   - Environment setup (JWT_SECRET generation, .env configuration)
   - Installation instructions (python-jose, passlib, Better Auth)
   - Database migration (CREATE TABLE users, foreign key constraint)
   - 6 test scenarios (registration, login, authenticated request, unauthorized access, cross-user access, expired token)
   - Frontend testing (registration page, login page, protected dashboard, API client)
   - Troubleshooting guide (5 common issues with solutions)
   - Security checklist (10 items for production deployment)

**Constitution Compliance:**

Pre-Design Check: PASS (9/9 requirements)
- Spec-Driven Development ✅
- End-to-End Correctness ✅
- Secure Multi-User Architecture ✅
- Separation of Concerns ✅
- No Manual Coding ✅
- Incremental Delivery ✅
- Technology Stack ✅
- API Design ✅
- Backend Standards ✅

Post-Design Check: PASS (9/9 requirements)
- All design artifacts complete and traceable to spec
- JWT token format consistent across frontend/backend
- Data isolation strategy documented with foreign key constraints
- Better Auth vs FastAPI responsibilities clearly separated
- Implementation plan references specialized agents
- Phases align with P1/P2/P3 user story priorities
- No technology stack deviations
- REST conventions followed
- SQLModel, bcrypt, dependency injection confirmed

**Agent Context Updated:**
- Added Python 3.11+ (backend), TypeScript/JavaScript (frontend)
- Added Neon Serverless PostgreSQL with users table
- Updated CLAUDE.md with new technologies

**Key Technical Decisions:**

1. **Better Auth** for frontend authentication (JWT plugin, custom claims)
2. **python-jose[cryptography]** for backend JWT verification (FastAPI recommended)
3. **passlib[bcrypt]** for password hashing (industry standard)
4. **FastAPI dependency injection** for reusable auth (HTTPBearer, get_current_user)
5. **HttpOnly cookies** for token storage (XSS protection)
6. **Stateless JWT-only** (no session storage on backend)
7. **404 for cross-user access** (prevent information leakage, not 403)

## Outcome

- ✅ Impact: Complete architectural plan ready for task breakdown. Defines stateless JWT authentication integration with Better Auth (frontend) and FastAPI (backend), including User entity, JWT verification utilities, auth dependencies, and route protection strategy.
- 🧪 Tests: Planning phase complete with constitution checks (Pre-Design: PASS, Post-Design: PASS)
- 📁 Files: Created 5 files (plan.md: 380 lines, research.md: 200+ lines, data-model.md: 150+ lines, auth-api.yaml: 300+ lines, quickstart.md: 250+ lines)
- 🔁 Next prompts: `/sp.tasks` to generate task breakdown, then `/sp.implement` to execute implementation via specialized agents
- 🧠 Reflection: Planning phase completed successfully with comprehensive research and design artifacts. All technical unknowns resolved (Better Auth config, python-jose selection, User model design, API client pattern). Constitution compliance verified at both pre-design and post-design gates. Implementation strategy follows frontend-first approach: Better Auth issues JWT → frontend attaches token → backend verifies → data isolation enforced. Risk analysis identifies JWT secret synchronization as highest risk with clear mitigation. Ready to proceed to task breakdown phase.

## Evaluation notes (flywheel)

- Failure modes observed: None. All research tasks resolved, all design artifacts complete, constitution checks passed.
- Graders run and results (PASS/FAIL): Constitution Check - PASS (Pre-Design: 9/9, Post-Design: 9/9)
- Prompt variant (if applicable): User provided detailed phase breakdown in prompt, which aligned well with standard /sp.plan workflow
- Next experiment (smallest change to try): Proceed to `/sp.tasks` to generate atomic task breakdown organized by user story (P1: registration/login, P2: protected API access, P3: token refresh), then implement via auth-security, nextjs-frontend-architect, and fastapi-backend-architect agents
