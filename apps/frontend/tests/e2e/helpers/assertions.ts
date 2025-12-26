/**
 * Common assertion helpers for E2E tests
 *
 * Reusable assertion functions specific to authentication and app state.
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Assert user is redirected to dashboard after login
 */
export async function assertRedirectToDashboard(page: Page): Promise<void> {
  await expect(page).toHaveURL(/^\/(dashboard)?$/);
}

/**
 * Assert user is redirected to login page
 */
export async function assertRedirectToLogin(page: Page): Promise<void> {
  await expect(page).toHaveURL('/login');
}

/**
 * Assert user is redirected to email verification pending page
 */
export async function assertRedirectToEmailVerificationPending(page: Page): Promise<void> {
  await expect(page).toHaveURL('/verify-email-pending');
}

/**
 * Assert user is redirected to profile completion page
 */
export async function assertRedirectToCompleteProfile(page: Page): Promise<void> {
  await expect(page).toHaveURL('/complete-profile');
}

/**
 * Assert user is redirected to 2FA setup page
 */
export async function assertRedirectTo2FASetup(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/setup-2fa/);
}

/**
 * Assert user is redirected to 2FA verification page
 */
export async function assertRedirectTo2FAVerification(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/verify-2fa/);
}

/**
 * Assert authentication state in localStorage/cookies
 *
 * @param page Playwright page instance
 * @param authenticated Expected authentication state
 */
export async function assertAuthenticationState(page: Page, authenticated: boolean): Promise<void> {
  const authToken = await page.evaluate(() => localStorage.getItem('auth_token'));

  if (authenticated) {
    expect(authToken).not.toBeNull();
    expect(authToken).toBeTruthy();
  } else {
    expect(authToken).toBeNull();
  }
}

/**
 * Assert user data is stored in auth store
 *
 * @param page Playwright page instance
 * @param expectedEmail Expected user email
 */
export async function assertUserInAuthStore(page: Page, expectedEmail: string): Promise<void> {
  const authState = await page.evaluate(() => {
    const stored = localStorage.getItem('auth-store');
    return stored ? JSON.parse(stored) : null;
  });

  expect(authState).not.toBeNull();
  expect(authState.state?.user?.email).toBe(expectedEmail);
}

/**
 * Assert no user data in auth store
 */
export async function assertNoUserInAuthStore(page: Page): Promise<void> {
  const authState = await page.evaluate(() => {
    const stored = localStorage.getItem('auth-store');
    return stored ? JSON.parse(stored) : null;
  });

  if (authState) {
    expect(authState.state?.user).toBeNull();
  }
}

/**
 * Assert form has validation errors
 */
export async function assertFormHasValidationErrors(page: Page): Promise<void> {
  const errors = page.locator('[role="alert"]').filter({ hasText: /error|invalid|required/i });
  await expect(errors.first()).toBeVisible();
  const count = await errors.count();
  expect(count).toBeGreaterThan(0);
}

/**
 * Assert form has no validation errors
 */
export async function assertFormHasNoValidationErrors(page: Page): Promise<void> {
  const errors = page.locator('[role="alert"]').filter({ hasText: /error|invalid|required/i });
  await expect(errors).toHaveCount(0);
}

/**
 * Assert specific field has error
 *
 * @param page Playwright page instance
 * @param fieldLabel Field label
 * @param errorText Expected error text
 */
export async function assertFieldHasError(page: Page, fieldLabel: string | RegExp, errorText: string | RegExp): Promise<void> {
  const field = page.getByLabel(fieldLabel);
  await expect(field).toBeVisible();

  // Find error near field
  const fieldContainer = field.locator('..').locator('..');
  const error = fieldContainer.locator('[role="alert"]');

  await expect(error).toBeVisible();
  await expect(error).toContainText(errorText);
}

/**
 * Assert toast notification appears
 *
 * @param page Playwright page instance
 * @param message Expected toast message
 * @param type Toast type
 */
export async function assertToastAppears(
  page: Page,
  message: string | RegExp,
  type?: 'success' | 'error' | 'warning' | 'info'
): Promise<void> {
  let toast;

  if (type) {
    toast = page.locator(`[role="alert"][data-type="${type}"]`).filter({ hasText: message });
  } else {
    toast = page.locator('[role="alert"]').filter({ hasText: message });
  }

  await expect(toast).toBeVisible({ timeout: 5000 });
}

/**
 * Assert error toast appears
 *
 * @param page Playwright page instance
 * @param message Expected error message
 */
export async function assertErrorToast(page: Page, message: string | RegExp): Promise<void> {
  await assertToastAppears(page, message, 'error');
}

/**
 * Assert success toast appears
 *
 * @param page Playwright page instance
 * @param message Expected success message
 */
export async function assertSuccessToast(page: Page, message: string | RegExp): Promise<void> {
  await assertToastAppears(page, message, 'success');
}

/**
 * Assert password strength indicator shows specific level
 *
 * @param page Playwright page instance
 * @param strength Expected strength (weak, fair, good, strong)
 */
export async function assertPasswordStrength(page: Page, strength: 'weak' | 'fair' | 'good' | 'strong'): Promise<void> {
  const strengthIndicator = page.locator('[data-testid="password-strength"]').or(
    page.getByText(new RegExp(strength, 'i'))
  );
  await expect(strengthIndicator).toBeVisible();
}

/**
 * Assert loading state is active
 */
export async function assertLoadingState(page: Page): Promise<void> {
  const spinner = page.getByRole('status').or(page.locator('[data-testid="spinner"]'));
  await expect(spinner).toBeVisible();
}

