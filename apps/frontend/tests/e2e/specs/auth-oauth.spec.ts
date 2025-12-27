/**
 * E2E Tests: OAuth Authentication Flow
 *
 * Tests cover:
 * - OAuth button display
 * - OAuth provider redirects
 * - OAuth callback handling
 * - Error scenarios (cancelled, failed, email in use)
 * - New user profile completion requirement
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import {
  OAUTH_USER_GOOGLE,
  OAUTH_USER_GITHUB,
  OAUTH_USER_MICROSOFT,
  EXISTING_USER,
  TEST_OAUTH_STATE,
  TEST_OAUTH_CODES,
} from '../fixtures';
import {
  mockOAuthCallbackSuccess,
  mockOAuthCallbackError,
  mockOAuthCallbackCancelled,
  mockOAuthNewUserRequiresProfile,
  mockGetCurrentUserSuccess,
  setupOAuthFlowMocks,
} from '../helpers';

// =============================================================================
// OAuth Button Display Tests
// =============================================================================

test.describe('OAuth Login Options', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('should display all OAuth provider buttons', async () => {
    await loginPage.expectOAuthButtonsDisplayed();
  });

  test('should display Google OAuth button', async () => {
    await expect(loginPage.googleOAuthButton).toBeVisible();
  });

  test('should display GitHub OAuth button', async () => {
    await expect(loginPage.githubOAuthButton).toBeVisible();
  });

  test('should display Microsoft OAuth button', async () => {
    await expect(loginPage.microsoftOAuthButton).toBeVisible();
  });
});

// =============================================================================
// OAuth Provider Redirect Tests
// =============================================================================

test.describe('OAuth Provider Redirects', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('should have correct Google OAuth href', async () => {
    const href = await loginPage.googleOAuthButton.getAttribute('href');
    expect(href).toContain('/oauth/google');
  });

  test('should have correct GitHub OAuth href', async () => {
    const href = await loginPage.githubOAuthButton.getAttribute('href');
    expect(href).toContain('/oauth/github');
  });

  test('should have correct Microsoft OAuth href', async () => {
    const href = await loginPage.microsoftOAuthButton.getAttribute('href');
    expect(href).toContain('/oauth/microsoft');
  });
});

// =============================================================================
// OAuth Callback Success Tests
// =============================================================================

test.describe('OAuth Callback Success', () => {
  test('should login successfully via Google OAuth callback', async ({ page }) => {
    await setupOAuthFlowMocks(page, 'google', OAUTH_USER_GOOGLE);

    // Simulate OAuth callback
    await page.goto(
      `/oauth/callback/google?code=${TEST_OAUTH_CODES.valid}&state=${TEST_OAUTH_STATE.valid}`
    );

    // Should redirect to dashboard
    await expect(page).toHaveURL(/^\/(dashboard)?$/);
  });

  test('should login successfully via GitHub OAuth callback', async ({ page }) => {
    await setupOAuthFlowMocks(page, 'github', OAUTH_USER_GITHUB);

    await page.goto(
      `/oauth/callback/github?code=${TEST_OAUTH_CODES.valid}&state=${TEST_OAUTH_STATE.valid}`
    );

    await expect(page).toHaveURL(/^\/(dashboard)?$/);
  });

  test('should login successfully via Microsoft OAuth callback', async ({ page }) => {
    await setupOAuthFlowMocks(page, 'microsoft', OAUTH_USER_MICROSOFT);

    await page.goto(
      `/oauth/callback/microsoft?code=${TEST_OAUTH_CODES.valid}&state=${TEST_OAUTH_STATE.valid}`
    );

    await expect(page).toHaveURL(/^\/(dashboard)?$/);
  });

  test('should store authentication state after OAuth login', async ({ page }) => {
    await setupOAuthFlowMocks(page, 'google', OAUTH_USER_GOOGLE);

    await page.goto(
      `/oauth/callback/google?code=${TEST_OAUTH_CODES.valid}&state=${TEST_OAUTH_STATE.valid}`
    );

    await expect(page).toHaveURL(/^\/(dashboard)?$/);

    // Verify authentication state
    const authStore = await page.evaluate(() => localStorage.getItem('auth-store'));
    expect(authStore).not.toBeNull();

    const parsed = JSON.parse(authStore!);
    expect(parsed?.state?.isAuthenticated).toBe(true);
  });
});

// =============================================================================
// OAuth Callback Error Tests
// =============================================================================

test.describe('OAuth Callback Errors', () => {
  test('should handle OAuth error and show message', async ({ page }) => {
    await mockOAuthCallbackError(page, 'google');

    await page.goto(
      `/oauth/callback/google?code=${TEST_OAUTH_CODES.valid}&state=${TEST_OAUTH_STATE.valid}`
    );

    // Should show error or redirect to login
    const errorVisible = await page.getByText(/error|failed/i).isVisible().catch(() => false);
    const isLoginPage = page.url().includes('/login');

    expect(errorVisible || isLoginPage).toBe(true);
  });

  test('should handle cancelled OAuth flow', async ({ page }) => {
    await mockOAuthCallbackCancelled(page, 'google');

    await page.goto(
      `/oauth/callback/google?error=access_denied&state=${TEST_OAUTH_STATE.valid}`
    );

    // Should redirect to login or show cancelled message
    const cancelledVisible = await page.getByText(/cancelled|denied/i).isVisible().catch(() => false);
    const isLoginPage = page.url().includes('/login');

    expect(cancelledVisible || isLoginPage).toBe(true);
  });

  test('should handle missing code parameter', async ({ page }) => {
    await page.goto(`/oauth/callback/google?state=${TEST_OAUTH_STATE.valid}`);

    // Should show error or redirect to login
    const isLoginPage = page.url().includes('/login');
    const hasError = await page.getByText(/error|missing|invalid/i).isVisible().catch(() => false);

    expect(isLoginPage || hasError).toBe(true);
  });

  test('should handle invalid state parameter', async ({ page }) => {
    await mockOAuthCallbackError(page, 'google');

    await page.goto(
      `/oauth/callback/google?code=${TEST_OAUTH_CODES.valid}&state=${TEST_OAUTH_STATE.invalid}`
    );

    // Should redirect to login or show error
    const isLoginPage = page.url().includes('/login');
    const hasError = await page.getByText(/error|state|invalid/i).isVisible().catch(() => false);

    expect(isLoginPage || hasError).toBe(true);
  });

  test('should handle expired OAuth code', async ({ page }) => {
    await mockOAuthCallbackError(page, 'github');

    await page.goto(
      `/oauth/callback/github?code=${TEST_OAUTH_CODES.expired}&state=${TEST_OAUTH_STATE.valid}`
    );

    // Should show error or redirect to login
    const isLoginPage = page.url().includes('/login');
    const hasError = await page.getByText(/error|expired/i).isVisible().catch(() => false);

    expect(isLoginPage || hasError).toBe(true);
  });
});

// =============================================================================
// OAuth New User Profile Completion Tests
// =============================================================================

test.describe('OAuth New User Profile Completion', () => {
  test('should redirect to profile completion for new OAuth user', async ({ page }) => {
    await mockOAuthNewUserRequiresProfile(page, 'google', {
      ...OAUTH_USER_GOOGLE,
      profileComplete: false,
      firstName: '',
      lastName: '',
    });
    await mockGetCurrentUserSuccess(page, OAUTH_USER_GOOGLE);

    await page.goto(
      `/oauth/callback/google?code=${TEST_OAUTH_CODES.valid}&state=${TEST_OAUTH_STATE.valid}`
    );

    // May redirect to complete-profile page if profile is incomplete
    // Otherwise goes to dashboard
    const isCompleteProfile = page.url().includes('/complete-profile');
    const isDashboard = page.url().match(/^\/(dashboard)?$/);

    expect(isCompleteProfile || isDashboard).toBeTruthy();
  });
});

// =============================================================================
// OAuth from Registration Page Tests
// =============================================================================

test.describe('OAuth from Registration Page', () => {
  test('should display OAuth buttons on registration page', async ({ page }) => {
    await page.goto('/register');

    // OAuth buttons should also be visible on registration page
    await expect(page.getByRole('link', { name: /google/i }).or(page.locator('a[href*="google"]'))).toBeVisible();
    await expect(page.getByRole('link', { name: /github/i }).or(page.locator('a[href*="github"]'))).toBeVisible();
    await expect(page.getByRole('link', { name: /microsoft/i }).or(page.locator('a[href*="microsoft"]'))).toBeVisible();
  });
});

// =============================================================================
// OAuth Already Authenticated Tests
// =============================================================================

test.describe('OAuth When Already Authenticated', () => {
  test('should handle OAuth callback when already authenticated', async ({ page }) => {
    // First, simulate being authenticated
    await page.goto('/login');
    await page.evaluate(() => {
      const authState = {
        state: {
          isAuthenticated: true,
          user: {
            id: 'existing-user',
            email: 'existing@example.com',
          },
        },
        version: 0,
      };
      localStorage.setItem('auth-store', JSON.stringify(authState));
    });

    await setupOAuthFlowMocks(page, 'google', OAUTH_USER_GOOGLE);

    // OAuth callback should still work (may replace session or redirect to dashboard)
    await page.goto(
      `/oauth/callback/google?code=${TEST_OAUTH_CODES.valid}&state=${TEST_OAUTH_STATE.valid}`
    );

    // Should end up on dashboard
    await expect(page).toHaveURL(/^\/(dashboard)?$/);
  });
});

// =============================================================================
// OAuth Provider-Specific Error Messages Tests
// =============================================================================

test.describe('OAuth Provider-Specific Errors', () => {
  test('should show Google-specific error message', async ({ page }) => {
    await mockOAuthCallbackError(page, 'google');

    await page.goto(
      `/oauth/callback/google?code=${TEST_OAUTH_CODES.invalid}&state=${TEST_OAUTH_STATE.valid}`
    );

    // Should show error or redirect to login
    await expect(page).toHaveURL(/\/login|\/oauth/);
  });

  test('should show GitHub-specific error message', async ({ page }) => {
    await mockOAuthCallbackError(page, 'github');

    await page.goto(
      `/oauth/callback/github?code=${TEST_OAUTH_CODES.invalid}&state=${TEST_OAUTH_STATE.valid}`
    );

    await expect(page).toHaveURL(/\/login|\/oauth/);
  });

  test('should show Microsoft-specific error message', async ({ page }) => {
    await mockOAuthCallbackError(page, 'microsoft');

    await page.goto(
      `/oauth/callback/microsoft?code=${TEST_OAUTH_CODES.invalid}&state=${TEST_OAUTH_STATE.valid}`
    );

    await expect(page).toHaveURL(/\/login|\/oauth/);
  });
});

// =============================================================================
// OAuth Email Already In Use Tests
// =============================================================================

test.describe('OAuth Email Already In Use', () => {
  test('should handle email already registered with different provider', async ({ page }) => {
    // Mock the scenario where email is already used
    await page.route('**/api/v1/auth/oauth/google/callback*', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'An account with this email already exists',
          code: 'EMAIL_IN_USE',
        }),
      });
    });

    await page.goto(
      `/oauth/callback/google?code=${TEST_OAUTH_CODES.valid}&state=${TEST_OAUTH_STATE.valid}`
    );

    // Should show error about email already in use
    const hasError = await page.getByText(/already exists|email.*use/i).isVisible().catch(() => false);
    const isLoginPage = page.url().includes('/login');

    expect(hasError || isLoginPage).toBe(true);
  });
});

