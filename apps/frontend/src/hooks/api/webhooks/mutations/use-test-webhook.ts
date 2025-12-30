/**
 * Test a webhook by sending a test event.
 *
 * Does not invalidate cache as it's a read-only test operation.
 *
 * @returns Mutation hook for testing a webhook
 *
 * @example
 * const testMutation = useTestWebhook();
 * testMutation.mutate({
 *   path: { webhook_id: 123 },
 *   body: { event_type: 'task.created' }
 * });
 */

import { useMutation } from '@tanstack/react-query';
import { testWebhookApiV1WebhooksWebhookIdTestPostMutation } from '@/openapi/@tanstack/react-query.gen';
import type { InferHeyApiMutationOptions } from '@/lib/types';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';

export const useTestWebhook = () => {
  return useMutation({
    ...testWebhookApiV1WebhooksWebhookIdTestPostMutation(),
    onSuccess: (data) => {
      if (data.success) {
        addToast({
          title: 'Webhook Test Successful',
          description: `Response: ${data.status_code || 'N/A'} (${data.duration_ms}ms)`,
          color: 'success',
        });
      } else {
        addToast({
          title: 'Webhook Test Failed',
          description: data.error_message || 'Unknown error occurred',
          color: 'danger',
        });
      }
    },
    onError: (error) => {
      addToast({
        title: 'Failed to Test Webhook',
        description: getErrorMessage(error),
        color: 'danger',
      });
    },
  });
};

export type UseTestWebhookOptions = InferHeyApiMutationOptions<
  typeof testWebhookApiV1WebhooksWebhookIdTestPostMutation
>;
