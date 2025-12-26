/**
 * Mock utilities for E2E tests
 *
 * Helper functions to set up API route mocking and deterministic responses.
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
  type LoginResponse as _LoginResponse,
  type RegisterResponse as _RegisterResponse,
} from '../fixtures/api-stubs';

/**
 * Base API URL for mocking
 */
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8000';

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
 * Mock registration with email already taken error
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
 * Mock registration with validation error
 */
export async function mockRegisterValidationError(page: Page, field: string): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/register`, async (route: Route) => {
    await route.fulfill({
      status: 422,
      contentType: 'application/json',
      body: JSON.stringify(REGISTER_STUBS.validationError(field)),
    });
  });
}

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
 * Mock login requiring 2FA
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
 * Mock successful 2FA setup
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
 * Mock successful 2FA verification
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
 * Mock successful email verification resend
 */
export async function mockEmailVerificationResendSuccess(page: Page): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/resend-verification`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(EMAIL_VERIFICATION_STUBS.resendSuccess()),
    });
  });
}

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
 * Mock successful profile update
 */
export async function mockProfileUpdateSuccess(page: Page, user: TestUserWithProfile): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/profile`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(PROFILE_STUBS.updateSuccess(user)),
    });
  });
}

/**
 * Mock get current user success
 */
export async function mockGetCurrentUserSuccess(page: Page, user: TestUserWithProfile): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/me`, async (route: Route) => {
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
  await page.route(`${API_BASE_URL}/api/v1/auth/me`, async (route: Route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify(PROFILE_STUBS.getCurrentUserUnauthorized()),
    });
  });
}

/**
 * Mock successful OAuth callback
 */
export async function mockOAuthCallbackSuccess(page: Page, provider: string, user: TestUserWithProfile): Promise<void> {
  await page.route(`${API_BASE_URL}/api/v1/auth/oauth/${provider}/callback*`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(OAUTH_STUBS.callbackSuccess(user)),
    });
  });
}

/**
 * Mock OAuth callback with error
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

/**
 * Clear all mocked routes
 */
export async function clearAllMocks(page: Page): Promise<void> {
  await page.unroute(`${API_BASE_URL}/**`);
}

/**
 * Setup standard auth flow mocks
 *
 * Mocks all endpoints needed for a complete registration → verification → login flow
 */
export async function setupAuthFlowMocks(page: Page, user: TestUserWithProfile): Promise<void> {
  await mockRegisterSuccess(page, user);
  await mockEmailVerificationSuccess(page);
  await mockLoginSuccess(page, user);
  await mockGetCurrentUserSuccess(page, user);
  await mockProfileUpdateSuccess(page, user);
}

/**
 * Setup 2FA flow mocks
 *
 * Mocks all endpoints needed for 2FA setup and verification
 */
export async function setup2FAFlowMocks(page: Page, user: TestUserWithProfile): Promise<void> {
  await mock2FASetupSuccess(page);
  await mock2FAVerifySuccess(page);
  await mock2FALoginSuccess(page, user);
  await mockGetCurrentUserSuccess(page, user);
}

/**
 * Setup OAuth flow mocks
 *
 * Mocks all endpoints needed for OAuth authentication
 */
export async function setupOAuthFlowMocks(page: Page, provider: string, user: TestUserWithProfile): Promise<void> {
  await mockOAuthCallbackSuccess(page, provider, user);
  await mockGetCurrentUserSuccess(page, user);
  await mockProfileUpdateSuccess(page, user);
}
