import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '@/components/ui/input';

const meta = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'error', 'success'],
    },
    inputSize: {
      control: 'select',
      options: ['default', 'sm', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
    type: {
      control: 'text',
    },
  },
  args: {
    placeholder: 'Enter text...',
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default Input - Luminous style with cyan focus
 */
export const Default: Story = {
  args: {
    variant: 'default',
    placeholder: 'Enter your email...',
    type: 'email',
  },
};

/**
 * Error Input - Luminous error state
 */
export const Error: Story = {
  args: {
    variant: 'error',
    placeholder: 'Invalid input',
    defaultValue: 'invalid@',
  },
};

/**
 * Success Input - Luminous success state
 */
export const Success: Story = {
  args: {
    variant: 'success',
    placeholder: 'Verified input',
    defaultValue: 'valid@example.com',
  },
};

/**
 * Small Size
 */
export const Small: Story = {
  args: {
    variant: 'default',
    inputSize: 'sm',
    placeholder: 'Small input',
  },
};

/**
 * Large Size
 */
export const Large: Story = {
  args: {
    variant: 'default',
    inputSize: 'lg',
    placeholder: 'Large input',
  },
};

/**
 * Disabled State
 */
export const Disabled: Story = {
  args: {
    variant: 'default',
    placeholder: 'Disabled input',
    disabled: true,
  },
};

/**
 * Password Input
 */
export const Password: Story = {
  args: {
    variant: 'default',
    type: 'password',
    placeholder: 'Enter password',
  },
};

/**
 * Number Input
 */
export const Number: Story = {
  args: {
    variant: 'default',
    type: 'number',
    placeholder: 'Enter number',
  },
};

/**
 * All Luminous Variants
 */
export const LuminousVariantsShowcase: Story = {
  render: () => (
    <div className="w-full max-w-2xl space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-text-secondary">Email Address</label>
        <Input variant="default" type="email" placeholder="you@example.com" autoComplete="email" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-text-secondary">Password</label>
        <Input
          variant="default"
          type="password"
          placeholder="Enter password"
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-text-secondary">Confirm Password</label>
        <Input
          variant="default"
          type="password"
          placeholder="Confirm password"
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-text-secondary">Error State</label>
        <Input variant="error" placeholder="Invalid input" defaultValue="invalid value" />
        <p className="mt-1 text-xs text-error">This field is required</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-text-secondary">Success State</label>
        <Input variant="success" placeholder="Verified" defaultValue="valid@example.com" />
        <p className="mt-1 text-xs text-success">Email verified</p>
      </div>
    </div>
  ),
};

/**
 * Input States Comparison
 */
export const AllStates: Story = {
  render: () => (
    <div className="w-full max-w-2xl space-y-12">
      <section className="space-y-4">
        <h3 className="border-b border-border-primary pb-2 text-lg font-semibold text-text-primary">
          Luminous Theme - States
        </h3>
        <div className="space-y-3">
          <div>
            <label className="mb-2 block text-sm text-text-secondary">Default</label>
            <Input variant="default" placeholder="Default state" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-text-secondary">Error</label>
            <Input variant="error" placeholder="Error state" defaultValue="invalid" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-text-secondary">Success</label>
            <Input variant="success" placeholder="Success state" defaultValue="valid" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-text-secondary">Disabled</label>
            <Input variant="default" placeholder="Disabled state" disabled />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="border-b border-border-primary pb-2 text-lg font-semibold text-text-primary">
          Size Variants
        </h3>
        <div className="space-y-3">
          <div>
            <label className="mb-2 block text-sm text-text-secondary">Small</label>
            <Input variant="default" inputSize="sm" placeholder="Small input" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-text-secondary">Default</label>
            <Input variant="default" inputSize="default" placeholder="Default input" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-text-secondary">Large</label>
            <Input variant="default" inputSize="lg" placeholder="Large input" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="border-b border-border-primary pb-2 text-lg font-semibold text-text-primary">
          Input Types
        </h3>
        <div className="space-y-3">
          <div>
            <label className="mb-2 block text-sm text-text-secondary">Text</label>
            <Input variant="default" type="text" placeholder="Text input" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-text-secondary">Email</label>
            <Input variant="default" type="email" placeholder="Email input" autoComplete="email" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-text-secondary">Password</label>
            <Input
              variant="default"
              type="password"
              placeholder="Password input"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-text-secondary">Number</label>
            <Input variant="default" type="number" placeholder="Number input" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-text-secondary">Search</label>
            <Input variant="default" type="search" placeholder="Search input" />
          </div>
        </div>
      </section>
    </div>
  ),
};

/**
 * Form-like Layout
 */
export const FormLayout: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text-secondary">Email Address</label>
        <Input variant="default" type="email" placeholder="you@example.com" autoComplete="email" />
        <p className="text-xs text-text-muted">We&apos;ll never share your email.</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text-secondary">Password</label>
        <Input
          variant="default"
          type="password"
          placeholder="Enter a strong password"
          autoComplete="new-password"
        />
        <p className="text-xs text-text-muted">
          At least 8 characters with uppercase, lowercase, and numbers.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text-secondary">Confirm Password</label>
        <Input
          variant="default"
          type="password"
          placeholder="Confirm your password"
          autoComplete="new-password"
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="agree" className="rounded border-border-primary" />
        <label htmlFor="agree" className="cursor-pointer text-sm text-text-secondary">
          I agree to the Terms of Service
        </label>
      </div>
    </div>
  ),
};
