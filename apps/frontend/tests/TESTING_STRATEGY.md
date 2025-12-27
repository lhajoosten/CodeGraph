# Authentication Testing Strategy - CodeGraph Frontend

This document outlines the comprehensive testing strategy for authentication flows in the CodeGraph frontend application.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Stack & Tools](#test-stack--tools)
3. [What to Test](#what-to-test)
4. [What NOT to Test](#what-not-to-test)
5. [Test Organization](#test-organization)
6. [Testing Patterns](#testing-patterns)
7. [Coverage Targets](#coverage-targets)
8. [Shared Test Utilities](#shared-test-utilities)

---

## Testing Philosophy

### Core Principles

- **Test behavior, not implementation** - Focus on what users see and do, not internal component details
- **User-centric testing** - Write tests from the user's perspective using React Testing Library
- **Integration over unit** - Prefer integration tests that cover complete user flows
- **Avoid testing implementation details** - Don't test state variables, internal functions, or React internals
- **Test error paths** - Always test both success and error scenarios
- **Accessibility testing** - Use semantic queries (getByRole, getByLabelText) to ensure accessibility

### Coverage Philosophy

- **80%+ coverage** for business logic (forms, hooks, utilities)
- **100% coverage** for critical auth paths (login, registration, password reset)
- **Skip implementation details** - Don't test third-party libraries, framework internals, or generated code
- **Focus on user flows** - Prioritize end-to-end user journeys over isolated unit tests

---

## Test Stack & Tools

### Core Testing Framework

- **Vitest** - Fast unit test framework (Jest-compatible)
- **React Testing Library** - Component testing with user-centric approach
- **@testing-library/user-event** - Realistic user interaction simulation
- **@testing-library/jest-dom** - Custom matchers for DOM assertions

### Mocking & API

- **Vitest mocking** (`vi.mock()`) - Mock modules, hooks, and API calls
- **Manual mocks** - Mock TanStack Query, TanStack Router, API client
- **MSW (Mock Service Worker)** - Optional for more realistic API mocking (future enhancement)

### Test Utilities

- **Custom render helpers** - Wrap components with providers (QueryClient, Router)
- **Test fixtures** - Shared test data for consistent testing
- **Factory functions** - Generate test data programmatically

---

## What to Test

### Component Testing (Forms)

Test user interactions and visual feedback:

1. **Initial Render**
   - Form fields are present
   - Labels and placeholders are correct
   - Initial state is correct (disabled buttons, empty fields)

2. **User Input**
   - Users can type into fields
   - Show/hide password toggles work
   - Remember me checkbox toggles
   - Terms acceptance checkbox toggles

3. **Validation**
   - Required field validation
   - Email format validation
   - Password strength validation
   - Password confirmation matching
   - Real-time validation feedback
   - Form-level validation (submit button state)

4. **Form Submission**
   - Valid data submits successfully
   - Invalid data shows errors
   - Submit button disabled during submission
   - Loading state displayed
   - Success/error messages shown

5. **Navigation**
   - Links to other pages work
   - Redirect after success
   - Query params preserved

### Hook Testing (API Mutations/Queries)

Test API integration and state management:

1. **Mutation Hooks** (useLogin, useRegister, useLogout)
   - Successfully call API with correct data
   - Update auth store on success
   - Invalidate queries on success
   - Show toast notifications
   - Handle API errors
   - Return correct mutation state

2. **Query Hooks** (useFetchCurrentUser)
   - Fetch data successfully
   - Handle loading state
   - Handle error state
   - Cache data correctly
   - Refetch on invalidation

### Store Testing (Zustand)

Test state management:

1. **Auth Store** (useAuthStore)
   - Initial state is correct
   - `login()` updates state correctly
   - `logout()` clears state
   - `setEmailVerified()` updates flag
   - State persists to localStorage
   - State rehydrates on mount

### Route Guard Testing

Test authentication guards:

1. **Protected Routes**
   - Redirect unauthenticated users to login
   - Allow authenticated users
   - Preserve redirect URL in query params
   - Check email verification status

2. **Public Routes**
   - Redirect authenticated users to dashboard
   - Allow unauthenticated users

### Integration Testing (Complete Flows)

Test end-to-end user journeys:

1. **Registration Flow**
   - User fills out form → submits → sees success → redirects to email verification pending
   - User submits invalid data → sees errors → corrects → submits successfully

2. **Login Flow**
   - User enters credentials → submits → redirects to dashboard
   - User enters invalid credentials → sees error → corrects → logs in

3. **Password Reset Flow**
   - User requests reset → receives email → clicks link → resets password → redirects to login

4. **Email Verification Flow**
   - User clicks verification link → token verified → redirects to login

5. **OAuth Flow**
   - User clicks OAuth button → redirects to provider → callback updates auth store

---

## What NOT to Test

### Implementation Details

- Internal component state variables
- Internal helper functions not exported
- React hooks implementation (useState, useEffect internals)
- Component lifecycle methods
- CSS class names (unless testing visual behavior)

### Third-Party Libraries

- React internals
- TanStack Query caching logic
- TanStack Router routing logic
- Zod validation library
- Zustand store internals

### Generated Code

- OpenAPI generated types
- OpenAPI generated hooks (already tested by generator)
- Auto-generated route types

### Framework Behavior

- React rendering behavior
- Browser APIs (localStorage, fetch)
- DOM APIs

### Examples of What NOT to Test

```typescript
// ❌ BAD: Testing implementation details
it('should call useState with initial value', () => {
  const { result } = renderHook(() => useState(false));
  expect(result.current[0]).toBe(false);
});

// ❌ BAD: Testing internal state
it('should set isLoading state to true', () => {
  const { result } = renderHook(() => useLogin());
  // Don't test internal state variables
});

// ❌ BAD: Testing CSS classes
it('should have correct class name', () => {
  render(<Button />);
  expect(screen.getByRole('button')).toHaveClass('bg-blue-500');
});

// ✅ GOOD: Testing user behavior
it('should disable button while submitting', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  const button = screen.getByRole('button', { name: /sign in/i });
  await user.click(button);

  expect(button).toBeDisabled();
});
```

---

## Test Organization

### Directory Structure

```
src/__tests__/
├── components/
│   ├── auth/
│   │   ├── login-form.test.tsx
│   │   ├── register-form.test.tsx
│   │   ├── forgot-password-form.test.tsx
│   │   ├── password-reset-form.test.tsx
│   │   └── email-verification.test.tsx
│   └── ui/
│       ├── button.test.tsx
│       └── input.test.tsx
├── hooks/
│   ├── api/
│   │   └── auth/
│   │       ├── use-login.test.ts
│   │       ├── use-register.test.ts
│   │       └── use-logout.test.ts
│   └── common/
│       └── use-toggle.test.ts
├── stores/
│   └── auth-store.test.ts
├── integration/
│   ├── auth-flow.test.tsx
│   └── oauth-flow.test.tsx
├── utils/
│   └── test-utils.tsx          # Shared test utilities
└── fixtures/
    └── auth-fixtures.ts         # Test data fixtures
```

### Naming Conventions

- **Test files**: `<component-name>.test.tsx` or `<hook-name>.test.ts`
- **Integration tests**: `<flow-name>.test.tsx`
- **Test utilities**: `test-utils.tsx`, `<feature>-fixtures.ts`
- **Test descriptions**: Use clear, descriptive names (e.g., "should disable submit button while pending")

---

## Testing Patterns

### 1. Component Testing Pattern

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/login-form';

// Mock dependencies
vi.mock('@tanstack/react-router');
vi.mock('@/hooks/api/auth/mutations/use-login');

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();

    vi.mocked(useLogin).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      // ... other mutation properties
    } as any);

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockMutate).toHaveBeenCalledWith({
      body: {
        email: 'test@example.com',
        password: 'Password123!',
      },
    });
  });
});
```

### 2. Hook Testing Pattern

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLogin } from '@/hooks/api/auth/mutations/use-login';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useLogin', () => {
  it('should login user successfully', async () => {
    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { email: 'test@example.com', password: 'password' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
```

