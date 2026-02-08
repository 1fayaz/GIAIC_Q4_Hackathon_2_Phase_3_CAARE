// Tasks page - Complete CRUD operations
// Implements T047, T051, T052, T057, T059, T066, T079, T089 from tasks.md

'use client';

import React, { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskForm } from '@/components/tasks/TaskForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { TaskFormData } from '@/lib/types';

/**
 * Tasks page displays all tasks for the authenticated user with full CRUD operations
 * T051: Connect tasks page to useTasks hook to fetch data
 * T052: Implement loading state while fetching tasks
 * T057: Verify only authenticated user's tasks are displayed
 * T059: Add create task button
 * T066: Update task list after successful creation
 * T079: Update task list after successful edit
 * T089: Remove task from list after successful deletion
 */
export default function TasksPage() {
  // T051: Connect to useTasks hook
  const { tasks, isLoading, error, createTask, updateTask, deleteTask, refreshTasks } = useTasks();

  // T059: State to show/hide create task form
  const [showCreateForm, setShowCreateForm] = useState(false);

  /**
   * Handle task creation
   * T066: Task list updates automatically via useTasks hook
   */
  const handleCreateTask = async (data: TaskFormData) => {
    await createTask(data);
    setShowCreateForm(false);
  };

  /**
   * Handle task update
   * T079: Task list updates automatically via useTasks hook
   */
  const handleUpdateTask = async (
    id: string,
    data: Partial<TaskFormData> & { completed?: boolean }
  ) => {
    await updateTask(id, data);
  };

  /**
   * Handle task deletion
   * T089: Task list updates automatically via useTasks hook
   */
  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header with create button */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your personal task list
          </p>
        </div>

        {/* T059: Create task button */}
        {!showCreateForm && (
          <Button
            variant="primary"
            onClick={() => setShowCreateForm(true)}
            disabled={isLoading}
          >
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 4v16m8-8H4"></path>
            </svg>
            Create Task
          </Button>
        )}
      </div>

      {/* Create task form */}
      {showCreateForm && (
        <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Create New Task
          </h2>
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* T052: Loading state */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading tasks..." />
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <ErrorMessage
          message={error}
          variant="error"
          onRetry={refreshTasks}
        />
      )}

      {/* T051, T057, T066, T079, T089: Task list with full CRUD operations */}
      {!isLoading && !error && (
        <TaskList
          tasks={tasks}
          isLoading={isLoading}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}
