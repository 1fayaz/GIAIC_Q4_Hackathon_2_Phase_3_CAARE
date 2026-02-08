"""
MCP Tool: delete_task

Permanently deletes a task for the authenticated user with ownership enforcement.
This tool is invoked by the AI agent to remove tasks on behalf of users.
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


async def delete_task(
    user_id: UUID,
    task_id: UUID,
    session: AsyncSession = None
) -> dict:
    """
    Permanently delete a task for the authenticated user.

    This MCP tool removes a task from the database with proper validation
    and ownership enforcement. Only the task owner can delete the task.
    The operation is NOT idempotent - deleting a non-existent task returns
    an error.

    Args:
        user_id (UUID): ID of the authenticated user (provided by backend).
                       Only tasks belonging to this user can be deleted.
        task_id (UUID): ID of the task to delete. Must be a valid UUID.
        session (AsyncSession): Database session for executing queries.
                               Must be provided via dependency injection.

    Returns:
        dict: Structured response containing either success data or error information.

        Success response format:
        {
            "success": True,
            "task_id": str (UUID),
            "title": str,
            "message": "Task deleted successfully"
        }

        Error response format:
        {
            "success": False,
            "error": str (error code: TASK_NOT_FOUND, DATABASE_ERROR, INTERNAL_ERROR),
            "message": str (user-friendly error message)
        }

    Error Codes:
        - TASK_NOT_FOUND: Task doesn't exist or doesn't belong to user
        - DATABASE_ERROR: Unable to delete task from database
        - INTERNAL_ERROR: Unexpected error occurred

    Example:
        >>> result = await delete_task(
        ...     user_id=UUID("550e8400-e29b-41d4-a716-446655440000"),
        ...     task_id=UUID("660e8400-e29b-41d4-a716-446655440001"),
        ...     session=db_session
        ... )
        >>> print(result)
        {
            "success": True,
            "task_id": "660e8400-e29b-41d4-a716-446655440001",
            "title": "Buy groceries",
            "message": "Task deleted successfully"
        }

    Security:
        - Task must belong to authenticated user
        - Returns 404-style error if task not found or unauthorized
        - No information leaked about existence of other users' tasks

    Idempotency:
        - Deleting a non-existent task returns error (not idempotent)
        - Operation should not be retried on success
    """
    # Log tool invocation for auditability
    logger.info(
        f"MCP tool invoked: delete_task",
        extra={
            "user_id": str(user_id),
            "tool": "delete_task",
            "task_id": str(task_id),
            "timestamp": datetime.utcnow().isoformat()
        }
    )

    try:
        # Validate session
        if session is None:
            logger.error("Database session not provided to delete_task tool")
            return {
                "success": False,
                "error": "INTERNAL_ERROR",
                "message": "Database session not available. Please try again."
            }

        # Query task with user ownership enforcement
        # This ensures users can only delete their own tasks
        query = select(Task).where(
            Task.id == task_id,
            Task.user_id == user_id
        )
        result = await session.execute(query)
        task = result.scalar_one_or_none()

        # Task not found or doesn't belong to user
        if task is None:
            logger.warning(
                f"Task not found or unauthorized deletion attempt",
                extra={
                    "user_id": str(user_id),
                    "task_id": str(task_id),
                    "tool": "delete_task"
                }
            )
            return {
                "success": False,
                "error": "TASK_NOT_FOUND",
                "message": "Task not found or you don't have permission to delete it"
            }

        # Store task details before deletion for response
        task_id_str = str(task.id)
        task_title = task.title

        # Delete task from database
        await session.delete(task)
        await session.commit()

        # Log success
        logger.info(
            f"Task deleted successfully: {task_id_str}",
            extra={
                "user_id": str(user_id),
                "task_id": task_id_str,
                "task_title": task_title,
                "tool": "delete_task"
            }
        )

        # Return success response
        return {
            "success": True,
            "task_id": task_id_str,
            "title": task_title,
            "message": "Task deleted successfully"
        }

    except SQLAlchemyError as e:
        # Database error
        logger.error(
            f"Database error in delete_task: {str(e)}",
            extra={
                "user_id": str(user_id),
                "task_id": str(task_id),
                "tool": "delete_task",
                "error_type": type(e).__name__
            },
            exc_info=True
        )
        await session.rollback()
        return {
            "success": False,
            "error": "DATABASE_ERROR",
            "message": "Unable to delete task from database. Please try again."
        }

    except Exception as e:
        # Unexpected error
        logger.error(
            f"Unexpected error in delete_task: {str(e)}",
            extra={
                "user_id": str(user_id),
                "task_id": str(task_id),
                "tool": "delete_task",
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
