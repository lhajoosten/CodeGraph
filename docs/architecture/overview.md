# CodeGraph Architecture Overview

## System Architecture

CodeGraph is a full-stack application with a FastAPI backend and React frontend, designed to orchestrate AI coding agents for autonomous software development tasks.

### High-Level Architecture

```
┌─────────────────┐
│   React SPA     │
│   (Frontend)    │
└────────┬────────┘
         │ HTTP/REST
         │ WebSocket (future)
┌────────▼────────┐
│   FastAPI       │
│   (Backend)     │
└────────┬────────┘
         │
    ┌────┴─────┬──────────┬────────────┐
    │          │          │            │
┌───▼───┐  ┌──▼───┐  ┌───▼───┐   ┌────▼────┐
│Postgres│  │Redis │  │Claude │   │ GitHub  │
│       │  │      │  │  API  │   │   API   │
└───────┘  └──────┘  └───────┘   └─────────┘
```

## Technology Stack

### Backend
- **FastAPI**: High-performance async web framework
- **SQLAlchemy 2.0**: Async ORM for database operations
- **LangChain/LangGraph**: Agent orchestration framework
- **Anthropic Claude**: AI models (Haiku 4.5, Sonnet 4.5, Opus 4)
- **PostgreSQL 16**: Primary database with pgvector extension
- **Redis**: Caching and task queue
- **Alembic**: Database migrations

### Frontend
- **React 18**: UI library with concurrent features
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool
- **TanStack Query**: Server state management
- **Zustand**: Client state management
- **Shadcn/ui**: UI components
- **Tailwind CSS**: Utility-first CSS

## Component Architecture

### Backend Components

#### API Layer (`src/api/`)
- RESTful endpoints for CRUD operations
- JWT authentication and authorization
- Request validation with Pydantic

#### Agent Layer (`src/agents/`)
- Base agent class with LangSmith tracing
- Specialized agents (Planner, Coder, Tester, Reviewer)
- LangGraph workflow orchestration

#### Service Layer (`src/services/`)
- Business logic implementation
- Transaction management
- External service integration

#### Data Layer (`src/models/`)
- SQLAlchemy models
- Database relationships
- Migrations via Alembic

### Frontend Components

#### Pages (`src/pages/`)
- Route-level components
- Layout and navigation

#### Features (`src/features/`)
- Feature-based organization
- Self-contained modules

#### Components (`src/components/`)
- Reusable UI components
- Shadcn/ui integration

#### State Management
- TanStack Query for server state
- Zustand for client state
- React Context for auth

## Data Flow

### Task Execution Flow

1. User creates task via frontend
2. Backend creates task record in database
3. Task is queued for agent execution
4. LangGraph workflow is initiated:
   - Planner agent breaks down task
   - Coder agent implements changes
   - Tester agent validates changes
   - Reviewer agent checks quality
5. Results are stored and returned to frontend
6. User receives notifications and updates

### Authentication Flow

1. User submits credentials
2. Backend validates against database
3. JWT tokens generated (access + refresh)
4. Tokens stored in client
5. Subsequent requests include token
6. Backend validates token on each request

## Database Schema

### Core Tables

- **users**: User accounts and authentication
- **tasks**: Coding tasks to be executed
- **repositories**: GitHub repositories
- **agent_runs**: Agent execution history

### Relationships

- User → Tasks (one-to-many)
- User → Repositories (one-to-many)
- Task → AgentRuns (one-to-many)
- Repository → Tasks (one-to-many)

## Security Architecture

### Authentication
- JWT-based authentication
- Access tokens (30 min expiry)
- Refresh tokens (7 day expiry)

### Authorization
- Role-based access control
- Resource ownership validation
- API endpoint protection

### Data Security
- Password hashing with bcrypt
- Environment-based secrets
- SQL injection prevention
- XSS protection

## Scalability Considerations

### Horizontal Scaling
- Stateless backend design
- Redis for shared state
- PostgreSQL connection pooling

### Performance Optimization
- Async/await throughout
- Database query optimization
- Response caching with Redis
- Lazy loading on frontend

## Monitoring and Observability

### LangSmith Integration
- Agent execution tracing
- Token usage tracking
- Performance metrics
- Error tracking

### Logging
- Structured logging with structlog
- Context-rich log messages
- Log levels by environment

## Deployment Architecture

### Development
- Docker Compose for local development
- Hot reload for backend and frontend
- Separate containers for each service

### Production (Future)
- Container orchestration (Kubernetes)
- Load balancing
- Database replication
- Redis clustering
- CDN for static assets

## Future Enhancements

- Real-time WebSocket updates
- Agent execution streaming
- Multi-repository support
- Advanced caching strategies
- Horizontal pod autoscaling
- Metrics dashboard
- Audit logging
