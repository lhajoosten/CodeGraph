import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  AuthLayout,
  AuthCard,
  AuthHeader,
  AuthInput,
  OTPInput,
  PasswordStrengthIndicator,
  OAuthButton,
} from '@/components/auth';
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const meta = {
  title: 'Compositions/Auth Flows',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;

/**
 * Complete Login Flow
 */
export const LoginFlow: StoryObj = {
  render: () => {
    const LoginFlowStory = () => {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [emailError, setEmailError] = useState('');

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.includes('@')) {
          setEmailError('Please enter a valid email');
        }
      };

      return (
        <AuthLayout>
          <AuthCard>
            <AuthHeader title="Sign In" subtitle="Welcome back to CodeGraph" />

            <form onSubmit={handleSubmit} className="space-y-4">
              <AuthInput
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                icon={EnvelopeIcon}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                autoComplete="email"
                error={emailError}
              />

              <AuthInput
                label="Password"
                type="password"
                placeholder="Enter your password"
                icon={LockClosedIcon}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" className="border-border-steel rounded" />
                  <span className="text-text-secondary-lum">Remember me</span>
                </label>
                <a href="#" className="hover:text-brand-teal text-brand-cyan transition-colors">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-brand-cyan py-3 font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:opacity-90"
              >
                Sign In
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="border-border-steel w-full border-t" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-bg-steel text-text-muted-lum px-3">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <OAuthButton provider="github" />
              <OAuthButton provider="google" />
              <OAuthButton provider="microsoft" />
            </div>

            <p className="text-text-secondary-lum mt-6 text-center text-sm">
              Don&apos;t have an account?{' '}
              <a href="#" className="hover:text-brand-teal text-brand-cyan transition-colors">
                Sign up
              </a>
            </p>
          </AuthCard>
        </AuthLayout>
      );
    };

    return <LoginFlowStory />;
  },
};

/**
 * Complete Registration Flow
 */
export const RegisterFlow: StoryObj = {
  render: () => {
    const RegisterFlowStory = () => {
      const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false,
      });

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission
      };

      return (
        <AuthLayout>
          <AuthCard>
            <AuthHeader title="Create Account" subtitle="Start building with CodeGraph" />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <AuthInput
                  label="First Name"
                  placeholder="John"
                  icon={UserIcon}
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      firstName: e.target.value,
                    })
                  }
                />
                <AuthInput
                  label="Last Name"
                  placeholder="Doe"
                  icon={UserIcon}
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lastName: e.target.value,
                    })
                  }
                />
              </div>

              <AuthInput
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                icon={EnvelopeIcon}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                helperText="We'll never share your email"
                autoComplete="email"
              />

              <div className="space-y-2">
                <AuthInput
                  label="Password"
                  type="password"
                  placeholder="Create a strong password"
                  icon={LockClosedIcon}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password: e.target.value,
                    })
                  }
                  autoComplete="new-password"
                />
                <PasswordStrengthIndicator password={formData.password} showLabel />
              </div>

              <AuthInput
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                icon={LockClosedIcon}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    confirmPassword: e.target.value,
                  })
                }
                autoComplete="new-password"
              />

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="border-border-steel rounded"
                  checked={formData.acceptTerms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      acceptTerms: e.target.checked,
                    })
                  }
                />
                <span className="text-text-secondary-lum text-sm">
                  I agree to the{' '}
                  <a href="#" className="hover:text-brand-teal text-brand-cyan">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="hover:text-brand-teal text-brand-cyan">
                    Privacy Policy
                  </a>
                </span>
              </label>

              <button
                type="submit"
                className="w-full rounded-lg bg-brand-cyan py-3 font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:opacity-90"
              >
                Create Account
              </button>
            </form>

            <p className="text-text-secondary-lum mt-6 text-center text-sm">
              Already have an account?{' '}
              <a href="#" className="hover:text-brand-teal text-brand-cyan transition-colors">
                Sign in
              </a>
            </p>
          </AuthCard>
        </AuthLayout>
      );
    };

    return <RegisterFlowStory />;
  },
};

/**
 * 2FA Setup Flow - Multi-step
 */
