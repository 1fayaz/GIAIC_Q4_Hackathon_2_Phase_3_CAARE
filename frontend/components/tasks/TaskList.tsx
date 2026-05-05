// TaskList - empty state, skeletons, and renders TaskItem rows.

'use client';

import React from 'react';
import { Task, TaskFormData } from '@/lib/types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  /** True when filters changed but we already have tasks rendered. */
  isFetching?: boolean;
  /** Used by edit form to power tag autocomplete. */
  tagSuggestions?: string[];
  /** Whether any filters are active (changes the empty-state copy). */
  hasActiveFilters?: boolean;
  onUpdate: (
    id: string,
    data: Partial<TaskFormData> & { completed?: boolean }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClearFilters?: () => void;
}

export function TaskList({
  tasks,
  isLoading,
  isFetching,
  tagSuggestions,
  hasActiveFilters,
  onUpdate,
  onDelete,
  onClearFilters,
}: TaskListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="glass animate-pulse p-5"
            aria-hidden="true"
          >
            <div className="flex gap-4">
              <div className="h-6 w-6 rounded-md skeleton" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-1/2 rounded skeleton" />
                <div className="h-3 w-3/4 rounded skeleton" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 rounded-full skeleton" />
                  <div className="h-5 w-20 rounded-full skeleton" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="glass animate-fadeIn flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/15 bg-white/5 shadow-glass">
          <span className="text-3xl" aria-hidden="true">
            ✨
          </span>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white">
          {hasActiveFilters ? 'No tasks match your filters' : 'Your task list is empty'}
        </h3>
        <p className="mt-2 max-w-sm text-sm text-slate-300/80">
          {hasActiveFilters
            ? 'Try clearing the search or filter to see more.'
            : 'Capture your next move. Press “New Task” to add one.'}
        </p>

        {hasActiveFilters && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="glass-btn mt-5 px-4 py-2 text-xs"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {isFetching && (
        <div
          className="pointer-events-none absolute -top-1 right-0 flex items-center gap-2 text-[11px] text-slate-300/80"
          aria-live="polite"
        >
          <span className="h-1.5 w-1.5 animate-spinSlow rounded-full bg-brand-400" />
          Updating...
        </div>
      )}
      <div className="grid grid-cols-1 gap-4">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            tagSuggestions={tagSuggestions}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
