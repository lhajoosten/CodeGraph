# CodeGraph Modular Architecture Proposal

## Executive Summary

This proposal outlines a transition from a **layer-based architecture** to a **feature-first, modular architecture** with clear separation between **Core** (shared infrastructure) and **Features** (business domains).

### Current State
```
apps/backend/src/
├── api/          (all routes together)
├── models/       (all database models)
├── schemas/      (all validation schemas)
├── services/     (all business logic)
├── agents/       (all agent logic)
└── utils/        (scattered utilities)
```

### Proposed State
```
apps/backend/src/
├── core/         (infrastructure, shared utilities)
│   ├── agents/   (BaseAgent, LangGraph orchestration)
│   ├── database/ (session, models base classes)
│   ├── api/      (FastAPI setup, middleware)
│   └── auth/     (authentication, JWT)
└── features/
    ├── tasks/
    ├── users/
    ├── repositories/
    ├── code_generation/
    └── code_analysis/
```

**Benefits:**
- ✅ Scalability: Easy to add new features without touching existing code
- ✅ Maintainability: Features are self-contained, easier to understand
- ✅ Testability: Each feature can be tested independently
- ✅ Reusability: Core utilities are centralized, shared across features
- ✅ Parallel Development: Teams can work on features independently
- ✅ Clear Dependencies: Explicit what each feature depends on

**Effort:** Medium-High | **Timeline:** 2-3 weeks phased migration | **Risk:** Low (backwards compatible approach possible)

---

## Current Architecture Analysis

### Problems with Layer-Based Approach

1. **Mixed Concerns:** API routes, models, schemas scattered across different layers
2. **Unclear Dependencies:** Hard to tell which features depend on which utilities
3. **Scaling Issues:** Adding new features requires changes in 5+ different directories
4. **Testing Complexity:** Need to import from multiple layers to test a feature
5. **Documentation Burden:** Hard to document "how do I add a new feature?"
6. **Code Ownership:** No clear ownership of features by modules

### Example Current Problem
```
Task 1: Add "code review" feature

Changes needed:
  - Create src/agents/review_agent.py
  - Create src/models/review.py
  - Create src/models/review_comment.py
  - Create src/schemas/review.py
  - Create src/api/reviews.py
  - Create src/services/review_service.py
  - Create tests/agents/test_review_agent.py
  - Create tests/api/test_reviews.py
  - Create tests/services/test_review_service.py
  - Update src/main.py (include router)
  - Update src/agents/workflows.py (add review step)
  - Update documentation in 3 places

Result: Hard to find all related code, easy to miss something
```

---

## Proposed Architecture

### Directory Structure

