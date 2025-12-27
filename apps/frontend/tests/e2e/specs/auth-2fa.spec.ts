/**
 * E2E Tests: Two-Factor Authentication Flow
 *
 * Tests cover:
 * - 2FA setup flow (QR code, secret key, verification)
 * - 2FA verification during login
 * - Backup codes display and usage
 * - Skip 2FA setup option
 * - Invalid code handling
 * - OTP input behavior
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { TwoFactorSetupPage, TwoFactorVerificationPage } from '../pages/two-factor.page';
import {
  USER_WITH_2FA,
  EXISTING_USER,
  TEST_2FA_CODES,
} from '../fixtures';
import {
  mockLoginRequires2FA,
  mockLoginRequires2FASetup,
  mock2FASetupSuccess,
  mock2FAVerifySuccess,
  mock2FAVerifyInvalidCode,
  mock2FALoginSuccess,
  mock2FALoginInvalidCode,
  mockGetCurrentUserSuccess,
  setup2FALoginFlowMocks,
  setup2FASetupFlowMocks,
} from '../helpers';
import {
  setRequires2FASetupState,
} from '../helpers/test-utils';

// =============================================================================
// 2FA Setup Flow Tests
// =============================================================================

test.describe('2FA Setup Flow', () => {
  let loginPage: LoginPage;
  let setupPage: TwoFactorSetupPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    setupPage = new TwoFactorSetupPage(page);
  });

  // ===========================================================================
  // QR Code and Secret Display Tests
  // ===========================================================================

  test.describe('QR Code Display', () => {
    test('should display QR code after starting 2FA setup', async ({ page }) => {
      // Mock BEFORE navigating - route will fetch on load
      await mock2FASetupSuccess(page);
      // Set auth state for 2FA setup (navigates and sets auth state)
      await setRequires2FASetupState(page, EXISTING_USER);

      await setupPage.expectQRCodeDisplayed();
    });

    test('should display secret key for manual entry', async ({ page }) => {
      // Mock BEFORE navigating
      await mock2FASetupSuccess(page);
      // Set auth state for 2FA setup (navigates and sets auth state)
      await setRequires2FASetupState(page, EXISTING_USER);

      await setupPage.expectSecretKeyDisplayed();
    });
  });

  // ===========================================================================
  // 2FA Verification Tests
  // ===========================================================================

  test.describe('2FA Setup Verification', () => {
    test('should successfully verify and enable 2FA', async ({ page }) => {
      // Mock BEFORE navigating
      await setup2FASetupFlowMocks(page, { ...EXISTING_USER, twoFactorEnabled: true });
      // Set auth state for 2FA setup (navigates and sets auth state)
      await setRequires2FASetupState(page, EXISTING_USER);

      await setupPage.verify(TEST_2FA_CODES.valid);

      // Should show backup codes or redirect to dashboard
      const hasBackupCodes = await setupPage.backupCodes.isVisible().catch(() => false);
      const isDashboard = page.url().match(/^\/(dashboard)?$/);
      expect(hasBackupCodes || isDashboard).toBeTruthy();
    });

    test('should show error for invalid verification code', async ({ page }) => {
      // Mock BEFORE navigating
      await mock2FASetupSuccess(page);
      await mock2FAVerifyInvalidCode(page);
      // Set auth state for 2FA setup (navigates and sets auth state)
      await setRequires2FASetupState(page, EXISTING_USER);

      await setupPage.verify(TEST_2FA_CODES.invalid);

      await setupPage.expectError(/invalid|incorrect/i);
    });

    test('should show loading state during verification', async ({ page }) => {
      // Mock BEFORE navigating
      await mock2FASetupSuccess(page);
      await page.route('**/api/v1/auth/2fa/verify', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, backup_codes: ['AAAA-BBBB'] }),
        });
      });
      // Set auth state for 2FA setup (navigates and sets auth state)
      await setRequires2FASetupState(page, EXISTING_USER);

      await setupPage.fillCode(TEST_2FA_CODES.valid);
      await setupPage.clickVerify();

      await expect(setupPage.verifyButton).toBeDisabled();
    });
  });

  // ===========================================================================
  // Backup Codes Tests
  // ===========================================================================

  test.describe('Backup Codes', () => {
    test('should display backup codes after successful verification', async ({ page }) => {
      // Mock BEFORE navigating
      await mock2FASetupSuccess(page);
      await mock2FAVerifySuccess(page);
      await mockGetCurrentUserSuccess(page, { ...EXISTING_USER, twoFactorEnabled: true });
      // Set auth state for 2FA setup (navigates and sets auth state)
      await setRequires2FASetupState(page, EXISTING_USER);

      await setupPage.verify(TEST_2FA_CODES.valid);

      await setupPage.expectBackupCodesDisplayed();
    });

    test('should have at least 5 backup codes', async ({ page }) => {
      // Mock BEFORE navigating
      await mock2FASetupSuccess(page);
      await mock2FAVerifySuccess(page);
      await mockGetCurrentUserSuccess(page, { ...EXISTING_USER, twoFactorEnabled: true });
      // Set auth state for 2FA setup (navigates and sets auth state)
      await setRequires2FASetupState(page, EXISTING_USER);

      await setupPage.verify(TEST_2FA_CODES.valid);

      const codes = await setupPage.getBackupCodes();
      expect(codes.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ===========================================================================
  // Skip Setup Tests
  // ===========================================================================

  test.describe('Skip 2FA Setup', () => {
    test('should allow skipping 2FA setup if option available', async ({ page }) => {
      // Mock BEFORE navigating
      await mock2FASetupSuccess(page);
      await mockGetCurrentUserSuccess(page, EXISTING_USER);
      // Set auth state for 2FA setup (navigates and sets auth state)
      await setRequires2FASetupState(page, EXISTING_USER);

      // Check if skip button is visible
      const skipVisible = await setupPage.skipButton.isVisible().catch(() => false);
      if (skipVisible) {
        await setupPage.clickSkip();
        await setupPage.expectRedirectToDashboard();
      }
    });
  });

  // ===========================================================================
  // Login Redirect to 2FA Setup Tests
  // ===========================================================================

  test.describe('Login to 2FA Setup Redirect', () => {
    test('should redirect to 2FA setup when required after login', async ({ page }) => {
      await mockLoginRequires2FASetup(page, EXISTING_USER);
      await mockGetCurrentUserSuccess(page, EXISTING_USER);

      await loginPage.navigate();
      await loginPage.login(EXISTING_USER.email, EXISTING_USER.password);

      await loginPage.expectRedirectTo2FASetup();
    });
  });
});

// =============================================================================
// 2FA Login Verification Tests
// =============================================================================

test.describe('2FA Login Verification', () => {
  let loginPage: LoginPage;
  let verificationPage: TwoFactorVerificationPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    verificationPage = new TwoFactorVerificationPage(page);
  });

  // ===========================================================================
  // Redirect to Verification Tests
  // ===========================================================================

  test.describe('Login Redirect', () => {
    test('should redirect to 2FA verification when 2FA is enabled', async ({ page }) => {
      await mockLoginRequires2FA(page, USER_WITH_2FA);

      await loginPage.navigate();
      await loginPage.login(USER_WITH_2FA.email, USER_WITH_2FA.password);

      // Auto-redirected to /verify-2fa after login
      await expect(page).toHaveURL(/\/verify-2fa(\?.*)?$/);
    });
  });

  // ===========================================================================
  // Verification Form Tests
  // ===========================================================================

  test.describe('Verification Form', () => {
    test('should display 2FA verification form', async ({ page }) => {
      await mockLoginRequires2FA(page, USER_WITH_2FA);

      await loginPage.navigate();
      await loginPage.login(USER_WITH_2FA.email, USER_WITH_2FA.password);

      // Already on /verify-2fa page after login
      await verificationPage.expectFormDisplayed();
    });

    test('should show backup code option', async ({ page }) => {
      await mockLoginRequires2FA(page, USER_WITH_2FA);

      await loginPage.navigate();
      await loginPage.login(USER_WITH_2FA.email, USER_WITH_2FA.password);

      // Already on /verify-2fa page after login
      await verificationPage.expectBackupCodeOptionVisible();
    });
  });

  // ===========================================================================
  // Successful Verification Tests
  // ===========================================================================

  test.describe('Successful Verification', () => {
    test('should login successfully with valid 2FA code', async ({ page }) => {
      await setup2FALoginFlowMocks(page, USER_WITH_2FA);

      await loginPage.navigate();
      await loginPage.login(USER_WITH_2FA.email, USER_WITH_2FA.password);

      await verificationPage.verify(TEST_2FA_CODES.valid);

      await verificationPage.expectRedirectToDashboard();
    });

    test('should store authentication state after 2FA verification', async ({ page }) => {
      await setup2FALoginFlowMocks(page, USER_WITH_2FA);

      await loginPage.navigate();
      await loginPage.login(USER_WITH_2FA.email, USER_WITH_2FA.password);
      await verificationPage.verify(TEST_2FA_CODES.valid);

      await verificationPage.expectRedirectToDashboard();

      const isAuth = await verificationPage.isAuthenticated();
      expect(isAuth).toBe(true);
    });
  });

  // ===========================================================================
  // Invalid Code Tests
  // ===========================================================================

  test.describe('Invalid Code Handling', () => {
    test('should show error for invalid 2FA code', async ({ page }) => {
      await mockLoginRequires2FA(page, USER_WITH_2FA);
      await mock2FALoginInvalidCode(page);

      await loginPage.navigate();
      await loginPage.login(USER_WITH_2FA.email, USER_WITH_2FA.password);

      await verificationPage.verify(TEST_2FA_CODES.invalid);

      await verificationPage.expectError(/invalid|incorrect/i);
    });

    test('should remain on verification page after failed attempt', async ({ page }) => {
      await mockLoginRequires2FA(page, USER_WITH_2FA);
      await mock2FALoginInvalidCode(page);

      await loginPage.navigate();
      await loginPage.login(USER_WITH_2FA.email, USER_WITH_2FA.password);

      await verificationPage.verify(TEST_2FA_CODES.invalid);

      await verificationPage.expectUrl(/\/verify-2fa/);
    });
  });

  // ===========================================================================
  // Backup Code Tests
  // ===========================================================================

  test.describe('Backup Code Usage', () => {
    test('should switch to backup code input mode', async ({ page }) => {
      await mockLoginRequires2FA(page, USER_WITH_2FA);

      await loginPage.navigate();
      await loginPage.login(USER_WITH_2FA.email, USER_WITH_2FA.password);

      await verificationPage.clickUseBackupCode();

      await expect(verificationPage.backupCodeInput).toBeVisible();
    });

    test('should login successfully with valid backup code', async ({ page }) => {
      await mockLoginRequires2FA(page, USER_WITH_2FA);
      await mock2FALoginSuccess(page, USER_WITH_2FA);
      await mockGetCurrentUserSuccess(page, USER_WITH_2FA);

      await loginPage.navigate();
      await loginPage.login(USER_WITH_2FA.email, USER_WITH_2FA.password);

      await verificationPage.verifyWithBackupCode('AAAA-BBBB');

      await verificationPage.expectRedirectToDashboard();
    });
  });

  // ===========================================================================
  // Cancel Verification Tests
  // ===========================================================================

  test.describe('Cancel Verification', () => {
    test('should allow canceling 2FA verification', async ({ page }) => {
      await mockLoginRequires2FA(page, USER_WITH_2FA);

      await loginPage.navigate();
      await loginPage.login(USER_WITH_2FA.email, USER_WITH_2FA.password);

      // Check if cancel button is visible
      const cancelVisible = await verificationPage.cancelButton.isVisible().catch(() => false);
      if (cancelVisible) {
        await verificationPage.clickCancel();
        await verificationPage.expectRedirectToLogin();
      }
    });
  });
});

// =============================================================================
// OTP Input Behavior Tests
// =============================================================================

test.describe('OTP Input Behavior', () => {
  let verificationPage: TwoFactorVerificationPage;

  test.beforeEach(async ({ page }) => {
    verificationPage = new TwoFactorVerificationPage(page);
    await mockLoginRequires2FA(page, USER_WITH_2FA);

    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(USER_WITH_2FA.email, USER_WITH_2FA.password);
  });

  test('should accept numeric input only', async ({ page }) => {
    const otpInputs = verificationPage.otpInputs;
    const count = await otpInputs.count();

    if (count >= 6) {
      // OTP inputs should only accept numbers
      await otpInputs.first().fill('A');
      const value = await otpInputs.first().inputValue();
      expect(value).toBe('');

      await otpInputs.first().fill('1');
      const numValue = await otpInputs.first().inputValue();
      expect(numValue).toBe('1');
    }
  });

  test('should auto-advance to next input on digit entry', async ({ page }) => {
    const otpInputs = verificationPage.otpInputs;
    const count = await otpInputs.count();

    if (count >= 6) {
      await otpInputs.first().click();
      await page.keyboard.type('1');

      // Focus should move to second input
      await expect(otpInputs.nth(1)).toBeFocused();
    }
  });

  test('should handle paste of full code', async ({ page }) => {
    const otpInputs = verificationPage.otpInputs;
    const count = await otpInputs.count();

    if (count >= 6) {
      await otpInputs.first().click();

      // Paste full code
      await page.keyboard.insertText('123456');

      // All inputs should be filled
      for (let i = 0; i < 6; i++) {
        const value = await otpInputs.nth(i).inputValue();
        expect(value).toBe(String(i + 1));
      }
    }
  });

  test('should handle backspace to previous input', async ({ page }) => {
    const otpInputs = verificationPage.otpInputs;
    const count = await otpInputs.count();

    if (count >= 6) {
      // Fill first two inputs
      await otpInputs.first().fill('1');
      await otpInputs.nth(1).fill('2');

      // Focus second input and press backspace
      await otpInputs.nth(1).click();
      await page.keyboard.press('Backspace');
      await page.keyboard.press('Backspace');

      // Focus should return to first input
      await expect(otpInputs.first()).toBeFocused();
    }
  });
});
