// Landing page with redirect logic.

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.push('/tasks');
    } else {
      router.push('/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="glass animate-fadeIn px-10 py-8 text-center">
        <h1 className="text-3xl font-semibold text-gradient mb-4">
          FAN Tasks
        </h1>
        <LoadingSpinner size="md" text="Loading your workspace..." />
      </div>
    </div>
  );
}
