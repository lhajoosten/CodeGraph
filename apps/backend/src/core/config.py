"""Application configuration management using Pydantic Settings."""

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
    debug: bool = False

    # Server
    host: str = "127.0.0.1"
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
    refresh_token_expire_hours: int = 4  # Default expiry (without remember_me)
    refresh_token_expire_days: int = 7  # Extended expiry (with remember_me)

    # Two-Factor Authentication
    two_factor_mandatory: bool = False  # Set True to enforce 2FA for all users

    # Encryption Key (for OAuth tokens, sensitive data)
    # IMPORTANT: Should be unique per environment, stored securely
    # Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    encryption_key: str | None = None

    # Cookie Settings
    cookie_domain: str = "localhost"
    cookie_secure: bool = False  # Set to True in production with HTTPS
    cookie_samesite: str = "lax"  # 'strict', 'lax', or 'none'

    # CSRF Protection
    csrf_secret_key: str = "dev-csrf-secret-key-change-in-production"

    # Session Management
    session_expire_hours: int = 168  # 7 days
    max_sessions_per_user: int = 5

    # URLs
    backend_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:5173"

    # CORS
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    cors_allow_credentials: bool = True

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list[str]) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    # Anthropic API (optional - only needed when USE_LOCAL_LLM=false)
    # For local development, you can leave this empty
    anthropic_api_key: str = ""
    anthropic_default_model: str = "claude-haiku-4-5-20251001"

    # LangSmith Tracing (optional)
    # Set LANGCHAIN_TRACING_V2=true in .env to enable
    # Set LANGCHAIN_API_KEY to your LangSmith API key
    langchain_tracing_v2: bool = False
    langchain_api_key: str | None = None
    langchain_project: str = "codegraph"
    langchain_endpoint: str = "https://api.smith.langchain.com"

    # Local LLM Configuration (default for development)
    # Uses vLLM with Qwen2.5-Coder-14B for cost-free local development
    # Set USE_LOCAL_LLM=false to use Claude API instead (requires ANTHROPIC_API_KEY)
    use_local_llm: bool = True
    local_llm_base_url: str = "http://localhost:8001/v1"
    local_llm_model: str = "Qwen/Qwen2.5-Coder-14B-Instruct-AWQ"

    # GitHub Integration (for code operations)
    github_token: str | None = None

    # OAuth - GitHub
    github_client_id: str | None = None
    github_client_secret: str | None = None

    # OAuth - Google
    google_client_id: str | None = None
    google_client_secret: str | None = None

    # OAuth - Microsoft
    microsoft_client_id: str | None = None
    microsoft_client_secret: str | None = None

    # Email Service (SMTP)
    email_service_mode: str = "mock"  # 'mock' for development, 'smtp' for production
    smtp_host: str = "localhost"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "noreply@codegraph.dev"
    smtp_from_name: str = "CodeGraph"
    smtp_use_tls: bool = True

    # Email Token Expiry
    email_verification_token_expire_hours: int = 24
    password_reset_token_expire_hours: int = 1

    # Agent Configuration
    max_agent_iterations: int = 20
    agent_timeout_seconds: int = 300

    # Tool Execution Configuration
    max_tool_iterations: int = 10  # Max ReAct loop iterations per agent node
    enable_tool_execution: bool = True  # Whether agents can execute tools

    # Council Review
    # When True, uses multiple judges (personas for local vLLM, models for Claude API)
    # When False, uses single reviewer
    use_council_review: bool = True

    # Council judge personas for local vLLM mode
    # Options: security, performance, maintainability
    council_judges: list[str] = ["security", "performance", "maintainability"]

    # Caching Configuration
    enable_result_caching: bool = False
    enable_plan_caching: bool = False
    cache_ttl_seconds: int = 3600

    # Workflow Error Recovery
    enable_error_recovery: bool = True
    max_retry_attempts: int = 3

    # Workflow Checkpointing
    # When True, workflow state is persisted to PostgreSQL for resumption
    enable_checkpointing: bool = False

    # Test Execution
    # When True, actually runs pytest in isolated temp directories
    # When False (default), uses simulated test execution
    enable_real_test_execution: bool = False
    test_execution_timeout: int = 30  # seconds

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
