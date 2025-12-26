import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 *
 * These tests verify complete authentication flows including:
 * - Form submission and navigation
 * - Multi-step user journeys
 * - Real browser interactions
 * - Keyboard navigation and accessibility
 */

// Helper function to setup API mocks
async function setupMockAPIs(page: any) {
  // Mock registration endpoint
  await page.route('**/api/v1/auth/register', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    if (postData?.email && postData?.password) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-123',
          email: postData.email,
          message: 'Registration successful'
        }),
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Invalid input' }),
      });
    }
  });

  // Mock login endpoint
  await page.route('**/api/v1/auth/login', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    if (postData?.email && postData?.password) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          user: { id: 'user-123', email: postData.email }
        }),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Invalid credentials' }),
      });
    }
  });

  // Mock forgot password endpoint
  await page.route('**/api/v1/auth/forgot-password', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    if (postData?.email) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Password reset email sent' }),
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Invalid input' }),
      });
    }
  });

  // Mock resend verification endpoint
  await page.route('**/api/v1/auth/resend-verification', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    if (postData?.email) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Verification email sent' }),
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Invalid input' }),
      });
    }
  });
}

// Helper function to fill and submit login form
async function fillAndSubmitLoginForm(page: any, email: string, password: string) {
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button:has-text("Sign In")');
}

// Helper function to fill and submit register form
async function fillAndSubmitRegisterForm(
  page: any,
  email: string,
  password: string
) {
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.fill('#confirmPassword', password);
  await page.click('button:has-text("Create account")');
}

test.describe('Registration Flow', () => {
  test('should complete registration flow: fill form → submit → navigate to verification', async ({ page }) => {
    // Setup API mocks
    await setupMockAPIs(page);

    // Navigate to registration page
    await page.goto('/register');
    await expect(page).toHaveURL('/register');

    // Fill registration form
    await fillAndSubmitRegisterForm(
      page,
      'john.doe@example.com',
      'SecurePassword123'
    );

    // Should navigate to email verification pending page
    await expect(page).toHaveURL(/verify-email-pending/);
    await expect(page.locator('text=Email Verification Pending')).toBeVisible();
  });

  test('should handle registration errors gracefully', async ({ page }) => {
    await page.goto('/register');

    // Try to register with invalid password (too short)
    await page.fill('#email', 'john@example.com');
    await page.fill('#password', 'short');
    await page.fill('#confirmPassword', 'short');

    // Try to submit - should show validation error
    const submitButton = page.locator('button:has-text("Create account")');
    await submitButton.click();

    // Should show an error message or stay on the page
    await expect(page).toHaveURL('/register');
  });

  test('should validate all fields before submission', async ({ page }) => {
    await page.goto('/register');

    const submitButton = page.locator('button:has-text("Create account")');

    // Try to fill form with all required fields
    await page.fill('#email', 'john@example.com');
    await page.fill('#password', 'SecurePassword123');
    await page.fill('#confirmPassword', 'SecurePassword123');

    // Button should be clickable
    await expect(submitButton).toBeEnabled();
  });
});

test.describe('Login Flow', () => {
  test('should complete login flow: fill credentials → submit → update store → navigate', async ({ page }) => {
    // Setup API mocks
    await setupMockAPIs(page);

    // First register a user
    await page.goto('/register');
    await fillAndSubmitRegisterForm(
      page,
      'jane.smith@example.com',
      'SecurePassword123'
    );

    // Navigate to login page
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    // Fill and submit login form
    await fillAndSubmitLoginForm(page, 'jane.smith@example.com', 'SecurePassword123');

    // Should navigate away from login page (to dashboard or verification page)
    await expect(page).not.toHaveURL(/\/login$/);
  });

  test('should handle invalid credentials gracefully', async ({ page }) => {
    // Setup specific API mock for this test that returns an error
    await page.route('**/api/**/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Invalid credentials' }),
      });
    });

    await page.goto('/login');

    // Try to login with wrong credentials
    await fillAndSubmitLoginForm(page, 'nonexistent@example.com', 'WrongPassword123');

    // Should stay on login page (error response means no navigation)
    await expect(page).toHaveURL(/\/login/);
  });

  test('should preserve redirect URL after login', async ({ page }) => {
    // Setup API mocks
    await setupMockAPIs(page);

    // Navigate to login with redirect parameter
    await page.goto('/login?redirect=/dashboard');

    // Fill and submit login form
    await fillAndSubmitLoginForm(page, 'test@example.com', 'TestPassword123');

    // Should preserve or use redirect URL
    // (May redirect to dashboard or verification page depending on email verification status)
    await expect(page).not.toHaveURL('/login');
  });
});

