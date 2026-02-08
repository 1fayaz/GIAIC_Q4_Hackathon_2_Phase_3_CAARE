"""
Configuration management using Pydantic BaseSettings.

Loads environment variables from .env file and provides type-safe access
to application configuration.
"""

from typing import List
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    All settings are validated and type-checked using Pydantic.
    """

    # Database Configuration
    DATABASE_URL: str = Field(
        ...,
        description="PostgreSQL connection string with asyncpg driver"
    )

    # CORS Configuration
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000"],
        description="Allowed origins for CORS"
    )

    # Logging Configuration
    LOG_LEVEL: str = Field(
        default="INFO",
        description="Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)"
    )

    # JWT Authentication Configuration
    JWT_SECRET: str = Field(
        ...,
        description="Secret key for JWT token signing (minimum 32 characters)"
    )
    JWT_ALGORITHM: str = Field(
        default="HS256",
        description="Algorithm used for JWT token signing"
    )
    JWT_EXPIRATION: int = Field(
        default=3600,
        description="JWT token expiration time in seconds (default: 1 hour)"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """
        Validate that DATABASE_URL uses the asyncpg driver.

        Args:
            v: The database URL string

        Returns:
            The validated database URL

        Raises:
            ValueError: If the URL doesn't use postgresql+asyncpg driver
        """
        if not v.startswith("postgresql+asyncpg://"):
            raise ValueError(
                "DATABASE_URL must use asyncpg driver. "
                "Expected format: postgresql+asyncpg://user:password@host/database"
            )
        return v

    @field_validator("LOG_LEVEL")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """
        Validate that LOG_LEVEL is a valid logging level.

        Args:
            v: The log level string

        Returns:
            The validated log level in uppercase

        Raises:
            ValueError: If the log level is not valid
        """
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        v_upper = v.upper()
        if v_upper not in valid_levels:
            raise ValueError(
                f"LOG_LEVEL must be one of {valid_levels}, got: {v}"
            )
        return v_upper

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v) -> List[str]:
        """
        Parse CORS_ORIGINS from string or list.

        Handles both JSON array strings and Python lists.

        Args:
            v: The CORS origins value (string or list)

        Returns:
            List of origin strings
        """
        if isinstance(v, str):
            # Handle JSON array format from .env file
            import json
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                # If not JSON, treat as single origin
                return [v]
        return v


def get_settings() -> Settings:
    """
    Get application settings instance.

    This function creates and returns a Settings instance, loading
    configuration from environment variables and .env file.

    Returns:
        Settings: Validated application settings

    Raises:
        ValidationError: If required environment variables are missing or invalid
    """
    return Settings()
