/**
 * Setup two-factor authentication hook.
 *
 * Manages the complete 2FA setup flow:
 * - Step 1: Fetch QR code for scanning (auto-fetched on mount)
 * - Step 2: Verify 6-digit code from authenticator
 * - Step 3: Display and manage backup codes
 *
 * Handles all state management, API calls, and user feedback.
 *
 * @param options - Hook options
 * @param options.autoStart - Whether to auto-start the setup. Default: true
 * @returns {Object} Setup 2FA state and handlers
 *
 * @example
 * // Auto-fetches QR code on mount (default behavior)
 * const { step, qrData, isLoading, verifyOTP } = useSetup2FA();
 *
 * @example
 * // Manual start
 * const { qrData, isLoading, startSetup } = useSetup2FA({ autoStart: false });
 * // Later: startSetup();
 */

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  setupTwoFactorApiV1TwoFactorSetupPostMutation,
  enableTwoFactorApiV1TwoFactorEnablePostMutation,
} from '@/openapi/@tanstack/react-query.gen';
import type { TwoFactorSetupResponse } from '@/openapi/types.gen';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';
import { useAuthStore } from '@/stores/auth-store';

export type SetupStep = 'qr' | 'verify' | 'backup';

export interface UseSetup2FAOptions {
  /** Whether to auto-start the setup on mount. Default: true */
  autoStart?: boolean;
}

export interface UseSetup2FAReturn {
  // State
  step: SetupStep;
  otp: string;
  codesConfirmed: boolean;
  copied: string | null;
  qrData: TwoFactorSetupResponse | undefined;
  backupCodes: string[];

  // Loading states
  isLoading: boolean;
  isVerifying: boolean;
  error: Error | null;

  // Handlers
  setStep: (step: SetupStep) => void;
  setOtp: (otp: string) => void;
  setCodesConfirmed: (confirmed: boolean) => void;
  setCopied: (code: string | null) => void;
  verifyOTP: () => void;
  downloadCodes: () => void;
  copyCode: (code: string) => void;
  startSetup: () => void;
}

export const useSetup2FA = (options: UseSetup2FAOptions = {}): UseSetup2FAReturn => {
  const { autoStart = true } = options;
  const navigate = useNavigate();
  const { setTwoFactorStatus } = useAuthStore();

  // State management
  const [step, setStep] = useState<SetupStep>('qr');
  const [otp, setOtp] = useState('');
  const [codesConfirmed, setCodesConfirmed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  // Track if we've auto-started to prevent double calls
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  // Setup 2FA - generates QR code and stores secret on server
  const setupMutation = useMutation({
    ...setupTwoFactorApiV1TwoFactorSetupPostMutation(),
    onError: (error) => {
      // If 2FA is already enabled, redirect to verify page
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes('already enabled') || errorMessage.includes('already')) {
        setTwoFactorStatus(true, false, false);
        navigate({
          to: '/verify-2fa',
          search: { oauth: true, provider: undefined, from: 'setup-redirect' },
        });
      }
    },
  });

  // Enable 2FA with verification code
  const enableMutation = useMutation({
    ...enableTwoFactorApiV1TwoFactorEnablePostMutation(),
    onSuccess: () => {
      setStep('backup');
      addToast({
        title: '2FA Code Verified',
        description: 'Your authenticator has been successfully verified.',
        color: 'success',
      });
    },
    onError: (error) => {
      addToast({
        title: 'Verification Failed',
        description: getErrorMessage(error),
        color: 'danger',
      });
      setOtp('');
    },
  });

  // Auto-start: trigger setup once on first render if enabled
  // Using state update to trigger mutation avoids ref access during render
  if (
    autoStart &&
    !hasAutoStarted &&
    !setupMutation.isPending &&
    !setupMutation.data &&
    !setupMutation.error
  ) {
    setHasAutoStarted(true);
    // Schedule mutation for next microtask to avoid render-time side effects
    queueMicrotask(() => {
      setupMutation.mutate({});
    });
  }

  // Handlers
  const startSetup = useCallback(() => {
    setupMutation.mutate({});
  }, [setupMutation]);

  const verifyOTP = useCallback(() => {
    if (otp.length !== 6) return;
    enableMutation.mutate({ body: { code: otp } });
  }, [otp, enableMutation]);

  const downloadCodes = useCallback(() => {
    const backupCodes = enableMutation.data?.backup_codes || [];
    const content = `CodeGraph Backup Codes\n\nGenerated: ${new Date().toISOString()}\n\n${backupCodes.join('\n')}\n\nKeep these codes safe and secure!`;
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`);
    element.setAttribute('download', 'codegraph-backup-codes.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }, [enableMutation.data?.backup_codes]);

  const copyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  return {
    // State
    step,
    otp,
    codesConfirmed,
    copied,
    qrData: setupMutation.data,
    backupCodes: enableMutation.data?.backup_codes || [],

    // Loading states
    isLoading: setupMutation.isPending,
    isVerifying: enableMutation.isPending,
    error: setupMutation.error || enableMutation.error,

    // Handlers
    setStep,
    setOtp,
    setCodesConfirmed,
    setCopied,
    verifyOTP,
    downloadCodes,
    copyCode,
    startSetup,
  };
};
