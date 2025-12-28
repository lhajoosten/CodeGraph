# CodeGraph Backend

FastAPI backend for the CodeGraph AI coding agent platform.

## Overview

This is the backend service for CodeGraph, built with FastAPI and Python 3.12+. It provides RESTful APIs for managing coding tasks, orchestrating AI agents, user authentication, and integrating with GitHub repositories.

## Tech Stack

- **FastAPI 0.127+**: Modern, high-performance async web framework
- **Python 3.12+**: Latest Python with full type hints
- **SQLAlchemy 2.0**: Async ORM for database operations
- **Pydantic v2**: Data validation and settings management
- **LangChain + LangGraph**: Agent orchestration and workflow management
- **Anthropic Claude**: AI capabilities via Claude models (Haiku/Sonnet/Opus 4.5)
- **vLLM**: Local LLM serving with Qwen 2.5 Coder (default for development)
- **PostgreSQL 16**: Primary database with pgvector extension
- **Redis**: Caching, sessions, and task queues
- **Alembic**: Database migrations
- **Poetry**: Dependency management
- **pytest**: Testing framework with async support

## Features

### Authentication & Security
- JWT-based authentication with access and refresh tokens
- Two-Factor Authentication (2FA) with TOTP and backup codes
- OAuth integration (GitHub, Google, Microsoft)
- Email verification flow
- Password reset functionality
- Session management with multi-device support
- CSRF protection

### Agent System
- **Planner Agent**: Task breakdown and orchestration
- **Coder Agent**: Code implementation and refactoring
- **Tester Agent**: Test generation and execution
- **Test Analyzer**: Parse test results and identify failures
- **Reviewer Agent**: Single-judge code review
- **Council Review**: Multi-judge review with security, performance, and maintainability perspectives
- **Code Parser/Formatter**: Code extraction and formatting utilities
- **Plan Validator**: Validate generated plans

### API Endpoints
- `/api/v1/auth/*` - Authentication (login, register, refresh, logout)
- `/api/v1/users/*` - User management
- `/api/v1/tasks/*` - Task CRUD and execution
- `/api/v1/agents/*` - Agent run tracking and streaming
- `/api/v1/metrics/*` - Usage metrics and cost tracking
- `/api/v1/two-factor/*` - 2FA setup and verification
- `/api/v1/webhooks/*` - Webhook management
- `/oauth/*` - OAuth callbacks (GitHub, Google, Microsoft)

## Project Structure

