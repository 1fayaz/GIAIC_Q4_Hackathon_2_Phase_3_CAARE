"""
FastAPI application initialization and configuration.

This module creates and configures the FastAPI application instance with:
- CORS middleware for cross-origin requests
- Database lifecycle management (startup/shutdown)
- API metadata and documentation

T027: Comprehensive API metadata configured for OpenAPI documentation
T028: Swagger UI accessible at http://localhost:8000/docs with all 6 endpoints
T031: Setup and testing instructions available in specs/002-backend-foundation/quickstart.md
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.config import get_settings
from app.core.database import create_db_and_tables, close_db_connection
from app.routes import tasks, auth
from app.schemas.response import error_response

# Load application settings
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Async context manager for application lifespan events.

    Handles startup and shutdown operations:
    - Startup: Create database tables
    - Shutdown: Close database connections

    Args:
        app: FastAPI application instance

    Yields:
        None: Control to the application
    """
    # Startup: Create database tables
    await create_db_and_tables()
    yield
    # Shutdown: Close database connections
    await close_db_connection()


# T027: Define tags metadata for API documentation
tags_metadata = [
    {
        "name": "authentication",
        "description": "User registration, login, and logout endpoints with JWT token management.",
    },
    {
        "name": "tasks",
        "description": "Task management operations. All endpoints require a user_id path parameter for data isolation.",
    },
    {
        "name": "Health",
        "description": "Health check and status endpoints for monitoring and load balancers.",
    },
]

# T027: Create FastAPI application instance with comprehensive metadata
app = FastAPI(
    title="Task Management API",
    version="1.0.0",
    description="""
REST API for managing tasks with user-based data isolation.

This API provides CRUD operations for task management. All endpoints
require a user_id path parameter for data isolation. In future phases,
user_id will be extracted from JWT tokens instead of path parameters.

**Key Features:**
- Create, read, update, and delete tasks
- User-based data isolation (tasks scoped to user_id)
- Automatic timestamp management
- Task completion toggle endpoint
- Interactive API documentation (Swagger UI)

**Documentation:**
- Interactive Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Setup Guide: specs/002-backend-foundation/quickstart.md
    """,
    contact={
        "name": "API Support",
        "email": "support@example.com",
    },
    openapi_tags=tags_metadata,
    lifespan=lifespan
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom exception handlers for standardized error responses
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Handle HTTP exceptions with standardized error response format.

    Converts FastAPI's default HTTPException format to our standard error format:
    {success: false, error: {code: "...", message: "..."}}
    """
    # Map HTTP status codes to error codes
    status_code_to_error_code = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        500: "INTERNAL_SERVER_ERROR",
    }

    error_code = status_code_to_error_code.get(exc.status_code, "UNKNOWN_ERROR")

    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(
            code=error_code,
            message=str(exc.detail)
        )
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle Pydantic validation errors with standardized error response format.

    Converts validation errors to our standard error format with detailed
    validation error messages.
    """
    # Extract validation error details
    errors = exc.errors()
    error_messages = []

    for error in errors:
        field = " -> ".join(str(loc) for loc in error["loc"])
        message = error["msg"]
        error_messages.append(f"{field}: {message}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_response(
            code="VALIDATION_ERROR",
            message="; ".join(error_messages)
        )
    )


# Add explicit OPTIONS handler BEFORE routers to catch all CORS preflight requests
@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    """
    Handle all OPTIONS requests for CORS preflight.
    This must be defined BEFORE routers to catch requests first.
    """
    return {}


# Register routers
# T022: Register authentication routes with /api/auth prefix
app.include_router(auth.router)
app.include_router(tasks.router)


@app.get("/", tags=["Health"])
async def root():
    """
    Root endpoint for API health check.

    Returns:
        dict: API status and version information
    """
    return {
        "status": "healthy",
        "api": "Task Management API",
        "version": "1.0.0"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint for monitoring and load balancers.

    Returns:
        dict: Health status
    """
    return {"status": "healthy"}