```
apps/backend/
├── pyproject.toml
├── src/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app setup (minimal)
│   │
│   ├── core/                      # Shared infrastructure (NO business logic)
│   │   ├── __init__.py
│   │   ├── agents/                # Agent orchestration framework
│   │   │   ├── base.py            # BaseAgent ABC
│   │   │   ├── models.py          # AgentState, AgentConfig
│   │   │   ├── orchestration.py   # LangGraph setup
│   │   │   └── __init__.py
│   │   │
│   │   ├── api/                   # FastAPI framework setup
│   │   │   ├── dependencies.py    # get_current_user, get_db, etc.
│   │   │   ├── middleware.py      # CORS, error handling
│   │   │   ├── responses.py       # Standard response models
│   │   │   └── __init__.py
│   │   │
│   │   ├── auth/                  # Authentication utilities
│   │   │   ├── security.py        # JWT encode/decode
│   │   │   ├── password.py        # Hash/verify
│   │   │   └── __init__.py
│   │   │
│   │   ├── database/              # Database infrastructure
│   │   │   ├── engine.py          # SQLAlchemy engine creation
│   │   │   ├── session.py         # Session factory, get_db
│   │   │   ├── base.py            # Base model classes
│   │   │   ├── migrations.py      # Alembic integration
│   │   │   └── __init__.py
│   │   │
│   │   ├── logging/               # Logging configuration
│   │   │   ├── config.py          # structlog setup
│   │   │   └── __init__.py
│   │   │
│   │   ├── config.py              # Settings, environment variables
│   │   ├── exceptions.py          # Custom exceptions
│   │   └── types.py               # Shared type definitions
│   │
│   └── features/                  # Business features (modular)
│       ├── __init__.py
│       │
│       ├── users/                 # User management feature
│       │   ├── __init__.py
│       │   ├── models.py          # User ORM model
│       │   ├── schemas.py         # Pydantic schemas
│       │   ├── service.py         # Business logic
│       │   ├── router.py          # API routes
│       │   ├── dependencies.py    # Feature-specific deps
│       │   ├── exceptions.py      # Feature-specific exceptions
│       │   ├── constants.py       # Constants (roles, status enums)
│       │   ├── events.py          # Domain events (optional)
│       │   └── tests/
│       │       ├── conftest.py
│       │       ├── test_models.py
│       │       ├── test_service.py
│       │       └── test_router.py
│       │
│       ├── tasks/                 # Task/Job management feature
│       │   ├── __init__.py
│       │   ├── models.py
│       │   ├── schemas.py
│       │   ├── service.py
│       │   ├── router.py
│       │   ├── dependencies.py
│       │   ├── exceptions.py
│       │   ├── constants.py
│       │   ├── events.py
│       │   └── tests/
│       │
│       ├── repositories/          # GitHub repo management
│       │   ├── __init__.py
│       │   ├── models.py
│       │   ├── schemas.py
│       │   ├── service.py
│       │   ├── router.py
│       │   ├── dependencies.py
│       │   ├── exceptions.py
│       │   ├── constants.py
│       │   └── tests/
│       │
│       ├── code_generation/       # AI code generation
│       │   ├── __init__.py
│       │   ├── models.py          # CodeGeneration ORM model
│       │   ├── schemas.py
│       │   ├── service.py         # Calls agents from core
│       │   ├── router.py
│       │   ├── agents/            # Feature-specific agents
│       │   │   ├── __init__.py
│       │   │   ├── planning.py    # Feature-specific planning
│       │   │   └── coding.py
│       │   ├── dependencies.py
│       │   ├── exceptions.py
│       │   ├── constants.py
│       │   └── tests/
│       │
│       └── code_analysis/         # Code analysis & review
│           ├── __init__.py
│           ├── models.py
│           ├── schemas.py
│           ├── service.py
│           ├── router.py
│           ├── agents/
│           │   ├── __init__.py
│           │   └── reviewer.py
│           ├── dependencies.py
│           ├── exceptions.py
│           ├── constants.py
│           └── tests/
│
├── tests/                         # Integration tests (optional)
│   ├── conftest.py
│   └── integration/
│       ├── test_user_task_flow.py
│       └── test_code_gen_e2e.py
│
└── migrations/                    # Alembic migrations (unchanged)
```

### Frontend Structure

