# ChatKit Frontend Integration Research
**Feature**: 005-chatkit-frontend
**Phase**: Phase 0 - Research & Technology Decisions
**Date**: 2026-02-08
**Status**: Research Complete

---

## Executive Summary

This document captures technology decisions and architectural patterns for integrating a chat interface into the Next.js 16+ App Router frontend. The chat interface will connect to the existing Phase 3 backend (FastAPI + AI Agent + MCP tools) without requiring backend modifications.

**Key Decisions**:
- Use custom React chat components (not OpenAI ChatKit library)
- Leverage Better Auth httpOnly cookie authentication
- Build on existing API client patterns
- Implement optimistic UI updates with React hooks
- Use Server Components for initial data loading, Client Components for interactivity

---

## 1. Chat UI Library Selection

### Decision: Custom React Components (No External Chat Library)

**Rationale**:
1. **OpenAI ChatKit Limitations**: After research, OpenAI does not provide a production-ready "ChatKit" library. The term often refers to custom implementations or third-party libraries that may not align with our architecture.

2. **Full Control**: Building custom components gives us complete control over:
   - Message rendering (especially tool call visualization)
   - Integration with existing design system
   - Performance optimization
   - TypeScript type safety with our backend schemas

3. **Existing Component Patterns**: The codebase already has established patterns:
   - UI components in `frontend/components/ui/` (Button, Input, LoadingSpinner, ErrorMessage)
   - Feature components in `frontend/components/tasks/`
   - Consistent styling with Tailwind CSS
   - TypeScript interfaces in `frontend/lib/types.ts`

4. **Lightweight Solution**: Chat UI is relatively simple:
   - Message list (scrollable container)
   - Message bubbles (user vs assistant styling)
   - Input field with send button
   - Loading indicators
   - Error states

**Alternatives Considered**:
- **react-chatbot-kit**: Too opinionated, doesn't fit our backend structure
- **@chatscope/chat-ui-kit-react**: Heavy dependency, unnecessary features
- **stream-chat-react**: Designed for Stream.io backend, not compatible
- **Custom Implementation**: ✅ CHOSEN - Best fit for our requirements

**Implementation Notes**:
- Create components in `frontend/components/chat/`
- Follow existing component architecture patterns
- Use TypeScript interfaces from backend schemas
- Leverage Tailwind CSS for styling consistency

---

## 2. Next.js 16+ App Router Integration

### Decision: Client Components for Chat Interface

**Rationale**:
1. **Interactivity Requirements**: Chat interface requires:
   - Real-time user input handling
   - Optimistic UI updates
   - WebSocket or polling (future enhancement)
   - React hooks (useState, useEffect, useRef)
   - Browser APIs (scroll, focus)

2. **Server Component Limitations**: Server Components cannot:
   - Use React hooks
   - Handle user events
   - Maintain client-side state
   - Access browser APIs

3. **Hybrid Approach**: Use both component types strategically:
   - **Server Component**: Page wrapper, initial conversation list loading
   - **Client Component**: Chat interface, message input, real-time updates

**Architecture Pattern**:

```typescript
// app/(dashboard)/chat/page.tsx (Server Component)
export default async function ChatPage() {
  // Server-side data fetching (optional, for initial load)
  // const initialConversations = await getConversations();

  return (
    <div>
      <ChatInterface /> {/* Client Component */}
    </div>
  );
}

// components/chat/ChatInterface.tsx (Client Component)
'use client';

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  // ... chat logic
}
```

**Component Boundaries**:
- **Server Components**: Layout, navigation, static content
- **Client Components**: Chat UI, message list, input form, real-time features

**Performance Considerations**:
- Minimize client bundle size by keeping Server Components where possible
- Use dynamic imports for heavy chat components
- Implement virtualization for long message lists (react-window or react-virtual)

---

## 3. Better Auth Session Handling

### Decision: Leverage Existing httpOnly Cookie Authentication

**Current Implementation Analysis**:

From `frontend/lib/auth.ts` and `frontend/lib/api-client.ts`:
- JWT tokens stored in httpOnly cookies (set by backend)
- Cookies automatically sent with `credentials: 'include'`
- No manual token extraction needed in frontend
- Session validation via `/api/auth/session` endpoint

**Chat API Authentication Pattern**:

