# Data Model: Frontend UI & UX

**Feature**: 003-frontend-ui
**Date**: 2026-02-07
**Phase**: Phase 1 - Data Model Definition

## Overview

This document defines the TypeScript data models used in the frontend application. These models mirror the backend database schema and API contracts to ensure type safety and consistency across the full stack.

## Core Entities

### 1. User

Represents an authenticated user in the system.

**TypeScript Interface**:
```typescript
interface User {
  id: string;           // UUID from backend
  email: string;        // User's email address
  created_at: string;   // ISO 8601 timestamp
}
```

**Source**: Backend User model from Spec 2 (Auth Integration)

**Usage**:
- Stored in authentication context after signin
- Used to display user information in UI
- Referenced in task ownership validation

**Validation Rules**:
- `id`: Must be valid UUID format
- `email`: Must be valid email format (validated by backend)
- `created_at`: ISO 8601 timestamp string

**State Transitions**: N/A (immutable after creation)

---

### 2. Task

Represents a todo task belonging to a user.

**TypeScript Interface**:
```typescript
interface Task {
  id: string;              // UUID from backend
  title: string;           // Task title (required)
  description: string;     // Task description (optional, can be empty string)
  completed: boolean;      // Completion status
  user_id: string;         // UUID of owning user
  created_at: string;      // ISO 8601 timestamp
  updated_at: string;      // ISO 8601 timestamp
}
```

**Source**: Backend Task model from Spec 1 (Backend Foundation)

**Usage**:
- Displayed in task list on dashboard
- Edited in task form
- Deleted with confirmation dialog

**Validation Rules**:
- `id`: Must be valid UUID format
- `title`: Required, 1-200 characters
- `description`: Optional, 0-1000 characters
- `completed`: Boolean (true/false)
- `user_id`: Must match authenticated user's ID
- `created_at`, `updated_at`: ISO 8601 timestamp strings

**State Transitions**:
```
[New] --create--> [Incomplete] --toggle--> [Complete]
                       ^                       |
                       |--------toggle---------|

[Any State] --update--> [Same State with modified fields]
[Any State] --delete--> [Deleted/Removed]
```

**Relationships**:
- Belongs to one User (via `user_id`)
- User can have many Tasks (one-to-many)

---

### 3. Session

Represents an authenticated user session managed by Better Auth.

**TypeScript Interface**:
```typescript
interface Session {
  user: User;              // Current authenticated user
  token: string;           // JWT token for API authentication
  expires_at: string;      // ISO 8601 timestamp when token expires
}
```

**Source**: Better Auth session structure (Spec 2)

**Usage**:
- Stored in authentication context
- Token extracted and included in API requests
- Checked for expiration before API calls

**Validation Rules**:
- `user`: Must be valid User object
- `token`: Must be valid JWT string
- `expires_at`: ISO 8601 timestamp, must be in the future

**State Transitions**:
```
[No Session] --signin--> [Active Session] --signout--> [No Session]
                              |
                              |--expires--> [Expired Session] --refresh--> [Active Session]
```

---

## Form Models

### 4. SignInFormData

Data structure for the signin form.

**TypeScript Interface**:
```typescript
interface SignInFormData {
  email: string;        // User's email
  password: string;     // User's password
}
```

**Validation Rules**:
- `email`: Required, must be valid email format
- `password`: Required, minimum 8 characters

**Usage**: Submitted to `/api/auth/signin` endpoint

---

### 5. SignUpFormData

Data structure for the signup form.

**TypeScript Interface**:
```typescript
interface SignUpFormData {
  email: string;           // User's email
  password: string;        // User's password
  confirmPassword: string; // Password confirmation
}
```

**Validation Rules**:
- `email`: Required, must be valid email format, must be unique (checked by backend)
- `password`: Required, minimum 8 characters, must contain letter and number
- `confirmPassword`: Required, must match `password`

**Usage**: Submitted to `/api/auth/signup` endpoint

---

### 6. TaskFormData

Data structure for creating or editing a task.

**TypeScript Interface**:
```typescript
interface TaskFormData {
  title: string;        // Task title
  description: string;  // Task description (optional)
}
```

**Validation Rules**:
- `title`: Required, 1-200 characters, trimmed
- `description`: Optional, 0-1000 characters, trimmed

**Usage**:
- Create: Submitted to `POST /api/tasks`
- Update: Submitted to `PUT /api/tasks/{id}`

---

## API Response Models

### 7. ApiSuccessResponse<T>

Generic success response wrapper from backend.

