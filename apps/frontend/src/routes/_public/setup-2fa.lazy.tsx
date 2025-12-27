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
    // Update auth store to reflect that 2FA is now enabled
    // This allows the verify-2fa route guard to pass
    setTwoFactorStatus(true, false, false);

    // Redirect to verify page to complete 2FA verification
    // This ensures the user is fully authenticated before accessing protected resources
    navigate({ to: '/verify-2fa', search: { from: 'setup' } });
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
