import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowPathIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { OTPInput } from './otp-input';
import { AuthInput } from './auth-input';
import { z } from 'zod';
import { useTranslationNamespace } from '@/hooks/useTranslation';
import { useVerify2FA } from '@/hooks/api/auth/mutations/use-verify-2fa';

const backupCodeSchema = z.object({
  backupCode: z
    .string()
    .min(8, 'Backup code must be at least 8 characters')
    .max(12, 'Backup code is too long'),
});

type BackupCodeData = z.infer<typeof backupCodeSchema>;

interface Verify2FAFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Verify 2FA Form - Two-factor authentication verification during login
 * - Default: 6-digit OTP code input
 * - Alternative: Backup code entry (8 characters)
 * - Toggle between OTP and backup code modes
 * - Error handling for invalid codes
 */
export function Verify2FAForm({ onSuccess, onCancel }: Verify2FAFormProps) {
  const { t } = useTranslationNamespace('auth');
  const verify2FAMutation = useVerify2FA();
  const [useBackupCode, setUseBackupCode] = useState(false);

  // Backup code form
  const {
    control,
    register: registerBackupCode,
    handleSubmit,
    formState: { errors: backupCodeErrors, isSubmitting },
  } = useForm<BackupCodeData>({
    resolver: zodResolver(backupCodeSchema),
    mode: 'onBlur',
  });

  const [otp, setOtp] = useState('');
  const backupCodeValue = useWatch({ control, name: 'backupCode' });

  const handleVerifyOTP = (code?: string) => {
    const codeToVerify = code || otp;
    if (codeToVerify.length !== 6) return;

    verify2FAMutation.mutate(
      { body: { code: codeToVerify } },
      {
        onSuccess: () => {
          onSuccess?.();
        },
        onError: () => {
          // Clear the OTP input on error so user can try again
          setOtp('');
        },
      }
    );
  };

  const onBackupCodeSubmit = (data: BackupCodeData) => {
    verify2FAMutation.mutate(
      { body: { code: data.backupCode } },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-text-primary-lum mb-2 text-lg font-semibold">
          {t('luminous.twoFactor.verify.title')}
        </h3>
        <p className="text-text-secondary-lum text-sm">{t('luminous.twoFactor.verify.subtitle')}</p>
      </div>

      {/* Error Message */}
      {verify2FAMutation.error && (
        <div className="border-error/30 bg-error/10 rounded-lg border p-3">
          <p className="text-error flex items-center gap-2 text-sm">
            <ExclamationCircleIcon className="h-4 w-4" />
            {verify2FAMutation.error instanceof Error
              ? verify2FAMutation.error.message
              : 'Verification failed'}
          </p>
        </div>
      )}

      {/* OTP Verification */}
      {!useBackupCode && (
        <div className="space-y-4">
          <OTPInput
            length={6}
            value={otp}
            onChange={(val) => {
              setOtp(val);
              // Reset error state when user starts typing again
              if (verify2FAMutation.isError) {
                verify2FAMutation.reset();
              }
            }}
            onComplete={handleVerifyOTP}
            autoSubmit
            disabled={verify2FAMutation.isPending}
            error={verify2FAMutation.isError}
            label={t('luminous.twoFactor.verify.codeLabel')}
            hint={t('luminous.twoFactor.verify.codeHint')}
          />

          <button
            onClick={() => handleVerifyOTP()}
            disabled={otp.length !== 6 || verify2FAMutation.isPending}
            className="bg-brand-teal shadow-glow-teal flex w-full items-center justify-center gap-2 rounded-lg py-3 font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(45,212,191,0.6)] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {verify2FAMutation.isPending ? (
              <>
                <ArrowPathIcon className="h-[18px] w-[18px] animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-[18px] w-[18px]" />
                {t('luminous.twoFactor.verify.submit')}
              </>
            )}
          </button>
        </div>
      )}

      {/* Backup Code Verification */}
      {useBackupCode && (
        <form onSubmit={handleSubmit(onBackupCodeSubmit)} className="space-y-4">
          <AuthInput
            label="Backup Code"
            type="text"
            placeholder="e.g., A1B2C3D4E5F6"
            disabled={verify2FAMutation.isPending}
            error={backupCodeErrors.backupCode?.message}
            {...registerBackupCode('backupCode')}
            className="uppercase"
          />

          <button
            type="submit"
            disabled={!backupCodeValue || verify2FAMutation.isPending || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-cyan py-3 font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {verify2FAMutation.isPending || isSubmitting ? (
              <>
                <ArrowPathIcon className="h-[18px] w-[18px] animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-[18px] w-[18px]" />
                {t('luminous.twoFactor.verify.submit')}
              </>
            )}
          </button>
        </form>
      )}

      {/* Toggle between OTP and Backup Code */}
      <div className="border-border-steel border-t pt-2">
        <button
          type="button"
          onClick={() => setUseBackupCode(!useBackupCode)}
          disabled={verify2FAMutation.isPending}
          className="hover:text-brand-teal w-full py-2 text-sm font-medium text-brand-cyan transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {useBackupCode
            ? t('luminous.twoFactor.verify.useAuthenticator')
            : t('luminous.twoFactor.verify.useBackupCode')}
        </button>
      </div>

      {/* Cancel Button */}
      {onCancel && (
        <button
          onClick={onCancel}
          disabled={verify2FAMutation.isPending}
          className="border-border-steel bg-bg-elevated-lum text-text-primary-lum w-full rounded-lg border py-3 font-semibold transition-all hover:bg-bg-steel disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('luminous.twoFactor.verify.cancel')}
        </button>
      )}

      {/* Helper Text */}
      <p className="text-text-muted-lum text-center text-xs">
        {t('luminous.twoFactor.verify.support')}
      </p>
    </div>
  );
}
