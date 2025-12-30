/**
 * Get detailed execution timeline for visualization.
 *
 * Returns a structured timeline of execution events with timestamps,
 * suitable for timeline visualization in the frontend.
 *
 * @param taskId - ID of the task
 * @param options - Query options
 * @returns Query hook with execution timeline events
 *
 * @example
 * const { data: timeline } = useFetchTaskTimeline(123);
 */

import { useQuery } from '@tanstack/react-query';
import { getExecutionTimelineApiV1TasksTaskIdTimelineGetOptions } from '@/openapi/@tanstack/react-query.gen';

export interface UseFetchTaskTimelineOptions {
  enabled?: boolean;
}

export const useFetchTaskTimeline = (taskId: number, options?: UseFetchTaskTimelineOptions) => {
  const queryOptions = getExecutionTimelineApiV1TasksTaskIdTimelineGetOptions({
    path: { task_id: taskId },
  });

  return useQuery({
    ...queryOptions,
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
