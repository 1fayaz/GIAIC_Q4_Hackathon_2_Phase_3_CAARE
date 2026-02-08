"""
MCP Tool: list_tasks

Retrieves tasks for the authenticated user with filtering and pagination support.
This tool is invoked by the AI agent to list tasks on behalf of users.
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


async def list_tasks(
    user_id: UUID,
    completed: bool | None = None,
    limit: int = 50,
    session: AsyncSession = None
) -> dict:
    """
    Retrieve all tasks for the authenticated user with optional filtering.

    This MCP tool queries tasks from the database with proper ownership enforcement,
    ensuring users can only access their own tasks. Supports filtering by completion
    status and pagination through limit parameter.

    Args:
        user_id (UUID): ID of the authenticated user (provided by backend).
                       Only tasks belonging to this user will be returned.
        completed (bool | None, optional): Filter by completion status.
                                          - True: return only completed tasks
                                          - False: return only active (incomplete) tasks
                                          - None: return all tasks (default)
        limit (int, optional): Maximum number of tasks to return.
                              Must be between 1 and 100. Defaults to 50.
        session (AsyncSession): Database session for executing queries.
                               Must be provided via dependency injection.

    Returns:
        dict: Structured response containing either success data or error information.

        Success response format:
        {
            "success": True,
            "tasks": [
                {
                    "id": str (UUID),
                    "title": str,
                    "description": str | None,
                    "completed": bool,
                    "created_at": str (ISO 8601 timestamp),
                    "updated_at": str (ISO 8601 timestamp)
                },
                ...
            ],
            "count": int (number of tasks returned)
        }

        Error response format:
        {
            "success": False,
            "error": str (error code: INVALID_INPUT, DATABASE_ERROR, INTERNAL_ERROR),
            "message": str (user-friendly error message)
        }

    Error Codes:
        - INVALID_INPUT: Limit is out of valid range (1-100)
        - DATABASE_ERROR: Unable to query tasks from database
        - INTERNAL_ERROR: Unexpected error occurred

    Example:
        >>> result = await list_tasks(
        ...     user_id=UUID("550e8400-e29b-41d4-a716-446655440000"),
        ...     completed=False,
        ...     limit=10,
        ...     session=db_session
        ... )
        >>> print(result)
        {
            "success": True,
            "tasks": [
                {
                    "id": "660e8400-e29b-41d4-a716-446655440001",
                    "title": "Buy groceries",
                    "description": "Milk, eggs, bread",
                    "completed": False,
                    "created_at": "2026-02-08T10:00:00Z",
                    "updated_at": "2026-02-08T10:00:00Z"
                }
            ],
            "count": 1
        }

    Security:
        - Only returns tasks belonging to authenticated user
        - No cross-user task access allowed
        - All queries automatically filter by user_id
    """
    # Log tool invocation for auditability
    logger.info(
        f"MCP tool invoked: list_tasks",
        extra={
            "user_id": str(user_id),
            "tool": "list_tasks",
            "completed_filter": completed,
            "limit": limit,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

    try:
        # Validate session
        if session is None:
            logger.error("Database session not provided to list_tasks tool")
            return {
                "success": False,
                "error": "INTERNAL_ERROR",
                "message": "Database session not available. Please try again."
            }

        # Validate limit
        if limit < 1 or limit > 100:
            logger.warning(f"Invalid limit: {limit} (user_id={user_id})")
            return {
                "success": False,
                "error": "INVALID_INPUT",
                "message": "Limit must be between 1 and 100"
            }

        # Build query with user ownership filter
        query = select(Task).where(Task.user_id == user_id)

        # Apply completion status filter if provided
        if completed is not None:
            query = query.where(Task.completed == completed)

        # Apply limit and order by created_at descending (newest first)
        query = query.order_by(Task.created_at.desc()).limit(limit)

        # Execute query
        result = await session.execute(query)
        tasks = result.scalars().all()

        # Convert tasks to dict format
        tasks_data = [
            {
                "id": str(task.id),
                "title": task.title,
                "description": task.description,
                "completed": task.completed,
                "created_at": task.created_at.isoformat() + "Z",
                "updated_at": task.updated_at.isoformat() + "Z"
            }
            for task in tasks
        ]

        # Log success
        logger.info(
            f"Tasks retrieved successfully: {len(tasks_data)} tasks",
            extra={
                "user_id": str(user_id),
                "tool": "list_tasks",
                "count": len(tasks_data),
                "completed_filter": completed
            }
        )

        # Return success response
        return {
            "success": True,
            "tasks": tasks_data,
            "count": len(tasks_data)
        }

    except SQLAlchemyError as e:
        # Database error
        logger.error(
            f"Database error in list_tasks: {str(e)}",
            extra={
                "user_id": str(user_id),
                "tool": "list_tasks",
                "error_type": type(e).__name__
            },
            exc_info=True
        )
        return {
            "success": False,
            "error": "DATABASE_ERROR",
            "message": "Unable to retrieve tasks from database. Please try again."
        }

    except Exception as e:
        # Unexpected error
        logger.error(
            f"Unexpected error in list_tasks: {str(e)}",
            extra={
                "user_id": str(user_id),
                "tool": "list_tasks",
                "error_type": type(e).__name__
            },
            exc_info=True
        )
        return {
            "success": False,
            "error": "INTERNAL_ERROR",
            "message": "An unexpected error occurred. Please try again."
        }
