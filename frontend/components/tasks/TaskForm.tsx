// TaskForm component with React Hook Form
// Implements T058, T060, T061, T063, T064, T065, T067, T068, T069 from tasks.md

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { TaskFormData } from '@/lib/types';

interface TaskFormProps {
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: TaskFormData;
  isEditMode?: boolean;
}

/**
 * TaskForm component for creating and editing tasks
 * T060: Implement title field validation (required, 1-200 chars)
 * T061: Implement description field (optional, 0-1000 chars)
 * T063: Connect TaskForm submit to createTask API
 * T064: Display validation errors for empty title
 * T065: Add loading state during task creation
 * T067: Display success message after task creation
 * T068: Display error message if creation fails
 * T069: Clear form after successful task creation
 */
export function TaskForm({
  onSubmit,
  onCancel,
  initialData,
  isEditMode = false,
}: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    defaultValues: initialData || {
      title: '',
      description: '',
    },
    mode: 'onBlur',
  });

  /**
   * Handle form submission
   * T063: Connect to createTask API
   * T069: Clear form after successful creation
   */
  const handleFormSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true);
    setApiError(null);
    setSuccessMessage(null);

    try {
      // T063: Call the onSubmit handler (createTask or updateTask)
      await onSubmit(data);

      // T067: Display success message
      setSuccessMessage(
        isEditMode ? 'Task updated successfully!' : 'Task created successfully!'
      );

      // T069: Clear form after successful creation (only for create mode)
      if (!isEditMode) {
        reset();
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
        if (onCancel) onCancel();
      }, 2000);
    } catch (error) {
      // T068: Display error message if creation fails
      setApiError(
        error instanceof Error
          ? error.message
          : 'Failed to save task. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* T067: Success message */}
      {successMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      {/* T068: Error message */}
      {apiError && (
        <ErrorMessage
          message={apiError}
          variant="error"
          onRetry={() => setApiError(null)}
        />
      )}

      {/* T060, T064: Title field with validation */}
      <Input
        label="Task Title"
        type="text"
        placeholder="Enter task title"
        required
        fullWidth
        error={errors.title?.message}
        {...register('title', {
          required: 'Title is required',
          minLength: {
            value: 1,
            message: 'Title must be at least 1 character',
          },
          maxLength: {
            value: 200,
            message: 'Title must not exceed 200 characters',
          },
          validate: (value) => {
            const trimmed = value.trim();
            if (trimmed.length === 0) {
              return 'Title cannot be empty or only whitespace';
            }
            return true;
          },
        })}
      />

      {/* T061: Description field (optional, 0-1000 chars) */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description (optional)
        </label>
        <textarea
          id="description"
          rows={4}
          placeholder="Enter task description"
          className={`
            block w-full px-3 py-2 border rounded-lg text-gray-900
            placeholder-gray-400 focus:outline-none focus:ring-2
            focus:ring-offset-0 transition-colors
            ${
              errors.description
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }
          `}
          {...register('description', {
            maxLength: {
              value: 1000,
              message: 'Description must not exceed 1000 characters',
            },
          })}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Form actions */}
      <div className="flex gap-3 pt-2">
        {/* T065: Loading state during task creation */}
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? isEditMode
              ? 'Updating...'
              : 'Creating...'
            : isEditMode
            ? 'Update Task'
            : 'Create Task'}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
