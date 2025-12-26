/**
 * E2E tests for OAuth authentication flow
 *
 * Tests cover:
 * - Google OAuth login
 * - GitHub OAuth login
 * - Microsoft OAuth login
 * - OAuth error handling
 * - New user OAuth registration
 * - Existing user OAuth login
 * - OAuth state validation
 */

import { test, expect } from '@playwright/test';
import {
  OAUTH_USER_GOOGLE,
  OAUTH_USER_GITHUB,
  OAUTH_USER_MICROSOFT,
} from '../fixtures';
import {
  GOOGLE_OAUTH,
  GITHUB_OAUTH,
  MICROSOFT_OAUTH,
} from '../fixtures';
import {
  mockOAuthCallbackError,
  mockGetCurrentUserSuccess,
  mockProfileUpdateSuccess,
  setupOAuthFlowMocks,
} from '../helpers';
import {
  navigateToLogin,
  initiateOAuthLogin,
  completeOAuthCallback,
  completeProfile,
} from '../helpers';
import {
  assertRedirectToDashboard,
  assertRedirectToCompleteProfile,
  assertErrorToast,
  assertOAuthButtonVisible,
  assertAllOAuthButtonsVisible,
  assertAuthenticationState,
} from '../helpers';

test.describe('OAuth Login Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToLogin(page);
  });

  test('should display all OAuth provider buttons', async ({ page }) => {
    await assertAllOAuthButtonsVisible(page);
  });

  test('should display Google OAuth button with correct styling', async ({ page }) => {
    await assertOAuthButtonVisible(page, 'google');

    const googleButton = page.getByRole('button', { name: /google/i });
    await expect(googleButton).toContainText(/google/i);

    // Should have Google logo/icon
    const googleIcon = googleButton.locator('svg').or(googleButton.locator('img'));
    await expect(googleIcon).toBeVisible();
  });

  test('should display GitHub OAuth button with correct styling', async ({ page }) => {
    await assertOAuthButtonVisible(page, 'github');

    const githubButton = page.getByRole('button', { name: /github/i });
    await expect(githubButton).toContainText(/github/i);

    // Should have GitHub logo/icon
    const githubIcon = githubButton.locator('svg').or(githubButton.locator('img'));
    await expect(githubIcon).toBeVisible();
  });

  test('should display Microsoft OAuth button with correct styling', async ({ page }) => {
    await assertOAuthButtonVisible(page, 'microsoft');

    const microsoftButton = page.getByRole('button', { name: /microsoft/i });
    await expect(microsoftButton).toContainText(/microsoft/i);

    // Should have Microsoft logo/icon
    const microsoftIcon = microsoftButton.locator('svg').or(microsoftButton.locator('img'));
    await expect(microsoftIcon).toBeVisible();
  });

  test('should have divider between OAuth and traditional login', async ({ page }) => {
    await expect(page.getByText(/or.*continue.*with|or/i)).toBeVisible();
  });
});

