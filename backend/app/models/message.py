"""
Message entity model for conversational task management.

This module defines the Message SQLModel representing an individual message
in a conversation. Messages can be from either the user or the AI assistant,
and assistant messages may include tool call information.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, TYPE_CHECKING
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from .conversation import Conversation


class MessageRole(str, Enum):
    """
    Enum representing the role of a message sender.

    Values:
        USER: Message sent by the user
        ASSISTANT: Message sent by the AI assistant
    """
    USER = "user"
    ASSISTANT = "assistant"


class Message(SQLModel, table=True):
    """
    Message entity representing an individual message in a conversation.

    Each message belongs to a single conversation and has a role (user or assistant).
    Messages are immutable after creation and ordered chronologically by created_at.
    Assistant messages may include tool_calls (JSON string) documenting tool invocations.

    Attributes:
        id: Unique message identifier (UUID, auto-generated)
        conversation_id: Parent conversation (UUID foreign key to conversations.id, indexed)
        role: Message sender role (enum: "user" or "assistant", required)
        content: Message text content (required, 1-10000 characters)
        tool_calls: Optional JSON string documenting tool invocations (assistant only)
        created_at: Timestamp when message was created (UTC, auto-generated, indexed)
        conversation: Relationship to Conversation model (many-to-one)
    """
    __tablename__ = "messages"

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        nullable=False,
        description="Unique message identifier"
    )

    conversation_id: UUID = Field(
        foreign_key="conversations.id",
        index=True,
        nullable=False,
        description="Parent conversation (UUID foreign key to conversations.id)"
    )

    role: MessageRole = Field(
        nullable=False,
        description="Message sender role (user or assistant)"
    )

    content: str = Field(
        min_length=1,
        max_length=10000,
        nullable=False,
        description="Message text content (1-10000 characters)"
    )

    tool_calls: Optional[str] = Field(
        default=None,
        description="Optional JSON string documenting tool invocations (assistant messages only)"
    )

    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        index=True,
        description="Timestamp when message was created (UTC)"
    )

    # Relationships
    conversation: Optional["Conversation"] = Relationship(back_populates="messages")
