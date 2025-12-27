/**
 * Reset Password Page Object Model
 *
 * Encapsulates all interactions with the reset password page.
 */

import { type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class ResetPasswordPage extends BasePage {
  readonly path = '/reset-password';

  // ===========================================================================
  // Locators
  // ===========================================================================

  /**
   * New password input field
   */
  get newPasswordInput(): Locator {
    return this.page.getByLabel(/new password/i).or(
      this.page.getByLabel(/^password$/i)
    );
  }

  /**
   * Confirm password input field
   */
  get confirmPasswordInput(): Locator {
    return this.page.getByLabel(/confirm password/i);
  }

  /**
   * Submit button
   */
  get submitButton(): Locator {
    return this.page.getByRole('button', { name: /reset|save|submit|change/i });
  }

  /**
   * Password strength indicator
   */
  get passwordStrength(): Locator {
    return this.page.locator('[data-testid="password-strength"]').or(
      this.page.locator('[class*="strength"]')
    );
  }

  /**
   * Password visibility toggle
   */
  get passwordToggle(): Locator {
    return this.newPasswordInput.locator('..').locator('button').filter({ has: this.page.locator('svg') });
  }

  /**
   * Confirm password visibility toggle
   */
  get confirmPasswordToggle(): Locator {
    return this.confirmPasswordInput.locator('..').locator('button').filter({ has: this.page.locator('svg') });
  }

  /**
   * Success message
   */
  get successMessage(): Locator {
    return this.page.locator('[class*="success"]').or(
      this.page.getByText(/password.*reset|password.*changed|successfully/i)
    );
  }

  /**
   * Error message (invalid/expired token)
   */
  get tokenError(): Locator {
    return this.page.getByText(/invalid|expired|token/i).or(
      this.page.locator('[class*="error"]')
    );
  }

  /**
   * New password error
   */
  get newPasswordError(): Locator {
    return this.newPasswordInput.locator('..').locator('..').locator('[class*="error"], [role="alert"]');
  }

  /**
   * Confirm password error
   */
  get confirmPasswordError(): Locator {
    return this.confirmPasswordInput.locator('..').locator('..').locator('[class*="error"], [role="alert"]');
  }

  /**
   * Back to login link
   */
  get backToLoginLink(): Locator {
    return this.page.getByRole('link', { name: /back to login|sign in|login/i });
  }

  // ===========================================================================
  // Actions
  // ===========================================================================

  /**
   * Navigate to reset password page with token
   */
  async navigate(token: string): Promise<void> {
    await this.goto(`${this.path}?token=${token}`);
  }

  /**
   * Fill new password field
   */
  async fillNewPassword(password: string): Promise<void> {
    await this.newPasswordInput.fill(password);
  }

  /**
   * Fill confirm password field
   */
  async fillConfirmPassword(password: string): Promise<void> {
    await this.confirmPasswordInput.fill(password);
  }

  /**
   * Fill both password fields
   */
  async fillPasswords(password: string): Promise<void> {
    await this.fillNewPassword(password);
    await this.fillConfirmPassword(password);
  }

  /**
   * Submit the reset password form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Complete password reset
   */
  async resetPassword(password: string): Promise<void> {
    await this.fillPasswords(password);
    await this.submit();
  }

  /**
   * Toggle new password visibility
   */
  async toggleNewPasswordVisibility(): Promise<void> {
    await this.passwordToggle.click();
  }

  /**
   * Toggle confirm password visibility
   */
  async toggleConfirmPasswordVisibility(): Promise<void> {
    await this.confirmPasswordToggle.click();
  }

  /**
   * Click back to login link
   */
  async clickBackToLogin(): Promise<void> {
    await this.backToLoginLink.click();
  }

  // ===========================================================================
  // Assertions
  // ===========================================================================

  /**
   * Assert reset password form is displayed
   */
  async expectFormDisplayed(): Promise<void> {
    await expect(this.newPasswordInput).toBeVisible();
    await expect(this.confirmPasswordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Assert submit button is disabled
   */
  async expectSubmitDisabled(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
  }

  /**
   * Assert submit button is enabled
   */
  async expectSubmitEnabled(): Promise<void> {
    await expect(this.submitButton).toBeEnabled();
  }

  /**
   * Assert submit button is in loading state
   */
  async expectSubmitLoading(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
    const spinner = this.submitButton.locator('svg[class*="animate-spin"]');
    await expect(spinner).toBeVisible();
  }

  /**
   * Assert password strength level
   */
  async expectPasswordStrength(level: 'weak' | 'medium' | 'strong'): Promise<void> {
    await expect(this.passwordStrength).toContainText(new RegExp(level, 'i'));
  }

  /**
   * Assert success message is shown
   */
  async expectSuccessMessage(): Promise<void> {
    await expect(this.successMessage).toBeVisible();
  }

  /**
   * Assert token error is shown
   */
  async expectTokenError(): Promise<void> {
    await expect(this.tokenError).toBeVisible();
  }

  /**
   * Assert new password error
   */
  async expectNewPasswordError(message?: string | RegExp): Promise<void> {
    if (message) {
      await expect(this.newPasswordError.first()).toContainText(message);
    } else {
      await expect(this.newPasswordError.first()).toBeVisible();
    }
  }

  /**
   * Assert confirm password error
   */
  async expectConfirmPasswordError(message?: string | RegExp): Promise<void> {
    if (message) {
      await expect(this.confirmPasswordError.first()).toContainText(message);
    } else {
      await expect(this.confirmPasswordError.first()).toBeVisible();
    }
  }

  /**
   * Assert redirect to login page
   */
  async expectRedirectToLogin(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/);
  }
}
