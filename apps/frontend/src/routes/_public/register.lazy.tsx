import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { AuthLayout, AuthCard, AuthHeader, RegisterForm } from '@/components/auth';
import { useTranslationNamespace } from '@/hooks/useTranslation';
import { Suspense } from 'react';

export const Route = createLazyFileRoute('/_public/register')({
  component: RegisterPage,
});

function RegisterPageContent() {
  const { t } = useTranslationNamespace('auth');
  const navigate = useNavigate();

  const handleRegisterSuccess = (email: string) => {
    navigate({
      to: '/verify-email-pending',
      search: { email },
    });
  };

  return (
    <AuthLayout>
      <AuthCard>
        <AuthHeader title={t('luminous.signup.title')} subtitle={t('luminous.signup.subtitle')} />

        <RegisterForm onSuccess={handleRegisterSuccess} />
      </AuthCard>
    </AuthLayout>
  );
}

function RegisterPageFallback() {
  return (
    <AuthLayout>
      <AuthCard>
        <div className="space-y-4">
          <div className="bg-surface-secondary h-8 w-32 animate-pulse rounded"></div>
          <div className="bg-surface-secondary h-4 w-48 animate-pulse rounded"></div>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}

function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterPageContent />
    </Suspense>
  );
}
