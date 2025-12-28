# CodeGraph Backend

FastAPI backend for the CodeGraph AI coding agent platform.

## Overview

This is the backend service for CodeGraph, built with FastAPI and Python 3.12+. It provides RESTful APIs for managing coding tasks, orchestrating AI agents, and integrating with GitHub repositories.

## Tech Stack

- **FastAPI**: Modern, high-performance web framework
- **SQLAlchemy 2.0**: Async ORM for database operations
- **Pydantic v2**: Data validation and settings management
- **LangChain + LangGraph**: Agent orchestration and workflow management
- **Anthropic Claude**: AI capabilities via Claude models
- **PostgreSQL 16**: Primary database with pgvector extension
- **Redis**: Caching and task queues
- **Alembic**: Database migrations

## Project Structure

```
src/
├── api/              # API route handlers
├── agents/           # LangGraph agent implementations
├── models/           # SQLAlchemy database models
├── schemas/          # Pydantic schemas for validation
├── services/         # Business logic layer
├── tools/            # Agent tools (file ops, code execution, etc.)
├── core/             # Core configurations and utilities
└── utils/            # Helper functions

tests/
├── unit/             # Unit tests
├── integration/      # Integration tests
└── e2e/              # End-to-end tests
```

## Setup

### Prerequisites

- Python 3.11 or higher
- Poetry for dependency management
- PostgreSQL 16
- Redis

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

3. Run database migrations:
```bash
poetry run alembic upgrade head
```

4. Start the development server:
```bash
poetry run uvicorn src.main:app --reload
```

The API will be available at `http://localhost:8000`.

## Development

### Running Tests

```bash
# Run all tests
poetry run pytest

# Run with coverage
poetry run pytest --cov=src --cov-report=html

# Run specific test file
poetry run pytest tests/unit/test_tasks.py
```

### Code Quality

```bash
# Format code
poetry run black src/

# Lint code
poetry run ruff check src/

# Type checking
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
```

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Configuration

All configuration is managed through environment variables. See `.env.example` for a complete list of available settings.

Key configuration areas:
- Database connection settings
- Redis configuration
- Anthropic API credentials
- LangSmith tracing (optional)
- GitHub integration
- JWT authentication settings

## Agent Architecture

The backend implements a multi-agent system using LangGraph:

1. **Planner Agent**: Breaks down tasks into actionable steps
2. **Coder Agent**: Implements code changes
3. **Tester Agent**: Writes and runs tests
4. **Reviewer Agent**: Reviews code for quality and security

Each agent is equipped with specialized tools and uses appropriate Claude models based on task complexity.

## Contributing

Please follow the coding standards defined in `.clinerules` and ensure all tests pass before submitting pull requests.

## License

See the LICENSE file in the root directory.
