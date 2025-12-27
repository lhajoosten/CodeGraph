/**
 * E2E Tests: Password Reset Flow
 *
 * Tests cover:
 * - Forgot password form display
 * - Successful password reset request
 * - Email validation
 * - Rate limiting
 * - Reset password form with token
 * - Password validation on reset
 * - Invalid/expired token handling
 * - Successful password reset completion
 */

import { test, expect } from '@playwright/test';
import { ForgotPasswordPage } from '../pages/forgot-password.page';
import { ResetPasswordPage } from '../pages/reset-password.page';
import {
  VALID_USER,
  EXISTING_USER,
  INVALID_EMAILS,
  WEAK_PASSWORDS,
  TEST_RESET_TOKENS,
} from '../fixtures';
import {
  mockPasswordResetRequestSuccess,
  mockPasswordResetRequestRateLimited,
  mockPasswordResetSuccess,
  mockPasswordResetInvalidToken,
  mockPasswordResetExpiredToken,
  setupPasswordResetFlowMocks,
} from '../helpers';

// =============================================================================
// Forgot Password Page Tests
// =============================================================================

test.describe('Forgot Password Page', () => {
  let forgotPasswordPage: ForgotPasswordPage;

  test.beforeEach(async ({ page }) => {
    forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.navigate();
  });

  // ===========================================================================
  // Form Display Tests
  // ===========================================================================

  test.describe('Form Display', () => {
    test('should display forgot password form with all elements', async () => {
      await forgotPasswordPage.expectFormDisplayed();
      await expect(forgotPasswordPage.backToLoginLink).toBeVisible();
    });
  });

  // ===========================================================================
  // Successful Request Tests
  // ===========================================================================

  test.describe('Successful Request', () => {
    test('should show success message after requesting reset', async ({ page }) => {
      await mockPasswordResetRequestSuccess(page);

      await forgotPasswordPage.requestPasswordReset(EXISTING_USER.email);

      await forgotPasswordPage.expectSuccessMessage();
    });

    test('should show success for any email (security best practice)', async ({ page }) => {
      // Even for non-existent emails, show success to prevent email enumeration
      await mockPasswordResetRequestSuccess(page);

      await forgotPasswordPage.requestPasswordReset('nonexistent@example.com');

      await forgotPasswordPage.expectSuccessMessage();
    });

    test('should show loading state during submission', async ({ page }) => {
      await page.route('**/api/v1/auth/forgot-password', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Reset link sent' }),
        });
      });

      await forgotPasswordPage.fillEmail(EXISTING_USER.email);
      await forgotPasswordPage.submit();

      await forgotPasswordPage.expectSubmitLoading();
    });
  });

  // ===========================================================================
  // Validation Tests
  // ===========================================================================

  test.describe('Form Validation', () => {
    test('should show error for empty email', async () => {
      await forgotPasswordPage.fillEmail('');
      await forgotPasswordPage.submit();

      await forgotPasswordPage.expectEmailError(/required|email/i);
    });

    test('should show error for invalid email format', async () => {
      await forgotPasswordPage.fillEmail(INVALID_EMAILS.noAtSign);
      await forgotPasswordPage.submit();

      await forgotPasswordPage.expectEmailError(/invalid|valid email/i);
    });
  });

  // ===========================================================================
  // Rate Limiting Tests
  // ===========================================================================

  test.describe('Rate Limiting', () => {
    test('should show error when rate limited', async ({ page }) => {
      await mockPasswordResetRequestRateLimited(page);

      await forgotPasswordPage.requestPasswordReset(EXISTING_USER.email);

      await forgotPasswordPage.expectErrorMessage(/too many|wait|rate/i);
    });
  });

  // ===========================================================================
  // Navigation Tests
  // ===========================================================================

  test.describe('Navigation', () => {
    test('should navigate back to login page', async () => {
      await forgotPasswordPage.clickBackToLogin();
      await forgotPasswordPage.expectRedirectToLogin();
    });
  });
});

// =============================================================================
// Reset Password Page Tests
// =============================================================================

