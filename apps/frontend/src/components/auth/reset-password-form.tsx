import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  LockClosedIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { AuthInput } from './auth-input';
import { PasswordStrengthIndicator } from './password-strength-indicator';
import { resetPasswordSchema } from '@/lib/validators';
import { useTranslationNamespace } from '@/hooks/useTranslation';
import { useResetPassword } from '@/hooks/api/auth/mutations/use-reset-password';

type ResetPasswordFormData = {
  password: string;
  confirmPassword: string;
};

interface ResetPasswordFormProps {
  token?: string;
  onSuccess?: () => void;
}

/**
 * Reset Password Form - Create new password with token
 * - Password validation and strength indicator
 * - Confirmation password matching
 * - Token-based security
 * - Success state with redirect
 */
export function ResetPasswordForm({ token, onSuccess }: ResetPasswordFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const { t } = useTranslationNamespace('auth');
  const resetPasswordMutation = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setTokenError(true);
      return;
    }

    resetPasswordMutation.mutate(
      {
        body: {
          token,
          password: data.password,
        },
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          reset();
          onSuccess?.();
        },
        onError: (error) => {
          if (error instanceof Error && error.message.includes('token')) {
            setTokenError(true);
          }
        },
      }
    );
  };

  const passwordValue = useWatch({ control, name: 'password' });
  const confirmPasswordValue = useWatch({ control, name: 'confirmPassword' });

  if (tokenError) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <ExclamationCircleIcon className="text-error h-12 w-12" />
        </div>

        <p className="text-text-primary text-center font-medium">
          {t('luminous.resetPassword.invalidTokenTitle')}
        </p>

        <p className="text-text-secondary text-center text-sm">
          {t('luminous.resetPassword.invalidTokenMessage')}
        </p>

        <a
          href="/forgot-password"
          className="block w-full rounded-lg bg-brand-cyan py-3 text-center font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:opacity-90"
        >
          {t('luminous.resetPassword.requestNewLink')}
        </a>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <CheckCircleIcon className="h-12 w-12 text-brand-lime" />
        </div>

        <p className="text-text-primary text-center font-medium">
          {t('luminous.resetPassword.successTitle')}
        </p>

        <p className="text-text-secondary text-center text-sm">
          {t('luminous.resetPassword.successMessage')}
        </p>

        <a
          href="/login"
          className="block w-full rounded-lg bg-brand-cyan py-3 text-center font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:opacity-90"
        >
          {t('luminous.resetPassword.backToLogin')}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <AuthInput
          label={t('luminous.resetPassword.newPassword')}
          type="password"
          placeholder={t('luminous.resetPassword.newPasswordPlaceholder')}
          icon={LockClosedIcon}
          disabled={isSubmitting || resetPasswordMutation.isPending}
          error={errors.password?.message}
          autoComplete="new-password"
          {...register('password')}
        />

        {/* Password Strength Indicator */}
        {passwordValue && (
          <div className="mt-2">
            <PasswordStrengthIndicator password={passwordValue} showLabel={true} />
          </div>
        )}
      </div>

      <AuthInput
        label={t('luminous.resetPassword.confirmPassword')}
        type="password"
        placeholder={t('luminous.resetPassword.confirmPasswordPlaceholder')}
        icon={LockClosedIcon}
        disabled={isSubmitting || resetPasswordMutation.isPending}
        error={
          errors.confirmPassword?.message ||
          (confirmPasswordValue && passwordValue !== confirmPasswordValue
            ? t('validation.passwordMismatch')
            : undefined)
        }
        autoComplete="new-password"
        {...register('confirmPassword')}
      />

      <button
        type="submit"
        disabled={
          isSubmitting ||
          resetPasswordMutation.isPending ||
          !passwordValue ||
          !confirmPasswordValue ||
          passwordValue !== confirmPasswordValue
        }
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-cyan py-3 font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting || resetPasswordMutation.isPending ? (
          <>
            <ArrowPathIcon className="h-[18px] w-[18px] animate-spin" />
            {t('luminous.resetPassword.resettingPassword')}
          </>
        ) : (
          t('luminous.resetPassword.submit')
        )}
      </button>

      <p className="text-text-secondary text-center text-sm">
        {t('luminous.resetPassword.rememberPassword')}{' '}
        <a href="/login" className="hover:text-brand-teal text-brand-cyan">
          {t('luminous.resetPassword.signin')}
        </a>
      </p>
    </form>
  );
}
