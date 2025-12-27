import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OAuthButton, type OAuthProvider } from '@/components/auth/oauth-button';

describe('OAuthButton', () => {
  describe('Rendering - Google Provider', () => {
    it('should render Google button with correct label', () => {
      render(<OAuthButton provider="google" />);

      expect(screen.getByText('Google')).toBeInTheDocument();
    });

    it('should render Google icon', () => {
      const { container } = render(<OAuthButton provider="google" />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Rendering - GitHub Provider', () => {
    it('should render GitHub button with correct label', () => {
      render(<OAuthButton provider="github" />);

      expect(screen.getByText('GitHub')).toBeInTheDocument();
    });
  });

  describe('Rendering - Microsoft Provider', () => {
    it('should render Microsoft button with correct label', () => {
      render(<OAuthButton provider="microsoft" />);

      expect(screen.getByText('Microsoft')).toBeInTheDocument();
    });
  });

  describe('Rendering - Apple Provider', () => {
    it('should render Apple button with correct label', () => {
      render(<OAuthButton provider="apple" />);

      expect(screen.getByText('Apple')).toBeInTheDocument();
    });
  });

  describe('Rendering - Button Mode', () => {
    it('should render as button when onClick is provided', () => {
      render(<OAuthButton provider="google" onClick={vi.fn()} />);

      const button = screen.getByRole('button', { name: /Google/i });
      expect(button).toBeInTheDocument();
    });

    it('should render as button by default (no href)', () => {
      render(<OAuthButton provider="google" />);

      const button = screen.getByRole('button', { name: /Google/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Rendering - Link Mode', () => {
    it('should render as link when href is provided', () => {
      render(<OAuthButton provider="google" href="https://accounts.google.com/oauth" />);

      const link = screen.getByRole('link', { name: /Google/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://accounts.google.com/oauth');
    });

    it('should not render as button when href is provided', () => {
      render(<OAuthButton provider="google" href="https://accounts.google.com/oauth" />);

      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBe(0);
    });
  });

  describe('User Interaction - Button Mode', () => {
    it('should call onClick handler when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<OAuthButton provider="google" onClick={handleClick} />);

      const button = screen.getByRole('button', { name: /Google/i });
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<OAuthButton provider="google" onClick={handleClick} disabled={true} />);

      const button = screen.getByRole('button', { name: /Google/i });
      expect(button).toBeDisabled();

      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State - Button Mode', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<OAuthButton provider="google" onClick={vi.fn()} disabled={true} />);

      const button = screen.getByRole('button', { name: /Google/i });
      expect(button).toBeDisabled();
    });

    it('should be enabled by default', () => {
      render(<OAuthButton provider="google" onClick={vi.fn()} />);

      const button = screen.getByRole('button', { name: /Google/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe('Disabled State - Link Mode', () => {
    it('should apply disabled styling when disabled and rendering as link', () => {
      const { container } = render(
        <OAuthButton
          provider="google"
          href="https://accounts.google.com/oauth"
          disabled={true}
        />
      );

      const link = container.querySelector('a');
      expect(link?.className).toContain('disabled:opacity-50');
    });
  });

  describe('Full Width', () => {
    it('should be full width', () => {
      const { container } = render(<OAuthButton provider="google" />);

      const button = container.querySelector('button');
      expect(button?.className).toContain('w-full');
    });

    it('should be full width in link mode', () => {
      const { container } = render(
        <OAuthButton provider="google" href="https://accounts.google.com/oauth" />
      );

      const link = container.querySelector('a');
      expect(link?.className).toContain('w-full');
    });
  });

  describe('All Providers', () => {
    const providers: OAuthProvider[] = ['github', 'google', 'microsoft', 'apple'];
    const providerLabels: Record<OAuthProvider, string> = {
      github: 'GitHub',
      google: 'Google',
      microsoft: 'Microsoft',
      apple: 'Apple',
    };

    providers.forEach((provider) => {
      it(`should render ${provider} provider correctly`, () => {
        render(<OAuthButton provider={provider} />);

        expect(screen.getByText(providerLabels[provider])).toBeInTheDocument();
      });

      it(`should render icon for ${provider} provider`, () => {
        const { container } = render(<OAuthButton provider={provider} />);

        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Providers on Page', () => {
    it('should render multiple OAuth buttons independently', () => {
      render(
        <>
          <OAuthButton provider="google" />
          <OAuthButton provider="github" />
          <OAuthButton provider="microsoft" />
        </>
      );

      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
      expect(screen.getByText('Microsoft')).toBeInTheDocument();
    });

    it('should handle individual click events for each button', async () => {
      const user = userEvent.setup();
      const handleGoogle = vi.fn();
      const handleGithub = vi.fn();

      render(
        <>
          <OAuthButton provider="google" onClick={handleGoogle} />
          <OAuthButton provider="github" onClick={handleGithub} />
        </>
      );

      await user.click(screen.getByRole('button', { name: /Google/i }));
      await user.click(screen.getByRole('button', { name: /GitHub/i }));

      expect(handleGoogle).toHaveBeenCalledTimes(1);
      expect(handleGithub).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button role', () => {
      render(<OAuthButton provider="google" />);

      const button = screen.getByRole('button', { name: /Google/i });
      expect(button).toBeInTheDocument();
    });

    it('should have accessible link role when href is provided', () => {
      render(<OAuthButton provider="google" href="https://accounts.google.com/oauth" />);

      const link = screen.getByRole('link', { name: /Google/i });
      expect(link).toBeInTheDocument();
    });

    it('should have provider name in accessible text', () => {
      render(<OAuthButton provider="google" />);

      expect(screen.getByText('Google')).toBeInTheDocument();
    });
  });
});
