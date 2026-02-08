"""
Task entity model for task management system.

This module defines the Task SQLModel representing a todo item in the database.
Each task belongs to a single user and contains task content, completion status,
and audit timestamps.
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from .user import User


class Task(SQLModel, table=True):
    """
    Task entity representing a todo item.

    Each task belongs to a single user and contains task content,
    completion status, and audit timestamps.

    Attributes:
        id: Unique task identifier (UUID, auto-generated)
        user_id: Owner of the task (UUID foreign key to users.id, indexed for filtering)
        title: Task title/summary (required, max 200 chars)
        description: Detailed task description (optional, max 1000 chars)
        completed: Task completion status (default: False)
        created_at: Timestamp when task was created (UTC, auto-generated)
        updated_at: Timestamp when task was last modified (UTC, auto-updated)
        user: Relationship to User model (many-to-one)
    """
    __tablename__ = "tasks"

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        nullable=False,
        description="Unique task identifier"
    )

    user_id: UUID = Field(
        foreign_key="users.id",
        index=True,
        nullable=False,
        description="Owner of the task (UUID foreign key to users.id)"
    )

    title: str = Field(
        nullable=False,
        max_length=200,
        description="Task title/summary"
    )

    description: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Detailed task description"
    )

    completed: bool = Field(
        default=False,
        nullable=False,
        description="Task completion status"
    )

    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        description="Timestamp when task was created (UTC)"
    )

    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": datetime.utcnow},
        description="Timestamp when task was last modified (UTC)"
    )

    # Relationship to user (many-to-one)
    user: Optional["User"] = Relationship(back_populates="tasks")
