# ChatKit Frontend Quickstart Guide

**Feature**: 005-chatkit-frontend
**Phase**: Phase 1 - Design
**Date**: 2026-02-08
**Status**: Developer Guide

---

## Overview

This quickstart guide helps developers set up, run, and test the ChatKit frontend integration. The chat interface connects to the existing Phase 3 backend (FastAPI + AI Agent + MCP tools) and provides a conversational interface for task management.

**Prerequisites**:
- Phase 3 backend running and accessible
- Better Auth authentication configured
- Node.js 18+ installed
- npm or yarn package manager

---

## Quick Start (5 Minutes)

### 1. Verify Backend is Running

```bash
# Check backend health
curl http://localhost:8000/health

# Expected response:
# {"status": "healthy"}
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Configure Environment Variables

Create or update `frontend/.env.local`:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Better Auth Configuration (should already exist)
AUTH_SECRET=your-secret-key-here
AUTH_URL=http://localhost:3000
```

### 4. Start Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### 5. Test the Chat Interface

1. Navigate to `http://localhost:3000/signin`
2. Sign in with your credentials
3. Navigate to `http://localhost:3000/chat`
4. Type a message: "Add a task to buy groceries"
5. Verify AI responds with confirmation

**Success Criteria**: You should see your message appear immediately (optimistic UI), followed by the AI assistant's response with a tool call badge showing "add_task" was invoked.

---

## Detailed Setup

### Backend Requirements

The chat interface requires the following backend endpoints to be functional:

```yaml
required_endpoints:
  - POST /api/chat/message
  - POST /api/chat/conversations
  - GET /api/chat/conversations
  - GET /api/chat/conversations/{conversation_id}
  - DELETE /api/chat/conversations/{conversation_id}
  - POST /api/auth/session (Better Auth)
```

**Verify Backend Endpoints**:

```bash
# Test authentication (should return 401 if not authenticated)
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"content": "test"}'

# Expected: 401 Unauthorized (authentication required)
```

### Frontend File Structure

After implementation, your frontend should have this structure:

```
frontend/
├── app/
│   └── (dashboard)/
│       └── chat/
│           └── page.tsx              # Chat page (Server Component)
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx         # Root chat container
│   │   ├── ConversationList.tsx      # Sidebar with conversations
│   │   ├── ConversationItem.tsx      # Single conversation item
│   │   ├── MessageList.tsx           # Scrollable message container
│   │   ├── MessageBubble.tsx         # Single message bubble
│   │   ├── ToolCallDisplay.tsx       # Tool invocation visualization
│   │   ├── MessageInput.tsx          # Input field with send button
│   │   ├── LoadingIndicator.tsx      # Typing indicator
│   │   └── EmptyState.tsx            # Empty state placeholder
│   └── ui/
│       ├── Button.tsx                # Existing UI components
│       ├── Input.tsx
│       ├── LoadingSpinner.tsx
│       └── ErrorMessage.tsx
├── lib/
│   ├── types.ts                      # TypeScript interfaces (updated)
│   ├── api-client.ts                 # API client (updated)
│   └── auth.ts                       # Auth utilities (existing)
└── .env.local                        # Environment variables
```

---

## Running the Chat Interface Locally

### Development Mode

```bash
# Start frontend development server
cd frontend
npm run dev

# Frontend available at: http://localhost:3000
# Chat interface at: http://localhost:3000/chat
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### With Backend Running

**Terminal 1 - Backend**:
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

---

## Testing Scenarios

### Scenario 1: Send Message and Receive Response

**Objective**: Verify basic chat functionality works end-to-end.

**Steps**:
1. Navigate to `http://localhost:3000/chat`
2. Ensure you're authenticated (should redirect to /signin if not)
3. Type in the message input: "Add a task to buy groceries tomorrow"
4. Click "Send" or press Enter

**Expected Results**:
- ✅ User message appears immediately in chat (optimistic UI)
- ✅ Loading indicator (three bouncing dots) appears
- ✅ AI assistant responds within 2-5 seconds
- ✅ Assistant message includes tool call badge showing "add_task"
- ✅ Tool call badge shows success indicator (green checkmark)
- ✅ Conversation is automatically created (check conversation list)

