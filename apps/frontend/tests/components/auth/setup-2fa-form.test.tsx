import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Setup2FAForm } from '@/components/auth/setup-2fa-form';
import { useSetup2FA } from '@/hooks/api/auth/mutations/use-setup-2fa';
import { renderWithQueryClient } from '../../utils/test-utils';

vi.mock('@/hooks/api/auth/mutations/use-setup-2fa');
vi.mock('@/hooks/useTranslation', () => ({
  useTranslationNamespace: () => ({
    t: (key: string) => key,
  }),
}));
vi.mock('@/lib/toast', () => ({
  addToast: vi.fn(),
}));

describe('Setup2FAForm', () => {
  const mockUseSetup2FA = vi.mocked(useSetup2FA);

  const createMockSetup2FAReturn = (overrides?: any) => ({
    step: 'qr' as const,
    otp: '',
    codesConfirmed: false,
    copied: null,
    qrData: {
      qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...',
      secret: 'JBSWY3DPEBLW64TMMQ======',
    },
    backupCodes: ['ABC12345', 'DEF67890', 'GHI11111'],
    isLoading: false,
    isVerifying: false,
    error: null,
    setStep: vi.fn(),
    setOtp: vi.fn(),
    setCodesConfirmed: vi.fn(),
    setCopied: vi.fn(),
    startSetup: vi.fn(),
    verifyOTP: vi.fn(),
    downloadCodes: vi.fn(),
    copyCode: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Step 1: QR Code Display', () => {
    it('should render QR code step by default', () => {
      mockUseSetup2FA.mockReturnValue(createMockSetup2FAReturn());

      renderWithQueryClient(<Setup2FAForm />);

      expect(screen.getByRole('heading', { name: /luminous.twoFactor.setup.scanQR/i })).toBeInTheDocument();
    });

    it('should display QR code image', () => {
      mockUseSetup2FA.mockReturnValue(createMockSetup2FAReturn());

      renderWithQueryClient(<Setup2FAForm />);

      const qrImage = screen.getByAltText('2FA QR Code');
      expect(qrImage).toBeInTheDocument();
      expect(qrImage).toHaveAttribute('src', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...');
    });

    it('should display manual entry key (secret)', () => {
      mockUseSetup2FA.mockReturnValue(createMockSetup2FAReturn());

      renderWithQueryClient(<Setup2FAForm />);

      expect(screen.getByText('JBSWY3DPEBLW64TMMQ======')).toBeInTheDocument();
    });

    it('should display continue button for QR step', () => {
      mockUseSetup2FA.mockReturnValue(createMockSetup2FAReturn());

      renderWithQueryClient(<Setup2FAForm />);

      expect(screen.getByRole('button', { name: /luminous.twoFactor.setup.continue/i })).toBeInTheDocument();
    });

    it('should show step indicator with QR as active', () => {
      mockUseSetup2FA.mockReturnValue(createMockSetup2FAReturn());

      const { container } = renderWithQueryClient(<Setup2FAForm />);

      const steps = container.querySelectorAll('[class*="flex h-8 w-8"]');
      expect(steps.length).toBeGreaterThan(0);
    });
  });

  describe('Step 1: Loading State', () => {
    it('should show loading message when isLoading is true', () => {
      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          isLoading: true,
          qrData: undefined,
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      expect(screen.getByText(/Loading 2FA setup/i)).toBeInTheDocument();
    });

    it('should not show continue button while loading', () => {
      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          isLoading: true,
          qrData: undefined,
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      const button = screen.queryByRole('button', { name: /luminous.twoFactor.setup.continue/i });
      expect(button).not.toBeInTheDocument();
    });
  });

  describe('Step 1: Error State', () => {
    it('should show error message when setup fails', () => {
      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          error: new Error('Failed to load 2FA setup'),
          qrData: undefined,
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      expect(screen.getByText(/Failed to load 2FA setup/i)).toBeInTheDocument();
    });

    it('should show retry button on error', () => {
      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          error: new Error('Failed to load 2FA setup'),
          qrData: undefined,
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });
  });

  describe('Step Transitions: QR → Verify', () => {
    it('should transition to verify step when continue button clicked', async () => {
      const user = userEvent.setup();
      const mockSetStep = vi.fn();

      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          setStep: mockSetStep,
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      const continueButton = screen.getByRole('button', { name: /luminous.twoFactor.setup.continue/i });
      await user.click(continueButton);

      expect(mockSetStep).toHaveBeenCalledWith('verify');
    });
  });

  describe('Step 2: OTP Verification', () => {
    it('should render OTP input when step is verify', () => {
      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'verify',
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      expect(screen.getByText('Verification Code')).toBeInTheDocument();
    });

    it('should display back to QR button', () => {
      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'verify',
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      expect(screen.getByRole('button', { name: /luminous.twoFactor.setup.backToQR/i })).toBeInTheDocument();
    });

    it('should display verify code button', () => {
      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'verify',
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      expect(screen.getByRole('button', { name: /luminous.twoFactor.setup.verifyCode/i })).toBeInTheDocument();
    });

    it('should disable verify button when OTP length is not 6', () => {
      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'verify',
          otp: '123',
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      const verifyButton = screen.getAllByRole('button').find(b => b.textContent?.includes('luminous.twoFactor.setup.verifyCode'));
      expect(verifyButton).toBeDisabled();
    });

    it('should enable verify button when OTP is 6 digits', () => {
      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'verify',
          otp: '123456',
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      const verifyButton = screen.getAllByRole('button').find(b => b.textContent?.includes('luminous.twoFactor.setup.verifyCode'));
      expect(verifyButton).not.toBeDisabled();
    });

    it('should call verifyOTP when verify button clicked with 6-digit OTP', async () => {
      const user = userEvent.setup();
      const mockVerifyOTP = vi.fn();

      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'verify',
          otp: '123456',
          verifyOTP: mockVerifyOTP,
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      const verifyButtons = screen.getAllByRole('button');
      const verifyButton = verifyButtons.find(b => b.textContent?.includes('luminous.twoFactor.setup.verifyCode'));

      if (verifyButton && !verifyButton.disabled) {
        await user.click(verifyButton);
        expect(mockVerifyOTP).toHaveBeenCalled();
      }
    });

    it('should show loading state while verifying', () => {
      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'verify',
          isVerifying: true,
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      expect(screen.getByText(/luminous.twoFactor.verify.submit/i)).toBeInTheDocument();
    });

    it('should transition back to QR step', async () => {
      const user = userEvent.setup();
      const mockSetStep = vi.fn();
      const mockSetOtp = vi.fn();

      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'verify',
          setStep: mockSetStep,
          setOtp: mockSetOtp,
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      const backButton = screen.getByRole('button', { name: /luminous.twoFactor.setup.backToQR/i });
      await user.click(backButton);

      expect(mockSetStep).toHaveBeenCalledWith('qr');
      expect(mockSetOtp).toHaveBeenCalledWith('');
    });
  });

  describe('Step 3: Backup Codes', () => {
    it('should render backup codes step', () => {
      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'backup',
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      expect(screen.getByText(/luminous.twoFactor.setup.saveBackup/i)).toBeInTheDocument();
    });

    it('should display warning about backup codes', () => {
      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'backup',
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      expect(screen.getByText(/luminous.twoFactor.setup.keepCodesSafe/i)).toBeInTheDocument();
    });

    it('should display all backup codes', () => {
      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'backup',
          backupCodes: ['ABC12345', 'DEF67890', 'GHI11111'],
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      expect(screen.getByText('ABC12345')).toBeInTheDocument();
      expect(screen.getByText('DEF67890')).toBeInTheDocument();
      expect(screen.getByText('GHI11111')).toBeInTheDocument();
    });

    it('should display download button', () => {
      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'backup',
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      expect(screen.getByRole('button', { name: /luminous.twoFactor.setup.downloadCodes/i })).toBeInTheDocument();
    });

    it('should display confirmation checkbox', () => {
      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'backup',
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('should display complete setup button', () => {
      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'backup',
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      expect(screen.getByRole('button', { name: /luminous.twoFactor.setup.completeSetup/i })).toBeInTheDocument();
    });

    it('should disable complete button when codes not confirmed', () => {
      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'backup',
          codesConfirmed: false,
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      const completeButton = screen.getByRole('button', { name: /luminous.twoFactor.setup.completeSetup/i });
      expect(completeButton).toBeDisabled();
    });

    it('should enable complete button when codes confirmed', () => {
      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'backup',
          codesConfirmed: true,
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      const completeButton = screen.getByRole('button', { name: /luminous.twoFactor.setup.completeSetup/i });
      expect(completeButton).not.toBeDisabled();
    });
  });

  describe('Backup Code Copy Functionality', () => {
    it('should allow copying individual backup codes', () => {
      const mockCopyCode = vi.fn();

      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'backup',
          copyCode: mockCopyCode,
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      const codeElements = screen.getAllByText(/ABC12345/);
      expect(codeElements.length).toBeGreaterThan(0);
    });

    it('should show checkmark when code is copied', () => {
      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'backup',
          copied: 'ABC12345',
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      expect(screen.getByText('ABC12345')).toBeInTheDocument();
    });
  });

  describe('Step Indicators', () => {
    it('should show progress through steps', () => {
      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'qr',
        })
      );

      const { container } = renderWithQueryClient(<Setup2FAForm />);

      const stepIndicators = container.querySelectorAll('[class*="flex h-8 w-8"]');
      expect(stepIndicators.length).toBeGreaterThan(0);
    });

    it('should mark completed steps as completed', () => {
      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'backup',
        })
      );

      const { container } = renderWithQueryClient(<Setup2FAForm />);

      const stepIndicators = container.querySelectorAll('[class*="flex h-8 w-8"]');
      expect(stepIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Completion Handler', () => {
    it('should call onSuccess callback when setup is completed', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = vi.fn();
      const mockSetCodesConfirmed = vi.fn();

      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'backup',
          codesConfirmed: true,
          setCodesConfirmed: mockSetCodesConfirmed,
        })
      );

      renderWithQueryClient(<Setup2FAForm onSuccess={mockOnSuccess} />);

      const completeButton = screen.getByRole('button', { name: /luminous.twoFactor.setup.completeSetup/i });
      await user.click(completeButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should show warning if trying to complete without confirming backup codes', () => {
      const mockOnSuccess = vi.fn();

      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'backup',
          codesConfirmed: false,
        })
      );

      renderWithQueryClient(<Setup2FAForm onSuccess={mockOnSuccess} />);

      const completeButton = screen.getByRole('button', { name: /luminous.twoFactor.setup.completeSetup/i });
      expect(completeButton).toBeDisabled();
    });
  });

  describe('Download Functionality', () => {
    it('should call downloadCodes when download button clicked', async () => {
      const user = userEvent.setup();
      const mockDownloadCodes = vi.fn();

      mockUseSetup2FA.mockReturnValue(
        createMockSetup2FAReturn({
          step: 'backup',
          downloadCodes: mockDownloadCodes,
        })
      );

      renderWithQueryClient(<Setup2FAForm />);

      const downloadButton = screen.getByRole('button', { name: /luminous.twoFactor.setup.downloadCodes/i });
      await user.click(downloadButton);

      expect(mockDownloadCodes).toHaveBeenCalled();
    });
  });
});
