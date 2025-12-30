/**
 * Fetch all available permissions.
 *
 * @returns Query hook with permissions list response
 *
 * @example
 * const { data: permissions, isLoading } = useFetchPermissions();
 */

import { useQuery } from '@tanstack/react-query';
import { listPermissionsApiV1AdminPermissionsGetOptions } from '@/openapi/@tanstack/react-query.gen';

export const useFetchPermissions = () => {
  return useQuery({
    ...listPermissionsApiV1AdminPermissionsGetOptions(),
    staleTime: 10 * 60 * 1000, // 10 minutes (permissions rarely change)
  });
};
