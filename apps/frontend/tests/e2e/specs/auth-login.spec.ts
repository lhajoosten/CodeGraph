/**
 * E2E tests for user login flow
 *
 * Tests cover:
 * - Successful login
 * - Invalid credentials
 * - Unverified email
 * - Remember me functionality
 * - Redirect to protected pages
 * - Login with 2FA redirect
 */

import { test, expect } from '@playwright/test';
import {
  EXISTING_USER,
  INVALID_CREDENTIALS,
  USER_UNVERIFIED_EMAIL,
  USER_WITH_2FA,
  INVALID_EMAILS,
} from '../fixtures';
import {
  mockLoginSuccess,
  mockLoginInvalidCredentials,
  mockLoginEmailNotVerified,
  mockLoginRequires2FA,
  mockGetCurrentUserSuccess,
  setupAuthFlowMocks,
} from '../helpers';
import {
  navigateToLogin,
  fillLoginForm,
  submitLoginForm,
  loginWithCredentials,
  waitForAuthentication,
} from '../helpers';
import {
  assertRedirectToDashboard,
  assertRedirectTo2FAVerification,
  assertErrorToast,
  assertFieldHasError,
  assertAuthenticationState,
  assertUserInAuthStore,
} from '../helpers';
import {
  clickLink,
  getLocalStorageItem,
} from '../helpers';

test.describe('User Login', async () => {
  test.beforeEach(async ({ page }) => {
    await navigateToLogin(page);
  });

  test('should display login form with all fields', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /remember me/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await mockLoginSuccess(page, EXISTING_USER);
    await mockGetCurrentUserSuccess(page, EXISTING_USER);

    await fillLoginForm(page, EXISTING_USER.email, EXISTING_USER.password);
    await submitLoginForm(page);

    // Should redirect to dashboard
    await assertRedirectToDashboard(page);

    // Should store auth token
    await assertAuthenticationState(page, true);

    // Should store user in auth store
    await assertUserInAuthStore(page, EXISTING_USER.email);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await mockLoginInvalidCredentials(page);

    await fillLoginForm(page, INVALID_CREDENTIALS.email, INVALID_CREDENTIALS.password);
    await submitLoginForm(page);

    // Should show error toast
    await assertErrorToast(page, /invalid email or password|incorrect credentials/i);

    // Should remain on login page
    await expect(page).toHaveURL('/login');

    // Should not store auth token
    await assertAuthenticationState(page, false);
  });

  test('should show error for unverified email', async ({ page }) => {
    await mockLoginEmailNotVerified(page);

    await fillLoginForm(page, USER_UNVERIFIED_EMAIL.email, USER_UNVERIFIED_EMAIL.password);
    await submitLoginForm(page);

    // Should show error toast
    await assertErrorToast(page, /verify your email|email not verified/i);

    // Should remain on login page
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to 2FA verification when required', async ({ page }) => {
    await mockLoginRequires2FA(page, USER_WITH_2FA);

    await fillLoginForm(page, USER_WITH_2FA.email, USER_WITH_2FA.password);
    await submitLoginForm(page);

    // Should redirect to 2FA verification page
    await assertRedirectTo2FAVerification(page);
  });

  test('should show validation error for empty email', async ({ page }) => {
    await page.getByLabel(/email/i).fill('');
    await page.getByLabel(/password/i).fill(EXISTING_USER.password);
    await submitLoginForm(page);

    await assertFieldHasError(page, /email/i, /required|cannot be empty/i);
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.getByLabel(/email/i).fill(INVALID_EMAILS.noAtSign);
    await page.getByLabel(/password/i).fill(EXISTING_USER.password);
    await submitLoginForm(page);

    await assertFieldHasError(page, /email/i, /invalid|valid email/i);
  });

  test('should show validation error for empty password', async ({ page }) => {
    await page.getByLabel(/email/i).fill(EXISTING_USER.email);
    await page.getByLabel(/password/i).fill('');
    await submitLoginForm(page);

    await assertFieldHasError(page, /password/i, /required|cannot be empty/i);
  });

  test('should disable submit button while submitting', async ({ page }) => {
    await mockLoginSuccess(page, EXISTING_USER);
    await mockGetCurrentUserSuccess(page, EXISTING_USER);

    await fillLoginForm(page, EXISTING_USER.email, EXISTING_USER.password);

    const submitButton = page.getByRole('button', { name: /sign in|log in/i });

    // Button should be enabled before submit
    await expect(submitButton).toBeEnabled();

    // Click submit
    await submitButton.click();

    // Button should be disabled during submission
    await expect(submitButton).toBeDisabled();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordField = page.getByLabel(/password/i);
    await passwordField.fill(EXISTING_USER.password);

    // Password should be hidden by default
    await expect(passwordField).toHaveAttribute('type', 'password');

    // Click show password button
    const toggleButton = page.getByRole('button', { name: /show password|toggle/i });
    await toggleButton.click();

    // Password should be visible
    await expect(passwordField).toHaveAttribute('type', 'text');

    // Click again to hide
    await toggleButton.click();
    await expect(passwordField).toHaveAttribute('type', 'password');
  });

  test('should remember user when "Remember me" is checked', async ({ page }) => {
    await mockLoginSuccess(page, EXISTING_USER);
    await mockGetCurrentUserSuccess(page, EXISTING_USER);

    await fillLoginForm(page, EXISTING_USER.email, EXISTING_USER.password);

    // Check "Remember me"
    const rememberCheckbox = page.getByRole('checkbox', { name: /remember me/i });
    await rememberCheckbox.check();

    await submitLoginForm(page);

    // Wait for login to complete
    await waitForAuthentication(page);

    // Should store email in localStorage
    const rememberedEmail = await getLocalStorageItem(page, 'remembered_email');
    expect(rememberedEmail).toBe(EXISTING_USER.email);
  });

  test('should not remember user when "Remember me" is unchecked', async ({ page }) => {
    await mockLoginSuccess(page, EXISTING_USER);
    await mockGetCurrentUserSuccess(page, EXISTING_USER);

    await fillLoginForm(page, EXISTING_USER.email, EXISTING_USER.password);

    // Ensure "Remember me" is unchecked
    const rememberCheckbox = page.getByRole('checkbox', { name: /remember me/i });
    await rememberCheckbox.uncheck();

    await submitLoginForm(page);

    // Wait for login to complete
    await waitForAuthentication(page);

    // Should not store email in localStorage
    const rememberedEmail = await getLocalStorageItem(page, 'remembered_email');
    expect(rememberedEmail).toBeNull();
  });

  test('should pre-fill email if previously remembered', async ({ page }) => {
    // Set remembered email in localStorage
    await page.evaluate((email) => {
      localStorage.setItem('remembered_email', email);
    }, EXISTING_USER.email);

    // Reload page to trigger pre-fill
    await page.reload();

    // Email field should be pre-filled
    const emailField = page.getByLabel(/email/i);
    await expect(emailField).toHaveValue(EXISTING_USER.email);

    // Remember me checkbox should be checked
    const rememberCheckbox = page.getByRole('checkbox', { name: /remember me/i });
    await expect(rememberCheckbox).toBeChecked();
  });

  test('should navigate to registration page from link', async ({ page }) => {
    await clickLink(page, /sign up|register|create account/i);
    await expect(page).toHaveURL('/register');
  });

  test('should navigate to forgot password page from link', async ({ page }) => {
    await clickLink(page, /forgot password|reset password/i);
    await expect(page).toHaveURL('/forgot-password');
  });

  test('should display OAuth login options', async ({ page }) => {
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /microsoft/i })).toBeVisible();
  });
});

