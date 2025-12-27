/**
 * Base Page Object Model
 *
 * Common page elements and methods shared across all pages.
 * All page objects should extend this class.
 */

import { type Page, type Locator, expect } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ===========================================================================
  // Common UI Elements
  // ===========================================================================

  /**
   * Loading spinner/indicator
   */
  get loader(): Locator {
    return this.page.getByRole('status').or(this.page.locator('[data-testid="loading-spinner"]'));
  }

  /**
   * Toast notifications (using Sonner)
   */
  get toast(): Locator {
    return this.page.locator('[data-sonner-toast]');
  }

  /**
   * Success toast
   */
  get successToast(): Locator {
    return this.page.locator('[data-sonner-toast][data-type="success"]');
  }

  /**
   * Error toast
   */
  get errorToast(): Locator {
    return this.page.locator('[data-sonner-toast][data-type="error"]');
  }

  // ===========================================================================
  // Common Actions
  // ===========================================================================

  /**
   * Navigate to a path
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for loader to disappear
   */
  async waitForLoaderToDisappear(timeout = 10000): Promise<void> {
    const loader = this.loader;
    const isVisible = await loader.isVisible().catch(() => false);
    if (isVisible) {
      await expect(loader).toBeHidden({ timeout });
    }
  }

  /**
   * Wait for toast notification
   */
  async waitForToast(message?: string | RegExp, timeout = 5000): Promise<void> {
    const toast = message
      ? this.toast.filter({ hasText: message })
      : this.toast;
    await expect(toast.first()).toBeVisible({ timeout });
  }

  /**
   * Wait for success toast
   */
  async waitForSuccessToast(message?: string | RegExp, timeout = 5000): Promise<void> {
    const toast = message
      ? this.successToast.filter({ hasText: message })
      : this.successToast;
    await expect(toast.first()).toBeVisible({ timeout });
  }

  /**
   * Wait for error toast
   */
  async waitForErrorToast(message?: string | RegExp, timeout = 5000): Promise<void> {
    const toast = message
      ? this.errorToast.filter({ hasText: message })
      : this.errorToast;
    await expect(toast.first()).toBeVisible({ timeout });
  }

  /**
   * Dismiss all toasts
   */
  async dismissToasts(): Promise<void> {
    const toasts = this.toast;
    const count = await toasts.count();
    for (let i = 0; i < count; i++) {
      const closeButton = toasts.nth(i).getByRole('button', { name: /close|dismiss/i });
      const isVisible = await closeButton.isVisible().catch(() => false);
      if (isVisible) {
        await closeButton.click();
      }
    }
  }

  // ===========================================================================
  // Common Assertions
  // ===========================================================================

  /**
   * Assert current URL matches pattern
   */
  async expectUrl(pattern: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(pattern);
  }

  /**
   * Assert page title
   */
  async expectTitle(title: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(title);
  }

  /**
   * Assert toast message appears
   */
  async expectToastMessage(message: string | RegExp): Promise<void> {
    await this.waitForToast(message);
  }

  /**
   * Assert success toast appears
   */
  async expectSuccessMessage(message: string | RegExp): Promise<void> {
    await this.waitForSuccessToast(message);
  }

  /**
   * Assert error toast appears
   */
  async expectErrorMessage(message: string | RegExp): Promise<void> {
    await this.waitForErrorToast(message);
  }

  // ===========================================================================
  // Storage Helpers
  // ===========================================================================

  /**
   * Get localStorage item
   */
  async getLocalStorageItem(key: string): Promise<string | null> {
    return await this.page.evaluate((k) => localStorage.getItem(k), key);
  }

  /**
   * Set localStorage item
   */
  async setLocalStorageItem(key: string, value: string): Promise<void> {
    await this.page.evaluate(
      ({ k, v }) => localStorage.setItem(k, v),
      { k: key, v: value }
    );
  }

  /**
   * Clear localStorage
   */
  async clearLocalStorage(): Promise<void> {
    await this.page.evaluate(() => localStorage.clear());
  }

  /**
   * Get sessionStorage item
   */
  async getSessionStorageItem(key: string): Promise<string | null> {
    return await this.page.evaluate((k) => sessionStorage.getItem(k), key);
  }

  /**
   * Check if user is authenticated based on stored token
   */
  async isAuthenticated(): Promise<boolean> {
    const authStore = await this.getLocalStorageItem('auth-store');
    if (!authStore) return false;

    try {
      const parsed = JSON.parse(authStore);
      return parsed?.state?.isAuthenticated === true;
    } catch {
      return false;
    }
  }

  // ===========================================================================
  // Accessibility Helpers
  // ===========================================================================

  /**
   * Check for accessibility violations (basic)
   */
  async checkBasicA11y(): Promise<void> {
    // Check for main landmark
    await expect(this.page.locator('main').or(this.page.locator('[role="main"]'))).toBeVisible();

    // Check all images have alt text
    const images = this.page.locator('img');
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).not.toBeNull();
    }

    // Check form labels
    const inputs = this.page.locator('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
    const inputCount = await inputs.count();
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      // Input should have either id (with label), aria-label, or aria-labelledby
      const hasLabel = id || ariaLabel || ariaLabelledBy;
      expect(hasLabel, `Input at index ${i} should have proper labeling`).toBeTruthy();
    }
  }
}
