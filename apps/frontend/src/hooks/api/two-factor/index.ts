/**
 * Two-Factor Authentication API hooks - Queries and mutations.
 * Handles 2FA status, setup, enable, disable, and backup code operations.
 */

export { useFetchTwoFactorStatus } from './queries';
export {
  useDisableTwoFactor,
  useRegenerateBackupCodes,
  type UseDisableTwoFactorOptions,
  type UseRegenerateBackupCodesOptions,
} from './mutations';

/**
 * Query keys for 2FA-related queries.
 * Use these for manual cache invalidation.
 */
export { getTwoFactorStatusApiV1TwoFactorStatusGetQueryKey as twoFactorQueryKeys } from '@/openapi/@tanstack/react-query.gen';
