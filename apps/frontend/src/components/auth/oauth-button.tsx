import { Button } from '@/components/ui/button';
import { GithubIcon, GoogleIcon, MicrosoftIcon, AppleIcon } from '@/components/icons/brand';

export type OAuthProvider = 'github' | 'google' | 'microsoft' | 'apple';

interface OAuthButtonProps {
  provider: OAuthProvider;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}

/**
 * OAuth Button - Provider-specific OAuth login button
 * - Uses secondary variant for secondary appearance
 * - Provider icon and label
 * - Consistent styling across providers
 * - Supports both onClick callback and href link
 */
export function OAuthButton({ provider, onClick, href, disabled = false }: OAuthButtonProps) {
  const getProviderConfig = (
    p: OAuthProvider
  ): {
    label: string;
    icon: React.ReactNode;
  } => {
    switch (p) {
      case 'github':
        return {
          label: 'GitHub',
          icon: <GithubIcon className="h-5 w-5" />,
        };
      case 'google':
        return {
          label: 'Google',
          icon: <GoogleIcon className="h-5 w-5" />,
        };
      case 'microsoft':
        return {
          label: 'Microsoft',
          icon: <MicrosoftIcon className="h-5 w-5" />,
        };
      case 'apple':
        return {
          label: 'Apple',
          icon: <AppleIcon className="h-5 w-5" />,
        };
      default:
        return {
          label: '',
          icon: null,
        };
    }
  };

  const { label, icon } = getProviderConfig(provider);

  // Render as link if href is provided
  if (href) {
    return (
      <a
        href={href}
        className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-border-primary bg-surface/80 py-3 font-semibold text-text-primary backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-primary/40 hover:bg-surface hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {/* Subtle hover glow */}
        <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="absolute inset-0 bg-gradient-to-r from-brand-teal-500/5 via-transparent to-brand-cyan/5" />
        </span>

        <span className="relative flex items-center gap-2 transition-transform group-hover:scale-105">
          {icon}
        </span>
      </a>
    );
  }

  // Render as button with onClick
  return (
    <Button
      variant="secondary"
      className="group w-full gap-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="transition-transform group-hover:scale-105">{icon}</span>
      {label}
    </Button>
  );
}
