/**
 * Register Page Object Model
 *
 * Encapsulates all interactions with the registration page.
 */

import { type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import type { TestUser } from '../fixtures/users';

export class RegisterPage extends BasePage {
  readonly path = '/register';

  // ===========================================================================
  // Locators
  // ===========================================================================

  /**
   * First name input field
   */
  get firstNameInput(): Locator {
    return this.page.getByLabel(/first name/i);
  }

  /**
   * Last name input field
   */
  get lastNameInput(): Locator {
    return this.page.getByLabel(/last name/i);
  }

  /**
   * Email input field
   */
  get emailInput(): Locator {
    return this.page.getByLabel(/email/i);
  }

  /**
   * Password input field
   */
  get passwordInput(): Locator {
    // Get the first password field (not confirm)
    return this.page.getByLabel(/^password$/i).or(
      this.page.locator('input[type="password"]').first()
    );
  }

  /**
   * Confirm password input field
   */
  get confirmPasswordInput(): Locator {
    return this.page.getByLabel(/confirm password/i);
  }

  /**
   * Accept terms checkbox
   */
  get acceptTermsCheckbox(): Locator {
    return this.page.getByRole('checkbox').or(
      this.page.locator('input[type="checkbox"]')
    );
  }

  /**
   * Submit button
   */
  get submitButton(): Locator {
    return this.page.getByRole('button', { name: /sign up|register|create account|create/i });
  }

  /**
   * Login link
   */
  get loginLink(): Locator {
    return this.page.getByRole('link', { name: /sign in|log in|login/i }).or(
      this.page.getByText(/sign in|already have an account/i)
    );
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
   * Password visibility toggle (for password field)
   */
  get passwordToggle(): Locator {
    return this.passwordInput.locator('..').locator('button').filter({ has: this.page.locator('svg') });
  }

  /**
   * Confirm password visibility toggle
   */
  get confirmPasswordToggle(): Locator {
    return this.confirmPasswordInput.locator('..').locator('button').filter({ has: this.page.locator('svg') });
  }

  /**
   * Terms of service link
   */
  get termsLink(): Locator {
    return this.page.getByRole('link', { name: /terms/i });
  }

  /**
   * Privacy policy link
   */
  get privacyLink(): Locator {
    return this.page.getByRole('link', { name: /privacy/i });
  }

  // Field error locators
  get firstNameError(): Locator {
    return this.firstNameInput.locator('..').locator('..').locator('[class*="error"], [role="alert"]');
  }

  get lastNameError(): Locator {
    return this.lastNameInput.locator('..').locator('..').locator('[class*="error"], [role="alert"]');
  }

  get emailError(): Locator {
    return this.emailInput.locator('..').locator('..').locator('[class*="error"], [role="alert"]');
  }

  get passwordError(): Locator {
    return this.passwordInput.locator('..').locator('..').locator('[class*="error"], [role="alert"]');
  }

  get confirmPasswordError(): Locator {
    return this.confirmPasswordInput.locator('..').locator('..').locator('[class*="error"], [role="alert"]');
  }

  get termsError(): Locator {
    return this.page.locator('p.text-error, [class*="error"]').filter({ hasText: /terms|accept/i });
  }

  // ===========================================================================
  // Actions
  // ===========================================================================

  /**
   * Navigate to register page
   */
  async navigate(): Promise<void> {
    await this.goto(this.path);
    await expect(this.page).toHaveURL(this.path);
  }

  /**
   * Fill first name field
   */
  async fillFirstName(firstName: string): Promise<void> {
    await this.firstNameInput.fill(firstName);
  }

  /**
   * Fill last name field
   */
  async fillLastName(lastName: string): Promise<void> {
    await this.lastNameInput.fill(lastName);
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
   * Fill confirm password field
   */
  async fillConfirmPassword(confirmPassword: string): Promise<void> {
    await this.confirmPasswordInput.fill(confirmPassword);
  }

  /**
   * Accept terms and conditions
   */
  async acceptTerms(): Promise<void> {
    await this.acceptTermsCheckbox.check();
  }

  /**
   * Fill entire registration form
   */
  async fillForm(user: TestUser, acceptTerms = true): Promise<void> {
    await this.fillFirstName(user.firstName);
    await this.fillLastName(user.lastName);
    await this.fillEmail(user.email);
    await this.fillPassword(user.password);
    await this.fillConfirmPassword(user.password);

    if (acceptTerms) {
      await this.acceptTerms();
    }
  }

  /**
   * Submit the registration form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Complete registration flow
   */
  async register(user: TestUser): Promise<void> {
    await this.fillForm(user);
    await this.submit();
  }

  /**
   * Toggle password visibility
   */
  async togglePasswordVisibility(): Promise<void> {
    await this.passwordToggle.click();
  }

  /**
   * Toggle confirm password visibility
   */
  async toggleConfirmPasswordVisibility(): Promise<void> {
    await this.confirmPasswordToggle.click();
  }

  /**
   * Click login link
   */
  async clickLogin(): Promise<void> {
    await this.loginLink.click();
  }

  // ===========================================================================
  // Assertions
  // ===========================================================================

  /**
   * Assert registration form is displayed
   */
  async expectFormDisplayed(): Promise<void> {
    await expect(this.firstNameInput).toBeVisible();
    await expect(this.lastNameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.confirmPasswordInput).toBeVisible();
    await expect(this.acceptTermsCheckbox).toBeVisible();
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
   * Assert first name field has error
   */
  async expectFirstNameError(message?: string | RegExp): Promise<void> {
    if (message) {
      await expect(this.firstNameError.first()).toContainText(message);
    } else {
      await expect(this.firstNameError.first()).toBeVisible();
    }
  }

  /**
   * Assert last name field has error
   */
  async expectLastNameError(message?: string | RegExp): Promise<void> {
    if (message) {
      await expect(this.lastNameError.first()).toContainText(message);
    } else {
      await expect(this.lastNameError.first()).toBeVisible();
    }
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
   * Assert confirm password field has error
   */
  async expectConfirmPasswordError(message?: string | RegExp): Promise<void> {
    if (message) {
      await expect(this.confirmPasswordError.first()).toContainText(message);
    } else {
      await expect(this.confirmPasswordError.first()).toBeVisible();
    }
  }

  /**
   * Assert terms error is shown
   */
  async expectTermsError(message?: string | RegExp): Promise<void> {
    if (message) {
      await expect(this.termsError.first()).toContainText(message);
    } else {
      await expect(this.termsError.first()).toBeVisible();
    }
  }

  /**
   * Assert redirect to email verification pending
   */
  async expectRedirectToEmailVerificationPending(): Promise<void> {
    await expect(this.page).toHaveURL(/\/verify-email-pending/);
  }

  /**
   * Assert redirect to login page
   */
  async expectRedirectToLogin(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/);
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
}
