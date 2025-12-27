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

import { useMutation } from '@tanstack/react-query';
import { verifyTwoFactorLoginApiV1AuthVerify2FaPostMutation } from '@/openapi/@tanstack/react-query.gen';
import { useAuthStore } from '@/stores/auth-store';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';
import type { InferHeyApiMutationOptions } from '@/lib/types';

export const useVerify2FA = () => {
  const { setTwoFactorStatus, login } = useAuthStore();

  return useMutation({
    ...verifyTwoFactorLoginApiV1AuthVerify2FaPostMutation(),
    onSuccess: (data) => {
      // 1. First, update 2FA status
      setTwoFactorStatus(data.two_factor_enabled ?? false, true, false);

      // 2. Then log in the user with the returned data
      // This must happen before any API calls that require full authentication
      if (data.user) {
        login(
          {
            id: data.user.id,
            email: data.user.email,
            email_verified: data.email_verified,
            first_name: data.user.first_name,
            last_name: data.user.last_name,
            display_name: data.user.display_name,
            avatar_url: data.user.avatar_url,
            profile_completed: data.user.profile_completed,
          },
          null // No OAuth provider for 2FA verification
        );
      }

      addToast({
        title: 'Authentication Successful',
        description: 'You have successfully verified your identity.',
        color: 'success',
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
