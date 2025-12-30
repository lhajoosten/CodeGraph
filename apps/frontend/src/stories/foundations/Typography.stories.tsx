import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Foundations/Typography',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;

/**
 * Typography Scale - Heading styles
 */
export const Headings: StoryObj = {
  render: () => (
    <div className="w-full max-w-2xl space-y-8">
      <div>
        <h1 className="text-text-primary mb-2 text-4xl font-bold">Heading 1 (H1)</h1>
        <p className="text-text-muted text-sm">32px / 40px line-height • Bold weight</p>
        <p className="text-text-secondary mt-2">
          Use for page titles and major section headers
        </p>
      </div>

      <div>
        <h2 className="text-text-primary mb-2 text-3xl font-bold">Heading 2 (H2)</h2>
        <p className="text-text-muted text-sm">24px / 32px line-height • Bold weight</p>
        <p className="text-text-secondary mt-2">Use for section headers and card titles</p>
      </div>

      <div>
        <h3 className="text-text-primary mb-2 text-2xl font-bold">Heading 3 (H3)</h3>
        <p className="text-text-muted text-sm">18px / 24px line-height • Bold weight</p>
        <p className="text-text-secondary mt-2">Use for subsection headers and labels</p>
      </div>
    </div>
  ),
};

/**
 * Body Text Styles
 */
export const BodyText: StoryObj = {
  render: () => (
    <div className="w-full max-w-2xl space-y-8">
      <div>
        <p className="text-text-primary mb-2 text-base">
          This is body text (primary) • 14px / 20px line-height
        </p>
        <p className="text-text-muted text-sm">
          Regular weight (400) • High contrast for readability
        </p>
        <p className="text-text-primary mt-4 max-w-lg leading-relaxed">
          The quick brown fox jumps over the lazy dog. This is the primary body text style used
          throughout the interface for main content, paragraphs, and standard UI text. It provides
          excellent readability at its size.
        </p>
      </div>

      <div>
        <p className="text-text-secondary mb-2 text-base">
          This is body text (secondary) • 14px / 20px line-height
        </p>
        <p className="text-text-muted text-sm">
          Regular weight (400) • Medium contrast for secondary content
        </p>
        <p className="text-text-secondary mt-4 max-w-lg leading-relaxed">
          Use secondary text for supporting information, descriptions, and less important content
          that still needs to be legible but can have reduced emphasis.
        </p>
      </div>

      <div>
        <p className="text-text-muted mb-2 text-sm">
          This is body text (muted) • 12px / 18px line-height
        </p>
        <p className="text-text-muted text-xs">
          Regular weight (400) • Lower contrast for tertiary content
        </p>
        <p className="text-text-muted mt-4 max-w-lg leading-relaxed">
          Muted text is used for hints, helper text, disabled states, and less important information
          that users should still be able to read but doesn&apos;t require strong emphasis.
        </p>
      </div>
    </div>
  ),
};

/**
 * Monospace Typography - For code, logs, and technical content
 */
export const Monospace: StoryObj = {
  render: () => (
    <div className="w-full max-w-2xl space-y-8">
      <div>
        <p className="bg-surface-secondary text-text-primary mb-2 rounded-lg p-3 font-mono text-sm">
          const message = &quot;Hello, CodeGraph!&quot;
        </p>
        <p className="text-text-muted text-sm">
          Monospace (JetBrains Mono) • 13px / 18px line-height
        </p>
        <p className="text-text-secondary mt-2">
          Use for code blocks, logs, and technical content
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-text-secondary font-semibold">Code Examples:</p>
        <div className="border-border-primary bg-surface-secondary space-y-2 rounded-lg border p-4">
          <p className="text-text-primary font-mono text-xs"># Example Python code</p>
          <p className="text-text-primary font-mono text-xs">
            def authenticate(email: str, password: str):
          </p>
          <p className="text-text-primary ml-4 font-mono text-xs">
            return verify_credentials(email, password)
          </p>
        </div>
      </div>

      <div>
        <p className="bg-surface text-text-muted rounded p-2 font-mono text-xs">
          API_KEY=sk-ant-example-secret-key-12345
        </p>
        <p className="text-text-muted mt-2 text-sm">
          Monospace for environment variables and secrets (smaller size)
        </p>
      </div>
    </div>
  ),
};

