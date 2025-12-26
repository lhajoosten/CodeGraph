/**
 * Authentication helper functions for E2E tests
 *
 * These helpers encapsulate common authentication flows to keep tests DRY
 * and maintainable. All helpers use Playwright Page API and handle implicit waits.
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { TestUser, TestUserWithProfile as _TestUserWithProfile } from '../fixtures/users';
import { TEST_2FA_CODES } from '../fixtures/users';

/**
 * Navigate to login page
 */
export async function navigateToLogin(page: Page): Promise<void> {
  await page.goto('/login');
  await expect(page).toHaveURL('/login');
}

/**
 * Navigate to register page
 */
export async function navigateToRegister(page: Page): Promise<void> {
  await page.goto('/register');
  await expect(page).toHaveURL('/register');
}

/**
 * Navigate to forgot password page
 */
export async function navigateToForgotPassword(page: Page): Promise<void> {
  await page.goto('/forgot-password');
  await expect(page).toHaveURL('/forgot-password');
}

/**
 * Fill and submit login form
 *
 * @param page Playwright page instance
 * @param email User email
 * @param password User password
 */
export async function fillLoginForm(page: Page, email: string, password: string): Promise<void> {
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
}

/**
 * Submit login form
 */
export async function submitLoginForm(page: Page): Promise<void> {
  await page.getByRole('button', { name: /sign in|log in/i }).click();
}

/**
 * Login with credentials (does not handle 2FA)
 *
 * @param page Playwright page instance
 * @param email User email
 * @param password User password
 */
export async function loginWithCredentials(page: Page, email: string, password: string): Promise<void> {
  await navigateToLogin(page);
  await fillLoginForm(page, email, password);
  await submitLoginForm(page);
}

/**
 * Login and complete 2FA verification
 *
 * @param page Playwright page instance
 * @param email User email
 * @param password User password
 * @param code 2FA verification code (defaults to valid test code)
 */
export async function loginWith2FA(
  page: Page,
  email: string,
  password: string,
  code: string = TEST_2FA_CODES.valid
): Promise<void> {
  await loginWithCredentials(page, email, password);

  // Wait for redirect to 2FA verification page
  await expect(page).toHaveURL(/\/verify-2fa/);

  // Fill and submit 2FA code
  await fill2FACode(page, code);
  await submit2FACode(page);
}

/**
 * Fill registration form
 *
 * @param page Playwright page instance
 * @param user User data
 */
export async function fillRegistrationForm(page: Page, user: TestUser): Promise<void> {
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/^password/i).fill(user.password);
  await page.getByLabel(/confirm password/i).fill(user.password);

  // Accept terms if checkbox exists
  const termsCheckbox = page.getByRole('checkbox', { name: /terms|agree/i });
  if (await termsCheckbox.isVisible()) {
    await termsCheckbox.check();
  }
}

/**
 * Submit registration form
 */
export async function submitRegistrationForm(page: Page): Promise<void> {
  await page.getByRole('button', { name: /sign up|register|create account/i }).click();
}

/**
 * Register new user account
 *
 * @param page Playwright page instance
 * @param user User data
 */
export async function registerUser(page: Page, user: TestUser): Promise<void> {
  await navigateToRegister(page);
  await fillRegistrationForm(page, user);
  await submitRegistrationForm(page);
}

/**
 * Fill profile completion form
 *
 * @param page Playwright page instance
 * @param firstName First name
 * @param lastName Last name
 */
export async function fillProfileForm(page: Page, firstName: string, lastName: string): Promise<void> {
  await page.getByLabel(/first name/i).fill(firstName);
  await page.getByLabel(/last name/i).fill(lastName);
}

/**
 * Submit profile completion form
 */
export async function submitProfileForm(page: Page): Promise<void> {
  await page.getByRole('button', { name: /continue|save|complete/i }).click();
}

/**
 * Complete user profile
 *
 * @param page Playwright page instance
 * @param firstName First name
 * @param lastName Last name
 */
export async function completeProfile(page: Page, firstName: string, lastName: string): Promise<void> {
  await fillProfileForm(page, firstName, lastName);
  await submitProfileForm(page);
}

/**
 * Fill 2FA setup code
 *
 * @param page Playwright page instance
 * @param code 2FA verification code
 */
export async function fill2FACode(page: Page, code: string): Promise<void> {
  // Handle both single input and multiple digit inputs
  const singleInput = page.getByLabel(/code|verification code/i);
  const digitInputs = page.getByRole('textbox').filter({ has: page.locator('[inputmode="numeric"]') });

  const singleInputVisible = await singleInput.isVisible().catch(() => false);
  const digitInputsVisible = (await digitInputs.count()) > 0;

  if (singleInputVisible) {
    await singleInput.fill(code);
  } else if (digitInputsVisible) {
    // Fill each digit separately for OTP input
    for (let i = 0; i < code.length; i++) {
      await digitInputs.nth(i).fill(code[i]);
    }
  } else {
    throw new Error('Could not find 2FA code input field');
  }
}

