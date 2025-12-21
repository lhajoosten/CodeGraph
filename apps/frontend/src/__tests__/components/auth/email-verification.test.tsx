import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EmailVerification } from '@/components/auth/email-verification';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { client } from '@/openapi/client.gen';

// Mock dependencies
vi.mock('@tanstack/react-router');
vi.mock('@/openapi/client.gen');

describe('EmailVerification', () => {
  const mockNavigate = vi.fn();
  const mockUseLocation = vi.mocked(useLocation);
  const mockClient = vi.mocked(client);

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should show loading state initially', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/verify-email',
      search: '?token=test_token',
      hash: '',
      state: {},
      key: 'test',
    } as any);

    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(<EmailVerification />);

    expect(screen.getByText(/Verifying Email/i)).toBeInTheDocument();
    expect(screen.getByText(/please wait/i)).toBeInTheDocument();
  });

  it('should display success message on successful verification', async () => {
    mockUseLocation.mockReturnValue({
      pathname: '/verify-email',
      search: '?token=valid_token_123',
      hash: '',
      state: {},
      key: 'test',
    } as any);

    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    mockClient.post.mockResolvedValue({
      response: {
        ok: true,
        status: 200,
      },
      data: { message: 'Email verified successfully' },
    } as any);

    render(<EmailVerification />);

    await waitFor(() => {
      expect(screen.getByText(/Email Verified!/i)).toBeInTheDocument();
      expect(screen.getByText(/Email verified successfully/i)).toBeInTheDocument();
    });
  });

  it('should redirect to login after successful verification', async () => {
    mockUseLocation.mockReturnValue({
      pathname: '/verify-email',
      search: '?token=valid_token_123',
      hash: '',
      state: {},
      key: 'test',
    } as any);

    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    mockClient.post.mockResolvedValue({
      response: {
        ok: true,
        status: 200,
      },
      data: { message: 'Email verified successfully' },
    } as any);

    render(<EmailVerification />);

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' });
      },
      { timeout: 3000 }
    );
  });

  it('should display error message on verification failure', async () => {
    mockUseLocation.mockReturnValue({
      pathname: '/verify-email',
      search: '?token=invalid_token',
      hash: '',
      state: {},
      key: 'test',
    } as any);

    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    mockClient.post.mockResolvedValue({
      response: {
        ok: false,
        status: 400,
      },
      data: { detail: 'Invalid or expired verification token' },
    } as any);

    render(<EmailVerification />);

    await waitFor(() => {
      expect(screen.getByText(/Verification Failed/i)).toBeInTheDocument();
    });
  });

  it('should display error when token is missing', async () => {
    mockUseLocation.mockReturnValue({
      pathname: '/verify-email',
      search: '',
      hash: '',
      state: {},
      key: 'test',
    } as any);

    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(<EmailVerification />);

    await waitFor(() => {
      expect(screen.getByText(/Verification not found/i)).toBeInTheDocument();
    });
  });

  it('should display back to login button on error', async () => {
    mockUseLocation.mockReturnValue({
      pathname: '/verify-email',
      search: '?token=invalid_token',
      hash: '',
      state: {},
      key: 'test',
    } as any);

    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    mockClient.post.mockResolvedValue({
      response: {
        ok: false,
        status: 400,
      },
      data: { detail: 'Invalid token' },
    } as any);

    render(<EmailVerification />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /Back to Login/i });
      expect(button).toBeInTheDocument();
    });
  });
});
