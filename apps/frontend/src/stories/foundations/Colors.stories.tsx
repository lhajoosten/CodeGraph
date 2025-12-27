import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Foundations/Colors',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;

/**
 * Color Swatch Component for displaying design tokens
 */
function ColorSwatch({
  name,
  value,
  description,
}: {
  name: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-32 w-32 rounded-lg border border-border-steel shadow-glass"
        style={{ backgroundColor: value }}
        title={value}
      />
      <div>
        <p className="text-sm font-semibold text-text-primary-lum">{name}</p>
        <p className="font-mono text-xs text-text-secondary-lum">{value}</p>
        {description && <p className="mt-1 text-xs text-text-muted-lum">{description}</p>}
      </div>
    </div>
  );
}

/**
 * Brand Colors - Primary accent colors used throughout the design system
 */
export const BrandColors: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-6 text-lg font-semibold text-text-primary-lum">Brand Colors</h3>
        <div className="grid grid-cols-3 gap-8">
          <ColorSwatch
            name="Cyan"
            value="#22d3ee"
            description="Primary action, glow effects, active states"
          />
          <ColorSwatch
            name="Teal"
            value="#2dd4bf"
            description="Secondary interactive, success emphasis"
          />
          <ColorSwatch
            name="Lime"
            value="#84cc16"
            description="Success state, positive confirmation"
          />
        </div>
      </div>
    </div>
  ),
};

/**
 * Background Colors - Used for surfaces, containers, and page backgrounds
 */
export const BackgroundColors: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-6 text-lg font-semibold text-text-primary-lum">Background Colors</h3>
        <div className="grid grid-cols-4 gap-8">
          <ColorSwatch
            name="Primary (Deep Midnight)"
            value="#070B16"
            description="Main background"
          />
          <ColorSwatch name="Secondary" value="#0E1424" description="Secondary background" />
          <ColorSwatch name="Elevated" value="#151C32" description="Elevated surfaces" />
          <ColorSwatch name="Steel" value="#1e293b" description="Card surfaces" />
        </div>
      </div>
    </div>
  ),
};

/**
 * Text Colors - Used for typography and text elements
 */
export const TextColors: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-6 text-lg font-semibold text-text-primary-lum">Text Colors</h3>
        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-2">
            <ColorSwatch name="Primary" value="#E6EAF2" description="Main text, high contrast" />
            <p className="text-text-primary-lum">This is primary text color</p>
          </div>
          <div className="space-y-2">
            <ColorSwatch name="Secondary" value="#A9B0C2" description="Secondary text, labels" />
            <p className="text-text-secondary-lum">This is secondary text color</p>
          </div>
          <div className="space-y-2">
            <ColorSwatch name="Muted" value="#6B7280" description="Tertiary text, placeholders" />
            <p className="text-text-muted-lum">This is muted text color</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * State Colors - Semantic colors for system states
 */
export const StateColors: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-6 text-lg font-semibold text-text-primary-lum">State Colors</h3>
        <div className="grid grid-cols-3 gap-8">
          <div>
            <ColorSwatch
              name="Success"
              value="#22C55E"
              description="Successful actions, confirmations"
            />
            <p className="mt-2 text-success">Success message example</p>
          </div>
          <div>
            <ColorSwatch name="Warning" value="#F59E0B" description="Warning states, cautions" />
            <p className="mt-2 text-warning">Warning message example</p>
          </div>
          <div>
            <ColorSwatch name="Error" value="#EF4444" description="Errors, destructive actions" />
            <p className="mt-2 text-error">Error message example</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Border & Effects - Colors used for borders and visual effects
 */
export const BorderAndEffects: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-6 text-lg font-semibold text-text-primary-lum">Borders & Effects</h3>
        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm text-text-secondary-lum">Glass Border (10% white opacity)</p>
            <div className="flex h-12 w-48 items-center justify-center rounded-lg border border-border-steel shadow-glass">
              <span className="text-sm text-text-muted-lum">rgba(255,255,255,0.1)</span>
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm text-text-secondary-lum">Cyan Glow Effect</p>
            <div
              className="flex h-12 w-48 items-center justify-center rounded-lg"
              style={{
                background: 'var(--color-brand-cyan)',
                boxShadow: 'var(--shadow-glow-cyan)',
              }}
            >
              <span className="text-sm font-semibold text-white">Cyan Glow</span>
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm text-text-secondary-lum">Teal Glow Effect</p>
            <div
              className="flex h-12 w-48 items-center justify-center rounded-lg"
              style={{
                background: 'var(--color-brand-teal)',
                boxShadow: 'var(--shadow-glow-teal)',
              }}
            >
              <span className="text-sm font-semibold text-white">Teal Glow</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Complete Palette - All colors at a glance
 */
export const CompletePalette: StoryObj = {
  render: () => (
    <div className="w-full max-w-4xl space-y-12">
      <div>
        <h2 className="mb-8 text-2xl font-bold text-text-primary-lum">
          Luminous Technical Color System
        </h2>

        <div className="space-y-8">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-text-primary-lum">Brand Colors</h3>
            <div className="grid grid-cols-3 gap-6">
              <ColorSwatch name="Cyan" value="#22d3ee" description="Primary action" />
              <ColorSwatch name="Teal" value="#2dd4bf" description="Secondary" />
              <ColorSwatch name="Lime" value="#84cc16" description="Success" />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-text-primary-lum">Backgrounds</h3>
            <div className="grid grid-cols-4 gap-6">
              <ColorSwatch name="Primary" value="#070B16" description="Deep midnight" />
              <ColorSwatch name="Secondary" value="#0E1424" description="Secondary" />
              <ColorSwatch name="Elevated" value="#151C32" description="Elevated" />
              <ColorSwatch name="Steel" value="#1e293b" description="Cards" />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-text-primary-lum">Text</h3>
            <div className="grid grid-cols-3 gap-6">
              <ColorSwatch name="Primary" value="#E6EAF2" description="Main text" />
              <ColorSwatch name="Secondary" value="#A9B0C2" description="Labels" />
              <ColorSwatch name="Muted" value="#6B7280" description="Placeholders" />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-text-primary-lum">Semantic States</h3>
            <div className="grid grid-cols-3 gap-6">
              <ColorSwatch name="Success" value="#22C55E" description="Positive" />
              <ColorSwatch name="Warning" value="#F59E0B" description="Caution" />
              <ColorSwatch name="Error" value="#EF4444" description="Negative" />
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};
