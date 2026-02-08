// TypeScript interfaces for the Todo application
// Matches backend schemas from Spec 1 (Backend Foundation) and Spec 2 (Auth Integration)

// ============================================================================
// Core Entities
// ============================================================================

/**
 * User entity - represents an authenticated user
 * Source: Backend User model from Spec 2 (Auth Integration)
 */
export interface User {
  id: string;           // UUID from backend
  email: string;        // User's email address
  created_at: string;   // ISO 8601 timestamp
}

/**
 * Task entity - represents a todo task belonging to a user
 * Source: Backend Task model from Spec 1 (Backend Foundation)
 */
export interface Task {
  id: string;              // UUID from backend
  title: string;           // Task title (required)
  description: string;     // Task description (optional, can be empty string)
  completed: boolean;      // Completion status
  user_id: string;         // UUID of owning user
  created_at: string;      // ISO 8601 timestamp
  updated_at: string;      // ISO 8601 timestamp
}

/**
 * Session entity - represents an authenticated user session
 * Source: Better Auth session structure (Spec 2)
 */
export interface Session {
  user: User;              // Current authenticated user
  token: string;           // JWT token for API authentication
  expires_at: string;      // ISO 8601 timestamp when token expires
}

// ============================================================================
// Form Models
// ============================================================================

/**
 * SignIn form data structure
 */
export interface SignInFormData {
  email: string;        // User's email
  password: string;     // User's password
}

/**
 * SignUp form data structure
 */
export interface SignUpFormData {
  email: string;           // User's email
  password: string;        // User's password
  confirmPassword: string; // Password confirmation
}

/**
 * Task form data structure (for create/update)
 */
export interface TaskFormData {
  title: string;        // Task title
  description: string;  // Task description (optional)
}

// ============================================================================
// API Response Models
// ============================================================================

/**
 * Generic success response wrapper from backend
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;              // Response payload (type varies by endpoint)
  message: string;      // Human-readable success message
}

/**
 * Error response structure from backend
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;       // Error code (e.g., "UNAUTHORIZED", "VALIDATION_ERROR")
    message: string;    // Human-readable error message
  };
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// Authentication API Response Types
// ============================================================================

export interface SignUpResponse {
  user: User;
  token: string;
}

export interface SignInResponse {
  user: User;
  token: string;
  expires_at: string;
}

export interface SessionResponse {
  user: User;
  expires_at: string;
}

// ============================================================================
// UI State Models
// ============================================================================

/**
 * Loading state for async operations
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Generic form state with validation errors
 */
export interface FormState<T> {
  data: T;                                      // Form field values
  errors: Partial<Record<keyof T, string>>;     // Field-specific error messages
  isSubmitting: boolean;                        // Whether form is being submitted
  submitError: string | null;                   // General submission error
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if response is a success response
 */
export function isApiSuccessResponse<T>(
  response: any
): response is ApiSuccessResponse<T> {
  return response && response.success === true && 'data' in response;
}

/**
 * Type guard to check if response is an error response
 */
export function isApiErrorResponse(response: any): response is ApiErrorResponse {
  return response && response.success === false && 'error' in response;
}

/**
 * Type guard to check if object is a Task
 */
export function isTask(obj: any): obj is Task {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.completed === 'boolean' &&
    typeof obj.user_id === 'string'
  );
}

/**
 * Type guard to check if object is a User
 */
export function isUser(obj: any): obj is User {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.created_at === 'string'
  );
}

// ============================================================================
// Custom Error Class
// ============================================================================

/**
 * Custom API error class for typed error handling
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ============================================================================
// Chat Feature Types (Spec 5: ChatKit Frontend)
// ============================================================================

/**
 * Message entity representing a single chat message.
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

/**
 * Conversation entity representing a chat session.
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

/**
 * Tool invocation metadata from AI agent.
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

/**
 * Request schema for sending a user message to the AI agent.
 * Matches backend ChatMessageRequest schema from backend/app/schemas/chat.py
 */
export interface ChatMessageRequest {
  /** User's message text (required, 1-10000 chars, non-empty) */
  content: string;

  /** Optional conversation ID to continue existing conversation (creates new if not provided) */
  conversation_id?: string;
}

/**
 * Response schema for AI agent responses to user messages.
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

/**
 * Request schema for creating a new conversation.
 * Matches backend ConversationCreateRequest schema from backend/app/schemas/chat.py
 */
export interface ConversationCreateRequest {
  /** Optional conversation title (auto-generated if not provided, max 100 chars) */
  title?: string;
}

/**
 * Client-side state for the chat interface.
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

/**
 * Temporary message for optimistic UI updates.
 * Used to display user messages immediately before backend confirmation.
 */
export interface OptimisticMessage extends Message {
  /** Flag to identify optimistic messages */
  isOptimistic: true;
}

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

// ============================================================================
// Chat Type Guards and Utilities
// ============================================================================

/**
 * Type guard to check if a message is optimistic.
 */
export function isOptimisticMessage(message: Message): message is OptimisticMessage {
  return 'isOptimistic' in message && (message as any).isOptimistic === true;
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
