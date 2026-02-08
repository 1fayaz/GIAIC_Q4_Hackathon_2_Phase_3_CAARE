"""
Pydantic schemas for Authentication API request/response validation.

This module defines the data transfer objects (DTOs) for authentication-related
API endpoints, providing strict validation, type checking, and serialization for
user registration, login, and JWT token responses.
"""

from uuid import UUID
from pydantic import BaseModel, Field, EmailStr, field_validator, ConfigDict


class RegisterRequest(BaseModel):
    """
    Request schema for user registration.

    Validates user registration data with strict constraints on email format
    and password strength. Ensures email is valid and password meets minimum
    security requirements.

    Attributes:
        email: User's email address (must be valid format, max 255 chars)
        password: User's password (min 8 chars, max 128 chars, will be hashed)
    """

    email: EmailStr = Field(
        ...,
        max_length=255,
        description="User's email address (must be unique)"
    )

    password: str = Field(
        ...,
        min_length=12,
        max_length=128,
        description="User's password (min 12 chars, must contain letter, number, and special character)"
    )

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """
        Validate password meets strengthened security requirements.

        SECURITY: Enforces strong password policy:
        - Minimum 12 characters
        - At least one letter (uppercase or lowercase)
        - At least one number
        - At least one special character (@$!%*#?&)
        - No empty or whitespace-only passwords

        Args:
            v: The password string to validate

        Returns:
            The validated password string

        Raises:
            ValueError: If password doesn't meet security requirements
        """
        import re

        if not v or not v.strip():
            raise ValueError("Password cannot be empty or contain only whitespace")

        if len(v) < 12:
            raise ValueError("Password must be at least 12 characters long")

        # Check for at least one letter
        if not re.search(r'[A-Za-z]', v):
            raise ValueError("Password must contain at least one letter")

        # Check for at least one number
        if not re.search(r'\d', v):
            raise ValueError("Password must contain at least one number")

        # Check for at least one special character
        if not re.search(r'[@$!%*#?&]', v):
            raise ValueError("Password must contain at least one special character (@$!%*#?&)")

        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "password": "SecurePass123!"
            }
        }
    )


class LoginRequest(BaseModel):
    """
    Request schema for user login.

    Validates user login credentials with email format validation.
    Simple validation for required fields only.

    Attributes:
        email: User's email address (must be valid format)
        password: User's password (plain text, will be verified against hash)
    """

    email: EmailStr = Field(
        ...,
        description="User's email address"
    )

    password: str = Field(
        ...,
        description="User's password"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "password": "SecurePass123!"
            }
        }
    )


class UserInfo(BaseModel):
    """
    Response schema for user information included in authentication responses.

    Represents the user information returned after successful authentication.
    Does NOT include sensitive data like hashed_password for security.

    Attributes:
        id: User's unique identifier (UUID)
        email: User's email address
    """

    id: UUID = Field(
        description="User's unique identifier"
    )

    email: EmailStr = Field(
        description="User's email address"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "email": "user@example.com"
            }
        }
    )


class AuthResponse(BaseModel):
    """
    Response schema for authentication endpoints (login and registration).

    Returned after successful user registration or login. Contains the JWT
    access token that must be included in the Authorization header for all
    subsequent authenticated requests.

    Attributes:
        access_token: JWT access token (include as "Bearer <token>" in Authorization header)
        token_type: Token type (always "bearer")
        user: User information (id and email)
        expires_at: ISO 8601 timestamp when the token expires
    """

    access_token: str = Field(
        description="JWT access token (include in Authorization header as 'Bearer <token>')"
    )

    token_type: str = Field(
        default="bearer",
        description="Token type (always 'bearer')"
    )

    user: UserInfo = Field(
        description="User information (id and email)"
    )

    expires_at: str = Field(
        description="ISO 8601 timestamp when the token expires (e.g., '2024-01-02T12:00:00Z')"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAwIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxMjM0NTY3ODkwLCJleHAiOjEyMzQ1NzE0OTB9.signature",
                "token_type": "bearer",
                "user": {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "email": "user@example.com"
                },
                "expires_at": "2024-01-02T12:00:00Z"
            }
        }
    )