/**
 * Font Weights
 */
export const FontWeights: StoryObj = {
  render: () => (
    <div className="w-full max-w-2xl space-y-6">
      <p className="text-text-primary font-light">Light weight (300) - The quick brown fox</p>
      <p className="text-text-primary font-normal">
        Regular weight (400) - The quick brown fox
      </p>
      <p className="text-text-primary font-medium">Medium weight (500) - The quick brown fox</p>
      <p className="text-text-primary font-semibold">
        Semibold weight (600) - The quick brown fox
      </p>
      <p className="text-text-primary font-bold">Bold weight (700) - The quick brown fox</p>
    </div>
  ),
};

/**
 * Complete Typography System
 */
export const CompleteSystem: StoryObj = {
  render: () => (
    <div className="w-full max-w-4xl space-y-12">
      <div>
        <h1 className="text-text-primary mb-2 text-4xl font-bold">Typography System</h1>
        <p className="text-text-secondary">
          Inter + JetBrains Mono for the Luminous Technical Design System
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="border-border-primary text-text-primary mb-6 border-b pb-3 text-xl font-semibold">
            Heading Hierarchy
          </h2>
          <div className="space-y-6">
            <div>
              <h1 className="text-text-primary text-4xl font-bold">H1 - Page Title</h1>
              <p className="text-text-muted mt-1 text-xs">32px / Bold</p>
            </div>
            <div>
              <h2 className="text-text-primary text-3xl font-bold">H2 - Section Title</h2>
              <p className="text-text-muted mt-1 text-xs">24px / Bold</p>
            </div>
            <div>
              <h3 className="text-text-primary text-2xl font-bold">H3 - Subsection Title</h3>
              <p className="text-text-muted mt-1 text-xs">18px / Bold</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="border-border-primary text-text-primary mb-6 border-b pb-3 text-xl font-semibold">
            Body Text Styles
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-text-primary text-base">
                Primary body text - Main content and descriptions
              </p>
              <p className="text-text-muted mt-1 text-xs">14px / Regular</p>
            </div>
            <div>
              <p className="text-text-secondary text-base">
                Secondary body text - Supporting information
              </p>
              <p className="text-text-muted mt-1 text-xs">14px / Regular</p>
            </div>
            <div>
              <p className="text-text-muted text-sm">
                Muted body text - Helper text and captions
              </p>
              <p className="text-text-muted mt-1 text-xs">12px / Regular</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="border-border-primary text-text-primary mb-6 border-b pb-3 text-xl font-semibold">
            Monospace (Code)
          </h2>
          <div className="space-y-3">
            <div>
              <p className="bg-surface-secondary text-text-primary rounded p-3 font-mono text-sm">
                const x = &quot;monospace text&quot;
              </p>
              <p className="text-text-muted mt-1 text-xs">JetBrains Mono • 13px</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="border-border-primary text-text-primary mb-6 border-b pb-3 text-xl font-semibold">
            Font Family Reference
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-text-primary mb-2 font-semibold">Interface Font</p>
              <p className="text-text-secondary mb-2">Inter, Roboto Variable, sans-serif</p>
              <p className="text-text-primary font-sans">
                Using Inter for all interface elements
              </p>
            </div>
            <div>
              <p className="text-text-primary mb-2 font-semibold">Code Font</p>
              <p className="text-text-secondary mb-2">JetBrains Mono, monospace</p>
              <p className="text-text-primary font-mono">Using JetBrains Mono for all code</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  ),
};
