/**
 * Change email mutation hook.
 *
 * Initiates email change process. After calling, the user will receive
 * a verification email at the new address to confirm the change.
 *
 * @param options - Optional callbacks for success/error handling
 * @returns Mutation hook for changing email
 *
 * @example
 * const changeEmail = useChangeEmail({
 *   onSuccess: () => console.log('Email change initiated'),
 * });
 * changeEmail.mutate({
 *   body: { new_email: 'newemail@example.com', password: 'current-password' }
 * });
 */

import { useMutation } from '@tanstack/react-query';
import { changeEmailApiV1AuthChangeEmailPostMutation } from '@/openapi/@tanstack/react-query.gen';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';
import type { InferHeyApiMutationOptions } from '@/lib/types';

export interface UseChangeEmailCallbackOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useChangeEmail = (options: UseChangeEmailCallbackOptions = {}) => {
  return useMutation({
    ...changeEmailApiV1AuthChangeEmailPostMutation(),
    onSuccess: () => {
      addToast({
        title: 'Verification Email Sent',
        description: 'Please check your new email address to confirm the change.',
        color: 'success',
      });

      options.onSuccess?.();
    },
    onError: (error) => {
      const message = getErrorMessage(error) || 'Failed to change email';
      addToast({
        title: 'Error',
        description: message,
        color: 'danger',
      });

      options.onError?.(error);
    },
  });
};

export type UseChangeEmailOptions = InferHeyApiMutationOptions<
  typeof changeEmailApiV1AuthChangeEmailPostMutation
>;