```
apps/frontend/src/
├── routes/
│   ├── __root.tsx
│   ├── _public/
│   │   └── login.tsx
│   └── _protected/
│       ├── index.tsx              # Dashboard
│       └── features/               # Feature-based routes
│           ├── users/
│           │   ├── list.tsx        # /users
│           │   ├── $id.tsx         # /users/:id
│           │   └── layout.tsx
│           ├── tasks/
│           │   ├── list.tsx        # /tasks
│           │   ├── $id.tsx         # /tasks/:id
│           │   ├── [status].tsx    # /tasks?status=...
│           │   └── layout.tsx
│           ├── repositories/
│           │   ├── list.tsx
│           │   ├── $id.tsx
│           │   └── layout.tsx
│           ├── code_generation/
│           │   ├── create.tsx
│           │   ├── $id.tsx
│           │   └── layout.tsx
│           └── code_analysis/
│               ├── reviews.tsx
│               ├── $id.tsx
│               └── layout.tsx
│
├── features/                      # Feature modules
│   ├── users/
│   │   ├── components/
│   │   │   ├── UserCard.tsx
│   │   │   ├── UserForm.tsx
│   │   │   ├── UserList.tsx
│   │   │   └── UserProfile.tsx
│   │   ├── hooks/
│   │   │   ├── useUsers.ts        # Hook for user data
│   │   │   ├── useUserForm.ts
│   │   │   └── useUserActions.ts
│   │   ├── store/
│   │   │   └── userStore.ts       # Zustand store for user state
│   │   ├── services/
│   │   │   └── userService.ts     # API calls (optional wrapper)
│   │   ├── types.ts               # Feature types
│   │   └── constants.ts           # Feature constants
│   │
│   ├── tasks/
│   │   ├── components/
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskDetail.tsx
│   │   │   ├── TaskForm.tsx
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskStatusBadge.tsx
│   │   │   └── AgentMonitor.tsx
│   │   ├── hooks/
│   │   │   ├── useTasks.ts
│   │   │   ├── useTask.ts
│   │   │   ├── useTaskForm.ts
│   │   │   └── useTaskStream.ts   # SSE subscription hook
│   │   ├── store/
│   │   │   └── taskStore.ts
│   │   ├── services/
│   │   │   └── taskService.ts
│   │   ├── types.ts
│   │   └── constants.ts
│   │
│   ├── repositories/
│   │   ├── components/
│   │   │   ├── RepositoryCard.tsx
│   │   │   ├── RepositoryForm.tsx
│   │   │   └── RepositoryList.tsx
│   │   ├── hooks/
│   │   │   ├── useRepositories.ts
│   │   │   └── useRepositoryActions.ts
│   │   ├── store/
│   │   │   └── repositoryStore.ts
│   │   ├── types.ts
│   │   └── constants.ts
│   │
│   ├── code_generation/
│   │   ├── components/
│   │   │   ├── CodeGenerationForm.tsx
│   │   │   ├── CodePreview.tsx
│   │   │   └── GenerationProgress.tsx
│   │   ├── hooks/
│   │   │   ├── useCodeGeneration.ts
│   │   │   └── useGenerationStream.ts
│   │   ├── store/
│   │   │   └── codeGenStore.ts
│   │   ├── types.ts
│   │   └── constants.ts
│   │
│   └── code_analysis/
│       ├── components/
│       │   ├── ReviewList.tsx
│       │   ├── ReviewDetail.tsx
│       │   └── IssueHighlight.tsx
│       ├── hooks/
│       │   ├── useCodeAnalysis.ts
│       │   └── useReviews.ts
│       ├── store/
│       │   └── analysisStore.ts
│       ├── types.ts
│       └── constants.ts
│
├── core/                          # Shared infrastructure
│   ├── api/
│   │   ├── client.ts              # Axios client setup
│   │   └── interceptors.ts        # Auth, error handling
│   ├── components/
│   │   ├── Layout.tsx             # Main layout
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── Modal.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useLocalStorage.ts
│   │   ├── usePagination.ts
│   │   └── useFetch.ts
│   ├── store/
│   │   ├── authStore.ts           # Global auth
│   │   ├── uiStore.ts             # Global UI state
│   │   └── notificationStore.ts
│   ├── utils/
│   │   ├── formatting.ts
│   │   ├── validation.ts
│   │   ├── date.ts
│   │   └── api.ts
│   ├── types/
│   │   ├── api.ts                 # Common API types
│   │   ├── domain.ts              # Shared domain types
│   │   └── context.ts
│   └── constants.ts               # Global constants
│
└── openapi/                       # Generated (auto-generated from API)
```

---

## Feature Module Anatomy

### Backend Feature Example: `tasks` Feature

