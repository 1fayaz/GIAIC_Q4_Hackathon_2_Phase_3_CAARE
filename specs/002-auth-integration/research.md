# Research & Technology Decisions: Authentication & API Security

**Feature**: 002-auth-integration
**Date**: 2026-02-06
**Purpose**: Document technology choices and best practices for JWT authentication integration

## 1. Better Auth JWT Configuration

### Decision: Use Better Auth with JWT Plugin

**Rationale**:
- Better Auth is a modern, TypeScript-first authentication library for Next.js
- Native JWT support with customizable claims
- Seamless integration with Next.js App Router
- Built-in security best practices (CSRF protection, secure cookie handling)

**Configuration**:
```typescript
// lib/auth.ts
import { betterAuth } from "better-auth"

export const auth = betterAuth({
  jwt: {
    enabled: true,
    expiresIn: "1h", // 1 hour access token
    secret: process.env.BETTER_AUTH_SECRET,
    customClaims: (user) => ({
      user_id: user.id,
      email: user.email
    })
  },
  database: {
    // Better Auth can manage its own user table
    // Or integrate with existing Neon PostgreSQL
    provider: "postgresql",
    url: process.env.DATABASE_URL
  }
})
```

**JWT Token Structure**:
```json
{
  "user_id": "uuid-string",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Secret Extraction**: Better Auth uses `BETTER_AUTH_SECRET` environment variable. Backend must use the same secret for verification.

**Alternatives Considered**:
- NextAuth.js: More mature but heavier, session-based by default
- Custom JWT implementation: More control but reinventing the wheel, security risks

## 2. Python JWT Verification Libraries

### Decision: Use python-jose[cryptography]

**Rationale**:
- Official recommendation for FastAPI JWT authentication
- Comprehensive JWT support (signing, verification, claims validation)
- Cryptography backend for secure operations
- Well-documented with FastAPI examples
- Active maintenance and security updates

**Implementation Pattern**:
```python
from jose import JWTError, jwt
from datetime import datetime, timedelta

SECRET_KEY = os.getenv("BETTER_AUTH_SECRET")
ALGORITHM = "HS256"

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def verify_token_expiration(payload: dict) -> bool:
    exp = payload.get("exp")
    if exp is None:
        return False
    return datetime.fromtimestamp(exp) > datetime.utcnow()
```

**Dependencies**:
```
python-jose[cryptography]==3.3.0
```

**Alternatives Considered**:
- PyJWT: Simpler but less feature-complete, no cryptography backend by default
- authlib: More comprehensive but overkill for simple JWT verification

## 3. FastAPI Authentication Patterns

### Decision: Use FastAPI Dependency Injection with OAuth2PasswordBearer

**Rationale**:
- FastAPI's recommended pattern for JWT authentication
- Reusable across all protected endpoints
- Automatic OpenAPI documentation (shows lock icon in Swagger UI)
- Clean separation of concerns (auth logic in one place)

**Implementation Pattern**:
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    token = credentials.credentials
    try:
        payload = decode_token(token)
        if not verify_token_expiration(payload):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired"
            )
        return {
            "user_id": payload.get("user_id"),
            "email": payload.get("email")
        }
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

# Usage in routes
@router.get("/api/{user_id}/tasks")
async def list_tasks(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Verify user_id matches authenticated user
    if current_user["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    # ... rest of endpoint logic
```

