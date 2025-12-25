/**
 * Fetch the current authenticated user.
 *
 * Automatically uses cookies for authentication.
 *
 * @returns Query hook with current user data or null if not authenticated
 *
 * @example
 * const { data: user, isLoading } = useFetchCurrentUser();
 */

import { useQuery } from '@tanstack/react-query';
import { getCurrentUserInfoApiV1UsersMeGetOptions } from '@/openapi/@tanstack/react-query.gen';

export const useFetchCurrentUser = () => {
  return useQuery({
    ...getCurrentUserInfoApiV1UsersMeGetOptions(),
    retry: false, // Don't retry if not authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
