import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { AuthLayout, AuthCard, Verify2FAForm } from '@/components/auth';

export const Route = createLazyFileRoute('/_public/verify-2fa')({
  component: VerifyTwoFactorPage,
});

function VerifyTwoFactorPage() {
  const navigate = useNavigate();

  const handleVerify2FASuccess = () => {
    navigate({ to: '/' });
  };

  return (
    <AuthLayout>
      <AuthCard>
        <Verify2FAForm
          onSuccess={handleVerify2FASuccess}
          onCancel={() => navigate({ to: '/login', search: { redirect: '/' } })}
        />
      </AuthCard>
    </AuthLayout>
  );
}
