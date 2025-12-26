/**
 * Verify two-factor authentication code during login.
 *
 * Verifies the OTP/backup code provided by the user during login.
 * Shows a toast notification on success or error.
 *
 * @returns Mutation hook for 2FA code verification
 *
 * @example
 * const verify2FAMutation = useVerify2FA();
 * verify2FAMutation.mutate(
 *   { body: { code: '123456' } },
 *   {
 *     onSuccess: () => {
 *       navigate('/');
 *     }
 *   }
 * );
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { verifyTwoFactorLoginApiV1AuthVerify2FaPostMutation } from '@/openapi/@tanstack/react-query.gen';
import { useAuthStore } from '@/stores/auth-store';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';
import type { InferHeyApiMutationOptions } from '@/lib/types';

export const useVerify2FA = () => {
  const queryClient = useQueryClient();
  const { setTwoFactorStatus } = useAuthStore();

  return useMutation({
    ...verifyTwoFactorLoginApiV1AuthVerify2FaPostMutation(),
    onSuccess: () => {
      setTwoFactorStatus(false, true, false);

      addToast({
        title: 'Authentication Successful',
        description: 'You have successfully verified your identity.',
        color: 'success',
      });

      // Invalidate current user query to fetch fresh data
      queryClient.invalidateQueries({
        queryKey: ['getCurrentUserInfoApiV1UsersMeGet'],
      });
    },
    onError: (error) => {
      addToast({
        title: '2FA Verification Failed',
        description: getErrorMessage(error),
        color: 'danger',
      });
    },
  });
};

export type UseVerify2FAOptions = InferHeyApiMutationOptions<
  typeof verifyTwoFactorLoginApiV1AuthVerify2FaPostMutation
>;
