"""
Conversation entity model for conversational task management.

This module defines the Conversation SQLModel representing a chat session between
a user and the AI agent. Each conversation belongs to a single user and contains
multiple messages.
"""

from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from .user import User
    from .message import Message


class Conversation(SQLModel, table=True):
    """
    Conversation entity representing a chat session between user and AI agent.

    Each conversation belongs to a single user and contains multiple messages.
    The updated_at timestamp is automatically updated when new messages are added
    via a database trigger.

    Attributes:
        id: Unique conversation identifier (UUID, auto-generated)
        user_id: Owner of the conversation (UUID foreign key to users.id, indexed)
        title: Optional conversation title (max 100 chars, can be auto-generated)
        created_at: Timestamp when conversation was created (UTC, auto-generated)
        updated_at: Timestamp when conversation was last modified (UTC, auto-updated)
        user: Relationship to User model (many-to-one)
        messages: List of messages in this conversation (one-to-many, cascade delete)
    """
    __tablename__ = "conversations"

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        nullable=False,
        description="Unique conversation identifier"
    )

    user_id: UUID = Field(
        foreign_key="users.id",
        index=True,
        nullable=False,
        description="Owner of the conversation (UUID foreign key to users.id)"
    )

    title: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Optional conversation title (can be auto-generated from first message)"
    )

    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        description="Timestamp when conversation was created (UTC)"
    )

    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        index=True,
        description="Timestamp when conversation was last modified (UTC, auto-updated by trigger)"
    )

    # Relationships
    user: Optional["User"] = Relationship(back_populates="conversations")
    messages: List["Message"] = Relationship(
        back_populates="conversation",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