### 3. Store Testing Pattern

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/stores/auth-store';

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.logout();
    });
  });

  it('should update state on login', () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.login({
        id: 1,
        email: 'test@example.com',
        email_verified: true,
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({
      id: 1,
      email: 'test@example.com',
      email_verified: true,
    });
  });
});
```

### 4. Async Testing Pattern

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Async operations', () => {
  it('should handle async form submission', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    // Fill form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password');

    // Submit
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for loading state
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });
  });
});
```

### 5. Error Testing Pattern

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Error handling', () => {
  it('should display error message on failure', async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();

    vi.mocked(useLogin).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: new Error('Invalid credentials'),
    } as any);

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
```

---

## Coverage Targets

### Overall Coverage Goals

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

### Critical Path Coverage (100%)

- Login flow (form + hook + store)
- Registration flow (form + hook)
- Password reset flow (forgot password + reset)
- Email verification
- Logout
- Auth store state management

### Lower Priority Coverage (60-70%)

- UI components (buttons, inputs, etc.)
- Utility functions
- Edge cases
- Error boundaries

### Run Coverage Reports

```bash
# Run tests with coverage
npm run test -- --coverage

# View HTML coverage report
open coverage/index.html
```

---

## Shared Test Utilities

### Custom Render Helper

```typescript
// src/__tests__/utils/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory, createRootRoute, createRouter } from '@tanstack/react-router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';
```

### Test Fixtures

```typescript
// src/__tests__/fixtures/auth-fixtures.ts
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  email_verified: true,
};

