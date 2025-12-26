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
import { EnvelopeIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';

/**
 * Auth Layout - Wraps all auth pages
 */
const AuthLayoutMeta = {
  title: 'Components/Auth/Layout',
  component: AuthLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof AuthLayout>;

export default AuthLayoutMeta;
type LayoutStory = StoryObj<typeof AuthLayoutMeta>;

export const LayoutShowcase: LayoutStory = {
  args: {
    children: undefined,
  },
  render: () => (
    <AuthLayout>
      <AuthCard>
        <AuthHeader title="Sign In" subtitle="Welcome back to CodeGraph" />
        <p className="text-center text-sm text-text-secondary-lum">
          Auth page with gradient background and centered content
        </p>
      </AuthCard>
    </AuthLayout>
  ),
};

/**
 * Auth Card - Glass card container
 */
const AuthCardMeta = {
  title: 'Components/Auth/Card',
  component: AuthCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'luminous',
      values: [
        {
          name: 'luminous',
          value: '#070B16',
        },
      ],
    },
  },
} satisfies Meta<typeof AuthCard>;

export const CardDefault = (() => {
  const _meta = AuthCardMeta;
  type CardStory = StoryObj<typeof _meta>;

  const Default: CardStory = {
    args: {
      children: undefined,
    },
    render: () => (
      <div className="luminous-theme flex min-h-screen items-center justify-center">
        <AuthCard>
          <AuthHeader title="Sign In" subtitle="Enter your credentials" />
          <p className="text-sm text-text-secondary-lum">
            Glass card with backdrop blur effect and proper spacing
          </p>
        </AuthCard>
      </div>
    ),
  };

  return Default;
})();

/**
 * Auth Header - Logo, title, subtitle
 */
const AuthHeaderMeta = {
  title: 'Components/Auth/Header',
  component: AuthHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'luminous',
    },
  },
} satisfies Meta<typeof AuthHeader>;

export const HeaderDefault = (() => {
  const _meta = AuthHeaderMeta;
  type HeaderStory = StoryObj<typeof _meta>;

  const Default: HeaderStory = {
    args: {
      title: 'Sign In',
      subtitle: 'Welcome back to CodeGraph',
    },
    render: (args) => (
      <div className="luminous-theme min-w-96 rounded-lg bg-bg-primary-lum p-8">
        <AuthHeader {...args} />
      </div>
    ),
  };

  return Default;
})();

/**
 * Auth Input - Input with label and error handling
 */
const AuthInputMeta = {
  title: 'Components/Auth/Input',
  component: AuthInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'luminous',
    },
  },
} satisfies Meta<typeof AuthInput>;

export const InputDefault = (() => {
  const _meta = AuthInputMeta;
  type InputStory = StoryObj<typeof _meta>;

  const Default: InputStory = {
    args: {
      label: 'Email Address',
      placeholder: 'you@example.com',
      icon: EnvelopeIcon,
    },
    render: (args) => (
      <div className="luminous-theme min-w-96 rounded-lg bg-bg-primary-lum p-8">
        <AuthInput {...args} />
      </div>
    ),
  };

  return Default;
})();

export const InputWithError = (() => {
  const _meta = AuthInputMeta;
  type InputStory = StoryObj<typeof _meta>;

  const WithError: InputStory = {
    args: {
      label: 'Email Address',
      placeholder: 'you@example.com',
      icon: EnvelopeIcon,
      error: 'Please enter a valid email address',
      defaultValue: 'invalid@',
    },
    render: (args) => (
      <div className="luminous-theme min-w-96 rounded-lg bg-bg-primary-lum p-8">
        <AuthInput {...args} />
      </div>
    ),
  };

  return WithError;
})();

export const InputWithHelper = (() => {
  const _meta = AuthInputMeta;
  type InputStory = StoryObj<typeof _meta>;

  const WithHelper: InputStory = {
    args: {
      label: 'Password',
      placeholder: 'Enter a strong password',
      icon: LockClosedIcon,
      helperText: 'At least 8 characters with uppercase, lowercase, and numbers',
      type: 'password',
    },
    render: (args) => (
      <div className="luminous-theme min-w-96 rounded-lg bg-bg-primary-lum p-8">
        <AuthInput {...args} />
      </div>
    ),
  };

  return WithHelper;
})();

/**
 * OTP Input - 6-digit code input
 */
const OTPInputMeta = {
  title: 'Components/Auth/OTPInput',
  component: OTPInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'luminous',
    },
  },
} satisfies Meta<typeof OTPInput>;

export const OTPInputDefault = (() => {
  const _meta = OTPInputMeta;
  type OTPStory = StoryObj<typeof _meta>;

  const Default: OTPStory = {
    args: {
      length: 6,
      value: '',
      onChange: () => {},
    },
    render: () => {
      const OTPInputStory = () => {
        const [otp, setOtp] = useState('');

        return (
          <div className="luminous-theme min-w-96 rounded-lg bg-bg-primary-lum p-8">
            <OTPInput length={6} value={otp} onChange={setOtp} />
          </div>
        );
      };

      return <OTPInputStory />;
    },
  };

  return Default;
})();

/**
 * Password Strength Indicator
 */
const StrengthMeta = {
  title: 'Components/Auth/PasswordStrength',
  component: PasswordStrengthIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'luminous',
    },
  },
} satisfies Meta<typeof PasswordStrengthIndicator>;

