import { createFileRoute } from '@tanstack/react-router';
import { EmailVerification } from '@/components/auth/email-verification';

export const Route = createFileRoute('/_public/verify-email')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: (search.token as string) || '',
    };
  },
  component: EmailVerification,
});
