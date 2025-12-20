"""Application configuration management using Pydantic Settings."""

from typing import List

from pydantic import PostgresDsn, RedisDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "CodeGraph"
    app_version: str = "0.1.0"
    environment: str = "development"
    debug: bool = True

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Database
    database_url: PostgresDsn
    db_echo: bool = False
    db_pool_size: int = 20
    db_max_overflow: int = 0

    # Redis
    redis_url: RedisDsn
    redis_cache_ttl: int = 3600

    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # CORS
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    cors_allow_credentials: bool = True

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | List[str]) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    # Anthropic API
    anthropic_api_key: str
    anthropic_default_model: str = "claude-sonnet-4-20250514"

    # LangSmith (optional)
    langsmith_api_key: str | None = None
    langsmith_project: str = "codegraph"
    langsmith_tracing: bool = False

    # GitHub Integration
    github_token: str | None = None

    # Agent Configuration
    max_agent_iterations: int = 20
    agent_timeout_seconds: int = 300

    # Logging
    log_level: str = "INFO"
    log_format: str = "json"

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.environment == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.environment == "production"


# Global settings instance
settings = Settings()
