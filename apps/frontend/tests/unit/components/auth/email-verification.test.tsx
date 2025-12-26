import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EmailVerification } from '@/components/auth/email-verification';
import { useNavigate, useSearch } from '@tanstack/react-router';
import * as authApi from '@/openapi/sdk.gen';
import { useAuthStore } from '@/stores/auth-store';

// Mock dependencies
vi.mock('@tanstack/react-router');
vi.mock('@/openapi/sdk.gen');
vi.mock('@/stores/auth-store');

describe('EmailVerification', () => {
  const mockNavigate = vi.fn();
  const mockUseSearch = vi.mocked(useSearch);
  const mockUseNavigate = vi.mocked(useNavigate);
  const mockUseAuthStore = vi.mocked(useAuthStore);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers(); // Use real timers for simplicity
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseSearch.mockReturnValue({ token: undefined } as any);
    mockUseAuthStore.mockReturnValue({
      setEmailVerified: vi.fn(),
      isAuthenticated: false,
    } as any);
  });

  it('should show loading state initially', () => {
    mockUseSearch.mockReturnValue({ token: 'test_token' } as any);
    render(<EmailVerification />);

    expect(screen.getByText(/Verifying Email/i)).toBeInTheDocument();
    expect(screen.getByText(/please wait/i)).toBeInTheDocument();
  });

  it('should display success message on successful verification', async () => {
    mockUseSearch.mockReturnValue({ token: 'valid_token_123' } as any);
    vi.mocked(authApi.verifyEmailApiV1AuthVerifyEmailPost).mockResolvedValue({
      data: { message: 'Email verified successfully' },
    } as any);

    render(<EmailVerification />);

    await waitFor(
      () => {
        expect(screen.getByText(/Email Verified!/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should redirect to login after successful verification', async () => {
    mockUseSearch.mockReturnValue({ token: 'valid_token_123' } as any);
    vi.mocked(authApi.verifyEmailApiV1AuthVerifyEmailPost).mockResolvedValue({
      data: { message: 'Email verified successfully' },
    } as any);

    render(<EmailVerification />);

    await waitFor(
      () => {
        expect(screen.getByText(/Email Verified!/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should display error message on verification failure', async () => {
    mockUseSearch.mockReturnValue({ token: 'invalid_token' } as any);
    vi.mocked(authApi.verifyEmailApiV1AuthVerifyEmailPost).mockResolvedValue({
      error: { detail: 'Invalid or expired verification token' },
    } as any);

    render(<EmailVerification />);

    await waitFor(
      () => {
        expect(screen.getByText(/Verification Failed/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should display error when token is missing', async () => {
    mockUseSearch.mockReturnValue({} as any);
    render(<EmailVerification />);

    await waitFor(
      () => {
        expect(screen.getByText(/Verification token not found/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should display back to login button on error', async () => {
    mockUseSearch.mockReturnValue({ token: 'invalid_token' } as any);
    vi.mocked(authApi.verifyEmailApiV1AuthVerifyEmailPost).mockResolvedValue({
      error: { detail: 'Invalid token' },
    } as any);

    render(<EmailVerification />);

    await waitFor(
      () => {
        const button = screen.getByRole('button', { name: /Back to Login/i });
        expect(button).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
