/**
 * Two-Factor Authentication Page Object Models
 *
 * Encapsulates interactions with 2FA setup and verification pages.
 */

import { type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

// =============================================================================
// 2FA Setup Page
// =============================================================================

export class TwoFactorSetupPage extends BasePage {
  readonly path = '/setup-2fa';

  // ===========================================================================
  // Locators
  // ===========================================================================

  /**
   * QR code image
   */
  get qrCode(): Locator {
    return this.page.getByRole('img', { name: /qr code/i }).or(
      this.page.locator('[data-testid="qr-code"]').or(
        this.page.locator('img[src*="qr"]')
      )
    );
  }

  /**
   * Manual entry secret key
   */
  get secretKey(): Locator {
    return this.page.locator('[data-testid="secret-key"]').or(
      this.page.getByText(/[A-Z0-9]{16,}/)
    );
  }

  /**
   * Verification code input (single field or OTP inputs)
   */
  get codeInput(): Locator {
    return this.page.getByLabel(/code|verification/i).or(
      this.page.locator('input[inputmode="numeric"]').first()
    );
  }

  /**
   * OTP input fields (if using individual digit inputs)
   */
  get otpInputs(): Locator {
    return this.page.locator('input[inputmode="numeric"]');
  }

  /**
   * Continue/Verify button
   */
  get verifyButton(): Locator {
    return this.page.getByRole('button', { name: /verify|continue|confirm|enable/i });
  }

  /**
   * Skip button
   */
  get skipButton(): Locator {
    return this.page.getByRole('button', { name: /skip|later|not now/i });
  }

  /**
   * Backup codes list
   */
  get backupCodes(): Locator {
    return this.page.locator('[data-testid="backup-codes"]').or(
      this.page.locator('code, pre').filter({ hasText: /[A-Z0-9]{4}-[A-Z0-9]{4}/ })
    );
  }

  /**
   * Copy backup codes button
   */
  get copyBackupCodesButton(): Locator {
    return this.page.getByRole('button', { name: /copy|download/i });
  }

  /**
   * Continue after backup codes button
   */
  get continueAfterBackupButton(): Locator {
    return this.page.getByRole('button', { name: /continue|done|finish/i });
  }

  /**
   * Error message
   */
  get errorMessage(): Locator {
    return this.page.locator('[role="alert"]').or(
      this.page.locator('[class*="error"]')
    );
  }

  // ===========================================================================
  // Actions
  // ===========================================================================

  /**
   * Navigate to 2FA setup page
   */
  async navigate(): Promise<void> {
    await this.goto(this.path);
    // Allow for redirect query parameters
    await expect(this.page).toHaveURL(/\/setup-2fa(\?.*)?$/);
  }

  /**
   * Fill verification code (supports single input or OTP inputs)
   */
  async fillCode(code: string): Promise<void> {
    const otpInputCount = await this.otpInputs.count();

    if (otpInputCount >= 6) {
      // Fill individual OTP inputs
      for (let i = 0; i < code.length && i < otpInputCount; i++) {
        await this.otpInputs.nth(i).fill(code[i]);
      }
    } else {
      // Fill single input
      await this.codeInput.fill(code);
    }
  }

  /**
   * Click verify button
   */
  async clickVerify(): Promise<void> {
    await this.verifyButton.click();
  }

  /**
   * Verify 2FA setup with code
   */
  async verify(code: string): Promise<void> {
    await this.fillCode(code);
    await this.clickVerify();
  }

  /**
   * Click skip button
   */
  async clickSkip(): Promise<void> {
    await this.skipButton.click();
  }

  /**
   * Click copy backup codes button
   */
  async clickCopyBackupCodes(): Promise<void> {
    await this.copyBackupCodesButton.click();
  }

  /**
   * Click continue after backup codes
   */
  async clickContinue(): Promise<void> {
    await this.continueAfterBackupButton.click();
  }

  /**
   * Get backup codes text
   */
  async getBackupCodes(): Promise<string[]> {
    const text = await this.backupCodes.textContent();
    if (!text) return [];
    return text.match(/[A-Z0-9]{4}-[A-Z0-9]{4}/g) || [];
  }

  // ===========================================================================
  // Assertions
  // ===========================================================================

  /**
   * Assert QR code is displayed
   */
  async expectQRCodeDisplayed(): Promise<void> {
    await expect(this.qrCode).toBeVisible();
  }

  /**
   * Assert secret key is displayed
   */
  async expectSecretKeyDisplayed(): Promise<void> {
    await expect(this.secretKey).toBeVisible();
  }

  /**
   * Assert backup codes are displayed
   */
  async expectBackupCodesDisplayed(): Promise<void> {
    await expect(this.backupCodes).toBeVisible();
    const codes = await this.getBackupCodes();
    expect(codes.length).toBeGreaterThanOrEqual(5);
  }

  /**
   * Assert error message is shown
   */
  async expectError(message?: string | RegExp): Promise<void> {
    if (message) {
      await expect(this.errorMessage.first()).toContainText(message);
    } else {
      await expect(this.errorMessage.first()).toBeVisible();
    }
  }

  /**
   * Assert redirect to dashboard
   */
  async expectRedirectToDashboard(): Promise<void> {
    await expect(this.page).toHaveURL(/^\/(dashboard)?$/);
  }

  /**
   * Assert skip button is visible
   */
  async expectSkipButtonVisible(): Promise<void> {
    await expect(this.skipButton).toBeVisible();
  }
}

// =============================================================================
// 2FA Verification Page (Login)
// =============================================================================

export class TwoFactorVerificationPage extends BasePage {
  readonly path = '/verify-2fa';

  // ===========================================================================
  // Locators
  // ===========================================================================

  /**
   * Verification code input
   */
  get codeInput(): Locator {
    return this.page.getByLabel(/code|verification/i).or(
      this.page.locator('input[inputmode="numeric"]').first()
    );
  }

  /**
   * OTP input fields
   */
  get otpInputs(): Locator {
    return this.page.locator('input[inputmode="numeric"]');
  }

  /**
   * Verify button
   */
  get verifyButton(): Locator {
    return this.page.getByRole('button', { name: /verify|continue|submit/i });
  }

  /**
   * Use backup code link/button
   */
  get useBackupCodeLink(): Locator {
    return this.page.getByRole('button', { name: /backup code|recovery/i }).or(
      this.page.getByText(/backup code|recovery/i)
    );
  }

  /**
   * Backup code input (shown when using backup codes)
   */
  get backupCodeInput(): Locator {
    return this.page.getByLabel(/backup code|recovery code/i).or(
      this.page.getByPlaceholder(/backup|recovery|XXXX-XXXX/i)
    );
  }

  /**
   * Error message
   */
  get errorMessage(): Locator {
    return this.page.locator('[role="alert"]').or(
      this.page.locator('[class*="error"]')
    );
  }

  /**
   * Cancel/Back button
   */
  get cancelButton(): Locator {
    return this.page.getByRole('button', { name: /cancel|back/i }).or(
      this.page.getByRole('link', { name: /cancel|back/i })
    );
  }

  // ===========================================================================
  // Actions
  // ===========================================================================

  /**
   * Navigate to 2FA verification page
   */
  async navigate(): Promise<void> {
    await this.goto(this.path);
    // Allow for redirect query parameters
    await expect(this.page).toHaveURL(/\/verify-2fa(\?.*)?$/);
  }

  /**
   * Fill verification code
   */
  async fillCode(code: string): Promise<void> {
    const otpInputCount = await this.otpInputs.count();

    if (otpInputCount >= 6) {
      for (let i = 0; i < code.length && i < otpInputCount; i++) {
        await this.otpInputs.nth(i).fill(code[i]);
      }
    } else {
      await this.codeInput.fill(code);
    }
  }

  /**
   * Click verify button
   */
  async clickVerify(): Promise<void> {
    await this.verifyButton.click();
  }

  /**
   * Verify with code
   */
  async verify(code: string): Promise<void> {
    await this.fillCode(code);
    await this.clickVerify();
  }

  /**
   * Click use backup code link
   */
  async clickUseBackupCode(): Promise<void> {
    await this.useBackupCodeLink.click();
  }

  /**
   * Fill backup code
   */
  async fillBackupCode(code: string): Promise<void> {
    await this.backupCodeInput.fill(code);
  }

  /**
   * Verify with backup code
   */
  async verifyWithBackupCode(code: string): Promise<void> {
    await this.clickUseBackupCode();
    await this.fillBackupCode(code);
    await this.clickVerify();
  }

  /**
   * Click cancel button
   */
  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  // ===========================================================================
  // Assertions
  // ===========================================================================

  /**
   * Assert verification form is displayed
   */
  async expectFormDisplayed(): Promise<void> {
    const codeVisible = await this.codeInput.isVisible().catch(() => false);
    const otpVisible = await this.otpInputs.first().isVisible().catch(() => false);
    expect(codeVisible || otpVisible).toBeTruthy();
    await expect(this.verifyButton).toBeVisible();
  }

  /**
   * Assert error message is shown
   */
  async expectError(message?: string | RegExp): Promise<void> {
    if (message) {
      await expect(this.errorMessage.first()).toContainText(message);
    } else {
      await expect(this.errorMessage.first()).toBeVisible();
    }
  }

  /**
   * Assert backup code option is available
   */
  async expectBackupCodeOptionVisible(): Promise<void> {
    await expect(this.useBackupCodeLink).toBeVisible();
  }

  /**
   * Assert redirect to dashboard
   */
  async expectRedirectToDashboard(): Promise<void> {
    await expect(this.page).toHaveURL(/^\/(dashboard)?$/);
  }

  /**
   * Assert redirect to login
   */
  async expectRedirectToLogin(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/);
  }
}
