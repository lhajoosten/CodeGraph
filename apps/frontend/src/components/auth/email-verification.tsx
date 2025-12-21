import { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { verifyEmailApiV1AuthVerifyEmailPost } from '@/openapi/sdk.gen';
import { useAuthStore } from '@/stores/auth-store';

export const EmailVerification = () => {
  const navigate = useNavigate();
  const search = useSearch({ from: '/_public/verify-email' });
  const token = search.token;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const { setEmailVerified, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const verifyEmail = async () => {
      console.debug('[EmailVerification] Starting verification, token present:', !!token);

      try {
        if (!token) {
          console.error('[EmailVerification] No token found in URL');
          setStatus('error');
          setMessage('Verification token not found in URL');
          return;
        }

        console.debug('[EmailVerification] Calling verify-email API');
        const response = await verifyEmailApiV1AuthVerifyEmailPost({
          body: { token },
        });

        if (response.data) {
          console.info('[EmailVerification] Verification successful');
          setStatus('success');
          setMessage('Email verified successfully! Redirecting...');

          // Update auth state
          setEmailVerified(true);

          // Redirect based on authentication status
          setTimeout(() => {
            if (isAuthenticated) {
              navigate({ to: '/' });
            } else {
              navigate({ to: '/login', search: { redirect: '/' } });
            }
          }, 2000);
        } else {
          const errorDetail = response.error?.detail || 'Token may have expired';
          console.error('[EmailVerification] Verification failed:', errorDetail);
          setStatus('error');
          setMessage(`Failed to verify email. ${errorDetail}`);
        }
      } catch (error) {
        console.error('[EmailVerification] Exception during verification:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your email. Please try again.');
      }
    };

    verifyEmail();
  }, [token, navigate, setEmailVerified, isAuthenticated]);

  return (
    <div
      className={`
      flex min-h-screen items-center justify-center bg-gradient-to-br
      from-blue-500 to-blue-600 px-4 py-12
      sm:px-6
      lg:px-8
    `}
    >
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-white">CodeGraph</h1>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-xl">
          {status === 'loading' && (
            <>
              <div className="mb-4 flex justify-center">
                <div
                  className={`
                  h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600
                `}
                ></div>
              </div>
              <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Verifying Email</h1>
              <p className="text-center text-gray-600">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-4 flex justify-center">
                <div className="text-green-500">
                  <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Email Verified!</h1>
              <p className="mb-4 text-center text-gray-600">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mb-4 flex justify-center">
                <div className="text-red-500">
                  <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
                Verification Failed
              </h1>
              <p className="mb-6 text-center text-gray-600">{message}</p>
              <button
                onClick={() => navigate({ to: '/login', search: { redirect: '/' } })}
                className={`
                  w-full rounded-lg bg-blue-600 py-2 text-white transition
                  hover:bg-blue-700
                `}
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
