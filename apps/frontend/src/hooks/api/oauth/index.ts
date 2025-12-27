/**
 * OAuth API hooks - Queries and mutations.
 * Handles OAuth account management operations.
 */

export { useFetchOAuthAccounts } from './queries';
export { useUnlinkOAuthAccount, type UseUnlinkOAuthAccountOptions } from './mutations';

/**
 * Query keys for OAuth-related queries.
 * Use these for manual cache invalidation.
 */
export { getConnectedAccountsOauthAccountsGetQueryKey as oauthQueryKeys } from '@/openapi/@tanstack/react-query.gen';
