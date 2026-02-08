"""
Chat API routes for conversational task management.

This module provides REST API endpoints for AI-powered conversational task management
with JWT-based authentication and user data isolation. All endpoints require authentication
via JWT token in httpOnly cookie.

=== CONVERSATIONAL TASK MANAGEMENT (Phase 3) ===

This module implements the chat interface for the AI agent that can manage tasks through
natural language conversation. The agent uses OpenAI's GPT model with function calling
to invoke MCP tools for task operations.

**Architecture:**

1. **Chat Message Flow (T018)**:
   - User sends message to /api/chat/message
   - If no conversation_id provided, create new conversation
   - Load conversation history from database
   - Run AI agent with user message and history
   - Agent decides whether to use tools (add_task, list_tasks, etc.)
   - Save user message and assistant response to database
   - Return assistant response with tool call metadata

2. **Conversation Management (T019)**:
   - Create new conversations
   - List user's conversations (most recent first)
   - Get single conversation with full message history
   - Delete conversations (cascade deletes messages)

**Security:**
- All endpoints require JWT authentication
- Conversations are scoped to authenticated user
- Users can only access their own conversations
- Return 404 (not 403) for unauthorized access to prevent information leakage

**Data Isolation:**
- Every conversation is owned by a user (user_id foreign key)
- All queries filter by current_user.id
- Agent operations are scoped to current user's tasks
"""

import os
import logging
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import get_session
from app.models.user import User
from app.models.message import MessageRole
from app.dependencies.auth import get_current_user
from app.schemas.chat import (
    ChatMessageRequest,
    ConversationCreateRequest,
    ConversationResponse,
    MessageResponse,
    ChatMessageResponse
)
from app.schemas.response import success_response
from app.services.conversation_service import (
    create_conversation,
    get_conversation,
    list_conversations,
    delete_conversation,
    add_message,
    get_conversation_history
)
from app.agent.runner import AgentRunner

# Configure logger
logger = logging.getLogger(__name__)

# Create router with prefix and tags
router = APIRouter(
    prefix="/api/chat",
    tags=["chat"]
)

# Initialize agent runner (lazy initialization to avoid startup errors)
_agent_runner: Optional[AgentRunner] = None


def get_agent_runner() -> AgentRunner:
    """
    Get or initialize the agent runner instance.

    Lazy initialization ensures OPENAI_API_KEY is loaded from environment
    only when needed, avoiding startup errors if key is missing.
    Supports custom base URLs (e.g., Qwen, Azure OpenAI) via OPENAI_BASE_URL.

    Returns:
        AgentRunner: Initialized agent runner instance

    Raises:
        HTTPException: 500 if OPENAI_API_KEY is not configured
    """
    global _agent_runner

    if _agent_runner is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.error("OPENAI_API_KEY not configured in environment")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI agent not configured. Please contact administrator."
            )

        # Optional: Custom base URL for API compatibility (Qwen, Azure, etc.)
        base_url = os.getenv("OPENAI_BASE_URL")

        # Optional: Custom model name
        model = os.getenv("OPENAI_MODEL")

        _agent_runner = AgentRunner(
            api_key=api_key,
            base_url=base_url,
            model=model
        )

        logger.info(
            "Agent runner initialized successfully",
            extra={
                "base_url": base_url or "default (OpenAI)",
                "model": model or "default (from config)"
            }
        )

    return _agent_runner