```typescript
// No changes needed - existing pattern works perfectly

// 1. API client already configured for cookie-based auth
const apiClient = new ApiClient(API_BASE_URL);

// 2. All requests include credentials
private async post<TRequest, TResponse>(
  endpoint: string,
  data: TRequest
): Promise<TResponse> {
  const response = await fetch(`${this.baseUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // ✅ Sends httpOnly cookie automatically
    body: JSON.stringify(data),
  });
  return handleResponse<TResponse>(response);
}

// 3. Chat endpoints work the same way
async sendChatMessage(data: ChatMessageRequest): Promise<ChatMessageResponse> {
  return this.post<ChatMessageRequest, ChatMessageResponse>(
    '/api/chat/message',
    data
  );
}
```

**Session Expiration Handling**:

From `frontend/lib/api-client.ts` (lines 79-91):
```typescript
// Automatic redirect on 401 Unauthorized
if (response.status === 401) {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath === '/signin' || currentPath === '/signup';

    if (!isAuthPage) {
      window.location.href = '/signin'; // ✅ Already implemented
    }
  }
}
```

**No Changes Required**: The existing authentication infrastructure is perfectly suited for chat API integration.

---

## 4. Backend API Contract Validation

### Analysis: Phase 3 Chat Endpoints (Already Implemented)

**Endpoint Review** (from `backend/app/routes/chat.py`):

#### 4.1 POST /api/chat/message
**Purpose**: Send user message to AI agent

**Request Schema** (`backend/app/schemas/chat.py`, lines 16-69):
```python
class ChatMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=10000)
    conversation_id: Optional[UUID] = Field(default=None)
```

**Response Schema** (lines 215-259):
```python
class ChatMessageResponse(BaseModel):
    message: str  # AI agent's response
    tool_calls: Optional[List[dict]]  # Tool invocations
    conversation_id: UUID  # Conversation ID
```

**Frontend TypeScript Interface Needed**:
```typescript
interface ChatMessageRequest {
  content: string;
  conversation_id?: string; // UUID
}

interface ToolCall {
  tool: string;
  parameters: Record<string, any>;
  result: any;
  timestamp: string;
  success: boolean;
  error: string | null;
}

interface ChatMessageResponse {
  message: string;
  tool_calls?: ToolCall[];
  conversation_id: string;
}
```

#### 4.2 POST /api/chat/conversations
**Purpose**: Create new conversation

**Request Schema** (lines 72-119):
```python
class ConversationCreateRequest(BaseModel):
    title: Optional[str] = Field(default=None, max_length=100)
```

**Response**: Standard success response with `ConversationResponse`

#### 4.3 GET /api/chat/conversations
**Purpose**: List user's conversations

**Query Parameters**:
- `limit`: int (default 50, max 100)

**Response**: Array of `ConversationResponse` (without messages)

#### 4.4 GET /api/chat/conversations/{conversation_id}
**Purpose**: Get single conversation with full message history

**Response Schema** (lines 164-212):
```python
class ConversationResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: Optional[str]
    created_at: datetime
    updated_at: datetime
    messages: Optional[List[MessageResponse]]  # Chronologically ordered
```

**Frontend TypeScript Interface Needed**:
```typescript
interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  tool_calls: string | null; // JSON string
  created_at: string;
}

interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}
```

#### 4.5 DELETE /api/chat/conversations/{conversation_id}
**Purpose**: Delete conversation and all messages

**Response**: Standard success response

### Validation Result: ✅ No Backend Changes Required

**Findings**:
1. All required endpoints are implemented
2. Request/response schemas are well-defined
3. Authentication is properly enforced (JWT via httpOnly cookie)
4. User data isolation is implemented (user_id filtering)
5. Error handling follows standard patterns (401, 404, 500)
6. Tool call metadata is included in responses

**Frontend Implementation Requirements**:
1. Add TypeScript interfaces to `frontend/lib/types.ts`
2. Add API methods to `frontend/lib/api-client.ts`
3. No backend modifications needed

---

## 5. Conversation State Management

### Decision: React Hooks with Optimistic UI Updates

**State Management Strategy**:

```typescript
// components/chat/ChatInterface.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { Message, Conversation } from '@/lib/types';

