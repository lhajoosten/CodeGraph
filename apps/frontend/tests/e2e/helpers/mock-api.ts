/**
 * API Mocking Utilities for E2E Tests
 *
 * Helper functions to set up deterministic API responses using Playwright's route interception.
 */

import type { Page, Route } from '@playwright/test';
import type { TestUserWithProfile } from '../fixtures/users';
import {
  LOGIN_STUBS,
  REGISTER_STUBS,
  TWO_FACTOR_STUBS,
  EMAIL_VERIFICATION_STUBS,
  PASSWORD_RESET_STUBS,
  PROFILE_STUBS,
  OAUTH_STUBS,
  ERROR_STUBS,
} from '../fixtures/api-stubs';

/**
 * Base API URL for mocking
 */
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8000';

// =============================================================================
// Login Mocks
// =============================================================================

/**
 * Mock successful login
 */
export async function mockLoginSuccess(page: Page, user: TestUserWithProfile): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/login`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(LOGIN_STUBS.success(user)),
    });
  });
}

/**
 * Mock login requiring 2FA verification
 */
export async function mockLoginRequires2FA(page: Page, user: TestUserWithProfile): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/login`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(LOGIN_STUBS.successWith2FA(user)),
    });
  });
}

/**
 * Mock login requiring 2FA setup
 */
export async function mockLoginRequires2FASetup(page: Page, user: TestUserWithProfile): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/login`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(LOGIN_STUBS.successRequires2FASetup(user)),
    });
  });
}

/**
 * Mock login with invalid credentials
 */
export async function mockLoginInvalidCredentials(page: Page): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/login`, async (route: Route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify(LOGIN_STUBS.invalidCredentials()),
    });
  });
}

/**
 * Mock login with unverified email
 */
export async function mockLoginEmailNotVerified(page: Page): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/login`, async (route: Route) => {
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify(LOGIN_STUBS.emailNotVerified()),
    });
  });
}

/**
 * Mock login with locked account
 */
export async function mockLoginAccountLocked(page: Page): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/login`, async (route: Route) => {
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify(LOGIN_STUBS.accountLocked()),
    });
  });
}

// =============================================================================
// Registration Mocks
// =============================================================================

/**
 * Mock successful registration
 */
export async function mockRegisterSuccess(page: Page, user: TestUserWithProfile): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/register`, async (route: Route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(REGISTER_STUBS.success(user)),
    });
  });
}

/**
 * Mock registration with email already taken
 */
export async function mockRegisterEmailTaken(page: Page): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/register`, async (route: Route) => {
    await route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify(REGISTER_STUBS.emailTaken()),
    });
  });
}

/**
 * Mock registration with weak password
 */
export async function mockRegisterWeakPassword(page: Page): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/register`, async (route: Route) => {
    await route.fulfill({
      status: 422,
      contentType: 'application/json',
      body: JSON.stringify(REGISTER_STUBS.weakPassword()),
    });
  });
}

// =============================================================================
// Two-Factor Authentication Mocks
// =============================================================================

/**
 * Mock successful 2FA setup initialization
 */
export async function mock2FASetupSuccess(page: Page): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/2fa/setup`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(TWO_FACTOR_STUBS.setupSuccess()),
    });
  });
}

/**
 * Mock successful 2FA verification (setup completion)
 */
export async function mock2FAVerifySuccess(page: Page): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/2fa/verify`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(TWO_FACTOR_STUBS.verifySuccess()),
    });
  });
}

/**
 * Mock 2FA verification with invalid code
 */
export async function mock2FAVerifyInvalidCode(page: Page): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/2fa/verify`, async (route: Route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify(TWO_FACTOR_STUBS.verifyInvalidCode()),
    });
  });
}

/**
 * Mock successful 2FA login
 */
