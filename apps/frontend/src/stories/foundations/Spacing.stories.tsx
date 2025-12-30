import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Foundations/Spacing',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;

/**
 * Spacing Scale - All available spacing values
 */
export const SpacingScale: StoryObj = {
  render: () => {
    const spacingValues = [
      { name: 'xs', value: '4px', tailwind: 'p-1' },
      { name: 'sm', value: '8px', tailwind: 'p-2' },
      { name: 'md', value: '12px', tailwind: 'p-3' },
      { name: 'lg', value: '16px', tailwind: 'p-4' },
      { name: 'xl', value: '20px', tailwind: 'p-5' },
      { name: '2xl', value: '24px', tailwind: 'p-6' },
      { name: '3xl', value: '32px', tailwind: 'p-8' },
      { name: '4xl', value: '40px', tailwind: 'p-10' },
      { name: '5xl', value: '48px', tailwind: 'p-12' },
      { name: '6xl', value: '56px', tailwind: 'p-14' },
    ];

    return (
      <div className="w-full max-w-4xl space-y-12">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-text-primary">Spacing System</h1>
          <p className="text-text-secondary">Consistent spacing scale for all layout needs</p>
        </div>

        <div className="space-y-6">
          <h2 className="border-b border-border-primary pb-3 text-xl font-semibold text-text-primary">
            Spacing Scale
          </h2>
          {spacingValues.map((space) => (
            <div key={space.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-text-primary">{space.name}</p>
                  <p className="text-sm text-text-secondary">{space.value}</p>
                </div>
                <p className="font-mono text-xs text-text-muted">{space.tailwind}</p>
              </div>
              <div className="rounded-lg bg-brand-cyan/20" style={{ height: space.value }} />
            </div>
          ))}
        </div>

        <section className="space-y-6">
          <h2 className="border-b border-border-primary pb-3 text-xl font-semibold text-text-primary">
            Common Spacing Patterns
          </h2>

          <div className="space-y-4">
            <div>
              <p className="mb-3 text-sm font-medium text-text-secondary">
                Padding - Internal spacing in components
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border border-border-primary bg-surface p-2">
                  <p className="text-xs text-text-muted">Compact (p-2)</p>
                </div>
                <div className="rounded-lg border border-border-primary bg-surface p-4">
                  <p className="text-xs text-text-muted">Default (p-4)</p>
                </div>
                <div className="rounded-lg border border-border-primary bg-surface p-6">
                  <p className="text-xs text-text-muted">Spacious (p-6)</p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-text-secondary">
                Margin - External spacing between components
              </p>
              <div className="space-y-2">
                <div className="rounded-lg bg-surface p-3">
                  <p className="text-xs text-text-muted">Item 1</p>
                </div>
                <div className="rounded-lg bg-surface p-3">
                  <p className="text-xs text-text-muted">Item 2 (space-y-2)</p>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                <div className="rounded-lg bg-surface p-3">
                  <p className="text-xs text-text-muted">Item 1</p>
                </div>
                <div className="rounded-lg bg-surface p-3">
                  <p className="text-xs text-text-muted">Item 2 (space-y-4)</p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-text-secondary">
                Gap - Spacing within flex/grid containers
              </p>
              <div className="space-y-3">
                <div>
                  <p className="mb-2 text-xs text-text-muted">Gap-2</p>
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-lg bg-brand-cyan/20 p-2" />
                    <div className="flex-1 rounded-lg bg-brand-cyan/20 p-2" />
                    <div className="flex-1 rounded-lg bg-brand-cyan/20 p-2" />
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs text-text-muted">Gap-4</p>
                  <div className="flex gap-4">
                    <div className="flex-1 rounded-lg bg-brand-cyan/20 p-2" />
                    <div className="flex-1 rounded-lg bg-brand-cyan/20 p-2" />
                    <div className="flex-1 rounded-lg bg-brand-cyan/20 p-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="border-b border-border-primary pb-3 text-xl font-semibold text-text-primary">
            Layout Spacing Guidelines
          </h2>

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="rounded-lg border border-border-primary p-4">
              <p className="mb-2 font-semibold text-text-primary">Form Elements</p>
              <ul className="list-inside space-y-1 text-text-secondary">
                <li>• Label to input: gap-1</li>
                <li>• Field to field: space-y-4</li>
                <li>• Button padding: px-4 py-2</li>
              </ul>
            </div>

            <div className="rounded-lg border border-border-primary p-4">
              <p className="mb-2 font-semibold text-text-primary">Cards & Containers</p>
              <ul className="list-inside space-y-1 text-text-secondary">
                <li>• Internal padding: p-4 to p-6</li>
                <li>• Content spacing: space-y-3</li>
                <li>• Card to card: gap-4</li>
              </ul>
            </div>

            <div className="rounded-lg border border-border-primary p-4">
              <p className="mb-2 font-semibold text-text-primary">Navigation</p>
              <ul className="list-inside space-y-1 text-text-secondary">
                <li>• Nav items: p-3</li>
                <li>• Item spacing: gap-1</li>
                <li>• Section gap: space-y-4</li>
              </ul>
            </div>

            <div className="rounded-lg border border-border-primary p-4">
              <p className="mb-2 font-semibold text-text-primary">Page Layout</p>
              <ul className="list-inside space-y-1 text-text-secondary">
                <li>• Page padding: px-4 md:px-8</li>
                <li>• Section gap: space-y-8</li>
                <li>• Container max-w-4xl</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="border-b border-border-primary pb-3 text-xl font-semibold text-text-primary">
            Real-world Example
          </h2>

          <div className="space-y-4 rounded-lg border border-border-primary p-6">
            {/* Header */}
            <div className="border-b border-border-primary pb-4">
              <p className="text-lg font-semibold text-text-primary">Task Details</p>
              <p className="mt-1 text-sm text-text-secondary">
                Example showing proper spacing usage
              </p>
            </div>

            {/* Form fields with proper spacing */}
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">Title</label>
                <input
                  type="text"
                  placeholder="Task title"
                  className="w-full rounded-lg border border-border-primary bg-surface px-3 py-2 text-text-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">
                  Description
                </label>
                <textarea
                  placeholder="Task description"
                  rows={3}
                  className="w-full rounded-lg border border-border-primary bg-surface px-3 py-2 text-text-primary"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t border-border-primary pt-4">
              <button className="flex-1 rounded-lg border border-border-primary px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface-secondary">
                Cancel
              </button>
              <button className="flex-1 rounded-lg bg-brand-cyan px-4 py-2 text-sm font-medium text-white transition hover:shadow-[0_0_16px_rgba(34,211,238,0.5)]">
                Save Task
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  },
};

/**
 * Responsive Spacing - How spacing adapts to screen sizes
 */
export const ResponsiveSpacing: StoryObj = {
  render: () => (
    <div className="w-full max-w-4xl space-y-8">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-text-primary">Responsive Spacing</h2>
        <p className="text-text-secondary">
          Spacing adjusts automatically for different screen sizes
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium text-text-secondary">
          Resize your browser to see spacing change
        </p>

        <div className="rounded-lg border border-border-primary p-4 md:p-6 lg:p-8">
          <p className="text-text-secondary">
            This container has responsive padding:{' '}
            <span className="font-mono text-xs">p-4 md:p-6 lg:p-8</span>
          </p>
        </div>

        <div className="space-y-2 md:space-y-3 lg:space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-surface p-3 md:p-4">
              <p className="text-sm text-text-secondary">
                Item {i + 1} - spacing: space-y-2 md:space-y-3 lg:space-y-4
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-brand-cyan/20 p-4 text-center">
              <p className="text-xs text-text-secondary">Grid Item {i + 1}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};
