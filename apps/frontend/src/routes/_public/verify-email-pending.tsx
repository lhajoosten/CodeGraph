import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/verify-email-pending')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      email: (search.email as string) || '',
    };
  },
});
