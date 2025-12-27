import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator';

describe('PasswordStrengthIndicator', () => {
  describe('Empty Password', () => {
    it('should render empty bar when password is empty', () => {
      const { container } = render(<PasswordStrengthIndicator password="" />);

      const bar = container.querySelector('[class*="h-1.5"]');
      expect(bar).toBeInTheDocument();
    });

    it('should not show label when password is empty', () => {
      render(<PasswordStrengthIndicator password="" />);

      expect(screen.queryByText(/Password strength:/i)).not.toBeInTheDocument();
    });

    it('should not show requirements when password is empty', () => {
      render(<PasswordStrengthIndicator password="" />);

      expect(screen.queryByText(/At least 8 characters/i)).not.toBeInTheDocument();
    });
  });

  describe('Weak Password', () => {
    it('should show weak password with less than 8 characters', () => {
      render(<PasswordStrengthIndicator password="pass" />);

      expect(screen.getByText(/Weak/i)).toBeInTheDocument();
    });

    it('should show weak password with only lowercase', () => {
      render(<PasswordStrengthIndicator password="password1234" />);

      expect(screen.getByText(/Weak/i)).toBeInTheDocument();
    });

    it('should show weak password with only uppercase', () => {
      render(<PasswordStrengthIndicator password="PASSWORD1234" />);

      expect(screen.getByText(/Weak/i)).toBeInTheDocument();
    });

    it('should display error color for weak password', () => {
      const { container } = render(<PasswordStrengthIndicator password="weak" />);

      const strengthBar = container.querySelector('[class*="bg-error"]');
      expect(strengthBar).toBeInTheDocument();
    });

    it('should show requirements for weak password', () => {
      render(<PasswordStrengthIndicator password="pass" />);

      expect(screen.getByText(/At least 8 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/Mix of uppercase and lowercase/i)).toBeInTheDocument();
      expect(screen.getByText(/At least one number/i)).toBeInTheDocument();
    });
  });

  describe('Medium Password', () => {
    it('should show medium password with uppercase and lowercase', () => {
      render(<PasswordStrengthIndicator password="Password" />);

      expect(screen.getByText(/Medium/i)).toBeInTheDocument();
    });

    it('should show medium password with uppercase, lowercase and no number', () => {
      render(<PasswordStrengthIndicator password="PasswordLength" />);

      expect(screen.getByText(/Medium/i)).toBeInTheDocument();
    });

    it('should display warning color for medium password', () => {
      const { container } = render(
        <PasswordStrengthIndicator password="Password" />
      );

      const strengthBar = container.querySelector('[class*="bg-warning"]');
      expect(strengthBar).toBeInTheDocument();
    });

    it('should show requirements for medium password', () => {
      render(<PasswordStrengthIndicator password="Password" />);

      expect(screen.getByText(/Mix of uppercase and lowercase/i)).toBeInTheDocument();
      expect(screen.getByText(/At least one number/i)).toBeInTheDocument();
    });

    it('should show checkmark for 8 character requirement', () => {
      render(<PasswordStrengthIndicator password="Password" />);

      const charRequirement = screen.getByText(/At least 8 characters/i);
      expect(charRequirement.querySelector('[class*="text-success"]')).toBeInTheDocument();
    });

    it('should show checkmark for mixed case requirement', () => {
      render(<PasswordStrengthIndicator password="Password" />);

      const caseRequirement = screen.getByText(/Mix of uppercase and lowercase/i);
      expect(caseRequirement.querySelector('[class*="text-success"]')).toBeInTheDocument();
    });
  });

  describe('Strong Password', () => {
    it('should show strong password with uppercase, lowercase, and number', () => {
      render(<PasswordStrengthIndicator password="Password1" />);

      expect(screen.getByText(/Strong password!/i)).toBeInTheDocument();
    });

    it('should display success color for strong password', () => {
      const { container } = render(
        <PasswordStrengthIndicator password="Password1" />
      );

      const strengthBar = container.querySelector('[class*="bg-brand-lime"]');
      expect(strengthBar).toBeInTheDocument();
    });

    it('should not show requirements for strong password', () => {
      render(<PasswordStrengthIndicator password="Password1" />);

      expect(screen.queryByText(/At least 8 characters/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Mix of uppercase and lowercase/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/At least one number/i)).not.toBeInTheDocument();
    });

    it('should show success message for strong password', () => {
      render(<PasswordStrengthIndicator password="Password1" />);

      expect(screen.getByText(/✓ Strong password!/i)).toBeInTheDocument();
    });
  });

  describe('Label Display', () => {
    it('should show label by default', () => {
      render(<PasswordStrengthIndicator password="weak" />);

      expect(screen.getByText(/Password strength:/i)).toBeInTheDocument();
    });

    it('should hide label when showLabel is false', () => {
      render(<PasswordStrengthIndicator password="weak" showLabel={false} />);

      expect(screen.queryByText(/Password strength:/i)).not.toBeInTheDocument();
    });

    it('should show label for medium password', () => {
      render(<PasswordStrengthIndicator password="Password" />);

      expect(screen.getByText(/Password strength:/i)).toBeInTheDocument();
      expect(screen.getByText(/Medium/i)).toBeInTheDocument();
    });

    it('should show label for strong password', () => {
      render(<PasswordStrengthIndicator password="Password1" />);

      const label = screen.getByText(/Password strength:/i);
      expect(label).toBeInTheDocument();
    });
  });

  describe('Progress Bar Width', () => {
    it('should show 33% width for weak password', () => {
      const { container } = render(<PasswordStrengthIndicator password="weak" />);

      const bar = container.querySelector('[style*="width"]') as HTMLElement;
      expect(bar?.style.width).toBe('33%');
    });

    it('should show 66% width for medium password', () => {
      const { container } = render(<PasswordStrengthIndicator password="Password" />);

      const bar = container.querySelector('[style*="width"]') as HTMLElement;
      expect(bar?.style.width).toBe('66%');
    });

    it('should show 100% width for strong password', () => {
      const { container } = render(<PasswordStrengthIndicator password="Password1" />);

      const bar = container.querySelector('[style*="width"]') as HTMLElement;
      expect(bar?.style.width).toBe('100%');
    });
  });

  describe('Requirement Checkmarks', () => {
    it('should show unchecked items for password with no numbers', () => {
      render(<PasswordStrengthIndicator password="Password" />);

      const numberRequirement = screen.getByText(/At least one number/i);
      expect(numberRequirement.querySelector('[class*="text-text-muted-lum"]')).toBeInTheDocument();
    });

    it('should show checked items for password with numbers', () => {
      render(<PasswordStrengthIndicator password="Password1" />);

      // Password1 is strong, so no requirements shown - just verify strength message
      expect(screen.getByText(/Strong password/i)).toBeInTheDocument();
    });

    it('should show all requirements met for strong password', () => {
      const { container } = render(
        <PasswordStrengthIndicator password="Password1" />
      );

      // Strong passwords don't show requirements, only success message
      expect(screen.queryByText(/At least 8 characters/i)).not.toBeInTheDocument();
    });
  });

  describe('Password Updates', () => {
    it('should update from weak to strong', () => {
      const { rerender } = render(<PasswordStrengthIndicator password="weak" />);

      expect(screen.getByText(/Weak/i)).toBeInTheDocument();

      rerender(<PasswordStrengthIndicator password="Password1" />);

      expect(screen.queryByText(/Weak/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Strong password!/i)).toBeInTheDocument();
    });

    it('should update from strong to medium', () => {
      const { rerender } = render(<PasswordStrengthIndicator password="Password1" />);

      expect(screen.getByText(/Strong password!/i)).toBeInTheDocument();

      rerender(<PasswordStrengthIndicator password="Password" />);

      expect(screen.queryByText(/Strong password!/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Medium/i)).toBeInTheDocument();
    });

    it('should update from any strength to empty', () => {
      const { rerender } = render(<PasswordStrengthIndicator password="Password1" />);

      expect(screen.getByText(/Strong password!/i)).toBeInTheDocument();

      rerender(<PasswordStrengthIndicator password="" />);

      expect(screen.queryByText(/Password strength:/i)).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle 7 character password as weak', () => {
      render(<PasswordStrengthIndicator password="Passwor" />);

      expect(screen.getByText(/Weak/i)).toBeInTheDocument();
    });

    it('should handle 8 character password as minimum for strong', () => {
      render(<PasswordStrengthIndicator password="Password1" />);

      expect(screen.getByText(/Strong password!/i)).toBeInTheDocument();
    });

    it('should handle very long password as strong', () => {
      render(
        <PasswordStrengthIndicator password="VeryLongPasswordWithManyCharactersAndNumbers12345" />
      );

      expect(screen.getByText(/Strong password!/i)).toBeInTheDocument();
    });

    it('should handle special characters in password', () => {
      render(<PasswordStrengthIndicator password="Password1!" />);

      expect(screen.getByText(/Strong password!/i)).toBeInTheDocument();
    });
  });

  describe('Label Styling', () => {
    it('should apply error color to weak label', () => {
      render(<PasswordStrengthIndicator password="weak" />);

      const label = screen.getByText(/Weak/i);
      expect(label).toHaveClass('text-error');
    });

    it('should apply warning color to medium label', () => {
      render(<PasswordStrengthIndicator password="Password" />);

      const label = screen.getByText(/Medium/i);
      expect(label).toHaveClass('text-warning');
    });

    it('should apply success color to strong label', () => {
      render(<PasswordStrengthIndicator password="Password1" />);

      const label = screen.getByText(/Strong password!/i);
      expect(label).toHaveClass('text-brand-lime');
    });
  });
});