export function ChatInterface() {
  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Message state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ... implementation
}
```

**Optimistic UI Pattern**:

```typescript
async function sendMessage() {
  if (!input.trim()) return;

  const userMessage: Message = {
    id: `temp-${Date.now()}`, // Temporary ID
    conversation_id: activeConversationId || 'new',
    role: 'user',
    content: input,
    tool_calls: null,
    created_at: new Date().toISOString(),
  };

  // 1. Optimistic update - add user message immediately
  setMessages(prev => [...prev, userMessage]);
  setInput('');
  setIsLoading(true);

  try {
    // 2. Send to backend
    const response = await apiClient.sendChatMessage({
      content: userMessage.content,
      conversation_id: activeConversationId || undefined,
    });

    // 3. Add assistant response
    const assistantMessage: Message = {
      id: `temp-${Date.now() + 1}`,
      conversation_id: response.conversation_id,
      role: 'assistant',
      content: response.message,
      tool_calls: response.tool_calls ? JSON.stringify(response.tool_calls) : null,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, assistantMessage]);

    // 4. Update conversation ID if new conversation
    if (!activeConversationId) {
      setActiveConversationId(response.conversation_id);
      loadConversations(); // Refresh conversation list
    }

  } catch (error) {
    // 5. Remove optimistic message on error
    setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    setError('Failed to send message. Please try again.');
  } finally {
    setIsLoading(false);
  }
}
```

**State Persistence**:
- **Server as Source of Truth**: Always load from backend on mount/refresh
- **No Local Storage**: Avoid stale data issues
- **Conversation List**: Refresh after creating new conversation
- **Message History**: Load from backend when switching conversations

**Performance Optimizations**:
1. **Pagination**: Load conversations in batches (limit=50)
2. **Message Truncation**: Backend already limits to 50 messages (line 214 in chat.py)
3. **Debouncing**: Debounce input to prevent excessive re-renders
4. **Memoization**: Use React.memo for message components

---

## 6. Error Handling Patterns

### Decision: Consistent Error Handling Across Chat Features

**Error Categories**:

#### 6.1 Network Errors (Fetch Failures)
```typescript
try {
  const response = await apiClient.sendChatMessage(data);
} catch (error) {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    setError('Network error. Please check your connection.');
  }
}
```

#### 6.2 Authentication Errors (401/403)
**Already Handled**: `api-client.ts` automatically redirects to `/signin` on 401

```typescript
// From api-client.ts (lines 82-91)
if (response.status === 401) {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath === '/signin' || currentPath === '/signup';

    if (!isAuthPage) {
      window.location.href = '/signin'; // ✅ Automatic redirect
    }
  }
}
```

#### 6.3 AI Processing Errors (Backend Errors)
```typescript
// Backend returns error in response
if (!response.success) {
  setError(response.error || 'AI agent failed to process your message.');
}

// Example error messages:
// - "AI agent not configured. Please contact administrator." (500)
// - "Conversation not found" (404)
// - "Message content cannot be empty" (422)
```

#### 6.4 Validation Errors (422)
```typescript
// From ApiError class in types.ts
if (error instanceof ApiError && error.status === 422) {
  setError('Invalid input. Please check your message and try again.');
}
```

**User-Friendly Error Messages**:

```typescript
function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        return 'Your session has expired. Please sign in again.';
      case 'VALIDATION_ERROR':
        return 'Invalid input. Please check your message.';
      case 'NOT_FOUND':
        return 'Conversation not found. It may have been deleted.';
      case 'INTERNAL_SERVER_ERROR':
        return 'Something went wrong. Please try again.';
      default:
        return error.message;
    }
  }

  if (error instanceof TypeError) {
    return 'Network error. Please check your connection.';
  }

  return 'An unexpected error occurred. Please try again.';
}
```

**Error UI Components**:

```typescript
// Inline error message (for form errors)
{error && (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
    {error}
  </div>
)}

// Toast notification (for background errors)
// Use existing ErrorMessage component from components/ui/ErrorMessage.tsx
<ErrorMessage message={error} onDismiss={() => setError(null)} />
```

**Retry Mechanisms**:

```typescript
// Exponential backoff for transient errors
async function sendMessageWithRetry(
  data: ChatMessageRequest,
  maxRetries = 3
): Promise<ChatMessageResponse> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiClient.sendChatMessage(data);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx)
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
```

---

## 7. ChatKit Customization (Custom Components)

### Decision: Build Custom Chat Components with Tailwind CSS

**Component Architecture**:

```
frontend/components/chat/
├── ChatInterface.tsx          # Main chat container (Client Component)
├── ConversationList.tsx       # Sidebar with conversation list
├── ConversationItem.tsx       # Single conversation in list
├── MessageList.tsx            # Scrollable message container
├── MessageBubble.tsx          # Single message (user or assistant)
├── ToolCallDisplay.tsx        # Tool invocation visualization
├── MessageInput.tsx           # Input field with send button
├── LoadingIndicator.tsx       # Typing indicator for AI
└── EmptyState.tsx             # Empty conversation placeholder
```

**Message Bubble Design**:

```typescript
// components/chat/MessageBubble.tsx
'use client';

