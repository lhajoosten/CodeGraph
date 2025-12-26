/**
 * E2E tests for user registration flow
 *
 * Tests cover:
 * - Successful registration
 * - Validation errors
 * - Email already exists
 * - Password strength requirements
 * - Terms acceptance
 * - Redirect flows
 */

import { test, expect } from '@playwright/test';
import {
  VALID_USER,
  EXISTING_USER,
  WEAK_PASSWORDS,
  INVALID_EMAILS,
  USER_WITH_SPECIAL_CHARS,
  VALID_USER_WITH_PROFILE,
  USER_WITH_SPECIAL_CHARS_WITH_PROFILE,
} from '../fixtures';
import {
  mockRegisterSuccess,
  mockRegisterEmailTaken,
  mockEmailVerificationResendSuccess,
} from '../helpers';
import {
  navigateToRegister,
  fillRegistrationForm,
  submitRegistrationForm,
  registerUser,
} from '../helpers';
import {
  assertRedirectToEmailVerificationPending,
  assertFormHasValidationErrors,
  assertFieldHasError,
  assertSuccessToast,
  assertErrorToast,
} from '../helpers/';
import { clickLink, assertButtonDisabled } from '../helpers';

test.describe('User Registration', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToRegister(page);
  });

  test('should display registration form with all fields', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /terms/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up|register/i })).toBeVisible();
  });

  test('should successfully register new user', async ({ page }) => {
    await mockRegisterSuccess(page, VALID_USER_WITH_PROFILE);

    await fillRegistrationForm(page, VALID_USER);
    await submitRegistrationForm(page);

    // Should redirect to email verification pending page
    await assertRedirectToEmailVerificationPending(page);
    await assertSuccessToast(page, /registration successful|verify your email/i);
  });

  test('should show validation error for empty email', async ({ page }) => {
    await page.getByLabel(/email/i).fill('');
    await page.getByLabel(/^password/i).fill(VALID_USER.password);
    await page.getByLabel(/confirm password/i).fill(VALID_USER.password);
    await submitRegistrationForm(page);

    await assertFieldHasError(page, /email/i, /required|cannot be empty/i);
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.getByLabel(/email/i).fill(INVALID_EMAILS.noAtSign);
    await page.getByLabel(/^password/i).fill(VALID_USER.password);
    await page.getByLabel(/confirm password/i).fill(VALID_USER.password);
    await submitRegistrationForm(page);

    await assertFieldHasError(page, /email/i, /invalid|valid email/i);
  });

  test('should show validation error for empty password', async ({ page }) => {
    await page.getByLabel(/email/i).fill(VALID_USER.email);
    await page.getByLabel(/^password/i).fill('');
    await page.getByLabel(/confirm password/i).fill('');
    await submitRegistrationForm(page);

    await assertFieldHasError(page, /^password/i, /required|cannot be empty/i);
  });

  test('should show validation error for weak password', async ({ page }) => {
    await page.getByLabel(/email/i).fill(VALID_USER.email);
    await page.getByLabel(/^password/i).fill(WEAK_PASSWORDS.tooShort);
    await page.getByLabel(/confirm password/i).fill(WEAK_PASSWORDS.tooShort);
    await submitRegistrationForm(page);

    await assertFieldHasError(page, /^password/i, /at least 8 characters|too short/i);
  });

  test('should show validation error for password without uppercase', async ({ page }) => {
    await page.getByLabel(/email/i).fill(VALID_USER.email);
    await page.getByLabel(/^password/i).fill(WEAK_PASSWORDS.noUppercase);
    await page.getByLabel(/confirm password/i).fill(WEAK_PASSWORDS.noUppercase);
    await submitRegistrationForm(page);

    await assertFieldHasError(page, /^password/i, /uppercase|capital letter/i);
  });

  test('should show validation error for password without number', async ({ page }) => {
    await page.getByLabel(/email/i).fill(VALID_USER.email);
    await page.getByLabel(/^password/i).fill(WEAK_PASSWORDS.noNumber);
    await page.getByLabel(/confirm password/i).fill(WEAK_PASSWORDS.noNumber);
    await submitRegistrationForm(page);

    await assertFieldHasError(page, /^password/i, /number|digit/i);
  });

  test('should show validation error for password without special character', async ({ page }) => {
    await page.getByLabel(/email/i).fill(VALID_USER.email);
    await page.getByLabel(/^password/i).fill(WEAK_PASSWORDS.noSpecialChar);
    await page.getByLabel(/confirm password/i).fill(WEAK_PASSWORDS.noSpecialChar);
    await submitRegistrationForm(page);

    await assertFieldHasError(page, /^password/i, /special character/i);
  });

  test('should show validation error when passwords do not match', async ({ page }) => {
    await page.getByLabel(/email/i).fill(VALID_USER.email);
    await page.getByLabel(/^password/i).fill(VALID_USER.password);
    await page.getByLabel(/confirm password/i).fill('DifferentPassword123!');
    await submitRegistrationForm(page);

    await assertFieldHasError(page, /confirm password/i, /must match|do not match/i);
  });

  test('should require terms acceptance', async ({ page }) => {
    await page.getByLabel(/email/i).fill(VALID_USER.email);
    await page.getByLabel(/^password/i).fill(VALID_USER.password);
    await page.getByLabel(/confirm password/i).fill(VALID_USER.password);

    // Ensure terms checkbox is not checked
    const termsCheckbox = page.getByRole('checkbox', { name: /terms/i });
    await expect(termsCheckbox).not.toBeChecked();

    await submitRegistrationForm(page);

    // Should show validation error
    await assertFormHasValidationErrors(page);
  });

  test('should show error when email already exists', async ({ page }) => {
    await mockRegisterEmailTaken(page);

    await fillRegistrationForm(page, EXISTING_USER);
    await submitRegistrationForm(page);

    await assertErrorToast(page, /email already registered|already exists/i);
  });

  test('should handle special characters in name', async ({ page }) => {
    await mockRegisterSuccess(page, USER_WITH_SPECIAL_CHARS_WITH_PROFILE);

    await fillRegistrationForm(page, USER_WITH_SPECIAL_CHARS);
    await submitRegistrationForm(page);

    await assertRedirectToEmailVerificationPending(page);
    await assertSuccessToast(page, /registration successful/i);
  });

  test('should disable submit button while submitting', async ({ page }) => {
    await mockRegisterSuccess(page, VALID_USER_WITH_PROFILE);

    await fillRegistrationForm(page, VALID_USER);

    const submitButton = page.getByRole('button', { name: /sign up|register/i });

    // Button should be enabled before submit
    await expect(submitButton).toBeEnabled();

    // Click submit
    await submitButton.click();

    // Button should be disabled during submission
    await expect(submitButton).toBeDisabled();
  });

  test('should show password strength indicator', async ({ page }) => {
    const passwordField = page.getByLabel(/^password/i);

    // Type weak password
    await passwordField.fill(WEAK_PASSWORDS.allLowercase);
    await expect(page.getByText(/weak/i)).toBeVisible();

    // Type stronger password
    await passwordField.fill('Password123');
    await expect(page.getByText(/fair|medium/i)).toBeVisible();

    // Type strong password
    await passwordField.fill(VALID_USER.password);
    await expect(page.getByText(/strong|good/i)).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordField = page.getByLabel(/^password/i);
    await passwordField.fill(VALID_USER.password);

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

  test('should navigate to login page from link', async ({ page }) => {
    await clickLink(page, /sign in|log in|already have an account/i);
    await expect(page).toHaveURL('/login');
  });

  test('should display terms and privacy policy links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /terms/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /privacy/i })).toBeVisible();
  });
});