export async function mock2FALoginSuccess(page: Page, user: TestUserWithProfile): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/2fa/login`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(TWO_FACTOR_STUBS.loginSuccess(user)),
    });
  });
}

/**
 * Mock 2FA login with invalid code
 */
export async function mock2FALoginInvalidCode(page: Page): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/2fa/login`, async (route: Route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify(TWO_FACTOR_STUBS.loginInvalidCode()),
    });
  });
}

// =============================================================================
// Email Verification Mocks
// =============================================================================

/**
 * Mock successful email verification
 */
export async function mockEmailVerificationSuccess(page: Page): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/verify-email*`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(EMAIL_VERIFICATION_STUBS.success()),
    });
  });
}

/**
 * Mock email verification with invalid token
 */
export async function mockEmailVerificationInvalidToken(page: Page): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/verify-email*`, async (route: Route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify(EMAIL_VERIFICATION_STUBS.invalidToken()),
    });
  });
}

/**
 * Mock email verification with expired token
 */
export async function mockEmailVerificationExpiredToken(page: Page): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/verify-email*`, async (route: Route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify(EMAIL_VERIFICATION_STUBS.expiredToken()),
    });
  });
}

/**
 * Mock successful resend verification email
 */
export async function mockResendVerificationSuccess(page: Page): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/resend-verification`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(EMAIL_VERIFICATION_STUBS.resendSuccess()),
    });
  });
}

/**
 * Mock resend verification rate limited
 */
export async function mockResendVerificationRateLimited(page: Page): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/resend-verification`, async (route: Route) => {
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify(EMAIL_VERIFICATION_STUBS.resendRateLimited()),
    });
  });
}

// =============================================================================
// Password Reset Mocks
// =============================================================================

/**
 * Mock successful password reset request
 */
export async function mockPasswordResetRequestSuccess(page: Page): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/forgot-password`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(PASSWORD_RESET_STUBS.requestSuccess()),
    });
  });
}

/**
 * Mock password reset request rate limited
 */
export async function mockPasswordResetRequestRateLimited(page: Page): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/forgot-password`, async (route: Route) => {
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify(PASSWORD_RESET_STUBS.requestRateLimited()),
    });
  });
}

/**
 * Mock successful password reset
 */
export async function mockPasswordResetSuccess(page: Page): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/reset-password`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(PASSWORD_RESET_STUBS.resetSuccess()),
    });
  });
}

/**
 * Mock password reset with invalid token
 */
export async function mockPasswordResetInvalidToken(page: Page): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/reset-password`, async (route: Route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify(PASSWORD_RESET_STUBS.resetInvalidToken()),
    });
  });
}

/**
 * Mock password reset with expired token
 */
export async function mockPasswordResetExpiredToken(page: Page): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/reset-password`, async (route: Route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify(PASSWORD_RESET_STUBS.resetExpiredToken()),
    });
  });
}

// =============================================================================
// Profile/User Mocks
// =============================================================================

/**
 * Mock get current user success
 */
export async function mockGetCurrentUserSuccess(page: Page, user: TestUserWithProfile): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/users/me`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(PROFILE_STUBS.getCurrentUserSuccess(user)),
    });
  });
}

/**
 * Mock get current user unauthorized
 */
export async function mockGetCurrentUserUnauthorized(page: Page): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/users/me`, async (route: Route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify(PROFILE_STUBS.getCurrentUserUnauthorized()),
    });
  });
}

/**
 * Mock profile update success
 */
export async function mockProfileUpdateSuccess(page: Page, user: TestUserWithProfile): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/users/me`, async (route: Route) => {
    if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(PROFILE_STUBS.updateSuccess(user)),
      });
    } else {
      await route.continue();
    }
  });
}

// =============================================================================
// OAuth Mocks
// =============================================================================

/**
 * Mock successful OAuth callback
 */
export async function mockOAuthCallbackSuccess(
  page: Page,
  provider: string,
  user: TestUserWithProfile
): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/oauth/${provider}/callback*`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(OAUTH_STUBS.callbackSuccess(user)),
    });
  });
}

/**
 * Mock OAuth callback error
 */
