import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { resetPasswordApiV1AuthResetPasswordPost } from '@/openapi/sdk.gen';

interface PasswordResetFormProps {
  token: string;
  onSuccess?: () => void;
}

export const PasswordResetForm = ({ token, onSuccess }: PasswordResetFormProps) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const resetMutation = useMutation({
    mutationFn: async (data: { password: string }) => {
      const response = await resetPasswordApiV1AuthResetPasswordPost({
        body: {
          token,
          password: data.password,
        },
      });
      return response;
    },
    onSuccess: () => {
      if (onSuccess) {
        onSuccess();
      } else {
        navigate({ to: '/login', search: { redirect: '/' } });
      }
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to reset password. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    resetMutation.mutate({ password });
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-6 text-2xl font-bold">Reset Your Password</h2>

      {error && (
        <div
          className={`
          mb-4 rounded border border-red-200 bg-red-50 p-4 text-red-700
        `}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`
              w-full rounded-lg border border-gray-300 px-4 py-2
              focus:ring-2 focus:ring-blue-500 focus:outline-none
            `}
            placeholder="Enter new password"
            disabled={resetMutation.isPending}
          />
          <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters long</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`
              w-full rounded-lg border border-gray-300 px-4 py-2
              focus:ring-2 focus:ring-blue-500 focus:outline-none
            `}
            placeholder="Confirm new password"
            disabled={resetMutation.isPending}
          />
        </div>

        <button
          type="submit"
          disabled={resetMutation.isPending}
          className={`
            w-full rounded-lg bg-blue-600 py-2 text-white transition
            hover:bg-blue-700
            disabled:cursor-not-allowed disabled:opacity-50
          `}
        >
          {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      {resetMutation.isSuccess && (
        <p className="mt-4 text-center text-green-600">
          Password reset successfully! Redirecting to login...
        </p>
      )}
    </div>
  );
};
