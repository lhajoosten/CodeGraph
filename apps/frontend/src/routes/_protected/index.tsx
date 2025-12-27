import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth-store';

export const Route = createFileRoute('/_protected/')({
  beforeLoad: () => {
    const {
      isAuthenticated,
      emailVerified,
      user,
      twoFactorEnabled,
      twoFactorVerified,
      requiresTwoFactorSetup,
    } = useAuthStore.getState();

    // 1. Check if authenticated
    if (!isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: '/',
        },
      });
    }

    // 2. Check if 2FA setup is required (mandatory enforcement)
    if (requiresTwoFactorSetup) {
      throw redirect({
        to: '/setup-2fa',
        search: { oauth: undefined, provider: undefined, from: undefined },
      });
    }

    // 3. Check if 2FA is enabled but not verified this session
    if (twoFactorEnabled && !twoFactorVerified) {
      throw redirect({
        to: '/verify-2fa',
        search: { oauth: undefined, provider: undefined, from: undefined },
      });
    }

    // 4. Check if email is verified (must be after 2FA checks)
    if (!emailVerified && user) {
      throw redirect({
        to: '/verify-email-pending',
        search: {
          email: user.email,
        },
      });
    }
  },
});