test.describe('Reset Password Page', () => {
  let resetPasswordPage: ResetPasswordPage;

  test.beforeEach(async ({ page }) => {
    resetPasswordPage = new ResetPasswordPage(page);
  });

  // ===========================================================================
  // Form Display Tests
  // ===========================================================================

  test.describe('Form Display', () => {
    test('should display reset password form with valid token', async ({ page }) => {
      await mockPasswordResetSuccess(page);
      await resetPasswordPage.navigate(TEST_RESET_TOKENS.valid);

      await resetPasswordPage.expectFormDisplayed();
    });
  });

  // ===========================================================================
  // Successful Reset Tests
  // ===========================================================================

  test.describe('Successful Reset', () => {
    test('should reset password successfully with valid token', async ({ page }) => {
      await setupPasswordResetFlowMocks(page);
      await resetPasswordPage.navigate(TEST_RESET_TOKENS.valid);

      await resetPasswordPage.resetPassword(VALID_USER.password);

      // Should show success or redirect to login
      const hasSuccess =
        (await resetPasswordPage.successMessage.isVisible().catch(() => false)) ||
        (await resetPasswordPage.page.url().includes('/login'));
      expect(hasSuccess).toBe(true);
    });

    test('should show loading state during submission', async ({ page }) => {
      await page.route('**/api/v1/auth/reset-password', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Password reset' }),
        });
      });

      await resetPasswordPage.navigate(TEST_RESET_TOKENS.valid);
      await resetPasswordPage.fillPasswords(VALID_USER.password);
      await resetPasswordPage.submit();

      await resetPasswordPage.expectSubmitLoading();
    });
  });

  // ===========================================================================
  // Token Validation Tests
  // ===========================================================================

  test.describe('Token Validation', () => {
    test('should show error for invalid token', async ({ page }) => {
      await mockPasswordResetInvalidToken(page);
      await resetPasswordPage.navigate(TEST_RESET_TOKENS.invalid);

      // Try to submit with valid password
      await resetPasswordPage.fillPasswords(VALID_USER.password);
      await resetPasswordPage.submit();

      await resetPasswordPage.expectErrorMessage(/invalid|token/i);
    });

    test('should show error for expired token', async ({ page }) => {
      await mockPasswordResetExpiredToken(page);
      await resetPasswordPage.navigate(TEST_RESET_TOKENS.expired);

      await resetPasswordPage.fillPasswords(VALID_USER.password);
      await resetPasswordPage.submit();

      await resetPasswordPage.expectErrorMessage(/expired|token/i);
    });
  });

  // ===========================================================================
  // Password Validation Tests
  // ===========================================================================

  test.describe('Password Validation', () => {
    test.beforeEach(async ({ page }) => {
      await resetPasswordPage.navigate(TEST_RESET_TOKENS.valid);
    });

    test('should show error for empty password', async () => {
      await resetPasswordPage.fillConfirmPassword(VALID_USER.password);
      await resetPasswordPage.submit();

      await resetPasswordPage.expectNewPasswordError(/required|password/i);
    });

    test('should show error for weak password', async () => {
      await resetPasswordPage.fillPasswords(WEAK_PASSWORDS.tooShort);
      await resetPasswordPage.submit();

      await resetPasswordPage.expectNewPasswordError(/8 characters|too short/i);
    });

    test('should show error for password without uppercase', async () => {
      await resetPasswordPage.fillPasswords(WEAK_PASSWORDS.noUppercase);
      await resetPasswordPage.submit();

      await resetPasswordPage.expectNewPasswordError(/uppercase/i);
    });

    test('should show error when passwords do not match', async () => {
      await resetPasswordPage.fillNewPassword(VALID_USER.password);
      await resetPasswordPage.fillConfirmPassword('DifferentPassword123!');
      await resetPasswordPage.submit();

      await resetPasswordPage.expectConfirmPasswordError(/match|same/i);
    });

    test('should show error for empty confirm password', async () => {
      await resetPasswordPage.fillNewPassword(VALID_USER.password);
      await resetPasswordPage.submit();

      await resetPasswordPage.expectConfirmPasswordError(/required|confirm/i);
    });
  });

  // ===========================================================================
  // Password Visibility Tests
  // ===========================================================================

  test.describe('Password Visibility', () => {
    test.beforeEach(async ({ page }) => {
      await resetPasswordPage.navigate(TEST_RESET_TOKENS.valid);
    });

    test('should toggle password visibility', async () => {
      await resetPasswordPage.fillNewPassword(VALID_USER.password);

      // Toggle visibility
      await resetPasswordPage.toggleNewPasswordVisibility();

      // Password should be visible (type="text")
      await expect(resetPasswordPage.newPasswordInput).toHaveAttribute('type', 'text');

      // Toggle back
      await resetPasswordPage.toggleNewPasswordVisibility();

      // Password should be hidden (type="password")
      await expect(resetPasswordPage.newPasswordInput).toHaveAttribute('type', 'password');
    });
  });

  // ===========================================================================
  // Password Strength Tests
  // ===========================================================================

  test.describe('Password Strength', () => {
    test.beforeEach(async ({ page }) => {
      await resetPasswordPage.navigate(TEST_RESET_TOKENS.valid);
    });

    test('should show password strength indicator', async () => {
      await resetPasswordPage.fillNewPassword('weak');
      await resetPasswordPage.expectPasswordStrength('weak');

      await resetPasswordPage.fillNewPassword('Password1');
      await resetPasswordPage.expectPasswordStrength('medium');

      await resetPasswordPage.fillNewPassword('SecurePass123!@#');
      await resetPasswordPage.expectPasswordStrength('strong');
    });
  });
});

// =============================================================================
// Complete Password Reset Flow Tests
// =============================================================================

test.describe('Complete Password Reset Flow', () => {
  test('should complete full password reset flow', async ({ page }) => {
    const forgotPasswordPage = new ForgotPasswordPage(page);
    const resetPasswordPage = new ResetPasswordPage(page);

    // Step 1: Request password reset
    await mockPasswordResetRequestSuccess(page);
    await forgotPasswordPage.navigate();
    await forgotPasswordPage.requestPasswordReset(EXISTING_USER.email);
    await forgotPasswordPage.expectSuccessMessage();

    // Step 2: Navigate to reset page with token (simulating email link click)
    await mockPasswordResetSuccess(page);
    await resetPasswordPage.navigate(TEST_RESET_TOKENS.valid);

    // Step 3: Reset password
    await resetPasswordPage.resetPassword('NewSecurePassword123!');

    // Should succeed
    const hasSuccess =
      (await resetPasswordPage.successMessage.isVisible().catch(() => false)) ||
      (await resetPasswordPage.page.url().includes('/login'));
    expect(hasSuccess).toBe(true);
  });
});
