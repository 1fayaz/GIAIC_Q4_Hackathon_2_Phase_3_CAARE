# ChatKit Frontend Data Model

**Feature**: 005-chatkit-frontend
**Phase**: Phase 1 - Design
**Date**: 2026-02-08
**Status**: Draft

---

## Overview

This document defines the TypeScript data structures for the ChatKit frontend integration. All interfaces are designed to match the backend API schemas exactly, ensuring type safety and seamless integration with the Phase 3 backend.

**Key Principles**:
- Frontend data structures mirror backend API schemas
- No database entities (frontend only)
- Strict TypeScript typing for compile-time safety
- Immutable data flow patterns
- Clear separation between API DTOs and UI state

---

## Core Data Structures

### 1. Message

Represents a single message in a conversation (user or assistant).

```typescript
/**
 * Message entity representing a single chat message.
 *
 * Matches backend MessageResponse schema from backend/app/schemas/chat.py
 */
export interface Message {
  /** Unique message identifier (UUID) */
  id: string;

  /** Parent conversation identifier (UUID) */
  conversation_id: string;

  /** Message sender role */
  role: 'user' | 'assistant';

  /** Message text content */
  content: string;

  /** Optional JSON string documenting tool invocations (assistant messages only) */
  tool_calls: string | null;

  /** Timestamp when message was created (ISO 8601 format) */
  created_at: string;
}
```

**Field Constraints**:
- `id`: UUID v4 format (e.g., "550e8400-e29b-41d4-a716-446655440000")
- `conversation_id`: UUID v4 format
- `role`: Enum with exactly two values: "user" or "assistant"
- `content`: Non-empty string (1-10000 characters)
- `tool_calls`: JSON string or null (parse with `JSON.parse()` to get `ToolCall[]`)
- `created_at`: ISO 8601 datetime string (e.g., "2026-02-08T10:30:00Z")

**Usage Example**:
```typescript
const userMessage: Message = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  conversation_id: "660e8400-e29b-41d4-a716-446655440001",
  role: "user",
  content: "Add a task to buy groceries",
  tool_calls: null,
  created_at: "2026-02-08T10:30:00Z"
};

const assistantMessage: Message = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  conversation_id: "660e8400-e29b-41d4-a716-446655440001",
  role: "assistant",
  content: "I've added 'buy groceries' to your task list.",
  tool_calls: JSON.stringify([{
    tool: "add_task",
    parameters: { title: "Buy groceries" },
    result: { task_id: "..." },
    timestamp: "2026-02-08T10:30:00Z",
    success: true,
    error: null
  }]),
  created_at: "2026-02-08T10:30:01Z"
};
```

---

### 2. Conversation

Represents a chat session between the user and AI assistant.

```typescript
/**
 * Conversation entity representing a chat session.
 *
 * Matches backend ConversationResponse schema from backend/app/schemas/chat.py
 */
export interface Conversation {
  /** Unique conversation identifier (UUID) */
  id: string;

  /** Owner of the conversation (user identifier, UUID) */
  user_id: string;

  /** Optional conversation title (auto-generated or user-provided) */
  title: string | null;

  /** Timestamp when conversation was created (ISO 8601 format) */
  created_at: string;

  /** Timestamp when conversation was last modified (ISO 8601 format) */
  updated_at: string;

  /** Optional list of messages in chronological order */
  messages?: Message[];
}
```

**Field Constraints**:
- `id`: UUID v4 format
- `user_id`: UUID v4 format (always matches authenticated user)
- `title`: String (max 100 characters) or null
- `created_at`: ISO 8601 datetime string
- `updated_at`: ISO 8601 datetime string (updated on new messages)
- `messages`: Optional array (included only when fetching single conversation)

