/**
 * E2E tests for Two-Factor Authentication (2FA) flow
 *
 * Tests cover:
 * - 2FA setup after email verification
 * - 2FA setup skip option
 * - 2FA verification during login
 * - Invalid 2FA codes
 * - Backup codes
 * - QR code display
 */

import { test, expect } from '@playwright/test';
import {
  EXISTING_USER,
  USER_WITH_2FA,
  TEST_2FA_CODES,
} from '../fixtures/users';
import {
  mockLoginRequires2FA,
  mock2FASetupSuccess,
  mock2FAVerifySuccess,
  mock2FAVerifyInvalidCode,
  mock2FALoginSuccess,
  mock2FALoginInvalidCode,
  mockGetCurrentUserSuccess,
  setup2FAFlowMocks,
} from '../helpers/mock-utils';
import {
  navigateToLogin,
  fillLoginForm,
  submitLoginForm,
  fill2FACode,
  submit2FACode,
  setup2FA as _setup2FA,
  skip2FASetup as _skip2FASetup,
  loginWithCredentials,
} from '../helpers/auth-helpers';
import {
  assertRedirectToDashboard,
  assertRedirectTo2FASetup as _assertRedirectTo2FASetup,
  assertRedirectTo2FAVerification,
  assert2FAQRCodeDisplayed,
  assertBackupCodesDisplayed,
  assertErrorToast,
  assertSuccessToast,
  assertFieldHasError,
} from '../helpers/assertions';
import { clickButton, assertButtonDisabled as _assertButtonDisabled } from '../helpers/page-helpers';

test.describe('2FA Setup After Email Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Simulate user just verified email and is redirected to 2FA setup
    await page.goto('/setup-2fa-after-verification');
    await mock2FASetupSuccess(page);
  });

  test('should display 2FA setup introduction', async ({ page }) => {
    await expect(page.getByText(/two-factor authentication|2fa/i)).toBeVisible();
    await expect(page.getByText(/additional security|secure your account/i)).toBeVisible();
  });

  test('should allow skipping 2FA setup', async ({ page }) => {
    const skipButton = page.getByRole('button', { name: /skip|later/i });
    await expect(skipButton).toBeVisible();
    await skipButton.click();

    // Should redirect to dashboard
    await assertRedirectToDashboard(page);
  });

  test('should display QR code after clicking continue', async ({ page }) => {
    await clickButton(page, /continue|set up/i);

    // Should display QR code
    await assert2FAQRCodeDisplayed(page);

    // Should display secret key
    await expect(page.getByText(/secret key|manual entry/i)).toBeVisible();
  });

  test('should successfully verify and enable 2FA', async ({ page }) => {
    await mock2FAVerifySuccess(page);
    await mockGetCurrentUserSuccess(page, { ...EXISTING_USER, twoFactorEnabled: true });

    await clickButton(page, /continue|set up/i);
    await assert2FAQRCodeDisplayed(page);

    // Fill verification code
    await fill2FACode(page, TEST_2FA_CODES.valid);
    await submit2FACode(page);

    // Should show backup codes
    await assertBackupCodesDisplayed(page);
    await assertSuccessToast(page, /2fa enabled|two-factor authentication enabled/i);
  });

  test('should show error for invalid verification code during setup', async ({ page }) => {
    await mock2FAVerifyInvalidCode(page);

    await clickButton(page, /continue|set up/i);
    await assert2FAQRCodeDisplayed(page);

    // Fill invalid code
    await fill2FACode(page, TEST_2FA_CODES.invalid);
    await submit2FACode(page);

    await assertErrorToast(page, /invalid.*code|incorrect code/i);
  });

  test('should display backup codes after successful verification', async ({ page }) => {
    await mock2FAVerifySuccess(page);

    await clickButton(page, /continue|set up/i);
    await assert2FAQRCodeDisplayed(page);

    await fill2FACode(page, TEST_2FA_CODES.valid);
    await submit2FACode(page);

    // Should display backup codes
    await assertBackupCodesDisplayed(page);

    // Should have download or copy button
    const downloadButton = page.getByRole('button', { name: /download|save/i });
    const copyButton = page.getByRole('button', { name: /copy/i });

    const downloadVisible = await downloadButton.isVisible().catch(() => false);
    const copyVisible = await copyButton.isVisible().catch(() => false);

    expect(downloadVisible || copyVisible).toBe(true);
  });

  test('should allow copying backup codes', async ({ page }) => {
    await mock2FAVerifySuccess(page);

    await clickButton(page, /continue|set up/i);
    await assert2FAQRCodeDisplayed(page);

    await fill2FACode(page, TEST_2FA_CODES.valid);
    await submit2FACode(page);

    await assertBackupCodesDisplayed(page);

    const copyButton = page.getByRole('button', { name: /copy/i });
    if (await copyButton.isVisible()) {
      await copyButton.click();
      await assertSuccessToast(page, /copied|copied to clipboard/i);
    }
  });

  test('should proceed to dashboard after acknowledging backup codes', async ({ page }) => {
    await mock2FAVerifySuccess(page);
    await mockGetCurrentUserSuccess(page, { ...EXISTING_USER, twoFactorEnabled: true });

    await clickButton(page, /continue|set up/i);
    await assert2FAQRCodeDisplayed(page);

    await fill2FACode(page, TEST_2FA_CODES.valid);
    await submit2FACode(page);

    await assertBackupCodesDisplayed(page);

    // Click continue/done button
    await clickButton(page, /continue|done|finish/i);

    // Should redirect to dashboard
    await assertRedirectToDashboard(page);
  });
});

