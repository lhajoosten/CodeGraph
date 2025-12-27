/**
 * API Response Stubs for E2E Tests
 *
 * Deterministic API responses for mocking authentication endpoints.
 * These stubs match the actual API response structures.
 */

import type { TestUserWithProfile } from './users';

// =============================================================================
// Response Types
// =============================================================================

export interface UserResponse {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  email_verified: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserResponse;
  email_verified: boolean;
  two_factor_required: boolean;
  two_factor_enabled: boolean;
  two_factor_setup_required: boolean;
  temp_token?: string;
}

export interface RegisterResponse {
  user: UserResponse;
  message: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qr_code: string;
  backup_codes: string[];
}

export interface TwoFactorVerifyResponse {
  success: boolean;
  backup_codes: string[];
}

export interface ErrorResponse {
  detail: string;
  code?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function generateUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

function generateToken(): string {
  return `test-token-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

function userToResponse(user: TestUserWithProfile): UserResponse {
  return {
    id: generateUserId(),
    email: user.email,
    first_name: user.firstName || null,
    last_name: user.lastName || null,
    display_name: user.displayName || null,
    avatar_url: null,
    email_verified: user.emailVerified,
    two_factor_enabled: user.twoFactorEnabled,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// =============================================================================
// Login Stubs
// =============================================================================

export const LOGIN_STUBS = {
  success: (user: TestUserWithProfile): LoginResponse => ({
    access_token: generateToken(),
    token_type: 'bearer',
    expires_in: 86400,
    user: userToResponse(user),
    email_verified: user.emailVerified,
    two_factor_required: false,
    two_factor_enabled: user.twoFactorEnabled,
    two_factor_setup_required: false,
  }),

  successWith2FA: (user: TestUserWithProfile): LoginResponse => ({
    access_token: '',
    token_type: 'bearer',
    expires_in: 0,
    user: userToResponse(user),
    email_verified: user.emailVerified,
    two_factor_required: true,
    two_factor_enabled: true,
    two_factor_setup_required: false,
    temp_token: generateToken(),
  }),

  successRequires2FASetup: (user: TestUserWithProfile): LoginResponse => ({
    access_token: generateToken(),
    token_type: 'bearer',
    expires_in: 86400,
    user: userToResponse(user),
    email_verified: user.emailVerified,
    two_factor_required: false,
    two_factor_enabled: false,
    two_factor_setup_required: true,
  }),

  invalidCredentials: (): ErrorResponse => ({
    detail: 'Invalid email or password',
    code: 'INVALID_CREDENTIALS',
  }),

  emailNotVerified: (): ErrorResponse => ({
    detail: 'Please verify your email address before logging in',
    code: 'EMAIL_NOT_VERIFIED',
  }),

  accountLocked: (): ErrorResponse => ({
    detail: 'Account is temporarily locked. Please try again later.',
    code: 'ACCOUNT_LOCKED',
  }),

  accountDisabled: (): ErrorResponse => ({
    detail: 'This account has been disabled',
    code: 'ACCOUNT_DISABLED',
  }),
};

// =============================================================================
// Registration Stubs
// =============================================================================

export const REGISTER_STUBS = {
  success: (user: TestUserWithProfile): RegisterResponse => ({
    user: userToResponse({ ...user, emailVerified: false }),
    message: 'Registration successful. Please check your email to verify your account.',
  }),

  emailTaken: (): ErrorResponse => ({
    detail: 'An account with this email already exists',
    code: 'EMAIL_ALREADY_EXISTS',
  }),

  validationError: (field: string): ErrorResponse => ({
    detail: `Validation error on field: ${field}`,
    code: 'VALIDATION_ERROR',
  }),

  weakPassword: (): ErrorResponse => ({
    detail: 'Password does not meet security requirements',
    code: 'WEAK_PASSWORD',
  }),
};

// =============================================================================
// Two-Factor Authentication Stubs
// =============================================================================

export const TWO_FACTOR_STUBS = {
  setupSuccess: (): TwoFactorSetupResponse => ({
    secret: 'JBSWY3DPEHPK3PXP',
    qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    backup_codes: [
      'AAAA-BBBB',
      'CCCC-DDDD',
      'EEEE-FFFF',
      'GGGG-HHHH',
      'IIII-JJJJ',
      'KKKK-LLLL',
      'MMMM-NNNN',
      'OOOO-PPPP',
    ],
  }),

  verifySuccess: (): TwoFactorVerifyResponse => ({
    success: true,
    backup_codes: [
      'AAAA-BBBB',
      'CCCC-DDDD',
      'EEEE-FFFF',
      'GGGG-HHHH',
      'IIII-JJJJ',
      'KKKK-LLLL',
      'MMMM-NNNN',
      'OOOO-PPPP',
    ],
  }),

  verifyInvalidCode: (): ErrorResponse => ({
    detail: 'Invalid verification code',
    code: 'INVALID_2FA_CODE',
  }),

  loginSuccess: (user: TestUserWithProfile): LoginResponse => ({
    access_token: generateToken(),
    token_type: 'bearer',
    expires_in: 86400,
    user: userToResponse(user),
    email_verified: user.emailVerified,
    two_factor_required: false,
    two_factor_enabled: true,
    two_factor_setup_required: false,
  }),

  loginInvalidCode: (): ErrorResponse => ({
    detail: 'Invalid verification code',
    code: 'INVALID_2FA_CODE',
  }),

  loginExpiredCode: (): ErrorResponse => ({
    detail: 'Verification code has expired',
    code: 'EXPIRED_2FA_CODE',
  }),
};

// =============================================================================
// Email Verification Stubs
// =============================================================================

export const EMAIL_VERIFICATION_STUBS = {
  success: () => ({
    success: true,
    message: 'Email verified successfully',
  }),

  invalidToken: (): ErrorResponse => ({
    detail: 'Invalid verification token',
    code: 'INVALID_TOKEN',
  }),

  expiredToken: (): ErrorResponse => ({
    detail: 'Verification token has expired',
    code: 'EXPIRED_TOKEN',
  }),

  alreadyVerified: () => ({
    success: true,
    message: 'Email is already verified',
  }),

  resendSuccess: () => ({
    success: true,
    message: 'Verification email sent',
  }),

  resendRateLimited: (): ErrorResponse => ({
    detail: 'Too many requests. Please wait before requesting another email.',
    code: 'RATE_LIMITED',
  }),
};

// =============================================================================
// Password Reset Stubs
// =============================================================================

export const PASSWORD_RESET_STUBS = {
  requestSuccess: () => ({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.',
  }),

  requestRateLimited: (): ErrorResponse => ({
    detail: 'Too many password reset requests. Please try again later.',
    code: 'RATE_LIMITED',
  }),

  resetSuccess: () => ({
    success: true,
    message: 'Password has been reset successfully',
  }),

  resetInvalidToken: (): ErrorResponse => ({
    detail: 'Invalid or expired reset token',
    code: 'INVALID_TOKEN',
  }),

  resetExpiredToken: (): ErrorResponse => ({
    detail: 'Password reset token has expired',
    code: 'EXPIRED_TOKEN',
  }),

  resetTokenUsed: (): ErrorResponse => ({
    detail: 'This password reset link has already been used',
    code: 'TOKEN_USED',
  }),

  resetWeakPassword: (): ErrorResponse => ({
    detail: 'Password does not meet security requirements',
    code: 'WEAK_PASSWORD',
  }),
};

// =============================================================================
// Profile Stubs
// =============================================================================

export const PROFILE_STUBS = {
  getCurrentUserSuccess: (user: TestUserWithProfile) => ({
    ...userToResponse(user),
  }),

  getCurrentUserUnauthorized: (): ErrorResponse => ({
    detail: 'Not authenticated',
    code: 'UNAUTHORIZED',
  }),

  updateSuccess: (user: TestUserWithProfile) => ({
    ...userToResponse(user),
    message: 'Profile updated successfully',
  }),

  updateValidationError: (field: string): ErrorResponse => ({
    detail: `Validation error on field: ${field}`,
    code: 'VALIDATION_ERROR',
  }),
};

// =============================================================================
// OAuth Stubs
// =============================================================================

export const OAUTH_STUBS = {
  callbackSuccess: (user: TestUserWithProfile): LoginResponse => ({
    access_token: generateToken(),
    token_type: 'bearer',
    expires_in: 86400,
    user: userToResponse(user),
    email_verified: true,
    two_factor_required: false,
    two_factor_enabled: false,
    two_factor_setup_required: false,
  }),

  callbackError: (): ErrorResponse => ({
    detail: 'OAuth authentication failed',
    code: 'OAUTH_ERROR',
  }),

  callbackCancelled: (): ErrorResponse => ({
    detail: 'OAuth authentication was cancelled',
    code: 'OAUTH_CANCELLED',
  }),

  callbackInvalidState: (): ErrorResponse => ({
    detail: 'Invalid OAuth state parameter',
    code: 'INVALID_STATE',
  }),

  callbackEmailInUse: (): ErrorResponse => ({
    detail: 'An account with this email already exists',
    code: 'EMAIL_IN_USE',
  }),

  newUserRequiresProfile: (user: TestUserWithProfile): LoginResponse => ({
    access_token: generateToken(),
    token_type: 'bearer',
    expires_in: 86400,
    user: { ...userToResponse(user), first_name: null, last_name: null },
    email_verified: true,
    two_factor_required: false,
    two_factor_enabled: false,
    two_factor_setup_required: false,
  }),
};

// =============================================================================
// Generic Error Stubs
// =============================================================================

export const ERROR_STUBS = {
  serverError: (): ErrorResponse => ({
    detail: 'An internal server error occurred',
    code: 'SERVER_ERROR',
  }),

  networkError: (): ErrorResponse => ({
    detail: 'Network error. Please check your connection.',
    code: 'NETWORK_ERROR',
  }),

  rateLimited: (): ErrorResponse => ({
    detail: 'Too many requests. Please try again later.',
    code: 'RATE_LIMITED',
  }),

  unauthorized: (): ErrorResponse => ({
    detail: 'Authentication required',
    code: 'UNAUTHORIZED',
  }),

  forbidden: (): ErrorResponse => ({
    detail: 'You do not have permission to perform this action',
    code: 'FORBIDDEN',
  }),

  notFound: (): ErrorResponse => ({
    detail: 'Resource not found',
    code: 'NOT_FOUND',
  }),

  validationError: (message: string): ErrorResponse => ({
    detail: message,
    code: 'VALIDATION_ERROR',
  }),
};
