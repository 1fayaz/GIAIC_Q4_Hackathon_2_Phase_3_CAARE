/**
 * Specific Conversation Page
 * Spec 5: ChatKit Frontend - Phase 4 (TASK-056)
 *
 * Dynamic route for viewing a specific conversation
 * Loads the conversation and displays it in ChatInterface
 */

import { Metadata } from 'next';
import ChatInterface from '@/components/chat/ChatInterface';

interface ConversationPageProps {
  params: {
    conversationId: string;
  };
}

export async function generateMetadata({ params }: ConversationPageProps): Promise<Metadata> {
  return {
    title: `Conversation | Task Manager`,
    description: 'View and continue your conversation with the AI assistant',
  };
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = params;

  return <ChatInterface initialConversationId={conversationId} />;
}