/**
 * Assert loading state is complete
 */
export async function assertLoadingComplete(page: Page): Promise<void> {
  const spinner = page.getByRole('status').or(page.locator('[data-testid="spinner"]'));
  await expect(spinner).toHaveCount(0);
}

/**
 * Assert button is in loading state
 *
 * @param page Playwright page instance
 * @param buttonName Button name
 */
export async function assertButtonLoading(page: Page, buttonName: string | RegExp): Promise<void> {
  const button = page.getByRole('button', { name: buttonName });
  await expect(button).toBeVisible();
  await expect(button).toBeDisabled();

  // Check for loading spinner inside button
  const spinner = button.locator('[role="status"]').or(button.locator('.spinner'));
  await expect(spinner).toBeVisible();
}

/**
 * Assert user profile information is displayed
 *
 * @param page Playwright page instance
 * @param displayName Expected display name
 * @param email Expected email
 */
export async function assertUserProfileDisplayed(page: Page, displayName: string, email?: string): Promise<void> {
  await expect(page.getByText(displayName)).toBeVisible();

  if (email) {
    await expect(page.getByText(email)).toBeVisible();
  }
}

/**
 * Assert QR code is displayed for 2FA setup
 */
export async function assert2FAQRCodeDisplayed(page: Page): Promise<void> {
  const qrCode = page.getByRole('img', { name: /qr code/i }).or(page.locator('[data-testid="qr-code"]'));
  await expect(qrCode).toBeVisible();
}

/**
 * Assert backup codes are displayed
 */
export async function assertBackupCodesDisplayed(page: Page): Promise<void> {
  const backupCodes = page.getByText(/backup codes/i);
  await expect(backupCodes).toBeVisible();

  // Check for at least 5 codes
  const codePattern = /[A-Z0-9]{4}-[A-Z0-9]{4}/;
  const codes = page.getByText(codePattern);
  const count = await codes.count();
  expect(count).toBeGreaterThanOrEqual(5);
}

/**
 * Assert OAuth button is visible
 *
 * @param page Playwright page instance
 * @param provider OAuth provider
 */
export async function assertOAuthButtonVisible(
  page: Page,
  provider: 'google' | 'github' | 'microsoft' | 'apple'
): Promise<void> {
  const button = page.getByRole('button', { name: new RegExp(provider, 'i') });
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();
}

/**
 * Assert all OAuth buttons are visible
 */
export async function assertAllOAuthButtonsVisible(page: Page): Promise<void> {
  await assertOAuthButtonVisible(page, 'google');
  await assertOAuthButtonVisible(page, 'github');
  await assertOAuthButtonVisible(page, 'microsoft');
}

/**
 * Assert email verification status badge
 *
 * @param page Playwright page instance
 * @param verified Expected verification status
 */
export async function assertEmailVerificationBadge(page: Page, verified: boolean): Promise<void> {
  if (verified) {
    await expect(page.getByText(/verified|confirmed/i)).toBeVisible();
  } else {
    await expect(page.getByText(/unverified|pending|verify/i)).toBeVisible();
  }
}

/**
 * Assert 2FA status badge
 *
 * @param page Playwright page instance
 * @param enabled Expected 2FA status
 */
export async function assert2FAStatusBadge(page: Page, enabled: boolean): Promise<void> {
  if (enabled) {
    await expect(page.getByText(/enabled|active/i)).toBeVisible();
  } else {
    await expect(page.getByText(/disabled|not enabled/i)).toBeVisible();
  }
}

/**
 * Assert page title
 *
 * @param page Playwright page instance
 * @param title Expected page title
 */
export async function assertPageTitle(page: Page, title: string | RegExp): Promise<void> {
  await expect(page).toHaveTitle(title);
}

/**
 * Assert heading text
 *
 * @param page Playwright page instance
 * @param text Expected heading text
 * @param level Heading level (1-6)
 */
export async function assertHeading(page: Page, text: string | RegExp, level?: 1 | 2 | 3 | 4 | 5 | 6): Promise<void> {
  const heading = level
    ? page.locator(`h${level}:has-text("${text instanceof RegExp ? text.source : text}")`)
    : page.getByRole('heading', { name: text });
  await expect(heading).toBeVisible();
}

/**
 * Assert link is present
 *
 * @param page Playwright page instance
 * @param text Link text
 * @param href Expected href (optional)
 */
export async function assertLink(page: Page, text: string | RegExp, href?: string | RegExp): Promise<void> {
  const link = page.getByRole('link', { name: text });
  await expect(link).toBeVisible();

  if (href) {
    await expect(link).toHaveAttribute('href', href);
  }
}

/**
 * Assert element has specific attribute value
 *
 * @param page Playwright page instance
 * @param selector Element selector
 * @param attribute Attribute name
 * @param value Expected value
 */
export async function assertAttribute(page: Page, selector: string, attribute: string, value: string | RegExp): Promise<void> {
  await expect(page.locator(selector)).toHaveAttribute(attribute, value);
}

/**
 * Assert element is focused
 *
 * @param page Playwright page instance
 * @param selector Element selector
 */
export async function assertFocused(page: Page, selector: string): Promise<void> {
  await expect(page.locator(selector)).toBeFocused();
}

/**
 * Assert accessibility: element has correct ARIA attributes
 *
 * @param page Playwright page instance
 * @param selector Element selector
 * @param ariaLabel Expected aria-label
 */
export async function assertAriaLabel(page: Page, selector: string, ariaLabel: string): Promise<void> {
  await expect(page.locator(selector)).toHaveAttribute('aria-label', ariaLabel);
}
