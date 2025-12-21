# API Integration Guide - Hey-API + TanStack Query

This guide explains how to use the auto-generated API client in the CodeGraph frontend.

## Overview

The frontend uses **@hey-api/openapi-ts** to automatically generate a type-safe API client from the backend's OpenAPI specification. This client integrates seamlessly with **TanStack Query (React Query)** for efficient data fetching and caching.

## Setup Process

The API client is generated automatically when you run:

```bash
npm run api:generate
```

This command:
1. Fetches the OpenAPI spec from `http://backend:8000/openapi.json` (or `http://localhost:8000/openapi.json` locally)
2. Generates TypeScript types and service functions in `src/api/generated/`
3. Formats the output with Prettier

## File Structure

```
src/
├── api/
│   └── generated/          # Auto-generated files (don't edit!)
│       ├── index.ts        # Main export
│       ├── services.gen.ts # API service functions
│       ├── types.gen.ts    # TypeScript types
│       ├── schemas.gen.ts  # Request/response schemas
│       └── core/           # Core client logic
│
├── lib/
│   ├── api-hooks.ts        # Helper functions for creating hooks
│   ├── auth-hooks.ts       # Authentication hooks (useLogin, useRegister, etc.)
│   ├── tasks-hooks.ts      # Task management hooks (useTasks, useCreateTask, etc.)
│   └── hooks.ts            # Central export point
```

## Usage Examples

### Authentication

#### Login
```typescript
import { useLogin } from '@/lib/hooks'

function LoginPage() {
  const loginMutation = useLogin()

  const handleLogin = (email: string, password: string) => {
    loginMutation.mutate(
      {
        requestBody: { email, password }
      },
      {
        onSuccess: (data) => {
          // data contains access_token, refresh_token, etc.
          localStorage.setItem('token', data.access_token)
        },
        onError: (error) => {
          console.error('Login failed:', error)
        }
      }
    )
  }

  return (
    <button
      onClick={() => handleLogin('user@example.com', 'password')}
      disabled={loginMutation.isPending}
    >
      {loginMutation.isPending ? 'Logging in...' : 'Login'}
    </button>
  )
}
```

#### Get Current User
```typescript
import { useCurrentUser } from '@/lib/hooks'

function UserProfile() {
  const { data: user, isLoading, error } = useCurrentUser()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return <div>Welcome, {user.email}!</div>
}
```

### Task Management

#### Fetch Tasks
```typescript
import { useTasks } from '@/lib/hooks'

function TaskList() {
  const { data: response, isLoading } = useTasks({
    skip: 0,
    limit: 20
  })

  return (
    <ul>
      {response?.items.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  )
}
```

#### Create Task
```typescript
import { useCreateTask } from '@/lib/hooks'

function CreateTaskForm() {
  const createMutation = useCreateTask()

  const handleCreate = (title: string, description: string) => {
    createMutation.mutate(
      {
        requestBody: { title, description, priority: 'MEDIUM' }
      },
      {
        onSuccess: (newTask) => {
          console.log('Task created:', newTask)
          // Tasks list will automatically refresh via cache invalidation
        }
      }
    )
  }

  return (
    <button onClick={() => handleCreate('New Task', 'Description')}>
      Create Task
    </button>
  )
}
```

#### Update Task
```typescript
import { useUpdateTask } from '@/lib/hooks'

function EditTask({ taskId }) {
  const updateMutation = useUpdateTask(taskId)

  const handleUpdate = (status: 'COMPLETED') => {
    updateMutation.mutate(
      {
        requestBody: { status },
        pathParams: { taskId }
      },
      {
        onSuccess: () => {
          console.log('Task updated!')
          // Related caches are automatically invalidated
        }
      }
    )
  }

  return (
    <button onClick={() => handleUpdate('COMPLETED')}>
      Mark Complete
    </button>
  )
}
```

#### Delete Task
```typescript
import { useDeleteTask } from '@/lib/hooks'

function TaskItem({ taskId }) {
  const deleteMutation = useDeleteTask(taskId)

  return (
    <button
      onClick={() => deleteMutation.mutate()}
      disabled={deleteMutation.isPending}
    >
      Delete
    </button>
  )
}
```

## Query & Mutation Properties

All hooks return standard TanStack Query objects with these properties:

### Query Properties
```typescript
const {
  data,           // The fetched data
  isLoading,      // True while fetching
  isError,        // True if an error occurred
  error,          // Error object if failed
  isFetching,     // True while request is in flight
  refetch,        // Manual refetch function
  status          // 'pending' | 'error' | 'success'
} = useTask(taskId)
```

### Mutation Properties
```typescript
const {
  mutate,         // Function to trigger mutation
  data,           // Data from last successful mutation
  error,          // Error from last failed mutation
  isPending,      // True while mutation is in progress
  isError,        // True if mutation failed
  status,         // 'idle' | 'pending' | 'success' | 'error'
  reset           // Reset mutation state
} = useCreateTask()
```

## Cache Management

Each hook family uses a query key pattern for automatic cache invalidation:

```typescript
// Auth
authQueryKeys.all              // All auth queries
authQueryKeys.currentUser()    // Current user query

// Tasks
taskQueryKeys.all              // All task queries
taskQueryKeys.list(filters)    // Task list with filters
taskQueryKeys.detail(id)       // Single task by ID
```

When you create, update, or delete a task, related caches are automatically invalidated, and TanStack Query refetches the data.

## Advanced: Creating Custom Hooks

If you need to create hooks for endpoints not yet wrapped:

```typescript
import { useMutation } from '@tanstack/react-query'
import { someApiFunction } from '@/api/generated/services.gen'

export const useMyCustomEndpoint = () => {
  return useMutation({
    mutationFn: (data) => someApiFunction(data),
    onSuccess: () => {
      // Handle success
    }
  })
}
```

## Regenerating the Client

Whenever your backend API changes (new endpoints, new parameters, etc.), regenerate the client:

```bash
npm run api:generate
```

This will update all generated files and ensure your types stay in sync with the backend.

## Type Safety

All generated functions and types are fully typed, providing:

- Type-safe request parameters
- Type-safe response data
- IDE autocomplete for all API methods
- Compile-time error detection for API usage

Example:
```typescript
// This will give a TypeScript error if email is not a string
createMutation.mutate({
  requestBody: {
    email: 123  // ❌ Type error: expected string
  }
})
```

## Best Practices

1. **Always use the generated hooks** - Don't call the services directly
2. **Leverage cache invalidation** - Mutations automatically update related queries
3. **Use loading states** - Check `isPending` to disable buttons during requests
4. **Handle errors properly** - Always provide error feedback to users
5. **Regenerate when API changes** - Keep types in sync with backend