@router.post(
    "/message",
    status_code=status.HTTP_200_OK,
    response_model=ChatMessageResponse,
    summary="Send message to AI agent",
    description="Send a message to the AI agent for conversational task management. Creates new conversation if conversation_id not provided."
)
async def send_message(
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> ChatMessageResponse:
    """
    Send a message to the AI agent for conversational task management.

    This endpoint orchestrates the full conversational flow:
    1. Create new conversation if conversation_id not provided
    2. Load conversation history from database
    3. Run AI agent with user message and history
    4. Save user message to database
    5. Save assistant response to database (with tool_calls)
    6. Return assistant response with tool call metadata

    The AI agent can invoke MCP tools to manage tasks (add, list, update, delete, complete).
    All tool operations are scoped to the authenticated user's tasks.

    Args:
        request: ChatMessageRequest with message content and optional conversation_id
        current_user: Authenticated user from JWT token (injected dependency)
        session: Database session (injected dependency)

    Returns:
        ChatMessageResponse: Agent response with message, tool_calls, and conversation_id

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 404 if conversation_id provided but not found or doesn't belong to user
        HTTPException: 500 if agent execution or database operation fails

    Example:
        POST /api/chat/message
        {
            "content": "Add a task to buy groceries tomorrow"
        }

        Response (200):
        {
            "message": "I've added a task to buy groceries to your task list.",
            "tool_calls": [
                {
                    "tool": "add_task",
                    "parameters": {"title": "Buy groceries", "description": "Tomorrow"},
                    "result": {"success": true, "data": {...}},
                    "timestamp": "2026-02-08T10:30:00Z",
                    "success": true,
                    "error": null
                }
            ],
            "conversation_id": "660e8400-e29b-41d4-a716-446655440001"
        }
    """
    try:
        # Get or create conversation
        conversation_id = request.conversation_id
        if conversation_id:
            # Verify conversation exists and belongs to user
            conversation = await get_conversation(session, conversation_id, current_user.id)
            if not conversation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found"
                )
        else:
            # Create new conversation with auto-generated title
            conversation = await create_conversation(
                session,
                user_id=current_user.id,
                title=None  # Will be auto-generated from first message
            )
            conversation_id = conversation.id

            logger.info(
                "New conversation created",
                extra={
                    "user_id": str(current_user.id),
                    "conversation_id": str(conversation_id)
                }
            )

        # Load conversation history (for agent context)
        messages = await get_conversation_history(session, conversation_id, current_user.id)

        # Convert messages to agent format (role + content)
        conversation_history = [
            {"role": msg.role.value, "content": msg.content}
            for msg in messages
        ]

        # Truncate history if too long (max 50 messages as per requirements)
        MAX_HISTORY_MESSAGES = 50
        if len(conversation_history) > MAX_HISTORY_MESSAGES:
            conversation_history = conversation_history[-MAX_HISTORY_MESSAGES:]
            logger.info(
                "Conversation history truncated",
                extra={
                    "user_id": str(current_user.id),
                    "conversation_id": str(conversation_id),
                    "original_length": len(messages),
                    "truncated_length": len(conversation_history)
                }
            )

        # Get agent runner
        agent_runner = get_agent_runner()

        # Run agent with user message and history
        agent_result = await agent_runner.run(
            user_id=current_user.id,
            message=request.content,
            conversation_history=conversation_history,
            session=session
        )

        # Check if agent execution was successful
        if not agent_result.get("success"):
            logger.error(
                "Agent execution failed",
                extra={
                    "user_id": str(current_user.id),
                    "conversation_id": str(conversation_id),
                    "error": agent_result.get("error")
                }
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=agent_result.get("response", "Agent execution failed")
            )

        # Save user message to database
        await add_message(
            session,
            conversation_id=conversation_id,
            role=MessageRole.USER,
            content=request.content,
            tool_calls=None
        )

        # Save assistant response to database (with tool_calls)
        await add_message(
            session,
            conversation_id=conversation_id,
            role=MessageRole.ASSISTANT,
            content=agent_result["response"],
            tool_calls=agent_result.get("tool_calls")
        )

        logger.info(
            "Chat message processed successfully",
            extra={
                "user_id": str(current_user.id),
                "conversation_id": str(conversation_id),
                "tool_calls_count": len(agent_result.get("tool_calls", []))
            }
        )

        # Return agent response
        return ChatMessageResponse(
            message=agent_result["response"],
            tool_calls=agent_result.get("tool_calls"),
            conversation_id=conversation_id
        )

    except HTTPException:
        # Re-raise HTTPException without wrapping
        raise
    except SQLAlchemyError as e:
        await session.rollback()
        logger.error(
            "Database error in send_message",
            extra={
                "user_id": str(current_user.id),
                "error_type": type(e).__name__,
                "error": str(e)
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error: Failed to process message"
        )
    except Exception as e:
        await session.rollback()
        logger.error(
            "Unexpected error in send_message",
            extra={
                "user_id": str(current_user.id),
                "error_type": type(e).__name__,
                "error": str(e)
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post(
    "/conversations",
    status_code=status.HTTP_201_CREATED,
    summary="Create a new conversation",
    description="Creates a new conversation for the authenticated user with optional title"
)
async def create_new_conversation(
    request: ConversationCreateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> dict:
    """
    Create a new conversation for the authenticated user.

    Creates a new conversation entity with optional title. If no title is provided,
    it can be auto-generated later from the first user message.

    Args:
        request: ConversationCreateRequest with optional title
        current_user: Authenticated user from JWT token (injected dependency)
        session: Database session (injected dependency)

    Returns:
        dict: Standardized success response with created conversation data

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 500 if database operation fails

    Example:
        POST /api/chat/conversations
        {
            "title": "Task Management Session"
        }

        Response (201):
        {
            "success": true,
            "data": {
                "id": "660e8400-e29b-41d4-a716-446655440001",
                "user_id": "770e8400-e29b-41d4-a716-446655440002",
                "title": "Task Management Session",
                "created_at": "2026-02-08T10:00:00Z",
                "updated_at": "2026-02-08T10:00:00Z",
                "messages": null
            },
            "message": "Conversation created successfully"
        }
    """
    try:
        # Create new conversation
        conversation = await create_conversation(
            session,
            user_id=current_user.id,
            title=request.title
        )

        logger.info(
            "Conversation created",
            extra={
                "user_id": str(current_user.id),
                "conversation_id": str(conversation.id),
                "title": request.title
            }
        )

        # Return standardized success response
        return success_response(
            data=ConversationResponse.model_validate(conversation).model_dump(),
            message="Conversation created successfully"
        )

    except SQLAlchemyError as e:
        await session.rollback()
        logger.error(
            "Database error in create_new_conversation",
            extra={
                "user_id": str(current_user.id),
                "error_type": type(e).__name__,
                "error": str(e)
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error: Failed to create conversation"
        )
    except Exception as e:
        await session.rollback()
        logger.error(
            "Unexpected error in create_new_conversation",
            extra={
                "user_id": str(current_user.id),
                "error_type": type(e).__name__,
                "error": str(e)
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get(
    "/conversations",
    status_code=status.HTTP_200_OK,
    summary="List user's conversations",
    description="Retrieves all conversations belonging to the authenticated user, ordered by most recent activity"
)
async def list_user_conversations(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> dict:
    """
    List all conversations for the authenticated user.

    Retrieves conversations owned by the authenticated user, sorted by updated_at
    in descending order (most recent first). Supports pagination via limit parameter.

    Args:
        limit: Maximum number of conversations to return (default 50, max 100)
        current_user: Authenticated user from JWT token (injected dependency)
        session: Database session (injected dependency)

    Returns:
        dict: Standardized success response with list of conversations

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 422 if limit is invalid
        HTTPException: 500 if database operation fails

    Example:
        GET /api/chat/conversations?limit=20

        Response (200):
        {
            "success": true,
            "data": [
                {
                    "id": "660e8400-e29b-41d4-a716-446655440001",
                    "user_id": "770e8400-e29b-41d4-a716-446655440002",
                    "title": "Task Management Session",
                    "created_at": "2026-02-08T10:00:00Z",
                    "updated_at": "2026-02-08T10:30:00Z",
                    "messages": null
                }
            ],
            "message": "Conversations retrieved successfully"
        }
    """
    try:
        # Validate limit parameter
        if limit < 1 or limit > 100:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Limit must be between 1 and 100"
            )

        # List conversations for user
        conversations = await list_conversations(
            session,
            user_id=current_user.id,
            limit=limit
        )

        logger.info(
            "Conversations listed",
            extra={
                "user_id": str(current_user.id),
                "count": len(conversations),
                "limit": limit
            }
        )

        # Return standardized success response
        return success_response(
            data=[
                ConversationResponse.model_validate(conv).model_dump()
                for conv in conversations
            ],
            message="Conversations retrieved successfully"
        )

    except HTTPException:
        # Re-raise HTTPException without wrapping
        raise
    except SQLAlchemyError as e:
        logger.error(
            "Database error in list_user_conversations",
            extra={
                "user_id": str(current_user.id),
                "error_type": type(e).__name__,
                "error": str(e)
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error: Failed to retrieve conversations"
        )
    except Exception as e:
        logger.error(
            "Unexpected error in list_user_conversations",
            extra={
                "user_id": str(current_user.id),
                "error_type": type(e).__name__,
                "error": str(e)
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_200_OK,
    summary="Get a single conversation with messages",
    description="Retrieves a specific conversation by ID with full message history. Returns 404 if conversation doesn't exist or belongs to a different user"
)
async def get_single_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> dict:
    """
    Get a single conversation by ID with full message history.

    Retrieves a conversation with all its messages in chronological order.
    Verifies that the conversation belongs to the authenticated user.

    Args:
        conversation_id: Conversation identifier from path parameter
        current_user: Authenticated user from JWT token (injected dependency)
        session: Database session (injected dependency)

    Returns:
        dict: Standardized success response with conversation data and messages

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 404 if conversation not found or belongs to different user
        HTTPException: 500 if database operation fails

    Security:
        Returns 404 (not 403) for unauthorized access to prevent information leakage

    Example:
        GET /api/chat/conversations/660e8400-e29b-41d4-a716-446655440001

        Response (200):
        {
            "success": true,
            "data": {
                "id": "660e8400-e29b-41d4-a716-446655440001",
                "user_id": "770e8400-e29b-41d4-a716-446655440002",
                "title": "Task Management Session",
                "created_at": "2026-02-08T10:00:00Z",
                "updated_at": "2026-02-08T10:30:00Z",
                "messages": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "conversation_id": "660e8400-e29b-41d4-a716-446655440001",
                        "role": "user",
                        "content": "Add a task to buy groceries",
                        "tool_calls": null,
                        "created_at": "2026-02-08T10:30:00Z"
                    }
                ]
            },
            "message": "Conversation retrieved successfully"
        }
    """
    try:
        # Get conversation with ownership verification
        conversation = await get_conversation(session, conversation_id, current_user.id)

        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )

        # Load messages for conversation
        messages = await get_conversation_history(session, conversation_id, current_user.id)

        logger.info(
            "Conversation retrieved",
            extra={
                "user_id": str(current_user.id),
                "conversation_id": str(conversation_id),
                "message_count": len(messages)
            }
        )

        # Build response with messages
        conversation_data = ConversationResponse.model_validate(conversation).model_dump()
        conversation_data["messages"] = [
            MessageResponse.model_validate(msg).model_dump()
            for msg in messages
        ]

        # Return standardized success response
        return success_response(
            data=conversation_data,
            message="Conversation retrieved successfully"
        )

    except HTTPException:
        # Re-raise HTTPException without wrapping
        raise
    except SQLAlchemyError as e:
        logger.error(
            "Database error in get_single_conversation",
            extra={
                "user_id": str(current_user.id),
                "conversation_id": str(conversation_id),
                "error_type": type(e).__name__,
                "error": str(e)
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error: Failed to retrieve conversation"
        )
    except Exception as e:
        logger.error(
            "Unexpected error in get_single_conversation",
            extra={
                "user_id": str(current_user.id),
                "conversation_id": str(conversation_id),
                "error_type": type(e).__name__,
                "error": str(e)
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a conversation",
    description="Permanently deletes a conversation and all its messages. Returns 404 if conversation not found or belongs to different user"
)
async def delete_user_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> dict:
    """
    Delete a conversation permanently for the authenticated user.

    Deletes a conversation and all its messages (cascade delete) only if it
    belongs to the authenticated user. Returns 404 if conversation doesn't exist
    or doesn't belong to the user.

    Args:
        conversation_id: Conversation identifier from path parameter
        current_user: Authenticated user from JWT token (injected dependency)
        session: Database session (injected dependency)

    Returns:
        dict: Standardized success response

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 404 if conversation not found or belongs to different user
        HTTPException: 500 if database operation fails

    Security:
        Returns 404 (not 403) for unauthorized access to prevent information leakage

    Side Effects:
        Cascades to delete all messages in the conversation

    Example:
        DELETE /api/chat/conversations/660e8400-e29b-41d4-a716-446655440001

        Response (200):
        {
            "success": true,
            "data": {
                "id": "660e8400-e29b-41d4-a716-446655440001"
            },
            "message": "Conversation deleted successfully"
        }
    """
    try:
        # Delete conversation with ownership verification
        deleted = await delete_conversation(session, conversation_id, current_user.id)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )

        logger.info(
            "Conversation deleted",
            extra={
                "user_id": str(current_user.id),
                "conversation_id": str(conversation_id)
            }
        )

        # Return standardized success response
        return success_response(
            data={"id": str(conversation_id)},
            message="Conversation deleted successfully"
        )

    except HTTPException:
        # Re-raise HTTPException without wrapping
        raise
    except SQLAlchemyError as e:
        await session.rollback()
        logger.error(
            "Database error in delete_user_conversation",
            extra={
                "user_id": str(current_user.id),
                "conversation_id": str(conversation_id),
                "error_type": type(e).__name__,
                "error": str(e)
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error: Failed to delete conversation"
        )
    except Exception as e:
        await session.rollback()
        logger.error(
            "Unexpected error in delete_user_conversation",
            extra={
                "user_id": str(current_user.id),
                "conversation_id": str(conversation_id),
                "error_type": type(e).__name__,
                "error": str(e)
            },
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
