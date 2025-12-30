import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '@/components/ui/card';

const meta = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'glass', 'glassElevated'],
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
 * Default Card - Luminous steel background with glass border
 */
export const Default: Story = {
  args: {
    variant: 'default',
    padding: 'md',
    children: (
      <div className="space-y-2">
        <h3 className="text-text-primary text-lg font-semibold">Default Card</h3>
        <p className="text-text-secondary text-sm">Steel background with glass border effect</p>
      </div>
    ),
  },
};

/**
 * Glass Card - Transparent with backdrop blur
 */
export const Glass: Story = {
  args: {
    variant: 'glass',
    padding: 'md',
    children: (
      <div className="space-y-2">
        <h3 className="text-text-primary text-lg font-semibold">Glass Card</h3>
        <p className="text-text-secondary text-sm">Transparent with 12px backdrop blur</p>
      </div>
    ),
  },
};

/**
 * Elevated Card - Steel with strong shadow
 */
export const GlassElevated: Story = {
  args: {
    variant: 'glassElevated',
    padding: 'md',
    children: (
      <div className="space-y-2">
        <h3 className="text-text-primary text-lg font-semibold">Elevated Card</h3>
        <p className="text-text-secondary text-sm">Steel background with elevated shadow</p>
      </div>
    ),
  },
};

/**
 * Small Padding
 */
export const SmallPadding: Story = {
  args: {
    variant: 'default',
    padding: 'sm',
    children: (
      <div>
        <p className="text-text-primary">Small padding (4px)</p>
      </div>
    ),
  },
};

/**
 * Large Padding
 */
export const LargePadding: Story = {
  args: {
    variant: 'default',
    padding: 'lg',
    children: (
      <div className="space-y-2">
        <h3 className="text-text-primary text-lg font-semibold">Large Padding</h3>
        <p className="text-text-secondary">Card with generous padding (32px)</p>
      </div>
    ),
  },
};

/**
 * No Padding
 */
export const NoPadding: Story = {
  args: {
    variant: 'default',
    padding: 'none',
    children: (
      <div className="bg-background rounded-t-lg p-4">
        <p className="text-text-primary">No padding - content touches edges</p>
      </div>
    ),
  },
};

/**
 * Card with Header and Footer
 */
export const WithHeaderFooter: Story = {
  args: {
    variant: 'default',
    padding: 'none',
    children: (
      <div className="flex flex-col">
        <div className="border-border-primary border-b px-6 py-4">
          <h3 className="text-text-primary text-lg font-semibold">Card Header</h3>
        </div>
        <div className="flex-1 px-6 py-4">
          <p className="text-text-secondary">
            This is the main content area. The card automatically adjusts to fit the content.
          </p>
        </div>
        <div className="border-border-primary bg-background/30 border-t px-6 py-4">
          <p className="text-text-muted text-sm">Card footer</p>
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
        <h4 className="text-text-secondary mb-3 text-sm font-semibold">
          Default (Glass Border)
        </h4>
        <Card variant="default" padding="md">
          <h3 className="text-text-primary mb-2 text-lg font-semibold">Default Card</h3>
          <p className="text-text-secondary">
            Steel background with subtle glass border and glow effect
          </p>
        </Card>
      </div>

      <div>
        <h4 className="text-text-secondary mb-3 text-sm font-semibold">Glass (With Blur)</h4>
        <Card variant="glass" padding="md">
          <h3 className="text-text-primary mb-2 text-lg font-semibold">Glass Card</h3>
          <p className="text-text-secondary">
            Transparent background with 12px backdrop blur effect
          </p>
        </Card>
      </div>

      <div>
        <h4 className="text-text-secondary mb-3 text-sm font-semibold">Elevated</h4>
        <Card variant="glassElevated" padding="md">
          <h3 className="text-text-primary mb-2 text-lg font-semibold">Elevated Card</h3>
          <p className="text-text-secondary">
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
        <h3 className="border-border-primary text-text-primary border-b pb-2 text-lg font-semibold">
          Luminous Theme Variants
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <Card variant="default" padding="md">
            <h4 className="text-text-primary mb-1 font-semibold">Default</h4>
            <p className="text-text-secondary text-sm">Steel background with glass border</p>
          </Card>
          <Card variant="glass" padding="md">
            <h4 className="text-text-primary mb-1 font-semibold">Glass</h4>
            <p className="text-text-secondary text-sm">Transparent with backdrop blur</p>
          </Card>
          <Card variant="glassElevated" padding="md">
            <h4 className="text-text-primary mb-1 font-semibold">Elevated</h4>
            <p className="text-text-secondary text-sm">Steel background with strong shadow</p>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="border-border-primary text-text-primary border-b pb-2 text-lg font-semibold">
          Padding Variants
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Card variant="default" padding="sm">
            <p className="text-text-secondary text-sm">Small (4px)</p>
          </Card>
          <Card variant="default" padding="md">
            <p className="text-text-secondary text-sm">Medium (6px)</p>
          </Card>
          <Card variant="default" padding="lg">
            <p className="text-text-secondary text-sm">Large (8px)</p>
          </Card>
          <Card variant="default" padding="none">
            <p className="text-text-secondary text-sm">None</p>
          </Card>
        </div>
      </section>
    </div>
  ),
};
