/**
 * Resend email verification link.
 *
 * Sends a new verification email to the user's email address.
 * Shows a toast notification on success or error.
 *
 * @returns Mutation hook for resending verification email
 *
 * @example
 * const resendMutation = useResendVerification();
 * resendMutation.mutate(
 *   { body: { email: 'user@example.com' } },
 *   {
 *     onSuccess: () => {
 *       console.log('Verification email sent!');
 *     }
 *   }
 * );
 */

import { useMutation } from '@tanstack/react-query';
import { resendVerificationApiV1AuthResendVerificationPostMutation } from '@/openapi/@tanstack/react-query.gen';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';
import type { InferHeyApiMutationOptions } from '@/lib/types';

export const useResendVerification = () => {
  return useMutation({
    ...resendVerificationApiV1AuthResendVerificationPostMutation(),
    onSuccess: () => {
      addToast({
        title: 'Email Sent',
        description: 'Verification email sent! Please check your inbox.',
        color: 'success',
      });
    },
    onError: (error) => {
      addToast({
        title: 'Failed to Send Email',
        description: getErrorMessage(error),
        color: 'danger',
      });
    },
  });
};

export type UseResendVerificationOptions = InferHeyApiMutationOptions<
  typeof resendVerificationApiV1AuthResendVerificationPostMutation
>;
