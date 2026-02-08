/**
 * MessageList Component
 * Spec 5: ChatKit Frontend - Phase 3 (TASK-037)
 *
 * Scrollable container for displaying messages in chronological order
 * Automatically scrolls to bottom when new messages arrive
 */

'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/lib/types';
import MessageBubble from './MessageBubble';
import LoadingIndicator from './LoadingIndicator';
import EmptyState from './EmptyState';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export default function MessageList({ messages, isLoading = false }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive (TASK-040)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Show empty state if no messages
  if (messages.length === 0 && !isLoading) {
    return <EmptyState type="messages" />;
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isLoading && <LoadingIndicator />}

      {/* Invisible element to scroll to */}
      <div ref={messagesEndRef} />
    </div>
  );
}