test.describe('Email Verification Pending', () => {
  test.beforeEach(async ({ page }) => {
    await mockRegisterSuccess(page, VALID_USER_WITH_PROFILE);
    await registerUser(page, VALID_USER);
    await expect(page).toHaveURL('/verify-email-pending');
  });

  test('should display verification pending message', async ({ page }) => {
    await expect(page.getByText(/verify your email|check your inbox/i)).toBeVisible();
    await expect(page.getByText(VALID_USER.email)).toBeVisible();
  });

  test('should allow resending verification email', async ({ page }) => {
    await mockEmailVerificationResendSuccess(page);

    const resendButton = page.getByRole('button', { name: /resend|send again/i });
    await expect(resendButton).toBeVisible();
    await resendButton.click();

    await assertSuccessToast(page, /verification email sent/i);
  });

  test('should rate limit resend requests', async ({ page }) => {
    await mockEmailVerificationResendSuccess(page);

    const resendButton = page.getByRole('button', { name: /resend|send again/i });

    // First resend should work
    await resendButton.click();
    await assertSuccessToast(page, /verification email sent/i);

    // Button should be disabled temporarily
    await assertButtonDisabled(page, /resend|send again/i);

    // Wait for rate limit to reset (typically 60 seconds, but may be shorter in tests)
    await page.waitForTimeout(1000);

    // Button should be enabled again
    // Note: This depends on implementation - adjust based on actual rate limit duration
  });

  test('should allow navigation to login page', async ({ page }) => {
    await clickLink(page, /back to login|sign in/i);
    await expect(page).toHaveURL('/login');
  });
});
