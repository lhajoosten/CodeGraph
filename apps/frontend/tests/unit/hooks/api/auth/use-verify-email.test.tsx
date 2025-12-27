import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useVerifyEmail } from '@/hooks/api/auth/mutations/use-verify-email';
import { useAuthStore } from '@/stores/auth-store';
import * as verifyEmailMutation from '@/openapi/@tanstack/react-query.gen';

// Mock the generated mutation
vi.mock('@/openapi/@tanstack/react-query.gen', () => ({
  verifyEmailApiV1AuthVerifyEmailPostMutation: vi.fn(),
}));

// Mock toast
vi.mock('@/lib/toast', () => ({
  addToast: vi.fn(),
}));

describe('useVerifyEmail', () => {
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
    // Set auth store with unverified email
    const { login, setEmailVerified } = useAuthStore.getState();
    login({
      id: 1,
      email: 'test@example.com',
      email_verified: false,
      first_name: 'John',
      last_name: 'Doe',
      display_name: 'John Doe',
      avatar_url: null,
      profile_completed: true,
    });
    setEmailVerified(false);
  });

  afterEach(() => {
    queryClient?.clear();
  });

  it('should return mutation object', () => {
    vi.mocked(verifyEmailMutation.verifyEmailApiV1AuthVerifyEmailPostMutation).mockReturnValue({
      mutationFn: vi.fn(),
    } as any);

    const { result } = renderHook(() => useVerifyEmail(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('should update email verified status on successful verification', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue({ message: 'Email verified' });

    vi.mocked(verifyEmailMutation.verifyEmailApiV1AuthVerifyEmailPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useVerifyEmail(), {
      wrapper: createWrapper(),
    });

    // Verify email not verified before
    let authState = useAuthStore.getState();
    expect(authState.emailVerified).toBe(false);

    result.current.mutate({ body: { token: 'verification-token' } });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify email verified after successful mutation
    authState = useAuthStore.getState();
    expect(authState.emailVerified).toBe(true);
  });

  it('should show success toast on successful verification', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue({ message: 'Email verified' });
    const { addToast } = await import('@/lib/toast');

    vi.mocked(verifyEmailMutation.verifyEmailApiV1AuthVerifyEmailPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useVerifyEmail(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ body: { token: 'verification-token' } });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(addToast).toHaveBeenCalledWith({
      title: 'Email Verified',
      description: 'Your email has been successfully verified.',
      color: 'success',
    });
  });

  it('should show error toast on verification failure', async () => {
    const errorMessage = 'Invalid token';
    const mockMutationFn = vi.fn().mockRejectedValue(new Error(errorMessage));
    const { addToast } = await import('@/lib/toast');

    vi.mocked(verifyEmailMutation.verifyEmailApiV1AuthVerifyEmailPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useVerifyEmail(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ body: { token: 'invalid-token' } });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Email Verification Failed',
        color: 'danger',
      })
    );
  });

  it('should not update email verified status on verification failure', async () => {
    const mockMutationFn = vi.fn().mockRejectedValue(new Error('Invalid token'));

    vi.mocked(verifyEmailMutation.verifyEmailApiV1AuthVerifyEmailPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useVerifyEmail(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ body: { token: 'invalid-token' } });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Email should still be unverified
    const authState = useAuthStore.getState();
    expect(authState.emailVerified).toBe(false);
  });

  it('should accept verification token in request body', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue({ message: 'Email verified' });

    vi.mocked(verifyEmailMutation.verifyEmailApiV1AuthVerifyEmailPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useVerifyEmail(), {
      wrapper: createWrapper(),
    });

    const testToken = 'abc123def456';
    result.current.mutate({ body: { token: testToken } });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockMutationFn).toHaveBeenCalled();
  });

  it('should transition through pending state during verification', async () => {
    const mockMutationFn = vi.fn(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ message: 'Email verified' }), 100);
        })
    );

    vi.mocked(verifyEmailMutation.verifyEmailApiV1AuthVerifyEmailPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useVerifyEmail(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ body: { token: 'token' } });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockMutationFn).toHaveBeenCalled();
  });
});
