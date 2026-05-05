// Reusable Button component - glass / gradient variants on a dark theme.

import React, { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

/**
 * Reusable Button component with multiple variants and sizes.
 * Uses the glass design language defined in globals.css.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:
      'border border-white/20 text-white shadow-[0_10px_40px_-10px_rgba(139,92,246,0.65)] bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)] hover:brightness-110 hover:shadow-[0_12px_50px_-10px_rgba(217,70,239,0.7)] active:scale-[0.98]',
    secondary:
      'border border-white/15 bg-white/[0.08] text-slate-100 backdrop-blur-md shadow-glass hover:bg-white/[0.14] hover:border-white/25 active:scale-[0.98]',
    danger:
      'border border-rose-400/30 bg-rose-500/15 text-rose-100 shadow-[0_8px_30px_-10px_rgba(244,63,94,0.6)] backdrop-blur-md hover:bg-rose-500/25 hover:border-rose-400/50 active:scale-[0.98]',
    ghost:
      'bg-transparent text-slate-200 hover:bg-white/[0.08] hover:text-white',
  };

  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'px-3 py-2 text-sm min-h-[40px]',
    md: 'px-4 py-2.5 text-sm min-h-[44px]',
    lg: 'px-6 py-3 text-base min-h-[48px]',
  };

  const width = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Working...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
