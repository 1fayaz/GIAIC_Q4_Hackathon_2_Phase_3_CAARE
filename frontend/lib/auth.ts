// Better Auth configuration and authentication context
// Implements T013 and T014 from tasks.md
// SECURITY: Uses httpOnly cookies for token storage (XSS protection)

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from './types';
import { apiClient, isTokenExpired } from './api-client';

// ============================================================================
// Authentication Context Type
// ============================================================================

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// ============================================================================
// Create Context (T014)
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Authentication Provider Component (T014)
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load session on mount
   */
  useEffect(() => {
    loadSession();
  }, []);

  /**
   * Load session from API
   * SECURITY: Token is in httpOnly cookie, automatically sent with request
   */
  const loadSession = async () => {
    try {
      // Get session from backend (cookie sent automatically)
      const sessionData = await apiClient.getSession();

      // Check if token is expired
      if (isTokenExpired(sessionData.expires_at)) {
        setUser(null);
        setSession(null);
        setIsLoading(false);
        return;
      }

      // Set user and session
      setUser(sessionData.user);
      setSession({
        user: sessionData.user,
        token: 'stored_in_httponly_cookie',
        expires_at: sessionData.expires_at,
      });
    } catch (error) {
      // Session invalid or expired (cookie cleared by backend)
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in user
   * SECURITY: Token is set in httpOnly cookie by backend
   */
  const signIn = async (email: string, password: string) => {
    console.log('AuthProvider: signIn called', { email });
    setIsLoading(true);
    try {
      console.log('AuthProvider: Calling apiClient.signIn...');
      const response = await apiClient.signIn({ email, password });
      console.log('AuthProvider: API response received', response);

      setUser(response.user);
      setSession({
        user: response.user,
        token: 'stored_in_httponly_cookie',
        expires_at: response.expires_at,
      });
      console.log('AuthProvider: User and session set successfully');
    } catch (error) {
      console.error('AuthProvider: signIn error:', error);
      setUser(null);
      setSession(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign up new user
   * SECURITY: Token is set in httpOnly cookie by backend
   */
  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.signUp({ email, password, confirmPassword: password });

      setUser(response.user);
      setSession({
        user: response.user,
        token: 'stored_in_httponly_cookie',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours default
      });
    } catch (error) {
      setUser(null);
      setSession(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign out user
   * SECURITY: Backend clears the httpOnly cookie
   */
  const signOut = async () => {
    setIsLoading(true);
    try {
      await apiClient.signOut();
    } catch (error) {
      // Continue with signout even if API call fails
      console.error('Signout error:', error);
    } finally {
      setUser(null);
      setSession(null);
      setIsLoading(false);
    }
  };

  /**
   * Refresh session (check if still valid)
   */
  const refreshSession = async () => {
    await loadSession();
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user && !!session,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return React.createElement(
    AuthContext.Provider,
    { value: value },
    children
  );
}

// ============================================================================
// useAuth Hook (will be re-exported from hooks/useAuth.ts)
// ============================================================================

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}

// ============================================================================
// Better Auth Configuration (T013)
// ============================================================================

/**
 * Better Auth configuration
 * SECURITY: Secret must be set in environment variable (server-side only)
 */
export const authConfig = {
  // SECURITY: Secret key for JWT signing (from environment variable)
  // CRITICAL: This should only be accessed server-side
  // Removed hardcoded fallback for security
  secret: process.env.AUTH_SECRET,

  // Session configuration
  session: {
    // Session expires after 24 hours
    expiresIn: 24 * 60 * 60 * 1000, // 24 hours in milliseconds

    // Update session activity on each request
    updateAge: 60 * 60 * 1000, // 1 hour in milliseconds
  },

  // JWT configuration
  jwt: {
    // Algorithm for JWT signing
    algorithm: 'HS256' as const,

    // Token expiration
    expiresIn: '24h',
  },

  // Cookie configuration (for production)
  cookies: {
    // Use secure cookies in production
    secure: process.env.NODE_ENV === 'production',

    // HttpOnly cookies to prevent XSS
    httpOnly: true,

    // SameSite policy for CSRF protection
    sameSite: 'lax' as const,
  },
};

/**
 * Check if user is authenticated (helper function)
 * SECURITY: Cannot check token directly (it's in httpOnly cookie)
 * Must call API to verify session
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    await apiClient.getSession();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get current user from session (helper function)
 * SECURITY: Token is in httpOnly cookie, automatically sent with request
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await apiClient.getSession();
    return session.user;
  } catch (error) {
    return null;
  }
}
