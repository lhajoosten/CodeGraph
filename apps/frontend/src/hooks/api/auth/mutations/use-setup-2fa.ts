/**
 * Setup two-factor authentication hook.
 *
 * Manages the complete 2FA setup flow:
 * - Step 1: Fetch QR code for scanning
 * - Step 2: Verify 6-digit code from authenticator
 * - Step 3: Display and manage backup codes
 *
 * Handles all state management, API calls, and user feedback.
 *
 * @returns {Object} Setup 2FA state and handlers
 *
 * @example
 * const {
 *   step,
 *   otp,
 *   codesConfirmed,
 *   qrData,
 *   backupCodes,
 *   isLoading,
 *   isVerifying,
 *   error,
 *   setStep,
 *   setOtp,
 *   setCodesConfirmed,
 *   verifyOTP,
 *   downloadCodes,
 * } = useSetup2FA();
 */

import { useState, useEffect } from 'react';
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
}

export const useSetup2FA = (): UseSetup2FAReturn => {
  const navigate = useNavigate();
  const { setTwoFactorStatus } = useAuthStore();

  // State management
  const [step, setStep] = useState<SetupStep>('qr');
  const [otp, setOtp] = useState('');
  const [codesConfirmed, setCodesConfirmed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Setup 2FA - generates QR code and stores secret on server
  const setupMutation = useMutation({
    ...setupTwoFactorApiV1TwoFactorSetupPostMutation(),
    onError: (error) => {
      // If 2FA is already enabled, redirect to verify page
      // This can happen if backend redirected to setup-2fa with oauth=true
      // but user already has 2FA from a previous session
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes('already enabled') || errorMessage.includes('already')) {
        setTwoFactorStatus(true, false, false);
        navigate({
          to: '/verify-2fa',
          search: { oauth: 'true' },
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

  // Auto-trigger setup on component mount to fetch QR code
  useEffect(() => {
    setupMutation.mutate({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handlers
  const verifyOTP = async () => {
    if (otp.length !== 6) return;
    enableMutation.mutate({ body: { code: otp } });
  };

  const downloadCodes = () => {
    const backupCodes = enableMutation.data?.backup_codes || [];
    const content = `CodeGraph Backup Codes\n\nGenerated: ${new Date().toISOString()}\n\n${backupCodes.join('\n')}\n\nKeep these codes safe and secure!`;
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`);
    element.setAttribute('download', 'codegraph-backup-codes.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

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
  };
};

export type UseSetup2FAOptions = ReturnType<typeof useSetup2FA>;
