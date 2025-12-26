/**
 * E2E tests for password reset flow
 *
 * Tests cover:
 * - Request password reset
 * - Reset with valid token
 * - Invalid/expired tokens
 * - Password validation during reset
 * - Rate limiting
 * - Security considerations
 */

import { test, expect } from '@playwright/test';
import { EXISTING_USER, TEST_RESET_TOKENS, WEAK_PASSWORDS, INVALID_EMAILS } from '../fixtures';
import {
  mockPasswordResetRequestSuccess,
  mockPasswordResetSuccess,
  mockPasswordResetInvalidToken,
  mockLoginSuccess,
  mockGetCurrentUserSuccess,
} from '../helpers';
import {
  navigateToForgotPassword,
  requestPasswordReset,
  resetPassword,
  loginWithCredentials,
} from '../helpers';
import {
  assertRedirectToLogin,
  assertSuccessToast,
  assertErrorToast,
  assertFieldHasError,
} from '../helpers';
import { PASSWORD_RESET_STUBS } from '../fixtures';

test.describe('Forgot Password Page', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToForgotPassword(page);
  });

  test('should display forgot password form', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send|reset/i })).toBeVisible();
  });

  test('should display instructions', async ({ page }) => {
    await expect(page.getByText(/enter.*email|reset.*password/i)).toBeVisible();
  });

  test('should have link back to login', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /back to login|sign in/i });
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await assertRedirectToLogin(page);
  });
});

test.describe('Request Password Reset', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToForgotPassword(page);
  });

  test('should successfully request password reset', async ({ page }) => {
    await mockPasswordResetRequestSuccess(page);

    await page.getByLabel(/email/i).fill(EXISTING_USER.email);
    await page.getByRole('button', { name: /send|reset/i }).click();

    await assertSuccessToast(page, /reset.*email.*sent|check.*inbox/i);
    await expect(page.getByText(/check.*email|sent.*instructions/i)).toBeVisible();
  });

  test('should show validation error for empty email', async ({ page }) => {
    await page.getByLabel(/email/i).fill('');
    await page.getByRole('button', { name: /send|reset/i }).click();

    await assertFieldHasError(page, /email/i, /required|cannot be empty/i);
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.getByLabel(/email/i).fill(INVALID_EMAILS.noAtSign);
    await page.getByRole('button', { name: /send|reset/i }).click();

    await assertFieldHasError(page, /email/i, /invalid|valid email/i);
  });

  test('should handle non-existent email gracefully', async ({ page }) => {
    await page.route('**/api/v1/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(PASSWORD_RESET_STUBS.requestUserNotFound()),
      });
    });

    await page.getByLabel(/email/i).fill('nonexistent@example.com');
    await page.getByRole('button', { name: /send|reset/i }).click();

    // Should still show success message (security best practice)
    await assertSuccessToast(page, /reset.*email.*sent|check.*inbox/i);
  });

  test('should handle rate limiting', async ({ page }) => {
    await page.route('**/api/v1/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify(PASSWORD_RESET_STUBS.requestRateLimited()),
      });
    });

    await page.getByLabel(/email/i).fill(EXISTING_USER.email);
    await page.getByRole('button', { name: /send|reset/i }).click();

    await assertErrorToast(page, /too many.*requests|wait.*before/i);
  });

  test('should disable submit button while sending', async ({ page }) => {
    await mockPasswordResetRequestSuccess(page);

    await page.getByLabel(/email/i).fill(EXISTING_USER.email);

    const submitButton = page.getByRole('button', { name: /send|reset/i });
    await expect(submitButton).toBeEnabled();

    await submitButton.click();

    // Button should be disabled during submission
    await expect(submitButton).toBeDisabled();
  });

  test('should show sent confirmation screen', async ({ page }) => {
    await mockPasswordResetRequestSuccess(page);

    await requestPasswordReset(page, EXISTING_USER.email);

    // Should show confirmation with email
    await expect(page.getByText(EXISTING_USER.email)).toBeVisible();
    await expect(page.getByText(/sent.*instructions|check.*email/i)).toBeVisible();
  });

  test('should allow resending reset email', async ({ page }) => {
    await mockPasswordResetRequestSuccess(page);

    await requestPasswordReset(page, EXISTING_USER.email);

    const resendButton = page.getByRole('button', { name: /resend|send again/i });
    if (await resendButton.isVisible()) {
      await resendButton.click();
      await assertSuccessToast(page, /email.*sent/i);
    }
  });
});

