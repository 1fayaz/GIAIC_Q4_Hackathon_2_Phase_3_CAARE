"""
User entity model for authentication and user management.

This module defines the User SQLModel representing an authenticated user account
in the database. Each user can own multiple tasks and contains authentication
credentials and audit timestamps.
"""

from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from .task import Task


class User(SQLModel, table=True):
    """
    User entity representing an authenticated user account.

    Each user has a unique email address used for authentication and can own
    multiple tasks. Passwords are stored as bcrypt hashes for security.

    Attributes:
        id: Unique user identifier (UUID, auto-generated)
        email: User's email address (unique, indexed, max 255 chars)
        hashed_password: Bcrypt-hashed password (never store plain text, max 255 chars)
        created_at: Timestamp when user account was created (UTC, auto-generated)
        updated_at: Timestamp when user account was last modified (UTC, auto-updated)
        tasks: List of tasks owned by this user (one-to-many relationship)
    """
    __tablename__ = "users"

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
        nullable=False,
        description="Unique user identifier"
    )

    email: str = Field(
        unique=True,
        index=True,
        nullable=False,
        max_length=255,
        description="User's email address (used for login)"
    )

    hashed_password: str = Field(
        nullable=False,
        max_length=255,
        description="Bcrypt-hashed password (never store plain text)"
    )

    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        description="Timestamp when user account was created (UTC)"
    )

    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": datetime.utcnow},
        description="Timestamp when user account was last modified (UTC)"
    )

    # Relationship to tasks (one-to-many)
    tasks: List["Task"] = Relationship(back_populates="user")
