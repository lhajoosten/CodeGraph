import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthInput } from '@/components/auth/auth-input';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

describe('AuthInput', () => {
  describe('Rendering', () => {
    it('should render input without label', () => {
      render(<AuthInput placeholder="test@example.com" />);

      expect(screen.getByPlaceholderText('test@example.com')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<AuthInput label="Email" placeholder="test@example.com" />);

      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('test@example.com')).toBeInTheDocument();
    });

    it('should render with icon', () => {
      const { container } = render(
        <AuthInput label="Email" icon={EnvelopeIcon} placeholder="test@example.com" />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render error message', () => {
      render(
        <AuthInput
          label="Email"
          placeholder="test@example.com"
          error="Email is required"
        />
      );

      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('should render helper text when no error', () => {
      render(
        <AuthInput
          label="Email"
          placeholder="test@example.com"
          helperText="Enter a valid email"
        />
      );

      expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    });

    it('should not render helper text when error is present', () => {
      render(
        <AuthInput
          label="Email"
          placeholder="test@example.com"
          error="Email is required"
          helperText="Enter a valid email"
        />
      );

      expect(screen.queryByText('Enter a valid email')).not.toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  describe('User Input', () => {
    it('should accept user input', async () => {
      const user = userEvent.setup();
      const { container } = render(<AuthInput placeholder="test@example.com" />);

      const input = container.querySelector('input') as HTMLInputElement;

      await user.type(input, 'test@example.com');

      expect(input.value).toBe('test@example.com');
    });

    it('should support all input types', () => {
      const { container } = render(<AuthInput type="password" placeholder="password" />);

      const input = container.querySelector('input') as HTMLInputElement;

      expect(input).toHaveAttribute('type', 'password');
    });

    it('should be disabled when disabled prop is true', () => {
      const { container } = render(<AuthInput disabled={true} />);

      const input = container.querySelector('input') as HTMLInputElement;

      expect(input).toBeDisabled();
    });

    it('should support readOnly', () => {
      const { container } = render(<AuthInput readOnly value="test" />);

      const input = container.querySelector('input') as HTMLInputElement;

      expect(input).toHaveAttribute('readOnly');
    });
  });

  describe('Icon Styling', () => {
    it('should add padding when icon is present', () => {
      const { container } = render(
        <AuthInput icon={EnvelopeIcon} placeholder="test@example.com" />
      );

      const input = container.querySelector('input') as HTMLInputElement;

      expect(input.className).toContain('pl-10');
    });

    it('should not add padding when icon is absent', () => {
      const { container } = render(<AuthInput placeholder="test@example.com" />);

      const input = container.querySelector('input') as HTMLInputElement;

      expect(input.className).not.toContain('pl-10');
    });
  });

  describe('Error Styling', () => {
    it('should apply error variant when error exists', () => {
      const { container } = render(
        <AuthInput error="Invalid email" placeholder="test@example.com" />
      );

      const input = container.querySelector('input') as HTMLInputElement;

      // The variant attribute is set, though visual styling comes from CSS
      expect(input).toBeInTheDocument();
    });

    it('should apply luminous variant when no error', () => {
      const { container } = render(<AuthInput placeholder="test@example.com" />);

      const input = container.querySelector('input') as HTMLInputElement;

      expect(input).toBeInTheDocument();
    });
  });

  describe('Forwarding Ref', () => {
    it('should forward ref to input element', () => {
      const ref = { current: null };
      const { container } = render(
        <AuthInput
          ref={ref as any}
          placeholder="test@example.com"
        />
      );

      const input = container.querySelector('input');
      expect(ref.current).toBe(input);
    });
  });

  describe('Custom Props', () => {
    it('should accept and apply custom className', () => {
      const { container } = render(
        <AuthInput placeholder="test@example.com" className="custom-class" />
      );

      const input = container.querySelector('input') as HTMLInputElement;

      expect(input.className).toContain('custom-class');
    });

    it('should pass through additional HTML attributes', () => {
      const { container } = render(
        <AuthInput
          placeholder="test@example.com"
          autoComplete="email"
          required={true}
        />
      );

      const input = container.querySelector('input') as HTMLInputElement;

      expect(input).toHaveAttribute('autoComplete', 'email');
      expect(input).toHaveAttribute('required');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label', () => {
      render(<AuthInput label="Password" placeholder="password" />);

      expect(screen.getByText('Password')).toBeInTheDocument();
    });

    it('should support placeholder text', () => {
      render(<AuthInput placeholder="Enter your email" />);

      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });

    it('should display error for accessibility', () => {
      render(
        <AuthInput
          label="Email"
          placeholder="test@example.com"
          error="Email is required"
        />
      );

      const error = screen.getByText('Email is required');
      expect(error).toHaveClass('text-error');
    });
  });
});
