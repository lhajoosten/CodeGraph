/**
 * Disable two-factor authentication mutation hook.
 *
 * Disables 2FA for the current user after password verification.
 * Automatically invalidates the 2FA status query on success.
 *
 * @param options - Optional callbacks for success/error handling
 * @returns Mutation hook for disabling 2FA
 *
 * @example
 * const disableMutation = useDisableTwoFactor({
 *   onSuccess: () => console.log('2FA disabled'),
 * });
 * disableMutation.mutate({ body: { password: 'user-password' } });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  disableTwoFactorApiV1TwoFactorDisablePostMutation,
  getTwoFactorStatusApiV1TwoFactorStatusGetQueryKey,
} from '@/openapi/@tanstack/react-query.gen';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';
import type { InferHeyApiMutationOptions } from '@/lib/types';

export interface UseDisableTwoFactorOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useDisableTwoFactor = (options: UseDisableTwoFactorOptions = {}) => {
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

      options.onSuccess?.();
    },
    onError: (error) => {
      const message = getErrorMessage(error) || 'Failed to disable 2FA. Check your password.';
      addToast({
        title: 'Error',
        description: message,
        color: 'danger',
      });

      options.onError?.(error);
    },
  });
};

export type UseDisableTwoFactorMutationOptions = InferHeyApiMutationOptions<
  typeof disableTwoFactorApiV1TwoFactorDisablePostMutation
>;
