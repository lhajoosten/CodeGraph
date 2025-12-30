import { useState } from 'react';
import { useChangePassword } from '@/hooks/api';

export const PasswordChangeForm = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const changeMutation = useChangePassword({
    onSuccess: () => {
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: () => {
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
      body: {
        current_password: currentPassword,
        new_password: newPassword,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className={`
            border-error bg-error/10 text-error rounded-lg border p-3 text-sm
          `}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className={`
            border-success bg-success/10 text-success rounded-lg border p-3
            text-sm
          `}
        >
          Password changed successfully!
        </div>
      )}

      <div>
        <label className="text-text-secondary-lum mb-1 block text-sm font-medium">
          Current Password
        </label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={`
            border-border-steel bg-bg-elevated-lum text-text-primary-lum w-full rounded-lg border px-4 py-2
            focus:border-transparent focus:ring-2 focus:ring-brand-cyan
            focus:outline-none
          `}
          placeholder="Enter current password"
          disabled={changeMutation.isPending}
        />
      </div>

      <div>
        <label className="text-text-secondary-lum mb-1 block text-sm font-medium">
          New Password
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={`
            border-border-steel bg-bg-elevated-lum text-text-primary-lum w-full rounded-lg border px-4 py-2
            focus:border-transparent focus:ring-2 focus:ring-brand-cyan
            focus:outline-none
          `}
          placeholder="Enter new password"
          disabled={changeMutation.isPending}
        />
        <p className="text-text-muted-lum mt-1 text-xs">Must be at least 8 characters</p>
      </div>

      <div>
        <label className="text-text-secondary-lum mb-1 block text-sm font-medium">
          Confirm New Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={`
            border-border-steel bg-bg-elevated-lum text-text-primary-lum w-full rounded-lg border px-4 py-2
            focus:border-transparent focus:ring-2 focus:ring-brand-cyan
            focus:outline-none
          `}
          placeholder="Confirm new password"
          disabled={changeMutation.isPending}
        />
      </div>

      <button
        type="submit"
        disabled={changeMutation.isPending}
        className={`
          w-full rounded-lg bg-brand-cyan px-4 py-2 font-medium text-white
          transition
          hover:shadow-[0_0_16px_rgba(34,211,238,0.5)]
          disabled:cursor-not-allowed disabled:opacity-50
        `}
      >
        {changeMutation.isPending ? 'Changing Password...' : 'Change Password'}
      </button>
    </form>
  );
};
