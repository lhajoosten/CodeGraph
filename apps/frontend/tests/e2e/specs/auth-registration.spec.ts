/**
 * E2E Tests: User Registration Flow
 *
 * Tests cover:
 * - Display of registration form elements
 * - Successful registration
 * - Form validation (required fields, email format, password strength)
 * - Password confirmation matching
 * - Terms acceptance requirement
 * - Email already exists error
 * - Password visibility toggle
 * - Password strength indicator
 * - Navigation to login page
 */

import { test, expect } from '@playwright/test';
import { RegisterPage } from '../pages/register.page';
import {
  VALID_USER,
  VALID_USER_WITH_PROFILE,
  EXISTING_USER,
  INVALID_EMAILS,
  WEAK_PASSWORDS,
  USER_WITH_SPECIAL_CHARS,
} from '../fixtures';
import {
  mockRegisterSuccess,
  mockRegisterEmailTaken,
  setupRegistrationFlowMocks,
} from '../helpers';

test.describe('Registration Page', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.navigate();
  });

  // ===========================================================================
  // Form Display Tests
  // ===========================================================================

  test.describe('Form Display', () => {
    test('should display registration form with all required fields', async () => {
      await registerPage.expectFormDisplayed();
    });

    test('should have password hidden by default', async () => {
      await registerPage.expectPasswordHidden();
    });

    test('should display terms and conditions checkbox', async () => {
      await expect(registerPage.acceptTermsCheckbox).toBeVisible();
    });

    test('should display login link', async () => {
      await expect(registerPage.loginLink).toBeVisible();
    });
  });

  // ===========================================================================
  // Successful Registration Tests
  // ===========================================================================

  test.describe('Successful Registration', () => {
    test('should register successfully with valid data', async ({ page }) => {
      await setupRegistrationFlowMocks(page, VALID_USER_WITH_PROFILE);

      await registerPage.register(VALID_USER);

      // Should redirect to email verification pending or show success
      await expect(page).toHaveURL(/\/verify-email-pending|\/login/);
    });

    test('should register user with special characters in name', async ({ page }) => {
      await mockRegisterSuccess(page, {
        ...VALID_USER_WITH_PROFILE,
        firstName: USER_WITH_SPECIAL_CHARS.firstName,
        lastName: USER_WITH_SPECIAL_CHARS.lastName,
      });

      await registerPage.register(USER_WITH_SPECIAL_CHARS);

      await expect(page).toHaveURL(/\/verify-email-pending|\/login/);
    });

    test('should show loading state during submission', async ({ page }) => {
      // Create a delayed response
      await page.route('**/api/v1/auth/register', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'user-1',
              email: VALID_USER.email,
              first_name: VALID_USER.firstName,
              last_name: VALID_USER.lastName,
              email_verified: false,
            },
            message: 'Registration successful',
          }),
        });
      });

      await registerPage.fillForm(VALID_USER);
      await registerPage.submit();

      // Check loading state
      await registerPage.expectSubmitLoading();
    });
  });

  // ===========================================================================
  // Registration Error Tests
  // ===========================================================================

  test.describe('Registration Errors', () => {
    test('should show error when email already exists', async ({ page }) => {
      await mockRegisterEmailTaken(page);

      await registerPage.register(EXISTING_USER);

      await registerPage.expectErrorMessage(/already exists|email.*taken/i);
    });
  });

  // ===========================================================================
  // Form Validation Tests
  // ===========================================================================

  test.describe('Form Validation', () => {
    test('should show error for empty first name', async () => {
      await registerPage.fillLastName(VALID_USER.lastName);
      await registerPage.fillEmail(VALID_USER.email);
      await registerPage.fillPassword(VALID_USER.password);
      await registerPage.fillConfirmPassword(VALID_USER.password);
      await registerPage.acceptTerms();
      await registerPage.submit();

      await registerPage.expectFirstNameError(/required/i);
    });

    test('should show error for empty last name', async () => {
      await registerPage.fillFirstName(VALID_USER.firstName);
      await registerPage.fillEmail(VALID_USER.email);
      await registerPage.fillPassword(VALID_USER.password);
      await registerPage.fillConfirmPassword(VALID_USER.password);
      await registerPage.acceptTerms();
      await registerPage.submit();

      await registerPage.expectLastNameError(/required/i);
    });

    test('should show error for empty email', async () => {
      await registerPage.fillFirstName(VALID_USER.firstName);
      await registerPage.fillLastName(VALID_USER.lastName);
      await registerPage.fillPassword(VALID_USER.password);
      await registerPage.fillConfirmPassword(VALID_USER.password);
      await registerPage.acceptTerms();
      await registerPage.submit();

      await registerPage.expectEmailError(/required|email/i);
    });

    test('should show error for invalid email format', async () => {
      await registerPage.fillFirstName(VALID_USER.firstName);
      await registerPage.fillLastName(VALID_USER.lastName);
      await registerPage.fillEmail(INVALID_EMAILS.noAtSign);
      await registerPage.fillPassword(VALID_USER.password);
      await registerPage.fillConfirmPassword(VALID_USER.password);
      await registerPage.acceptTerms();
      await registerPage.submit();

      await registerPage.expectEmailError(/invalid|valid email/i);
    });

    test('should show error for empty password', async () => {
      await registerPage.fillFirstName(VALID_USER.firstName);
      await registerPage.fillLastName(VALID_USER.lastName);
      await registerPage.fillEmail(VALID_USER.email);
      await registerPage.fillConfirmPassword(VALID_USER.password);
      await registerPage.acceptTerms();
      await registerPage.submit();

      await registerPage.expectPasswordError(/required|password/i);
    });

    test('should show error for weak password (too short)', async () => {
      await registerPage.fillFirstName(VALID_USER.firstName);
      await registerPage.fillLastName(VALID_USER.lastName);
      await registerPage.fillEmail(VALID_USER.email);
      await registerPage.fillPassword(WEAK_PASSWORDS.tooShort);
      await registerPage.fillConfirmPassword(WEAK_PASSWORDS.tooShort);
      await registerPage.acceptTerms();
      await registerPage.submit();

      await registerPage.expectPasswordError(/8 characters|too short/i);
    });

    test('should show error for password without uppercase', async () => {
      await registerPage.fillFirstName(VALID_USER.firstName);
      await registerPage.fillLastName(VALID_USER.lastName);
      await registerPage.fillEmail(VALID_USER.email);
      await registerPage.fillPassword(WEAK_PASSWORDS.noUppercase);
      await registerPage.fillConfirmPassword(WEAK_PASSWORDS.noUppercase);
      await registerPage.acceptTerms();
      await registerPage.submit();

      await registerPage.expectPasswordError(/uppercase/i);
    });

    test('should show error for password without number', async () => {
      await registerPage.fillFirstName(VALID_USER.firstName);
      await registerPage.fillLastName(VALID_USER.lastName);
      await registerPage.fillEmail(VALID_USER.email);
      await registerPage.fillPassword(WEAK_PASSWORDS.noNumber);
      await registerPage.fillConfirmPassword(WEAK_PASSWORDS.noNumber);
      await registerPage.acceptTerms();
      await registerPage.submit();

      await registerPage.expectPasswordError(/number/i);
    });
  });

  // ===========================================================================
  // Password Confirmation Tests
  // ===========================================================================

  test.describe('Password Confirmation', () => {
    test('should show error when passwords do not match', async () => {
      await registerPage.fillFirstName(VALID_USER.firstName);
      await registerPage.fillLastName(VALID_USER.lastName);
      await registerPage.fillEmail(VALID_USER.email);
      await registerPage.fillPassword(VALID_USER.password);
      await registerPage.fillConfirmPassword('DifferentPassword123!');
      await registerPage.acceptTerms();
      await registerPage.submit();

      await registerPage.expectConfirmPasswordError(/match|same/i);
    });

    test('should show error for empty confirm password', async () => {
      await registerPage.fillFirstName(VALID_USER.firstName);
      await registerPage.fillLastName(VALID_USER.lastName);
      await registerPage.fillEmail(VALID_USER.email);
      await registerPage.fillPassword(VALID_USER.password);
      await registerPage.acceptTerms();
      await registerPage.submit();

      await registerPage.expectConfirmPasswordError(/required|confirm/i);
    });
  });

  // ===========================================================================
  // Terms Acceptance Tests
  // ===========================================================================

  test.describe('Terms Acceptance', () => {
    test('should have submit button disabled when terms not accepted', async () => {
      await registerPage.fillFirstName(VALID_USER.firstName);
      await registerPage.fillLastName(VALID_USER.lastName);
      await registerPage.fillEmail(VALID_USER.email);
      await registerPage.fillPassword(VALID_USER.password);
      await registerPage.fillConfirmPassword(VALID_USER.password);
      // Do not accept terms

      await registerPage.expectSubmitDisabled();
    });

    test('should enable submit button when terms accepted', async () => {
      await registerPage.fillFirstName(VALID_USER.firstName);
      await registerPage.fillLastName(VALID_USER.lastName);
      await registerPage.fillEmail(VALID_USER.email);
      await registerPage.fillPassword(VALID_USER.password);
      await registerPage.fillConfirmPassword(VALID_USER.password);
      await registerPage.acceptTerms();

      await registerPage.expectSubmitEnabled();
    });
  });

  // ===========================================================================
  // Password Visibility Tests
  // ===========================================================================

  test.describe('Password Visibility', () => {
    test('should toggle password visibility', async () => {
      await registerPage.fillPassword(VALID_USER.password);

      // Initially hidden
      await registerPage.expectPasswordHidden();

      // Toggle to visible
      await registerPage.togglePasswordVisibility();
      await registerPage.expectPasswordVisible();

      // Toggle back to hidden
      await registerPage.togglePasswordVisibility();
      await registerPage.expectPasswordHidden();
    });
  });

  // ===========================================================================
  // Password Strength Indicator Tests
  // ===========================================================================

  test.describe('Password Strength Indicator', () => {
    test('should show weak password strength for short password', async () => {
      await registerPage.fillPassword('pass');

      await registerPage.expectPasswordStrength('weak');
    });

    test('should show medium password strength', async () => {
      await registerPage.fillPassword('Password1');

      await registerPage.expectPasswordStrength('medium');
    });

    test('should show strong password strength', async () => {
      await registerPage.fillPassword('SecurePass123!@#');

      await registerPage.expectPasswordStrength('strong');
    });
  });

  // ===========================================================================
  // Navigation Tests
  // ===========================================================================

  test.describe('Navigation', () => {
    test('should navigate to login page', async () => {
      await registerPage.clickLogin();
      await registerPage.expectRedirectToLogin();
    });
  });
});
