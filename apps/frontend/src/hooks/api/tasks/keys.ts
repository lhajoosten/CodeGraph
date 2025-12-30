/**
 * Task query key factory for TanStack Query cache management.
 * Provides structured query keys for consistent cache invalidation.
 */

import type { UseFetchTasksOptions } from './queries/use-fetch-tasks';

export const taskQueryKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskQueryKeys.all, 'list'] as const,
  list: (filters?: UseFetchTasksOptions) => [...taskQueryKeys.lists(), { filters }] as const,
  details: () => [...taskQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...taskQueryKeys.details(), id] as const,
  execution: (id: number) => [...taskQueryKeys.detail(id), 'execution'] as const,
  executionStatus: (id: number) => [...taskQueryKeys.execution(id), 'status'] as const,
  executionResult: (id: number) => [...taskQueryKeys.execution(id), 'result'] as const,
  executionHistory: (id: number) => [...taskQueryKeys.execution(id), 'history'] as const,
  executionTimeline: (id: number) => [...taskQueryKeys.execution(id), 'timeline'] as const,
};
