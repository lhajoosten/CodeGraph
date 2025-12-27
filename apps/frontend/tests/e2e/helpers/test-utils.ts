/**
 * Test Utilities for E2E Tests
 *
 * Common utility functions for test setup, assertions, and helpers.
 */

import type { Page, BrowserContext } from '@playwright/test';
import { expect } from '@playwright/test';

// =============================================================================
// Navigation Helpers
// =============================================================================

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
 * Navigate to dashboard (home)
 */
export async function navigateToDashboard(page: Page): Promise<void> {
  await page.goto('/');
  // Dashboard might redirect to login if not authenticated
}

// =============================================================================
// Storage Helpers
// =============================================================================

/**
 * Get localStorage item
 */
export async function getLocalStorageItem(page: Page, key: string): Promise<string | null> {
  return await page.evaluate((k) => localStorage.getItem(k), key);
}

/**
 * Set localStorage item
 */
export async function setLocalStorageItem(page: Page, key: string, value: string): Promise<void> {
  await page.evaluate(({ k, v }) => localStorage.setItem(k, v), { k: key, v: value });
}

/**
 * Clear localStorage
 */
export async function clearLocalStorage(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.clear());
}

/**
 * Get sessionStorage item
 */
export async function getSessionStorageItem(page: Page, key: string): Promise<string | null> {
  return await page.evaluate((k) => sessionStorage.getItem(k), key);
}

/**
 * Clear sessionStorage
 */
export async function clearSessionStorage(page: Page): Promise<void> {
  await page.evaluate(() => sessionStorage.clear());
}

/**
 * Clear all storage (localStorage and sessionStorage)
 */
export async function clearAllStorage(page: Page): Promise<void> {
  await clearLocalStorage(page);
  await clearSessionStorage(page);
}

// =============================================================================
// Authentication State Helpers
// =============================================================================

/**
 * Full auth state type
 */
interface AuthState {
  isAuthenticated: boolean;
  emailVerified: boolean;
  user: {
    id: string;
    email: string;
    email_verified: boolean;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    avatar_url?: string;
    profile_completed?: boolean;
  } | null;
  oauthProvider: string | null;
  twoFactorEnabled: boolean;
  twoFactorVerified: boolean;
  requiresTwoFactorSetup: boolean;
}

/**
 * Check if user is authenticated based on stored state
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const authStore = await getLocalStorageItem(page, 'auth-store');
  if (!authStore) return false;

  try {
    const parsed = JSON.parse(authStore);
    return parsed?.state?.isAuthenticated === true;
  } catch {
    return false;
  }
}

/**
 * Set full auth state in storage
 */
export async function setAuthState(page: Page, state: AuthState): Promise<void> {
  const authStore = {
    state,
    version: 0,
  };

  await setLocalStorageItem(page, 'auth-store', JSON.stringify(authStore));
}

/**
 * Set authenticated state in storage (for pre-authenticated tests)
 * Enhanced version that supports options for 2FA, email verification, etc.
 */
export async function setAuthenticatedState(
  page: Page,
  user: {
    id: string;
    email: string;
    email_verified?: boolean;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    avatar_url?: string;
    profile_completed?: boolean;
  },
  options?: {
    emailVerified?: boolean;
    twoFactorEnabled?: boolean;
    twoFactorVerified?: boolean;
    requiresTwoFactorSetup?: boolean;
    oauthProvider?: string | null;
  }
): Promise<void> {
  const authState: AuthState = {
    isAuthenticated: true,
    emailVerified: options?.emailVerified ?? true,
    user: {
      id: user.id,
      email: user.email,
      email_verified: user.email_verified ?? (options?.emailVerified ?? true),
      first_name: user.first_name,
      last_name: user.last_name,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      profile_completed: user.profile_completed,
    },
    oauthProvider: options?.oauthProvider ?? null,
    twoFactorEnabled: options?.twoFactorEnabled ?? false,
    twoFactorVerified: options?.twoFactorVerified ?? false,
    requiresTwoFactorSetup: options?.requiresTwoFactorSetup ?? false,
  };

  await setAuthState(page, authState);
}