export const StrengthWeak = (() => {
  const _meta = StrengthMeta;
  type StrengthStory = StoryObj<typeof _meta>;

  const Weak: StrengthStory = {
    args: {
      password: 'test',
      showLabel: true,
    },
    render: (args) => (
      <div className="luminous-theme min-w-96 rounded-lg bg-bg-primary-lum p-8">
        <PasswordStrengthIndicator {...args} />
      </div>
    ),
  };

  return Weak;
})();

export const StrengthMedium = (() => {
  const _meta = StrengthMeta;
  type StrengthStory = StoryObj<typeof _meta>;

  const Medium: StrengthStory = {
    args: {
      password: 'TestPassword',
      showLabel: true,
    },
    render: (args) => (
      <div className="luminous-theme min-w-96 rounded-lg bg-bg-primary-lum p-8">
        <PasswordStrengthIndicator {...args} />
      </div>
    ),
  };

  return Medium;
})();

export const StrengthStrong = (() => {
  const _meta = StrengthMeta;
  type StrengthStory = StoryObj<typeof _meta>;

  const Strong: StrengthStory = {
    args: {
      password: 'TestPassword123',
      showLabel: true,
    },
    render: (args) => (
      <div className="luminous-theme min-w-96 rounded-lg bg-bg-primary-lum p-8">
        <PasswordStrengthIndicator {...args} />
      </div>
    ),
  };

  return Strong;
})();

/**
 * OAuth Button
 */
const OAuthMeta = {
  title: 'Components/Auth/OAuthButton',
  component: OAuthButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'luminous',
    },
  },
} satisfies Meta<typeof OAuthButton>;

export const OAuthGitHub = (() => {
  const _meta = OAuthMeta;
  type OAuthStory = StoryObj<typeof _meta>;

  const GitHub: OAuthStory = {
    args: {
      provider: 'github',
    },
    render: (args) => (
      <div className="luminous-theme min-w-64 rounded-lg bg-bg-primary-lum p-8">
        <OAuthButton {...args} />
      </div>
    ),
  };

  return GitHub;
})();

export const OAuthGoogle = (() => {
  const _meta = OAuthMeta;
  type OAuthStory = StoryObj<typeof _meta>;

  const Google: OAuthStory = {
    args: {
      provider: 'google',
    },
    render: (args) => (
      <div className="luminous-theme min-w-64 rounded-lg bg-bg-primary-lum p-8">
        <OAuthButton {...args} />
      </div>
    ),
  };

  return Google;
})();

export const OAuthMicrosoft = (() => {
  const _meta = OAuthMeta;
  type OAuthStory = StoryObj<typeof _meta>;

  const Microsoft: OAuthStory = {
    args: {
      provider: 'microsoft',
    },
    render: (args) => (
      <div className="luminous-theme min-w-64 rounded-lg bg-bg-primary-lum p-8">
        <OAuthButton {...args} />
      </div>
    ),
  };

  return Microsoft;
})();

/**
 * Complete Form Example - All components together
 */
const CompleteFormMeta = {
  title: 'Components/Auth/CompleteForm',
  parameters: {
    layout: 'fullscreen',
  },
};

export const LoginFormExample = (() => {
  const _meta = CompleteFormMeta;
  type CompleteStory = StoryObj<typeof _meta>;

  const Example: CompleteStory = {
    render: () => {
      const LoginFormStory = () => {
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
                  error={emailError}
                />

                <AuthInput
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  icon={LockClosedIcon}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <div className="flex items-center justify-between text-sm">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" className="rounded border-border-steel" />
                    <span className="text-text-secondary-lum">Remember me</span>
                  </label>
                  <a href="#" className="text-brand-cyan hover:text-brand-teal">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-brand-cyan py-3 font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-shadow hover:shadow-[0_0_20px_rgba(34,211,238,0.6)]"
                >
                  Sign In
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-steel" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-bg-steel px-3 text-text-muted-lum">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <OAuthButton provider="github" />
                <OAuthButton provider="google" />
                <OAuthButton provider="microsoft" />
              </div>

              <p className="mt-6 text-center text-sm text-text-secondary-lum">
                Don&apos;t have an account?{' '}
                <a href="#" className="text-brand-cyan hover:text-brand-teal">
                  Sign up
                </a>
              </p>
            </AuthCard>
          </AuthLayout>
        );
      };

      return <LoginFormStory />;
    },
  };

  return Example;
})();

export const RegisterFormExample = (() => {
  const _meta = CompleteFormMeta;
  type CompleteStory = StoryObj<typeof _meta>;

  const Example: CompleteStory = {
    render: () => {
      const RegisterFormStory = () => {
        const [formData, setFormData] = useState({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
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
                />

                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" className="rounded border-border-steel" />
                  <span className="text-sm text-text-secondary-lum">
                    I agree to the{' '}
                    <a href="#" className="text-brand-cyan hover:text-brand-teal">
                      Terms of Service
                    </a>
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-brand-cyan py-3 font-semibold text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-shadow hover:shadow-[0_0_20px_rgba(34,211,238,0.6)]"
                >
                  Create Account
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-text-secondary-lum">
                Already have an account?{' '}
                <a href="#" className="text-brand-cyan hover:text-brand-teal">
                  Sign in
                </a>
              </p>
            </AuthCard>
          </AuthLayout>
        );
      };

      return <RegisterFormStory />;
    },
  };

  return Example;
})();
