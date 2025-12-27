import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useLogout } from '@/hooks/api/auth/mutations/use-logout';
import { useAuthStore } from '@/stores/auth-store';
import * as logoutMutation from '@/openapi/@tanstack/react-query.gen';

// Mock the generated mutation
vi.mock('@/openapi/@tanstack/react-query.gen', () => ({
  logoutApiV1AuthLogoutPostMutation: vi.fn(),
}));

// Mock toast
vi.mock('@/lib/toast', () => ({
  addToast: vi.fn(),
}));

describe('useLogout', () => {
  let queryClient: QueryClient;

  function createWrapper() {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return Wrapper;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    // Set auth state to authenticated
    const { login } = useAuthStore.getState();
    login({
      id: 1,
      email: 'test@example.com',
      email_verified: true,
      first_name: 'John',
      last_name: 'Doe',
      display_name: 'John Doe',
      avatar_url: null,
      profile_completed: true,
    });
  });

  afterEach(() => {
    queryClient?.clear();
  });

  it('should return mutation object', () => {
    vi.mocked(logoutMutation.logoutApiV1AuthLogoutPostMutation).mockReturnValue({
      mutationFn: vi.fn(),
    } as any);

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('should clear auth state on successful logout', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue({ message: 'Logged out' });

    vi.mocked(logoutMutation.logoutApiV1AuthLogoutPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    });

    // Verify authenticated before logout
    let authState = useAuthStore.getState();
    expect(authState.user).not.toBeNull();

    result.current.mutate({});

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify auth state cleared after logout
    authState = useAuthStore.getState();
    expect(authState.user).toBeNull();
    expect(authState.isAuthenticated).toBe(false);
  });

  it('should successfully complete logout operation', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue({ message: 'Logged out' });

    vi.mocked(logoutMutation.logoutApiV1AuthLogoutPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({});

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockMutationFn).toHaveBeenCalled();
  });

  it('should show success toast on successful logout', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue({ message: 'Logged out' });
    const { addToast } = await import('@/lib/toast');

    vi.mocked(logoutMutation.logoutApiV1AuthLogoutPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({});

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(addToast).toHaveBeenCalledWith({
      title: 'Logged Out',
      description: 'You have been logged out successfully.',
      color: 'success',
    });
  });

  it('should show error toast on logout failure', async () => {
    const errorMessage = 'Logout failed';
    const mockMutationFn = vi.fn().mockRejectedValue(new Error(errorMessage));
    const { addToast } = await import('@/lib/toast');

    vi.mocked(logoutMutation.logoutApiV1AuthLogoutPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({});

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Logout Failed',
        color: 'danger',
      })
    );
  });

  it('should not clear auth state on logout failure', async () => {
    const mockMutationFn = vi.fn().mockRejectedValue(new Error('Logout failed'));

    vi.mocked(logoutMutation.logoutApiV1AuthLogoutPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({});

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Auth state should remain unchanged on error
    const authState = useAuthStore.getState();
    expect(authState.user).not.toBeNull();
    expect(authState.isAuthenticated).toBe(true);
  });

  it('should transition through states during logout', async () => {
    const mockMutationFn = vi.fn(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ message: 'Logged out' }), 100);
        })
    );

    vi.mocked(logoutMutation.logoutApiV1AuthLogoutPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({});

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockMutationFn).toHaveBeenCalled();
  });
});
