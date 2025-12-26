import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useRegister } from '@/hooks/api/auth/mutations/use-register';
import * as registerMutation from '@/openapi/@tanstack/react-query.gen';
import { mockRegisterResponse } from '../../../fixtures/auth-fixtures';

// Mock the generated mutation
vi.mock('@/openapi/@tanstack/react-query.gen', () => ({
  registerUserApiV1AuthRegisterPostMutation: vi.fn(),
}));

// Mock toast
vi.mock('@/lib/toast', () => ({
  addToast: vi.fn(),
}));

describe('useRegister', () => {
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
  });

  afterEach(() => {
    queryClient?.clear();
  });

  it('should return mutation object', () => {
    vi.mocked(registerMutation.registerUserApiV1AuthRegisterPostMutation).mockReturnValue({
      mutationFn: vi.fn(),
    } as any);

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('should register user successfully', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue(mockRegisterResponse);

    vi.mocked(registerMutation.registerUserApiV1AuthRegisterPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { email: 'newuser@example.com', password: 'Password123!' },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Mutation function gets called with the variables (first arg includes the body)
    expect(mockMutationFn).toHaveBeenCalled();
    const callArg = mockMutationFn.mock.calls[0][0];
    expect(callArg.body.email).toBe('newuser@example.com');
    expect(callArg.body.password).toBe('Password123!');
  });

  it('should show success toast on successful registration', async () => {
    const mockMutationFn = vi.fn().mockResolvedValue(mockRegisterResponse);
    const { addToast } = await import('@/lib/toast');

    vi.mocked(registerMutation.registerUserApiV1AuthRegisterPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { email: 'newuser@example.com', password: 'Password123!' },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(addToast).toHaveBeenCalledWith({
      title: 'Registration Successful',
      description: 'Account created! Please check your email to verify your account.',
      color: 'success',
    });
  });

  it('should show error toast on registration failure', async () => {
    const errorMessage = 'Email already registered';
    const mockMutationFn = vi.fn().mockRejectedValue(new Error(errorMessage));
    const { addToast } = await import('@/lib/toast');

    vi.mocked(registerMutation.registerUserApiV1AuthRegisterPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { email: 'existing@example.com', password: 'Password123!' },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(addToast).toHaveBeenCalledWith({
      title: 'Registration Failed',
      description: errorMessage,
      color: 'danger',
    });
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network error');
    const mockMutationFn = vi.fn().mockRejectedValue(networkError);
    const { addToast } = await import('@/lib/toast');

    vi.mocked(registerMutation.registerUserApiV1AuthRegisterPostMutation).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any);

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      body: { email: 'newuser@example.com', password: 'Password123!' },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(addToast).toHaveBeenCalledWith({
      title: 'Registration Failed',
      description: 'Network error',
      color: 'danger',
    });
  });
});
