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
        'secondary',
        'ghost',
        'destructive',
        'outline',
        'link',
        'success',
        'warning',
        'info',
        'luminous',
        'luminousGhost',
        'luminousSecondary',
        'luminousDanger',
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
 * Default Button - Yellow/Gold theme
 */
export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Default Button',
  },
};

/**
 * Primary Luminous Button - Cyan with glow
 */
export const Luminous: Story = {
  args: {
    variant: 'luminous',
    children: 'Sign In',
  },
};

/**
 * Luminous Ghost Button - Teal border with glow
 */
export const LuminousGhost: Story = {
  args: {
    variant: 'luminousGhost',
    children: 'Sign Up',
  },
};

/**
 * Luminous Secondary Button - Elevated background
 */
export const LuminousSecondary: Story = {
  args: {
    variant: 'luminousSecondary',
    children: 'Cancel',
  },
};

/**
 * Luminous Danger Button - Red with error glow
 */
export const LuminousDanger: Story = {
  args: {
    variant: 'luminousDanger',
    children: 'Delete Account',
  },
};

/**
 * Secondary Button - Yellow theme
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

/**
 * Outline Button - Yellow theme
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
};

/**
 * Ghost Button - Yellow theme
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost',
  },
};

/**
 * Success Button
 */
export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Confirm',
  },
};

/**
 * Warning Button
 */
export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Caution',
  },
};

/**
 * Destructive Button
 */
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
};

/**
 * Link Button
 */
export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Forgot password?',
  },
};

/**
 * Info Button
 */
export const Info: Story = {
  args: {
    variant: 'info',
    children: 'Learn More',
  },
};

/**
 * Small Size
 */
export const Small: Story = {
  args: {
    variant: 'luminous',
    size: 'sm',
    children: 'Small Button',
  },
};

/**
 * Large Size
 */
export const Large: Story = {
  args: {
    variant: 'luminous',
    size: 'lg',
    children: 'Large Button',
  },
};

/**
 * Extra Large Size
 */
export const ExtraLarge: Story = {
  args: {
    variant: 'luminous',
    size: 'xl',
    children: 'Extra Large Button',
  },
};

/**
 * Full Width Button
 */
export const FullWidth: Story = {
  args: {
    variant: 'luminous',
    fullWidth: true,
    children: 'Full Width Button',
  },
};

/**
 * Disabled State
 */
export const Disabled: Story = {
  args: {
    variant: 'luminous',
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
        <p className="font-semibold text-text-secondary-lum">Primary Action</p>
        <Button variant="luminous">Sign In</Button>
      </div>

      <div className="space-y-3">
        <p className="font-semibold text-text-secondary-lum">Secondary Action</p>
        <Button variant="luminousSecondary">Cancel</Button>
      </div>

      <div className="space-y-3">
        <p className="font-semibold text-text-secondary-lum">Ghost / Outline</p>
        <Button variant="luminousGhost">Learn More</Button>
      </div>

      <div className="space-y-3">
        <p className="font-semibold text-text-secondary-lum">Danger</p>
        <Button variant="luminousDanger">Delete</Button>
      </div>

      <div className="space-y-3">
        <p className="font-semibold text-text-secondary-lum">Size Variants</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="luminous" size="sm">
            Small
          </Button>
          <Button variant="luminous" size="default">
            Default
          </Button>
          <Button variant="luminous" size="lg">
            Large
          </Button>
          <Button variant="luminous" size="xl">
            X-Large
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="font-semibold text-text-secondary-lum">States</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="luminous">Normal</Button>
          <Button variant="luminous" disabled>
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
        <h3 className="border-b border-border-steel pb-2 text-lg font-semibold text-text-primary-lum">
          Luminous Theme (New)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Button variant="luminous">Luminous Primary</Button>
          <Button variant="luminousGhost">Luminous Ghost</Button>
          <Button variant="luminousSecondary">Luminous Secondary</Button>
          <Button variant="luminousDanger">Luminous Danger</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="border-b border-border-steel pb-2 text-lg font-semibold text-text-primary-lum">
          Yellow Theme (Existing)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="info">Info</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="border-b border-border-steel pb-2 text-lg font-semibold text-text-primary-lum">
          Size Variants
        </h3>
        <div className="space-y-3">
          <Button variant="luminous" size="sm">
            Small
          </Button>
          <Button variant="luminous" size="default">
            Default
          </Button>
          <Button variant="luminous" size="lg">
            Large
          </Button>
          <Button variant="luminous" size="xl">
            X-Large
          </Button>
        </div>
      </section>
    </div>
  ),
};
