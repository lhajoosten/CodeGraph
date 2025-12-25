import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { changeEmailApiV1AuthChangeEmailPost } from '@/openapi/sdk.gen';
import { useAuthStore } from '@/stores/auth-store';

export const EmailChangeForm = () => {
  const { user } = useAuthStore();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const changeMutation = useMutation({
    mutationFn: async (data: { new_email: string; password: string }) => {
      const response = await changeEmailApiV1AuthChangeEmailPost({
        body: data,
      });
      return response;
    },
    onSuccess: () => {
      setSuccess(true);
      setNewEmail('');
      setPassword('');
      setError('');
    },
    onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
      setError(error.response?.data?.detail || 'Failed to change email');
      setSuccess(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!newEmail || !password) {
      setError('Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (newEmail === user?.email) {
      setError('New email must be different from current email');
      return;
    }

    changeMutation.mutate({
      new_email: newEmail,
      password: password,
    });
  };

  return (
    <div className="space-y-4">
      {/* Current Email Display */}
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-600">Current email</p>
        <p className="font-medium text-gray-900">{user?.email}</p>
      </div>

      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-medium text-green-800">Verification email sent!</p>
              <p className="mt-1 text-sm text-green-700">
                We&apos;ve sent a verification email to <strong>{newEmail}</strong>. Please check
                your inbox and click the link to confirm your new email address.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSuccess(false)}
            className={`
              mt-4 text-sm font-medium text-green-700
              hover:text-green-800
            `}
          >
            Change to a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className={`
                rounded-lg border border-red-200 bg-red-50 p-3 text-sm
                text-red-700
              `}
            >
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              New Email Address
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={`
                w-full rounded-lg border border-gray-300 px-4 py-2
                focus:border-transparent focus:ring-2 focus:ring-blue-500
                focus:outline-none
              `}
              placeholder="Enter new email address"
              disabled={changeMutation.isPending}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Confirm with Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`
                w-full rounded-lg border border-gray-300 px-4 py-2
                focus:border-transparent focus:ring-2 focus:ring-blue-500
                focus:outline-none
              `}
              placeholder="Enter your password"
              disabled={changeMutation.isPending}
            />
            <p className="mt-1 text-xs text-gray-500">
              We need your password to confirm this change
            </p>
          </div>

          <button
            type="submit"
            disabled={changeMutation.isPending}
            className={`
              w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white
              transition
              hover:bg-blue-700
              disabled:cursor-not-allowed disabled:opacity-50
            `}
          >
            {changeMutation.isPending ? 'Sending verification...' : 'Change Email'}
          </button>
        </form>
      )}
    </div>
  );
};
