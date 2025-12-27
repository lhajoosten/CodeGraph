/**
 * Regenerate backup codes mutation hook.
 *
 * Regenerates new backup codes for 2FA recovery.
 * Requires password verification for security.
 *
 * @param options - Optional callbacks for success/error handling
 * @returns Mutation hook for regenerating backup codes
 *
 * @example
 * const regenerateMutation = useRegenerateBackupCodes({
 *   onSuccess: () => console.log('Codes regenerated'),
 * });
 * regenerateMutation.mutate({ body: { password: 'user-password' } });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  regenerateBackupCodesApiV1TwoFactorRegenerateBackupCodesPostMutation,
  getTwoFactorStatusApiV1TwoFactorStatusGetQueryKey,
} from '@/openapi/@tanstack/react-query.gen';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';
import type { InferHeyApiMutationOptions } from '@/lib/types';

export interface UseRegenerateBackupCodesOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useRegenerateBackupCodes = (options: UseRegenerateBackupCodesOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...regenerateBackupCodesApiV1TwoFactorRegenerateBackupCodesPostMutation(),
    onSuccess: () => {
      // Invalidate 2FA status query to update backup codes count
      queryClient.invalidateQueries({
        queryKey: getTwoFactorStatusApiV1TwoFactorStatusGetQueryKey(),
      });

      addToast({
        title: 'Backup Codes Regenerated',
        description: 'New backup codes have been generated. Please save them securely.',
        color: 'success',
      });

      options.onSuccess?.();
    },
    onError: (error) => {
      const message = getErrorMessage(error) || 'Failed to regenerate backup codes';
      addToast({
        title: 'Error',
        description: message,
        color: 'danger',
      });

      options.onError?.(error);
    },
  });
};

export type UseRegenerateBackupCodesMutationOptions = InferHeyApiMutationOptions<
  typeof regenerateBackupCodesApiV1TwoFactorRegenerateBackupCodesPostMutation
>;
