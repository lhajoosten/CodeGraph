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
        className="border-border-steel bg-bg-elevated-lum text-text-primary-lum inline-flex w-full items-center justify-center gap-2 rounded-lg border py-3 font-semibold transition-all hover:bg-bg-steel disabled:cursor-not-allowed disabled:opacity-50"
      >
        {icon}
        {label}
      </a>
    );
  }

  // Render as button with onClick
  return (
    <Button variant="secondary" className="w-full gap-2" onClick={onClick} disabled={disabled}>
      {icon}
      {label}
    </Button>
  );
}
