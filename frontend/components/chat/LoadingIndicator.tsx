/**
 * LoadingIndicator Component
 * Spec 5: ChatKit Frontend - Phase 3 (TASK-032)
 *
 * Displays three animated dots to indicate AI is processing
 * Used while waiting for AI agent response
 */

'use client';

export default function LoadingIndicator() {
  return (
    <div className="flex items-center space-x-2 px-4 py-3">
      <div className="flex space-x-1">
        <div
          className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <div
          className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <div
          className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
      <span className="text-sm text-gray-500">AI is thinking...</span>
    </div>
  );
}
