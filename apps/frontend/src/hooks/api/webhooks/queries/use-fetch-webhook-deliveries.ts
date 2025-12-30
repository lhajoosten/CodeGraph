/**
 * Fetch webhook delivery history with optional pagination.
 *
 * @param webhookId - Webhook ID
 * @param options - Query parameters (page, pageSize)
 * @returns Query hook with paginated delivery list response
 *
 * @example
 * const { data: response, isLoading } = useFetchWebhookDeliveries(123, { page: 1, pageSize: 20 });
 * const deliveries = response?.items || [];
 */

import { useQuery } from '@tanstack/react-query';
import { listWebhookDeliveriesApiV1WebhooksWebhookIdDeliveriesGetOptions } from '@/openapi/@tanstack/react-query.gen';

export interface UseFetchWebhookDeliveriesOptions {
  page?: number;
  pageSize?: number;
}

export const useFetchWebhookDeliveries = (
  webhookId: number,
  options?: UseFetchWebhookDeliveriesOptions
) => {
  return useQuery({
    ...listWebhookDeliveriesApiV1WebhooksWebhookIdDeliveriesGetOptions({
      path: {
        webhook_id: webhookId,
      },
      query: {
        page: options?.page,
        page_size: options?.pageSize,
      },
    }),
    staleTime: 30 * 1000, // 30 seconds (more frequent updates for delivery status)
  });
};
