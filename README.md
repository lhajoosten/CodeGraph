# CodeGraph

<div align="center">

![CodeGraph Logo](public/assets/images/CodeGraphBanner.jpg)

**Autonomous AI coding agents powered by Claude**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.127.0-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0+-61dafb.svg)](https://react.dev/)

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Architecture](#architecture) • [Contributing](#contributing)

</div>

---

## Overview

CodeGraph is a self-hosted AI coding agent platform that brings autonomous software development capabilities to your team. Built with multiple specialized AI agents orchestrated through LangGraph, it handles everything from planning to implementation to testing—all while respecting your data governance requirements.

### Why CodeGraph?

- **Self-Hosted**: Complete control over your code and data
- **Multi-Agent**: Specialized agents for planning, coding, testing, and review
- **Smart Model Selection**: Automatically uses the right Claude model for each task
- **Local LLM Support**: Cost-free development with vLLM and Qwen 2.5 Coder
- **Council Review**: Multi-judge code review with security, performance, and maintainability perspectives
- **GitHub Integration**: Seamless repository analysis and PR creation
- **Full Observability**: End-to-end tracing with LangSmith
- **Real-Time Streaming**: Watch agents think and work in real-time

---

## Features

### Core Capabilities

- **Autonomous Code Generation**: Describe features in natural language, get production-ready code
- **Intelligent Bug Fixing**: Point to a bug report, get diagnosis and fixes with tests
- **Code Refactoring**: Modernize legacy code while maintaining functionality
- **Automated Testing**: Generate comprehensive test suites with high coverage
- **Documentation**: Auto-generate inline docs, READMEs, and API documentation
- **Repository Analysis**: Deep understanding of your codebase structure and patterns

### Agent System

CodeGraph uses a sophisticated multi-agent architecture with council-based review:

| Agent | Model | Purpose |
|-------|-------|---------|
| **Planner** | Sonnet 4.5 / Qwen | Task breakdown and orchestration |
| **Coder** | Opus 4 / Qwen | Code implementation and refactoring |
| **Tester** | Sonnet 4.5 / Qwen | Test generation and execution |
| **Test Analyzer** | Sonnet 4.5 / Qwen | Parse test results and identify failures |
| **Reviewer** | Sonnet 4.5 / Qwen | Code quality assessment |
| **Council Review** | Multi-Judge | Security, performance, maintainability review |

### Security & Authentication

- **JWT Authentication**: Secure token-based auth with refresh tokens
- **Two-Factor Authentication (2FA)**: TOTP-based with backup codes
- **OAuth Integration**: GitHub, Google, and Microsoft login
- **Email Verification**: Secure email confirmation flow
- **Session Management**: Multi-device session tracking

---

## Quick Start

### Prerequisites

Before you begin, ensure you have:

- **Docker** (20.10+) and **Docker Compose** (2.0+)
- **Git** (2.30+)
- **NVIDIA GPU** with 16GB+ VRAM (for local LLM, optional)

For cloud deployment (without local LLM):
- **Anthropic API Key** - [Get one here](https://console.anthropic.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lhajoosten/codegraph.git
   cd codegraph
   ```

2. **Configure environment**
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   ```

   Edit `apps/backend/.env` with your configuration:
   ```env
   # For local LLM (default - no API key needed)
   USE_LOCAL_LLM=true

   # OR for Claude API
   USE_LOCAL_LLM=false
   ANTHROPIC_API_KEY=your_anthropic_key_here

   # Database
   DATABASE_URL=postgresql+asyncpg://codegraph:codegraph@localhost:5432/codegraph
   REDIS_URL=redis://localhost:6379/0

   # Security
   SECRET_KEY=your_secret_key_here  # Generate with: openssl rand -hex 32

   # Optional: GitHub Integration
   GITHUB_TOKEN=your_github_token_here

   # Optional: LangSmith Tracing
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_API_KEY=your_langsmith_key_here
   LANGCHAIN_PROJECT=codegraph
   ```

3. **Start the platform**
   ```bash
   cd docker
   docker-compose up -d
   ```

4. **Verify installation**
   ```bash
   # Check all services are running
   docker-compose ps

   # View logs
   docker-compose logs -f
   ```

5. **Access the application**
   - **Web UI**: http://localhost:5173
   - **API Docs**: http://localhost:8000/docs
   - **API Health**: http://localhost:8000/health
   - **Storybook**: http://localhost:6006

### First Task

1. Open http://localhost:5173
2. Create an account or sign in
3. Connect your GitHub repository
4. Create a new task: "Add logging to the user authentication module"
5. Watch the agents plan, code, test, and create a PR!

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                   React 19 Frontend                      │
│    (Task Management, Monaco Editor, Real-time Updates)  │
│              Port: 5173 | Storybook: 6006               │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API + SSE
┌──────────────────────▼──────────────────────────────────┐
│                   FastAPI Backend                        │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  API Layer   │  │   Services   │  │  GitHub API   │  │
│  │  (v1 Routes) │  │  (Auth/Task) │  │  Integration  │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
│              Port: 8000 | Docs: /docs                   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              LangGraph Agent Orchestration              │
│  ┌──────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐   │
│  │ Planner  │→ │ Coder   │→ │ Tester  │→ │ Council  │   │
│  │  Agent   │  │  Agent  │  │  Agent  │  │  Review  │   │
│  └──────────┘  └─────────┘  └─────────┘  └──────────┘   │
│              ↑                              │            │
│              └──────── Revision Loop ───────┘            │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    ┌────▼────┐   ┌────▼────┐   ┌───▼────┐
    │  vLLM   │   │ Claude  │   │ Claude │
    │  Qwen   │   │ Sonnet  │   │  Opus  │
    │ (Local) │   │  (API)  │   │ (API)  │
    └─────────┘   └─────────┘   └────────┘
```

### Project Structure

```
CodeGraph/
├── apps/
│   ├── backend/              # Python FastAPI backend
│   │   ├── src/
│   │   │   ├── api/         # API routes (auth, tasks, users, webhooks)
│   │   │   ├── agents/      # LangGraph agents (planner, coder, tester, reviewer, council)
│   │   │   ├── models/      # SQLAlchemy models
│   │   │   ├── schemas/     # Pydantic schemas
│   │   │   ├── services/    # Business logic (auth, 2FA, OAuth, email)
│   │   │   ├── tools/       # Agent tools
│   │   │   └── core/        # Configuration, security, database
│   │   ├── tests/           # pytest tests (unit, integration, AI)
│   │   └── alembic/         # Database migrations
│   │
│   └── frontend/            # React TypeScript frontend
│       ├── src/
│       │   ├── routes/      # TanStack Router routes
│       │   ├── components/  # React components
│       │   ├── hooks/       # Custom hooks
│       │   └── store/       # Zustand stores
│       └── tests/           # Vitest + Playwright tests
│
├── docker/                  # Docker configuration
│   ├── docker-compose.yml   # Full stack compose
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── postgres.Dockerfile
│
├── changelog/               # Weekly development changelogs
├── CLAUDE.md               # AI assistant configuration
└── README.md               # This file
```

### Tech Stack

**Frontend**
- React 19 with TypeScript 5.9
- Vite for blazing fast builds
- TanStack Router for type-safe routing
- TanStack Query for server state
- Zustand for client state
- Tailwind CSS v4 + Radix UI
- Monaco Editor (VS Code's editor)
- Storybook for component development

**Backend**
- Python 3.12+ with FastAPI
- SQLAlchemy 2.0 (async)
- Pydantic v2 for validation
- Poetry for dependency management

**AI & Orchestration**
- LangChain for LLM integration
- LangGraph for agent workflows
- Anthropic Claude (Haiku/Sonnet/Opus 4.5)
- vLLM with Qwen 2.5 Coder (local)
- LangSmith for observability

**Infrastructure**
- Docker & Docker Compose
- PostgreSQL 16 with pgvector
- Redis for caching & sessions
- Nginx as reverse proxy

For detailed architecture, see [Architecture Documentation](docs/architecture/overview.md).

---

## Development

### Local Development Setup

**Backend:**
```bash
cd apps/backend

# Install dependencies with Poetry
poetry install

# Start database and Redis
make docker-up

# Run database migrations
make db-migrate

# Start development server
make dev
```

**Frontend:**
```bash
cd apps/frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Start Storybook
npm run storybook
```

### Running Tests

**Backend:**
```bash
cd apps/backend

# Run fast tests (unit + integration)
make test-fast

# Run AI tests (requires vLLM)
make test-ai

# Run all tests with coverage
make test-cov
```

**Frontend:**
```bash
cd apps/frontend

# Run unit tests
npm run test

# Run E2E tests
npm run e2e
```

### Code Quality

```bash
# Backend - Full check pipeline
cd apps/backend
make check  # Runs lint + format + type-check

# Frontend - Formatting and linting
cd apps/frontend
npm run lint
npm run format
npm run type-check
```

---

## Configuration

### Environment Variables

#### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | JWT signing secret | `openssl rand -hex 32` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://...` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |

#### Local LLM (Default)

| Variable | Description | Default |
|----------|-------------|---------|
| `USE_LOCAL_LLM` | Use local vLLM instead of Claude | `true` |
| `LOCAL_LLM_BASE_URL` | vLLM server URL | `http://localhost:8001/v1` |
| `LOCAL_LLM_MODEL` | Model to use | `Qwen/Qwen2.5-Coder-14B-Instruct-AWQ` |

#### Claude API (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `USE_LOCAL_LLM` | Set to false for Claude API | `false` |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | `sk-ant-api03-...` |

#### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `GITHUB_TOKEN` | GitHub personal access token | - |
| `LANGCHAIN_TRACING_V2` | Enable LangSmith tracing | `false` |
| `LANGCHAIN_API_KEY` | LangSmith API key | - |
| `USE_COUNCIL_REVIEW` | Multi-judge code review | `true` |
| `TWO_FACTOR_MANDATORY` | Require 2FA for all users | `false` |

See [Configuration Guide](docs/development/configuration.md) for all options.

---

## Monitoring & Observability

### LangSmith Integration

CodeGraph integrates with LangSmith for complete observability:

1. **Sign up** at [smith.langchain.com](https://smith.langchain.com)
2. **Get API key** from settings
3. **Configure** in `.env`:
   ```env
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_API_KEY=your_key
   LANGCHAIN_PROJECT=codegraph
   ```

View traces at: https://smith.langchain.com/o/your-org/projects/codegraph

### Metrics Dashboard

Access built-in metrics at http://localhost:5173/metrics:

- Task completion rates
- Agent performance
- Model usage & costs
- Error rates by agent
- Response time percentiles

---

## Contributing

We love contributions! CodeGraph is built by developers, for developers.

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Development Workflow

1. Check [Issues](https://github.com/lhajoosten/codegraph/issues) for tasks
2. Comment on an issue to claim it
3. Follow our [Code of Conduct](CODE_OF_CONDUCT.md)
4. Ensure tests pass and coverage is maintained
5. Update documentation as needed

---

## Community & Support

### Get Help

- [Documentation](docs/)
- [GitHub Discussions](https://github.com/lhajoosten/codegraph/discussions)
- [Issue Tracker](https://github.com/lhajoosten/codegraph/issues)

---

## Security

Found a security vulnerability? Please **do not** open a public issue.

See [SECURITY.md](SECURITY.md) for details on reporting security issues.

---

## License

CodeGraph is open source software licensed under the [MIT License](LICENSE).

---

## Acknowledgments

Built with amazing open source tools:

- [Anthropic Claude](https://www.anthropic.com/) - Powerful AI models
- [LangChain](https://langchain.com/) - LLM application framework
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://react.dev/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [vLLM](https://vllm.ai/) - High-throughput LLM serving

Special thanks to all [contributors](https://github.com/lhajoosten/codegraph/graphs/contributors)!

---

## Citation

If you use CodeGraph in your research or project, please cite:

```bibtex
@software{CodeGraph,
  author = {Luc Joosten},
  title = {CodeGraph: Autonomous AI Coding Agents},
  year = {2025},
  url = {https://github.com/lhajoosten/CodeGraph}
}
```

---

<div align="center">

Made with care by developers who love AI

[Back to Top](#codegraph)

</div>
