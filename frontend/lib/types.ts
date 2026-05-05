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
 * Priority level for a task
 */
export type Priority = 'low' | 'medium' | 'high';

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
  priority: Priority;      // Priority level (low|medium|high)
  tags: string | null;     // Comma-separated tags (e.g. "work,urgent") or null
  due_date: string | null; // ISO 8601 timestamp or null
  created_at: string;      // ISO 8601 timestamp
  updated_at: string;      // ISO 8601 timestamp
}

/**
 * Filters for the GET /api/tasks endpoint.
 */
export interface TaskFilters {
  search?: string;
  status?: 'all' | 'active' | 'completed';
  priority?: Priority;
  tag?: string;
  due_before?: string;
  due_after?: string;
  sort_by?: 'created_at' | 'updated_at' | 'due_date' | 'priority' | 'title';
  order?: 'asc' | 'desc';
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
  priority: Priority;   // Priority level (defaults to 'medium')
  tags: string | null;  // Comma-separated tags or null
  due_date: string | null; // ISO 8601 timestamp or null
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
