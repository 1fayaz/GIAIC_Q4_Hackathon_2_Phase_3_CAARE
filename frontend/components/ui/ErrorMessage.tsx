// ErrorMessage component (glass, dark theme).

import React from 'react';

interface ErrorMessageProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  variant?: 'error' | 'warning' | 'info';
}

/**
 * Reusable ErrorMessage component for displaying alerts.
 */
export function ErrorMessage({
  message,
  title,
  onRetry,
  variant = 'error',
}: ErrorMessageProps) {
  const variants = {
    error: {
      container: 'border-rose-400/30 bg-rose-500/10 text-rose-100',
      icon: 'text-rose-300',
      title: 'text-rose-100',
      btn: 'text-rose-200 hover:text-rose-100',
    },
    warning: {
      container: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
      icon: 'text-amber-300',
      title: 'text-amber-100',
      btn: 'text-amber-200 hover:text-amber-100',
    },
    info: {
      container: 'border-sky-400/30 bg-sky-500/10 text-sky-100',
      icon: 'text-sky-300',
      title: 'text-sky-100',
      btn: 'text-sky-200 hover:text-sky-100',
    },
  } as const;

  const styles = variants[variant];

  const Icon = () => {
    if (variant === 'warning') {
      return (
        <svg
          className={`h-5 w-5 ${styles.icon}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    if (variant === 'info') {
      return (
        <svg
          className={`h-5 w-5 ${styles.icon}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return (
      <svg
        className={`h-5 w-5 ${styles.icon}`}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  return (
    <div
      className={`glass animate-fadeIn rounded-2xl border p-4 ${styles.container}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Icon />
        </div>
        <div className="flex-1">
          {title && (
            <h3 className={`text-sm font-semibold ${styles.title}`}>{title}</h3>
          )}
          <p className={`text-sm ${title ? 'mt-1' : ''}`}>{message}</p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className={`mt-2 text-xs font-semibold underline-offset-4 transition-colors hover:underline focus:outline-none ${styles.btn}`}
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
