"""
Pydantic schemas for Task API request/response validation.

This module defines the data transfer objects (DTOs) for task-related API endpoints,
providing strict validation, type checking, and serialization for all task operations.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, ConfigDict


class TaskCreate(BaseModel):
    """
    Request schema for creating a new task.

    Validates task creation data with strict constraints on title and description.
    Ensures title is not empty or whitespace-only.

    Attributes:
        title: Task title/summary (required, 1-200 chars, non-empty)
        description: Detailed task description (optional, max 1000 chars)
    """

    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Task title/summary (required, non-empty)"
    )

    description: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Detailed task description (optional)"
    )

    @field_validator("title")
    @classmethod
    def validate_title_not_empty(cls, v: str) -> str:
        """
        Validate that title is not empty or whitespace-only.

        Strips leading/trailing whitespace and ensures the result is non-empty.

        Args:
            v: The title string to validate

        Returns:
            The stripped title string

        Raises:
            ValueError: If title is empty or contains only whitespace
        """
        stripped = v.strip()
        if not stripped:
            raise ValueError("Title cannot be empty or contain only whitespace")
        return stripped


class TaskUpdate(BaseModel):
    """
    Request schema for updating an existing task.

    All fields are optional to support partial updates. Validates that title
    (if provided) is not empty or whitespace-only.

    Attributes:
        title: Updated task title (optional, 1-200 chars, non-empty)
        description: Updated task description (optional, max 1000 chars)
        completed: Updated completion status (optional)
    """

    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=200,
        description="Updated task title (optional, non-empty)"
    )

    description: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Updated task description (optional)"
    )

    completed: Optional[bool] = Field(
        default=None,
        description="Updated completion status (optional)"
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


class TaskResponse(BaseModel):
    """
    Response schema for task data returned by API endpoints.

    Represents the complete task entity with all fields including metadata.
    Configured to work with SQLModel ORM objects.

    Attributes:
        id: Unique task identifier (UUID)
        user_id: Owner of the task (user identifier)
        title: Task title/summary
        description: Detailed task description (optional)
        completed: Task completion status
        created_at: Timestamp when task was created (UTC)
        updated_at: Timestamp when task was last modified (UTC)
    """

    id: UUID = Field(description="Unique task identifier")
    user_id: UUID = Field(description="Owner of the task (user identifier)")
    title: str = Field(description="Task title/summary")
    description: Optional[str] = Field(description="Detailed task description")
    completed: bool = Field(description="Task completion status")
    created_at: datetime = Field(description="Timestamp when task was created (UTC)")
    updated_at: datetime = Field(description="Timestamp when task was last modified (UTC)")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "user_id": "user123",
                "title": "Complete project documentation",
                "description": "Write comprehensive API documentation with examples",
                "completed": False,
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:30:00Z"
            }
        }
    )
