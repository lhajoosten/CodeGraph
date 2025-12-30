/**
 * Fetch all roles with their permissions.
 *
 * @returns Query hook with roles list response
 *
 * @example
 * const { data: roles, isLoading } = useFetchRoles();
 */

import { useQuery } from '@tanstack/react-query';
import { listRolesApiV1AdminRolesGetOptions } from '@/openapi/@tanstack/react-query.gen';

export const useFetchRoles = () => {
  return useQuery({
    ...listRolesApiV1AdminRolesGetOptions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
