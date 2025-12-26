/**
 * API response stubs for E2E tests
 *
 * These stubs provide deterministic API responses to ensure test stability
 * and avoid dependencies on backend state.
 */

import type { TestUser, TestUserWithProfile } from './users';

export interface UserResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  email_verified: boolean;
  two_factor_enabled: boolean;
  profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegisterResponse {
  user: UserResponse;
  message: string;
  verification_sent: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
  requires_2fa?: boolean;
  temp_token?: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qr_code_url: string;
  backup_codes: string[];
}

export interface TwoFactorVerifyResponse {
  verified: boolean;
  backup_codes?: string[];
}

export interface EmailVerificationResponse {
  message: string;
  verified: boolean;
}

export interface PasswordResetRequestResponse {
  message: string;
  email_sent: boolean;
}

export interface PasswordResetResponse {
  message: string;
  success: boolean;
}

export interface ErrorResponse {
  detail: string;
  error_code?: string;
}

/**
 * Create user response stub from test user data
 */
export function createUserResponse(user: TestUserWithProfile, id = 1): UserResponse {
  return {
    id,
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
    display_name: user.displayName || `${user.firstName} ${user.lastName}`,
    email_verified: user.emailVerified,
    two_factor_enabled: user.twoFactorEnabled,
    profile_complete: user.profileComplete,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Registration API stubs
 */
export const REGISTER_STUBS = {
  success: (user: TestUser): RegisterResponse => ({
    user: createUserResponse(
      {
        ...user,
        profileComplete: false,
        twoFactorEnabled: false,
        emailVerified: false,
      },
      Math.floor(Math.random() * 10000)
    ),
    message: 'Registration successful. Please verify your email.',
    verification_sent: true,
  }),

  emailTaken: (): ErrorResponse => ({
    detail: 'Email already registered',
    error_code: 'EMAIL_ALREADY_EXISTS',
  }),

  invalidEmail: (): ErrorResponse => ({
    detail: 'Invalid email format',
    error_code: 'INVALID_EMAIL',
  }),

  weakPassword: (): ErrorResponse => ({
    detail: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
    error_code: 'WEAK_PASSWORD',
  }),

  validationError: (field: string): ErrorResponse => ({
    detail: `Validation error: ${field} is required`,
    error_code: 'VALIDATION_ERROR',
  }),
};

/**
 * Login API stubs
 */
export const LOGIN_STUBS = {
  success: (user: TestUserWithProfile): LoginResponse => ({
    access_token: `test-jwt-token-${Date.now()}`,
    token_type: 'bearer',
    user: createUserResponse(user),
  }),

  successWith2FA: (user: TestUserWithProfile): LoginResponse => ({
    access_token: '',
    token_type: 'bearer',
    user: createUserResponse(user),
    requires_2fa: true,
    temp_token: `temp-token-${Date.now()}`,
  }),

  invalidCredentials: (): ErrorResponse => ({
    detail: 'Invalid email or password',
    error_code: 'INVALID_CREDENTIALS',
  }),

  emailNotVerified: (): ErrorResponse => ({
    detail: 'Please verify your email before logging in',
    error_code: 'EMAIL_NOT_VERIFIED',
  }),

  accountLocked: (): ErrorResponse => ({
    detail: 'Account locked due to too many failed login attempts',
    error_code: 'ACCOUNT_LOCKED',
  }),

  accountDisabled: (): ErrorResponse => ({
    detail: 'Account has been disabled',
    error_code: 'ACCOUNT_DISABLED',
  }),
};

/**
 * 2FA API stubs
 */
export const TWO_FACTOR_STUBS = {
  setupSuccess: (): TwoFactorSetupResponse => ({
    secret: 'JBSWY3DPEHPK3PXP',
    qr_code_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    backup_codes: [
      'ABCD-1234',
      'EFGH-5678',
      'IJKL-9012',
      'MNOP-3456',
      'QRST-7890',
    ],
  }),

  verifySuccess: (): TwoFactorVerifyResponse => ({
    verified: true,
    backup_codes: [
      'ABCD-1234',
      'EFGH-5678',
      'IJKL-9012',
      'MNOP-3456',
      'QRST-7890',
    ],
  }),

  verifyInvalidCode: (): ErrorResponse => ({
    detail: 'Invalid verification code',
    error_code: 'INVALID_2FA_CODE',
  }),

  verifyExpired: (): ErrorResponse => ({
    detail: 'Verification code has expired',
    error_code: '2FA_CODE_EXPIRED',
  }),

  alreadyEnabled: (): ErrorResponse => ({
    detail: 'Two-factor authentication is already enabled',
    error_code: '2FA_ALREADY_ENABLED',
  }),

  loginSuccess: (user: TestUserWithProfile): LoginResponse => ({
    access_token: `test-jwt-token-${Date.now()}`,
    token_type: 'bearer',
    user: createUserResponse(user),
  }),

  loginInvalidCode: (): ErrorResponse => ({
    detail: 'Invalid 2FA code',
    error_code: 'INVALID_2FA_CODE',
  }),

  loginExpiredToken: (): ErrorResponse => ({
    detail: 'Temporary token expired',
    error_code: 'TEMP_TOKEN_EXPIRED',
  }),
};

/**
 * Email verification API stubs
 */
export const EMAIL_VERIFICATION_STUBS = {
  success: (): EmailVerificationResponse => ({
    message: 'Email verified successfully',
    verified: true,
  }),

  invalidToken: (): ErrorResponse => ({
    detail: 'Invalid verification token',
    error_code: 'INVALID_TOKEN',
  }),

  expiredToken: (): ErrorResponse => ({
    detail: 'Verification token has expired',
    error_code: 'TOKEN_EXPIRED',
  }),

  alreadyVerified: (): ErrorResponse => ({
    detail: 'Email already verified',
    error_code: 'EMAIL_ALREADY_VERIFIED',
  }),

  resendSuccess: (): { message: string } => ({
    message: 'Verification email sent',
  }),

  resendRateLimited: (): ErrorResponse => ({
    detail: 'Please wait before requesting another verification email',
    error_code: 'RATE_LIMITED',
  }),
};

/**
 * Password reset API stubs
 */
export const PASSWORD_RESET_STUBS = {
  requestSuccess: (): PasswordResetRequestResponse => ({
    message: 'Password reset email sent',
    email_sent: true,
  }),

  requestUserNotFound: (): PasswordResetRequestResponse => ({
    message: 'If an account exists, a password reset email will be sent',
    email_sent: false,
  }),

  requestRateLimited: (): ErrorResponse => ({
    detail: 'Too many password reset requests',
    error_code: 'RATE_LIMITED',
  }),

  resetSuccess: (): PasswordResetResponse => ({
    message: 'Password reset successfully',
    success: true,
  }),

  resetInvalidToken: (): ErrorResponse => ({
    detail: 'Invalid or expired reset token',
    error_code: 'INVALID_RESET_TOKEN',
  }),

  resetWeakPassword: (): ErrorResponse => ({
    detail: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
    error_code: 'WEAK_PASSWORD',
  }),
};

/**
 * Profile API stubs
 */
export const PROFILE_STUBS = {
  updateSuccess: (user: TestUserWithProfile): UserResponse => createUserResponse(user),

  updateValidationError: (field: string): ErrorResponse => ({
    detail: `Validation error: ${field} is invalid`,
    error_code: 'VALIDATION_ERROR',
  }),

  getCurrentUserSuccess: (user: TestUserWithProfile): UserResponse => createUserResponse(user),

  getCurrentUserUnauthorized: (): ErrorResponse => ({
    detail: 'Not authenticated',
    error_code: 'UNAUTHORIZED',
  }),
};

/**
 * OAuth API stubs
 */
export const OAUTH_STUBS = {
  callbackSuccess: (user: TestUserWithProfile): LoginResponse => ({
    access_token: `oauth-jwt-token-${Date.now()}`,
    token_type: 'bearer',
    user: createUserResponse(user),
  }),

  callbackNewUser: (user: TestUserWithProfile): LoginResponse => ({
    access_token: `oauth-jwt-token-${Date.now()}`,
    token_type: 'bearer',
    user: createUserResponse(
      {
        ...user,
        profileComplete: false,
      },
      Math.floor(Math.random() * 10000)
    ),
  }),

  callbackError: (): ErrorResponse => ({
    detail: 'OAuth authentication failed',
    error_code: 'OAUTH_ERROR',
  }),

  callbackStateMismatch: (): ErrorResponse => ({
    detail: 'Invalid state parameter',
    error_code: 'STATE_MISMATCH',
  }),

  callbackProviderError: (provider: string): ErrorResponse => ({
    detail: `${provider} returned an error`,
    error_code: 'PROVIDER_ERROR',
  }),
};

/**
 * Generic error stubs
 */
export const ERROR_STUBS = {
  serverError: (): ErrorResponse => ({
    detail: 'Internal server error',
    error_code: 'INTERNAL_ERROR',
  }),

  networkError: (): ErrorResponse => ({
    detail: 'Network error occurred',
    error_code: 'NETWORK_ERROR',
  }),

  unauthorized: (): ErrorResponse => ({
    detail: 'Unauthorized',
    error_code: 'UNAUTHORIZED',
  }),

  forbidden: (): ErrorResponse => ({
    detail: 'Forbidden',
    error_code: 'FORBIDDEN',
  }),

  notFound: (): ErrorResponse => ({
    detail: 'Resource not found',
    error_code: 'NOT_FOUND',
  }),

  rateLimited: (): ErrorResponse => ({
    detail: 'Too many requests',
    error_code: 'RATE_LIMITED',
  }),
};