test.describe('Google OAuth Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupOAuthFlowMocks(page, 'google', OAUTH_USER_GOOGLE);
    await navigateToLogin(page);
  });

  test('should successfully login existing user with Google', async ({ page }) => {
    // Click Google button
    await initiateOAuthLogin(page, 'google');

    // Simulate OAuth redirect back from Google
    await completeOAuthCallback(
      page,
      'google',
      GOOGLE_OAUTH.callbackParams.success.code,
      GOOGLE_OAUTH.callbackParams.success.state
    );

    // Should redirect to dashboard
    await assertRedirectToDashboard(page);
    await assertAuthenticationState(page, true);
  });

  test('should register new user with Google', async ({ page }) => {
    // Mock as new user (profile incomplete)
    await page.route('**/api/v1/auth/oauth/google/callback*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'oauth-token',
          token_type: 'bearer',
          user: {
            id: 999,
            email: OAUTH_USER_GOOGLE.email,
            first_name: '',
            last_name: '',
            display_name: '',
            email_verified: true,
            two_factor_enabled: false,
            profile_complete: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),
      });
    });

    await initiateOAuthLogin(page, 'google');
    await completeOAuthCallback(
      page,
      'google',
      GOOGLE_OAUTH.callbackParams.success.code,
      GOOGLE_OAUTH.callbackParams.success.state
    );

    // Should redirect to profile completion
    await assertRedirectToCompleteProfile(page);
  });

  test('should complete profile after Google OAuth registration', async ({ page }) => {
    // Mock as new user
    await page.route('**/api/v1/auth/oauth/google/callback*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'oauth-token',
          token_type: 'bearer',
          user: {
            id: 999,
            email: OAUTH_USER_GOOGLE.email,
            first_name: '',
            last_name: '',
            display_name: '',
            email_verified: true,
            two_factor_enabled: false,
            profile_complete: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),
      });
    });

    await mockProfileUpdateSuccess(page, OAUTH_USER_GOOGLE);
    await mockGetCurrentUserSuccess(page, OAUTH_USER_GOOGLE);

    await initiateOAuthLogin(page, 'google');
    await completeOAuthCallback(
      page,
      'google',
      GOOGLE_OAUTH.callbackParams.success.code,
      GOOGLE_OAUTH.callbackParams.success.state
    );

    await assertRedirectToCompleteProfile(page);

    // Complete profile
    await completeProfile(page, OAUTH_USER_GOOGLE.firstName, OAUTH_USER_GOOGLE.lastName);

    // Should redirect to dashboard
    await assertRedirectToDashboard(page);
  });

  test('should handle Google OAuth error', async ({ page }) => {
    await mockOAuthCallbackError(page, 'google');

    await initiateOAuthLogin(page, 'google');

    // Simulate error callback
    await page.goto(
      `/oauth/callback/google?error=${GOOGLE_OAUTH.callbackParams.error.error}&error_description=${GOOGLE_OAUTH.callbackParams.error.error_description}&state=${GOOGLE_OAUTH.callbackParams.error.state}`
    );

    // Should show error
    await assertErrorToast(page, /authentication.*failed|oauth.*error/i);
  });

  test('should handle user cancellation', async ({ page }) => {
    await initiateOAuthLogin(page, 'google');

    // Simulate user cancelled
    await page.goto(`/oauth/callback/google?error=access_denied&state=${GOOGLE_OAUTH.callbackParams.success.state}`);

    // Should show cancellation message or redirect to login
    await expect(page).toHaveURL(/\/login|\/oauth/);
  });
});

test.describe('GitHub OAuth Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupOAuthFlowMocks(page, 'github', OAUTH_USER_GITHUB);
    await navigateToLogin(page);
  });

  test('should successfully login existing user with GitHub', async ({ page }) => {
    await initiateOAuthLogin(page, 'github');

    await completeOAuthCallback(
      page,
      'github',
      GITHUB_OAUTH.callbackParams.success.code,
      GITHUB_OAUTH.callbackParams.success.state
    );

    await assertRedirectToDashboard(page);
    await assertAuthenticationState(page, true);
  });

  test('should register new user with GitHub', async ({ page }) => {
    await page.route('**/api/v1/auth/oauth/github/callback*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'oauth-token',
          token_type: 'bearer',
          user: {
            id: 999,
            email: OAUTH_USER_GITHUB.email,
            first_name: '',
            last_name: '',
            display_name: '',
            email_verified: true,
            two_factor_enabled: false,
            profile_complete: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),
      });
    });

    await initiateOAuthLogin(page, 'github');
    await completeOAuthCallback(
      page,
      'github',
      GITHUB_OAUTH.callbackParams.success.code,
      GITHUB_OAUTH.callbackParams.success.state
    );

    await assertRedirectToCompleteProfile(page);
  });

  test('should handle GitHub OAuth error', async ({ page }) => {
    await mockOAuthCallbackError(page, 'github');

    await initiateOAuthLogin(page, 'github');

    await page.goto(
      `/oauth/callback/github?error=${GITHUB_OAUTH.callbackParams.error.error}&error_description=${GITHUB_OAUTH.callbackParams.error.error_description}&state=${GITHUB_OAUTH.callbackParams.error.state}`
    );

    await assertErrorToast(page, /authentication.*failed|oauth.*error/i);
  });
});

