# Data Model: Authentication & API Security

**Feature**: 002-auth-integration
**Date**: 2026-02-06
**Purpose**: Define data entities, relationships, and validation rules for authentication

## Entities

### User

Represents an authenticated user account in the system.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key, Auto-generated | Unique identifier for the user |
| email | String | Unique, Indexed, Max 255 chars, Required | User's email address (used for login) |
| hashed_password | String | Max 255 chars, Required | Bcrypt-hashed password (never store plain text) |
| created_at | DateTime | Auto-generated on creation | Timestamp when user account was created |
| updated_at | DateTime | Auto-updated on modification | Timestamp when user account was last modified |

**Validation Rules**:
- Email must be valid format (validated by Better Auth on frontend)
- Email must be unique across all users
- Password must be at least 8 characters (enforced by Better Auth)
- Password must be hashed with bcrypt before storage (never store plain text)

**Indexes**:
- Primary index on `id` (UUID)
- Unique index on `email` (for fast lookup during login)

**SQLModel Definition**:
```python
from sqlmodel import Field, SQLModel, Relationship
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional, List

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(unique=True, index=True, max_length=255)
    hashed_password: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"onupdate": datetime.utcnow}
    )

    # Relationship to tasks (one-to-many)
    tasks: List["Task"] = Relationship(back_populates="user")
```

---

### Task (Existing - Modified)

Represents a task owned by a user. This entity already exists from Spec 1 but needs to be modified to add the relationship to User.

**Modifications**:
- Add foreign key relationship to User
- Ensure user_id is properly indexed (already done in Spec 1)

**Updated SQLModel Definition**:
```python
from sqlmodel import Field, SQLModel, Relationship
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional

class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)  # Modified: now foreign key
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"onupdate": datetime.utcnow}
    )

    # Relationship to user (many-to-one)
    user: Optional["User"] = Relationship(back_populates="tasks")
```

**Note**: In Spec 1, user_id was a string. It should be changed to UUID to match the User.id type for proper foreign key relationship.

## Relationships

### User → Tasks (One-to-Many)

- One user can have many tasks
- Each task belongs to exactly one user
- Cascade delete: When a user is deleted, all their tasks are deleted (optional, can be configured)
- Enforced at database level via foreign key constraint

**Relationship Diagram**:
```
User (1) ----< (many) Task
  id              user_id (FK)
```

## JWT Token Claims Structure

JWT tokens issued by Better Auth contain user identity information. The backend extracts these claims to identify the authenticated user.

**Token Payload**:
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Claims Description**:

| Claim | Type | Description |
|-------|------|-------------|
| user_id | UUID (string) | Unique identifier of the authenticated user |
| email | String | User's email address |
| iat | Integer (Unix timestamp) | Issued at - when the token was created |
| exp | Integer (Unix timestamp) | Expiration - when the token expires |

**Validation Rules**:
- `user_id` must be a valid UUID
- `email` must match the user_id in the database
- `exp` must be in the future (token not expired)
- Token signature must be valid (verified with BETTER_AUTH_SECRET)

## Password Hashing Strategy

**Algorithm**: Bcrypt via passlib

**Configuration**:
```python
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12  # Cost factor (default)
)
```

**Operations**:

1. **Hash Password** (during registration):
   ```python
   hashed = pwd_context.hash(plain_password)
   # Store hashed in database
   ```

2. **Verify Password** (during login):
   ```python
   is_valid = pwd_context.verify(plain_password, hashed_password)
   # If valid, issue JWT token
   ```

**Security Properties**:
- Salted: Each hash includes a random salt (prevents rainbow table attacks)
- Slow: Intentionally computationally expensive (prevents brute force)
- Adaptive: Cost factor can be increased as hardware improves

## Data Isolation Strategy

**Principle**: Users can only access their own data. All database queries for user-owned resources must filter by the authenticated user's ID.

**Implementation**:

1. **Extract user_id from JWT token** (in auth dependency):
   ```python
   current_user = get_current_user(token)
   user_id = current_user["user_id"]
   ```

2. **Filter all queries by user_id**:
   ```python
   # List tasks
   tasks = session.exec(
       select(Task).where(Task.user_id == user_id)
   ).all()

   # Get single task
   task = session.exec(
       select(Task).where(
           Task.id == task_id,
           Task.user_id == user_id  # Critical: filter by user
       )
   ).first()
   ```

3. **Reject cross-user access with 404** (not 403):
   ```python
   if task is None:
       raise HTTPException(status_code=404, detail="Task not found")
   # Don't reveal whether task exists for another user
   ```

**Enforcement Points**:
- All task CRUD endpoints (GET, POST, PUT, DELETE, PATCH)
- Database query level (WHERE clause)
- Never trust user_id from URL path—always use user_id from JWT token

## Database Migration

**New Table**: `users`

**Migration Steps**:

1. Create users table:
   ```sql
   CREATE TABLE users (
       id UUID PRIMARY KEY,
       email VARCHAR(255) UNIQUE NOT NULL,
       hashed_password VARCHAR(255) NOT NULL,
       created_at TIMESTAMP NOT NULL DEFAULT NOW(),
       updated_at TIMESTAMP NOT NULL DEFAULT NOW()
   );

   CREATE INDEX idx_users_email ON users(email);
   ```

2. Modify tasks table (add foreign key):
   ```sql
   -- If user_id is currently string, convert to UUID
   ALTER TABLE tasks ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

   -- Add foreign key constraint
   ALTER TABLE tasks ADD CONSTRAINT fk_tasks_user_id
       FOREIGN KEY (user_id) REFERENCES users(id)
       ON DELETE CASCADE;
   ```

**Rollback Strategy**:
```sql
-- Remove foreign key
ALTER TABLE tasks DROP CONSTRAINT fk_tasks_user_id;

-- Drop users table
DROP TABLE users;
```

## Validation Summary

| Entity | Field | Validation |
|--------|-------|------------|
| User | email | Unique, max 255 chars, valid email format |
| User | hashed_password | Max 255 chars, bcrypt hash |
| Task | user_id | Must reference existing user (foreign key) |
| JWT | user_id | Must be valid UUID, must exist in users table |
| JWT | exp | Must be in the future |

## Notes

- User passwords are NEVER stored in plain text
- User passwords are NEVER logged or exposed in API responses
- JWT tokens contain user_id for authentication, not authorization (authorization happens at API level)
- Database enforces referential integrity via foreign key constraints
- All timestamps use UTC
