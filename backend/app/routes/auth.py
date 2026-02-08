"""
Authentication routes for user registration, login, and logout.

This module implements JWT-based authentication endpoints that handle user
registration, login, and logout operations. All endpoints follow the API
contract defined in specs/002-auth-integration/contracts/auth-api.yaml.

Security Features:
- Passwords hashed with bcrypt before storage
- JWT tokens with configurable expiration
- HttpOnly cookies for secure token storage (XSS protection)
- Secure, SameSite cookies for CSRF protection
- Generic error messages to prevent user enumeration
- Proper HTTP status codes for different scenarios
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from app.core.database import get_session
from app.core.auth import hash_password, verify_password, create_access_token
from app.core.config import get_settings
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse, UserInfo
from app.dependencies.auth import get_current_user

# Initialize settings
settings = get_settings()

# Create router with prefix and tags
router = APIRouter(
    prefix="/api/auth",
    tags=["authentication"]
)


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Creates a new user account with email and password. Sets JWT token in httpOnly cookie."
)
async def register(
    request: RegisterRequest,
    response: Response,
    session: AsyncSession = Depends(get_session)
) -> AuthResponse:
    """
    Register a new user account.

    Creates a new user with the provided email and password. Password is hashed
    with bcrypt before storage. Sets JWT access token in httpOnly cookie for security.

    Args:
        request: RegisterRequest containing email and password
        response: FastAPI Response object for setting cookies
        session: Database session (injected)

    Returns:
        AuthResponse: User information with token expiration (token set in httpOnly cookie)

    Raises:
        HTTPException 409: Email already registered
        HTTPException 500: Database error

    Example:
        POST /api/auth/register
        {
            "email": "user@example.com",
            "password": "SecurePassword123!"
        }

        Response (201):
        {
            "access_token": "token_set_in_cookie",
            "token_type": "bearer",
            "user": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "email": "user@example.com"
            },
            "expires_at": "2024-01-02T12:00:00Z"
        }
        Set-Cookie: auth_token=<jwt>; HttpOnly; Secure; SameSite=Lax
    """
    from datetime import datetime, timedelta

    try:
        # Hash the password using bcrypt
        hashed_password = hash_password(request.password)

        # Create new user instance
        new_user = User(
            email=request.email,
            hashed_password=hashed_password
        )

        # Add user to database
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)

        # Generate JWT access token
        access_token = create_access_token(
            data={
                "user_id": str(new_user.id),
                "email": new_user.email
            }
        )

        # Calculate token expiration time
        expires_at = datetime.utcnow() + timedelta(seconds=settings.JWT_EXPIRATION)

        # Set token in httpOnly cookie for security (prevents XSS attacks)
        response.set_cookie(
            key="auth_token",
            value=access_token,
            httponly=True,  # Prevents JavaScript access (XSS protection)
            secure=False,   # Set to True in production with HTTPS, False for local dev
            samesite="lax", # CSRF protection
            max_age=settings.JWT_EXPIRATION,  # Cookie expiration matches token expiration
            path="/"        # Cookie available for all paths
        )

        # Return authentication response (token not included in body for security)
        return AuthResponse(
            access_token="token_set_in_cookie",
            token_type="bearer",
            user=UserInfo(
                id=new_user.id,
                email=new_user.email
            ),
            expires_at=expires_at.isoformat() + "Z"
        )

    except IntegrityError:
        # T023: Handle duplicate email (unique constraint violation)
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    except Exception as e:
        # Handle unexpected database errors
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during registration"
        )


@router.post(
    "/login",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Login with email and password",
    description="Authenticates user and sets JWT token in httpOnly cookie."
)
async def login(
    request: LoginRequest,
    response: Response,
    session: AsyncSession = Depends(get_session)
) -> AuthResponse:
    """
    Authenticate user and set JWT token in httpOnly cookie.

    Verifies user credentials (email and password) and sets JWT access token
    in httpOnly cookie for security. Cookie is automatically sent with subsequent requests.

    Args:
        request: LoginRequest containing email and password
        response: FastAPI Response object for setting cookies
        session: Database session (injected)

    Returns:
        AuthResponse: User information with token expiration (token set in httpOnly cookie)

    Raises:
        HTTPException 401: Invalid email or password

    Example:
        POST /api/auth/login
        {
            "email": "user@example.com",
            "password": "SecurePassword123!"
        }

        Response (200):
        {
            "access_token": "token_set_in_cookie",
            "token_type": "bearer",
            "user": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "email": "user@example.com"
            },
            "expires_at": "2024-01-02T12:00:00Z"
        }
        Set-Cookie: auth_token=<jwt>; HttpOnly; Secure; SameSite=Lax
    """
    from datetime import datetime, timedelta

    # T024: Query user by email
    statement = select(User).where(User.email == request.email)
    result = await session.execute(statement)
    user = result.scalars().first()

    # T024: Return 401 if user not found (generic message to prevent enumeration)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # T024: Verify password using bcrypt
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Generate JWT access token
    access_token = create_access_token(
        data={
            "user_id": str(user.id),
            "email": user.email
        }
    )

    # Calculate token expiration time
    expires_at = datetime.utcnow() + timedelta(seconds=settings.JWT_EXPIRATION)

    # Set token in httpOnly cookie for security (prevents XSS attacks)
    response.set_cookie(
        key="auth_token",
        value=access_token,
        httponly=True,  # Prevents JavaScript access (XSS protection)
        secure=False,   # Set to True in production with HTTPS, False for local dev
        samesite="lax", # CSRF protection
        max_age=settings.JWT_EXPIRATION,  # Cookie expiration matches token expiration
        path="/"        # Cookie available for all paths
    )

    # Return authentication response (token not included in body for security)
    return AuthResponse(
        access_token="token_set_in_cookie",
        token_type="bearer",
        user=UserInfo(
            id=user.id,
            email=user.email
        ),
        expires_at=expires_at.isoformat() + "Z"
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout user",
    description="Logs out current user by clearing the httpOnly cookie."
)
async def logout(response: Response) -> dict:
    """
    Logout current user by clearing the authentication cookie.

    Clears the httpOnly cookie containing the JWT token, effectively logging
    out the user. The cookie is deleted by setting max_age to 0.

    Args:
        response: FastAPI Response object for clearing cookies

    Returns:
        dict: Success message

    Example:
        POST /api/auth/logout

        Response (200):
        {
            "success": true,
            "message": "Logged out successfully"
        }
        Set-Cookie: auth_token=; Max-Age=0; HttpOnly; Secure; SameSite=Lax
    """
    # Clear the authentication cookie by setting max_age to 0
    response.delete_cookie(
        key="auth_token",
        path="/",
        httponly=True,
        secure=False,  # Set to True in production with HTTPS, False for local dev
        samesite="lax"
    )

    return {
        "success": True,
        "message": "Logged out successfully"
    }


@router.get(
    "/session",
    status_code=status.HTTP_200_OK,
    summary="Get current session",
    description="Returns the current authenticated user's session information."
)
async def get_session(
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Get current authenticated user's session.

    Returns the current user's information from the JWT token stored in httpOnly cookie.
    This endpoint is used by the frontend to verify authentication status and load user data.

    Args:
        current_user: User object extracted from JWT token (injected by dependency)

    Returns:
        dict: Session information with user data and expiration

    Raises:
        HTTPException 401: If token is missing, invalid, or expired

    Example:
        GET /api/auth/session
        Cookie: auth_token=<jwt>

        Response (200):
        {
            "user": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "email": "user@example.com"
            },
            "expires_at": "2024-01-02T12:00:00Z"
        }
    """
    from datetime import datetime, timedelta

    # Calculate expiration time (same as JWT_EXPIRATION)
    expires_at = datetime.utcnow() + timedelta(seconds=settings.JWT_EXPIRATION)

    return {
        "user": {
            "id": str(current_user.id),
            "email": current_user.email
        },
        "expires_at": expires_at.isoformat() + "Z"
    }
