/**
 * Shared test utilities for CodeGraph frontend tests.
 *
 * This file provides custom render functions and utilities for testing
 * React components with TanStack Query and Router providers.
 */

import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import type { RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';

/**
 * Creates a new QueryClient for testing with optimized defaults.
 *
 * - Disables retries (tests should be deterministic)
 * - Disables caching (tests should be isolated)
 * - Disables background refetching
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Sets up mocks for TanStack Router hooks.
 * Call this in beforeEach() in tests that use router hooks.
 *
 * @example
 * beforeEach(() => {
 *   const { mockNavigate, mockUseSearch } = setupRouterMocks();
 * });
 */
export function setupRouterMocks() {
  const mockNavigate = vi.fn();
  const mockUseSearch = vi.fn(() => ({}));

  // Dynamically set up the mocks with proper return values
  return {
    mockNavigate,
    mockUseSearch,
    setupMocks: () => {
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);
      vi.mocked(useSearch).mockReturnValue({});
    },
  };
}

/**
 * Custom render function that wraps component with QueryClientProvider.
 *
 * Use this for components that use TanStack Query hooks.
 *
 * @example
 * renderWithQueryClient(<LoginForm />);
 */
export function renderWithQueryClient(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  };
}

/**
 * Re-export everything from React Testing Library for convenience.
 */
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
