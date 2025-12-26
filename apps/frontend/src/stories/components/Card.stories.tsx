import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '@/components/ui/card';

const meta = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'elevated',
        'ghost',
        'primary',
        'luminous',
        'luminousGlass',
        'luminousElevated',
      ],
    },
    padding: {
      control: 'select',
      options: ['default', 'none', 'sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default Card - Yellow theme with border
 */
export const Default: Story = {
  args: {
    variant: 'default',
    padding: 'md',
    children: (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Default Card</h3>
        <p className="text-sm">Standard card with border</p>
      </div>
    ),
  },
};

/**
 * Luminous Card - Steel background with glass border
 */
export const Luminous: Story = {
  args: {
    variant: 'luminous',
    padding: 'md',
    children: (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-text-primary-lum">Luminous Card</h3>
        <p className="text-sm text-text-secondary-lum">Steel background with glass border effect</p>
      </div>
    ),
  },
};

/**
 * Luminous Glass Card - Transparent with backdrop blur
 */
export const LuminousGlass: Story = {
  args: {
    variant: 'luminousGlass',
    padding: 'md',
    children: (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-text-primary-lum">Luminous Glass Card</h3>
        <p className="text-sm text-text-secondary-lum">Transparent with 12px backdrop blur</p>
      </div>
    ),
  },
};

/**
 * Luminous Elevated Card - Steel with strong shadow
 */
export const LuminousElevated: Story = {
  args: {
    variant: 'luminousElevated',
    padding: 'md',
    children: (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-text-primary-lum">Luminous Elevated Card</h3>
        <p className="text-sm text-text-secondary-lum">Steel background with elevated shadow</p>
      </div>
    ),
  },
};

/**
 * Elevated Card - Yellow theme with shadow
 */
export const Elevated: Story = {
  args: {
    variant: 'elevated',
    padding: 'md',
    children: (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Elevated Card</h3>
        <p className="text-sm">Card with shadow effect</p>
      </div>
    ),
  },
};

/**
 * Ghost Card - Transparent background
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    padding: 'md',
    children: (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Ghost Card</h3>
        <p className="text-sm">Transparent background</p>
      </div>
    ),
  },
};

/**
 * Primary Card - Yellow theme with primary background
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    padding: 'md',
    children: (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Primary Card</h3>
        <p className="text-sm">Card with primary background</p>
      </div>
    ),
  },
};

/**
 * Small Padding
 */
export const SmallPadding: Story = {
  args: {
    variant: 'luminous',
    padding: 'sm',
    children: (
      <div>
        <p className="text-text-primary-lum">Small padding (4px)</p>
      </div>
    ),
  },
};

/**
 * Large Padding
 */
export const LargePadding: Story = {
  args: {
    variant: 'luminous',
    padding: 'lg',
    children: (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-text-primary-lum">Large Padding</h3>
        <p className="text-text-secondary-lum">Card with generous padding (32px)</p>
      </div>
    ),
  },
};

/**
 * No Padding
 */
export const NoPadding: Story = {
  args: {
    variant: 'luminous',
    padding: 'none',
    children: (
      <div className="rounded-t-lg bg-bg-primary-lum p-4">
        <p className="text-text-primary-lum">No padding - content touches edges</p>
      </div>
    ),
  },
};

/**
 * Card with Header and Footer
 */
export const WithHeaderFooter: Story = {
  args: {
    variant: 'luminous',
    padding: 'none',
    children: (
      <div className="flex flex-col">
        <div className="border-b border-border-steel px-6 py-4">
          <h3 className="text-lg font-semibold text-text-primary-lum">Card Header</h3>
        </div>
        <div className="flex-1 px-6 py-4">
          <p className="text-text-secondary-lum">
            This is the main content area. The card automatically adjusts to fit the content.
          </p>
        </div>
        <div className="border-t border-border-steel bg-bg-primary-lum/30 px-6 py-4">
          <p className="text-sm text-text-muted-lum">Card footer</p>
        </div>
      </div>
    ),
  },
};

/**
 * All Luminous Variants
 */
export const LuminousVariantsShowcase: Story = {
  render: () => (
    <div className="w-full max-w-2xl space-y-6">
      <div>
        <h4 className="mb-3 text-sm font-semibold text-text-secondary-lum">
          Standard (Glass Border)
        </h4>
        <Card variant="luminous" padding="md">
          <h3 className="mb-2 text-lg font-semibold text-text-primary-lum">Luminous Card</h3>
          <p className="text-text-secondary-lum">
            Steel background with subtle glass border and glow effect
          </p>
        </Card>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold text-text-secondary-lum">Glass (With Blur)</h4>
        <Card variant="luminousGlass" padding="md">
          <h3 className="mb-2 text-lg font-semibold text-text-primary-lum">Luminous Glass Card</h3>
          <p className="text-text-secondary-lum">
            Transparent background with 12px backdrop blur effect
          </p>
        </Card>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold text-text-secondary-lum">Elevated</h4>
        <Card variant="luminousElevated" padding="md">
          <h3 className="mb-2 text-lg font-semibold text-text-primary-lum">
            Luminous Elevated Card
          </h3>
          <p className="text-text-secondary-lum">
            Steel background with prominent shadow for depth
          </p>
        </Card>
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
        <div className="grid grid-cols-1 gap-4">
          <Card variant="luminous" padding="md">
            <h4 className="mb-1 font-semibold text-text-primary-lum">Luminous</h4>
            <p className="text-sm text-text-secondary-lum">Steel background with glass border</p>
          </Card>
          <Card variant="luminousGlass" padding="md">
            <h4 className="mb-1 font-semibold text-text-primary-lum">Luminous Glass</h4>
            <p className="text-sm text-text-secondary-lum">Transparent with backdrop blur</p>
          </Card>
          <Card variant="luminousElevated" padding="md">
            <h4 className="mb-1 font-semibold text-text-primary-lum">Luminous Elevated</h4>
            <p className="text-sm text-text-secondary-lum">Steel background with strong shadow</p>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="border-b border-border-steel pb-2 text-lg font-semibold text-text-primary-lum">
          Yellow Theme (Existing)
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <Card variant="default" padding="md">
            <h4 className="mb-1 font-semibold">Default</h4>
            <p className="text-sm">Standard card with border</p>
          </Card>
          <Card variant="elevated" padding="md">
            <h4 className="mb-1 font-semibold">Elevated</h4>
            <p className="text-sm">Card with shadow</p>
          </Card>
          <Card variant="ghost" padding="md">
            <h4 className="mb-1 font-semibold">Ghost</h4>
            <p className="text-sm">Transparent background</p>
          </Card>
          <Card variant="primary" padding="md">
            <h4 className="mb-1 font-semibold">Primary</h4>
            <p className="text-sm">Primary background color</p>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="border-b border-border-steel pb-2 text-lg font-semibold text-text-primary-lum">
          Padding Variants
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Card variant="luminous" padding="sm">
            <p className="text-sm text-text-secondary-lum">Small (4px)</p>
          </Card>
          <Card variant="luminous" padding="md">
            <p className="text-sm text-text-secondary-lum">Medium (6px)</p>
          </Card>
          <Card variant="luminous" padding="lg">
            <p className="text-sm text-text-secondary-lum">Large (8px)</p>
          </Card>
          <Card variant="luminous" padding="none">
            <p className="text-sm text-text-secondary-lum">None</p>
          </Card>
        </div>
      </section>
    </div>
  ),
};
