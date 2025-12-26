/**
 * Handles 2FA routing logic for both login and OAuth flows.
 *
 * Checks if 2FA is required and routes user to appropriate page:
 * - Setup page if 2FA is mandatory but not enabled
 * - Verification page if 2FA is enabled
 * - Or null if 2FA is not required
 *
 * @example
 * const { shouldRoute, destination } = useShouldRouteTo2FA(loginResponse);
 * if (shouldRoute) {
 *   navigate({ to: destination });
 *   return;
 * }
 */

import { useAuthStore } from '@/stores/auth-store';
import { addToast } from '@/lib/toast';
import type { LoginResponse } from '@/openapi/types.gen';

export interface Use2FARoutingResult {
  shouldRoute: boolean;
  destination: string | null;
}

/**
 * Handles 2FA routing after successful authentication.
 * Returns whether routing is needed and where to route to.
 */
export function useHandle2FARouting() {
  const { setTwoFactorStatus } = useAuthStore();

  return function handleTwoFactorRouting(data: LoginResponse): Use2FARoutingResult {
    // Check if 2FA is required
    if (!data.requires_two_factor) {
      // 2FA not required, return no routing needed
      return { shouldRoute: false, destination: null };
    }

    const twoFactorEnabled = data.two_factor_enabled ?? false;

    // Set 2FA status in auth store
    setTwoFactorStatus(
      twoFactorEnabled,
      false, // Not verified yet
      !twoFactorEnabled // Requires setup if not enabled
    );

    if (!twoFactorEnabled) {
      // 2FA not yet set up - need to set it up
      addToast({
        title: '2FA Setup Required',
        description: 'Please set up two-factor authentication to continue.',
        color: 'warning',
      });
      return { shouldRoute: true, destination: '/setup-2fa' };
    }

    // 2FA already enabled - need to verify it
    addToast({
      title: '2FA Verification Required',
      description: 'Please enter your 2FA code to continue.',
      color: 'info',
    });
    return { shouldRoute: true, destination: '/verify-2fa' };
  };
}