```
features/tasks/
├── __init__.py
│   """
│   from .router import router
│   from .service import TaskService
│
│   __all__ = ["router", "TaskService"]
│   """
│
├── models.py
│   """
│   from src.core.database.base import Base, TimestampMixin
│
│   class Task(Base, TimestampMixin):
│       __tablename__ = "tasks"
│       # Task-specific model definition
│   """
│
├── schemas.py
│   """
│   Pydantic models:
│   - TaskCreate
│   - TaskUpdate
│   - TaskResponse
│   - TaskListResponse
│   """
│
├── service.py
│   """
│   class TaskService:
│       def __init__(self, db: AsyncSession):
│           self.db = db
│
│       async def create_task(self, data: TaskCreate) -> Task:
│           # Business logic
│
│       async def get_task(self, task_id: int) -> Task:
│           # Business logic
│
│       async def list_tasks(self, user_id: int) -> List[Task]:
│           # Business logic
│   """
│
├── router.py
│   """
│   router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])
│
│   @router.post("/", response_model=TaskResponse)
│   async def create_task(
│       data: TaskCreate,
│       service: Annotated[TaskService, Depends(get_task_service)],
│   ) -> TaskResponse:
│       return await service.create_task(data)
│   """
│
├── dependencies.py
│   """
│   async def get_task_service(
│       db: Annotated[AsyncSession, Depends(get_db)],
│   ) -> TaskService:
│       return TaskService(db)
│
│   async def get_current_task(
│       task_id: int,
│       current_user: Annotated[User, Depends(get_current_user)],
│       service: Annotated[TaskService, Depends(get_task_service)],
│   ) -> Task:
│       task = await service.get_task(task_id)
│       if task.user_id != current_user.id:
│           raise HTTPException(status_code=403)
│       return task
│   """
│
├── exceptions.py
│   """
│   class TaskNotFound(Exception):
│       pass
│
│   class TaskAlreadyCompleted(Exception):
│       pass
│   """
│
├── constants.py
│   """
│   MAX_DESCRIPTION_LENGTH = 5000
│   MAX_TASKS_PER_PAGE = 100
│   TASK_TIMEOUT_SECONDS = 3600
│   """
│
├── events.py (optional, for domain-driven design)
│   """
│   class TaskCreatedEvent:
│       task_id: int
│       user_id: int
│       timestamp: datetime
│
│   class TaskCompletedEvent:
│       task_id: int
│       result: str
│   """
│
└── tests/
    ├── conftest.py
    │   """
    │   @pytest.fixture
    │   def task_service(db_session):
    │       return TaskService(db_session)
    │   """
    │
    ├── test_models.py
    ├── test_service.py
    ├── test_router.py
    └── test_integration.py
```

### Frontend Feature Example: `tasks` Feature

```
features/tasks/
├── components/
│   ├── TaskCard.tsx
│   │   """
│   │   interface TaskCardProps {
│   │     task: TaskResponse;
│   │     onSelect: (taskId: number) => void;
│   │   }
│   │
│   │   export function TaskCard({ task, onSelect }: TaskCardProps) {
│   │     return (
│   │       <div onClick={() => onSelect(task.id)}>
│   │         <h3>{task.title}</h3>
│   │         <TaskStatusBadge status={task.status} />
│   │       </div>
│   │     );
│   │   }
│   │   """
│   │
│   ├── TaskList.tsx
│   ├── TaskDetail.tsx
│   ├── TaskForm.tsx
│   ├── TaskStatusBadge.tsx
│   └── AgentMonitor.tsx
│
├── hooks/
│   ├── useTasks.ts
│   │   """
│   │   export function useTasks() {
│   │     return useFindTasksTasksGet({
│   │       query: {
│   │         gcTime: 1000 * 60 * 5, // 5 min
│   │       }
│   │     });
│   │   }
│   │   """
│   │
│   ├── useTask.ts
│   ├── useTaskForm.ts
│   ├── useTaskStream.ts
│   │   """
│   │   export function useTaskStream(taskId: number) {
│   │     const [updates, setUpdates] = useState<AgentUpdate[]>([]);
│   │
│   │     useEffect(() => {
│   │       const es = new EventSource(`/api/v1/tasks/${taskId}/stream`);
│   │       es.onmessage = (e) => {
│   │         setUpdates(prev => [...prev, JSON.parse(e.data)]);
│   │       };
│   │       return () => es.close();
│   │     }, [taskId]);
│   │
│   │     return updates;
│   │   }
│   │   """
│   │
│   └── useTaskActions.ts
│
├── store/
│   └── taskStore.ts
│       """
│       interface TaskState {
│         selectedTaskId: number | null;
│         filters: { status?: string; priority?: string };
│         setSelectedTask: (id: number) => void;
│         setFilters: (filters: Record<string, string>) => void;
│       }
│
│       export const useTaskStore = create<TaskState>((set) => ({
│         selectedTaskId: null,
│         filters: {},
│         setSelectedTask: (id) => set({ selectedTaskId: id }),
│         setFilters: (filters) => set({ filters }),
│       }));
│       """
│
├── services/
│   └── taskService.ts
│       """
│       // Optional: wrapper around generated API client
│       export const taskService = {
│         async getTasks() { ... },
│         async createTask(data) { ... },
│       };
│       """
│
├── types.ts
│   """
│   import { TaskResponse } from '@/openapi/types.gen';
│
│   export type TaskWithDetails = TaskResponse & {
│     assignee?: UserResponse;
│     agentUpdates?: AgentUpdate[];
│   };
│
│   export interface AgentUpdate {
│     agent: 'planning' | 'coding' | 'testing' | 'review';
│     status: 'started' | 'in_progress' | 'completed' | 'failed';
│     message: string;
│   }
│   """
│
└── constants.ts
    """
    export const TASK_STATUS_COLORS = {
      pending: 'gray',
      in_progress: 'blue',
      completed: 'green',
      failed: 'red',
    };

    export const TASK_POLLING_INTERVAL = 5000; // 5 seconds
    """
```

