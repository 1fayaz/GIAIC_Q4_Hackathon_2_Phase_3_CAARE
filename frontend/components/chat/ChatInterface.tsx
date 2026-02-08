/**
 * ChatInterface Component
 * Spec 5: ChatKit Frontend - Phase 3, 4 & 5 (TASK-038, TASK-049 to TASK-068)
 *
 * Root component for the chat interface
 * Manages state, handles message sending with optimistic UI updates
 * Supports conversation persistence and loading
 * Implements comprehensive error handling and recovery
 * Orchestrates MessageList, MessageInput, and ErrorMessage components
 */

'use client';

import { useState, useEffect } from 'react';
import { Message, OptimisticMessage, validateMessageContent, Conversation, ChatErrorCode, ChatError } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ErrorMessage from './ErrorMessage';
import ConversationList from './ConversationList';

interface ChatInterfaceProps {
  initialConversationId?: string;
}

export default function ChatInterface({ initialConversationId }: ChatInterfaceProps = {}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ChatError | null>(null); // TASK-058: Enhanced error state
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversationId || null
  );
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null); // For retry
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // TASK-089: Sidebar toggle for mobile

  /**
   * Load conversations on mount
   * TASK-049: Implement useEffect hook to load conversations on mount
   */
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setIsLoadingConversations(true);
        const loadedConversations = await apiClient.getConversations();
        setConversations(loadedConversations);
        setError(null); // Clear any previous errors
      } catch (err: any) {
        // Enhanced error logging to see actual error details
        console.error('Failed to load conversations - Full error:', {
          message: err?.message,
          code: err?.code,
          status: err?.status,
          details: err?.details,
          error: err
        });

        // Show error to user so they know what's wrong
        const errorMessage = err?.message || err?.code || 'Failed to load conversations. You can still start a new conversation by sending a message.';
        setError({
          code: err?.code || 'CONVERSATION_LOAD_FAILED',
          message: errorMessage
        });
      } finally {
        setIsLoadingConversations(false);
      }
    };

    loadConversations();
  }, []);

  /**
   * Load messages when activeConversationId changes
   * TASK-050: Implement useEffect hook to load messages when activeConversationId changes
   */
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const conversation = await apiClient.getConversation(activeConversationId);
        setMessages(conversation.messages || []);
      } catch (err: any) {
        console.error('Failed to load messages:', err);
        setError({
          code: err?.code || 'CONVERSATION_LOAD_FAILED',
          message: err?.message || 'Failed to load conversation. Please try again.'
        });
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [activeConversationId]);

  /**
   * Handle sending a message with optimistic UI updates and comprehensive error handling
   * TASK-039: Implement handleSendMessage method
   * TASK-046: Implement optimistic message creation
   * TASK-047: Implement optimistic message removal on error
   * TASK-048: Implement loading state management
   * TASK-061 to TASK-064: Handle different error types
   * TASK-066: Preserve user input on error
   */
  const handleSendMessage = async () => {
    // Validate message content (TASK-063: validation errors)
    const validation = validateMessageContent(input);
    if (!validation.valid) {
      setError({
        code: ChatErrorCode.INVALID_INPUT,
        message: validation.error || 'Invalid message',
      });
      return;
    }

    const messageContent = input.trim();
    setInput(''); // Clear input immediately
    setError(null); // Clear any previous errors (TASK-060)
    setLastFailedMessage(null);

    // Create optimistic message (TASK-046)
    const optimisticMessage: OptimisticMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversationId || 'new',
      role: 'user',
      content: messageContent,
      tool_calls: null,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };

    // Add optimistic message to UI immediately
    setMessages((prev) => [...prev, optimisticMessage]);
    setIsLoading(true); // TASK-048: Set loading state

    try {
      // Send message to backend
      const response = await apiClient.sendMessage({
        content: messageContent,
        conversation_id: activeConversationId || undefined,
      });

      // Remove optimistic message and add real messages
      setMessages((prev) => {
        // Filter out the optimistic message
        const withoutOptimistic = prev.filter((msg) => msg.id !== optimisticMessage.id);

        // Create user message from response
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          conversation_id: response.conversation_id,
          role: 'user',
          content: messageContent,
          tool_calls: null,
          created_at: new Date().toISOString(),
        };

        // Create assistant message from response
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          conversation_id: response.conversation_id,
          role: 'assistant',
          content: response.message,
          tool_calls: response.tool_calls ? JSON.stringify(response.tool_calls) : null,
          created_at: new Date().toISOString(),
        };

        return [...withoutOptimistic, userMessage, assistantMessage];
      });

      // TASK-052: Handle new conversation creation on first message
      // TASK-053: Update activeConversationId after sending first message
      if (!activeConversationId) {
        setActiveConversationId(response.conversation_id);

        // TASK-054: Update conversation list after new conversation created
        try {
          const updatedConversations = await apiClient.getConversations();
          setConversations(updatedConversations);
        } catch (err) {
          console.error('Failed to update conversation list:', err);
        }
      }
    } catch (err: any) {
      // TASK-047: Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));

      // TASK-066: Preserve user input on error (restore input so user can retry)
      setInput(messageContent);
      setLastFailedMessage(messageContent);

      // Handle different error types (TASK-061 to TASK-064)
      if (err.code) {
        // ChatError from API client
        setError({
          code: err.code as ChatErrorCode,
          message: err.message,
          details: err.details,
        });

        // TASK-061: Handle authentication errors (401 → redirect to /signin)
        // Note: API client already handles redirect, but we set error for UI feedback
        if (err.code === ChatErrorCode.UNAUTHORIZED) {
          // Redirect is handled by API client
          setError({
            code: ChatErrorCode.UNAUTHORIZED,
            message: 'Your session has expired. Redirecting to sign in...',
          });
        }
      } else {
        // TASK-062: Handle network errors
        // TASK-064: Handle AI processing errors (500)
        setError({
          code: ChatErrorCode.NETWORK_ERROR,
          message: err.message || 'Failed to send message. Please try again.',
        });
      }
    } finally {
      setIsLoading(false); // TASK-048: Clear loading state
    }
  };

  /**
   * Retry sending the last failed message
   * TASK-067: Implement retry mechanism for failed messages
   */
  const handleRetry = () => {
    if (lastFailedMessage) {
      setInput(lastFailedMessage);
      setError(null);
      setLastFailedMessage(null);
      // User can now click send again
    }
  };

  /**
   * Handle conversation selection
   * TASK-073: Implement handleSelectConversation method
   * TASK-075: Implement conversation switching with message loading
   */
  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setError(null);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
    // Messages will be loaded by useEffect when activeConversationId changes
  };

  /**
   * Handle conversation deletion
   * TASK-076: Implement handleDeleteConversation method
   * TASK-079: Update conversation list after deletion
   * TASK-080: Clear active conversation if deleted conversation was active
   */
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await apiClient.deleteConversation(conversationId);

      // TASK-079: Update conversation list after deletion
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));

      // TASK-080: Clear active conversation if deleted conversation was active
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch (err: any) {
      setError({
        code: ChatErrorCode.CONVERSATION_DELETE_FAILED,
        message: err.message || 'Failed to delete conversation. Please try again.',
      });
    }
  };

  /**
   * Handle creating a new conversation
   * TASK-081: Implement handleCreateConversation method
   * TASK-083: Clear messages and activeConversationId on new conversation
   */
  const handleNewConversation = () => {
    // TASK-083: Clear messages and activeConversationId
    setActiveConversationId(null);
    setMessages([]);
    setInput('');
    setError(null);
    setLastFailedMessage(null);
    setIsSidebarOpen(false); // Close sidebar on mobile after creating new chat
  };

  return (
    <div className="flex h-full w-full bg-white relative">
      {/* TASK-086, TASK-087, TASK-088: Responsive layouts (mobile/tablet/desktop) */}
      {/* Mobile overlay sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      {/* Sidebar - TASK-074: Integrate ConversationList into ChatInterface */}
      <div
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-0
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onNewConversation={handleNewConversation}
          isLoading={isLoadingConversations}
        />
      </div>

      {/* Main chat area */}
      <div className="flex flex-col flex-1 h-full w-full lg:w-auto">
        {/* Header with sidebar toggle - TASK-089 */}
        <div className="border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Sidebar toggle button (mobile/tablet only) */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Toggle conversation list"
              aria-expanded={isSidebarOpen}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-lg lg:text-xl font-semibold text-gray-900">AI Assistant</h1>
              <p className="text-xs lg:text-sm text-gray-600">
                Manage your tasks through conversation
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <MessageList messages={messages} isLoading={isLoading} />

        {/* Error display */}
        {error && (
          <ErrorMessage
            message={error.message}
            code={error.code}
            onRetry={lastFailedMessage ? handleRetry : undefined}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Input */}
        <MessageInput
          value={input}
          onChange={setInput}
          onSend={handleSendMessage}
          disabled={isLoading}
          placeholder="Type a message to manage your tasks..."
        />
      </div>
    </div>
  );
}
