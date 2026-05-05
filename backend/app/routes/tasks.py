"""
Task management API routes.

This module provides REST API endpoints for task CRUD operations with JWT-based
authentication and user data isolation. All endpoints require authentication via
JWT token in httpOnly cookie.

=== DATA ISOLATION STRATEGY (T030) ===

This module implements strict user-based data isolation as required by FR-003
in the constitution. The strategy ensures that users can ONLY access their own
tasks and cannot view, modify, or delete tasks belonging to other users.

**Implementation Details:**

1. **JWT-Based Authentication**: User identity extracted from JWT token
   - get_current_user dependency extracts user from httpOnly cookie
   - No user_id in path parameters (security improvement)
   - Token verified on every request

2. **Query Filtering**: ALL database queries filter by current_user.id
   - Every SELECT statement includes: WHERE Task.user_id == current_user.id
   - This applies to: list, get, update, delete, and toggle operations
   - No query returns data without user_id filtering

3. **Security Through 404 (Not 403)**:
   - When a user tries to access another user's task, we return 404 (Not Found)
   - We do NOT return 403 (Forbidden) to prevent information leakage
   - This prevents attackers from discovering which task IDs exist in the system
   - Example: If user1 tries to access user2's task, they get "Task not found"
     rather than "Access denied", which would confirm the task exists

4. **Automatic User Assignment**:
   - When creating tasks, user_id is automatically assigned from current_user
   - Users cannot create tasks for other users
   - The user_id field is immutable after creation

**Constitution Compliance:**
- FR-003: Multi-user data isolation ✓
- SEC-001: Input validation via Pydantic ✓
- SEC-002: SQL injection prevention via SQLModel parameterized queries ✓
- SEC-003: JWT-based authentication ✓

=== RESPONSE FORMAT STANDARDIZATION ===

All endpoints return standardized response format:
- Success: {success: true, data: {...}, message: "..."}
- Error: {success: false, error: {code: "...", message: "..."}}
- Consistent across all endpoints
"""

from datetime import datetime
from typing import List, Optional, Literal
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import select
from app.core.database import get_session
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.schemas.response import success_response
from app.dependencies.auth import get_current_user

