import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  EnvelopeIcon,
  LockClosedIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { AuthInput } from './auth-input';
import { PasswordStrengthIndicator } from './password-strength-indicator';
import { registerSchema } from '@/lib/validators';
import { useRegister } from '@/hooks/api/auth/mutations/use-register';
import { useTranslationNamespace } from '@/hooks/useTranslation';

type RegisterFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

interface RegisterFormProps {
  onSuccess?: (email: string) => void;
}

/**
 * Register Form - User account creation
 * - Multi-field form validation with React Hook Form + Zod
 * - Real-time password strength indicator
 * - Terms of service checkbox
 * - Auto-toast notifications via useRegister hook
 * - Loading states during submission
 * - i18n translations
 */
export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { t } = useTranslationNamespace('auth');
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: RegisterFormData) => {
    await registerMutation.mutateAsync({
      body: {
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
      },
    });

    reset();
    onSuccess?.(data.email);
  };

  const passwordValue = useWatch({ control, name: 'password' });
  const confirmPasswordValue = useWatch({ control, name: 'confirmPassword' });
  const firstNameValue = useWatch({ control, name: 'firstName' });
  const lastNameValue = useWatch({ control, name: 'lastName' });
  const emailValue = useWatch({ control, name: 'email' });
  const acceptTermsValue = useWatch({ control, name: 'acceptTerms' });

  const isFormValid =
    firstNameValue &&
    lastNameValue &&
    emailValue &&
    passwordValue &&
    confirmPasswordValue &&
    acceptTermsValue &&
    passwordValue === confirmPasswordValue;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        <AuthInput
          label={t('luminous.signup.firstName')}
          placeholder="John"
          disabled={isSubmitting || registerMutation.isPending}
          error={errors.firstName?.message}
          {...register('firstName')}
        />
        <AuthInput
          label={t('luminous.signup.lastName')}
          placeholder="Doe"
          disabled={isSubmitting || registerMutation.isPending}
          error={errors.lastName?.message}
          {...register('lastName')}
        />
      </div>

      {/* Email Field */}
      <AuthInput
        label={t('luminous.signup.email')}
        type="email"
        placeholder="you@example.com"
        icon={EnvelopeIcon}
        disabled={isSubmitting || registerMutation.isPending}
        error={errors.email?.message}
        helperText={t('luminous.signup.emailHint')}
        autoComplete="email"
        {...register('email')}
      />

      <div className="space-y-2">
        <div className="relative">
          <AuthInput
            label={t('luminous.signup.password')}
            type={showPassword ? 'text' : 'password'}
            placeholder={t('luminous.signup.passwordPlaceholder')}
            icon={LockClosedIcon}
            disabled={isSubmitting || registerMutation.isPending}
            error={errors.password?.message}
            className="pr-10"
            autoComplete="new-password"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-text-muted-lum absolute top-[32px] right-3 transition-colors hover:text-text-secondary-lum"
            tabIndex={-1}
          >
            {showPassword ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
          </button>
        </div>

        {passwordValue && (
          <div className="mt-2">
            <PasswordStrengthIndicator password={passwordValue} showLabel={true} />
          </div>
        )}
      </div>

      <div className="relative">
        <AuthInput
          label={t('luminous.signup.confirmPassword')}
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder={t('luminous.signup.confirmPassword')}
          icon={LockClosedIcon}
          disabled={isSubmitting || registerMutation.isPending}
          error={
            errors.confirmPassword?.message ||
            (confirmPasswordValue && passwordValue !== confirmPasswordValue
              ? t('validation.passwordMismatch')
              : undefined)
          }
          className="pr-10"
          autoComplete="new-password"
          {...register('confirmPassword')}
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="text-text-muted-lum absolute top-[32px] right-3 transition-colors hover:text-text-secondary-lum"
          tabIndex={-1}
        >
          {showConfirmPassword ? (
            <EyeIcon className="h-5 w-5" />
          ) : (
            <EyeSlashIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="border-border-steel mt-1 cursor-pointer rounded"
          disabled={isSubmitting || registerMutation.isPending}
          {...register('acceptTerms')}
        />
        <span className="text-text-secondary-lum text-sm">{t('luminous.signup.acceptTerms')}</span>
      </label>

      {errors.acceptTerms && <p className="text-error text-xs">{errors.acceptTerms.message}</p>}

      <button
        type="submit"
        disabled={isSubmitting || registerMutation.isPending || !isFormValid}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-cyan py-3 font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting || registerMutation.isPending ? (
          <>
            <ArrowPathIcon className="h-[18px] w-[18px] animate-spin" />
            {t('common:forms.creatingAccount')}
          </>
        ) : isFormValid ? (
          <>
            <CheckCircleIcon className="h-[18px] w-[18px]" />
            {t('luminous.signup.submit')}
          </>
        ) : (
          t('luminous.signup.submit')
        )}
      </button>

      <p className="text-text-secondary-lum text-center text-sm">
        {t('luminous.signup.haveAccount')}{' '}
        <a href="/login" className="hover:text-brand-teal text-brand-cyan">
          {t('luminous.signup.signin')}
        </a>
      </p>
    </form>
  );
}
