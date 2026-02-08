/**
 * ErrorMessage Component
 * Spec 5: ChatKit Frontend - Phase 5 (TASK-057)
 *
 * Displays user-friendly error messages with optional retry action
 * Provides clear guidance on what went wrong and how to proceed
 */

'use client';

import { ChatErrorCode } from '@/lib/types';

interface ErrorMessageProps {
  message: string;
  code?: ChatErrorCode;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export default function ErrorMessage({
  message,
  code,
  onRetry,
  onDismiss,
}: ErrorMessageProps) {
  // Determine icon and styling based on error code
  const isAuthError = code === ChatErrorCode.UNAUTHORIZED;
  const isNetworkError = code === ChatErrorCode.NETWORK_ERROR;
  const canRetry = onRetry && !isAuthError;

  return (
    <div
      className="px-4 py-3 bg-red-50 border-t border-red-200 flex items-start justify-between"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start space-x-3 flex-1">
        {/* Error Icon */}
        <svg
          className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        {/* Error Message */}
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">{message}</p>

          {/* Additional guidance based on error type */}
          {isNetworkError && (
            <p className="text-xs text-red-700 mt-1">
              Check your internet connection and try again.
            </p>
          )}
          {isAuthError && (
            <p className="text-xs text-red-700 mt-1">
              You will be redirected to the sign-in page.
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 ml-4">
        {canRetry && (
          <button
            onClick={onRetry}
            className="text-sm font-medium text-red-800 hover:text-red-900 underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
            aria-label="Retry action"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
            aria-label="Dismiss error"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
