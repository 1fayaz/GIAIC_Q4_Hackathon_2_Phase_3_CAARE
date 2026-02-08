/**
 * ConversationItem Component
 * Spec 5: ChatKit Frontend - Phase 6 (TASK-069)
 *
 * Displays a single conversation in the sidebar list
 * Shows title/preview, timestamp, and delete button on hover
 * Highlights active conversation
 */

'use client';

import { useState } from 'react';
import { Conversation } from '@/lib/types';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (conversationId: string) => void;
  onDelete: (conversationId: string) => void;
}

export default function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: ConversationItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showDeleteConfirm) {
      onDelete(conversation.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

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

  const displayTitle = conversation.title || 'New Conversation';

  return (
    <div
      onClick={() => !showDeleteConfirm && onSelect(conversation.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowDeleteConfirm(false);
      }}
      className={`px-4 py-3 cursor-pointer transition-colors border-l-4 ${
        isActive
          ? 'bg-blue-50 border-blue-600'
          : 'bg-white border-transparent hover:bg-gray-50'
      }`}
      role="button"
      tabIndex={0}
      aria-label={`Select conversation: ${displayTitle}`}
      aria-current={isActive ? 'true' : 'false'}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm font-medium truncate ${
              isActive ? 'text-blue-900' : 'text-gray-900'
            }`}
          >
            {displayTitle}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {formatTimestamp(conversation.updated_at)}
          </p>
        </div>

        {/* Delete button (show on hover or when confirming) */}
        {(isHovered || showDeleteConfirm) && !showDeleteConfirm && (
          <button
            onClick={handleDelete}
            className="ml-2 p-1 text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
            aria-label="Delete conversation"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}

        {/* Delete confirmation (TASK-078) */}
        {showDeleteConfirm && (
          <div className="ml-2 flex items-center space-x-1">
            <button
              onClick={handleDelete}
              className="px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Confirm delete"
            >
              Delete
            </button>
            <button
              onClick={handleCancelDelete}
              className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label="Cancel delete"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
