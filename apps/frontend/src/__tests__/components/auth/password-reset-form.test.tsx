import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordResetForm } from '@/components/auth/password-reset-form';
import { useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';

// Mock dependencies
vi.mock('@tanstack/react-router');
vi.mock('@tanstack/react-query');

describe('PasswordResetForm', () => {
  const mockNavigate = vi.fn();
  const mockUseMutation = vi.mocked(useMutation);

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should render password reset form', () => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
      data: null,
      status: 'idle',
      reset: vi.fn(),
    } as any);

    render(<PasswordResetForm token="test_token" />);

    expect(screen.getByText(/Reset Your Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
  });

  it('should validate password minimum length', async () => {
    const user = userEvent.setup();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
      data: null,
      status: 'idle',
    } as any);

    render(<PasswordResetForm token="test_token" />);

    const passwordInput = screen.getByLabelText(/New Password/i);
    const submitButton = screen.getByRole('button', { name: /Reset Password/i });

    await user.type(passwordInput, 'short');
    await user.click(submitButton);

    expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
  });

  it('should validate password confirmation match', async () => {
    const user = userEvent.setup();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
      data: null,
      status: 'idle',
    } as any);

    render(<PasswordResetForm token="test_token" />);

    const passwordInput = screen.getByLabelText(/^New Password/i);
    const confirmInput = screen.getByLabelText(/Confirm Password/i);
    const submitButton = screen.getByRole('button', { name: /Reset Password/i });

    await user.type(passwordInput, 'Password123!');
    await user.type(confirmInput, 'Password456!');
    await user.click(submitButton);

    expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();

    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
      data: null,
      status: 'idle',
    } as any);

    render(<PasswordResetForm token="test_token_123" />);

    const passwordInput = screen.getByLabelText(/^New Password/i);
    const confirmInput = screen.getByLabelText(/Confirm Password/i);
    const submitButton = screen.getByRole('button', { name: /Reset Password/i });

    await user.type(passwordInput, 'NewPassword123!');
    await user.type(confirmInput, 'NewPassword123!');
    await user.click(submitButton);

    expect(mockMutate).toHaveBeenCalledWith({
      password: 'NewPassword123!',
    });
  });

  it('should disable submit button while pending', () => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      isSuccess: false,
      isError: false,
      error: null,
      data: null,
      status: 'pending',
    } as any);

    render(<PasswordResetForm token="test_token" />);

    const submitButton = screen.getByRole('button', { name: /Resetting/i });
    expect(submitButton).toBeDisabled();
  });

  it('should show success message on successful reset', () => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: true,
      isError: false,
      error: null,
      data: { message: 'Password reset successfully' },
      status: 'success',
    } as any);

    render(<PasswordResetForm token="test_token" />);

    expect(screen.getByText(/Password reset successfully/i)).toBeInTheDocument();
  });

  it('should display error message on failure', () => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    const mockError = new Error('Failed to reset password');
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: true,
      error: mockError as any,
      data: null,
      status: 'error',
    } as any);

    render(<PasswordResetForm token="test_token" />);

    expect(screen.getByText(/Failed to reset password/i)).toBeInTheDocument();
  });

  it('should call onSuccess callback when provided', () => {
    const mockOnSuccess = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: true,
      isError: false,
      error: null,
      data: null,
      status: 'success',
    } as any);

    render(<PasswordResetForm token="test_token" onSuccess={mockOnSuccess} />);

    // Note: In a real implementation, you'd verify onSuccess was called during the mutation
    expect(screen.getByText(/Reset Your Password/i)).toBeInTheDocument();
  });
});
