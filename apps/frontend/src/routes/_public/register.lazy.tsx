import { createLazyFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useRegister } from '@/hooks/api/use-auth';

export const Route = createLazyFileRoute('/_public/register')({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!email.includes('@')) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    registerMutation.mutate(
      {
        body: {
          email,
          password,
        },
      },
      {
        onSuccess: () => {
          // Show verification pending message and redirect
          navigate({
            to: '/verify-email-pending',
            search: { email },
          });
        },
        onError: (error: any) => {
          const errorMessage =
            error.response?.data?.detail || 'Registration failed. Please try again.';
          setErrors({ form: errorMessage });
        },
      }
    );
  };

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
          <p className="text-blue-100">Create your account</p>
        </div>

        {/* Card */}
        <div className="space-y-6 rounded-lg bg-white p-8 shadow-xl">
          {/* Form Error Alert */}
          {errors.form && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">{errors.form}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className={`
                mb-2 block text-sm font-medium text-gray-700
              `}
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={registerMutation.isPending}
                className={`
                  w-full rounded-lg border px-4 py-2
                  focus:border-transparent focus:ring-2 focus:outline-none
                  disabled:cursor-not-allowed disabled:bg-gray-50
                  ${
                    errors.email
                      ? `
                      border-red-300
                      focus:ring-red-500
                    `
                      : `
                      border-gray-300
                      focus:ring-blue-500
                    `
                  }
                `}
                required
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className={`
                mb-2 block text-sm font-medium text-gray-700
              `}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={registerMutation.isPending}
                  className={`
                    w-full rounded-lg border px-4 py-2
                    focus:border-transparent focus:ring-2 focus:outline-none
                    disabled:cursor-not-allowed disabled:bg-gray-50
                    ${
                      errors.password
                        ? `
                        border-red-300
                        focus:ring-red-500
                      `
                        : `
                        border-gray-300
                        focus:ring-blue-500
                      `
                    }
                  `}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`
                    absolute top-1/2 right-3 -translate-y-1/2 text-gray-500
                    hover:text-gray-700
                  `}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM19.5 13a8.956 8.956 0 01-4.312 5.25m-5.312.75a9.03 9.03 0 012.25.25"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              <p className="mt-1 text-xs text-gray-500">At least 8 characters</p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={registerMutation.isPending}
                  className={`
                    w-full rounded-lg border px-4 py-2
                    focus:border-transparent focus:ring-2 focus:outline-none
                    disabled:cursor-not-allowed disabled:bg-gray-50
                    ${
                      errors.confirmPassword
                        ? `
                        border-red-300
                        focus:ring-red-500
                      `
                        : `
                        border-gray-300
                        focus:ring-blue-500
                      `
                    }
                  `}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`
                    absolute top-1/2 right-3 -translate-y-1/2 text-gray-500
                    hover:text-gray-700
                  `}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM19.5 13a8.956 8.956 0 01-4.312 5.25m-5.312.75a9.03 9.03 0 012.25.25"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className={`
                w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white
                transition
                hover:bg-blue-700
                disabled:cursor-not-allowed disabled:opacity-50
              `}
            >
              {registerMutation.isPending ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Already have an account?</span>
            </div>
          </div>

          {/* Login Link */}
          <Link
            to="/login"
            search={{ redirect: '/' }}
            className={`
              block w-full rounded-lg bg-gray-100 px-4 py-2 text-center
              font-medium text-gray-900 transition
              hover:bg-gray-200
            `}
          >
            Sign in
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-blue-100">
          By creating an account, you agree to our{' '}
          <a
            href="#"
            className={`
            underline
            hover:text-white
          `}
          >
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  );
}
