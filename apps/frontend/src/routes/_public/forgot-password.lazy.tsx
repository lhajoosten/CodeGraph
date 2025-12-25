import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const Route = createLazyFileRoute('/_public/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
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
          <p className="text-blue-100">Reset your password</p>
        </div>

        {/* Card */}
        <div className="rounded-lg bg-white p-8 shadow-xl">
          <ForgotPasswordForm />

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
