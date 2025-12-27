import { createFileRoute } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth-store';

export const Route = createFileRoute('/_public/forgot-password')({
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;

    if (isAuthenticated) {
      throw new Error('Already authenticated');
    }
  },
});
