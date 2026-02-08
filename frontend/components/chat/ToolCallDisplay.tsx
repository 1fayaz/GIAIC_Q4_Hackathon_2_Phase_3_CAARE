/**
 * ToolCallDisplay Component
 * Spec 5: ChatKit Frontend - Phase 3 (TASK-036)
 *
 * Displays tool invocations performed by the AI agent
 * Shows tool name, parameters, result, and success/failure status
 * Supports expand/collapse for detailed view
 */

'use client';

import { useState } from 'react';
import { ToolCall } from '@/lib/types';

interface ToolCallDisplayProps {
  toolCalls: ToolCall[];
}

export default function ToolCallDisplay({ toolCalls }: ToolCallDisplayProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  if (!toolCalls || toolCalls.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      {toolCalls.map((toolCall, index) => (
        <div
          key={index}
          className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
        >
          <button
            onClick={() => toggleExpand(index)}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-100 transition-colors"
            aria-expanded={expandedIndex === index}
            aria-label={`Toggle details for ${toolCall.tool}`}
          >
            <div className="flex items-center space-x-2">
              {toolCall.success ? (
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              <span className="text-sm font-medium text-gray-700">
                {toolCall.tool}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  toolCall.success
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {toolCall.success ? 'Success' : 'Failed'}
              </span>
            </div>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${
                expandedIndex === index ? 'transform rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {expandedIndex === index && (
            <div className="px-3 py-2 border-t border-gray-200 bg-white">
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-gray-700">Parameters:</span>
                  <pre className="mt-1 p-2 bg-gray-50 rounded overflow-x-auto">
                    {JSON.stringify(toolCall.parameters, null, 2)}
                  </pre>
                </div>

                {toolCall.success && toolCall.result && (
                  <div>
                    <span className="font-semibold text-gray-700">Result:</span>
                    <pre className="mt-1 p-2 bg-gray-50 rounded overflow-x-auto">
                      {JSON.stringify(toolCall.result, null, 2)}
                    </pre>
                  </div>
                )}

                {!toolCall.success && toolCall.error && (
                  <div>
                    <span className="font-semibold text-red-700">Error:</span>
                    <p className="mt-1 p-2 bg-red-50 text-red-800 rounded">
                      {toolCall.error}
                    </p>
                  </div>
                )}

                <div className="text-gray-500">
                  <span className="font-semibold">Timestamp:</span>{' '}
                  {new Date(toolCall.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
