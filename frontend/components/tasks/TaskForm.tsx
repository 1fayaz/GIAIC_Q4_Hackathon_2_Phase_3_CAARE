// TaskForm component - rich glass form with priority, tags, due date.

'use client';

import React, {
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Priority, TaskFormData } from '@/lib/types';
import { parseTags, serializeTags } from '@/lib/tags';

interface TaskFormProps {
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<TaskFormData>;
  isEditMode?: boolean;
  /** Optional: existing tag pool used to render datalist suggestions. */
  tagSuggestions?: string[];
}

interface InternalForm {
  title: string;
  description: string;
}

const PRIORITY_OPTIONS: Array<{ value: Priority; label: string; cls: string }> =
  [
    {
      value: 'low',
      label: 'Low',
      cls: 'data-[active=true]:priority-low data-[active=true]:!shadow-[0_0_18px_-2px_rgba(16,185,129,0.55)]',
    },
    {
      value: 'medium',
      label: 'Medium',
      cls: 'data-[active=true]:priority-medium data-[active=true]:!shadow-[0_0_18px_-2px_rgba(245,158,11,0.55)]',
    },
    {
      value: 'high',
      label: 'High',
      cls: 'data-[active=true]:priority-high data-[active=true]:!shadow-[0_0_18px_-2px_rgba(244,63,94,0.55)]',
    },
  ];

/**
 * Convert an ISO timestamp to the value expected by <input type="datetime-local">.
 * The element wants `YYYY-MM-DDTHH:mm` in local time (no timezone suffix).
 */
function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

/**
 * Convert a `<input type="datetime-local">` value to a backend-friendly ISO
 * string. Returns null when empty.
 */
function localInputToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function TaskForm({
  onSubmit,
  onCancel,
  initialData,
  isEditMode = false,
  tagSuggestions = [],
}: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [priority, setPriority] = useState<Priority>(
    (initialData?.priority as Priority) || 'medium'
  );
  const [tags, setTags] = useState<string[]>(parseTags(initialData?.tags));
  const [tagInput, setTagInput] = useState('');
  const [dueLocal, setDueLocal] = useState<string>(
    isoToLocalInput(initialData?.due_date ?? null)
  );

  const tagInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InternalForm>({
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
    },
    mode: 'onBlur',
  });

  // Auto-grow the description textarea
  const adjustTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  };
  useEffect(() => {
    adjustTextarea();
  }, []);

  // RHF + local ref combined for the textarea
  const descriptionRegister = register('description', {
    maxLength: {
      value: 1000,
      message: 'Description must not exceed 1000 characters',
    },
    onChange: adjustTextarea,
  });

  // De-duplicated suggestions, excluding tags already added.
  const filteredSuggestions = useMemo(() => {
    const lowerSelected = new Set(tags.map((t) => t.toLowerCase()));
    return tagSuggestions.filter((s) => !lowerSelected.has(s.toLowerCase()));
  }, [tagSuggestions, tags]);

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/,$/, '').trim();
    if (!tag) return;
    const exists = tags.some((t) => t.toLowerCase() === tag.toLowerCase());
    if (exists) {
      setTagInput('');
      return;
    }
    setTags((prev) => [...prev, tag]);
    setTagInput('');
  };

  const handleTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) addTag(tagInput);
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      // Remove the last chip on Backspace when input is empty
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleFormSubmit = async (data: InternalForm) => {
    setIsSubmitting(true);
    setApiError(null);

    // If the user typed a tag but didn't press enter, accept it.
    const finalTags = tagInput.trim()
      ? [...tags, tagInput.trim()]
      : tags;

    const payload: TaskFormData = {
      title: data.title.trim(),
      description: data.description?.trim() ?? '',
      priority,
      tags: serializeTags(finalTags),
      due_date: localInputToIso(dueLocal),
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : 'Failed to save task. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-5"
      noValidate
    >
      {apiError && (
        <ErrorMessage
          message={apiError}
          variant="error"
          onRetry={() => setApiError(null)}
        />
      )}

      {/* Title */}
      <Input
        label="Title"
        type="text"
        placeholder="What needs doing?"
        required
        fullWidth
        error={errors.title?.message}
        {...register('title', {
          required: 'Title is required',
          maxLength: {
            value: 200,
            message: 'Title must not exceed 200 characters',
          },
          validate: (value) =>
            value.trim().length > 0 || 'Title cannot be empty',
        })}
      />

      {/* Description (autosize textarea) */}
      <div>
        <label
          htmlFor="task-description"
          className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-300/80"
        >
          Description
          <span className="ml-2 text-[10px] font-normal normal-case text-slate-400/70">
            optional
          </span>
        </label>
        <textarea
          id="task-description"
          rows={3}
          placeholder="Add some detail..."
          className={`glass-textarea ${
            errors.description
              ? 'border-rose-400/60 focus:border-rose-400 focus:ring-rose-400/40'
              : ''
          }`}
          {...descriptionRegister}
          ref={(el) => {
            textareaRef.current = el;
            descriptionRegister.ref(el);
          }}
        />
        {errors.description && (
          <p className="mt-1.5 text-xs text-rose-300" role="alert">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Priority segmented control */}
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-300/80">
          Priority
        </p>
        <div className="seg-group" role="radiogroup" aria-label="Priority">
          {PRIORITY_OPTIONS.map((opt) => {
            const active = priority === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                data-active={active}
                onClick={() => setPriority(opt.value)}
                className={`seg-btn ${opt.cls}`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      opt.value === 'high'
                        ? 'bg-rose-400'
                        : opt.value === 'medium'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                    }`}
                  />
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags chip input */}
      <div>
        <label
          htmlFor="task-tags-input"
          className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-300/80"
        >
          Tags
          <span className="ml-2 text-[10px] font-normal normal-case text-slate-400/70">
            press Enter or comma to add
          </span>
        </label>
        <div
          className="glass-input flex flex-wrap items-center gap-1.5 py-2"
          onClick={() => tagInputRef.current?.focus()}
        >
          {tags.map((tag) => (
            <span key={tag} className="glass-chip pr-1">
              <span>{tag}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                aria-label={`Remove tag ${tag}`}
                className="ml-1 grid h-4 w-4 place-items-center rounded-full text-slate-300 transition-colors hover:bg-white/15 hover:text-white"
              >
                <svg
                  className="h-3 w-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          <input
            id="task-tags-input"
            ref={tagInputRef}
            type="text"
            value={tagInput}
            placeholder={tags.length === 0 ? 'work, urgent...' : ''}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKey}
            onBlur={() => {
              if (tagInput.trim()) addTag(tagInput);
            }}
            list="tag-suggestions"
            className="flex-1 min-w-[6rem] bg-transparent text-sm text-slate-100 placeholder:text-slate-400/70 outline-none"
          />
          {filteredSuggestions.length > 0 && (
            <datalist id="tag-suggestions">
              {filteredSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          )}
        </div>
      </div>

      {/* Due date */}
      <div>
        <label
          htmlFor="task-due-date"
          className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-300/80"
        >
          Due date
          <span className="ml-2 text-[10px] font-normal normal-case text-slate-400/70">
            optional
          </span>
        </label>
        <input
          id="task-due-date"
          type="datetime-local"
          value={dueLocal}
          onChange={(e) => setDueLocal(e.target.value)}
          className="glass-input"
          style={{ colorScheme: 'dark' }}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? isEditMode
              ? 'Updating...'
              : 'Creating...'
            : isEditMode
              ? 'Save changes'
              : 'Create task'}
        </Button>
      </div>
    </form>
  );
}