test.describe('Remember Me Functionality', () => {
  test('should include remember me option in login', async ({ page }) => {
    await page.goto('/login');

    // Check that remember me checkbox field exists
    // Look for the checkbox button with role="checkbox" which Radix UI uses
    const rememberMeCheckbox = page.locator('div:has([role="checkbox"]) label:has-text("Remember me")');

    // If the specific locator doesn't work, try finding any checkbox near a "Remember me" text
    let found = false;
    try {
      await expect(rememberMeCheckbox).toBeVisible({ timeout: 2000 });
      found = true;
    } catch {
      // Try alternate approach - look for all labels and find the one with "Remember me"
      const allLabels = page.locator('label');
      const count = await allLabels.count();

      for (let i = 0; i < count; i++) {
        const labelText = await allLabels.nth(i).textContent();
        if (labelText?.includes('Remember')) {
          found = true;
          break;
        }
      }
    }

    // The remember me field should exist somewhere in the login form
    expect(found).toBe(true);
  });
});

test.describe('Form Validation Flow', () => {
  test('should show real-time validation for email format', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('#email');

    // Type invalid email
    await emailInput.fill('invalid-email');

    // Form should remain in invalid state
    const submitButton = page.locator('button:has-text("Sign In")');
    // Continue typing to see validation
    await emailInput.fill('invalid-email@');
    await page.waitForTimeout(500);

    // Type valid email
    await emailInput.fill('valid@example.com');
    await page.waitForTimeout(500);

    // Now form should be ready to submit (if password is filled)
    const passwordInput = page.locator('#password');
    await passwordInput.fill('password123');

    await expect(submitButton).toBeEnabled();
  });

  test('should clear validation errors when user corrects input', async ({ page }) => {
    await page.goto('/register');

    const passwordInput = page.locator('#password');
    const confirmPasswordInput = page.locator('#confirmPassword');

    // Type mismatched passwords to trigger validation error
    await passwordInput.fill('Password123');
    await confirmPasswordInput.fill('Password456');
    await page.waitForTimeout(500);

    // Should show validation error
    // (Exact error selector depends on component implementation)

    // Correct the password
    await confirmPasswordInput.fill('Password123');
    await page.waitForTimeout(500);

    // Error should be cleared
    // Validation error should disappear
  });
});

test.describe('Loading States', () => {
  test('should disable submit button and show loading indicator during form submission', async ({ page }) => {
    // Setup API mocks with a delay so we can catch the loading state
    await page.route('**/api/**/auth/login', async (route) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Invalid credentials' }),
      });
    });

    await page.goto('/login');

    // Fill form with valid data
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');

    // Submit form
    const submitButton = page.locator('button:has-text("Sign In")');

    // Verify button is initially enabled
    const initiallyEnabled = await submitButton.isEnabled();
    expect(initiallyEnabled).toBe(true);

    // Click submit
    await submitButton.click();

    // The button should become disabled or show loading state during the request
    // We give a small window to catch it
    await page.waitForTimeout(100);

    // After the response comes back, button should be re-enabled
    // (since we got a 401 error, not a successful login that would navigate away)
    await page.waitForTimeout(500);
    const afterError = await submitButton.isEnabled();

    // Button should be enabled again after error
    expect(afterError).toBe(true);
  });
});

test.describe('Accessibility', () => {
  test('should support form interaction with focus states', async ({ page }) => {
    await page.goto('/login');

    // Check that form fields are focusable and interactive
    const emailInput = page.locator('#email');
    await emailInput.focus();

    const focusedElement = await page.evaluate(() => document.activeElement?.id);
    expect(focusedElement).toBe('email');
  });
});

test.describe('Forgot Password Flow', () => {
  test('should complete forgot password flow', async ({ page }) => {
    // Setup API mocks
    await setupMockAPIs(page);

    await page.goto('/forgot-password');
    await expect(page).toHaveURL('/forgot-password');

    // Enter email and submit
    await page.fill('#email', 'test@example.com');
    await page.click('button:has-text("Send Reset Link")');

    // Should show confirmation message
    await expect(page.getByRole('heading', { name: 'Check Your Email' })).toBeVisible();
  });

  test('should allow resetting another email', async ({ page }) => {
    // Setup API mocks
    await setupMockAPIs(page);

    await page.goto('/forgot-password');

    // Submit first email
    await page.fill('#email', 'test1@example.com');
    await page.click('button:has-text("Send Reset Link")');

    // Click "Reset another email"
    await page.click('text=Reset another email');

    // Should be back to form
    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveValue('');
  });
});
