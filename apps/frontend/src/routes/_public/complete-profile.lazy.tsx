import { createLazyFileRoute } from '@tanstack/react-router';
import { useNavigate } from '@tanstack/react-router';
import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { AuthLayout, AuthCard, AuthHeader, AuthInput } from '@/components/auth';
import { profileCompletionSchema } from '@/lib/validators';
import { useTranslationNamespace } from '@/hooks/useTranslation';
import { useUpdateProfile } from '@/hooks/api/auth/mutations/use-update-profile';
import type { ProfileCompletionFormData } from '@/lib/validators';

export const Route = createLazyFileRoute('/_public/complete-profile')({
  component: CompleteProfilePage,
});

function CompleteProfileContent() {
  const { t } = useTranslationNamespace('auth');
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const updateProfileMutation = useUpdateProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileCompletionFormData>({
    resolver: zodResolver(profileCompletionSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: ProfileCompletionFormData) => {
    try {
      await updateProfileMutation.mutateAsync({
        body: {
          first_name: data.firstName && data.firstName !== '' ? data.firstName : null,
          last_name: data.lastName && data.lastName !== '' ? data.lastName : null,
          display_name: data.displayName && data.displayName !== '' ? data.displayName : null,
          avatar_url: data.avatarUrl && data.avatarUrl !== '' ? data.avatarUrl : null,
        },
      });

      setSubmitted(true);
      setTimeout(() => {
        navigate({ to: '/' });
      }, 1500);
    } catch (error) {
      console.error('Profile completion failed:', error);
    }
  };

  const handleSkip = () => {
    // Skip profile completion and go to dashboard
    navigate({ to: '/' });
  };

  if (submitted) {
    return (
      <AuthLayout>
        <AuthCard>
          <div className="space-y-4">
            <div className="flex justify-center">
              <CheckCircleIcon className="h-12 w-12 text-brand-lime" />
            </div>

            <p className="text-center font-medium text-text-primary">
              {t('luminous.completeProfile.successTitle')}
            </p>

            <p className="text-center text-sm text-text-secondary">
              {t('luminous.completeProfile.successMessage')}
            </p>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard>
        <AuthHeader
          title={t('luminous.completeProfile.title')}
          subtitle={t('luminous.completeProfile.subtitle')}
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <AuthInput
            label={t('luminous.completeProfile.firstName')}
            type="text"
            placeholder={t('luminous.completeProfile.firstNamePlaceholder')}
            error={errors.firstName?.message}
            disabled={isSubmitting || updateProfileMutation.isPending}
            {...register('firstName')}
          />

          <AuthInput
            label={t('luminous.completeProfile.lastName')}
            type="text"
            placeholder={t('luminous.completeProfile.lastNamePlaceholder')}
            error={errors.lastName?.message}
            disabled={isSubmitting || updateProfileMutation.isPending}
            {...register('lastName')}
          />

          <AuthInput
            label={t('luminous.completeProfile.displayName')}
            type="text"
            placeholder={t('luminous.completeProfile.displayNamePlaceholder')}
            helperText={t('luminous.completeProfile.displayNameHint')}
            error={errors.displayName?.message}
            disabled={isSubmitting || updateProfileMutation.isPending}
            {...register('displayName')}
          />

          <AuthInput
            label={t('luminous.completeProfile.avatarUrl')}
            type="url"
            placeholder={t('luminous.completeProfile.avatarUrlPlaceholder')}
            helperText={t('luminous.completeProfile.avatarUrlHint')}
            error={errors.avatarUrl?.message}
            disabled={isSubmitting || updateProfileMutation.isPending}
            {...register('avatarUrl')}
          />

          <button
            type="submit"
            disabled={isSubmitting || updateProfileMutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-cyan py-3 font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting || updateProfileMutation.isPending ? (
              <>
                <ArrowPathIcon className="h-[18px] w-[18px] animate-spin" />
                {t('luminous.completeProfile.submitting')}
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-[18px] w-[18px]" />
                {t('luminous.completeProfile.submit')}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            disabled={isSubmitting || updateProfileMutation.isPending}
            className="w-full rounded-lg border border-border-primary bg-surface py-3 font-semibold text-text-primary transition-all hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('luminous.completeProfile.skip')}
          </button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}

function CompleteProfileFallback() {
  return (
    <AuthLayout>
      <AuthCard>
        <div className="space-y-4">
          <div className="h-8 w-32 animate-pulse rounded bg-surface-secondary"></div>
          <div className="h-4 w-48 animate-pulse rounded bg-surface-secondary"></div>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}

function CompleteProfilePage() {
  return (
    <Suspense fallback={<CompleteProfileFallback />}>
      <CompleteProfileContent />
    </Suspense>
  );
}