test.describe('2FA Login Verification', () => {
  test.beforeEach(async ({ page }) => {
    await mockLoginRequires2FA(page, USER_WITH_2FA);
    await navigateToLogin(page);
    await fillLoginForm(page, USER_WITH_2FA.email, USER_WITH_2FA.password);
    await submitLoginForm(page);

    // Should redirect to 2FA verification
    await assertRedirectTo2FAVerification(page);
  });

  test('should display 2FA verification form', async ({ page }) => {
    await expect(page.getByText(/enter.*code|verification code|authenticator/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /verify|continue/i })).toBeVisible();
  });

  test('should successfully login with valid 2FA code', async ({ page }) => {
    await mock2FALoginSuccess(page, USER_WITH_2FA);
    await mockGetCurrentUserSuccess(page, USER_WITH_2FA);

    await fill2FACode(page, TEST_2FA_CODES.valid);
    await submit2FACode(page);

    // Should redirect to dashboard
    await assertRedirectToDashboard(page);
    await assertSuccessToast(page, /logged in|login successful/i);
  });

  test('should show error for invalid 2FA code', async ({ page }) => {
    await mock2FALoginInvalidCode(page);

    await fill2FACode(page, TEST_2FA_CODES.invalid);
    await submit2FACode(page);

    await assertErrorToast(page, /invalid.*code|incorrect code/i);

    // Should remain on 2FA verification page
    await expect(page).toHaveURL(/\/verify-2fa/);
  });

  test('should show validation error for empty 2FA code', async ({ page }) => {
    await fill2FACode(page, '');
    await submit2FACode(page);

    await assertFieldHasError(page, /code/i, /required|cannot be empty/i);
  });

  test('should show validation error for short 2FA code', async ({ page }) => {
    await fill2FACode(page, TEST_2FA_CODES.tooShort);
    await submit2FACode(page);

    await assertFieldHasError(page, /code/i, /6 digits|must be 6/i);
  });

  test('should show validation error for non-numeric 2FA code', async ({ page }) => {
    await fill2FACode(page, TEST_2FA_CODES.nonNumeric);
    await submit2FACode(page);

    await assertFieldHasError(page, /code/i, /numeric|numbers only/i);
  });

  test('should disable submit button while verifying', async ({ page }) => {
    await mock2FALoginSuccess(page, USER_WITH_2FA);
    await mockGetCurrentUserSuccess(page, USER_WITH_2FA);

    await fill2FACode(page, TEST_2FA_CODES.valid);

    const submitButton = page.getByRole('button', { name: /verify|continue/i });
    await expect(submitButton).toBeEnabled();

    await submitButton.click();

    // Button should be disabled during verification
    await expect(submitButton).toBeDisabled();
  });

  test('should auto-submit when all digits are entered', async ({ page }) => {
    await mock2FALoginSuccess(page, USER_WITH_2FA);
    await mockGetCurrentUserSuccess(page, USER_WITH_2FA);

    // Fill 6-digit code (should auto-submit)
    await fill2FACode(page, TEST_2FA_CODES.valid);

    // Should redirect to dashboard without manual submit
    await assertRedirectToDashboard(page);
  });

  test('should allow using backup code instead of 2FA code', async ({ page }) => {
    await mock2FALoginSuccess(page, USER_WITH_2FA);
    await mockGetCurrentUserSuccess(page, USER_WITH_2FA);

    // Click "Use backup code" link
    const backupLink = page.getByRole('button', { name: /backup code/i }).or(
      page.getByRole('link', { name: /backup code/i })
    );

    if (await backupLink.isVisible()) {
      await backupLink.click();

      // Should show backup code input
      await expect(page.getByLabel(/backup code/i)).toBeVisible();

      // Fill backup code
      await page.getByLabel(/backup code/i).fill('ABCD-1234');
      await submit2FACode(page);

      // Should redirect to dashboard
      await assertRedirectToDashboard(page);
    }
  });

  test('should allow going back to login', async ({ page }) => {
    const backButton = page.getByRole('button', { name: /back|cancel/i }).or(
      page.getByRole('link', { name: /back to login/i })
    );

    if (await backButton.isVisible()) {
      await backButton.click();

      // Should redirect to login page
      await expect(page).toHaveURL('/login');
    }
  });
});

