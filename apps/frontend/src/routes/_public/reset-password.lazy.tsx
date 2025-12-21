import { createLazyFileRoute, Link, useSearch, useNavigate } from '@tanstack/react-router';
import { PasswordResetForm } from '@/components/auth/password-reset-form';

export const Route = createLazyFileRoute('/_public/reset-password')({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/_public/reset-password' });
  const token = (search as { token?: string })?.token;

  if (!token) {
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
          <div
            className={`
            space-y-6 rounded-lg bg-white p-8 text-center shadow-xl
          `}
          >
            <div className="text-red-500">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Invalid Link</h1>
            <p className="text-gray-600">The password reset link is missing or invalid.</p>
            <Link
              to="/login"
              search={{ redirect: '/' }}
              className={`
                block w-full rounded-lg bg-blue-600 px-4 py-2 font-medium
                text-white transition
                hover:bg-blue-700
              `}
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
      flex min-h-screen items-center justify-center bg-gradient-to-br
      from-blue-500 to-blue-600 px-4 py-12
      sm:px-6
      lg:px-8
    `}
    >
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Header */}
        <div className="text-center">
          <h1 className="mb-2 text-4xl font-bold text-white">CodeGraph</h1>
          <p className="text-blue-100">Set a new password</p>
        </div>

        {/* Card */}
        <div className="rounded-lg bg-white p-8 shadow-xl">
          <PasswordResetForm
            token={token}
            onSuccess={() => {
              navigate({ to: '/login', search: { redirect: '/' } });
            }}
          />

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              search={{ redirect: '/' }}
              className={`
              text-sm font-medium text-blue-600
              hover:text-blue-700
            `}
            >
              ← Back to sign in
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-blue-100">
          Remember your password?{' '}
          <Link
            to="/login"
            search={{ redirect: '/' }}
            className={`
            underline
            hover:text-white
          `}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
