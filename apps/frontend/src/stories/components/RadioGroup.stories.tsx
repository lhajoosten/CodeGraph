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
      <label className="mb-3 block text-sm font-medium text-text-primary">Choose an option</label>
      <RadioGroup value={selected} onValueChange={setSelected}>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="option1" id="opt1" />
          <label htmlFor="opt1" className="cursor-pointer text-sm text-text-secondary">
            Option 1
          </label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="option2" id="opt2" />
          <label htmlFor="opt2" className="cursor-pointer text-sm text-text-secondary">
            Option 2
          </label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="option3" id="opt3" />
          <label htmlFor="opt3" className="cursor-pointer text-sm text-text-secondary">
            Option 3
          </label>
        </div>
      </RadioGroup>
      <p className="mt-3 text-xs text-text-muted">
        Selected: <strong className="text-text-secondary">{selected}</strong>
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
      <label className="block text-sm font-medium text-text-primary">Select your plan</label>
      <RadioGroup value={selected} onValueChange={setSelected}>
        <div className="flex items-start gap-3 rounded-lg border border-border-primary p-3">
          <RadioGroupItem value="basic" id="basic" className="mt-1" />
          <label htmlFor="basic" className="flex-1 cursor-pointer">
            <p className="font-medium text-text-primary">Starter Plan</p>
            <p className="text-xs text-text-secondary">Perfect for individuals - $29/month</p>
          </label>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-border-primary p-3">
          <RadioGroupItem value="pro" id="pro" className="mt-1" />
          <label htmlFor="pro" className="flex-1 cursor-pointer">
            <p className="font-medium text-text-primary">Professional Plan</p>
            <p className="text-xs text-text-secondary">For growing teams - $99/month</p>
          </label>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-border-primary p-3">
          <RadioGroupItem value="enterprise" id="enterprise" className="mt-1" />
          <label htmlFor="enterprise" className="flex-1 cursor-pointer">
            <p className="font-medium text-text-primary">Enterprise Plan</p>
            <p className="text-xs text-text-secondary">For large organizations - Custom pricing</p>
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
      <label className="mb-3 block text-sm font-medium text-text-primary">Select a runtime</label>
      <RadioGroup value={selected} onValueChange={setSelected} className="space-y-2">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="node" id="node" />
          <label htmlFor="node" className="cursor-pointer text-sm text-text-secondary">
            Node.js 18+
          </label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="python" id="python" />
          <label htmlFor="python" className="cursor-pointer text-sm text-text-secondary">
            Python 3.10+
          </label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="go" id="go" />
          <label htmlFor="go" className="cursor-pointer text-sm text-text-secondary">
            Go 1.19+
          </label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="rust" id="rust" />
          <label htmlFor="rust" className="cursor-pointer text-sm text-text-secondary">
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
      <label className="mb-3 block text-sm font-medium text-text-primary">
        Visibility settings
      </label>
      <RadioGroup value={selected} onValueChange={setSelected}>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="public" id="public" />
          <label htmlFor="public" className="cursor-pointer text-sm text-text-secondary">
            Public (Anyone can view)
          </label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="private" id="private" />
          <label htmlFor="private" className="cursor-pointer text-sm text-text-secondary">
            Private (Only you can view)
          </label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="team" id="team" disabled />
          <label htmlFor="team" className="cursor-pointer text-sm text-text-muted">
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
    <form className="w-full max-w-md space-y-6 rounded-lg border border-border-primary bg-surface p-4">
      <div>
        <label className="mb-3 block text-sm font-medium text-text-primary">Priority Level</label>
        <RadioGroup value={priority} onValueChange={setPriority}>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="low" id="low" />
            <label htmlFor="low" className="cursor-pointer text-sm text-text-secondary">
              Low
            </label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="medium" id="medium" />
            <label htmlFor="medium" className="cursor-pointer text-sm text-text-secondary">
              Medium
            </label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="high" id="high" />
            <label htmlFor="high" className="cursor-pointer text-sm text-text-secondary">
              High
            </label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <label className="mb-3 block text-sm font-medium text-text-primary">Status</label>
        <RadioGroup value={status} onValueChange={setStatus}>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="open" id="open" />
            <label htmlFor="open" className="cursor-pointer text-sm text-text-secondary">
              Open
            </label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="in-progress" id="in-progress" />
            <label htmlFor="in-progress" className="cursor-pointer text-sm text-text-secondary">
              In Progress
            </label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="closed" id="closed" />
            <label htmlFor="closed" className="cursor-pointer text-sm text-text-secondary">
              Closed
            </label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="button"
          className="flex-1 rounded-lg border border-border-primary px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface-secondary"
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
