// Sign in page
// Implements T025 from tasks.md

import React from 'react';
import Link from 'next/link';
import { SignInForm } from '@/components/auth/SignInForm';

export default function SignInPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Sign in to your account
      </h2>

      <SignInForm />

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Don't have an account?
            </span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/signup"
            className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            Create a new account
          </Link>
        </div>
      </div>
    </div>
  );
}
