/**
 * Unlink an OAuth account from the current user.
 *
 * Disconnects the specified OAuth provider from the user's account.
 * Automatically invalidates the OAuth accounts query on success.
 *
 * @returns Mutation hook for unlinking an OAuth account
 *
 * @example
 * const unlinkMutation = useUnlinkOAuthAccount();
 * unlinkMutation.mutate({ path: { provider: 'github' } });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  unlinkOauthAccountOauthProviderUnlinkDeleteMutation,
  getConnectedAccountsOauthAccountsGetQueryKey,
} from '@/openapi/@tanstack/react-query.gen';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';
import type { InferHeyApiMutationOptions } from '@/lib/types';

export const useUnlinkOAuthAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...unlinkOauthAccountOauthProviderUnlinkDeleteMutation(),
    onSuccess: () => {
      // Invalidate OAuth accounts query to refresh the list
      queryClient.invalidateQueries({
        queryKey: getConnectedAccountsOauthAccountsGetQueryKey(),
      });

      addToast({
        title: 'Account Disconnected',
        description: 'The OAuth account has been successfully unlinked.',
        color: 'success',
      });
    },
    onError: (error) => {
      const message = getErrorMessage(error) || 'Failed to unlink OAuth account';
      addToast({
        title: 'Error',
        description: message,
        color: 'danger',
      });
    },
  });
};

export type UseUnlinkOAuthAccountOptions = InferHeyApiMutationOptions<
  typeof unlinkOauthAccountOauthProviderUnlinkDeleteMutation
>;

