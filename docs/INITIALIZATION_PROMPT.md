# Claude Code - Complete Project Scaffolding Prompt

Copy and paste this entire prompt into Claude Code to initialize your CodeGraph project:

---

I want you to scaffold a complete AI coding agent platform called **CodeGraph**. This is a monorepo project with a React frontend and Python FastAPI backend.

## Project Overview
CodeGraph is a self-hosted AI coding agent platform that uses multiple Claude models (Haiku 4.5, Sonnet 4.5, Opus 4) orchestrated through LangGraph to handle autonomous software development tasks like planning, coding, testing, and code review.

## Technology Stack

**Frontend:**
- React 18 + TypeScript (strict mode)
- Vite as build tool
- TanStack Query for server state
- Zustand for client state
- React Hook Form + Zod for forms
- Shadcn/ui + Tailwind CSS
- Monaco Editor for code display
- React Router v6

**Backend:**
- Python 3.11+ with FastAPI
- SQLAlchemy 2.0 (async) + asyncpg
- Pydantic v2 for validation
- LangChain + LangGraph for agent orchestration
- Anthropic Claude API integration
- Alembic for database migrations
- Poetry for dependency management
- pytest + pytest-asyncio for testing

**Infrastructure:**
- Docker + Docker Compose
- PostgreSQL 16 with pgvector extension
- Redis for caching and queues
- Nginx as reverse proxy (development config)

## Monorepo Structure

Create this exact structure:

```
codegraph/
├── .github/
│   ├── workflows/
│   │   ├── backend-ci.yml
│   │   ├── frontend-ci.yml
│   │   └── deploy.yml
│   └── copilot-instructions.md
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── deps.py
│   │   │   │   ├── tasks.py
│   │   │   │   ├── agents.py
│   │   │   │   ├── repositories.py
│   │   │   │   └── users.py
│   │   │   ├── agents/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py
│   │   │   │   ├── planner.py
│   │   │   │   ├── coder.py
│   │   │   │   ├── tester.py
│   │   │   │   ├── reviewer.py
│   │   │   │   └── workflows.py
│   │   │   ├── models/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py
│   │   │   │   ├── user.py
│   │   │   │   ├── task.py
│   │   │   │   ├── repository.py
│   │   │   │   └── agent_run.py
│   │   │   ├── schemas/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── user.py
│   │   │   │   ├── task.py
│   │   │   │   ├── repository.py
│   │   │   │   └── agent.py
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── task_service.py
│   │   │   │   ├── agent_service.py
│   │   │   │   ├── github_service.py
│   │   │   │   └── auth_service.py
│   │   │   ├── tools/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── file_operations.py
│   │   │   │   ├── code_execution.py
│   │   │   │   └── github_tools.py
│   │   │   ├── core/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── config.py
│   │   │   │   ├── database.py
│   │   │   │   ├── security.py
│   │   │   │   ├── logging.py
│   │   │   │   └── exceptions.py
│   │   │   └── utils/
│   │   │       ├── __init__.py
│   │   │       └── github.py
│   │   ├── tests/
│   │   │   ├── __init__.py
│   │   │   ├── conftest.py
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   └── e2e/
│   │   ├── alembic/
│   │   │   ├── versions/
│   │   │   └── env.py
│   │   ├── pyproject.toml
│   │   ├── alembic.ini
│   │   ├── .env.example
│   │   ├── .clinerules
│   │   └── README.md
│   └── frontend/
│       ├── public/
│       │   └── favicon.ico
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── components/
│       │   │   ├── ui/
│       │   │   ├── layout/
│       │   │   ├── tasks/
│       │   │   └── agents/
│       │   ├── features/
│       │   │   ├── auth/
│       │   │   ├── tasks/
│       │   │   └── agents/
│       │   ├── hooks/
│       │   │   ├── useAuth.ts
│       │   │   ├── useTasks.ts
│       │   │   └── useAgentStream.ts
│       │   ├── lib/
│       │   │   ├── api.ts
│       │   │   ├── utils.ts
│       │   │   └── cn.ts
│       │   ├── services/
│       │   │   ├── api-client.ts
│       │   │   ├── tasks.ts
│       │   │   └── auth.ts
│       │   ├── stores/
│       │   │   ├── auth-store.ts
│       │   │   └── ui-store.ts
│       │   ├── types/
│       │   │   ├── api.ts
│       │   │   ├── task.ts
│       │   │   └── user.ts
│       │   └── pages/
│       │       ├── Dashboard.tsx
│       │       ├── Tasks.tsx
│       │       └── TaskDetail.tsx
│       ├── tests/
│       │   └── setup.ts
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       ├── package.json
│       ├── .env.example
│       ├── .clinerules
│       └── README.md
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── nginx.conf
├── docs/
│   ├── architecture/
│   │   ├── overview.md
│   │   └── agents.md
│   ├── development/
│   │   ├── setup.md
│   │   └── testing.md
│   └── ai-instructions/
│       ├── AGENTS.md
│       └── coding-standards.md
├── scripts/
│   ├── dev-setup.sh
│   └── test-all.sh
├── .gitignore
├── .clinerules
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE
└── package.json (root workspace config if using pnpm workspaces)
```

