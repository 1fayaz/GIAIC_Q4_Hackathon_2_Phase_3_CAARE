# Quickstart Guide: Authentication & API Security

**Feature**: 002-auth-integration
**Date**: 2026-02-06
**Purpose**: Setup and testing instructions for JWT authentication integration

## Prerequisites

Before starting, ensure you have:

- ✅ Spec 1 (Backend Foundation) complete - all task API endpoints working
- ✅ Neon PostgreSQL database accessible
- ✅ Python 3.11+ installed
- ✅ Node.js 18+ installed
- ✅ Backend virtual environment activated

## Environment Setup

### 1. Generate JWT Secret

Generate a strong secret key for JWT signing (minimum 256 bits):

```bash
# Generate a secure random secret
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output - you'll use it for both frontend and backend.

### 2. Backend Environment Variables

Update your `.env` file in the project root:

```bash
# Existing variables from Spec 1
DATABASE_URL=postgresql+asyncpg://user:password@host/database?ssl=require
CORS_ORIGINS=["http://localhost:3000"]
LOG_LEVEL=INFO

# NEW: Authentication variables
JWT_SECRET=your-generated-secret-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION=3600  # 1 hour in seconds
BETTER_AUTH_SECRET=your-generated-secret-here  # MUST match JWT_SECRET
```

**CRITICAL**: `JWT_SECRET` and `BETTER_AUTH_SECRET` must be the same value!

### 3. Frontend Environment Variables

Create `.env.local` in the frontend directory:

```bash
# Better Auth configuration
BETTER_AUTH_SECRET=your-generated-secret-here  # MUST match backend
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# API configuration
NEXT_PUBLIC_API_URL=http://localhost:8001
```

## Installation

### Backend Dependencies

Install JWT verification and password hashing libraries:

```bash
cd backend
pip install python-jose[cryptography]==3.3.0 passlib[bcrypt]==1.7.4
```

Update `requirements.txt`:

```txt
# Existing dependencies
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlmodel==0.0.14
asyncpg==0.31.0
python-dotenv==1.0.0
pydantic>=2.5.0
pydantic-settings==2.1.0
pytest==8.0.0
pytest-asyncio==0.23.0
httpx==0.26.0

# NEW: Authentication dependencies
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
```

### Frontend Dependencies

Install Better Auth:

```bash
cd frontend
npm install better-auth
# or
yarn add better-auth
```

## Database Migration

Create the users table in Neon PostgreSQL:

```sql
-- Connect to your Neon database
psql "postgresql://user:password@host/database?sslmode=require"

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on email for fast lookup
CREATE INDEX idx_users_email ON users(email);

-- Modify tasks table to add foreign key (if user_id is currently string)
-- First, ensure user_id is UUID type
ALTER TABLE tasks ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

-- Add foreign key constraint
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE;
```

Verify tables exist:

```sql
\dt  -- List all tables (should see users and tasks)
\d users  -- Describe users table structure
\d tasks  -- Verify foreign key constraint
```

## Running the Application

### 1. Start Backend Server

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Verify server is running:
- Health check: http://localhost:8001/health
- API docs: http://localhost:8001/docs

### 2. Start Frontend Server

```bash
cd frontend
npm run dev
# or
yarn dev
```

Verify frontend is running:
- Homepage: http://localhost:3000

## Testing Authentication Flow

### Test 1: User Registration

**Using Swagger UI** (http://localhost:8001/docs):

1. Navigate to POST /api/auth/register
2. Click "Try it out"
3. Enter request body:
   ```json
   {
     "email": "test@example.com",
     "password": "SecurePassword123"
   }
   ```
4. Click "Execute"
5. Verify response (201 Created):
   ```json
   {
     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "token_type": "bearer",
     "user": {
       "id": "550e8400-e29b-41d4-a716-446655440000",
       "email": "test@example.com"
     }
   }
   ```
6. Copy the `access_token` value

**Using curl**:

```bash
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePassword123"}'
```

### Test 2: User Login

**Using Swagger UI**:

1. Navigate to POST /api/auth/login
2. Click "Try it out"
3. Enter credentials:
   ```json
   {
     "email": "test@example.com",
     "password": "SecurePassword123"
   }
   ```
4. Click "Execute"
5. Verify response (200 OK) with JWT token
6. Copy the `access_token`

**Using curl**:

```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePassword123"}'
```

### Test 3: Authenticated API Request

**Using Swagger UI**:

1. Click the "Authorize" button at the top
2. Enter: `Bearer <your-access-token>`
3. Click "Authorize"
4. Navigate to GET /api/{user_id}/tasks
5. Enter the user_id from the token
6. Click "Execute"
7. Verify response (200 OK) with task list

**Using curl**:

```bash
# Replace <TOKEN> with your actual JWT token
# Replace <USER_ID> with the user_id from the token

curl -X GET http://localhost:8001/api/<USER_ID>/tasks \
  -H "Authorization: Bearer <TOKEN>"
