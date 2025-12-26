import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordResetForm } from '@/components/auth/password-reset-form';
import * as passwordResetApi from '@/openapi/sdk.gen';
import { renderWithQueryClient } from '../../utils/test-utils';

// Mock the API
vi.mock('@/openapi/sdk.gen', () => ({
  resetPasswordApiV1AuthResetPasswordPost: vi.fn(),
}));

// Mock the router
vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(() => vi.fn()),
}));

describe('PasswordResetForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render password reset form', () => {
    renderWithQueryClient(<PasswordResetForm token="test_token" />);

    expect(screen.getByRole('heading', { name: /Reset Your Password/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter new password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Confirm new password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset Password/i })).toBeInTheDocument();
  });

  it('should validate password minimum length', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<PasswordResetForm token="test_token" />);

    const passwordInput = screen.getByPlaceholderText(/Enter new password/i);
    const confirmInput = screen.getByPlaceholderText(/Confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /Reset Password/i });

    await user.type(passwordInput, 'short');
    await user.type(confirmInput, 'short');
    await user.click(submitButton);

    await waitFor(
      () => {
        expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('should validate password confirmation match', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<PasswordResetForm token="test_token" />);

    const passwordInput = screen.getByPlaceholderText(/Enter new password/i);
    const confirmInput = screen.getByPlaceholderText(/Confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /Reset Password/i });

    await user.type(passwordInput, 'Password123!');
    await user.type(confirmInput, 'Password456!');
    await user.click(submitButton);

    await waitFor(
      () => {
        expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const mockResetPassword = vi.mocked(passwordResetApi.resetPasswordApiV1AuthResetPasswordPost);
    mockResetPassword.mockResolvedValue({
      data: { message: 'Password reset successfully' },
    } as any);

    renderWithQueryClient(<PasswordResetForm token="test_token_123" />);

    const passwordInput = screen.getByPlaceholderText(/Enter new password/i);
    const confirmInput = screen.getByPlaceholderText(/Confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /Reset Password/i });

    await user.type(passwordInput, 'NewPassword123!');
    await user.type(confirmInput, 'NewPassword123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith({
        body: {
          token: 'test_token_123',
          password: 'NewPassword123!',
        },
      });
    });
  });

  it('should disable submit button while pending', async () => {
    const user = userEvent.setup();
    const mockResetPassword = vi.mocked(passwordResetApi.resetPasswordApiV1AuthResetPasswordPost);
    mockResetPassword.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ data: { message: 'Password reset successfully' } } as any),
            1000
          )
        )
    );

    renderWithQueryClient(<PasswordResetForm token="test_token" />);

    const passwordInput = screen.getByPlaceholderText(/Enter new password/i);
    const confirmInput = screen.getByPlaceholderText(/Confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /Reset Password/i });

    await user.type(passwordInput, 'NewPassword123!');
    await user.type(confirmInput, 'NewPassword123!');
    await user.click(submitButton);

    // While pending
    const resettingButton = screen.getByRole('button', { name: /Resetting/i });
    expect(resettingButton).toBeDisabled();
  });

  it('should show success message on successful reset', async () => {
    const user = userEvent.setup();
    const mockResetPassword = vi.mocked(passwordResetApi.resetPasswordApiV1AuthResetPasswordPost);
    mockResetPassword.mockResolvedValue({
      data: { message: 'Password reset successfully' },
    } as any);

    renderWithQueryClient(<PasswordResetForm token="test_token" />);

    const passwordInput = screen.getByPlaceholderText(/Enter new password/i);
    const confirmInput = screen.getByPlaceholderText(/Confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /Reset Password/i });

    await user.type(passwordInput, 'NewPassword123!');
    await user.type(confirmInput, 'NewPassword123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Password reset successfully/i)).toBeInTheDocument();
    });
  });

  it('should display error message on failure', async () => {
    const user = userEvent.setup();
    const mockResetPassword = vi.mocked(passwordResetApi.resetPasswordApiV1AuthResetPasswordPost);
    const mockError: any = new Error('Failed to reset password');
    mockError.response = {
      data: {
        detail: 'Invalid or expired token',
      },
    };
    mockResetPassword.mockRejectedValue(mockError);

    renderWithQueryClient(<PasswordResetForm token="test_token" />);

    const passwordInput = screen.getByPlaceholderText(/Enter new password/i);
    const confirmInput = screen.getByPlaceholderText(/Confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /Reset Password/i });

    await user.type(passwordInput, 'NewPassword123!');
    await user.type(confirmInput, 'NewPassword123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Invalid or expired token/i)).toBeInTheDocument();
    });
  });

  it('should call onSuccess callback when provided', async () => {
    const user = userEvent.setup();
    const mockResetPassword = vi.mocked(passwordResetApi.resetPasswordApiV1AuthResetPasswordPost);
    mockResetPassword.mockResolvedValue({
      data: { message: 'Password reset successfully' },
    } as any);
    const onSuccessSpy = vi.fn();

    renderWithQueryClient(<PasswordResetForm token="test_token" onSuccess={onSuccessSpy} />);

    const passwordInput = screen.getByPlaceholderText(/Enter new password/i);
    const confirmInput = screen.getByPlaceholderText(/Confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /Reset Password/i });

    await user.type(passwordInput, 'NewPassword123!');
    await user.type(confirmInput, 'NewPassword123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSuccessSpy).toHaveBeenCalled();
    });
  });
});
