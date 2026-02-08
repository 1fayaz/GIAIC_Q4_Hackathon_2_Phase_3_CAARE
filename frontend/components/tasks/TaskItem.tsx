// TaskItem component with task display, edit, completion toggle, and delete
// Implements T049, T054, T055, T070, T071, T072, T073, T077, T078, T080, T081, T082, T084, T085 from tasks.md

'use client';

import React, { useState } from 'react';
import { Task, TaskFormData } from '@/lib/types';
import { TaskForm } from './TaskForm';
import { DeleteConfirmation } from './DeleteConfirmation';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

interface TaskItemProps {
  task: Task;
  onUpdate: (id: string, data: Partial<TaskFormData> & { completed?: boolean }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

/**
 * TaskItem component displays a single task with edit, completion toggle, and delete
 * T054: Display task title, description, and completion status
 * T055: Add visual distinction for completed vs incomplete tasks
 * T070: Add edit button
 * T071: Add completion toggle checkbox
 * T072: Implement edit mode state
 * T073: Show TaskForm in edit mode when edit button clicked
 * T077: Implement toggle completion handler
 * T078: Call updateTask API with completed status on toggle
 * T080: Update task visual state after completion toggle
 * T081: Display error message if update fails
 * T082: Add loading state during task update
 * T084: Add delete button
 * T085: Implement delete button click handler to show confirmation
 */
export function TaskItem({ task, onUpdate, onDelete }: TaskItemProps) {
  // T072: Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isTogglingCompletion, setIsTogglingCompletion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // T085: Delete confirmation state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  /**
   * T077, T078: Handle completion toggle
   */
  const handleToggleCompletion = async () => {
    setIsTogglingCompletion(true);
    setError(null);

    try {
      // T078: Call updateTask API with completed status
      await onUpdate(task.id, { completed: !task.completed });
    } catch (err) {
      // T081: Display error message if update fails
      setError('Failed to update task status. Please try again.');
    } finally {
      setIsTogglingCompletion(false);
    }
  };

  /**
   * Handle task edit submission
   */
  const handleEditSubmit = async (data: TaskFormData) => {
    await onUpdate(task.id, data);
    setIsEditMode(false);
  };

  /**
   * T085: Handle delete confirmation
   */
  const handleDelete = async () => {
    await onDelete(task.id);
  };

  // T073: Show TaskForm in edit mode
  if (isEditMode) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Task</h3>
        <TaskForm
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditMode(false)}
          initialData={{
            title: task.title,
            description: task.description,
          }}
          isEditMode={true}
        />
      </div>
    );
  }

  // T055, T080: Visual distinction for completed vs incomplete tasks
  return (
    <>
      <div
        className={`
          bg-white rounded-lg border p-4 shadow-sm transition-all
          ${task.completed ? 'border-green-200 bg-green-50' : 'border-gray-200'}
          hover:shadow-md
        `}
      >
        {/* T081: Error message */}
        {error && (
          <div className="mb-3">
            <ErrorMessage
              message={error}
              variant="error"
              onRetry={() => setError(null)}
            />
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* T071: Completion toggle checkbox */}
          <button
            onClick={handleToggleCompletion}
            disabled={isTogglingCompletion}
            className="flex-shrink-0 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {/* T082: Loading state during toggle */}
            {isTogglingCompletion ? (
              <div className="h-5 w-5 rounded-full border-2 border-gray-300 animate-pulse"></div>
            ) : task.completed ? (
              <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                <svg
                  className="h-3 w-3 text-white"
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
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-gray-300 hover:border-gray-400"></div>
            )}
          </button>

          {/* Task content */}
          <div className="flex-1 min-w-0">
            {/* T054: Display task title */}
            <h3
              className={`
                text-base font-medium mb-1
                ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}
              `}
            >
              {task.title}
            </h3>

            {/* T054: Display task description */}
            {task.description && (
              <p
                className={`
                  text-sm mb-2
                  ${task.completed ? 'text-gray-400' : 'text-gray-600'}
                `}
              >
                {task.description}
              </p>
            )}

            {/* Task metadata */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>
                Created: {new Date(task.created_at).toLocaleDateString()}
              </span>
              {task.updated_at !== task.created_at && (
                <span>
                  Updated: {new Date(task.updated_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {/* T054: Completion status badge */}
            <span
              className={`
                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${
                  task.completed
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }
              `}
            >
              {task.completed ? 'Completed' : 'Pending'}
            </span>

            {/* T070: Edit button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditMode(true)}
              disabled={isTogglingCompletion}
              aria-label="Edit task"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </Button>

            {/* T084: Delete button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirmation(true)}
              disabled={isTogglingCompletion}
              aria-label="Delete task"
            >
              <svg
                className="h-4 w-4 text-red-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* T085: Delete confirmation modal */}
      {showDeleteConfirmation && (
        <DeleteConfirmation
          taskTitle={task.title}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirmation(false)}
        />
      )}
    </>
  );
}
