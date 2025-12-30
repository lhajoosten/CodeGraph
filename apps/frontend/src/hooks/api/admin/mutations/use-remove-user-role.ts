/**
 * Remove a role from a user.
 *
 * Automatically invalidates the users and roles lists after removal.
 *
 * @returns Mutation hook for removing role from user
 *
 * @example
 * const removeMutation = useRemoveUserRole();
 * removeMutation.mutate(
 *   { path: { user_id: 1, role_id: 2 } },
 *   { onSuccess: () => console.log('Role removed!') }
 * );
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeUserRoleApiV1AdminUsersUserIdRoleDeleteMutation } from '@/openapi/@tanstack/react-query.gen';
import { adminQueryKeys } from '../keys';
import type { InferHeyApiMutationOptions } from '@/lib/types';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';

export const useRemoveUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...removeUserRoleApiV1AdminUsersUserIdRoleDeleteMutation(),
    onSuccess: () => {
      addToast({
        title: 'Role Removed',
        description: 'User role has been successfully removed.',
        color: 'success',
      });
      // Invalidate users list and roles list to refetch
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.roles() });
    },
    onError: (error) => {
      addToast({
        title: 'Failed to Remove Role',
        description: getErrorMessage(error),
        color: 'danger',
      });
    },
  });
};

export type UseRemoveUserRoleOptions = InferHeyApiMutationOptions<
  typeof removeUserRoleApiV1AdminUsersUserIdRoleDeleteMutation
>;
