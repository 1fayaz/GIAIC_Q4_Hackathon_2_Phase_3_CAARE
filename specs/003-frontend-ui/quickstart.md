# Quickstart Guide: Frontend UI & UX

**Feature**: 003-frontend-ui
**Date**: 2026-02-07
**Audience**: Developers implementing the frontend using Claude Code agents

## Prerequisites

Before starting implementation, ensure:
- ✅ Backend API from Spec 1 is running and accessible
- ✅ Authentication system from Spec 2 is functional
- ✅ Neon PostgreSQL database is configured and accessible
- ✅ Node.js 18+ and npm/yarn installed
- ✅ Git repository is on branch `003-frontend-ui`

## Environment Setup

### 1. Create Frontend Directory

```bash
# From repository root
mkdir -p frontend
cd frontend
```

### 2. Initialize Next.js Project

```bash
# Using create-next-app with TypeScript and App Router
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

**Configuration choices**:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- App Router: Yes
- Import alias: Yes (@/*)
- Turbopack: Optional

### 3. Install Dependencies

```bash
# Core dependencies
npm install better-auth axios react-hook-form

# Development dependencies
npm install -D @types/node @types/react @types/react-dom
```

**Dependency purposes**:
- `better-auth`: Authentication with JWT token management
- `axios`: HTTP client for API requests (alternative: native fetch)
- `react-hook-form`: Form handling and validation

### 4. Configure Environment Variables

Create `.env.local` in frontend directory:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Better Auth Configuration
AUTH_SECRET=your-secret-key-here-min-32-chars
AUTH_URL=http://localhost:3000

# Optional: Enable debug logging
NEXT_PUBLIC_DEBUG=true
```

**Important**: Never commit `.env.local` to git. Add to `.gitignore`:
```bash
echo ".env.local" >> .gitignore
```

### 5. Verify Backend Connectivity

Test that backend API is accessible:

```bash
# From frontend directory
curl http://localhost:8000/api/tasks
# Should return 401 Unauthorized (expected - no auth token)

curl http://localhost:8000/docs
# Should return OpenAPI documentation
```

## Project Structure Overview

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   ├── (auth)/            # Public routes
│   │   ├── signin/
│   │   └── signup/
│   └── (dashboard)/       # Protected routes
│       └── tasks/
├── components/            # React components
│   ├── auth/             # Auth-related components
│   ├── tasks/            # Task-related components
│   └── ui/               # Reusable UI components
├── lib/                  # Utilities
│   ├── api-client.ts     # API client with JWT
│   ├── auth.ts           # Better Auth config
│   └── types.ts          # TypeScript types
├── hooks/                # Custom React hooks
│   ├── useAuth.ts
│   └── useTasks.ts
└── middleware.ts         # Route protection
```

## Implementation Workflow

### Phase 1: Foundation (Agent: nextjs-frontend-architect)

**Tasks**:
1. Set up Next.js project structure
2. Configure Tailwind CSS with custom theme
3. Create root layout with providers
4. Set up TypeScript types from data-model.md

**Verification**:
```bash
npm run dev
# Visit http://localhost:3000
# Should see default Next.js page
```

### Phase 2: Authentication Setup (Agents: auth-security + nextjs-frontend-architect)

**Tasks**:
1. Configure Better Auth in `lib/auth.ts`
2. Create authentication context
3. Build signin page with form validation
4. Build signup page with form validation
5. Implement middleware for route protection

**Verification**:
```bash
# Visit http://localhost:3000/signin
# Should see signin form
# Submit with test credentials
# Should authenticate and redirect to /tasks
```

### Phase 3: API Client (Agents: fastapi-backend-architect + nextjs-frontend-architect)

**Tasks**:
1. Create API client in `lib/api-client.ts`
2. Implement request interceptor (add JWT)
3. Implement response interceptor (handle errors)
4. Create typed functions for each endpoint

**Verification**:
```typescript
// In browser console after signin
const tasks = await apiClient.getTasks();
console.log(tasks); // Should return array of tasks
```

### Phase 4: Task Dashboard (Agent: nextjs-frontend-architect)

**Tasks**:
1. Create protected dashboard layout
2. Build task list component
3. Implement loading and empty states
4. Add signout button

**Verification**:
```bash
# Visit http://localhost:3000/tasks (after signin)
# Should see task list or empty state
# Click signout - should redirect to signin
```

### Phase 5: Task CRUD (Agents: nextjs-frontend-architect + fastapi-backend-architect)

**Tasks**:
1. Create task form component
2. Implement create task functionality
3. Implement edit task functionality
4. Implement delete with confirmation
5. Implement toggle completion

**Verification**:
- Create new task → appears in list
- Edit task → changes persist
- Delete task → removed from list
- Toggle completion → status updates

### Phase 6: Responsive Design (Agent: nextjs-frontend-architect)

**Tasks**:
1. Test on mobile viewport (320px)
2. Test on tablet viewport (768px)
3. Test on desktop viewport (1920px)
4. Adjust layouts and spacing
5. Ensure touch-friendly interactions

**Verification**:
```bash
# Use browser DevTools responsive mode
# Test at 320px, 768px, 1024px, 1920px
# All features should work at all sizes
```

### Phase 7: Error Handling (Agent: nextjs-frontend-architect)

**Tasks**:
1. Implement error boundary
2. Add error messages for API failures
3. Handle network errors gracefully
4. Test with backend offline

**Verification**:
```bash
# Stop backend server
# Try to create task
# Should see user-friendly error message
# Start backend server
# Retry - should work
```

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run type checking
npx tsc --noEmit

# Run tests (after adding tests)
npm test
```

