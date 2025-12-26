/**
 * E2E tests for email verification flow
 *
 * Tests cover:
 * - Email verification with valid token
 * - Invalid/expired tokens
 * - Resending verification email
 * - Email already verified
 * - Redirect flows after verification
 */

import { test, expect } from '@playwright/test';
import {
  VALID_USER,
  USER_UNVERIFIED_EMAIL,
  TEST_VERIFICATION_TOKENS,
  VALID_USER_WITH_PROFILE,
} from '../fixtures/users';
import {
  mockEmailVerificationSuccess,
  mockEmailVerificationInvalidToken,
  mockEmailVerificationExpiredToken,
  mockEmailVerificationResendSuccess,
  mockRegisterSuccess,
  mockGetCurrentUserSuccess,
} from '../helpers/mock-utils';
import {
  verifyEmail,
  registerUser,
  navigateToLogin as _navigateToLogin,
} from '../helpers/auth-helpers';
import {
  assertRedirectToDashboard,
  assertRedirectTo2FASetup,
  assertRedirectToLogin,
  assertSuccessToast,
  assertErrorToast,
} from '../helpers/assertions';
import { EMAIL_VERIFICATION_STUBS } from '../fixtures/api-stubs';

test.describe('Email Verification', () => {
  test('should successfully verify email with valid token', async ({ page }) => {
    await mockEmailVerificationSuccess(page);

    await verifyEmail(page, TEST_VERIFICATION_TOKENS.valid);

    // Should show success message
    await assertSuccessToast(page, /email verified|verification successful/i);
    await expect(page.getByText(/email.*verified|successfully verified/i)).toBeVisible();
  });

  test('should show error for invalid verification token', async ({ page }) => {
    await mockEmailVerificationInvalidToken(page);

    await verifyEmail(page, TEST_VERIFICATION_TOKENS.invalid);

    // Should show error message
    await assertErrorToast(page, /invalid.*token|verification failed/i);
    await expect(page.getByText(/invalid.*token|link.*invalid/i)).toBeVisible();
  });

  test('should show error for expired verification token', async ({ page }) => {
    await mockEmailVerificationExpiredToken(page);

    await verifyEmail(page, TEST_VERIFICATION_TOKENS.expired);

    // Should show error message
    await assertErrorToast(page, /expired.*token|link.*expired/i);
    await expect(page.getByText(/expired|no longer valid/i)).toBeVisible();
  });

  test('should show message for already verified email', async ({ page }) => {
    await page.route('**/api/v1/auth/verify-email*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify(EMAIL_VERIFICATION_STUBS.alreadyVerified()),
      });
    });

    await verifyEmail(page, TEST_VERIFICATION_TOKENS.alreadyUsed);

    // Should show info message
    await expect(page.getByText(/already verified|email.*already confirmed/i)).toBeVisible();
  });

  test('should offer to resend verification email on expired token', async ({ page }) => {
    await mockEmailVerificationExpiredToken(page);
    await mockEmailVerificationResendSuccess(page);

    await verifyEmail(page, TEST_VERIFICATION_TOKENS.expired);

    // Should show resend option
    const resendButton = page.getByRole('button', { name: /resend|send again/i });
    await expect(resendButton).toBeVisible();

    // Click resend
    await resendButton.click();

    // Should show success message
    await assertSuccessToast(page, /verification email sent/i);
  });

  test('should redirect to 2FA setup after successful verification', async ({ page }) => {
    await mockEmailVerificationSuccess(page);

    await verifyEmail(page, TEST_VERIFICATION_TOKENS.valid);

    // Should redirect to 2FA setup page
    await assertRedirectTo2FASetup(page);
  });

  test('should allow skipping to dashboard from verification success', async ({ page }) => {
    await mockEmailVerificationSuccess(page);

    await verifyEmail(page, TEST_VERIFICATION_TOKENS.valid);

    // If redirect to 2FA setup, should have skip option
    const skipButton = page.getByRole('button', { name: /skip|later/i });
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await assertRedirectToDashboard(page);
    }
  });

  test('should allow navigating to login from verification page', async ({ page }) => {
    await mockEmailVerificationSuccess(page);

    await verifyEmail(page, TEST_VERIFICATION_TOKENS.valid);

    const loginLink = page.getByRole('link', { name: /login|sign in/i });
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await assertRedirectToLogin(page);
    }
  });
});

