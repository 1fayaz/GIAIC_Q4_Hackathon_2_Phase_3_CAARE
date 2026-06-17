// Dashboard route group layout - sticky glass nav with brand, user pill, sign out.

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ToastProvider } from '@/components/ui/Toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // CLIENT-SIDE ROUTE PROTECTION:
  // The auth_token httpOnly cookie is scoped to the backend domain, so edge
  // middleware on the frontend domain cannot read it. Once the session has
  // finished loading (authLoading === false) and there is no authenticated
  // user, redirect to /signin here instead.
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/signin');
    }
  }, [authLoading, user, router]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push('/signin');
    } catch (error) {
      console.error('Signout error:', error);
      router.push('/signin');
    } finally {
      setIsSigningOut(false);
    }
  };

  // Show the spinner while the session is loading OR while there is no user
  // (the effect above is about to redirect to /signin) so protected content
  // never flashes for an unauthenticated visitor.
  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass animate-fadeIn px-10 py-8 text-center">
          <h1 className="mb-4 text-2xl font-semibold text-gradient">
            FAN Tasks
          </h1>
          <LoadingSpinner size="md" text="Loading..." />
        </div>
      </div>
    );
  }

  // Initials for the avatar
  const initials = user?.email
    ? user.email
        .split('@')[0]
        .split(/[._-]/)
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  return (
    <ToastProvider>
      <div className="min-h-screen">
        {/* Sticky glass nav */}
        <nav className="liquid-header sticky top-0 z-40">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/5 shadow-glass">
                <svg
                  className="h-5 w-5 text-brand-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 11l3 3 8-8" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold leading-tight text-gradient">
                  FAN Tasks
                </p>
                <p className="hidden text-[10px] uppercase tracking-[0.18em] text-slate-400 sm:block">
                  workspace
                </p>
              </div>
            </div>

            {/* User pill + sign out */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user && (
                <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3 sm:flex">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[linear-gradient(135deg,#6366f1,#d946ef)] text-xs font-semibold text-white">
                    {initials}
                  </span>
                  <span className="max-w-[180px] truncate text-xs text-slate-200">
                    {user.email}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                aria-label="Sign out"
                className="glass-btn px-3 py-2 text-xs"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
                <span className="hidden sm:inline">
                  {isSigningOut ? 'Signing out...' : 'Sign out'}
                </span>
              </button>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
