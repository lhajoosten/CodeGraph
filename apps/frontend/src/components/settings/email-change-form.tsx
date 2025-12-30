import { useState } from 'react';
import { useChangeEmail } from '@/hooks/api';
import { useAuthStore } from '@/stores/auth-store';

export const EmailChangeForm = () => {
  const { user } = useAuthStore();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const changeMutation = useChangeEmail({
    onSuccess: () => {
      setSuccess(true);
      setNewEmail('');
      setPassword('');
      setError('');
    },
    onError: () => {
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
      body: {
        new_email: newEmail,
        password: password,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Current Email Display */}
      <div className="rounded-lg border border-border-primary bg-surface p-4">
        <p className="text-sm text-text-secondary">Current email</p>
        <p className="font-medium text-text-primary">{user?.email}</p>
      </div>

      {success ? (
        <div className="rounded-lg border border-success bg-success/10 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-success"
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
              <p className="font-medium text-success">Verification email sent!</p>
              <p className="mt-1 text-sm text-text-secondary">
                We&apos;ve sent a verification email to <strong>{newEmail}</strong>. Please check
                your inbox and click the link to confirm your new email address.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSuccess(false)}
            className={`
              mt-4 text-sm font-medium text-success
              hover:text-brand-lime
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
                rounded-lg border border-error bg-error/10 p-3 text-sm
                text-error
              `}
            >
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              New Email Address
            </label>
            <input
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={`
                w-full rounded-lg border border-border-primary bg-surface px-4 py-2 text-text-primary
                focus:border-transparent focus:ring-2 focus:ring-brand-cyan
                focus:outline-none
              `}
              placeholder="Enter new email address"
              disabled={changeMutation.isPending}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Confirm with Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`
                w-full rounded-lg border border-border-primary bg-surface px-4 py-2 text-text-primary
                focus:border-transparent focus:ring-2 focus:ring-brand-cyan
                focus:outline-none
              `}
              placeholder="Enter your password"
              disabled={changeMutation.isPending}
            />
            <p className="mt-1 text-xs text-text-muted">
              We need your password to confirm this change
            </p>
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
            {changeMutation.isPending ? 'Sending verification...' : 'Change Email'}
          </button>
        </form>
      )}
    </div>
  );
};
