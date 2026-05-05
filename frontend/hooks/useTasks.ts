// useTasks custom hook for task data fetching.
// Now supports server-side filters/search/sort with debounced search.

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Task, TaskFormData, TaskFilters, ApiError } from '@/lib/types';
import { apiClient } from '@/lib/api-client';

interface UseTasksReturn {
  // State
  tasks: Task[];
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;

  // Actions
  getTasks: () => Promise<void>;
  createTask: (data: TaskFormData) => Promise<Task>;
  updateTask: (
    id: string,
    data: Partial<TaskFormData> & { completed?: boolean }
  ) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
}

/**
 * Custom hook to manage task data fetching and mutations.
 * Pass `filters` to drive the GET /api/tasks query string.
 * Search input is debounced ~300ms so typing doesn't spam the API.
 */
export function useTasks(filters?: TaskFilters): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  // `isLoading` reflects the very first fetch. `isFetching` is true on every refetch.
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  // Debounce the search field so typing doesn't fire one request per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState(filters?.search ?? '');
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(filters?.search ?? '');
    }, 300);
    return () => clearTimeout(id);
  }, [filters?.search]);

  // The effective filter set: same as `filters` but with the debounced search.
  const effectiveFilters = useMemo<TaskFilters | undefined>(() => {
    if (!filters) return undefined;
    return { ...filters, search: debouncedSearch };
  }, [
    filters?.status,
    filters?.priority,
    filters?.tag,
    filters?.due_before,
    filters?.due_after,
    filters?.sort_by,
    filters?.order,
    debouncedSearch,
    // intentionally omit `filters` itself; we depend on its individual fields
    // so callers can pass a fresh object literal each render without triggering
    // an extra refetch.
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Fetch tasks for the authenticated user, optionally with filters.
   */
  const getTasks = useCallback(async () => {
    setIsFetching(true);
    setError(null);

    try {
      const fetched = await apiClient.getTasks(effectiveFilters);
      setTasks(fetched);
    } catch (err) {
      // Suppress 401 errors - they're handled by automatic redirect to /signin
      if (err instanceof ApiError && err.status === 401) {
        return;
      }
      const errorMessage =
        err instanceof ApiError ? err.message : 'Failed to fetch tasks';
      setError(errorMessage);
      console.error('Error fetching tasks:', err);
    } finally {
      setIsFetching(false);
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
        setIsLoading(false);
      }
    }
  }, [effectiveFilters]);

  /**
   * Create a new task. Optimistically appends to local state.
   */
  const createTask = useCallback(
    async (data: TaskFormData): Promise<Task> => {
      setError(null);
      try {
        const newTask = await apiClient.createTask(data);
        setTasks((prev) => [newTask, ...prev]);
        return newTask;
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Failed to create task';
        setError(msg);
        throw err;
      }
    },
    []
  );

  /**
   * Update an existing task. Optimistic local state update on success.
   */
  const updateTask = useCallback(
    async (
      id: string,
      data: Partial<TaskFormData> & { completed?: boolean }
    ): Promise<Task> => {
      setError(null);
      try {
        const updated = await apiClient.updateTask(id, data);
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
        return updated;
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Failed to update task';
        setError(msg);
        throw err;
      }
    },
    []
  );

  /**
   * Delete a task. Optimistic local state update on success.
   */
  const deleteTask = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      await apiClient.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete task';
      setError(msg);
      throw err;
    }
  }, []);

  const refreshTasks = useCallback(async () => {
    await getTasks();
  }, [getTasks]);

  // Refetch whenever the effective filters change.
  useEffect(() => {
    getTasks();
  }, [getTasks]);

  return {
    tasks,
    isLoading,
    isFetching,
    error,
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks,
  };
}
