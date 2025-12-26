import { createLazyFileRoute, useSearch, useNavigate } from '@tanstack/react-router';
import { AuthLayout, AuthCard, AuthHeader, ResetPasswordForm } from '@/components/auth';

export const Route = createLazyFileRoute('/_public/reset-password')({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/_public/reset-password' });
  const token = (search as { token?: string })?.token;

  const handleResetSuccess = () => {
    navigate({ to: '/login', search: { redirect: '/' } });
  };

  return (
    <AuthLayout>
      <AuthCard>
        <AuthHeader title="Set New Password" subtitle="Create a strong password for your account" />

        <ResetPasswordForm token={token} onSuccess={handleResetSuccess} />
      </AuthCard>
    </AuthLayout>
  );
}
