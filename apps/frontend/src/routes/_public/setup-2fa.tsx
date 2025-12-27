import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth-store';
import { client } from '@/openapi/client.gen';

interface CurrentUserResponse {
  id: number;
  email: string;
  email_verified: boolean;
  two_factor_enabled?: boolean;
}

interface SetupSearchParams {
  oauth?: boolean;
  provider?: string;
  from?: string;
}

export const Route = createFileRoute('/_public/setup-2fa')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      oauth: search.oauth === true ? true : undefined,
      provider: search.provider as string | undefined,
      from: search.from as string | undefined,
    };
  },
  beforeLoad: async ({ search }) => {
    const { twoFactorVerified, login, setTwoFactorStatus } = useAuthStore.getState();
    const searchParams = search as SetupSearchParams;
    const isOAuthFlow = searchParams.oauth === true;

    // If already verified, redirect to dashboard
    if (twoFactorVerified) {
      throw redirect({ to: '/' });
    }

    // In OAuth flow, we need to fetch fresh user info regardless of auth store state
    // (localStorage auth store may be stale from previous session)
    if (isOAuthFlow) {
      try {
        const response = await client.get<CurrentUserResponse>({
          url: '/api/v1/users/me',
        });
        if (response.data?.id) {
          // We have a valid token (partial or full), update auth store fresh
          login({
            id: response.data.id,
            email: response.data.email,
            email_verified: response.data.email_verified,
          });

          // Check actual 2FA status from server
          // If user already has 2FA enabled, redirect to verify instead of setup
          if (response.data.two_factor_enabled === true) {
            setTwoFactorStatus(true, false, false);
            throw redirect({
              to: '/verify-2fa',
              search: { oauth: true, provider: searchParams.provider, from: 'setup-redirect' },
            });
          }

          // User doesn't have 2FA yet, setup is required
          setTwoFactorStatus(false, false, true);
          return;
        }
      } catch {
        // If fetch failed, redirect to login
        throw redirect({ to: '/login', search: { redirect: '/setup-2fa' } });
      }
    }

    // Non-OAuth flow: Traditional auth users must verify email before setting up 2FA
    const { isAuthenticated, user, oauthProvider } = useAuthStore.getState();

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      throw redirect({ to: '/login', search: { redirect: '/' } });
    }

    // If traditional auth (no OAuth provider) and email not verified, require email verification
    if (!oauthProvider && user && !user.email_verified) {
      throw redirect({ to: '/verify-email-pending', search: { email: user.email } });
    }

    // Email verified or OAuth user - allow access to 2FA setup
  },
});