---

## Core Module Structure

### Backend Core

**core/agents/** - Agent orchestration framework
```python
BaseAgent(ABC):
    model_name: str
    async execute(input_data: dict) -> dict

class AgentState(TypedDict):
    task_id: int
    description: str
    plan: str
    code_changes: dict
    test_results: str
    current_step: str
    error: str | None

class OrchestrationService:
    def create_workflow() -> StateGraph
    async def execute_workflow(task_id: int)
```

**core/database/** - Database infrastructure
```python
# All models inherit from these
class Base(DeclarativeBase):
    pass

class TimestampMixin:
    created_at: datetime
    updated_at: datetime

class SoftDeleteMixin:
    deleted_at: datetime | None

# Engine and session factory
async def get_db() -> AsyncSession:
    ...
```

**core/auth/** - Authentication
```python
def hash_password(password: str) -> str
def verify_password(password: str, hashed: str) -> bool
def encode_token(data: dict) -> str
def decode_token(token: str) -> dict
```

### Frontend Core

**core/api/** - API client
```typescript
// Centralized API configuration
export const apiClient = createClient({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Interceptors
apiClient.interceptors.request.use((config) => {
  const token = authStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**core/hooks/** - Shared hooks
```typescript
useAuth() - Get/set auth state
usePagination() - Pagination logic
useLocalStorage() - Persistent state
useFetch() - Data fetching wrapper
useDebounce() - Debouncing utility
```

**core/store/** - Global state
```typescript
// Auth
authStore: { user, token, logout, login }

// UI
uiStore: { sidebarOpen, toggleSidebar, theme }

// Notifications
notificationStore: { notifications, add, remove }
```

---

## Cross-Feature Communication Patterns

### Pattern 1: Shared Events (Domain-Driven Design)

```python
# core/events.py
class DomainEvent(ABC):
    timestamp: datetime

    @abstractmethod
    def to_dict(self) -> dict:
        pass

# features/tasks/events.py
class TaskCreatedEvent(DomainEvent):
    task_id: int
    user_id: int
    title: str

# features/code_generation/service.py
# Subscribes to TaskCreatedEvent
async def on_task_created(event: TaskCreatedEvent):
    # Trigger code generation workflow
    pass
```

### Pattern 2: Service Dependencies

```python
# features/code_generation/service.py
from features.tasks.service import TaskService
from features.repositories.service import RepositoryService

class CodeGenerationService:
    def __init__(
        self,
        db: AsyncSession,
        task_service: TaskService,
        repo_service: RepositoryService,
    ):
        self.task_service = task_service
        self.repo_service = repo_service

    async def generate_code(self, task_id: int):
        # Get task from task service
        task = await self.task_service.get_task(task_id)

        # Get repository from repo service
        repo = await self.repo_service.get_repository(task.repository_id)

        # Do code generation
```

### Pattern 3: Shared Schemas (for Feature Composition)

```python
# core/schemas.py
class BaseResponse(BaseModel):
    id: int
    created_at: datetime
    updated_at: datetime

# features/tasks/schemas.py
class TaskResponse(BaseResponse):
    title: str
    status: TaskStatus
    # Can use in other features without coupling
```

### Pattern 4: Frontend Feature Communication

```typescript
// features/tasks/hooks/useTaskStream.ts
export function useTaskStream(taskId: number) {
  return useEventSource(`/api/v1/tasks/${taskId}/stream`);
}

// features/code_generation/components/GenerationProgress.tsx
import { useTaskStream } from '@/features/tasks/hooks/useTaskStream';

export function GenerationProgress({ taskId }: Props) {
  const updates = useTaskStream(taskId);
  // Display agent updates
}
```

---

## Dependency Management

### Rules to Prevent Circular Dependencies

**✓ Allowed:**
- Core → (nothing)
- Features → Core
- Feature A → Feature B (if Feature B doesn't depend on A)
- Feature → Shared Schemas

**✗ Not Allowed:**
- Core → Features
- Feature A → Feature B (if B depends on A)
- Feature utils mixed with Core utils

### Dependency Graph (Example)

```
core/
├── agents
├── database
├── auth
└── api

features/
├── users (depends on: core)
├── tasks (depends on: core, users)
├── repositories (depends on: core)
├── code_generation (depends on: core, tasks, repositories)
└── code_analysis (depends on: core, tasks, code_generation)
```

### Implementation with FastAPI

```python
# main.py - Register features
from src.features import users, tasks, repositories, code_generation
from src.core.api.middleware import setup_middleware

app = FastAPI()

# Setup core infrastructure
setup_middleware(app)

# Register features (order matters for dependencies)
app.include_router(users.router)
app.include_router(repositories.router)
app.include_router(tasks.router)
app.include_router(code_generation.router)
```

---

## Benefits & Comparison

### Current Architecture vs Proposed

| Aspect | Current | Proposed |
|--------|---------|----------|
| **Adding new feature** | Modify 5+ directories | Add 1 new directory |
| **Code location** | Scattered across layers | Self-contained in feature |
| **Feature isolation** | Hard to test in isolation | Easy to test independently |
| **Dependencies** | Implicit, hard to track | Explicit, easy to see |
| **Team parallelization** | Teams step on each other | Teams work independently |
| **Documentation** | "Where's the user logic?" | "Look in features/users/" |
| **Scaling** | Becomes harder (N² growth) | Linear growth |
| **Testing complexity** | High (many imports) | Low (localized) |

### Specific Benefits

1. **Scalability**
   - Adding new features doesn't require modifying existing code
   - New features just add new directories under `features/`

2. **Maintainability**
   - All code for a feature in one place
   - Easy to find "where does X happen?"
   - Easier refactoring (isolated to feature)

3. **Testability**
   - Feature can be tested independently
   - Mock only core dependencies, not entire system
   - Faster test runs (no cross-feature pollution)

4. **Team Productivity**
   - Multiple teams can work on different features simultaneously
   - Clear feature ownership
   - Reduced merge conflicts

5. **Code Reusability**
   - Core utilities shared across all features
   - Clear interfaces between features
   - Easier to extract patterns

6. **Documentation**
   - New developers: "Start in `features/` to understand domain"
   - Adding feature: "Copy `features/tasks/` structure"
   - Architecture is self-documenting

---

## Migration Strategy

### Phase 1: Refactor Core (Week 1)
```bash
1. Create core/agents/, core/database/, core/auth/, core/api/
2. Move existing infrastructure code
3. Update imports in main.py
4. No feature changes yet
```

### Phase 2: Create Feature Structure (Week 1)
```bash
1. Create features/ directory
2. Create features/users/ (first feature)
3. Move user-related code:
   - src/models/user.py → features/users/models.py
   - src/schemas/user.py → features/users/schemas.py
   - src/api/users.py → features/users/router.py
   - src/services/auth_service.py → features/users/service.py
4. Create features/users/__init__.py
5. Update imports in main.py
```

### Phase 3: Migrate Remaining Features (Week 2)
```bash
1. features/tasks/
2. features/repositories/
3. features/code_generation/
4. features/code_analysis/
```

### Phase 4: Backend Tests & Cleanup (Week 2-3)
```bash
1. Update all test imports
2. Reorganize tests/ structure to match features/
3. Remove old directories
4. Update CLAUDE.md and other docs
```

### Phase 5: Frontend Refactoring (Week 3)
```bash
1. Create features/ directory
2. Move components by feature:
   - TaskList.tsx, TaskCard.tsx → features/tasks/components/
   - UserProfile.tsx → features/users/components/
3. Reorganize hooks and store by feature
4. Update route imports
5. Update documentation
```

### Backwards Compatibility Approach (Optional)

Keep old structure temporarily with deprecation warnings:

```python
# src/api/users.py (deprecated)
import warnings
from src.features.users.router import router

warnings.warn(
    "Importing from src.api is deprecated. Use src.features.users instead.",
    DeprecationWarning,
)

__all__ = ["router"]
```

This allows gradual migration without breaking tests.

---

## Documentation Updates Needed

### Files to Update

1. **CLAUDE.md**
   - Update directory structure sections
   - New section: "Feature Development Guide"
   - Update command examples if any paths change

2. **README.md**
   - Update architecture diagram
   - Add feature-first philosophy explanation

3. **docs/architecture/** (create if needed)
   - `docs/architecture/MODULAR_DESIGN.md` - This proposal
   - `docs/architecture/FEATURE_ANATOMY.md` - Structure of a feature
   - `docs/architecture/CORE_MODULES.md` - Core infrastructure
   - `docs/architecture/COMMUNICATION_PATTERNS.md` - Cross-feature patterns

4. **docs/development/**
   - `docs/development/ADDING_FEATURES.md` - Step-by-step guide
   - `docs/development/PROJECT_STRUCTURE.md` - Detailed structure

5. **docs/guides/**
   - `docs/guides/FEATURE_CHECKLIST.md` - What to create for new feature
   - `docs/guides/TESTING_FEATURES.md` - Testing strategy per feature

6. **New Template Files**
   - `docs/templates/FEATURE_TEMPLATE.py` - Backend feature skeleton
   - `docs/templates/FEATURE_TEMPLATE_FRONTEND.tsx` - Frontend feature skeleton

### Documentation Structure

```
docs/
├── architecture/
│   ├── overview.md (updated)
│   ├── MODULAR_DESIGN.md (NEW - this proposal)
│   ├── FEATURE_ANATOMY.md (NEW)
│   ├── CORE_MODULES.md (NEW)
│   └── COMMUNICATION_PATTERNS.md (NEW)
├── development/
│   ├── setup.md (updated)
│   ├── PROJECT_STRUCTURE.md (NEW)
│   └── ADDING_FEATURES.md (NEW)
├── guides/
│   ├── FEATURE_CHECKLIST.md (NEW)
│   ├── TESTING_FEATURES.md (NEW)
│   └── MIGRATION_GUIDE.md (NEW)
└── templates/
    ├── BACKEND_FEATURE.py (NEW)
    └── FRONTEND_FEATURE.tsx (NEW)
```

---

## Implementation Example: Adding "Code Review" Feature

### Backend

**Step 1: Create directory structure**
```bash
mkdir -p src/features/code_review/{tests}
touch src/features/code_review/__init__.py
```

**Step 2: Create models.py**
```python
# src/features/code_review/models.py
from src.core.database.base import Base, TimestampMixin

class CodeReview(Base, TimestampMixin):
    __tablename__ = "code_reviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"))
    status: Mapped[str] = mapped_column(default="pending")
    findings: Mapped[str | None] = mapped_column(Text)
    # ... other fields
```

**Step 3: Create schemas.py**
```python
# src/features/code_review/schemas.py
from pydantic import BaseModel
from datetime import datetime

class CodeReviewCreate(BaseModel):
    task_id: int
    code_content: str

class CodeReviewResponse(BaseModel):
    id: int
    task_id: int
    status: str
    findings: str | None
    created_at: datetime
```

**Step 4: Create service.py**
```python
# src/features/code_review/service.py
from sqlalchemy.ext.asyncio import AsyncSession
from .models import CodeReview
from .schemas import CodeReviewCreate

class CodeReviewService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_review(self, data: CodeReviewCreate) -> CodeReview:
        # Business logic
        pass
```

**Step 5: Create router.py**
```python
# src/features/code_review/router.py
from fastapi import APIRouter, Depends
from .service import CodeReviewService
from .schemas import CodeReviewCreate, CodeReviewResponse

router = APIRouter(prefix="/api/v1/reviews", tags=["code_review"])

@router.post("/", response_model=CodeReviewResponse)
async def create_review(
    data: CodeReviewCreate,
    service: CodeReviewService = Depends(get_review_service),
):
    return await service.create_review(data)
```

**Step 6: Create dependencies.py**
```python
# src/features/code_review/dependencies.py
from src.core.database import get_db

async def get_review_service(db = Depends(get_db)):
    return CodeReviewService(db)
```

**Step 7: Register in main.py**
```python
# src/main.py
from src.features.code_review import router as review_router

app.include_router(review_router)
```

### Frontend

**Step 1: Create directory structure**
```bash
mkdir -p src/features/code_review/{components,hooks,store,types}
```

**Step 2: Create types.ts**
```typescript
// src/features/code_review/types.ts
export interface CodeReview {
  id: number;
  task_id: number;
  status: 'pending' | 'in_progress' | 'completed';
  findings: string | null;
  created_at: string;
}
```

**Step 3: Create components/ReviewList.tsx**
```typescript
// src/features/code_review/components/ReviewList.tsx
import { useFindCodeReviewsReviewsGet } from '@/openapi/@tanstack/react-query.gen';

export function ReviewList() {
  const { data: reviews, isLoading } = useFindCodeReviewsReviewsGet();

  return (
    <div>
      {reviews?.map(review => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
```

**Step 4: Create hooks/useCodeReview.ts**
```typescript
// src/features/code_review/hooks/useCodeReview.ts
import { useFindCodeReviewReviewsIdGet } from '@/openapi/@tanstack/react-query.gen';

export function useCodeReview(reviewId: number) {
  return useFindCodeReviewReviewsIdGet(reviewId);
}
```

**Step 5: Create route**
```typescript
// src/routes/_protected/features/code_review/list.tsx
import { createFileRoute } from '@tanstack/react-router';
import { ReviewList } from '@/features/code_review/components/ReviewList';

function CodeReviewListPage() {
  return <ReviewList />;
}

export const Route = createFileRoute(
  '/_protected/features/code_review/list'
)({
  component: CodeReviewListPage,
});
```

---

## Potential Challenges & Mitigation

| Challenge | Risk | Mitigation |
|-----------|------|-----------|
| **Complex cross-feature logic** | High | Use dependency injection, shared events pattern |
| **Circular dependencies** | High | Enforce strict dependency graph, use linting rules |
| **Duplicate code across features** | Medium | Extract to core/, use shared schemas |
| **Testing integration tests** | Medium | Create separate integration test directory |
| **Migration mistakes** | Medium | Phase migration, keep old structure temporarily |
| **Team learning curve** | Low | Provide templates, clear documentation |

---

## Success Metrics

After migration, we should see:

- ✅ **80%+ reduction** in time to add new features
- ✅ **Feature tests isolated** - no cross-feature imports in tests
- ✅ **Clear dependency graph** - no circular dependencies
- ✅ **Parallel development** - multiple features developed simultaneously
- ✅ **Code reuse** - core utilities shared across features
- ✅ **Documentation clarity** - new devs can add features following templates

---

## Timeline & Effort Estimate

| Phase | Duration | Effort | Notes |
|-------|----------|--------|-------|
| Planning & Design Review | 2-3 days | 1 person | Finalize structure |
| Core Refactoring | 3-4 days | 1-2 people | Move infrastructure |
| Feature Migration | 5-7 days | 2-3 people | Migrate each feature |
| Testing & QA | 3-5 days | 2-3 people | Update tests, verify |
| Documentation | 3-4 days | 1-2 people | Update all docs |
| **Total** | **2-3 weeks** | **10-15 person-days** | |

---

## Next Steps

1. **Review & Feedback** - Team reviews this proposal
2. **Architecture Decision Record** - Document decision
3. **Create Implementation Plan** - Break into GitHub issues
4. **Setup Core Structure** - Begin Phase 1
5. **Create Feature Templates** - For developers to follow
6. **Migrate Features One-by-One** - Batch migration
7. **Update All Documentation** - Keep docs in sync

---

## Conclusion

This modular, feature-first architecture transforms CodeGraph from a layer-based monolith into a scalable, maintainable platform designed for growth. Each feature becomes a self-contained module, reducing complexity and enabling parallel team development.

The investment upfront (2-3 weeks) pays dividends as:
- New features can be added in days instead of weeks
- Code is easier to understand and modify
- Teams can work independently
- The codebase scales with your product

This architecture aligns with modern practices in both backend (microservices patterns) and frontend (component-driven design) development.

---

**Document Status:** Proposal (Ready for Review)
**Last Updated:** 2025-12-21
**Author:** Architecture Discussion
