/**
 * Chat Page - Main Chat Interface
 * Spec 5: ChatKit Frontend - Phase 3 (TASK-041)
 *
 * Integrates ChatInterface component for conversational task management
 */

import { Metadata } from 'next';
import ChatInterface from '@/components/chat/ChatInterface';

export const metadata: Metadata = {
  title: 'AI Chat | Task Manager',
  description: 'Manage your tasks through conversational AI',
};

export default function ChatPage() {
  return <ChatInterface />;
}
