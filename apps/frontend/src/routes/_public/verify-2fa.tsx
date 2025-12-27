import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth-store';
import { client } from '@/openapi/client.gen';

interface VerifySearchParams {
  oauth?: string;
  provider?: string;
}

interface TwoFactorStatusResponse {
  enabled: boolean;
  backup_codes_remaining?: number;
}

export const Route = createFileRoute('/_public/verify-2fa')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      oauth: search.oauth as string | undefined,
      provider: search.provider as string | undefined,
    };
  },
  beforeLoad: async ({ search }) => {
    const { twoFactorEnabled, twoFactorVerified, setTwoFactorStatus } = useAuthStore.getState();
    const searchParams = search as VerifySearchParams;
    const isOAuthFlow = searchParams.oauth === 'true';

    // If already verified, redirect to dashboard
    if (twoFactorVerified) {
      throw redirect({ to: '/' });
    }

    // In OAuth flow, fetch 2FA status from server and update auth store
    if (isOAuthFlow) {
      try {
        const response = await client.get<TwoFactorStatusResponse>({
          url: '/api/v1/two-factor/status',
        });
        if (response.data) {
          // Update auth store with correct 2FA status from server
          setTwoFactorStatus(response.data.enabled, false, !response.data.enabled);
        }
      } catch (error) {
        // If we can't fetch status, assume 2FA is enabled (we're on the verify page)
        setTwoFactorStatus(true, false, false);
      }
      return;
    }

    // If 2FA is not enabled, redirect to setup
    if (!twoFactorEnabled) {
      throw redirect({ to: '/setup-2fa' });
    }
  },
});
