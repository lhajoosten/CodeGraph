import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useLogin } from '@/hooks/api/auth/mutations/use-login';
import { useAuthStore } from '@/stores/auth-store';
import * as loginMutation from '@/openapi/@tanstack/react-query.gen';
import { mockUser, mockLoginResponse } from '../../../fixtures/auth-fixtures';

// Mock the generated mutation
vi.mock('@/openapi/@tanstack/react-query.gen', () => ({
  loginUserApiV1AuthLoginPostMutation: vi.fn(),
}));

// Mock toast
vi.mock('@/lib/toast', () => ({
  addToast: vi.fn(),
}));

describe('useLogin', () => {
  let queryClient: QueryClient;

  function createWrapper() {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Return wrapper component
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return Wrapper;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth store
    useAuthStore.getState().logout();
  });

  afterEach(() => {
    queryClient?.clear();
  });

  it('should return mutation object', () => {
    vi.mocked(loginMutation.loginUserApiV1AuthLoginPostMutation).mockReturnValue({
      mutationFn: vi.fn(),
    } as any);

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('should update auth store on successful login', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue(mockLoginResponse);

    vi.mocked(loginMutation.loginUserApiV1AuthLoginPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { email: 'test@example.com', password: 'password' },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check auth store was updated
    const authState = useAuthStore.getState();
    expect(authState.isAuthenticated).toBe(true);
    expect(authState.user).toEqual(mockUser);
    expect(authState.emailVerified).toBe(true);
  });

  it('should execute onSuccess handler from useLogin hook', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue(mockLoginResponse);
    const { addToast } = await import('@/lib/toast');

    vi.mocked(loginMutation.loginUserApiV1AuthLoginPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { email: 'test@example.com', password: 'password' },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify the hook's built-in onSuccess handler was executed (shows toast)
    expect(addToast).toHaveBeenCalledWith({
      title: 'Login Successful',
      description: 'Welcome back! You have successfully logged in.',
      color: 'success',
    });
  });

  it('should show success toast on successful login', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue(mockLoginResponse);
    const { addToast } = await import('@/lib/toast');

    vi.mocked(loginMutation.loginUserApiV1AuthLoginPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { email: 'test@example.com', password: 'password' },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(addToast).toHaveBeenCalledWith({
      title: 'Login Successful',
      description: 'Welcome back! You have successfully logged in.',
      color: 'success',
    });
  });

  it('should show error toast on login failure', async () => {
    const errorMessage = 'Invalid credentials';
    const mockMutationFn = vi.fn().mockRejectedValue(new Error(errorMessage));
    const { addToast } = await import('@/lib/toast');

    vi.mocked(loginMutation.loginUserApiV1AuthLoginPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { email: 'test@example.com', password: 'wrong' },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(addToast).toHaveBeenCalledWith({
      title: 'Login Failed',
      description: errorMessage,
      color: 'danger',
    });
  });

  it('should not update auth store on login failure', async () => {
    const mockMutationFn = vi.fn().mockRejectedValue(new Error('Invalid credentials'));

    vi.mocked(loginMutation.loginUserApiV1AuthLoginPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { email: 'test@example.com', password: 'wrong' },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Auth store should remain unauthenticated
    const authState = useAuthStore.getState();
    expect(authState.isAuthenticated).toBe(false);
    expect(authState.user).toBeNull();
  });

  it('should handle unverified email', async () => {
    const unverifiedResponse = {
      user: { ...mockUser, email_verified: false },
      email_verified: false,
    };
    const mockMutationFn = vi.fn().mockResolvedValue(unverifiedResponse);

    vi.mocked(loginMutation.loginUserApiV1AuthLoginPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { email: 'test@example.com', password: 'password' },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const authState = useAuthStore.getState();
    expect(authState.isAuthenticated).toBe(true);
    expect(authState.emailVerified).toBe(false);
  });
});
