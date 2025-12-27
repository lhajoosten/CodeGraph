import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/reset-password')({
  validateSearch: (search: Record<string, string>) => {
    return {
      token: search.token || '',
    };
  },
});