test.describe('Protected Route Access', () => {
  test('should redirect to login when accessing protected page without auth', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to original page after login', async ({ page }) => {
    await mockLoginSuccess(page, EXISTING_USER);
    await mockGetCurrentUserSuccess(page, EXISTING_USER);

    // Try to access protected settings page
    await page.goto('/settings');

    // Should redirect to login with redirect parameter
    await expect(page).toHaveURL(/\/login.*redirect/);

    // Login
    await fillLoginForm(page, EXISTING_USER.email, EXISTING_USER.password);
    await submitLoginForm(page);

    // Should redirect back to settings page
    await expect(page).toHaveURL('/settings');
  });

  test('should allow access to protected pages when authenticated', async ({ page }) => {
    await setupAuthFlowMocks(page, EXISTING_USER);

    // Login first
    await loginWithCredentials(page, EXISTING_USER.email, EXISTING_USER.password);
    await waitForAuthentication(page);

    // Should be able to access dashboard
    await page.goto('/');
    await expect(page).toHaveURL(/^\/(dashboard)?$/);

    // Should be able to access settings
    await page.goto('/settings');
    await expect(page).toHaveURL('/settings');
  });
});

test.describe('Login Session Persistence', () => {
  test('should maintain session after page reload', async ({ page }) => {
    await setupAuthFlowMocks(page, EXISTING_USER);

    // Login
    await loginWithCredentials(page, EXISTING_USER.email, EXISTING_USER.password);
    await waitForAuthentication(page);

    // Store auth token
    const authToken = await getLocalStorageItem(page, 'auth_token');
    expect(authToken).not.toBeNull();

    // Reload page
    await page.reload();

    // Should still be authenticated
    await assertAuthenticationState(page, true);
    await expect(page).toHaveURL(/^\/(dashboard)?$/);
  });

  test('should maintain session in new tab', async ({ context, page }) => {
    await setupAuthFlowMocks(page, EXISTING_USER);

    // Login in first tab
    await loginWithCredentials(page, EXISTING_USER.email, EXISTING_USER.password);
    await waitForAuthentication(page);

    // Open new tab
    const newPage = await context.newPage();
    await newPage.goto('/');

    // Should be authenticated in new tab
    await assertAuthenticationState(newPage, true);
    await expect(newPage).toHaveURL(/^\/(dashboard)?$/);

    await newPage.close();
  });
});