/**
 * Set auth state for user who requires 2FA setup
 */
export async function setRequires2FASetupState(
  page: Page,
  user: {
    id: string;
    email: string;
    email_verified?: boolean;
    first_name?: string;
    last_name?: string;
  },
  path: string = '/setup-2fa'
): Promise<void> {
  // Navigate to the page first to establish localStorage access
  await page.goto(path);
  await setAuthenticatedState(page, user, {
    emailVerified: true,
    twoFactorEnabled: false,
    twoFactorVerified: false,
    requiresTwoFactorSetup: true,
  });
}

/**
 * Set auth state for user who requires 2FA verification
 */
export async function setRequires2FAVerificationState(
  page: Page,
  user: {
    id: string;
    email: string;
    email_verified?: boolean;
    first_name?: string;
    last_name?: string;
  }
): Promise<void> {
  await setAuthenticatedState(page, user, {
    emailVerified: true,
    twoFactorEnabled: true,
    twoFactorVerified: false,
    requiresTwoFactorSetup: false,
  });
}

/**
 * Set auth state for fully authenticated user (with 2FA verified)
 */
export async function setFullyAuthenticatedState(
  page: Page,
  user: {
    id: string;
    email: string;
    email_verified?: boolean;
    first_name?: string;
    last_name?: string;
  }
): Promise<void> {
  await setAuthenticatedState(page, user, {
    emailVerified: true,
    twoFactorEnabled: true,
    twoFactorVerified: true,
    requiresTwoFactorSetup: false,
  });
}

/**
 * Clear authentication state
 */
export async function clearAuthenticatedState(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('auth-store');
    localStorage.removeItem('auth_token');
    sessionStorage.clear();
  });
}

/**
 * Get current user from auth store
 */
export async function getCurrentUserFromStore(
  page: Page
): Promise<{ id: string; email: string } | null> {
  const authStore = await getLocalStorageItem(page, 'auth-store');
  if (!authStore) return null;

  try {
    const parsed = JSON.parse(authStore);
    return parsed?.state?.user || null;
  } catch {
    return null;
  }
}

// =============================================================================
// Wait Helpers
// =============================================================================

/**
 * Wait for URL to match pattern
 */
export async function waitForUrl(page: Page, pattern: string | RegExp, timeout = 10000): Promise<void> {
  await expect(page).toHaveURL(pattern, { timeout });
}

/**
 * Wait for authentication to complete (redirect to dashboard)
 */
export async function waitForAuthentication(page: Page, timeout = 10000): Promise<void> {
  await waitForUrl(page, /^\/(dashboard)?$/, timeout);
  const authenticated = await isAuthenticated(page);
  expect(authenticated).toBe(true);
}

/**
 * Wait for redirect to login
 */
export async function waitForRedirectToLogin(page: Page, timeout = 10000): Promise<void> {
  await waitForUrl(page, /\/login/, timeout);
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page, timeout = 10000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for toast notification
 */
export async function waitForToast(page: Page, message?: string | RegExp, timeout = 5000): Promise<void> {
  const toast = page.locator('[data-sonner-toast]');
  if (message) {
    await expect(toast.filter({ hasText: message }).first()).toBeVisible({ timeout });
  } else {
    await expect(toast.first()).toBeVisible({ timeout });
  }
}

// =============================================================================
// Form Helpers
// =============================================================================

/**
 * Fill input by label
 */
export async function fillInputByLabel(
  page: Page,
  label: string | RegExp,
  value: string
): Promise<void> {
  await page.getByLabel(label).fill(value);
}

/**
 * Click button by name
 */
export async function clickButton(page: Page, name: string | RegExp): Promise<void> {
  await page.getByRole('button', { name }).click();
}

/**
 * Click link by name
 */
export async function clickLink(page: Page, name: string | RegExp): Promise<void> {
  await page.getByRole('link', { name }).click();
}

/**
 * Check checkbox by label
 */
export async function checkCheckbox(page: Page, label?: string | RegExp): Promise<void> {
  if (label) {
    await page.getByLabel(label).check();
  } else {
    await page.getByRole('checkbox').check();
  }
}

/**
 * Uncheck checkbox by label
 */
export async function uncheckCheckbox(page: Page, label?: string | RegExp): Promise<void> {
  if (label) {
    await page.getByLabel(label).uncheck();
  } else {
    await page.getByRole('checkbox').uncheck();
  }
}

// =============================================================================
// Assertion Helpers
// =============================================================================

/**
 * Assert redirect to dashboard
 */
export async function assertRedirectToDashboard(page: Page): Promise<void> {
  await expect(page).toHaveURL(/^\/(dashboard)?$/);
}

/**
 * Assert redirect to login
 */
export async function assertRedirectToLogin(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/login/);
}

