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

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { client } from '@/openapi/client.gen';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';

interface TwoFactorSetupResponse {
  qr_code: string;
  secret: string;
}

interface TwoFactorEnableResponse {
  backup_codes: string[];
}

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
  // State management
  const [step, setStep] = useState<SetupStep>('qr');
  const [otp, setOtp] = useState('');
  const [codesConfirmed, setCodesConfirmed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Fetch QR code and secret on mount
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

  // Handlers
  const verifyOTP = async () => {
    if (otp.length !== 6) return;
    enableMutation.mutate(otp);
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
    qrData: setupQuery.data,
    backupCodes: enableMutation.data?.backup_codes || [],

    // Loading states
    isLoading: setupQuery.isLoading,
    isVerifying: enableMutation.isPending,
    error: setupQuery.error || enableMutation.error,

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
