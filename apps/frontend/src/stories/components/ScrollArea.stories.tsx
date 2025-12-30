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
      <h3 className="text-text-primary-lum mb-3 text-sm font-medium">Task List</h3>
      <ScrollArea className="border-border-steel bg-bg-elevated-lum h-64 w-full rounded-lg border">
        <div className="p-4">
          <div className="space-y-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="hover:bg-bg-steel flex items-center gap-2 rounded-lg p-2">
                <input type="checkbox" className="h-4 w-4" />
                <div className="flex-1">
                  <p className="text-text-secondary-lum text-sm">Task {i + 1}: Implement feature</p>
                  <p className="text-text-muted-lum text-xs">Due tomorrow at 5 PM</p>
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
      <h3 className="text-text-primary-lum mb-3 text-sm font-medium">Team Members</h3>
      <ScrollArea
        orientation="horizontal"
        className="border-border-steel bg-bg-elevated-lum w-full rounded-lg border"
      >
        <div className="flex gap-3 p-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex min-w-max flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-cyan/20 text-sm font-bold text-brand-cyan">
                {String.fromCharCode(65 + i)}
              </div>
              <p className="text-text-secondary-lum text-xs">User {i + 1}</p>
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
      <h3 className="text-text-primary-lum mb-3 text-sm font-medium">Data Grid</h3>
      <ScrollArea className="border-border-steel bg-bg-elevated-lum h-64 w-full rounded-lg border">
        <div className="inline-block">
          <table className="w-full">
            <thead className="border-border-steel border-b">
              <tr>
                <th className="text-text-primary-lum px-4 py-2 text-left text-xs font-semibold">
                  ID
                </th>
                <th className="text-text-primary-lum px-4 py-2 text-left text-xs font-semibold">
                  Name
                </th>
                <th className="text-text-primary-lum px-4 py-2 text-left text-xs font-semibold">
                  Email
                </th>
                <th className="text-text-primary-lum px-4 py-2 text-left text-xs font-semibold">
                  Status
                </th>
                <th className="text-text-primary-lum px-4 py-2 text-left text-xs font-semibold">
                  Role
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 20 }).map((_, i) => (
                <tr key={i} className="border-border-steel/50 border-b hover:bg-bg-steel/50">
                  <td className="text-text-secondary-lum px-4 py-2 text-xs">
                    #{(i + 1).toString().padStart(4, '0')}
                  </td>
                  <td className="text-text-secondary-lum px-4 py-2 text-xs">User {i + 1}</td>
                  <td className="text-text-secondary-lum px-4 py-2 text-xs">
                    user{i + 1}@example.com
                  </td>
                  <td className="px-4 py-2 text-xs">
                    <span className="bg-success/10 text-success rounded-full px-2 py-1">
                      Active
                    </span>
                  </td>
                  <td className="text-text-secondary-lum px-4 py-2 text-xs">
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
      <h3 className="text-text-primary-lum mb-3 text-sm font-medium">Messages</h3>
      <ScrollArea className="border-border-steel bg-bg-elevated-lum h-80 w-full rounded-lg border p-4">
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-text-primary-lum text-sm font-medium">
                  {i % 2 === 0 ? 'Alice' : 'Bob'}
                </p>
                <p className="text-text-muted-lum text-xs">
                  {new Date(Date.now() - i * 60000).toLocaleTimeString()}
                </p>
              </div>
              <div className={`rounded-lg p-2 ${i % 2 === 0 ? 'bg-brand-cyan/10' : 'bg-bg-steel'}`}>
                <p className="text-text-secondary-lum text-sm">
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
      <h3 className="text-text-primary-lum mb-3 text-sm font-medium">Hidden Scrollbar Content</h3>
      <div className="border-border-steel bg-bg-elevated-lum rounded-lg border p-4">
        <ScrollArea className="h-48 w-full" hideScrollbar>
          <div className="space-y-2 pr-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="bg-bg-steel rounded-lg p-3">
                <p className="text-text-secondary-lum text-sm">Item {i + 1}</p>
                <p className="text-text-muted-lum text-xs">
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
