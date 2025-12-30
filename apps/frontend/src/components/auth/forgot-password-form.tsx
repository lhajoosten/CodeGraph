import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  EnvelopeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { AuthInput } from './auth-input';
import { forgotPasswordSchema } from '@/lib/validators';
import { useForgotPassword } from '@/hooks/api/auth/mutations/use-forgot-password';
import { useTranslationNamespace } from '@/hooks/useTranslation';

type ForgotPasswordFormData = {
  email: string;
};

interface ForgotPasswordFormProps {
  onSuccess?: (email: string) => void;
}

/**
 * Forgot Password Form - Request password reset
 * - Email input with validation
 * - Success state with confirmation message
 * - Option to try another email
 * - Auto-toast notifications via useForgotPassword hook
 */
export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const { t } = useTranslationNamespace('auth');
  const forgotPasswordMutation = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPasswordMutation.mutateAsync({
        body: { email: data.email },
      });

      setSubmittedEmail(data.email);
      setSubmitted(true);
      onSuccess?.(data.email);
    } catch (error) {
      console.error('Forgot password failed:', error);
    }
  };

  const handleTryAnother = () => {
    setSubmitted(false);
    setSubmittedEmail('');
    reset();
  };

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <CheckCircleIcon className="h-12 w-12 text-brand-lime" />
        </div>

        <p className="text-center font-medium text-text-primary">
          {t('luminous.forgotPassword.successTitle')}
        </p>

        <p className="text-center text-sm text-text-secondary">
          {t('luminous.forgotPassword.successMessage', {
            email: submittedEmail,
            defaultValue: `We've sent a password reset link to ${submittedEmail}. Please check your email and follow the link to reset your password.`,
          })}
        </p>

        <div className="rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 p-3">
          <p className="text-xs text-brand-cyan">{t('luminous.forgotPassword.successTip')}</p>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleTryAnother}
            className="flex-1 rounded-lg border border-border-primary bg-surface py-3 font-semibold text-text-primary transition-all hover:bg-surface-secondary"
          >
            {t('luminous.forgotPassword.tryAnotherEmail')}
          </button>
          <a
            href="/login"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-cyan py-3 text-center font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:opacity-90"
          >
            {t('luminous.forgotPassword.backToLogin')}
            <ArrowRightIcon className="h-[18px] w-[18px]" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <AuthInput
        label={t('luminous.forgotPassword.email')}
        type="email"
        placeholder="you@example.com"
        icon={EnvelopeIcon}
        disabled={forgotPasswordMutation.isPending}
        error={errors.email?.message}
        helperText={t('luminous.forgotPassword.emailHint')}
        autoComplete="email"
        {...register('email')}
      />

      <button
        type="submit"
        disabled={forgotPasswordMutation.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-cyan py-3 font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {forgotPasswordMutation.isPending ? (
          <>
            <ArrowPathIcon className="h-[18px] w-[18px] animate-spin" />
            {t('common:forms.sending')}
          </>
        ) : (
          <>
            {t('luminous.forgotPassword.submit')}
            <ArrowRightIcon className="h-[18px] w-[18px]" />
          </>
        )}
      </button>

      <p className="text-center text-sm text-text-secondary">
        {t('luminous.forgotPassword.rememberPassword')}{' '}
        <a href="/login" className="text-brand-cyan hover:text-brand-teal">
          {t('luminous.forgotPassword.signin')}
        </a>
      </p>
    </form>
  );
}
