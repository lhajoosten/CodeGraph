# CodeGraph

<div align="center">

![CodeGraph Logo](docs/CodeGraphBanner.jpg)

**Autonomous AI coding agents powered by Claude**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.125.0-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0+-61dafb.svg)](https://react.dev/)

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Architecture](#architecture) • [Contributing](#contributing)

</div>

---

## Overview

CodeGraph is a self-hosted AI coding agent platform that brings autonomous software development capabilities to your team. Built with multiple specialized AI agents orchestrated through LangGraph, it handles everything from planning to implementation to testing—all while respecting your data governance requirements.

### Why CodeGraph?

- **🔒 Self-Hosted**: Complete control over your code and data
- **🤖 Multi-Agent**: Specialized agents for planning, coding, testing, and review
- **🧠 Smart Model Selection**: Automatically uses the right Claude model for each task
- **🔄 GitHub Integration**: Seamless repository analysis and PR creation
- **📊 Full Observability**: End-to-end tracing with LangSmith
- **⚡ Real-Time Streaming**: Watch agents think and work in real-time

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

CodeGraph uses a sophisticated multi-agent architecture:

| Agent | Model | Purpose |
|-------|-------|---------|
| **Planning** | Sonnet 4.5 | Task breakdown and orchestration |
| **Coding (Simple)** | Sonnet 4.5 | Bug fixes, small features, refactoring |
| **Coding (Complex)** | Opus 4 | Architectural changes, complex algorithms |
| **Testing** | Sonnet 4.5 | Test generation and validation |
| **Review** | Sonnet 4.5 | Code quality and security checks |
| **Chat** | Haiku 4.5 | User interaction and quick queries |

---

## Quick Start

### Prerequisites

Before you begin, ensure you have:

- **Docker** (20.10+) and **Docker Compose** (2.0+)
- **Anthropic API Key** - [Get one here](https://console.anthropic.com/)
- **GitHub Personal Access Token** - [Create one](https://github.com/settings/tokens)
- **Git** (2.30+)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/codegraph.git
   cd codegraph
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
   ```env
   # Anthropic API
   ANTHROPIC_API_KEY=your_anthropic_key_here
   
   # GitHub Integration
   GITHUB_TOKEN=your_github_token_here
   
   # LangSmith (Optional but recommended)
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_API_KEY=your_langsmith_key_here
   LANGCHAIN_PROJECT=codegraph
   
   # Database
   POSTGRES_USER=codegraph
   POSTGRES_PASSWORD=your_secure_password_here
   POSTGRES_DB=codegraph
   
   # Security
   SECRET_KEY=your_secret_key_here  # Generate with: openssl rand -hex 32
   ```

3. **Start the platform**
   ```bash
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
   - **Web UI**: http://localhost:3000
   - **API Docs**: http://localhost:8000/docs
   - **API Health**: http://localhost:8000/health

### First Task

1. Open http://localhost:3000
2. Connect your GitHub repository
3. Create a new task: "Add logging to the user authentication module"
4. Watch the agents plan, code, test, and create a PR!

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                       │
│         (Task Management, Code Editor, Monitoring)      │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API + SSE
┌──────────────────────▼──────────────────────────────────┐
│                   FastAPI Backend                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  API Layer   │  │   Services   │  │  GitHub API   │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              LangGraph Agent Orchestration              │
│  ┌──────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐   │
│  │ Planning │→ │ Coding  │→ │ Testing │→ │  Review  │   │
│  │  Agent   │  │ Agent   │  │  Agent  │  │  Agent   │   │
│  └──────────┘  └─────────┘  └─────────┘  └──────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    ┌────▼────┐   ┌────▼────┐   ┌───▼────┐
    │ Claude  │   │ Claude  │   │ Claude │
    │ Haiku   │   │ Sonnet  │   │  Opus  │
    └─────────┘   └─────────┘   └────────┘
```

### Tech Stack

**Frontend**
- React 18 with TypeScript
- Vite for blazing fast builds
- TanStack Query for server state
- Zustand for client state
- Tailwind CSS + Shadcn/ui
- Monaco Editor (VS Code's editor)

**Backend**
- Python 3.11+ with FastAPI
- SQLAlchemy 2.0 (async)
- Pydantic v2 for validation
- Poetry for dependency management

**AI & Orchestration**
- LangChain for LLM integration
- LangGraph for agent workflows
- Anthropic Claude (Haiku/Sonnet/Opus)
- LangSmith for observability

**Infrastructure**
- Docker & Docker Compose
- PostgreSQL 16 with pgvector
- Redis for caching & queues
- Nginx as reverse proxy

For detailed architecture, see [Architecture Documentation](docs/architecture/overview.md).

---

## Documentation

### Getting Started
- [Installation Guide](docs/development/setup.md)
- [Configuration](docs/development/configuration.md)
- [First Task Tutorial](docs/guides/first-task.md)

### Core Concepts
- [Agent Architecture](docs/architecture/agents.md)
- [Model Selection Strategy](docs/architecture/models.md)
- [Task Lifecycle](docs/guides/task-lifecycle.md)

### Development
- [Local Development](docs/development/setup.md)
- [Testing Guide](docs/development/testing.md)
- [API Reference](docs/api/README.md)
- [Contributing Guidelines](CONTRIBUTING.md)

### Deployment
- [Production Deployment](docs/deployment/production.md)
- [Scaling Guide](docs/deployment/scaling.md)
- [Security Best Practices](docs/deployment/security.md)

---

## Development

### Local Development Setup

**Backend:**
```bash
cd backend

# Install dependencies with Poetry
poetry install

# Activate virtual environment
poetry shell

# Run database migrations
alembic upgrade head

# Start development server
uvicorn src.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Database:**
```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Create a migration
cd backend
alembic revision --autogenerate -m "Add new table"

# Apply migrations
alembic upgrade head
```

### Running Tests

**Backend:**
```bash
cd backend
poetry run pytest
poetry run pytest --cov=src tests/  # With coverage
```

**Frontend:**
```bash
cd frontend
npm run test
npm run test:ui  # With Vitest UI
```

**Integration Tests:**
```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

### Code Quality

```bash
# Backend - Formatting and linting
cd backend
poetry run black src tests
poetry run ruff check src tests
poetry run mypy src

# Frontend - Formatting and linting
cd frontend
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
| `ANTHROPIC_API_KEY` | Your Anthropic API key | `sk-ant-api03-...` |
| `GITHUB_TOKEN` | GitHub personal access token | `ghp_...` |
| `SECRET_KEY` | JWT signing secret | `openssl rand -hex 32` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://...` |

#### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `LANGCHAIN_TRACING_V2` | Enable LangSmith tracing | `false` |
| `LANGCHAIN_API_KEY` | LangSmith API key | - |
| `MAX_CONCURRENT_TASKS` | Max parallel agent tasks | `5` |
| `AGENT_TIMEOUT_SECONDS` | Task timeout | `600` |
| `LOG_LEVEL` | Logging level | `INFO` |

See [Configuration Guide](docs/development/configuration.md) for all options.

---

## Usage Examples

### Creating a Task via API

```bash
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "repository_id": 1,
    "title": "Add user authentication",
    "description": "Implement JWT-based authentication with login and logout endpoints",
    "type": "feature"
  }'
```

### Streaming Task Execution

```typescript
const eventSource = new EventSource(
  `http://localhost:8000/api/tasks/${taskId}/stream`
);

eventSource.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log(`Agent: ${update.agent}, Status: ${update.status}`);
};
```

### Python SDK (Coming Soon)

```python
from codegraph import CodeGraphClient

client = CodeGraphClient(api_key="your_token")

# Create a task
task = client.tasks.create(
    repository_id=1,
    title="Refactor user service",
    description="Extract common logic into reusable functions"
)

# Stream execution
for update in client.tasks.stream(task.id):
    print(f"{update.agent}: {update.message}")
```

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

Access built-in metrics at http://localhost:3000/metrics:

- Task completion rates
- Agent performance
- Model usage & costs
- Error rates by agent
- Response time percentiles

---

## Roadmap

### v1.0 (Current)
- [x] Multi-agent architecture
- [x] GitHub integration
- [x] LangSmith tracing
- [x] Real-time streaming
- [x] Docker deployment

### v1.1 (Next)
- [ ] VS Code extension
- [ ] Custom agent creation UI
- [ ] Multi-language support (Go, Rust, Java)
- [ ] Code migration tools

### v2.0 (Future)
- [ ] Multi-repository coordination
- [ ] Fine-tuning on your codebase
- [ ] Security vulnerability scanning
- [ ] Performance optimization suggestions

See [ROADMAP.md](ROADMAP.md) for detailed plans.

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

1. Check [Issues](https://github.com/yourusername/codegraph/issues) for tasks
2. Comment on an issue to claim it
3. Follow our [Code of Conduct](CODE_OF_CONDUCT.md)
4. Ensure tests pass and coverage is maintained
5. Update documentation as needed

---

## Community & Support

### Get Help

- 📖 [Documentation](docs/)
- 💬 [GitHub Discussions](https://github.com/yourusername/codegraph/discussions)
- 🐛 [Issue Tracker](https://github.com/yourusername/codegraph/issues)
- 📧 Email: support@codegraph.dev (if applicable)

### Stay Updated

- ⭐ Star this repo to show support
- 👀 Watch for updates
- 🐦 Follow [@codegraph](https://twitter.com/codegraph) (if applicable)

---

## Security

Found a security vulnerability? Please **do not** open a public issue.

Email security@codegraph.dev or see [SECURITY.md](SECURITY.md) for details.

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

Special thanks to all [contributors](https://github.com/yourusername/codegraph/graphs/contributors)!

---

## Citation

If you use CodeGraph in your research or project, please cite:

```bibtex
@software{CodeGraph,
  author = {Luc Joosten},
  title = {CodeGraph: Autonomous AI Coding Agents},
  year = {2026},
  url = {https://github.com/lhajoosten/CodeGraph}
}
```

---

<div align="center">

Made with ❤️ by developers who love AI

[⬆ Back to Top](#codegraph)

</div>
```