test.describe('Email Verification Pending', () => {
  test.beforeEach(async ({ page }) => {
    await mockRegisterSuccess(page, VALID_USER_WITH_PROFILE);
    await registerUser(page, VALID_USER);
    await expect(page).toHaveURL('/verify-email-pending');
  });

  test('should display pending verification message', async ({ page }) => {
    await expect(page.getByText(/verify your email|check your inbox/i)).toBeVisible();
    await expect(page.getByText(/sent.*email|verification email/i)).toBeVisible();
  });

  test('should display user email address', async ({ page }) => {
    await expect(page.getByText(VALID_USER.email)).toBeVisible();
  });

  test('should have resend verification email button', async ({ page }) => {
    const resendButton = page.getByRole('button', { name: /resend|send again/i });
    await expect(resendButton).toBeVisible();
  });

  test('should successfully resend verification email', async ({ page }) => {
    await mockEmailVerificationResendSuccess(page);

    const resendButton = page.getByRole('button', { name: /resend|send again/i });
    await resendButton.click();

    await assertSuccessToast(page, /verification email sent/i);
  });

  test('should disable resend button temporarily after sending', async ({ page }) => {
    await mockEmailVerificationResendSuccess(page);

    const resendButton = page.getByRole('button', { name: /resend|send again/i });

    // First click
    await resendButton.click();
    await assertSuccessToast(page, /verification email sent/i);

    // Button should be disabled
    await expect(resendButton).toBeDisabled();

    // Should show countdown or wait message
    await expect(page.getByText(/wait.*before.*resending|try again in/i)).toBeVisible();
  });

  test('should show rate limit error when requesting too frequently', async ({ page }) => {
    await page.route('**/api/v1/auth/resend-verification', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify(EMAIL_VERIFICATION_STUBS.resendRateLimited()),
      });
    });

    const resendButton = page.getByRole('button', { name: /resend|send again/i });
    await resendButton.click();

    await assertErrorToast(page, /wait.*before|too many requests|rate limit/i);
  });

  test('should have link to login page', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /back to login|sign in/i });
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await assertRedirectToLogin(page);
  });

  test('should display instructions for checking email', async ({ page }) => {
    await expect(page.getByText(/check your inbox|spam folder/i)).toBeVisible();
  });
});

test.describe('Email Verification Error States', () => {
  test('should handle network error gracefully', async ({ page }) => {
    await page.route('**/api/v1/auth/verify-email*', async (route) => {
      await route.abort('failed');
    });

    await verifyEmail(page, TEST_VERIFICATION_TOKENS.valid);

    // Should show generic error message
    await assertErrorToast(page, /network.*error|connection.*failed|try again/i);
  });

  test('should handle server error gracefully', async ({ page }) => {
    await page.route('**/api/v1/auth/verify-email*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      });
    });

    await verifyEmail(page, TEST_VERIFICATION_TOKENS.valid);

    // Should show error message
    await assertErrorToast(page, /server.*error|something went wrong/i);
  });

  test('should handle missing token parameter', async ({ page }) => {
    await page.goto('/verify-email');

    // Should show error or redirect
    await expect(page.getByText(/invalid.*link|token.*required|missing.*token/i)).toBeVisible();
  });
});

test.describe('Email Change Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Assume user is logged in and changing email
    await mockGetCurrentUserSuccess(page, USER_UNVERIFIED_EMAIL);
    await page.goto('/settings');
  });

  test('should show verification pending for new email', async ({ page }) => {
    // Click change email
    const changeEmailButton = page.getByRole('button', { name: /change email/i });

    if (await changeEmailButton.isVisible()) {
      await changeEmailButton.click();

      // Fill new email
      await page.getByLabel(/new email/i).fill('newemail@codegraph.dev');
      await page.getByRole('button', { name: /save|update/i }).click();

      // Should show verification pending message
      await expect(page.getByText(/verification.*sent|check.*inbox/i)).toBeVisible();
    }
  });

  test('should verify new email with token', async ({ page }) => {
    await mockEmailVerificationSuccess(page);

    // Navigate to verification link (simulating email click)
    await page.goto(`/verify-email?token=${TEST_VERIFICATION_TOKENS.valid}`);

    // Should show success message
    await assertSuccessToast(page, /email.*verified|email.*updated/i);
  });

  test('should not allow login with old email after change', async () => {
    // This would require backend state management
    // Placeholder for future implementation
    test.skip();
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels on verification page', async ({ page }) => {
    await mockEmailVerificationSuccess(page);
    await verifyEmail(page, TEST_VERIFICATION_TOKENS.valid);

    // Check for heading
    const heading = page.getByRole('heading', { name: /email.*verified|verification/i });
    await expect(heading).toBeVisible();

    // Check for status role
    const status = page.locator('[role="status"]').or(page.locator('[role="alert"]'));
    const count = await status.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have keyboard navigation on pending page', async ({ page }) => {
    await mockRegisterSuccess(page, VALID_USER_WITH_PROFILE);
    await registerUser(page, VALID_USER);

    // Should be able to tab through elements
    await page.keyboard.press('Tab');
    const resendButton = page.getByRole('button', { name: /resend/i });
    const loginLink = page.getByRole('link', { name: /login/i });

    // At least one should be focused
    const resendFocused = await resendButton.evaluate((el) => el === document.activeElement);
    const loginFocused = await loginLink.evaluate((el) => el === document.activeElement);

    expect(resendFocused || loginFocused).toBe(true);
  });
});
