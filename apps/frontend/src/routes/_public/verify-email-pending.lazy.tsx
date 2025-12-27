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
    onSuccess: (_data) => {
      setMessage('Verification email sent! Check your inbox.');
      setError('');
    },
    onError: (err: Error) => {
      const errorMessage = err?.message || 'Failed to resend verification email. Please try again.';
      setError(errorMessage);
      setMessage('');
    },
  });

  const handleResend = () => {
    setMessage('');
    setError('');
    resendMutation.mutate({ body: { email } });
  };

  return (
    <div
      style={{
        background: `linear-gradient(135deg, var(--color-bg-primary-lum) 0%, var(--color-bg-elevated-lum) 100%)`,
      }}
      className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 style={{ color: 'var(--color-brand-cyan)' }} className="mb-2 text-4xl font-bold">
            CodeGraph
          </h1>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: 'var(--color-bg-secondary-lum)',
            borderColor: 'var(--color-border-steel)',
          }}
          className="space-y-6 rounded-lg border p-8 shadow-xl"
        >
          {/* Icon */}
          <div className="flex justify-center">
            <div
              style={{
                backgroundColor: 'rgba(34, 211, 238, 0.1)',
                borderColor: 'rgba(34, 211, 238, 0.3)',
              }}
              className="rounded-full border p-4"
            >
              <svg
                style={{ color: 'var(--color-brand-cyan)' }}
                className="h-8 w-8"
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
            <h2
              style={{ color: 'var(--color-text-primary-lum)' }}
              className="mb-2 text-2xl font-bold"
            >
              Email Verification Pending
            </h2>
            <p style={{ color: 'var(--color-text-secondary-lum)' }}>
              Check Your Email - We sent a verification link to <strong>{email}</strong>
            </p>
          </div>

          {/* Success Message */}
          {message && (
            <div
              style={{
                backgroundColor: 'rgba(34, 211, 238, 0.1)',
                borderColor: 'rgba(34, 211, 238, 0.3)',
              }}
              className="rounded-lg border p-4"
            >
              <div className="flex items-center gap-2">
                <svg
                  style={{ color: 'var(--color-brand-cyan)' }}
                  className="h-5 w-5"
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
                <p style={{ color: 'var(--color-brand-cyan)' }} className="text-sm font-medium">
                  {message}
                </p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
              }}
              className="rounded-lg border p-4"
            >
              <div className="flex items-center gap-2">
                <svg
                  style={{ color: 'var(--color-error)' }}
                  className="h-5 w-5"
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
                <p style={{ color: 'var(--color-error)' }} className="text-sm font-medium">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div style={{ color: 'var(--color-text-secondary-lum)' }} className="space-y-3 text-sm">
            <p>👉 Click the link in the email to verify your account</p>
            <p>⏱️ The link expires in 24 hours</p>
            <p>📧 Check your spam folder if you don&apos;t see it</p>
          </div>

          {/* Resend Button */}
          <button
            onClick={handleResend}
            disabled={resendMutation.isPending}
            style={{
              backgroundColor: 'var(--color-brand-cyan)',
              color: 'var(--color-bg-primary-lum)',
            }}
            className="w-full rounded-lg px-4 py-3 font-medium transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
              <div
                style={{ borderColor: 'var(--color-border-steel)' }}
                className="w-full border-t"
              ></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span
                style={{
                  backgroundColor: 'var(--color-bg-secondary-lum)',
                  color: 'var(--color-text-muted-lum)',
                }}
                className="px-2"
              >
                Need help?
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-2 text-sm">
            <Link
              to="/login"
              search={{ redirect: '/' }}
              style={{
                borderColor: 'var(--color-border-steel)',
                color: 'var(--color-text-secondary-lum)',
              }}
              className="block w-full rounded-lg border px-4 py-3 text-center transition hover:bg-bg-steel"
            >
              Back to Sign In
            </Link>
            <Link
              to="/register"
              style={{
                borderColor: 'var(--color-border-steel)',
                color: 'var(--color-text-secondary-lum)',
              }}
              className="block w-full rounded-lg border px-4 py-3 text-center transition hover:bg-bg-steel"
            >
              Create Different Account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p style={{ color: 'var(--color-text-secondary-lum)' }} className="text-center text-sm">
          Contact support if you continue to have issues
        </p>
      </div>
    </div>
  );
}
