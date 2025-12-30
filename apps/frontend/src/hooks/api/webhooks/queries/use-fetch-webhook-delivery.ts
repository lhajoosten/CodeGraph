/**
 * Fetch a single webhook delivery by ID.
 *
 * @param webhookId - Webhook ID
 * @param deliveryId - Delivery ID
 * @returns Query hook with delivery details
 *
 * @example
 * const { data: delivery, isLoading } = useFetchWebhookDelivery(123, 456);
 */

import { useQuery } from '@tanstack/react-query';
import { getWebhookDeliveryApiV1WebhooksWebhookIdDeliveriesDeliveryIdGetOptions } from '@/openapi/@tanstack/react-query.gen';

export const useFetchWebhookDelivery = (webhookId: number, deliveryId: number) => {
  return useQuery({
    ...getWebhookDeliveryApiV1WebhooksWebhookIdDeliveriesDeliveryIdGetOptions({
      path: {
        webhook_id: webhookId,
        delivery_id: deliveryId,
      },
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes (delivery details don't change)
  });
};
