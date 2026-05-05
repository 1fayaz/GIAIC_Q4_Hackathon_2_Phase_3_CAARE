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
  TaskFilters,
  SignInResponse,
  SignUpResponse,
  SessionResponse,
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
// Query string helpers
// ============================================================================

/**
 * Build a `?key=value` query string from a TaskFilters object,
 * skipping empty / undefined values and the implicit `status=all`.
 */
function buildTaskQuery(filters: TaskFilters): string {
  const params = new URLSearchParams();

  if (filters.search && filters.search.trim()) {
    params.set('search', filters.search.trim());
  }
  if (filters.status && filters.status !== 'all') {
    params.set('status', filters.status);
  }
  if (filters.priority) {
    params.set('priority', filters.priority);
  }
  if (filters.tag && filters.tag.trim()) {
    params.set('tag', filters.tag.trim());
  }
  if (filters.due_before) params.set('due_before', filters.due_before);
  if (filters.due_after) params.set('due_after', filters.due_after);
  if (filters.sort_by) params.set('sort_by', filters.sort_by);
  if (filters.order) params.set('order', filters.order);

  const qs = params.toString();
  return qs ? `?${qs}` : '';
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
   * Get all tasks for the authenticated user.
   * Optional `filters` are forwarded as query params to the backend
   * (search, status, priority, tag, due_before, due_after, sort_by, order).
   * SECURITY: Cookie is automatically sent with request.
   */
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    const qs = filters ? buildTaskQuery(filters) : '';
    return this.get<Task[]>(`/api/tasks${qs}`);
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
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const apiClient = new ApiClient(API_BASE_URL);

// Export utility function for token expiration check
export { isTokenExpired };