**Usage Example**:
```typescript
// Conversation list item (without messages)
const conversationListItem: Conversation = {
  id: "660e8400-e29b-41d4-a716-446655440001",
  user_id: "770e8400-e29b-41d4-a716-446655440002",
  title: "Task Management Session",
  created_at: "2026-02-08T10:00:00Z",
  updated_at: "2026-02-08T10:30:00Z"
};

// Full conversation (with messages)
const fullConversation: Conversation = {
  id: "660e8400-e29b-41d4-a716-446655440001",
  user_id: "770e8400-e29b-41d4-a716-446655440002",
  title: "Task Management Session",
  created_at: "2026-02-08T10:00:00Z",
  updated_at: "2026-02-08T10:30:00Z",
  messages: [
    // ... array of Message objects
  ]
};
```

---

### 3. ToolCall

Represents a tool invocation performed by the AI agent.

```typescript
/**
 * Tool invocation metadata from AI agent.
 *
 * Parsed from Message.tool_calls JSON string.
 */
export interface ToolCall {
  /** Tool name (e.g., "add_task", "list_tasks", "complete_task") */
  tool: string;

  /** Tool parameters passed to the MCP server */
  parameters: Record<string, any>;

  /** Tool execution result (success or error data) */
  result: any;

  /** Timestamp when tool was invoked (ISO 8601 format) */
  timestamp: string;

  /** Whether tool execution succeeded */
  success: boolean;

  /** Error message if tool execution failed */
  error: string | null;
}
```

**Field Constraints**:
- `tool`: Non-empty string (MCP tool name)
- `parameters`: Object with tool-specific parameters
- `result`: Any JSON-serializable value
- `timestamp`: ISO 8601 datetime string
- `success`: Boolean (true if tool executed successfully)
- `error`: String or null (populated only if success is false)

**Usage Example**:
```typescript
const toolCall: ToolCall = {
  tool: "add_task",
  parameters: {
    title: "Buy groceries",
    description: "Get milk, eggs, bread"
  },
  result: {
    task_id: "880e8400-e29b-41d4-a716-446655440003",
    title: "Buy groceries",
    created_at: "2026-02-08T10:30:00Z"
  },
  timestamp: "2026-02-08T10:30:00Z",
  success: true,
  error: null
};

// Parse from Message.tool_calls
const message: Message = { /* ... */ };
if (message.tool_calls) {
  const toolCalls: ToolCall[] = JSON.parse(message.tool_calls);
  toolCalls.forEach(call => {
    console.log(`Tool: ${call.tool}, Success: ${call.success}`);
  });
}
```

---

## API Request/Response Types

### 4. ChatMessageRequest

Request payload for sending a message to the AI agent.

```typescript
/**
 * Request schema for sending a user message to the AI agent.
 *
 * Matches backend ChatMessageRequest schema from backend/app/schemas/chat.py
 */
export interface ChatMessageRequest {
  /** User's message text (required, 1-10000 chars, non-empty) */
  content: string;

  /** Optional conversation ID to continue existing conversation (creates new if not provided) */
  conversation_id?: string;
}
```

**Validation Rules**:
- `content`: Required, 1-10000 characters, cannot be empty or whitespace-only
- `conversation_id`: Optional UUID v4 format (omit to create new conversation)

**Usage Example**:
```typescript
// New conversation
const newConversationRequest: ChatMessageRequest = {
  content: "Add a task to buy groceries"
};

// Continue existing conversation
const continueConversationRequest: ChatMessageRequest = {
  content: "Mark that task as complete",
  conversation_id: "660e8400-e29b-41d4-a716-446655440001"
};
```

---

### 5. ChatMessageResponse

Response payload from the AI agent after processing a message.

```typescript
/**
 * Response schema for AI agent responses to user messages.
 *
 * Matches backend ChatMessageResponse schema from backend/app/schemas/chat.py
 */
export interface ChatMessageResponse {
  /** AI agent's response message text */
  message: string;

  /** Optional list of tool invocations performed by the agent */
  tool_calls?: ToolCall[];

  /** Conversation identifier where this exchange occurred */
  conversation_id: string;
}
```

