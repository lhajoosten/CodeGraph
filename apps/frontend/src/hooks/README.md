# Hooks Structure

This directory contains all custom React hooks organized by type and purpose.

## Directory Structure

```
hooks/
├── lib/                  # Library utilities for hook creation
│   ├── create-hooks.ts   # Utilities for wrapping generated hooks
│   └── index.ts          # Library exports
├── api/                  # API hooks (queries & mutations)
│   ├── use-auth.ts       # Authentication hooks
│   ├── use-tasks.ts      # Task management hooks
│   └── index.ts          # API hooks exports
├── common/               # Common component hooks
│   ├── use-toggle.ts     # Boolean state management
│   ├── use-form-error.ts # Form error handling
│   ├── use-local-storage.ts # LocalStorage integration
│   └── index.ts          # Common hooks exports
├── index.ts              # Central export point
└── README.md             # This file
```

## Import Patterns

### Importing from the root hooks directory

```typescript
// Recommended: Import directly from @/hooks
import { useLogin, useToggle, useLocalStorage } from '@/hooks';
```

### Importing specific subdirectories

```typescript
// Specific library hooks
import { createQueryHook, type QueryData } from '@/hooks/lib';

// Specific API hooks
import { useCurrentUser, taskQueryKeys } from '@/hooks/api';

// Specific common hooks
import { useFormError, useToggle } from '@/hooks/common';
```

## Hook Categories

### Library Hooks (`/lib`)

Utilities for creating and managing TanStack Query hooks.

- **`createQueryHook()`** - Wrapper for creating query hooks
- **`QueryData<T>`** - Type helper for extracting data types
- **`QueryError<T>`** - Type helper for extracting error types

### API Hooks (`/api`)

Hooks for backend API operations. Auto-generated from OpenAPI spec.

#### Authentication (`use-auth.ts`)

- **`useCurrentUser()`** - Fetch current authenticated user
- **`useLogin()`** - Login mutation
- **`useRegister()`** - Registration mutation

#### Tasks (`use-tasks.ts`)

- **`useTasks()`** - Fetch task list with pagination
- **`useTask(taskId)`** - Fetch single task
- **`useCreateTask()`** - Create task mutation
- **`useUpdateTask(taskId)`** - Update task mutation
- **`useDeleteTask(taskId)`** - Delete task mutation
- **`taskQueryKeys`** - Query key factory for cache management

### Common Hooks (`/common`)

Reusable hooks for common UI patterns.

- **`useToggle()`** - Manage boolean state (modals, dropdowns, etc.)
- **`useFormError()`** - Form error management
- **`useLocalStorage()`** - LocalStorage integration with React state

## Usage Examples

### Using API Hooks

```typescript
import { useLogin, useTasks } from '@/hooks';

// Login
function LoginForm() {
  const loginMutation = useLogin();

  const handleSubmit = (email: string, password: string) => {
    loginMutation.mutate(
      { requestBody: { email, password } },
      {
        onSuccess: (data) => {
          // Save token
          localStorage.setItem('token', data.access_token);
          navigate('/dashboard');
        },
        onError: (error) => {
          console.error('Login failed:', error);
        }
      }
    );
  };

  return (
    <button disabled={loginMutation.isPending}>
      {loginMutation.isPending ? 'Logging in...' : 'Login'}
    </button>
  );
}

// Fetch tasks
function TasksList() {
  const { data: response, isLoading } = useTasks({ skip: 0, limit: 20 });
  const tasks = response?.items || [];

  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}
```

### Using Common Hooks

```typescript
import { useToggle, useFormError, useLocalStorage } from '@/hooks';

// Toggle modal
function Modal() {
  const modal = useToggle();

  return (
    <>
      <button onClick={modal.open}>Open</button>
      {modal.isOpen && (
        <div className="modal">
          <button onClick={modal.close}>Close</button>
        </div>
      )}
    </>
  );
}

// Form errors
function Form() {
  const { error, clearError, handleError } = useFormError();

  const handleSubmit = async () => {
    try {
      clearError();
      await submitForm();
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <>
      {error && <div className="error">{error.message}</div>}
      <button onClick={handleSubmit}>Submit</button>
    </>
  );
}

// LocalStorage
function UserSettings() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Theme: {theme}
    </button>
  );
}
```

## Adding New Hooks

### Adding a New API Hook

1. Create a new file in `/api`, e.g., `use-repositories.ts`
2. Import the generated hook options from the API client
3. Create custom hooks wrapping the generated options
4. Export from `/api/index.ts`
5. Auto-export from root `index.ts`

```typescript
// api/use-repositories.ts
import { useQuery } from '@tanstack/react-query';
import { listRepositoriesApiV1RepositoriesGetOptions } from '@/api/generated/@tanstack/react-query.gen';

export const useRepositories = () => {
  return useQuery({
    ...listRepositoriesApiV1RepositoriesGetOptions(),
    staleTime: 5 * 60 * 1000,
  });
};

// api/index.ts - add export
export { useRepositories } from './use-repositories';
```

### Adding a New Common Hook

1. Create a new file in `/common`, e.g., `use-debounce.ts`
2. Implement the hook logic
3. Export from `/common/index.ts`
4. Auto-export from root `index.ts`

```typescript
// common/use-debounce.ts
import { useEffect, useState } from 'react';

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// common/index.ts - add export
export { useDebounce } from './use-debounce';
```

## Best Practices

### 1. Type Safety

- Always export proper TypeScript types from hook files
- Use generic types for flexible hooks
- Leverage TanStack Query's built-in types

### 2. Cache Management

- Use query keys from exported factories (e.g., `taskQueryKeys`)
- Invalidate related queries after mutations
- Set appropriate `staleTime` values

### 3. Error Handling

- Always provide error handling in mutation callbacks
- Show user-friendly error messages
- Log errors for debugging

### 4. Documentation

- Add JSDoc comments to all hooks
- Include usage examples in comments
- Document parameters and return types

### 5. Organization

- Group related hooks in the same file
- Keep files focused on a single domain
- Use meaningful file names (`use-feature-name`)

## Related Files

- [API Usage Guide](../API_USAGE_GUIDE.md) - How to use the auto-generated API client
- [Store Structure](../stores/README.md) - State management with Zustand
