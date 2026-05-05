// Global Error Boundary component
// Implements T098 from tasks.md

'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Global error boundary to catch unhandled errors
 * Prevents application crashes and provides user-friendly error UI
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // In production, you would send this to an error monitoring service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Optionally reload the page
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="glass-strong w-full max-w-md animate-slideUp p-8 text-center">
            {/* Error icon */}
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full border border-rose-400/30 bg-rose-500/15 text-rose-200 shadow-[0_0_30px_-6px_rgba(244,63,94,0.5)]">
              <svg
                className="h-8 w-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 9v4m0 4h.01" />
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>

            <h1 className="mb-2 text-2xl font-semibold text-white">
              Something went wrong
            </h1>
            <p className="mb-6 text-sm text-slate-300/80">
              We&apos;re sorry, but something unexpected happened. Please try
              again.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 rounded-xl border border-white/10 bg-black/30 p-4 text-left">
                <p className="break-words font-mono text-xs text-rose-300">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button variant="primary" onClick={this.handleReset} fullWidth>
                Return home
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.location.reload()}
                fullWidth
              >
                Reload page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
