/**
 * Regenerate webhook secret.
 *
 * Automatically invalidates the webhook detail after regeneration.
 *
 * @returns Mutation hook for regenerating webhook secret
 *
 * @example
 * const regenerateMutation = useRegenerateWebhookSecret();
 * regenerateMutation.mutate(
 *   { path: { webhook_id: 123 } },
 *   { onSuccess: (data) => console.log('New secret:', data.secret) }
 * );
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { regenerateWebhookSecretApiV1WebhooksWebhookIdRegenerateSecretPostMutation } from '@/openapi/@tanstack/react-query.gen';
import { webhookQueryKeys } from '../keys';
import type { InferHeyApiMutationOptions } from '@/lib/types';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';

export const useRegenerateWebhookSecret = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...regenerateWebhookSecretApiV1WebhooksWebhookIdRegenerateSecretPostMutation(),
    onSuccess: (data) => {
      addToast({
        title: 'Secret Regenerated',
        description:
          'Webhook secret regenerated successfully. Save it - it will only be shown once!',
        color: 'success',
      });
      // Invalidate webhook detail
      queryClient.invalidateQueries({ queryKey: webhookQueryKeys.detail(data.id) });
    },
    onError: (error) => {
      addToast({
        title: 'Failed to Regenerate Secret',
        description: getErrorMessage(error),
        color: 'danger',
      });
    },
  });
};

export type UseRegenerateWebhookSecretOptions = InferHeyApiMutationOptions<
  typeof regenerateWebhookSecretApiV1WebhooksWebhookIdRegenerateSecretPostMutation
>;