**Best Practices**:
- Always validate token expiration
- Extract user identity from token payload (don't trust URL parameters)
- Return 401 for authentication failures, 403 for authorization failures
- Use dependency injection for reusability

**Alternatives Considered**:
- Middleware: Less flexible, harder to exclude specific endpoints
- Manual header parsing: Error-prone, not DRY

## 4. User Model & Database Schema

### Decision: SQLModel User Model with Bcrypt Password Hashing

**Rationale**:
- SQLModel provides type-safe ORM with Pydantic validation
- Bcrypt is industry-standard for password hashing (slow, salted, adaptive)
- Passlib provides unified interface for password hashing algorithms

**User Model**:
```python
from sqlmodel import Field, SQLModel
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(unique=True, index=True, max_length=255)
    hashed_password: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

**Password Hashing**:
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

**Database Migration Strategy**:
- Use SQLModel's `create_all()` for initial table creation
- For production: Use Alembic for versioned migrations
- Migration file: `alembic revision --autogenerate -m "Add users table"`

**Dependencies**:
```
passlib[bcrypt]==1.7.4
```

**Alternatives Considered**:
- Argon2: More secure but slower, overkill for this use case
- Plain SQLAlchemy: More verbose, less type-safe than SQLModel

## 5. Frontend API Client Integration

### Decision: Custom Fetch Wrapper with Automatic Token Injection

**Rationale**:
- Native fetch API (no extra dependencies)
- Centralized token management
- Easy to add interceptors for 401 handling
- Works seamlessly with Next.js App Router

**Implementation Pattern**:
```typescript
// lib/api-client.ts
import { auth } from './auth'

async function apiClient(url: string, options: RequestInit = {}) {
  const session = await auth.getSession()
  const token = session?.accessToken

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    // Token expired or invalid - redirect to login
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  return response
}

// Usage
export const taskApi = {
  list: (userId: string) =>
    apiClient(`${API_URL}/api/${userId}/tasks`),

  create: (userId: string, data: TaskCreate) =>
    apiClient(`${API_URL}/api/${userId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  // ... other methods
}
```

**Token Storage**:
- **Decision**: Use HttpOnly cookies (Better Auth default)
- **Rationale**: More secure than localStorage (immune to XSS attacks)
- **Fallback**: If HttpOnly cookies not feasible, use localStorage with XSS protection

**401 Response Handling**:
- Automatic redirect to login page
- Clear any stored tokens
- Preserve original URL for post-login redirect

**Alternatives Considered**:
- Axios: Extra dependency, overkill for simple use case
- SWR/React Query: Good for caching but adds complexity
- Manual fetch in each component: Not DRY, error-prone

## Technology Stack Summary

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| Frontend Auth | Better Auth | Latest | Modern, TypeScript-first, JWT support |
| Backend JWT | python-jose | 3.3.0 | FastAPI recommended, cryptography backend |
| Password Hash | passlib[bcrypt] | 1.7.4 | Industry standard, slow hashing |
| API Client | Native fetch | Built-in | No extra dependencies, simple |
| Token Storage | HttpOnly cookies | N/A | XSS protection |

## Security Considerations

1. **JWT Secret Management**:
   - Use strong, randomly generated secrets (minimum 256 bits)
   - Store in environment variables, never in code
   - Use same secret on frontend and backend
   - Rotate secrets periodically

2. **Token Expiration**:
   - Access tokens: 1 hour (configurable)
   - Refresh tokens: 7 days (P3 enhancement)
   - Always validate expiration on backend

3. **Password Security**:
   - Minimum 8 characters (enforced by Better Auth)
   - Bcrypt with default cost factor (12 rounds)
   - Never log or expose passwords

4. **HTTPS Requirement**:
   - All authentication must use HTTPS in production
   - Prevents token interception via man-in-the-middle attacks

5. **CORS Configuration**:
   - Restrict allowed origins to known frontend domains
   - Never use wildcard (*) in production

## Performance Considerations

1. **JWT Verification Latency**:
   - Expected: <10ms per request
   - Mitigation: Use cryptography backend (C extensions)
   - Monitor: Add timing metrics to auth dependency

2. **Password Hashing**:
   - Expected: 100-300ms per hash (intentionally slow)
   - Only occurs during registration/login (not on every request)
   - Acceptable trade-off for security

3. **Database Queries**:
   - User lookup by email: Indexed (fast)
   - Token validation: No database query (stateless)

## Open Questions Resolved

All technical unknowns from the plan have been resolved:

1. ✅ Better Auth JWT configuration documented
2. ✅ python-jose selected for backend JWT verification
3. ✅ FastAPI dependency injection pattern defined
4. ✅ User model and password hashing strategy decided
5. ✅ Frontend API client pattern established

## Next Steps

Proceed to Phase 1 design artifacts:
1. Create data-model.md with User entity details
2. Create contracts/auth-api.yaml with authentication endpoints
3. Create quickstart.md with setup instructions
4. Update agent context with new technologies
