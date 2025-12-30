/**
 * Create a new webhook.
 *
 * Automatically invalidates the webhook list after creation.
 *
 * @returns Mutation hook for creating a webhook
 *
 * @example
 * const createMutation = useCreateWebhook();
 * createMutation.mutate(
 *   { body: { name: 'My Webhook', url: 'https://...', events: ['*'] } },
 *   { onSuccess: (data) => console.log('Secret:', data.secret) }
 * );
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createWebhookApiV1WebhooksPostMutation } from '@/openapi/@tanstack/react-query.gen';
import { webhookQueryKeys } from '../keys';
import type { InferHeyApiMutationOptions } from '@/lib/types';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';

export const useCreateWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...createWebhookApiV1WebhooksPostMutation(),
    onSuccess: () => {
      addToast({
        title: 'Webhook Created',
        description: 'Webhook created successfully. Save the secret - it will only be shown once!',
        color: 'success',
      });
      // Invalidate webhook list to refetch
      queryClient.invalidateQueries({ queryKey: webhookQueryKeys.lists() });
    },
    onError: (error) => {
      addToast({
        title: 'Failed to Create Webhook',
        description: getErrorMessage(error),
        color: 'danger',
      });
    },
  });
};

export type UseCreateWebhookOptions = InferHeyApiMutationOptions<
  typeof createWebhookApiV1WebhooksPostMutation
>;
