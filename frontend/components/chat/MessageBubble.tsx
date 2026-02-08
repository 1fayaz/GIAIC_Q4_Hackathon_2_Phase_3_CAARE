/**
 * MessageBubble Component
 * Spec 5: ChatKit Frontend - Phase 3 (TASK-035)
 *
 * Displays a single message with appropriate styling for user/assistant
 * Shows timestamp and tool calls (for assistant messages)
 */

'use client';

import { Message, parseToolCalls, hasToolCalls } from '@/lib/types';
import ToolCallDisplay from './ToolCallDisplay';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const toolCalls = hasToolCalls(message) ? parseToolCalls(message) : null;

  // Format timestamp as relative time
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      role="article"
      aria-label={`${isUser ? 'User' : 'Assistant'} message`}
    >
      <div
        className={`max-w-[80%] ${
          isUser
            ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg'
            : 'bg-gray-200 text-gray-900 rounded-r-lg rounded-tl-lg'
        } px-4 py-3 shadow-sm`}
      >
        {/* Message content */}
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {/* Tool calls (assistant only) */}
        {!isUser && toolCalls && toolCalls.length > 0 && (
          <ToolCallDisplay toolCalls={toolCalls} />
        )}

        {/* Timestamp */}
        <div
          className={`text-xs mt-2 ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          {formatTimestamp(message.created_at)}
        </div>
      </div>
    </div>
  );
}
