/**
 * Metrics query key factory for TanStack Query cache management.
 * Provides structured query keys for consistent cache invalidation.
 */

export const metricsQueryKeys = {
  all: ['metrics'] as const,
  summary: () => [...metricsQueryKeys.all, 'summary'] as const,
  history: (period?: string, interval?: string) =>
    [...metricsQueryKeys.all, 'history', { period, interval }] as const,
  agent: (agentType: string) => [...metricsQueryKeys.all, 'agent', agentType] as const,
  pricing: () => [...metricsQueryKeys.all, 'pricing'] as const,
  global: () => [...metricsQueryKeys.all, 'global'] as const,
  task: (taskId: number) => [...metricsQueryKeys.all, 'task', taskId] as const,
  council: () => [...metricsQueryKeys.all, 'council'] as const,
};
