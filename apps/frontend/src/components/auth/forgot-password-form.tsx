import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { forgotPasswordApiV1AuthForgotPasswordPost } from '@/openapi/sdk.gen';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export const ForgotPasswordForm = ({ onSuccess }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const forgotMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await forgotPasswordApiV1AuthForgotPasswordPost({
        body: data,
      });
      return response;
    },
    onSuccess: () => {
      setSubmitted(true);
      setEmail('');
      if (onSuccess) {
        onSuccess();
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      return;
    }

    forgotMutation.mutate({ email });
  };

  if (submitted) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="text-center">
          <div className="mb-4 text-green-500">
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold">Check Your Email</h2>
          <p className="mb-6 text-gray-600">
            If an account exists for {email}, we've sent a password reset link. Please check your
            email and follow the link to reset your password.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className={`
              font-medium text-blue-600
              hover:text-blue-700
            `}
          >
            Reset another email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-6 text-2xl font-bold">Reset Your Password</h2>
      <p className="mb-6 text-gray-600">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`
              w-full rounded-lg border border-gray-300 px-4 py-2
              focus:ring-2 focus:ring-blue-500 focus:outline-none
            `}
            placeholder="Enter your email"
            disabled={forgotMutation.isPending}
            required
          />
        </div>

        <button
          type="submit"
          disabled={forgotMutation.isPending || !email}
          className={`
            w-full rounded-lg bg-blue-600 py-2 text-white transition
            hover:bg-blue-700
            disabled:cursor-not-allowed disabled:opacity-50
          `}
        >
          {forgotMutation.isPending ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  );
};