```
src/
├── main.py              # FastAPI app entry point
├── api/                 # API route handlers
│   ├── auth.py         # Authentication endpoints
│   ├── users.py        # User management
│   ├── tasks.py        # Task endpoints
│   ├── agents.py       # Agent run endpoints
│   ├── metrics.py      # Usage metrics
│   ├── two_factor.py   # 2FA endpoints
│   ├── webhooks.py     # Webhook endpoints
│   ├── oauth.py        # OAuth callbacks
│   └── deps.py         # Dependency injection
├── agents/              # LangGraph agent implementations
│   ├── graph.py        # Workflow graph definition
│   ├── state.py        # Workflow state typing
│   ├── planner.py      # Planning agent
│   ├── coder.py        # Coding agent
│   ├── tester.py       # Testing agent
│   ├── test_analyzer.py # Test result analysis
│   ├── reviewer.py     # Code review agent
│   ├── council.py      # Council review logic
│   ├── council_node.py # Council review node
│   ├── models.py       # LLM model factory
│   ├── base.py         # Base agent utilities
│   ├── streaming.py    # SSE streaming
│   ├── tracking.py     # Agent run tracking
│   ├── tracing.py      # LangSmith integration
│   ├── code_parser.py  # Code extraction
│   ├── code_formatter.py # Code formatting
│   ├── plan_validator.py # Plan validation
│   └── workflows.py    # Workflow definitions
├── models/              # SQLAlchemy database models
│   ├── base.py         # Base model class
│   ├── user.py         # User model
│   ├── task.py         # Task model
│   ├── agent_run.py    # Agent run model
│   ├── repository.py   # Repository model
│   ├── council_review.py # Council review model
│   ├── usage_metrics.py # Usage tracking
│   ├── oauth_account.py # OAuth accounts
│   ├── refresh_token.py # Refresh tokens
│   ├── user_session.py # User sessions
│   ├── backup_code.py  # 2FA backup codes
│   ├── email_verification_token.py
│   ├── password_reset_token.py
│   └── webhook.py      # Webhook model
├── schemas/             # Pydantic validation schemas
│   ├── user.py         # User schemas
│   ├── task.py         # Task schemas
│   ├── agent.py        # Agent schemas
│   ├── council.py      # Council review schemas
│   ├── metrics.py      # Metrics schemas
│   ├── webhook.py      # Webhook schemas
│   └── error.py        # Error schemas
├── services/            # Business logic layer
│   ├── auth_service.py # Authentication logic
│   ├── task_service.py # Task management
│   ├── agent_run_service.py # Agent run tracking
│   ├── metrics_service.py # Usage metrics
│   ├── cost_calculator.py # Cost calculation
│   ├── two_factor_service.py # 2FA logic
│   ├── oauth_service.py # OAuth logic
│   ├── webhook_service.py # Webhook handling
│   ├── cache_service.py # Redis caching
│   ├── execution_history_service.py
│   └── email/          # Email service
│       ├── base.py     # Base email interface
│       ├── smtp.py     # SMTP implementation
│       └── mock.py     # Mock for testing
├── core/                # Core configurations
│   ├── config.py       # Settings (from env)
│   ├── database.py     # DB session factory
│   ├── security.py     # JWT, password hashing
│   ├── cookies.py      # Cookie handling
│   ├── csrf.py         # CSRF protection
│   ├── encryption.py   # Data encryption
│   ├── logging.py      # Structured logging
│   ├── exceptions.py   # Custom exceptions
│   ├── exception_handlers.py
│   └── error_codes.py  # Error code definitions
├── tools/               # Agent tools
│   └── file_operations.py # File read/write tools
└── utils/               # Helper functions
    └── github.py       # GitHub API integration

tests/
├── unit/               # Unit tests
├── integration/        # Integration tests
├── ai/                 # AI agent tests (requires vLLM)
│   ├── fixtures/       # Test fixtures
│   └── utils/          # Test utilities
└── conftest.py         # Pytest fixtures

alembic/
└── versions/           # Migration files
```

## Setup

### Prerequisites

- Python 3.12 or higher
- Poetry for dependency management
- PostgreSQL 16
- Redis
- NVIDIA GPU with 16GB+ VRAM (for local LLM, optional)

### Installation

1. Install dependencies:
```bash
poetry install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start database and Redis:
```bash
make docker-up
```

4. Run database migrations:
```bash
make db-migrate
```

5. Start the development server:
```bash
make dev
```

The API will be available at `http://localhost:8000`.

### Local LLM Setup (Default)

CodeGraph defaults to using a local LLM (vLLM with Qwen 2.5 Coder) for cost-free development:

```bash
# Start all services including vLLM
cd ../../docker
docker-compose up -d

# Wait for model to load (~30-60 seconds)
curl http://localhost:8001/v1/models
```

**Requirements:**
- NVIDIA GPU with 16GB+ VRAM (RTX 4080/4090 or similar)
- Docker with NVIDIA Container Toolkit

**Switch to Claude API:**
```bash
# In your .env file:
USE_LOCAL_LLM=false
ANTHROPIC_API_KEY=sk-ant-...
```

## Development

### Quick Commands (Makefile)

```bash
# Setup
make install           # Install dependencies
make dev               # Start dev server

# Database
make db-setup          # Full database setup
make db-migrate        # Run migrations
make db-test           # Test connection
make db-reset          # Reset database (destructive!)

# Docker
make docker-up         # Start postgres, redis
make docker-down       # Stop containers
make docker-logs       # View logs

# Code Quality
make check             # Run lint + format + type-check
make lint              # Run ruff linter
make format            # Format with ruff
make type-check        # Run mypy

# Testing
make test              # Run all tests
make test-fast         # Unit + integration only
make test-ai           # AI tests (parallel, requires vLLM)
make test-ai-seq       # AI tests (sequential)
make test-cov          # Tests with coverage report
make test-ci           # CI tests (no AI)

# Cleanup
make clean             # Clean artifacts
```

