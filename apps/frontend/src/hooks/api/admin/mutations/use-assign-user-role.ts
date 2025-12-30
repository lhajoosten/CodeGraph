/**
 * Assign a role to a user.
 *
 * Automatically invalidates the users and roles lists after assignment.
 *
 * @returns Mutation hook for assigning role to user
 *
 * @example
 * const assignMutation = useAssignUserRole();
 * assignMutation.mutate(
 *   { path: { user_id: 1 }, body: { role_id: 2 } },
 *   { onSuccess: () => console.log('Role assigned!') }
 * );
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignUserRoleApiV1AdminUsersUserIdRolePostMutation } from '@/openapi/@tanstack/react-query.gen';
import { adminQueryKeys } from '../keys';
import type { InferHeyApiMutationOptions } from '@/lib/types';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';

export const useAssignUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...assignUserRoleApiV1AdminUsersUserIdRolePostMutation(),
    onSuccess: () => {
      addToast({
        title: 'Role Assigned',
        description: 'User role has been successfully assigned.',
        color: 'success',
      });
      // Invalidate users list and roles list to refetch
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.roles() });
    },
    onError: (error) => {
      addToast({
        title: 'Failed to Assign Role',
        description: getErrorMessage(error),
        color: 'danger',
      });
    },
  });
};

export type UseAssignUserRoleOptions = InferHeyApiMutationOptions<
  typeof assignUserRoleApiV1AdminUsersUserIdRolePostMutation
>;
