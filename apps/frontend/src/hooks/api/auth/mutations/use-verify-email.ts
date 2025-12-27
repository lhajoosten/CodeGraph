/**
 * Verify email address with a verification token.
 *
 * Confirms email ownership using a token received via email.
 * Shows a toast notification on success or error.
 *
 * @returns Mutation hook for email verification
 *
 * @example
 * const verifyEmailMutation = useVerifyEmail();
 * verifyEmailMutation.mutate(
 *   { body: { token: 'verification-token' } },
 *   {
 *     onSuccess: () => {
 *       navigate('/login');
 *     }
 *   }
 * );
 */

import { useMutation } from '@tanstack/react-query';
import { verifyEmailApiV1AuthVerifyEmailPostMutation } from '@/openapi/@tanstack/react-query.gen';
import { useAuthStore } from '@/stores/auth-store';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';
import type { InferHeyApiMutationOptions } from '@/lib/types';

export const useVerifyEmail = () => {
  const { setEmailVerified } = useAuthStore();

  return useMutation({
    ...verifyEmailApiV1AuthVerifyEmailPostMutation(),
    onSuccess: () => {
      setEmailVerified(true);

      addToast({
        title: 'Email Verified',
        description: 'Your email has been successfully verified.',
        color: 'success',
      });
    },
    onError: (error) => {
      addToast({
        title: 'Email Verification Failed',
        description: getErrorMessage(error),
        color: 'danger',
      });
    },
  });
};

export type UseVerifyEmailOptions = InferHeyApiMutationOptions<
  typeof verifyEmailApiV1AuthVerifyEmailPostMutation
>;
