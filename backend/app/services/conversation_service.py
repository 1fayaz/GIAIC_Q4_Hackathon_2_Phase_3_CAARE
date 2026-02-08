"""
Conversation service layer for conversational task management.

This module provides async CRUD operations for conversations and messages,
enforcing user ownership and proper data access patterns. All operations
use async database sessions and include proper error handling.
"""

import json
from typing import Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from fastapi import HTTPException, status

from app.models.conversation import Conversation
from app.models.message import Message, MessageRole


async def create_conversation(
    session: AsyncSession,
    user_id: UUID,
    title: Optional[str] = None
) -> Conversation:
    """
    Create a new conversation for a user.

    Creates a new conversation entity with optional title. If no title is provided,
    it can be auto-generated later from the first user message.

    Args:
        session: Async database session
        user_id: UUID of the user creating the conversation
        title: Optional conversation title (max 100 chars)

    Returns:
        Conversation: The newly created conversation with generated ID and timestamps

    Example:
        conversation = await create_conversation(session, user_id, "Task Planning")
    """
    conversation = Conversation(user_id=user_id, title=title)
    session.add(conversation)
    await session.commit()
    await session.refresh(conversation)
    return conversation


async def get_conversation(
    session: AsyncSession,
    conversation_id: UUID,
    user_id: UUID
) -> Optional[Conversation]:
    """
    Get a single conversation by ID with ownership verification.

    Retrieves a conversation only if it belongs to the specified user.
    Returns None if conversation doesn't exist or doesn't belong to the user.

    Args:
        session: Async database session
        conversation_id: UUID of the conversation to retrieve
        user_id: UUID of the user requesting the conversation

    Returns:
        Conversation | None: The conversation if found and owned by user, None otherwise

    Security:
        Enforces user ownership - users can only access their own conversations

    Example:
        conversation = await get_conversation(session, conv_id, user_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    """
    conversation = await session.get(Conversation, conversation_id)

    # Verify ownership
    if not conversation or conversation.user_id != user_id:
        return None

    return conversation


async def list_conversations(
    session: AsyncSession,
    user_id: UUID,
    limit: int = 50
) -> List[Conversation]:
    """
    List all conversations for a user, ordered by most recent activity.

    Retrieves conversations owned by the specified user, sorted by updated_at
    in descending order (most recent first). Supports pagination via limit.

    Args:
        session: Async database session
        user_id: UUID of the user whose conversations to list
        limit: Maximum number of conversations to return (default 50)

    Returns:
        list[Conversation]: List of conversations ordered by updated_at DESC

    Security:
        Only returns conversations owned by the specified user

    Example:
        conversations = await list_conversations(session, user_id, limit=20)
    """
    statement = (
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
        .limit(limit)
    )

    result = await session.exec(statement)
    return result.all()


async def delete_conversation(
    session: AsyncSession,
    conversation_id: UUID,
    user_id: UUID
) -> bool:
    """
    Delete a conversation with ownership verification.

    Deletes a conversation and all its messages (cascade delete) only if it
    belongs to the specified user. Returns False if conversation doesn't exist
    or doesn't belong to the user.

    Args:
        session: Async database session
        conversation_id: UUID of the conversation to delete
        user_id: UUID of the user requesting deletion

    Returns:
        bool: True if conversation was deleted, False if not found or unauthorized

    Security:
        Enforces user ownership - users can only delete their own conversations

    Side Effects:
        Cascades to delete all messages in the conversation

    Example:
        deleted = await delete_conversation(session, conv_id, user_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Conversation not found")
    """
    conversation = await session.get(Conversation, conversation_id)

    # Verify ownership
    if not conversation or conversation.user_id != user_id:
        return False

    await session.delete(conversation)
    await session.commit()
    return True


async def add_message(
    session: AsyncSession,
    conversation_id: UUID,
    role: MessageRole,
    content: str,
    tool_calls: Optional[List[dict]] = None
) -> Message:
    """
    Add a new message to a conversation.

    Creates a new message in the specified conversation. Tool calls (if provided)
    are serialized to JSON string. The conversation's updated_at timestamp is
    automatically updated via database trigger.

    Args:
        session: Async database session
        conversation_id: UUID of the parent conversation
        role: Message sender role (USER or ASSISTANT)
        content: Message text content (1-10000 chars)
        tool_calls: Optional list of tool invocation records (assistant only)

    Returns:
        Message: The newly created message with generated ID and timestamp

    Validation:
        - content must be 1-10000 characters
        - tool_calls only allowed for assistant messages
        - conversation_id must reference existing conversation

    Side Effects:
        Updates parent conversation's updated_at timestamp via trigger

    Example:
        message = await add_message(
            session,
            conv_id,
            MessageRole.USER,
            "Add a task to buy groceries",
            None
        )
    """
    message = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
        tool_calls=json.dumps(tool_calls) if tool_calls else None
    )

    session.add(message)
    await session.commit()
    await session.refresh(message)
    return message


async def get_conversation_history(
    session: AsyncSession,
    conversation_id: UUID,
    user_id: UUID
) -> List[Message]:
    """
    Get all messages in a conversation with ownership verification.

    Retrieves all messages in chronological order (by created_at) for the
    specified conversation. Verifies that the conversation belongs to the
    specified user before loading messages.

    Args:
        session: Async database session
        conversation_id: UUID of the conversation
        user_id: UUID of the user requesting the history

    Returns:
        list[Message]: List of messages ordered by created_at ASC

    Raises:
        HTTPException: 404 if conversation not found or doesn't belong to user

    Security:
        Enforces user ownership - verifies conversation belongs to user before
        loading messages to prevent unauthorized access to conversation data

    Example:
        try:
            messages = await get_conversation_history(session, conv_id, user_id)
        except HTTPException as e:
            # Handle 404 - conversation not found or unauthorized
            pass
    """
    # Verify ownership first
    conversation = await session.get(Conversation, conversation_id)
    if not conversation or conversation.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # Load messages in chronological order
    statement = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )

    result = await session.exec(statement)
    return result.all()
