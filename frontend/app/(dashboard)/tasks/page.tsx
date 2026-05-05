// Tasks page - the dashboard hero. Header, stats, toolbar, list, modal create.

'use client';

import React, { useMemo, useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TasksToolbar } from '@/components/tasks/TasksToolbar';
import { StatsCards } from '@/components/tasks/StatsCards';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { TaskFilters, TaskFormData } from '@/lib/types';
import { collectAllTags } from '@/lib/tags';

const DEFAULT_FILTERS: TaskFilters = {
  search: '',
  status: 'all',
  sort_by: 'created_at',
  order: 'desc',
};

function isFilterActive(filters: TaskFilters): boolean {
  if (filters.search && filters.search.trim()) return true;
  if (filters.status && filters.status !== 'all') return true;
  if (filters.priority) return true;
  if (filters.tag && filters.tag.trim()) return true;
  if (filters.due_before) return true;
  if (filters.due_after) return true;
  return false;
}

export default function TasksPage() {
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const {
    tasks,
    isLoading,
    isFetching,
    error,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks,
  } = useTasks(filters);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { push } = useToast();

  // We keep a separate, filter-free view of tasks for stats and the tag pool
  // would be ideal, but to avoid an extra request we use what we have.
  const tagSuggestions = useMemo(() => collectAllTags(tasks), [tasks]);

  const handleCreate = async (data: TaskFormData) => {
    try {
      await createTask(data);
      setIsCreateOpen(false);
      push({ message: 'Task created.', variant: 'success' });
    } catch (err) {
      push({
        message: err instanceof Error ? err.message : 'Failed to create task.',
        variant: 'error',
      });
      throw err;
    }
  };

  const handleUpdate = async (
    id: string,
    data: Partial<TaskFormData> & { completed?: boolean }
  ) => {
    try {
      await updateTask(id, data);
      if ('completed' in data) {
        push({
          message: data.completed ? 'Marked as done.' : 'Reopened.',
          variant: 'success',
          duration: 1800,
        });
      } else {
        push({ message: 'Task updated.', variant: 'success' });
      }
    } catch (err) {
      push({
        message: err instanceof Error ? err.message : 'Failed to update task.',
        variant: 'error',
      });
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      push({ message: 'Task deleted.', variant: 'success' });
    } catch (err) {
      push({
        message: err instanceof Error ? err.message : 'Failed to delete task.',
        variant: 'error',
      });
      throw err;
    }
  };

  const hasActive = isFilterActive(filters);
  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      {/* Hero header */}
      <div className="animate-fadeIn flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient sm:text-4xl">
            Your Tasks
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-300/80">
            Plan, prioritize, and ship. Search, filter and sort to focus on
            what matters next.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="glass-btn-primary self-start sm:self-auto"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Task
        </button>
      </div>

      {/* Stats */}
      <StatsCards tasks={tasks} />

      {/* Toolbar */}
      <TasksToolbar
        filters={filters}
        onChange={setFilters}
        onClear={clearFilters}
        tagSuggestions={tagSuggestions}
        hasActive={hasActive}
      />

      {/* Error */}
      {error && !isLoading && (
        <ErrorMessage
          message={error}
          variant="error"
          onRetry={refreshTasks}
        />
      )}

      {/* Task list */}
      {!error && (
        <TaskList
          tasks={tasks}
          isLoading={isLoading}
          isFetching={isFetching && !isLoading}
          tagSuggestions={tagSuggestions}
          hasActiveFilters={hasActive}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onClearFilters={clearFilters}
        />
      )}

      {/* Create modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create a new task"
        description="Capture the essentials. You can refine later."
        size="lg"
      >
        <TaskForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
          tagSuggestions={tagSuggestions}
        />
      </Modal>
    </div>
  );
}
