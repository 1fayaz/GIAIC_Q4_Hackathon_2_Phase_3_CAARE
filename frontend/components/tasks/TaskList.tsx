// TaskList component
// Implements T048, T053, T056 from tasks.md

'use client';

import React from 'react';
import { Task, TaskFormData } from '@/lib/types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onUpdate: (id: string, data: Partial<TaskFormData> & { completed?: boolean }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

/**
 * TaskList component displays a list of tasks
 * T053: Implement empty state message when no tasks exist
 * T056: Implement responsive layout for task list
 */
export function TaskList({ tasks, isLoading, onUpdate, onDelete }: TaskListProps) {
  // T053: Empty state when no tasks exist
  if (!isLoading && tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new task.
        </p>
      </div>
    );
  }

  // T056: Responsive layout for task list
  // Mobile (320px): Single column with full width
  // Tablet (768px): Single column with padding
  // Desktop (1024px+): Single column with max width
  return (
    <div className="space-y-4">
      {/* Task count */}
      <div className="text-sm text-gray-600">
        {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
      </div>

      {/* Task list - responsive grid */}
      <div className="grid grid-cols-1 gap-4">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
