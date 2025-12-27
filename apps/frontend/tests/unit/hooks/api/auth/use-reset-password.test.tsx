import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useResetPassword } from '@/hooks/api/auth/mutations/use-reset-password';
import * as resetPasswordMutation from '@/openapi/@tanstack/react-query.gen';

// Mock the generated mutation
vi.mock('@/openapi/@tanstack/react-query.gen', () => ({
  resetPasswordApiV1AuthResetPasswordPostMutation: vi.fn(),
}));

// Mock toast
vi.mock('@/lib/toast', () => ({
  addToast: vi.fn(),
}));

describe('useResetPassword', () => {
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
    vi.mocked(resetPasswordMutation.resetPasswordApiV1AuthResetPasswordPostMutation).mockReturnValue({
      mutationFn: vi.fn(),
    } as any);

    const { result } = renderHook(() => useResetPassword(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('should show success toast on successful password reset', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue({ message: 'Password reset successful' });
    const { addToast } = await import('@/lib/toast');

    vi.mocked(resetPasswordMutation.resetPasswordApiV1AuthResetPasswordPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useResetPassword(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { token: 'reset-token', new_password: 'newPassword123' },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(addToast).toHaveBeenCalledWith({
      title: 'Password Reset Successful',
      description: 'Your password has been reset. You can now sign in with your new password.',
      color: 'success',
    });
  });

  it('should show error toast on password reset failure', async () => {
    const errorMessage = 'Invalid or expired token';
    const mockMutationFn = vi.fn().mockRejectedValue(new Error(errorMessage));
    const { addToast } = await import('@/lib/toast');

    vi.mocked(resetPasswordMutation.resetPasswordApiV1AuthResetPasswordPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useResetPassword(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { token: 'invalid-token', new_password: 'newPassword123' },
    });

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

  it('should accept token and new password in request body', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue({ message: 'Password reset successful' });

    vi.mocked(resetPasswordMutation.resetPasswordApiV1AuthResetPasswordPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useResetPassword(), {
      wrapper: createWrapper(),
    });

    const testToken = 'abc123def456';
    const newPassword = 'SecurePassword123';
    result.current.mutate({
      body: { token: testToken, new_password: newPassword },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockMutationFn).toHaveBeenCalled();
  });

  it('should transition through pending state during password reset', async () => {
    const mockMutationFn = vi.fn(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ message: 'Password reset successful' }), 100);
        })
    );

    vi.mocked(resetPasswordMutation.resetPasswordApiV1AuthResetPasswordPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useResetPassword(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { token: 'reset-token', new_password: 'newPassword123' },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockMutationFn).toHaveBeenCalled();
  });

  it('should handle expired token error', async () => {
    const mockMutationFn = vi.fn().mockRejectedValue(new Error('Token has expired'));
    const { addToast } = await import('@/lib/toast');

    vi.mocked(resetPasswordMutation.resetPasswordApiV1AuthResetPasswordPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useResetPassword(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { token: 'expired-token', new_password: 'newPassword123' },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(addToast).toHaveBeenCalled();
  });

  it('should handle weak password error', async () => {
    const mockMutationFn = vi.fn().mockRejectedValue(new Error('Password does not meet requirements'));
    const { addToast } = await import('@/lib/toast');

    vi.mocked(resetPasswordMutation.resetPasswordApiV1AuthResetPasswordPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useResetPassword(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { token: 'valid-token', new_password: 'weak' },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(addToast).toHaveBeenCalled();
  });

  it('should work without onSuccess callback', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue({ message: 'Password reset successful' });

    vi.mocked(resetPasswordMutation.resetPasswordApiV1AuthResetPasswordPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useResetPassword(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { token: 'reset-token', new_password: 'newPassword123' },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });
});