export async function mockOAuthCallbackError(page: Page, provider: string): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/oauth/${provider}/callback*`, async (route: Route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify(OAUTH_STUBS.callbackError()),
    });
  });
}

/**
 * Mock OAuth callback cancelled
 */
export async function mockOAuthCallbackCancelled(page: Page, provider: string): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/oauth/${provider}/callback*`, async (route: Route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify(OAUTH_STUBS.callbackCancelled()),
    });
  });
}

/**
 * Mock OAuth callback for new user requiring profile
 */
export async function mockOAuthNewUserRequiresProfile(
  page: Page,
  provider: string,
  user: TestUserWithProfile
): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/oauth/${provider}/callback*`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(OAUTH_STUBS.newUserRequiresProfile(user)),
    });
  });
}

// =============================================================================
// Error Mocks
// =============================================================================

/**
 * Mock server error for any endpoint
 */
export async function mockServerError(page: Page, endpoint: string): Promise<void> {
  await page.route(`${API_BASE_URL}${endpoint}`, async (route: Route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify(ERROR_STUBS.serverError()),
    });
  });
}

/**
 * Mock network error for any endpoint
 */
export async function mockNetworkError(page: Page, endpoint: string): Promise<void> {
  await page.route(`${API_BASE_URL}${endpoint}`, async (route: Route) => {
    await route.abort('failed');
  });
}

/**
 * Mock rate limiting for any endpoint
 */
export async function mockRateLimited(page: Page, endpoint: string): Promise<void> {
  await page.route(`${API_BASE_URL}${endpoint}`, async (route: Route) => {
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify(ERROR_STUBS.rateLimited()),
    });
  });
}

// =============================================================================
// Composite Mocks (Multi-endpoint setups)
// =============================================================================

/**
 * Setup all mocks needed for a complete login flow
 */
export async function setupLoginFlowMocks(page: Page, user: TestUserWithProfile): Promise<void> {
  await mockLoginSuccess(page, user);
  await mockGetCurrentUserSuccess(page, user);
}

/**
 * Setup all mocks needed for a complete registration flow
 */
export async function setupRegistrationFlowMocks(page: Page, user: TestUserWithProfile): Promise<void> {
  await mockRegisterSuccess(page, user);
  await mockResendVerificationSuccess(page);
}

/**
 * Setup all mocks needed for 2FA login flow
 */
export async function setup2FALoginFlowMocks(page: Page, user: TestUserWithProfile): Promise<void> {
  await mockLoginRequires2FA(page, user);
  await mock2FALoginSuccess(page, user);
  await mockGetCurrentUserSuccess(page, user);
}

/**
 * Setup all mocks needed for 2FA setup flow
 */
export async function setup2FASetupFlowMocks(page: Page, user: TestUserWithProfile): Promise<void> {
  await mock2FASetupSuccess(page);
  await mock2FAVerifySuccess(page);
  await mockGetCurrentUserSuccess(page, { ...user, twoFactorEnabled: true });
}

/**
 * Setup all mocks needed for password reset flow
 */
export async function setupPasswordResetFlowMocks(page: Page): Promise<void> {
  await mockPasswordResetRequestSuccess(page);
  await mockPasswordResetSuccess(page);
}

/**
 * Setup all mocks needed for OAuth flow
 */
export async function setupOAuthFlowMocks(
  page: Page,
  provider: string,
  user: TestUserWithProfile
): Promise<void> {
  await mockOAuthCallbackSuccess(page, provider, user);
  await mockGetCurrentUserSuccess(page, user);
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Clear all mocked routes
 */
export async function clearAllMocks(page: Page): Promise<void> {
  await page.unroute(`${API_BASE_URL}/**`);
}

/**
 * Wait for API request to complete
 */
export async function waitForApiRequest(page: Page, urlPattern: string | RegExp): Promise<void> {
  await page.waitForResponse((response) => {
    const url = response.url();
    if (typeof urlPattern === 'string') {
      return url.includes(urlPattern);
    }
    return urlPattern.test(url);
  });
}
