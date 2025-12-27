/**
 * Disable two-factor authentication mutation hook.
 *
 * Disables 2FA for the current user after password verification.
 * Automatically invalidates the 2FA status query on success.
 *
 * @returns Mutation hook for disabling 2FA
 *
 * @example
 * const disableMutation = useDisableTwoFactor();
 * disableMutation.mutate({ body: { password: 'user-password' } });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  disableTwoFactorApiV1TwoFactorDisablePostMutation,
  getTwoFactorStatusApiV1TwoFactorStatusGetQueryKey,
} from '@/openapi/@tanstack/react-query.gen';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';

export const useDisableTwoFactor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...disableTwoFactorApiV1TwoFactorDisablePostMutation(),
    onSuccess: () => {
      // Invalidate 2FA status query to refresh the UI
      queryClient.invalidateQueries({
        queryKey: getTwoFactorStatusApiV1TwoFactorStatusGetQueryKey(),
      });

      addToast({
        title: '2FA Disabled',
        description: 'Two-factor authentication has been disabled.',
        color: 'success',
      });
    },
    onError: (error) => {
      const message = getErrorMessage(error) || 'Failed to disable 2FA. Check your password.';
      addToast({
        title: 'Error',
        description: message,
        color: 'danger',
      });
    },
  });
};
