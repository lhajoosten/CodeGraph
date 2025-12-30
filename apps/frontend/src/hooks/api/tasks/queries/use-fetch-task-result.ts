/**
 * Get final result of completed task execution.
 *
 * Returns the complete execution result including plan, generated code,
 * test results, and review feedback. Only available after task completion.
 *
 * @param taskId - ID of the task
 * @param options - Query options
 * @returns Query hook with complete task execution result
 *
 * @example
 * const { data: result } = useFetchTaskResult(123);
 */

import { useQuery } from '@tanstack/react-query';
import { getTaskResultApiV1TasksTaskIdResultGetOptions } from '@/openapi/@tanstack/react-query.gen';

export interface UseFetchTaskResultOptions {
  enabled?: boolean;
}

export const useFetchTaskResult = (taskId: number, options?: UseFetchTaskResultOptions) => {
  const queryOptions = getTaskResultApiV1TasksTaskIdResultGetOptions({
    path: { task_id: taskId },
  });

  return useQuery({
    ...queryOptions,
    enabled: options?.enabled ?? true,
    staleTime: 10 * 60 * 1000, // 10 minutes (results don't change often)
  });
};