**Field Constraints**:
- `message`: Non-empty string (AI agent's response)
- `tool_calls`: Optional array of ToolCall objects
- `conversation_id`: UUID v4 format (new or existing conversation)

**Usage Example**:
```typescript
const response: ChatMessageResponse = {
  message: "I've added 'buy groceries' to your task list.",
  tool_calls: [
    {
      tool: "add_task",
      parameters: { title: "Buy groceries" },
      result: { task_id: "..." },
      timestamp: "2026-02-08T10:30:00Z",
      success: true,
      error: null
    }
  ],
  conversation_id: "660e8400-e29b-41d4-a716-446655440001"
};
```

---

### 6. ConversationCreateRequest

Request payload for creating a new conversation.

```typescript
/**
 * Request schema for creating a new conversation.
 *
 * Matches backend ConversationCreateRequest schema from backend/app/schemas/chat.py
 */
export interface ConversationCreateRequest {
  /** Optional conversation title (auto-generated if not provided, max 100 chars) */
  title?: string;
}
```

**Validation Rules**:
- `title`: Optional, max 100 characters, cannot be empty or whitespace-only if provided

**Usage Example**:
```typescript
// With title
const withTitle: ConversationCreateRequest = {
  title: "Task Management Session"
};

// Without title (auto-generated)
const autoTitle: ConversationCreateRequest = {};
```

---

## UI State Types

### 7. ChatState

Client-side state for the chat interface.

```typescript
/**
 * Client-side state for the chat interface.
 *
 * Manages conversations, messages, and UI state.
 */
export interface ChatState {
  /** List of user's conversations (without messages) */
  conversations: Conversation[];

  /** Currently active conversation ID */
  activeConversationId: string | null;

  /** Messages for the active conversation */
  messages: Message[];

  /** Current user input text */
  input: string;

  /** Loading state (true while AI is processing) */
  isLoading: boolean;

  /** Error message (null if no error) */
  error: string | null;
}
```

**Usage Example**:
```typescript
const [chatState, setChatState] = useState<ChatState>({
  conversations: [],
  activeConversationId: null,
  messages: [],
  input: '',
  isLoading: false,
  error: null
});
```

---

### 8. OptimisticMessage

Temporary message for optimistic UI updates.

```typescript
/**
 * Temporary message for optimistic UI updates.
 *
 * Used to display user messages immediately before backend confirmation.
 */
export interface OptimisticMessage extends Message {
  /** Temporary ID (replaced with real ID after backend response) */
  id: string; // Format: "temp-{timestamp}"

  /** Flag to identify optimistic messages */
  isOptimistic: true;
}
```

**Usage Example**:
```typescript
const optimisticMessage: OptimisticMessage = {
  id: `temp-${Date.now()}`,
  conversation_id: activeConversationId || 'new',
  role: 'user',
  content: input,
  tool_calls: null,
  created_at: new Date().toISOString(),
  isOptimistic: true
};

// Add to messages immediately
setMessages(prev => [...prev, optimisticMessage]);

// Remove on error or replace with real message on success
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Action                              │
│                    (Type message, click send)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend State Update                         │
│              (Optimistic UI - add user message)                  │
│                                                                   │
│  ChatState {                                                     │
│    messages: [...prev, optimisticMessage]                       │
│    isLoading: true                                               │
│  }                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Client Call                             │
│                                                                   │
│  apiClient.sendChatMessage({                                     │
│    content: "Add a task to buy groceries",                       │
│    conversation_id: "660e8400-..."                               │
│  })                                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API Request                           │
│                                                                   │
│  POST /api/chat/message                                          │
│  Headers: Cookie: auth_token=...                                 │
│  Body: ChatMessageRequest                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend Processing                             │
│                                                                   │
│  1. Verify JWT authentication                                    │
│  2. Load conversation history                                    │
│  3. Run AI agent with user message                               │
│  4. Agent invokes MCP tools (add_task, etc.)                     │
│  5. Save user message to database                                │
│  6. Save assistant response to database                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API Response                          │
│                                                                   │
│  200 OK                                                          │
│  Body: ChatMessageResponse {                                     │
│    message: "I've added 'buy groceries'...",                     │
│    tool_calls: [{ tool: "add_task", ... }],                      │
│    conversation_id: "660e8400-..."                               │
│  }                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend State Update                         │
│              (Add assistant message, clear loading)              │
│                                                                   │
│  ChatState {                                                     │
│    messages: [...prev, assistantMessage]                         │
│    isLoading: false                                              │
│    activeConversationId: response.conversation_id                │
│  }                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         UI Render                                │
│                                                                   │
│  - Display user message bubble                                   │
│  - Display assistant message bubble                              │
│  - Display tool call badges (if any)                             │
│  - Auto-scroll to bottom                                         │
│  - Enable input field                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Type Guards and Utilities

### 9. Type Guard Functions

```typescript
/**
 * Type guard to check if a message is optimistic.
 */
export function isOptimisticMessage(message: Message): message is OptimisticMessage {
  return 'isOptimistic' in message && message.isOptimistic === true;
}

/**
 * Type guard to check if a message has tool calls.
 */
export function hasToolCalls(message: Message): boolean {
  return message.role === 'assistant' && message.tool_calls !== null;
}

/**
 * Parse tool calls from message safely.
 */
export function parseToolCalls(message: Message): ToolCall[] | null {
  if (!message.tool_calls) return null;

  try {
    return JSON.parse(message.tool_calls) as ToolCall[];
  } catch (error) {
    console.error('Failed to parse tool_calls:', error);
    return null;
  }
}
```

---

## Validation Utilities

### 10. Input Validation

```typescript
/**
 * Validate message content before sending.
 */
export function validateMessageContent(content: string): { valid: boolean; error?: string } {
  const trimmed = content.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (trimmed.length > 10000) {
    return { valid: false, error: 'Message is too long (max 10,000 characters)' };
  }

  return { valid: true };
}

/**
 * Validate conversation title before creating.
 */
export function validateConversationTitle(title: string): { valid: boolean; error?: string } {
  const trimmed = title.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Title cannot be empty' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Title is too long (max 100 characters)' };
  }

  return { valid: true };
}
```

---

## Error Types

### 11. Chat-Specific Errors

```typescript
/**
 * Chat-specific error types.
 */
