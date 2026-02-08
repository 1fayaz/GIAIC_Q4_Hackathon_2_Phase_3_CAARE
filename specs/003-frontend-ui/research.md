# Research: Frontend UI & UX

**Feature**: 003-frontend-ui
**Date**: 2026-02-07
**Phase**: Phase 0 - Research and Technology Validation

## Overview

This document captures research findings and technology decisions for implementing the authenticated Todo application frontend using Next.js 16+ App Router, Better Auth, and integration with existing FastAPI backend.

## Technology Decisions

### 1. Next.js 16+ App Router

**Decision**: Use Next.js 16+ with App Router (not Pages Router)

**Rationale**:
- App Router is the modern, recommended approach for Next.js applications
- Provides better support for React Server Components and streaming
- Route groups enable clean separation of authenticated vs public routes
- Built-in middleware support for authentication checks
- Better performance with automatic code splitting and prefetching

**Alternatives Considered**:
- **Pages Router**: Older Next.js routing system - rejected because App Router is the future direction and provides better patterns for authentication
- **Create React App**: Basic React setup - rejected because lacks built-in routing, SSR, and optimization features
- **Vite + React Router**: Modern alternative - rejected to maintain consistency with project requirements (Next.js specified in constitution)

**Implementation Approach**:
- Use route groups: `(auth)` for public pages, `(dashboard)` for protected pages
- Implement middleware.ts for route protection at the edge
- Use Server Components where possible for better performance
- Client Components only where interactivity is needed (forms, buttons)

### 2. Better Auth Integration

**Decision**: Integrate Better Auth for authentication with JWT token management

**Rationale**:
- Better Auth is specified in project constitution as the authentication solution
- Provides session management and JWT token generation
- Works seamlessly with Next.js App Router
- Handles token refresh and expiration automatically
- Supports both client and server-side authentication checks

**Alternatives Considered**:
- **NextAuth.js**: Popular Next.js auth library - rejected because Better Auth is specified in constitution
- **Custom JWT implementation**: Build from scratch - rejected due to complexity and security risks
- **Auth0/Clerk**: Third-party services - rejected to maintain control and avoid external dependencies

**Implementation Approach**:
- Configure Better Auth in `lib/auth.ts`
- Use Better Auth React hooks for client-side auth state
- Store JWT tokens securely (httpOnly cookies preferred)
- Include JWT in Authorization header for all API requests
- Implement token refresh logic before expiration

### 3. API Client Architecture

**Decision**: Create centralized API client with automatic JWT token injection

**Rationale**:
- Single source of truth for API communication
- Automatic token attachment prevents forgetting authentication
- Centralized error handling for 401/403 responses
- Easy to mock for testing
- Consistent request/response handling across the application

**Alternatives Considered**:
- **Direct fetch calls**: Inline API calls in components - rejected due to code duplication and inconsistent error handling
- **React Query without wrapper**: Use React Query directly - rejected because still need centralized token injection
- **GraphQL client**: Apollo/URQL - rejected because backend uses REST APIs

**Implementation Approach**:
- Create `lib/api-client.ts` with axios or fetch wrapper
- Intercept all requests to add Authorization header with JWT
- Intercept responses to handle 401 (redirect to signin) and 403 (show error)
- Export typed functions for each API endpoint (getTasks, createTask, etc.)
- Use React hooks (useTasks, useAuth) to manage data fetching and mutations

### 4. State Management

**Decision**: Use React hooks and Context API for state management (no Redux/Zustand)

**Rationale**:
- Application state is relatively simple (auth state + task list)
- React Context API sufficient for sharing auth state across components
- Custom hooks (useAuth, useTasks) encapsulate data fetching logic
- Avoids complexity of external state management libraries
- Better Auth provides built-in auth state management

**Alternatives Considered**:
- **Redux Toolkit**: Full-featured state management - rejected as overkill for this application size
- **Zustand**: Lightweight state management - rejected because React Context is sufficient
- **Jotai/Recoil**: Atomic state management - rejected due to learning curve and unnecessary complexity

**Implementation Approach**:
- Create AuthContext for user session state
- Use Better Auth hooks for authentication actions
- Create custom hooks (useTasks) that wrap API client calls
- Use React Query or SWR for server state caching (optional optimization)

### 5. Styling Approach

**Decision**: Use Tailwind CSS for styling with mobile-first responsive design

**Rationale**:
- Utility-first approach enables rapid UI development
- Built-in responsive design utilities (sm:, md:, lg:, xl:)
- No CSS file management overhead
- Consistent design system through configuration
- Excellent developer experience with IntelliSense

