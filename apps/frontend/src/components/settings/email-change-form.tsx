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
      <div className="border-border-steel bg-bg-elevated-lum rounded-lg border p-4">
        <p className="text-text-secondary-lum text-sm">Current email</p>
        <p className="text-text-primary-lum font-medium">{user?.email}</p>
      </div>

      {success ? (
        <div className="border-success bg-success/10 rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <svg
              className="text-success h-5 w-5"
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
              <p className="text-success font-medium">Verification email sent!</p>
              <p className="text-text-secondary-lum mt-1 text-sm">
                We&apos;ve sent a verification email to <strong>{newEmail}</strong>. Please check
                your inbox and click the link to confirm your new email address.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSuccess(false)}
            className={`
              text-success mt-4 text-sm font-medium
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
                border-error bg-error/10 text-error rounded-lg border p-3
                text-sm
              `}
            >
              {error}
            </div>
          )}

          <div>
            <label className="text-text-secondary-lum mb-1 block text-sm font-medium">
              New Email Address
            </label>
            <input
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={`
                border-border-steel bg-bg-elevated-lum text-text-primary-lum w-full rounded-lg border px-4 py-2
                focus:border-transparent focus:ring-2 focus:ring-brand-cyan
                focus:outline-none
              `}
              placeholder="Enter new email address"
              disabled={changeMutation.isPending}
            />
          </div>

          <div>
            <label className="text-text-secondary-lum mb-1 block text-sm font-medium">
              Confirm with Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`
                border-border-steel bg-bg-elevated-lum text-text-primary-lum w-full rounded-lg border px-4 py-2
                focus:border-transparent focus:ring-2 focus:ring-brand-cyan
                focus:outline-none
              `}
              placeholder="Enter your password"
              disabled={changeMutation.isPending}
            />
            <p className="text-text-muted-lum mt-1 text-xs">
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
