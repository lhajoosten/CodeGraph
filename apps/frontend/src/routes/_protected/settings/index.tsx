import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth-store';

export const Route = createFileRoute('/_protected/settings/')({
  beforeLoad: () => {
    const { isAuthenticated, emailVerified, user } = useAuthStore.getState();

    if (!isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: '/settings' },
      });
    }

    if (!emailVerified && user) {
      throw redirect({
        to: '/verify-email-pending',
        search: { email: user.email },
      });
    }
  },
});
