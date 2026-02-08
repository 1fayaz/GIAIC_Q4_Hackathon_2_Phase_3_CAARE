"""
MCP Tool: update_task

Updates task title, description, and/or completion status for the authenticated user
with ownership enforcement. This tool is invoked by the AI agent to modify tasks
on behalf of users.
"""

import logging
from datetime import datetime
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.models.task import Task

# Configure logger
logger = logging.getLogger(__name__)


async def update_task(
    user_id: UUID,
    task_id: UUID,
    session: AsyncSession = None,
    title: Optional[str] = None,
    description: Optional[str] = None,
    completed: Optional[bool] = None
) -> dict:
    """
    Update task title, description, and/or completion status for the authenticated user.

    This MCP tool modifies a task in the database with proper validation
    and ownership enforcement. Only the task owner can update the task.
    Supports partial updates - only provided fields are modified.

    Args:
        user_id (UUID): ID of the authenticated user (provided by backend).
                       Only tasks belonging to this user can be updated.
        task_id (UUID): ID of the task to update. Must be a valid UUID.
        session (AsyncSession): Database session for executing queries.
                               Must be provided via dependency injection.
        title (str, optional): New task title (1-200 characters). If provided,
                              replaces the existing title.
        description (str, optional): New task description (max 1000 characters).
                                    If provided, replaces the existing description.
                                    Pass empty string to clear description.
        completed (bool, optional): New completion status. If provided,
                                   updates the task's completed flag.

    Returns:
        dict: Structured response containing either success data or error information.

        Success response format:
        {
            "success": True,
            "task_id": str (UUID),
            "title": str,
            "description": str or None,
            "completed": bool,
            "updated_at": str (ISO 8601 timestamp)
        }

        Error response format:
        {
            "success": False,
            "error": str (error code),
            "message": str (user-friendly error message)
        }

    Error Codes:
        - INVALID_INPUT: Title/description validation failed (empty, too long, etc.)
        - NO_CHANGES: No fields provided for update
        - TASK_NOT_FOUND: Task doesn't exist or doesn't belong to user
        - DATABASE_ERROR: Unable to update task in database
        - INTERNAL_ERROR: Unexpected error occurred

    Example:
        >>> result = await update_task(
        ...     user_id=UUID("550e8400-e29b-41d4-a716-446655440000"),
        ...     task_id=UUID("660e8400-e29b-41d4-a716-446655440001"),
        ...     title="Buy groceries and milk",
        ...     session=db_session
        ... )
        >>> print(result)
        {
            "success": True,
            "task_id": "660e8400-e29b-41d4-a716-446655440001",
            "title": "Buy groceries and milk",
            "description": "Milk, eggs, bread",
            "completed": False,
            "updated_at": "2026-02-08T11:30:00Z"
        }

    Security:
        - Task must belong to authenticated user
        - Returns 404-style error if task not found or unauthorized
        - No information leaked about existence of other users' tasks

    Validation:
        - At least one field (title, description, or completed) must be provided
        - Title must be 1-200 characters if provided
        - Description must be max 1000 characters if provided
        - Empty string for description clears the field
    """
    # Log tool invocation for auditability
    logger.info(
        f"MCP tool invoked: update_task",
        extra={
            "user_id": str(user_id),
            "tool": "update_task",
            "task_id": str(task_id),
            "has_title": title is not None,
            "has_description": description is not None,
            "has_completed": completed is not None,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

    try:
        # Validate session
        if session is None:
            logger.error("Database session not provided to update_task tool")
            return {
                "success": False,
                "error": "INTERNAL_ERROR",
                "message": "Database session not available. Please try again."
            }

        # Validate that at least one field is provided
        if title is None and description is None and completed is None:
            logger.warning(
                f"No fields provided for update",
                extra={
                    "user_id": str(user_id),
                    "task_id": str(task_id),
                    "tool": "update_task"
                }
            )
            return {
                "success": False,
                "error": "INVALID_INPUT",
                "message": "At least one field must be provided for update"
            }

        # Validate title if provided
        if title is not None:
            if len(title.strip()) == 0:
                return {
                    "success": False,
                    "error": "INVALID_INPUT",
                    "message": "Task title cannot be empty"
                }
            if len(title) > 200:
                return {
                    "success": False,
                    "error": "INVALID_INPUT",
                    "message": "Task title must be 200 characters or less"
                }

        # Validate description if provided
        if description is not None and len(description) > 1000:
            return {
                "success": False,
                "error": "INVALID_INPUT",
                "message": "Task description must be 1000 characters or less"
            }

        # Query task with user ownership enforcement
        # This ensures users can only update their own tasks
        query = select(Task).where(
            Task.id == task_id,
            Task.user_id == user_id
        )
        result = await session.execute(query)
        task = result.scalar_one_or_none()

        # Task not found or doesn't belong to user
        if task is None:
            logger.warning(
                f"Task not found or unauthorized update attempt",
                extra={
                    "user_id": str(user_id),
                    "task_id": str(task_id),
                    "tool": "update_task"
                }
            )
            return {
                "success": False,
                "error": "TASK_NOT_FOUND",
                "message": "Task not found or you don't have permission to update it"
            }

        # Update only the provided fields (partial update)
        if title is not None:
            task.title = title.strip()

        if description is not None:
            # Empty string clears the description
            task.description = description if description.strip() else None

        if completed is not None:
            task.completed = completed

        # Update timestamp (should happen automatically, but being explicit)
        task.updated_at = datetime.utcnow()

        # Commit changes to database
        await session.commit()
        await session.refresh(task)

        # Log success
        logger.info(
            f"Task updated successfully: {str(task.id)}",
            extra={
                "user_id": str(user_id),
                "task_id": str(task.id),
                "task_title": task.title,
                "tool": "update_task"
            }
        )

        # Return success response with updated task data
        return {
            "success": True,
            "task_id": str(task.id),
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
            "updated_at": task.updated_at.isoformat()
        }

    except SQLAlchemyError as e:
        # Database error
        logger.error(
            f"Database error in update_task: {str(e)}",
            extra={
                "user_id": str(user_id),
                "task_id": str(task_id),
                "tool": "update_task",
                "error_type": type(e).__name__
            },
            exc_info=True
        )
        await session.rollback()
        return {
            "success": False,
            "error": "DATABASE_ERROR",
            "message": "Unable to update task in database. Please try again."
        }

    except Exception as e:
        # Unexpected error
        logger.error(
            f"Unexpected error in update_task: {str(e)}",
            extra={
                "user_id": str(user_id),
                "task_id": str(task_id),
                "tool": "update_task",
                "error_type": type(e).__name__
            },
            exc_info=True
        )
        await session.rollback()
        return {
            "success": False,
            "error": "INTERNAL_ERROR",
            "message": "An unexpected error occurred. Please try again."
        }