test.describe('Reset Password with Token', () => {
  test.beforeEach(async ({ page }) => {
    await mockPasswordResetSuccess(page);
  });

  test('should display reset password form', async ({ page }) => {
    await page.goto(`/reset-password?token=${TEST_RESET_TOKENS.valid}`);

    await expect(page.getByLabel(/^new password/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /reset|save/i })).toBeVisible();
  });

  test('should successfully reset password', async ({ page }) => {
    const newPassword = 'NewSecurePass123!';

    await resetPassword(page, TEST_RESET_TOKENS.valid, newPassword);

    await assertSuccessToast(page, /password.*reset|password.*updated/i);
    await assertRedirectToLogin(page);
  });

  test('should show validation error for empty password', async ({ page }) => {
    await page.goto(`/reset-password?token=${TEST_RESET_TOKENS.valid}`);

    await page.getByLabel(/^new password/i).fill('');
    await page.getByLabel(/confirm password/i).fill('');
    await page.getByRole('button', { name: /reset|save/i }).click();

    await assertFieldHasError(page, /^new password/i, /required|cannot be empty/i);
  });

  test('should show validation error for weak password', async ({ page }) => {
    await page.goto(`/reset-password?token=${TEST_RESET_TOKENS.valid}`);

    await page.getByLabel(/^new password/i).fill(WEAK_PASSWORDS.tooShort);
    await page.getByLabel(/confirm password/i).fill(WEAK_PASSWORDS.tooShort);
    await page.getByRole('button', { name: /reset|save/i }).click();

    await assertFieldHasError(page, /^new password/i, /at least 8 characters|too short/i);
  });

  test('should show validation error when passwords do not match', async ({ page }) => {
    await page.goto(`/reset-password?token=${TEST_RESET_TOKENS.valid}`);

    await page.getByLabel(/^new password/i).fill('NewPassword123!');
    await page.getByLabel(/confirm password/i).fill('DifferentPassword123!');
    await page.getByRole('button', { name: /reset|save/i }).click();

    await assertFieldHasError(page, /confirm password/i, /must match|do not match/i);
  });

  test('should show error for invalid token', async ({ page }) => {
    await mockPasswordResetInvalidToken(page);

    await resetPassword(page, TEST_RESET_TOKENS.invalid, 'NewPassword123!');

    await assertErrorToast(page, /invalid.*token|link.*invalid/i);
  });

  test('should show error for expired token', async ({ page }) => {
    await mockPasswordResetInvalidToken(page);

    await resetPassword(page, TEST_RESET_TOKENS.expired, 'NewPassword123!');

    await assertErrorToast(page, /expired.*token|link.*expired/i);
  });

  test('should show error for already used token', async ({ page }) => {
    await mockPasswordResetInvalidToken(page);

    await resetPassword(page, TEST_RESET_TOKENS.alreadyUsed, 'NewPassword123!');

    await assertErrorToast(page, /invalid.*token|already.*used/i);
  });

  test('should display password strength indicator', async ({ page }) => {
    await page.goto(`/reset-password?token=${TEST_RESET_TOKENS.valid}`);

    const passwordField = page.getByLabel(/^new password/i);

    // Type weak password
    await passwordField.fill(WEAK_PASSWORDS.allLowercase);
    await expect(page.getByText(/weak/i)).toBeVisible();

    // Type strong password
    await passwordField.fill('StrongPassword123!');
    await expect(page.getByText(/strong|good/i)).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto(`/reset-password?token=${TEST_RESET_TOKENS.valid}`);

    const passwordField = page.getByLabel(/^new password/i);
    await passwordField.fill('TestPassword123!');

    // Password should be hidden by default
    await expect(passwordField).toHaveAttribute('type', 'password');

    // Click show password button
    const toggleButtons = page.getByRole('button', { name: /show password|toggle/i });
    await toggleButtons.first().click();

    // Password should be visible
    await expect(passwordField).toHaveAttribute('type', 'text');
  });

  test('should disable submit button while resetting', async ({ page }) => {
    await page.goto(`/reset-password?token=${TEST_RESET_TOKENS.valid}`);

    await page.getByLabel(/^new password/i).fill('NewPassword123!');
    await page.getByLabel(/confirm password/i).fill('NewPassword123!');

    const submitButton = page.getByRole('button', { name: /reset|save/i });
    await expect(submitButton).toBeEnabled();

    await submitButton.click();

    // Button should be disabled during submission
    await expect(submitButton).toBeDisabled();
  });

  test('should handle missing token parameter', async ({ page }) => {
    await page.goto('/reset-password');

    // Should show error or redirect
    await expect(page.getByText(/invalid.*link|token.*required|missing.*token/i)).toBeVisible();
  });
});

