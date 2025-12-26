import { createLazyFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addToast } from '@/lib/toast';
import { useAuthStore } from '@/stores/auth-store';
import { getErrorMessage } from '@/hooks/api/utils';

export const Route = createLazyFileRoute('/_public/verify-2fa')({
  component: VerifyTwoFactorPage,
});

function VerifyTwoFactorPage() {
  const navigate = useNavigate();
  const { setTwoFactorStatus, login, user } = useAuthStore();
  const [code, setCode] = useState('');
  const [isBackupCode, setIsBackupCode] = useState(false);

  // Mutation for verifying 2FA code
  const mutation = useMutation({
    mutationFn: async (verificationCode: string) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/verify-2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          code: verificationCode,
          remember_me: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to verify 2FA code');
      }

      return response.json();
    },
    onSuccess: (data) => {
      addToast({
        title: '2FA Verified',
        description: 'You have successfully verified your account.',
        color: 'success',
      });

      // Update 2FA state
      setTwoFactorStatus(true, true, false);

      // Update auth state
      if (user) {
        login({
          id: user.id,
          email: user.email,
          email_verified: data.email_verified,
        });
      }

      // Navigate to dashboard
      navigate({ to: '/' });
    },
    onError: (error) => {
      addToast({
        title: 'Verification Failed',
        description: getErrorMessage(error),
        color: 'danger',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      addToast({
        title: 'Empty Code',
        description: 'Please enter a code',
        color: 'warning',
      });
      return;
    }

    // Validate code format
    const cleanCode = code.replace(/\s/g, '');
    if (isBackupCode) {
      // Backup codes are 8 hex characters
      if (!/^[A-F0-9]{8}$/i.test(cleanCode)) {
        addToast({
          title: 'Invalid Backup Code',
          description: 'Backup codes should be 8 characters (letters and numbers)',
          color: 'warning',
        });
        return;
      }
    } else {
      // TOTP codes are 6 digits
      if (!/^\d{6}$/.test(cleanCode)) {
        addToast({
          title: 'Invalid Code',
          description: 'Please enter a valid 6-digit code',
          color: 'warning',
        });
        return;
      }
    }

    mutation.mutate(cleanCode);
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
        {/* Header */}
        <div className="text-center">
          <h1 className="mb-2 text-4xl font-bold text-white">CodeGraph</h1>
          <p className="text-blue-100">Two-Factor Authentication</p>
        </div>

        {/* Card */}
        <div className="space-y-6 rounded-lg bg-white p-8 shadow-xl">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">Enter your verification code</h2>
            <p className="text-sm text-gray-600">
              {isBackupCode
                ? 'Enter one of your backup codes'
                : 'Enter the 6-digit code from your authenticator app'}
            </p>
          </div>

          {/* Code Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder={isBackupCode ? 'XXXXXXXX' : '000000'}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={isBackupCode ? 8 : 6}
              disabled={mutation.isPending}
              className="text-center text-lg tracking-widest"
            />

            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? 'Verifying...' : 'Verify'}
            </Button>
          </form>

          {/* Toggle between TOTP and backup code */}
          <button
            type="button"
            onClick={() => {
              setCode('');
              setIsBackupCode(!isBackupCode);
            }}
            disabled={mutation.isPending}
            className={`
              w-full text-center text-sm text-blue-600 transition
              hover:text-blue-700 disabled:text-gray-400
            `}
          >
            {isBackupCode ? 'Use authenticator code instead' : 'Use a backup code instead'}
          </button>

          {/* Error message if needed */}
          {mutation.isError && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {mutation.error?.message || 'An error occurred'}
            </div>
          )}
        </div>

        {/* Footer text */}
        <p className="text-center text-sm text-blue-100">
          Having trouble? Contact support at support@codegraph.dev
        </p>
      </div>
    </div>
  );
}