```

### Test 4: Unauthorized Access (No Token)

**Expected**: 401 Unauthorized

```bash
curl -X GET http://localhost:8001/api/some-user-id/tasks
# Should return: {"detail":"Not authenticated"}
```

### Test 5: Cross-User Access Attempt

**Expected**: 404 Not Found (not 403, to prevent information leakage)

```bash
# Login as user1, get token
TOKEN1=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@example.com","password":"password1"}' \
  | jq -r '.access_token')

# Try to access user2's tasks with user1's token
curl -X GET http://localhost:8001/api/user2-id/tasks \
  -H "Authorization: Bearer $TOKEN1"
# Should return: {"detail":"Task not found"} or 403 Forbidden
```

### Test 6: Expired Token

**Expected**: 401 Unauthorized with "Token expired" message

To test token expiration:
1. Set JWT_EXPIRATION=10 (10 seconds) in .env
2. Restart backend server
3. Login and get token
4. Wait 11 seconds
5. Try to access protected endpoint
6. Should receive 401 with expiration error

## Frontend Testing

### Test 1: Registration Page

1. Navigate to http://localhost:3000/register
2. Enter email and password
3. Click "Register"
4. Verify redirect to dashboard
5. Check browser DevTools → Application → Cookies
6. Verify JWT token is stored

### Test 2: Login Page

1. Navigate to http://localhost:3000/login
2. Enter registered email and password
3. Click "Login"
4. Verify redirect to dashboard
5. Verify JWT token is stored in cookies

### Test 3: Protected Dashboard

1. Navigate to http://localhost:3000/dashboard (without logging in)
2. Verify redirect to login page
3. Login with valid credentials
4. Verify dashboard loads with user's tasks

### Test 4: API Client Integration

Open browser DevTools → Network tab:

1. Perform any task operation (create, update, delete)
2. Inspect the request headers
3. Verify `Authorization: Bearer <token>` header is present
4. Verify request succeeds (200/201 response)

## Troubleshooting

### Issue: "Invalid token" error

**Cause**: JWT_SECRET mismatch between frontend and backend

**Solution**:
1. Verify JWT_SECRET and BETTER_AUTH_SECRET are identical
2. Restart both frontend and backend servers
3. Clear browser cookies and login again

### Issue: "Token expired" immediately after login

**Cause**: System clock mismatch or JWT_EXPIRATION too short

**Solution**:
1. Check JWT_EXPIRATION is at least 3600 (1 hour)
2. Verify system clocks are synchronized
3. Check token `exp` claim matches expected expiration

### Issue: CORS errors in browser console

**Cause**: CORS_ORIGINS not configured correctly

**Solution**:
1. Verify CORS_ORIGINS includes frontend URL: `["http://localhost:3000"]`
2. Restart backend server
3. Clear browser cache

### Issue: "Email already registered" on first registration

**Cause**: User already exists in database from previous test

**Solution**:
```sql
-- Delete test users
DELETE FROM users WHERE email = 'test@example.com';
```

### Issue: Foreign key constraint violation

**Cause**: Tasks table references non-existent users

**Solution**:
```sql
-- Option 1: Delete orphaned tasks
DELETE FROM tasks WHERE user_id NOT IN (SELECT id FROM users);

-- Option 2: Drop and recreate foreign key without CASCADE
ALTER TABLE tasks DROP CONSTRAINT fk_tasks_user_id;
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_user_id
    FOREIGN KEY (user_id) REFERENCES users(id);
```

## Security Checklist

Before deploying to production:

- [ ] JWT_SECRET is strong (minimum 256 bits) and randomly generated
- [ ] JWT_SECRET is stored in environment variables, never in code
- [ ] HTTPS is enabled for all authentication endpoints
- [ ] CORS_ORIGINS is restricted to known frontend domains (no wildcard)
- [ ] Password strength requirements are enforced (minimum 8 characters)
- [ ] Rate limiting is enabled on authentication endpoints
- [ ] Failed login attempts are logged for security monitoring
- [ ] Token expiration is reasonable (1 hour for access tokens)
- [ ] Refresh token mechanism is implemented (P3 enhancement)
- [ ] Database backups are configured

## Next Steps

After verifying authentication works:

1. Run `/sp.tasks` to generate task breakdown
2. Implement authentication using specialized agents:
   - `auth-security` agent for backend JWT verification
   - `nextjs-frontend-architect` agent for Better Auth integration
   - `fastapi-backend-architect` agent for protecting endpoints
3. Run comprehensive security tests
4. Deploy to staging environment
5. Conduct security audit

## Reference

- **Specification**: [spec.md](./spec.md)
- **Architecture Plan**: [plan.md](./plan.md)
- **Data Model**: [data-model.md](./data-model.md)
- **API Contracts**: [contracts/auth-api.yaml](./contracts/auth-api.yaml)
- **Research**: [research.md](./research.md)