# Create router with prefix and tags
router = APIRouter(
    prefix="/api/tasks",
    tags=["tasks"]
)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task",
    description="Creates a new task for the authenticated user with auto-generated ID and timestamps"
)
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> dict:
    """
    Create a new task for the authenticated user.

    Args:
        task_data: Task creation data (title, description)
        current_user: Authenticated user from JWT token (injected dependency)
        session: Database session (injected dependency)

    Returns:
        dict: Standardized success response with created task data

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 500 if database operation fails
    """
    try:
        # Create new task instance with auto-generated ID and timestamps
        new_task = Task(
            user_id=current_user.id,
            title=task_data.title,
            description=task_data.description,
            completed=False,
            priority=task_data.priority,
            tags=task_data.tags,
            due_date=task_data.due_date,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        # Add to session and commit
        session.add(new_task)
        await session.commit()
        await session.refresh(new_task)

        # Return standardized success response
        return success_response(
            data=TaskResponse.model_validate(new_task).model_dump(),
            message="Task created successfully"
        )

    except SQLAlchemyError as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: Failed to create task"
        )
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="List tasks for the authenticated user with filtering and sorting",
    description=(
        "Retrieves tasks belonging to the authenticated user. Supports full-text "
        "search across title/description, status/priority/tag/due-date filters, "
        "and configurable sorting. All results remain strictly scoped to the "
        "current user via JWT-derived user_id (FR-003)."
    )
)
async def list_tasks(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    search: Optional[str] = Query(
        default=None,
        max_length=200,
        description="Case-insensitive substring match on title and description"
    ),
    status_filter: Literal["all", "active", "completed"] = Query(
        default="all",
        alias="status",
        description="Filter by completion status: 'all' (default), 'active', or 'completed'"
    ),
    priority: Optional[Literal["low", "medium", "high"]] = Query(
        default=None,
        description="Filter by priority: 'low', 'medium', or 'high'"
    ),
    tag: Optional[str] = Query(
        default=None,
        max_length=100,
        description="Match tasks whose tags string contains this label (case-insensitive)"
    ),
    due_before: Optional[datetime] = Query(
        default=None,
        description="Only include tasks with due_date <= this timestamp (UTC)"
    ),
    due_after: Optional[datetime] = Query(
        default=None,
        description="Only include tasks with due_date >= this timestamp (UTC)"
    ),
    sort_by: Literal[
        "created_at", "updated_at", "due_date", "priority", "title"
    ] = Query(
        default="created_at",
        description="Field to sort results by"
    ),
    order: Literal["asc", "desc"] = Query(
        default="desc",
        description="Sort direction: 'asc' or 'desc'"
    ),
) -> dict:
    """
    List tasks for the authenticated user with optional filtering and sorting.

    User isolation is enforced via ``Task.user_id == current_user.id`` on every
    query. Filters are applied conditionally; sorting is applied last.

    Sorting notes:
        - ``priority`` is ordered via a CASE expression so that
          high < medium < low (ascending = high first).
        - ``due_date`` always pushes NULL values to the end, regardless of
          order direction (via ``nulls_last()``).

    Args:
        current_user: Authenticated user from JWT token (injected dependency)
        session: Database session (injected dependency)
        search: Optional case-insensitive substring search over title/description
        status_filter: Completion-status filter ('all' | 'active' | 'completed')
        priority: Optional priority filter
        tag: Optional substring match within the tags field
        due_before: Optional upper bound on due_date
        due_after: Optional lower bound on due_date
        sort_by: Field to sort by
        order: Sort direction ('asc' | 'desc')

    Returns:
        dict: Standardized success response with list of tasks

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 500 if database operation fails
    """
    try:
        # Always start with the user-isolation predicate (FR-003)
        statement = select(Task).where(Task.user_id == current_user.id)

        # --- Filters (applied conditionally) ---

        # Case-insensitive search across title and description
        if search is not None:
            search_term = search.strip()
            if search_term:
                like_pattern = f"%{search_term}%"
                statement = statement.where(
                    (Task.title.ilike(like_pattern))
                    | (Task.description.ilike(like_pattern))
                )

        # Completion status: 'active' => not completed, 'completed' => completed
        if status_filter == "active":
            statement = statement.where(Task.completed.is_(False))
        elif status_filter == "completed":
            statement = statement.where(Task.completed.is_(True))

        # Priority exact match
        if priority is not None:
            statement = statement.where(Task.priority == priority)

        # Tag substring match (case-insensitive); input lowercased for consistency
        if tag is not None:
            tag_value = tag.strip().lower()
            if tag_value:
                statement = statement.where(Task.tags.ilike(f"%{tag_value}%"))

        # Due date bounds (inclusive)
        if due_before is not None:
            statement = statement.where(Task.due_date <= due_before)
        if due_after is not None:
            statement = statement.where(Task.due_date >= due_after)

        # --- Sorting (applied last) ---

        if sort_by == "priority":
            # Map textual priorities to a numeric rank so high < medium < low
            # (ascending => high first).
            priority_rank = case(
                (Task.priority == "high", 1),
                (Task.priority == "medium", 2),
                (Task.priority == "low", 3),
                else_=99,
            )
            sort_expr = priority_rank.asc() if order == "asc" else priority_rank.desc()
            statement = statement.order_by(sort_expr)
        elif sort_by == "due_date":
            # NULL due dates always sink to the end regardless of direction.
            base = Task.due_date.asc() if order == "asc" else Task.due_date.desc()
            statement = statement.order_by(base.nulls_last())
        else:
            sort_column = {
                "created_at": Task.created_at,
                "updated_at": Task.updated_at,
                "title": Task.title,
            }[sort_by]
            sort_expr = sort_column.asc() if order == "asc" else sort_column.desc()
            statement = statement.order_by(sort_expr)

        result = await session.execute(statement)
        tasks = result.scalars().all()

        # Return standardized success response
        return success_response(
            data=[TaskResponse.model_validate(task).model_dump() for task in tasks],
            message="Tasks retrieved successfully"
        )

    except SQLAlchemyError as e:
        await session.rollback()
        print(f"SQLAlchemy Error in list_tasks: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: Failed to retrieve tasks"
        )
    except Exception as e:
        print(f"Unexpected Error in list_tasks: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get(
    "/{task_id}",
    status_code=status.HTTP_200_OK,
    summary="Get a single task",
    description="Retrieves a specific task by ID. Returns 404 if task doesn't exist or belongs to a different user"
)
async def get_task(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> dict:
    """
    Get a single task by ID for the authenticated user.

    Args:
        task_id: Task identifier from path parameter
        current_user: Authenticated user from JWT token (injected dependency)
        session: Database session (injected dependency)

    Returns:
        dict: Standardized success response with task data

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 404 if task not found or belongs to different user
        HTTPException: 500 if database operation fails
    """
    try:
        # Query single task filtered by both current_user.id AND task_id
        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == current_user.id
        )
        result = await session.execute(statement)
        task = result.scalar_one_or_none()

        if task is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )

        # Return standardized success response
        return success_response(
            data=TaskResponse.model_validate(task).model_dump(),
            message="Task retrieved successfully"
        )

    except HTTPException:
        # Re-raise HTTPException (404) without wrapping
        raise
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: Failed to retrieve task"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.put(
    "/{task_id}",
    status_code=status.HTTP_200_OK,
    summary="Update a task",
    description="Updates an existing task. All fields are optional (partial update). Returns 404 if task not found or belongs to different user"
)
async def update_task(
    task_id: UUID,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> dict:
    """
    Update an existing task with partial updates for the authenticated user.

    Args:
        task_id: Task identifier from path parameter
        task_data: Task update data (all fields optional)
        current_user: Authenticated user from JWT token (injected dependency)
        session: Database session (injected dependency)

    Returns:
        dict: Standardized success response with updated task data

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 404 if task not found or belongs to different user
        HTTPException: 422 if validation fails (handled by Pydantic)
        HTTPException: 500 if database operation fails
    """
    try:
        # Query task filtered by both current_user.id AND task_id (security)
        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == current_user.id
        )
        result = await session.execute(statement)
        task = result.scalar_one_or_none()

        if task is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )

        # Update only provided fields (partial update)
        update_data = task_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)

        # Refresh updated_at timestamp
        task.updated_at = datetime.utcnow()

        # Save changes to database
        session.add(task)
        await session.commit()
        await session.refresh(task)

        # Return standardized success response
        return success_response(
            data=TaskResponse.model_validate(task).model_dump(),
            message="Task updated successfully"
        )

    except HTTPException:
        # Re-raise HTTPException (404) without wrapping
        raise
    except SQLAlchemyError as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: Failed to update task"
        )
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a task",
    description="Permanently deletes a task. Returns 404 if task not found or belongs to different user"
)
async def delete_task(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> dict:
    """
    Delete a task permanently for the authenticated user.

    Args:
        task_id: Task identifier from path parameter
        current_user: Authenticated user from JWT token (injected dependency)
        session: Database session (injected dependency)

    Returns:
        dict: Standardized success response

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 404 if task not found or belongs to different user
        HTTPException: 500 if database operation fails
    """
    try:
        # Query task filtered by both current_user.id AND task_id (security)
        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == current_user.id
        )
        result = await session.execute(statement)
        task = result.scalar_one_or_none()

        if task is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )

        # Delete task from database
        await session.delete(task)
        await session.commit()

        # Return standardized success response
        return success_response(
            data={"id": str(task_id)},
            message="Task deleted successfully"
        )

    except HTTPException:
        # Re-raise HTTPException (404) without wrapping
        raise
    except SQLAlchemyError as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: Failed to delete task"
        )
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.patch(
    "/{task_id}/complete",
    status_code=status.HTTP_200_OK,
    summary="Toggle task completion status",
    description="Toggles the completion status of a task. Updates the updated_at timestamp automatically"
)
async def toggle_task_completion(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> dict:
    """
    Toggle task completion status for the authenticated user.

    If the task is incomplete (completed=False), it will be marked as completed (completed=True).
    If the task is completed (completed=True), it will be marked as incomplete (completed=False).

    Args:
        task_id: Task identifier from path parameter
        current_user: Authenticated user from JWT token (injected dependency)
        session: Database session (injected dependency)

    Returns:
        dict: Standardized success response with updated task data

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 404 if task not found or belongs to different user
        HTTPException: 500 if database operation fails
    """
    try:
        # Query task filtered by both current_user.id AND task_id (security)
        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == current_user.id
        )
        result = await session.execute(statement)
        task = result.scalar_one_or_none()

        if task is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )

        # Toggle completion status (T026: simple and clear toggle logic)
        task.completed = not task.completed

        # Refresh updated_at timestamp
        task.updated_at = datetime.utcnow()

        # Save changes to database
        session.add(task)
        await session.commit()
        await session.refresh(task)

        # Return standardized success response
        return success_response(
            data=TaskResponse.model_validate(task).model_dump(),
            message="Task completion status toggled successfully"
        )

    except HTTPException:
        # Re-raise HTTPException (404) without wrapping
        raise
    except SQLAlchemyError as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: Failed to toggle task completion"
        )
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
