// SignUpForm component with React Hook Form
// Implements T028, T031, T032, T034, T036, T038, T039 from tasks.md

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ApiError } from '@/lib/types';

interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export function SignUpForm() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>({
    mode: 'onBlur',
  });

  // Watch password field for confirmation validation
  const password = watch('password');

  /**
   * Handle form submission
   * T034: Connect to Better Auth signup API
   * T038: Redirect to /tasks after successful signup
   */
  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    setApiError(null);

    try {
      await signUp(data.email, data.password);

      // T038: Redirect to /tasks after successful signup
      router.push('/tasks');
    } catch (error) {
      // T036: Display error message for signup failures
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* T036: Display API error message */}
      {apiError && (
        <ErrorMessage
          message={apiError}
          variant="error"
          onRetry={() => setApiError(null)}
        />
      )}

      {/* Email field with validation (T031) */}
      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        required
        fullWidth
        error={errors.email?.message}
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email address',
          },
        })}
      />

      {/* Password field with validation (T032) */}
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        fullWidth
        error={errors.password?.message}
        helperText="Must be at least 12 characters with letter, number, and special character"
        {...register('password', {
          required: 'Password is required',
          minLength: {
            value: 12,
            message: 'Password must be at least 12 characters',
          },
          pattern: {
            value: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{12,}$/,
            message: 'Password must contain at least one letter, one number, and one special character (@$!%*#?&)',
          },
        })}
      />

      {/* Confirm password field with match validation (T032) */}
      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        required
        fullWidth
        error={errors.confirmPassword?.message}
        {...register('confirmPassword', {
          required: 'Please confirm your password',
          validate: (value) =>
            value === password || 'Passwords do not match',
        })}
      />

      {/* T039: Loading state during authentication */}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        isLoading={isLoading}
        disabled={isLoading}
      >
        {isLoading ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
}
