/**
 * Webhook query key factory for TanStack Query cache management.
 * Provides structured query keys for consistent cache invalidation.
 */

import type { UseFetchWebhooksOptions } from './queries/use-fetch-webhooks';
import type { UseFetchWebhookDeliveriesOptions } from './queries/use-fetch-webhook-deliveries';

export const webhookQueryKeys = {
  all: ['webhooks'] as const,
  lists: () => [...webhookQueryKeys.all, 'list'] as const,
  list: (filters?: UseFetchWebhooksOptions) => [...webhookQueryKeys.lists(), { filters }] as const,
  details: () => [...webhookQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...webhookQueryKeys.details(), id] as const,
  deliveries: (webhookId: number) => [...webhookQueryKeys.detail(webhookId), 'deliveries'] as const,
  deliveryList: (webhookId: number, filters?: UseFetchWebhookDeliveriesOptions) =>
    [...webhookQueryKeys.deliveries(webhookId), { filters }] as const,
  delivery: (webhookId: number, deliveryId: number) =>
    [...webhookQueryKeys.deliveries(webhookId), deliveryId] as const,
};
