// TasksToolbar - search, status segmented, priority chips, tag filter, sort.

'use client';

import React from 'react';
import { Priority, TaskFilters } from '@/lib/types';

interface TasksToolbarProps {
  filters: TaskFilters;
  onChange: (next: TaskFilters) => void;
  onClear: () => void;
  tagSuggestions?: string[];
  /** When true, shows the "Clear filters" link on the right. */
  hasActive: boolean;
}

const STATUS_OPTIONS: Array<{ value: NonNullable<TaskFilters['status']>; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

const PRIORITY_OPTIONS: Array<{ value: Priority; label: string; cls: string; dot: string }> = [
  {
    value: 'high',
    label: 'High',
    cls: 'data-[active=true]:bg-rose-500/20 data-[active=true]:border-rose-400/40 data-[active=true]:text-rose-100',
    dot: 'bg-rose-400',
  },
  {
    value: 'medium',
    label: 'Medium',
    cls: 'data-[active=true]:bg-amber-500/20 data-[active=true]:border-amber-400/40 data-[active=true]:text-amber-100',
    dot: 'bg-amber-400',
  },
  {
    value: 'low',
    label: 'Low',
    cls: 'data-[active=true]:bg-emerald-500/20 data-[active=true]:border-emerald-400/40 data-[active=true]:text-emerald-100',
    dot: 'bg-emerald-400',
  },
];

const SORT_OPTIONS: Array<{
  label: string;
  sort_by: NonNullable<TaskFilters['sort_by']>;
  order: NonNullable<TaskFilters['order']>;
}> = [
  { label: 'Newest', sort_by: 'created_at', order: 'desc' },
  { label: 'Oldest', sort_by: 'created_at', order: 'asc' },
  { label: 'Due soonest', sort_by: 'due_date', order: 'asc' },
  { label: 'Due latest', sort_by: 'due_date', order: 'desc' },
  { label: 'Priority (high → low)', sort_by: 'priority', order: 'desc' },
  { label: 'Title A → Z', sort_by: 'title', order: 'asc' },
];

export function TasksToolbar({
  filters,
  onChange,
  onClear,
  tagSuggestions = [],
  hasActive,
}: TasksToolbarProps) {
  const update = (patch: Partial<TaskFilters>) => onChange({ ...filters, ...patch });

  const sortValue = `${filters.sort_by ?? 'created_at'}:${filters.order ?? 'desc'}`;

  return (
    <div className="glass sticky top-[4.5rem] z-30 animate-fadeIn p-4 sm:p-5">
      <div className="flex flex-col gap-4">
        {/* Row 1: search + sort */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={filters.search ?? ''}
              onChange={(e) => update({ search: e.target.value })}
              placeholder="Search tasks..."
              aria-label="Search tasks"
              className="glass-input pl-10"
            />
          </div>

          <label className="relative inline-flex items-center sm:w-auto">
            <span className="sr-only">Sort by</span>
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 6h18M6 12h12M10 18h4" />
            </svg>
            <select
              value={sortValue}
              onChange={(e) => {
                const [sort_by, order] = e.target.value.split(':') as [
                  NonNullable<TaskFilters['sort_by']>,
                  NonNullable<TaskFilters['order']>,
                ];
                update({ sort_by, order });
              }}
              className="glass-input pl-10 pr-8 appearance-none"
              style={{ colorScheme: 'dark' }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option
                  key={`${opt.sort_by}:${opt.order}`}
                  value={`${opt.sort_by}:${opt.order}`}
                  className="bg-slate-900"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Row 2: status segmented + priority chips */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="seg-group" role="tablist" aria-label="Status filter">
              {STATUS_OPTIONS.map((opt) => {
                const active = (filters.status ?? 'all') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    data-active={active}
                    onClick={() => update({ status: opt.value })}
                    className="seg-btn"
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div
              className="flex flex-wrap items-center gap-1.5"
              role="group"
              aria-label="Priority filter"
            >
              <button
                type="button"
                onClick={() => update({ priority: undefined })}
                data-active={!filters.priority}
                className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1 text-xs text-slate-300 transition-all hover:bg-white/[0.10] hover:text-white data-[active=true]:bg-white/[0.14] data-[active=true]:text-white"
              >
                Any priority
              </button>
              {PRIORITY_OPTIONS.map((opt) => {
                const active = filters.priority === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      update({ priority: active ? undefined : opt.value })
                    }
                    data-active={active}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-3 py-1 text-xs text-slate-300 transition-all hover:bg-white/[0.10] hover:text-white ${opt.cls}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${opt.dot}`} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="relative inline-flex w-full sm:w-56">
              <span className="sr-only">Filter by tag</span>
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
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
              <input
                type="text"
                value={filters.tag ?? ''}
                onChange={(e) =>
                  update({ tag: e.target.value || undefined })
                }
                placeholder="Filter by tag..."
                list="toolbar-tag-suggestions"
                className="glass-input pl-10"
              />
              {tagSuggestions.length > 0 && (
                <datalist id="toolbar-tag-suggestions">
                  {tagSuggestions.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              )}
            </label>

            {hasActive && (
              <button
                type="button"
                onClick={onClear}
                className="whitespace-nowrap text-xs font-medium text-brand-300 transition-colors hover:text-brand-200"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
