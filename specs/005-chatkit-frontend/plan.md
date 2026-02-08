# Implementation Plan: AI Chat Interface for Task Management

**Branch**: `005-chatkit-frontend` | **Date**: 2026-02-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-chatkit-frontend/spec.md`

## Summary

Build a production-ready ChatKit-based frontend that integrates with the existing AI Agent backend (Phase 3) to enable conversational task management. Users will interact with an AI assistant through a chat interface to create, view, update, delete, and complete tasks using natural language. The frontend will handle authentication via Better Auth JWT tokens, manage conversation persistence, and provide a seamless user experience with loading indicators and error handling.

## Technical Context

**Language/Version**: TypeScript/JavaScript (Next.js 16+, React 18+)
**Primary Dependencies**: Next.js 16+ (App Router), React 18+, OpenAI ChatKit, Better Auth client SDK, Axios/Fetch for API calls, Tailwind CSS (existing)
**Storage**: N/A (frontend only - backend API handles all persistence via Neon PostgreSQL)
**Testing**: Jest + React Testing Library (standard Next.js testing stack)
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
**Project Type**: Web application (frontend only, integrates with existing backend)
**Performance Goals**: <200ms UI response time, <5 seconds for AI responses (95% of requests), loading indicators within 200ms
**Constraints**: Must use Next.js App Router (not Pages Router), JWT-based authentication via Better Auth, backend API contract must NOT be changed, ChatKit library compatibility with Next.js 16+
**Scale/Scope**: Single-page chat interface with conversation list sidebar, support for existing user base (~10k users), handle conversations with 100+ messages efficiently

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Compliance

- [x] **I. Spec-Driven Development**: Specification created and approved (spec.md). All implementation decisions will be traceable to spec, plan, and tasks.

- [x] **II. End-to-End Correctness**: Frontend will integrate with existing Phase 3 backend API. API contracts defined in backend schemas will be honored. ChatKit UI will correctly display backend responses.

- [x] **III. Secure Multi-User Architecture**: Frontend will attach JWT token to all API requests. User identity will be extracted from Better Auth session. No user data will be stored in frontend beyond UI state.

- [x] **IV. Separation of Concerns**: Frontend will only handle presentation and user interaction. No business logic in frontend. All task operations performed via backend API. ChatKit handles chat UI, API client handles backend communication.

- [x] **V. No Manual Coding**: All implementation via Claude Code agents (nextjs-frontend-architect for UI, auth-security for authentication integration).

- [x] **VI. Incremental Delivery**: User stories prioritized P1 (messaging), P2 (persistence, error handling), P3 (conversation management). Each story independently testable.

- [x] **VII. AI Agent Determinism and Tool Isolation**: Frontend does not interact with AI agent directly - all communication through backend API. Backend enforces tool isolation.

- [x] **VIII. MCP Tool Architecture**: Frontend does not implement MCP tools - only displays tool invocation results from backend responses.

- [x] **IX. Conversation State Persistence**: Frontend loads conversation history from backend API. No in-memory conversation state beyond current UI session. Backend handles all persistence.

### Technology Stack Compliance

- [x] **Frontend**: Next.js 16+ with App Router (as specified)
- [x] **Authentication**: Better Auth with JWT tokens (existing from Phase 2)
- [x] **Backend API**: FastAPI (existing from Phase 3 - no changes required)
- [x] **Database**: Neon PostgreSQL (existing - frontend does not access directly)

### Frontend-Specific Standards Compliance

- [x] **Component Architecture**: Use Next.js App Router with server and client components appropriately
- [x] **State Management**: Use React hooks for local state, no global state library needed (conversation state from backend)
- [x] **API Integration**: Use fetch/axios with proper error handling and authentication headers
- [x] **Authentication Flow**: Extract user session from Better Auth, attach JWT to all API requests
- [x] **Error Handling**: Display user-friendly error messages, handle 401/403/500 errors gracefully
- [x] **Loading States**: Show loading indicators during API calls, optimistic UI updates where appropriate

**Constitution Check Result**: ✅ PASSED - All principles and standards compliant. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/005-chatkit-frontend/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (in progress)
├── research.md          # Phase 0 output (to be created)
├── data-model.md        # Phase 1 output (to be created)
├── quickstart.md        # Phase 1 output (to be created)
├── contracts/           # Phase 1 output (to be created)
│   ├── api-client.yaml  # Backend API client interface
│   └── chatkit-integration.yaml # ChatKit component specifications
├── checklists/
│   └── requirements.md  # Spec quality checklist (completed)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

**Existing Project Structure** (verified from Phase 2 and Phase 3):

```text
frontend/
├── app/                         # Next.js App Router directory
│   ├── (auth)/                  # Existing: Auth route group
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/             # Existing: Dashboard route group
│   │   ├── tasks/
│   │   └── layout.tsx
│   └── chat/                    # NEW: Chat route (this feature)
│       ├── page.tsx             # Main chat interface
│       ├── layout.tsx           # Chat layout with conversation sidebar
│       └── [conversationId]/    # Dynamic route for specific conversations
│           └── page.tsx
├── components/
│   ├── auth/                    # Existing: Auth components
│   ├── tasks/                   # Existing: Task components
│   ├── ui/                      # Existing: UI components (shadcn/ui)
│   └── chat/                    # NEW: Chat UI components (this feature)
│       ├── ChatInterface.tsx    # Main chat component with ChatKit
│       ├── MessageList.tsx      # Message display component
│       ├── MessageInput.tsx     # Message input component
│       ├── ConversationList.tsx # Conversation sidebar
│       ├── LoadingIndicator.tsx # Loading states
│       └── ErrorMessage.tsx     # Error display component
├── hooks/                       # Existing: React hooks
│   └── useChat.ts               # NEW: Chat state management hook
├── lib/                         # Existing: Utility libraries
│   ├── chat-api.ts              # NEW: Chat API client (this feature)
│   └── auth.ts                  # Existing: Auth utilities
├── middleware.ts                # Existing: Next.js middleware (auth protection)
└── package.json                 # Update with ChatKit dependency
```

**Structure Decision**: Web application structure with existing Phase 2 and Phase 3 foundation. Frontend uses Next.js 16+ App Router with route groups. This feature adds:
- Frontend: `app/chat/` route, `components/chat/` UI components, `lib/chat-api.ts` API client
- No backend changes required (Phase 3 API already complete)
- No database changes required (backend handles all persistence)

## Complexity Tracking

> **No violations to justify** - All constitution principles and standards are followed.

---

## Phase 0: Research & Technology Decisions

**Status**: ✅ COMPLETED

**Research Tasks**:
1. ✅ OpenAI ChatKit integration with Next.js 16+ App Router
2. ✅ Better Auth session handling in frontend (JWT extraction)
3. ✅ Backend API contract validation (Phase 3 endpoints)
4. ✅ Conversation state management patterns (load from backend vs local state)
5. ✅ Error handling patterns for authentication and network failures
6. ✅ ChatKit customization options for task management use case

**Output**: `research.md` with all technology decisions documented

**Key Decisions**:
- ChatKit integrated as React component within Next.js App Router pages
- Better Auth session accessed via client-side hooks to extract JWT token
- Backend API client implemented as TypeScript module with typed interfaces
- Conversation history loaded from backend on page load, messages added optimistically
- Layered error handling (API client → component → UI) with user-friendly messages
- ChatKit customized with task-specific message rendering for tool confirmations

---

## Phase 1: Design & Contracts

**Status**: ✅ COMPLETED

**Deliverables**:
1. ✅ `data-model.md` - Frontend data structures (TypeScript interfaces for API responses)
2. ✅ `contracts/api-client.yaml` - Backend API client interface specifications
3. ✅ `contracts/chatkit-integration.yaml` - ChatKit component integration specifications
4. ✅ `quickstart.md` - Developer guide with local testing and debugging

**Output**: Complete design artifacts ready for task breakdown

**Design Highlights**:
- TypeScript interfaces matching backend API schemas (ChatMessageRequest, ChatMessageResponse, ConversationResponse)
- API client with methods for sendMessage, getConversations, getConversation, deleteConversation
- ChatKit integration with custom message renderers for tool invocations
- Authentication flow: Better Auth session → JWT extraction → API request headers
- Error handling strategy: network errors, auth errors, AI processing errors
- Testing scenarios covering messaging, persistence, conversation management, error handling

---

## Constitution Check Re-Validation

**Status**: ✅ PASSED (Post-Design)

All design decisions comply with constitutional principles:
- ✅ Frontend only handles presentation (no business logic)
- ✅ All data operations through backend API
- ✅ JWT authentication on all requests
- ✅ No direct database access from frontend
- ✅ Conversation state loaded from backend (no in-memory persistence)
- ✅ Backend API contract unchanged (Phase 3 endpoints used as-is)

---

## Next Steps

**Planning Complete** ✅

Ready for `/sp.tasks` to break implementation plan into atomic, testable tasks organized by user story priority (P1, P2, P3).

**Expected Task Phases**:
1. **Setup**: Install ChatKit, configure TypeScript interfaces
2. **Foundational**: API client, authentication integration, route structure
3. **User Story 1 (P1)**: Basic messaging with ChatKit
4. **User Story 2 (P2)**: Conversation persistence and error handling
5. **User Story 3 (P3)**: Conversation management (list, delete)
6. **Polish**: Testing, documentation, validation

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
