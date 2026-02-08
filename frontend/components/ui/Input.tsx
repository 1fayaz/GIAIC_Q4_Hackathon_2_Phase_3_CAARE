// Reusable Input component with validation styles
// Implements T019 from tasks.md

import React, { InputHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

/**
 * Reusable Input component with label, error, and helper text support
 * Follows accessibility best practices with proper ARIA attributes
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      className = '',
      id,
      required,
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided (stable between server and client)
    const generatedId = useId();
    const inputId = id || generatedId;

    // Base input styles
    const baseStyles =
      'block px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed';

    // Error state styles
    const errorStyles = error
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';

    // Width styles
    const widthStyles = fullWidth ? 'w-full' : '';

    // Combine all styles
    const combinedStyles = `${baseStyles} ${errorStyles} ${widthStyles} ${className}`;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={inputId}
          className={combinedStyles}
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

        {/* Error message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Helper text */}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