## Specific Implementation Requirements

### Backend (apps/backend/)

**pyproject.toml** - Include these dependencies:
```toml
[tool.poetry]
name = "codegraph-backend"
version = "0.1.0"
description = "AI coding agent platform backend"
authors = ["Your Name <you@example.com>"]

[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.104.0"
uvicorn = {extras = ["standard"], version = "^0.24.0"}
sqlalchemy = "^2.0.23"
asyncpg = "^0.29.0"
alembic = "^1.12.1"
pydantic = "^2.5.0"
pydantic-settings = "^2.1.0"
python-jose = {extras = ["cryptography"], version = "^3.3.0"}
passlib = {extras = ["bcrypt"], version = "^1.7.4"}
python-multipart = "^0.0.6"
langchain = "^0.1.0"
langchain-anthropic = "^0.1.0"
langgraph = "^0.0.20"
langsmith = "^0.0.70"
redis = "^5.0.1"
httpx = "^0.25.2"
structlog = "^23.2.0"

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.3"
pytest-asyncio = "^0.21.1"
pytest-cov = "^4.1.0"
black = "^23.12.0"
ruff = "^0.1.8"
mypy = "^1.7.1"
```

**src/main.py** - Create FastAPI application with:
- CORS middleware
- Health check endpoint
- API router registration
- Startup/shutdown events for database

**src/core/config.py** - Pydantic Settings with all environment variables

**src/core/database.py** - Async SQLAlchemy engine and session management

**src/models/base.py** - Base model with created_at, updated_at fields

**src/models/task.py** - Task model with all required fields

**src/api/tasks.py** - CRUD endpoints for tasks with proper async patterns

**src/agents/base.py** - Base agent class with LangSmith tracing

**alembic.ini** - Configured for async SQLAlchemy

**.env.example** - All required environment variables with descriptions

### Frontend (apps/frontend/)

**package.json** - Include these dependencies:
```json
{
  "name": "codegraph-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.12.0",
    "zustand": "^4.4.7",
    "react-hook-form": "^7.48.2",
    "@hookform/resolvers": "^3.3.2",
    "zod": "^3.22.4",
    "axios": "^1.6.2",
    "@radix-ui/react-slot": "^1.0.2",
    "@monaco-editor/react": "^4.6.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "vitest": "^1.0.4",
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.1",
    "tailwindcss": "^3.3.6",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

**src/main.tsx** - React root with QueryClientProvider

**src/App.tsx** - Router setup with lazy-loaded pages

**src/services/api-client.ts** - Axios instance with auth interceptor

**src/stores/auth-store.ts** - Zustand store for authentication

**src/components/ui/** - Install Shadcn/ui components: button, input, card, dialog

**vite.config.ts** - Configure path aliases (@/ for src/)

**tailwind.config.ts** - Shadcn/ui compatible config

**tsconfig.json** - Strict TypeScript configuration

**.env.example** - Frontend environment variables

### Docker (docker/)

**docker-compose.yml** - Development setup with:
- postgres service (with pgvector)
- redis service
- backend service (mounted for hot reload)
- frontend service (mounted for hot reload)
- nginx service (reverse proxy)

**backend.Dockerfile** - Multi-stage build for production

**frontend.Dockerfile** - Multi-stage build with nginx serving

**nginx.conf** - Proxy configuration

### Root Files

**.gitignore** - Python, Node, Docker, IDE files

**README.md** - Professional README based on the template provided earlier

**CONTRIBUTING.md** - Contribution guidelines

**SECURITY.md** - Security policy

**LICENSE** - MIT License

## Key Implementation Details

1. **All Python code must use async/await**
2. **All TypeScript must have strict type checking**
3. **Include comprehensive .env.example files**
4. **Add proper error handling in all API routes**
5. **Include basic health check endpoints**
6. **Set up proper logging (structlog for Python, console for TypeScript)**
7. **Add database connection pooling**
8. **Include CORS configuration**
9. **Set up JWT authentication scaffolding**
10. **Create basic CI/CD workflows for GitHub Actions**

## Initial Data

Create these initial database migrations:
- users table (id, email, hashed_password, created_at, updated_at)
- tasks table (id, user_id, title, description, status, created_at, updated_at)
- repositories table (id, user_id, github_url, name, created_at)
- agent_runs table (id, task_id, agent_type, status, started_at, completed_at)

## What NOT to include yet

- Don't implement full LangGraph workflows yet (just create file structure)
- Don't implement full GitHub integration yet (just structure)
- Don't add complex agent logic yet
- Don't set up production deployment configs yet

Focus on creating a **solid, working foundation** that can be built upon. The goal is to have a project that:
1. Starts successfully with `docker-compose up`
2. Has a working API with health checks
3. Has a working frontend that connects to the API
4. Has proper project structure and tooling
5. Follows all best practices from the .clinerules files

Make sure all files have proper comments explaining what they do and follow the coding standards defined in the .clinerules files.