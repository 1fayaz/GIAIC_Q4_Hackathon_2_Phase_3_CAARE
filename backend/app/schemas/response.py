"""
Standard response wrapper schemas for consistent API responses.

This module provides standardized response formats for all API endpoints,
ensuring consistent structure for both success and error responses across
the entire application.
"""

from typing import Any, Optional, Generic, TypeVar
from pydantic import BaseModel, Field

# Generic type for data payload
T = TypeVar('T')


class ErrorDetail(BaseModel):
    """
    Standard error detail structure.

    Attributes:
        code: Error code (e.g., "UNAUTHORIZED", "NOT_FOUND", "VALIDATION_ERROR")
        message: Human-readable error message
    """
    code: str = Field(
        description="Error code identifying the type of error"
    )
    message: str = Field(
        description="Human-readable error message"
    )


class ErrorResponse(BaseModel):
    """
    Standard error response format.

    Used for all error responses across the API to ensure consistency.

    Attributes:
        success: Always False for error responses
        error: Error details with code and message
    """
    success: bool = Field(
        default=False,
        description="Always False for error responses"
    )
    error: ErrorDetail = Field(
        description="Error details"
    )


class SuccessResponse(BaseModel, Generic[T]):
    """
    Standard success response format.

    Used for all successful API responses to ensure consistency.
    Generic type T allows for type-safe data payloads.

    Attributes:
        success: Always True for success responses
        data: Response data (type varies by endpoint)
        message: Optional success message
    """
    success: bool = Field(
        default=True,
        description="Always True for success responses"
    )
    data: T = Field(
        description="Response data"
    )
    message: Optional[str] = Field(
        default=None,
        description="Optional success message"
    )


def success_response(data: Any, message: Optional[str] = None) -> dict:
    """
    Helper function to create standardized success responses.

    Args:
        data: The response data to wrap
        message: Optional success message

    Returns:
        dict: Standardized success response

    Example:
        return success_response(
            data={"id": "123", "title": "Task"},
            message="Task created successfully"
        )
    """
    response = {
        "success": True,
        "data": data
    }
    if message:
        response["message"] = message
    return response


def error_response(code: str, message: str) -> dict:
    """
    Helper function to create standardized error responses.

    Args:
        code: Error code (e.g., "UNAUTHORIZED", "NOT_FOUND")
        message: Human-readable error message

    Returns:
        dict: Standardized error response

    Example:
        return error_response(
            code="NOT_FOUND",
            message="Task not found"
        )
    """
    return {
        "success": False,
        "error": {
            "code": code,
            "message": message
        }
    }