export const Setup2FAFlow: StoryObj = {
  render: () => {
    const Setup2FAFlowStory = () => {
      const [step, setStep] = useState<'qr' | 'verify' | 'backup'>('qr');
      const [otp, setOtp] = useState('');
      const [codesConfirmed, setCodesConfirmed] = useState(false);

      const backupCodes = [
        'A1B2C3D4E5F6',
        'G7H8I9J0K1L2',
        'M3N4O5P6Q7R8',
        'S9T0U1V2W3X4',
        'Y5Z6A7B8C9D0',
        'E1F2G3H4I5J6',
        'K7L8M9N0O1P2',
        'Q3R4S5T6U7V8',
      ];

      return (
        <AuthLayout>
          <AuthCard>
            <AuthHeader
              title="Set Up Two-Factor Authentication"
              subtitle={
                step === 'qr'
                  ? 'Step 1 of 3: Scan QR Code'
                  : step === 'verify'
                    ? 'Step 2 of 3: Verify Code'
                    : 'Step 3 of 3: Save Backup Codes'
              }
            />

            {step === 'qr' && (
              <div className="space-y-4">
                <div className="flex justify-center rounded-lg bg-white p-4">
                  <div className="flex h-32 w-32 items-center justify-center bg-gray-200 text-sm text-gray-600">
                    QR Code
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-text-secondary-lum text-sm">Or enter this key manually:</p>
                  <div className="bg-bg-steel text-text-primary-lum rounded-lg p-3 font-mono text-sm break-all">
                    JBSWY3DPEBLW64TMMQQ======
                  </div>
                </div>

                <button
                  onClick={() => setStep('verify')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-cyan py-3 font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:opacity-90"
                >
                  Continue
                  <ArrowRightIcon className="h-[18px] w-[18px]" />
                </button>
              </div>
            )}

            {step === 'verify' && (
              <div className="space-y-4">
                <OTPInput length={6} value={otp} onChange={setOtp} />

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setStep('qr');
                      setOtp('');
                    }}
                    className="border-border-steel bg-bg-elevated-lum text-text-primary-lum flex-1 rounded-lg border py-3 font-semibold transition-all hover:bg-bg-steel"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('backup')}
                    disabled={otp.length !== 6}
                    className="flex-1 rounded-lg bg-brand-cyan py-3 font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Verify
                  </button>
                </div>
              </div>
            )}

            {step === 'backup' && (
              <div className="space-y-4">
                <div className="border-warning/30 bg-warning/10 rounded-lg border p-3">
                  <p className="text-warning text-sm">
                    ⚠️ Save these codes in a safe place. You&apos;ll need them if you lose access to
                    your authenticator app.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="bg-bg-steel text-text-primary-lum flex items-center justify-between rounded-lg p-3 font-mono text-sm"
                    >
                      <span>{code}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(code);
                        }}
                        className="hover:text-brand-teal text-xs text-brand-cyan"
                      >
                        Copy
                      </button>
                    </div>
                  ))}
                </div>

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={codesConfirmed}
                    onChange={(e) => setCodesConfirmed(e.target.checked)}
                    className="border-border-steel rounded"
                  />
                  <span className="text-text-secondary-lum text-sm">
                    I have saved my backup codes in a safe place
                  </span>
                </label>

                <button
                  disabled={!codesConfirmed}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-cyan py-3 font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-[18px] w-[18px]" />
                  Complete Setup
                </button>
              </div>
            )}
          </AuthCard>
        </AuthLayout>
      );
    };

    return <Setup2FAFlowStory />;
  },
};

/**
 * Verify 2FA Flow
 */
export const Verify2FAFlow: StoryObj = {
  render: () => {
    const Verify2FAFlowStory = () => {
      const [otp, setOtp] = useState('');
      const [useBackupCode, setUseBackupCode] = useState(false);
      const [backupCode, setBackupCode] = useState('');

      return (
        <AuthLayout>
          <AuthCard>
            <AuthHeader title="Two-Factor Authentication" subtitle="Enter your verification code" />

            <div className="space-y-4">
              {!useBackupCode ? (
                <>
                  <OTPInput length={6} value={otp} onChange={setOtp} />

                  <button
                    onClick={() => setUseBackupCode(true)}
                    className="text-text-secondary-lum w-full text-sm transition-colors hover:text-brand-cyan"
                  >
                    Use backup code instead
                  </button>
                </>
              ) : (
                <>
                  <AuthInput
                    label="Backup Code"
                    placeholder="Enter an 8-character backup code"
                    value={backupCode}
                    onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                  />

                  <button
                    onClick={() => setUseBackupCode(false)}
                    className="text-text-secondary-lum w-full text-sm transition-colors hover:text-brand-cyan"
                  >
                    Use authenticator app instead
                  </button>
                </>
              )}

              <button
                className="w-full rounded-lg bg-brand-cyan py-3 font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:opacity-90"
                disabled={!useBackupCode ? otp.length !== 6 : backupCode.length < 8}
              >
                Verify
              </button>
            </div>
          </AuthCard>
        </AuthLayout>
      );
    };

    return <Verify2FAFlowStory />;
  },
};