test.describe('Password Reset Security', () => {
  test('should not reveal if email exists', async ({ page }) => {
    await page.route('**/api/v1/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(PASSWORD_RESET_STUBS.requestUserNotFound()),
      });
    });

    await navigateToForgotPassword(page);
    await page.getByLabel(/email/i).fill('nonexistent@example.com');
    await page.getByRole('button', { name: /send|reset/i }).click();

    // Should show same success message regardless
    await assertSuccessToast(page, /reset.*email.*sent|check.*inbox/i);
  });

  test('should enforce rate limiting per email', async ({ page }) => {
    await mockPasswordResetRequestSuccess(page);

    await navigateToForgotPassword(page);

    // First request
    await page.getByLabel(/email/i).fill(EXISTING_USER.email);
    await page.getByRole('button', { name: /send|reset/i }).click();
    await assertSuccessToast(page, /reset.*email.*sent/i);

    // Mock rate limit for second request
    await page.route('**/api/v1/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify(PASSWORD_RESET_STUBS.requestRateLimited()),
      });
    });

    // Second request should be rate limited
    await page.goto('/forgot-password');
    await page.getByLabel(/email/i).fill(EXISTING_USER.email);
    await page.getByRole('button', { name: /send|reset/i }).click();

    await assertErrorToast(page, /too many.*requests/i);
  });

  test('should invalidate token after successful reset', async ({ page }) => {
    await mockPasswordResetSuccess(page);

    // First reset
    await resetPassword(page, TEST_RESET_TOKENS.valid, 'NewPassword123!');
    await assertSuccessToast(page, /password.*reset/i);

    // Try to use same token again
    await mockPasswordResetInvalidToken(page);
    await resetPassword(page, TEST_RESET_TOKENS.valid, 'AnotherPassword123!');

    await assertErrorToast(page, /invalid.*token|already.*used/i);
  });
});

test.describe('Post-Reset Login', () => {
  test('should login with new password after reset', async ({ page }) => {
    await mockPasswordResetSuccess(page);
    await mockLoginSuccess(page, EXISTING_USER);
    await mockGetCurrentUserSuccess(page, EXISTING_USER);

    const newPassword = 'NewSecurePass123!';

    // Reset password
    await resetPassword(page, TEST_RESET_TOKENS.valid, newPassword);
    await assertRedirectToLogin(page);

    // Login with new password
    await loginWithCredentials(page, EXISTING_USER.email, newPassword);

    // Should redirect to dashboard
    await expect(page).toHaveURL(/^\/(dashboard)?$/);
  });

  test('should not login with old password after reset', async ({ page }) => {
    await mockPasswordResetSuccess(page);

    const newPassword = 'NewSecurePass123!';

    // Reset password
    await resetPassword(page, TEST_RESET_TOKENS.valid, newPassword);
    await assertRedirectToLogin(page);

    // Mock invalid credentials for old password
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Invalid email or password',
          error_code: 'INVALID_CREDENTIALS',
        }),
      });
    });

    // Try to login with old password
    await loginWithCredentials(page, EXISTING_USER.email, EXISTING_USER.password);

    await assertErrorToast(page, /invalid.*password|incorrect.*credentials/i);
  });

  test('should show success message on login page after reset', async ({ page }) => {
    await mockPasswordResetSuccess(page);

    await resetPassword(page, TEST_RESET_TOKENS.valid, 'NewPassword123!');

    // Should redirect to login with success message
    await assertRedirectToLogin(page);
    await expect(page.getByText(/password.*reset.*successful|password.*updated/i)).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should handle network error during request', async ({ page }) => {
    await page.route('**/api/v1/auth/forgot-password', async (route) => {
      await route.abort('failed');
    });

    await navigateToForgotPassword(page);
    await page.getByLabel(/email/i).fill(EXISTING_USER.email);
    await page.getByRole('button', { name: /send|reset/i }).click();

    await assertErrorToast(page, /network.*error|connection.*failed/i);
  });

  test('should handle server error during request', async ({ page }) => {
    await page.route('**/api/v1/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      });
    });

    await navigateToForgotPassword(page);
    await page.getByLabel(/email/i).fill(EXISTING_USER.email);
    await page.getByRole('button', { name: /send|reset/i }).click();

    await assertErrorToast(page, /server.*error|something went wrong/i);
  });

  test('should handle network error during reset', async ({ page }) => {
    await page.route('**/api/v1/auth/reset-password', async (route) => {
      await route.abort('failed');
    });

    await resetPassword(page, TEST_RESET_TOKENS.valid, 'NewPassword123!');

    await assertErrorToast(page, /network.*error|connection.*failed/i);
  });

  test('should handle server error during reset', async ({ page }) => {
    await page.route('**/api/v1/auth/reset-password', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      });
    });

    await resetPassword(page, TEST_RESET_TOKENS.valid, 'NewPassword123!');

    await assertErrorToast(page, /server.*error|something went wrong/i);
  });
});
