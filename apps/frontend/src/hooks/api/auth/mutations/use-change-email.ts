/**
 * Change email mutation hook.
 *
 * Initiates email change process. After calling, the user will receive
 * a verification email at the new address to confirm the change.
 *
 * @returns Mutation hook for changing email
 *
 * @example
 * const changeEmail = useChangeEmail();
 * changeEmail.mutate({
 *   new_email: 'newemail@example.com',
 *   password: 'current-password'
 * });
 */

import { useMutation } from '@tanstack/react-query';
import { changeEmailApiV1AuthChangeEmailPostMutation } from '@/openapi/@tanstack/react-query.gen';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';
import type { InferHeyApiMutationOptions } from '@/lib/types';

export const useChangeEmail = () => {
  return useMutation({
    ...changeEmailApiV1AuthChangeEmailPostMutation(),
    onSuccess: () => {
      addToast({
        title: 'Verification Email Sent',
        description: 'Please check your new email address to confirm the change.',
        color: 'success',
      });
    },
    onError: (error) => {
      const message = getErrorMessage(error) || 'Failed to change email';
      addToast({
        title: 'Error',
        description: message,
        color: 'danger',
      });
    },
  });
};

export type UseChangeEmailOptions = InferHeyApiMutationOptions<
  typeof changeEmailApiV1AuthChangeEmailPostMutation
>;

