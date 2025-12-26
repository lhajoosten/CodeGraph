import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate } from '@tanstack/react-router';
import { RegisterForm } from '@/components/auth/register-form';
import { useRegister } from '@/hooks/api/auth/mutations/use-register';
import { renderWithQueryClient } from '../../utils/test-utils';
import { createMockMutation } from '../../fixtures/factories';
import { mockRegisterData } from '../../fixtures/auth-fixtures';

// Mock dependencies
vi.mock('@tanstack/react-router');
vi.mock('@/hooks/api/auth/mutations/use-register');
vi.mock('@/hooks/common/use-toggle', () => ({
  useToggle: () => ({
    isOpen: false,
    toggle: vi.fn(),
    open: vi.fn(),
    close: vi.fn(),
  }),
}));

describe('RegisterForm', () => {
  const mockNavigate = vi.fn();
  const mockUseRegister = vi.mocked(useRegister);
  const mockUseNavigate = vi.mocked(useNavigate);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
  });

  describe('Rendering', () => {
    it('should render registration form with all fields', () => {
      mockUseRegister.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<RegisterForm />);

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/terms of service/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should render links to terms and privacy policy', () => {
      mockUseRegister.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<RegisterForm />);

      expect(screen.getByText(/terms of service/i)).toBeInTheDocument();
      expect(screen.getByText(/privacy policy/i)).toBeInTheDocument();
    });
  });

  describe('User Input', () => {
    it('should allow typing in all input fields', async () => {
      const user = userEvent.setup();
      mockUseRegister.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<RegisterForm />);

      const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement;
      const lastNameInput = screen.getByLabelText(/last name/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/^password/i) as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement;

      await user.type(firstNameInput, mockRegisterData.firstName);
      await user.type(lastNameInput, mockRegisterData.lastName);
      await user.type(emailInput, mockRegisterData.email);
      await user.type(passwordInput, mockRegisterData.password);
      await user.type(confirmPasswordInput, mockRegisterData.confirmPassword);

      expect(firstNameInput.value).toBe(mockRegisterData.firstName);
      expect(lastNameInput.value).toBe(mockRegisterData.lastName);
      expect(emailInput.value).toBe(mockRegisterData.email);
      expect(passwordInput.value).toBe(mockRegisterData.password);
      expect(confirmPasswordInput.value).toBe(mockRegisterData.confirmPassword);
    });
  });

  describe('Password Strength Indicator', () => {
    it('should show password strength for weak password', async () => {
      const user = userEvent.setup();
      mockUseRegister.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<RegisterForm />);

      const passwordInput = screen.getByLabelText(/^password/i);

      await user.type(passwordInput, 'Pass123!');

      await waitFor(() => {
        expect(screen.getByText(/password strength:/i)).toBeInTheDocument();
      });
    });

    it('should show password strength for strong password', async () => {
      const user = userEvent.setup();
      mockUseRegister.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<RegisterForm />);

      const passwordInput = screen.getByLabelText(/^password/i);

      await user.type(passwordInput, 'VeryStrongPassword123!@#');

      await waitFor(() => {
        expect(screen.getByText(/password strength:/i)).toBeInTheDocument();
      });
    });

    it('should not show password strength when field is empty', () => {
      mockUseRegister.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<RegisterForm />);

      expect(screen.queryByText(/password strength:/i)).not.toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should validate required first name', async () => {
      const user = userEvent.setup();
      mockUseRegister.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<RegisterForm />);

      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      });
    });

    it('should validate required last name', async () => {
      const user = userEvent.setup();
      mockUseRegister.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<RegisterForm />);

      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      });
    });

    it('should validate password minimum length', async () => {
      const user = userEvent.setup();
      mockUseRegister.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<RegisterForm />);

      const passwordInput = screen.getByLabelText(/^password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(passwordInput, 'Short1!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate password contains uppercase letter', async () => {
      const user = userEvent.setup();
      mockUseRegister.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<RegisterForm />);

      const passwordInput = screen.getByLabelText(/^password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(passwordInput, 'lowercase123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password must contain at least one uppercase letter/i)
        ).toBeInTheDocument();
      });
    });

    it('should validate password contains lowercase letter', async () => {
      const user = userEvent.setup();
      mockUseRegister.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<RegisterForm />);

      const passwordInput = screen.getByLabelText(/^password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(passwordInput, 'UPPERCASE123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password must contain at least one lowercase letter/i)
        ).toBeInTheDocument();
      });
    });

    it('should validate password contains number', async () => {
      const user = userEvent.setup();
      mockUseRegister.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<RegisterForm />);

      const passwordInput = screen.getByLabelText(/^password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(passwordInput, 'NoNumbers!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one number/i)).toBeInTheDocument();
      });
    });

    it('should validate password confirmation matches', async () => {
      const user = userEvent.setup();
      mockUseRegister.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<RegisterForm />);

      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'Different123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('should validate terms acceptance', async () => {
      const user = userEvent.setup();
      mockUseRegister.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<RegisterForm />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(firstNameInput, mockRegisterData.firstName);
      await user.type(lastNameInput, mockRegisterData.lastName);
      await user.type(emailInput, mockRegisterData.email);
      await user.type(passwordInput, mockRegisterData.password);
      await user.type(confirmPasswordInput, mockRegisterData.confirmPassword);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/you must accept the terms and conditions/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should disable submit button while form is submitting', () => {
      mockUseRegister.mockReturnValue(createMockMutation({ isPending: true }) as any);

      renderWithQueryClient(<RegisterForm />);

      const submitButton = screen.getByRole('button', { name: /create account/i });

      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message on registration failure', () => {
      const errorMessage = 'Email already registered';
      mockUseRegister.mockReturnValue(
        createMockMutation({
          isError: true,
          error: new Error(errorMessage),
        }) as any
      );

      renderWithQueryClient(<RegisterForm />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should display generic error when no error message provided', () => {
      mockUseRegister.mockReturnValue(
        createMockMutation({
          isError: true,
          error: new Error(),
        }) as any
      );

      renderWithQueryClient(<RegisterForm />);

      expect(screen.getByText(/registration failed. please try again./i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form labels', () => {
      mockUseRegister.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<RegisterForm />);

      expect(screen.getByLabelText(/first name/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/last name/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText(/^password/i)).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('type', 'password');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      mockUseRegister.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<RegisterForm />);

      const firstNameInput = screen.getByLabelText(/first name/i);

      await user.tab();

      expect(firstNameInput).toHaveFocus();
    });
  });
});