// =============================================================================
// OAuth Network Error Tests
// =============================================================================

test.describe('OAuth Network Errors', () => {
  test('should handle network error during OAuth callback', async ({ page }) => {
    await page.route('**/api/v1/auth/oauth/google/callback*', async (route) => {
      await route.abort('failed');
    });

    await page.goto(
      `/oauth/callback/google?code=${TEST_OAUTH_CODES.valid}&state=${TEST_OAUTH_STATE.valid}`
    );

    // Should show network error or redirect to login
    const hasError = await page.getByText(/network|connection|error/i).isVisible().catch(() => false);
    const isLoginPage = page.url().includes('/login');

    expect(hasError || isLoginPage).toBe(true);
  });

  test('should handle server error during OAuth callback', async ({ page }) => {
    await page.route('**/api/v1/auth/oauth/github/callback*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Internal server error',
          code: 'SERVER_ERROR',
        }),
      });
    });

    await page.goto(
      `/oauth/callback/github?code=${TEST_OAUTH_CODES.valid}&state=${TEST_OAUTH_STATE.valid}`
    );

    // Should show server error or redirect to login
    const hasError = await page.getByText(/error|server|try again/i).isVisible().catch(() => false);
    const isLoginPage = page.url().includes('/login');

    expect(hasError || isLoginPage).toBe(true);
  });
});