**Alternatives Considered**:
- **CSS Modules**: Scoped CSS - rejected due to more boilerplate and less flexibility
- **Styled Components**: CSS-in-JS - rejected due to runtime overhead and complexity
- **Plain CSS**: Traditional approach - rejected due to lack of design system and responsive utilities

**Implementation Approach**:
- Configure Tailwind in `tailwind.config.js` with custom colors/spacing if needed
- Use mobile-first breakpoints (default sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
- Create reusable component classes for buttons, inputs, cards
- Use Tailwind's dark mode utilities if needed in future

### 6. Form Handling and Validation

**Decision**: Use React Hook Form with client-side validation

**Rationale**:
- Minimal re-renders for better performance
- Built-in validation with clear error messages
- Easy integration with TypeScript for type safety
- Supports async validation if needed
- Reduces boilerplate compared to manual form state management

**Alternatives Considered**:
- **Formik**: Popular form library - rejected due to more re-renders and larger bundle size
- **Manual state management**: useState for each field - rejected due to boilerplate and complexity
- **Native HTML5 validation**: Browser validation - rejected due to limited customization and UX

**Implementation Approach**:
- Use `useForm` hook in form components
- Define validation rules inline (required, minLength, pattern for email)
- Display validation errors below form fields
- Disable submit button during submission
- Show loading state during API calls

### 7. Route Protection Strategy

**Decision**: Use Next.js middleware for route protection at the edge

**Rationale**:
- Middleware runs before page renders, preventing flash of protected content
- Centralized authentication logic (single place to check auth status)
- Can redirect unauthenticated users before any component code runs
- Better performance than client-side checks
- Works with both Server and Client Components

**Alternatives Considered**:
- **Client-side route guards**: Check auth in useEffect - rejected due to flash of content and poor UX
- **Higher-order components**: Wrap pages with auth HOC - rejected because middleware is more efficient
- **Server-side checks in each page**: getServerSideProps - rejected due to code duplication

**Implementation Approach**:
- Create `middleware.ts` at root level
- Check for Better Auth session/JWT token
- Redirect to /signin if unauthenticated and accessing protected routes
- Redirect to /dashboard if authenticated and accessing /signin or /signup
- Use matcher config to specify which routes require protection

### 8. Error Handling Strategy

**Decision**: Implement global error boundary with user-friendly error messages

**Rationale**:
- Prevents application crashes from propagating to users
- Provides consistent error UI across the application
- Logs errors for debugging
- Allows graceful degradation of functionality

**Implementation Approach**:
- Create ErrorBoundary component wrapping the app
- Display user-friendly error messages (not technical stack traces)
- Provide "Try Again" button to recover from errors
- Handle API errors separately with toast notifications or inline messages
- Log errors to console in development, send to monitoring service in production

## Best Practices Research

### Next.js App Router Patterns

**Server vs Client Components**:
- Use Server Components by default (better performance, smaller bundle)
- Use Client Components only when needed:
  - Interactive elements (buttons with onClick, forms)
  - Browser APIs (localStorage, window)
  - React hooks (useState, useEffect, useContext)
  - Event listeners

**Data Fetching**:
- Server Components: Fetch data directly in component (async/await)
- Client Components: Use hooks (useEffect + fetch, or React Query/SWR)
- For this project: Most data fetching will be client-side since we need JWT tokens

**Route Groups**:
- `(auth)` group: Public routes (signin, signup) with minimal layout
- `(dashboard)` group: Protected routes with navigation, header, logout button
- Shared layouts at group level reduce code duplication

### Better Auth Integration Patterns

**Session Management**:
- Better Auth stores session in httpOnly cookies (secure by default)
- Use `useSession()` hook to access current user in Client Components
- Use `getSession()` in Server Components and middleware
- Session includes user ID, email, and JWT token

**Token Handling**:
- JWT token automatically included in Better Auth session
- Extract token from session and add to API requests
- Handle token expiration by redirecting to signin
- Better Auth can auto-refresh tokens if configured

### API Integration Patterns

**Request Structure**:
```typescript
// All protected API requests must include:
headers: {
  'Authorization': `Bearer ${jwtToken}`,
  'Content-Type': 'application/json'
}
```

**Response Handling**:
- 200/201: Success - parse response data
- 400: Validation error - show field-specific errors
- 401: Unauthorized - redirect to signin (token expired/invalid)
- 403: Forbidden - show "Access denied" message
- 404: Not found - show "Resource not found" message
- 500: Server error - show "Something went wrong" message

**Error Recovery**:
- Implement retry logic for network failures
- Show loading states during requests
- Provide clear feedback on success/failure
- Allow users to retry failed operations

### Responsive Design Patterns

**Mobile-First Approach**:
- Design for 320px width first (smallest mobile)
- Add breakpoints for larger screens (sm: 640px, md: 768px, lg: 1024px)
- Use Tailwind responsive utilities: `class="text-sm md:text-base lg:text-lg"`

**Touch-Friendly UI**:
- Minimum touch target size: 44x44px (Apple HIG) or 48x48px (Material Design)
- Adequate spacing between interactive elements
- Large, easy-to-tap buttons
- Avoid hover-only interactions

**Layout Strategies**:
- Stack vertically on mobile, grid/flex on desktop
- Hide non-essential elements on mobile (show via menu)
- Use responsive navigation (hamburger menu on mobile, full nav on desktop)

## Integration Points

### Backend API (from Spec 1)

**Endpoints to Consume**:
- `GET /api/tasks` - List all tasks for authenticated user
- `GET /api/tasks/{id}` - Get single task (verify ownership)
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

**Expected Request/Response Format**:
```json
// Success Response
{
  "success": true,
  "data": { "id": "uuid", "title": "Task", "description": "...", "completed": false },
  "message": "Operation successful"
}

// Error Response
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Authentication API (from Spec 2)

**Endpoints to Consume**:
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Authenticate user and get JWT
- `POST /api/auth/signout` - Invalidate session
- `GET /api/auth/session` - Get current session/user info

**JWT Token Structure**:
- Token includes: user_id, email, expiration
- Token sent in Authorization header: `Bearer <token>`
- Token stored securely by Better Auth (httpOnly cookie)

### Database Schema (from Spec 1)

**Task Model** (for TypeScript types):
```typescript
interface Task {
  id: string;           // UUID
  title: string;        // Required, max 200 chars
  description: string;  // Optional, max 1000 chars
  completed: boolean;   // Default false
  user_id: string;      // UUID, foreign key to users
  created_at: string;   // ISO timestamp
  updated_at: string;   // ISO timestamp
}
```

**User Model** (from Spec 2):
```typescript
interface User {
  id: string;           // UUID
  email: string;        // Unique, validated
  created_at: string;   // ISO timestamp
}
```

## Security Considerations

### JWT Token Security

- Store tokens in httpOnly cookies (Better Auth default) - prevents XSS attacks
- Never store tokens in localStorage (vulnerable to XSS)
- Include token in Authorization header for API requests
- Validate token expiration on client side
- Redirect to signin when token expires

### CORS Configuration

- Backend must allow frontend origin in CORS settings
- Credentials must be included in requests (for cookies)
- Backend CORS_ORIGINS environment variable must include frontend URL

### Input Validation

- Validate all user inputs on client side (UX)
- Backend performs authoritative validation (security)
- Sanitize inputs to prevent XSS (React does this by default)
- Use TypeScript for type safety

### Route Protection

- Middleware checks authentication before rendering protected pages
- API client includes token in all requests
- Backend verifies token and user ownership on every request
- Frontend never makes authorization decisions (only UX decisions)

## Performance Optimization

### Code Splitting

- Next.js automatically splits code by route
- Use dynamic imports for large components: `const Modal = dynamic(() => import('./Modal'))`
- Lazy load non-critical components

### Image Optimization

- Use Next.js Image component for automatic optimization
- Provide width/height to prevent layout shift
- Use appropriate image formats (WebP with fallback)

### Caching Strategy

- Use React Query or SWR for client-side caching (optional)
- Cache task list data with stale-while-revalidate
- Invalidate cache on mutations (create/update/delete)
- Use Next.js built-in caching for static assets

## Testing Strategy

### Component Testing

- Use Jest + React Testing Library
- Test user interactions (button clicks, form submissions)
- Test conditional rendering (loading states, error states)
- Mock API calls with MSW (Mock Service Worker)

### Integration Testing

- Use Playwright for E2E tests
- Test complete user flows (signup → signin → create task → edit → delete)
- Test authentication flows (signin, signout, protected routes)
- Test responsive behavior at different viewport sizes

### Manual Testing Checklist

- [ ] Signup with valid/invalid credentials
- [ ] Signin with correct/incorrect credentials
- [ ] Access protected routes when unauthenticated (should redirect)
- [ ] Create task with valid/invalid data
- [ ] Edit task and verify changes persist
- [ ] Delete task with confirmation
- [ ] Toggle task completion status
- [ ] Signout and verify session cleared
- [ ] Test on mobile device (320px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1920px width)
- [ ] Test with slow network (throttling)
- [ ] Test with backend API down (error handling)

## Conclusion

All technology decisions align with project constitution requirements. No clarifications needed - all technical context is clear and implementation can proceed. Next phase will define data models and API contracts.
