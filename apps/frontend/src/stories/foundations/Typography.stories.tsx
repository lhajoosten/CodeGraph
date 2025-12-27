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
        <h1 className="mb-2 text-4xl font-bold text-text-primary-lum">Heading 1 (H1)</h1>
        <p className="text-sm text-text-muted-lum">32px / 40px line-height • Bold weight</p>
        <p className="mt-2 text-text-secondary-lum">
          Use for page titles and major section headers
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-3xl font-bold text-text-primary-lum">Heading 2 (H2)</h2>
        <p className="text-sm text-text-muted-lum">24px / 32px line-height • Bold weight</p>
        <p className="mt-2 text-text-secondary-lum">Use for section headers and card titles</p>
      </div>

      <div>
        <h3 className="mb-2 text-2xl font-bold text-text-primary-lum">Heading 3 (H3)</h3>
        <p className="text-sm text-text-muted-lum">18px / 24px line-height • Bold weight</p>
        <p className="mt-2 text-text-secondary-lum">Use for subsection headers and labels</p>
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
        <p className="mb-2 text-base text-text-primary-lum">
          This is body text (primary) • 14px / 20px line-height
        </p>
        <p className="text-sm text-text-muted-lum">
          Regular weight (400) • High contrast for readability
        </p>
        <p className="mt-4 max-w-lg leading-relaxed text-text-primary-lum">
          The quick brown fox jumps over the lazy dog. This is the primary body text style used
          throughout the interface for main content, paragraphs, and standard UI text. It provides
          excellent readability at its size.
        </p>
      </div>

      <div>
        <p className="mb-2 text-base text-text-secondary-lum">
          This is body text (secondary) • 14px / 20px line-height
        </p>
        <p className="text-sm text-text-muted-lum">
          Regular weight (400) • Medium contrast for secondary content
        </p>
        <p className="mt-4 max-w-lg leading-relaxed text-text-secondary-lum">
          Use secondary text for supporting information, descriptions, and less important content
          that still needs to be legible but can have reduced emphasis.
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm text-text-muted-lum">
          This is body text (muted) • 12px / 18px line-height
        </p>
        <p className="text-xs text-text-muted-lum">
          Regular weight (400) • Lower contrast for tertiary content
        </p>
        <p className="mt-4 max-w-lg leading-relaxed text-text-muted-lum">
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
        <p className="mb-2 rounded-lg bg-bg-steel p-3 font-mono text-sm text-text-primary-lum">
          const message = &quot;Hello, CodeGraph!&quot;
        </p>
        <p className="text-sm text-text-muted-lum">
          Monospace (JetBrains Mono) • 13px / 18px line-height
        </p>
        <p className="mt-2 text-text-secondary-lum">
          Use for code blocks, logs, and technical content
        </p>
      </div>

      <div className="space-y-3">
        <p className="font-semibold text-text-secondary-lum">Code Examples:</p>
        <div className="space-y-2 rounded-lg border border-border-steel bg-bg-steel p-4">
          <p className="font-mono text-xs text-text-primary-lum"># Example Python code</p>
          <p className="font-mono text-xs text-text-primary-lum">
            def authenticate(email: str, password: str):
          </p>
          <p className="ml-4 font-mono text-xs text-text-primary-lum">
            return verify_credentials(email, password)
          </p>
        </div>
      </div>

      <div>
        <p className="rounded bg-bg-elevated-lum p-2 font-mono text-xs text-text-muted-lum">
          API_KEY=sk-ant-example-secret-key-12345
        </p>
        <p className="mt-2 text-sm text-text-muted-lum">
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
      <p className="font-light text-text-primary-lum">Light weight (300) - The quick brown fox</p>
      <p className="font-normal text-text-primary-lum">
        Regular weight (400) - The quick brown fox
      </p>
      <p className="font-medium text-text-primary-lum">Medium weight (500) - The quick brown fox</p>
      <p className="font-semibold text-text-primary-lum">
        Semibold weight (600) - The quick brown fox
      </p>
      <p className="font-bold text-text-primary-lum">Bold weight (700) - The quick brown fox</p>
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
        <h1 className="mb-2 text-4xl font-bold text-text-primary-lum">Typography System</h1>
        <p className="text-text-secondary-lum">
          Inter + JetBrains Mono for the Luminous Technical Design System
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="mb-6 border-b border-border-steel pb-3 text-xl font-semibold text-text-primary-lum">
            Heading Hierarchy
          </h2>
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-text-primary-lum">H1 - Page Title</h1>
              <p className="mt-1 text-xs text-text-muted-lum">32px / Bold</p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-text-primary-lum">H2 - Section Title</h2>
              <p className="mt-1 text-xs text-text-muted-lum">24px / Bold</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-text-primary-lum">H3 - Subsection Title</h3>
              <p className="mt-1 text-xs text-text-muted-lum">18px / Bold</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-6 border-b border-border-steel pb-3 text-xl font-semibold text-text-primary-lum">
            Body Text Styles
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-base text-text-primary-lum">
                Primary body text - Main content and descriptions
              </p>
              <p className="mt-1 text-xs text-text-muted-lum">14px / Regular</p>
            </div>
            <div>
              <p className="text-base text-text-secondary-lum">
                Secondary body text - Supporting information
              </p>
              <p className="mt-1 text-xs text-text-muted-lum">14px / Regular</p>
            </div>
            <div>
              <p className="text-sm text-text-muted-lum">
                Muted body text - Helper text and captions
              </p>
              <p className="mt-1 text-xs text-text-muted-lum">12px / Regular</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-6 border-b border-border-steel pb-3 text-xl font-semibold text-text-primary-lum">
            Monospace (Code)
          </h2>
          <div className="space-y-3">
            <div>
              <p className="rounded bg-bg-steel p-3 font-mono text-sm text-text-primary-lum">
                const x = &quot;monospace text&quot;
              </p>
              <p className="mt-1 text-xs text-text-muted-lum">JetBrains Mono • 13px</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-6 border-b border-border-steel pb-3 text-xl font-semibold text-text-primary-lum">
            Font Family Reference
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="mb-2 font-semibold text-text-primary-lum">Interface Font</p>
              <p className="mb-2 text-text-secondary-lum">Inter, Roboto Variable, sans-serif</p>
              <p className="font-sans text-text-primary-lum">
                Using Inter for all interface elements
              </p>
            </div>
            <div>
              <p className="mb-2 font-semibold text-text-primary-lum">Code Font</p>
              <p className="mb-2 text-text-secondary-lum">JetBrains Mono, monospace</p>
              <p className="font-mono text-text-primary-lum">Using JetBrains Mono for all code</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  ),
};
