import type { Meta, StoryObj } from '@storybook/react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  tags: ['autodocs'],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Single select accordion (only one item open at a time)
 */
export const SingleSelect: Story = {
  args: {
    type: 'single',
    defaultValue: 'item-1',
  },
  render: (args) => (
    <Accordion {...args} className="w-full max-w-md">
      <AccordionItem value="item-1">
        <AccordionTrigger>What is CodeGraph?</AccordionTrigger>
        <AccordionContent>
          CodeGraph is a multi-agent AI coding platform that orchestrates specialized AI agents to
          plan, implement, test, and review code changes autonomously.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How do I get started?</AccordionTrigger>
        <AccordionContent>
          Simply sign up with your email, create a workspace, and start creating tasks. Our AI
          agents will handle the implementation.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>What languages are supported?</AccordionTrigger>
        <AccordionContent>
          Currently, we support TypeScript, Python, JavaScript, and Go. Additional language support
          is coming soon.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-4">
        <AccordionTrigger>How is my code secured?</AccordionTrigger>
        <AccordionContent>
          All code is encrypted in transit and at rest. We use industry-standard security practices
          and comply with GDPR and SOC 2 requirements.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/**
 * Multiple select accordion (multiple items can be open)
 */
export const MultipleSelect: Story = {
  args: {
    type: 'multiple',
  },
  render: (args) => (
    <Accordion {...args} className="w-full max-w-md">
      <AccordionItem value="features">
        <AccordionTrigger>Features</AccordionTrigger>
        <AccordionContent>
          <ul className="list-inside space-y-1 text-sm text-text-secondary">
            <li>• Automated code planning</li>
            <li>• Multi-agent collaboration</li>
            <li>• Real-time monitoring</li>
            <li>• Code review automation</li>
            <li>• Test generation</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="pricing">
        <AccordionTrigger>Pricing Plans</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm text-text-secondary">
            <p>
              <strong>Starter:</strong> $29/month - Perfect for individuals
            </p>
            <p>
              <strong>Professional:</strong> $99/month - For growing teams
            </p>
            <p>
              <strong>Enterprise:</strong> Custom - For large organizations
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="support">
        <AccordionTrigger>Support & Resources</AccordionTrigger>
        <AccordionContent>
          <ul className="list-inside space-y-1 text-sm text-text-secondary">
            <li>• 24/7 Email support</li>
            <li>• Documentation & guides</li>
            <li>• Community forum</li>
            <li>• Video tutorials</li>
            <li>• API documentation</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/**
 * Accordion with no default open item
 */
export const NoDefault: Story = {
  args: {
    type: 'single',
  },
  render: (args) => (
    <Accordion {...args} className="w-full max-w-md">
      <AccordionItem value="security">
        <AccordionTrigger>Security Features</AccordionTrigger>
        <AccordionContent>
          <p className="text-sm text-text-secondary">
            We implement end-to-end encryption, two-factor authentication, and regular security
            audits to protect your data.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="performance">
        <AccordionTrigger>Performance Optimization</AccordionTrigger>
        <AccordionContent>
          <p className="text-sm text-text-secondary">
            CodeGraph is optimized for speed with distributed processing, caching, and intelligent
            resource allocation.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="integration">
        <AccordionTrigger>Integrations</AccordionTrigger>
        <AccordionContent>
          <p className="text-sm text-text-secondary">
            Connect with GitHub, GitLab, Slack, Jira, and other tools to streamline your workflow.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/**
 * Accordion with custom styling
 */
export const WithCustomContent: Story = {
  args: {
    type: 'single',
    defaultValue: 'item-1',
  },
  render: (args) => (
    <Accordion {...args} className="w-full max-w-2xl">
      <AccordionItem value="item-1">
        <AccordionTrigger>Implementation Steps</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-cyan/20 text-xs font-bold text-brand-cyan">
                1
              </div>
              <div>
                <p className="font-medium text-text-primary">Create a task</p>
                <p className="text-sm text-text-secondary">Describe what you want built</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-cyan/20 text-xs font-bold text-brand-cyan">
                2
              </div>
              <div>
                <p className="font-medium text-text-primary">Review the plan</p>
                <p className="text-sm text-text-secondary">
                  AI agents propose implementation approach
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-cyan/20 text-xs font-bold text-brand-cyan">
                3
              </div>
              <div>
                <p className="font-medium text-text-primary">Monitor progress</p>
                <p className="text-sm text-text-secondary">
                  Watch agents implement, test, and review code
                </p>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Key Benefits</AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border-primary bg-surface p-3">
              <p className="font-medium text-text-primary">⚡ Faster Development</p>
              <p className="text-xs text-text-secondary">Cut development time in half</p>
            </div>
            <div className="rounded-lg border border-border-primary bg-surface p-3">
              <p className="font-medium text-text-primary">✓ Higher Quality</p>
              <p className="text-xs text-text-secondary">Automated testing & review</p>
            </div>
            <div className="rounded-lg border border-border-primary bg-surface p-3">
              <p className="font-medium text-text-primary">🎯 Consistent</p>
              <p className="text-xs text-text-secondary">Reliable, predictable results</p>
            </div>
            <div className="rounded-lg border border-border-primary bg-surface p-3">
              <p className="font-medium text-text-primary">🔄 Flexible</p>
              <p className="text-xs text-text-secondary">Easy revisions & iterations</p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
