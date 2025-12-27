/**
 * Fetch connected OAuth accounts for the current user.
 *
 * Returns a list of OAuth providers the user has connected to their account.
 *
 * @returns Query hook with connected OAuth accounts data
 *
 * @example
 * const { data, isLoading, isError } = useFetchOAuthAccounts();
 * const accounts = data?.accounts || [];
 */

import { useQuery } from '@tanstack/react-query';
import { getConnectedAccountsOauthAccountsGetOptions } from '@/openapi/@tanstack/react-query.gen';

export const useFetchOAuthAccounts = () => {
  return useQuery({
    ...getConnectedAccountsOauthAccountsGetOptions(),
    retry: false, // Don't retry if the feature is not available
  });
};
