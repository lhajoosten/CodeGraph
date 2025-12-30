import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Foundations/Elevation',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;

/**
 * Elevation Levels - Cards, modals, and floating surfaces
 */
export const ElevationLevels: StoryObj = {
  render: () => (
    <div className="w-full max-w-4xl space-y-12">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-text-primary">Elevation System</h1>
        <p className="text-text-secondary">
          Visual hierarchy using shadows, borders, and backgrounds for depth
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="border-b border-border-primary pb-3 text-xl font-semibold text-text-primary">
          Base Level (Flat)
        </h2>
        <div className="rounded-lg border border-border-primary bg-surface p-6">
          <p className="font-semibold text-text-primary">Base/Flat Surface</p>
          <p className="mt-1 text-sm text-text-secondary">
            Standard input fields, text areas, and flat UI elements. Uses border for definition.
          </p>
          <div className="mt-4">
            <input
              type="text"
              placeholder="Input field (border only)"
              className="w-full rounded-lg border border-border-primary bg-surface px-3 py-2 text-text-primary"
            />
          </div>
          <p className="mt-3 font-mono text-xs text-text-muted">
            rounded-lg border border-border-primary bg-surface
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="border-b border-border-primary pb-3 text-xl font-semibold text-text-primary">
          Level 1 - Elevated
        </h2>
        <div className="rounded-lg border border-border-primary bg-surface-secondary p-6 shadow-md">
          <p className="font-semibold text-text-primary">Elevated Card</p>
          <p className="mt-1 text-sm text-text-secondary">
            Light shadow with subtle depth. Used for cards, panels, and contained sections.
          </p>
          <div className="mt-4 space-y-2">
            <p className="text-xs text-text-secondary">Example content with light background</p>
            <div className="flex gap-2">
              <div className="flex-1 rounded bg-brand-cyan/10 p-2 text-xs text-text-secondary">
                Feature
              </div>
              <div className="flex-1 rounded bg-brand-cyan/10 p-2 text-xs text-text-secondary">
                Component
              </div>
            </div>
          </div>
          <p className="mt-3 font-mono text-xs text-text-muted">
            shadow-md (0 4px 6px -1px rgb(0 0 0 / 0.1))
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="border-b border-border-primary pb-3 text-xl font-semibold text-text-primary">
          Level 2 - Floating
        </h2>
        <div className="rounded-lg border border-border-primary bg-surface-secondary p-6 shadow-lg">
          <p className="font-semibold text-text-primary">Floating Panel</p>
          <p className="mt-1 text-sm text-text-secondary">
            Stronger shadow for more separation. Used for modals, popovers, and floating menus.
          </p>
          <div className="mt-4 space-y-3">
            <p className="text-xs text-text-secondary">Modal-like content with shadow</p>
            <button className="w-full rounded-lg bg-brand-cyan px-4 py-2 text-sm font-medium text-white transition hover:shadow-[0_0_16px_rgba(34,211,238,0.5)]">
              Primary Action
            </button>
            <button className="w-full rounded-lg border border-border-primary px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface-secondary">
              Secondary Action
            </button>
          </div>
          <p className="mt-3 font-mono text-xs text-text-muted">
            shadow-lg (0 10px 15px -3px rgb(0 0 0 / 0.1))
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="border-b border-border-primary pb-3 text-xl font-semibold text-text-primary">
          Level 3 - Overlay
        </h2>
        <div className="relative rounded-lg border border-border-primary bg-surface-secondary p-6 shadow-xl">
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20">
            <div className="rounded-lg bg-surface-secondary p-6 shadow-xl">
              <p className="font-semibold text-text-primary">Modal Dialog</p>
              <p className="mt-2 text-sm text-text-secondary">
                Strongest shadow with overlay effect. Used for critical modals and overlays.
              </p>
              <div className="mt-4 space-y-2">
                <button className="w-full rounded-lg bg-brand-cyan px-4 py-2 text-sm font-medium text-white">
                  Confirm
                </button>
                <button className="w-full rounded-lg border border-border-primary px-4 py-2 text-sm font-medium text-text-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
          <p className="font-mono text-xs text-text-muted">
            shadow-xl (0 20px 25px -5px rgb(0 0 0 / 0.1))
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="border-b border-border-primary pb-3 text-xl font-semibold text-text-primary">
          Glass Effect (Special)
        </h2>
        <div className="relative h-48 overflow-hidden rounded-lg bg-gradient-to-br from-brand-cyan/20 via-background to-brand-teal/20 p-6">
          <div
            className="absolute inset-0 rounded-lg border border-border-primary"
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="font-semibold text-text-primary">Glassmorphic Surface</p>
              <p className="text-sm text-text-secondary">
                Transparent with blur and thin border. Used for sidebars and floating panels.
              </p>
            </div>
          </div>
          <p className="absolute bottom-2 left-2 font-mono text-xs text-text-muted">
            backdropFilter: blur(12px); background: rgba(..., 0.7)
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="border-b border-border-primary pb-3 text-xl font-semibold text-text-primary">
          Complete Elevation Comparison
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Level 0 */}
          <div className="rounded-lg border border-border-primary bg-surface p-4">
            <p className="mb-2 font-semibold text-text-primary">Level 0: Flat</p>
            <p className="text-xs text-text-secondary">
              Border only, no shadow. Input fields, containers.
            </p>
          </div>

          {/* Level 1 */}
          <div className="rounded-lg border border-border-primary bg-surface-secondary p-4 shadow-md">
            <p className="mb-2 font-semibold text-text-primary">Level 1: Elevated</p>
            <p className="text-xs text-text-secondary">Light shadow. Cards, sections, panels.</p>
          </div>

          {/* Level 2 */}
          <div className="rounded-lg border border-border-primary bg-surface-secondary p-4 shadow-lg">
            <p className="mb-2 font-semibold text-text-primary">Level 2: Floating</p>
            <p className="text-xs text-text-secondary">Medium shadow. Modals, popovers, menus.</p>
          </div>

          {/* Level 3 */}
          <div className="rounded-lg border border-border-primary bg-surface-secondary p-4 shadow-xl">
            <p className="mb-2 font-semibold text-text-primary">Level 3: Overlay</p>
            <p className="text-xs text-text-secondary">Strong shadow. Critical modals, overlays.</p>
          </div>

          {/* Glass */}
          <div
            className="rounded-lg border border-border-primary p-4"
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <p className="mb-2 font-semibold text-text-primary">Glass Effect</p>
            <p className="text-xs text-text-secondary">Transparent & blurred. Sidebars, panels.</p>
          </div>

          {/* Glow */}
          <div
            className="flex items-center justify-center rounded-lg border border-border-primary bg-brand-cyan/10 p-4"
            style={{
              boxShadow: 'var(--shadow-glow-cyan)',
            }}
          >
            <div>
              <p className="mb-2 font-semibold text-text-primary">Glow Effect</p>
              <p className="text-xs text-brand-cyan">Interactive & active states</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="border-b border-border-primary pb-3 text-xl font-semibold text-text-primary">
          Usage Guidelines
        </h2>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg border border-border-primary bg-surface p-4">
            <p className="mb-2 font-semibold text-text-primary">✓ Do</p>
            <ul className="list-inside space-y-1 text-text-secondary">
              <li>Use consistent elevation levels</li>
              <li>Match elevation to content importance</li>
              <li>Use shadows with intent</li>
              <li>Test on different backgrounds</li>
            </ul>
          </div>

          <div className="rounded-lg border border-border-primary bg-surface p-4">
            <p className="mb-2 font-semibold text-text-primary">✗ Don&apos;t</p>
            <ul className="list-inside space-y-1 text-text-secondary">
              <li>Mix too many elevation levels</li>
              <li>Use shadow alone for separation</li>
              <li>Skip borders on flat surfaces</li>
              <li>Over-use glow effects</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  ),
};

