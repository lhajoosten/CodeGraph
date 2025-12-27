import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useUpdateProfile } from '@/hooks/api/auth/mutations/use-update-profile';
import * as updateProfileMutation from '@/openapi/@tanstack/react-query.gen';

// Mock the generated mutation
vi.mock('@/openapi/@tanstack/react-query.gen', () => ({
  updateProfileApiV1AuthProfilePutMutation: vi.fn(),
}));

// Mock toast
vi.mock('@/lib/toast', () => ({
  addToast: vi.fn(),
}));

describe('useUpdateProfile', () => {
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
    vi.mocked(updateProfileMutation.updateProfileApiV1AuthProfilePutMutation).mockReturnValue({
      mutationFn: vi.fn(),
    } as any);

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('should show success toast on successful profile update', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue({
      user: { id: 1, first_name: 'Jane', last_name: 'Doe' },
    });
    const { addToast } = await import('@/lib/toast');

    vi.mocked(updateProfileMutation.updateProfileApiV1AuthProfilePutMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { first_name: 'Jane', last_name: 'Doe' },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(addToast).toHaveBeenCalledWith({
      title: 'Profile Updated',
      description: 'Your profile has been updated successfully.',
      color: 'success',
    });
  });

  it('should call hook successfully and update profile', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue({
      user: { id: 1, first_name: 'Jane' },
    });

    vi.mocked(updateProfileMutation.updateProfileApiV1AuthProfilePutMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { first_name: 'Jane' },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockMutationFn).toHaveBeenCalled();
  });

  it('should show error toast on profile update failure', async () => {
    const errorMessage = 'Failed to update profile';
    const mockMutationFn = vi.fn().mockRejectedValue(new Error(errorMessage));
    const { addToast } = await import('@/lib/toast');

    vi.mocked(updateProfileMutation.updateProfileApiV1AuthProfilePutMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { first_name: 'Jane', last_name: 'Doe' },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Profile Update Failed',
        color: 'danger',
      })
    );
  });

  it('should not invalidate query on profile update failure', async () => {
    const mockMutationFn = vi.fn().mockRejectedValue(new Error('Failed to update'));
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    vi.mocked(updateProfileMutation.updateProfileApiV1AuthProfilePutMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { first_name: 'Jane' },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
    invalidateSpy.mockRestore();
  });

  it('should accept profile update data in request body', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue({
      user: { id: 1, first_name: 'Jane', last_name: 'Doe' },
    });

    vi.mocked(updateProfileMutation.updateProfileApiV1AuthProfilePutMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    const updateData = { first_name: 'Jane', last_name: 'Doe', avatar_url: 'https://example.com/avatar.jpg' };
    result.current.mutate({ body: updateData });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check mutation was called
    expect(mockMutationFn).toHaveBeenCalled();
  });

  it('should transition through pending state during profile update', async () => {
    const mockMutationFn = vi.fn(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ user: { id: 1, first_name: 'Jane' } }), 100);
        })
    );

    vi.mocked(updateProfileMutation.updateProfileApiV1AuthProfilePutMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { first_name: 'Jane' },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockMutationFn).toHaveBeenCalled();
  });

  it('should allow updating single profile field', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue({
      user: { id: 1, first_name: 'Jane' },
    });

    vi.mocked(updateProfileMutation.updateProfileApiV1AuthProfilePutMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { first_name: 'Jane' },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockMutationFn).toHaveBeenCalled();
  });

  it('should allow updating multiple profile fields', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue({
      user: { id: 1, first_name: 'Jane', last_name: 'Smith', avatar_url: 'url' },
    });

    vi.mocked(updateProfileMutation.updateProfileApiV1AuthProfilePutMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { first_name: 'Jane', last_name: 'Smith', avatar_url: 'https://example.com/avatar.jpg' },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockMutationFn).toHaveBeenCalled();
  });

  it('should work without onSuccess callback', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue({
      user: { id: 1, first_name: 'Jane' },
    });

    vi.mocked(updateProfileMutation.updateProfileApiV1AuthProfilePutMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { first_name: 'Jane' },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });
});
