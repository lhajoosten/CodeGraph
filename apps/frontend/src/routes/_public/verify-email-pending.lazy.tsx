import { createLazyFileRoute, Link, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { resendVerificationApiV1AuthResendVerificationPostMutation } from '@/openapi/@tanstack/react-query.gen';

export const Route = createLazyFileRoute('/_public/verify-email-pending')({
  component: VerifyEmailPendingPage,
});

function VerifyEmailPendingPage() {
  const { email } = useSearch({ from: '/_public/verify-email-pending' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const baseMutation = resendVerificationApiV1AuthResendVerificationPostMutation();
  const resendMutation = useMutation({
    mutationFn: baseMutation.mutationFn,
    onSuccess: (data) => {
      console.info('[EmailVerification] Resend successful:', data);
      setMessage('Verification email sent! Check your inbox.');
      setError('');
    },
    onError: (err: Error) => {
      console.error('[EmailVerification] Resend failed:', err);
      // Extract error message from response
      const errorMessage = err?.message || 'Failed to resend verification email. Please try again.';
      setError(errorMessage);
      setMessage('');
    },
  });

  const handleResend = () => {
    console.debug('[EmailVerification] Resending verification email to:', email);
    setMessage('');
    setError('');
    resendMutation.mutate({ body: { email } });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="mb-2 text-4xl font-bold text-white">CodeGraph</h1>
        </div>

        {/* Card */}
        <div className="space-y-6 rounded-lg bg-white p-8 shadow-xl">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-blue-100 p-4">
              <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Check Your Email</h2>
            <p className="text-gray-600">
              We sent a verification link to <strong>{email}</strong>
            </p>
          </div>

          {/* Success Message */}
          {message && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-sm font-medium text-green-700">{message}</p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-3 text-sm text-gray-600">
            <p>👉 Click the link in the email to verify your account</p>
            <p>⏱️ The link expires in 24 hours</p>
            <p>📧 Check your spam folder if you don't see it</p>
          </div>

          {/* Resend Button */}
          <button
            onClick={handleResend}
            disabled={resendMutation.isPending}
            className={`
              w-full rounded-lg border-2 border-blue-600 px-4 py-2 font-medium
              text-blue-600 transition
              hover:bg-blue-50
              disabled:cursor-not-allowed disabled:opacity-50
            `}
          >
            {resendMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending...
              </span>
            ) : (
              'Resend Verification Email'
            )}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Need help?</span>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-2 text-sm">
            <Link
              to="/login"
              search={{ redirect: '/' }}
              className={`
                block w-full rounded-lg px-4 py-2 text-center text-gray-600
                transition
                hover:bg-gray-100 hover:text-gray-900
              `}
            >
              Back to Sign In
            </Link>
            <Link
              to="/register"
              className={`
                block w-full rounded-lg px-4 py-2 text-center text-gray-600
                transition
                hover:bg-gray-100 hover:text-gray-900
              `}
            >
              Create Different Account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-blue-100">
          Contact support if you continue to have issues
        </p>
      </div>
    </div>
  );
}
