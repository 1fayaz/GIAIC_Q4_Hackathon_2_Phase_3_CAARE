"""
MCP Tool: complete_task

Marks a task as complete or incomplete for the authenticated user with ownership enforcement.
This tool is invoked by the AI agent to update task completion status on behalf of users.
"""

import logging
from datetime import datetime
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.models.task import Task

# Configure logger
logger = logging.getLogger(__name__)


async def complete_task(
    user_id: UUID,
    task_id: UUID,
    completed: bool = True,
    session: AsyncSession = None
) -> dict:
    """
    Mark a task as complete or incomplete for the authenticated user.

    This MCP tool updates the completion status of a task in the database with
    proper validation and ownership enforcement. Only the task owner can update
    the completion status. The operation is idempotent - marking an already-completed
    task as complete returns success.

    Args:
        user_id (UUID): ID of the authenticated user (provided by backend).
                       Only tasks belonging to this user can be updated.
        task_id (UUID): ID of the task to update. Must be a valid UUID.
        completed (bool, optional): Completion status to set.
                                   - True: mark task as complete (default)
                                   - False: mark task as incomplete
        session (AsyncSession): Database session for executing queries.
                               Must be provided via dependency injection.

    Returns:
        dict: Structured response containing either success data or error information.

        Success response format:
        {
            "success": True,
            "task_id": str (UUID),
            "title": str,
            "completed": bool,
            "updated_at": str (ISO 8601 timestamp)
        }

        Error response format:
        {
            "success": False,
            "error": str (error code: TASK_NOT_FOUND, DATABASE_ERROR, INTERNAL_ERROR),
            "message": str (user-friendly error message)
        }

    Error Codes:
        - TASK_NOT_FOUND: Task doesn't exist or doesn't belong to user
        - DATABASE_ERROR: Unable to update task in database
        - INTERNAL_ERROR: Unexpected error occurred

    Example:
        >>> result = await complete_task(
        ...     user_id=UUID("550e8400-e29b-41d4-a716-446655440000"),
        ...     task_id=UUID("660e8400-e29b-41d4-a716-446655440001"),
        ...     completed=True,
        ...     session=db_session
        ... )
        >>> print(result)
        {
            "success": True,
            "task_id": "660e8400-e29b-41d4-a716-446655440001",
            "title": "Buy groceries",
            "completed": True,
            "updated_at": "2026-02-08T11:00:00Z"
        }

    Security:
        - Task must belong to authenticated user
        - Returns 404-style error if task not found or unauthorized
        - No information leaked about existence of other users' tasks

    Idempotency:
        - Marking an already-completed task as complete returns success
        - Marking an already-incomplete task as incomplete returns success
        - Operation is safe to retry
    """
    # Log tool invocation for auditability
    logger.info(
        f"MCP tool invoked: complete_task",
        extra={
            "user_id": str(user_id),
            "tool": "complete_task",
            "task_id": str(task_id),
            "completed": completed,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

    try:
        # Validate session
        if session is None:
            logger.error("Database session not provided to complete_task tool")
            return {
                "success": False,
                "error": "INTERNAL_ERROR",
                "message": "Database session not available. Please try again."
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
                f"Task not found or unauthorized access attempt",
                extra={
                    "user_id": str(user_id),
                    "task_id": str(task_id),
                    "tool": "complete_task"
                }
            )
            return {
                "success": False,
                "error": "TASK_NOT_FOUND",
                "message": "Task not found or you don't have permission to access it"
            }

        # Update completion status
        # This is idempotent - setting the same status again is safe
        task.completed = completed
        task.updated_at = datetime.utcnow()

        # Commit changes
        await session.commit()
        await session.refresh(task)

        # Log success
        logger.info(
            f"Task completion status updated successfully: {task.id}",
            extra={
                "user_id": str(user_id),
                "task_id": str(task.id),
                "completed": completed,
                "tool": "complete_task"
            }
        )

        # Return success response
        return {
            "success": True,
            "task_id": str(task.id),
            "title": task.title,
            "completed": task.completed,
            "updated_at": task.updated_at.isoformat() + "Z"
        }

    except SQLAlchemyError as e:
        # Database error
        logger.error(
            f"Database error in complete_task: {str(e)}",
            extra={
                "user_id": str(user_id),
                "task_id": str(task_id),
                "tool": "complete_task",
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
            f"Unexpected error in complete_task: {str(e)}",
            extra={
                "user_id": str(user_id),
                "task_id": str(task_id),
                "tool": "complete_task",
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
