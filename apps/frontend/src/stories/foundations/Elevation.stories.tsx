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
        <h1 className="text-text-primary mb-2 text-3xl font-bold">Elevation System</h1>
        <p className="text-text-secondary">
          Visual hierarchy using shadows, borders, and backgrounds for depth
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="border-border-primary text-text-primary border-b pb-3 text-xl font-semibold">
          Base Level (Flat)
        </h2>
        <div className="border-border-primary bg-surface rounded-lg border p-6">
          <p className="text-text-primary font-semibold">Base/Flat Surface</p>
          <p className="text-text-secondary mt-1 text-sm">
            Standard input fields, text areas, and flat UI elements. Uses border for definition.
          </p>
          <div className="mt-4">
            <input
              type="text"
              placeholder="Input field (border only)"
              className="border-border-primary bg-surface text-text-primary w-full rounded-lg border px-3 py-2"
            />
          </div>
          <p className="text-text-muted mt-3 font-mono text-xs">
            rounded-lg border border-border-primary bg-surface
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="border-border-primary text-text-primary border-b pb-3 text-xl font-semibold">
          Level 1 - Elevated
        </h2>
        <div className="border-border-primary bg-surface-secondary rounded-lg border p-6 shadow-md">
          <p className="text-text-primary font-semibold">Elevated Card</p>
          <p className="text-text-secondary mt-1 text-sm">
            Light shadow with subtle depth. Used for cards, panels, and contained sections.
          </p>
          <div className="mt-4 space-y-2">
            <p className="text-text-secondary text-xs">Example content with light background</p>
            <div className="flex gap-2">
              <div className="text-text-secondary flex-1 rounded bg-brand-cyan/10 p-2 text-xs">
                Feature
              </div>
              <div className="text-text-secondary flex-1 rounded bg-brand-cyan/10 p-2 text-xs">
                Component
              </div>
            </div>
          </div>
          <p className="text-text-muted mt-3 font-mono text-xs">
            shadow-md (0 4px 6px -1px rgb(0 0 0 / 0.1))
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="border-border-primary text-text-primary border-b pb-3 text-xl font-semibold">
          Level 2 - Floating
        </h2>
        <div className="border-border-primary bg-surface-secondary rounded-lg border p-6 shadow-lg">
          <p className="text-text-primary font-semibold">Floating Panel</p>
          <p className="text-text-secondary mt-1 text-sm">
            Stronger shadow for more separation. Used for modals, popovers, and floating menus.
          </p>
          <div className="mt-4 space-y-3">
            <p className="text-text-secondary text-xs">Modal-like content with shadow</p>
            <button className="w-full rounded-lg bg-brand-cyan px-4 py-2 text-sm font-medium text-white transition hover:shadow-[0_0_16px_rgba(34,211,238,0.5)]">
              Primary Action
            </button>
            <button className="border-border-primary text-text-secondary w-full rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-surface-secondary">
              Secondary Action
            </button>
          </div>
          <p className="text-text-muted mt-3 font-mono text-xs">
            shadow-lg (0 10px 15px -3px rgb(0 0 0 / 0.1))
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="border-border-primary text-text-primary border-b pb-3 text-xl font-semibold">
          Level 3 - Overlay
        </h2>
        <div className="border-border-primary bg-surface-secondary relative rounded-lg border p-6 shadow-xl">
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20">
            <div className="bg-surface-secondary rounded-lg p-6 shadow-xl">
              <p className="text-text-primary font-semibold">Modal Dialog</p>
              <p className="text-text-secondary mt-2 text-sm">
                Strongest shadow with overlay effect. Used for critical modals and overlays.
              </p>
              <div className="mt-4 space-y-2">
                <button className="w-full rounded-lg bg-brand-cyan px-4 py-2 text-sm font-medium text-white">
                  Confirm
                </button>
                <button className="border-border-primary text-text-secondary w-full rounded-lg border px-4 py-2 text-sm font-medium">
                  Cancel
                </button>
              </div>
            </div>
          </div>
          <p className="text-text-muted font-mono text-xs">
            shadow-xl (0 20px 25px -5px rgb(0 0 0 / 0.1))
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="border-border-primary text-text-primary border-b pb-3 text-xl font-semibold">
          Glass Effect (Special)
        </h2>
        <div className="via-background to-brand-teal/20 relative h-48 overflow-hidden rounded-lg bg-gradient-to-br from-brand-cyan/20 p-6">
          <div
            className="border-border-primary absolute inset-0 rounded-lg border"
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="text-text-primary font-semibold">Glassmorphic Surface</p>
              <p className="text-text-secondary text-sm">
                Transparent with blur and thin border. Used for sidebars and floating panels.
              </p>
            </div>
          </div>
          <p className="text-text-muted absolute bottom-2 left-2 font-mono text-xs">
            backdropFilter: blur(12px); background: rgba(..., 0.7)
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="border-border-primary text-text-primary border-b pb-3 text-xl font-semibold">
          Complete Elevation Comparison
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Level 0 */}
          <div className="border-border-primary bg-surface rounded-lg border p-4">
            <p className="text-text-primary mb-2 font-semibold">Level 0: Flat</p>
            <p className="text-text-secondary text-xs">
              Border only, no shadow. Input fields, containers.
            </p>
          </div>

          {/* Level 1 */}
          <div className="border-border-primary bg-surface-secondary rounded-lg border p-4 shadow-md">
            <p className="text-text-primary mb-2 font-semibold">Level 1: Elevated</p>
            <p className="text-text-secondary text-xs">
              Light shadow. Cards, sections, panels.
            </p>
          </div>

          {/* Level 2 */}
          <div className="border-border-primary bg-surface-secondary rounded-lg border p-4 shadow-lg">
            <p className="text-text-primary mb-2 font-semibold">Level 2: Floating</p>
            <p className="text-text-secondary text-xs">
              Medium shadow. Modals, popovers, menus.
            </p>
          </div>

          {/* Level 3 */}
          <div className="border-border-primary bg-surface-secondary rounded-lg border p-4 shadow-xl">
            <p className="text-text-primary mb-2 font-semibold">Level 3: Overlay</p>
            <p className="text-text-secondary text-xs">
              Strong shadow. Critical modals, overlays.
            </p>
          </div>

          {/* Glass */}
          <div
            className="border-border-primary rounded-lg border p-4"
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <p className="text-text-primary mb-2 font-semibold">Glass Effect</p>
            <p className="text-text-secondary text-xs">
              Transparent & blurred. Sidebars, panels.
            </p>
          </div>

          {/* Glow */}
          <div
            className="border-border-primary flex items-center justify-center rounded-lg border bg-brand-cyan/10 p-4"
            style={{
              boxShadow: 'var(--shadow-glow-cyan)',
            }}
          >
            <div>
              <p className="text-text-primary mb-2 font-semibold">Glow Effect</p>
              <p className="text-xs text-brand-cyan">Interactive & active states</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="border-border-primary text-text-primary border-b pb-3 text-xl font-semibold">
          Usage Guidelines
        </h2>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="border-border-primary bg-surface rounded-lg border p-4">
            <p className="text-text-primary mb-2 font-semibold">✓ Do</p>
            <ul className="text-text-secondary list-inside space-y-1">
              <li>Use consistent elevation levels</li>
              <li>Match elevation to content importance</li>
              <li>Use shadows with intent</li>
              <li>Test on different backgrounds</li>
            </ul>
          </div>

          <div className="border-border-primary bg-surface rounded-lg border p-4">
            <p className="text-text-primary mb-2 font-semibold">✗ Don&apos;t</p>
            <ul className="text-text-secondary list-inside space-y-1">
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
        <h2 className="text-text-primary mb-4 text-2xl font-bold">
          Elevation in Real Components
        </h2>
      </div>

      {/* Card example */}
      <div className="space-y-3">
        <p className="text-text-secondary text-sm font-medium">Task Card - Level 1 Elevation</p>
        <div className="border-border-primary bg-surface-secondary rounded-lg border p-4 shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-text-primary font-semibold">Implement dark mode</p>
              <p className="text-text-secondary mt-1 text-sm">
                Add dark theme support to all components
              </p>
            </div>
            <span className="bg-success/20 text-success inline-block rounded-full px-2 py-1 text-xs">
              In Progress
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="text-text-muted text-xs">React</span>
            <span className="text-text-muted text-xs">•</span>
            <span className="text-text-muted text-xs">Due tomorrow</span>
          </div>
        </div>
      </div>

      {/* Modal example */}
      <div className="space-y-3">
        <p className="text-text-secondary text-sm font-medium">
          Confirmation Modal - Level 2/3 Elevation
        </p>
        <div className="rounded-lg bg-black/40 p-8">
          <div className="border-border-primary bg-surface-secondary mx-auto max-w-sm rounded-lg border p-6 shadow-xl">
            <p className="text-text-primary font-semibold">Delete Task?</p>
            <p className="text-text-secondary mt-2 text-sm">
              This action cannot be undone. Are you sure?
            </p>
            <div className="mt-4 flex gap-2">
              <button className="border-border-primary text-text-secondary flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-surface-secondary">
                Cancel
              </button>
              <button className="bg-error flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating menu */}
      <div className="space-y-3">
        <p className="text-text-secondary text-sm font-medium">
          Floating Menu - Level 2 Elevation
        </p>
        <div className="space-y-2">
          <button className="rounded-lg bg-brand-cyan px-4 py-2 text-sm font-medium text-white">
            Open Menu
          </button>
          <div className="border-border-primary bg-surface-secondary w-48 rounded-lg border p-2 shadow-lg">
            {['Edit', 'Duplicate', 'Share', 'Delete'].map((action) => (
              <button
                key={action}
                className="text-text-secondary w-full rounded px-3 py-2 text-left text-sm transition hover:bg-surface"
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
