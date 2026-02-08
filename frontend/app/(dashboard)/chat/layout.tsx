/**
 * Chat Layout
 * Wrapper layout for all chat pages
 * Spec 5: ChatKit Frontend - Phase 2 (TASK-030)
 */

import { ReactNode } from 'react';

interface ChatLayoutProps {
  children: ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <div className="flex h-full w-full">
      {children}
    </div>
  );
}
