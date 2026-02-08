"""
MCP Tool: add_task

Creates a new task for the authenticated user with validation and ownership enforcement.
This tool is invoked by the AI agent to add tasks on behalf of users.
"""

import logging
from datetime import datetime
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError

from app.models.task import Task

# Configure logger
logger = logging.getLogger(__name__)


async def add_task(
    user_id: UUID,
    title: str,
    description: str | None = None,
    session: AsyncSession = None
) -> dict:
    """
    Create a new task for the authenticated user.

    This MCP tool creates a task in the database with proper validation and
    ownership enforcement. All tasks are automatically assigned to the authenticated
    user, preventing cross-user task creation.

    Args:
        user_id (UUID): ID of the authenticated user (provided by backend).
                       Task will be assigned to this user.
        title (str): Task title or description. Must be between 1 and 200 characters.
        description (str | None, optional): Optional detailed description of the task.
                                           Maximum 1000 characters. Defaults to None.
        session (AsyncSession): Database session for executing queries.
                               Must be provided via dependency injection.

    Returns:
        dict: Structured response containing either success data or error information.

        Success response format:
        {
            "success": True,
            "task_id": str (UUID),
            "title": str,
            "created_at": str (ISO 8601 timestamp)
        }

        Error response format:
        {
            "success": False,
            "error": str (error code: INVALID_INPUT, DATABASE_ERROR, INTERNAL_ERROR),
            "message": str (user-friendly error message)
        }

    Error Codes:
        - INVALID_INPUT: Title is empty, too long, or description exceeds max length
        - DATABASE_ERROR: Unable to save task to database
        - INTERNAL_ERROR: Unexpected error occurred

    Example:
        >>> result = await add_task(
        ...     user_id=UUID("550e8400-e29b-41d4-a716-446655440000"),
        ...     title="Buy groceries",
        ...     description="Milk, eggs, bread",
        ...     session=db_session
        ... )
        >>> print(result)
        {
            "success": True,
            "task_id": "660e8400-e29b-41d4-a716-446655440001",
            "title": "Buy groceries",
            "created_at": "2026-02-08T10:00:00Z"
        }

    Security:
        - Task is automatically assigned to the authenticated user
        - No cross-user task creation allowed
        - user_id must match authenticated user from JWT
    """
    # Log tool invocation for auditability
    logger.info(
        f"MCP tool invoked: add_task",
        extra={
            "user_id": str(user_id),
            "tool": "add_task",
            "title_length": len(title) if title else 0,
            "has_description": description is not None,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

    try:
        # Validate session
        if session is None:
            logger.error("Database session not provided to add_task tool")
            return {
                "success": False,
                "error": "INTERNAL_ERROR",
                "message": "Database session not available. Please try again."
            }

        # Validate title
        if not title or not title.strip():
            logger.warning(f"Invalid title: empty or whitespace only (user_id={user_id})")
            return {
                "success": False,
                "error": "INVALID_INPUT",
                "message": "Task title cannot be empty"
            }

        if len(title) > 200:
            logger.warning(f"Invalid title: too long ({len(title)} chars, user_id={user_id})")
            return {
                "success": False,
                "error": "INVALID_INPUT",
                "message": "Task title must be between 1 and 200 characters"
            }

        # Validate description if provided
        if description is not None and len(description) > 1000:
            logger.warning(f"Invalid description: too long ({len(description)} chars, user_id={user_id})")
            return {
                "success": False,
                "error": "INVALID_INPUT",
                "message": "Task description must not exceed 1000 characters"
            }

        # Create task with user ownership
        new_task = Task(
            user_id=user_id,
            title=title.strip(),
            description=description.strip() if description else None,
            completed=False
        )

        # Add to database
        session.add(new_task)
        await session.commit()
        await session.refresh(new_task)

        # Log success
        logger.info(
            f"Task created successfully: {new_task.id}",
            extra={
                "user_id": str(user_id),
                "task_id": str(new_task.id),
                "tool": "add_task"
            }
        )

        # Return success response
        return {
            "success": True,
            "task_id": str(new_task.id),
            "title": new_task.title,
            "created_at": new_task.created_at.isoformat() + "Z"
        }

    except SQLAlchemyError as e:
        # Database error
        logger.error(
            f"Database error in add_task: {str(e)}",
            extra={
                "user_id": str(user_id),
                "tool": "add_task",
                "error_type": type(e).__name__
            },
            exc_info=True
        )
        await session.rollback()
        return {
            "success": False,
            "error": "DATABASE_ERROR",
            "message": "Unable to save task to database. Please try again."
        }

    except Exception as e:
        # Unexpected error
        logger.error(
            f"Unexpected error in add_task: {str(e)}",
            extra={
                "user_id": str(user_id),
                "tool": "add_task",
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
