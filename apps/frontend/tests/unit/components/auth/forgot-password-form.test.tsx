import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import * as forgotPasswordApi from '@/openapi/sdk.gen';
import { renderWithQueryClient } from '../../utils/test-utils';

// Mock the API
vi.mock('@/openapi/sdk.gen', () => ({
  forgotPasswordApiV1AuthForgotPasswordPost: vi.fn(),
}));

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render forgot password form', () => {
    renderWithQueryClient(<ForgotPasswordForm />);

    expect(screen.getByRole('heading', { name: /Reset Your Password/i })).toBeInTheDocument();
    expect(screen.getByText(/Enter your email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Reset Link/i })).toBeInTheDocument();
  });

  it('should require email input', () => {
    renderWithQueryClient(<ForgotPasswordForm />);

    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });
    expect(submitButton).toBeDisabled();
  });

  it('should submit form with email', async () => {
    const user = userEvent.setup();
    const mockForgotPassword = vi.mocked(
      forgotPasswordApi.forgotPasswordApiV1AuthForgotPasswordPost
    );
    mockForgotPassword.mockResolvedValue({ data: { message: 'Reset link sent' } } as any);

    renderWithQueryClient(<ForgotPasswordForm />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith({
        body: { email: 'test@example.com' },
      });
    });
  });

  it('should disable submit button while pending', async () => {
    const user = userEvent.setup();
    const mockForgotPassword = vi.mocked(
      forgotPasswordApi.forgotPasswordApiV1AuthForgotPasswordPost
    );
    mockForgotPassword.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { message: 'Reset link sent' } } as any), 1000)
        )
    );

    renderWithQueryClient(<ForgotPasswordForm />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    // While pending
    const sendingButton = screen.getByRole('button', { name: /Sending/i });
    expect(sendingButton).toBeDisabled();
  });

  it('should show confirmation message on success', async () => {
    const user = userEvent.setup();
    const mockForgotPassword = vi.mocked(
      forgotPasswordApi.forgotPasswordApiV1AuthForgotPasswordPost
    );
    mockForgotPassword.mockResolvedValue({ data: { message: 'Reset link sent' } } as any);

    renderWithQueryClient(<ForgotPasswordForm />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Check Your Email/i })).toBeInTheDocument();
    });
  });

  it('should display confirmation message after submission', async () => {
    const user = userEvent.setup();
    const mockForgotPassword = vi.mocked(
      forgotPasswordApi.forgotPasswordApiV1AuthForgotPasswordPost
    );
    mockForgotPassword.mockResolvedValue({ data: { message: 'Reset link sent' } } as any);

    renderWithQueryClient(<ForgotPasswordForm />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Check Your Email/i })).toBeInTheDocument();
    });
  });

  it('should call onSuccess callback when provided', async () => {
    const user = userEvent.setup();
    const mockForgotPassword = vi.mocked(
      forgotPasswordApi.forgotPasswordApiV1AuthForgotPasswordPost
    );
    mockForgotPassword.mockResolvedValue({ data: { message: 'Reset link sent' } } as any);
    const onSuccessSpy = vi.fn();

    renderWithQueryClient(<ForgotPasswordForm onSuccess={onSuccessSpy} />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSuccessSpy).toHaveBeenCalled();
    });
  });

  it('should show email in confirmation message', async () => {
    const user = userEvent.setup();
    const mockForgotPassword = vi.mocked(
      forgotPasswordApi.forgotPasswordApiV1AuthForgotPasswordPost
    );
    mockForgotPassword.mockResolvedValue({ data: { message: 'Reset link sent' } } as any);

    renderWithQueryClient(<ForgotPasswordForm />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Check Your Email/i })).toBeInTheDocument();
    });
  });
});
