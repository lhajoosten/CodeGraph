import type { Meta, StoryObj } from '@storybook/react';
import { ScrollArea } from '@/components/ui/scroll-area';

const meta = {
  title: 'Components/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs'],
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Vertical scroll area with content
 */
export const VerticalScroll: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <h3 className="mb-3 text-sm font-medium text-text-primary-lum">Task List</h3>
      <ScrollArea className="h-64 w-full rounded-lg border border-border-steel bg-bg-elevated-lum">
        <div className="p-4">
          <div className="space-y-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg p-2 hover:bg-bg-steel">
                <input type="checkbox" className="h-4 w-4" />
                <div className="flex-1">
                  <p className="text-sm text-text-secondary-lum">Task {i + 1}: Implement feature</p>
                  <p className="text-xs text-text-muted-lum">Due tomorrow at 5 PM</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  ),
};

/**
 * Horizontal scroll area
 */
export const HorizontalScroll: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <h3 className="mb-3 text-sm font-medium text-text-primary-lum">Team Members</h3>
      <ScrollArea
        orientation="horizontal"
        className="w-full rounded-lg border border-border-steel bg-bg-elevated-lum"
      >
        <div className="flex gap-3 p-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex min-w-max flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-cyan/20 text-sm font-bold text-brand-cyan">
                {String.fromCharCode(65 + i)}
              </div>
              <p className="text-xs text-text-secondary-lum">User {i + 1}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
};

/**
 * Both directions scroll
 */
export const BothDirections: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <h3 className="mb-3 text-sm font-medium text-text-primary-lum">Data Grid</h3>
      <ScrollArea className="h-64 w-full rounded-lg border border-border-steel bg-bg-elevated-lum">
        <div className="inline-block">
          <table className="w-full">
            <thead className="border-b border-border-steel">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-text-primary-lum">
                  ID
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-text-primary-lum">
                  Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-text-primary-lum">
                  Email
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-text-primary-lum">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-text-primary-lum">
                  Role
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 20 }).map((_, i) => (
                <tr key={i} className="border-b border-border-steel/50 hover:bg-bg-steel/50">
                  <td className="px-4 py-2 text-xs text-text-secondary-lum">
                    #{(i + 1).toString().padStart(4, '0')}
                  </td>
                  <td className="px-4 py-2 text-xs text-text-secondary-lum">User {i + 1}</td>
                  <td className="px-4 py-2 text-xs text-text-secondary-lum">
                    user{i + 1}@example.com
                  </td>
                  <td className="px-4 py-2 text-xs">
                    <span className="rounded-full bg-success/10 px-2 py-1 text-success">
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-text-secondary-lum">
                    {i % 3 === 0 ? 'Admin' : i % 2 === 0 ? 'Editor' : 'Viewer'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  ),
};

/**
 * Scroll area with custom content
 */
export const WithDetailedContent: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <h3 className="mb-3 text-sm font-medium text-text-primary-lum">Messages</h3>
      <ScrollArea className="h-80 w-full rounded-lg border border-border-steel bg-bg-elevated-lum p-4">
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-primary-lum">
                  {i % 2 === 0 ? 'Alice' : 'Bob'}
                </p>
                <p className="text-xs text-text-muted-lum">
                  {new Date(Date.now() - i * 60000).toLocaleTimeString()}
                </p>
              </div>
              <div className={`rounded-lg p-2 ${i % 2 === 0 ? 'bg-brand-cyan/10' : 'bg-bg-steel'}`}>
                <p className="text-sm text-text-secondary-lum">
                  This is message {i + 1}. It contains some content that demonstrates how messages
                  look in a scrollable area.
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
};

/**
 * Scroll area without visible scrollbar
 */
export const HideScrollbar: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <h3 className="mb-3 text-sm font-medium text-text-primary-lum">Hidden Scrollbar Content</h3>
      <div className="rounded-lg border border-border-steel bg-bg-elevated-lum p-4">
        <ScrollArea className="h-48 w-full" hideScrollbar>
          <div className="space-y-2 pr-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-bg-steel p-3">
                <p className="text-sm text-text-secondary-lum">Item {i + 1}</p>
                <p className="text-xs text-text-muted-lum">
                  The scrollbar is hidden but content is still scrollable
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  ),
};
