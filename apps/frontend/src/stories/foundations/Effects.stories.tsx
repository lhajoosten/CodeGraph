import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Foundations/Effects',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;

/**
 * Glow Effects - Cyan and Teal glows for interactive states
 */
export const GlowEffects: StoryObj = {
  render: () => (
    <div className="w-full max-w-3xl space-y-12">
      <div>
        <h2 className="mb-8 text-xl font-semibold text-text-primary">Glow Effects</h2>

        <div className="space-y-8">
          <div>
            <p className="mb-4 text-sm text-text-secondary">
              Cyan Glow - Primary action and active states
            </p>
            <div className="flex items-center justify-center gap-6">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-lg font-semibold"
                style={{
                  background: 'var(--color-brand-cyan)',
                  boxShadow: 'var(--shadow-glow-cyan)',
                }}
              >
                <span className="text-white">Cyan</span>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-text-secondary">
                  <strong>Color:</strong> #22d3ee
                </p>
                <p className="text-text-secondary">
                  <strong>Shadow:</strong> 0 0 12px rgba(34, 211, 238, 0.4)
                </p>
                <p className="text-text-secondary">
                  <strong>Use case:</strong> Button hovers, active indicators
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-4 text-sm text-text-secondary">
              Teal Glow - Secondary interaction and success states
            </p>
            <div className="flex items-center justify-center gap-6">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-lg font-semibold"
                style={{
                  background: 'var(--color-brand-teal)',
                  boxShadow: 'var(--shadow-glow-teal)',
                }}
              >
                <span className="text-white">Teal</span>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-text-secondary">
                  <strong>Color:</strong> #2dd4bf
                </p>
                <p className="text-text-secondary">
                  <strong>Shadow:</strong> 0 0 12px rgba(45, 212, 191, 0.4)
                </p>
                <p className="text-text-secondary">
                  <strong>Use case:</strong> Ghost buttons, secondary links
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-4 text-sm text-text-secondary">
              Error Glow - Error states and destructive actions
            </p>
            <div className="flex items-center justify-center gap-6">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-lg font-semibold"
                style={{
                  background: '#EF4444',
                  boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)',
                }}
              >
                <span className="text-white">Error</span>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-text-secondary">
                  <strong>Color:</strong> #EF4444
                </p>
                <p className="text-text-secondary">
                  <strong>Shadow:</strong> 0 0 12px rgba(239, 68, 68, 0.4)
                </p>
                <p className="text-text-secondary">
                  <strong>Use case:</strong> Error messages, danger buttons
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Shadows - Card and elevated surface shadows
 */
export const Shadows: StoryObj = {
  render: () => (
    <div className="w-full max-w-3xl space-y-12">
      <div>
        <h2 className="mb-8 text-xl font-semibold text-text-primary">Shadows</h2>

        <div className="space-y-8">
          <div>
            <p className="mb-4 text-sm text-text-secondary">
              Glass Shadow - Subtle 1px border for glass effect
            </p>
            <div
              className="flex h-24 w-48 items-center justify-center rounded-lg bg-surface-secondary"
              style={{ boxShadow: 'var(--shadow-glass)' }}
            >
              <span className="text-sm text-text-secondary">Glass Border</span>
            </div>
            <p className="mt-2 font-mono text-xs text-text-muted">
              0 0 0 1px rgba(255, 255, 255, 0.1)
            </p>
          </div>

          <div>
            <p className="mb-4 text-sm text-text-secondary">
              Elevated Shadow - Depth for floating elements
            </p>
            <div className="flex gap-4">
              <div className="flex h-24 w-48 items-center justify-center rounded-lg bg-surface-secondary shadow-lg">
                <span className="text-sm text-text-secondary">Elevated Card</span>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-text-secondary">
                  <strong>Use case:</strong> Cards, modals, floating panels
                </p>
                <p className="text-text-secondary">Creates visual hierarchy and depth</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Glassmorphism - Backdrop blur and transparency effects
 */
export const Glassmorphism: StoryObj = {
  render: () => (
    <div className="w-full max-w-3xl space-y-12">
      <div>
        <h2 className="mb-8 text-xl font-semibold text-text-primary">Glassmorphism</h2>

        <div className="relative h-96 w-full overflow-hidden rounded-lg bg-gradient-to-br from-background-secondary via-background to-background-secondary">
          {/* Background pattern/content */}
          <div className="absolute inset-0 opacity-30">
            <div className="grid grid-cols-4 gap-4 p-8">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded bg-brand-cyan"
                  style={{ opacity: Math.random() * 0.5 }}
                />
              ))}
            </div>
          </div>

          {/* Glass card overlay */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="w-full max-w-xs space-y-6">
              <div
                className="rounded-lg border border-border-primary p-6"
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <h3 className="mb-2 text-lg font-semibold text-text-primary">
                  Glass Card (12px blur)
                </h3>
                <p className="text-sm text-text-secondary">
                  Background image visible through semi-transparent glass layer
                </p>
              </div>

              <div
                className="rounded-lg border border-border-primary p-6"
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <h3 className="mb-2 text-lg font-semibold text-text-primary">
                  More Prominent Glass (20px blur)
                </h3>
                <p className="text-sm text-text-secondary">
                  Stronger blur creates more visual separation
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="mb-1 font-semibold text-text-primary">Backdrop Blur</p>
              <p className="text-text-secondary">Subtle blur creates depth and hierarchy</p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-text-primary">Transparency</p>
              <p className="text-text-secondary">Background slightly visible for context</p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-text-primary">Glass Border</p>
              <p className="text-text-secondary">1px white border adds definition</p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-text-primary">Use Cases</p>
              <p className="text-text-secondary">Sidebars, modals, floating menus</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Focus States - Interactive element focus indicators
 */
export const FocusStates: StoryObj = {
  render: () => (
    <div className="w-full max-w-3xl space-y-12">
      <div>
        <h2 className="mb-8 text-xl font-semibold text-text-primary">Focus States</h2>

        <div className="space-y-8">
          <div>
            <p className="mb-4 text-sm text-text-secondary">
              Input Focus - Cyan border with subtle glow
            </p>
            <input
              type="text"
              placeholder="Click to focus..."
              className="w-full rounded-lg border border-border-primary bg-surface-secondary px-4 py-3 text-text-primary focus:border-brand-cyan focus:shadow-[0_0_8px_rgba(34,211,238,0.3)] focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <p className="mb-4 text-sm text-text-secondary">Button Focus - Ring with cyan border</p>
            <button className="rounded-lg bg-brand-cyan px-6 py-3 font-semibold text-white focus:ring-2 focus:ring-brand-cyan focus:ring-offset-2 focus:outline-none">
              Focus Me
            </button>
            <p className="mt-2 text-xs text-text-muted">Press Tab or click to see focus ring</p>
          </div>

          <div>
            <p className="mb-4 text-sm text-text-secondary">
              Link Focus - Underline with color change
            </p>
            <a
              href="#"
              className="text-brand-cyan hover:text-brand-teal focus:underline focus:outline-none"
            >
              Focused Link Example
            </a>
            <p className="mt-2 text-xs text-text-muted">Tab to this link to see focus state</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Complete Effects System
 */
export const CompleteEffectsSystem: StoryObj = {
  render: () => (
    <div className="w-full max-w-4xl space-y-12">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-text-primary">Effects & Visual Styling</h1>
        <p className="text-text-secondary">
          Glows, shadows, and depth effects for the Luminous Technical Design
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="border-b border-border-primary pb-3 text-xl font-semibold text-text-primary">
          Color Glows
        </h2>
        <div className="grid grid-cols-3 gap-6">
          <div
            className="rounded-lg p-8 text-center font-semibold text-white"
            style={{
              background: 'var(--color-brand-cyan)',
              boxShadow: 'var(--shadow-glow-cyan)',
            }}
          >
            Cyan
          </div>
          <div
            className="rounded-lg p-8 text-center font-semibold text-white"
            style={{
              background: 'var(--color-brand-teal)',
              boxShadow: 'var(--shadow-glow-teal)',
            }}
          >
            Teal
          </div>
          <div
            className="rounded-lg p-8 text-center font-semibold text-white"
            style={{
              background: '#EF4444',
              boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)',
            }}
          >
            Error
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="border-b border-border-primary pb-3 text-xl font-semibold text-text-primary">
          Border Effects
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div
            className="rounded-lg p-6 text-center"
            style={{
              background: 'var(--color-surface-secondary)',
              boxShadow: 'var(--shadow-glass)',
            }}
          >
            <p className="mb-1 font-semibold text-text-primary">Glass Border</p>
            <p className="text-xs text-text-muted">10% white opacity edge</p>
          </div>
          <div className="rounded-lg border-2 border-brand-cyan p-6 text-center">
            <p className="mb-1 font-semibold text-text-primary">Colored Border</p>
            <p className="text-xs text-text-muted">Cyan accent border</p>
          </div>
        </div>
      </section>
    </div>
  ),
};