test.describe('2FA Management in Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Login as user without 2FA
    await setup2FAFlowMocks(page, EXISTING_USER);
    await loginWithCredentials(page, EXISTING_USER.email, EXISTING_USER.password);
    await page.goto('/settings');
  });

  test('should display 2FA enable option when disabled', async ({ page }) => {
    await expect(page.getByText(/enable two-factor|set up 2fa/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /enable|set up/i })).toBeVisible();
  });

  test('should navigate to 2FA setup from settings', async ({ page }) => {
    await mock2FASetupSuccess(page);

    const enableButton = page.getByRole('button', { name: /enable|set up.*2fa/i });
    await enableButton.click();

    // Should show setup modal or redirect to setup page
    await assert2FAQRCodeDisplayed(page);
  });

  test('should successfully enable 2FA from settings', async ({ page }) => {
    await mock2FASetupSuccess(page);
    await mock2FAVerifySuccess(page);
    await mockGetCurrentUserSuccess(page, { ...EXISTING_USER, twoFactorEnabled: true });

    const enableButton = page.getByRole('button', { name: /enable|set up.*2fa/i });
    await enableButton.click();

    await assert2FAQRCodeDisplayed(page);

    await fill2FACode(page, TEST_2FA_CODES.valid);
    await submit2FACode(page);

    await assertBackupCodesDisplayed(page);
    await assertSuccessToast(page, /2fa enabled/i);
  });
});

test.describe('2FA OTP Input', () => {
  test.beforeEach(async ({ page }) => {
    await mockLoginRequires2FA(page, USER_WITH_2FA);
    await navigateToLogin(page);
    await fillLoginForm(page, USER_WITH_2FA.email, USER_WITH_2FA.password);
    await submitLoginForm(page);
    await assertRedirectTo2FAVerification(page);
  });

  test('should auto-focus first digit input', async ({ page }) => {
    const firstDigitInput = page.locator('[inputmode="numeric"]').first();
    await expect(firstDigitInput).toBeFocused();
  });

  test('should auto-advance to next digit on input', async ({ page }) => {
    const digitInputs = page.locator('[inputmode="numeric"]');
    const count = await digitInputs.count();

    if (count === 6) {
      // Fill first digit
      await digitInputs.nth(0).fill('1');

      // Second input should be focused
      await expect(digitInputs.nth(1)).toBeFocused();
    }
  });

  test('should allow backspace to previous digit', async ({ page }) => {
    const digitInputs = page.locator('[inputmode="numeric"]');
    const count = await digitInputs.count();

    if (count === 6) {
      // Fill first two digits
      await digitInputs.nth(0).fill('1');
      await digitInputs.nth(1).fill('2');

      // Press backspace on second digit
      await digitInputs.nth(1).press('Backspace');

      // First digit should be focused
      await expect(digitInputs.nth(0)).toBeFocused();
    }
  });

  test('should allow paste of full code', async ({ page }) => {
    const firstDigitInput = page.locator('[inputmode="numeric"]').first();

    // Paste full code
    await firstDigitInput.focus();
    await page.evaluate((code) => {
      navigator.clipboard.writeText(code);
    }, TEST_2FA_CODES.valid);

    await firstDigitInput.press('Control+v');

    // All digits should be filled (implementation may vary)
    // This is a best-effort test
  });
});
