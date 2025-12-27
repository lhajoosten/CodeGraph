/**
 * Fetch two-factor authentication status.
 *
 * Returns the current 2FA status for the authenticated user,
 * including whether 2FA is enabled and remaining backup codes count.
 *
 * @returns Query hook with 2FA status data
 *
 * @example
 * const { data, isLoading, isError } = useFetchTwoFactorStatus();
 * if (data?.enabled) {
 *   console.log(`2FA enabled, ${data.backup_codes_remaining} backup codes remaining`);
 * }
 */

import { useQuery } from '@tanstack/react-query';
import { getTwoFactorStatusApiV1TwoFactorStatusGetOptions } from '@/openapi/@tanstack/react-query.gen';

export const useFetchTwoFactorStatus = () => {
  return useQuery({
    ...getTwoFactorStatusApiV1TwoFactorStatusGetOptions(),
    retry: false, // Don't retry if the feature is not available
  });
};
