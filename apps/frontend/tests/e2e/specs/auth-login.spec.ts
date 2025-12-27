/**
 * E2E Tests: User Login Flow
 *
 * Tests cover:
 * - Display of login form elements
 * - Successful login with valid credentials
 * - Invalid credentials handling
 * - Form validation (empty fields, invalid email)
 * - Password visibility toggle
 * - Remember me functionality
 * - Navigation to registration and forgot password
 * - OAuth button display
 * - 2FA redirect scenarios
 * - Protected route access and redirection
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import {
  EXISTING_USER,
  INVALID_CREDENTIALS,
  INVALID_EMAILS,
  USER_WITH_2FA,
  USER_UNVERIFIED_EMAIL,
} from '../fixtures';
import {
  mockLoginSuccess,
  mockLoginInvalidCredentials,
  mockLoginEmailNotVerified,
  mockLoginRequires2FA,
  mockGetCurrentUserSuccess,
  setupLoginFlowMocks,
} from '../helpers';

test.describe('Login Page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  // ===========================================================================
  // Form Display Tests
  // ===========================================================================

  test.describe('Form Display', () => {
    test('should display login form with all required elements', async () => {
      await loginPage.expectFormDisplayed();
      await expect(loginPage.rememberMeCheckbox).toBeVisible();
      await expect(loginPage.forgotPasswordLink).toBeVisible();
      await expect(loginPage.registerLink).toBeVisible();
    });

    test('should display OAuth login buttons', async () => {
      await loginPage.expectOAuthButtonsDisplayed();
    });

    test('should have password hidden by default', async () => {
      await loginPage.expectPasswordHidden();
    });
  });

  // ===========================================================================
  // Successful Login Tests
  // ===========================================================================

  test.describe('Successful Login', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
      await setupLoginFlowMocks(page, EXISTING_USER);

      await loginPage.login(EXISTING_USER.email, EXISTING_USER.password);

      await loginPage.expectRedirectToDashboard();
    });

    test('should store authentication state after login', async ({ page }) => {
      await setupLoginFlowMocks(page, EXISTING_USER);

      await loginPage.login(EXISTING_USER.email, EXISTING_USER.password);

      await loginPage.expectRedirectToDashboard();

      // Verify auth state is stored
      const isAuth = await loginPage.isAuthenticated();
      expect(isAuth).toBe(true);
    });

    test('should show loading state during submission', async ({ page }) => {
      // Create a delayed response to see loading state
      await page.route('**/api/v1/auth/login', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'test-token',
            token_type: 'bearer',
            expires_in: 86400,
            user: {
              id: 'user-1',
              email: EXISTING_USER.email,
              first_name: EXISTING_USER.firstName,
              last_name: EXISTING_USER.lastName,
              email_verified: true,
              two_factor_enabled: false,
            },
            email_verified: true,
            two_factor_required: false,
            two_factor_enabled: false,
            two_factor_setup_required: false,
          }),
        });
      });
      await mockGetCurrentUserSuccess(page, EXISTING_USER);

      await loginPage.fillForm(EXISTING_USER.email, EXISTING_USER.password);
      await loginPage.submit();

      // Check loading state
      await loginPage.expectSubmitLoading();
    });
  });

  // ===========================================================================
  // Login Error Tests
  // ===========================================================================

  test.describe('Login Errors', () => {
    test('should show error for invalid credentials', async ({ page }) => {
      await mockLoginInvalidCredentials(page);

      await loginPage.login(INVALID_CREDENTIALS.email, INVALID_CREDENTIALS.password);

      await loginPage.expectErrorMessage(/invalid|incorrect/i);
      await loginPage.expectUrl('/login');
    });

    test('should show error for unverified email', async ({ page }) => {
      await mockLoginEmailNotVerified(page);

      await loginPage.login(USER_UNVERIFIED_EMAIL.email, USER_UNVERIFIED_EMAIL.password);

      await loginPage.expectErrorMessage(/verify|email/i);
      await loginPage.expectUrl('/login');
    });

    test('should remain on login page after failed login', async ({ page }) => {
      await mockLoginInvalidCredentials(page);

      await loginPage.login(INVALID_CREDENTIALS.email, INVALID_CREDENTIALS.password);

      await loginPage.expectUrl('/login');

      // Verify not authenticated
      const isAuth = await loginPage.isAuthenticated();
      expect(isAuth).toBe(false);
    });
  });

  // ===========================================================================
  // Form Validation Tests
  // ===========================================================================

  test.describe('Form Validation', () => {
    test('should show validation error for empty email', async () => {
      await loginPage.fillEmail('');
      await loginPage.fillPassword(EXISTING_USER.password);
      await loginPage.submit();

      await loginPage.expectEmailError(/required|email/i);
    });

    test('should show validation error for invalid email format', async () => {
      await loginPage.fillEmail(INVALID_EMAILS.noAtSign);
      await loginPage.fillPassword(EXISTING_USER.password);
      await loginPage.submit();

      await loginPage.expectEmailError(/invalid|valid email/i);
    });

    test('should show validation error for empty password', async () => {
      await loginPage.fillEmail(EXISTING_USER.email);
      await loginPage.fillPassword('');
      await loginPage.submit();

      await loginPage.expectPasswordError(/required|password/i);
    });
  });

  // ===========================================================================
  // Password Visibility Tests
  // ===========================================================================

  test.describe('Password Visibility', () => {
    test('should toggle password visibility', async () => {
      await loginPage.fillPassword(EXISTING_USER.password);

      // Initially hidden
      await loginPage.expectPasswordHidden();

      // Toggle to visible
      await loginPage.togglePasswordVisibility();
      await loginPage.expectPasswordVisible();

      // Toggle back to hidden
      await loginPage.togglePasswordVisibility();
      await loginPage.expectPasswordHidden();
    });
  });

  // ===========================================================================
  // Remember Me Tests
  // ===========================================================================

  test.describe('Remember Me', () => {
    test('should remember user when checkbox is checked', async ({ page }) => {
      await setupLoginFlowMocks(page, EXISTING_USER);

      await loginPage.fillForm(EXISTING_USER.email, EXISTING_USER.password);
      await loginPage.checkRememberMe();
      await loginPage.submit();

      await loginPage.expectRedirectToDashboard();

      // Check if email is stored
      const rememberedEmail = await loginPage.getLocalStorageItem('rememberMe');
      expect(rememberedEmail).toBe(EXISTING_USER.email);
    });

    test('should not remember user when checkbox is unchecked', async ({ page }) => {
      await setupLoginFlowMocks(page, EXISTING_USER);

      await loginPage.fillForm(EXISTING_USER.email, EXISTING_USER.password);
      await loginPage.uncheckRememberMe();
      await loginPage.submit();

      await loginPage.expectRedirectToDashboard();

      // Email should not be stored
      const rememberedEmail = await loginPage.getLocalStorageItem('rememberMe');
      expect(rememberedEmail).toBeNull();
    });
  });

  // ===========================================================================
  // Navigation Tests
  // ===========================================================================

  test.describe('Navigation', () => {
    test('should navigate to registration page', async () => {
      await loginPage.clickRegister();
      await loginPage.expectUrl('/register');
    });

    test('should navigate to forgot password page', async () => {
      await loginPage.clickForgotPassword();
      await loginPage.expectUrl('/forgot-password');
    });
  });

  // ===========================================================================
  // 2FA Redirect Tests
  // ===========================================================================

  test.describe('Two-Factor Authentication', () => {
    test('should redirect to 2FA verification when required', async ({ page }) => {
      await mockLoginRequires2FA(page, USER_WITH_2FA);

      await loginPage.login(USER_WITH_2FA.email, USER_WITH_2FA.password);

      await loginPage.expectRedirectTo2FAVerification();
    });
  });
});

