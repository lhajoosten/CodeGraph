/**
 * Fetch all users with their roles.
 *
 * @returns Query hook with users list response
 *
 * @example
 * const { data: users, isLoading } = useFetchAdminUsers();
 */

import { useQuery } from '@tanstack/react-query';
import { listUsersWithRolesApiV1AdminUsersGetOptions } from '@/openapi/@tanstack/react-query.gen';

export const useFetchAdminUsers = () => {
  return useQuery({
    ...listUsersWithRolesApiV1AdminUsersGetOptions(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
