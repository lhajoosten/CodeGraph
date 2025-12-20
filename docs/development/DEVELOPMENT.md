# CodeGraph Development Guide

## Quick Start

Get the project running in 3 commands:

```bash
make install      # Install all dependencies
make docker-up    # Start Docker services
make db-migrate   # Run database migrations
```

Then in separate terminals:

```bash
make dev-backend  # Terminal 1: Start backend
make dev-frontend # Terminal 2: Start frontend
```

Or start everything at once:

```bash
make dev          # Starts backend + frontend + docker
```

## Makefile Commands

### Setup & Installation

```bash
make install           # Install backend & frontend dependencies
make install-backend   # Install Python dependencies
make install-frontend  # Install npm dependencies
```

### Development

```bash
make dev               # Start all services (backend + frontend + docker)
make dev-backend       # Start backend dev server on localhost:8000
make dev-frontend      # Start frontend dev server on localhost:5173
make docker-compose    # Start full stack with docker-compose
```

### Docker Management

```bash
make docker-up         # Start PostgreSQL and Redis containers
make docker-down       # Stop all Docker containers
make docker-logs       # Tail logs from all containers
```

### Database

```bash
make db-migrate        # Run pending migrations
make db-reset          # Reset database (⚠️ careful!)
```

### API Development

```bash
make api-generate      # Regenerate OpenAPI client from backend spec
```

Run this whenever you add/modify endpoints in the backend.

### Code Quality

```bash
make lint              # Lint both backend and frontend
make lint-backend      # Lint Python with ruff
make lint-frontend     # Lint TypeScript with ESLint
make format            # Format both backend and frontend
make format-backend    # Format Python with black
make format-frontend   # Format TypeScript with prettier
make type-check        # Type check both backend and frontend
make check             # Run type-check + lint
```

### Testing

```bash
make test              # Run all tests
make test-backend      # Run backend tests with pytest
make test-frontend     # Run frontend tests with vitest
```

### Build

```bash
make build             # Build backend + frontend
make build-backend     # Build Python package
make build-frontend    # Build React app
```

### Cleanup

```bash
make clean             # Clean all generated files and caches
make clean-backend     # Clean Python artifacts
make clean-frontend    # Clean npm artifacts
```

### Utilities

```bash
make status            # Show current project status
make setup             # Full development setup (install + migrations)
make help              # Show all available commands
```

## Common Workflows

### Starting Fresh

```bash
make clean             # Clean old artifacts
make install           # Install dependencies
make docker-up         # Start services
make db-migrate        # Initialize database
make dev               # Start development servers
```

### After Backend Changes

```bash
make api-generate      # Regenerate API client
make format            # Format code
make lint              # Check for errors
```

### Before Committing

```bash
make check             # Type check + lint
make test              # Run tests
```

### Docker Issues?

```bash
make docker-down       # Stop all containers
make docker-up         # Start fresh
make db-migrate        # Re-run migrations
```

## Project Structure

```
CodeGraph/
├── apps/
│   ├── backend/              # FastAPI application
│   │   ├── src/
│   │   ├── tests/
│   │   ├── pyproject.toml
│   │   └── poetry.lock
│   └── frontend/             # React application
│       ├── src/
│       ├── package.json
│       └── npm packages
├── docker/                   # Docker configuration
│   ├── docker-compose.yml
│   ├── backend.Dockerfile
│   └── frontend.Dockerfile
├── docs/                     # Documentation
├── scripts/                  # Utility scripts
└── Makefile                  # Development commands
```

## Environment Setup

### Backend Environment (`apps/backend/.env`)

```env
ANTHROPIC_API_KEY=your-api-key-here
LANGSMITH_API_KEY=optional-api-key
DATABASE_URL=postgresql+asyncpg://codegraph:codegraph@localhost:5432/codegraph
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=dev-secret-key-change-in-production
ENVIRONMENT=development
DEBUG=True
```

### Frontend Environment (`apps/frontend/.env`)

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process using port
lsof -i :8000  # Backend
lsof -i :5173  # Frontend
kill -9 <PID>
```

### Database Connection Fails

```bash
# Check Docker services
make docker-down
make docker-up
make db-migrate
```

### API Client Out of Sync

```bash
# Regenerate client from OpenAPI spec
make api-generate
```

### Node Modules Issues

```bash
make clean-frontend
make install-frontend
```

### Poetry Lock Issues

```bash
make clean-backend
make install-backend
```

## Tools & Versions

- **Python**: 3.11+
- **Node.js**: 18+
- **Poetry**: 2.2.1+
- **Docker**: Latest
- **PostgreSQL**: 16 (pgvector)
- **Redis**: 7

## Additional Resources

- [API Usage Guide](./apps/frontend/API_USAGE_GUIDE.md) - How to use the generated API client
- [Cost Governance Rules](../../.clinerules) - Token limits and model tiering
- [Architecture](../architecture/overview.md) - System design
