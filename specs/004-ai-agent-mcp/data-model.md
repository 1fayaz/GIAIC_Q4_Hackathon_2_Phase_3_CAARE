# Data Model: Conversational Task Management

**Feature**: 004-ai-agent-mcp
**Date**: 2026-02-08
**Purpose**: Define data entities for conversation persistence and AI agent integration

## Overview

This feature extends the existing Phase 2 data model (User, Task) with new entities to support conversational task management. All entities follow SQLModel patterns and persist in Neon PostgreSQL.

---

## Existing Entities (Phase 2)

### User
**Purpose**: Represents an authenticated user

**Fields**:
- `id`: UUID (primary key)
- `email`: str (unique)
- `password_hash`: str
- `created_at`: datetime
- `updated_at`: datetime

**Relationships**:
- One-to-many with Task
- One-to-many with Conversation (new)

---

### Task
**Purpose**: Represents a user's todo item

**Fields**:
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key → User)
- `title`: str (max 200 characters)
- `description`: str | None
- `completed`: bool (default False)
- `created_at`: datetime
- `updated_at`: datetime

**Relationships**:
- Many-to-one with User

**Indexes**:
- `user_id` (for filtering user's tasks)
- `completed` (for filtering active/completed tasks)

---

## New Entities (Phase 3)

### Conversation
**Purpose**: Container for a chat session between user and AI agent

**Fields**:
- `id`: UUID (primary key, auto-generated)
- `user_id`: UUID (foreign key → User, required)
- `title`: str | None (optional, max 100 characters)
- `created_at`: datetime (auto-generated)
- `updated_at`: datetime (auto-updated on message add)

**Relationships**:
- Many-to-one with User
- One-to-many with Message

**Indexes**:
- `user_id` (for listing user's conversations)
- `updated_at` (for sorting by most recent)

**Validation Rules**:
- `user_id` must reference existing user
- `title` if provided must be 1-100 characters
- Cannot be deleted if messages exist (cascade delete messages first)

**Business Rules**:
- Title is optional; can be auto-generated from first user message
- Conversations are user-scoped (users can only access their own)
- Conversations persist indefinitely (no auto-deletion)
- Empty conversations (no messages) can be deleted

**SQLModel Definition**:
```python
from sqlmodel import SQLModel, Field, Relationship
from uuid import UUID, uuid4
from datetime import datetime

class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", nullable=False, index=True)
    title: str | None = Field(default=None, max_length=100)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    # Relationships
    user: "User" = Relationship(back_populates="conversations")
    messages: list["Message"] = Relationship(back_populates="conversation", cascade_delete=True)
```

---

### Message
**Purpose**: Individual message in a conversation (user or assistant)

**Fields**:
- `id`: UUID (primary key, auto-generated)
- `conversation_id`: UUID (foreign key → Conversation, required)
- `role`: str (enum: "user" | "assistant", required)
- `content`: str (required, max 10000 characters)
- `tool_calls`: str | None (JSON string, only for assistant messages)
- `created_at`: datetime (auto-generated)

**Relationships**:
- Many-to-one with Conversation

**Indexes**:
- `conversation_id` (for loading conversation history)
- `created_at` (for ordering messages chronologically)

**Validation Rules**:
- `conversation_id` must reference existing conversation
- `role` must be "user" or "assistant"
- `content` must be 1-10000 characters
- `tool_calls` must be valid JSON if provided
- `tool_calls` only allowed when role is "assistant"

**Business Rules**:
- Messages are immutable (no updates after creation)
- Messages are ordered by `created_at` within conversation
- User messages never have `tool_calls`
- Assistant messages may have `tool_calls` (JSON array of tool invocations)
- Deleting a conversation cascades to delete all messages

**Tool Calls Format** (JSON):
```json
[
  {
    "tool": "add_task",
    "parameters": {
      "user_id": "uuid",
      "title": "Buy groceries",
      "description": null
    },
    "result": {
      "task_id": "uuid",
      "title": "Buy groceries",
      "created_at": "2026-02-08T10:00:00Z"
    },
    "timestamp": "2026-02-08T10:00:00Z",
    "success": true,
    "error": null
  }
]
```

**SQLModel Definition**:
```python
from sqlmodel import SQLModel, Field, Relationship
from uuid import UUID, uuid4
from datetime import datetime
from enum import Enum

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"

class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    conversation_id: UUID = Field(foreign_key="conversations.id", nullable=False, index=True)
    role: MessageRole = Field(nullable=False)
    content: str = Field(min_length=1, max_length=10000)
    tool_calls: str | None = Field(default=None)  # JSON string
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    # Relationships
    conversation: Conversation = Relationship(back_populates="messages")
```

---

## Database Migrations

### Migration 1: Create Conversations Table
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at);
```

### Migration 2: Create Messages Table
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 10000),
    tool_calls TEXT,  -- JSON string
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

### Migration 3: Add Trigger for Conversation Updated At
```sql
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();
```

---

## Entity Relationships Diagram

```
User (Phase 2)
├── id (PK)
├── email
├── password_hash
├── created_at
└── updated_at
    │
    ├─── (1:N) ──→ Task (Phase 2)
    │                ├── id (PK)
    │                ├── user_id (FK)
    │                ├── title
    │                ├── description
    │                ├── completed
    │                ├── created_at
    │                └── updated_at
    │
    └─── (1:N) ──→ Conversation (Phase 3)
                     ├── id (PK)
                     ├── user_id (FK)
                     ├── title
                     ├── created_at
                     └── updated_at
                         │
                         └─── (1:N) ──→ Message (Phase 3)
                                        ├── id (PK)
                                        ├── conversation_id (FK)
                                        ├── role
                                        ├── content
                                        ├── tool_calls
                                        └── created_at
```

---

## Data Access Patterns

### Pattern 1: Create New Conversation
```python
async def create_conversation(user_id: UUID, title: str | None = None) -> Conversation:
    conversation = Conversation(user_id=user_id, title=title)
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return conversation
```

### Pattern 2: List User's Conversations
```python
async def list_conversations(user_id: UUID, limit: int = 50) -> list[Conversation]:
    result = await db.exec(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
        .limit(limit)
    )
    return result.all()
```

### Pattern 3: Load Conversation History
```python
async def get_conversation_history(conversation_id: UUID, user_id: UUID) -> list[Message]:
    # Verify ownership
    conversation = await db.get(Conversation, conversation_id)
    if not conversation or conversation.user_id != user_id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Load messages
    result = await db.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    return result.all()
```

### Pattern 4: Add Message to Conversation
```python
async def add_message(
    conversation_id: UUID,
    role: MessageRole,
    content: str,
    tool_calls: list | None = None
) -> Message:
    message = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
        tool_calls=json.dumps(tool_calls) if tool_calls else None
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message
```

### Pattern 5: Delete Conversation
```python
async def delete_conversation(conversation_id: UUID, user_id: UUID) -> None:
    conversation = await db.get(Conversation, conversation_id)
    if not conversation or conversation.user_id != user_id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await db.delete(conversation)  # Cascades to messages
    await db.commit()
```

---

## Storage Estimates

**Assumptions**:
- 10,000 active users
- Average 10 conversations per user
- Average 20 messages per conversation
- Average message size: 200 characters

**Calculations**:
- Conversations: 10,000 users × 10 conversations = 100,000 rows (~10 MB)
- Messages: 100,000 conversations × 20 messages = 2,000,000 rows (~400 MB)
- Total: ~410 MB for conversation data

**Growth Rate**:
- Assuming 100 new messages per day per active user
- Daily growth: 10,000 users × 100 messages × 200 bytes = ~200 MB/day
- Monthly growth: ~6 GB/month

**Neon PostgreSQL Capacity**: Well within limits (Neon supports TB-scale databases)

---

## Data Retention Policy

**Conversations**: Retained indefinitely (user-controlled deletion)
**Messages**: Retained indefinitely (deleted when conversation deleted)
**Audit Logs**: Retained for 90 days (if implemented)

**Future Considerations**:
- Implement conversation archiving for inactive conversations (>6 months)
- Implement message summarization for very long conversations
- Add user-controlled data export feature

---

## Security Considerations

**User Isolation**:
- All queries MUST filter by `user_id`
- Conversation access MUST verify ownership before loading messages
- No cross-user data access allowed

**Data Validation**:
- Content length limits prevent abuse
- Role enum prevents invalid message types
- Tool calls JSON validation prevents malformed data

**Audit Trail**:
- All tool invocations logged in `tool_calls` field
- Timestamps enable chronological reconstruction
- Immutable messages prevent tampering

---

## Testing Requirements

**Unit Tests**:
- Model validation (field constraints, enums)
- Relationship integrity (cascade deletes)
- JSON serialization/deserialization for tool_calls

**Integration Tests**:
- Create conversation and add messages
- Load conversation history with ownership verification
- Delete conversation and verify cascade
- Query performance with large datasets

**Security Tests**:
- Attempt to access other user's conversations (should fail)
- Attempt to add message to other user's conversation (should fail)
- Verify tool_calls JSON validation

---

## Next Steps

Data model complete. Ready to create contracts (MCP tool definitions and agent configuration).
