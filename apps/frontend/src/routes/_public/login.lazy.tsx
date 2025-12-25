import { createLazyFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useLogin } from '@/hooks';
import type { LoginResponse } from '@/openapi/types.gen';

export const Route = createLazyFileRoute('/_public/login')({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    loginMutation.mutate(
      {
        body: {
          email,
          password,
        },
      },
      {
        onSuccess: (rawData) => {
          // Note: API returns LoginResponse but generated types say TokenResponse
          const data = rawData as unknown as LoginResponse;
          console.info('[Login] Login successful, email_verified:', data.email_verified);

          // Check if email is verified
          if (!data.email_verified) {
            // Redirect to verify email page
            navigate({
              to: '/verify-email-pending',
              search: { email: data.user.email },
            });
          } else {
            // Email verified, go to home/dashboard
            navigate({ to: '/' });
          }
        },
        onError: (err) => {
          // Extract error message from axios error response
          const axiosError = err as {
            response?: { data?: { detail?: string | Array<{ msg: string }> } };
          };
          let errorMessage = 'Login failed. Please try again.';
          if (axiosError.response?.data?.detail) {
            const detail = axiosError.response.data.detail;
            if (typeof detail === 'string') {
              errorMessage = detail;
            } else if (Array.isArray(detail) && detail.length > 0) {
              errorMessage = detail[0].msg;
            }
          }
          setError(errorMessage);
          // Clear password on error for security
          setPassword('');
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
          <p className="text-blue-100">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="space-y-6 rounded-lg bg-white p-8 shadow-xl">
          {/* Error Alert */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className={`mb-2 block text-sm font-medium text-gray-700`}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loginMutation.isPending}
                className={`
                  w-full rounded-lg border border-gray-300 px-4 py-2
                  focus:border-transparent focus:ring-2 focus:ring-blue-500
                  focus:outline-none
                  disabled:cursor-not-allowed disabled:bg-gray-50
                `}
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className={`mb-2 block text-sm font-medium text-gray-700`}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loginMutation.isPending}
                  className={`
                    w-full rounded-lg border border-gray-300 px-4 py-2
                    focus:border-transparent focus:ring-2 focus:ring-blue-500
                    focus:outline-none
                    disabled:cursor-not-allowed disabled:bg-gray-50
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
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className={`
                  text-sm font-medium text-blue-600
                  hover:text-blue-700
                `}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className={`
                w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white
                transition
                hover:bg-blue-700
                disabled:cursor-not-allowed disabled:opacity-50
              `}
            >
              {loginMutation.isPending ? (
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
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* OAuth Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-3 gap-3">
            {/* GitHub */}
            <a
              href={`${import.meta.env.VITE_API_URL}/api/v1/oauth/github/authorize`}
              className={`
                flex items-center justify-center rounded-lg border
                border-gray-300 px-4 py-2 transition
                hover:bg-gray-50
              `}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>

            {/* Google */}
            <a
              href={`${import.meta.env.VITE_API_URL}/api/v1/oauth/google/authorize`}
              className={`
                flex items-center justify-center rounded-lg border
                border-gray-300 px-4 py-2 transition
                hover:bg-gray-50
              `}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </a>

            {/* Microsoft */}
            <a
              href={`${import.meta.env.VITE_API_URL}/api/v1/oauth/microsoft/authorize`}
              className={`
                flex items-center justify-center rounded-lg border
                border-gray-300 px-4 py-2 transition
                hover:bg-gray-50
              `}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#F25022" d="M1 1h10v10H1z" />
                <path fill="#00A4EF" d="M1 13h10v10H1z" />
                <path fill="#7FBA00" d="M13 1h10v10H13z" />
                <path fill="#FFB900" d="M13 13h10v10H13z" />
              </svg>
            </a>
          </div>

          {/* Register Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Don&apos;t have an account?</span>
            </div>
          </div>

          {/* Register Link */}
          <Link
            to="/register"
            className={`
              block w-full rounded-lg bg-gray-100 px-4 py-2 text-center
              font-medium text-gray-900 transition
              hover:bg-gray-200
            `}
          >
            Sign up
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-blue-100">
          By signing in, you agree to our{' '}
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
