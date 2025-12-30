/**
 * Update an existing webhook.
 *
 * Automatically invalidates the webhook detail and list after update.
 *
 * @returns Mutation hook for updating a webhook
 *
 * @example
 * const updateMutation = useUpdateWebhook();
 * updateMutation.mutate({
 *   path: { webhook_id: 123 },
 *   body: { name: 'Updated Name', status: 'paused' }
 * });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateWebhookApiV1WebhooksWebhookIdPatchMutation } from '@/openapi/@tanstack/react-query.gen';
import { webhookQueryKeys } from '../keys';
import type { InferHeyApiMutationOptions } from '@/lib/types';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';

export const useUpdateWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...updateWebhookApiV1WebhooksWebhookIdPatchMutation(),
    onSuccess: (data) => {
      addToast({
        title: 'Webhook Updated',
        description: 'Webhook updated successfully.',
        color: 'success',
      });
      // Invalidate specific webhook and list
      queryClient.invalidateQueries({ queryKey: webhookQueryKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: webhookQueryKeys.lists() });
    },
    onError: (error) => {
      addToast({
        title: 'Failed to Update Webhook',
        description: getErrorMessage(error),
        color: 'danger',
      });
    },
  });
};

export type UseUpdateWebhookOptions = InferHeyApiMutationOptions<
  typeof updateWebhookApiV1WebhooksWebhookIdPatchMutation
>;
