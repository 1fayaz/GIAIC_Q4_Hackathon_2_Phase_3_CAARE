"""
Database engine and session management for Neon Serverless PostgreSQL.

This module provides async database connectivity using SQLAlchemy's async engine
with asyncpg driver, optimized for Neon's serverless architecture with connection
pooling configuration.
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import SQLModel
from app.core.config import get_settings

# Load settings
settings = get_settings()

# Create async engine with connection pooling optimized for Neon Serverless PostgreSQL
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,  # Set to True for SQL query logging during development
    future=True,
    pool_size=10,  # Number of connections to maintain in the pool
    max_overflow=5,  # Maximum number of connections that can be created beyond pool_size
    pool_timeout=30,  # Seconds to wait before giving up on getting a connection
    pool_recycle=3600,  # Recycle connections after 1 hour (important for serverless)
    pool_pre_ping=True,  # Verify connections before using them
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Prevent lazy-loading issues after commit
    autocommit=False,
    autoflush=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Async generator that provides database sessions for dependency injection.

    This function is designed to be used as a FastAPI dependency to provide
    database sessions to route handlers. It ensures proper session lifecycle
    management with automatic cleanup.

    Yields:
        AsyncSession: An async database session

    Example:
        @app.get("/tasks")
        async def get_tasks(session: AsyncSession = Depends(get_session)):
            tasks = await session.exec(select(Task))
            return tasks
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def create_db_and_tables() -> None:
    """
    Create all database tables defined in SQLModel metadata.

    This function should be called during application startup to ensure
    all tables exist. It uses SQLModel's metadata to create tables based
    on model definitions.

    Note:
        In production, use Alembic migrations instead of this function.
        This is suitable for development and testing environments.

    Example:
        @app.on_event("startup")
        async def on_startup():
            await create_db_and_tables()
    """
    async with engine.begin() as conn:
        # Import all models here to ensure they're registered with SQLModel
        from app.models.task import Task  # noqa: F401
        from app.models.user import User  # noqa: F401

        # Create all tables
        await conn.run_sync(SQLModel.metadata.create_all)


async def close_db_connection() -> None:
    """
    Close database engine and dispose of connection pool.

    This function should be called during application shutdown to ensure
    proper cleanup of database connections.

    Example:
        @app.on_event("shutdown")
        async def on_shutdown():
            await close_db_connection()
    """
    await engine.dispose()
