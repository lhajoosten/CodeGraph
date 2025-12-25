/**
 * Fetch all tasks with optional pagination.
 *
 * Note: Filtering by status/priority/search requires client-side filtering
 * as the backend API currently only supports pagination.
 *
 * @param options - Query parameters (page, pageSize)
 * @returns Query hook with paginated task list response
 *
 * @example
 * const { data: response, isLoading } = useFetchTasks({ page: 1, pageSize: 20 });
 * const tasks = response?.items || [];
 */

import { useQuery } from '@tanstack/react-query';
import { listTasksApiV1TasksGetOptions } from '@/openapi/@tanstack/react-query.gen';

export interface UseFetchTasksOptions {
  page?: number;
  pageSize?: number;
}

export const useFetchTasks = (options?: UseFetchTasksOptions) => {
  return useQuery({
    ...listTasksApiV1TasksGetOptions({
      query: {
        page: options?.page,
        page_size: options?.pageSize,
      },
    }),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};
