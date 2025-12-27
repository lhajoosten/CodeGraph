import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { verifyEmailApiV1AuthVerifyEmailPost } from '@/openapi/sdk.gen';
import { useAuthStore } from '@/stores/auth-store';
import { getErrorMessage } from '@/lib/error-handler';
import { AuthLayout, AuthCard, AuthHeader } from '@/components/auth';
import { ArrowPathIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUserInfoApiV1UsersMeGetOptions } from '@/openapi/@tanstack/react-query.gen.ts';

export const Route = createFileRoute('/_public/verify-email')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: (search.token as string) || '',
    };
  },
  component: EmailVerificationPage,
});

function EmailVerificationPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/_public/verify-email' });
  const token = (search as { token?: string })?.token;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const { setEmailVerified, isAuthenticated } = useAuthStore();

  const userReponse = useQuery({ ...getCurrentUserInfoApiV1UsersMeGetOptions() });

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        if (!token) {
          setStatus('error');
          setMessage('Verification token not found in URL');
          return;
        }

        const result = await verifyEmailApiV1AuthVerifyEmailPost({
          body: { token },
        });

        setStatus('success');
        setMessage('Email verified successfully!');
        setEmailVerified(true);

        // Redirect based on 2FA requirements and authentication status
        setTimeout(() => {
          if (isAuthenticated) {
            // OAuth flow: user was already authenticated, just needed to verify email
            navigate({ to: '/' });
          } else if (result.data?.requires_2fa_setup) {
            // 2FA is mandatory: backend issued partial token, set auth state
            // Try to fetch user info to update auth store
            (async () => {
              try {
                const userResponse = await userReponse.refetch();
                if (userResponse.data?.id) {
                  // Call the setters with the user data
                  const { login, setTwoFactorStatus } = useAuthStore.getState();
                  login({
                    id: userResponse.data.id,
                    email: userResponse.data.email,
                    email_verified: userResponse.data.email_verified,
                  });
                  setTwoFactorStatus(false, false, true);
                }
              } catch (error) {
                console.error('Failed to fetch user after verification:', error);
              }
            })();
            // Navigate to 2FA setup (traditional auth flow, not OAuth)
            navigate({ to: '/setup-2fa', search: { oauth: undefined, provider: undefined } });
          } else {
            // 2FA not mandatory: redirect to login
            navigate({ to: '/login', search: { redirect: '/' } });
          }
        }, 2000);
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        setStatus('error');
        setMessage(errorMessage);
      }
    };

    verifyEmail();
  }, [token, navigate, setEmailVerified, isAuthenticated, userReponse]);

  return (
    <AuthLayout>
      <AuthCard>
        {status === 'loading' && (
          <>
            <div className="mb-4 flex justify-center">
              <ArrowPathIcon className="h-12 w-12 animate-spin text-brand-cyan" />
            </div>
            <AuthHeader
              title="Verifying Email"
              subtitle="Please wait while we verify your email address..."
            />
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-4 flex justify-center">
              <CheckCircleIcon className="h-12 w-12 text-brand-lime" />
            </div>
            <AuthHeader title="Email Verified!" subtitle={message} />
            <p className="mt-4 text-center text-sm text-text-secondary-lum">
              Redirecting to {isAuthenticated ? 'dashboard' : 'login'}...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-4 flex justify-center">
              <ExclamationCircleIcon className="h-12 w-12 text-error" />
            </div>
            <AuthHeader title="Verification Failed" subtitle={message} />
            <button
              onClick={() => navigate({ to: '/login', search: { redirect: '/' } })}
              className="mt-6 w-full rounded-lg bg-brand-cyan py-3 font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:opacity-90"
            >
              Back to Login
            </button>
          </>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