/**
 * Interactive Elevation Examples
 */
export const InteractiveExamples: StoryObj = {
  render: () => (
    <div className="w-full max-w-4xl space-y-8">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-text-primary">Elevation in Real Components</h2>
      </div>

      {/* Card example */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-text-secondary">Task Card - Level 1 Elevation</p>
        <div className="rounded-lg border border-border-primary bg-surface-secondary p-4 shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-text-primary">Implement dark mode</p>
              <p className="mt-1 text-sm text-text-secondary">
                Add dark theme support to all components
              </p>
            </div>
            <span className="inline-block rounded-full bg-success/20 px-2 py-1 text-xs text-success">
              In Progress
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="text-xs text-text-muted">React</span>
            <span className="text-xs text-text-muted">•</span>
            <span className="text-xs text-text-muted">Due tomorrow</span>
          </div>
        </div>
      </div>

      {/* Modal example */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-text-secondary">
          Confirmation Modal - Level 2/3 Elevation
        </p>
        <div className="rounded-lg bg-black/40 p-8">
          <div className="mx-auto max-w-sm rounded-lg border border-border-primary bg-surface-secondary p-6 shadow-xl">
            <p className="font-semibold text-text-primary">Delete Task?</p>
            <p className="mt-2 text-sm text-text-secondary">
              This action cannot be undone. Are you sure?
            </p>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-lg border border-border-primary px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface-secondary">
                Cancel
              </button>
              <button className="flex-1 rounded-lg bg-error px-4 py-2 text-sm font-medium text-white transition hover:shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating menu */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-text-secondary">Floating Menu - Level 2 Elevation</p>
        <div className="space-y-2">
          <button className="rounded-lg bg-brand-cyan px-4 py-2 text-sm font-medium text-white">
            Open Menu
          </button>
          <div className="w-48 rounded-lg border border-border-primary bg-surface-secondary p-2 shadow-lg">
            {['Edit', 'Duplicate', 'Share', 'Delete'].map((action) => (
              <button
                key={action}
                className="w-full rounded px-3 py-2 text-left text-sm text-text-secondary transition hover:bg-surface"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
};