## Testing Checklist

### Manual Testing

- [ ] **Authentication**
  - [ ] Signup with valid email/password
  - [ ] Signup with invalid email (should show error)
  - [ ] Signup with weak password (should show error)
  - [ ] Signin with correct credentials
  - [ ] Signin with incorrect credentials (should show error)
  - [ ] Access protected route when not authenticated (should redirect)
  - [ ] Signout (should clear session and redirect)

- [ ] **Task Management**
  - [ ] View empty task list (should show empty state)
  - [ ] Create task with title only
  - [ ] Create task with title and description
  - [ ] Create task without title (should show validation error)
  - [ ] Edit task title
  - [ ] Edit task description
  - [ ] Toggle task completion status
  - [ ] Delete task (should show confirmation)
  - [ ] Cancel delete (task should remain)

- [ ] **Responsive Design**
  - [ ] Test on mobile (320px width)
  - [ ] Test on tablet (768px width)
  - [ ] Test on desktop (1920px width)
  - [ ] All buttons are touch-friendly (min 44x44px)
  - [ ] No horizontal scrolling on mobile

- [ ] **Error Handling**
  - [ ] Network error during task creation
  - [ ] Backend API unavailable
  - [ ] Session expired (should redirect to signin)
  - [ ] Attempt to access another user's task (should show error)

### Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Common Issues and Solutions

### Issue: "Cannot connect to backend API"

**Solution**:
1. Verify backend is running: `curl http://localhost:8000/docs`
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Ensure CORS is configured in backend to allow frontend origin

### Issue: "Authentication not working"

**Solution**:
1. Verify Better Auth is configured correctly
2. Check `AUTH_SECRET` is set in `.env.local`
3. Verify JWT token is being sent in Authorization header
4. Check browser console for errors

### Issue: "Tasks not loading"

**Solution**:
1. Verify user is authenticated (check session)
2. Check JWT token is valid and not expired
3. Verify backend `/api/tasks` endpoint is working
4. Check browser network tab for API errors

### Issue: "Responsive layout broken"

**Solution**:
1. Verify Tailwind CSS is configured correctly
2. Check for hardcoded widths (use responsive utilities)
3. Test with browser DevTools responsive mode
4. Ensure viewport meta tag is present in layout

## Agent Invocation Guide

### When to Use Each Agent

**nextjs-frontend-architect**:
- Creating pages and components
- Implementing layouts and routing
- Styling with Tailwind CSS
- Responsive design implementation
- Form handling and validation

**auth-security**:
- Reviewing authentication flows
- Validating JWT token handling
- Checking route protection logic
- Security audit of auth code

**fastapi-backend-architect**:
- Verifying API endpoint usage
- Validating request/response formats
- Checking error handling consistency
- API contract compliance

**neon-db-specialist**:
- Validating data shape expectations
- Reviewing task ownership assumptions
- Checking data consistency

### Example Agent Invocations

```bash
# Create signin page
"Use nextjs-frontend-architect to create the signin page with form validation"

# Review auth security
"Use auth-security to review the authentication implementation for security issues"

# Verify API integration
"Use fastapi-backend-architect to verify the API client correctly implements the backend contracts"
```

## Next Steps

After completing implementation:
1. Run full testing checklist
2. Create PHR for the implementation phase
3. Document any ADRs for significant decisions
4. Prepare for deployment (if applicable)
5. Update CLAUDE.md with any new learnings

## Success Criteria

Implementation is complete when:
- ✅ All 6 user stories from spec.md are implemented
- ✅ Authentication works end-to-end
- ✅ Task CRUD operations work correctly
- ✅ UI is responsive on mobile, tablet, and desktop
- ✅ Error handling is graceful and user-friendly
- ✅ All manual tests pass
- ✅ No manual coding was performed (all via agents)
- ✅ Code follows constitution principles

## Resources

- **Spec**: `specs/003-frontend-ui/spec.md`
- **Plan**: `specs/003-frontend-ui/plan.md`
- **Data Model**: `specs/003-frontend-ui/data-model.md`
- **API Contract**: `specs/003-frontend-ui/contracts/api-client.yaml`
- **Backend API Docs**: `http://localhost:8000/docs`
- **Next.js Docs**: https://nextjs.org/docs
- **Better Auth Docs**: https://better-auth.com/docs
- **Tailwind CSS Docs**: https://tailwindcss.com/docs
