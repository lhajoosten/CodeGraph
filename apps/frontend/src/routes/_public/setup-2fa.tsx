import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth-store';

export const Route = createFileRoute('/_public/setup-2fa')({
  beforeLoad: () => {
    const { isAuthenticated, requiresTwoFactorSetup, twoFactorVerified } = useAuthStore.getState();

    // User must be authenticated (have a partial or full token)
    if (!isAuthenticated) {
      throw redirect({ to: '/login', search: { redirect: '/setup-2fa' } });
    }

    // If already verified, redirect to dashboard
    if (twoFactorVerified) {
      throw redirect({ to: '/' });
    }

    // If 2FA setup is not required, redirect to verification
    if (!requiresTwoFactorSetup) {
      throw redirect({ to: '/verify-2fa' });
    }
  },
});
