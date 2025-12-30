/**
 * API hooks - queries and mutations for backend API operations.
 * Organized by feature with separated queries and mutations.
 */

// Auth hooks
export {
  useFetchCurrentUser,
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
  type UseLoginOptions,
  type UseLogoutOptions,
  type UseRegisterOptions,
  type UseChangePasswordOptions,
  type UseChangeEmailOptions,
  type UseResendVerificationOptions,
  type UseForgotPasswordOptions,
  type UseResetPasswordOptions,
  type UseSetup2FAOptions,
  type UseVerify2FAOptions,
  type UseVerifyEmailOptions,
  type SetupStep,
} from './auth';

// Task hooks
export {
  useFetchTasks,
  useFetchTask,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  taskQueryKeys,
  type UseFetchTasksOptions,
  type UseCreateTaskOptions,
  type UseUpdateTaskOptions,
  type UseDeleteTaskOptions,
} from './tasks';

// OAuth hooks
export {
  useFetchOAuthAccounts,
  useUnlinkOAuthAccount,
  oauthQueryKeys,
  type UseUnlinkOAuthAccountOptions,
} from './oauth';

// Two-Factor Authentication hooks
export {
  useFetchTwoFactorStatus,
  useDisableTwoFactor,
  useRegenerateBackupCodes,
  twoFactorQueryKeys,
  type UseDisableTwoFactorOptions,
  type UseRegenerateBackupCodesOptions,
} from './two-factor';

// Admin hooks
export {
  useFetchRoles,
  useFetchRole,
  useFetchPermissions,
  useFetchAdminUsers,
  useAssignUserRole,
  useRemoveUserRole,
  adminQueryKeys,
  type UseAssignUserRoleOptions,
  type UseRemoveUserRoleOptions,
} from './admin';

// Backward compatibility aliases
export { useFetchCurrentUser as useCurrentUser } from './auth';
export { useFetchTasks as useTasks, useFetchTask as useTask } from './tasks';
