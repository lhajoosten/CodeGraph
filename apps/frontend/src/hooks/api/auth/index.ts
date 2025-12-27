/**
 * Authentication API hooks - Queries and mutations.
 * Handles user authentication operations.
 */

export { useFetchCurrentUser } from './queries';
export {
  useLogin,
  useLogout,
  useRegister,
  useChangePassword,
  useChangeEmail,
  useResendVerification,
  useForgotPassword,
  useResetPassword,
  useSetup2FA,
  useVerify2FA,
  useVerifyEmail,
} from './mutations';
export type {
  UseLoginOptions,
  UseLogoutOptions,
  UseRegisterOptions,
  UseResendVerificationOptions,
  UseChangePasswordOptions,
  UseChangeEmailOptions,
  UseForgotPasswordOptions,
  UseResetPasswordOptions,
  UseSetup2FAOptions,
  UseVerify2FAOptions,
  UseVerifyEmailOptions,
  SetupStep,
} from './mutations';