/**
 * Submit 2FA verification code
 */
export async function submit2FACode(page: Page): Promise<void> {
  await page.getByRole('button', { name: /verify|continue|submit/i }).click();
}

/**
 * Setup 2FA for user account
 *
 * @param page Playwright page instance
 * @param code 2FA verification code (defaults to valid test code)
 */
export async function setup2FA(page: Page, code: string = TEST_2FA_CODES.valid): Promise<void> {
  // Assume already on setup-2fa page

  // Click continue to generate QR code
  const continueButton = page.getByRole('button', { name: /continue|generate/i });
  if (await continueButton.isVisible()) {
    await continueButton.click();
  }

  // Wait for QR code to be displayed
  await expect(page.getByRole('img', { name: /qr code/i })).toBeVisible();

  // Fill verification code
  await fill2FACode(page, code);

  // Submit
  await submit2FACode(page);
}

/**
 * Skip 2FA setup (if skip option is available)
 */
export async function skip2FASetup(page: Page): Promise<void> {
  const skipButton = page.getByRole('button', { name: /skip|later/i });
  if (await skipButton.isVisible()) {
    await skipButton.click();
  }
}

/**
 * Verify email with token
 *
 * @param page Playwright page instance
 * @param token Verification token
 */
export async function verifyEmail(page: Page, token: string): Promise<void> {
  await page.goto(`/verify-email?token=${token}`);
}

/**
 * Request password reset
 *
 * @param page Playwright page instance
 * @param email User email
 */
export async function requestPasswordReset(page: Page, email: string): Promise<void> {
  await navigateToForgotPassword(page);
  await page.getByLabel(/email/i).fill(email);
  await page.getByRole('button', { name: /send|reset/i }).click();
}

/**
 * Reset password with token
 *
 * @param page Playwright page instance
 * @param token Reset token
 * @param newPassword New password
 */
export async function resetPassword(page: Page, token: string, newPassword: string): Promise<void> {
  await page.goto(`/reset-password?token=${token}`);
  await page.getByLabel(/^new password/i).fill(newPassword);
  await page.getByLabel(/confirm password/i).fill(newPassword);
  await page.getByRole('button', { name: /reset|save/i }).click();
}

/**
 * Initiate OAuth login
 *
 * @param page Playwright page instance
 * @param provider OAuth provider (google, github, microsoft, apple)
 */
export async function initiateOAuthLogin(
  page: Page,
  provider: 'google' | 'github' | 'microsoft' | 'apple'
): Promise<void> {
  await navigateToLogin(page);

  // Find and click OAuth button
  const oauthButton = page.getByRole('button', { name: new RegExp(provider, 'i') });
  await expect(oauthButton).toBeVisible();
  await oauthButton.click();
}

/**
 * Complete OAuth callback
 *
 * @param page Playwright page instance
 * @param provider OAuth provider
 * @param code Authorization code
 * @param state State parameter
 */
export async function completeOAuthCallback(
  page: Page,
  provider: 'google' | 'github' | 'microsoft' | 'apple',
  code: string,
  state: string
): Promise<void> {
  await page.goto(`/oauth/callback/${provider}?code=${code}&state=${state}`);
}

/**
 * Logout current user
 */
export async function logout(page: Page): Promise<void> {
  // Open user menu
  const userMenuButton = page.getByRole('button', { name: /user menu|account/i });
  if (await userMenuButton.isVisible()) {
    await userMenuButton.click();
  } else {
    // Try avatar/profile button
    const avatarButton = page.locator('[data-testid="user-avatar"]').or(
      page.getByRole('button').filter({ has: page.locator('img[alt*="avatar"]') })
    );
    await avatarButton.click();
  }

  // Click logout
  await page.getByRole('menuitem', { name: /log out|sign out/i }).click();

  // Wait for redirect to login page
  await expect(page).toHaveURL('/login');
}

/**
 * Check if user is authenticated (based on UI state)
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for user menu or avatar
    const userMenu = page.getByRole('button', { name: /user menu|account/i });
    const avatar = page.locator('[data-testid="user-avatar"]');

    const userMenuVisible = await userMenu.isVisible({ timeout: 1000 }).catch(() => false);
    const avatarVisible = await avatar.isVisible({ timeout: 1000 }).catch(() => false);

    return userMenuVisible || avatarVisible;
  } catch {
    return false;
  }
}

/**
 * Wait for successful authentication (redirect to dashboard)
 */
export async function waitForAuthentication(page: Page): Promise<void> {
  await expect(page).toHaveURL(/^\/(dashboard)?$/);
  await expect(isAuthenticated(page)).resolves.toBe(true);
}

/**
 * Assert user is on login page (not authenticated)
 */
export async function assertNotAuthenticated(page: Page): Promise<void> {
  await expect(page).toHaveURL('/login');
  await expect(isAuthenticated(page)).resolves.toBe(false);
}
