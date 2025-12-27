/**
 * Change password mutation hook.
 *
 * Updates the user's password after validating the current password.
 * Provides automatic toast notifications for success/error feedback.
 *
 * @returns Mutation hook for changing password
 *
 * @example
 * const changePassword = useChangePassword();
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

export const useChangePassword = () => {
  return useMutation({
    ...changePasswordApiV1AuthChangePasswordPostMutation(),
    onSuccess: () => {
      addToast({
        title: 'Password Changed',
        description: 'Your password has been successfully updated.',
        color: 'success',
      });
    },
    onError: (error) => {
      const message = getErrorMessage(error) || 'Failed to change password';
      addToast({
        title: 'Error',
        description: message,
        color: 'danger',
      });
    },
  });
};

export type UseChangePasswordOptions = InferHeyApiMutationOptions<
  typeof changePasswordApiV1AuthChangePasswordPostMutation
>;

