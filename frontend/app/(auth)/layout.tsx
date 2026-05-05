// Auth route group layout - centered glass card on aurora background.

import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slideUp">
        {/* Brand header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/5 shadow-glass backdrop-blur-xl">
            <svg
              className="h-7 w-7 text-brand-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 11l3 3 8-8" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gradient">
            FAN Tasks
          </h1>
          <p className="mt-2 text-sm text-slate-300/80">
            Your premium task workspace.
          </p>
        </div>

        {/* Glass card */}
        <div className="glass-strong p-8">{children}</div>

        <p className="mt-6 text-center text-xs text-slate-400/70">
          Built for focus. Designed for delight.
        </p>
      </div>
    </div>
  );
}
