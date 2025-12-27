/**
 * Two-Factor mutation hooks.
 * Handles 2FA disable and backup code operations.
 */

export { useDisableTwoFactor, type UseDisableTwoFactorOptions } from './use-disable-two-factor';
export {
  useRegenerateBackupCodes,
  type UseRegenerateBackupCodesOptions,
} from './use-regenerate-backup-codes';
