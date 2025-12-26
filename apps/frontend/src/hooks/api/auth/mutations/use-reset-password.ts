/**
 * Reset password with a valid reset token.
 *
 * Confirms a new password using a reset token received via email.
 * Shows a toast notification on success or error.
 *
 * @returns Mutation hook for password reset confirmation
 *
 * @example
 * const resetPasswordMutation = useResetPassword();
 * resetPasswordMutation.mutate(
 *   { body: { token: 'reset-token', newPassword: 'newPassword123' } },
 *   {
 *     onSuccess: () => {
 *       navigate('/login');
 *     }
 *   }
 * );
 */

import { useMutation } from '@tanstack/react-query';
import { resetPasswordApiV1AuthResetPasswordPostMutation } from '@/openapi/@tanstack/react-query.gen';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';
import type { InferHeyApiMutationOptions } from '@/lib/types';

export const useResetPassword = () => {
  return useMutation({
    ...resetPasswordApiV1AuthResetPasswordPostMutation(),
    onSuccess: () => {
      addToast({
        title: 'Password Reset Successful',
        description: 'Your password has been reset. You can now sign in with your new password.',
        color: 'success',
      });
    },
    onError: (error) => {
      addToast({
        title: 'Password Reset Failed',
        description: getErrorMessage(error),
        color: 'danger',
      });
    },
  });
};

export type UseResetPasswordOptions = InferHeyApiMutationOptions<
  typeof resetPasswordApiV1AuthResetPasswordPostMutation
>;
