// Reusable Input component (glass).

import React, { InputHTMLAttributes, forwardRef, useId, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  /** Optional left-aligned icon (rendered inside the input) */
  leftIcon?: ReactNode;
  /** Optional right-aligned icon */
  rightIcon?: ReactNode;
}

/**
 * Glass Input with optional label, error, helper text, and inline icons.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className = '',
      id,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    const errorClasses = error
      ? 'border-rose-400/60 focus:border-rose-400 focus:ring-rose-400/40'
      : '';

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-300/80"
          >
            {label}
            {required && <span className="ml-1 text-rose-400">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`glass-input ${leftIcon ? 'pl-10' : ''} ${
              rightIcon ? 'pr-10' : ''
            } ${errorClasses} ${className}`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            required={required}
            {...props}
          />
          {rightIcon && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-xs text-rose-300"
            role="alert"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-xs text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
