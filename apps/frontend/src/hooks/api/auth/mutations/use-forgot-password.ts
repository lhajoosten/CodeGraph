/**
 * Request a password reset by email.
 *
 * Sends a password reset link to the provided email address.
 * Shows a toast notification on success or error.
 *
 * @returns Mutation hook for forgot password request
 *
 * @example
 * const forgotPasswordMutation = useForgotPassword();
 * forgotPasswordMutation.mutate(
 *   { body: { email: 'user@example.com' } },
 *   {
 *     onSuccess: () => {
 *       // Handle success (e.g., navigate, show message)
 *     }
 *   }
 * );
 */

import { useMutation } from '@tanstack/react-query';
import { forgotPasswordApiV1AuthForgotPasswordPostMutation } from '@/openapi/@tanstack/react-query.gen';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';
import type { InferHeyApiMutationOptions } from '@/lib/types';

export const useForgotPassword = () => {
  return useMutation({
    ...forgotPasswordApiV1AuthForgotPasswordPostMutation(),
    onSuccess: () => {
      addToast({
        title: 'Check Your Email',
        description: 'Password reset link has been sent to your email address.',
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

export type UseForgotPasswordOptions = InferHeyApiMutationOptions<
  typeof forgotPasswordApiV1AuthForgotPasswordPostMutation
>;
