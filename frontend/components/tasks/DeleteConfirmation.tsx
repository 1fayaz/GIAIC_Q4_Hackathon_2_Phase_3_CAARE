// DeleteConfirmation modal component
// Implements T083, T087, T088, T090 from tasks.md

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

interface DeleteConfirmationProps {
  taskTitle: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

/**
 * DeleteConfirmation modal component for confirming task deletion
 * T087: Connect confirm button to deleteTask API
 * T088: Implement cancel button to close confirmation without deleting
 * T090: Display success message after deletion
 */
export function DeleteConfirmation({
  taskTitle,
  onConfirm,
  onCancel,
}: DeleteConfirmationProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  /**
   * T087: Handle delete confirmation
   */
  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm();

      // T090: Display success message
      setShowSuccess(true);

      // Auto-close after showing success
      setTimeout(() => {
        onCancel();
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete task. Please try again.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* T090: Success message */}
        {showSuccess ? (
          <div className="text-center py-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900">Task deleted successfully!</p>
          </div>
        ) : (
          <>
            {/* Icon */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>

            {/* Title */}
            <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
              Delete Task
            </h3>

            {/* Message */}
            <p className="text-sm text-gray-500 mb-4 text-center">
              Are you sure you want to delete "{taskTitle}"? This action cannot be undone.
            </p>

            {/* Error message */}
            {error && (
              <div className="mb-4">
                <ErrorMessage message={error} variant="error" />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {/* T088: Cancel button */}
              <Button
                variant="secondary"
                fullWidth
                onClick={onCancel}
                disabled={isDeleting}
              >
                Cancel
              </Button>

              {/* T087: Confirm delete button */}
              <Button
                variant="danger"
                fullWidth
                onClick={handleConfirm}
                isLoading={isDeleting}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