/**
 * Forgot Password Flow
 */
export const ForgotPasswordFlow: StoryObj = {
  render: () => {
    const ForgotPasswordFlowStory = () => {
      const [email, setEmail] = useState('');
      const [submitted, setSubmitted] = useState(false);

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
      };

      return (
        <AuthLayout>
          <AuthCard>
            <AuthHeader
              title={submitted ? 'Check Your Email' : 'Forgot Password?'}
              subtitle={
                submitted
                  ? `We&apos;ve sent a password reset link to ${email}`
                  : 'Enter your email address and we&apos;ll send you a link to reset your password'
              }
            />

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <AuthInput
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  icon={EnvelopeIcon}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />

                <button
                  type="submit"
                  className="w-full rounded-lg bg-brand-cyan py-3 font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:opacity-90"
                >
                  Send Reset Link
                </button>

                <p className="text-text-secondary-lum text-center text-sm">
                  Remember your password?{' '}
                  <a href="#" className="hover:text-brand-teal text-brand-cyan">
                    Sign in
                  </a>
                </p>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <CheckCircleIcon className="h-12 w-12 text-brand-lime" />
                </div>

                <p className="text-text-secondary-lum text-center">
                  Check your email for the password reset link. If you don&apos;t see it, check your
                  spam folder.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setEmail('');
                    }}
                    className="border-border-steel bg-bg-elevated-lum text-text-primary-lum flex-1 rounded-lg border py-3 font-semibold transition-all hover:bg-bg-steel"
                  >
                    Try Another Email
                  </button>
                  <a
                    href="#"
                    className="flex-1 rounded-lg bg-brand-cyan py-3 text-center font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:opacity-90"
                  >
                    Back to Login
                  </a>
                </div>
              </div>
            )}
          </AuthCard>
        </AuthLayout>
      );
    };

    return <ForgotPasswordFlowStory />;
  },
};

/**
 * Reset Password Flow
 */
export const ResetPasswordFlow: StoryObj = {
  render: () => {
    const ResetPasswordFlowStory = () => {
      const [password, setPassword] = useState('');
      const [confirmPassword, setConfirmPassword] = useState('');
      const [submitted, setSubmitted] = useState(false);

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === confirmPassword && password.length >= 8) {
          setSubmitted(true);
        }
      };

      return (
        <AuthLayout>
          <AuthCard>
            <AuthHeader
              title={submitted ? 'Password Reset' : 'Reset Your Password'}
              subtitle={
                submitted ? 'Your password has been reset successfully' : 'Enter your new password'
              }
            />

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <AuthInput
                    label="New Password"
                    type="password"
                    placeholder="Create a strong password"
                    icon={LockClosedIcon}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <PasswordStrengthIndicator password={password} showLabel />
                </div>

                <AuthInput
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm your password"
                  icon={LockClosedIcon}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={
                    confirmPassword && password !== confirmPassword
                      ? 'Passwords do not match'
                      : undefined
                  }
                  autoComplete="new-password"
                />

                <button
                  type="submit"
                  disabled={password !== confirmPassword}
                  className="w-full rounded-lg bg-brand-cyan py-3 font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reset Password
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <CheckCircleIcon className="h-12 w-12 text-brand-lime" />
                </div>

                <p className="text-text-secondary-lum text-center">
                  Your password has been reset. You can now sign in with your new password.
                </p>

                <a
                  href="#"
                  className="block w-full rounded-lg bg-brand-cyan py-3 text-center font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:opacity-90"
                >
                  Back to Login
                </a>
              </div>
            )}
          </AuthCard>
        </AuthLayout>
      );
    };

    return <ResetPasswordFlowStory />;
  },
};
