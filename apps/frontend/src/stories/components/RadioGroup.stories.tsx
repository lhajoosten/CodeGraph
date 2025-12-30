import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component for Default story
function DefaultRadioGroupWrapper() {
  const [selected, setSelected] = useState('option1');

  return (
    <div className="w-full max-w-md">
      <label className="text-text-primary-lum mb-3 block text-sm font-medium">
        Choose an option
      </label>
      <RadioGroup value={selected} onValueChange={setSelected}>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="option1" id="opt1" />
          <label htmlFor="opt1" className="text-text-secondary-lum cursor-pointer text-sm">
            Option 1
          </label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="option2" id="opt2" />
          <label htmlFor="opt2" className="text-text-secondary-lum cursor-pointer text-sm">
            Option 2
          </label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="option3" id="opt3" />
          <label htmlFor="opt3" className="text-text-secondary-lum cursor-pointer text-sm">
            Option 3
          </label>
        </div>
      </RadioGroup>
      <p className="text-text-muted-lum mt-3 text-xs">
        Selected: <strong className="text-text-secondary-lum">{selected}</strong>
      </p>
    </div>
  );
}

/**
 * Basic radio group with simple options
 */
export const Default: Story = {
  render: () => <DefaultRadioGroupWrapper />,
};

// Wrapper component for WithDescriptions story
function WithDescriptionsRadioGroupWrapper() {
  const [selected, setSelected] = useState('basic');

  return (
    <div className="w-full max-w-md space-y-3">
      <label className="text-text-primary-lum block text-sm font-medium">Select your plan</label>
      <RadioGroup value={selected} onValueChange={setSelected}>
        <div className="border-border-steel flex items-start gap-3 rounded-lg border p-3">
          <RadioGroupItem value="basic" id="basic" className="mt-1" />
          <label htmlFor="basic" className="flex-1 cursor-pointer">
            <p className="text-text-primary-lum font-medium">Starter Plan</p>
            <p className="text-text-secondary-lum text-xs">Perfect for individuals - $29/month</p>
          </label>
        </div>
        <div className="border-border-steel flex items-start gap-3 rounded-lg border p-3">
          <RadioGroupItem value="pro" id="pro" className="mt-1" />
          <label htmlFor="pro" className="flex-1 cursor-pointer">
            <p className="text-text-primary-lum font-medium">Professional Plan</p>
            <p className="text-text-secondary-lum text-xs">For growing teams - $99/month</p>
          </label>
        </div>
        <div className="border-border-steel flex items-start gap-3 rounded-lg border p-3">
          <RadioGroupItem value="enterprise" id="enterprise" className="mt-1" />
          <label htmlFor="enterprise" className="flex-1 cursor-pointer">
            <p className="text-text-primary-lum font-medium">Enterprise Plan</p>
            <p className="text-text-secondary-lum text-xs">
              For large organizations - Custom pricing
            </p>
          </label>
        </div>
      </RadioGroup>
    </div>
  );
}

/**
 * Radio group with descriptions
 */
export const WithDescriptions: Story = {
  render: () => <WithDescriptionsRadioGroupWrapper />,
};

// Wrapper component for Vertical story
function VerticalRadioGroupWrapper() {
  const [selected, setSelected] = useState('node');

  return (
    <div className="w-full max-w-sm">
      <label className="text-text-primary-lum mb-3 block text-sm font-medium">
        Select a runtime
      </label>
      <RadioGroup value={selected} onValueChange={setSelected} className="space-y-2">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="node" id="node" />
          <label htmlFor="node" className="text-text-secondary-lum cursor-pointer text-sm">
            Node.js 18+
          </label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="python" id="python" />
          <label htmlFor="python" className="text-text-secondary-lum cursor-pointer text-sm">
            Python 3.10+
          </label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="go" id="go" />
          <label htmlFor="go" className="text-text-secondary-lum cursor-pointer text-sm">
            Go 1.19+
          </label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="rust" id="rust" />
          <label htmlFor="rust" className="text-text-secondary-lum cursor-pointer text-sm">
            Rust 1.70+
          </label>
        </div>
      </RadioGroup>
    </div>
  );
}

/**
 * Vertical orientation
 */
export const Vertical: Story = {
  render: () => <VerticalRadioGroupWrapper />,
};

// Wrapper component for WithDisabled story
function WithDisabledRadioGroupWrapper() {
  const [selected, setSelected] = useState('public');

  return (
    <div className="w-full max-w-md">
      <label className="text-text-primary-lum mb-3 block text-sm font-medium">
        Visibility settings
      </label>
      <RadioGroup value={selected} onValueChange={setSelected}>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="public" id="public" />
          <label htmlFor="public" className="text-text-secondary-lum cursor-pointer text-sm">
            Public (Anyone can view)
          </label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="private" id="private" />
          <label htmlFor="private" className="text-text-secondary-lum cursor-pointer text-sm">
            Private (Only you can view)
          </label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="team" id="team" disabled />
          <label htmlFor="team" className="text-text-muted-lum cursor-pointer text-sm">
            Team (Coming soon)
          </label>
        </div>
      </RadioGroup>
    </div>
  );
}

/**
 * Disabled state
 */
export const WithDisabled: Story = {
  render: () => <WithDisabledRadioGroupWrapper />,
};

// Wrapper component for InForm story
function InFormRadioGroupWrapper() {
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('open');

  return (
    <form className="border-border-steel bg-bg-elevated-lum w-full max-w-md space-y-6 rounded-lg border p-4">
      <div>
        <label className="text-text-primary-lum mb-3 block text-sm font-medium">
          Priority Level
        </label>
        <RadioGroup value={priority} onValueChange={setPriority}>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="low" id="low" />
            <label htmlFor="low" className="text-text-secondary-lum cursor-pointer text-sm">
              Low
            </label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="medium" id="medium" />
            <label htmlFor="medium" className="text-text-secondary-lum cursor-pointer text-sm">
              Medium
            </label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="high" id="high" />
            <label htmlFor="high" className="text-text-secondary-lum cursor-pointer text-sm">
              High
            </label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <label className="text-text-primary-lum mb-3 block text-sm font-medium">Status</label>
        <RadioGroup value={status} onValueChange={setStatus}>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="open" id="open" />
            <label htmlFor="open" className="text-text-secondary-lum cursor-pointer text-sm">
              Open
            </label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="in-progress" id="in-progress" />
            <label htmlFor="in-progress" className="text-text-secondary-lum cursor-pointer text-sm">
              In Progress
            </label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="closed" id="closed" />
            <label htmlFor="closed" className="text-text-secondary-lum cursor-pointer text-sm">
              Closed
            </label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="button"
          className="border-border-steel text-text-secondary-lum flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-bg-steel"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 rounded-lg bg-brand-cyan px-4 py-2 text-sm font-medium text-white transition hover:shadow-[0_0_16px_rgba(34,211,238,0.5)]"
        >
          Save
        </button>
      </div>
    </form>
  );
}

/**
 * Radio group in form context
 */
export const InForm: Story = {
  render: () => <InFormRadioGroupWrapper />,
};
