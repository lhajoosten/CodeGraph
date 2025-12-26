/**
 * Error codes for API responses.
 * Must match backend error codes in src.core.error_codes.AuthErrorCode
 */

export enum AuthErrorCode {
  // Credentials
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PASSWORD = 'INVALID_PASSWORD',

  // Account state
  EMAIL_ALREADY_REGISTERED = 'EMAIL_ALREADY_REGISTERED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  USER_NOT_FOUND = 'USER_NOT_FOUND',

  // Token/session
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  REFRESH_TOKEN_NOT_FOUND = 'REFRESH_TOKEN_NOT_FOUND',
  REFRESH_TOKEN_REVOKED = 'REFRESH_TOKEN_REVOKED',

  // Email verification
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  VERIFICATION_TOKEN_INVALID = 'VERIFICATION_TOKEN_INVALID',
  VERIFICATION_TOKEN_EXPIRED = 'VERIFICATION_TOKEN_EXPIRED',

  // Password reset
  RESET_TOKEN_INVALID = 'RESET_TOKEN_INVALID',
  RESET_TOKEN_EXPIRED = 'RESET_TOKEN_EXPIRED',
  PASSWORD_INCORRECT = 'PASSWORD_INCORRECT',

  // 2FA
  TWO_FACTOR_REQUIRED = 'TWO_FACTOR_REQUIRED',
  TWO_FACTOR_SETUP_REQUIRED = 'TWO_FACTOR_SETUP_REQUIRED',
  TWO_FACTOR_CODE_INVALID = 'TWO_FACTOR_CODE_INVALID',
  TWO_FACTOR_NOT_ENABLED = 'TWO_FACTOR_NOT_ENABLED',

  // OAuth
  OAUTH_PROVIDER_NOT_CONFIGURED = 'OAUTH_PROVIDER_NOT_CONFIGURED',
  OAUTH_STATE_INVALID = 'OAUTH_STATE_INVALID',
  OAUTH_PROVIDER_MISMATCH = 'OAUTH_PROVIDER_MISMATCH',
  OAUTH_CALLBACK_FAILED = 'OAUTH_CALLBACK_FAILED',
  OAUTH_LINK_FAILED = 'OAUTH_LINK_FAILED',
  OAUTH_REAUTHENTICATION_REQUIRED = 'OAUTH_REAUTHENTICATION_REQUIRED',

  // Generic
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

/**
 * Map error codes to i18n translation keys
 */
export const ERROR_CODE_TO_I18N_KEY: Record<string, string> = {
  [AuthErrorCode.INVALID_CREDENTIALS]: 'error:invalidCredentials',
  [AuthErrorCode.EMAIL_ALREADY_REGISTERED]: 'error:accountAlreadyExists',
  [AuthErrorCode.ACCOUNT_LOCKED]: 'error:accountLocked',
  [AuthErrorCode.ACCOUNT_INACTIVE]: 'error:accountInactive',
  [AuthErrorCode.USER_NOT_FOUND]: 'error:accountNotFound',
  [AuthErrorCode.TOKEN_EXPIRED]: 'error:tokenExpired',
  [AuthErrorCode.TOKEN_INVALID]: 'error:invalidToken',
  [AuthErrorCode.EMAIL_NOT_VERIFIED]: 'error:emailNotVerified',
  [AuthErrorCode.VERIFICATION_TOKEN_INVALID]: 'error:invalidToken',
  [AuthErrorCode.VERIFICATION_TOKEN_EXPIRED]: 'error:invalidToken',
  [AuthErrorCode.RESET_TOKEN_INVALID]: 'error:invalidToken',
  [AuthErrorCode.RESET_TOKEN_EXPIRED]: 'error:invalidToken',
  [AuthErrorCode.PASSWORD_INCORRECT]: 'error:invalidPassword',
  [AuthErrorCode.TWO_FACTOR_CODE_INVALID]: 'error:twoFactorCodeInvalid',
  [AuthErrorCode.TWO_FACTOR_REQUIRED]: 'error:twoFactorRequired',
  [AuthErrorCode.TWO_FACTOR_SETUP_REQUIRED]: 'error:twoFactorSetupRequired',
  [AuthErrorCode.OAUTH_PROVIDER_NOT_CONFIGURED]: 'error:oauthProviderNotConfigured',
  [AuthErrorCode.OAUTH_STATE_INVALID]: 'error:oauthStateInvalid',
  [AuthErrorCode.OAUTH_CALLBACK_FAILED]: 'error:oauthCallbackFailed',
  [AuthErrorCode.OAUTH_REAUTHENTICATION_REQUIRED]: 'error:oauthReauthRequired',
  [AuthErrorCode.NOT_AUTHENTICATED]: 'error:unauthorized',
  [AuthErrorCode.INSUFFICIENT_PERMISSIONS]: 'error:forbidden',
  [AuthErrorCode.VALIDATION_ERROR]: 'error:invalidInput',
};
