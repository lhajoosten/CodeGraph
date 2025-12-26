import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { AuthLayout, AuthCard, AuthHeader, RegisterForm } from '@/components/auth';
import { useTranslationNamespace } from '@/hooks/useTranslation';

export const Route = createLazyFileRoute('/_public/register')({
  component: RegisterPage,
});

function RegisterPage() {
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
