// DeleteConfirmation - glass modal with red accent and scale-in animation.

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Modal } from '@/components/ui/Modal';

interface DeleteConfirmationProps {
  taskTitle: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function DeleteConfirmation({
  taskTitle,
  onConfirm,
  onCancel,
}: DeleteConfirmationProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
      onCancel();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete task. Please try again.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onCancel}
      ariaLabel="Confirm task deletion"
      size="sm"
      hideClose
    >
      <div className="flex flex-col items-center text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full border border-rose-400/30 bg-rose-500/15 text-rose-200 shadow-[0_0_30px_-4px_rgba(244,63,94,0.55)]">
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 6h18" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2" />
          </svg>
        </div>

        <h3 className="mt-4 text-lg font-semibold text-white">Delete task?</h3>
        <p className="mt-2 text-sm text-slate-300/85">
          You&apos;re about to delete{' '}
          <span className="font-medium text-white">&ldquo;{taskTitle}&rdquo;</span>.
          This action cannot be undone.
        </p>

        {error && (
          <div className="mt-4 w-full">
            <ErrorMessage message={error} variant="error" />
          </div>
        )}

        <div className="mt-6 flex w-full flex-col-reverse gap-3 sm:flex-row">
          <Button
            variant="secondary"
            fullWidth
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
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
      </div>
    </Modal>
  );
}
