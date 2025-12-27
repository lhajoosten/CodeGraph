import {
  ClipboardIcon,
  ArrowDownTrayIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useEffect } from 'react';
import { useSetup2FA } from '@/hooks/api/auth/mutations/use-setup-2fa';
import { useTranslationNamespace } from '@/hooks/useTranslation';
import { OTPInput } from './otp-input';
import { addToast } from '@/lib/toast';

interface Setup2FAFormProps {
  onSuccess?: () => void;
}

/**
 * Setup 2FA Form - Multi-step two-factor authentication setup
 * - Step 1: Display QR code + manual entry option
 * - Step 2: Verify 6-digit code with API validation
 * - Step 3: Display and save backup codes
 *
 * Uses the useSetup2FA hook for all state management and API integration
 */
export function Setup2FAForm({ onSuccess }: Setup2FAFormProps) {
  const { t } = useTranslationNamespace('auth');
  const {
    step,
    otp,
    codesConfirmed,
    copied,
    qrData,
    backupCodes,
    isLoading,
    isVerifying,
    error,
    setStep,
    setOtp,
    setCodesConfirmed,
    verifyOTP,
    downloadCodes,
    copyCode,
    startSetup,
  } = useSetup2FA();

  // Trigger 2FA setup when component mounts to fetch QR code
  useEffect(() => {
    startSetup();
  }, [startSetup]);

  const handleComplete = () => {
    if (!codesConfirmed) {
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

    onSuccess?.();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-text-secondary-lum">Loading 2FA setup...</p>
      </div>
    );
  }

  if (error && !qrData) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <ExclamationCircleIcon className="h-12 w-12 text-error" />
        <p className="text-center text-text-secondary-lum">
          Failed to load 2FA setup. Please try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-brand-cyan px-4 py-2 font-semibold text-white hover:bg-brand-teal"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Step Indicator */}
      <div className="mb-6 flex gap-2">
        {(['qr', 'verify', 'backup'] as const).map((s, index) => {
          const isActive = step === s;
          const isCompleted =
            (['qr', 'verify'].includes(s) && step === 'backup') ||
            (s === 'qr' && ['verify', 'backup'].includes(step));

          return (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                  isActive || isCompleted
                    ? 'bg-brand-cyan text-white'
                    : 'bg-bg-steel text-text-muted-lum'
                }`}
              >
                {isCompleted ? <CheckCircleIcon className="h-5 w-5" /> : index + 1}
              </div>
              {index < 2 && (
                <div
                  className={`h-1 flex-1 rounded-full transition-all ${
                    isCompleted ? 'bg-brand-cyan' : 'bg-bg-steel'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: QR Code */}
      {step === 'qr' && qrData && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="mb-2 text-lg font-semibold text-text-primary-lum">
              {t('luminous.twoFactor.setup.scanQR')}
            </h3>
            <p className="text-sm text-text-secondary-lum">
              {t('luminous.twoFactor.setup.scanQRMessage')}
            </p>
          </div>

          <div className="flex justify-center rounded-lg bg-white p-4">
            <img src={qrData.qr_code} alt="2FA QR Code" className="h-48 w-48" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-text-secondary-lum">
              {t('luminous.twoFactor.setup.manualEntryKey')}
            </p>
            <div className="rounded-lg bg-bg-steel p-3">
              <code className="font-mono text-sm break-all text-text-primary-lum">
                {qrData.secret}
              </code>
            </div>
          </div>

          <button
            onClick={() => setStep('verify')}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-cyan py-3 font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('luminous.twoFactor.setup.continue')}
            <ArrowRightIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
      )}

      {/* Step 2: Verify OTP */}
      {step === 'verify' && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="mb-2 text-lg font-semibold text-text-primary-lum">
              {t('luminous.twoFactor.setup.verifyCode')}
            </h3>
            <p className="text-sm text-text-secondary-lum">
              {t('luminous.twoFactor.setup.verifyCodeMessage')}
            </p>
          </div>

          <OTPInput length={6} value={otp} onChange={setOtp} disabled={isVerifying} />

          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep('qr');
                setOtp('');
              }}
              disabled={isVerifying}
              className="flex-1 rounded-lg border border-border-steel bg-bg-elevated-lum py-3 font-semibold text-text-primary-lum transition-all hover:bg-bg-steel disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('luminous.twoFactor.setup.backToQR')}
            </button>
            <button
              onClick={verifyOTP}
              disabled={otp.length !== 6 || isVerifying}
              className="flex-1 rounded-lg bg-brand-cyan py-3 font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isVerifying
                ? t('luminous.twoFactor.verify.submit')
                : t('luminous.twoFactor.setup.verifyCode')}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Backup Codes */}
      {step === 'backup' && (
        <div className="space-y-4">
          <div className="text-center">
            <CheckCircleIcon className="mx-auto mb-4 h-12 w-12 text-success" />
            <h3 className="mb-2 text-lg font-semibold text-text-primary-lum">
              {t('luminous.twoFactor.setup.saveBackup')}
            </h3>
            <p className="text-sm text-text-secondary-lum">
              {t('luminous.twoFactor.setup.backupMessage')}
            </p>
          </div>

          <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
            <p className="flex items-center gap-2 text-xs text-warning">
              <ExclamationCircleIcon className="h-4 w-4" />
              {t('luminous.twoFactor.setup.keepCodesSafe')}
            </p>
          </div>

          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border-steel bg-bg-steel p-3">
            {backupCodes.map((code, index) => (
              <div
                key={index}
                className="group flex items-center justify-between rounded border border-border-steel bg-bg-elevated-lum p-2 font-mono text-sm text-text-primary-lum transition-colors hover:bg-brand-cyan/10"
              >
                <span>{code}</span>
                <button
                  type="button"
                  onClick={() => copyCode(code)}
                  className="ml-2 text-brand-cyan opacity-0 transition-opacity group-hover:opacity-100 hover:text-brand-teal"
                  title="Copy code"
                >
                  {copied === code ? (
                    <CheckCircleIcon className="h-4 w-4 text-success" />
                  ) : (
                    <ClipboardIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={downloadCodes}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-steel bg-bg-elevated-lum py-3 font-semibold text-text-primary-lum transition-all hover:bg-bg-steel"
          >
            <ArrowDownTrayIcon className="h-[18px] w-[18px]" />
            {t('luminous.twoFactor.setup.downloadCodes')}
          </button>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={codesConfirmed}
              onChange={(e) => setCodesConfirmed(e.target.checked)}
              className="cursor-pointer rounded border-border-steel"
            />
            <span className="text-sm text-text-secondary-lum">
              {t('luminous.twoFactor.setup.confirmSaved')}
            </span>
          </label>

          <button
            onClick={handleComplete}
            disabled={!codesConfirmed}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-success py-3 font-semibold text-white transition-all hover:bg-success/90 active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircleIcon className="h-[18px] w-[18px]" />
            {t('luminous.twoFactor.setup.completeSetup')}
          </button>
        </div>
      )}
    </div>
  );
}
