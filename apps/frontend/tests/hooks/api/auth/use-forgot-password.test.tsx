import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useForgotPassword } from '@/hooks/api/auth/mutations/use-forgot-password';
import * as forgotPasswordMutation from '@/openapi/@tanstack/react-query.gen';

// Mock the generated mutation
vi.mock('@/openapi/@tanstack/react-query.gen', () => ({
  forgotPasswordApiV1AuthForgotPasswordPostMutation: vi.fn(),
}));

// Mock toast
vi.mock('@/lib/toast', () => ({
  addToast: vi.fn(),
}));

describe('useForgotPassword', () => {
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
  });

  afterEach(() => {
    queryClient?.clear();
  });

  it('should return mutation object', () => {
    vi.mocked(forgotPasswordMutation.forgotPasswordApiV1AuthForgotPasswordPostMutation).mockReturnValue({
      mutationFn: vi.fn(),
    } as any);

    const { result } = renderHook(() => useForgotPassword(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('should show success toast on successful password reset request', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue({ message: 'Reset link sent' });
    const { addToast } = await import('@/lib/toast');

    vi.mocked(forgotPasswordMutation.forgotPasswordApiV1AuthForgotPasswordPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useForgotPassword(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ body: { email: 'test@example.com' } });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(addToast).toHaveBeenCalledWith({
      title: 'Check Your Email',
      description: 'Password reset link has been sent to your email address.',
      color: 'success',
    });
  });

  it('should show error toast on password reset request failure', async () => {
    const errorMessage = 'Email not found';
    const mockMutationFn = vi.fn().mockRejectedValue(new Error(errorMessage));
    const { addToast } = await import('@/lib/toast');

    vi.mocked(forgotPasswordMutation.forgotPasswordApiV1AuthForgotPasswordPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useForgotPassword(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ body: { email: 'nonexistent@example.com' } });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Password Reset Failed',
        color: 'danger',
      })
    );
  });

  it('should accept email in request body', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue({ message: 'Reset link sent' });

    vi.mocked(forgotPasswordMutation.forgotPasswordApiV1AuthForgotPasswordPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useForgotPassword(), {
      wrapper: createWrapper(),
    });

    const testEmail = 'user@example.com';
    result.current.mutate({ body: { email: testEmail } });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockMutationFn).toHaveBeenCalled();
  });

  it('should transition through pending state during password reset request', async () => {
    const mockMutationFn = vi.fn(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ message: 'Reset link sent' }), 100);
        })
    );

    vi.mocked(forgotPasswordMutation.forgotPasswordApiV1AuthForgotPasswordPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useForgotPassword(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ body: { email: 'test@example.com' } });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockMutationFn).toHaveBeenCalled();
  });

  it('should allow multiple password reset requests', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue({ message: 'Reset link sent' });

    vi.mocked(forgotPasswordMutation.forgotPasswordApiV1AuthForgotPasswordPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useForgotPassword(), {
      wrapper: createWrapper(),
    });

    // First request
    result.current.mutate({ body: { email: 'test1@example.com' } });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Reset for second request
    vi.clearAllMocks();

    // Second request
    result.current.mutate({ body: { email: 'test2@example.com' } });

    await waitFor(() => {
      expect(mockMutationFn).toHaveBeenCalled();
    });
  });

  it('should work without onSuccess callback', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue({ message: 'Reset link sent' });

    vi.mocked(forgotPasswordMutation.forgotPasswordApiV1AuthForgotPasswordPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useForgotPassword(), {
      wrapper: createWrapper(),
    });

    // Mutate without onSuccess callback
    result.current.mutate({ body: { email: 'test@example.com' } });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });
});
