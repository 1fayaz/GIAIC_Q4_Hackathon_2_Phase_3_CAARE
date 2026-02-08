"""
Authentication dependencies for FastAPI route protection.

This module provides reusable authentication dependencies that verify JWT tokens
and extract the current authenticated user for protected endpoints.

SECURITY: Uses httpOnly cookies for token storage (XSS protection)
"""

from typing import Optional
from fastapi import Depends, HTTPException, status, Request, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError, ExpiredSignatureError

from app.core.auth import decode_token
from app.core.database import get_session
from app.models.user import User


async def get_current_user(
    request: Request,
    session: AsyncSession = Depends(get_session),
    auth_token: Optional[str] = Cookie(None)
) -> User:
    """
    FastAPI dependency that verifies JWT token from httpOnly cookie and returns the authenticated user.

    SECURITY: This dependency extracts the JWT token from the httpOnly cookie (not Authorization header),
    verifies the token signature and expiration, extracts the user_id from the token
    payload, queries the database to retrieve the User object, and returns it.

    This provides XSS protection as JavaScript cannot access httpOnly cookies.

    This dependency should be used on all protected endpoints to enforce authentication
    and provide access to the current user's identity.

    Args:
        request: FastAPI Request object
        session: AsyncSession for database queries (injected by FastAPI)
        auth_token: JWT token from httpOnly cookie (injected by FastAPI)

    Returns:
        User: The authenticated user object from the database

    Raises:
        HTTPException(401): If token is missing, invalid, expired, or signature verification fails
        HTTPException(404): If user_id from token does not exist in database

    Example:
        @app.get("/api/tasks")
        async def list_tasks(
            current_user: User = Depends(get_current_user)
        ):
            # current_user is automatically populated from cookie
            # ... rest of endpoint logic
    """
    # Extract token from httpOnly cookie
    token = auth_token

    # Verify token is present
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # Decode and verify JWT token
        payload = decode_token(token)

        # Extract user_id from token payload
        user_id: Optional[str] = payload.get("user_id")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

    except ExpiredSignatureError:
        # Token has expired
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        # Invalid token signature or malformed token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Query database to get User by user_id
    result = await session.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user
