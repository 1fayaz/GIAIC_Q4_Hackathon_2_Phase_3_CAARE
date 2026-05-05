// SignUpForm component with React Hook Form.

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
  } = useForm<SignUpFormData>({ mode: 'onBlur' });

  const password = watch('password');

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    setApiError(null);

    try {
      await signUp(data.email, data.password);
      router.push('/tasks');
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const mailIcon = (
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
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );

  const lockIcon = (
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
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {apiError && (
        <ErrorMessage
          message={apiError}
          variant="error"
          onRetry={() => setApiError(null)}
        />
      )}

      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        required
        fullWidth
        placeholder="you@example.com"
        leftIcon={mailIcon}
        error={errors.email?.message}
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email address',
          },
        })}
      />

      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        fullWidth
        placeholder="At least 12 characters"
        leftIcon={lockIcon}
        error={errors.password?.message}
        helperText="Must be 12+ chars with letters, numbers, and a symbol (@$!%*#?&)"
        {...register('password', {
          required: 'Password is required',
          minLength: {
            value: 12,
            message: 'Password must be at least 12 characters',
          },
          pattern: {
            value:
              /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{12,}$/,
            message:
              'Must contain a letter, a number, and a special character (@$!%*#?&)',
          },
        })}
      />

      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        required
        fullWidth
        placeholder="Repeat your password"
        leftIcon={lockIcon}
        error={errors.confirmPassword?.message}
        {...register('confirmPassword', {
          required: 'Please confirm your password',
          validate: (value) => value === password || 'Passwords do not match',
        })}
      />

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
