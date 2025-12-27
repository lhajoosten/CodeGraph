import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { client } from '@/openapi/client.gen';

interface TwoFactorStatus {
  enabled: boolean;
  backup_codes_remaining?: number;
}

export const TwoFactorSettings = () => {
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Check 2FA status
  // Note: 2FA endpoints are not yet implemented in the backend
  const statusQuery = useQuery({
    queryKey: ['two-factor-status'],
    queryFn: async () => {
      const response = await client.get<TwoFactorStatus>({
        url: '/api/v1/two-factor/status',
      });
      return response.data;
    },
    retry: false,
  });

  // Setup 2FA mutation
  const setupMutation = useMutation({
    mutationFn: async () => {
      const response = await client.post<{ qr_code: string; secret: string }>({
        url: '/api/v1/two-factor/setup',
      });
      return response.data as { qr_code: string; secret: string } | undefined;
    },
    onSuccess: (data) => {
      if (data) {
        setQrCode(data.qr_code);
        setShowSetup(true);
        setError('');
      }
    },
    onError: () => {
      setError('Failed to start 2FA setup');
    },
  });

  // Enable 2FA mutation
  const enableMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await client.post<{ backup_codes: string[] }>({
        url: '/api/v1/two-factor/enable',
        body: { code },
      });
      return response.data as { backup_codes: string[] } | undefined;
    },
    onSuccess: (data) => {
      if (data) {
        setBackupCodes(data.backup_codes);
        setShowSetup(false);
        setVerificationCode('');
        statusQuery.refetch();
      }
    },
    onError: () => {
      setError('Invalid verification code');
    },
  });

  // Disable 2FA mutation
  const disableMutation = useMutation({
    mutationFn: async (password: string) => {
      await client.post({
        url: '/api/v1/two-factor/disable',
        body: { password },
      });
    },
    onSuccess: () => {
      setShowDisable(false);
      setPassword('');
      statusQuery.refetch();
    },
    onError: () => {
      setError('Failed to disable 2FA. Check your password.');
    },
  });

  // Regenerate backup codes
  const regenerateMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await client.post<{ backup_codes: string[] }>({
        url: '/api/v1/two-factor/regenerate-backup-codes',
        body: { password },
      });
      return response.data as { backup_codes: string[] } | undefined;
    },
    onSuccess: (data) => {
      if (data) {
        setBackupCodes(data.backup_codes);
        setPassword('');
      }
    },
    onError: () => {
      setError('Failed to regenerate backup codes');
    },
  });

  // Show backup codes modal
  if (backupCodes.length > 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-brand-lime bg-bg-elevated-lum p-4">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-brand-lime"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="font-medium text-brand-lime">Save your backup codes!</p>
              <p className="mt-1 text-sm text-text-secondary-lum">
                Store these codes in a safe place. You can use them to access your account if you
                lose your authenticator.
              </p>
            </div>
          </div>
        </div>

        <div
          className={`
            grid grid-cols-2 gap-2 rounded-lg bg-bg-steel p-4 font-mono text-sm
          `}
        >
          {backupCodes.map((code, index) => (
            <div
              key={index}
              className="rounded bg-bg-elevated-lum p-2 text-center text-text-primary-lum"
            >
              {code}
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            navigator.clipboard.writeText(backupCodes.join('\n'));
          }}
          className={`
            w-full rounded-lg border border-border-steel px-4 py-2 font-medium
            text-text-primary-lum transition
            hover:bg-bg-elevated-lum
          `}
        >
          Copy to clipboard
        </button>

        <button
          onClick={() => setBackupCodes([])}
          className={`
            w-full rounded-lg bg-brand-cyan px-4 py-2 font-medium text-white
            transition
            hover:shadow-[0_0_16px_rgba(34,211,238,0.5)]
          `}
        >
          I&apos;ve saved my backup codes
        </button>
      </div>
    );
  }

  // Check if 2FA feature is available
  if (statusQuery.isError) {
    return (
      <div
        className={`
          rounded-lg border border-border-steel bg-bg-elevated-lum p-6 text-center
        `}
      >
        <svg
          className="mx-auto h-12 w-12 text-text-muted-lum"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-text-primary-lum">
          Two-Factor Authentication
        </h3>
        <p className="mt-2 text-sm text-text-secondary-lum">
          Two-factor authentication is not yet available. This feature is coming soon!
        </p>
      </div>
    );
  }

  if (statusQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div
          className={`
            h-8 w-8 animate-spin rounded-full border-b-2 border-brand-cyan
          `}
        ></div>
      </div>
    );
  }

  const isEnabled = statusQuery.data?.enabled ?? false;

  // Setup flow
  if (showSetup && qrCode) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-secondary-lum">
          Scan this QR code with your authenticator app (like Google Authenticator or Authy):
        </p>

        <div className="flex justify-center rounded-lg bg-bg-elevated-lum p-4">
          <img src={qrCode} alt="2FA QR Code" className="h-48 w-48" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary-lum">
            Enter verification code
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className={`
              w-full rounded-lg border border-border-default-lum bg-bg-elevated-lum px-4 py-2 text-center
              font-mono text-lg tracking-widest text-text-primary-lum
              focus:border-transparent focus:ring-2 focus:ring-brand-cyan
              focus:outline-none
            `}
            placeholder="000000"
            maxLength={6}
          />
        </div>

        {error && (
          <div
            className={`
              rounded-lg border border-error bg-bg-elevated-lum p-3 text-sm
              text-error
            `}
          >
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowSetup(false);
              setQrCode(null);
              setVerificationCode('');
            }}
            className={`
              flex-1 rounded-lg border border-border-steel px-4 py-2 font-medium
              text-text-primary-lum transition
              hover:bg-bg-elevated-lum
            `}
          >
            Cancel
          </button>
          <button
            onClick={() => enableMutation.mutate(verificationCode)}
            disabled={verificationCode.length !== 6 || enableMutation.isPending}
            className={`
              flex-1 rounded-lg bg-brand-cyan px-4 py-2 font-medium text-white
              transition
              hover:shadow-[0_0_16px_rgba(34,211,238,0.5)]
              disabled:cursor-not-allowed disabled:opacity-50
            `}
          >
            {enableMutation.isPending ? 'Verifying...' : 'Enable 2FA'}
          </button>
        </div>
      </div>
    );
  }

  // Disable confirmation
  if (showDisable) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-secondary-lum">
          Enter your password to disable two-factor authentication:
        </p>

        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`
            w-full rounded-lg border border-border-default-lum bg-bg-elevated-lum px-4 py-2 text-text-primary-lum
            focus:border-transparent focus:ring-2 focus:ring-brand-cyan
            focus:outline-none
          `}
          placeholder="Enter your password"
        />

        {error && (
          <div
            className={`
              rounded-lg border border-error bg-bg-elevated-lum p-3 text-sm
              text-error
            `}
          >
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowDisable(false);
              setPassword('');
            }}
            className={`
              flex-1 rounded-lg border border-border-steel px-4 py-2 font-medium
              text-text-primary-lum transition
              hover:bg-bg-elevated-lum
            `}
          >
            Cancel
          </button>
          <button
            onClick={() => disableMutation.mutate(password)}
            disabled={!password || disableMutation.isPending}
            className={`
              flex-1 rounded-lg bg-error px-4 py-2 font-medium text-white
              transition
              hover:shadow-[0_0_16px_rgba(239,68,68,0.5)]
              disabled:cursor-not-allowed disabled:opacity-50
            `}
          >
            {disableMutation.isPending ? 'Disabling...' : 'Disable 2FA'}
          </button>
        </div>
      </div>
    );
  }

  // Main view
  return (
    <div className="space-y-4">
      <div
        className={`
          flex items-center justify-between rounded-lg p-4
          ${
            isEnabled
              ? 'border border-success bg-bg-elevated-lum'
              : `
            border border-border-steel bg-bg-elevated-lum
          `
          }
        `}
      >
        <div className="flex items-center gap-3">
          <div
            className={`
              rounded-full p-2
              ${isEnabled ? 'bg-bg-steel' : `bg-bg-steel`}
            `}
          >
            <svg
              className={`
                h-5 w-5
                ${isEnabled ? 'text-success' : `text-text-muted-lum`}
              `}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <p
              className={`
                font-medium
                ${isEnabled ? 'text-success' : `text-text-primary-lum`}
              `}
            >
              {isEnabled ? 'Enabled' : 'Disabled'}
            </p>
            <p className="text-sm text-text-secondary-lum">
              {isEnabled
                ? 'Your account is protected with 2FA'
                : 'Add an extra layer of security to your account'}
            </p>
          </div>
        </div>
      </div>

      {isEnabled ? (
        <div className="space-y-3">
          <button
            onClick={() => setShowDisable(true)}
            className={`
              w-full rounded-lg border border-error px-4 py-2 font-medium
              text-error transition
              hover:bg-bg-elevated-lum
            `}
          >
            Disable Two-Factor Authentication
          </button>
          <button
            onClick={() => {
              const pwd = prompt('Enter your password to regenerate backup codes:');
              if (pwd) regenerateMutation.mutate(pwd);
            }}
            className={`
              w-full rounded-lg border border-border-steel px-4 py-2 font-medium
              text-text-primary-lum transition
              hover:bg-bg-elevated-lum
            `}
          >
            Regenerate Backup Codes
          </button>
        </div>
      ) : (
        <button
          onClick={() => setupMutation.mutate()}
          disabled={setupMutation.isPending}
          className={`
            w-full rounded-lg bg-brand-cyan px-4 py-2 font-medium text-white
            transition
            hover:shadow-[0_0_16px_rgba(34,211,238,0.5)]
            disabled:cursor-not-allowed disabled:opacity-50
          `}
        >
          {setupMutation.isPending ? 'Setting up...' : 'Enable Two-Factor Authentication'}
        </button>
      )}
    </div>
  );
};
