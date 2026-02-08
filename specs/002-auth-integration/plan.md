# Implementation Plan: Authentication & API Security

**Branch**: `002-auth-integration` | **Date**: 2026-02-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-auth-integration/spec.md`

## Summary

Integrate JWT-based authentication between Better Auth (frontend) and FastAPI (backend) to secure all API endpoints and enforce strict user data isolation. The implementation follows a stateless authentication model where Better Auth issues JWT tokens on login, the frontend includes tokens in all API requests, and the backend verifies tokens before processing requests. No changes to existing API shapes—only security enforcement is added.

**Primary Requirement**: Secure existing FastAPI REST API using JWT authentication issued by Better Auth on the frontend.

**Technical Approach**: Frontend-first authentication → token propagation → backend verification → data isolation enforcement. Better Auth handles user registration/login and JWT issuance. Frontend API client automatically attaches JWT tokens to all requests. Backend validates JWT signatures, extracts user identity, and enforces authorization at the route level.

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript/JavaScript (frontend Next.js 16+)
**Primary Dependencies**:
- Backend: FastAPI 0.109.0, python-jose[cryptography] 3.3.0, passlib[bcrypt] 1.7.4
- Frontend: Better Auth (latest), Next.js 16+ App Router
**Storage**: Neon Serverless PostgreSQL (existing from Spec 1) + new users table
**Testing**: pytest-asyncio (backend), Jest/React Testing Library (frontend)
**Target Platform**: Web application (Linux server for backend, browser for frontend)
**Project Type**: Web (frontend + backend)
**Performance Goals**: JWT validation <50ms latency, authentication endpoints <500ms response time, support 1000 concurrent authenticated users
**Constraints**: Stateless JWT-only (no session storage), HTTPS required in production, token expiration configurable (default 1 hour)
**Scale/Scope**: Multi-user application with strict data isolation, 20 functional requirements across frontend/backend/integration

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check

- ✅ **Spec-Driven Development**: Specification complete in `specs/002-auth-integration/spec.md` with 3 prioritized user stories
- ✅ **End-to-End Correctness**: JWT token format and claims structure defined for frontend/backend consistency
- ✅ **Secure Multi-User Architecture**: All 20 functional requirements enforce JWT validation and user data isolation
- ✅ **Separation of Concerns**: Better Auth handles frontend auth, FastAPI handles backend verification, clear boundaries
- ✅ **No Manual Coding**: Implementation will use auth-security, nextjs-frontend-architect, fastapi-backend-architect agents
- ✅ **Incremental Delivery**: P1 (registration/login MVP), P2 (protected API access), P3 (token refresh) independently testable
- ✅ **Technology Stack**: Better Auth (frontend), FastAPI (backend), SQLModel (ORM), Neon PostgreSQL (database)
- ✅ **API Design**: Existing REST endpoints from Spec 1 will be secured without shape changes
- ✅ **Backend Standards**: JWT verification via python-jose, dependency injection for auth, proper HTTP status codes

**Status**: PASS - All constitution requirements satisfied

### Post-Design Check

**Design Artifacts Completed**:
- ✅ research.md - All technical decisions documented (Better Auth, python-jose, bcrypt, fetch API)
- ✅ data-model.md - User entity, Task relationship, JWT claims structure, password hashing strategy
- ✅ contracts/auth-api.yaml - Authentication endpoints (register, login, logout) with OpenAPI 3.1 spec
- ✅ quickstart.md - Complete setup and testing guide with troubleshooting

**Constitution Compliance Review**:

- ✅ **Spec-Driven Development**: All design decisions traceable to spec requirements
- ✅ **End-to-End Correctness**: JWT token format consistent across frontend/backend, User-Task relationship properly defined
- ✅ **Secure Multi-User Architecture**: Data isolation strategy documented, foreign key constraints enforced, 404 for cross-user access
- ✅ **Separation of Concerns**: Better Auth (frontend) vs FastAPI (backend) responsibilities clearly defined
- ✅ **No Manual Coding**: Implementation plan references auth-security, nextjs-frontend-architect, fastapi-backend-architect agents
- ✅ **Incremental Delivery**: Implementation phases align with P1/P2/P3 user story priorities
- ✅ **Technology Stack**: Better Auth, python-jose, passlib confirmed; no deviations from constitution
- ✅ **API Design**: Authentication endpoints follow REST conventions, proper HTTP status codes documented
- ✅ **Backend Standards**: SQLModel for User entity, bcrypt password hashing, dependency injection for auth

**Status**: PASS - All constitution requirements satisfied post-design

## Project Structure

### Documentation (this feature)

```text
specs/002-auth-integration/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
│   └── auth-api.yaml    # Authentication endpoints OpenAPI spec
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── core/
│   │   ├── config.py           # Existing - add JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION
│   │   ├── database.py         # Existing - no changes
│   │   └── auth.py             # NEW - JWT verification utilities
│   ├── models/
│   │   ├── task.py             # Existing - no changes
│   │   └── user.py             # NEW - User SQLModel
│   ├── schemas/
│   │   ├── task.py             # Existing - no changes
│   │   └── auth.py             # NEW - Login, Register, Token response schemas
│   ├── routes/
│   │   ├── tasks.py            # MODIFY - add auth dependency to all endpoints
│   │   └── auth.py             # NEW - login/register endpoints (if backend handles)
│   ├── dependencies/
│   │   └── auth.py             # NEW - get_current_user dependency
│   └── main.py                 # MODIFY - register auth routes if needed
├── tests/
│   ├── test_auth.py            # NEW - JWT verification tests
│   └── test_tasks_auth.py      # NEW - authenticated task endpoint tests
└── requirements.txt            # MODIFY - add python-jose, passlib

frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx        # NEW - Login page with Better Auth
│   │   └── register/
│   │       └── page.tsx        # NEW - Registration page with Better Auth
│   ├── dashboard/
│   │   └── page.tsx            # MODIFY - add authentication check
│   └── layout.tsx              # MODIFY - add auth provider
├── lib/
│   ├── auth.ts                 # NEW - Better Auth configuration
│   └── api-client.ts           # NEW - API client with JWT token injection
└── package.json                # MODIFY - add Better Auth dependency
```

**Structure Decision**: Web application structure with separate backend/ and frontend/ directories. Backend follows FastAPI best practices with core/, models/, schemas/, routes/, dependencies/ separation. Frontend follows Next.js 16+ App Router conventions with app/ directory and route groups for authentication pages.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. All constitution requirements are satisfied.

## Phase 0: Research & Technology Decisions

**Objective**: Resolve all technical unknowns and document technology choices for JWT authentication integration.

### Research Tasks

1. **Better Auth JWT Configuration**
   - Research: How to configure Better Auth to issue JWT tokens with custom claims (user_id, email)
   - Research: Better Auth JWT plugin configuration and token expiration settings
   - Research: How to extract JWT secret from Better Auth for backend verification

2. **Python JWT Verification Libraries**
   - Research: python-jose vs PyJWT for FastAPI JWT verification
   - Research: Best practices for JWT signature verification in FastAPI
   - Research: How to handle token expiration and invalid tokens

3. **FastAPI Authentication Patterns**
   - Research: FastAPI dependency injection for authentication
   - Research: How to create reusable auth dependencies (get_current_user)
   - Research: Best practices for extracting user identity from JWT claims

4. **User Model & Database Schema**
   - Research: SQLModel User model structure for authentication
   - Research: Password hashing with passlib and bcrypt
   - Research: Database migration strategy for adding users table

5. **Frontend API Client Integration**
   - Research: How to automatically attach JWT tokens to all API requests in Next.js
   - Research: Token storage best practices (HttpOnly cookies vs localStorage)
   - Research: Handling 401 responses and token refresh

**Output**: `research.md` with all decisions documented

## Phase 1: Design & Contracts

**Prerequisites**: `research.md` complete

### Data Model Design

**Objective**: Define User entity and relationships with existing Task entity.

**Output**: `data-model.md` with:
- User entity (id, email, hashed_password, created_at, updated_at)
- Relationship between User and Task (one-to-many)
- Password hashing strategy
- JWT token claims structure

### API Contracts

**Objective**: Define authentication endpoints and document JWT token format.

**Output**: `contracts/auth-api.yaml` (OpenAPI 3.1 spec) with:
- POST /api/auth/register - User registration
- POST /api/auth/login - User login (returns JWT)
- POST /api/auth/logout - User logout (optional)
- JWT token format documentation (claims, expiration, algorithm)
- Error response formats (401, 400, 409)

**Note**: Existing task endpoints from Spec 1 do not change shape—only add Authorization header requirement.

### Quickstart Guide

**Objective**: Document setup and testing procedures for authentication.

**Output**: `quickstart.md` with:
- Environment variable setup (JWT_SECRET, BETTER_AUTH_SECRET)
- Better Auth installation and configuration
- Backend JWT verification setup
- Testing authentication flow (register → login → authenticated API call)
- Troubleshooting common issues

### Agent Context Update

**Objective**: Update agent-specific context files with new authentication technologies.

**Command**: `.specify/scripts/bash/update-agent-context.sh claude`

**Updates**:
- Add python-jose, passlib to backend dependencies
- Add Better Auth to frontend dependencies
- Document JWT authentication pattern
- Reference auth-security agent for implementation

## Phase 2: Task Breakdown

**Prerequisites**: Phase 1 complete (research.md, data-model.md, contracts/, quickstart.md)

**Objective**: Break down implementation into atomic, testable tasks organized by user story.

**Output**: `tasks.md` (generated by `/sp.tasks` command - NOT by this /sp.plan command)

**Expected Task Structure**:
- Foundational Phase: User model, JWT utilities, auth dependencies
- User Story 1 (P1): Better Auth setup, registration/login pages, JWT issuance
- User Story 2 (P2): Backend JWT verification, protect task endpoints, data isolation
- User Story 3 (P3): Token refresh logic, session management

## Implementation Phases (High-Level)

### Phase 1: Better Auth Configuration (Frontend)

**Objective**: Set up Better Auth to issue JWT tokens on successful authentication.

**Key Activities**:
1. Install Better Auth in Next.js app
2. Configure JWT plugin with custom claims (user_id, email)
3. Set token expiration (default: 1 hour)
4. Configure signing secret (BETTER_AUTH_SECRET environment variable)
5. Create registration and login pages
6. Verify JWT is issued on successful login
7. Test token contains required claims (user_id, email, exp, iat)

**Success Criteria**: Users can register and login, receiving a valid JWT token.

### Phase 2: Frontend API Client Integration

**Objective**: Ensure all API requests include JWT token in Authorization header.

**Key Activities**:
1. Create API client wrapper (using fetch or axios)
2. Automatically attach Authorization: Bearer <JWT> header
3. Include token in all task CRUD requests
4. Handle 401 responses (redirect to login)
5. Handle token expiration gracefully

**Success Criteria**: All API requests include valid JWT token, 401 responses handled correctly.

### Phase 3: FastAPI JWT Verification

**Objective**: Implement JWT signature verification and token validation on backend.

**Key Activities**:
1. Install python-jose[cryptography] for JWT verification
2. Load BETTER_AUTH_SECRET from environment (must match frontend)
3. Create JWT utility functions:
   - decode_token(token: str) → dict
   - verify_signature(token: str) → bool
   - validate_expiration(token: str) → bool
4. Extract user identity (user_id, email) from token payload
5. Handle invalid/expired/malformed tokens

**Success Criteria**: Backend can verify JWT signatures and extract user identity.

### Phase 4: Authentication Middleware / Dependency

**Objective**: Create reusable FastAPI dependency for authentication.

**Key Activities**:
1. Create get_current_user dependency:
   - Read Authorization header
   - Extract Bearer token
   - Validate token using JWT utilities
   - Return authenticated user info
2. Reject requests without token (401 Unauthorized)
3. Reject requests with invalid token (401 Unauthorized)
4. Attach user info to request context

**Success Criteria**: Reusable auth dependency available for all protected routes.

### Phase 5: Route-Level Authorization Enforcement

**Objective**: Protect all task endpoints and enforce user data isolation.

**Key Activities**:
1. Apply get_current_user dependency to all task routes
2. Compare user_id from JWT with user_id in URL path
3. Reject mismatches with 403 Forbidden
4. Ensure all database queries filter by authenticated user_id
5. Return 404 (not 403) for cross-user access attempts (prevent information leakage)

**Success Criteria**: Users can only access their own tasks, cross-user access blocked.

### Phase 6: Security Validation & Testing

**Objective**: Comprehensive security testing of authentication system.

**Key Activities**:
1. Test API without token → 401 Unauthorized
2. Test with invalid token → 401 Unauthorized
3. Test with expired token → 401 Unauthorized
4. Test cross-user access attempt → 404 Not Found
5. Test valid user full CRUD flow → success
6. Verify no backend session storage (stateless)
7. Test concurrent authenticated users
8. Security audit for common vulnerabilities

**Success Criteria**: All security tests pass, zero vulnerabilities found.

## Completion Checklist

- [ ] Better Auth installed and configured on frontend
- [ ] JWT tokens issued on successful login
- [ ] Frontend API client includes JWT in all requests
- [ ] Backend JWT verification implemented (python-jose)
- [ ] get_current_user dependency created
- [ ] All task endpoints protected with auth dependency
- [ ] User data isolation enforced (queries filter by user_id)
- [ ] Cross-user access blocked (404 response)
- [ ] Security tests pass (401 for missing/invalid tokens)
- [ ] Full CRUD flow works for authenticated users
- [ ] No backend session storage (stateless verification)
- [ ] Environment variables documented (.env.example)
- [ ] Quickstart guide complete with testing instructions

## Risk Analysis

### High-Risk Areas

1. **JWT Secret Synchronization**
   - **Risk**: Frontend and backend use different JWT secrets → token verification fails
   - **Mitigation**: Use same environment variable (BETTER_AUTH_SECRET) on both sides, document clearly in quickstart.md

2. **Token Expiration Handling**
   - **Risk**: Expired tokens not handled gracefully → poor user experience
   - **Mitigation**: Implement token refresh (P3), clear error messages, automatic redirect to login

3. **Cross-User Data Leakage**
   - **Risk**: Authorization checks missed → users access other users' data
   - **Mitigation**: Comprehensive testing, enforce user_id filtering at database query level, return 404 (not 403)

4. **Password Security**
   - **Risk**: Weak password hashing → account compromise
   - **Mitigation**: Use bcrypt with passlib, enforce password strength on frontend (Better Auth)

### Medium-Risk Areas

1. **Token Storage Security**
   - **Risk**: JWT stored insecurely → XSS attacks can steal tokens
   - **Mitigation**: Use HttpOnly cookies if possible, document security best practices

2. **Performance Impact**
   - **Risk**: JWT verification adds latency → slow API responses
   - **Mitigation**: Optimize verification (cache public keys if using asymmetric), monitor latency

## Dependencies

### External Dependencies

- **Better Auth**: Frontend authentication library (latest stable version)
- **python-jose[cryptography]**: Backend JWT verification (3.3.0)
- **passlib[bcrypt]**: Password hashing (1.7.4)

### Internal Dependencies

- **Spec 1 (Backend Foundation)**: Must be complete. All task API endpoints must exist.
- **Neon PostgreSQL Database**: Must be accessible with users table created.
- **Environment Variables**: JWT_SECRET, BETTER_AUTH_SECRET must be configured.

### Prerequisite Tasks

1. Create users table in Neon PostgreSQL
2. Install Better Auth on frontend
3. Install python-jose and passlib on backend
4. Configure shared JWT secret in environment variables

## Notes

- This plan focuses on stateless JWT-based authentication as specified
- Better Auth handles all frontend authentication logic (registration, login, token issuance)
- Backend only validates JWT signatures and enforces authorization
- No session storage on backend—fully stateless
- User data isolation enforced at API layer by validating user_id in JWT matches request
- Existing task API endpoints from Spec 1 do not change shape—only add authentication requirement
- Token refresh (P3) is optional enhancement, can be added after core auth works
- Security-first approach: return 404 instead of 403 to prevent information leakage
