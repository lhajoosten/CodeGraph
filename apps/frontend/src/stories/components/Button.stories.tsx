import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/button';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
        'success',
        'warning',
        'info',
      ],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'xl', 'icon', 'icon-sm', 'icon-lg'],
    },
    disabled: {
      control: 'boolean',
    },
    fullWidth: {
      control: 'boolean',
    },
  },
  args: {
    children: 'Click me',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default Button - Primary Luminous style with cyan glow
 */
export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Sign In',
  },
};

/**
 * Secondary Button - Elevated background
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Cancel',
  },
};

/**
 * Ghost Button - Teal border with glow
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Learn More',
  },
};

/**
 * Outline Button - Border style
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Sign Up',
  },
};

/**
 * Destructive Button - Red with error glow
 */
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete Account',
  },
};

/**
 * Success Button - Green confirmation
 */
export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Confirm',
  },
};

/**
 * Warning Button - Orange caution
 */
export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Caution',
  },
};

/**
 * Info Button - Blue informational
 */
export const Info: Story = {
  args: {
    variant: 'info',
    children: 'Learn More',
  },
};

/**
 * Link Button - Text link style
 */
export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Forgot password?',
  },
};

/**
 * Small Size
 */
export const Small: Story = {
  args: {
    variant: 'default',
    size: 'sm',
    children: 'Small Button',
  },
};

/**
 * Large Size
 */
export const Large: Story = {
  args: {
    variant: 'default',
    size: 'lg',
    children: 'Large Button',
  },
};

/**
 * Extra Large Size
 */
export const ExtraLarge: Story = {
  args: {
    variant: 'default',
    size: 'xl',
    children: 'Extra Large Button',
  },
};

/**
 * Full Width Button
 */
export const FullWidth: Story = {
  args: {
    variant: 'default',
    fullWidth: true,
    children: 'Full Width Button',
  },
};

/**
 * Disabled State
 */
export const Disabled: Story = {
  args: {
    variant: 'default',
    disabled: true,
    children: 'Disabled Button',
  },
};

/**
 * Button Group - All Luminous Variants
 */
export const LuminousVariantsShowcase: Story = {
  render: () => (
    <div className="w-full max-w-2xl space-y-6">
      <div className="space-y-3">
        <p className="text-text-secondary font-semibold">Primary Action</p>
        <Button variant="default">Sign In</Button>
      </div>

      <div className="space-y-3">
        <p className="text-text-secondary font-semibold">Secondary Action</p>
        <Button variant="secondary">Cancel</Button>
      </div>

      <div className="space-y-3">
        <p className="text-text-secondary font-semibold">Ghost / Outline</p>
        <Button variant="ghost">Learn More</Button>
      </div>

      <div className="space-y-3">
        <p className="text-text-secondary font-semibold">Destructive</p>
        <Button variant="destructive">Delete</Button>
      </div>

      <div className="space-y-3">
        <p className="text-text-secondary font-semibold">Size Variants</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="default" size="sm">
            Small
          </Button>
          <Button variant="default" size="default">
            Default
          </Button>
          <Button variant="default" size="lg">
            Large
          </Button>
          <Button variant="default" size="xl">
            X-Large
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-text-secondary font-semibold">States</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="default">Normal</Button>
          <Button variant="default" disabled>
            Disabled
          </Button>
        </div>
      </div>
    </div>
  ),
};

/**
 * All Variants Comparison
 */
export const AllVariants: Story = {
  render: () => (
    <div className="w-full max-w-4xl space-y-12">
      <section className="space-y-4">
        <h3 className="border-border-primary text-text-primary border-b pb-2 text-lg font-semibold">
          Luminous Theme Variants
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Button variant="default">Default (Primary)</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="link">Link</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="info">Info</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="border-border-primary text-text-primary border-b pb-2 text-lg font-semibold">
          Size Variants
        </h3>
        <div className="space-y-3">
          <Button variant="default" size="sm">
            Small
          </Button>
          <Button variant="default" size="default">
            Default
          </Button>
          <Button variant="default" size="lg">
            Large
          </Button>
          <Button variant="default" size="xl">
            X-Large
          </Button>
        </div>
      </section>
    </div>
  ),
};
