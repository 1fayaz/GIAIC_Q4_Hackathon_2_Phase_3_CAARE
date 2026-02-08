// Landing page with redirect logic
// Implements T023 from tasks.md

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Wait for auth state to load
    if (isLoading) return;

    // Redirect based on authentication status
    if (isAuthenticated) {
      router.push('/tasks');
    } else {
      router.push('/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    </div>
  );
}
