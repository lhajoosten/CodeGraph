import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/oauth/callback/$provider')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      code: (search.code as string) || '',
      state: (search.state as string) || '',
      error: search.error as string | undefined,
      error_description: search.error_description as string | undefined,
    };
  },
});
