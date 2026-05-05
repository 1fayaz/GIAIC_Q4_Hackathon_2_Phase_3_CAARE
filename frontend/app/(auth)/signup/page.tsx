// Sign up page

import React from 'react';
import Link from 'next/link';
import { SignUpForm } from '@/components/auth/SignUpForm';

export default function SignUpPage() {
  return (
    <div>
      <h2 className="mb-1 text-2xl font-semibold text-white">
        Create your account
      </h2>
      <p className="mb-6 text-sm text-slate-300/80">
        Start organizing your day in seconds.
      </p>

      <SignUpForm />

      <div className="mt-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs uppercase tracking-wider text-slate-400/70">
          Already a member?
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/signin"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-300 transition-colors hover:text-brand-200"
        >
          Sign in instead
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
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
