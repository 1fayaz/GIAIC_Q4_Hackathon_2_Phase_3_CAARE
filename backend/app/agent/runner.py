"""
Agent Runner: AI Agent Orchestration and Tool Invocation

Orchestrates the AI agent's interaction with users and MCP tools. This runner
manages the conversation flow, tool invocations, and response generation.
"""

import logging
import json
from datetime import datetime
from typing import Any
from uuid import UUID
from openai import AsyncOpenAI, OpenAIError
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.config import (
    get_system_prompt,
    get_agent_config,
    get_conversation_config,
    MAX_TOOL_CALLS_PER_MESSAGE
)
from app.mcp.server import MCPServer

# Configure logger
logger = logging.getLogger(__name__)


class AgentRunner:
    """
    Agent Runner for orchestrating AI agent and tool invocations.

    This runner:
    - Manages OpenAI API interactions
    - Coordinates tool invocations through MCP server
    - Handles conversation history
    - Logs all operations for auditability
    - Provides error handling and fallbacks

    The runner is stateless - each request creates a new execution context.
    """

    def __init__(self, api_key: str, base_url: str = None, model: str = None):
        """
        Initialize agent runner with API key and optional base URL.

        Args:
            api_key (str): API key for LLM interactions (OpenAI, Qwen, etc.).
            base_url (str, optional): Custom base URL for API (e.g., Qwen endpoint).
            model (str, optional): Model name to use (overrides config).
        """
        # Initialize client with optional base_url for API compatibility
        if base_url:
            self.client = AsyncOpenAI(api_key=api_key, base_url=base_url)
            logger.info(f"Agent Runner initialized with custom base URL: {base_url}")
        else:
            self.client = AsyncOpenAI(api_key=api_key)
            logger.info("Agent Runner initialized with default OpenAI endpoint")

        self.mcp_server = MCPServer()
        self.system_prompt = get_system_prompt()
        self.agent_config = get_agent_config()
        self.conversation_config = get_conversation_config()

        # Override model if provided
        if model:
            self.agent_config["model"] = model
            logger.info(f"Using custom model: {model}")

        logger.info("Agent Runner initialized", extra={
            "model": self.agent_config["model"],
            "tool_count": self.mcp_server.get_tool_count(),
            "tools": self.mcp_server.get_tool_names()
        })

    async def run(
        self,
        user_id: UUID,
        message: str,
        conversation_history: list[dict[str, str]],
        session: AsyncSession
    ) -> dict[str, Any]:
        """
        Run the AI agent with user message and conversation history.

        This method orchestrates the full agent execution flow:
        1. Prepare conversation context (system prompt + history + new message)
        2. Call OpenAI API with function calling enabled
        3. Process tool calls if agent decides to use tools
        4. Execute tools through MCP server
        5. Get final response from agent
        6. Return response with tool call metadata

        Args:
            user_id (UUID): Authenticated user ID (injected into tool calls).
            message (str): Current user message to process.
            conversation_history (list[dict]): Previous messages in conversation.
                Format: [{"role": "user"|"assistant", "content": "..."}]
            session (AsyncSession): Database session for tool execution.

        Returns:
            dict: Agent response with tool call metadata.

            Success format:
            {
                "success": True,
                "response": str,  # Agent's response message
                "tool_calls": list[dict],  # Tools invoked during processing
                "timestamp": str  # ISO 8601 timestamp
            }

            Error format:
            {
                "success": False,
                "response": str,  # User-friendly error message
                "error": str,  # Error code
                "tool_calls": [],
                "timestamp": str
            }

        Example:
            >>> runner = AgentRunner(api_key="sk-...")
            >>> result = await runner.run(
            ...     user_id=user_id,
            ...     message="Add a task to buy groceries",
            ...     conversation_history=[],
            ...     session=db_session
            ... )
            >>> print(result["response"])
            "I've added 'buy groceries' to your task list."
        """
        start_time = datetime.utcnow()

        # Log agent invocation
        logger.info(
            "Agent invocation started",
            extra={
                "user_id": str(user_id),
                "message_length": len(message),
                "history_length": len(conversation_history)
            }
        )

        try:
            # Truncate conversation history if needed
            truncated_history = self._truncate_history(conversation_history)

            # Prepare messages for OpenAI API
            messages = self._prepare_messages(truncated_history, message)

            # Get tool definitions from MCP server
            tools = self.mcp_server.get_tool_definitions()

            # Call OpenAI API with function calling
            response = await self.client.chat.completions.create(
                model=self.agent_config["model"],
                messages=messages,
                tools=tools,
                tool_choice="auto",  # Let agent decide when to use tools
                temperature=self.agent_config["temperature"],
                max_tokens=self.agent_config["max_tokens"],
                top_p=self.agent_config["top_p"],
                frequency_penalty=self.agent_config["frequency_penalty"],
                presence_penalty=self.agent_config["presence_penalty"]
            )

            # Extract assistant message
            assistant_message = response.choices[0].message

            # Process tool calls if any
            tool_calls_metadata = []
            if assistant_message.tool_calls:
                tool_calls_metadata = await self._process_tool_calls(
                    assistant_message.tool_calls,
                    user_id,
                    session,
                    messages
                )

                # If tools were called, get final response from agent
                # Add assistant message with tool calls to conversation
                messages.append({
                    "role": "assistant",
                    "content": assistant_message.content or "",
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments
                            }
                        }
                        for tc in assistant_message.tool_calls
                    ]
                })

                # Add tool results to conversation
                for tool_call_meta in tool_calls_metadata:
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call_meta["tool_call_id"],
                        "content": json.dumps(tool_call_meta["result"])
                    })

                # Get final response from agent
                final_response = await self.client.chat.completions.create(
                    model=self.agent_config["model"],
                    messages=messages,
                    temperature=self.agent_config["temperature"],
                    max_tokens=self.agent_config["max_tokens"]
                )

                final_message = final_response.choices[0].message.content
            else:
                # No tool calls, use assistant's direct response
                final_message = assistant_message.content

            # Calculate duration
            duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

            # Log success
            logger.info(
                "Agent invocation completed",
                extra={
                    "user_id": str(user_id),
                    "tool_calls_count": len(tool_calls_metadata),
                    "duration_ms": duration_ms,
                    "response_length": len(final_message) if final_message else 0
                }
            )

            return {
                "success": True,
                "response": final_message or "I'm here to help with your tasks!",
                "tool_calls": tool_calls_metadata,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }

        except OpenAIError as e:
            # OpenAI API error
            logger.error(
                "OpenAI API error",
                extra={
                    "user_id": str(user_id),
                    "error_type": type(e).__name__,
                    "error": str(e)
                },
                exc_info=True
            )
            return {
                "success": False,
                "response": "I'm having trouble processing your request right now. Please try again in a moment.",
                "error": "AGENT_ERROR",
                "tool_calls": [],
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }

        except Exception as e:
            # Unexpected error
            logger.error(
                "Unexpected agent error",
                extra={
                    "user_id": str(user_id),
                    "error_type": type(e).__name__,
                    "error": str(e)
                },
                exc_info=True
            )
            return {
                "success": False,
                "response": "Something went wrong. Please try again.",
                "error": "INTERNAL_ERROR",
                "tool_calls": [],
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }

    async def _process_tool_calls(
        self,
        tool_calls: list,
        user_id: UUID,
        session: AsyncSession,
        messages: list[dict]
    ) -> list[dict[str, Any]]:
        """
        Process tool calls from agent response.

        Executes each tool call through MCP server and collects results.
        Enforces maximum tool calls limit to prevent infinite loops.

        Args:
            tool_calls (list): Tool calls from OpenAI response.
            user_id (UUID): Authenticated user ID.
            session (AsyncSession): Database session.
            messages (list): Conversation messages (for context in logs).

        Returns:
            list[dict]: Tool call metadata with results.
        """
        tool_calls_metadata = []

        # Enforce maximum tool calls limit
        if len(tool_calls) > MAX_TOOL_CALLS_PER_MESSAGE:
            logger.warning(
                f"Tool calls limit exceeded: {len(tool_calls)} > {MAX_TOOL_CALLS_PER_MESSAGE}",
                extra={"user_id": str(user_id)}
            )
            tool_calls = tool_calls[:MAX_TOOL_CALLS_PER_MESSAGE]

        # Execute each tool call
        for tool_call in tool_calls:
            tool_name = tool_call.function.name
            tool_call_id = tool_call.id

            try:
                # Parse tool parameters
                parameters = json.loads(tool_call.function.arguments)

                # Log tool call
                logger.info(
                    f"Executing tool: {tool_name}",
                    extra={
                        "user_id": str(user_id),
                        "tool": tool_name,
                        "tool_call_id": tool_call_id,
                        "parameters": parameters
                    }
                )

                # Invoke tool through MCP server
                result = await self.mcp_server.invoke_tool(
                    tool_name=tool_name,
                    parameters=parameters,
                    user_id=user_id,
                    session=session
                )

                # Record tool call metadata
                tool_calls_metadata.append({
                    "tool": tool_name,
                    "tool_call_id": tool_call_id,
                    "parameters": parameters,
                    "result": result,
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "success": result.get("success", False),
                    "error": result.get("error") if not result.get("success") else None
                })

                # Log tool result
                logger.info(
                    f"Tool execution completed: {tool_name}",
                    extra={
                        "user_id": str(user_id),
                        "tool": tool_name,
                        "tool_call_id": tool_call_id,
                        "success": result.get("success", False)
                    }
                )

            except json.JSONDecodeError as e:
                # Invalid JSON in tool arguments
                logger.error(
                    f"Invalid tool arguments JSON: {tool_name}",
                    extra={
                        "user_id": str(user_id),
                        "tool": tool_name,
                        "tool_call_id": tool_call_id,
                        "error": str(e)
                    }
                )
                tool_calls_metadata.append({
                    "tool": tool_name,
                    "tool_call_id": tool_call_id,
                    "parameters": {},
                    "result": {
                        "success": False,
                        "error": "INVALID_ARGUMENTS",
                        "message": "Invalid tool arguments format"
                    },
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "success": False,
                    "error": "INVALID_ARGUMENTS"
                })

            except Exception as e:
                # Unexpected error during tool execution
                logger.error(
                    f"Tool execution error: {tool_name}",
                    extra={
                        "user_id": str(user_id),
                        "tool": tool_name,
                        "tool_call_id": tool_call_id,
                        "error_type": type(e).__name__,
                        "error": str(e)
                    },
                    exc_info=True
                )
                tool_calls_metadata.append({
                    "tool": tool_name,
                    "tool_call_id": tool_call_id,
                    "parameters": {},
                    "result": {
                        "success": False,
                        "error": "TOOL_EXECUTION_ERROR",
                        "message": "An error occurred during tool execution"
                    },
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "success": False,
                    "error": "TOOL_EXECUTION_ERROR"
                })

        return tool_calls_metadata

    def _prepare_messages(
        self,
        conversation_history: list[dict[str, str]],
        new_message: str
    ) -> list[dict[str, str]]:
        """
        Prepare messages for OpenAI API call.

        Combines system prompt, conversation history, and new user message
        into the format expected by OpenAI chat completions API.

        Args:
            conversation_history (list[dict]): Previous messages.
            new_message (str): Current user message.

        Returns:
            list[dict]: Messages in OpenAI format.
        """
        messages = [
            {"role": "system", "content": self.system_prompt}
        ]

        # Add conversation history
        messages.extend(conversation_history)

        # Add new user message
        messages.append({"role": "user", "content": new_message})

        return messages

    def _truncate_history(
        self,
        conversation_history: list[dict[str, str]]
    ) -> list[dict[str, str]]:
        """
        Truncate conversation history to fit within context window.

        Keeps only the most recent messages up to MAX_HISTORY_MESSAGES limit.
        Uses oldest_first truncation strategy (removes oldest messages).

        Args:
            conversation_history (list[dict]): Full conversation history.

        Returns:
            list[dict]: Truncated conversation history.
        """
        max_messages = self.conversation_config["max_history_messages"]

        if len(conversation_history) <= max_messages:
            return conversation_history

        # Keep only the most recent messages
        truncated = conversation_history[-max_messages:]

        logger.info(
            "Conversation history truncated",
            extra={
                "original_length": len(conversation_history),
                "truncated_length": len(truncated),
                "max_messages": max_messages
            }
        )

        return truncated
