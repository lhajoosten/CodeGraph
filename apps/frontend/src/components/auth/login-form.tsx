import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  EnvelopeIcon,
  LockClosedIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { AuthInput } from './auth-input';
import { loginSchema } from '@/lib/validators';
import { useLogin } from '@/hooks/api/auth/mutations/use-login';
import { useTranslationNamespace } from '@/hooks/useTranslation';

type LoginFormData = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

interface LoginFormProps {
  onSuccess?: () => void;
}

/**
 * Login Form - Email and password authentication
 * - Form validation with React Hook Form + Zod
 * - Auto-toast notifications on success/error (via useLogin hook)
 * - OAuth integration ready
 * - Loading states during submission
 * - i18n translations
 */
export function LoginForm({ onSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslationNamespace('auth');
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync({
        body: {
          email: data.email,
          password: data.password,
          remember_me: data.rememberMe,
        },
      });

      // Store remember me preference
      if (data.rememberMe) {
        localStorage.setItem('rememberMe', data.email);
      }

      reset();
      onSuccess?.();
    } catch (error) {
      // Error handled by useLogin mutation (auto-toast)
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <AuthInput
        label={t('luminous.signin.email')}
        type="email"
        placeholder="you@example.com"
        icon={EnvelopeIcon}
        disabled={isSubmitting || loginMutation.isPending}
        error={errors.email?.message}
        {...register('email')}
      />

      <div className="space-y-2">
        <div className="relative">
          <AuthInput
            label={t('luminous.signin.password')}
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            icon={LockClosedIcon}
            disabled={isSubmitting || loginMutation.isPending}
            error={errors.password?.message}
            className="pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-[32px] right-3 text-text-muted-lum transition-colors hover:text-text-secondary-lum"
            tabIndex={-1}
          >
            {showPassword ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="cursor-pointer rounded border-border-steel"
            disabled={isSubmitting || loginMutation.isPending}
            {...register('rememberMe')}
          />
          <span className="text-text-secondary-lum">{t('luminous.signin.rememberMe')}</span>
        </label>
        <a
          href="/forgot-password"
          className="text-brand-cyan transition-colors hover:text-brand-teal"
        >
          {t('luminous.signin.forgotPassword')}
        </a>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || loginMutation.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-cyan py-3 font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting || loginMutation.isPending ? (
          <>
            <ArrowPathIcon className="h-[18px] w-[18px] animate-spin" />
            {t('common:forms.signingIn')}
          </>
        ) : (
          t('luminous.signin.submit')
        )}
      </button>

      <p className="text-center text-sm text-text-secondary-lum">
        {t('luminous.signin.noAccount')}{' '}
        <a href="/register" className="text-brand-cyan hover:text-brand-teal">
          {t('luminous.signin.signup')}
        </a>
      </p>
    </form>
  );
}