// =============================================================================
// Protected Route Access Tests
// =============================================================================

test.describe('Protected Route Access', () => {
  test('should redirect to login when accessing protected page without auth', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing settings without auth', async ({ page }) => {
    await page.goto('/settings');

    await expect(page).toHaveURL(/\/login/);
  });

  test('should allow access to protected pages when authenticated', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await setupLoginFlowMocks(page, EXISTING_USER);

    // Login first
    await loginPage.navigate();
    await loginPage.login(EXISTING_USER.email, EXISTING_USER.password);
    await loginPage.expectRedirectToDashboard();

    // Should be able to access settings
    await page.goto('/settings');
    await expect(page).toHaveURL('/settings');
  });
});

// =============================================================================
// Session Persistence Tests
// =============================================================================

test.describe('Session Persistence', () => {
  test('should maintain session after page reload', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await setupLoginFlowMocks(page, EXISTING_USER);

    // Login
    await loginPage.navigate();
    await loginPage.login(EXISTING_USER.email, EXISTING_USER.password);
    await loginPage.expectRedirectToDashboard();

    // Re-mock for after reload
    await mockGetCurrentUserSuccess(page, EXISTING_USER);

    // Reload page
    await page.reload();

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/^\/(dashboard)?$/);
  });

  test('should maintain session in new tab', async ({ context, page }) => {
    const loginPage = new LoginPage(page);

    await setupLoginFlowMocks(page, EXISTING_USER);

    // Login in first tab
    await loginPage.navigate();
    await loginPage.login(EXISTING_USER.email, EXISTING_USER.password);
    await loginPage.expectRedirectToDashboard();

    // Open new tab
    const newPage = await context.newPage();
    await mockGetCurrentUserSuccess(newPage, EXISTING_USER);
    await newPage.goto('/');

    // Should be authenticated in new tab
    await expect(newPage).toHaveURL(/^\/(dashboard)?$/);

    await newPage.close();
  });
});
