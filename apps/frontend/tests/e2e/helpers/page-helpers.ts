/**
 * Page interaction helpers for E2E tests
 *
 * Reusable functions for common page interactions, navigation, and form handling.
 */

import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(page: Page, url?: string | RegExp): Promise<void> {
  if (url) {
    await expect(page).toHaveURL(url);
  }
  await waitForPageLoad(page);
}

/**
 * Fill form field by label
 *
 * @param page Playwright page instance
 * @param label Field label text or regex
 * @param value Value to fill
 */
export async function fillFieldByLabel(page: Page, label: string | RegExp, value: string): Promise<void> {
  const field = page.getByLabel(label);
  await expect(field).toBeVisible();
  await field.fill(value);
}

/**
 * Fill form field by placeholder
 *
 * @param page Playwright page instance
 * @param placeholder Placeholder text or regex
 * @param value Value to fill
 */
export async function fillFieldByPlaceholder(page: Page, placeholder: string | RegExp, value: string): Promise<void> {
  const field = page.getByPlaceholder(placeholder);
  await expect(field).toBeVisible();
  await field.fill(value);
}

/**
 * Click button by name
 *
 * @param page Playwright page instance
 * @param name Button name or regex
 */
export async function clickButton(page: Page, name: string | RegExp): Promise<void> {
  const button = page.getByRole('button', { name });
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();
  await button.click();
}

/**
 * Click link by name
 *
 * @param page Playwright page instance
 * @param name Link name or regex
 */
export async function clickLink(page: Page, name: string | RegExp): Promise<void> {
  const link = page.getByRole('link', { name });
  await expect(link).toBeVisible();
  await link.click();
}

/**
 * Check checkbox by label
 *
 * @param page Playwright page instance
 * @param label Checkbox label text or regex
 */
export async function checkCheckbox(page: Page, label: string | RegExp): Promise<void> {
  const checkbox = page.getByRole('checkbox', { name: label });
  await expect(checkbox).toBeVisible();
  await checkbox.check();
}

/**
 * Uncheck checkbox by label
 *
 * @param page Playwright page instance
 * @param label Checkbox label text or regex
 */
export async function uncheckCheckbox(page: Page, label: string | RegExp): Promise<void> {
  const checkbox = page.getByRole('checkbox', { name: label });
  await expect(checkbox).toBeVisible();
  await checkbox.uncheck();
}

/**
 * Select dropdown option by label
 *
 * @param page Playwright page instance
 * @param label Dropdown label text or regex
 * @param option Option to select
 */
export async function selectOption(page: Page, label: string | RegExp, option: string): Promise<void> {
  const select = page.getByLabel(label);
  await expect(select).toBeVisible();
  await select.selectOption(option);
}

/**
 * Wait for toast notification to appear
 *
 * @param page Playwright page instance
 * @param message Expected toast message or regex
 * @param type Toast type (success, error, warning, info)
 */
export async function waitForToast(
  page: Page,
  message: string | RegExp,
  type?: 'success' | 'error' | 'warning' | 'info'
): Promise<void> {
  let toastLocator: Locator;

  if (type) {
    toastLocator = page.locator(`[role="alert"][data-type="${type}"]`).filter({ hasText: message });
  } else {
    toastLocator = page.locator('[role="alert"]').filter({ hasText: message });
  }

  await expect(toastLocator).toBeVisible({ timeout: 5000 });
}

/**
 * Wait for error message to appear
 *
 * @param page Playwright page instance
 * @param message Expected error message or regex
 */
export async function waitForErrorMessage(page: Page, message: string | RegExp): Promise<void> {
  const errorLocator = page.locator('[role="alert"]').filter({ hasText: message });
  await expect(errorLocator).toBeVisible();
}

/**
 * Wait for success message to appear
 *
 * @param page Playwright page instance
 * @param message Expected success message or regex
 */
export async function waitForSuccessMessage(page: Page, message: string | RegExp): Promise<void> {
  await waitForToast(page, message, 'success');
}

/**
 * Assert validation error on field
 *
 * @param page Playwright page instance
 * @param fieldLabel Field label text or regex
 * @param errorMessage Expected error message
 */
export async function assertFieldError(page: Page, fieldLabel: string | RegExp, errorMessage: string | RegExp): Promise<void> {
  const field = page.getByLabel(fieldLabel);
  await expect(field).toBeVisible();

  // Find error message near the field
  const fieldContainer = field.locator('..').locator('..');
  const error = fieldContainer.locator('[role="alert"]').or(fieldContainer.locator('.error-message'));

  await expect(error).toBeVisible();
  await expect(error).toContainText(errorMessage);
}

/**
 * Assert no validation errors on page
 */
