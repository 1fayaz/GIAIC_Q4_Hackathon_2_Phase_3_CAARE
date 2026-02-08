"""
Authentication utilities for password hashing and JWT token management.

This module provides secure password hashing using bcrypt and JWT token
creation/verification for user authentication.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from .config import get_settings

# Initialize settings
settings = get_settings()

# Password hashing context using bcrypt
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12  # Cost factor (default, provides good security/performance balance)
)


def hash_password(password: str) -> str:
    """
    Hash a plain text password using bcrypt.

    Uses bcrypt with 12 rounds (default cost factor) for secure password hashing.
    Each hash includes a random salt to prevent rainbow table attacks.

    Args:
        password: Plain text password to hash

    Returns:
        str: Bcrypt-hashed password string (safe to store in database)

    Example:
        >>> hashed = hash_password("my_secure_password")
        >>> # Store hashed in database, never store plain password
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a bcrypt hash.

    Compares the provided plain text password with the stored hash to
    authenticate a user during login.

    Args:
        plain_password: Plain text password provided by user
        hashed_password: Bcrypt hash stored in database

    Returns:
        bool: True if password matches hash, False otherwise

    Example:
        >>> is_valid = verify_password("user_input", stored_hash)
        >>> if is_valid:
        >>>     # Password is correct, proceed with login
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token with user identity claims.

    Generates a signed JWT token containing user information and expiration time.
    The token is signed with the application's JWT_SECRET and can be verified
    by the backend to authenticate API requests.

    Args:
        data: Dictionary of claims to include in token (typically user_id and email)
        expires_delta: Optional custom expiration time. If None, uses JWT_EXPIRATION from settings

    Returns:
        str: Encoded JWT token string

    Example:
        >>> token = create_access_token(
        >>>     data={"user_id": str(user.id), "email": user.email}
        >>> )
        >>> # Return token to client for use in Authorization header
    """
    to_encode = data.copy()

    # Set expiration time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(seconds=settings.JWT_EXPIRATION)

    # Add standard JWT claims
    to_encode.update({
        "exp": expire,  # Expiration time
        "iat": datetime.utcnow()  # Issued at time
    })

    # Encode and sign the token
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )

    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and verify a JWT token, raising an exception if invalid.

    Verifies the token signature and decodes the payload. Raises JWTError
    if the token is invalid, expired, or has an invalid signature.

    Args:
        token: JWT token string to decode

    Returns:
        dict: Decoded token payload containing user claims

    Raises:
        JWTError: If token is invalid, expired, or signature verification fails

    Example:
        >>> try:
        >>>     payload = decode_token(token)
        >>>     user_id = payload.get("user_id")
        >>> except JWTError:
        >>>     # Token is invalid, return 401 Unauthorized
    """
    payload = jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALGORITHM]
    )
    return payload


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify a JWT token and return payload, or None if invalid.

    Similar to decode_token but returns None instead of raising an exception
    when the token is invalid. Useful for optional authentication scenarios.

    Args:
        token: JWT token string to verify

    Returns:
        dict: Decoded token payload if valid, None if invalid

    Example:
        >>> payload = verify_token(token)
        >>> if payload:
        >>>     user_id = payload.get("user_id")
        >>> else:
        >>>     # Token is invalid, handle accordingly
    """
    try:
        payload = decode_token(token)
        return payload
    except JWTError:
        return None
