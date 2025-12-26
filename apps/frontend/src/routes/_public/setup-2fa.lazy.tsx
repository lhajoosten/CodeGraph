import { createLazyFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addToast } from '@/lib/toast';
import { useAuthStore } from '@/stores/auth-store';
import { getErrorMessage } from '@/hooks/api/utils';

export const Route = createLazyFileRoute('/_public/setup-2fa')({
  component: SetupTwoFactorPage,
});

interface TwoFactorSetupResponse {
  qr_code: string;
  secret: string;
}

interface TwoFactorEnableResponse {
  backup_codes: string[];
}

function SetupTwoFactorPage() {
  const navigate = useNavigate();
  const { setTwoFactorStatus } = useAuthStore();
  const [code, setCode] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch 2FA setup (QR code and secret)
  const setupQuery = useQuery({
    queryKey: ['setupTwoFactor'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/two-factor/setup`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to setup 2FA');
      }

      return response.json() as Promise<TwoFactorSetupResponse>;
    },
  });

  // Enable 2FA with the verification code
  const enableMutation = useMutation({
    mutationFn: async (verificationCode: string) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/two-factor/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          code: verificationCode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to enable 2FA');
      }

      return response.json() as Promise<TwoFactorEnableResponse>;
    },
    onSuccess: (data) => {
      setBackupCodes(data.backup_codes);
      setStep('backup');
      addToast({
        title: '2FA Enabled',
        description: 'Two-factor authentication has been enabled successfully.',
        color: 'success',
      });
    },
    onError: (error) => {
      addToast({
        title: 'Verification Failed',
        description: getErrorMessage(error),
        color: 'danger',
      });
    },
  });

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = code.replace(/\s/g, '');
    if (!/^\d{6}$/.test(cleanCode)) {
      addToast({
        title: 'Invalid Code',
        description: 'Please enter a valid 6-digit code',
        color: 'warning',
      });
      return;
    }

    enableMutation.mutate(cleanCode);
  };

  const handleCopyCode = (codeValue: string) => {
    navigator.clipboard.writeText(codeValue);
    setCopiedCode(codeValue);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDownloadCodes = () => {
    const content = `Two-Factor Authentication Backup Codes\n\nSave these codes in a safe place. Each code can be used once if you lose access to your authenticator app.\n\n${backupCodes.join('\n')}\n\nGenerated: ${new Date().toISOString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'codegraph-2fa-backup-codes.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleContinue = async () => {
    // Update 2FA state to indicate setup is complete
    setTwoFactorStatus(true, false, false);

    // Redirect to verification page
    navigate({ to: '/verify-2fa' });
  };

  if (setupQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
        <div className="text-center text-white">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-white"></div>
          <p>Setting up 2FA...</p>
        </div>
      </div>
    );
  }

  if (setupQuery.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
          <h2 className="mb-4 text-xl font-semibold text-red-600">Error</h2>
          <p className="text-gray-600">{getErrorMessage(setupQuery.error)}</p>
          <Button onClick={() => setupQuery.refetch()} className="mt-4 w-full">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const setup = setupQuery.data;
  if (!setup) return null;

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
          <p className="text-blue-100">Set up Two-Factor Authentication</p>
        </div>

        {/* Card */}
        <div className="space-y-6 rounded-lg bg-white p-8 shadow-xl">
          {step === 'setup' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-900">Scan QR Code</h2>
                <p className="text-sm text-gray-600">
                  Scan this QR code with your authenticator app (Google Authenticator, Microsoft
                  Authenticator, Authy, etc.)
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center rounded-lg bg-gray-100 p-4">
                <img src={setup.qr_code} alt="2FA QR Code" className="h-48 w-48" />
              </div>

              {/* Manual Entry Option */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {showSecret ? 'Hide' : "Can't scan?"} Enter manually
                </button>

                {showSecret && (
                  <div className="rounded-lg bg-gray-100 p-4">
                    <p className="mb-2 text-xs text-gray-600">Manual entry key:</p>
                    <code className="rounded bg-gray-200 px-2 py-1 font-mono text-sm break-all">
                      {setup.secret}
                    </code>
                  </div>
                )}
              </div>

              <Button onClick={() => setStep('verify')} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-900">Verify Code</h2>
                <p className="text-sm text-gray-600">
                  Enter the 6-digit code from your authenticator app to confirm setup
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <Input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  disabled={enableMutation.isPending}
                  className="text-center text-lg tracking-widest"
                />

                <Button type="submit" disabled={enableMutation.isPending} className="w-full">
                  {enableMutation.isPending ? 'Verifying...' : 'Verify Code'}
                </Button>
              </form>

              <button
                type="button"
                onClick={() => setStep('setup')}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700"
              >
                Back to QR Code
              </button>
            </div>
          )}

          {step === 'backup' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-900">Save Backup Codes</h2>
                <p className="text-sm text-gray-600">
                  Save these codes in a safe place. Use them if you lose access to your
                  authenticator app.
                </p>
              </div>

              {/* Backup Codes List */}
              <div className="space-y-2">
                {backupCodes.map((backupCode) => (
                  <div
                    key={backupCode}
                    className="flex items-center justify-between rounded-lg bg-gray-100 px-4 py-3"
                  >
                    <code className="font-mono font-semibold text-gray-900">{backupCode}</code>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(backupCode)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {copiedCode === backupCode ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Download Button */}
              <Button variant="secondary" onClick={handleDownloadCodes} className="w-full">
                Download Codes
              </Button>

              {/* Continue Button */}
              <Button onClick={handleContinue} className="w-full">
                I&apos;ve Saved My Codes
              </Button>

              <p className="text-xs text-gray-500">
                Make sure to store these codes in a secure location before continuing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
