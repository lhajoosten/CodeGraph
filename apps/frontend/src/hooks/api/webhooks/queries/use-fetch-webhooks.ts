/**
 * Fetch all webhooks with optional pagination.
 *
 * @param options - Query parameters (page, pageSize)
 * @returns Query hook with paginated webhook list response
 *
 * @example
 * const { data: response, isLoading } = useFetchWebhooks({ page: 1, pageSize: 20 });
 * const webhooks = response?.items || [];
 */

import { useQuery } from '@tanstack/react-query';
import { listWebhooksApiV1WebhooksGetOptions } from '@/openapi/@tanstack/react-query.gen';

export interface UseFetchWebhooksOptions {
  page?: number;
  pageSize?: number;
}

export const useFetchWebhooks = (options?: UseFetchWebhooksOptions) => {
  return useQuery({
    ...listWebhooksApiV1WebhooksGetOptions({
      query: {
        page: options?.page,
        page_size: options?.pageSize,
      },
    }),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};
