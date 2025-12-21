# Development Setup Guide

This guide will help you set up your local development environment for CodeGraph.

## Prerequisites

### Required Software

- **Docker & Docker Compose**: For running PostgreSQL and Redis
- **Python 3.11+**: Backend development
- **Node.js 18+**: Frontend development
- **Poetry**: Python dependency management
- **pnpm** (recommended) or npm: JavaScript dependency management
- **Git**: Version control

### API Keys

- **Anthropic API Key**: Required for Claude AI models
- **LangSmith API Key**: Optional, for agent tracing
- **GitHub Token**: Optional, for repository operations

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/codegraph.git
cd codegraph
```

### 2. Install Backend Dependencies

```bash
cd apps/backend
poetry install
```

### 3. Install Frontend Dependencies

```bash
cd apps/frontend
pnpm install  # or npm install
```

### 4. Set Up Environment Variables

#### Backend

```bash
cd apps/backend
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
ANTHROPIC_API_KEY=your-key-here
LANGSMITH_API_KEY=your-key-here  # optional
GITHUB_TOKEN=your-token-here     # optional
SECRET_KEY=generate-a-secure-key
```

#### Frontend

```bash
cd apps/frontend
cp .env.example .env
```

The default values should work for local development.

### 5. Start Infrastructure Services

```bash
cd docker
docker-compose up -d postgres redis
```

Wait for services to be healthy:

```bash
docker-compose ps
```

### 6. Run Database Migrations

```bash
cd apps/backend
poetry run alembic upgrade head
```

## Running the Application

### Option 1: Using Docker Compose (Recommended for Full Stack)

```bash
cd docker
docker-compose up
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Backend (port 8000)
- Frontend (port 5173)

### Option 2: Running Services Individually

#### Terminal 1: Start Backend

```bash
cd apps/backend
poetry run uvicorn src.main:app --reload
```

Backend will be available at `http://localhost:8000`.

#### Terminal 2: Start Frontend

```bash
cd apps/frontend
pnpm dev
```

Frontend will be available at `http://localhost:5173`.

## Verifying the Setup

### 1. Check Backend Health

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "healthy",
  "version": "0.1.0"
}
```

### 2. Access API Documentation

Open `http://localhost:8000/docs` in your browser to view the interactive API documentation.

### 3. Access Frontend

Open `http://localhost:5173` in your browser.

## Development Workflow

### Backend Development

#### Run Tests

```bash
cd apps/backend
poetry run pytest
```

#### Run Tests with Coverage

```bash
poetry run pytest --cov=src --cov-report=html
```

#### Linting and Formatting

```bash
# Format code
poetry run black src/

# Lint code
poetry run ruff check src/

# Type checking
poetry run mypy src/
```

#### Create Database Migration

```bash
poetry run alembic revision --autogenerate -m "description"
```

#### Apply Migrations

```bash
poetry run alembic upgrade head
```

#### Rollback Migration

```bash
poetry run alembic downgrade -1
```

### Frontend Development

#### Run Tests

```bash
cd apps/frontend
pnpm test
```

#### Linting

```bash
pnpm lint
```

#### Type Checking

```bash
pnpm tsc --noEmit
```

#### Build for Production

```bash
pnpm build
```

## Common Issues and Solutions

### Issue: Database Connection Error

**Solution**: Ensure PostgreSQL is running and the DATABASE_URL in `.env` is correct.

```bash
docker-compose ps postgres
docker-compose logs postgres
```

### Issue: Port Already in Use

**Solution**: Check if another service is using the port and stop it.

```bash
# Check what's using port 8000
lsof -i :8000

# Or kill the process
kill -9 $(lsof -t -i:8000)
```

### Issue: Poetry Not Found

**Solution**: Install Poetry.

```bash
curl -sSL https://install.python-poetry.org | python3 -
```

Add to PATH:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

### Issue: Frontend Won't Start

**Solution**: Clear node_modules and reinstall.

```bash
cd apps/frontend
rm -rf node_modules
pnpm install
```

## IDE Setup

### VS Code

Recommended extensions:

- Python
- Pylance
- ESLint
- Prettier
- Tailwind CSS IntelliSense

Settings:

```json
{
  "python.defaultInterpreterPath": "apps/backend/.venv/bin/python",
  "python.linting.enabled": true,
  "python.formatting.provider": "black",
  "editor.formatOnSave": true
}
```

## Next Steps

- Read [Testing Guide](testing.md)
- Review [Architecture Overview](../architecture/overview.md)
- Check [Agent System Documentation](../architecture/agents.md)
- Follow [Coding Standards](.clinerules)

## Getting Help

- Check existing GitHub issues
- Join our Discord community
- Read the documentation
- Contact the maintainers
