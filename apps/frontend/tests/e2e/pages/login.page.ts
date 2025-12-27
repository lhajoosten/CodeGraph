/**
 * Login Page Object Model
 *
 * Encapsulates all interactions with the login page.
 */

import { type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  readonly path = '/login';

  // ===========================================================================
  // Locators
  // ===========================================================================

  /**
   * Email input field
   */
  get emailInput(): Locator {
    // Match input element with email type, or input with email placeholder/aria-label
    return this.page.locator('input[type="email"]').or(
      this.page.locator('input[placeholder*="mail" i]')
    ).first();
  }

  /**
   * Password input field
   */
  get passwordInput(): Locator {
    // Match input element with password type
    return this.page.locator('input[type="password"]').or(
      this.page.locator('input[placeholder*="password" i]')
    ).first();
  }

  /**
   * Remember me checkbox
   */
  get rememberMeCheckbox(): Locator {
    return this.page.getByRole('checkbox').or(
      this.page.locator('input[type="checkbox"]')
    );
  }

  /**
   * Submit button
   */
  get submitButton(): Locator {
    return this.page.getByRole('button', { name: /sign in|log in|submit/i });
  }

  /**
   * Forgot password link
   */
  get forgotPasswordLink(): Locator {
    return this.page.getByRole('link', { name: /forgot password/i }).or(
      this.page.getByText(/forgot password/i)
    );
  }

  /**
   * Register link
   */
  get registerLink(): Locator {
    return this.page.getByRole('link', { name: /sign up|register|create account/i }).or(
      this.page.getByText(/sign up|register/i)
    );
  }

  /**
   * Password visibility toggle button
   */
  get passwordToggle(): Locator {
    return this.page.locator('button').filter({ has: this.page.locator('svg') }).last();
  }

  /**
   * OAuth buttons container
   */
  get oauthButtons(): Locator {
    return this.page.locator('[class*="oauth"], [class*="social"]').or(
      this.page.locator('div').filter({ has: this.page.getByRole('link', { name: /github|google|microsoft/i }) })
    );
  }

  /**
   * Google OAuth button
   */
  get googleOAuthButton(): Locator {
    return this.page.getByRole('link', { name: /google/i }).or(
      this.page.locator('a[href*="google"]')
    );
  }

  /**
   * GitHub OAuth button
   */
  get githubOAuthButton(): Locator {
    return this.page.getByRole('link', { name: /github/i }).or(
      this.page.locator('a[href*="github"]')
    );
  }

  /**
   * Microsoft OAuth button
   */
  get microsoftOAuthButton(): Locator {
    return this.page.getByRole('link', { name: /microsoft/i }).or(
      this.page.locator('a[href*="microsoft"]')
    );
  }

  /**
   * Form error message (validation)
   */
  get formError(): Locator {
    return this.page.locator('[role="alert"]').or(
      this.page.locator('[class*="error"]')
    );
  }

  /**
   * Email field error
   */
  get emailError(): Locator {
    return this.emailInput.locator('..').locator('..').locator('[class*="error"], [role="alert"]');
  }

  /**
   * Password field error
   */
  get passwordError(): Locator {
    return this.passwordInput.locator('..').locator('..').locator('[class*="error"], [role="alert"]');
  }

  // ===========================================================================
  // Actions
  // ===========================================================================

  /**
   * Navigate to login page
   */
  async navigate(): Promise<void> {
    await this.goto(this.path);
    // Allow for redirect query parameters (e.g., /login?redirect=%2Fdashboard)
    await expect(this.page).toHaveURL(/\/login(\?.*)?$/);
  }

  /**
   * Fill email field
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Fill password field
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Fill login form
   */
  async fillForm(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
  }

  /**
   * Submit the login form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Complete login flow
   */
  async login(email: string, password: string, rememberMe = false): Promise<void> {
    await this.fillForm(email, password);

    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }

    await this.submit();
  }

  /**
   * Toggle password visibility
   */
  async togglePasswordVisibility(): Promise<void> {
    await this.passwordToggle.click();
  }

  /**
   * Check remember me checkbox
   */
  async checkRememberMe(): Promise<void> {
    await this.rememberMeCheckbox.check();
  }

  /**
   * Uncheck remember me checkbox
   */
  async uncheckRememberMe(): Promise<void> {
    await this.rememberMeCheckbox.uncheck();
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }

  /**
   * Click register link
   */
  async clickRegister(): Promise<void> {
    await this.registerLink.click();
  }

  /**
   * Click Google OAuth button
   */
  async clickGoogleOAuth(): Promise<void> {
    await this.googleOAuthButton.click();
  }

  /**
   * Click GitHub OAuth button
   */
  async clickGitHubOAuth(): Promise<void> {
    await this.githubOAuthButton.click();
  }

  /**
   * Click Microsoft OAuth button
   */
  async clickMicrosoftOAuth(): Promise<void> {
    await this.microsoftOAuthButton.click();
  }

  // ===========================================================================
  // Assertions
  // ===========================================================================

  /**
   * Assert login form is displayed
   */
  async expectFormDisplayed(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Assert OAuth buttons are displayed
   */
  async expectOAuthButtonsDisplayed(): Promise<void> {
    await expect(this.googleOAuthButton).toBeVisible();
    await expect(this.githubOAuthButton).toBeVisible();
    await expect(this.microsoftOAuthButton).toBeVisible();
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
    // Check for spinner or loading indicator inside button
    const spinner = this.submitButton.locator('svg[class*="animate-spin"]');
    await expect(spinner).toBeVisible();
  }

  /**
   * Assert password is visible
   */
  async expectPasswordVisible(): Promise<void> {
    await expect(this.passwordInput).toHaveAttribute('type', 'text');
  }

  /**
   * Assert password is hidden
   */
  async expectPasswordHidden(): Promise<void> {
    await expect(this.passwordInput).toHaveAttribute('type', 'password');
  }

  /**
   * Assert email field has error
   */
  async expectEmailError(message?: string | RegExp): Promise<void> {
    if (message) {
      await expect(this.emailError.first()).toContainText(message);
    } else {
      await expect(this.emailError.first()).toBeVisible();
    }
  }

  /**
   * Assert password field has error
   */
  async expectPasswordError(message?: string | RegExp): Promise<void> {
    if (message) {
      await expect(this.passwordError.first()).toContainText(message);
    } else {
      await expect(this.passwordError.first()).toBeVisible();
    }
  }

  /**
   * Assert redirect to dashboard after login
   */
  async expectRedirectToDashboard(): Promise<void> {
    await expect(this.page).toHaveURL(/^\/(dashboard)?$/);
  }

  /**
   * Assert redirect to 2FA verification
   */
  async expectRedirectTo2FAVerification(): Promise<void> {
    await expect(this.page).toHaveURL(/\/verify-2fa/);
  }

  /**
   * Assert redirect to 2FA setup
   */
  async expectRedirectTo2FASetup(): Promise<void> {
    await expect(this.page).toHaveURL(/\/setup-2fa/);
  }

  /**
   * Assert remember me is checked
   */
  async expectRememberMeChecked(): Promise<void> {
    await expect(this.rememberMeCheckbox).toBeChecked();
  }

  /**
   * Assert remember me is unchecked
   */
  async expectRememberMeUnchecked(): Promise<void> {
    await expect(this.rememberMeCheckbox).not.toBeChecked();
  }

  /**
   * Assert email is pre-filled (remembered)
   */
  async expectEmailPreFilled(email: string): Promise<void> {
    await expect(this.emailInput).toHaveValue(email);
  }
}
