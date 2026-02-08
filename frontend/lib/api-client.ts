// Centralized API client with JWT authentication and error handling
// Implements T010, T011, T012 from tasks.md
// SECURITY: Uses httpOnly cookies for token storage (XSS protection)

import {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiError,
  isApiSuccessResponse,
  isApiErrorResponse,
  Task,
  User,
  SignInFormData,
  SignUpFormData,
  TaskFormData,
  SignInResponse,
  SignUpResponse,
  SessionResponse,
  ChatMessageRequest,
  ChatMessageResponse,
  Conversation,
  ConversationCreateRequest,
  ChatErrorCode,
  ChatError,
} from './types';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================================================
// Token Management (Cookie-Based)
// ============================================================================

/**
 * SECURITY NOTE: Tokens are now stored in httpOnly cookies set by the backend.
 * This prevents XSS attacks as JavaScript cannot access httpOnly cookies.
 * The browser automatically sends cookies with requests to the same domain.
 */

/**
 * Check if token is expired
 */
function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

// ============================================================================
// Response Interceptor (T012)
// ============================================================================

/**
 * Handle API response and extract data or throw error
 * Implements centralized error handling for all status codes
 *
 * IMPORTANT: Backend has inconsistent response formats:
 * - Task endpoints: {success: true, data: {...}, message: "..."}
 * - Auth endpoints: Direct response (AuthResponse model)
 * This function handles both formats.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  let json: any;

  try {
    json = await response.json();
  } catch (error) {
    // Response is not JSON
    throw new ApiError(
      'PARSE_ERROR',
      'Failed to parse server response',
      response.status
    );
  }

  // Error response (standardized format)
  if (isApiErrorResponse(json)) {
    const apiError = new ApiError(
      json.error.code,
      json.error.message,
      response.status
    );

    // Special handling for 401 Unauthorized
    // Cookie will be cleared by backend, just redirect to signin
    // IMPORTANT: Don't redirect if already on auth pages (prevents infinite loop)
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath === '/signin' || currentPath === '/signup';

        if (!isAuthPage) {
          window.location.href = '/signin';
        }
      }
    }

    throw apiError;
  }

  // Success response - handle both wrapped and unwrapped formats
  if (response.ok) {
    // Wrapped format: {success: true, data: {...}, message: "..."}
    if (isApiSuccessResponse<T>(json)) {
      return json.data;
    }

    // Unwrapped format: Direct response object (auth endpoints)
    // Return as-is for auth endpoints that don't use success_response wrapper
    return json as T;
  }

  // Unexpected response format
  throw new ApiError(
    'UNKNOWN_ERROR',
    'Unexpected server response format',
    response.status
  );
}

// ============================================================================
// Core API Client (T010)
// ============================================================================

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic GET request
   * SECURITY: credentials: 'include' sends httpOnly cookies automatically
   */
  private async get<T>(endpoint: string): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: headers,
      credentials: 'include', // Send cookies with request
    });

    return handleResponse<T>(response);
  }

  /**
   * Generic POST request
   * SECURITY: credentials: 'include' sends httpOnly cookies automatically
   */
  private async post<TRequest, TResponse>(
    endpoint: string,
    data: TRequest
  ): Promise<TResponse> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: headers,
      credentials: 'include', // Send cookies with request
      body: JSON.stringify(data),
    });

    return handleResponse<TResponse>(response);
  }

  /**
   * Generic PUT request
   * SECURITY: credentials: 'include' sends httpOnly cookies automatically
   */
  private async put<TRequest, TResponse>(
    endpoint: string,
    data: TRequest
  ): Promise<TResponse> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: headers,
      credentials: 'include', // Send cookies with request
      body: JSON.stringify(data),
    });

    return handleResponse<TResponse>(response);
  }

  /**
   * Generic DELETE request
   * SECURITY: credentials: 'include' sends httpOnly cookies automatically
   */
  private async delete<T>(endpoint: string): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: headers,
      credentials: 'include', // Send cookies with request
    });

    return handleResponse<T>(response);
  }

  // ==========================================================================
  // Authentication Endpoints
  // ==========================================================================

  /**
   * Sign up a new user
   * SECURITY: Token is set in httpOnly cookie by backend
   */
  async signUp(data: SignUpFormData): Promise<SignUpResponse> {
    const response = await this.post<
      { email: string; password: string },
      SignUpResponse
    >(
      '/api/auth/register',
      { email: data.email, password: data.password }
    );

    // Token is now in httpOnly cookie, no need to store it
    return response;
  }

  /**
   * Sign in an existing user
   * SECURITY: Token is set in httpOnly cookie by backend
   */
  async signIn(data: SignInFormData): Promise<SignInResponse> {
    const response = await this.post<SignInFormData, SignInResponse>(
      '/api/auth/login',
      data
    );

    // Token is now in httpOnly cookie, no need to store it
    return response;
  }

  /**
   * Sign out the current user
   * SECURITY: Backend clears the httpOnly cookie
   */
  async signOut(): Promise<void> {
    await this.post('/api/auth/logout', {});
    // Cookie is cleared by backend
  }

  /**
   * Get current session
   * SECURITY: Cookie is automatically sent with request
   */
  async getSession(): Promise<SessionResponse> {
    return this.get<SessionResponse>('/api/auth/session');
  }

  // ==========================================================================
  // Task Management Endpoints
  // ==========================================================================

  /**
   * Get all tasks for the authenticated user
   * SECURITY: Cookie is automatically sent with request
   */
  async getTasks(): Promise<Task[]> {
    return this.get<Task[]>('/api/tasks');
  }

  /**
   * Get a single task by ID
   * SECURITY: Cookie is automatically sent with request
   */
  async getTask(id: string): Promise<Task> {
    return this.get<Task>(`/api/tasks/${id}`);
  }

  /**
   * Create a new task
   * SECURITY: Cookie is automatically sent with request
   */
  async createTask(data: TaskFormData): Promise<Task> {
    return this.post<TaskFormData, Task>('/api/tasks', data);
  }

  /**
   * Update an existing task
   * SECURITY: Cookie is automatically sent with request
   */
  async updateTask(
    id: string,
    data: Partial<TaskFormData> & { completed?: boolean }
  ): Promise<Task> {
    return this.put<Partial<TaskFormData> & { completed?: boolean }, Task>(
      `/api/tasks/${id}`,
      data
    );
  }

  /**
   * Delete a task
   * SECURITY: Cookie is automatically sent with request
   */
  async deleteTask(id: string): Promise<void> {
    return this.delete<void>(`/api/tasks/${id}`);
  }

  // ==========================================================================
  // Chat Endpoints (Spec 5: ChatKit Frontend)
  // ==========================================================================

  /**
   * Send a message to the AI agent
   * Creates new conversation if conversation_id not provided
   * SECURITY: Cookie is automatically sent with request
   *
   * @param request - Message content and optional conversation_id
   * @returns AI agent's response with tool calls and conversation_id
   * @throws ApiError with ChatErrorCode on failure
   */
  async sendMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    try {
      return await this.post<ChatMessageRequest, ChatMessageResponse>(
        '/api/chat/message',
        request
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw this.mapToChatError(error, ChatErrorCode.MESSAGE_SEND_FAILED);
      }
      throw error;
    }
  }

  /**
   * Get all conversations for the authenticated user
   * Returns conversations without messages (use getConversation for full history)
   * SECURITY: Cookie is automatically sent with request
   *
   * @param limit - Maximum number of conversations to return (default: 50)
   * @returns Array of conversations sorted by most recent activity
   * @throws ApiError with ChatErrorCode on failure
   */
  async getConversations(limit: number = 50): Promise<Conversation[]> {
    try {
      const endpoint = `/api/chat/conversations?limit=${limit}`;
      return await this.get<Conversation[]>(endpoint);
    } catch (error) {
      if (error instanceof ApiError) {
        throw this.mapToChatError(error, ChatErrorCode.CONVERSATION_LOAD_FAILED);
      }
      throw error;
    }
  }

  /**
   * Get a single conversation with full message history
   * SECURITY: Cookie is automatically sent with request
   *
   * @param conversationId - UUID of the conversation
   * @returns Conversation with messages array populated
   * @throws ApiError with ChatErrorCode.CONVERSATION_NOT_FOUND if not found
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      return await this.get<Conversation>(`/api/chat/conversations/${conversationId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          throw this.mapToChatError(error, ChatErrorCode.CONVERSATION_NOT_FOUND);
        }
        throw this.mapToChatError(error, ChatErrorCode.CONVERSATION_LOAD_FAILED);
      }
      throw error;
    }
  }

  /**
   * Create a new conversation
   * SECURITY: Cookie is automatically sent with request
   *
   * @param request - Optional conversation title
   * @returns Newly created conversation (without messages)
   * @throws ApiError with ChatErrorCode on failure
   */
  async createConversation(request?: ConversationCreateRequest): Promise<Conversation> {
    try {
      return await this.post<ConversationCreateRequest, Conversation>(
        '/api/chat/conversations',
        request || {}
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw this.mapToChatError(error, ChatErrorCode.CONVERSATION_LOAD_FAILED);
      }
      throw error;
    }
  }

  /**
   * Delete a conversation and all its messages permanently
   * SECURITY: Cookie is automatically sent with request
   *
   * @param conversationId - UUID of the conversation to delete
   * @throws ApiError with ChatErrorCode on failure
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await this.delete<void>(`/api/chat/conversations/${conversationId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          throw this.mapToChatError(error, ChatErrorCode.CONVERSATION_NOT_FOUND);
        }
        throw this.mapToChatError(error, ChatErrorCode.CONVERSATION_DELETE_FAILED);
      }
      throw error;
    }
  }

  /**
   * Map ApiError to ChatError with appropriate error code
   * Provides user-friendly error messages for chat-specific errors
   *
   * @param error - Original ApiError from backend
   * @param defaultCode - Default ChatErrorCode if mapping fails
   * @returns ChatError with user-friendly message
   */
  private mapToChatError(error: ApiError, defaultCode: ChatErrorCode): ChatError {
    let code = defaultCode;
    let message = error.message;

    // Map HTTP status codes to ChatErrorCode
    switch (error.status) {
      case 401:
        code = ChatErrorCode.UNAUTHORIZED;
        message = 'Your session has expired. Please sign in again.';
        break;
      case 404:
        code = ChatErrorCode.CONVERSATION_NOT_FOUND;
        message = 'Conversation not found. It may have been deleted.';
        break;
      case 422:
        code = ChatErrorCode.INVALID_INPUT;
        message = error.message || 'Invalid input. Please check your message and try again.';
        break;
      case 500:
        code = ChatErrorCode.AI_PROCESSING_ERROR;
        message = 'AI agent failed to process your message. Please try again.';
        break;
      default:
        // Network errors or other issues
        if (error.code === 'PARSE_ERROR' || !navigator.onLine) {
          code = ChatErrorCode.NETWORK_ERROR;
          message = 'Network error. Please check your connection and try again.';
        }
    }

    return {
      code,
      message,
      details: error
    };
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const apiClient = new ApiClient(API_BASE_URL);

// Export utility function for token expiration check
export { isTokenExpired };
