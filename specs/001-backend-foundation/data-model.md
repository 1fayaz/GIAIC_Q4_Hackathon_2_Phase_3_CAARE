# Data Model: Backend & Database Foundation

**Feature**: 001-backend-foundation
**Date**: 2026-02-06
**Purpose**: Define database schema and entity relationships for task management

## Entity Overview

This feature introduces a single entity: **Task**. The Task entity represents a todo item owned by a user. The schema is designed to support future authentication integration without requiring migrations.

## Task Entity

### Description

A Task represents a single todo item in the system. Each task belongs to exactly one user (identified by `user_id`) and contains the task's content, completion status, and audit timestamps.

### Fields

| Field Name   | Type      | Constraints                          | Description                                                      |
|--------------|-----------|--------------------------------------|------------------------------------------------------------------|
| id           | UUID      | Primary Key, Auto-generated          | Unique identifier for the task                                   |
| user_id      | String    | Required, Indexed                    | Owner of the task (future: extracted from JWT token)             |
| title        | String    | Required, Max 200 chars              | Task title/summary                                               |
| description  | String    | Optional, Max 1000 chars             | Detailed task description                                        |
| completed    | Boolean   | Required, Default: false             | Task completion status                                           |
| created_at   | DateTime  | Required, Auto-generated (UTC)       | Timestamp when task was created                                  |
| updated_at   | DateTime  | Required, Auto-updated (UTC)         | Timestamp when task was last modified                            |

### SQLModel Definition

```python
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel

class Task(SQLModel, table=True):
    """
    Task entity representing a todo item.

    Each task belongs to a single user and contains task content,
    completion status, and audit timestamps.
    """
    __tablename__ = "tasks"

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        nullable=False,
        description="Unique task identifier"
    )

    user_id: str = Field(
        index=True,
        nullable=False,
        max_length=255,
        description="Owner of the task (user identifier)"
    )

    title: str = Field(
        nullable=False,
        max_length=200,
        description="Task title/summary"
    )

    description: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Detailed task description"
    )

    completed: bool = Field(
        default=False,
        nullable=False,
        description="Task completion status"
    )

    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        description="Timestamp when task was created (UTC)"
    )

    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": datetime.utcnow},
        description="Timestamp when task was last modified (UTC)"
    )
```

### Indexes

**Primary Index**:
- `id` (UUID) - Primary key, clustered index

**Secondary Indexes**:
- `user_id` - Non-clustered index for efficient user-based filtering
- `created_at` - Non-clustered index for sorting by creation date (optional, can add if performance requires)

**Rationale**:
- `user_id` index is critical because ALL queries filter by user_id (FR-003)
- `created_at` index supports efficient sorting for list queries (newest first)
- UUID primary key prevents enumeration attacks and supports distributed systems

### Constraints

**Database-Level Constraints**:
- `id`: NOT NULL, PRIMARY KEY
- `user_id`: NOT NULL, INDEX
- `title`: NOT NULL, CHECK (length <= 200)
- `description`: CHECK (length <= 1000 OR NULL)
- `completed`: NOT NULL, DEFAULT false
- `created_at`: NOT NULL, DEFAULT CURRENT_TIMESTAMP
- `updated_at`: NOT NULL, DEFAULT CURRENT_TIMESTAMP, ON UPDATE CURRENT_TIMESTAMP

**Application-Level Validation** (Pydantic):
- `title`: Required, 1-200 characters, non-empty after trim
- `description`: Optional, 0-1000 characters
- `user_id`: Required, non-empty string
- `completed`: Boolean (true/false)

### State Transitions

The Task entity has a simple state model:

```
[Created] ---> [Active] ---> [Completed]
                  ^              |
                  |______________|
                  (can toggle back)
```

**States**:
1. **Created**: Task just created, `completed=false`
2. **Active**: Task exists and is not completed, `completed=false`
3. **Completed**: Task is marked as done, `completed=true`

**Transitions**:
- Create → Active: POST /api/{user_id}/tasks
- Active → Completed: PATCH /api/{user_id}/tasks/{id}/complete (or PUT with completed=true)
- Completed → Active: PATCH /api/{user_id}/tasks/{id}/complete (toggle) or PUT with completed=false
- Any State → Deleted: DELETE /api/{user_id}/tasks/{id} (hard delete, no soft delete in this phase)

### Relationships

**Current Phase**: No relationships (single entity)

**Future Phases** (when authentication is added):
- Task → User (Many-to-One): Each task belongs to one user
  - Foreign key: `task.user_id` → `user.id`
  - Cascade: ON DELETE CASCADE (delete tasks when user is deleted)

**Future Phases** (potential enhancements):
- Task → Category (Many-to-One): Optional task categorization
- Task → Tag (Many-to-Many): Task tagging system
- Task → Attachment (One-to-Many): File attachments

### Data Isolation Strategy

**Requirement**: Users must never access other users' tasks (FR-003, FR-005)

