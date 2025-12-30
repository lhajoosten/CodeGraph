/**
 * Delete a webhook.
 *
 * Automatically invalidates the webhook list after deletion.
 *
 * @returns Mutation hook for deleting a webhook
 *
 * @example
 * const deleteMutation = useDeleteWebhook();
 * deleteMutation.mutate({ path: { webhook_id: 123 } });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteWebhookApiV1WebhooksWebhookIdDeleteMutation } from '@/openapi/@tanstack/react-query.gen';
import { webhookQueryKeys } from '../keys';
import type { InferHeyApiMutationOptions } from '@/lib/types';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';

export const useDeleteWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...deleteWebhookApiV1WebhooksWebhookIdDeleteMutation(),
    onSuccess: () => {
      addToast({
        title: 'Webhook Deleted',
        description: 'Webhook deleted successfully.',
        color: 'success',
      });
      // Invalidate webhook list to refetch
      queryClient.invalidateQueries({ queryKey: webhookQueryKeys.lists() });
    },
    onError: (error) => {
      addToast({
        title: 'Failed to Delete Webhook',
        description: getErrorMessage(error),
        color: 'danger',
      });
    },
  });
};

export type UseDeleteWebhookOptions = InferHeyApiMutationOptions<
  typeof deleteWebhookApiV1WebhooksWebhookIdDeleteMutation
>;
