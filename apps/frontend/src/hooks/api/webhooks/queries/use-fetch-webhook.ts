/**
 * Fetch a single webhook by ID.
 *
 * @param webhookId - Webhook ID
 * @returns Query hook with webhook details
 *
 * @example
 * const { data: webhook, isLoading } = useFetchWebhook(123);
 */

import { useQuery } from '@tanstack/react-query';
import { getWebhookApiV1WebhooksWebhookIdGetOptions } from '@/openapi/@tanstack/react-query.gen';

export const useFetchWebhook = (webhookId: number) => {
  return useQuery({
    ...getWebhookApiV1WebhooksWebhookIdGetOptions({
      path: {
        webhook_id: webhookId,
      },
    }),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};
