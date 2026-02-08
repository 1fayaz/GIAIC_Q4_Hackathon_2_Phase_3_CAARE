"""
MCP tools for task management operations.

This module exports MCP tools that the AI agent can invoke to perform
task operations on behalf of users. All tools enforce user ownership
and return structured responses.

Available Tools:
    - add_task: Create a new task for the authenticated user
    - list_tasks: Retrieve tasks with filtering and pagination
    - complete_task: Mark a task as complete or incomplete
    - delete_task: Permanently delete a task
    - update_task: Update task title, description, or completion status
"""

from .add_task import add_task
from .list_tasks import list_tasks
from .complete_task import complete_task
from .delete_task import delete_task
from .update_task import update_task

__all__ = [
    "add_task",
    "list_tasks",
    "complete_task",
    "delete_task",
    "update_task",
]
