import { createLazyFileRoute } from '@tanstack/react-router';
import { useNavigate } from '@tanstack/react-router';
import { AuthLayout, AuthCard, AuthHeader, LoginForm, OAuthButton } from '@/components/auth';
import { useTranslationNamespace } from '@/hooks/useTranslation';
import { Suspense } from 'react';

export const Route = createLazyFileRoute('/_public/login')({
  component: LoginPage,
});

function LoginPageContent() {
  const { t } = useTranslationNamespace('auth');
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate({ to: '/' });
  };

  const apiUrl = import.meta.env.VITE_API_URL;

  return (
    <AuthLayout>
      <AuthCard>
        <AuthHeader title={t('luminous.signin.title')} subtitle={t('luminous.signin.subtitle')} />

        <LoginForm onSuccess={handleLoginSuccess} />

        {/* OAuth Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-steel"></div>
          </div>
          <div className="relative my-4 flex justify-center text-sm">
            <span className="bg-bg-steel px-2 text-text-secondary-lum">
              {t('luminous.signin.oauthDivider')}
            </span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <OAuthButton provider="github" href={`${apiUrl}/oauth/github/authorize`} />
          <OAuthButton provider="google" href={`${apiUrl}/oauth/google/authorize`} />
          <OAuthButton provider="microsoft" href={`${apiUrl}/oauth/microsoft/authorize`} />
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-text-secondary-lum">
          By signing in, you agree to our{' '}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-cyan transition-colors hover:text-brand-teal"
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-cyan transition-colors hover:text-brand-teal"
          >
            Privacy Policy
          </a>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}

function LoginPageFallback() {
  return (
    <AuthLayout>
      <AuthCard>
        <div className="space-y-4">
          <div className="h-8 w-32 animate-pulse rounded bg-bg-steel"></div>
          <div className="h-4 w-48 animate-pulse rounded bg-bg-steel"></div>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}

function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
