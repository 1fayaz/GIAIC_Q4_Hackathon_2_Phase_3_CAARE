// Glass modal with focus trap, ESC-to-close, backdrop click, and animations.

'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  /** 'md' default, 'lg' for forms with many fields */
  size?: 'sm' | 'md' | 'lg';
  /** When true, the close button in the header is hidden. */
  hideClose?: boolean;
  /** Aria label for the dialog when no `title` is provided. */
  ariaLabel?: string;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  hideClose,
  ariaLabel,
}: ModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  /* Lock body scroll while open */
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  /* ESC to close + focus trap */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab' && containerRef.current) {
        const focusables = Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => !el.hasAttribute('data-focus-skip'));
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && active === last) {
          first.focus();
          e.preventDefault();
        }
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  /* Move focus into the modal on open, restore on close */
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    const focusables = containerRef.current?.querySelectorAll<HTMLElement>(
      FOCUSABLE_SELECTOR
    );
    const first = focusables && focusables.length > 0 ? focusables[0] : null;
    if (first) {
      first.focus();
    } else {
      containerRef.current?.focus();
    }
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof window === 'undefined') return null;

  const widths = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  } as const;

  const labelledById = title ? 'modal-title' : undefined;
  const describedById = description ? 'modal-description' : undefined;

  const node = (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
      aria-hidden={false}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 cursor-default bg-slate-950/70 backdrop-blur-md animate-fadeIn"
        onClick={onClose}
        tabIndex={-1}
        data-focus-skip
      />

      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        aria-describedby={describedById}
        aria-label={!title ? ariaLabel : undefined}
        tabIndex={-1}
        className={`relative w-full ${widths[size]} animate-scaleIn glass-strong overflow-hidden`}
      >
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
            <div className="flex-1">
              {title && (
                <h2
                  id={labelledById}
                  className="text-lg font-semibold text-white"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id={describedById}
                  className="mt-1 text-sm text-slate-300/80"
                >
                  {description}
                </p>
              )}
            </div>
            {!hideClose && (
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60"
              >
                <svg
                  className="h-5 w-5"
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
            )}
          </div>
        )}

        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