export enum ChatErrorCode {
  CONVERSATION_NOT_FOUND = 'CONVERSATION_NOT_FOUND',
  MESSAGE_SEND_FAILED = 'MESSAGE_SEND_FAILED',
  CONVERSATION_LOAD_FAILED = 'CONVERSATION_LOAD_FAILED',
  CONVERSATION_DELETE_FAILED = 'CONVERSATION_DELETE_FAILED',
  AI_PROCESSING_ERROR = 'AI_PROCESSING_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED'
}

/**
 * Chat error with code and user-friendly message.
 */
export interface ChatError {
  code: ChatErrorCode;
  message: string;
  details?: any;
}
```

---

## Summary

This data model provides:

1. **Type Safety**: All data structures are strictly typed with TypeScript
2. **Backend Alignment**: Interfaces match backend API schemas exactly
3. **Validation**: Built-in validation utilities for user input
4. **Error Handling**: Structured error types for consistent error handling
5. **Optimistic UI**: Support for optimistic updates with temporary messages
6. **Tool Call Parsing**: Safe parsing utilities for tool invocation metadata

**Next Steps**:
1. Add these interfaces to `frontend/lib/types.ts`
2. Implement API client methods using these types
3. Build React components with these data structures
4. Add unit tests for validation utilities

---

**Document Status**: ✅ Complete
**Ready for**: API Client Implementation
