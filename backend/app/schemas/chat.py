"""
Pydantic schemas for Chat API request/response validation.

This module defines the data transfer objects (DTOs) for conversational task
management endpoints, providing strict validation, type checking, and serialization
for chat messages, conversations, and AI agent responses.
"""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, ConfigDict
from app.models.message import MessageRole


class ChatMessageRequest(BaseModel):
    """
    Request schema for sending a user message to the AI agent.

    Validates user message input with strict constraints on content length.
    Ensures content is not empty or whitespace-only. Optionally includes
    conversation_id to continue an existing conversation.

    Attributes:
        content: User's message text (required, 1-10000 chars, non-empty)
        conversation_id: Optional conversation ID to continue existing conversation
    """

    content: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="User's message text (required, non-empty)"
    )
    conversation_id: Optional[UUID] = Field(
        default=None,
        description="Optional conversation ID to continue existing conversation (creates new if not provided)"
    )

    @field_validator("content")
    @classmethod
    def validate_content_not_empty(cls, v: str) -> str:
        """
        Validate that content is not empty or whitespace-only.

        Strips leading/trailing whitespace and ensures the result is non-empty.

        Args:
            v: The content string to validate

        Returns:
            The stripped content string

        Raises:
            ValueError: If content is empty or contains only whitespace
        """
        stripped = v.strip()
        if not stripped:
            raise ValueError("Message content cannot be empty or contain only whitespace")
        return stripped

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "content": "Add a task to buy groceries tomorrow",
                "conversation_id": "660e8400-e29b-41d4-a716-446655440001"
            }
        }
    )


class ConversationCreateRequest(BaseModel):
    """
    Request schema for creating a new conversation.

    Validates conversation creation data with optional title.
    If title is provided, ensures it is not empty or whitespace-only.

    Attributes:
        title: Optional conversation title (max 100 chars, non-empty if provided)
    """

    title: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Optional conversation title (auto-generated if not provided)"
    )

    @field_validator("title")
    @classmethod
    def validate_title_not_empty(cls, v: Optional[str]) -> Optional[str]:
        """
        Validate that title (if provided) is not empty or whitespace-only.

        Strips leading/trailing whitespace and ensures the result is non-empty.

        Args:
            v: The title string to validate (or None)

        Returns:
            The stripped title string or None

        Raises:
            ValueError: If title is provided but empty or contains only whitespace
        """
        if v is None:
            return v
        stripped = v.strip()
        if not stripped:
            raise ValueError("Title cannot be empty or contain only whitespace")
        return stripped

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Task Management Session"
            }
        }
    )


class MessageResponse(BaseModel):
    """
    Response schema for message data returned by API endpoints.

    Represents a single message in a conversation with all fields including
    role, content, and optional tool calls. Configured to work with SQLModel
    ORM objects.

    Attributes:
        id: Unique message identifier (UUID)
        conversation_id: Parent conversation identifier (UUID)
        role: Message sender role (user or assistant)
        content: Message text content
        tool_calls: Optional JSON string documenting tool invocations (assistant only)
        created_at: Timestamp when message was created (UTC)
    """

    id: UUID = Field(description="Unique message identifier")
    conversation_id: UUID = Field(description="Parent conversation identifier")
    role: MessageRole = Field(description="Message sender role (user or assistant)")
    content: str = Field(description="Message text content")
    tool_calls: Optional[str] = Field(
        default=None,
        description="Optional JSON string documenting tool invocations (assistant messages only)"
    )
    created_at: datetime = Field(description="Timestamp when message was created (UTC)")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "conversation_id": "660e8400-e29b-41d4-a716-446655440001",
                "role": "user",
                "content": "Add a task to buy groceries",
                "tool_calls": None,
                "created_at": "2026-02-08T10:30:00Z"
            }
        }
    )


class ConversationResponse(BaseModel):
    """
    Response schema for conversation data returned by API endpoints.

    Represents a conversation with all fields including optional messages list.
    When messages are included, they are ordered chronologically by created_at.
    Configured to work with SQLModel ORM objects.

    Attributes:
        id: Unique conversation identifier (UUID)
        user_id: Owner of the conversation (user identifier)
        title: Optional conversation title
        created_at: Timestamp when conversation was created (UTC)
        updated_at: Timestamp when conversation was last modified (UTC)
        messages: Optional list of messages in chronological order
    """

    id: UUID = Field(description="Unique conversation identifier")
    user_id: UUID = Field(description="Owner of the conversation (user identifier)")
    title: Optional[str] = Field(description="Optional conversation title")
    created_at: datetime = Field(description="Timestamp when conversation was created (UTC)")
    updated_at: datetime = Field(description="Timestamp when conversation was last modified (UTC)")
    messages: Optional[List[MessageResponse]] = Field(
        default=None,
        description="Optional list of messages in chronological order"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
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
                        "tool_calls": None,
                        "created_at": "2026-02-08T10:30:00Z"
                    }
                ]
            }
        }
    )


class ChatMessageResponse(BaseModel):
    """
    Response schema for AI agent responses to user messages.

    Returned after the AI agent processes a user message. Contains the agent's
    response message, optional tool calls documentation, and the conversation ID.

    Attributes:
        message: AI agent's response message text
        tool_calls: Optional list of tool invocations performed by the agent
        conversation_id: Conversation identifier where this exchange occurred
    """

    message: str = Field(description="AI agent's response message text")
    tool_calls: Optional[List[dict]] = Field(
        default=None,
        description="Optional list of tool invocations performed by the agent"
    )
    conversation_id: UUID = Field(description="Conversation identifier where this exchange occurred")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": "I've added a task to buy groceries to your task list.",
                "tool_calls": [
                    {
                        "tool": "add_task",
                        "parameters": {
                            "title": "Buy groceries",
                            "description": None
                        },
                        "result": {
                            "task_id": "880e8400-e29b-41d4-a716-446655440003",
                            "title": "Buy groceries",
                            "created_at": "2026-02-08T10:30:00Z"
                        },
                        "timestamp": "2026-02-08T10:30:00Z",
                        "success": True,
                        "error": None
                    }
                ],
                "conversation_id": "660e8400-e29b-41d4-a716-446655440001"
            }
        }
    )
