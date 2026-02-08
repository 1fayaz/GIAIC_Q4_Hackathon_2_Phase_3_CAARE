// useTasks custom hook for task data fetching
// Implements T017 from tasks.md

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task, TaskFormData, ApiError } from '@/lib/types';
import { apiClient } from '@/lib/api-client';

interface UseTasksReturn {
  // State
  tasks: Task[];
  isLoading: boolean;
  error: string | null;

  // Actions
  getTasks: () => Promise<void>;
  createTask: (data: TaskFormData) => Promise<Task>;
  updateTask: (id: string, data: Partial<TaskFormData> & { completed?: boolean }) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
}

/**
 * Custom hook to manage task data fetching and mutations
 * Provides CRUD operations for tasks with loading and error states
 */
export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all tasks for the authenticated user
   */
  const getTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedTasks = await apiClient.getTasks();
      setTasks(fetchedTasks);
    } catch (err) {
      // Suppress 401 errors - they're handled by automatic redirect to /signin
      if (err instanceof ApiError && err.status === 401) {
        // Don't log or set error state - user is being redirected
        return;
      }

      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch tasks';
      setError(errorMessage);
      console.error('Error fetching tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new task
   */
  const createTask = useCallback(async (data: TaskFormData): Promise<Task> => {
    setIsLoading(true);
    setError(null);

    try {
      const newTask = await apiClient.createTask(data);

      // Optimistically update local state
      setTasks((prevTasks) => [...prevTasks, newTask]);

      return newTask;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to create task';
      setError(errorMessage);
      console.error('Error creating task:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update an existing task
   */
  const updateTask = useCallback(
    async (id: string, data: Partial<TaskFormData> & { completed?: boolean }): Promise<Task> => {
      setIsLoading(true);
      setError(null);

      try {
        const updatedTask = await apiClient.updateTask(id, data);

        // Optimistically update local state
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === id ? updatedTask : task))
        );

        return updatedTask;
      } catch (err) {
        const errorMessage = err instanceof ApiError ? err.message : 'Failed to update task';
        setError(errorMessage);
        console.error('Error updating task:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Delete a task
   */
  const deleteTask = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.deleteTask(id);

      // Optimistically update local state
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to delete task';
      setError(errorMessage);
      console.error('Error deleting task:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh tasks (alias for getTasks)
   */
  const refreshTasks = useCallback(async () => {
    await getTasks();
  }, [getTasks]);

  /**
   * Load tasks on mount
   */
  useEffect(() => {
    getTasks();
  }, [getTasks]);

  return {
    tasks,
    isLoading,
    error,
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks,
  };
}