**Debugging**:
- Open browser DevTools → Network tab
- Look for POST request to `/api/chat/message`
- Check request payload and response
- Verify 200 OK status code

### Scenario 2: View Conversation History

**Objective**: Verify conversation persistence and message loading.

**Steps**:
1. Send several messages in a conversation
2. Refresh the page (F5)
3. Verify conversation appears in sidebar
4. Click on the conversation

**Expected Results**:
- ✅ Conversation list loads on page mount
- ✅ Most recent conversation appears at top
- ✅ Clicking conversation loads all messages
- ✅ Messages appear in chronological order
- ✅ Tool calls are displayed correctly

**Debugging**:
- Check GET request to `/api/chat/conversations`
- Check GET request to `/api/chat/conversations/{id}`
- Verify response includes messages array
- Check browser console for errors

### Scenario 3: Create New Conversation

**Objective**: Verify new conversation creation flow.

**Steps**:
1. Click "New Conversation" button (or similar)
2. Type a message: "List all my tasks"
3. Send the message

**Expected Results**:
- ✅ Active conversation is cleared
- ✅ Message input is focused
- ✅ Sending message creates new conversation
- ✅ New conversation appears in sidebar
- ✅ Conversation ID is set correctly

**Debugging**:
- Check POST request to `/api/chat/message` (no conversation_id in payload)
- Verify response includes new conversation_id
- Check conversation list updates

### Scenario 4: Delete Conversation

**Objective**: Verify conversation deletion works correctly.

**Steps**:
1. Hover over a conversation in the sidebar
2. Click the delete button (trash icon)
3. Confirm deletion in the dialog

**Expected Results**:
- ✅ Confirmation dialog appears
- ✅ Conversation is removed from list
- ✅ If active conversation was deleted, chat window clears
- ✅ Backend confirms deletion (200 OK)

**Debugging**:
- Check DELETE request to `/api/chat/conversations/{id}`
- Verify 200 OK response
- Check conversation list state updates

### Scenario 5: Handle Authentication Errors

**Objective**: Verify authentication expiration is handled gracefully.

**Steps**:
1. Sign in and start a conversation
2. Manually delete the auth cookie (DevTools → Application → Cookies)
3. Try to send a message

**Expected Results**:
- ✅ Request returns 401 Unauthorized
- ✅ User is automatically redirected to /signin
- ✅ After signing in, user can return to chat

**Debugging**:
- Check Network tab for 401 response
- Verify redirect happens automatically
- Check `api-client.ts` error handling

### Scenario 6: Handle Network Errors

**Objective**: Verify network error handling.

**Steps**:
1. Stop the backend server
2. Try to send a message

**Expected Results**:
- ✅ Error message appears: "Network error. Please check your connection."
- ✅ User's message remains in input field
- ✅ User can retry after backend is back online

**Debugging**:
- Check browser console for fetch errors
- Verify error message component displays
- Check input field still contains message

### Scenario 7: Handle AI Processing Errors

**Objective**: Verify AI agent error handling.

**Steps**:
1. Remove or invalidate OPENAI_API_KEY in backend
2. Send a message

**Expected Results**:
- ✅ Backend returns 500 error
- ✅ User sees friendly error message
- ✅ Optimistic message is removed
- ✅ User can retry

**Debugging**:
- Check backend logs for OpenAI API errors
- Verify 500 response from `/api/chat/message`
- Check error handling in frontend

### Scenario 8: Tool Call Visualization

**Objective**: Verify tool invocations are displayed correctly.

**Steps**:
1. Send message: "Add a task to buy groceries"
2. Send message: "Mark that task as complete"
3. Send message: "Show me all my tasks"

**Expected Results**:
- ✅ First message shows "add_task" tool call badge
- ✅ Second message shows "complete_task" tool call badge
- ✅ Third message shows "list_tasks" tool call badge
- ✅ Tool call badges show parameters and results
- ✅ Success/failure indicators are correct

**Debugging**:
- Check `tool_calls` field in message response
- Verify JSON parsing in `parseToolCalls()` utility
- Check ToolCallDisplay component rendering

### Scenario 9: Long Conversation Handling

**Objective**: Verify performance with many messages.

**Steps**:
1. Send 20+ messages in a conversation
2. Scroll through message history
3. Send another message

