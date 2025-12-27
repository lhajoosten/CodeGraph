/**
 * Factory functions for creating test data.
 *
 * Use these to generate mock data with sensible defaults and optional overrides.
 */

interface UserData {
  id: number;
  email: string;
  email_verified: boolean;
}

interface LoginResponse {
  user: UserData;
  email_verified: boolean;
}

/**
 * Creates a mock user with optional overrides.
 *
 * @example
 * const user = createMockUser();
 * const unverifiedUser = createMockUser({ email_verified: false });
 */
export function createMockUser(overrides?: Partial<UserData>): UserData {
  return {
    id: 1,
    email: 'test@example.com',
    email_verified: true,
    ...overrides,
  };
}

/**
 * Creates a mock login response with optional overrides.
 *
 * @example
 * const response = createMockLoginResponse();
 * const unverifiedResponse = createMockLoginResponse({ email_verified: false });
 */
export function createMockLoginResponse(overrides?: Partial<LoginResponse>): LoginResponse {
  return {
    user: createMockUser(),
    email_verified: true,
    ...overrides,
  };
}

/**
 * Creates a mock error object.
 *
 * @example
 * const error = createMockError('Invalid credentials');
 */
export function createMockError(message: string, status = 400) {
  return {
    response: {
      status,
      data: {
        detail: message,
      },
    },
    message,
  };
}

/**
 * Creates a mock mutation result for TanStack Query.
 *
 * @example
 * const mutation = createMockMutation({ isPending: true });
 */
export function createMockMutation<
  TData = unknown,
  TError = Error,
>(overrides?: {
  isPending?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  data?: TData;
  error?: TError;
}) {
  return {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: overrides?.isPending ?? false,
    isSuccess: overrides?.isSuccess ?? false,
    isError: overrides?.isError ?? false,
    isIdle: !overrides?.isPending && !overrides?.isSuccess && !overrides?.isError,
    data: overrides?.data ?? null,
    error: overrides?.error ?? null,
    status: overrides?.isPending
      ? 'pending'
      : overrides?.isSuccess
        ? 'success'
        : overrides?.isError
          ? 'error'
          : 'idle',
    reset: vi.fn(),
    variables: undefined,
    failureCount: 0,
    failureReason: null,
    submittedAt: 0,
    context: undefined,
  };
}

/**
 * Creates a mock query result for TanStack Query.
 *
 * @example
 * const query = createMockQuery({ data: mockUser });
 */
export function createMockQuery<TData = unknown, TError = Error>(overrides?: {
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  data?: TData;
  error?: TError;
}) {
  return {
    data: overrides?.data ?? null,
    error: overrides?.error ?? null,
    isLoading: overrides?.isLoading ?? false,
    isSuccess: overrides?.isSuccess ?? false,
    isError: overrides?.isError ?? false,
    isFetching: false,
    isRefetching: false,
    isLoadingError: false,
    isRefetchError: false,
    status: overrides?.isLoading
      ? 'pending'
      : overrides?.isSuccess
        ? 'success'
        : overrides?.isError
          ? 'error'
          : 'pending',
    fetchStatus: 'idle',
    refetch: vi.fn(),
  };
}

/**
 * Import vi from vitest for the mock functions
 */
import { vi } from 'vitest';
