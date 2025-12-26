import { createLazyFileRoute } from '@tanstack/react-router';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth-store';
import { AuthLayout, AuthCard } from '@/components/auth';
import { TwoFactorSetupWizard } from '@/components/two-factor';

export const Route = createLazyFileRoute('/_public/setup-2fa')({
  component: SetupTwoFactorPage,
});

function SetupTwoFactorPage() {
  const navigate = useNavigate();
  const setTwoFactorStatus = useAuthStore((state) => state.setTwoFactorStatus);

  const handleSetup2FASuccess = () => {
    // Update auth store to reflect successful 2FA setup
    // - twoFactorEnabled: true (2FA is now enabled)
    // - twoFactorVerified: true (completing setup counts as verification)
    // - requiresTwoFactorSetup: false (no longer required)
    setTwoFactorStatus(true, true, false);
    navigate({ to: '/' });
  };

  return (
    <AuthLayout>
      <AuthCard>
        <div className="mx-auto max-w-md">
          <TwoFactorSetupWizard
            onSuccess={handleSetup2FASuccess}
            isRequired={true}
            title="Enable Two-Factor Authentication"
            subtitle="Secure your account with 2FA"
          />
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