export async function assertNoValidationErrors(page: Page): Promise<void> {
  const errors = page.locator('[role="alert"]').filter({ hasText: /error|invalid|required/i });
  await expect(errors).toHaveCount(0);
}

/**
 * Wait for loading spinner to disappear
 */
export async function waitForLoadingComplete(page: Page): Promise<void> {
  const spinner = page.getByRole('status').or(page.locator('[data-testid="spinner"]')).or(page.locator('.spinner'));

  // Wait for spinner to appear (if it will)
  await spinner.waitFor({ state: 'visible', timeout: 1000 }).catch(() => {});

  // Wait for spinner to disappear
  await expect(spinner).toHaveCount(0, { timeout: 10000 });
}

/**
 * Assert button is disabled
 *
 * @param page Playwright page instance
 * @param name Button name or regex
 */
export async function assertButtonDisabled(page: Page, name: string | RegExp): Promise<void> {
  const button = page.getByRole('button', { name });
  await expect(button).toBeVisible();
  await expect(button).toBeDisabled();
}

/**
 * Assert button is enabled
 *
 * @param page Playwright page instance
 * @param name Button name or regex
 */
export async function assertButtonEnabled(page: Page, name: string | RegExp): Promise<void> {
  const button = page.getByRole('button', { name });
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();
}

/**
 * Assert element is visible
 *
 * @param page Playwright page instance
 * @param selector Element selector
 */
export async function assertVisible(page: Page, selector: string): Promise<void> {
  await expect(page.locator(selector)).toBeVisible();
}

/**
 * Assert element is not visible
 *
 * @param page Playwright page instance
 * @param selector Element selector
 */
export async function assertNotVisible(page: Page, selector: string): Promise<void> {
  await expect(page.locator(selector)).not.toBeVisible();
}

/**
 * Assert heading is present
 *
 * @param page Playwright page instance
 * @param text Heading text or regex
 * @param level Heading level (1-6)
 */
export async function assertHeading(page: Page, text: string | RegExp, level?: 1 | 2 | 3 | 4 | 5 | 6): Promise<void> {
  const heading = level
    ? page.locator(`h${level}:has-text("${text instanceof RegExp ? text.source : text}")`)
    : page.getByRole('heading', { name: text });
  await expect(heading).toBeVisible();
}

/**
 * Assert text is present on page
 *
 * @param page Playwright page instance
 * @param text Text to find or regex
 */
export async function assertText(page: Page, text: string | RegExp): Promise<void> {
  await expect(page.getByText(text)).toBeVisible();
}

/**
 * Take screenshot for debugging
 *
 * @param page Playwright page instance
 * @param name Screenshot name
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}

/**
 * Clear browser storage (localStorage, sessionStorage, cookies)
 */
export async function clearBrowserStorage(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Get localStorage item
 *
 * @param page Playwright page instance
 * @param key LocalStorage key
 */
export async function getLocalStorageItem(page: Page, key: string): Promise<string | null> {
  return page.evaluate((k) => localStorage.getItem(k), key);
}

/**
 * Set localStorage item
 *
 * @param page Playwright page instance
 * @param key LocalStorage key
 * @param value Value to set
 */
export async function setLocalStorageItem(page: Page, key: string, value: string): Promise<void> {
  await page.evaluate(
    ({ k, v }) => localStorage.setItem(k, v),
    { k: key, v: value }
  );
}

/**
 * Get sessionStorage item
 *
 * @param page Playwright page instance
 * @param key SessionStorage key
 */
export async function getSessionStorageItem(page: Page, key: string): Promise<string | null> {
  return page.evaluate((k) => sessionStorage.getItem(k), key);
}

/**
 * Set sessionStorage item
 *
 * @param page Playwright page instance
 * @param key SessionStorage key
 * @param value Value to set
 */
export async function setSessionStorageItem(page: Page, key: string, value: string): Promise<void> {
  await page.evaluate(
    ({ k, v }) => sessionStorage.setItem(k, v),
    { k: key, v: value }
  );
}

/**
 * Reload page
 */
export async function reloadPage(page: Page): Promise<void> {
  await page.reload();
  await waitForPageLoad(page);
}

/**
 * Go back in browser history
 */
export async function goBack(page: Page): Promise<void> {
  await page.goBack();
  await waitForPageLoad(page);
}

/**
 * Go forward in browser history
 */
export async function goForward(page: Page): Promise<void> {
  await page.goForward();
  await waitForPageLoad(page);
}

/**
 * Press keyboard key
 *
 * @param page Playwright page instance
 * @param key Key to press
 */
export async function pressKey(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key);
}

/**
 * Wait for specific time (use sparingly, prefer waitFor* methods)
 *
 * @param ms Milliseconds to wait
 */
export async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
