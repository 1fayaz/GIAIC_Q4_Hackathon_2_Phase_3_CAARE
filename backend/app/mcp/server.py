"""
MCP Server: Tool Registry and Invocation Manager

Manages MCP tools registration and provides interface for AI agent to discover
and invoke tools. This server acts as the bridge between the AI agent and
the actual tool implementations.
"""

import logging
from typing import Any, Callable
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.mcp.tools.add_task import add_task
from app.mcp.tools.list_tasks import list_tasks
from app.mcp.tools.complete_task import complete_task
from app.mcp.tools.delete_task import delete_task
from app.mcp.tools.update_task import update_task

# Configure logger
logger = logging.getLogger(__name__)


class MCPServer:
    """
    MCP Server for managing tool registry and invocations.

    This server provides:
    - Tool registration and discovery
    - Tool invocation with parameter validation
    - Error handling and logging
    - OpenAI function calling format conversion

    The server maintains a registry of available tools and their handlers,
    allowing the AI agent to discover capabilities and invoke them safely.
    """

    def __init__(self):
        """
        Initialize MCP server with empty tool registry.

        Tools are registered during initialization via register_tools().
        """
        self.tools: dict[str, dict[str, Any]] = {}
        self.handlers: dict[str, Callable] = {}
        self.register_tools()

        logger.info("MCP Server initialized with tools", extra={
            "tool_count": len(self.tools),
            "tools": list(self.tools.keys())
        })

    def register_tools(self) -> None:
        """
        Register all available MCP tools with their definitions and handlers.

        Each tool is registered with:
        - OpenAI function calling schema (for agent discovery)
        - Handler function (for execution)
        - Metadata (description, parameters, etc.)

        This method is called during server initialization.
        """
        # Register add_task tool
        self.tools["add_task"] = {
            "type": "function",
            "function": {
                "name": "add_task",
                "description": "Create a new task for the user. Use this when the user wants to add, create, or remember something to do.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "title": {
                            "type": "string",
                            "description": "The task title or description (1-200 characters). Extract the most natural phrasing from the user's message."
                        },
                        "description": {
                            "type": "string",
                            "description": "Optional detailed description of the task. Only include if user provides additional details."
                        }
                    },
                    "required": ["title"]
                }
            }
        }
        self.handlers["add_task"] = add_task

        # Register list_tasks tool
        self.tools["list_tasks"] = {
            "type": "function",
            "function": {
                "name": "list_tasks",
                "description": "Retrieve the user's tasks. Use this when the user wants to see, list, or check their tasks.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "completed": {
                            "type": "boolean",
                            "description": "Filter by completion status. Use false for 'active tasks' or 'what do I need to do', true for 'completed tasks', or omit for 'all tasks'."
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Maximum number of tasks to return (1-100). Defaults to 50.",
                            "minimum": 1,
                            "maximum": 100
                        }
                    },
                    "required": []
                }
            }
        }
        self.handlers["list_tasks"] = list_tasks

        # Register complete_task tool
        self.tools["complete_task"] = {
            "type": "function",
            "function": {
                "name": "complete_task",
                "description": "Mark a task as complete or incomplete. Use this when the user wants to complete, finish, mark as done, or check off a task.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "task_id": {
                            "type": "string",
                            "description": "The UUID of the task to update. Extract from context or ask user to specify which task."
                        },
                        "completed": {
                            "type": "boolean",
                            "description": "Completion status to set. Use true to mark as complete (default), false to mark as incomplete.",
                            "default": True
                        }
                    },
                    "required": ["task_id"]
                }
            }
        }
        self.handlers["complete_task"] = complete_task

        # Register delete_task tool
        self.tools["delete_task"] = {
            "type": "function",
            "function": {
                "name": "delete_task",
                "description": "Permanently delete a task. Use this when the user wants to delete, remove, or get rid of a task. This action cannot be undone.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "task_id": {
                            "type": "string",
                            "description": "The UUID of the task to delete. Extract from context or ask user to specify which task."
                        }
                    },
                    "required": ["task_id"]
                }
            }
        }
        self.handlers["delete_task"] = delete_task

        # Register update_task tool
        self.tools["update_task"] = {
            "type": "function",
            "function": {
                "name": "update_task",
                "description": "Update a task's title, description, or completion status. Use this when the user wants to change, modify, rename, or edit a task. Supports partial updates - only update the fields the user mentions.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "task_id": {
                            "type": "string",
                            "description": "The UUID of the task to update. Extract from context or ask user to specify which task."
                        },
                        "title": {
                            "type": "string",
                            "description": "New task title (1-200 characters). Only include if user wants to change the title."
                        },
                        "description": {
                            "type": "string",
                            "description": "New task description (max 1000 characters). Only include if user wants to change the description. Pass empty string to clear description."
                        },
                        "completed": {
                            "type": "boolean",
                            "description": "New completion status. Only include if user wants to change completion status."
                        }
                    },
                    "required": ["task_id"]
                }
            }
        }
        self.handlers["update_task"] = update_task

        logger.info("Tools registered successfully", extra={
            "tools": list(self.tools.keys())
        })

    def get_tool_definitions(self) -> list[dict[str, Any]]:
        """
        Get tool definitions in OpenAI function calling format.

        Returns tool schemas that can be passed to OpenAI chat completions API
        to enable function calling. The agent uses these definitions to understand
        what tools are available and how to invoke them.

        Returns:
            list[dict]: List of tool definitions in OpenAI format.

        Example:
            >>> server = MCPServer()
            >>> tools = server.get_tool_definitions()
            >>> print(tools[0]["function"]["name"])
            'add_task'
        """
        return list(self.tools.values())

    async def invoke_tool(
        self,
        tool_name: str,
        parameters: dict[str, Any],
        user_id: UUID,
        session: AsyncSession
    ) -> dict[str, Any]:
        """
        Invoke a tool by name with provided parameters.

        This method:
        1. Validates that the tool exists
        2. Injects user_id and session into parameters
        3. Calls the tool handler
        4. Logs the invocation for auditability
        5. Returns the tool result

        Args:
            tool_name (str): Name of the tool to invoke (e.g., "add_task")
            parameters (dict): Tool parameters from agent (without user_id/session)
            user_id (UUID): Authenticated user ID (injected automatically)
            session (AsyncSession): Database session (injected automatically)

        Returns:
            dict: Tool execution result with success/error information.

        Example:
            >>> result = await server.invoke_tool(
            ...     tool_name="add_task",
            ...     parameters={"title": "Buy groceries"},
            ...     user_id=user_id,
            ...     session=db_session
            ... )
            >>> print(result["success"])
            True

        Error Handling:
            - TOOL_NOT_FOUND: Tool name not registered
            - TOOL_EXECUTION_ERROR: Tool handler raised exception
            - Returns error dict with user-friendly message
        """
        # Log tool invocation
        logger.info(
            f"Tool invocation requested: {tool_name}",
            extra={
                "tool": tool_name,
                "user_id": str(user_id),
                "parameters": parameters
            }
        )

        try:
            # Validate tool exists
            if tool_name not in self.handlers:
                logger.error(f"Tool not found: {tool_name}")
                return {
                    "success": False,
                    "error": "TOOL_NOT_FOUND",
                    "message": f"Tool '{tool_name}' is not available"
                }

            # Get tool handler
            handler = self.handlers[tool_name]

            # Inject user_id and session into parameters
            # These are provided by backend, not by agent
            tool_params = {
                "user_id": user_id,
                "session": session,
                **parameters  # Agent-provided parameters
            }

            # Invoke tool handler
            result = await handler(**tool_params)

            # Log success
            logger.info(
                f"Tool invocation completed: {tool_name}",
                extra={
                    "tool": tool_name,
                    "user_id": str(user_id),
                    "success": result.get("success", False)
                }
            )

            return result

        except TypeError as e:
            # Parameter mismatch error
            logger.error(
                f"Tool parameter error: {tool_name}",
                extra={
                    "tool": tool_name,
                    "user_id": str(user_id),
                    "error": str(e)
                },
                exc_info=True
            )
            return {
                "success": False,
                "error": "INVALID_PARAMETERS",
                "message": f"Invalid parameters for tool '{tool_name}': {str(e)}"
            }

        except Exception as e:
            # Unexpected error during tool execution
            logger.error(
                f"Tool execution error: {tool_name}",
                extra={
                    "tool": tool_name,
                    "user_id": str(user_id),
                    "error_type": type(e).__name__,
                    "error": str(e)
                },
                exc_info=True
            )
            return {
                "success": False,
                "error": "TOOL_EXECUTION_ERROR",
                "message": f"An error occurred while executing '{tool_name}'. Please try again."
            }

    def get_tool_count(self) -> int:
        """
        Get the number of registered tools.

        Returns:
            int: Number of tools in registry.
        """
        return len(self.tools)

    def get_tool_names(self) -> list[str]:
        """
        Get list of all registered tool names.

        Returns:
            list[str]: List of tool names.
        """
        return list(self.tools.keys())
