/**
 * Test User Data Fixtures for E2E Authentication Tests
 *
 * Deterministic test data for authentication scenarios.
 * All values are predictable to ensure test stability.
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

// =============================================================================
// Primary Test Users
// =============================================================================

/**
 * Valid user for standard registration and login flows
 */
export const VALID_USER: TestUser = {
  email: 'test.user@codegraph.dev',
  password: 'SecurePass123!',
  firstName: 'Test',
  lastName: 'User',
  displayName: 'Test User',
};

export const VALID_USER_WITH_PROFILE: TestUserWithProfile = {
  ...VALID_USER,
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

// =============================================================================
// Special Scenario Users
// =============================================================================

/**
 * User with 2FA enabled
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
 * User with unverified email
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
 * User with incomplete profile
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

// =============================================================================
// Edge Case Users
// =============================================================================

/**
 * User with special characters in name
 */
export const USER_WITH_SPECIAL_CHARS: TestUser = {
  email: 'special.chars@codegraph.dev',
  password: 'SpecialPass789!',
  firstName: "O'Brien",
  lastName: 'Muller-Schmidt',
  displayName: "O'Brien Muller-Schmidt",
};

/**
 * User with maximum length fields
 */
export const USER_WITH_MAX_LENGTH: TestUser = {
  email: 'very.long.email.address.for.testing@codegraph.development.example.com',
  password: 'VeryLongPassword123456789!',
  firstName: 'Verylongfirstnamethatreachesmaximumlength',
  lastName: 'Verylonglastnamethatreachesmaximumlength',
  displayName: 'Verylongfirstnamethatreachesmaximumlength Verylonglastnamethatreachesmaximumlength',
};

// =============================================================================
// OAuth Users
// =============================================================================

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

// =============================================================================
// Invalid Credentials
// =============================================================================

export const INVALID_CREDENTIALS = {
  email: 'nonexistent@codegraph.dev',
  password: 'WrongPassword123!',
};

// =============================================================================
// Weak Passwords (for validation testing)
// =============================================================================

export const WEAK_PASSWORDS = {
  tooShort: 'Pass1!',
  noUppercase: 'password123!',
  noLowercase: 'PASSWORD123!',
  noNumber: 'PasswordOnly!',
  noSpecialChar: 'Password123',
  allLowercase: 'password',
  empty: '',
};

// =============================================================================
// Invalid Emails (for validation testing)
// =============================================================================

export const INVALID_EMAILS = {
  noAtSign: 'invalidemail.com',
  noDomain: 'invalid@',
  noLocal: '@domain.com',
  multipleDots: 'invalid..email@domain.com',
  specialChars: 'invalid$email@domain.com',
  spaces: 'invalid email@domain.com',
  empty: '',
};

// =============================================================================
// Test Codes and Tokens
// =============================================================================

/**
 * Deterministic 2FA codes for testing
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
 * Test verification tokens
 */
export const TEST_VERIFICATION_TOKENS = {
  valid: 'valid-verification-token-12345',
  expired: 'expired-verification-token-67890',
  invalid: 'invalid-verification-token-00000',
  alreadyUsed: 'used-verification-token-11111',
};

/**
 * Test reset password tokens
 */
export const TEST_RESET_TOKENS = {
  valid: 'valid-reset-token-abcdef',
  expired: 'expired-reset-token-ghijkl',
  invalid: 'invalid-reset-token-mnopqr',
  alreadyUsed: 'used-reset-token-stuvwx',
};

/**
 * Test OAuth state tokens
 */
export const TEST_OAUTH_STATE = {
  valid: 'valid-oauth-state-token',
  invalid: 'invalid-oauth-state-token',
  expired: 'expired-oauth-state-token',
};

/**
 * Test OAuth authorization codes
 */
export const TEST_OAUTH_CODES = {
  valid: 'valid-auth-code-12345',
  invalid: 'invalid-auth-code-99999',
  expired: 'expired-auth-code-00000',
};