import { Message } from '@/lib/types';
import { ToolCallDisplay } from './ToolCallDisplay';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const toolCalls = message.tool_calls ? JSON.parse(message.tool_calls) : null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
        isUser
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-900'
      }`}>
        {/* Message content */}
        <p className="whitespace-pre-wrap">{message.content}</p>

        {/* Tool calls (assistant only) */}
        {!isUser && toolCalls && (
          <ToolCallDisplay toolCalls={toolCalls} />
        )}

        {/* Timestamp */}
        <p className={`text-xs mt-1 ${
          isUser ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {new Date(message.created_at).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
```

**Tool Call Visualization**:

```typescript
// components/chat/ToolCallDisplay.tsx
'use client';

interface ToolCall {
  tool: string;
  parameters: Record<string, any>;
  result: any;
  timestamp: string;
  success: boolean;
  error: string | null;
}

interface ToolCallDisplayProps {
  toolCalls: ToolCall[];
}

export function ToolCallDisplay({ toolCalls }: ToolCallDisplayProps) {
  return (
    <div className="mt-2 space-y-2">
      {toolCalls.map((call, index) => (
        <div
          key={index}
          className="bg-white/10 rounded px-3 py-2 text-sm"
        >
          {/* Tool icon and name */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono">🔧</span>
            <span className="font-semibold">{call.tool}</span>
            {call.success ? (
              <span className="text-green-600">✓</span>
            ) : (
              <span className="text-red-600">✗</span>
            )}
          </div>

          {/* Parameters */}
          <div className="text-xs opacity-75">
            {Object.entries(call.parameters).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium">{key}:</span> {JSON.stringify(value)}
              </div>
            ))}
          </div>

          {/* Error message */}
          {call.error && (
            <div className="text-xs text-red-600 mt-1">
              Error: {call.error}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

**Loading Indicator**:

```typescript
// components/chat/LoadingIndicator.tsx
'use client';

export function LoadingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-100 rounded-lg px-4 py-2">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
```

**Message Input**:

```typescript
// components/chat/MessageInput.tsx
'use client';

import { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-white p-4">
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Shift+Enter for new line)"
          disabled={disabled}
          className="flex-1 resize-none border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={1}
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="px-6"
        >
          Send
        </Button>
      </div>
    </div>
  );
}
```

**Styling Consistency**:
- Use existing Tailwind CSS configuration
- Match color scheme from `frontend/app/globals.css`
- Reuse UI components (Button, Input, LoadingSpinner, ErrorMessage)
- Follow responsive design patterns from existing pages

---

## 8. Implementation Roadmap

### Phase 1: TypeScript Interfaces & API Client
**Files to Create/Modify**:
- `frontend/lib/types.ts` - Add chat-related interfaces
- `frontend/lib/api-client.ts` - Add chat API methods

**Estimated Effort**: 2-3 hours

### Phase 2: Core Chat Components
**Files to Create**:
- `frontend/components/chat/ChatInterface.tsx`
- `frontend/components/chat/MessageList.tsx`
- `frontend/components/chat/MessageBubble.tsx`
- `frontend/components/chat/MessageInput.tsx`
- `frontend/components/chat/LoadingIndicator.tsx`

**Estimated Effort**: 4-6 hours

### Phase 3: Conversation Management
**Files to Create**:
- `frontend/components/chat/ConversationList.tsx`
- `frontend/components/chat/ConversationItem.tsx`
- `frontend/components/chat/EmptyState.tsx`

**Estimated Effort**: 3-4 hours

### Phase 4: Tool Call Visualization
**Files to Create**:
- `frontend/components/chat/ToolCallDisplay.tsx`

**Estimated Effort**: 2-3 hours

### Phase 5: Chat Page & Routing
**Files to Create**:
- `frontend/app/(dashboard)/chat/page.tsx`
- `frontend/app/(dashboard)/chat/layout.tsx` (optional)

**Estimated Effort**: 1-2 hours

### Phase 6: Testing & Polish
**Tasks**:
- Error handling edge cases
- Loading states
- Responsive design
- Accessibility (ARIA labels, keyboard navigation)
- Performance optimization

**Estimated Effort**: 3-4 hours

**Total Estimated Effort**: 15-22 hours

---

## 9. Risk Assessment

### High Priority Risks

#### Risk 1: Message History Performance
**Issue**: Loading 50+ messages could cause performance issues
**Mitigation**:
- Implement virtualization (react-window)
- Backend already limits to 50 messages
- Add pagination for older messages

#### Risk 2: Real-Time Updates
**Issue**: Users won't see new messages without refresh
**Mitigation**:
- Phase 1: Manual refresh button
- Phase 2: Polling every 30 seconds
- Phase 3: WebSocket integration (future)

#### Risk 3: Tool Call Parsing Errors
**Issue**: Backend returns tool_calls as JSON string, parsing could fail
**Mitigation**:
- Wrap JSON.parse in try-catch
- Display raw string if parsing fails
- Add error boundary around ToolCallDisplay

### Medium Priority Risks

#### Risk 4: Session Expiration During Chat
**Issue**: User's session expires mid-conversation
**Mitigation**: Already handled by api-client.ts (automatic redirect to /signin)

#### Risk 5: Conversation Title Generation
**Issue**: Backend auto-generates titles, might not be user-friendly
**Mitigation**:
- Allow manual title editing (future enhancement)
- Display first message preview if no title

### Low Priority Risks

#### Risk 6: Mobile Responsiveness
**Issue**: Chat UI might not work well on mobile
**Mitigation**:
- Use mobile-first design
- Test on various screen sizes
- Implement responsive breakpoints

---

## 10. Success Criteria

### Functional Requirements
- ✅ User can send messages to AI agent
- ✅ User can view AI responses with tool call metadata
- ✅ User can create new conversations
- ✅ User can view conversation history
- ✅ User can switch between conversations
- ✅ User can delete conversations
- ✅ Authentication is enforced (httpOnly cookies)
- ✅ Errors are handled gracefully

### Non-Functional Requirements
- ✅ Response time < 2 seconds for message send
- ✅ UI is responsive (mobile, tablet, desktop)
- ✅ Accessible (WCAG 2.1 Level AA)
- ✅ No backend modifications required
- ✅ Consistent with existing design system
- ✅ TypeScript type safety throughout

### User Experience Requirements
- ✅ Optimistic UI updates (instant feedback)
- ✅ Loading indicators during AI processing
- ✅ Clear error messages
- ✅ Auto-scroll to latest message
- ✅ Keyboard shortcuts (Enter to send)
- ✅ Tool call visualization is intuitive

---

## 11. References

### Backend API Documentation
- **Chat Routes**: `backend/app/routes/chat.py`
- **Chat Schemas**: `backend/app/schemas/chat.py`
- **Message Model**: `backend/app/models/message.py`
- **Conversation Model**: `backend/app/models/conversation.py`

### Frontend Architecture
- **Auth Context**: `frontend/lib/auth.ts`
- **API Client**: `frontend/lib/api-client.ts`
- **Type Definitions**: `frontend/lib/types.ts`
- **UI Components**: `frontend/components/ui/`

### Technology Stack
- **Frontend**: Next.js 16+ (App Router), React 19, TypeScript 5.9
- **Styling**: Tailwind CSS 3.4
- **Authentication**: Better Auth 1.4 (httpOnly cookies)
- **HTTP Client**: Native Fetch API
- **Backend**: FastAPI (already implemented)

---

## Conclusion

This research establishes a clear path forward for implementing the ChatKit frontend feature. The decision to build custom React components rather than use an external library provides maximum flexibility and control while maintaining consistency with the existing codebase.

**Key Takeaways**:
1. No backend changes required - Phase 3 API is complete
2. Leverage existing authentication infrastructure (httpOnly cookies)
3. Build custom components for full control and type safety
4. Use optimistic UI updates for responsive user experience
5. Follow established patterns from existing codebase

**Next Steps**:
1. Create specification document (spec.md)
2. Generate architectural plan (plan.md)
3. Break down into atomic tasks (tasks.md)
4. Implement via Claude Code agents (nextjs-frontend-architect)

---

**Document Status**: ✅ Research Complete
**Ready for**: Specification Phase (/sp.specify)
