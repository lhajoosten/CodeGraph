import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { changePasswordApiV1AuthChangePasswordPost } from '@/openapi/sdk.gen';

export const PasswordChangeForm = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const changeMutation = useMutation({
    mutationFn: async (data: { current_password: string; new_password: string }) => {
      const response = await changePasswordApiV1AuthChangePasswordPost({
        body: data,
      });
      return response;
    },
    onSuccess: () => {
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
      setError(error.response?.data?.detail || 'Failed to change password');
      setSuccess(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    changeMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Password changed successfully!
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Current Password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Enter current password"
          disabled={changeMutation.isPending}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Enter new password"
          disabled={changeMutation.isPending}
        />
        <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Confirm New Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Confirm new password"
          disabled={changeMutation.isPending}
        />
      </div>

      <button
        type="submit"
        disabled={changeMutation.isPending}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {changeMutation.isPending ? 'Changing Password...' : 'Change Password'}
      </button>
    </form>
  );
};
