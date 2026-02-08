/**
 * EmptyState Component
 * Spec 5: ChatKit Frontend - Phase 3 (TASK-033)
 *
 * Displays placeholder message when there are no messages or conversations
 * Provides helpful guidance to users on how to get started
 */

'use client';

interface EmptyStateProps {
  type: 'messages' | 'conversations';
}

export default function EmptyState({ type }: EmptyStateProps) {
  if (type === 'messages') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="mb-4">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Start a conversation
        </h3>
        <p className="text-sm text-gray-600 max-w-md">
          Type a message below to start chatting with your AI assistant. You can ask me to manage your tasks, create new ones, or check what's on your list.
        </p>
        <div className="mt-6 space-y-2 text-left">
          <p className="text-xs text-gray-500">Try asking:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• "Add a task to buy groceries"</li>
            <li>• "Show me my tasks"</li>
            <li>• "Mark my first task as complete"</li>
          </ul>
        </div>
      </div>
    );
  }

  // type === 'conversations'
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="mb-4">
        <svg
          className="w-16 h-16 text-gray-300 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No conversations yet
      </h3>
      <p className="text-sm text-gray-600 max-w-md">
        Start a new conversation to begin managing your tasks with AI assistance.
      </p>
    </div>
  );
}
