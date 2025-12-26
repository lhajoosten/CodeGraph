import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { LoginForm } from '@/components/auth/login-form';
import { useLogin } from '@/hooks/api/auth/mutations/use-login';
import { renderWithQueryClient } from '../../utils/test-utils';
import { createMockMutation } from '../../fixtures/factories';
import { mockLoginCredentials } from '../../fixtures/auth-fixtures';

// Mock dependencies
vi.mock('@tanstack/react-router');
vi.mock('@/hooks/api/auth/mutations/use-login');
vi.mock('@/hooks/common/use-toggle', () => ({
  useToggle: () => ({
    isOpen: false,
    toggle: vi.fn(),
    open: vi.fn(),
    close: vi.fn(),
  }),
}));

describe('LoginForm', () => {
  const mockNavigate = vi.fn();
  const mockUseLogin = vi.mocked(useLogin);
  const mockUseNavigate = vi.mocked(useNavigate);
  const mockUseSearch = vi.mocked(useSearch);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseSearch.mockReturnValue({});
  });

  describe('Rendering', () => {
    it('should render login form with all fields', () => {
      mockUseLogin.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<LoginForm />);

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should display email and password input placeholders', () => {
      mockUseLogin.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<LoginForm />);

      expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    });
  });

  describe('User Input', () => {
    it('should allow typing in email field', async () => {
      const user = userEvent.setup();
      mockUseLogin.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;

      await user.type(emailInput, mockLoginCredentials.email);

      expect(emailInput.value).toBe(mockLoginCredentials.email);
    });

    it('should allow typing in password field', async () => {
      const user = userEvent.setup();
      mockUseLogin.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<LoginForm />);

      const passwordInput = screen.getByLabelText(/^password/i) as HTMLInputElement;

      await user.type(passwordInput, mockLoginCredentials.password);

      expect(passwordInput.value).toBe(mockLoginCredentials.password);
    });
  });

  describe('Validation', () => {
    it('should show error for empty email', async () => {
      const user = userEvent.setup();
      mockUseLogin.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.click(submitButton);

      await waitFor(
        () => {
          expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('should show error for empty password', async () => {
      const user = userEvent.setup();
      mockUseLogin.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, mockLoginCredentials.email);
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(screen.getByText(/password is required/i)).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid credentials', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();

      mockUseLogin.mockReturnValue({
        ...createMockMutation(),
        mutate: mockMutate,
      } as any);

      renderWithQueryClient(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, mockLoginCredentials.email);
      await user.type(passwordInput, mockLoginCredentials.password);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          {
            body: {
              email: mockLoginCredentials.email,
              password: mockLoginCredentials.password,
              remember_me: mockLoginCredentials.rememberMe,
            },
          },
          expect.any(Object)
        );
      });
    });

    it('should disable submit button while form is submitting', async () => {
      userEvent.setup();
      mockUseLogin.mockReturnValue(createMockMutation({ isPending: true }) as any);

      renderWithQueryClient(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      expect(submitButton).toBeDisabled();
    });

    it('should call onSuccess callback after successful login', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = vi.fn();
      const mockMutate = vi.fn((_, callbacks) => {
        callbacks?.onSuccess?.();
      });

      mockUseLogin.mockReturnValue({
        ...createMockMutation(),
        mutate: mockMutate,
      } as any);

      renderWithQueryClient(<LoginForm onSuccess={mockOnSuccess} />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, mockLoginCredentials.email);
      await user.type(passwordInput, mockLoginCredentials.password);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should navigate to dashboard after successful login', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn((_, callbacks) => {
        callbacks?.onSuccess?.();
      });

      mockUseLogin.mockReturnValue({
        ...createMockMutation(),
        mutate: mockMutate,
      } as any);

      renderWithQueryClient(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, mockLoginCredentials.email);
      await user.type(passwordInput, mockLoginCredentials.password);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });
      });
    });

    it('should navigate to redirect URL if provided', async () => {
      const user = userEvent.setup();
      const redirectUrl = '/tasks';
      const mockMutate = vi.fn((_, callbacks) => {
        callbacks?.onSuccess?.();
      });

      mockUseSearch.mockReturnValue({ redirect: redirectUrl });
      mockUseLogin.mockReturnValue({
        ...createMockMutation(),
        mutate: mockMutate,
      } as any);

      renderWithQueryClient(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, mockLoginCredentials.email);
      await user.type(passwordInput, mockLoginCredentials.password);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: redirectUrl });
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on login failure', async () => {
      const errorMessage = 'Invalid email or password';
      mockUseLogin.mockReturnValue(
        createMockMutation({
          isError: true,
          error: new Error(errorMessage),
        }) as any
      );

      renderWithQueryClient(<LoginForm />);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display generic error when no error message provided', async () => {
      mockUseLogin.mockReturnValue(
        createMockMutation({
          isError: true,
          error: new Error(),
        }) as any
      );

      renderWithQueryClient(<LoginForm />);

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form labels', () => {
      mockUseLogin.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<LoginForm />);

      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText(/^password/i)).toHaveAttribute('type', 'password');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      mockUseLogin.mockReturnValue(createMockMutation() as any);

      renderWithQueryClient(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);

      await user.tab();

      expect(emailInput).toHaveFocus();
    });
  });
});
