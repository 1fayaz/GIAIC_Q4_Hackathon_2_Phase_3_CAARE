"""
Schemas package for API request/response validation.

This package contains Pydantic models for validating and serializing
data in API endpoints.
"""

from .task import TaskCreate, TaskUpdate, TaskResponse
from .auth import (
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    UserInfo,
)

__all__ = [
    "TaskCreate",
    "TaskUpdate",
    "TaskResponse",
    "RegisterRequest",
    "LoginRequest",
    "AuthResponse",
    "UserInfo",
]
