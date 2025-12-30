/**
 * Get complete execution history for a task.
 *
 * Returns all agent runs, metrics (tokens, latency, costs), and optionally
 * council review data for the task.
 *
 * @param taskId - ID of the task
 * @param options - Query options including whether to include council reviews
 * @returns Query hook with complete task execution history
 *
 * @example
 * const { data: history } = useFetchTaskHistory(123, { includeCouncil: true });
 */

import { useQuery } from '@tanstack/react-query';
import { getTaskHistoryApiV1TasksTaskIdHistoryGetOptions } from '@/openapi/@tanstack/react-query.gen';

export interface UseFetchTaskHistoryOptions {
  includeCouncil?: boolean;
  enabled?: boolean;
}

export const useFetchTaskHistory = (
  taskId: number,
  options?: UseFetchTaskHistoryOptions
) => {
  const queryOptions = getTaskHistoryApiV1TasksTaskIdHistoryGetOptions({
    path: { task_id: taskId },
    query: {
      include_council: options?.includeCouncil ?? true,
    },
  });

  return useQuery({
    ...queryOptions,
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
