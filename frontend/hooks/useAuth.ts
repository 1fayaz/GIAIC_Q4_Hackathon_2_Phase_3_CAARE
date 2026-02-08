// useAuth custom hook for authentication state
// Implements T016 from tasks.md

'use client';

import { useAuthContext } from '@/lib/auth';

/**
 * Custom hook to access authentication state and actions
 * Provides a clean interface for components to interact with auth
 */
export function useAuth() {
  const context = useAuthContext();

  return {
    // State
    user: context.user,
    session: context.session,
    isLoading: context.isLoading,
    isAuthenticated: context.isAuthenticated,

    // Actions
    signIn: context.signIn,
    signUp: context.signUp,
    signOut: context.signOut,
    refreshSession: context.refreshSession,
  };
}
