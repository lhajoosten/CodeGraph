import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth-store';

export const Route = createFileRoute('/_public/verify-2fa')({
  beforeLoad: () => {
    const { isAuthenticated, twoFactorEnabled, twoFactorVerified } = useAuthStore.getState();

    // User must be authenticated (have a partial or full token)
    if (!isAuthenticated) {
      throw redirect({ to: '/login', search: { redirect: '/verify-2fa' } });
    }

    // If already verified, redirect to dashboard
    if (twoFactorVerified) {
      throw redirect({ to: '/' });
    }

    // If 2FA is not enabled, redirect to setup
    if (!twoFactorEnabled) {
      throw redirect({ to: '/setup-2fa' });
    }
  },
});
