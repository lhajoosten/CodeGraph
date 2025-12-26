/**
 * Reusable Two-Factor Authentication Setup Wizard
 *
 * Multi-step wizard for setting up 2FA:
 * 1. Display QR code for scanning
 * 2. Verify 6-digit code from authenticator
 * 3. Display and save backup codes
 *
 * Can be used in multiple contexts:
 * - Post-email verification (required flow)
 * - Login with mandatory 2FA
 * - User settings (optional setup)
 */

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ClipboardIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { client } from '@/openapi/client.gen';
import { addToast } from '@/lib/toast';

export interface SetupWizardProps {
  /** Called when setup is completed successfully */
  onSuccess: () => void;
  /** Called when user cancels (optional) */
  onCancel?: () => void;
  /** Whether this is a required setup or optional */
  isRequired?: boolean;
  /** Custom title for the wizard */
  title?: string;
  /** Custom subtitle */
  subtitle?: string;
}

interface TwoFactorSetupResponse {
  qr_code: string;
  secret: string;
}

interface TwoFactorEnableResponse {
  backup_codes: string[];
}

type Step = 'qr' | 'verify' | 'backup';

export function TwoFactorSetupWizard({
  onSuccess,
  onCancel,
  isRequired = false,
  title = 'Enable Two-Factor Authentication',
  subtitle = 'Secure your account with 2FA',
}: SetupWizardProps) {
  const [step, setStep] = useState<Step>('qr');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodesConfirmed, setBackupCodesConfirmed] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch QR code and secret for 2FA setup
  const setupQuery = useQuery({
    queryKey: ['setupTwoFactor'],
    queryFn: async () => {
      const response = await client.post<TwoFactorSetupResponse>({
        url: '/api/v1/two-factor/setup',
      });
      return response.data;
    },
    retry: 1,
  });

  // Enable 2FA with verification code
  const enableMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await client.post<TwoFactorEnableResponse>({
        url: '/api/v1/two-factor/enable',
        body: { code },
      });
      return response.data;
    },
    onSuccess: () => {
      setStep('backup');
    },
    onError: () => {
      addToast({
        title: 'Verification Failed',
        description: 'Invalid code. Please try again.',
        color: 'danger',
      });
      setVerificationCode('');
    },
  });

  const handleVerifyCode = () => {
    if (verificationCode.length !== 6) {
      addToast({
        title: 'Invalid Code',
        description: 'Please enter a 6-digit code.',
        color: 'warning',
      });
      return;
    }

    enableMutation.mutate(verificationCode);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDownloadCodes = () => {
    if (!enableMutation.data?.backup_codes) return;

    const content = `CodeGraph Backup Codes\n\nGenerated: ${new Date().toISOString()}\n\n${enableMutation.data.backup_codes.join('\n')}\n\nKeep these codes safe and secure!`;
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`);
    element.setAttribute('download', 'codegraph-backup-codes.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleComplete = () => {
    if (!backupCodesConfirmed) {
      addToast({
        title: 'Confirm Backup Codes',
        description: 'Please confirm that you have saved your backup codes.',
        color: 'warning',
      });
      return;
    }

    addToast({
      title: '2FA Enabled',
      description: 'Two-factor authentication has been successfully enabled!',
      color: 'success',
    });

    onSuccess();
  };

  if (setupQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <ArrowPathIcon className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Preparing your 2FA setup...</p>
        </div>
      </div>
    );
  }

  if (setupQuery.isError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <ExclamationCircleIcon className="mx-auto mb-4 h-8 w-8 text-red-500" />
          <p className="text-sm text-gray-600">Failed to load 2FA setup. Please try again.</p>
        </div>
      </div>
    );
  }

  const qrData = setupQuery.data;
  const backupCodes = enableMutation.data?.backup_codes || [];

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600">{subtitle}</p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8 flex gap-2">
        {(['qr', 'verify', 'backup'] as const).map((s, index) => {
          const isActive = step === s;
          const isCompleted =
            (['qr', 'verify'].includes(s) && step === 'backup') ||
            (s === 'qr' && ['verify', 'backup'].includes(step));

          return (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                  isActive || isCompleted ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {isCompleted ? <CheckCircleIcon className="h-5 w-5" /> : index + 1}
              </div>
              {index < 2 && (
                <div
                  className={`h-1 flex-1 rounded-full transition-all ${
                    isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: QR Code */}
      {step === 'qr' && qrData && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Step 1: Scan QR Code</h3>
            <p className="mb-4 text-sm text-gray-600">
              Use an authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
              to scan this QR code:
            </p>
          </div>

          <div className="flex justify-center rounded-lg border border-gray-200 bg-white p-4">
            <img src={qrData.qr_code} alt="2FA QR Code" className="h-48 w-48" />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700">Manual Entry (if QR scan fails):</p>
            <div className="rounded border border-gray-200 bg-gray-50 p-3">
              <code className="font-mono text-xs break-all text-gray-900">{qrData.secret}</code>
            </div>
          </div>

          <button
            onClick={() => setStep('verify')}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
          >
            Next: Verify Code
          </button>
        </div>
      )}

      {/* Step 2: Verify Code */}
      {step === 'verify' && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Step 2: Verify Your Code</h3>
            <p className="text-sm text-gray-600">
              Enter the 6-digit code from your authenticator app:
            </p>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-center font-mono text-2xl tracking-widest focus:border-blue-600 focus:outline-none"
              autoFocus
            />
            <p className="text-xs text-gray-500">{verificationCode.length}/6 digits entered</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('qr')}
              disabled={enableMutation.isPending}
              className="flex-1 rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-900 transition hover:bg-gray-300 disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleVerifyCode}
              disabled={enableMutation.isPending || verificationCode.length !== 6}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {enableMutation.isPending ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Backup Codes */}
      {step === 'backup' && (
        <div className="space-y-6">
          <div className="text-center">
            <CheckCircleIcon className="mx-auto mb-4 h-12 w-12 text-green-500" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Step 3: Save Backup Codes</h3>
            <p className="text-sm text-gray-600">
              Save these backup codes in a safe place. You can use them to access your account if
              you lose your authenticator:
            </p>
          </div>

          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
            {backupCodes.map((code, index) => (
              <div
                key={index}
                className="group flex items-center justify-between rounded border border-gray-200 bg-white p-3 transition hover:bg-blue-50"
              >
                <code className="font-mono text-sm text-gray-900">{code}</code>
                <button
                  onClick={() => handleCopyCode(code)}
                  className="opacity-0 transition group-hover:opacity-100"
                  title="Copy to clipboard"
                >
                  <ClipboardIcon
                    className={`h-4 w-4 transition ${
                      copiedCode === code ? 'text-green-500' : 'text-gray-400'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleDownloadCodes}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-900 transition hover:bg-gray-200"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Download Backup Codes
          </button>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={backupCodesConfirmed}
              onChange={(e) => setBackupCodesConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              I have saved my backup codes in a safe place and understand that I will lose access to
              my account if I lose both my authenticator app and backup codes.
            </span>
          </label>

          <button
            onClick={handleComplete}
            disabled={!backupCodesConfirmed}
            className="w-full rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            Complete Setup
          </button>
        </div>
      )}

      {/* Cancel Button (if not required) */}
      {!isRequired && onCancel && (
        <button
          onClick={onCancel}
          className="mt-6 w-full rounded-lg px-4 py-2 font-medium text-gray-600 transition hover:bg-gray-100"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
