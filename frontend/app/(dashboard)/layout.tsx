// Dashboard route group layout with navigation and sign out
// Implements T041, T042, T043, T045 from tasks.md

'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  /**
   * T043: Implement signout handler that calls Better Auth signout
   * T045: Implement redirect to /signin after signout
   */
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      // T043: Call Better Auth signout
      await signOut();

      // T045: Redirect to /signin after signout
      router.push('/signin');
    } catch (error) {
      console.error('Signout error:', error);
      // Still redirect even if API call fails
      router.push('/signin');
    } finally {
      setIsSigningOut(false);
    }
  };

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* T041: Navigation header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and title */}
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-gray-900">Todo App</h1>

              {/* Navigation Links */}
              <div className="hidden sm:flex items-center gap-1">
                <Link
                  href="/tasks"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/tasks'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Tasks
                  </span>
                </Link>

                <Link
                  href="/chat"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname?.startsWith('/chat')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    AI Chat
                  </span>
                </Link>
              </div>
            </div>

            {/* User info and sign out button */}
            <div className="flex items-center gap-4">
              {user && (
                <span className="text-sm text-gray-700 hidden sm:block">
                  {user.email}
                </span>
              )}

              {/* T042: Sign out button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                isLoading={isSigningOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? 'Signing out...' : 'Sign out'}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="sm:hidden pb-3 flex gap-2">
            <Link
              href="/tasks"
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium text-center transition-colors ${
                pathname === '/tasks'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Tasks
            </Link>

            <Link
              href="/chat"
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium text-center transition-colors ${
                pathname?.startsWith('/chat')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              AI Chat
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