**TypeScript Interface**:
```typescript
interface ApiSuccessResponse<T> {
  success: true;
  data: T;              // Response payload (type varies by endpoint)
  message: string;      // Human-readable success message
}
```

**Usage**: All successful API responses follow this structure

**Examples**:
- `ApiSuccessResponse<Task>` - Single task response
- `ApiSuccessResponse<Task[]>` - Task list response
- `ApiSuccessResponse<User>` - User info response

---

### 8. ApiErrorResponse

Error response structure from backend.

**TypeScript Interface**:
```typescript
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;       // Error code (e.g., "UNAUTHORIZED", "VALIDATION_ERROR")
    message: string;    // Human-readable error message
  };
}
```

**Usage**: All error API responses follow this structure

**Common Error Codes**:
- `UNAUTHORIZED`: Missing or invalid JWT token (401)
- `FORBIDDEN`: Valid token but insufficient permissions (403)
- `NOT_FOUND`: Resource does not exist or user lacks access (404)
- `VALIDATION_ERROR`: Invalid input data (400)
- `INTERNAL_ERROR`: Unexpected server error (500)

---

## UI State Models

### 9. LoadingState

Represents the loading state of an async operation.

**TypeScript Type**:
```typescript
type LoadingState = 'idle' | 'loading' | 'success' | 'error';
```

**Usage**: Track state of API requests in components

**State Transitions**:
```
[idle] --start request--> [loading] --success--> [success]
                              |
                              |--failure--> [error]
```

---

### 10. FormState<T>

Generic form state with validation errors.

**TypeScript Interface**:
```typescript
interface FormState<T> {
  data: T;                          // Form field values
  errors: Partial<Record<keyof T, string>>;  // Field-specific error messages
  isSubmitting: boolean;            // Whether form is being submitted
  submitError: string | null;       // General submission error
}
```

**Usage**: Manage form state in form components

**Example**:
```typescript
const [formState, setFormState] = useState<FormState<TaskFormData>>({
  data: { title: '', description: '' },
  errors: {},
  isSubmitting: false,
  submitError: null
});
```

---

## Type Guards and Utilities

### 11. Type Guard Functions

Helper functions to validate API responses at runtime.

**TypeScript Functions**:
```typescript
function isApiSuccessResponse<T>(response: any): response is ApiSuccessResponse<T> {
  return response && response.success === true && 'data' in response;
}

function isApiErrorResponse(response: any): response is ApiErrorResponse {
  return response && response.success === false && 'error' in response;
}

function isTask(obj: any): obj is Task {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.completed === 'boolean' &&
    typeof obj.user_id === 'string';
}
```

**Usage**: Validate API responses before using data

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                                                              │
│  ┌──────────────┐                                           │
│  │ Auth Context │ stores Session (User + JWT Token)         │
│  └──────┬───────┘                                           │
│         │                                                    │
│         ├──> SignIn/SignUp Forms (SignInFormData)           │
│         │                                                    │
│         └──> API Client (adds JWT to headers)               │
│                    │                                         │
│                    ├──> GET /api/tasks → Task[]             │
│                    ├──> POST /api/tasks (TaskFormData) → Task│
│                    ├──> PUT /api/tasks/{id} (TaskFormData) → Task│
│                    └──> DELETE /api/tasks/{id} → success    │
│                                                              │
│  ┌──────────────┐                                           │
│  │ Task List UI │ displays Task[] from API                  │
│  └──────────────┘                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP + JWT
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend API                           │
│                                                              │
│  Validates JWT → Filters by user_id → Returns data          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Validation Summary

| Entity | Client Validation | Server Validation | Notes |
|--------|------------------|-------------------|-------|
| User | Email format | Email uniqueness, format | Server is authoritative |
| Task | Title length, description length | Same + user ownership | Client for UX, server for security |
| Session | Token expiration | Token signature, validity | Server validates all tokens |
| SignInFormData | Email format, password length | Credentials correctness | Server checks against database |
| SignUpFormData | Email format, password strength, match | Email uniqueness, password hash | Server creates user |
| TaskFormData | Title required, length limits | Same + user assignment | Server auto-assigns user_id |

---

## Consistency with Backend

All frontend models are derived from backend schemas:

- **User**: Matches `backend/app/models/user.py` from Spec 2
- **Task**: Matches `backend/app/models/task.py` from Spec 1
- **API Responses**: Match `backend/app/schemas/` response formats
- **Validation Rules**: Mirror backend Pydantic validation

Any changes to backend models must be reflected in these TypeScript interfaces to maintain type safety and prevent runtime errors.
