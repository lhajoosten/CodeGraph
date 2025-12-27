/**
 * Change password mutation hook.
 *
 * Updates the user's password after validating the current password.
 * Provides automatic toast notifications for success/error feedback.
 *
 * @param options - Optional callbacks for success/error handling
 * @returns Mutation hook for changing password
 *
 * @example
 * const changePassword = useChangePassword({
 *   onSuccess: () => console.log('Password changed'),
 * });
 * changePassword.mutate({
 *   body: {
 *     current_password: 'old-password',
 *     new_password: 'new-secure-password'
 *   }
 * });
 */

import { useMutation } from '@tanstack/react-query';
import { changePasswordApiV1AuthChangePasswordPostMutation } from '@/openapi/@tanstack/react-query.gen';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';
import type { InferHeyApiMutationOptions } from '@/lib/types';

export interface UseChangePasswordCallbackOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useChangePassword = (options: UseChangePasswordCallbackOptions = {}) => {
  return useMutation({
    ...changePasswordApiV1AuthChangePasswordPostMutation(),
    onSuccess: () => {
      addToast({
        title: 'Password Changed',
        description: 'Your password has been successfully updated.',
        color: 'success',
      });

      options.onSuccess?.();
    },
    onError: (error) => {
      const message = getErrorMessage(error) || 'Failed to change password';
      addToast({
        title: 'Error',
        description: message,
        color: 'danger',
      });

      options.onError?.(error);
    },
  });
};

export type UseChangePasswordOptions = InferHeyApiMutationOptions<
  typeof changePasswordApiV1AuthChangePasswordPostMutation
>;
