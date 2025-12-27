/**
 * Logout the current user.
 *
 * Clears HTTP-only cookies and auth state, and invalidates all cached queries.
 *
 * @returns Mutation hook for user logout
 *
 * @example
 * const logoutMutation = useLogout();
 * logoutMutation.mutate({}, {
 *   onSuccess: () => navigate('/login')
 * });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logoutApiV1AuthLogoutPostMutation } from '@/openapi/@tanstack/react-query.gen';
import { useAuthStore } from '@/stores/auth-store';
import type { InferHeyApiMutationOptions } from '@/lib/types';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';

export const useLogout = () => {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    ...logoutApiV1AuthLogoutPostMutation(),
    onSuccess: () => {
      addToast({
        title: 'Logged Out',
        description: 'You have been logged out successfully.',
        color: 'success',
      });

      // Clear auth state
      logout();
      // Clear all cached queries
      queryClient.clear();
    },
    onError: (error) => {
      addToast({
        title: 'Logout Failed',
        description: getErrorMessage(error),
        color: 'danger',
      });
    },
  });
};

export type UseLogoutOptions = InferHeyApiMutationOptions<typeof logoutApiV1AuthLogoutPostMutation>;
