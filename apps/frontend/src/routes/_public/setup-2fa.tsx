import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth-store';
import { client } from '@/openapi/client.gen';

interface CurrentUserResponse {
  id: number;
  email: string;
  email_verified: boolean;
}

export const Route = createFileRoute('/_public/setup-2fa')({
  beforeLoad: async () => {
    const {
      isAuthenticated,
      twoFactorVerified,
      requiresTwoFactorSetup,
      login,
      setTwoFactorStatus,
    } = useAuthStore.getState();

    // If already verified, redirect to dashboard
    if (twoFactorVerified) {
      throw redirect({ to: '/' });
    }

    // If not authenticated in store, check if we might have a partial token cookie
    // This handles the OAuth callback redirect case where partial token is set
    if (!isAuthenticated) {
      // Try to fetch user info using the partial token cookie
      try {
        const response = await client.get<CurrentUserResponse>({
          url: '/api/v1/users/me',
        });
        if (response.data?.id) {
          // We have a valid token (partial or full), update auth store
          login({
            id: response.data.id,
            email: response.data.email,
            email_verified: response.data.email_verified,
          });
          // Set 2FA as not enabled but setup required (since we're on this route)
          setTwoFactorStatus(false, false, true);
        } else {
          // No user data returned, redirect to login
          redirect({ to: '/login', search: { redirect: '/setup-2fa' } });
        }
      } catch {
        // Failed to fetch user, likely no valid token, redirect to login
        throw redirect({ to: '/login', search: { redirect: '/setup-2fa' } });
      }
    } else if (!requiresTwoFactorSetup) {
      // Already authenticated but 2FA setup not required, redirect to dashboard
      throw redirect({ to: '/' });
    }
  },
});