**Implementation**:
1. **Query Filtering**: ALL SELECT queries MUST include `WHERE user_id = :user_id`
2. **Ownership Verification**: UPDATE/DELETE operations MUST verify user_id matches before modification
3. **Error Handling**: Return 404 (not 403) if task exists but belongs to different user (prevents information leakage)

**Example Queries**:

```python
# List all tasks for a user
tasks = session.exec(
    select(Task).where(Task.user_id == user_id).order_by(Task.created_at.desc())
).all()

# Get single task (with ownership check)
task = session.exec(
    select(Task).where(Task.id == task_id, Task.user_id == user_id)
).first()
if not task:
    raise HTTPException(status_code=404, detail="Task not found")

# Update task (with ownership check)
task = session.exec(
    select(Task).where(Task.id == task_id, Task.user_id == user_id)
).first()
if not task:
    raise HTTPException(status_code=404, detail="Task not found")
task.title = new_title
task.updated_at = datetime.utcnow()
session.add(task)
session.commit()
```

### Migration Strategy

**Initial Schema Creation**:
- Use SQLModel's `SQLModel.metadata.create_all(engine)` for development
- For production, use Alembic migrations (future phase)

**Schema Evolution** (future):
- Add columns with DEFAULT values to avoid breaking changes
- Use Alembic for versioned migrations
- Test migrations on database branches before production

### Sample Data

**Example Task (JSON representation)**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user123",
  "title": "Complete project documentation",
  "description": "Write comprehensive documentation for the backend API including setup instructions and API reference",
  "completed": false,
  "created_at": "2026-02-06T10:30:00Z",
  "updated_at": "2026-02-06T10:30:00Z"
}
```

**Example Completed Task**:

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "user_id": "user123",
  "title": "Review pull request",
  "description": null,
  "completed": true,
  "created_at": "2026-02-05T14:20:00Z",
  "updated_at": "2026-02-06T09:15:00Z"
}
```

## Database Schema Diagram

```
┌─────────────────────────────────────────┐
│              tasks                      │
├─────────────────────────────────────────┤
│ id              UUID         PK         │
│ user_id         VARCHAR(255) NOT NULL   │ ← Indexed
│ title           VARCHAR(200) NOT NULL   │
│ description     VARCHAR(1000) NULL      │
│ completed       BOOLEAN      NOT NULL   │
│ created_at      TIMESTAMP    NOT NULL   │
│ updated_at      TIMESTAMP    NOT NULL   │
└─────────────────────────────────────────┘
```

## Validation Rules

### Business Rules

1. **Title Requirements**:
   - Must not be empty or whitespace-only
   - Must be between 1 and 200 characters after trimming
   - Special characters allowed

2. **Description Requirements**:
   - Optional field (can be null or empty string)
   - Maximum 1000 characters if provided
   - Special characters allowed

3. **User ID Requirements**:
   - Must not be empty
   - Format validation deferred to authentication phase
   - Currently accepts any non-empty string

4. **Completion Status**:
   - Must be boolean (true/false)
   - Defaults to false on creation
   - Can be toggled multiple times

### Validation Implementation

**Pydantic Schemas** (in `schemas/task.py`):

```python
from pydantic import BaseModel, Field, validator
from typing import Optional
from uuid import UUID
from datetime import datetime

class TaskCreate(BaseModel):
    """Schema for creating a new task"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)

    @validator('title')
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty or whitespace')
        return v.strip()

class TaskUpdate(BaseModel):
    """Schema for updating an existing task"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    completed: Optional[bool] = None

    @validator('title')
    def title_not_empty(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Title cannot be empty or whitespace')
        return v.strip() if v else v

class TaskResponse(BaseModel):
    """Schema for task responses"""
    id: UUID
    user_id: str
    title: str
    description: Optional[str]
    completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

## Performance Considerations

### Query Performance

**Expected Query Patterns**:
1. List all tasks for user: `SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC`
2. Get single task: `SELECT * FROM tasks WHERE id = ? AND user_id = ?`
3. Create task: `INSERT INTO tasks (...) VALUES (...)`
4. Update task: `UPDATE tasks SET ... WHERE id = ? AND user_id = ?`
5. Delete task: `DELETE FROM tasks WHERE id = ? AND user_id = ?`

**Index Usage**:
- Query 1: Uses `user_id` index + `created_at` index (if added)
- Query 2: Uses primary key (`id`) + `user_id` index
- Queries 3-5: Use primary key for direct access

**Expected Performance**:
- List queries: <200ms for up to 1000 tasks per user
- Single task queries: <50ms (primary key lookup)
- Write operations: <100ms

### Scalability

**Current Capacity**:
- Single table design scales to millions of tasks
- User-based partitioning possible if needed (future)
- UUID primary keys support distributed systems

**Bottlenecks** (future considerations):
- Large result sets (>1000 tasks per user) → Add pagination
- Complex filtering → Add additional indexes
- High write volume → Consider write-optimized storage

## Summary

The Task entity provides a simple, scalable foundation for task management with strict user-based data isolation. The schema supports future authentication integration without requiring migrations. All validation rules are clearly defined and enforced at both database and application levels.
