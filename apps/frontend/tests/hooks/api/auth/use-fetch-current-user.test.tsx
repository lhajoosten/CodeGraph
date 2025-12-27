import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useFetchCurrentUser } from '@/hooks/api/auth/queries/use-fetch-current-user';
import * as currentUserQuery from '@/openapi/@tanstack/react-query.gen';
import { mockUser } from '../../../fixtures/auth-fixtures';

// Mock the generated query
vi.mock('@/openapi/@tanstack/react-query.gen', () => ({
  getCurrentUserInfoApiV1UsersMeGetOptions: vi.fn(),
}));

describe('useFetchCurrentUser', () => {
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

  it('should return query object', () => {
    vi.mocked(currentUserQuery.getCurrentUserInfoApiV1UsersMeGetOptions).mockReturnValue({
      queryKey: ['getCurrentUserInfoApiV1UsersMeGet'],
      queryFn: vi.fn(),
    } as any);

    const { result } = renderHook(() => useFetchCurrentUser(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should fetch current user successfully', async () => {
    const queryFn = vi.fn().mockResolvedValue(mockUser);

    vi.mocked(currentUserQuery.getCurrentUserInfoApiV1UsersMeGetOptions).mockReturnValue({
      queryKey: ['getCurrentUserInfoApiV1UsersMeGet'],
      queryFn,
    } as any);

    const { result } = renderHook(() => useFetchCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUser);
    expect(queryFn).toHaveBeenCalled();
  });

  it('should set isLoading while fetching', async () => {
    const queryFn = vi.fn(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockUser), 100);
        })
    );

    vi.mocked(currentUserQuery.getCurrentUserInfoApiV1UsersMeGetOptions).mockReturnValue({
      queryKey: ['getCurrentUserInfoApiV1UsersMeGet'],
      queryFn,
    } as any);

    const { result } = renderHook(() => useFetchCurrentUser(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSuccess).toBe(true);
  });

  it('should handle fetch error', async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error('Unauthorized'));

    vi.mocked(currentUserQuery.getCurrentUserInfoApiV1UsersMeGetOptions).mockReturnValue({
      queryKey: ['getCurrentUserInfoApiV1UsersMeGet'],
      queryFn,
    } as any);

    const { result } = renderHook(() => useFetchCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });

  it('should use correct query key', () => {
    const queryFn = vi.fn().mockResolvedValue(mockUser);

    vi.mocked(currentUserQuery.getCurrentUserInfoApiV1UsersMeGetOptions).mockReturnValue({
      queryKey: ['getCurrentUserInfoApiV1UsersMeGet'],
      queryFn,
    } as any);

    renderHook(() => useFetchCurrentUser(), {
      wrapper: createWrapper(),
    });

    const queryState = queryClient.getQueryState(['getCurrentUserInfoApiV1UsersMeGet']);
    expect(queryState).toBeDefined();
  });

  it('should not retry on error', async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error('Unauthorized'));

    vi.mocked(currentUserQuery.getCurrentUserInfoApiV1UsersMeGetOptions).mockReturnValue({
      queryKey: ['getCurrentUserInfoApiV1UsersMeGet'],
      queryFn,
      retry: false,
    } as any);

    const { result } = renderHook(() => useFetchCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Should only call once if retry is disabled
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('should cache user data with stale time', async () => {
    const queryFn = vi.fn().mockResolvedValue(mockUser);

    vi.mocked(currentUserQuery.getCurrentUserInfoApiV1UsersMeGetOptions).mockReturnValue({
      queryKey: ['getCurrentUserInfoApiV1UsersMeGet'],
      queryFn,
      staleTime: 5 * 60 * 1000, // 5 minutes
    } as any);

    // Use the same wrapper/queryClient for both hooks to test caching
    const wrapper = createWrapper();

    const { result: result1 } = renderHook(() => useFetchCurrentUser(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
    });

    // Second hook should use cached data from same queryClient
    const { result: result2 } = renderHook(() => useFetchCurrentUser(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result2.current.isSuccess).toBe(true);
    });

    // Should be called only once due to caching within stale time
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('should return user data with all fields', async () => {
    const queryFn = vi.fn().mockResolvedValue(mockUser);

    vi.mocked(currentUserQuery.getCurrentUserInfoApiV1UsersMeGetOptions).mockReturnValue({
      queryKey: ['getCurrentUserInfoApiV1UsersMeGet'],
      queryFn,
    } as any);

    const { result } = renderHook(() => useFetchCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUser);
    expect(result.current.data?.id).toBeDefined();
    expect(result.current.data?.email).toBeDefined();
    expect(result.current.data?.first_name).toBeDefined();
    expect(result.current.data?.last_name).toBeDefined();
  });

  it('should allow refetching user data', async () => {
    const queryFn = vi.fn().mockResolvedValue(mockUser);

    vi.mocked(currentUserQuery.getCurrentUserInfoApiV1UsersMeGetOptions).mockReturnValue({
      queryKey: ['getCurrentUserInfoApiV1UsersMeGet'],
      queryFn,
    } as any);

    const { result } = renderHook(() => useFetchCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Reset mock to track subsequent calls
    vi.clearAllMocks();
    queryFn.mockResolvedValue(mockUser);

    // Refetch
    result.current.refetch?.();

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalled();
    });
  });

  it('should handle null user data when not authenticated', async () => {
    const queryFn = vi.fn().mockResolvedValue(null);

    vi.mocked(currentUserQuery.getCurrentUserInfoApiV1UsersMeGetOptions).mockReturnValue({
      queryKey: ['getCurrentUserInfoApiV1UsersMeGet'],
      queryFn,
    } as any);

    const { result } = renderHook(() => useFetchCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });
});
