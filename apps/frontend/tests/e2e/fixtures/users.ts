/**
 * Test user data fixtures for E2E authentication tests
 *
 * These fixtures provide deterministic test data for various authentication scenarios.
 * All data is intentionally predictable to ensure test stability.
 */

export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  displayName?: string;
}

export interface TestUserWithProfile extends TestUser {
  profileComplete: boolean;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
}

/**
 * Valid test user for standard registration and login flows
 */
export const VALID_USER: TestUser = {
  email: 'test.user@codegraph.dev',
  password: 'SecurePass123!',
  firstName: 'Test',
  lastName: 'User',
  displayName: 'Test User',
};

export const VALID_USER_WITH_PROFILE: TestUserWithProfile = {
  email: 'test.user@codegraph.dev',
  password: 'SecurePass123!',
  firstName: 'Test',
  lastName: 'User',
  displayName: 'Test User',
  profileComplete: true,
  twoFactorEnabled: false,
  emailVerified: true,
};

/**
 * Alternative valid user for multi-user scenarios
 */
export const VALID_USER_ALT: TestUser = {
  email: 'jane.smith@codegraph.dev',
  password: 'AnotherPass456!',
  firstName: 'Jane',
  lastName: 'Smith',
  displayName: 'Jane Smith',
};

/**
 * User with special characters in name (edge case)
 */
export const USER_WITH_SPECIAL_CHARS: TestUser = {
  email: 'special.chars@codegraph.dev',
  password: 'SpecialPass789!',
  firstName: "O'Brien",
  lastName: 'Müller-Schmidt',
  displayName: "O'Brien Müller-Schmidt",
};

export const USER_WITH_SPECIAL_CHARS_WITH_PROFILE: TestUserWithProfile = {
  email: 'special.chars@codegraph.dev',
  password: 'SpecialPass789!',
  firstName: "O'Brien",
  lastName: 'Müller-Schmidt',
  displayName: "O'Brien Müller-Schmidt",
  profileComplete: true,
  twoFactorEnabled: false,
  emailVerified: true,
};

/**
 * User with maximum length fields (edge case)
 */
export const USER_WITH_MAX_LENGTH: TestUser = {
  email: 'very.long.email.address.for.testing@codegraph.development.example.com',
  password: 'VeryLongPassword123456789!@#$%',
  firstName: 'Verylongfirstnamethatreachesmaximumlength',
  lastName: 'Verylonglastnamethatreachesmaximumlength',
  displayName: 'Verylongfirstnamethatreachesmaximumlength Verylonglastnamethatreachesmaximumlength',
};

/**
 * User already registered in the system (for testing login)
 */
export const EXISTING_USER: TestUserWithProfile = {
  email: 'existing.user@codegraph.dev',
  password: 'ExistingPass123!',
  firstName: 'Existing',
  lastName: 'User',
  displayName: 'Existing User',
  profileComplete: true,
  twoFactorEnabled: false,
  emailVerified: true,
};

/**
 * User with 2FA enabled (for testing 2FA flows)
 */
export const USER_WITH_2FA: TestUserWithProfile = {
  email: 'user.with.2fa@codegraph.dev',
  password: 'SecureWith2FA!',
  firstName: 'TwoFactor',
  lastName: 'User',
  displayName: 'TwoFactor User',
  profileComplete: true,
  twoFactorEnabled: true,
  emailVerified: true,
};

/**
 * User with unverified email (for testing email verification)
 */
export const USER_UNVERIFIED_EMAIL: TestUserWithProfile = {
  email: 'unverified@codegraph.dev',
  password: 'UnverifiedPass123!',
  firstName: 'Unverified',
  lastName: 'Email',
  displayName: 'Unverified Email',
  profileComplete: true,
  twoFactorEnabled: false,
  emailVerified: false,
};

/**
 * User with incomplete profile (for testing profile completion)
 */
export const USER_INCOMPLETE_PROFILE: TestUserWithProfile = {
  email: 'incomplete@codegraph.dev',
  password: 'IncompletePass123!',
  firstName: '',
  lastName: '',
  displayName: '',
  profileComplete: false,
  twoFactorEnabled: false,
  emailVerified: true,
};

/**
 * Invalid credentials for testing error scenarios
 */
export const INVALID_CREDENTIALS = {
  email: 'nonexistent@codegraph.dev',
  password: 'WrongPassword123!',
};

/**
 * Weak passwords for testing validation
 */
export const WEAK_PASSWORDS = {
  tooShort: 'Pass1!',
  noUppercase: 'password123!',
  noLowercase: 'PASSWORD123!',
  noNumber: 'PasswordOnly!',
  noSpecialChar: 'Password123',
  allLowercase: 'password',
  empty: '',
};

/**
 * Invalid email formats for testing validation
 */
export const INVALID_EMAILS = {
  noAtSign: 'invalidemail.com',
  noDomain: 'invalid@',
  noLocal: '@domain.com',
  multipleDots: 'invalid..email@domain.com',
  specialChars: 'invalid$email@domain.com',
  spaces: 'invalid email@domain.com',
  empty: '',
};

/**
 * Test 2FA codes (deterministic for E2E tests)
 */
export const TEST_2FA_CODES = {
  valid: '000000',
  validAlternate: '123456',
  invalid: '999999',
  expired: '111111',
  tooShort: '123',
  tooLong: '1234567',
  nonNumeric: 'ABCDEF',
};

/**
 * Test verification tokens (deterministic for E2E tests)
 */
export const TEST_VERIFICATION_TOKENS = {
  valid: 'valid-verification-token-12345',
  expired: 'expired-verification-token-67890',
  invalid: 'invalid-verification-token-00000',
  alreadyUsed: 'used-verification-token-11111',
};

/**
 * Test reset password tokens (deterministic for E2E tests)
 */
export const TEST_RESET_TOKENS = {
  valid: 'valid-reset-token-abcdef',
  expired: 'expired-reset-token-ghijkl',
  invalid: 'invalid-reset-token-mnopqr',
  alreadyUsed: 'used-reset-token-stuvwx',
};

/**
 * OAuth test user data
 */
export const OAUTH_USER_GOOGLE: TestUserWithProfile = {
  email: 'oauth.google@gmail.com',
  password: '', // OAuth users don't have passwords
  firstName: 'Google',
  lastName: 'User',
  displayName: 'Google User',
  profileComplete: true,
  twoFactorEnabled: false,
  emailVerified: true,
};

export const OAUTH_USER_GITHUB: TestUserWithProfile = {
  email: 'oauth.github@users.noreply.github.com',
  password: '',
  firstName: 'GitHub',
  lastName: 'User',
  displayName: 'GitHub User',
  profileComplete: true,
  twoFactorEnabled: false,
  emailVerified: true,
};

export const OAUTH_USER_MICROSOFT: TestUserWithProfile = {
  email: 'oauth.microsoft@outlook.com',
  password: '',
  firstName: 'Microsoft',
  lastName: 'User',
  displayName: 'Microsoft User',
  profileComplete: true,
  twoFactorEnabled: false,
  emailVerified: true,
};
