// SignInForm component with React Hook Form
// Implements T027, T029, T030, T033, T035, T037, T039 from tasks.md

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ApiError } from '@/lib/types';

interface SignInFormData {
  email: string;
  password: string;
}

export function SignInForm() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    mode: 'onBlur',
  });

  /**
   * Handle form submission
   * T033: Connect to Better Auth signin API
   * T037: Redirect to /tasks after successful signin
   */
  const onSubmit = async (data: SignInFormData) => {
    console.log('SignInForm: Form submitted', { email: data.email });
    setIsLoading(true);
    setApiError(null);

    try {
      console.log('SignInForm: Calling signIn...');
      await signIn(data.email, data.password);
      console.log('SignInForm: Sign in successful, redirecting...');

      // T037: Redirect to /tasks after successful signin
      router.push('/tasks');
    } catch (error) {
      console.error('SignInForm: Sign in error:', error);
      console.error('SignInForm: Error type:', typeof error);
      console.error('SignInForm: Error constructor:', error?.constructor?.name);
      console.error('SignInForm: Is ApiError?', error instanceof ApiError);

      // T035: Display error message for signin failures
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else if (error instanceof Error) {
        setApiError(`Error: ${error.message}`);
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* T035: Display API error message */}
      {apiError && (
        <ErrorMessage
          message={apiError}
          variant="error"
          onRetry={() => setApiError(null)}
        />
      )}

      {/* Email field with validation (T029) */}
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

      {/* Password field with validation (T030) */}
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        fullWidth
        error={errors.password?.message}
        {...register('password', {
          required: 'Password is required',
          minLength: {
            value: 8,
            message: 'Password must be at least 8 characters',
          },
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
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}
