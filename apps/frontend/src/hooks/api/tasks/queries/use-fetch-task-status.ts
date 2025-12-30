/**
 * Get current status of a task execution.
 *
 * Polls the task execution status at regular intervals when enabled.
 * Useful for monitoring execution progress without SSE.
 *
 * @param taskId - ID of the task
 * @param options - Query options including polling configuration
 * @returns Query hook with current task execution status
 *
 * @example
 * const { data: status } = useFetchTaskStatus(123, { enabled: isExecuting });
 */

import { useQuery } from '@tanstack/react-query';
import { getTaskStatusApiV1TasksTaskIdStatusGetOptions } from '@/openapi/@tanstack/react-query.gen';

export interface UseFetchTaskStatusOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export const useFetchTaskStatus = (taskId: number, options?: UseFetchTaskStatusOptions) => {
  const queryOptions = getTaskStatusApiV1TasksTaskIdStatusGetOptions({
    path: { task_id: taskId },
  });

  return useQuery({
    ...queryOptions,
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? false,
    staleTime: 5 * 1000, // 5 seconds
  });
};