test.describe('Microsoft OAuth Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupOAuthFlowMocks(page, 'microsoft', OAUTH_USER_MICROSOFT);
    await navigateToLogin(page);
  });

  test('should successfully login existing user with Microsoft', async ({ page }) => {
    await initiateOAuthLogin(page, 'microsoft');

    await completeOAuthCallback(
      page,
      'microsoft',
      MICROSOFT_OAUTH.callbackParams.success.code,
      MICROSOFT_OAUTH.callbackParams.success.state
    );

    await assertRedirectToDashboard(page);
    await assertAuthenticationState(page, true);
  });

  test('should register new user with Microsoft', async ({ page }) => {
    await page.route('**/api/v1/auth/oauth/microsoft/callback*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'oauth-token',
          token_type: 'bearer',
          user: {
            id: 999,
            email: OAUTH_USER_MICROSOFT.email,
            first_name: '',
            last_name: '',
            display_name: '',
            email_verified: true,
            two_factor_enabled: false,
            profile_complete: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),
      });
    });

    await initiateOAuthLogin(page, 'microsoft');
    await completeOAuthCallback(
      page,
      'microsoft',
      MICROSOFT_OAUTH.callbackParams.success.code,
      MICROSOFT_OAUTH.callbackParams.success.state
    );

    await assertRedirectToCompleteProfile(page);
  });

  test('should handle Microsoft OAuth error', async ({ page }) => {
    await mockOAuthCallbackError(page, 'microsoft');

    await initiateOAuthLogin(page, 'microsoft');

    await page.goto(
      `/oauth/callback/microsoft?error=${MICROSOFT_OAUTH.callbackParams.error.error}&error_description=${MICROSOFT_OAUTH.callbackParams.error.error_description}&state=${MICROSOFT_OAUTH.callbackParams.error.state}`
    );

    await assertErrorToast(page, /authentication.*failed|oauth.*error/i);
  });
});

test.describe('OAuth Security', () => {
  test('should validate state parameter', async ({ page }) => {
    await page.route('**/api/v1/auth/oauth/google/callback*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Invalid state parameter',
          error_code: 'STATE_MISMATCH',
        }),
      });
    });

    // Complete callback with mismatched state
    await page.goto('/oauth/callback/google?code=test-code&state=invalid-state');

    await assertErrorToast(page, /invalid.*state|security.*error/i);
  });

  test('should handle missing code parameter', async ({ page }) => {
    await page.goto('/oauth/callback/google?state=test-state');

    // Should show error or redirect
    await expect(page.getByText(/invalid.*request|missing.*code/i)).toBeVisible();
  });

  test('should not allow OAuth login when already authenticated', async ({ page }) => {
    await setupOAuthFlowMocks(page, 'google', OAUTH_USER_GOOGLE);

    // First login
    await navigateToLogin(page);
    await initiateOAuthLogin(page, 'google');
    await completeOAuthCallback(
      page,
      'google',
      GOOGLE_OAUTH.callbackParams.success.code,
      GOOGLE_OAUTH.callbackParams.success.state
    );

    await assertRedirectToDashboard(page);

    // Try to access OAuth login again (should redirect or show message)
    await page.goto('/login');
    await expect(page).toHaveURL(/^\/(dashboard)?$/);
  });
});

test.describe('OAuth Error Handling', () => {
  test('should handle network error during OAuth callback', async ({ page }) => {
    await page.route('**/api/v1/auth/oauth/google/callback*', async (route) => {
      await route.abort('failed');
    });

    await page.goto(`/oauth/callback/google?code=test&state=test`);

    await assertErrorToast(page, /network.*error|connection.*failed/i);
  });

  test('should handle server error during OAuth callback', async ({ page }) => {
    await page.route('**/api/v1/auth/oauth/google/callback*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      });
    });

    await page.goto(`/oauth/callback/google?code=test&state=test`);

    await assertErrorToast(page, /server.*error|something went wrong/i);
  });

  test('should handle provider-specific errors', async ({ page }) => {
    await page.route('**/api/v1/auth/oauth/google/callback*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Google returned an error',
          error_code: 'PROVIDER_ERROR',
        }),
      });
    });

    await page.goto(`/oauth/callback/google?code=test&state=test`);

    await assertErrorToast(page, /provider.*error|google.*error/i);
  });
});

test.describe('OAuth Registration Flow', () => {
  test('should show OAuth buttons on registration page', async ({ page }) => {
    await page.goto('/register');
    await assertAllOAuthButtonsVisible(page);
  });

  test('should register via OAuth from registration page', async ({ page }) => {
    await setupOAuthFlowMocks(page, 'google', OAUTH_USER_GOOGLE);

    await page.goto('/register');
    await initiateOAuthLogin(page, 'google');
    await completeOAuthCallback(
      page,
      'google',
      GOOGLE_OAUTH.callbackParams.success.code,
      GOOGLE_OAUTH.callbackParams.success.state
    );

    await assertRedirectToDashboard(page);
  });
});
