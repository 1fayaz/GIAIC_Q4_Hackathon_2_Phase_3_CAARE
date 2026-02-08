/**
 * ConversationList Component
 * Spec 5: ChatKit Frontend - Phase 6 (TASK-070)
 *
 * Displays sidebar with list of conversations
 * Includes "New Chat" button and empty state
 * Sorts conversations by most recent activity
 */

'use client';

import { Conversation } from '@/lib/types';
import ConversationItem from './ConversationItem';
import EmptyState from './EmptyState';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  isLoading?: boolean;
}

export default function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  isLoading = false,
}: ConversationListProps) {
  // TASK-071: Sort conversations by updated_at DESC (most recent first)
  const sortedConversations = [...conversations].sort((a, b) => {
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return (
    <div className="w-full lg:w-80 border-r border-gray-200 bg-gray-50 flex flex-col h-full">
      {/* Header with New Chat button - TASK-082 */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <button
          onClick={onNewConversation}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2"
          aria-label="Start new conversation"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="font-medium">New Chat</span>
        </button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-gray-500">Loading conversations...</div>
          </div>
        ) : sortedConversations.length === 0 ? (
          // TASK-084: Empty state for conversation list
          <div className="p-4">
            <EmptyState type="conversations" />
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onSelect={onSelectConversation}
                onDelete={onDeleteConversation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
