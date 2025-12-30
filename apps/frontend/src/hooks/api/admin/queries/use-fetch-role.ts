/**
 * Fetch a single role with its permissions.
 *
 * @param roleId - Role ID
 * @returns Query hook with role details response
 *
 * @example
 * const { data: role, isLoading } = useFetchRole(1);
 */

import { useQuery } from '@tanstack/react-query';
import { getRoleApiV1AdminRolesRoleIdGetOptions } from '@/openapi/@tanstack/react-query.gen';

export const useFetchRole = (roleId: number) => {
  return useQuery({
    ...getRoleApiV1AdminRolesRoleIdGetOptions({
      path: { role_id: roleId },
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
