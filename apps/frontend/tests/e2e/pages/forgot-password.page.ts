/**
 * Forgot Password Page Object Model
 *
 * Encapsulates all interactions with the forgot password page.
 */

import { type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class ForgotPasswordPage extends BasePage {
  readonly path = '/forgot-password';

  // ===========================================================================
  // Locators
  // ===========================================================================

  /**
   * Email input field
   */
  get emailInput(): Locator {
    return this.page.getByLabel(/email/i);
  }

  /**
   * Submit button
   */
  get submitButton(): Locator {
    return this.page.getByRole('button', { name: /send|reset|submit/i });
  }

  /**
   * Back to login link
   */
  get backToLoginLink(): Locator {
    return this.page.getByRole('link', { name: /back to login|sign in|login/i }).or(
      this.page.getByText(/back to login|sign in/i)
    );
  }

  /**
   * Success message
   */
  get successMessage(): Locator {
    return this.page.locator('[class*="success"]').or(
      this.page.getByText(/check your email|sent|password reset link/i)
    );
  }

  /**
   * Email error message
   */
  get emailError(): Locator {
    return this.emailInput.locator('..').locator('..').locator('[class*="error"], [role="alert"]');
  }

  /**
   * Resend link (shown after initial request)
   */
  get resendLink(): Locator {
    return this.page.getByRole('button', { name: /resend|send again/i }).or(
      this.page.getByText(/resend|send again/i)
    );
  }

  // ===========================================================================
  // Actions
  // ===========================================================================

  /**
   * Navigate to forgot password page
   */
  async navigate(): Promise<void> {
    await this.goto(this.path);
    await expect(this.page).toHaveURL(this.path);
  }

  /**
   * Fill email field
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Submit the forgot password form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    await this.fillEmail(email);
    await this.submit();
  }

  /**
   * Click back to login link
   */
  async clickBackToLogin(): Promise<void> {
    await this.backToLoginLink.click();
  }

  /**
   * Click resend link
   */
  async clickResend(): Promise<void> {
    await this.resendLink.click();
  }

  // ===========================================================================
  // Assertions
  // ===========================================================================

  /**
   * Assert forgot password form is displayed
   */
  async expectFormDisplayed(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
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
   * Assert success message is shown
   */
  async expectSuccessMessage(): Promise<void> {
    await expect(this.successMessage).toBeVisible();
  }

  /**
   * Assert email error is shown
   */
  async expectEmailError(message?: string | RegExp): Promise<void> {
    if (message) {
      await expect(this.emailError.first()).toContainText(message);
    } else {
      await expect(this.emailError.first()).toBeVisible();
    }
  }

  /**
   * Assert resend link is visible
   */
  async expectResendLinkVisible(): Promise<void> {
    await expect(this.resendLink).toBeVisible();
  }

  /**
   * Assert redirect to login page
   */
  async expectRedirectToLogin(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/);
  }
}
