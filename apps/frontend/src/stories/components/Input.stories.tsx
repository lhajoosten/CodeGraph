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
        <label className="text-text-secondary text-sm font-semibold">Email Address</label>
        <Input variant="default" type="email" placeholder="you@example.com" autoComplete="email" />
      </div>

      <div className="space-y-2">
        <label className="text-text-secondary text-sm font-semibold">Password</label>
        <Input
          variant="default"
          type="password"
          placeholder="Enter password"
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-2">
        <label className="text-text-secondary text-sm font-semibold">Confirm Password</label>
        <Input
          variant="default"
          type="password"
          placeholder="Confirm password"
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-2">
        <label className="text-text-secondary text-sm font-semibold">Error State</label>
        <Input variant="error" placeholder="Invalid input" defaultValue="invalid value" />
        <p className="text-error mt-1 text-xs">This field is required</p>
      </div>

      <div className="space-y-2">
        <label className="text-text-secondary text-sm font-semibold">Success State</label>
        <Input variant="success" placeholder="Verified" defaultValue="valid@example.com" />
        <p className="text-success mt-1 text-xs">Email verified</p>
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
        <h3 className="border-border-primary text-text-primary border-b pb-2 text-lg font-semibold">
          Luminous Theme - States
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-text-secondary mb-2 block text-sm">Default</label>
            <Input variant="default" placeholder="Default state" />
          </div>
          <div>
            <label className="text-text-secondary mb-2 block text-sm">Error</label>
            <Input variant="error" placeholder="Error state" defaultValue="invalid" />
          </div>
          <div>
            <label className="text-text-secondary mb-2 block text-sm">Success</label>
            <Input variant="success" placeholder="Success state" defaultValue="valid" />
          </div>
          <div>
            <label className="text-text-secondary mb-2 block text-sm">Disabled</label>
            <Input variant="default" placeholder="Disabled state" disabled />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="border-border-primary text-text-primary border-b pb-2 text-lg font-semibold">
          Size Variants
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-text-secondary mb-2 block text-sm">Small</label>
            <Input variant="default" inputSize="sm" placeholder="Small input" />
          </div>
          <div>
            <label className="text-text-secondary mb-2 block text-sm">Default</label>
            <Input variant="default" inputSize="default" placeholder="Default input" />
          </div>
          <div>
            <label className="text-text-secondary mb-2 block text-sm">Large</label>
            <Input variant="default" inputSize="lg" placeholder="Large input" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="border-border-primary text-text-primary border-b pb-2 text-lg font-semibold">
          Input Types
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-text-secondary mb-2 block text-sm">Text</label>
            <Input variant="default" type="text" placeholder="Text input" />
          </div>
          <div>
            <label className="text-text-secondary mb-2 block text-sm">Email</label>
            <Input variant="default" type="email" placeholder="Email input" autoComplete="email" />
          </div>
          <div>
            <label className="text-text-secondary mb-2 block text-sm">Password</label>
            <Input
              variant="default"
              type="password"
              placeholder="Password input"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="text-text-secondary mb-2 block text-sm">Number</label>
            <Input variant="default" type="number" placeholder="Number input" />
          </div>
          <div>
            <label className="text-text-secondary mb-2 block text-sm">Search</label>
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
        <label className="text-text-secondary block text-sm font-semibold">Email Address</label>
        <Input variant="default" type="email" placeholder="you@example.com" autoComplete="email" />
        <p className="text-text-muted text-xs">We&apos;ll never share your email.</p>
      </div>

      <div className="space-y-2">
        <label className="text-text-secondary block text-sm font-semibold">Password</label>
        <Input
          variant="default"
          type="password"
          placeholder="Enter a strong password"
          autoComplete="new-password"
        />
        <p className="text-text-muted text-xs">
          At least 8 characters with uppercase, lowercase, and numbers.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-text-secondary block text-sm font-semibold">
          Confirm Password
        </label>
        <Input
          variant="default"
          type="password"
          placeholder="Confirm your password"
          autoComplete="new-password"
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="agree" className="border-border-primary rounded" />
        <label htmlFor="agree" className="text-text-secondary cursor-pointer text-sm">
          I agree to the Terms of Service
        </label>
      </div>
    </div>
  ),
};
