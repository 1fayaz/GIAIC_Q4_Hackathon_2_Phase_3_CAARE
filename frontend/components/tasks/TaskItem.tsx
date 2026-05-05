// TaskItem - glass card with completion toggle, priority badge, tags,
// due-date pill, edit & delete.

'use client';

import React, { useMemo, useState } from 'react';
import { Task, TaskFormData } from '@/lib/types';
import { TaskForm } from './TaskForm';
import { DeleteConfirmation } from './DeleteConfirmation';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Modal } from '@/components/ui/Modal';
import { parseTags } from '@/lib/tags';

interface TaskItemProps {
  task: Task;
  tagSuggestions?: string[];
  onUpdate: (
    id: string,
    data: Partial<TaskFormData> & { completed?: boolean }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const PRIORITY_CLASS: Record<Task['priority'], string> = {
  high: 'priority-high',
  medium: 'priority-medium',
  low: 'priority-low',
};

const PRIORITY_DOT: Record<Task['priority'], string> = {
  high: 'bg-rose-400',
  medium: 'bg-amber-400',
  low: 'bg-emerald-400',
};

const rtf =
  typeof Intl !== 'undefined' && Intl.RelativeTimeFormat
    ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
    : null;

interface DueMeta {
  label: string;
  tone: 'overdue' | 'soon' | 'normal';
  absolute: string;
}

function describeDue(iso: string | null): DueMeta | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = date.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60_000);
  const diffH = Math.round(diffMs / 3_600_000);
  const diffD = Math.round(diffMs / 86_400_000);

  let label: string;
  if (rtf) {
    if (Math.abs(diffMin) < 60) label = rtf.format(diffMin, 'minute');
    else if (Math.abs(diffH) < 24) label = rtf.format(diffH, 'hour');
    else label = rtf.format(diffD, 'day');
  } else {
    label = date.toLocaleString();
  }

  let tone: DueMeta['tone'] = 'normal';
  if (diffMs < 0) tone = 'overdue';
  else if (diffH <= 24) tone = 'soon';

  return {
    label,
    tone,
    absolute: date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
}

export function TaskItem({
  task,
  tagSuggestions = [],
  onUpdate,
  onDelete,
}: TaskItemProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const tagList = useMemo(() => parseTags(task.tags), [task.tags]);
  const due = useMemo(() => describeDue(task.due_date), [task.due_date]);

  const handleToggle = async () => {
    setIsToggling(true);
    setError(null);
    try {
      await onUpdate(task.id, { completed: !task.completed });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update task status.'
      );
    } finally {
      setIsToggling(false);
    }
  };

  const handleEditSubmit = async (data: TaskFormData) => {
    await onUpdate(task.id, data);
    setIsEditOpen(false);
  };

  const handleDelete = async () => {
    await onDelete(task.id);
  };

  const dueClasses =
    due?.tone === 'overdue'
      ? 'border-rose-400/40 bg-rose-500/15 text-rose-200 shadow-[0_0_14px_-2px_rgba(244,63,94,0.55)]'
      : due?.tone === 'soon'
        ? 'border-amber-400/40 bg-amber-500/15 text-amber-200 shadow-[0_0_14px_-2px_rgba(245,158,11,0.45)]'
        : 'border-white/15 bg-white/[0.06] text-slate-200';

  return (
    <>
      <div
        className={`group relative animate-slideUp glass overflow-hidden p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:shadow-[0_18px_50px_-20px_rgba(139,92,246,0.5)] sm:p-5 ${
          task.completed ? 'opacity-80' : ''
        }`}
      >
        {error && (
          <div className="mb-3">
            <ErrorMessage
              message={error}
              variant="error"
              onRetry={() => setError(null)}
            />
          </div>
        )}

        <div className="flex items-start gap-3 sm:gap-4">
          {/* Completion toggle */}
          <button
            type="button"
            onClick={handleToggle}
            disabled={isToggling}
            aria-label={
              task.completed ? 'Mark as incomplete' : 'Mark as complete'
            }
            aria-pressed={task.completed}
            className="glass-check mt-0.5 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60"
            data-checked={task.completed}
          >
            {isToggling ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : task.completed ? (
              <svg
                className="h-3.5 w-3.5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            ) : null}
          </button>

          {/* Body */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-2">
              <h3
                className={`text-base font-semibold leading-snug sm:text-lg ${
                  task.completed
                    ? 'text-slate-400 line-through decoration-slate-500/70'
                    : 'text-white'
                }`}
              >
                {task.title}
              </h3>
              <span
                className={PRIORITY_CLASS[task.priority]}
                title={`${PRIORITY_LABEL[task.priority]} priority`}
              >
                <span
                  className={`mr-1 h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`}
                />
                {PRIORITY_LABEL[task.priority]}
              </span>
            </div>

            {task.description && (
              <p
                className={`mt-1 text-sm leading-relaxed ${
                  task.completed ? 'text-slate-400/80' : 'text-slate-300'
                } ${descExpanded ? '' : 'line-clamp-2'}`}
              >
                {task.description}
              </p>
            )}

            {task.description && task.description.length > 120 && (
              <button
                type="button"
                onClick={() => setDescExpanded((v) => !v)}
                className="mt-1 text-xs font-medium text-brand-300 transition-colors hover:text-brand-200"
              >
                {descExpanded ? 'Show less' : 'Show more'}
              </button>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {due && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-medium ${dueClasses}`}
                  title={due.absolute}
                >
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  {due.tone === 'overdue' ? 'Overdue' : 'Due'} {due.label}
                </span>
              )}

              {tagList.map((tag) => (
                <span key={tag} className="glass-chip">
                  <svg
                    className="h-3 w-3 text-slate-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                    <path d="M7 7h.01" />
                  </svg>
                  {tag}
                </span>
              ))}

              <span className="ml-auto text-[11px] text-slate-400/80">
                {new Date(task.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              disabled={isToggling}
              aria-label="Edit task"
              className="grid h-9 w-9 place-items-center rounded-xl border border-transparent text-slate-300 transition-all hover:border-white/15 hover:bg-white/[0.08] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
                <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirmation(true)}
              disabled={isToggling}
              aria-label="Delete task"
              className="grid h-9 w-9 place-items-center rounded-xl border border-transparent text-rose-300 transition-all hover:border-rose-400/30 hover:bg-rose-500/15 hover:text-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
            >
              <svg
                className="h-4 w-4"
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
            </button>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit task"
        description="Tweak the details and save."
        size="lg"
      >
        <TaskForm
          isEditMode
          initialData={{
            title: task.title,
            description: task.description,
            priority: task.priority,
            tags: task.tags,
            due_date: task.due_date,
          }}
          tagSuggestions={tagSuggestions}
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditOpen(false)}
        />
      </Modal>

      {/* Delete confirmation */}
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
