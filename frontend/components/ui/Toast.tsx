// Lightweight toast system. No external dependency.
// Usage:
//   const { push } = useToast();
//   push({ message: 'Saved!', variant: 'success' });
//
// Mount <ToastProvider> once near the root of your app subtree.

'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastInput {
  message: string;
  title?: string;
  variant?: ToastVariant;
  /** Auto-dismiss after this many ms. 0 = sticky. Default 3500. */
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastInput, 'title'>> {
  id: number;
  title?: string;
}

interface ToastContextValue {
  push: (t: ToastInput) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (input: ToastInput) => {
      const id = nextId++;
      const item: ToastItem = {
        id,
        message: input.message,
        title: input.title,
        variant: input.variant ?? 'info',
        duration: input.duration ?? 3500,
      };
      setToasts((prev) => [...prev, item]);
      if (item.duration > 0) {
        const handle = setTimeout(() => dismiss(id), item.duration);
        timers.current.set(id, handle);
      }
    },
    [dismiss]
  );

  // Cleanup on unmount
  useEffect(() => {
    const timersAtMount = timers.current;
    return () => {
      timersAtMount.forEach((t) => clearTimeout(t));
      timersAtMount.clear();
    };
  }, []);

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Return a noop fallback so components don't crash if used outside provider.
    return {
      push: () => {},
      dismiss: () => {},
    };
  }
  return ctx;
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:left-auto"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const accent =
    toast.variant === 'success'
      ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100'
      : toast.variant === 'error'
        ? 'border-rose-400/30 bg-rose-500/15 text-rose-100'
        : 'border-sky-400/30 bg-sky-500/15 text-sky-100';

  return (
    <div
      role="status"
      className={`pointer-events-auto glass animate-slideUp w-full max-w-sm border ${accent} px-4 py-3 shadow-glass-lg`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-5 w-5 items-center justify-center">
          {toast.variant === 'success' ? (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          ) : toast.variant === 'error' ? (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5" />
              <circle cx="12" cy="16.5" r="0.5" fill="currentColor" />
            </svg>
          )}
        </span>
        <div className="flex-1">
          {toast.title && (
            <p className="text-sm font-semibold">{toast.title}</p>
          )}
          <p className="text-sm">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="text-slate-300/70 transition-colors hover:text-white"
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
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
