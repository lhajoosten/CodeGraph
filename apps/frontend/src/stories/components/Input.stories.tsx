import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '@/components/ui/input';

const meta = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'error', 'success', 'luminous', 'luminousError', 'luminousSuccess'],
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
 * Default Input - Yellow theme
 */
export const Default: Story = {
  args: {
    variant: 'default',
    placeholder: 'Default input',
  },
};

/**
 * Luminous Input - Primary style with cyan focus
 */
export const Luminous: Story = {
  args: {
    variant: 'luminous',
    placeholder: 'Enter your email...',
    type: 'email',
  },
};

/**
 * Luminous Error Input
 */
export const LuminousError: Story = {
  args: {
    variant: 'luminousError',
    placeholder: 'Invalid input',
    defaultValue: 'invalid@',
  },
};

/**
 * Luminous Success Input
 */
export const LuminousSuccess: Story = {
  args: {
    variant: 'luminousSuccess',
    placeholder: 'Verified input',
    defaultValue: 'valid@example.com',
  },
};

/**
 * Error Input - Yellow theme
 */
export const Error: Story = {
  args: {
    variant: 'error',
    placeholder: 'Error input',
    value: 'invalid',
  },
};

/**
 * Success Input - Yellow theme
 */
export const Success: Story = {
  args: {
    variant: 'success',
    placeholder: 'Success input',
    value: 'valid',
  },
};

/**
 * Small Size
 */
export const Small: Story = {
  args: {
    variant: 'luminous',
    inputSize: 'sm',
    placeholder: 'Small input',
  },
};

/**
 * Large Size
 */
export const Large: Story = {
  args: {
    variant: 'luminous',
    inputSize: 'lg',
    placeholder: 'Large input',
  },
};

/**
 * Disabled State
 */
export const Disabled: Story = {
  args: {
    variant: 'luminous',
    placeholder: 'Disabled input',
    disabled: true,
  },
};

/**
 * Password Input
 */
export const Password: Story = {
  args: {
    variant: 'luminous',
    type: 'password',
    placeholder: 'Enter password',
  },
};

/**
 * Number Input
 */
export const Number: Story = {
  args: {
    variant: 'luminous',
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
        <label className="text-sm font-semibold text-text-secondary-lum">Email Address</label>
        <Input variant="luminous" type="email" placeholder="you@example.com" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-text-secondary-lum">Password</label>
        <Input variant="luminous" type="password" placeholder="Enter password" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-text-secondary-lum">Confirm Password</label>
        <Input variant="luminous" type="password" placeholder="Confirm password" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-text-secondary-lum">Error State</label>
        <Input variant="luminousError" placeholder="Invalid input" defaultValue="invalid value" />
        <p className="mt-1 text-xs text-error">This field is required</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-text-secondary-lum">Success State</label>
        <Input variant="luminousSuccess" placeholder="Verified" defaultValue="valid@example.com" />
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
        <h3 className="border-b border-border-steel pb-2 text-lg font-semibold text-text-primary-lum">
          Luminous Theme (New)
        </h3>
        <div className="space-y-3">
          <div>
            <label className="mb-2 block text-sm text-text-secondary-lum">Default</label>
            <Input variant="luminous" placeholder="Default state" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-text-secondary-lum">Error</label>
            <Input variant="luminousError" placeholder="Error state" defaultValue="invalid" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-text-secondary-lum">Success</label>
            <Input variant="luminousSuccess" placeholder="Success state" defaultValue="valid" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-text-secondary-lum">Disabled</label>
            <Input variant="luminous" placeholder="Disabled state" disabled />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="border-b border-border-steel pb-2 text-lg font-semibold text-text-primary-lum">
          Yellow Theme (Existing)
        </h3>
        <div className="space-y-3">
          <div>
            <label className="mb-2 block text-sm text-text-primary">Default</label>
            <Input variant="default" placeholder="Default state" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-text-primary">Error</label>
            <Input variant="error" placeholder="Error state" defaultValue="invalid" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-text-primary">Success</label>
            <Input variant="success" placeholder="Success state" defaultValue="valid" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-text-primary">Disabled</label>
            <Input variant="default" placeholder="Disabled state" disabled />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="border-b border-border-steel pb-2 text-lg font-semibold text-text-primary-lum">
          Size Variants
        </h3>
        <div className="space-y-3">
          <div>
            <label className="mb-2 block text-sm text-text-secondary-lum">Small</label>
            <Input variant="luminous" inputSize="sm" placeholder="Small input" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-text-secondary-lum">Default</label>
            <Input variant="luminous" inputSize="default" placeholder="Default input" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-text-secondary-lum">Large</label>
            <Input variant="luminous" inputSize="lg" placeholder="Large input" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="border-b border-border-steel pb-2 text-lg font-semibold text-text-primary-lum">
          Input Types
        </h3>
        <div className="space-y-3">
          <div>
            <label className="mb-2 block text-sm text-text-secondary-lum">Text</label>
            <Input variant="luminous" type="text" placeholder="Text input" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-text-secondary-lum">Email</label>
            <Input variant="luminous" type="email" placeholder="Email input" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-text-secondary-lum">Password</label>
            <Input variant="luminous" type="password" placeholder="Password input" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-text-secondary-lum">Number</label>
            <Input variant="luminous" type="number" placeholder="Number input" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-text-secondary-lum">Search</label>
            <Input variant="luminous" type="search" placeholder="Search input" />
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
        <label className="block text-sm font-semibold text-text-secondary-lum">Email Address</label>
        <Input variant="luminous" type="email" placeholder="you@example.com" />
        <p className="text-xs text-text-muted-lum">We&apos;ll never share your email.</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text-secondary-lum">Password</label>
        <Input variant="luminous" type="password" placeholder="Enter a strong password" />
        <p className="text-xs text-text-muted-lum">
          At least 8 characters with uppercase, lowercase, and numbers.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text-secondary-lum">
          Confirm Password
        </label>
        <Input variant="luminous" type="password" placeholder="Confirm your password" />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="agree" className="rounded border-border-steel" />
        <label htmlFor="agree" className="cursor-pointer text-sm text-text-secondary-lum">
          I agree to the Terms of Service
        </label>
      </div>
    </div>
  ),
};
