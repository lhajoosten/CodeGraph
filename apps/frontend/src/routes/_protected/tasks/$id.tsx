import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth-store';

export const Route = createFileRoute('/_protected/tasks/$id')({
  beforeLoad: ({ location }) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;

    if (!isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.pathname,
        },
      });
    }
  },
});