**Expected Results**:
- ✅ All messages render without lag
- ✅ Auto-scroll to bottom works
- ✅ New messages appear at bottom
- ✅ No performance degradation

**Debugging**:
- Check React DevTools for unnecessary re-renders
- Verify MessageBubble is memoized
- Consider virtualization if performance issues

### Scenario 10: Mobile Responsiveness

**Objective**: Verify chat works on mobile devices.

**Steps**:
1. Open DevTools → Toggle device toolbar
2. Select mobile device (e.g., iPhone 12)
3. Test all chat functionality

**Expected Results**:
- ✅ Conversation list is collapsible/overlay
- ✅ Chat window fills screen
- ✅ Input field is accessible
- ✅ Touch targets are large enough (44x44px)
- ✅ Keyboard doesn't obscure input

**Debugging**:
- Check responsive breakpoints in Tailwind CSS
- Verify mobile-specific styles apply
- Test on actual mobile device if possible

---

## Debugging Tips

### Browser DevTools

**Network Tab**:
```
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Look for requests to /api/chat/*
5. Check request/response payloads
6. Verify status codes (200, 401, 404, 500)
```

**Console Tab**:
```
1. Check for JavaScript errors
2. Look for API client logs
3. Verify state updates
4. Check for React warnings
```

**React DevTools**:
```
1. Install React DevTools extension
2. Inspect component tree
3. Check component props and state
4. Profile for performance issues
```

### Common Issues and Solutions

#### Issue: "Network error" when sending message

**Possible Causes**:
- Backend not running
- CORS misconfiguration
- Wrong API_URL in .env.local

**Solution**:
```bash
# Verify backend is running
curl http://localhost:8000/health

# Check CORS configuration in backend/app/main.py
# Ensure frontend URL is in allowed origins

# Verify .env.local
cat frontend/.env.local | grep API_URL
```

#### Issue: "Authentication required" error

**Possible Causes**:
- Not signed in
- JWT token expired
- Cookie not being sent

**Solution**:
```bash
# Check if auth cookie exists
# DevTools → Application → Cookies → localhost:3000
# Look for "auth_token" cookie

# Verify credentials: 'include' in fetch requests
# Check api-client.ts configuration

# Try signing out and signing in again
```

#### Issue: Messages not appearing

**Possible Causes**:
- State not updating
- API response format mismatch
- React rendering issue

**Solution**:
```javascript
// Add console.logs in ChatInterface.tsx
console.log('Messages state:', messages);
console.log('API response:', response);

// Check if messages array is updating
// Verify message format matches Message interface
// Check for React key warnings in console
```

#### Issue: Tool calls not displaying

**Possible Causes**:
- JSON parsing error
- tool_calls field is null
- ToolCallDisplay component not rendering

**Solution**:
```javascript
// Check message.tool_calls value
console.log('Tool calls:', message.tool_calls);

// Verify JSON parsing
try {
  const parsed = JSON.parse(message.tool_calls);
  console.log('Parsed tool calls:', parsed);
} catch (error) {
  console.error('Parse error:', error);
}

// Check ToolCallDisplay component props
```

#### Issue: Conversation list not loading

**Possible Causes**:
- API endpoint not responding
- User has no conversations
- State not updating

**Solution**:
```bash
# Test API endpoint directly
curl -X GET http://localhost:8000/api/chat/conversations \
  -H "Cookie: auth_token=YOUR_TOKEN"

# Check response format
# Verify conversations state in React DevTools
# Check useEffect dependencies
```

### Backend Logs

**Enable Debug Logging**:

```python
# backend/app/main.py
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

**Check Logs**:
```bash
# Backend logs will show:
# - Incoming requests
# - Authentication status
# - AI agent processing
# - Tool invocations
# - Database queries
# - Errors and exceptions
```

### Frontend Logs

**Add Debug Logging**:

```typescript
// frontend/components/chat/ChatInterface.tsx
useEffect(() => {
  console.log('[ChatInterface] State updated:', {
    conversations: conversations.length,
    activeConversationId,
    messages: messages.length,
    isLoading,
    error
  });
}, [conversations, activeConversationId, messages, isLoading, error]);
```

---

## Integration with Phase 3 Backend

### Backend API Endpoints

The chat interface integrates with these Phase 3 endpoints:

```yaml
chat_endpoints:
  send_message:
    method: POST
    path: /api/chat/message
    auth: Required (JWT cookie)
    request:
      content: string (1-10000 chars)
      conversation_id: string (optional UUID)
    response:
      message: string
      tool_calls: ToolCall[] (optional)
      conversation_id: string (UUID)

  list_conversations:
    method: GET
    path: /api/chat/conversations
    auth: Required (JWT cookie)
    query_params:
      limit: number (default 50, max 100)
    response:
      success: true
      data: Conversation[]
      message: string

  get_conversation:
    method: GET
    path: /api/chat/conversations/{conversation_id}
    auth: Required (JWT cookie)
    response:
      success: true
      data: Conversation (with messages)
      message: string

  create_conversation:
    method: POST
    path: /api/chat/conversations
    auth: Required (JWT cookie)
    request:
      title: string (optional, max 100 chars)
    response:
      success: true
      data: Conversation
      message: string

  delete_conversation:
    method: DELETE
    path: /api/chat/conversations/{conversation_id}
    auth: Required (JWT cookie)
    response:
      success: true
      data: { id: string }
      message: string
```

### Authentication Flow

```
1. User signs in via Better Auth
   ↓
2. Backend sets httpOnly cookie with JWT token
   ↓
3. Frontend makes API request with credentials: 'include'
   ↓
4. Browser automatically includes cookie
   ↓
5. Backend validates JWT and extracts user_id
   ↓
6. Backend filters data by user_id
   ↓
7. Backend returns user-scoped data
```

### Data Flow

```
User Input → Frontend State → API Client → Backend API
                ↓                              ↓
         Optimistic UI              AI Agent Processing
                ↓                              ↓
         Loading State                  Tool Invocation
                ↓                              ↓
         API Response ← Backend Response ← MCP Server
                ↓
         Update State
                ↓
         Render UI
```

---

## Performance Optimization

### Development Mode

```bash
# Enable React Strict Mode (already enabled in Next.js)
# Check for unnecessary re-renders in console

# Use React DevTools Profiler
# Identify slow components
# Optimize with React.memo, useMemo, useCallback
```

### Production Build

```bash
# Build optimized production bundle
npm run build

# Analyze bundle size
npm run build -- --analyze

# Check for:
# - Large dependencies
# - Duplicate code
# - Unused imports
```

### Monitoring

```typescript
// Add performance monitoring
const startTime = performance.now();

await apiClient.sendMessage(request);

const endTime = performance.now();
console.log(`API call took ${endTime - startTime}ms`);
```

---

## Next Steps

After completing the quickstart:

1. **Implement Components**: Use the nextjs-frontend-architect agent to implement all chat components
2. **Add Tests**: Write unit and integration tests for chat functionality
3. **Accessibility Audit**: Run accessibility tests (axe-core, Lighthouse)
4. **Performance Testing**: Test with large conversations (50+ messages)
5. **User Testing**: Get feedback from real users
6. **Documentation**: Update user-facing documentation

---

## Troubleshooting Checklist

Before asking for help, verify:

- [ ] Backend is running and accessible
- [ ] Frontend is running on correct port
- [ ] Environment variables are configured
- [ ] User is authenticated (auth cookie exists)
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API requests
- [ ] Backend logs show no errors
- [ ] CORS is configured correctly
- [ ] Database is accessible
- [ ] OpenAI API key is valid (backend)

---

## Support and Resources

**Documentation**:
- Feature Spec: `specs/005-chatkit-frontend/spec.md`
- Data Model: `specs/005-chatkit-frontend/data-model.md`
- API Contract: `specs/005-chatkit-frontend/contracts/api-client.yaml`
- Component Specs: `specs/005-chatkit-frontend/contracts/chatkit-integration.yaml`

**Backend Documentation**:
- Chat Routes: `backend/app/routes/chat.py`
- Chat Schemas: `backend/app/schemas/chat.py`
- Agent Runner: `backend/app/agent/runner.py`

**Frontend Documentation**:
- API Client: `frontend/lib/api-client.ts`
- Type Definitions: `frontend/lib/types.ts`
- Auth Utilities: `frontend/lib/auth.ts`

---

**Document Status**: ✅ Complete
**Ready for**: Development and Testing