/**
 * Assert redirect to 2FA verification
 */
export async function assertRedirectTo2FAVerification(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/verify-2fa/);
}

/**
 * Assert redirect to 2FA setup
 */
export async function assertRedirectTo2FASetup(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/setup-2fa/);
}

/**
 * Assert redirect to email verification pending
 */
export async function assertRedirectToEmailVerificationPending(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/verify-email-pending/);
}

/**
 * Assert authentication state
 */
export async function assertAuthenticationState(page: Page, authenticated: boolean): Promise<void> {
  const isAuth = await isAuthenticated(page);
  expect(isAuth).toBe(authenticated);
}

/**
 * Assert user email in auth store
 */
export async function assertUserInAuthStore(page: Page, expectedEmail: string): Promise<void> {
  const user = await getCurrentUserFromStore(page);
  expect(user).not.toBeNull();
  expect(user?.email).toBe(expectedEmail);
}

/**
 * Assert error toast appears
 */
export async function assertErrorToast(page: Page, message: string | RegExp): Promise<void> {
  const toast = page.locator('[data-sonner-toast][data-type="error"]').filter({ hasText: message });
  await expect(toast.first()).toBeVisible({ timeout: 5000 });
}

/**
 * Assert success toast appears
 */
export async function assertSuccessToast(page: Page, message: string | RegExp): Promise<void> {
  const toast = page.locator('[data-sonner-toast][data-type="success"]').filter({ hasText: message });
  await expect(toast.first()).toBeVisible({ timeout: 5000 });
}

/**
 * Assert field has error
 */
export async function assertFieldHasError(
  page: Page,
  fieldLabel: string | RegExp,
  errorMessage?: string | RegExp
): Promise<void> {
  const field = page.getByLabel(fieldLabel);
  await expect(field).toBeVisible();

  // Find error near field
  const fieldContainer = field.locator('..').locator('..');
  const error = fieldContainer.locator('[class*="error"], [role="alert"]');

  await expect(error.first()).toBeVisible();
  if (errorMessage) {
    await expect(error.first()).toContainText(errorMessage);
  }
}

// =============================================================================
// Multi-tab/Context Helpers
// =============================================================================

/**
 * Open new tab with same storage state
 */
export async function openNewTab(context: BrowserContext): Promise<Page> {
  return await context.newPage();
}

/**
 * Create new context with storage state from file path
 */
export async function createContextWithStorage(
  context: BrowserContext,
  storageStatePath: string
): Promise<BrowserContext> {
  return await context.browser()!.newContext({
    storageState: storageStatePath,
  });
}

// =============================================================================
// Debug Helpers
// =============================================================================

/**
 * Take screenshot with timestamp
 */
export async function takeDebugScreenshot(page: Page, name: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ path: `debug-${name}-${timestamp}.png`, fullPage: true });
}

/**
 * Log current page state for debugging
 */
export async function logPageState(page: Page): Promise<void> {
  console.log('Current URL:', page.url());
  console.log('Auth state:', await isAuthenticated(page));
  console.log('Auth store:', await getLocalStorageItem(page, 'auth-store'));
}
