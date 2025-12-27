/**
 * Fetch a single task by ID.
 *
 * @param taskId - The task ID to fetch
 * @returns Query hook with task details
 *
 * @example
 * const { data: task, isLoading } = useFetchTask(123);
 */

import { useQuery } from '@tanstack/react-query';
import { getTaskApiV1TasksTaskIdGetOptions } from '@/openapi/@tanstack/react-query.gen';

export const useFetchTask = (taskId: number) => {
  return useQuery({
    ...getTaskApiV1TasksTaskIdGetOptions({ path: { task_id: taskId } }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
