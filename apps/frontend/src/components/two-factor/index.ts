/**
 * Two-Factor Authentication Components
 *
 * Reusable 2FA components used across the application:
 * - Setup wizard (multi-step 2FA setup)
 * - Verification (verify TOTP/backup code during login)
 */

export { TwoFactorSetupWizard } from './setup-wizard';
export type { SetupWizardProps as TwoFactorSetupWizardProps } from './setup-wizard';