### Running Tests

```bash
# Run all tests
poetry run pytest

# Run with coverage
poetry run pytest --cov=src --cov-report=html

# Run specific test categories
poetry run pytest tests/unit/              # Unit tests only
poetry run pytest tests/integration/       # Integration tests
poetry run pytest tests/ai/                # AI tests (requires vLLM)

# Run specific test file
poetry run pytest tests/unit/test_auth.py -v
```

### Code Quality

```bash
# Format code (ruff)
poetry run ruff format .

# Lint code (ruff)
poetry run ruff check . --fix

# Type checking (mypy)
poetry run mypy src/
```

### Database Migrations

```bash
# Create a new migration
poetry run alembic revision --autogenerate -m "description"

# Apply migrations
poetry run alembic upgrade head

# Rollback migration
poetry run alembic downgrade -1

# View history
poetry run alembic history
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/health`

## Configuration

All configuration is managed through environment variables. Key settings:

### Required
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/codegraph
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your_secret_key  # openssl rand -hex 32
```

### Local LLM (Default)
```env
USE_LOCAL_LLM=true
LOCAL_LLM_BASE_URL=http://localhost:8001/v1
LOCAL_LLM_MODEL=Qwen/Qwen2.5-Coder-14B-Instruct-AWQ
```

### Claude API (Optional)
```env
USE_LOCAL_LLM=false
ANTHROPIC_API_KEY=sk-ant-...
```

### Authentication
```env
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_HOURS=4
TWO_FACTOR_MANDATORY=false
```

### OAuth (Optional)
```env
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
```

### Email (Optional)
```env
EMAIL_SERVICE_MODE=mock  # 'mock' or 'smtp'
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=...
SMTP_PASSWORD=...
```

### Agent Configuration
```env
USE_COUNCIL_REVIEW=true
COUNCIL_JUDGES=security,performance,maintainability
MAX_AGENT_ITERATIONS=20
AGENT_TIMEOUT_SECONDS=300
```

### Observability (Optional)
```env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=...
LANGCHAIN_PROJECT=codegraph
```

## Agent Architecture

The backend implements a multi-agent system using LangGraph:

```
START → Planner → Coder → Tester → Reviewer → (conditional) → END
                    ↑                              │
                    └────── Revision Loop ─────────┘
```

### Agents

1. **Planner Agent**: Analyzes tasks and creates implementation plans
2. **Coder Agent**: Generates code based on the plan
3. **Tester Agent**: Creates and runs tests
4. **Test Analyzer**: Parses test output and identifies failures
5. **Reviewer Agent**: Reviews code for quality and security

### Council Review (Optional)

When `USE_COUNCIL_REVIEW=true`, code is reviewed by multiple judges:
- **Security Judge**: Focuses on vulnerabilities and security best practices
- **Performance Judge**: Analyzes efficiency and optimization
- **Maintainability Judge**: Evaluates code clarity and maintainability

Each judge provides a verdict (APPROVE, REVISE, REJECT) and the final decision is based on consensus.

### Model Selection

| Mode | Agent | Model |
|------|-------|-------|
| Local (vLLM) | All | Qwen 2.5 Coder 14B |
| Cloud | Planner | Claude Sonnet 4.5 |
| Cloud | Coder | Claude Opus 4 |
| Cloud | Tester | Claude Sonnet 4.5 |
| Cloud | Reviewer | Claude Sonnet 4.5 |

## Contributing

Please follow the coding standards defined in `.clinerules` and ensure all tests pass before submitting pull requests.

### Guidelines
- All I/O operations must be async/await
- Type hints required on all functions
- Use `select()` API, not legacy `query()`
- Index all foreign keys
- Validate inputs with Pydantic
- Log errors with structlog

## License

See the LICENSE file in the root directory.