export const mockLoginCredentials = {
  email: 'test@example.com',
  password: 'Password123!',
};

export const mockRegisterData = {
  email: 'newuser@example.com',
  password: 'Password123!',
  confirmPassword: 'Password123!',
  firstName: 'John',
  lastName: 'Doe',
  acceptTerms: true,
};
```

### Factory Functions

```typescript
// src/__tests__/fixtures/factories.ts
export function createMockUser(overrides?: Partial<UserData>): UserData {
  return {
    id: 1,
    email: 'test@example.com',
    email_verified: true,
    ...overrides,
  };
}

export function createMockLoginResponse(overrides?: Partial<LoginResponse>): LoginResponse {
  return {
    user: createMockUser(),
    email_verified: true,
    ...overrides,
  };
}
```

---

## Running Tests

### Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run specific test file
npm run test -- login-form.test.tsx

# Run tests with coverage
npm run test -- --coverage

# Run tests with UI
npm run test -- --ui
```

### Debugging Tests

```bash
# Run tests with verbose output
npm run test -- --reporter=verbose

# Run single test with debugging
npm run test -- --no-coverage --reporter=verbose login-form.test.tsx
```

---

## Best Practices

1. **Use semantic queries**
   - Prefer `getByRole`, `getByLabelText`, `getByPlaceholderText`
   - Avoid `getByTestId` unless absolutely necessary

2. **Simulate real user interactions**
   - Use `userEvent` instead of `fireEvent`
   - Wait for async operations with `waitFor`

3. **Test accessibility**
   - Use ARIA roles and labels in queries
   - Test keyboard navigation
   - Test screen reader compatibility

4. **Keep tests isolated**
   - Clear mocks between tests with `beforeEach`
   - Don't share state between tests
   - Reset stores before each test

5. **Write clear test descriptions**
   - Use "should" in test names
   - Describe behavior, not implementation
   - Group related tests with `describe`

6. **Mock external dependencies**
   - Mock API calls
   - Mock router navigation
   - Mock third-party libraries

7. **Test error scenarios**
   - Test network failures
   - Test validation errors
   - Test edge cases

8. **Avoid snapshot testing**
   - Snapshots are brittle and hard to maintain
   - Prefer explicit assertions
   - Only use snapshots for static content

---

## Next Steps

1. Implement missing tests for:
   - LoginForm component
   - RegisterForm component
   - useLogin hook
   - useRegister hook
   - useLogout hook
   - Auth store
   - Route guards
   - Integration tests

2. Set up shared test utilities
3. Create test fixtures and factories
4. Configure coverage thresholds in `vitest.config.ts`
5. Add pre-commit hook to run tests
6. Document test failures and debugging tips

---

## References

- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [TanStack Query Testing](https://tanstack.com/query/latest/docs/framework/react/guides/testing)
